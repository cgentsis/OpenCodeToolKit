# Test-driven development skill

## Description

A repo-local skill that makes the red → green → refactor loop the required path
for implementation work. It must stop production code from landing without a
failing test first, make the failing-to-passing evidence repeatable and visible,
give agents a concrete workflow to follow, and keep tests focused on observable
behavior rather than implementation details.

The skill is intentionally a direct software-work capability. It addresses the
gap where the repository's skills govern how work is planned, reviewed, and
handed off, but do not enforce how the code itself is developed.

## Goals and success metrics

Goals:

- Prevent implementation changes that were written before a failing test.
- Make red/green evidence inspectable instead of implied.
- Provide one unambiguous red/green/refactor workflow for agents.
- Improve test quality so tests constrain behavior, not internal structure.
- Reduce downstream regressions from new changes.

Success metrics:

- Every implementation task records a failing test before production code is
  written.
- Task status includes repeatable commands showing the test red, then green.
- Tests assert observable behavior and avoid implementation-detail coupling.
- Downstream bugs and rollbacks attributable to new changes trend down over
  time. Because that is a lagging indicator, the skill should define a practical
  proxy during solution design.

## Audience

- Agents executing `implementation` tasks in this repository.
- Reviewers who need evidence that tests came first.
- Maintainers who want the skill catalog to include direct software-craft
  capabilities, not only planning and governance skills.

## Constraints and non-goals

Constraints:

- The skill must live in this repository and follow the existing skill contract:
  `SKILL.md`, eval files, README/AGENTS registry updates, and validator success.
- Offline skill evaluation must report 0 errors and 0 warnings:
  `node skills/skill-evals/run-evals.js --offline`.
- Worktree-first applies before any file change.
- Enforcement must produce an inspectable artifact; a hard gate without evidence
  is only advice with a stricter name.
- The workflow must fit the existing pipeline rather than replace it.

Non-goals:

- It does not replace `systematic-debugging` for bug root-cause work.
- It does not mandate Jest, a coverage tool, or a specific test runner.
- It does not write production code itself.
- It does not own code review or replace `verification-before-completion`.
  How its evidence feeds review is a solution-stage decision.

## Assumptions

- The user wants a new skill in this repository, not a one-off checklist.
- Task status files are the natural place to record red/green evidence; the
  exact format is a solution-stage decision.
- The broader aim includes rebalancing the catalog toward direct software work.
- Existing skills such as `implementation` and `verification-before-completion`
  remain in place; the TDD skill composes with them.

## Decision log

| Challenge | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| “TDD skill” could mean a gate, a teaching guide, or a test helper; that changes the whole design. | Cover all four stated problems: tests written last, weak red/green evidence, missing workflow, and shallow tests. | Narrow gate; teaching-only skill; test-generation helper. | The user selected every problem, so a single narrow interpretation would under-deliver. |
| “Better tests” is not measurable. | Record four success criteria: failing test first, repeatable red/green evidence, behavioral tests, and fewer regressions. | Coverage percentage; subjective reviewer rating; defect count alone. | The chosen criteria are inspectable at task level, with regressions kept as a lagging outcome. |
| A hard gate needs an inspectable artifact. | Require red/green evidence in task status before implementation is accepted. | Trust the agent's narrative; check only at PR time. | Evidence at the point of work prevents tests-last code instead of detecting it later. |
| Without non-goals, the skill could absorb debugging, framework setup, and code writing. | Explicitly exclude replacing `systematic-debugging`, picking a framework, and writing production code. | Include all testing and debugging concerns; mandate a runner. | Keeps the skill focused and composable with existing skills. |
| “Fewer regressions” cannot be proven inside one task. | Carry it forward as a lagging metric and require a practical proxy in solution design. | Drop the metric; require zero regressions immediately. | Preserves the outcome without making the skill impossible to satisfy. |

## Open questions / next steps

- Define the proxy metric for “fewer regressions” that can be checked locally.
- Decide exactly where red/green evidence is recorded and what minimum commands
  are required.
- Decide whether docs/config-only changes are exempt from the hard gate.
- Decide how the evidence should compose with `implementation`,
  `verification-before-completion`, and later review steps.
- Continue to `solution-brainstorming` to choose the concrete approach.

## Council sign-off

**Brainstormer:** The idea is framed around a concrete problem set and
inspectable outcomes.

**Devil's Advocate:** The what/why is internally consistent. The remaining
questions are solution-stage choices, not contradictions in the idea itself. I
sign off on the idea with those questions explicitly deferred.

**User:** Confirmed on 2026-11-21.

## Solution

