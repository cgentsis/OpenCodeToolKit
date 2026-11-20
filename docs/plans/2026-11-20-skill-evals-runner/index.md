# Plan: skill evals runner

## Plan title and summary

Add a modular eval runner under `skills/skill-evals/` that validates eval files
offline by default and offers an advisory opt-in `--live` check using the
`opencode` CLI. Includes a thin `SKILL.md`, documentation, and unit tests.
Root `ARCHITECTURE.md` is updated to reflect the new tool and remove the stale
"no eval runner" non-goal.

## Inputs

- Idea and solution artifact: [`docs/ideas/2026-11-20-skill-evals-runner.md`](../../ideas/2026-11-20-skill-evals-runner.md)
- Architecture source of truth: [`ARCHITECTURE.md`](../../../ARCHITECTURE.md)

## Milestones

- **M1 — Offline core.** Discovery, validation, reporting, and CLI wiring that
  make eval-file defects visible deterministically.
- **M2 — Live adapter and skill wrapper.** Opt-in advisory live checks and the
  skill/documentation surface.
- **M3 — Verification.** Full checks and a dry offline run before handoff.

"Shippable" means all tasks complete, `npm test` passes, `node --check` and
`git diff --check` are clean, and the offline runner exits 0 on the current
eval files.

## Task list

| # | Task | Milestone | Size | Dependencies |
| --- | --- | --- | --- | --- |
| 01 | [Discovery and validation modules](01-discovery-validation.md) | M1 | M | none |
| 02 | [Reporting module and CLI wiring](02-reporting-cli.md) | M1 | M | 01 |
| 03 | [Advisory live adapter](03-live-adapter.md) | M2 | M | 02 |
| 04 | [Skill wrapper and documentation](04-skill-docs.md) | M2 | S | 02, 03 |
| 05 | [Final verification](05-verification.md) | M3 | S | 01–04 |

## Dependency order

01 → 02 → {03, 04} (parallel) → 05. The live adapter and skill/docs are
independent once the CLI contract from 02 is fixed.

## Decision log

1. **Modular library instead of a single script.** Challenge: ceremony versus
   clarity. Decision: separate `discover.js`, `validate.js`, `live.js`,
   `report.js`, plus thin CLI. Alternatives: single script; Jest-based harness;
   shell script. Rationale: testability and future growth.
2. **Live mode advisory only.** Challenge: non-deterministic model output.
   Decision: print query, output snippet, timing; no pass/fail verdict; never a
   CI gate. Alternatives: exit-code or heuristic trigger detection. Rationale:
   avoids false confidence and flaky gates.
3. **No JSON report in v1.** Challenge: future CI consumers. Decision: defer.
   Alternatives: include `--json` now. Rationale: no concrete consumer yet.
4. **Live timeout.** Challenge: hanging subprocesses. Decision: `EVAL_TIMEOUT`
   env var, 30s default. Alternatives: fixed 60s; no timeout. Rationale: bounded
   and configurable.
5. **Architecture updated during planning.** Challenge: `ARCHITECTURE.md`
   listed "no eval runner" as a non-goal. Decision: update layout, add eval
   runner conventions, replace the stale non-goal. Alternatives: defer.
   Rationale: plan must be consistent with the architecture source of truth.

## Risks and assumptions

- Live mode depends on the `opencode` CLI; offline mode must not require it.
- Eval JSON shapes must stay stable; validation rules encode the current shape.
- Subprocess safety: `spawn` with argument arrays and `shell: false`.
- Live output can be large; capture and truncate to a bounded snippet.
- Live mode is advisory; users must not treat it as a release gate.

## Open questions / next steps

- None blocking. Handoff to `implementation` after plan review approval.
