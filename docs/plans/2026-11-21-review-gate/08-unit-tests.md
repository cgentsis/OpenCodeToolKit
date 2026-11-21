# Task 08 — Add unit tests for runner, validator, and enforcement

## Goal and acceptance criteria

Cover the new pure helpers with Jest tests using mocks; no real `gh` or network
calls.

Acceptance criteria:

- `test/review-gate-runner.test.js` covers:
  - accepted and rejected `--type` values,
  - default report path construction and `--out` override,
  - report frontmatter serialization/parsing round-trip,
  - `scripted_verdict: pass|fail` from injected check results,
  - advisory notes cannot alter the scripted verdict.
- `test/review-gate-alias-validator.test.js` covers:
  - declared aliases exempt from eval coverage,
  - undeclared `alias_of` fails,
  - stale core alias declarations fail,
  - non-alias skills still require eval files.
- `test/review-gate-enforcement.test.js` covers:
  - missing report,
  - `approved: false`,
  - `scripted_verdict: fail`,
  - HEAD mismatch,
  - all-valid report returns no errors.
- All helpers are exercised through exported functions with injected filesystem
  and git/HEAD values.
- `npm test` passes with the new suites included.

## Files/areas to change

- `test/review-gate-runner.test.js` (new).
- `test/review-gate-alias-validator.test.js` (new).
- `test/review-gate-enforcement.test.js` (new).

## Architecture impact

Follows the Repository layout and Verification conventions for Jest tests and
mocked child processes/filesystem.

## Dependencies and order

Depends on tasks 02, 05, and 07. Tasks 09 and 10 depend on it.

## Verification/tests

- `npm test` reports all suites passing.
- `node --check` on all new test files passes.

## Risks and rollback

- Risk: tests coupled to report formatting. Mitigation: assert on parsed
  frontmatter fields, not exact whitespace.
- Risk: mocks diverge from real CLI behavior. Mitigation: smoke tests in task 09
  exercise the real scripts.
- Rollback: delete the new test files; implementation then has no direct unit
  coverage.

## Estimate/size

L

## Milestone mapping

Enforcement and verification

## Status

complete — `9386a62` (runner, alias-validator, and enforcement Jest suites). Evidence: final `npm test` `Test Suites: 10 passed, 10 total` / `Tests: 79 passed, 79 total`, including the three new suites and the task-10 alias-registry suite.