### Chosen approach

A standalone `test-driven-development` skill owns the hard gate. It requires
red → green → refactor evidence in the existing plan task status. A minimal,
dependency-free validator blocks task completion when that evidence is missing
or malformed. The `implementation` skill references the TDD skill and invokes
the validator before a task can be marked complete. PR-time checking is a
backstop only; it reuses the same validator so there is one source of truth.

The evidence contract should require the failing command and its observed
failure, the passing command and its observed pass, and a refactor note.
Docs/config-only tasks are exempt when the reason is recorded in task status.

### Alternatives considered

- **Checker-led:** rejected because automation would become the authority and
  the skill would be reduced to documentation around a script.
- **Implementation-led:** rejected because TDD would become a hidden subrule
  without an independently discoverable skill or eval suite.
- **PR-led:** rejected because detecting tests-last code at PR time is too late
  to prevent it. It is kept only as a backstop.
- **Full configurable CLI:** rejected as over-engineering for one repository.
- **Separate test log / commit trailers / no fixed location:** rejected because
  plan task status is already the per-task audit surface and keeps evidence
  with the work it governs.

### Trade-offs

- Adds required structure to task status files.
- Adds one small script and its tests.
- Requires `implementation` and PR-time checks to call the same validator.
- Gains inspectable red/green evidence, a fail-closed implementation handoff,
  and a visible direct software-craft skill in the catalog.

### Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Checkbox theater | Require the command and observed output, not just a checkbox or claim. |
| Brittle task-file format | Define canonical field names, keep the parser minimal, and cover the format with tests. |
| Friction on small changes | Exempt docs/config-only tasks with a recorded reason. |
| Duplicated enforcement logic | One validator used by implementation handoff and PR backstop. |
| “Fewer regressions” is lagging | Use evidence completeness as the local proxy: 100% of applicable tasks have valid red/green records. |

### High-level steps or components

1. Create `skills/test-driven-development/` with `SKILL.md` and eval files.
2. Define the task-status evidence contract: red command + observed failure,
   green command + observed pass, refactor note, and exemption marker.
3. Add a minimal `check-tdd-evidence.js` validator with no new dependencies.
4. Update `implementation` to reference the TDD gate and call the validator
   before marking a task complete.
5. Add a PR-time backstop that reuses the validator over task files associated
   with the change.
6. Update `README.md`, `AGENTS.md`, tests, and eval coverage; verify with the
   skill-set validator and offline eval runner.

### Assumptions

- Plan task files already carry per-task status and are the right audit surface.
- One minimal validator is sufficient; no configurable CLI is needed.
- Existing skills remain in place and compose with the new skill.
- Worktree-first and the existing skill pipeline remain mandatory.

### Decision log

| Challenge | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| Selecting all four approaches is a menu, not a solution. | Standalone skill leads; checker validates; implementation references; PR gate backstops. | Checker-led, implementation-led, PR-led. | Keeps TDD visible while giving it one authoritative gate and one validator. |
| “Fewer regressions” cannot be checked in one task. | Use evidence completeness as the local proxy, targeting 100%. | Defect escape log; no proxy. | It is inspectable now while regressions remain a lagging outcome. |
| A checker that only warns will not stop tests-last code. | Block task completion on missing or invalid evidence. | Warn only; block at PR only; block both. | Prevents the problem at the point of work; PR remains backstop. |
| No exemptions creates ceremony for docs-only changes. | Exempt docs/config-only tasks with a recorded reason. | No exemptions; docs only; per-task judgment. | Avoids busywork without creating a broad loophole. |
| A configurable CLI is over-engineering. | Build one minimal dependency-free validator. | Full CLI; integrate into shared verification runner; no script. | Fits the repo and keeps the failure mode explicit. |
| A text-only checker could become checkbox theater. | Require commands and observed output. | Checkbox fields; narrative only. | Makes evidence auditable rather than merely present. |

### Open questions / next steps

- Choose exact status field names and the minimal acceptable evidence format.
- Decide how the PR backstop identifies the task files associated with a change.
- Decide whether the checker is invoked directly by `implementation` or through
  a shared helper.
- Decide how the docs/config-only exemption is represented and validated.
- Continue to `implementation-planning` with this solution document.

### Council sign-off

**Brainstormer:** The solution is concrete enough to plan: one named skill, one
evidence contract, one validator, and clear supporting roles for implementation
and PR checks.

**Devil's Advocate:** The hierarchy is coherent, each major risk has a
mitigation, and the remaining questions are planning details rather than
solution contradictions. I sign off.

**User:** Confirmed on 2026-11-21.
