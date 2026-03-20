# Feature: File & Folder Management

Document management system with nested folders and file upload/preview.

## Data Model

- `Folder` — has `id`, `name`, `parent_id` (nullable for root), `user_id`, timestamps. Derived from `database.types.ts`.
- `Document` — has `id`, `name`, `folder_id`, `user_id`, `storage_path`, `mime_type`, `size_bytes`, timestamps.
- Types defined in `types/index.ts`, sourced from auto-generated `types/database.types.ts`.

## Server Actions (`app/dashboard/actions.ts`)

- `createFolder(name, parentId)` — creates folder, requires auth.
- `renameFolder(folderId, name)` — updates folder name.
- `deleteFolder(folderId)` — recursively collects all document storage paths in subtree, removes from Supabase Storage, then deletes folder (DB cascade handles children).
- `moveFolder(folderId, newParentId)` — validates target isn't a descendant to prevent circular nesting.
- `uploadDocument(formData)` — uploads file to Supabase Storage at `userId/uuid.ext`, creates DB record.
- `deleteDocument(documentId, storagePath)` — removes from Storage and DB.
- `moveDocument(documentId, newFolderId)` — updates folder reference.
- `createEmptyFile(name, folderId)` — creates an empty text file in Storage and DB.
- `saveFileContent(documentId, storagePath, content)` — overwrites file content in Storage, updates `size_bytes` and `updated_at`.

## Internal Helpers

- `checkIsDescendant(folderId, targetId)` — walks up parent chain to prevent circular folder moves.
- `collectSubtreeStoragePaths(folderId)` — recursively gathers all document storage paths under a folder for bulk cleanup.

## State Management

- React Query for server state. Key query keys: `["root-folders"]`, `["folder-contents", folderId]`, `["signed-url", storagePath]`.
- `useFolderContents(folderId, enabled)` hook — fetches subfolders and documents for a folder in parallel.
- `useInvalidateFolderContents()` hook — returns a function to invalidate folder and root queries.
- `QueryProvider` (`components/query-provider.tsx`) wraps the app with `QueryClientProvider`.

## Dashboard Page

- `app/dashboard/page.tsx` — Server Component, fetches root folders, passes to `DashboardShell`.
- `app/dashboard/layout.tsx` — wraps children in `QueryProvider`.
