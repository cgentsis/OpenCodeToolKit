---
name: idea-discovery
description: >-
  Use when the user describes a new idea, goal, project, ambition, or plan —
  even if they never say "brainstorm" — or asks to explore, refine, or validate
  what they want. MUST run before non-trivial creative, planning, or
  implementation work when the idea is not yet validated. Captures the what and
  why into docs/ideas/. Not for choosing an approach (solution-brainstorming),
  task breakdown (implementation-planning), or writing code.
---

# Idea Discovery (Council)

Read `../_shared/council-protocol.md` before starting. It defines the question
loop, question-tool usage, backlog handling, hard gate, worktree-first rule, and
verification standard. This file defines only the roles, scope, and stages for
idea discovery.

## When to use

- The user states a non-trivial idea, goal, or plan ("I want to…", "I'm thinking
  about…", "Let's create/build/start…"). Do not wait for the word "brainstorm".
- The user asks for help figuring out, refining, or validating what they want.
- A concept needs validation before planning or implementation.

Skip only when the request is trivial and fully specified. Other skills may
invoke this skill to produce a validated idea document before their own steps.

## Scope

Capture **what** the user wants and **why**. Do not choose how to build it.
That belongs to `solution-brainstorming`.

## Council

- **Brainstormer** — asks clarifying questions, gathers context, and synthesizes
  the user's answers into a working definition.
- **Devil's Advocate** — challenges the validity and quality of every decision,
  exposes hidden assumptions and contradictions, and offers a constructive path
  forward with each critique.

## Rules

- **Stay on what and why.** Do not generate solution approaches or choose a
  build path in this skill.
- When a constraint is impossible or contradictory, pause and ask whether to
  revise it or treat it explicitly as an assumption or thought experiment.
- State the agents' internal critique to the user as concise feedback, not as a
  wall of text.
- Worktree first: before writing the idea document or any other file, use the
  `create-worktree-on-change` skill.
- Do not proceed past the hard gate without explicit user confirmation.
- Confirmation and documentation are one atomic step: write and verify the file
  before doing anything else, including loading the next skill.

## Stages

Each stage is a question loop, not a fixed script. Follow the shared protocol.

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

The Devil's Advocate reviews the summary for remaining gaps, contradictions, or
weak assumptions and records either a sign-off or unresolved issues. Ask for
confirmation in the same turn, as described in the shared protocol. Do not
proceed until the user explicitly confirms and all issues are resolved.

### 5. Document the validated idea

Create the document immediately after the hard-gate confirmation.

1. Choose a filename: `docs/ideas/YYYY-MM-DD-<slug>.md`, where `<slug>` is a
   lowercase, hyphen-separated ASCII version of the title.
2. Create the parent directory if needed.
3. Use the **Write tool** to create the file. Printing it in chat is not enough.
4. Verify the file exists, is non-empty, and contains all required sections
   (see below). Re-read it or list it.
5. Return the absolute file path.

### 6. Continue to the solution

Preflight: verify the idea document exists before asking about the solution or
loading `solution-brainstorming`. Then:

1. Tell the user the document path.
2. Ask whether to continue now, with options such as **Continue to solution
   brainstorming** (recommended), **Stop at the idea**, or free text. Skip this
   question if the user already asked for both the idea and the solution.
3. If continuing, load `solution-brainstorming` with the skill tool
   (`name: "solution-brainstorming"`) and pass the idea document path. Do not
   delegate this to a subagent.
4. If the skill tool is unavailable, follow the `solution-brainstorming`
   instructions directly in the main session.
5. If stopping, return the idea document path and end.

## Output artifact

`docs/ideas/YYYY-MM-DD-<slug>.md` with these required sections:

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

## Exit criteria

- The user explicitly confirmed the consolidated summary.
- The Devil's Advocate signed off, or every raised issue is resolved.
- Every major assumption is documented.
- The decision log is complete.
- The idea document exists, is non-empty, contains every required section, and
  its absolute path has been returned.
- The user either continued to solution brainstorming or chose to stop.

## Principles

One question per turn; explicit assumptions; constructive challenge; what before
how; exhaust the backlog; concrete options with a free-text path; user decides;
iterate until satisfied; reusable output.
