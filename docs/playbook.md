# Implementation Playbook: Next.js + Supabase

## Phase 1: Supabase Client Architecture (SSR Setup)
Establish foundational Supabase clients for App Router using `@supabase/ssr`.
1. `utils/supabase/server.ts` — Server Components and Server Actions.
2. `utils/supabase/client.ts` — Client Components.
3. `utils/supabase/middleware.ts` — session refresh and route protection.

## Phase 2: Authentication
Cookie-based auth flow.
1. Middleware route protection: protect `/dashboard`, redirect unauthenticated to `/login`.
2. Server Actions in `app/auth/actions.ts`: sign up, sign in, sign out.
3. Client components: `LoginForm`, `SignUpForm` with loading/error states.
4. Server-side session reading for personalized nav.

## Phase 3: Storage
Supabase Storage for file upload/retrieval.
1. Ensure target bucket exists with RLS policies in Supabase Dashboard.
2. `FileUpload` client component for images/documents.
3. Upload with unique paths: `userId/uuid-filename.ext`.
4. Utility functions for signed URLs (private) or public URLs, plus deletion.

## Security & RLS
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client environment.
- All user-uploaded files tied to authenticated user UUID in DB and storage policies.
- Write all client/server code assuming RLS is enforced at DB layer.

## Supabase Patterns
- Always use `@supabase/ssr` for App Router. Never use deprecated `@supabase/auth-helpers-nextjs`.
- Generate DB types: `npx supabase gen types typescript --project-id <id> > database.types.ts`
- Validate env vars before initializing clients.
- Use `createServerClient` in server contexts, `createBrowserClient` in client contexts.
