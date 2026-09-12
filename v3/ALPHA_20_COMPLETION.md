# Alpha.20 — Adaptive Party Lifecycle

Release: `3.0.0-alpha.20.0`

## Phase status

- Alpha.19 production confirmation: **FULL CONFIRMED**.
- Alpha.20 core: **MERGED** via PR #71.
- Alpha.20 exact certified core head: `6e2ba60b05dcf14e338e2a8bf5ecd8eceebeaede`.
- Alpha.20 core merge on `main`: `63d16e2798f1275a7f1bcc8f9028c27d0789e0a6`.
- Alpha.20 core merge tree: `0778b2b6e76d47f3f7cede46d91c0c38471a1661`.
- Core merge parents: previous confirmed `main` `144d83a92cf00d178fb8902e9cd6c70b10e5c2ea` + exact certified PR head `6e2ba60b05dcf14e338e2a8bf5ecd8eceebeaede`.
- Alpha.20 combined four-character live-gate preparation: **IN PREPARATION / NOT YET MERGED**.
- Alpha.20 production confirmation: **NOT YET CONFIRMED**.
- Alpha.20 remains **NOT FULL CONFIRMED** until live-gate preparation is exact-head certified and merged, one genuine four-character production run is reviewed, and a separate confirmation PR is exact-head certified and merged.

Default runtime remains `shadow`. Party transition, Development rotation and Paladin aura authority remain independently default-off. Strategic Brain gameplay authority, cross-map party routing, broad `smart_move()` autonomy and server changes remain disabled.

## Goal

Alpha.20 turns the measured Party Orchestrator into a controlled adaptive lifecycle for one Merchant plus three combat characters without allowing theory/projected scores to replace real production evidence.

Lifecycle states:

- `ACTIVE`
- `BENCH`
- `DEVELOPMENT`
- `PROMOTION_CANDIDATE`

At most one combat character may occupy the Development slot.

## Current score versus projected score

`projectedScore` is planning evidence only. It may identify a Development candidate and may justify one bounded controlled training rotation when all training gates pass, but it can never directly authorize a permanent replacement.

`currentScore` is real observed evidence. Permanent promotion requires minimum samples/confidence, safe current survival, observed progression, gear readiness, content safety, superiority over the relevant incumbent and sustained promotion hysteresis.

Required progression:

`projected superiority -> DEVELOPMENT -> controlled training -> real observations -> sustained current superiority -> PROMOTION_CANDIDATE -> permanent promotion`

## Development guardrails

Default Alpha.20 Development gates include:

- maximum Development slots: **1**
- projected training safety: **>= 90%**
- expected training XP ratio to incumbent: **>= 75%**
- known/safe content
- no high-risk context
- no economy emergency
- no transition during combat/emergency recovery
- incoming character available and alive
- exact Merchant + three distinct combat-character target shape

## Bounded Development session

A verified Development rotation persists:

- candidate
- temporarily displaced incumbent
- exact original party
- exact training party
- start and hard expiry
- frozen incumbent current/projected/progression/XP baselines

Safe outcomes are limited to:

1. **Measured promotion** — sustained real current evidence promotes the active trainee; no unnecessary second raw transition is issued.
2. **Controlled return** — expiry without measured promotion plans an exact return to the original party through the same controlled transition boundary.
3. **Fail closed** — unexpected party drift performs no blind recovery action and leaves reconciliation evidence visible.

The session survives restart. Restart never blindly repeats stop/start/invite operations.

## Controlled party transitions

Required acknowledgement:

`ALPHA20_PARTY_LIFECYCLE`

The ack alone grants nothing. The controlled parent also requires explicit `allowTransitions:true`; Development additionally requires `allowDevelopmentRotation:true`.

Every transition requires runtime `active`, Merchant controller, Supervisor `HEALTHY`/`WATCH`, lifecycle circuit closed, no combat/high-risk/emergency/economy emergency, no concurrent/recovering operation, transition hysteresis elapsed and sufficient same-map target state for the lower-level controlled transition executor.

The lower-level transition controller owns raw stop/start/invite, postcondition verification and rollback. Alpha.20 borrows that authority only for one bounded operation and removes it in `finally` paths. Legacy direct enable setters are forced closed.

## Persistent party circuit

Alpha.20 has an independent persistent party-transition circuit breaker with bounded sliding failure window, threshold and cooldown. Open state/failure evidence survives restart and disables child transition authority. Repeated failure therefore cannot create an endless transition loop.

## Controlled Paladin aura

Paladin aura has a separate controlled executor and acknowledgement. Only known `paladin_aura` modes modeled by policy are eligible. Aura authority is default-off, Supervisor/runtime gated and independent of party-transition/Development authority.

The Merchant cannot legitimately cast a Paladin aura on another character process. The Merchant-hosted combined live gate therefore verifies the aura **authority boundary** (default-off and wrong-ack rejection) but does not invent remote aura execution merely for coverage.

## Brain boundary

The Strategic Brain remains recommendation-only. It cannot directly invoke attack, movement, `smart_move()`, character start/stop, party invite, aura calls, economy actions, irreversible item actions or server changes.

## Core automated coverage

The exact Alpha.20 core PR head passed the complete release workflow with **352/352** tests, browser bundle build/smoke and generated-bundle/diff verification. Coverage includes:

