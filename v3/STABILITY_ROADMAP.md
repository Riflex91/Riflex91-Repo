# v3 Stability-First Roadmap

This document records the binding design direction for v3. The target is not merely autonomous gameplay, but safe unattended operation over months and eventually years. **Stability outranks feature velocity.**

## Non-negotiable invariants

1. Every gameplay action is bounded, observable and abortable.
2. Every long-running state gets progress criteria plus a lease/timeout.
3. Every retry path gets a hard attempt/risk budget and backoff.
4. Every advanced subsystem can fall back to a simpler known-safe baseline.
5. The Brain may recommend strategy but never bypass deterministic safety gates or call raw gameplay actions directly.
6. Unknown or changed content starts quarantined/observed, not automatically attacked, sold, upgraded or otherwise consumed.
7. Persistent state is schema-versioned and recoverable; unfinished transactions are reconciled after restart instead of blindly resumed.
8. New autonomy follows `shadow → synthetic → controlled live → bounded autonomy → normal autonomy`.
9. v2 `bot.js` remains production and untouched by normal v3 development.
10. Exact final PR-head CI must be green before merge.

## Global supervisor direction

A future Supervisor will aggregate Farmer, Merchant, Party, Economy, Brain, World Model and persistence health. Planned health states are:

`HEALTHY → WATCH → DEGRADED → SAFE_MODE / RECOVERY → QUARANTINE`

Signals will include command failures, repeated plan switching, lack of progress, inventory stagnation, party loss, death rate, movement stalls, Brain quality, persistence failures and telemetry heartbeat gaps. Degraded modules should be isolatable without forcing unrelated healthy modules offline.

## Anti-loop and self-healing rules

- strategic switches use hysteresis, minimum hold time and minimum expected improvement
- repeated failures use bounded exponential backoff and circuit breakers
- progress watchdogs detect action-without-progress loops
- Merchant, travel, party repair, boss attempts and other multi-step plans use explicit transaction/plan IDs and timeouts
- abort paths release reservations and return to a safe replanning point
- no recursive cleanup chains such as `compound → cleanup → compound`
- last-known-good configuration/model snapshots remain available for rollback

## Persistence and restart safety

Persistent models must carry schema versions and migration paths. Knowledge records should include observation time, source/evidence, confidence and enough content-version context to detect staleness. A restart during a transaction triggers state reconciliation against the current live snapshot before commit, rollback, abort or replan.

## World discovery and content drift

The existing World/Discovery foundation will grow into persistent novelty detection:

- new monsters, maps, NPCs, objects, items and transports
- changed metadata or behavior for known entities
- clustered novelty for probable seasonal/game events
- content fingerprints and structured diffs
- shared observations across controlled characters
- confidence aging and revalidation after game changes
- unknown high-risk content remains quarantined until safely modeled/tested

## Equipment progression philosophy

Default progression mode is **sustainable** rather than death-tolerant try-hard. Gear decisions evaluate the whole group and the reachable progression chain, not only the current item level.

Planned Gear Progression Evaluator responsibilities:

- compare `item × level × character × slot`
- find the first meaningful upgrade level, e.g. an item that only beats current gear at `+4`
- create explicit long-term Gear Goals
- reserve lower-level ingredients needed for realistic future upgrades
- model feasibility, expected cost, drop/acquisition rate, compound/upgrade risk and inventory pressure
- protect group minimum reserves while allowing true surplus to be sold
- learn from real outcomes while deterministic safety remains authoritative

Progression priority is broadly survivability → stable farming efficiency → class-specific strong upgrades → boss/event gear → luxury/BiS.

## Merchant architecture direction

Merchant actions will be driven by one central Inventory Ledger/Planner. Items receive a disposition such as `KEEP`, `RESERVE_GROUP`, `RESERVE_PROGRESSION`, `RESERVE_COMPOUND`, `RESERVE_UPGRADE`, `SELL`, `BANK`, `EXCHANGE` or `UNDECIDED`.

Sell, Bank, Compound and Upgrade executors do not independently decide what an item means. Each multi-step operation becomes an atomic transaction with reservations, preflight checks, location/resource validation, inventory-delta verification, timeout and abort/reconcile behavior. Dedicated workspace slots are protected from normal inventory fill pressure.

## Brain direction

The strong v2 principle is retained: time-critical execution remains local/deterministic while the strategic Brain operates above it. The v2 Teacher/Student concepts will be migrated modularly rather than copied wholesale:

- feature encoder
- Student network and experience replay
- Teacher distillation
- measured outcome/reward feedback
- Champion/Challenger and bounded canary traffic
- quality states, quarantine and rollback
- Brain Diary and Research Bridge

Brain autonomy must be earned by measured evidence and can be revoked independently of deterministic gameplay safety.

## Risk budgets and circuit breakers

Long unattended operation will use explicit budgets for risky/repetitive behavior, including death, boss attempts, exploration, upgrades/compound spending, travel/retry loops and AI/Teacher usage. Action families such as movement, sell, compound, upgrade, banking and party repair will gain independent circuit breakers so one broken path cannot consume the whole bot.

## Validation and certification

Beyond unit/integration/live gates, mature subsystems will receive fault injection and soak testing. Fault scenarios should include command failures, disappearing targets, stale snapshots, party loss, inventory mutation, full bank/inventory, missing scrolls, movement stalls, server/world resets and content drift.

Longer certification stages should progress through 24 h, 72 h, 7 d and eventually 30 d observation windows, tracking crashes, deadlocks, no-progress intervals, unresolved transactions, death rate, memory/state growth, repeated plan switches and recovery success.

A future per-subsystem autonomy/certification view should allow states such as:

- Combat: certified
- Movement: probation
- Merchant: shadow/probation
- Brain: shadow/canary
- Unknown-content exploration: restricted

The project is not considered unattended-ready merely because features work individually; it must repeatedly demonstrate recovery from faults without unsafe escalation.

## Immediate implementation sequence

- **Alpha.8.11:** Skill Failure Intelligence — bounded per-skill failure streaks, adaptive capped backoff, success reset, quiet-window decay and telemetry.
- Continue small Combat hardening blocks with complete synthetic integration gates.
- Freeze the combat foundation before larger pull/movement changes.
- Introduce the v3 GUI/debug control surface around the stable combat/local farming boundary.
- Bring the strategic Brain in early in shadow mode so it can learn while later systems are built.
- Move Supervisor, progress-watchdog and recovery foundations earlier than originally planned; they are prerequisites for unattended operation, not end-stage polish.
- Build Inventory Ledger/Gear Progression before destructive Merchant actions such as selling, compound and upgrade are activated.
- Expand persistent Discovery/Content Drift alongside navigation and long-term learning.

The guiding rule is simple: **errors must stay small, visible, reversible and self-healing.**
