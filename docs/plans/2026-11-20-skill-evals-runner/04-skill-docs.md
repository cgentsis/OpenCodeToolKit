# Task 04 — Skill wrapper and documentation

## Goal and acceptance criteria

Make the eval runner discoverable and document its behavior.

Acceptance criteria:

- `skills/skill-evals/SKILL.md` has trigger-focused frontmatter with negative
  boundaries (not for writing eval files, not a CI gate, not a model judge).
- Its body documents offline default, `--live` advisory mode, `EVAL_TIMEOUT`,
  and the positional skill filter.
- `skills/skill-evals/evals/evals.json` and `trigger-evals.json` are created and
  parse successfully.
- `skills/README.md` gains a section for `skill-evals` with commands and options.
- No stale "no eval runner" language remains in `ARCHITECTURE.md` (already
  updated during planning) or `skills/README.md`.

## Files/areas to change

- `skills/skill-evals/SKILL.md` (new)
- `skills/skill-evals/evals/evals.json` (new)
- `skills/skill-evals/evals/trigger-evals.json` (new)
- `skills/README.md`

## Architecture impact

Adds the skill surface for the eval runner. No script behavior changes.
Consistent with the modular layout already recorded in `ARCHITECTURE.md`.

## Dependencies and order

Depends on tasks 02 and 03 (CLI contract and flags). Independent of nothing
else in M2.

## Verification/tests

- Parse both new JSON files.
- Read `SKILL.md` and confirm required sections and negative boundaries.
- Grep for stale "no eval runner" phrasing.
- `git diff --check`.

## Risks and rollback

- Risk: overlapping triggers with other skills. Mitigation: explicit negative
  boundaries and should-not-trigger queries.
- Rollback: delete the new skill files and revert `skills/README.md`.

## Estimate/size

S

## Milestone mapping

M2 — Live adapter and skill wrapper

## Status

complete — 2026-11-20

Verification evidence:

- `SKILL.md` created with trigger-focused frontmatter, negative boundaries,
  offline/live commands, `EVAL_TIMEOUT`, filter flag, and safety rules.
- `evals/evals.json` parses with 2 evals; `evals/trigger-evals.json` parses with
  14 queries (7 trigger, 7 no-trigger).
- `skills/README.md` gained a `skill-evals` section with commands, flags, and
  environment variable.
- Grep found no stale "no eval runner" language in `ARCHITECTURE.md` or
  `skills/README.md`; only intentional historical mentions in plan docs.
- Offline runner now discovers 6 suites with 0 errors and 2 warnings; `npm test`
  remains at 41 tests passing.
