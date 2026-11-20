---
name: implementation-planning
description: >-
  Use when a validated solution exists and the user wants an execution plan, or
  when solution-brainstorming hands off. Identifies and documents required
  architectural changes in the root ARCHITECTURE.md, writes a plan index and
  per-task specs under docs/plans/, then asks for review and a separate handoff
  decision. Requires a documented solution artifact. Not for validating an idea
  (idea-discovery), choosing an approach (solution-brainstorming), or writing
  code (implementation).
---

# Implementation Planning (Council)

Read `../_shared/council-protocol.md` before starting. It defines the question
loop, question-tool usage, backlog handling, hard gate, worktree-first rule, and
verification standard. This file defines only the roles, scope, input rules, and
stages for implementation planning.

## When to use

- `solution-brainstorming` produced a documented solution and the user wants an
  execution plan.
- The user asks for an implementation plan, task breakdown, milestones, or
  sequencing for a known solution.
- The user wants the architecture updated to reflect a planned change.

Do not use this skill to capture what the user wants or how to achieve it. If
the idea or solution is not documented, use `idea-discovery` or
`solution-brainstorming` first.

## Input

This skill builds on an existing, documented solution. Before asking anything:

1. Accept a solution artifact path or a confirmed solution summary that points
   to a document.
2. **A documented solution artifact is required.** Valid inputs are an idea
   document containing a `## Solution` section or a file under
   `docs/solutions/`.
3. If the artifact is missing or unreadable, stop. Do **not** create it from this
   skill. Tell the user it is missing and offer to load `solution-brainstorming`.
   Continue only after the artifact exists.
4. Read the artifact and extract the chosen approach, goals, success metrics,
   constraints, non-goals, assumptions, risks, trade-offs, and open questions.
5. Never re-ask what the solution artifact already answers. Ask only about gaps
   that block planning.

## Scope

Stay on planning. Do not reopen the what, why, or high-level how unless the
solution artifact is contradictory or missing something the plan depends on. Do
not implement code or tests.

## Council

- **Planner** — decomposes the solution into milestones and independently
  verifiable tasks, sequences dependencies, defines verification, and identifies
  architecture impact.
- **Devil's Advocate** — challenges task granularity, missing architecture
  impact, unverifiable acceptance criteria, hidden dependencies, sequencing,
  and risk, offering a constructive path forward with each critique.

## Rules

- **Architecture source of truth is the root `ARCHITECTURE.md`.** Read it,
  update it, and create it if missing.
- **No-impact case.** If little or no architectural change is required, ask the
  user how to handle `ARCHITECTURE.md`: create a baseline, record an explicit
  "no architectural changes" entry, or leave it untouched. Do not decide silently.
- **Task granularity.** One task is one independently verifiable deliverable.
  Allow S/M/L sizing, but split anything that cannot be verified on its own.
- **Mandatory task fields.** Every task file must contain goal + acceptance
  criteria, files/areas to change, architecture impact, dependencies + order,
  verification/tests, risks + rollback, estimate/size, and milestone mapping.
- **Separate gates.** Review approval authorizes the plan artifacts, not
  implementation. The handoff gate is a separate question after review approval.
- Worktree first: before writing the architecture update, plan index, or any
  task file, use the `create-worktree-on-change` skill.
- Verify on disk: the skill is not complete until every artifact exists, is
  non-empty, contains its required content, and its absolute path has been
  returned.

## Stages

Each stage is a question loop, not a fixed script. Follow the shared protocol.

### 1. Load and confirm the solution

Read the solution artifact and summarize the parts that constrain the plan:
chosen approach, goals, success metrics, constraints, non-goals, assumptions,
risks, and open questions. Ask one question only if something required for
planning is missing or contradictory.

### 2. Resolve planning unknowns

Run the question loop to settle decisions not already in the solution artifact:

- milestone structure and what "shippable" means for this plan
- task granularity and any work that must be split or combined
- sequencing, dependencies, and blockers
- architecture impact and which `ARCHITECTURE.md` sections change
- the no-impact architecture decision, if applicable
- verification strategy and required tests or checks
- risk handling and rollback expectations

The Devil's Advocate challenges each answer and offers constructive
improvements.

### 3. Document architecture changes

