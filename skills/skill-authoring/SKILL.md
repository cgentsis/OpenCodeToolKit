---
name: skill-authoring
description: >-
  Use when creating, updating, renaming, or removing an OpenCode skill in this
  repository. Produces a complete discoverable skill: SKILL.md, eval files, and
  marked README and AGENTS.md entries, under worktree-first. References global
  skill-creator and writing-skills guidance without copying it. Not for writing
  agents or runbooks, publishing skills, or choosing which other skills to add.
---

# Skill authoring

## When to use

- Adding a new skill under `skills/`.
- Changing an existing skill's `SKILL.md`, description, or eval files.
- Renaming a skill directory or removing a retired skill.
- Auditing whether a skill is discoverable and fully covered by evals.

## Hard rules

1. Use `create-worktree-on-change` before any file change. Never edit the main
   checkout.
2. Every skill must have `evals/evals.json` and `evals/trigger-evals.json`.
3. Every skill must appear inside the marked registry blocks in
   `skills/README.md` and `AGENTS.md`
   (`<!-- skill-registry:start -->` / `<!-- skill-registry:end -->`).
4. Run `node skills/skill-evals/run-evals.js --offline` and
   `node skills/skill-authoring/validate-skill-set.js` before claiming done.
   Both must pass; live checks are advisory only.
5. This skill is a thin repository-specific layer. Consult global
   `skill-creator` and `writing-skills` for generic craft, but keep this
   repository's conventions authoritative.

## Lifecycle operations

### Create

1. Pick a lowercase hyphenated name and create `skills/<name>/SKILL.md` with
   `name` and triggering-focused `description` frontmatter.
2. Write a lean body: when to use, the workflow, hard rules, and boundaries.
   Put reusable conventions in `skills/_shared/` or a reference file rather
   than copying them.
3. Add `evals/evals.json` (`skill_name`, non-empty `evals` with `id`, `prompt`,
   `expected_output`) and `evals/trigger-evals.json` (at least one
   `should_trigger: true` and one `false` query).
4. Add an entry to each marked registry block. If the skill must run before
   other work, add a discovery rule to `AGENTS.md`; otherwise leave it opt-in.

### Update

1. Change only what the task requires. Keep frontmatter description changes
   paired with trigger-eval updates.
2. Re-run both checks from the hard rules. A description change without an
   eval update is incomplete.

### Rename

1. Move the directory, then update `evals.json` `skill_name`, both registry
   entries, any `AGENTS.md` discovery rule, and any references in docs or
   scripts.
2. Run the validator; stale names in eval paths or registry entries are
   failures, not warnings.

### Remove

1. Delete the skill directory, then remove its registry entries, discovery
   rule, and references in `ARCHITECTURE.md` or scripts.
2. Run the validator and the offline eval suite; both must show no stale
   references and no warnings.

## Verification before done

- `node skills/skill-authoring/validate-skill-set.js`
- `node skills/skill-evals/run-evals.js --offline`
- `npm test` when script helpers or tests changed.
- Follow `verification-before-completion` for the final claim; cite observed
  output rather than listing commands.

## Boundaries

Does not author `agents/` or `runbooks/` content, publish skills, add release or
changelog automation, or decide which new skills to add. Does not replace
`idea-discovery`, `solution-brainstorming`, or `implementation-planning` for
non-trivial new capabilities. Does not commit, push, or open a PR.
