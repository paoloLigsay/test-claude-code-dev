import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from dependencies import verify_api_key
from chunker import chunk_text
from embeddings import embed_text, embed_texts
from gemini_client import generate, generate_stream
from prompts import ASK_DOCUMENTS
from supabase_client import store_chunks, delete_chunks_by_document, search_similar_chunks

router = APIRouter(prefix="/rag", dependencies=[Depends(verify_api_key)])


class EmbedRequest(BaseModel):
    document_id: str
    content: str


class EmbedResponse(BaseModel):
    chunks_stored: int


class AskRequest(BaseModel):
    question: str
    document_ids: list[str]


class Source(BaseModel):
    document_id: str
    chunk_index: int
    content: str
    similarity: float


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]


@router.post("/embed", response_model=EmbedResponse)
def embed_document(request: EmbedRequest) -> EmbedResponse:
    delete_chunks_by_document(request.document_id)

    chunks = chunk_text(request.content)
    if not chunks:
        return EmbedResponse(chunks_stored=0)

    embeddings = embed_texts(chunks)

    chunk_rows = [
        {
            "chunk_index": i,
            "content": chunk,
            "embedding": embedding,
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]

    store_chunks(request.document_id, chunk_rows)
    return EmbedResponse(chunks_stored=len(chunk_rows))


@router.delete("/embed/{document_id}")
def delete_embeddings(document_id: str) -> dict[str, bool]:
    delete_chunks_by_document(document_id)
    return {"success": True}


@router.post("/ask", response_model=AskResponse)
def ask_documents(request: AskRequest) -> AskResponse:
    if not request.document_ids:
        raise HTTPException(status_code=400, detail="No document IDs provided")

    query_embedding = embed_text(request.question)

    results = search_similar_chunks(
        query_embedding=query_embedding,
        document_ids=request.document_ids,
        limit=10,
    )

    if not results:
        return AskResponse(
            answer="No relevant content found in your documents.", sources=[]
        )

    context = "\n\n---\n\n".join(
        f"[Source: document {r['document_id']}, chunk {r['chunk_index']}]\n{r['content']}"
        for r in results
    )

    answer = generate(
        ASK_DOCUMENTS, f"Question: {request.question}\n\nContext:\n{context}"
    )

    sources = [
        Source(
            document_id=r["document_id"],
            chunk_index=r["chunk_index"],
            content=r["content"][:200],
            similarity=r["similarity"],
        )
        for r in results
    ]

    return AskResponse(answer=answer, sources=sources)


@router.post("/ask/stream")
def ask_documents_stream(request: AskRequest):
    if not request.document_ids:
        raise HTTPException(status_code=400, detail="No document IDs provided")

    query_embedding = embed_text(request.question)

    results = search_similar_chunks(
        query_embedding=query_embedding,
        document_ids=request.document_ids,
        limit=10,
    )

    if not results:

        def empty_response():
            yield f"data: {json.dumps({'type': 'text', 'content': 'No relevant content found in your documents.'})}\n\n"
            yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(empty_response(), media_type="text/event-stream")

    context = "\n\n---\n\n".join(
        f"[Source: document {r['document_id']}, chunk {r['chunk_index']}]\n{r['content']}"
        for r in results
    )

    sources = [
        {
            "document_id": r["document_id"],
            "chunk_index": r["chunk_index"],
            "content": r["content"][:200],
            "similarity": r["similarity"],
        }
        for r in results
    ]

    def event_stream():
        for text_chunk in generate_stream(
            ASK_DOCUMENTS, f"Question: {request.question}\n\nContext:\n{context}"
        ):
            yield f"data: {json.dumps({'type': 'text', 'content': text_chunk})}\n\n"

        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
