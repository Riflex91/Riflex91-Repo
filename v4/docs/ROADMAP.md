# V4 concrete roadmap

This roadmap turns the lessons from v1-v3 into explicit delivery gates. A milestone is complete only when its exit criteria pass. Later milestones may not weaken earlier invariants.

## M0 - Foundation and architecture contracts

**Goal:** make the rules of V4 executable before gameplay is added.

Deliverables:
- strict TypeScript project and CI
- stable DomainEvent, Intent, Resource and WorldSnapshot contracts
- deterministic EventBus
- atomic ResourceManager with exclusive ownership
- deterministic IntentArbiter with emergency/safety precedence
- machine-readable JSON schemas for events, incidents, archive manifests and development tasks
- architecture, storage, development-loop and testing ADRs

Exit criteria:
- `npm run check` passes locally and in GitHub Actions
- a resource cannot have two owners
- acquisition of multiple resources is atomic
- a failing event subscriber cannot prevent later subscribers from receiving an event
- intent ordering is deterministic
- V3 files are untouched

## M1 - Read-only Adventure Land adapter and world snapshots

**Goal:** observe the game without taking actions.

Deliverables:
- one `GameAdapter` as the only direct Adventure Land API boundary
- normalized character/entity/party/inventory snapshots
- monotonic snapshot sequence and trace correlation
- provenance model: `observed`, `inferred`, `learned`
- schema-versioned snapshot serialization

Exit criteria:
- no module outside `runtime/src/game` reads Adventure Land globals directly
- snapshot fixtures from multiple classes/maps are deterministic
- missing/partial game data is represented explicitly rather than guessed
- read-only shadow runtime survives reconnect/map transitions in tests

## M2 - Scheduler, intents, locks and shadow execution

**Goal:** all future behavior must flow through one control path.

Deliverables:
- scheduler owned by the kernel
- intent lifecycle: proposed -> selected -> admitted -> executing -> completed/failed/cancelled
- resource leases for `movement`, `inventory`, `bank`, `economy`, `combatTarget`, `party`, `equipment`
- cancellation, timeout, progress and stall contracts
- shadow executor that records intended actions without calling game APIs

Exit criteria:
- no feature owns an independent uncontrolled timer/retry loop
- conflicting movement/inventory/bank requests cannot execute concurrently
- emergency intents can preempt only explicitly preemptible work
- every rejected/deferred intent has a structured reason code

## M3 - Telemetry, black box, incidents and deterministic replay

**Goal:** make real failures reproducible without waiting for them to happen again live.

Deliverables:
- bounded ring buffers for high-resolution events/snapshots
- incident detector and black-box freeze window
- replay bundle format with checksums and schema versions
- deterministic replay runner
- old/new decision comparison report
- fault-injection hooks for timeout, disconnect, stale snapshot and failed action cases

Exit criteria:
- a recorded incident can be replayed offline
- same input + same runtime version produces the same ordered decisions
- incomplete/corrupt bundles are rejected
- replay does not require live Adventure Land access

## M4 - Farmer baseline

**Goal:** first useful behavior built only through the V4 control path.

Deliverables:
- target discovery and selection
- travel intent
- basic attack intent
- HP/MP recovery intents
- bounded idle/recovery states
- measurable EXP/h and Gold/h windows

Exit criteria:
- Farmer has an explicit state machine
- every action is attributable to one intent/trace
- target ownership and invalid targets are rechecked before execution
- shadow replay and live shadow decisions match for equivalent snapshots

## M5 - Combat safety and execution authority

**Goal:** make active combat safe before adding optimization.

Deliverables:
- safety kernel for HP/MP risk, death, crowding, dangerous targets and retreat
- active executor allow-list
- cooldown/range validation immediately before action
- kiting/reposition contracts
- emergency disengage path

Exit criteria:
- learning/planner code cannot bypass safety or call the game adapter directly
- stale intents are rejected at execution time
- fault injection proves emergency actions remain available when normal work is stuck

## M6 - Party coordination

**Goal:** capability-based multi-character coordination without hard-coded class assumptions.

Deliverables:
- capability model (`healParty`, `holdAggro`, `burstDamage`, `bankAccess`, etc.)
- party role negotiation
- peer heartbeat/state exchange
- server/realm consistency handling
- party-level intents and ownership

