# Task 03 — Cross-links and documentation

## Goal and acceptance criteria

Make the skill discoverable without changing other skills' triggers.

Acceptance criteria:

- `skills/implementation/SKILL.md`, `skills/review-and-pr/SKILL.md`, and
  `skills/finish-worktree/SKILL.md` each gain a short body-only "Verification"
  note pointing to `verification-before-completion`.
- Their frontmatter `description` fields are unchanged.
- `skills/README.md` gains a section for the new skill with what it enforces,
  how to invoke it, and the optional helper command.
- No other documentation claims the helper is required or a CI gate.
- `skills/skill-evals/SKILL.md` and other eval-related docs are not modified.

## Files/areas to change

- `skills/implementation/SKILL.md`
- `skills/review-and-pr/SKILL.md`
- `skills/finish-worktree/SKILL.md`
- `skills/README.md`

## Architecture impact

No architecture change. `ARCHITECTURE.md` was updated during planning and is
not touched by this task.

## Dependencies and order

Depends on tasks 01 and 02 so links and commands are accurate.

## Verification/tests

- Grep the three skills for the pointer text and confirm frontmatter is
  unchanged with `git diff`.
- Read the README section and confirm helper is described as optional.
- `git diff --check`.

## Risks and rollback

- Risk: duplicated rules drift from the skill. Mitigation: pointers only, no
  restated checklists.
- Rollback: revert the four documentation files.

## Estimate/size

S

## Milestone mapping

M2 — Helper and documentation

## Status

complete — 2026-11-20

Verification evidence:

- Body-only `## Verification` pointers added to `implementation`,
  `review-and-pr`, and `finish-worktree`; `git diff` shows no changes to their
  frontmatter `name` or `description` fields.
- `skills/README.md` gained a `verification-before-completion` section describing
  the evidence bar, optional helper, and no-CI-gate rule.
- `git diff --check` — exit 0.
- `node skills/skill-evals/run-evals.js --offline` — exit 0, 7 suites, 0 errors,
  2 warnings for skills without eval files.
