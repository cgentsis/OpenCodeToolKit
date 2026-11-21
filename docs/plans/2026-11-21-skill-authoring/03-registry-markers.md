# Task 03 — Add marked registry sections

## Goal and acceptance criteria

Wrap the skill listings in `README.md` and `AGENTS.md` with
`<!-- skill-registry:start -->` / `<!-- skill-registry:end -->` markers and list
every registered skill inside each block.

Acceptance criteria:

- Both files contain exactly one start and one end marker.
- Every directory under `skills/` with a `SKILL.md` appears inside both blocks.
- No skill is listed twice in the same block.

## Files/areas to change

- `skills/README.md` — mark and normalize the "Available skills" listing (the
  root `README.md` is a two-line stub, so the plan's generic `README.md`
  reference resolves here).
- `AGENTS.md` — mark and normalize the skill pipeline / discovery listing.

## Architecture impact

No `ARCHITECTURE.md` change; this implements the registry convention the
validator will check.

## Dependencies and order

Depends on Task 01 so the new skill can be included. Task 04 consumes these
markers.

## Verification/tests

- `grep -n "skill-registry:" README.md AGENTS.md` shows one start and one end
  marker per file.
- Compare the listed names with `Get-ChildItem skills -Directory` entries that
  contain `SKILL.md`.

## Risks and rollback

- Risk: large README/AGENTS.md edits conflict with other work. Mitigation: keep
  the marked block small and delimited.
- Rollback: `git checkout -- README.md AGENTS.md`.

## Estimate/size

M

## Milestone mapping

Delivery

## Status

complete — 2026-11-21

Verification evidence: `skills/README.md` and `AGENTS.md` each contain exactly
one `skill-registry:start` and one `skill-registry:end` marker. Every directory
under `skills/` with a `SKILL.md` appears inside both blocks, with no missing
names. Correction recorded: the plan's `README.md` reference resolves to
`skills/README.md`, where the skill list actually lives; `SKILL.md` was updated
to match.
