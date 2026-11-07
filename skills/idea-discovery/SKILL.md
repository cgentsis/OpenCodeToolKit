---
name: idea-discovery
description: >
  Use when the user describes a new idea, goal, project, ambition, or plan—even
  if they never say "brainstorm"—or asks for help figuring out, exploring,
  refining, or validating what they want. MUST be used before any non-trivial
  creative, planning, or implementation work when the idea is not yet validated.
  Captures the what and why into a documented idea, then offers to continue with
  solution-brainstorming for the how. Invoke this skill with the skill tool using
  name "idea-discovery"; it is not a subagent type and must never be passed to
  the task tool as subagent_type.
---

# Idea Discovery (Council)

## When to use

Use this skill when the user:

- describes a new idea, goal, project, ambition, or plan, such as "I want to…",
  "I'm thinking about…", or "Let's create/build/start…"
- asks for help figuring out, refining, or validating what they want
- needs a concept validated before planning or implementation

Do not wait for the word "brainstorm". If the user states a non-trivial idea or
goal, invoke this skill first, before planning, designing, or implementing.

This skill captures **what** the user wants and **why**. It does not choose how
to build it. When the idea is documented, it offers to continue with
`solution-brainstorming` to capture the **how**.

Other skills may also invoke this skill to produce a validated idea document
before their own planning or implementation steps.

## Invocation

- This is a **skill**, not a subagent type. Load it with the **skill tool**,
  using `name: "idea-discovery"`.
- Never call the task tool with `subagent_type: "idea-discovery"`. That is not a
  valid agent type and fails with an "Unknown agent type" error.
- Run the question loop in the **main session**. Subagents cannot ask the user
  questions. If you use subagents for analysis, they must return candidate
  questions and critiques to the main agent, which asks the user.
- If the skill cannot be loaded, do **not** substitute a report-generating
  subagent. Ask the stage questions directly in the main session instead.

## Council

Two roles work together. The main agent acts as facilitator and may simulate
both roles, or spawn them as subagents when a subagent tool is available. If
spawned as subagents, they do not ask the user directly; they return candidate
questions and critiques to the main agent, which runs the question loop.

- **Brainstormer** — asks clarifying questions, gathers context, and
  synthesizes the user's answers into a working definition.
- **Devil's Advocate** — challenges the validity and quality of every decision,
  exposes hidden assumptions and contradictions, and gives constructive
  feedback with at least one concrete improvement or alternative per critique.

The Devil's Advocate is not negative for its own sake: every critique must
include a constructive path forward.

## Rules

- **Trigger check.** If the user's message describes a non-trivial idea, goal,
  project, or plan, invoke this skill before doing anything else—even if they
  did not say "brainstorm" and even if they phrased it as a statement such as
  "I want to send a spaceship to Mars". Skip only when the request is trivial
  and fully specified.
- **One question per turn.** Exactly one agent asks exactly one question, then
  waits for the user's answer before any next question.
- Either agent may ask the next question. Choose whichever has the most
  valuable question at that moment.
- Keep looping within a stage until **both agents have no more questions** or
  the **user says this is enough**.
- Never ask multiple questions in one turn, and never bundle a question with a
  list of sub-questions.
- **Stay on what and why.** Do not generate solution approaches or choose a
  build path in this skill. That belongs to `solution-brainstorming`.
- **Prefer selectable options when they help.** When a question has a bounded
  set of sensible answers, use the question tool with 2–5 concrete options. The
  question tool automatically adds a "Type your own answer" option when custom
  answers are enabled—do not add it yourself. If custom answers are disabled,
  include one explicit "Type your own answer" option. Keep open-ended questions
  for genuinely unbounded topics, such as exploring the user's intent or
  motivation, and ask those as plain text without the question tool.
- **Let the user pick several discussion subjects.** When asking which subjects
  or topics to discuss, allow multiple selections (`multiple: true`). Work
  through the chosen subjects one at a time, then return to the remaining ones
  until the list is exhausted or the user says this is enough. Add any new
  subjects that emerge from earlier answers to the list.
- Make assumptions explicit and label them as assumptions.
- State the agents' internal critique to the user as concise feedback, not as
  a wall of text.
- **Worktree first.** Before writing the idea document or any other file, use
  the `create-worktree-on-change` skill. Never write files in the main checkout.
- Do not proceed past the hard gate without explicit user confirmation.
- **Confirmation means document.** Confirming the summary authorizes writing the
  idea document; it does not authorize skipping it or jumping to solution
  brainstorming. Write and verify the file first.
