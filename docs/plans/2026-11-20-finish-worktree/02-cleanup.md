# Task 02 — Cleanup execution and CLI wiring

## Goal and acceptance criteria

Complete `finish-worktree.js` so that, after a successful preflight, it performs
local cleanup and reports the result.

Acceptance criteria:

- Fast-forwards `main` from the main checkout with `git pull --ff-only`.
- Removes the registered local worktree and deletes the fully merged local
  branch with a safe (`-d`) delete.
- Never calls `git push`, `gh pr`, or any remote-deleting command.
- Honors `DRY_RUN=yes` by printing commands without executing them.
- Prints the main checkout path so the skill can verify the session move.
- `npm test` passes with mocked `child_process` tests covering success, dry run,
  and every refusal path.

## Files/areas to change

- `finish-worktree.js`
- `test/finish-worktree.test.js` (new)

## Architecture impact

Completes the cleanup phase of the new script entrypoint. No changes to existing
scripts. No `ARCHITECTURE.md` section changes.

## Dependencies and order

Depends on task 01. Must precede tasks 03 and 04, which depend on the final CLI
contract.

## Verification/tests

- `npm test` — all suites pass.
- Integration check in a temporary git repo: merged-branch fixture cleans up;
  dirty fixture is refused.
- `git diff --check`.

## Risks and rollback

- Risk: deleting the wrong branch. Mitigation: preflight branch/worktree
  matching and `git branch -d` instead of `-D`.
- Rollback: revert the commit; the deleted branch can be restored from the
  remote or reflog, and the worktree recreated with `create-worktree-on-change`.

## Estimate/size

M

## Milestone mapping

M1 — Script core

## Status

complete — 2026-11-20

Verification evidence:

- `npm test` — 3 suites, 26 tests passed.
- `node --check finish-worktree.js` — exit 0 (run after final edit).
- Integration test in `C:\Users\cgentsis\AppData\Local\Temp\opencode\fwt-integration`:
  a temporary origin, main checkout, and linked `feature` worktree were created;
  the branch was merged locally and pushed; `gh` was mocked via
  `NODE_OPTIONS=--require=.../mock-gh.js` returning `MERGED`. Running
  `node finish-worktree.js feature` from the main checkout removed the worktree
  and deleted the branch; `git worktree list` and `git branch --list feature`
  confirmed both were gone.
- All three cleanup commands run with `-C <mainCheckout>` so they do not execute
  from inside the worktree being removed.
- Tests assert no `git push`, no `gh` commands other than `pr view`, and no
  `git branch -D`.
