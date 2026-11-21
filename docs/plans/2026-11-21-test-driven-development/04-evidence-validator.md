# Task 04 — Implement the evidence validator

## Goal and acceptance criteria

Create `skills/test-driven-development/check-tdd-evidence.js`, a minimal
dependency-free validator for TDD evidence in plan task files.

Acceptance criteria:

- Uses only Node built-ins.
- Exports pure helpers for parsing a task file and validating its TDD evidence
  so Jest tests can inject filesystems or content.
- Accepts one or more task file paths from the caller; it does not run git or
  discover files itself.
- Recognizes a `### TDD Evidence` section with Red, Green, and Refactor entries.
  Red and Green each require a command and an observed result.
- Recognizes the valid exemption form: `Exempt: docs/config-only` plus a
  one-line reason.
- Exits 0 only when every supplied file has valid evidence or a valid exemption;
  otherwise exits non-zero with clear, per-file findings.
- Fails closed on unreadable files, missing sections, and malformed entries.

## Files/areas to change

- `skills/test-driven-development/check-tdd-evidence.js` (new).

## Architecture impact

Implements the TDD conventions section of `ARCHITECTURE.md`. No other
architecture change.

## Dependencies and order

Depends on task 01 (the evidence contract) and task 02 (eval expectations).
Blocks tasks 05, 06, and 07.

## Verification/tests

- `node --check skills/test-driven-development/check-tdd-evidence.js`.
- Run the CLI against a temporary valid task file and an invalid one; cite both
  outputs.
- Unit tests are added in task 05.

## Risks and rollback

- Risk: regex parsing is brittle. Mitigation: canonical field names, pure
  helpers, and the smoke tests above.
- Risk: the validator becomes a second source of truth. Mitigation: callers
  supply file paths only; format rules stay in the skill and validator.
- Rollback: delete the new script.

## Estimate/size

M

## Milestone mapping

Evidence validator

## Status

complete — 2026-11-21

Verification evidence: `node --check
skills/test-driven-development/check-tdd-evidence.js` passed with no output.
Smoke test against three temporary files produced:
`PASS ...\valid.md`, `PASS ...\exempt.md`,
`FAIL ...\invalid.md: missing Green entry`, and
`Summary: 3 files, 2 passed, 1 failed`. The non-zero exit was expected for the
invalid case. The script has no `require` beyond Node's built-in `fs`, does not
run git, and exports pure helpers for the unit tests in task 05.

### TDD Evidence

Red: `npm test -- test-driven-development-evidence.test.js` → FAIL: 10 failed, 2 passed, 12 total with validator stub
Green: `npm test -- test-driven-development-evidence.test.js` → PASS: 12 passed, 12 total with validator restored
Refactor: no further changes; green check stayed green
