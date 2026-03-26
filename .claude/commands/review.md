Pre-landing code review. Analyze the diff against the base branch for bugs, security issues, and code quality.

$ARGUMENTS

## Workflow

1. **Detect base branch** — Use the first argument if provided, otherwise default to `main`. Run `git fetch origin <base>` to ensure it's up to date.

2. **Check branch** — Verify you are NOT on the base branch. If you are, stop and tell the user to check out a feature branch first.

3. **Get the diff** — Run `git diff <base>...HEAD` to get the full diff. Also run `git log <base>..HEAD --oneline` to see all commits being reviewed.

4. **Read the full diff first** — Read every changed file in full before making any judgments. Do not review line-by-line as you go — understand the whole change first.

5. **Two-pass review:**

   **Pass 1 — Critical** (must fix before landing):
   - SQL/data safety: unprotected deletes, missing RLS, raw queries
   - Auth gaps: missing `getUser()` checks in server actions, exposed service keys
   - Security: XSS, injection, OWASP top 10
   - Race conditions: concurrent mutations without guards
   - Data loss: storage operations without error handling before DB deletes
   - Broken functionality: logic errors, wrong return types, missing awaits

   **Pass 2 — Informational** (nice to fix, not blocking):
   - Missing error boundaries or loading states
   - Test gaps for new code paths
   - Performance: N+1 queries, unnecessary re-renders, missing React keys
   - Dead code or unused imports
   - Inconsistency with existing patterns in the codebase

6. **Classify each finding:**
   - **AUTO-FIX** — Mechanical issues with an obvious correct fix (unused import, missing await, typo). Fix these immediately without asking.
   - **ASK** — Judgment calls, architectural questions, trade-offs. Present these to the user with your recommendation and let them decide.

7. **Apply auto-fixes** — Fix all AUTO-FIX items. For ASK items, present them clearly: what the issue is, why it matters, and your recommendation.

8. **Verify** — Run all checks to make sure your fixes didn't break anything:

   ```
   npm run build
   npx tsc --noEmit
   npm run lint
   npm run test
   cd services/ai && pytest
   ```

9. **Summary** — Output a brief review summary:
   - Number of critical vs informational findings
   - What was auto-fixed
   - What needs user decision (ASK items)
   - Whether all checks pass

## Rules

- Read the ENTIRE diff before writing any findings. Context matters.
- Only flag real problems. Do not invent issues or nitpick style when it matches existing patterns.
- Be terse. One sentence per finding is enough.
- Do not review code that wasn't changed in the diff — only flag pre-existing issues if the diff makes them worse.
- Do not add comments, docstrings, or type annotations to unchanged code.
- Do not run git commands that modify state (commit, push, rebase). Only read operations.
