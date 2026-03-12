---
paths:
  - "app/**/actions.ts"
---

- Start every file with `"use server"`.
- Create Supabase client via `createClient()` from `@/utils/supabase/server`.
- Authenticate before any DB operation: `const { data: { user } } = await supabase.auth.getUser()` — return `{ error: "Not authenticated" }` if no user.
- Return `{ error: string }` on failure, `{ data }` or `{ success: true }` on success.
- Never use `redirect()` inside try/catch — Next.js redirects throw internally.
- Never use the service role client in actions — rely on RLS with the user's session.
