# Observation and world state

V4 separates raw game access from domain state construction.

## Pipeline

`Adventure Land runtime -> adapter -> WorldObservation -> domain reducer -> WorldState -> decision/reliability`

The adapter is responsible for reading unstable game globals and converting them into the canonical observation contract. The domain layer never reads browser/game globals directly.

## WorldObservation v1

`WorldObservation.schemaVersion` is currently `1` and is part of the persisted data contract. Any incompatible change to observation meaning or shape must introduce a new schema version and an explicit migration/decoder path rather than silently reinterpreting old telemetry.

Each observation is a complete point-in-time view of:

- the controlled character and inventory
- currently visible entities
- currently visible world objects
- current party membership
- small game-data metadata counters

`sequence` must increase monotonically within a runtime session. It is the primary replay/idempotency key for the reducer; `observedAt` records wall-clock observation time and is not used to order observations.

## Reducer invariants

The reducer is deterministic and has no access to time, randomness, adapters or infrastructure.

- duplicate or lower observation sequences are ignored
- accepted observations increment `WorldState.revision`
- entity/object/party collections are complete snapshots, so missing entries disappear from current state
- duplicate entity IDs, object IDs, party names or inventory indexes are rejected as ambiguous input
- records are stored in sorted-key order for stable serialization and replay comparisons
- observation objects are copied into state so adapters cannot mutate accepted state by retaining references

## Why full snapshots first

Adventure Land exposes a live mutable object graph. V4 deliberately converts that graph into immutable-shaped observations before any decision logic runs. This gives us a reproducible boundary for simulation, regression tests, telemetry and future learning datasets.

Incremental events can be added later for efficiency, but they should reconcile against this canonical snapshot model rather than become a second source of truth.
