# Feature: Search

Global search for folders and files via Cmd+K (Ctrl+K on Windows/Linux).

## Flow

- User presses Cmd+K anywhere on the dashboard to open the search modal.
- Typing queries both `folders` and `documents` tables using `ilike` matching.
- Results appear grouped by type (Folders, Files), limited to 10 each.
- Keyboard navigation: Arrow keys to move, Enter to select, Escape to close.
- Clicking/selecting a folder: sets it as the active folder and expands the sidebar tree to reveal it.
- Clicking/selecting a file: sets it as the active document (shown in FileViewer) and expands the sidebar tree to its parent folder.

## Server Actions (`app/dashboard/actions.ts`)

- `searchItems(query)` — searches folders and documents by name for the authenticated user. Returns `{ folders, documents }`.
- `getFolderPath(folderId)` — walks up the `parent_id` chain to return the full ancestor path as an array of folder IDs (root first).

## Components

- `SearchModal` (`components/search-modal.tsx`) — Client Component. Overlay modal with search input, debounced query (200ms), grouped results list with keyboard navigation.

## Integration

- `DashboardShell` manages `searchOpen` and `revealPath` state.
- `revealPath` (array of folder IDs) is passed through Sidebar → FolderTree → FolderTreeNode.
- `FolderTreeNode` auto-expands when its ID appears in `revealPath`.
- Selected folder is highlighted with `bg-white/[0.08]` in the tree.
