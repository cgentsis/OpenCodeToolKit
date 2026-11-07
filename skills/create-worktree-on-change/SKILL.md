---
name: create-worktree-on-change
description: Use when creating or reusing an isolated git worktree before making changes, or when the user asks to start work in a new worktree. Creates worktrees under worktrees/<branch> and can run the full review-and-PR workflow.
---

# Create worktree on change

## When to use

Use this skill when the user asks to:

- start work in a new worktree
- isolate changes on a separate branch
- run the create-worktree-on-change workflow

## Steps

1. Choose a branch/worktree name.
2. From the repository root, run:

   ```bash
   node run-workflow.js <name>
   ```

   This creates or reuses `worktrees/<name>` and then invokes the review-and-pr workflow.

3. To create or reuse only the worktree and then switch to it for subsequent commands, run:

   ```bash
   node -e "const { ensureWorktree } = require('./skills/create-worktree-on-change/create-worktree'); ensureWorktree(process.argv[1])" <name>
   ```

   The worktree path is `worktrees/<sanitized-name>`. Use that path as the working directory for later commands.

## Options

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `WORKTREE_NAME` | `feature-x` | Worktree/branch name. |
| `TASK_NAME` | requested name | Overrides the worktree name. |
| `BASE_REF` | `HEAD` | Base ref for new branches. |

## Behavior

- Existing worktrees for the requested branch are reused instead of recreated.
- New branches are created from `BASE_REF` without resetting existing branches.
- Worktrees are created under `worktrees/<branch>`, which is ignored by git.
- Branch names are sanitized to lowercase letters, digits, and hyphens.
