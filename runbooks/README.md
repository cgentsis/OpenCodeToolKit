# Runbooks

Operational procedures for humans and agents: how to perform a recurring task
safely, step by step. Skills define what an agent should do; runbooks document
how a team carries out a procedure, including the human checkpoints.

A useful runbook states:

- **Purpose** — what the procedure accomplishes.
- **When to use it** — triggers and the situations where it does not apply.
- **Prerequisites** — tools, permissions, and access required.
- **Steps** — ordered, verifiable actions with commands where relevant.
- **Verification** — how to prove the procedure succeeded.
- **Rollback** — how to back out safely if it fails.

Keep runbooks short and procedural. Put reusable agent behavior in
`skills/` instead, and link to a runbook when a skill needs operational detail.
