# Task 05 — Final verification and demo

## Goal and acceptance criteria

Run the full verification suite and demonstrate the dry-run workflow before
handoff.

Acceptance criteria:

- `npm test` passes all suites.
- `node --check` passes for every JavaScript file.
- `git diff --check` reports no whitespace errors.
- `DRY_RUN=yes node finish-worktree.js` prints the expected plan from a linked
  worktree and changes nothing.
- The plan index, all five task files, `ARCHITECTURE.md`, the idea document,
  the skill, and the runbook all exist and are non-empty.
- Every link in the plan index resolves.
- Any defects found are fixed within the owning task's scope before completion.

## Files/areas to change

- Verification only; in-scope fixes may touch files owned by tasks 01–04.

## Architecture impact

None expected. If a fix changes the script or skill layout, update
`ARCHITECTURE.md` accordingly.

## Dependencies and order

Depends on tasks 01 through 04. Final task.

## Verification/tests

- Commands listed in the acceptance criteria, run fresh at the end.
- Report the exact test count and command output in the task status.

## Risks and rollback

- Risk: a late defect reopens an earlier task. Mitigation: fix within the
  owning task's scope and re-run all checks.
- Rollback: revert the offending commit and re-run verification.

## Estimate/size

S

## Milestone mapping

M3 — Verification

## Status

complete — 2026-11-20

Verification evidence:

- `npm test` — 3 suites, 26 tests passed, 0 failures.
- `node --check` — exit 0 for all 9 JavaScript files (excluding `node_modules`
  and `.git`), including `finish-worktree.js` and its test suite.
- `git diff --check` — exit 0.
- Dry-run demo in
  `C:\Users\cgentsis\AppData\Local\Temp\opencode\fwt-demo`: with a temporary
  origin, main checkout, and linked `feature` worktree, `DRY_RUN=yes node
  finish-worktree.js feature` printed the pull/remove/delete plan and reported
  `Workflow complete; no changes were made.` `git worktree list` confirmed the
  worktree was still present afterward.
- All 14 deliverable files confirmed non-empty; all 7 links in the plan index
  resolve.
- Every task file (01–05) has a `## Status` section with evidence.
