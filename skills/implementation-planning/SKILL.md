---
name: implementation-planning
description: >
  Use when a validated solution exists and the user wants an execution plan, or
  when solution-brainstorming hands off. Identifies and documents the required
  architectural changes in the root ARCHITECTURE.md, produces a plan index and
  per-task Markdown specs under docs/plans/, then asks the user to review the
  results and decide whether to hand off to implementation. Requires a
  documented solution artifact. Invoke this skill with the skill tool using name
  "implementation-planning"; it is not a subagent type and must never be passed
  to the task tool as subagent_type.
---

# Implementation Planning (Council)

## When to use

Use this skill when:

- `solution-brainstorming` has produced a documented solution and the user wants
  to turn it into an execution plan
- the user asks for an implementation plan, task breakdown, milestones, or
  sequencing for a known solution
- the user wants the architecture updated to reflect a planned change

Do not use this skill to capture what the user wants or how to achieve it. If
the idea or solution is not documented, use `idea-discovery` or
`solution-brainstorming` first.

## Invocation

- This is a **skill**, not a subagent type. Load it with the **skill tool**,
  using `name: "implementation-planning"`.
- Never call the task tool with `subagent_type: "implementation-planning"`. That
  is not a valid agent type and fails with an "Unknown agent type" error.
- Run the question loop in the **main session**. Subagents cannot ask the user
  questions. If you use subagents for analysis, they must return candidate
  questions and critiques to the main agent, which asks the user.
- If the skill cannot be loaded, do **not** substitute a report-generating
  subagent. Ask the stage questions directly in the main session instead.

## Input

This skill builds on an existing, documented solution. Before asking anything:

1. Accept a solution artifact path or a confirmed solution summary that points
   to a document.
2. **A documented solution artifact is required.** Valid inputs are an idea
   document containing a `## Solution` section or a file under
   `docs/solutions/`.
3. If the artifact is missing or unreadable, stop. Do **not** create the
   solution artifact from this skill. Tell the user the solution document is
   missing and offer to load `solution-brainstorming` to create it. Continue only
   after the artifact exists.
4. Read the artifact and extract the chosen approach, goals, success metrics,
   constraints, non-goals, assumptions, risks, trade-offs, and open questions.
5. Never re-ask what the solution artifact already answers. Ask only about gaps
   that block planning.

## Council

Two roles work together. The main agent acts as facilitator and may simulate
both roles, or spawn them as subagents when a subagent tool is available. If
spawned as subagents, they do not ask the user directly; they return candidate
questions and critiques to the main agent, which runs the question loop.

- **Planner** — decomposes the solution into milestones and independently
  verifiable tasks, sequences dependencies, defines verification, and identifies
  architecture impact.
- **Devil's Advocate** — challenges task granularity, missing architecture
  impact, unverifiable acceptance criteria, hidden dependencies, sequencing, and
  risk, and gives constructive feedback with at least one concrete improvement
  or alternative per critique.

The Devil's Advocate is not negative for its own sake: every critique must
include a constructive path forward.

## Rules

- **One question per turn.** Exactly one agent asks exactly one question, then
  waits for the user's answer before any next question.
- Either agent may ask the next question. Choose whichever has the most
  valuable question at that moment.
- Keep looping within a stage until **both agents have no more questions** or
  the **user says this is enough**.
- Never ask multiple questions in one turn, and never bundle a question with a
  list of sub-questions.
- **Stay on planning.** Do not reopen the what, why, or high-level how unless
  the solution artifact is contradictory or missing something the plan depends
  on. Do not implement code or tests.
- **Prefer selectable options when they help.** When a question has a bounded
  set of sensible answers, use the question tool with 2–5 concrete options. The
  question tool automatically adds a "Type your own answer" option when custom
  answers are enabled—do not add it yourself. If custom answers are disabled,
  include one explicit "Type your own answer" option. Keep open-ended questions
  for genuinely unbounded topics and ask those as plain text without the
  question tool.
- **Let the user pick several discussion subjects.** When asking which planning
  subjects to resolve, allow multiple selections (`multiple: true`). Work
  through the chosen subjects one at a time, then return to the remaining ones
  until the list is exhausted or the user says this is enough. Add any new
  subject that emerges from earlier answers to the list.
