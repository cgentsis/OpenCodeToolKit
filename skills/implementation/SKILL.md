---
name: implementation
description: >-
  Use when an approved implementation plan exists and the user wants code
  written, including when implementation-planning hands off. Executes tasks in
  dependency order, verifies each against its acceptance criteria, records
  progress in the plan, and hands off to review-and-pr. Requires a plan index.
  Not for choosing an approach, creating a plan, or opening a PR.
---

# Implementation

## When to use

- `implementation-planning` handed off an approved plan.
- The user asks to implement or carry out an existing plan.
- The user asks to implement a specific task from a plan.

Do not use this skill to design a solution, write a plan, or commit/push/open a
PR. Use `idea-discovery`, `solution-brainstorming`, `implementation-planning`,
or `review-and-pr` for those steps.

## Input

1. Accept the path to a plan index (`docs/plans/YYYY-MM-DD-<slug>/index.md`) and,
   optionally, the task files to execute.
2. **A plan index and its task files are required.** If they are missing,
   unreadable, or missing mandatory task fields, stop. Do not invent a plan.
   Offer to load `implementation-planning` to create one.
3. Confirm the plan was reviewed and approved. If there is no evidence of
   approval, ask the user before starting.
4. Read the plan index, every task file, and the root `ARCHITECTURE.md`.

## Rules

- **Worktree first.** Before changing any file, use the
  `create-worktree-on-change` skill. Never edit in the main checkout.
- **One task at a time**, in dependency order. Do not reorder dependencies or
  silently skip a task; ask the user if blocked.
- **The plan is the contract.** Follow each task's acceptance criteria and stay
  within its "files/areas to change". Do not invent scope.
- **Verify before done.** Run the verification/tests listed in the task file
  before marking it complete. Fix failures that are within the task's scope.
- If acceptance criteria are unverifiable or contradictory, stop and report.
  Do not guess at what "done" means.
- Record progress truthfully in the task file, including verification evidence.
  Never mark a blocked task complete.
- Do not commit, push, or open a PR from this skill. After all tasks are done,
  hand off to `review-and-pr`.

## Steps

1. **Load and validate the plan.** Confirm the index, task files, architecture
   document, and mandatory fields are present.
2. **Build the execution order** from the task dependencies. Present it to the
   user and confirm the start before changing files.
3. **For each task, in order:**
   1. Read the task file and its architecture impact.
   2. Announce the task and its acceptance criteria.
   3. Implement the change, including tests where the task requires them.
   4. Run the listed verification/tests and fix in-scope failures.
   5. Add a `## Status` section to the task file with `complete`, the date, and
      the verification evidence (commands run and their result).
   6. Report the result, then move to the next task.
4. **Final verification.** Re-run the project's available checks (for example,
   `npm test`) and confirm the architecture document still matches what was
   built. Fix any regressions in scope.
5. **Report.** List completed tasks, changed files, verification results, and
   any remaining open questions.
6. **Hand off.** Ask whether to proceed with `review-and-pr`. If yes, load it
   with the skill tool (`name: "review-and-pr"`). If the skill tool is
   unavailable, tell the user to run it. Do not commit, push, or open a PR
   yourself.

## Blockers

If a task cannot be completed, stop. Explain the blocker, add a `## Status`
section to the task file with `blocked`, the date, and the reason, and report
the remaining tasks. Do not continue past a blocker without the user's decision.

## Exit criteria

- Every task is either complete with verification evidence or explicitly
  blocked with the reason recorded in its task file.
- The plan index and task files are consistent with the work done.
- Final verification was run and its results were reported.
- The user decided whether to hand off to `review-and-pr`.

## Principles

The plan is the contract; one task at a time; verify before done; truthful
status; scoped changes; explicit handoff.

## Verification

Before claiming a task complete or handing off, follow
`verification-before-completion`: run the baseline and task-specific checks,
read their output, and cite the observed results.
