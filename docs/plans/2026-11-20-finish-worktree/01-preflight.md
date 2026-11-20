# Task 01 — Preflight helpers and dry-run CLI

## Goal and acceptance criteria

Create `finish-worktree.js` with fail-closed preflight helpers and a
`DRY_RUN=yes` mode.

Acceptance criteria:

- Detects whether the current directory is a linked worktree and, if not,
  reports a no-op instead of failing.
- Resolves the current branch, its registered worktree path, and the main
  checkout path from the git common directory.
- Verifies PR merge state with `gh pr view`; any lookup or authentication
  failure stops the workflow.
- Refuses a dirty worktree (`git status --porcelain` non-empty), a detached
  HEAD, and a branch that is not fully merged.
- `DRY_RUN=yes` prints every command that would run and performs no mutations.
- Pure helpers are exported for unit testing.

## Files/areas to change

- `finish-worktree.js` (new).

## Architecture impact

Introduces a new root-level script entrypoint following the script-backed skill
convention. No existing module changes. No `ARCHITECTURE.md` section changes.

## Dependencies and order

Task 01 is first; no blockers.

## Verification/tests

- `node --check finish-worktree.js`
- Unit tests (added in task 02) cover each refusal path and dry-run output.
- Manual: `DRY_RUN=yes node finish-worktree.js` from a linked worktree prints a
  correct plan and changes nothing.

## Risks and rollback

- Risk: incorrect merge detection could permit deleting a live branch.
  Mitigation: fail closed on any `gh` error; require an explicit MERGED state.
- Rollback: delete the new script; no side effects from preflight alone.

## Estimate/size

M

## Milestone mapping

M1 — Script core

## Status

complete — 2026-11-20

Verification evidence:

- `node --check finish-worktree.js` — exit 0.
- `DRY_RUN=yes node finish-worktree.js` from a dirty linked worktree — exited 1
  with the uncommitted-changes refusal, confirming fail-closed preflight.
- Mocked dry-run harness — printed all three planned commands, resolved the
  main checkout correctly, and reported `PASS: no mutation attempted`.
- Exported helpers confirmed from `module.exports`: `run`, `preflight`,
  `isLinkedWorktree`, `getCurrentBranch`, `getWorktreePath`,
  `getMainCheckout`, `getMainBranch`, `findWorktreeForBranch`,
  `getPendingChanges`, `getPrState`, `checkPrMerged`.
- Jest suite `test/finish-worktree.test.js` covers detached HEAD, dirty
  worktree, unmerged PR, failed PR lookup, unknown branch, and base-branch
  refusal (26 tests pass across all suites).

Design adjustment during implementation: preflight accepts an optional explicit
`branchArg` (`--branch` / `FINISH_BRANCH`) in addition to cwd detection. This is
required because the skill moves the session to the main checkout before the
script runs, so cwd-based detection alone cannot identify the worktree. The
documented cwd no-op behavior is preserved when no branch is supplied.