- Make assumptions explicit and label them as assumptions.
- State the agents' internal critique to the user as concise feedback, not as a
  wall of text.
- **Worktree first.** Before writing the architecture update, the plan index, or
  any task file, use the `create-worktree-on-change` skill. Never write files in
  the main checkout.
- **Architecture source of truth is the root `ARCHITECTURE.md`.** Read it,
  update it, and create it if missing.
- **No-impact case.** If the plan requires little or no architectural change,
  ask the user how to handle `ARCHITECTURE.md` for this plan: create a baseline,
  record an explicit "no architectural changes" entry, or leave it untouched.
  Do not decide silently.
- **Task granularity.** One task is one independently verifiable deliverable.
  Allow S/M/L sizing, but split anything that cannot be verified on its own.
- **Mandatory task fields.** Every task file must contain goal + acceptance
  criteria, files/areas to change, architecture impact, dependencies + order,
  verification/tests, risks + rollback, estimate/size, and milestone mapping.
- **Separate gates.** Review approval authorizes the plan artifacts, not
  implementation. The handoff gate is a separate question after review approval.
- **Verify on disk.** The skill is not complete until every artifact exists,
  is non-empty, and its absolute path has been returned.

## Calling the question tool

**Hard rule:** `options` is mandatory for the question tool. Never call it for
an open-ended question. If you have no bounded options to offer, use a normal
text message instead.

When a bounded question is best answered from a list, call the question tool
with exactly one question object per turn:

```json
{
  "questions": [
    {
      "question": "How should milestones be organized?",
      "header": "Milestones",
      "options": [
        { "label": "By layer", "description": "Group tasks by architecture layer" },
        { "label": "By user value", "description": "Group tasks into shippable increments" },
        { "label": "Single milestone", "description": "Treat the whole plan as one milestone" }
      ]
    }
  ]
}
```

Rules for the call:

- `questions` must be an array containing exactly one object per turn.
- Every question object requires `question`, `header` (30 characters or
  fewer), and `options`.
- Every option requires both `label` and `description`.
- Set `multiple: true` only when the user may select more than one option.
- Do not add an "Other" or "Type your own answer" option; the tool adds it
  automatically when custom answers are enabled.
- If custom answers are disabled or unavailable, add one option labelled
  "Type your own answer" whose description invites free text.
- For open-ended questions, ask in plain text and do not call the question tool.
- Do not pass options as bare strings or omit required fields. Doing so is the
  most common cause of question-tool errors.
- If the question tool is unavailable in the current session, ask the same
  question as plain text with a numbered list of options and invite a free-text
  answer instead.

## Discussion backlog

When the user selects planning subjects, treat the selected items as a backlog:

- Ask the selection question with `multiple: true` so the user can pick more
  than one item.
- Record every selected item, plus any new item that emerges from later
  answers, in the backlog.
- Discuss one backlog item at a time, following the one-question-per-turn rule.
- After an item is covered, ask which remaining item to discuss next, listing
  all remaining backlog items. Do not silently default to the "most important"
  item; let the user choose.
- Mark each item complete as it is covered.
- Stop when the backlog is empty or the user says this is enough.

## Stages

Each stage is a question loop, not a fixed script. Run the loop described in
the Rules section for every stage.

### 1. Load and confirm the solution

Read the solution artifact and summarize the parts that constrain the plan:
chosen approach, goals, success metrics, constraints, non-goals, assumptions,
risks, and open questions. Ask one question only if something required for
planning is missing or contradictory.

### 2. Resolve planning unknowns

Run the question loop to settle the planning decisions that are not already in
the solution artifact. Cover, as needed:

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

Identify the architectural changes required by the plan. Present them concisely:
what changes, why, and which `ARCHITECTURE.md` sections are affected.

Then update the architecture document:

1. Read the root `ARCHITECTURE.md` if it exists; otherwise create it.
2. Apply the agreed changes, or record the user-approved no-impact decision.
3. Keep the document consistent with the solution and plan.
4. Verify the file exists and is non-empty.

### 4. Draft the plan index

