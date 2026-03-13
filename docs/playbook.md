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

## Phase 4: AI Integration

Gemini API for AI-powered document features.

1. Client utility: `utils/gemini/client.ts` — initializes `GoogleGenerativeAI`, exports `getModel()`.
2. Prompt constants: `utils/gemini/prompts.ts` — all AI prompts as named exports.
3. AI Server Actions in `app/dashboard/ai-actions.ts` — separated from file/folder actions by domain.

## Security & RLS

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client environment.
- Never expose `GEMINI_API_KEY` to client environment (no `NEXT_PUBLIC_` prefix).
- All user-uploaded files tied to authenticated user UUID in DB and storage policies.
- Write all client/server code assuming RLS is enforced at DB layer.
- The server Supabase client uses the anon key with user session cookies — all operations go through RLS. No service role bypass.

## Supabase Patterns

- Always use `@supabase/ssr` for App Router. Never use deprecated `@supabase/auth-helpers-nextjs`.
- Generate DB types: `npx supabase gen types typescript --project-id <id> > database.types.ts`
- Validate env vars before initializing clients.
- Use `createServerClient` in server contexts, `createBrowserClient` in client contexts.
- Storage overwrites: use `.upload()` with `{ upsert: true }` (not `.update()`). The `documents` bucket has INSERT RLS policies but not UPDATE policies.
- Storage path convention: `userId/uuid.ext` — ties files to authenticated user for RLS.

## Server Action Patterns

- Separate action files by domain: `actions.ts` (file/folder), `ai-actions.ts` (AI features).
- Every exported action authenticates first via `supabase.auth.getUser()`.
- Return shape: `{ error: string }` on failure, `{ data }` or `{ success: true }` on success.
- Client components import Server Actions via dynamic `import()` to reduce bundle size.
