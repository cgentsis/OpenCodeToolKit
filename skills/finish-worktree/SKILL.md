---
name: finish-worktree
description: >-
  Use when a pull request has been merged and the local linked worktree and
  branch need to be cleaned up, or when the user asks to move back to the main
  checkout after a merge. Verifies the merge, refuses unsafe states, moves the
  session to the main checkout, updates main, and removes the local worktree
  and fully merged branch. Never deletes a remote branch. Not for creating
  worktrees, committing, pushing, opening PRs, or merging PRs.
---

# Finish worktree

## When to use

- A PR for the current branch has been merged and the worktree should be
  cleaned up.
- The user asks to finish, clean up, or remove the current worktree after a
  merge.
- The user asks to move back to the main checkout after merging.
- The final stage of the worktree lifecycle, after `review-and-pr`.

## Steps

1. **Determine the target branch.** Run `git branch --show-current` from the
   worktree. If the session is already in the main checkout, report that there
   is nothing to finish and stop.
2. **Move the session first.** Use the OpenCode session tool to move the
   session's working directory to the main checkout before running the script.
   The main checkout is the parent of the git common directory; confirm it with
   `git rev-parse --git-common-dir`. This ordering is deliberate: if preflight
   fails, the session is already somewhere safe and the worktree is intact.
3. **Preflight from the main checkout, previewing first when unsure:**

   ```bash
   DRY_RUN=yes node finish-worktree.js <branch>
   ```

   The script verifies that the PR is merged, the worktree is clean, the main
   checkout is on the base branch, and the target branch is fully merged. It
   fails closed on any lookup error and never deletes a remote branch.
4. **Run the cleanup** from the repository root:

   ```bash
   node finish-worktree.js <branch>
   ```

   Pass the branch explicitly — it was captured in step 1, before the session
   moved. `FINISH_BRANCH=<branch>` may be used instead of the positional
   argument.
5. **Report the result.** Include the main checkout path printed by the script
   and confirm the worktree and branch were removed. If the script refused,
   report the reason and leave the worktree untouched.

## Options

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `FINISH_BRANCH` | positional arg | Branch whose worktree should be finished. |
| `BASE_BRANCH` | `main` | Expected branch in the main checkout and PR base. |
| `DRY_RUN=yes` | `false` | Log commands without changing anything. |
| `VERBOSE=yes` | `false` | Print each git command before running it. |

## Safety rules

- **Remote branches are never deleted.** The script never runs `git push`,
  `gh pr`, or any remote-deleting command.
- Preflight must pass before any mutation. The script refuses a missing or
  unmerged PR, a dirty worktree, a detached HEAD, a mismatched main checkout,
  and an unregistered branch.
- The local branch is deleted with `git branch -d`, never `-D`.
- Do not run the script from inside the worktree being removed; the session move
  in step 2 prevents this.

## Requirements

- The GitHub CLI (`gh`) must be installed and authenticated (`gh auth login`).
- The main checkout must be on the base branch (`main` by default).
- `git` must be available on `PATH`.
- A manual fallback checklist is in `runbooks/finish-worktree.md`.

## Verification

Before reporting cleanup as complete, follow
`verification-before-completion`: confirm the worktree and local branch are
gone and the remote branch is still present, then cite the observed output.
