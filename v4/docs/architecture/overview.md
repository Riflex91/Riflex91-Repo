# V4 Architecture Overview

V4 is organized around explicit responsibility boundaries rather than development milestones.

## Runtime flow

`Adventure Land adapter -> observation -> domain state -> decision engine -> safety/reliability gates -> command -> Adventure Land adapter`

Learning components consume observations, outcomes and replay data. They may propose or score decisions, but they do not receive direct authority over game adapters.

## Layers

1. **Apps** compose deployable processes such as the game runtime, host agent, control center, telemetry API and learning worker.
2. **Core** supplies foundational events, commands, scheduling, lifecycle and state primitives.
3. **Domain** models Adventure Land concepts and rules without infrastructure dependencies.
4. **Decision** owns goals, planning, policies, scoring, coordination and arbitration.
5. **Intelligence** owns observation features, memory, replay, prediction, learning, shadow evaluation and model promotion.
6. **Reliability** owns guards, invariants, liveness, watchdogs, circuit breakers, recovery, reconciliation and failover.
7. **Observability** owns logs, metrics, telemetry, health, tracing, diagnostics and alerts.
8. **Adapters** integrate Adventure Land, browser/runtime APIs, storage and external services.
9. **Protocols** define stable boundaries between processes and subsystems.

## Composition

Only application composition roots should assemble the complete runtime. Reusable packages must not depend on `apps/`.

## Versioning rule

Production modules are named by responsibility, never by milestone (`alpha20`, `v27`, `hotfix-3`, etc.). History belongs to Git, changelogs and releases.
