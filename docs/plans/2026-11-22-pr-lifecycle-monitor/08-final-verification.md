# Task 08 — Final verification and smoke test

## Goal and acceptance criteria

Prove the complete PR monitor implementation meets the repository bar and the
idea's success criteria before review and PR handoff.

Acceptance criteria:

- `npm test` passes with all Jest suites, including the new PR monitor suite.
- `node --check` passes on all tracked `.js` files.
- `git diff --check` is clean.
- `node skills/skill-authoring/validate-skill-set.js` reports 0 errors and 0
  warnings with the new skill and eval suite registered.
- `node skills/skill-evals/run-evals.js --offline` reports 0 errors and 0
  warnings and discovers the new suite.
- The TDD evidence validator passes for every code-changing task file in this
  plan that changed executable behavior.
- A manual smoke test with mocked `gh` and `git` verifies: start after handoff,
  autonomy prompt, one detected comment, one approval or autonomous action,
  one merged PR, exactly one cleanup call, and clean stop on session end.
- No conflict markers, temporary files, or persisted monitor state remain.
- `ARCHITECTURE.md`, `AGENTS.md`, and `skills/README.md` agree on the new skill.
- A fresh `review-gate` report is generated and approved before `review-and-pr`.

## Files/areas to change

- Task status sections in this plan's task files.
- `docs/reviews/code.md` via `review-gate` (generated, not hand-edited except
  approval and advisory notes).

## Architecture impact

No new architecture change. This task verifies the changes recorded during
planning.

## Dependencies and order

Depends on tasks 02, 03, and 07. Final task in the plan.

## Verification/tests

- Run all checks listed in the acceptance criteria and quote observed output in
  the task status.
- Read back each changed plan task file and confirm status and TDD evidence.
- Confirm no source file was modified by the review gate.

## Risks and rollback

- Risk: a check passes locally but the PR base has moved. Mitigation: rebase or
  merge `main`, then re-run all checks and refresh the review report.
- Risk: smoke test uses real GitHub. Mitigation: inject mocks and set no real
  remote mutation paths.
- Rollback: stop the watcher, revert commits, and keep no persistent state.

## Estimate/size

M

## Milestone mapping

Verification and handoff

## Status

complete — 2026-11-22

Verification evidence:

- `node skills/verification-before-completion/verify-completion.js` → `Summary:
  29 passed, 0 failed`, including `npm test` PASS (12 suites, 115 tests),
  `node --check` on all tracked `.js` files PASS, and `git diff --check` PASS.
- `node --check` on `skills/pr-lifecycle-monitor/monitor.js`,
  `reactions.js`, and `cleanup.js` → PASS (untracked files are not covered by
  the helper's tracked-file scan).
- `node skills/skill-authoring/validate-skill-set.js` → 17 skills, 14 eval
  suites, 0 errors.
- `node skills/skill-evals/run-evals.js --offline` → 14 suites, 0 errors,
  0 warnings, including `pr-lifecycle-monitor`.
- TDD evidence validator on all eight task files → 8 passed, 0 failed.
- Mocked end-to-end smoke test → `SMOKE PASS`: one autonomous reply, one
  `finish-worktree pr-monitor-idea` call, one cleanup-complete line, one stopped
  watcher, and no duplicate reaction after an event/poll overlap.
- No conflict markers or persisted monitor state were found; all plan, skill,
  registry, and architecture docs agree on the new skill.

A fresh `review-gate` report is still required before `review-and-pr`; this task
verifies implementation only.

### TDD Evidence

Exempt: docs/config-only
Reason: Final verification records observed evidence only; no production behavior changed in this task.
