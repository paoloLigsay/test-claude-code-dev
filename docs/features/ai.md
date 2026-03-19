# Feature: AI Integration

AI-powered document features served by a Python FastAPI microservice. The Next.js app calls the Python service for all AI operations.

## Architecture

```
Next.js Server Actions → Python FastAPI → Gemini API
```

- Next.js handles auth, file download/upload, and DB updates.
- Python handles AI processing (text in, text out).
- Service-to-service auth via shared `INTERNAL_API_KEY` header.

See `docs/features/ai-service.md` for Python service details.

## Polish Document

Reads a text file's content, sends it to the AI service for polishing (grammar, spelling, clarity, formatting), then overwrites the file in Supabase Storage with the polished version.

### Flow

1. User views a text file in `FileViewer` and clicks "Polish".
2. `polishDocument` Server Action downloads the file from Supabase Storage, sends content to `POST /text/polish` on the AI service, uploads the polished version back (overwrite via `.upload()` with `upsert: true`), and updates the document's `updated_at` timestamp.
3. On success, the UI updates the displayed text content immediately via `queryClient.setQueryData` (cache update from server response).
4. The polished content persists across refreshes since Storage and DB are both updated.

### Constraints

- Only works on `text/*` MIME types. The Polish button is hidden for images, PDFs, and other binary files.
- Polish is disabled when the file has unsaved local edits (`isDirty`). User must save or discard first.

## Summarize Document

Reads a text file's content, sends it to the AI service for summarization, and displays the summary in a modal. Read-only — does not modify the original file.

### Flow

1. User views a text file in `FileViewer` and clicks "Summarize".
2. `summarizeDocument` Server Action downloads the file from Supabase Storage, sends content to `POST /text/summarize` on the AI service, and returns the summary.
3. On success, the summary is displayed in a `Modal` overlay within `FileViewer`.
4. The summary is transient — dismissed by closing the modal, and cleared when switching documents.

### Constraints

- Only works on `text/*` MIME types. The Summarize button is hidden for images, PDFs, and other binary files.
- Summarize is disabled when the file has unsaved local edits (`isDirty`). User must save or discard first.

## Server Actions (`app/dashboard/ai-actions.ts`)

- `polishDocument(documentId, storagePath, mimeType)` — downloads file content, calls AI service for polishing, uploads polished version back to Storage, updates DB timestamp. Returns `{ data: string }` with polished text or `{ error: string }`.
- `summarizeDocument(storagePath, mimeType)` — downloads file content, calls AI service for summarization. Returns `{ data: string }` with summary or `{ error: string }`. Does not modify Storage or DB.

## Components

- `FileViewer` (`components/file-viewer.tsx`) — renders "Summarize" and "Polish" buttons next to the Download button for text files. Both use `useTransition` for loading state and are disabled when content is dirty. Summary is displayed in a `Modal`.
