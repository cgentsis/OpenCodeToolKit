# Implementation Planning Skill

## Description

Add an `implementation-planning` skill to the toolkit. It converts a validated,
documented solution into an execution-ready plan: it identifies the architectural
changes required, updates the system architecture document, and produces one
Markdown file per task plus a plan index. When the artifacts are complete, it
asks the user to review the results; once approved, it asks whether to hand off
to implementation.

The skill closes the gap left by `solution-brainstorming`, which already tells
agents to continue with a planning skill that does not yet exist. It makes the
pipeline `idea -> solution -> plan -> implementation -> review/PR` complete.

## Goals and success metrics

- Provide a discoverable `implementation-planning` skill that opencode can load
  through the skill tool.
- Require a documented solution artifact as input; never plan from an
  unvalidated chat summary.
- Identify and document required architectural changes in the root
  `ARCHITECTURE.md`, creating it if missing.
- Produce `docs/plans/YYYY-MM-DD-<slug>/index.md` and one `NN-<slug>.md` file
  per task with all mandatory fields present.
- Enforce one independently verifiable deliverable per task.
- Require explicit user review and approval of the finished artifacts.
- Offer a handoff to an `implementation` skill when present, and degrade
  gracefully when it is not.

Success metrics:

- The skill is listed alongside the existing skills and can be invoked by name.
- A run produces a plan index and task files that cross-link correctly, are
  non-empty, and contain every mandatory field.
- The architecture artifact reflects the required changes, or records the
  user-approved no-impact decision.
- The review gate re-verifies files on disk rather than trusting the chat.
- The handoff gate is separate from review approval.

## Audience

Agents and users working in repositories that use this toolkit. They need a
traceable, verifiable execution plan that bridges validated design and code
changes.

## Constraints and non-goals

Constraints:

- Input must be a documented idea/solution artifact. If missing, stop and offer
  `solution-brainstorming`.
- The architecture source of truth is the root `ARCHITECTURE.md`.
- The skill uses a council-style question loop (one question per turn) before
  drafting.
- All writes happen inside a worktree created with `create-worktree-on-change`.
- The skill is invoked through the skill tool, never as a task subagent type.

Non-goals:

- Implementing code or writing tests.
- Redoing idea or solution discovery.
- Creating the idea or solution artifact.

## Assumptions

- Input may be an idea document containing a `## Solution` section, or a file
  under `docs/solutions/`.
- Task files use the `NN-<slug>.md` naming convention.
- `implementation` is the future handoff skill name; it may not exist yet.
- Architecture updates are written directly to the root `ARCHITECTURE.md`.
- `skills/README.md` and the `solution-brainstorming` handoff should reference
  the new skill.

## Decision log

1. **Where does architecture live?** Challenges: no architecture artifact
   existed. Decision: use root `ARCHITECTURE.md`, create if missing.
   Alternatives: `docs/architecture.md`, `docs/architecture/`, derive from code.
   Rationale: a single root file is easy to find and diff.

2. **What input is required?** Challenge: planning from a chat summary bypasses
   validation. Decision: require a documented solution artifact and stop if it
   is missing. Alternatives: accept any summary or brief. Rationale: keeps the
   pipeline trustworthy.

3. **How are artifacts laid out?** Challenge: per-task files need an index or
   they drift. Decision: `docs/plans/YYYY-MM-DD-<slug>/index.md` plus
   `NN-<slug>.md` per task. Alternatives: one big file, flat files.
   Rationale: index gives a stable overview; task files stay focused.

4. **What must each task contain?** Decision: goal + acceptance criteria,
   files/areas, architecture impact, dependencies + order, verification/tests,
   risks + rollback, estimate/size, and milestone mapping. Rationale: each task
   must be independently executable and reviewable.

5. **How interactive should it be?** Decision: run a council-style Q&A first,
   then draft. Rationale: planning unknowns should be resolved before artifacts
   are written, matching the other council skills.

6. **No-impact architecture case.** Decision: ask the user per case how to
   handle `ARCHITECTURE.md`. Rationale: avoids unnecessary churn while still
   making the decision explicit.

7. **Task granularity.** Decision: one independently verifiable deliverable per
   task, with S/M/L sizing. Alternative: per-file or per-commit tasks.
   Rationale: verifiability is the strongest planning invariant.

8. **Handoff behavior.** Decision: load an `implementation` skill if present;
   otherwise report task paths and stop. Rationale: no hard dependency on a
   skill that does not exist yet.

9. **Review vs. handoff gates.** Decision: keep them separate; review approval
   does not authorize implementation. Rationale: prevents accidental execution.

## Open questions / next steps

- None blocking. After the skill exists, a future `implementation` skill can
  consume the plan directly.

## Council sign-off

- Brainstormer: accepts the documented idea and scope.
- Devil's Advocate: accepts with the caveat that the review gate must verify
  files on disk and must not imply handoff approval; both requirements are
  captured above.
