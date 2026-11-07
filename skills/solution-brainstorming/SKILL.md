---
name: solution-brainstorming
description: >
  Use when the user wants to figure out how to achieve a validated idea, or when
  idea-discovery hands off. Turns the what and why into a documented solution:
  alternatives, trade-offs, critique, chosen approach, and decision log.
  Requires an idea document or a confirmed idea summary. Invoke this skill with
  the skill tool using name "solution-brainstorming"; it is not a subagent type
  and must never be passed to the task tool as subagent_type.
---

# Solution Brainstorming (Council)

## When to use

Use this skill when:

- `idea-discovery` has produced a validated idea document and the user wants to
  continue into the solution
- the user asks how to build, implement, achieve, or approach something whose
  what and why are already clear
- the user wants alternatives, trade-offs, or a chosen approach for a known idea

Do not use this skill to capture what the user wants or why. If the idea is not
yet validated, use `idea-discovery` first.

## Invocation

- This is a **skill**, not a subagent type. Load it with the **skill tool**,
  using `name: "solution-brainstorming"`.
- Never call the task tool with `subagent_type: "solution-brainstorming"`. That
  is not a valid agent type and fails with an "Unknown agent type" error.
- Run the question loop in the **main session**. Subagents cannot ask the user
  questions. If you use subagents for analysis, they must return candidate
  questions and critiques to the main agent, which asks the user.
- If the skill cannot be loaded, do **not** substitute a report-generating
  subagent. Ask the stage questions directly in the main session instead.

## Input

This skill builds on an existing, documented idea. Before asking anything:

1. Accept an idea document path or a confirmed idea summary.
2. If given a path, read the document.
3. If the path is missing or unreadable, stop. **Do not create the idea
   document from this skill** and do not proceed with a summary alone. Tell the
   user the idea document is missing and offer to load `idea-discovery` to
   create it. Continue only after the idea document exists.
4. Extract the goals, success metrics, constraints, non-goals, assumptions, and
   open questions that bound the solution.
5. Never re-ask what the idea document already answers.
6. If the user provides a confirmed summary but there is no document, load
   `idea-discovery` first so the idea is written down, then continue here.

## Council

Two roles work together. The main agent acts as facilitator and may simulate
both roles, or spawn them as subagents when a subagent tool is available. If
spawned as subagents, they do not ask the user directly; they return candidate
questions and critiques to the main agent, which runs the question loop.

- **Brainstormer** — proposes solution approaches, asks clarifying questions,
  and synthesizes the user's answers into a working solution.
- **Devil's Advocate** — challenges feasibility, risk, cost, complexity,
  dependencies, and hidden assumptions, and gives constructive feedback with at
  least one concrete improvement or alternative per critique.

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
- **Stay on how.** Do not reopen the what or why unless the idea document is
  contradictory or missing something the solution depends on.
- **Prefer selectable options when they help.** When a question has a bounded
  set of sensible answers, use the question tool with 2–5 concrete options. The
  question tool automatically adds a "Type your own answer" option when custom
  answers are enabled—do not add it yourself. If custom answers are disabled,
  include one explicit "Type your own answer" option. Keep open-ended questions
  for genuinely unbounded topics and ask those as plain text without the
  question tool.
- **Let the user pick several approaches to develop.** When asking which
  alternatives to deepen, allow multiple selections (`multiple: true`). Work
  through the chosen approaches one at a time, then return to the remaining ones
  until the list is exhausted or the user says this is enough. Add any new
  approach that emerges from earlier answers to the list.
- Make assumptions explicit and label them as assumptions.
- State the agents' internal critique to the user as concise feedback, not as
  a wall of text.
- **Worktree first.** Before writing the solution artifact or any other file,
  use the `create-worktree-on-change` skill. Never write files in the main
  checkout.
