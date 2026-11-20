# Task 02 — Reporting module and CLI wiring

## Goal and acceptance criteria

Add human-readable reporting and the thin CLI that runs offline validation.

Acceptance criteria:

- `report.js` prints one line per skill with discovered eval files, plus
  warning and error lines with precise file/field reasons.
- `run-evals.js` discovers and validates skills, prints the report, and exits
  non-zero when errors exist.
- Flags: `--offline` (default), `--help`, and an optional positional path filter
  to validate one skill directory.
- Offline mode makes no network or `opencode` calls.
- Unit tests cover success, validation failures, parse failures, path filter,
  and exit codes.

## Files/areas to change

- `skills/skill-evals/report.js` (new)
- `skills/skill-evals/run-evals.js` (new)
- `test/skill-evals.test.js` (new)

## Architecture impact

Completes the offline path of the eval runner. No changes to existing scripts
or skills. Confirms the eval runner conventions in `ARCHITECTURE.md`.

## Dependencies and order

Depends on task 01. Must precede tasks 03 and 04, which depend on the CLI
contract.

## Verification/tests

- `npm test` passes (task 02 tests plus existing suites).
- `node skills/skill-evals/run-evals.js --offline` exits 0 on current eval files.
- `node skills/skill-evals/run-evals.js --help` prints usage.
- `git diff --check`.

## Risks and rollback

- Risk: false failures block contributors. Mitigation: fail only on the
  validation rules from task 01; warnings never fail.
- Rollback: revert the three new files; task 01 modules remain unused.

## Estimate/size

M

## Milestone mapping

M1 — Offline core

## Status

complete — 2026-11-20

Verification evidence:

- `npm test` — 4 suites, 35 tests passed (9 new skill-evals tests).
- `node skills/skill-evals/run-evals.js --offline` — exit 0, found 5 suites,
  0 errors, 3 warnings for skills without eval files.
- `node skills/skill-evals/run-evals.js --help` — printed usage, exit 0.
- `node skills/skill-evals/run-evals.js idea-discovery` — validated only that
  skill, exit 0.
- New tests cover success, skill_name mismatch, invalid JSON, missing
  should-not-trigger query, path filter, missing/incomplete eval suite warnings,
  and help output.
