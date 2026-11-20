# Plan: verification before completion

## Plan title and summary

Add a `verification-before-completion` skill that enforces observed evidence
before any completion claim or handoff. It includes a `SKILL.md`, eval files, an
optional baseline-check helper using Node built-ins, body-only pointers from
three existing skills, documentation, and Jest tests. Root `ARCHITECTURE.md` is
updated with layout and verification conventions.

## Inputs

- Idea and solution artifact:
  [`docs/ideas/2026-11-20-verification-before-completion.md`](../../ideas/2026-11-20-verification-before-completion.md)
- Architecture source of truth: [`ARCHITECTURE.md`](../../../ARCHITECTURE.md)

## Milestones

- **M1 — Skill artifact.** The skill and eval files exist and validate.
- **M2 — Helper and documentation.** The optional helper and cross-links make
  the skill usable and discoverable.
- **M3 — Verification.** Full checks pass and behavior is demonstrated.

"Shippable" means all tasks complete, `npm test` passes, `node --check` and
`git diff --check` are clean, `skill-evals --offline` exits 0, and the helper
demonstrably fails when a baseline check fails.

## Task list

| # | Task | Milestone | Size | Dependencies |
| --- | --- | --- | --- | --- |
| 01 | [Skill definition and eval files](01-skill-and-evals.md) | M1 | M | none |
| 02 | [Optional baseline-check helper](02-helper-script.md) | M2 | M | 01 |
| 03 | [Cross-links and documentation](03-cross-links-docs.md) | M2 | S | 01, 02 |
| 04 | [Final verification](04-verification.md) | M3 | S | 01–03 |

## Dependency order

01 → 02 → 03 → 04. The helper's contract depends on the skill's evidence bar;
documentation depends on both. No parallel tracks in this small plan.

## Decision log

1. **Hybrid guidance plus optional helper.** Challenge: script or no script.
   Decision: `SKILL.md` with an optional `verify-completion.js`. Alternatives:
   guidance only; required gate. Rationale: better evidence capture without a
   new gate.
2. **Helper is never required.** Challenge: optional tooling becoming a de
   facto gate. Decision: skill accepts manually gathered evidence; script is an
   accelerator. Alternatives: require script output. Rationale: honors the idea
   constraint and avoids drift.
3. **No doc-only exemption.** Challenge: cost versus simplicity. Decision:
   always run the baseline. Alternatives: documented exception; agent
   discretion. Rationale: cheap and easy to eval.
4. **Body-only cross-links.** Challenge: discoverability versus trigger
   overlap. Decision: pointers in skill bodies, not frontmatter. Alternatives:
   shared protocol; none. Rationale: keeps triggers distinct.
5. **`node --check` scope.** Challenge: which files to check. Decision: all
   tracked `.js` files. Alternatives: changed files only; caller-supplied paths.
   Rationale: deterministic and complete without git-diff parsing.
6. **Architecture updated during planning.** Challenge: verification
   conventions needed a new rule. Decision: update layout and verification
   sections now. Alternatives: defer. Rationale: plan must match the source of
   truth.

## Risks and assumptions

- Baseline command list in the helper can drift from the docs; mitigate with a
  single constant and docs pointing to the skill.
- Fresh worktrees may lack `node_modules`; the helper must report that clearly
  rather than passing.
- The helper prints command output but its exit code is advisory to the skill;
  the skill, not the script, decides whether a claim is allowed.
- No new dependencies; only Node built-ins are used.
- Worktree-first applies to all edits.

## Open questions / next steps

- None blocking. Handoff to `implementation` after plan review approval.
