# Task 01 — Author the PR monitor SKILL.md

## Goal and acceptance criteria

Create `skills/pr-lifecycle-monitor/SKILL.md` defining the trigger, contract,
and boundaries of the session-only PR monitor.

Acceptance criteria:

- Frontmatter includes `name: pr-lifecycle-monitor` and a description with
  when-to-use and when-not-to-use statements.
- It states that the skill starts after a successful `review-and-pr` handoff and
  tracks only PRs opened or reused by that workflow in the current session.
- It defines the fixed one-minute poll and per-PR `gh event listen`
  subscriptions, with deduplication by comment `id` plus `updated_at`.
- It defines default notify-and-propose behavior with a structured approval
  card offering Approve, Edit, and Skip.
- It defines full autonomy as an explicit start-time prompt whose chosen mode is
  printed in the handoff summary; permitted actions are replies, code fixes and
  pushes, and gate/report refresh.
- It states the hard boundaries: no autonomous merge, no remote deletion, no
  untracked PRs, no persistent state, no user setup such as env vars or repo
  config.
- It states stop conditions: merged, closed, or session end via explicit stop
  hook plus abort signal.
- It states that verified merge triggers `finish-worktree` once and that
  worktree-first applies to every file change.
- It identifies the script entrypoint and eval files as companions.

## Files/areas to change

- `skills/pr-lifecycle-monitor/SKILL.md` (new).

## Architecture impact

Adds a new skill directory under `skills/`. Implements the Repository layout and
Skill pipeline changes already recorded in `ARCHITECTURE.md`.

## Dependencies and order

First task; no dependencies. Tasks 02 and 03 follow it; task 04 depends on its
contract.

## Verification/tests

- Read the file back and confirm every acceptance bullet is present.
- Run `node skills/skill-authoring/validate-skill-set.js` after eval files and
  registry entries exist (task 03), then confirm 0 errors and 0 warnings.

## Risks and rollback

- Risk: the skill becomes a generic GitHub bot manual. Mitigation: keep only the
  trigger, contract, boundaries, stop conditions, and handoff summary.
- Rollback: delete the new skill directory.

## Estimate/size

M

## Milestone mapping

Foundation

## Status

complete — 2026-11-22

Verification evidence: `skills/pr-lifecycle-monitor/SKILL.md` is 3,654 bytes.
Read-back confirmed `name: pr-lifecycle-monitor`, the post-handoff trigger,
per-PR `gh event listen`, fixed 60-second poll, `id + updated_at` dedupe,
structured approval card with Approve/Edit/Skip, bounded full autonomy,
`finish-worktree` once on verified merge, stop conditions with abort signal, and
the no-merge/no-delete/no-persistent-state boundaries. OpenCode reported the new
`pr-lifecycle-monitor` skill as available immediately after the file was
written, confirming discovery.

### TDD Evidence

Exempt: docs/config-only
Reason: SKILL.md is documentation; no executable behavior changed in this task.