Exit criteria:
- party behavior works from capabilities, not fixed character names/classes
- stale peers age out deterministically
- split-server conditions do not cause invitation/reconnect spam

## M7 - Merchant and economy

**Goal:** add irreversible actions only after resource ownership and replay are mature.

Deliverables:
- Merchant service state machines
- bank/inventory/upgrade/compound/sell/buy contracts
- explicit item ownership/reservation model
- economy policy and hard loss limits
- transactional service traces

Exit criteria:
- banking, buying, selling, upgrading and compounding all require exclusive resources
- no item reserved by one workflow can be consumed by another
- repeated retries are bounded and idempotent where possible
- economy operations have replay/fault-injection coverage before live authority is enabled

## M8 - Experiments and learning

**Goal:** learn from outcomes without giving the learning system direct execution authority.

Deliverables:
- Experience Store: situation -> options -> decision -> expectation -> outcome -> reward
- experiment/control/challenger contracts
- confidence and sample-size gates
- promotion/rollback records
- bounded parameter/strategy authority

Exit criteria:
- learning outputs only intents, scores, policies or parameters
- safety/executor remain authoritative
- every promotion can be traced back to evidence and rolled back
- no model can emit arbitrary executable JavaScript

## M9 - Platform: API, dashboard and archive

**Goal:** separate live control, analysis UI and long-term storage.

Deliverables:
- HTTPS API/control plane
- live dashboard
- analysis/replay/incident views
- SFTP archive-sync service running only server-side
- archive retention/checksum policy
- explicit authentication and read/write separation

Exit criteria:
- browser/runtime contains no SFTP credentials
- dashboard never reads FTP/SFTP directly
- partial uploads cannot appear as complete bundles
- API outage cannot stop local safety/combat recovery

## M10 - Automated development bridge

**Goal:** let runtime evidence generate safe, reviewable engineering work.

Deliverables:
- Development Queue (`bug`, `regression`, `unknown`, `optimization`, `missing_knowledge`)
- incident clustering
- automatic replay selection
- reproducibility score
- branch/PR preparation workflow
- evidence attached to proposed fixes

Exit criteria:
- development jobs can prepare branches/tests/PRs
- no gameplay/safety/economy PR is self-merged
- no code change is proposed without a reproducer or explicitly documented evidence gap
- telemetry can request more evidence instead of guessing a fix

## M11 - Release/update architecture

**Goal:** never couple runtime growth to the Adventure Land code-slot limit again.

Deliverables:
- tiny stable bootstrap
- immutable versioned runtime artifacts
- manifest + SHA-256 integrity verification
- last-known-good runtime cache
- atomic publication order and rollback
- migration compatibility tests

Exit criteria:
- interrupted update keeps last-known-good runtime usable
- corrupt/mismatched artifact is rejected
- runtime bundle size does not affect slot persistence
- rollback is rehearsed, not merely documented

# Final acceptance campaign

The final tests happen only after all functional milestones are implemented. Passing unit tests alone is not production readiness.

1. **Static/contract gate:** strict typecheck, architecture rules, schema validation, forbidden dependency checks.
2. **Unit/property gate:** kernel, locks, state transitions, planners, safety gates and economy invariants.
3. **Replay gate:** historical v4 incident/replay corpus; zero unexplained nondeterminism and zero safety regressions.
4. **Fault-injection gate:** disconnects, API outage, stale snapshots, failed movement, action rejection, full inventory, unavailable NPC, server transition and interrupted update.
5. **Adventure Land shadow test - 24h:** full party observes and plans but does not perform irreversible actions.
6. **Single-character active canary - 24h:** reversible Farmer combat/movement only.
7. **Full Farmer party - 72h:** no Merchant economy authority yet.
8. **Merchant/economy canary - 72h:** explicit low-loss limits and complete item audit trail.
9. **Restart/update/rollback drill:** browser restart, network outage, Cloudflare outage, archive outage and bad release simulation.
10. **Seven-day 24/7 soak:** all intended roles active; no unbounded queues, timers, retries, memory growth or unresolved P0/P1 incidents.
11. **Production-replacement review:** compare V4 against the current production baseline on reliability, deaths, idle time, recovery success, EXP/h and Gold/h. No automatic promotion: replacement remains an explicit human decision.

Only after the complete acceptance campaign should V4 be considered a candidate to replace V3.
