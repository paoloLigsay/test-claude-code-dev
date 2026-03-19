import os

from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )
    return _client


def store_chunks(document_id: str, chunks: list[dict]) -> None:
    rows = [
        {
            "document_id": document_id,
            "chunk_index": c["chunk_index"],
            "content": c["content"],
            "embedding": c["embedding"],
        }
        for c in chunks
    ]
    get_client().table("document_chunks").insert(rows).execute()


def delete_chunks_by_document(document_id: str) -> None:
    get_client().table("document_chunks").delete().eq(
        "document_id", document_id
    ).execute()


def search_similar_chunks(
    query_embedding: list[float],
    document_ids: list[str],
    limit: int = 10,
) -> list[dict]:
    result = (
        get_client()
        .rpc(
            "match_document_chunks",
            {
                "query_embedding": query_embedding,
                "filter_document_ids": document_ids,
                "match_count": limit,
            },
        )
        .execute()
    )
    return result.data
