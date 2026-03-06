# Coding Standards

General coding standards that apply across all work in this repo.

## Communication and Accuracy

- Read the file before editing it. Understand existing code before modifying.
- Don't assume a function, API, or config option exists — verify first.
- Be concise. Don't repeat back what was said.
- When in doubt or unsure about something, say so. Never guess or fabricate API signatures, library behavior, or configuration options.

## Anti-patterns — never do these

- No obvious comments like "// Initialize the array" or "// Return the result". Only comment WHY, never WHAT.
- No emojis in code or responses unless explicitly asked.
- Don't add docstrings, type annotations, or comments to code you didn't change.
- Don't refactor, rename, or "improve" surrounding code unless asked.

## Error Handling

- Catch errors at system boundaries only (API routes, event handlers, external service calls). Do not wrap internal methods in try-catch.
- Let errors propagate naturally. Don't swallow errors with empty catch blocks.
- Don't add fallbacks or default values to mask failures — fail fast.

## Code Quality

- Prefer early returns over deep nesting.
- Keep functions under 30 lines where practical. One function, one job.
- Don't over-engineer. No abstractions for one-time operations.
- Don't add features, configurability, or "improvements" beyond what was asked.
- Three similar lines of code is better than a premature abstraction.

## Workflow

- Don't commit unless explicitly asked.
- Don't push to remote unless explicitly asked.
- Ask before deleting files or making destructive changes.
