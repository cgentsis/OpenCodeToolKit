---
name: solution-brainstorming
description: >-
  Use when the user wants to figure out how to achieve a validated idea, or
  when idea-discovery hands off. Turns the what and why into a documented
  solution: alternatives, trade-offs, critique, chosen approach, and decision
  log. Requires a documented idea artifact. Not for validating the idea itself
  (idea-discovery), task breakdown (implementation-planning), or writing code.
---

# Solution Brainstorming (Council)

Read `../_shared/council-protocol.md` before starting. It defines the question
loop, question-tool usage, backlog handling, hard gate, worktree-first rule, and
verification standard. This file defines only the roles, scope, and stages for
solution brainstorming.

## When to use

- `idea-discovery` produced a validated idea document and the user wants to
  continue into the solution.
- The user asks how to build, implement, achieve, or approach something whose
  what and why are already clear.
- The user wants alternatives, trade-offs, or a chosen approach for a known
  idea.

Do not use this skill to capture what the user wants or why. If the idea is not
yet validated, use `idea-discovery` first.

## Input

This skill builds on an existing, documented idea. Before asking anything:

1. Accept an idea document path or a confirmed idea summary.
2. If given a path, read the document.
3. If the path is missing or unreadable, stop. **Do not create the idea document
   from this skill.** Tell the user it is missing, offer to load
   `idea-discovery`, and continue only after the document exists. A summary
   alone is not a substitute for the document.
4. Extract the goals, success metrics, constraints, non-goals, assumptions, and
   open questions that bound the solution.
5. Never re-ask what the idea document already answers.
6. If the user provides a confirmed summary but there is no document, load
   `idea-discovery` first so the idea is written down, then continue here.

## Scope

Stay on **how**. Do not reopen the what or why unless the idea document is
contradictory or missing something the solution depends on. Choose an approach
and document it; do not break it into tasks or implement it.

## Council

- **Brainstormer** — proposes solution approaches, asks clarifying questions,
  and synthesizes the user's answers into a working solution.
- **Devil's Advocate** — challenges feasibility, risk, cost, complexity,
  dependencies, and hidden assumptions, and offers a constructive path forward
  with each critique.

## Rules

- Generate 3–5 genuinely different approaches before converging.
- Do not choose an approach for the user; present the alternatives and let them
  select which to deepen.
- Worktree first: before writing the solution artifact or any other file, use
  the `create-worktree-on-change` skill.
- The skill is not complete until the solution artifact exists on disk and has
  been verified.

## Stages

Each stage is a question loop, not a fixed script. Follow the shared protocol.

### 1. Load and confirm the idea

Read the idea document and summarize the parts that constrain the solution:
goals, success metrics, constraints, non-goals, assumptions, and open questions.
Ask one question only if something required for choosing a solution is missing
or contradictory.

### 2. Frame the solution space

Establish what "done" means for the solution and any must-use, must-avoid, or
preferred resources and approaches not already in the idea document. The
Brainstormer elicits these; the Devil's Advocate tests them for realism and
hidden assumptions.

### 3. Generate alternatives

The Brainstormer proposes 3–5 genuinely different approaches. Present each
concisely: name, one-line description, and main trade-off.

The Devil's Advocate critiques each for feasibility, risk, cost, complexity,
dependencies, and hidden assumptions, and suggests improvements or hybrids.

Then ask which approaches to develop further, using multiple selection. Do not
choose for them.

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

The Devil's Advocate reviews for remaining gaps or contradictions and records a
sign-off or unresolved issues. Ask for confirmation in the same turn, as
described in the shared protocol. Do not proceed until the user explicitly
confirms and all issues are resolved.

### 6. Document the solution

Create the solution artifact immediately after the hard-gate confirmation.

Default: append a `## Solution` section to the idea document. If the user
prefers a separate file, create
`docs/solutions/YYYY-MM-DD-<slug>-solution.md` and link to it from the idea
document.

Use the **Write** or **Edit** tool to write the artifact. Do not merely print it
in chat. Verify the file exists, is non-empty, and contains all required
sections (see below), then return its absolute path.

### 7. Hand off to planning

Preflight: verify the solution artifact exists before handing off. Then ask
whether the user wants an implementation plan. Do not implement the solution in
this skill.

If the user wants a plan, load `implementation-planning` with the skill tool
(`name: "implementation-planning"`) and pass the solution artifact path. Do not
delegate this to a subagent. If the skill tool is unavailable, follow the
`implementation-planning` instructions directly in the main session.

## Output artifact

The `## Solution` section or solution file contains these required sections:

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

## Exit criteria

- The user explicitly confirmed the consolidated solution summary.
- The Devil's Advocate signed off, or every raised issue is resolved.
- Every major assumption is documented.
- The decision log is complete.
- The solution artifact exists, is non-empty, contains every required section,
  and its absolute path has been returned.

## Principles

One question per turn; build on the idea; how not what; explicit assumptions;
constructive challenge; explore before choosing; exhaust the backlog; concrete
options with a free-text path; user decides; reusable output.
