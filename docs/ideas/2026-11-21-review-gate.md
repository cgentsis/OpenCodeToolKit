# Review gate offering

## Description

A generic `review-gate` skill that accepts a `--type` flag (`code`, `design`,
`specs`, or future types) and produces a standardized, read-only review report.
Three thin wrappers — `code-review-gate`, `design-review-gate`, and
`specs-review-gate` — set the type for common use cases without duplicating the
core logic. The gate runs after an artifact is produced and before it is handed
off; for code, `review-and-pr` must require an approved report for the current
HEAD before committing or pushing.

The gate is strictly read-only: it runs configured checks, writes only a review
report, and never modifies source files. Fixes are routed back to
`implementation` or `systematic-debugging`.

## Goals and success metrics

- Provide one reusable review mechanism for code, design, and specifications.
- Produce a consistent report format that downstream tooling (including
  `review-and-pr`) can verify.
- Enforce a quality checkpoint between `implementation` and `review-and-pr`.
- `node skills/skill-evals/run-evals.js --offline` reports 0 errors and 0
  warnings for the whole skill set.
- A sample review run produces a report containing check results (pass/fail),
  command output, and an explicit reviewer approval flag.

## Audience

- Authors who want pre-PR validation of code, design artifacts, or specs.
- Reviewers and maintainers who need a repeatable, auditable review record.
- CI consumers of a uniform report format (the gate itself is not a CI gate).

## Constraints and non-goals

Constraints:

- Worktree-first applies to every file the gate writes.
- Baseline `verification-before-completion` checks must pass before a review
  report can be approved.
- The gate writes only the review report; source files are never modified.
- All new skills must be registered in the marked `AGENTS.md` and
  `skills/README.md` registry blocks and carry both eval files.
- `review-and-pr` must fail closed when the review report is missing or stale
  relative to HEAD.

Non-goals:

- No auto-fixes, patch application, or source edits.
- No CI gate or remote checks; the gate is local and advisory until approved.
- No publishing, release automation, or external service integration.
- No replacement for `systematic-debugging`, `verification-before-completion`,
  or the council skills' hard gates.

## Assumptions

- Checklists can be expressed as commands in a type-specific config file.
- `review-and-pr` can compare a report's recorded HEAD with the current HEAD.
- Wrappers can delegate to the core skill without their own eval suites.
- Globally available review skills, if any, are complementary, not replaced.

## Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| Standalone or hybrid? | Hybrid: generic core plus three thin wrappers | Standalone code review only; generic only; code now/wrappers later | User selected hybrid; avoids duplication while giving friendly names. |
| What proves success? | Clean offline evals plus an approval-bearing report | Enforce every PR; interchangeable wrappers; user approval alone | Measurable with existing tooling and directly testable. |
| May the gate fix issues? | No — strictly read-only report | Auto-fix; propose patches; fix and approve | Keeps review separate from implementation and debugging. |
| How is the gate enforced? | Required handoff: `review-and-pr` checks for an approved report | Optional advisory; docs-only rule; ask each time | Prevents PRs without a review while keeping the check local. |

## Open questions / next steps

- Define the exact commands in each type-specific checklist.
- Choose the report path format and HEAD-record field.
- Decide how wrappers are implemented (delegating `SKILL.md` vs script flag).
- Resolve these during `solution-brainstorming`, then move to
  `implementation-planning`.

## Council sign-off

- Brainstormer: accepts the hybrid offering with a read-only report and a
  required handoff into `review-and-pr`.
- Devil's Advocate: signs off with caveats that the enforcement check must fail
  closed on a missing or stale report and that wrappers must not duplicate the
  core's eval files.

## Solution

### Chosen approach

A config-driven `review-gate` CLI core that accepts `--type code|design|specs`,
loads a checklist from `skills/review-gate/checks/<type>.json`, runs the listed
commands, and writes a standardized read-only report. Three thin alias wrappers
(`code-review-gate`, `design-review-gate`, `specs-review-gate`) set the type.
The wrappers are declared in a machine-readable `aliases:` registry in the core
skill; `validate-skill-set.js` recognizes them as aliases and does not require
separate eval files, but fails closed on undeclared wrappers.

