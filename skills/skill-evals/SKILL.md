---
name: skill-evals
description: >-
  Use when validating the repository's skill eval files, checking eval
  coverage or schema after editing a skill description, or running the opt-in
  advisory live checks. Runs offline validation by default and never uses model
  output as a pass/fail gate. Not for writing eval files, judging model output,
  running Jest tests, or as a CI gate.
---

# Skill evals

## When to use

- After changing a skill's `SKILL.md` description or workflow, to check its
  eval files still validate.
- To find skills with missing, incomplete, or malformed eval suites.
- To run advisory live checks with an explicit `--live` flag.

## Steps

1. **Run offline validation from the repository root:**

   ```bash
   node skills/skill-evals/run-evals.js --offline
   ```

   This discovers every skill with `evals/evals.json` and
   `evals/trigger-evals.json`, validates their structure, and exits non-zero if
   any file has errors. It makes no network or LLM calls.
2. **To validate one skill, pass its directory name:**

   ```bash
   node skills/skill-evals/run-evals.js idea-discovery
   ```

3. **If you need an advisory live signal, opt in explicitly:**

   ```bash
   node skills/skill-evals/run-evals.js --live
   ```

   Each eval prompt is sent to `opencode run`. Output is printed as a summary
   with timing; there is no pass/fail verdict and the command still exits 0.
   This mode is advisory only and must never be used as a CI gate.
4. Report the summary. On errors, cite the exact file, field, and reason from
   the report and leave eval files unchanged.

## Options

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `EVAL_TIMEOUT` | `30000` | Per-eval timeout in milliseconds for `--live`. |

| Flag | Purpose |
| --- | --- |
| `--offline` | Validate eval files only (default). |
| `--live` | Advisory CLI checks; never a pass/fail gate. |
| `--help` | Print usage. |
| `skill` | Optional positional skill directory name to validate only. |

## Safety rules

- Offline validation is the default and is CI-safe: no network or LLM calls.
- `--live` is strictly opt-in, time-bounded, and advisory. Never treat its
  output as a release gate.
- The runner never modifies eval files, skill descriptions, or code.
- Live checks spawn the `opencode` CLI with an argument array and no shell.

## Requirements

- Node.js for the CLI.
- The `opencode` CLI only for `--live`; offline mode needs no external tool.
- Eval files must follow the repository shape: `skill_name` plus `evals[]` in
  `evals.json`, and an array of `{query, should_trigger}` in
  `trigger-evals.json`.
