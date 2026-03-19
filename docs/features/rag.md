# Feature: Cross-Document RAG Chat

Ask questions about your documents using Retrieval-Augmented Generation. The system searches across all your documents to find relevant content, then uses Gemini to generate an answer with source attribution.

## Architecture

```
ChatPanel (UI) -> askDocuments (Server Action) -> POST /rag/ask (Python)
                                                      |
                                                      v
                                                 embed question
                                                      |
                                                      v
                                              match_document_chunks (pgvector)
                                                      |
                                                      v
                                              top chunks + question -> Gemini
                                                      |
                                                      v
                                                answer + sources
```

Documents are automatically embedded when uploaded or saved:

```
uploadDocument / saveFileContent -> embedDocument (fire-and-forget)
                                        |
                                        v
                                   POST /rag/embed (Python)
                                        |
                                        v
                                  chunk text -> embed chunks -> store in document_chunks
```

Deletion is handled by `ON DELETE CASCADE` on the `document_chunks.document_id` foreign key.

## Database

### `document_chunks` table

| Column        | Type        | Purpose                               |
| ------------- | ----------- | ------------------------------------- |
| `id`          | uuid        | Primary key                           |
| `document_id` | uuid        | FK to documents (CASCADE delete)      |
| `chunk_index` | integer     | Position of chunk within the document |
| `content`     | text        | The chunk text                        |
| `embedding`   | vector(768) | Gemini text-embedding-004 vector      |
| `created_at`  | timestamptz | Row creation time                     |

HNSW index on the `embedding` column for fast cosine similarity search. RLS enabled with no policies (service role access only).

### `match_document_chunks` function

SQL function called via `supabase.rpc()`. Takes a query embedding, list of document IDs, and match count. Returns rows sorted by cosine similarity.

Migration file: `supabase/migrations/002_document_chunks.sql`

## Embedding Pipeline

1. Text files are chunked into ~1000 character segments with 200 character overlap at sentence boundaries (`services/ai/chunker.py`).
2. Each chunk is embedded using Gemini's `text-embedding-004` model, producing a 768-dimensional vector (`services/ai/embeddings.py`).
3. Chunks + embeddings are stored in the `document_chunks` table via the Python service's Supabase client (`services/ai/supabase_client.py`).
4. Re-embedding (on save) deletes existing chunks first, then re-creates them.

## Ask Flow

1. User types a question in the Chat Panel.
2. `askDocuments` Server Action fetches all the user's document IDs and sends them with the question to `POST /rag/ask`.
3. Python embeds the question, runs `match_document_chunks` RPC to find the top 10 most similar chunks across all documents.
4. The matching chunks are formatted as context and sent to Gemini along with the question.
5. The answer and source references (document name + snippet) are returned to the UI.

## Server Actions (`app/dashboard/ai-actions.ts`)

- `embedDocument(documentId, storagePath, mimeType)` -- downloads file, sends to `POST /rag/embed`. Only for `text/*` files. Called fire-and-forget from `uploadDocument` and `saveFileContent`.
- `askDocuments(question)` -- gets user's document IDs, calls `POST /rag/ask`, resolves document names for source attribution. Returns `{ data: { answer, sources } }` or `{ error }`.

## Components

- `ChatPanel` (`components/chat-panel.tsx`) -- collapsible right panel in the dashboard. Shows message history (ephemeral, in-memory), input field, loading indicator, and source attribution with collapsible snippets.
- `DashboardShell` (`components/dashboard-shell.tsx`) -- "Ask AI" toggle button in the toolbar opens/closes the chat panel as a third resizable panel.

## Constraints

- Only `text/*` files are embedded. Images, PDFs, and binary files are skipped.
- Chat history is ephemeral (React state). Cleared on page refresh.
- Embedding is fire-and-forget. If it fails, the document is still uploaded/saved but won't appear in RAG search results.
- The Python service uses a Supabase service role key to access `document_chunks` (bypasses RLS). Security is enforced by the `x-api-key` shared secret on every request from Next.js.
