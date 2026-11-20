# Task 01 — Skill definition and eval files

## Goal and acceptance criteria

Create the standalone guidance-only skill artifact.

Acceptance criteria:

- `skills/systematic-debugging/SKILL.md` has trigger-focused frontmatter with
  negative boundaries (not a test framework, not CI, not a model judge, not a
  replacement for `implementation`'s plan verification, not a code-approval
  gate).
- Its body fires for all bugs, test failures, and unexpected behavior, including
  intermittent issues.
- It defines a hard-stop sequence: reproduce → isolate → root cause → failing
  repeatable command → fix → verify → `verification-before-completion` handoff.
- It states that any explicit, repeatable failing command qualifies; it need not
  be a Jest test.
- It requires inline evidence and forbids proposing a fix before the root cause
  and failing command are established.
- It stops and reports attempts and evidence when reproduction fails after
  reasonable, agent-judged effort; no fixed cap.
- It keeps the evidence record concise for trivial issues without skipping root
  cause or regression coverage.
- `evals/evals.json` and `evals/trigger-evals.json` parse and follow the
  repository shape, including a negative case for "fix first, test later".
- No helper script or other tooling is added.

## Files/areas to change

- `skills/systematic-debugging/SKILL.md` (new)
- `skills/systematic-debugging/evals/evals.json` (new)
- `skills/systematic-debugging/evals/trigger-evals.json` (new)

## Architecture impact

Adds a new skill directory matching the layout already recorded in
`ARCHITECTURE.md`. The debugging conventions section was added by planning; no
further architecture changes in this task.

## Dependencies and order

First task; no blockers.

## Verification/tests

- Parse both eval JSON files.
- Read `SKILL.md` and confirm every acceptance criterion is represented.
- Run `node skills/skill-evals/run-evals.js systematic-debugging` and confirm
  exit 0.
- `git diff --check`.

## Risks and rollback

- Risk: overlapping triggers with `implementation` or
  `verification-before-completion`. Mitigation: negative boundaries and
  should-not-trigger queries.
- Risk: the checkpoint reads as optional. Mitigation: hard-stop wording and a
  negative eval case.
- Rollback: delete the new skill directory; no other files depend on it yet.

## Estimate/size

M

## Milestone mapping

M1 — Skill artifact

## Status

complete — 2026-11-20

Verification evidence:

- `SKILL.md` created with trigger-focused frontmatter, negative boundaries, the
  hard-stop six-step sequence, unreproducible-failure rule, inline evidence, and
  boundaries. No helper script added.
- `evals/evals.json` parses with 4 evals, including the "fix first, test later"
  negative case; `evals/trigger-evals.json` parses with 13 queries (7 trigger,
  6 no-trigger).
- `node skills/skill-evals/run-evals.js systematic-debugging` — exit 0,
  0 errors, 0 warnings.
- `git diff --check` — exit 0.
