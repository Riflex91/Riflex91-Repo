# V4 contracts and invariants

Contracts are intentionally boring. They are the stable language used by runtime, replay, telemetry and development tooling.

## DomainEvent

Required identity/provenance fields:
- `id`
- `sequence`
- `timestamp`
- `type`
- `source`
- `traceId`
- `payload`

A sequence is monotonic inside one runtime stream. Consumers must not infer causal order from wall-clock time alone.

## Intent

Every intent contains:
- stable `id`
- `ownerId`
- `kind`
- class: `emergency | safety | normal | background`
- numeric priority
- creation/optional expiry time
- required resources
- reason code

An Intent describes desired work. It is not permission to execute.

## Resource lease

A lease binds one exclusive resource to one owner with a priority and preemption policy. Bundled acquisition is atomic. Preemption releases the preempted owner's resource set so it cannot continue with a partial lock set.

## WorldSnapshot

A snapshot is immutable and sequence-addressable. Unknown facts stay unknown. Snapshot schemas are versioned; migrations must be explicit.

## ActionResult

Execution returns a structured result, never only a boolean. At minimum it records success/failure, reason, timestamps and trace identifiers.

## Incident

An incident points to evidence; it is not a free-text bug report. It records detection rule, time window, affected components, trace ids, bundle references and severity.

## DevelopmentTask

A development task may contain hypotheses, but facts and hypotheses must be separate fields. A task can request more evidence instead of demanding a code change.
