# Task 02 — Add eval files for the PR monitor skill

## Goal and acceptance criteria

Create eval files that prove the new skill is discoverable and that its
description triggers on the intended PR-monitoring requests.

Acceptance criteria:

- `skills/pr-lifecycle-monitor/evals/evals.json` contains task prompts for:
  starting the monitor after a PR handoff, reacting to a new review comment in
  default mode, enabling full autonomy, detecting a merged PR and cleaning up,
  and stopping on close or session end.
- `skills/pr-lifecycle-monitor/evals/trigger-evals.json` contains at least 12
  trigger queries covering comments, merge cleanup, autonomy, and lifecycle.
- Trigger queries avoid unrelated PR tasks such as opening a PR or performing a
  code review gate.
- Files conform to the schema used by the existing eval files and pass offline
  validation with 0 errors and 0 warnings.

## Files/areas to change

- `skills/pr-lifecycle-monitor/evals/evals.json` (new).
- `skills/pr-lifecycle-monitor/evals/trigger-evals.json` (new).

## Architecture impact

Uses the existing Eval runner conventions recorded in `ARCHITECTURE.md`; no new
architecture section is required.

## Dependencies and order

Depends on task 01 so eval prompts match the skill contract.

## Verification/tests

- Run `node skills/skill-evals/run-evals.js --offline` and confirm the new suite
  is discovered with 0 errors and 0 warnings.
- Run `node skills/skill-authoring/validate-skill-set.js` and confirm 0 errors
  after task 03 registers the skill.

## Risks and rollback

- Risk: trigger queries too broad and colliding with `review-and-pr` or
  `review-gate`. Mitigation: focus queries on monitoring, comments, and merge
  cleanup language.
- Rollback: delete the two eval files.

## Estimate/size

S

## Milestone mapping

Foundation

## Status

complete — 2026-11-22

Verification evidence: `node skills/skill-evals/run-evals.js --offline`
discovered 14 suites including `pr-lifecycle-monitor` and reported
`Summary: 14 suites, 0 errors, 0 warnings`. The eval file contains 5 task
prompts and the trigger file contains 12 queries (7 positive, 5 negative)
covering start, propose, autonomy, cleanup, and stop behavior.

### TDD Evidence

Exempt: docs/config-only
Reason: Eval JSON files are documentation/config and contain no executable behavior.
