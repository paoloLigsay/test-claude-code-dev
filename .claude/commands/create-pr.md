Create a pull request for the current branch.

The base branch is `$0` (default to `main` if not provided).

Do the following steps:

1. Determine the base branch. Use `$0` if provided, otherwise `main`.
2. Run `git log <base>..HEAD --oneline` to see all commits being merged.
3. Run `git diff <base>...HEAD --stat` to see which files changed.
4. Run `git diff <base>...HEAD` to read the actual changes.
5. Read the PR template at `.github/pull_request_template.md`.
6. Draft a PR title and body that follows the template structure:
   - **Title**: short, under 70 characters, imperative mood (e.g. "Add folder search", "Fix auth redirect loop").
   - **Summary**: 1-3 bullets explaining what and why, not how.
   - **Changes**: specific changes grouped by area if touching multiple parts.
   - **Testing**: concrete checklist of what to verify.
   - **Notes**: only if there are trade-offs, follow-ups, or migration steps. Omit the section if empty.
7. Push the current branch to origin if not already pushed.
8. Create the PR using `gh pr create` targeting the base branch. Pass the body via HEREDOC for correct formatting.
9. Return the PR URL.

If additional arguments beyond the base branch are provided, use them as extra context for the PR description.
