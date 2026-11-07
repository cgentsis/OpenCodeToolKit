# Agent Instructions

## Skills vs. subagents

- Skills are loaded with the **skill tool**, using the skill's `name` (for
  example, `skill` with `name: "idea-discovery"` or
  `name: "solution-brainstorming"`).
- Never pass a skill name to the **task tool** as `subagent_type`. Skills are
  not agents. Doing so fails with `Unknown agent type`.
- Skills that ask the user questions must run in the **main session**.
  Subagents cannot ask the user questions.

## Idea discovery and solution brainstorming

- Before any non-trivial creative, planning, or implementation work, load the
  `idea-discovery` skill when the idea or problem is not yet validated.
- Trigger on idea statements such as "I want to…", "I'm thinking about…",
  "Let's build/create/start…", and "help me design…", even when the user does
  not say "brainstorm".
- `idea-discovery` captures the **what** and **why**, writes an idea document,
  and then offers to continue with `solution-brainstorming` for the **how**.
- Use `solution-brainstorming` when the user wants to choose an approach, or
  when an idea document already exists and the user asks how to do it.
- Do not skip `idea-discovery` unless the idea is already documented and
  confirmed.
- Do not replace either skill with a report-generating subagent. If a skill
  cannot be loaded, ask its stage questions directly in the main session.
