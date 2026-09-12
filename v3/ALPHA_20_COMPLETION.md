# Alpha.20 — Adaptive Party Lifecycle

Release target: `3.0.0-alpha.20.0`

## Phase status

- Alpha.19 production confirmation: **FULL CONFIRMED**.
- Alpha.20 core implementation: **IN DEVELOPMENT / NOT YET MERGED**.
- Alpha.20 production confirmation: **NOT YET CONFIRMED**.
- Phase status remains **NOT FULL CONFIRMED** until the core is exact-head certified and merged, a separate combined four-character production live gate is completed and reviewed, and a documentation-only confirmation PR is exact-head certified and merged.
- Default runtime remains `shadow`.
- Party transition authority remains default-off.
- Development rotation authority remains separately default-off.
- Paladin aura authority remains separately default-off.
- Strategic Brain gameplay authority remains disabled.
- Cross-map party routing, broad `smart_move()` autonomy and server changes remain disabled.

## Goal

Alpha.20 turns the existing measured Party Orchestrator into a controlled adaptive lifecycle for one Merchant plus three combat characters without allowing projected/theoretical scores to replace real production evidence.

Lifecycle states:

- `ACTIVE`
- `BENCH`
- `DEVELOPMENT`
- `PROMOTION_CANDIDATE`

The Merchant remains the party controller. At most one combat character may occupy the Development slot at a time.

## Current score versus projected score

Alpha.20 enforces two separate evidence classes.

`projectedScore`:

- is planning evidence only
- may identify a Development candidate
- may justify one bounded controlled training rotation when all training safety gates pass
- can never directly authorize a permanent party replacement

`currentScore`:

- is based on real observed performance evidence
- requires minimum samples and confidence
- is the only score class that can prove superiority over an incumbent
- must remain superior for multiple evaluation windows before promotion

The intended progression is:

`projected superiority -> DEVELOPMENT -> controlled training -> real observations -> sustained current superiority -> PROMOTION_CANDIDATE -> permanent promotion`

## Development readiness gates

A projected candidate can enter `DEVELOPMENT` only when all controlled planning gates pass.

Default Alpha.20 guardrails include:

- maximum Development slots: **1**
- projected training safety: **>= 90%**
- expected training XP ratio to incumbent: **>= 75%**
- content is known/safe for the current controlled context
- no high-risk context
- no active economy emergency
- no active combat transition
- incoming character is available and not dead
- target composition remains exactly Merchant plus three distinct combat characters

A Development candidate that is actively training stays distinguishable from ordinary `ACTIVE` members so that real promotion evidence can be accumulated without allowing every active character to self-promote.

## Permanent promotion gates

Permanent promotion requires current measured evidence. Projected superiority is ignored for this authorization decision.

Default requirements include:

- current performance samples meet the minimum evidence count
- current confidence meets the minimum confidence threshold
- current score exceeds the relevant incumbent by the configured minimum gain
- survival score is at or above the promotion safety threshold
- observed XP ratio is at or above the promotion progression threshold
- gear readiness is positively observed
- content remains safe
- no high-risk or economy-emergency context
- superiority persists for the configured promotion hysteresis windows

If the evidence disappears, the promotion streak resets instead of being carried forward optimistically.

## Bounded Development session

A controlled Development rotation is a temporary, persistent operation rather than an unbounded composition change.

After a verified Development rotation, Alpha.20 persists:

- candidate name
- temporarily displaced incumbent
- exact original party names
- exact training party names
- start time
- hard expiry time
- frozen incumbent current-score baseline
- frozen incumbent projected-score/progress baselines
- frozen incumbent XP/h baseline

The default Development window is bounded and cannot be configured outside the hard safety range.

While the exact training composition remains observed and the window has not expired, no additional party transition is permitted by the Development session.

The session has only three safe outcomes:

1. **Measured promotion:** sustained real current evidence makes the active trainee a `PROMOTION_CANDIDATE`; the training composition becomes the accepted permanent composition without an unnecessary second raw transition.
2. **Controlled return:** the window expires without measured promotion; Alpha.20 plans an exact return to the original party and executes it only through the same controlled transition gates.
3. **Fail closed:** the observed party drifts away from both the exact training composition and exact original composition; Alpha.20 records the drift, performs no blind recovery action and keeps the session visible for reconciliation.

The Development session is persisted across restart. Restart never turns an uncertain composition into an automatic stop/start/invite sequence.

## Controlled party transitions

Required acknowledgement:

`ALPHA20_PARTY_LIFECYCLE`

The acknowledgement alone does not grant all party authority. The controlled parent also requires explicit `allowTransitions:true`, and Development rotations additionally require `allowDevelopmentRotation:true`.

Every transition is gated by:

- runtime `active`
- Merchant controller context
- Supervisor `HEALTHY` or `WATCH`
- lifecycle circuit closed
- no active combat
- no high-risk context
- no emergency recovery
- no active economy emergency
- no concurrent lifecycle operation
- no restart reconciliation hold
- transition hysteresis interval elapsed
- same-map/known target state sufficient for controlled execution

The existing lower-level transition controller still owns the raw stop/start/invite sequence, postcondition verification and rollback behavior. Alpha.20 only grants that child live authority for the duration of one bounded controlled operation and disables it again in `finally` paths.

Legacy direct party enable setters are forced closed so older Alpha.12 interfaces cannot bypass the Alpha.20 lifecycle.

