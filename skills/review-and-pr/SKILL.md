---
name: review-and-pr
description: Use when changes are ready to be committed, pushed, or turned into a GitHub pull request. Commits pending changes, pushes the current branch, and opens or reuses a PR.
---

# Review and PR

## When to use

Use this skill when the user asks to:

- commit and push changes
- open, create, or update a pull request
- run the review-and-pr workflow

## Steps

1. Confirm with the user before pushing or creating a PR unless they have already authorized it.
2. From the repository root, run:

   ```bash
   AUTO_PR=yes node run-review-pr.js
   ```

   `AUTO_PR=yes` is required in non-interactive sessions. Without it, the script prompts on stdin.

3. Report the PR URL printed by the command.

## Options

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `BRANCH` | current branch | Branch to push and open a PR for. |
| `BASE_BRANCH` | `main` | Target branch for the PR. |
| `COMMIT_MSG` | generated | Commit message. |
| `COMMIT_PATHS` | all changes | Comma-separated paths to stage. |
| `AUTO_PR=yes` | prompt | Skip the confirmation prompt. |
| `DRY_RUN=yes` | `false` | Log commands without changing anything. |
| `VERBOSE=yes` | `false` | Print each git/gh command. |
| `PR_TITLE` | commit subject | PR title. |
| `PR_BODY` | commit body | PR body. |

## Requirements

- The `origin` remote must exist.
- The GitHub CLI (`gh`) must be installed and authenticated (`gh auth login`).
- The skill skips the commit when the working tree is clean.
- It reuses an existing open PR for the same branch.

Preview first when unsure:

```bash
DRY_RUN=yes AUTO_PR=yes node run-review-pr.js
```
