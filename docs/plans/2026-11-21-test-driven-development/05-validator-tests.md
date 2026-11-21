# Task 05 — Unit-test the validator

## Goal and acceptance criteria

Add Jest coverage for the evidence validator's pure helpers and fail-closed
behavior.

Acceptance criteria:

- New test file under `test/`, for example
  `test/test-driven-development-evidence.test.js`.
- Covers valid Red/Green/Refactor evidence.
- Covers missing TDD Evidence section, missing Red, missing Green, missing
  Refactor, and missing observed result.
- Covers a valid docs/config-only exemption and an exemption with no reason.
- Covers multiple supplied files where one is invalid.
- Covers unreadable or empty input as a failure, not a pass.
- `npm test` passes.

## Files/areas to change

- `test/test-driven-development-evidence.test.js` (new).

## Architecture impact

Consistent with the `test/` convention in `ARCHITECTURE.md`. No new
architecture section.

## Dependencies and order

Depends on task 04. Blocks tasks 06 and 07.

## Verification/tests

- Run `npm test` and cite the passing suite count.
- Run `node --check` on the new test file.

## Risks and rollback

- Risk: tests mirror implementation instead of contract. Mitigation: assert the
  documented evidence format, not internal helper names.
- Rollback: delete the test file.

## Estimate/size

M

## Milestone mapping

Evidence validator

## Status

complete — 2026-11-21

Verification evidence: `node --check test/test-driven-development-evidence.test.js`
passed with no output. Dependencies were installed with `npm ci` because the new
worktree had no `node_modules`; `node_modules` is gitignored. Observed `npm test`
output: `Test Suites: 7 passed, 7 total`, `Tests: 69 passed, 69 total`.
The new suite covers valid evidence, missing section/entries, missing observed
result, wrong Red status, valid and invalid exemptions, mixed forms, multi-file
failure, and unreadable files.

### TDD Evidence

Exempt: docs/config-only
Reason: Test-only change; no production behavior changed in this task.
