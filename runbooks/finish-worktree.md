# Finish worktree

## Purpose

Remove the local linked worktree and fully merged branch for a PR that has been
merged, after moving the session back to the main checkout. This is the manual
fallback for the `finish-worktree` skill. It never deletes a remote branch.

## When to use it

- A PR for the current branch has been merged and local cleanup is needed.
- The `finish-worktree` skill is unavailable or its script fails and you need
  to understand the exact steps before retrying.
- Do not use it to create worktrees, commit, push, open or merge PRs, or delete
  remote branches.

## Prerequisites

- `git` and an authenticated GitHub CLI (`gh auth login`).
- The main checkout must be on the base branch (`main` by default).
- The worktree must have no uncommitted changes.
- The PR must report state `MERGED`.

## Steps

1. From the worktree, record the branch:

   ```bash
   git branch --show-current
   ```

2. Move the session or terminal to the main checkout before removing anything.
   Confirm the path with `git rev-parse --git-common-dir` (its parent is the
   main checkout).

3. Verify the PR is merged:

   ```bash
   gh pr view <branch> --json state --jq .state
   ```

   Stop unless the result is `MERGED`. A lookup failure is a stop, not a guess.

4. Verify the worktree is clean:

   ```bash
   git -C <worktree-path> status --porcelain
   ```

   Stop if anything is printed.

5. Preview the script, or run the equivalent commands manually:

   ```bash
   DRY_RUN=yes node finish-worktree.js <branch>
   ```

   Manual equivalent:

   ```bash
   git -C <main-checkout> pull --ff-only
   git -C <main-checkout> worktree remove <worktree-path>
   git -C <main-checkout> branch -d <branch>
   ```

6. Run the real cleanup:

   ```bash
   node finish-worktree.js <branch>
   ```

   Or execute the manual equivalent from step 5, in that order.

## Verification

- `git worktree list` no longer shows the removed worktree.
- `git branch --list <branch>` prints nothing.
- The main checkout is on `main` and has been fast-forwarded.
- The remote branch still exists — no `git push` or `gh pr` delete was run.

## Rollback

- If a preflight check failed, nothing changed: fix the reported cause and
  retry.
- If the worktree was removed but the branch remains, delete it with
  `git branch -d <branch>` once you confirm it is merged.
- If the branch was deleted but the worktree remains, remove the directory and
  run `git worktree prune` from the main checkout, or recreate it with
  `create-worktree-on-change` if you still need the files.
- If the remote branch was deleted by another tool, restore it by pushing the
  local branch before finishing; this runbook never deletes remotes itself.
