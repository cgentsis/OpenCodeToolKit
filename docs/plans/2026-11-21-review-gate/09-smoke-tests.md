# Task 09 — Run sample review and enforcement smoke tests

## Goal and acceptance criteria

Exercise the real scripts end to end and inspect their output, without calling
`gh` or leaving artifacts behind.

Acceptance criteria:

- Run `node skills/review-gate/run.js --type code --out <temp-report>` and
  confirm:
  - the report exists,
  - frontmatter contains `type: code`, a `head`, `scripted_verdict`,
    `advisory_notes`, and `approved: false`,
  - the body contains a check table and an advisory council placeholder.
- Run one sample for `design` and one for `specs` with temporary output paths
  and confirm the `type` field changes.
- Temporarily place an approved, HEAD-fresh `docs/reviews/code.md` in the
  worktree, run `DRY_RUN=yes node run-review-pr.js`, and confirm the workflow
  passes the report check and logs dry-run commands without calling `gh`.
- Remove the temporary report afterward; confirm `git status` is clean of
  review artifacts.
- With the report removed, confirm `DRY_RUN=yes node run-review-pr.js` stops with
  the missing-report error before any commit/push command is logged.

## Files/areas to change

- No permanent source files. Temporary files only under the worktree, all
  removed before completion.

## Architecture impact

Validates the read-only runner, report schema, and enforcement rule described in
`ARCHITECTURE.md`. No new architecture change.

## Dependencies and order

Depends on tasks 02, 07, and 08. Task 10 consumes the evidence.

## Verification/tests

- Capture command output and report frontmatter excerpts as evidence in task 10.
- Confirm no `gh` process is invoked in either dry run.
- Confirm no review artifacts remain in `git status`.

## Risks and rollback

- Risk: temporary report accidentally committed. Mitigation: use a distinct
  filename, remove it before staging, and verify `git status`.
- Risk: dry run mutates git state. Mitigation: `DRY_RUN=yes` is already
  side-effect free; confirm no staged or committed changes afterward.
- Rollback: delete temporary files; no source rollback needed.

## Estimate/size

M

## Milestone mapping

Enforcement and verification

## Status

pending