- The skill is not complete until the idea document exists on disk. Writing and
  verifying that file is part of this skill, not a follow-up request.

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
      "question": "Which success metric matters most?",
      "header": "Success metric",
      "options": [
        { "label": "Survival", "description": "All passengers alive after arrival" },
        { "label": "Habitability", "description": "Colony self-sustaining within 20 years" },
        { "label": "Cost", "description": "Stay within the stated budget" }
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
- For open-ended questions (intent, motivation, context), ask in plain text
  and do not call the question tool.
- Do not pass options as bare strings or omit required fields. Doing so is the
  most common cause of question-tool errors.
- If the question tool is unavailable in the current session, ask the same
  question as plain text with a numbered list of options and invite a free-text
  answer instead.

## Discussion backlog

When the user selects subjects or topics to discuss, treat the selected items
as a backlog:

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

### 1. Frame the idea

Gather the raw idea, context, and what the user means by "done". The
Brainstormer asks about the idea itself; the Devil's Advocate probes ambiguity,
undefined terms, and hidden assumptions.

### 2. Goals and success criteria

Establish the purpose, who benefits, and what success looks like. The
Brainstormer elicits these; the Devil's Advocate tests whether the goals are
meaningful, measurable, and aligned with the stated purpose.

### 3. Constraints and non-goals

Identify hard limits (time, budget, resources, legal, technical, or other) and
explicit non-goals. The Devil's Advocate tests each constraint for realism,
dependencies, edge cases, and contradictions.

If a constraint is impossible or contradictory, pause and ask the user whether
to revise it or explicitly treat it as an assumption or thought experiment.

### 4. Consolidate and confirm (hard gate)

Summarize the result in a concise list:

1. What the idea is.
2. Why it matters.
3. Who benefits.
4. Key constraints.
5. Non-goals.
6. Success criteria.
7. Assumptions.
8. Open questions.

The Devil's Advocate reviews the summary for remaining gaps, contradictions,
or weak assumptions and records either a sign-off or a list of unresolved
issues. Then ask the user to confirm or correct the summary, presenting
options such as: confirmed, needs changes, or type your own corrections. Ask
this in the same turn as the summary; do not end the turn without asking for
confirmation.

Do not proceed to documentation until the user explicitly confirms and the
Devil's Advocate has signed off (or all raised issues are resolved).

Confirmation and documentation are **one atomic step**. When the user confirms,
do not end the turn, do not load another skill, and do not print the summary as
the final action. Immediately execute Stage 5 and write the idea document before
doing anything else. If the user says "continue", "looks good", or similar in
response to the summary, treat that as confirmation and write the file first.

### 5. Document the validated idea

Create the document **immediately after the hard-gate confirmation**, without
waiting for a separate request.

**File-first rule:** never finish this skill or load `solution-brainstorming`
until the idea document exists on disk. Printing the document in the chat does
not satisfy this step.

1. Choose a filename: `docs/ideas/YYYY-MM-DD-<slug>.md`, where `<slug>` is a
   lowercase, hyphen-separated ASCII version of the title.
2. Create the parent directory if it does not exist (for example,
   `mkdir -p docs/ideas`).
3. Use the **Write tool** to create the file. Do not merely print the document
   in the chat or describe where it would go.
4. Verify the file exists and is non-empty (re-read it or list it).
5. Return the absolute file path so the next step or the user can consume it.

The document contains:

- **Title** — short, clear name.
- **Description** — the refined description from the summary.
- **Goals and success metrics.**
- **Audience.**
- **Constraints and non-goals.**
- **Assumptions.**
- **Decision log** — each challenge raised by the Devil's Advocate and how it
  was resolved. This is the core "bullet-proof" artifact.
- **Open questions / next steps.**
- **Council sign-off** — confirmation that both roles accept the document.

### 6. Continue to the solution

The idea document is the input for solution brainstorming. After it is written
and verified:

**Precondition check:** before asking about the solution or loading
`solution-brainstorming`, verify the idea document exists. If it does not,
return to Stage 5 and write it. Never load `solution-brainstorming` with a
missing idea document.

1. Tell the user the document path.
2. Ask whether to continue with the solution now, using options such as:
   - **Continue to solution brainstorming** (recommended)
   - **Stop at the idea**
   - Type your own answer.
   If the user already asked for both the idea and the solution in the same
   request, skip this question and continue directly.
3. If the user chooses to continue, load the `solution-brainstorming` skill with
   the **skill tool** (`name: "solution-brainstorming"`) and pass the idea
   document path. Do not delegate this to a subagent.
4. If the skill tool is unavailable, follow the `solution-brainstorming`
   instructions directly in the main session, using the idea document as input.
5. If the user chooses to stop, end the skill and return the idea document path.

This handoff is the easy path from capturing the idea to capturing the solution.

## Decision log

Maintain the decision log throughout discovery, not only at the end. For each
entry record: the challenge or question raised, the decision made, the
alternatives considered, and the rationale.

## Exit criteria

Idea discovery is complete when all of the following are true:

- The user has explicitly confirmed the consolidated summary.
- The Devil's Advocate has signed off, or every raised issue is resolved.
- Every major assumption is documented.
- The decision log is complete.
- The idea document exists, is non-empty, and its absolute path has been
  returned.
- The user has either continued to solution brainstorming or chosen to stop.

## Principles

- **One question per turn** — keeps the dialogue focused and the user in control.
- **Explicit assumptions** — hidden defaults are a failure mode.
- **Constructive challenge** — critique must come with a way forward.
- **What before how** — validate the idea before generating solutions.
- **Exhaust the backlog** — if the user picks several discussion subjects,
  finish one, then ask for the next, including newly surfaced subjects, until
  none remain or the user stops.
- **Useful options, always a free-text path** — offer concrete choices where
  they fit, and rely on the question tool's built-in "Type your own answer"
  option (or add one explicitly if custom answers are disabled).
- **User decides** — the council advises; the user owns the final call.
- **Iterate until satisfied** — run each stage until the agents or the user say
  there is nothing left to ask.
- **Reusable output** — the idea document is domain-agnostic and feeds
  `solution-brainstorming` or any downstream process.
