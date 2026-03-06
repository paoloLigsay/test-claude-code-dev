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

- `utils/supabase/server.ts` — server-side Supabase client
- `utils/supabase/client.ts` — browser-side Supabase client
- `utils/supabase/middleware.ts` — session refresh, route protection
- `app/auth/actions.ts` — auth server actions

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never expose to client)

## Supabase Patterns

- Always use `@supabase/ssr` for App Router. Never use deprecated `@supabase/auth-helpers-nextjs`.
- Generate DB types: `npx supabase gen types typescript --project-id <id> > database.types.ts`
- Validate env vars before initializing clients.
- Use `createServerClient` in server contexts, `createBrowserClient` in client contexts.
- All user-uploaded files tied to authenticated user UUID in DB and storage policies.
- RLS is enforced at the DB layer — all client/server code assumes this.
