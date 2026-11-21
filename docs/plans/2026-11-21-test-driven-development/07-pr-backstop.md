# Task 07 — Add the PR-time backstop

## Goal and acceptance criteria

Reuse the evidence validator at PR time to catch missing TDD evidence in plan
task files changed by the branch.

Acceptance criteria:

- `skills/review-and-pr/review-pr.js` identifies changed
  `docs/plans/**/*.md` task files relative to the PR base branch.
- It passes those paths to the validator from task 04 rather than reimplementing
  the evidence format.
- A missing base ref or failed git lookup fails closed with a clear message.
- When no changed task files are found, the backstop passes without error.
- `DRY_RUN=yes` remains side-effect free and does not call `gh`.
- Jest tests cover changed files, no changed files, and a failed lookup.

## Files/areas to change

- `skills/review-and-pr/review-pr.js`.
- `test/review-pr.test.js` (extend existing file).

## Architecture impact

Implements the PR-backstop bullet in the TDD conventions section. No new
architecture section.

## Dependencies and order

Depends on tasks 04 and 05. Can proceed in parallel with task 06 after task 05.

## Verification/tests

- `npm test`, including the new backstop cases.
- `DRY_RUN=yes` invocation of the PR script that shows the backstop step without
  pushing or calling `gh`.
- `git diff --check`.

## Risks and rollback

- Risk: false failures from historical task files. Mitigation: scan only files
  changed relative to the PR base.
- Risk: git lookup failure silently passes. Mitigation: explicit fail-closed
  branch with a clear error.
- Rollback: revert the review-pr edit and test additions.

## Estimate/size

M

## Milestone mapping

Integration and verification

## Status

complete — 2026-11-21

Verification evidence: `npm test -- review-pr.test.js` passed with
`Test Suites: 1 passed, 1 total` and `Tests: 14 passed, 14 total`. Read-back
confirmed the changed-file lookup, reused validator, fail-closed error path, and
backstop failure block. New tests cover changed files, no changed files, a failed
lookup, and blocked commit/PR creation. `git diff --check` passed with no output.

### TDD Evidence

Red: `npm test -- review-pr.test.js` → FAIL: 4 failed, 10 passed, 14 total with pre-change review-pr.js restored
Green: `npm test -- review-pr.test.js` → PASS: 14 passed, 14 total with backstop implementation restored
Refactor: no further changes; green check stayed green
