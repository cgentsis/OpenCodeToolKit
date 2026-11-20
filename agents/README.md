# Agents

Reserved for reusable subagent prompts and role descriptions.

OpenCode's subagent tool accepts `agent: "explore" | "general"`. Council roles
such as Brainstormer, Devil's Advocate, and Planner are **reasoning hats**, not
registered agent types: the main agent simulates them inline, or injects the
role description into the prompt of a `general` subagent. Adding a Markdown file
here does not by itself register an agent with OpenCode.

Store role prompts here when you want them versioned and reusable, then load
them from a skill or subagent task prompt. Keep them short: state the role's
goal, what it should challenge, and what it must return to the facilitator.

Subagents cannot ask the user questions. They return candidate questions,
critiques, or findings to the main session, which owns the conversation.
