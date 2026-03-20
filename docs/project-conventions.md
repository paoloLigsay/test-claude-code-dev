# Project Conventions

Project-specific conventions for this Next.js + Supabase app.

## Tech Stack

- Next.js (App Router) with TypeScript strict mode
- Tailwind CSS
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Icons: `lucide-react`

## Next.js Conventions

- Default to React Server Components. `"use client"` only for interactivity/browser APIs.
- Server Actions for form submissions and mutations.
- Server Components for initial data fetching.
- Strictly type all DB responses, props, and state. No `any`.

## File Structure

- `utils/supabase/server.ts` — server-side Supabase client (anon key + user session, RLS enforced)
- `utils/supabase/client.ts` — browser-side Supabase client
- `utils/supabase/middleware.ts` — session refresh, route protection
- `utils/supabase/service.ts` — service role client (server-only, used by public share routes)
- `app/auth/actions.ts` — auth server actions
- `app/dashboard/actions.ts` — file/folder server actions
- `app/dashboard/ai-actions.ts` — AI-related server actions (polish, summarize, embed, ask)
- `app/api/` — all Route Handlers (API endpoints)
- `components/chat-panel.tsx` — cross-document RAG chat UI
- `types/index.ts` — shared TypeScript types (Folder, Document, ChatMessage, ChatSource)
- `services/ai/` — Python FastAPI microservice for AI processing (see `docs/features/ai-service.md`)
- `mcp-servers/supabase/` — read-only MCP server for Supabase data (see `docs/mcp-server.md`)

## Environment Variables

### Next.js (`.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` — server only, never expose to client
- `AI_SERVICE_URL` — Python FastAPI service URL (e.g. `http://localhost:8000`)
- `INTERNAL_API_KEY` — shared secret for service-to-service auth with AI service

### Python AI Service (`services/ai/.env`)

- `GEMINI_API_KEY` — Google Gemini API access
- `INTERNAL_API_KEY` — must match the Next.js value
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key for `document_chunks` table access

### MCP Server (`mcp-servers/supabase/`)

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key for read-only DB access

## Supabase Patterns

- Always use `@supabase/ssr` for App Router. Never use deprecated `@supabase/auth-helpers-nextjs`.
- Generate DB types: `npx supabase gen types typescript --project-id <id> > database.types.ts`
- Validate env vars before initializing clients.
- Use `createServerClient` in server contexts, `createBrowserClient` in client contexts.
- All user-uploaded files tied to authenticated user UUID in DB and storage policies.
- RLS is enforced at the DB layer — all client/server code assumes this.
