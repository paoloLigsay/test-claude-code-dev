Systematic debugging with root cause investigation. No fixes without root cause.

## Bug

$ARGUMENTS

## Iron Law

Do NOT fix anything until you have confirmed the root cause. No guessing. No shotgunning. Reproduce first, understand second, fix last.

## Workflow

### Phase 1: Investigate

1. **Collect symptoms** — What is the user seeing? What is the expected behavior? Read any error messages, logs, or stack traces provided.
2. **Read the relevant code** — Trace the code path from entry point to failure. Read full files, not snippets.
3. **Check recent changes** — Run `git log --oneline -20` and `git diff HEAD~5` to see if a recent change caused the regression.
4. **Reproduce** — Try to reproduce the bug. Run the app, run a test, or trace the logic mentally. If you cannot reproduce, say so and explain what you tried.

### Phase 2: Hypothesize

1. **Form a hypothesis** — Based on what you found, state a clear hypothesis: "The bug is caused by X because Y."
2. **Test the hypothesis** — Add temporary logging, inspect state, run a targeted test, or trace the logic to confirm or reject your hypothesis.
3. **3-strike rule** — If three hypotheses fail, STOP. Ask the user for more context instead of continuing to guess. Say what you've tried and what you've ruled out.

Pattern checklist — consider these common causes:

- Null/undefined propagation
- Race condition or timing issue
- Stale cache or state
- Missing await on async operation
- Wrong Supabase query (missing filter, wrong table)
- RLS policy blocking the operation
- Environment variable missing or wrong
- Type mismatch at runtime vs compile time

### Phase 3: Fix

Only enter this phase after root cause is confirmed.

1. **Minimal fix** — Fix the root cause, not the symptom. Smallest possible diff.
2. **Regression test** — Write a test that fails without your fix and passes with it. If the bug is in UI logic that can't be unit tested, describe the manual verification steps instead.
3. **No collateral changes** — Do not refactor, rename, or "improve" surrounding code. Fix the bug only.

### Phase 4: Verify

1. **Run all checks:**

   ```
   npm run build
   npx tsc --noEmit
   npm run lint
   npm run test
   cd services/ai && pytest
   ```

2. **Structured report** — Output this at the end:
   ```
   ## Debug Report
   **Symptom:** [what was broken]
   **Root cause:** [why it was broken]
   **Fix:** [what you changed]
   **Evidence:** [how you confirmed the root cause]
   **Regression test:** [test name or manual steps]
   **Checks:** [pass/fail status]
   ```

## Rules

- Never apply a fix you cannot explain. If you don't know why it works, it's not a fix.
- Never say "this should fix it" — either you confirmed it fixes it, or you haven't.
- If the bug spans more than 5 files, ask the user about blast radius before making changes.
- Do not run git commands that modify state (commit, push, rebase). The user manages git.
- If you are stuck, say so. State what you've tried, what you've ruled out, and what information you need.
