# MCP Server (Supabase)

Read-only MCP server that exposes Supabase data to Claude via the Model Context Protocol. Lives in `mcp-servers/supabase/`.

## Setup

```bash
cd mcp-servers/supabase
npm install
npm run build
```

Build output goes to `build/` (compiled from `src/` via `tsc`).

## Environment Variables

| Variable                    | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `SUPABASE_URL`              | Supabase project URL                                    |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS for full DB read access) |

## Transport

Uses stdio transport (`StdioServerTransport`). Designed to be launched by a Claude client as a subprocess.

## Tools

### `list_folders`

List root folders or children of a specific folder.

- Input: `{ parent_id?: string (uuid) }`
- Output: JSON array of folder rows.
- Omit `parent_id` for root folders, provide it for child folders.

### `list_documents`

List documents in a folder.

- Input: `{ folder_id: string (uuid) }`
- Output: JSON array of document rows.

### `search_items`

Search folders and documents by name (case-insensitive `ILIKE`).

- Input: `{ query: string }`
- Output: `{ folders: [...], documents: [...] }` — up to 10 results each.

### `get_document_content`

Download and return the text content of a document from Supabase Storage.

- Input: `{ storage_path: string }`
- Output: The raw text content of the file.

## Dependencies

- `@modelcontextprotocol/sdk` — MCP server framework
- `@supabase/supabase-js` — Supabase client
- `zod` — input validation

## Safety

This server is **read-only**. It does not insert, update, or delete any data. It uses the service role key to bypass RLS for read access only.
