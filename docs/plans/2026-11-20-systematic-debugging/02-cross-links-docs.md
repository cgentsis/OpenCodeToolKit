# Task 02 — Cross-links and documentation

## Goal and acceptance criteria

Make the new skill discoverable at the right moments without changing existing
triggers.

Acceptance criteria:

- `skills/implementation/SKILL.md` and
  `skills/verification-before-completion/SKILL.md` each gain a body-only pointer
  to `systematic-debugging`.
- Their frontmatter `name` and `description` fields are unchanged.
- `skills/README.md` documents the new skill, its hard-stop checkpoint, and the
  fact that it adds no tooling.
- No other skill bodies are modified.

## Files/areas to change

- `skills/implementation/SKILL.md`
- `skills/verification-before-completion/SKILL.md`
- `skills/README.md`

## Architecture impact

No new architectural change. The pointers reflect the pipeline and debugging
conventions already recorded in `ARCHITECTURE.md`.

## Dependencies and order

Depends on task 01. Second task.

## Verification/tests

- Diff the two skill files and confirm no frontmatter lines changed.
- Confirm each file contains one pointer in its body.
- `node skills/skill-evals/run-evals.js --offline` — exit 0.
- `git diff --check`.

## Risks and rollback

- Risk: a body pointer creates an overlapping trigger. Mitigation: keep it to a
  one-line route, not a duplicated instruction set.
- Rollback: revert the three documentation files.

## Estimate/size

S

## Milestone mapping

M2 — Integration and documentation
