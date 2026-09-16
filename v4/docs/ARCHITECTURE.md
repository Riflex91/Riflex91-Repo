# V4 architecture

## Control flow

```text
GameAdapter -> WorldSnapshot -> Features/Planner -> Intent
                                      |
                                      v
SafetyPolicy -> IntentArbiter -> ResourceManager -> ActionExecutor -> GameAdapter
                                      |
                                      v
                                  DomainEvents
                                      |
                    Telemetry / Replay / Learning / Incidents
```

The central rule is that feature code expresses desired work, while the kernel decides what is allowed to execute.

## Dependency direction

- `contracts` depends on nothing runtime-specific.
- `kernel` may depend on `contracts`, never on features.
- `game` adapts Adventure Land APIs and must not contain strategy.
- `world` consumes normalized observations and produces knowledge/snapshots.
- `planning` produces ranked intents, never actions.
- `safety` may veto or transform authority but may not be bypassed.
- `execution` is the only path from an admitted intent to a game action.
- `features` may depend on contracts/world/planning APIs but not reach around the kernel.
- `telemetry`, `replay` and `learning` observe outcomes; they do not directly invoke game APIs.
- `platform` code never becomes a safety dependency for the live runtime.

## Runtime invariants

1. Direct Adventure Land global/API access exists only in `runtime/src/game`.
2. No feature owns an independent infinite loop.
3. A resource has at most one owner at a time.
4. Multi-resource acquisition is atomic.
5. Every action has a trace id, intent id and reason.
6. An action is revalidated immediately before execution.
7. Remote services may improve behavior but may never be required for emergency safety.
8. Learning cannot generate or evaluate arbitrary runtime JavaScript.
9. Replay inputs are immutable once sealed.
10. Runtime and platform credentials are separated.

## Priority model

Intent classes are ordered:

`emergency > safety > normal > background`

Numeric priority only orders intents inside the same class. Tie-breaking must remain deterministic.

## Initial exclusive resources

- `movement`
- `inventory`
- `bank`
- `economy`
- `combatTarget`
- `party`
- `equipment`

Additional resources require an architecture review because every resource changes possible concurrency.
