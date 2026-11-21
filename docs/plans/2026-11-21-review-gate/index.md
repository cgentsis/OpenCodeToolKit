# Plan: Review gate offering

## Summary

Deliver a generic `review-gate` skill with a read-only CLI, baseline check
configs, Markdown reports with YAML frontmatter, and a mandatory council
advisory appendix. Add thin `code-review-gate`, `design-review-gate`, and
`specs-review-gate` aliases declared in the core skill's frontmatter, extend the
skill-set validator to enforce the alias registry, and make `review-and-pr`
require an approved, HEAD-fresh `docs/reviews/code.md` before committing or
pushing.

## Inputs

- Idea and solution:
  [docs/ideas/2026-11-21-review-gate.md](../../ideas/2026-11-21-review-gate.md)
- Architecture: [ARCHITECTURE.md](../../../ARCHITECTURE.md)

## Milestones

| Milestone | Goal |
| --- | --- |
| Core runner | Build the `review-gate` skill, CLI, check configs, and report schema. |
| Aliases and docs | Add wrapper aliases, validator support, eval files, registries, and pipeline docs. |
| Enforcement and verification | Wire the report check into `review-and-pr`, add tests, run smoke tests, and verify the full skill set. |

## Task list

| # | Task | Milestone | Size | Dependencies |
| --- | --- | --- | --- | --- |
| 01 | [Author the core skill SKILL.md](./01-core-skill-md.md) | Core runner | M | — |
| 02 | [Implement the review runner and check configs](./02-runner-and-checks.md) | Core runner | L | 01 |
| 03 | [Add core eval files](./03-core-eval-files.md) | Core runner | S | 01 |
| 04 | [Add alias wrapper skills](./04-alias-wrappers.md) | Aliases and docs | S | 01 |
| 05 | [Extend the skill-set validator for aliases](./05-validator-alias-support.md) | Aliases and docs | M | 04 |
| 06 | [Update registries and pipeline docs](./06-registries-and-docs.md) | Aliases and docs | M | 01, 04, 05 |
| 07 | [Enforce the report in review-and-pr](./07-review-pr-enforcement.md) | Enforcement and verification | M | 02 |
| 08 | [Add unit tests for runner, validator, and enforcement](./08-unit-tests.md) | Enforcement and verification | L | 02, 05, 07 |
| 09 | [Run sample review and enforcement smoke tests](./09-smoke-tests.md) | Enforcement and verification | M | 02, 07, 08 |
| 10 | [Final verification and evidence](./10-final-verification.md) | Enforcement and verification | S | 06, 08, 09 |

## Dependency order

Tasks 01–03 build the core. Task 04 depends on the alias registry declared in
01. Task 05 consumes the wrappers. Task 06 updates the registries that task 05
validates. Task 07 introduces the enforcement helpers. Task 08 tests the runner,
validator, and enforcement helpers. Task 09 performs end-to-end smoke tests, and
task 10 runs the full verification set. No parallel tracks are planned.

## Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| Solution shape | CLI core plus three alias wrappers and a council appendix | Standalone code skill; generic-only; separate full skills | User selected the combined approach. |
| Council loop | Mandatory for every review, recorded as an advisory appendix | Opt-in; type-dependent; prompt-only | User selected mandatory; scripted verdict remains authoritative. |
| Report contract | `docs/reviews/<type>.md` with YAML frontmatter | Fixed JSON; timestamped JSON; JSON + Markdown pair | User selected Markdown with frontmatter; `review-and-pr` parses frontmatter. |
| Initial checks | All types run the baseline verification checks | Type-specific checks; code-only checks; user-supplied config | User selected baseline for all types; configs reuse `verify-completion.js`. |
| Alias registry | `aliases:` frontmatter in `review-gate/SKILL.md` | Core `aliases.json`; wrapper `alias_of`; hard-coded constant | User selected core frontmatter; wrappers declare `alias_of` for fail-closed validation. |
| Approval recording | Agent edits report frontmatter after explicit user approval | CLI prompt; separate approve command; implicit on pass | User selected SKILL.md editing; keeps approval explicit and human. |
| Freshness check | `review-and-pr` checks report before commit | Hash pending changes; review after commit; both HEAD and digest | User selected pre-commit check; avoids stale report after the workflow creates a commit. |
| Milestone structure | Three milestones | One; two; per-type | User selected three milestones. |
| Verification strategy | Jest tests, offline evals, sample report, enforcement smoke test | Subsets | User selected all four. |
| Check reuse | Reuse `verify-completion.js` as the baseline runner | Duplicate baseline commands in review-gate | Single source of truth for baseline checks. |

## Risks and assumptions

- Report frontmatter must be parsed without a new dependency; a small local
  parser is required and covered by tests.
- The alias exemption weakens per-wrapper eval coverage; mitigated by a
  fail-closed registry that errors on undeclared aliases and stale declarations.
- `review-and-pr` can now block PRs when no review report exists; mitigation is
  clear error text and the existing `DRY_RUN=yes` preview path.
- The report is written under `docs/reviews/`; the runner must never edit source
  files and must not call `gh`.
- Worktree-first remains mandatory for every file written by implementation.

## Open questions / next steps

- Review approval of this plan is required before implementation.
- After approval, a separate handoff decision is required.
- Live council prompts are exercised manually during the smoke test; offline
  evals validate discovery and schema only.