- Do not proceed past the hard gate without explicit user confirmation.
- The skill is not complete until the solution exists on disk. Writing and
  verifying that artifact is part of this skill, not a follow-up request.

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
      "question": "Which constraint should drive the approach?",
      "header": "Driving constraint",
      "options": [
        { "label": "Speed", "description": "Reach a working result fastest" },
        { "label": "Cost", "description": "Minimize total spend" },
        { "label": "Robustness", "description": "Maximize reliability and safety" }
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

## Approach backlog

When the user selects approaches to develop, treat the selected items as a
backlog:

- Ask the selection question with `multiple: true` so the user can pick more
  than one approach.
- Record every selected approach, plus any new approach that emerges from later
  answers, in the backlog.
- Deepen one approach at a time, following the one-question-per-turn rule.
- After an approach is covered, ask which remaining approach to develop next,
  listing all remaining backlog items. Do not silently default to the "best"
  approach; let the user choose.
- Mark each approach complete as it is covered.
- Stop when the backlog is empty or the user says this is enough.

## Stages

Each stage is a question loop, not a fixed script. Run the loop described in
the Rules section for every stage.

### 1. Load and confirm the idea

Read the idea document and summarize the parts that constrain the solution:
goals, success metrics, constraints, non-goals, assumptions, and open
questions. Ask one question only if something required for choosing a solution
is missing or contradictory.

### 2. Frame the solution space

Establish what "done" means for the solution and any must-use, must-avoid, or
preferred resources and approaches that are not already in the idea document.
The Brainstormer elicits these; the Devil's Advocate tests them for realism and
hidden assumptions.

### 3. Generate alternatives

The Brainstormer proposes 3–5 genuinely different approaches. Present each
concisely: name, one-line description, and main trade-off.

The Devil's Advocate critiques each approach for feasibility, risk, cost,
complexity, dependencies, and hidden assumptions, and suggests improvements or
hybrids.

Then ask the user which approaches to develop further, using multiple
selection. Do not choose for them.

### 4. Deepen the selected approaches

For each selected approach, run the question loop covering:

- feasibility and prerequisites
- resources, cost, and time
- risks and mitigations
- dependencies and constraints
- trade-offs against the alternatives
- unknowns that would change the decision

The Devil's Advocate challenges each answer and offers constructive
improvements.

### 5. Select and confirm (hard gate)

Summarize the result in a concise list:

1. Chosen approach.
2. Why it was chosen.
3. Alternatives considered and why they were rejected.
4. Key trade-offs.
5. Risks and mitigations.
6. Assumptions.
7. Open questions.

The Devil's Advocate reviews the summary for remaining gaps or contradictions
and records either a sign-off or a list of unresolved issues. Then ask the user
to confirm or correct the summary, presenting options such as: confirmed, needs
changes, or type your own corrections.

Do not proceed to documentation until the user explicitly confirms and the
Devil's Advocate has signed off (or all raised issues are resolved).

### 6. Document the solution

Create the solution artifact **immediately after the hard-gate confirmation**,
without waiting for a separate request.

Default: append a `## Solution` section to the idea document.

If the user prefers a separate file, create
`docs/solutions/YYYY-MM-DD-<slug>-solution.md` and add a link to it from the
idea document.

Use the **Write** or **Edit** tool to write the artifact. Do not merely print it
in the chat or describe where it would go. Verify the artifact exists and is
non-empty, then return its absolute path.

The solution section or file contains:

- **Chosen approach.**
- **Alternatives considered** and why they were rejected.
- **Trade-offs.**
- **Risks and mitigations.**
- **High-level steps or components** — enough to plan from, not an
  implementation.
- **Assumptions.**
- **Decision log** — each challenge raised by the Devil's Advocate and how it
  was resolved.
- **Open questions / next steps.**
- **Council sign-off** — confirmation that both roles accept the solution.

### 7. Hand off to planning or implementation

After the solution is documented, ask whether the user wants to create an
implementation plan or continue with a planning skill. Do not implement the
solution in this skill.

If the user wants a plan, load the `implementation-planning` skill with the
**skill tool** (`name: "implementation-planning"`) and pass the solution
artifact path. Do not delegate this to a subagent. If the skill tool is
unavailable, follow the `implementation-planning` instructions directly in the
main session, using the solution artifact as input.

## Decision log

Maintain the decision log throughout solution brainstorming, not only at the
end. For each entry record: the challenge or question raised, the decision
made, the alternatives considered, and the rationale.

## Exit criteria

Solution brainstorming is complete when all of the following are true:

- The user has explicitly confirmed the consolidated solution summary.
- The Devil's Advocate has signed off, or every raised issue is resolved.
- Every major assumption is documented.
- The decision log is complete.
- The solution artifact exists, is non-empty, and its absolute path has been
  returned.

## Principles

- **One question per turn** — keeps the dialogue focused and the user in control.
- **Build on the idea** — the what and why are already validated; do not redo
  discovery.
- **How, not what** — this skill chooses an approach and documents it.
- **Explicit assumptions** — hidden defaults are a failure mode.
- **Constructive challenge** — critique must come with a way forward.
- **Explore before choosing** — generate real alternatives before converging.
- **Exhaust the backlog** — if the user picks several approaches, finish one,
  then ask for the next, including newly surfaced approaches, until none remain
  or the user stops.
- **Useful options, always a free-text path** — offer concrete choices where
  they fit, and rely on the question tool's built-in "Type your own answer"
  option (or add one explicitly if custom answers are disabled).
- **User decides** — the council advises; the user owns the final call.
- **Reusable output** — the solution artifact feeds a planning or
  implementation step.
