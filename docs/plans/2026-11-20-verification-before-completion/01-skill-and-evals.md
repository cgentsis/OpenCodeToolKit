# Task 01 — Skill definition and eval files

## Goal and acceptance criteria

Create the skill artifact that defines the evidence bar and failure rule.

Acceptance criteria:

- `skills/verification-before-completion/SKILL.md` has trigger-focused
  frontmatter with negative boundaries (not a test framework, not CI, not a
  model judge, not a replacement for `implementation`'s verification).
- Its body states that the skill fires before any completion claim or handoff,
  including ad-hoc fixes outside the pipeline.
- It lists the baseline checks (`npm test`, `node --check`, `git diff --check`)
  plus task-specific checks, and requires reading and citing observed output.
- It states that a failed or unavailable check blocks the claim, with no
  qualified "done" language.
- It documents the optional helper and the fact that manual evidence is also
  accepted.
- `evals/evals.json` and `evals/trigger-evals.json` are created, parse, and
  follow the repository shape with both trigger and no-trigger queries.

## Files/areas to change

- `skills/verification-before-completion/SKILL.md` (new)
- `skills/verification-before-completion/evals/evals.json` (new)
- `skills/verification-before-completion/evals/trigger-evals.json` (new)

## Architecture impact

Adds a new skill directory under `skills/`. Matches the layout already recorded
in `ARCHITECTURE.md`; no architecture section changes in this task.

## Dependencies and order

First task; no blockers.

## Verification/tests

- Parse both eval JSON files.
- Read `SKILL.md` and confirm every acceptance criterion is represented.
- Run `node skills/skill-evals/run-evals.js verification-before-completion` and
  confirm exit 0.
- `git diff --check`.

## Risks and rollback

- Risk: overlapping triggers with `implementation` or `review-and-pr`.
  Mitigation: explicit negative boundaries and should-not-trigger queries.
- Rollback: delete the new skill directory; no other files depend on it yet.

## Estimate/size

M

## Milestone mapping

M1 — Skill artifact

## Status

complete — 2026-11-20

Verification evidence:

- `SKILL.md` created with trigger-focused frontmatter, negative boundaries,
  evidence bar (baseline plus task-specific), failure rule, optional-helper
  note, and boundaries section.
- `evals/evals.json` parses with 3 evals; `evals/trigger-evals.json` parses with
  14 queries (8 trigger, 6 no-trigger).
- `node skills/skill-evals/run-evals.js verification-before-completion` — exit 0,
  0 errors, 0 warnings.
- `git diff --check` — exit 0.
