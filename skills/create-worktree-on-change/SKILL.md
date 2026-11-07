---
name: create-worktree-on-change
description: Use before making any file change in this repository, and whenever the user asks to start work in a new worktree. Mandatory pre-change step that creates or reuses an isolated worktree under worktrees/<branch> and prevents edits in the main checkout.
---

# Create worktree on change

## When to use

Use this skill **before any file change**, including code, documentation,
skills, configuration, and generated artifacts.

Also use it when the user asks to:

- start work in a new worktree
- isolate changes on a separate branch
- run the create-worktree-on-change workflow

This is a mandatory pre-change step, not an optional convenience. If you are
about to edit a file in the main checkout, stop and run this skill first.

## Mandatory rule

1. Check whether you are already inside a linked worktree:

   ```bash
   test "$(git rev-parse --git-dir)" != "$(git rev-parse --git-common-dir)" \
     && echo "in worktree" \
     || echo "main checkout"
   ```

   - **in worktree** — continue working in the current worktree.
   - **main checkout** — create or reuse a worktree before the first edit.

2. Never edit, create, delete, or move files in the main checkout.
3. If the worktree cannot be created, stop and ask the user. Do not fall back to
   editing the main checkout.
4. After creating the worktree, use `worktrees/<name>` as the working directory
   for all subsequent commands.

The only exception is read-only inspection. The rule applies as soon as you are
about to change something.

## Steps

1. Choose a short task name.
2. From the repository root, create or reuse the worktree and print its path:

   ```bash
   node skills/create-worktree-on-change/ensure-worktree.js <name>
   ```

   The command prints JSON with the branch and worktree path.

3. Use that path as the working directory for every subsequent command.
4. To create the worktree and immediately run the review-and-PR workflow, use:

   ```bash
   node run-workflow.js <name>
   ```

## Options

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `WORKTREE_NAME` | `change` | Worktree/branch name. |
| `TASK_NAME` | requested name | Overrides the worktree name. |
| `BASE_REF` | `HEAD` | Base ref for new branches. |

## Behavior

- Existing worktrees for the requested branch are reused instead of recreated.
- New branches are created from `BASE_REF` without resetting existing branches.
- Worktrees are created under `worktrees/<branch>`, which is ignored by git.
- Branch names are sanitized to lowercase letters, digits, and hyphens.
- If the current directory is already a linked worktree, it is reused.
