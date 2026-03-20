# Document Manager

A document management app built with Next.js (App Router), Supabase, and TypeScript.

## Getting Started

```bash
npm install
npm run dev
```

## Commands

| Command            | Description      |
| ------------------ | ---------------- |
| `npm run dev`      | Start dev server |
| `npm run build`    | Production build |
| `npm run lint`     | ESLint           |
| `npx tsc --noEmit` | Type check       |

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server only, never expose to client
```

## Project Structure

```
app/
  auth/actions.ts          — auth server actions (sign up, sign in, sign out)
  auth/callback/           — OAuth callback route
  dashboard/               — main dashboard page
  dashboard/actions.ts     — folder/document CRUD server actions
  login/                   — login page
  signup/                  — signup page
components/
  dashboard-shell.tsx      — top-level layout with resizable panels
  sidebar.tsx              — folder tree + create folder + sign out
  folder-tree.tsx          — drag context provider + root drop zone
  folder-tree-node.tsx     — recursive folder node with drag-and-drop
  file-viewer.tsx          — document preview (images, PDFs, text)
  file-upload.tsx          — file upload to Supabase Storage
  move-dialog.tsx          — modal for moving folders/documents
  query-provider.tsx       — TanStack Query provider
hooks/
  use-folder-contents.ts   — shared hook for fetching folder contents
utils/supabase/
  server.ts                — server-side Supabase client
  client.ts                — browser-side Supabase client
  middleware.ts            — session refresh, route protection
```

## Ai development / Documentation

- [Implementation Playbook](docs/playbook.md) — phased build plan (Supabase clients, auth, storage)
- [Project Conventions](docs/project-conventions.md) — tech stack, Next.js/Supabase patterns, file structure (CLAUDE.local.md)
- [Coding Standards](docs/coding-standards.md) — error handling, code quality, anti-patterns (CLAUDE.md)
