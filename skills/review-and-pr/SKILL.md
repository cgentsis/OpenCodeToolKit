---
name: review-and-pr
description: >-
  Use when changes are ready to be committed, pushed, or turned into a GitHub
  pull request. Also triggers on "commit and push", "ship it", "open a PR", or
  "send this for review". Commits pending changes, pushes the current branch,
  and opens or reuses a PR. Not for creating changes or choosing a branch.
---

# Review and PR

## When to use

- The user asks to commit and push changes.
- The user asks to open, create, update, or reuse a pull request.
- The user asks to run the review-and-pr workflow.

## Steps

1. **Check authorization.** Proceed automatically only if the user explicitly
   asked to commit, push, or open a PR (for example, "ship it"). Otherwise,
   confirm with the user before pushing or creating a PR.
2. **Review what will be committed.** Run `git status --short` from the
   repository root. If the change set is known, pass it as `COMMIT_PATHS` so
   unrelated or untracked files are not staged. The script also prints the
   pending changes before staging.
3. **Run the workflow from the repository root:**

   ```bash
   node run-review-pr.js
   ```

   The script prompts for confirmation unless `AUTO_PR=yes` is set. Use
   `AUTO_PR=yes` **only** when step 1 established explicit authorization; it
   disables the script's own confirmation prompt. In non-interactive sessions
   with no authorization, stop and ask the user instead of setting it.

   ```bash
   AUTO_PR=yes node run-review-pr.js
   ```

4. Report the PR URL printed by the command.

## Options

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `BRANCH` | current branch | Branch to push and open a PR for. |
| `BASE_BRANCH` | `main` | Target branch for the PR. |
| `COMMIT_MSG` | generated | Commit message. |
| `COMMIT_PATHS` | all changes | Comma-separated paths to stage. |
| `AUTO_PR=yes` | prompt | Skip the confirmation prompt; requires authorization. |
| `DRY_RUN=yes` | `false` | Log commands without changing anything. |
| `VERBOSE=yes` | `false` | Print each git/gh command. |
| `PR_TITLE` | commit subject | PR title. |
| `PR_BODY` | commit body | PR body. |

## Requirements

- The `origin` remote must exist.
- The GitHub CLI (`gh`) must be installed and authenticated (`gh auth login`).
- The script skips the commit when the working tree is clean.
- It reuses an existing open PR for the same branch.

Preview first when unsure:

```bash
DRY_RUN=yes node run-review-pr.js
```

A dry run does not call `gh` or change anything; it only logs the commands it
would execute.
