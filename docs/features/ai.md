# Feature: AI Integration

Gemini API integration for AI-powered features. Uses Google's free-tier `gemini-2.5-flash` model.

## Setup

- SDK: `@google/generative-ai`
- API key: `GEMINI_API_KEY` in `.env` (server-only, no `NEXT_PUBLIC_` prefix)
- Client utility: `utils/gemini/client.ts` — exports `getModel()` which returns a Gemini model instance.

## Prompts

All AI prompts are stored as named string constants in `utils/gemini/prompts.ts`. Server Actions import the relevant prompt constant — never inline prompt text in action files.

- `POLISH_DOCUMENT` — system instruction for the polish feature.

When adding new AI features, add the prompt constant to `prompts.ts` first, then import it in the Server Action.

## Storage Pattern

Storage overwrites use `.upload()` with `{ upsert: true }` (not `.update()`). The Storage bucket has INSERT RLS policies but not UPDATE policies, so `.update()` will fail with an RLS error.

## Polish Document

Reads a text file's content, sends it to Gemini for polishing (grammar, spelling, clarity, formatting), then overwrites the file in Supabase Storage with the polished version.

### Flow

1. User views a text file in `FileViewer` and clicks "Polish".
2. `polishDocument` Server Action downloads the file from Supabase Storage, sends content to Gemini (using the `POLISH_DOCUMENT` prompt from `utils/gemini/prompts.ts`), uploads the polished version back (overwrite via `.upload()` with `upsert: true`), and updates the document's `updated_at` timestamp.
3. On success, the UI updates the displayed text content immediately via `queryClient.setQueryData` (cache update from server response).
4. The polished content persists across refreshes since Storage and DB are both updated.

### Constraints

- Only works on `text/*` MIME types. The Polish button is hidden for images, PDFs, and other binary files.
- Polish is disabled when the file has unsaved local edits (`isDirty`). User must save or discard first.

## Server Actions (`app/dashboard/ai-actions.ts`)

- `polishDocument(documentId, storagePath, mimeType)` — downloads file content, sends to Gemini for polishing, uploads polished version back to Storage, updates DB timestamp. Returns `{ data: string }` with polished text or `{ error: string }`.

## Components

- `FileViewer` (`components/file-viewer.tsx`) — renders the "Polish" button next to the Download button for text files. Uses `useTransition` for loading state. Disabled when content is dirty.
