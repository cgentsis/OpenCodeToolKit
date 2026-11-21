# Plan: Skill authoring

## Summary

Deliver a repo-local `skill-authoring` skill that governs the full skill
lifecycle (create, update, rename, remove) and a thin read-only validator that
checks eval coverage, marked README/AGENTS.md registry entries, and `SKILL.md`
discovery. Retrofit eval files for the two existing skills that lack them, so
`node skills/skill-evals/run-evals.js --offline` reports 0 errors and 0 warnings.

## Inputs

- Idea and solution: [docs/ideas/2026-11-21-skill-authoring.md](../../ideas/2026-11-21-skill-authoring.md)
- Architecture: [ARCHITECTURE.md](../../../ARCHITECTURE.md)

## Milestones

| Milestone | Goal |
| --- | --- |
| Delivery | One sequential delivery ending with a clean offline eval run and passing Jest tests. Checkpoints are recorded after each task's verification. |

## Task list

| # | Task | Milestone | Size | Dependencies |
| --- | --- | --- | --- | --- |
| 01 | [Author the skill SKILL.md](./01-skill-md.md) | Delivery | M | — |
| 02 | [Add eval files for the new skill](./02-eval-files.md) | Delivery | S | 01 |
| 03 | [Add marked registry sections](./03-registry-markers.md) | Delivery | M | 01 |
| 04 | [Implement the read-only validator](./04-validator.md) | Delivery | M | 02, 03 |
| 05 | [Unit-test validator helpers](./05-validator-tests.md) | Delivery | M | 04 |
| 06 | [Retrofit create-worktree-on-change evals](./06-retrofit-worktree-evals.md) | Delivery | S | 02 |
| 07 | [Retrofit review-and-pr evals](./07-retrofit-review-pr-evals.md) | Delivery | S | 02 |
| 08 | [Final verification and evidence](./08-final-verification.md) | Delivery | S | 05, 06, 07 |

## Dependency order

Tasks run in numeric order. Task 02 establishes the eval-file format used by
06 and 07. Task 03 defines the registry markers consumed by 04. Task 05 depends
on the helpers from 04. Task 08 waits for tests and both retrofits. No parallel
tracks are planned; the single milestone keeps sequencing explicit.

## Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| Does "update" include rename and remove? | Yes — full lifecycle | Create/update only; rename only; remove only | User selected full lifecycle; validator must check for stale references after rename/remove. |
| Milestone structure | One milestone | Two; three; per-operation | User selected one milestone; task-level verification provides the checkpoints. |
| Architecture sections to change | Repository layout, script-backed convention, eval runner conventions, verification conventions | Subset; no-impact entry | User selected all four; each edit stays concise. |
| Verification strategy | Jest unit tests plus offline eval run | Add creation smoke test; add rename/remove smoke test; offline only | User selected these two; unit tests must cover rename/remove helper behavior explicitly. |
| Registry marker format | `<!-- skill-registry:start -->` / `<!-- skill-registry:end -->` blocks in README and AGENTS.md, with one entry per skill inside | Free-form prose matching; generated registry file | Deterministic to validate, low brittleness, no new generated artifact. |
| Validator location | `skills/skill-authoring/validate-skill-set.js` | Root-level script | Colocated with the skill it supports. |
| Rename/remove checks | Validator checks for stale names in eval paths and marked registry entries; SKILL.md gives a cleanup checklist | Ignore rename/remove after creation | Prevents orphaned docs and eval references. |
| Eval schema checking | Reuse `discoverSkills` and `validateSkill` from `skills/skill-evals/` | Reimplement schema checks | Single source of truth; no duplicated logic. |

## Risks and assumptions

- Restructuring README and AGENTS.md into marked blocks may conflict with
  future edits; mitigation is a small, clearly delimited block and git rollback.
- Renaming or removing a skill can leave stale references; mitigation is the
  validator's stale-name check and the cleanup checklist in the skill body.
- Validator tests mock the filesystem; the final offline eval run provides the
  real end-to-end check.
- Node built-ins only; no new runtime dependency.
- Worktree-first applies to every file written by the skill and by this plan's
  implementation.

## Open questions / next steps

- Review approval is required before implementation; approval of this plan does
  not itself authorize code changes.
- After approval, a separate handoff decision is required.
- Definition of the marker format could be revisited if the registry grows too
  large for a single block.
