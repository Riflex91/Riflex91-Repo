# Automated development loop

V4 is designed so that the user can primarily keep Adventure Land and the bot running while engineering work is driven by structured evidence.

```text
runtime events
  -> incident detector
  -> sealed incident/replay bundle
  -> development queue
  -> clustering/reproduction
  -> code/test change on branch
  -> CI/replay comparison
  -> pull request
  -> human merge decision
```

## Queue types

- `bug`: behavior violates an invariant or expected contract
- `regression`: a measured metric or behavior worsened after a known change
- `unknown`: the runtime encountered unsupported/unknown game behavior
- `optimization`: evidence suggests a measurable improvement opportunity
- `missing_knowledge`: a decision is blocked by insufficient world knowledge

## Evidence before code

A development job should prefer this order:
1. identify repeated evidence or a high-severity single incident
2. obtain a deterministic reproducer when possible
3. identify the violated contract/invariant
4. add a failing test/replay assertion
5. implement the smallest fix
6. run unit/property/replay/fault-injection suites
7. open a PR with before/after evidence

If the evidence is insufficient, the correct output is a telemetry/reproduction improvement, not a guessed gameplay patch.

## Autonomy boundary

The development agent may eventually create branches, commits, tests, documentation and pull requests. Gameplay, safety, economy and release-authority changes remain human-merged unless an explicit future policy narrows that boundary.
