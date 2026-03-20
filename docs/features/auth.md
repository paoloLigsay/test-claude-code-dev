# Feature: Authentication

Cookie-based auth using Supabase Auth with email/password.

## Flow

- Unauthenticated users hitting `/dashboard/*` are redirected by middleware (`middleware.ts` matching `/dashboard/:path*`).
- `signIn` and `signUp` are Server Actions in `app/auth/actions.ts`.
- `signIn` redirects to `/dashboard` on success, returns `{ error }` on failure.
- `signUp` redirects to `/login?message=Check your email...` on success.
- `signOut` clears session and redirects to `/login`.
- OAuth callback handled at `app/api/auth/callback/route.ts` — exchanges code for session, redirects to `/dashboard`.

## Pages

- `/login` — renders `LoginForm` client component.
- `/signup` — renders `SignUpForm` client component.

## Components

- `LoginForm` (`components/login-form.tsx`) — email/password form, calls `signIn` Server Action, shows loading/error states.
- `SignUpForm` (`components/signup-form.tsx`) — email/password form, calls `signUp` Server Action, shows loading/error states.

## Session Management

- `utils/supabase/middleware.ts` refreshes session on every protected route request.
- `middleware.ts` applies this only to `/dashboard/:path*`.
