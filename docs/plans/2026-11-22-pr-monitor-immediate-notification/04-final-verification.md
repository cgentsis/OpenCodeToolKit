# Task 04 — Update docs and run final verification

## Goal and acceptance criteria

Document the notification loop and prove the repository remains green.

Acceptance criteria:

- `skills/pr-lifecycle-monitor/SKILL.md` describes the short-lived waiter,
  harness notification, approval loop, restart, and cursor cleanup.
- `skills/README.md` describes the waiter CLI and its JSON-array argument.
- `ARCHITECTURE.md` reflects the waiter, cursor lifecycle, and verification
  coverage.
- All plan task statuses are complete with valid TDD evidence or a documented
  docs/config-only exemption.
- `verify-completion.js`, skill-set validation, offline evals, TDD validator,
  and `git diff --check` all pass.
- A mocked smoke test confirms the waiter exits on synthetic activity and
  prints one JSON record.

## Files/areas to change

- `skills/pr-lifecycle-monitor/SKILL.md`.
- `skills/README.md`.
- `ARCHITECTURE.md`.
- Plan task status sections.
- `docs/reviews/code.md` after the review gate.

## Architecture impact

Aligns documentation with the architecture changes drafted by this plan. No new
runtime component beyond task 02.

## Dependencies and order

Depends on task 03. Must complete before `review-gate`.

## Verification/tests

- `node skills/verification-before-completion/verify-completion.js`.
- `node skills/skill-authoring/validate-skill-set.js`.
- `node skills/skill-evals/run-evals.js --offline`.
- `node skills/test-driven-development/check-tdd-evidence.js` on every task file.
- `git diff --check`.
- Mocked `wait-for-activity.js` smoke invocation.

## Risks and rollback

- Risk: docs drift from CLI behavior. Mitigation: smoke test the exact command
  shown in docs.
- Risk: stale review report after doc edits. Mitigation: run `review-gate` only
  after this task is complete.
- Rollback: revert documentation and plan status changes.

## Estimate/size

S

## Milestone mapping

Verification and handoff

## Status

complete — 2026-11-22

Verification evidence: `verify-completion.js` → 33 passed, 0 failed, with
`npm test` at 13 suites / 126 tests. `validate-skill-set.js` → 17 skills, 14
eval suites, 0 errors. `run-evals.js --offline` → 14 suites, 0 errors, 0
warnings. TDD validator → 4 files, 4 passed, 0 failed. `git diff --check`
passed. Mocked waiter smoke → emitted one JSON comment activity and `SMOKE
PASS`. The previous long-running monitor process was stopped before this
handoff.

### TDD Evidence

Exempt: docs/config-only
Reason: This task changes documentation and verification records only.