## Persistent party circuit breaker

The controlled lifecycle has its own persistent transition-failure circuit independent of other subsystem circuits.

Properties:

- bounded sliding failure window
- bounded failure threshold
- bounded cooldown
- persisted failure timestamps
- persisted open-until time and reason
- child transition authority is disabled when the circuit opens
- restart restores an open circuit instead of silently clearing it

Repeated failed/aborted transitions therefore cannot create an endless stop/start/invite loop.

## Restart reconciliation

Controlled lifecycle operation states are:

- `RESERVED`
- `EXECUTING`
- `VERIFYING`
- `RECOVERING`
- `COMMITTED`
- `ABORTED`
- `FAILED_SAFE`

A persisted nonterminal operation loads as `RECOVERING` and requires explicit reconciliation. It is never blindly retried.

A separately persisted Development session is retained even when controlled authority is disabled, because forgetting which combat character was temporarily rotated would be less safe than preserving the reconciliation evidence.

## Controlled Paladin aura

Paladin aura changes use a separate controlled executor and a separate exact acknowledgement.

Only the known official `paladin_aura` modes modeled by the Party Aura policy are eligible. The controlled executor does not provide general skill authority and cannot authorize party transitions.

Aura changes remain:

- default-off
- Supervisor/runtime gated
- fail-closed
- independent from Development authority
- bounded to one known recommended aura action

Alpha.20 does not introduce general combat-skill autonomy through this path.

## Strategic Brain boundary

The Strategic Brain remains recommendation-only in Alpha.20.

It cannot directly invoke:

- attack
- movement
- `smart_move()`
- character start/stop
- party invite
- aura skill calls
- buy/sell/bank
- upgrade/compound/exchange/craft
- server changes

Party lifecycle execution remains deterministic and safety-gated even if future strategic recommendations are present.

## Automated safety coverage

Alpha.20 automated coverage includes:

- projected superiority creates `DEVELOPMENT`, never direct promotion
- projected training safety below 90% fails closed
- maximum one Development slot
- permanent promotion requires sustained real current superiority
- high-risk/economy emergency resets or suppresses lifecycle progression
- exact acknowledgement and independent Development authority
- weakest-incumbent selection for measured promotion
- transition failure removes child live authority
- restart never blindly retries uncertain transitions
- controlled Paladin aura acknowledgement/action boundary
- minute countdown reporting without owning/changing test timing
- persistent transition circuit opening after bounded failures
- circuit restart persistence and exact cooldown/window boundary behavior
- combat/high-risk/emergency/economy gates cause zero child transition calls
- active bounded trainee can graduate only from measured current evidence
- Development session exact expiry/return behavior
- Development session restart persistence with zero blind action
- measured Development promotion requires no unnecessary second raw transition
- unexpected Development party drift fails closed
- 2500-cycle active Development-session soak
- 3000-cycle lifecycle soak
- 2200-cycle controlled planner soak
- existing 2000-cycle Party Orchestrator soak

The pre-freeze branch test suite currently passes with the browser bundle generated and smoke-tested. The exact PR-head certification still has to be performed after the core PR is frozen.

## Production confirmation plan

Alpha.20 is not FULL CONFIRMED by automated tests alone.

After the exact-head-certified core PR is merged, a separate combined four-character live-gate preparation change must provide a production evidence path with its own acknowledgement.

The combined gate must be conservative and evidence-driven:

1. run with a real Merchant plus three real combat characters
2. verify version, Supervisor, worker/runtime freshness and default-off authority
3. verify no legacy party/aura bypass is active
4. verify exactly one Development slot maximum
5. observe real current/projected lifecycle evidence without fabricating superiority
6. allow a party transition only when the real lifecycle independently justifies it and the operator explicitly authorizes the corresponding controlled budget
7. never force a Development candidate merely for coverage
8. never introduce cross-map routing, `smart_move()` or server changes
9. never perform a party change during active combat, high-risk content, emergency recovery or economy emergency
10. if a real Development rotation occurs, verify the persisted bounded session and either measured promotion or controlled return according to the real evidence
11. if a real Paladin aura action is covered, require its own explicit authority and verify the exact known aura transition
12. return every controlled authority to default-off after the canary portion
13. complete a production passive observation window with no unexpected action deltas, circuit leaks, state drift or error events
14. emit a visible start message, once-per-minute remaining-time countdown and finish message without allowing the countdown to influence gate timing or pass/fail semantics
15. expose a complete copyable result block for post-run review

A shortened test-mode window may be used only for automated gate tests and is never production-confirmation eligible.

## FULL CONFIRMED definition

Alpha.20 becomes **FULL CONFIRMED** only after all of the following are true:

1. core branch frozen
2. core PR exact final head passes the complete repository workflow
3. core PR is SHA-bound merged
4. post-merge `main`, tree and both parents are verified
5. combined four-character live-gate preparation is exact-head certified and merged
6. one genuine production four-character live gate completes with confirmation-eligible evidence
7. the complete production result/log is reviewed for lifecycle, transition, aura, circuit, restart/default-off and unexpected-action invariants
8. a separate documentation-only confirmation PR records the evidence
9. that confirmation PR exact final head passes full CI
10. confirmation PR is SHA-bound merged and final `main`/tree/parents are verified

Until step 10, Alpha.20 must not be described as FULL CONFIRMED.