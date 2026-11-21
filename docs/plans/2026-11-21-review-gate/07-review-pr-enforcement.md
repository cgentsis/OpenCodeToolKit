# Task 07 — Enforce the report in review-and-pr

## Goal and acceptance criteria

Make `review-and-pr` fail closed when a code review report is missing, stale,
unapproved, or built on failed checks.

Acceptance criteria:

- Add `skills/review-gate/check-review-report.js` with exported helpers for
  reading and validating a review report.
- The helper checks `docs/reviews/code.md` by default, parses frontmatter, and
  returns errors when:
  - the file is missing or unreadable,
  - `approved` is not `true`,
  - `scripted_verdict` is not `pass`,
  - `head` does not equal the current `HEAD`.
- `skills/review-and-pr/review-pr.js` calls the helper at the start of `run()`,
  before `commitChanges()` and before the user prompt/push, and throws with a
  clear remediation message on any error.
- `DRY_RUN=yes` still enforces the report check; it must not become a bypass.
- No `gh` call occurs when report validation fails.
- Helpers are exported for unit tests.

## Files/areas to change

- `skills/review-gate/check-review-report.js` (new).
- `skills/review-and-pr/review-pr.js` (modify).
- `skills/review-and-pr/SKILL.md` (modify: document the new requirement).

## Architecture impact

Implements the Verification conventions rule that an approved, HEAD-fresh report
is required before commit/push.

## Dependencies and order

Depends on task 02. Tasks 08 and 09 depend on it.

## Verification/tests

- Confirm the new check runs before `commitChanges` by reading the call order.
- With no report present, `DRY_RUN=yes node run-review-pr.js` stops with the
  report error and prints no `gh` command.
- Confirm helper is exported for Jest.

## Risks and rollback

- Risk: blocking legitimate emergency PRs. Mitigation: error text tells the user
  to run `code-review-gate` and approve the report.
- Risk: report path assumptions. Mitigation: path is fixed in code and docs;
  tests cover a missing file.
- Rollback: remove the helper call and revert `review-pr.js`/`SKILL.md`.

## Estimate/size

M

## Milestone mapping

Enforcement and verification

## Status

pending
