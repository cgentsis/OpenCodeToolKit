# Task 03 — Register the PR monitor skill

## Goal and acceptance criteria

Make `pr-lifecycle-monitor` discoverable in the repository registries and
document its options.

Acceptance criteria:

- `AGENTS.md` skill registry includes `pr-lifecycle-monitor` in alphabetical
  order inside the marked registry block.
- `skills/README.md` skill registry includes the same entry in alphabetical
  order.
- `skills/README.md` gains a concise section for the new skill covering when to
  use it, the fixed one-minute poll, per-PR events, default approval mode,
  full-autonomy prompt, stop conditions, and automatic cleanup.
- No existing registry entries are removed or renamed.
- No `opencode.jsonc` change is required because skills are discovered from the
  `skills/` path.

## Files/areas to change

- `AGENTS.md`
- `skills/README.md`

## Architecture impact

Uses the existing skill discovery and registry conventions in
`ARCHITECTURE.md`; no architecture section change beyond the layout entry added
during planning.

## Dependencies and order

Depends on task 01. Tasks 04–08 rely on the skill being discoverable.

## Verification/tests

- Run `node skills/skill-authoring/validate-skill-set.js` and confirm 0 errors
  and 0 warnings.
- Grep both registry blocks to confirm the new entry is present exactly once.
- Read the README section back and confirm all acceptance bullets are described.

## Risks and rollback

- Risk: registry order or marker formatting breaks validation. Mitigation: edit
  only inside the marked blocks and preserve alphabetical order.
- Rollback: revert the two registry files.

## Estimate/size

S

## Milestone mapping

Foundation

## Status

complete — 2026-11-22

Verification evidence: `node skills/skill-authoring/validate-skill-set.js`
reported `Skills discovered: 17`, `Eval suites: 14`, and `Errors: 0`. The marked
registry in `AGENTS.md` contains `pr-lifecycle-monitor` once; the AGENTS pipeline
and `skills/README.md` also describe the monitor's place after `review-and-pr`.
`skills/README.md` contains one `### pr-lifecycle-monitor` section covering the
fixed 60-second poll, per-PR events, default approval card, full-autonomy prompt,
bounded actions, stop conditions, and automatic cleanup.

### TDD Evidence

Exempt: docs/config-only
Reason: Registry and README edits are documentation; no executable behavior changed in this task.
