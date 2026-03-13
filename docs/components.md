# Components

All components live in `components/`. Client Components use `"use client"`.

## Layout Components

### DashboardShell (`dashboard-shell.tsx`)

Client Component. Main dashboard layout using `react-resizable-panels`.

- Props: `{ initialFolders: Folder[] }` — SSR-fetched root folders.
- Left panel (20%): `Sidebar` with folder tree.
- Right panel (80%): `FileUpload` bar + `FileViewer`.
- Manages state: `selectedDocument`, `selectedFolderId`, `moveTarget`, `searchOpen`, `revealPath`.
- Renders `MoveDialog` when `moveTarget` is set.
- Renders `SearchModal` (Cmd+K to open).
- `revealPath` propagated to tree to auto-expand folders on search selection.

### Sidebar (`sidebar.tsx`)

Client Component. Left panel with folder tree and controls.

- Props: folders, selectedDocumentId, uploadFolderId, callbacks for document selection, folder mutation, move requests.
- Header: "Documents" title + "New folder" button.
- Body: inline folder creation input + `FolderTree`.
- Footer: sign out button (calls `signOut` Server Action).
- Uses dynamic import for `createFolder` action.

## Tree Components

### FolderTree (`folder-tree.tsx`)

Client Component. Renders root-level folder nodes with drag-and-drop support.

- Provides `DragContext` for drag state across the tree.
- Handles drop-to-root (moving folders to top level).
- Custom MIME type `application/x-dms-item` for drag data.

### FolderTreeNode (`folder-tree-node.tsx`)

Client Component. Recursive node for individual folders.

- Expandable with lazy-loaded children via `useFolderContents`.
- Auto-expands when included in `revealPath` (from search).
- Highlights when `selectedFolderId` matches.
- Context menu (right-click): rename, delete, move, create subfolder, new file.
- Drag source and drop target for folders and documents.
- Shows documents within expanded folders.

## File Components

### FileUpload (`file-upload.tsx`)

Client Component. Single-file upload button.

- Props: `{ folderId, onUploadComplete }`.
- Hidden `<input type="file">`, triggered by button click.
- Calls `uploadDocument` Server Action with FormData.
- Shows uploading state and error messages.

### FileViewer (`file-viewer.tsx`)

Client Component. Right panel file preview and editor.

- Props: `{ document: Document | null }`. Exposes `FileViewerHandle` ref with `save()` method.
- Fetches signed URL via React Query (1hr expiry, 30min stale time).
- Renders based on MIME type: `<img>` for images, `<iframe>` for PDFs, editable `<textarea>` for text files.
- Text files are inline-editable. Shows "Save" button when content is dirty. "(unsaved)" indicator in file size area.
- Auto-saves via ref when switching documents (called by DashboardShell).
- Shows download button and file size.
- Empty state when no document selected.

### NewFileButton (`new-file-button.tsx`)

Client Component. Inline file creation button.

- Props: `{ folderId, onCreated }`.
- Shows a name input on click, calls `createEmptyFile` Server Action.
- Created file is auto-selected in the viewer.

### MoveDialog (`move-dialog.tsx`)

Client Component. Modal for moving folders/documents to a new location.

- Props: itemType, itemId, itemName, onClose, onMoved.
- Loads root folders on mount, renders expandable `FolderPickerNode` tree.
- Folder items can select "Root (top level)" as destination.
- Excludes the item being moved from the picker (prevents circular moves).

### SearchModal (`search-modal.tsx`)

Client Component. Cmd+K search overlay.

- Props: `{ open, onClose, onSelectFolder, onSelectDocument }`.
- Debounced search (200ms) via `searchItems` Server Action.
- Results grouped by type (Folders, Files), 10 max each.
- Keyboard navigation: Arrow keys, Enter to select, Escape to close.
- Clicking a result triggers the appropriate callback and closes the modal.

## UI Primitives (`components/ui/`)

- `Button` — variant (`primary`, `ghost`), size (`sm`, `md`), optional icon prop.
- `Input` — styled input with `inputSize` prop.
- `IconButton` — icon-only button wrapper.
- `DropdownMenu` — positioned dropdown with menu items.
- `Modal` — centered overlay with title, children, footer.