Every review also runs a council loop (Reviewer + Devil's Advocate). Its
questions and findings are appended to the report as an **advisory appendix**.
The scripted verdict is authoritative: a failed check can never be flipped to
approved by the council. `review-and-pr` reads the report's recorded HEAD and
approved flag and refuses to proceed when the report is missing or stale.

### Alternatives considered

- **A only** — rejected: no human judgment for ambiguous design or specs cases.
- **E only** — rejected: not mechanically verifiable and cannot enforce HEAD
  freshness.
- **B — separate standalone skills** — rejected: three eval suites to maintain
  and a high drift risk.
- **C — prompt-only checklists** — rejected: consistency depends on discipline
  and HEAD checks cannot be automated.
- **D — extend `verification-before-completion`** — rejected: blurs a
  completion-verification skill into a review tool.

### Trade-offs

- More moving parts: CLI, per-type check configs, council stage, and enforcement
  hook.
- Alias wrappers weaken per-skill eval coverage, offset by a fail-closed alias
  registry.
- Council interaction adds time; mitigated by making it an appendix with a
  clearly advisory status.

### Risks and mitigations

- **Unknown or stale aliases:** validator checks aliases against the core
  registry and fails on undeclared wrappers.
- **Stale report:** the report records HEAD; `review-and-pr` refuses when it does
  not match the current HEAD.
- **Council overriding failures:** report has separate `scripted_verdict` and
  `advisory_notes` fields; approval requires all scripted checks to pass.
- **Unintended edits:** the gate writes only the report path; no source files are
  modified.
- **Baseline drift:** `verification-before-completion` must pass before the
  report can be marked approved.

### High-level steps or components

1. Add `skills/review-gate/SKILL.md` with triggering description, when-to-use,
   type flag, council appendix behavior, and the aliases registry.
2. Add `skills/review-gate/run.js` that parses `--type`, loads a check config,
   runs commands, captures output, records HEAD, and writes a report.
3. Add `skills/review-gate/checks/code.json`, `design.json`, and `specs.json`
   with the initial command lists.
4. Add `evals/evals.json` and `evals/trigger-evals.json` for the core skill.
5. Add three alias wrapper `SKILL.md` files that delegate to the core and are
   listed in the aliases registry.
6. Extend `validate-skill-set.js` to accept declared aliases and reject unknown
   ones.
7. Extend `review-and-pr` to require an approved, HEAD-fresh report before
   commit/push/PR.
8. Update `ARCHITECTURE.md`, `AGENTS.md`, and `skills/README.md` registry and
   pipeline sections; add unit tests for CLI helpers and the enforcement hook.

### Assumptions

- Checklists are expressible as deterministic local commands.
- The report format can be parsed by `review-and-pr` without new dependencies.
- Wrappers are aliases, not independent skills, for eval purposes.
- Worktree-first and baseline verification remain mandatory.

### Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| How do wrappers meet eval coverage? | Alias exemption via declared registry | Minimal delegating evals; wrappers as scripts; duplicated evals | Avoids duplication while keeping validation fail-closed on unknown aliases. |
| Which types use council review? | All types, as advisory appendix | Design only; design and specs; optional add-on | Preserves human judgment without allowing it to override deterministic checks. |
| Combined or single approach? | A + E combined | A only; E only | Balances enforceability with nuance. |
| Can the gate edit files? | No — report only | Auto-fix; propose patches | Keeps review separate from implementation and debugging. |

### Open questions / next steps

- Define the report path and schema (`head`, `scripted_verdict`,
  `advisory_notes`, `approved`).
- Choose exact commands for each type's checklist.
- Decide whether the council loop is mandatory or opt-in per run.
- Move to `implementation-planning` with this solution as the input artifact.

### Council sign-off

- Brainstormer: accepts the CLI-core-plus-council-appendix design as the most
  complete and enforceable offering.
- Devil's Advocate: signs off with caveats that the alias registry must be
  machine-readable and fail closed, and that the council section must never flip
  a failed scripted verdict to approved.
