# Council protocol (shared)

This file defines the interaction protocol shared by the council-style skills:
`idea-discovery`, `solution-brainstorming`, and `implementation-planning`. Read
it once at the start of any of those skills and follow it for the whole session.
`implementation` is not a council skill and does not use this protocol.

Each skill's own `SKILL.md` defines its roles, scope boundary, stages, and
output artifact. This file defines **how** the conversation runs. Keep the two
separate: put skill-specific content in `SKILL.md`, not here.

## Tooling in OpenCode

- Load skills with the **skill tool** by `name` (for example,
  `name: "idea-discovery"`). A skill is not an agent type. Never pass a skill
  name to the **subagent** tool as its `agent`; there is no `idea-discovery`
  agent and the call fails with "Unknown agent type".
- The subagent tool accepts `agent: "explore" | "general"`. Council roles are
  reasoning hats, not registered agents. Simulate them inline by default. If you
  spawn a `general` subagent for analysis, put the role description in its task
  prompt and have it return candidate questions or critiques. Subagents cannot
  ask the user questions.
- Run the question loop in the **main session**. If a skill cannot be loaded,
  ask the stage questions directly instead of substituting a report-generating
  subagent.

## Council pattern

The main agent is the facilitator and may simulate both roles, or delegate
analysis to a `general` subagent with the role injected into its prompt. The
specific roles are listed in each skill's "Council" section.

One role is always the **Devil's Advocate**. It challenges the validity and
quality of every decision, exposes hidden assumptions and contradictions, and
gives constructive feedback with at least one concrete improvement or
alternative per critique. It is not negative for its own sake.

Subagents return candidate questions and critiques to the facilitator, who runs
the question loop and owns the conversation with the user.

## Question loop

- Exactly one agent asks exactly one question per turn, then waits for the
  answer. Either agent may ask the next question; choose whichever has the most
  valuable question at that moment.
- Keep looping within a stage until both agents have no more questions or the
  user says it is enough. Never bundle a question with a list of sub-questions.
- Make assumptions explicit and label them as assumptions.
- State the agents' internal critique to the user as concise feedback, not as a
  wall of text.
- Stay inside the skill's scope boundary. Do not wander into another stage's
  territory.
- **Fast path.** If the user's opening message already answers a stage's
  questions, do not ask them again. Summarize what is already known, record the
  assumptions, and move to the hard gate. Redundant questions waste the user's
  time. The hard gate still requires explicit confirmation.

## Calling the question tool

Use the question tool for bounded questions with 2–5 concrete options.

- `options` is mandatory. Never call the tool for an open-ended question; ask
  those as plain text.
- Pass exactly one question object per turn: `questions` is an array containing
  one object with `question`, `header` (30 characters or fewer), and `options`.
- Each option needs both `label` and `description`.
- Set `multiple: true` only when the user may select more than one option.
- Do not add an "Other" or "Type your own answer" option. The tool adds a
  free-text option automatically.
- Do not pass options as bare strings or omit required fields.
- If the question tool is unavailable, ask the same question as plain text with
  a numbered list and invite a free-text answer.

Example:

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

## Backlog protocol

When you ask the user to select subjects, approaches, or tasks to develop:

- Ask the selection question with `multiple: true`.
- Record every selection, plus anything new that surfaces in later answers.
- Work through one item at a time, respecting one-question-per-turn.
- After an item is covered, ask which remaining item to develop next, listing
  them all. Do not silently pick one for the user.
- Mark each item complete. Stop when the backlog is empty or the user says so.

## Hard gate and document-first rule

Stages that end with a hard gate follow this sequence:

1. Summarize the result using the checklist in the skill's "Stages" section.
2. The Devil's Advocate reviews for gaps and contradictions and records either
   a sign-off or a list of unresolved issues. Resolve issues before proceeding.
3. Ask the user to confirm or correct the summary **in the same turn**, using
   the question tool with options such as confirmed, needs changes, and free
   text. Do not end the turn without asking.
4. Confirmation means **document immediately**. Do not print the document only
   in chat, do not load the next skill, and do not end the turn. Write the
   artifact, verify it on disk, and return its absolute path. Treat "continue",
   "looks good", or "go ahead" as confirmation.
5. Before writing any file, use the `create-worktree-on-change` skill. Never
   write in the main checkout.
6. Preflight before any handoff: if the artifact does not exist on disk, go
   back and write it. Never hand off with a missing artifact.

## Decision log

Maintain a decision log throughout, not only at the end. Each entry records the
challenge or question, the decision, the alternatives considered, and the
rationale. Include the log in the output artifact.

## Verification

"Done" means the artifact exists on disk, is non-empty, contains every required
section, and its absolute path has been returned. Reading the file back is the
proof; the chat transcript is not.