Create `docs/plans/YYYY-MM-DD-<slug>/index.md`, where `<slug>` is a lowercase,
hyphen-separated ASCII version of the solution title. The index contains:

- **Plan title and summary** — what the plan delivers.
- **Inputs** — links to the idea/solution artifact and `ARCHITECTURE.md`.
- **Milestones** — named phases with their goals.
- **Task list** — ordered table of tasks with links to each task file, its
  milestone, size, and dependencies.
- **Dependency order** — the execution sequence and any parallel tracks.
- **Risks and assumptions.**
- **Open questions / next steps.**

### 5. Draft the task files

Create one file per task, named `NN-<slug>.md`, in the plan directory. Number
tasks in execution order. Every task file contains:

- **Goal** and **acceptance criteria** — testable conditions for done.
- **Files/areas to change** — expected files, modules, or components.
- **Architecture impact** — how the task changes the architecture and which
  `ARCHITECTURE.md` sections it touches.
- **Dependencies and order** — blocking tasks, prerequisites, and sequence
  position.
- **Verification/tests** — commands, tests, or manual checks that prove the task
  works.
- **Risks and rollback** — known risks, mitigations, and how to back out safely.
- **Estimate/size** — S, M, or L.
- **Milestone mapping** — which milestone the task belongs to.

Use the **Write** tool. Do not merely print the tasks in the chat or describe
where they would go.

### 6. Verify the artifacts

Before presenting anything:

1. Confirm the plan directory, index, and every task file exist and are
   non-empty (re-read or list them).
2. Confirm every task file contains all mandatory fields.
3. Confirm every link in the index resolves to an existing task file.
4. Confirm `ARCHITECTURE.md` reflects the agreed changes or no-impact decision.

Fix any gap before continuing. Do not trust the chat transcript as proof.

### 7. Review gate

Present all results to the user: the architecture change summary, the plan
index, the task list, and the paths to every file.

Ask the user to review everything, presenting options such as:

- **Approved** — the results are good.
- **Needs changes** — the user will describe corrections.

If the user asks for changes, revise the affected artifacts, re-verify them,
and ask again. Loop until the user approves. Review approval does **not**
authorize implementation.

### 8. Handoff gate

After review approval, ask the user whether to proceed with handoff to
implementation, presenting options such as:

- **Hand off to implementation** — continue into implementation.
- **Stop here** — keep the plan and end the skill.

If the user chooses handoff:

1. Load an `implementation` skill with the **skill tool** if it is available.
2. If no `implementation` skill exists or it cannot be loaded, do not implement
   anything. Report the plan index and task file paths and stop.

If the user chooses to stop, return the artifact paths and end the skill.

## Decision log

Maintain the decision log throughout planning, not only at the end. For each
entry record: the challenge or question raised, the decision made, the
alternatives considered, and the rationale. Include the log in the plan index.

## Exit criteria

Implementation planning is complete when all of the following are true:

- The solution artifact was read and its constraints were honored.
- The user resolved the planning unknowns, or explicitly said the remaining
  questions are enough.
- Architecture changes are documented in `ARCHITECTURE.md`, or the user-approved
  no-impact decision is recorded.
- The plan index and every task file exist, are non-empty, cross-link correctly,
  and contain all mandatory fields.
- The absolute paths of the plan index and task files have been returned.
- The user has explicitly reviewed and approved the results.
- The user has answered the separate handoff question.

## Principles

- **One question per turn** — keeps the dialogue focused and the user in control.
- **Build on the solution** — the what and how are already validated; do not
  redo discovery.
- **Plan, don't implement** — this skill produces plans and architecture, not
  code.
- **Architecture is explicit** — every plan states its architectural impact or
  records a deliberate no-impact decision.
- **Verifiable tasks** — every task has acceptance criteria and a way to prove
  it works.
- **Explicit assumptions** — hidden defaults are a failure mode.
- **Constructive challenge** — critique must come with a way forward.
- **Verify on disk** — the artifacts, not the chat, are the deliverable.
- **Separate gates** — review approval is not handoff approval.
- **User decides** — the council advises; the user owns the final call.
- **Reusable output** — the plan feeds an implementation skill or any downstream
  process.
