# Skill authoring

## Description

A repository-local skill that guides the creation and update of OpenCode skills
in this toolkit end to end. Its deliverable is a complete, discoverable skill:
a `SKILL.md` with triggering-focused frontmatter, eval files, a README section,
and any required `AGENTS.md` discovery rule, all performed under the mandatory
worktree-first rule.

It is a thin repository-specific layer. It may reference globally available
`skill-creator` and `writing-skills` guidance for generic skill-writing craft,
but it owns this repository's conventions: `skills.paths` discovery,
`evals/evals.json` and `evals/trigger-evals.json`, the council protocol, the
worktree-first gate, and the verification bar.

## Goals and success metrics

- Make adding or updating a skill a repeatable, self-contained workflow instead
  of a manual read of `README.md`, `AGENTS.md`, and `ARCHITECTURE.md`.
- Every skill in the repository ships with `evals/evals.json` and
  `evals/trigger-evals.json`.
- `node skills/skill-evals/run-evals.js --offline` reports **0 errors and 0
  warnings** after the skill is used, including the two existing gaps:
  `create-worktree-on-change` and `review-and-pr`.
- A new skill is discoverable by OpenCode through `SKILL.md` alone, with no
  manual registration step beyond `skills.paths`.
- README and `AGENTS.md` stay in sync with the skill set.

## Audience

- Contributors and agents working inside this repository who add or change a
  skill.
- Maintainers who need consistency across a growing skill set.

## Constraints and non-goals

Constraints:

- Worktree-first applies to every file the skill writes.
- Offline eval validation is the accepted quality bar; live model checks remain
  advisory and are never a gate.
- The skill must be a thin repository-specific layer: reuse global
  skill-writing guidance where it helps, but do not reimplement it wholesale.
- No new runtime dependencies; conventions come from existing scripts and docs.
- Existing pipeline stages (`idea-discovery` → `solution-brainstorming` →
  `implementation-planning` → `implementation` → `review-and-pr` →
  `finish-worktree`) are not changed by this idea.

Non-goals:

- Authoring `agents/` or `runbooks/` content.
- Publishing skills to a marketplace or any release/changelog automation
  (an explicit non-goal in `ARCHITECTURE.md`).
- Replacing or vendoring the global `skill-creator`, `writing-skills`, or
  `find-skills` skills.
- Deciding which *other* new skills to add; that backlog is tracked separately.

## Assumptions

- OpenCode discovers skills only from `SKILL.md` files under `skills.paths`;
  `manifest.jsonc` files are illustrative and not dispatched.
- `skills/skill-evals/run-evals.js --offline` is the authoritative check for
  eval completeness and schema.
- The two missing eval suites can be authored without changing the behavior of
  `create-worktree-on-change` or `review-and-pr`.
- Globally available skills remain present in the environment and may be
  referenced rather than copied.

## Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| What does "skill authoring" mean? | A repo-local skill that produces a complete, discoverable skill | Writing only `SKILL.md` prose; scaffold plus checklist; idea document only; audit-only | The user selected "Complete discoverable skill": the deliverable must be registered, documented, and validated, not just drafted. |
| What proves the skill works? | Zero errors and zero warnings from offline eval validation | No manual convention lookup; full artifact trail; no trigger conflicts | Measurable with an existing command and directly exposes the two known gaps. |
| Does the zero-warning bar include existing skills? | Yes — retrofit evals for `create-worktree-on-change` and `review-and-pr` in the same idea | New skills only; separate follow-up; block creation without evals | Without the retrofit the success metric is unachievable on day one, so it is in scope. |
| How to handle overlap with global `skill-creator` / `writing-skills`? | Thin repository-specific layer that references global guidance | Self-contained replacement; ignore global skills; adopt them locally | Avoids duplicated triggers and maintenance while keeping repo conventions authoritative. |
| Should release/changelog automation be included? | No | Include it | `ARCHITECTURE.md` lists it as an explicit non-goal. |

## Open questions / next steps

- Does "update" include renaming or removing a skill, and what checks apply to
  those operations?
- Must every new skill pass through `idea-discovery`, or only non-trivial ones?
- How should the skill treat script-backed skills versus guidance-only skills?
- What should the two retrofitted eval files assert, especially for
  script-backed skills?
- Resolve these during `solution-brainstorming`, then move to
  `implementation-planning`.

## Council sign-off

- Brainstormer: accepts the idea as scoped — a complete, discoverable skill as
  the deliverable, with offline eval validation as the success metric.
- Devil's Advocate: signs off with caveats that the "thin layer" boundary must
  be explicit so the new skill does not silently reimplement global guidance,
  and that the open questions must be resolved during solution brainstorming
  rather than left vague.

## Solution

### Chosen approach

