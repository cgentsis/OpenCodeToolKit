# Agent Instructions

## Worktree first (mandatory)

- Before making **any** file change in this repository, create or enter an
  isolated git worktree using the `create-worktree-on-change` skill.
- Never edit, create, delete, or move files in the main checkout. This applies
  to code, documentation, skills, configuration, and generated artifacts.
- If you are already inside a linked worktree, continue there.
- If you are in the main checkout, stop before the first edit and create a
  worktree. Use a short task name, for example:

  ```bash
  node skills/create-worktree-on-change/ensure-worktree.js <task-name>
  ```

  The command prints the worktree path. Use that path as the working directory
  for all subsequent commands.
- If the worktree cannot be created, stop and ask the user. Do not fall back to
  editing the main checkout.
- Read-only commands and inspection are allowed in the main checkout. The rule
  applies as soon as you are about to change something.

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
