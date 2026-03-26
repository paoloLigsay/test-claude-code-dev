You are in a Ralph Loop — an autonomous iteration cycle. Your job: implement the task below, verify it, and keep going until everything passes.

## Task

$ARGUMENTS

## Workflow

1. **Initialize** — If `ralph-progress.md` does not exist, create it with `# Ralph Loop` as the first line. If it exists, read it for context from prior iterations.

2. **Implement** — Work on the task incrementally. Focus on one thing at a time. Write clean, minimal code that solves the problem.

3. **Verify** — Run ALL checks in order. Stop at the first failure and fix it before moving on.

   ```
   npm run build
   npx tsc --noEmit
   npm run lint
   npm run test
   cd services/ai && pytest
   ```

4. **Log progress** — Append to `ralph-progress.md` with this format:

   ```
   ## Iteration [N] — [timestamp]
   **Attempted:** what you worked on
   **Result:** what passed, what failed and why
   **Next:** what the next iteration should focus on
   ```

5. **Evaluate completion:**
   - If ALL 5 checks pass and the task is fully implemented: delete `ralph-progress.md` and output `RALPH_DONE` as the last thing you say.
   - If any check fails: end your response naturally. The loop will restart you.

## Rules

- Do NOT output `RALPH_DONE` unless every single check passes and the task is complete.
- Do NOT skip checks. Run all 5 every iteration.
- Do NOT undo or revert work from prior iterations unless it is genuinely broken.
- Keep changes small and focused per iteration. Do not try to do everything at once.
- If you are stuck on the same failure for 3+ iterations (check `ralph-progress.md`), try a fundamentally different approach.
- Do NOT run git commands (commit, push, etc.) unless the task explicitly asks for it. The user manages git.
