# Task 04 — Runbook and documentation

## Goal and acceptance criteria

Add the manual fallback runbook and make the skill discoverable in repository
documentation.

Acceptance criteria:

- `runbooks/finish-worktree.md` states purpose, when to use it, prerequisites,
  ordered steps, verification, and rollback.
- `skills/README.md` gains a `finish-worktree` section with its command and
  options table, and the pipeline diagram includes the cleanup stage.
- `AGENTS.md` pipeline section gains one bullet for `finish-worktree`; existing
  bullets and PR #4 changes are preserved.
- No stale references to `run-workflow.js` remain.

## Files/areas to change

- `runbooks/finish-worktree.md` (new)
- `skills/README.md`
- `AGENTS.md`

## Architecture impact

Documentation only. No script or skill behavior changes. `ARCHITECTURE.md`
already records the convention this documentation describes.

## Dependencies and order

Depends on tasks 01 and 02. Independent of task 03. If PR #4 has not merged,
make only the minimal `AGENTS.md` addition and defer larger edits.

## Verification/tests

- `git diff --check`
- Grep for `run-workflow` returns no matches.
- Read the runbook and README section to confirm required content.

## Risks and rollback

- Risk: `AGENTS.md` conflict with PR #4. Mitigation: add one bullet only; defer
  if the surrounding section differs.
- Rollback: revert the documentation files.

## Estimate/size

S

## Milestone mapping

M2 — Skill and documentation

## Status

complete — 2026-11-20

Verification evidence:

- `runbooks/finish-worktree.md` created with Purpose, When to use it,
  Prerequisites, Steps, Verification, and Rollback.
- `skills/README.md` pipeline diagram extended with `finish-worktree` and a new
  section documents the command, options table, requirements, and runbook link.
- `AGENTS.md` pipeline bullet extended with `finish-worktree` and a dedicated
  discovery bullet added. PR #4's existing pipeline changes were preserved by
  fast-forwarding this worktree to `origin/main` (`63f331a`) before editing.
- `git diff --check` — exit 0.
- Grep for `run-workflow` found matches only inside this plan's own docs
  (where the string is used to describe the check), not in the codebase;
  PR #4 renamed the file to `create-and-review.js`.
