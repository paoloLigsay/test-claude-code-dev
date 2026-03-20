# Feature: Document Sharing

Simple public/private toggle for sharing documents via URL.

## Data Model

- `is_public` boolean column on `documents` table (default `false`).
- No additional tables or RLS changes — public reads go through a service role API route.

## Flow

1. User selects a document in `FileViewer` and clicks "Share".
2. A modal shows a toggle switch (private/public) and, when public, a shareable URL with a copy button.
3. Toggling calls `toggleDocumentPublic` Server Action (RLS-gated, owner-only).
4. Anyone with the URL can view the document at `/share/[id]` — no authentication required.
5. Toggling back to private immediately revokes access.

## Server Action (`app/dashboard/actions.ts`)

- `toggleDocumentPublic(documentId, isPublic)` — updates `is_public` and `updated_at` on the document, filtered by `id` and `user_id` (RLS enforced). Returns `{ data: { isPublic } }` or `{ error }`.

## API Route (`app/api/share/[id]/route.ts`)

- Mounted at `/api/share/[id]`.
- GET handler using service role client.
- Queries document where `id = params.id AND is_public = true`.
- Downloads file from Supabase Storage and returns it with correct `Content-Type`.
- Text, images, and PDFs served inline; other types trigger download.
- Used by the share page for `<img>` and `<iframe>` `src` attributes.

## Share Page (`app/share/[id]/page.tsx`)

- Server Component, read-only viewer.
- Renders text files in `<pre>`, images in `<img>`, PDFs in `<iframe>`, others as download link.
- Returns 404 if the document doesn't exist or is private.
- Minimal styling — no dashboard chrome.

## Service Role Client (`utils/supabase/service.ts`)

- Uses `@supabase/supabase-js` `createClient` with `SUPABASE_SERVICE_ROLE_KEY`.
- Server-only — never imported by client components.
- Only used by public share routes.

## Components

- `FileViewer` (`components/file-viewer.tsx`) — "Share" button (Globe icon) in the toolbar opens a modal with the public/private toggle and shareable URL.

## Security

- Toggle action uses anon-key client with RLS — only the document owner can change `is_public`.
- Service role client is used only in the two server-side share route files.
- Both route and page gate on `is_public = true` in the DB query.
- Share URL uses the document UUID (not guessable), but access control relies on the `is_public` flag.

## DB Migration

```sql
ALTER TABLE documents ADD COLUMN is_public boolean NOT NULL DEFAULT false;
```
