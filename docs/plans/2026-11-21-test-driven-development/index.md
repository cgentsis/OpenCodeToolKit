# Plan: Test-driven development skill

## Summary

Deliver a standalone `test-driven-development` skill that owns the
red → green → refactor hard gate for implementation work. Evidence lives in a
`### TDD Evidence` subsection of each applicable plan task status. A minimal
dependency-free validator is the single source of truth for that evidence;
`implementation` invokes it before completing a task, and `review-and-pr`
reuses it as a PR-time backstop over changed plan task files.

## Inputs

- Idea and solution: [docs/ideas/2026-11-21-test-driven-development.md](../../ideas/2026-11-21-test-driven-development.md)
- Architecture: [ARCHITECTURE.md](../../../ARCHITECTURE.md)

## Milestones

| Milestone | Goal |
| --- | --- |
| Foundation | Create the named skill, its eval files, and registry entries so it is discoverable and validated. |
| Evidence validator | Implement and unit-test the minimal validator that enforces the task-status evidence contract. |
| Integration and verification | Wire the validator into implementation handoff and the PR backstop, then run the full verification bar. |

## Task list

| # | Task | Milestone | Size | Dependencies |
| --- | --- | --- | --- | --- |
| 01 | [Author the TDD skill SKILL.md](./01-skill-md.md) | Foundation | M | — |
| 02 | [Add eval files for the new skill](./02-eval-files.md) | Foundation | S | 01 |
| 03 | [Register the new skill](./03-registry.md) | Foundation | S | 01 |
| 04 | [Implement the evidence validator](./04-evidence-validator.md) | Evidence validator | M | 01, 02 |
| 05 | [Unit-test the validator](./05-validator-tests.md) | Evidence validator | M | 04 |
| 06 | [Integrate with implementation handoff](./06-implementation-integration.md) | Integration and verification | S | 04, 05 |
| 07 | [Add the PR-time backstop](./07-pr-backstop.md) | Integration and verification | M | 04, 05 |
| 08 | [Final verification and evidence](./08-final-verification.md) | Integration and verification | S | 02, 03, 05, 06, 07 |

## Dependency order

Tasks run in numeric order. Task 01 defines the contract that tasks 02, 03,
04, and 06 depend on. Task 04 builds the validator; tasks 05, 06, and 07 depend
on it. Task 05 must pass before the validator is wired into other workflows.
Tasks 06 and 07 can proceed in parallel after task 05, but the plan keeps them
numbered for clear verification. Task 08 waits for all earlier work.

## Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| Evidence format | A `### TDD Evidence` subsection with Red, Green, and Refactor lines containing commands and observed output | Checklist bullets; frontmatter; free-form prose | Stable enough to validate without heavy YAML. |
| PR backstop scope | Validate `docs/plans/**/*.md` files changed relative to the PR base | PR body links; all plan files; no backstop | Avoids false failures on historical tasks and hand-written links. |
| Checker invocation | `implementation` runs it before completing a non-exempt task | Global verification baseline; PR only; manual | Blocks tests-last code at the point of work without polluting unrelated checks. |
| Exemption representation | `Exempt: docs/config-only` plus a one-line reason in the TDD Evidence section | Separate status value; frontmatter flag; no marker | Keeps the exemption beside the evidence and makes the reason auditable. |
| Architecture scope | Update Repository layout and add a TDD conventions section | Layout only; pipeline note only; no change | The evidence contract and single validator are architectural conventions. |
| Milestone structure | Three milestones | Two; four; one | Separates skill discovery, validator correctness, and integration. |
| Verification checks | Baseline checks, skill-set validator, offline evals, and manual smoke test | Subsets of these | Matches the repository's accepted bar for new skills and safety-critical helpers. |
| Validator scope | One minimal dependency-free script with pure helpers and a CLI | Configurable CLI; integrate into shared verification; no script | Fits one repository and gives implementation and PR one source of truth. |
| Local regression proxy | Evidence completeness at 100% of applicable tasks | Defect log; no proxy | Inspectable now; lagging regressions remain the long-term outcome. |

## Risks and assumptions

- The task-status format is text-based; a brittle parser could reject valid
  variants. Mitigation: canonical field names plus unit and smoke tests.
- The PR backstop could produce false positives on historical plan files.
  Mitigation: scan only plan task files changed relative to the PR base.
- The docs/config-only exemption could be abused. Mitigation: require an
  explicit exemption line and a one-line reason.
- `implementation` could skip the validator. Mitigation: the skill text makes
  the call mandatory and failure blocks task completion.
- No new runtime dependency; the validator uses Node built-ins only.
- Worktree-first applies to every file written by this plan's implementation.

## Open questions / next steps

- Review and approve this plan before implementation; approval here does not
  itself authorize code changes.
- After approval, make a separate handoff decision to `implementation`.
- No solution-level open questions remain; exact helper internals are left to
  implementation within the contracts above.
