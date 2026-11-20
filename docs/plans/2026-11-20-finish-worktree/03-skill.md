# Task 03 — Skill definition and evals

## Goal and acceptance criteria

Add the `finish-worktree` skill and its eval suites.

Acceptance criteria:

- `skills/finish-worktree/SKILL.md` has trigger-focused frontmatter with
  negative boundaries (not for creating worktrees, committing, or PRs).
- Steps specify: move the session to the main checkout first, then run
  `node finish-worktree.js`; report the script output.
- Options table documents `DRY_RUN` and any branch/base options.
- States explicitly that remote branches are never deleted.
- `evals/evals.json` has at least two realistic prompts with expected outputs.
- `evals/trigger-evals.json` has should-trigger and should-not-trigger queries.
- Both JSON files parse successfully.

## Files/areas to change

- `skills/finish-worktree/SKILL.md` (new)
- `skills/finish-worktree/evals/evals.json` (new)
- `skills/finish-worktree/evals/trigger-evals.json` (new)

## Architecture impact

Adds a new skill directory under `skills/`. No shared protocol changes and no
changes to the council skills.

## Dependencies and order

Depends on tasks 01 and 02 (CLI contract). Independent of task 04.

## Verification/tests

- Read `SKILL.md` and confirm all required sections.
- Parse both JSON files with `ConvertFrom-Json` or `node -e`.
- Check that trigger queries include near-misses for `create-worktree-on-change`
  and `review-and-pr`.

## Risks and rollback

- Risk: overlapping triggers with `create-worktree-on-change` or
  `review-and-pr`. Mitigation: explicit negative boundaries in the description
  and in trigger evals.
- Rollback: delete the new skill directory.

## Estimate/size

S

## Milestone mapping

M2 — Skill and documentation

## Status

complete — 2026-11-20

Verification evidence:

- `skills/finish-worktree/SKILL.md` created with frontmatter, `## When to use`,
  `## Steps`, `## Options`, `## Safety rules`, and `## Requirements`.
- Negative boundaries in the description cover worktree creation, committing,
  pushing, PR creation, and merging.
- Steps capture the branch before moving the session, then pass it explicitly
  to `node finish-worktree.js <branch>` from the main checkout.
- `evals/evals.json` parses: `skill_name=finish-worktree`, 2 prompts.
- `evals/trigger-evals.json` parses: 14 queries, 7 should-trigger / 7
  should-not-trigger, including near-misses for `create-worktree-on-change`,
  `review-and-pr`, and merging.
- The new skill appears in OpenCode's available skills list after creation.