- projected superiority -> DEVELOPMENT only
- >=90% training safety and >=75% expected progression gates
- one Development slot maximum
- sustained measured current superiority for promotion
- high-risk/economy suppression and hysteresis reset
- exact acknowledgements and independent authorities
- restart no-blind-retry
- controlled Paladin aura boundary
- persistent lifecycle circuit
- bounded Development exact return/restart/drift behavior
- measured Development promotion without second raw transition
- 2500-cycle active Development-session soak
- 3000-cycle lifecycle soak
- 2200-cycle controlled planner soak
- existing 2000-cycle Party Orchestrator soak

## Combined four-character production live gate

Required live-gate acknowledgement:

`ALPHA20_FULL_LIVE_GATE`

Production observation is fixed at **10 minutes**. Shortened test-mode gates are never confirmation eligible.

The gate requires a real local Merchant plus exactly three real combat party members and validates release version, Supervisor health, lifecycle/default-off boundaries, Development-slot cardinality, circuits, economy emergency state and legacy-bypass boundaries before any controlled action.

It never fabricates a candidate, score, performance sample or party pressure. DEVELOPMENT is optional training and is never forced for coverage.

If no real permanent change is currently justified, a stable genuine Merchant+3 production observation can be confirmation eligible with **zero party transitions**. If a real non-active `PROMOTION_CANDIDATE` already exists, skipping that independently justified promotion becomes an explicit confirmation blocker unless the controlled canary safely executes it.

The canary has at most **one** controlled transition attempt. It cannot introduce cross-map routing, `smart_move()`, server changes or Brain action authority. Development rotation additionally needs its separate explicit operator budget.

The passive window requires runtime `shadow`, Farmer off, all controlled party/aura/economy/travel authority off, lifecycle circuit and relevant subsystem circuits closed, Merchant alive and out of combat, valid Merchant+3 party shape, <=1 Development slot, no unexpected action-attempt deltas and no new error events.

The gate is explicitly abortable. A requested abort exits bounded, returns controlled authority to safe/default-off state and can never satisfy confirmation duration.

### Countdown

Production gates emit:

- start message
- one visible remaining-time message per minute
- completion message

Countdown reporting is observation-only and cannot change gate timing or pass/fail semantics.

## Recommended first production run

Run the gate on the **Merchant** after live-gate preparation has been exact-head certified and merged to `main`:

```js
AIO_V3.__runtime.runAlpha20CombinedLiveGate({
  ack: "ALPHA20_FULL_LIVE_GATE",
  allowControlledPartyTransition: true,
  allowDevelopmentRotation: false
});
```

This first production run permits one genuinely measured permanent Promotion if the real lifecycle already justifies it, but it **does not authorize a Development training rotation**.

Status while running:

```js
console.log(AIO_V3.__runtime.alpha20LiveGateStatus());
```

Explicit safe abort if truly required:

```js
AIO_V3.__runtime.cancelAlpha20CombinedLiveGate("OPERATOR_CANCELLED");
```

An aborted run is not confirmation eligible and must later be rerun from the beginning.

After completion:

```js
console.log(AIO_V3.__runtime.alpha20LiveGateResultText());
```

Copy the complete block between:

`=== ALPHA20 FULL LIVE GATE RESULT BEGIN ===`

and

`=== ALPHA20 FULL LIVE GATE RESULT END ===`

for review.

Do not manually enable Farmer, Travel, controlled economy, party lifecycle, aura automation or legacy transition authority during the passive observation. Do not force a Promotion/Development candidate merely to obtain coverage.

## Live-gate automated coverage

Live-gate preparation adds tests for:

- exact gate acknowledgement
- real Merchant + three combat party requirement
- wrong lifecycle/aura ack cannot leave authority enabled
- stable full 10-minute four-character production observation with zero fabricated change
- shortened test mode never confirmation eligible
- justified but unauthorized Promotion becomes explicit blocker
- explicitly authorized Promotion executes at most one controlled transition
- cross-map transition receives zero authority
- more than one Development slot fails closed before action
- ISO timestamped error event fails passive observation
- minute countdown start/9-to-1/finish behavior
- explicit abort while idle/running
- abort cannot satisfy confirmation duration
- Merchant death/combat during passive observation fails closed
- public Alpha20Runtime exposes hardened gate status/result/cancel surfaces

The current integrated prep branch passes **368/368** tests with browser bundle **92 modules / 892018 bytes**, bundle smoke OK and diff check clean. Exact PR-head certification is still required before merge.

## FULL CONFIRMED definition

Alpha.20 becomes **FULL CONFIRMED** only after:

1. core exact-head certified and SHA-bound merged — **DONE**
2. core `main`/tree/both parents verified — **DONE**
3. combined four-character live-gate preparation exact-head certified and SHA-bound merged
4. one genuine production four-character live gate completes with `confirmationEligible:true`
5. complete result/log review confirms lifecycle, transition, aura-boundary, circuit, default-off and unexpected-action invariants
6. separate documentation-only confirmation PR records the evidence
7. confirmation PR exact final head passes full CI
8. confirmation PR is SHA-bound merged
9. final `main`, tree and both parents are verified

Until step 9, Alpha.20 must not be described as FULL CONFIRMED.