A guidance-only `skill-authoring` `SKILL.md` plus one thin, read-only validator
script. The skill owns the create/update workflow and references global
`skill-creator` and `writing-skills` guidance where useful. The validator checks
that every skill has `evals/evals.json` and `evals/trigger-evals.json`, that
README and `AGENTS.md` contain clearly marked entries for each skill, and that
each `SKILL.md` is discoverable under `skills.paths`. It prints a report and
changes no files. The skill never creates or patches files automatically, so
worktree-first and human review remain in force.

### Alternatives considered

- **A — Guidance-only plus a task-specific check in
  `verification-before-completion`.** Rejected: it couples two skills and has
  no dedicated check for README/AGENTS.md sync or discovery.
- **B — Scaffolder plus validator.** Rejected: more code and tests, patch
  suggestions are easy to forget, and generating prose adds little value over
  a clear checklist.
- **D — Extend `skill-evals` to own authoring checks.** Rejected: it blurs a
  validation-only skill's boundary. A shared helper may still be reused for
  schema checks, but the user-facing workflow stays in `skill-authoring`.
- **B + C combined.** Rejected: unnecessary complexity for the stated success
  metric.

### Trade-offs

- No scaffolding automation; agents still write `SKILL.md` and eval content.
- Doc-sync checks depend on explicit markers rather than free-form prose.
- One small Node script to maintain and test, using built-ins only.
- Keeps human judgment over content while making the acceptance bar mechanical.

### Risks and mitigations

- **Brittle doc checks:** require clearly marked README and `AGENTS.md`
  sections; report missing markers as failures rather than guessing.
- **Duplicated validation logic:** delegate eval schema checks to the existing
  `skill-evals` helpers instead of reimplementing them.
- **Drift from global guidance:** reference global skills rather than restating
  their advice; document the boundary in the skill body.
- **Scope creep into CI:** the validator is a local completion check, not a CI
  gate; live checks remain advisory.
- **Retrofit gaps:** include `create-worktree-on-change` and `review-and-pr`
  eval files in the same work, with tests for the two script-backed skills.

### High-level steps or components

1. Add `skills/skill-authoring/SKILL.md` with triggering-focused frontmatter,
   the create/update workflow, worktree-first gate, and the global-guidance
   boundary.
2. Add `evals/evals.json` and `evals/trigger-evals.json` for the new skill.
3. Add a thin read-only validator script that checks eval file presence, marked
   README/`AGENTS.md` entries, and `SKILL.md` discovery; reuse `skill-evals`
   helpers for schema validation.
4. Add a README section describing the skill and its inputs/outputs, using a
   marker the validator can recognize.
5. Add an `AGENTS.md` discovery rule only if the skill must run before other
   work; otherwise document that it is opt-in.
6. Retrofit `evals/evals.json` and `evals/trigger-evals.json` for
   `create-worktree-on-change` and `review-and-pr`.
7. Add unit tests for the validator helpers and verify the offline eval run
   reports 0 errors and 0 warnings.
8. Update `ARCHITECTURE.md` and `skills/README.md` to reflect the new skill and
   validator conventions.

### Assumptions

- Marked README and `AGENTS.md` sections can be defined and maintained.
- The validator uses Node built-ins and introduces no runtime dependency.
- Worktree-first continues to apply to every file written.
- Globally available skills remain present and may be referenced, not copied.
- The two eval retrofits require no behavior change to their skills.

### Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| Can a guidance-only skill meet the zero-warning bar? | Not alone; pair it with a thin read-only validator | Add a check to `verification-before-completion`; new script; advisory only | A dedicated check covers eval, doc, and discovery gaps without coupling skills. |
| What should the validator check? | Eval files, marked README/`AGENTS.md` entries, and `SKILL.md` discovery | Eval files only; evals + discovery; trigger quality via live checks | Covers every success criterion while staying deterministic and offline. |
| How should the scaffolder handle shared docs? | Not applicable — no scaffolder; docs stay manual | Patch suggestions; auto-write all; skip docs | Avoids clobbering user work and forgotten patches. |
| How to avoid duplicating eval validation? | Reuse `skill-evals` helpers for schema checks | Reimplement schema checks; ignore schema | Single source of truth for eval validity. |
| Should the validator be a CI gate? | No; local completion check only | CI gate; advisory with no enforcement | Follows the repo's existing offline/advisory conventions. |

### Open questions / next steps

- Define the exact README and `AGENTS.md` marker format.
- Confirm which `skill-evals` helpers are exported and reusable by the
  validator.
- Decide what the two retrofitted eval files should assert for script-backed
  skills.
- Resolve whether "update" includes renaming or removing a skill.
- Move to `implementation-planning` with this solution as the input artifact.

### Council sign-off

- Brainstormer: accepts the chosen guidance-plus-validator approach as the
  smallest solution that satisfies the zero-warning success metric.
- Devil's Advocate: signs off with caveats that the marker format must be
  defined before planning and that the validator must reuse `skill-evals`
  rather than duplicating schema checks.
