# V4 test strategy

V4 tests behavior at multiple layers because a 24/7 bot can pass unit tests and still fail operationally.

## Layers

1. **Contract tests** - schemas, stable serialization, version compatibility.
2. **Unit tests** - pure decision functions, state transitions and kernel primitives.
3. **Property tests** - invariants over many generated inputs, especially resource ownership and economy safety.
4. **Integration tests** - modules connected through the actual kernel path.
5. **Replay tests** - real recorded inputs executed offline.
6. **Fault injection** - timeouts, disconnects, stale data, rejected actions, storage/API outages.
7. **Shadow live tests** - observe real Adventure Land without irreversible authority.
8. **Active canaries** - narrowly scoped live authority.
9. **Soak tests** - memory, queues, timers, retries and recovery over days.

## Required invariant examples

- one exclusive resource -> at most one owner
- multi-resource acquisition -> all or none
- emergency intent -> cannot be starved by background work
- item reservation -> cannot be consumed by a different workflow
- stale snapshot -> cannot authorize an irreversible action
- expired intent -> never executes
- replay sealed hash mismatch -> rejected
- network/archive outage -> local safety continues
- failed telemetry upload -> bounded retry, no gameplay deadlock

## Regression policy

Every production bug should end with at least one of:
- deterministic unit regression
- replay fixture
- fault-injection case
- explicit reason why no deterministic reproducer is possible plus added observability

The final acceptance campaign is defined in `ROADMAP.md` and includes 24h, 72h and seven-day live stages.
