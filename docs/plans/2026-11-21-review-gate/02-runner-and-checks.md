# Task 02 — Implement the review runner and check configs

## Goal and acceptance criteria

Create a read-only CLI that runs the configured baseline checks and writes a
Markdown review report with YAML frontmatter.

Acceptance criteria:

- `skills/review-gate/run.js` accepts `--type code|design|specs`, `--out <path>`,
  and `--help`; default report path is `docs/reviews/<type>.md`.
- Check configs `skills/review-gate/checks/code.json`, `design.json`, and
  `specs.json` each select the shared baseline runner
  `verification-before-completion`.
- The runner reuses `runVerification` from
  `skills/verification-before-completion/verify-completion.js` rather than
  duplicating baseline commands.
- The report frontmatter contains `type`, `head`, `scripted_verdict`,
  `advisory_notes`, and `approved: false` for every drafted report.
- The body contains a check results table and an advisory council section
  placeholder; the council cannot change `scripted_verdict`.
- Helpers are exported for unit tests: type parsing, config loading, report
  building, and frontmatter parsing/serialization.
- The CLI never edits source files and never calls `gh`.
- On failing checks the CLI writes a report with `scripted_verdict: fail` and
  exits non-zero.

## Files/areas to change

- `skills/review-gate/run.js` (new).
- `skills/review-gate/checks/code.json` (new).
- `skills/review-gate/checks/design.json` (new).
- `skills/review-gate/checks/specs.json` (new).

## Architecture impact

Implements the read-only review runner and report schema added to the
Script-backed skill convention section of `ARCHITECTURE.md`.

## Dependencies and order

Depends on task 01. Tasks 07, 08, and 09 depend on it.

## Verification/tests

- `node skills/review-gate/run.js --help` prints usage and exits 0.
- Run with `--out` pointed at a temporary path and inspect frontmatter.
- Confirm the report contains a check table and advisory placeholder.
- Confirm an invalid type exits non-zero without writing a report.

## Risks and rollback

- Risk: Windows `npm` shim breaks command spawning. Mitigation: reuse the
  platform-aware baseline helper.
- Risk: report parser drifts from frontmatter format. Mitigation: use the same
  serializer/parser pair in runner, enforcement helper, and tests.
- Rollback: delete the new files.

## Estimate/size

L

## Milestone mapping

Core runner

## Status

pending
