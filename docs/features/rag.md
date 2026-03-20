# Feature: Cross-Document RAG Chat

Ask questions about your documents using Retrieval-Augmented Generation. The system searches across all your documents to find relevant content, then uses Gemini to generate an answer with source attribution.

## Architecture

```
ChatPanel (UI) -> POST /api/chat (Route Handler) -> POST /rag/ask/stream (Python)
                       |                                   |
                       |                                   v
                       |                              embed question
                       |                                   |
                       |                                   v
                       |                           match_document_chunks (pgvector)
                       |                                   |
                       |                                   v
                       |                           top chunks + question -> Gemini (streamed)
                       |                                   |
                       v                                   v
                  SSE stream  <----  SSE proxy  <----  SSE: text chunks + sources
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

SQL function called via `supabase.rpc()`. Performs cosine similarity search against embedded chunks.

**Parameters:**

| Parameter             | Type        | Description                        |
| --------------------- | ----------- | ---------------------------------- |
| `query_embedding`     | vector(768) | The embedded question vector       |
| `filter_document_ids` | uuid[]      | Restrict search to these documents |
| `match_count`         | integer     | Max results to return (default 10) |

**Returns:** `id`, `document_id`, `chunk_index`, `content`, `similarity` (1 - cosine distance, higher = more similar).

### Migration

File: `supabase/migrations/002_document_chunks.sql`

Run via the Supabase SQL Editor or CLI:

```bash
supabase db push
```

The migration enables the `pgvector` extension, creates the `document_chunks` table, adds HNSW and document_id indexes, enables RLS (no policies = service role only), and creates the `match_document_chunks` function.

## Embedding Pipeline

1. Text files are chunked into ~1000 character segments with 200 character overlap at sentence boundaries (`services/ai/chunker.py`).
2. Each chunk is embedded using Gemini's `text-embedding-004` model, producing a 768-dimensional vector (`services/ai/embeddings.py`).
3. Chunks + embeddings are stored in the `document_chunks` table via the Python service's Supabase client (`services/ai/supabase_client.py`).
4. Re-embedding (on save) deletes existing chunks first, then re-creates them.

## Ask Flow (Streamed)

1. User types a question in the Chat Panel.
2. `ChatPanel` sends a `POST /api/chat` request to the Next.js Route Handler.
3. The Route Handler authenticates the user, fetches their document IDs, and opens an SSE connection to `POST /rag/ask/stream` on the Python service.
4. Python embeds the question, runs `match_document_chunks` RPC to find the top 10 most similar chunks.
5. The matching chunks are formatted as context and streamed to Gemini. Each text chunk from Gemini is forwarded as an SSE event (`{ type: "text", content: "..." }`).
6. After all text chunks are sent, a final `{ type: "sources", sources: [...] }` event is emitted, followed by `[DONE]`.
7. The Route Handler enriches source events with document names and proxies all events to the client.
8. `ChatPanel` progressively renders the answer as chunks arrive, then appends sources.

The non-streaming `POST /rag/ask` endpoint and `askDocuments` Server Action are preserved for backward compatibility.

## Server Actions & Route Handlers

- `embedDocument(documentId, storagePath, mimeType)` (Server Action, `app/dashboard/ai-actions.ts`) -- downloads file, sends to `POST /rag/embed`. Only for `text/*` files. Called fire-and-forget from `uploadDocument` and `saveFileContent`.
- `askDocuments(question)` (Server Action, `app/dashboard/ai-actions.ts`) -- non-streaming ask. Gets user's document IDs, calls `POST /rag/ask`, resolves document names for source attribution. Returns `{ data: { answer, sources } }` or `{ error }`.
- `POST /api/chat` (Route Handler, `app/api/chat/route.ts`) -- streaming ask. Authenticates user, fetches document IDs, proxies SSE from `POST /rag/ask/stream`, enriches sources with document names.

## Components

- `ChatPanel` (`components/chat-panel.tsx`) -- collapsible right panel in the dashboard. Shows message history (ephemeral, in-memory), input field, and source attribution with collapsible snippets. Answer text streams in progressively via SSE.
- `DashboardShell` (`components/dashboard-shell.tsx`) -- "Ask AI" toggle button in the toolbar opens/closes the chat panel as a third resizable panel.

## Constraints

- Only `text/*` files are embedded. Images, PDFs, and binary files are skipped.
- Chat history is ephemeral (React state). Cleared on page refresh.
- Embedding is fire-and-forget. If it fails, the document is still uploaded/saved but won't appear in RAG search results.
- The Python service uses a Supabase service role key to access `document_chunks` (bypasses RLS). Security is enforced by the `x-api-key` shared secret on every request from Next.js.