Identify the changes required by the plan. Present them concisely: what changes,
why, and which `ARCHITECTURE.md` sections are affected. Then:

1. Read the root `ARCHITECTURE.md` if it exists; otherwise create it.
2. Apply the agreed changes, or record the user-approved no-impact decision.
3. Keep the document consistent with the solution and plan.
4. Verify the file exists and is non-empty.

### 4. Draft the plan index

Create `docs/plans/YYYY-MM-DD-<slug>/index.md`, where `<slug>` is a lowercase,
hyphen-separated ASCII version of the solution title. Include:

- **Plan title and summary** — what the plan delivers.
- **Inputs** — links to the idea/solution artifact and `ARCHITECTURE.md`.
- **Milestones** — named phases with their goals.
- **Task list** — ordered table of tasks with links, milestone, size, and
  dependencies.
- **Dependency order** — execution sequence and any parallel tracks.
- **Decision log** — see below.
- **Risks and assumptions.**
- **Open questions / next steps.**

### 5. Draft the task files

Create one file per task, named `NN-<slug>.md`, numbered in execution order.
Every task file contains:

- **Goal** and **acceptance criteria** — testable conditions for done.
- **Files/areas to change** — expected files, modules, or components.
- **Architecture impact** — how the task changes the architecture and which
  `ARCHITECTURE.md` sections it touches.
- **Dependencies and order** — blocking tasks, prerequisites, and sequence
  position.
- **Verification/tests** — commands, tests, or manual checks that prove the
  task works.
- **Risks and rollback** — known risks, mitigations, and how to back out safely.
- **Estimate/size** — S, M, or L.
- **Milestone mapping** — which milestone the task belongs to.

Use the **Write** tool. Do not merely print the tasks in chat.

### 6. Verify the artifacts

Before presenting anything:

1. Confirm the plan directory, index, and every task file exist and are non-empty.
2. Confirm every task file contains all mandatory fields.
3. Confirm every link in the index resolves to an existing task file.
4. Confirm `ARCHITECTURE.md` reflects the agreed changes or no-impact decision.
5. Confirm the index contains every required section, including the decision log.

Fix any gap before continuing. Do not trust the chat transcript as proof.

### 7. Review gate

Present all results to the user: the architecture change summary, the plan index,
the task list, and the paths to every file. Ask the user to review, with options
such as **Approved** and **Needs changes**. Revise, re-verify, and ask again until
approved. Review approval does **not** authorize implementation.

### 8. Handoff gate

After review approval, ask the user whether to proceed with handoff to
implementation, with options such as **Hand off to implementation** and **Stop
here**.

If the user chooses handoff:

1. Load the `implementation` skill with the skill tool
   (`name: "implementation"`), passing the plan index path and the list of task
   files. Do not delegate this to a subagent.
2. If the skill tool is unavailable, follow the `implementation` instructions
   directly in the main session.
3. If the `implementation` skill is missing, report the plan index and task file
   paths and stop. Do not implement anything from this skill.

If the user chooses to stop, return the artifact paths and end the skill.

## Output artifacts

- Root `ARCHITECTURE.md` — agreed changes or the user-approved no-impact entry.
- `docs/plans/YYYY-MM-DD-<slug>/index.md` — sections listed in Stage 4.
- `docs/plans/YYYY-MM-DD-<slug>/NN-<slug>.md` — one per task, with the mandatory
  fields listed in Stage 5.

## Decision log

Maintain the decision log throughout planning, not only at the end. Each entry
records the challenge or question, the decision, alternatives considered, and
the rationale. Include the log in the plan index.

## Exit criteria

- The solution artifact was read and its constraints were honored.
- The user resolved the planning unknowns, or explicitly said the remaining
  questions are enough.
- Architecture changes are documented in `ARCHITECTURE.md`, or the user-approved
  no-impact decision is recorded.
- The plan index and every task file exist, are non-empty, cross-link correctly,
  and contain all mandatory fields.
- The absolute paths of the plan index and task files have been returned.
- The user explicitly reviewed and approved the results.
- The user answered the separate handoff question.

## Principles

One question per turn; build on the solution; plan, don't implement; architecture
is explicit; verifiable tasks; explicit assumptions; constructive challenge;
verify on disk; separate gates; user decides; reusable output.
