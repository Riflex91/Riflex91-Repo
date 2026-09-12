# Alpha.12 Completion Gate — Adaptive Party Orchestrator

Version target: `3.0.0-alpha.12.0`

Alpha.12 completes the first end-to-end adaptive Party Orchestrator slice on top of the confirmed Alpha.11 observation foundation. It can observe the roster, build deterministic Party/Encounter fingerprints, score realizable Merchant + 3 Combat combinations, learn bounded performance profiles, explain `WOULD_KEEP` / `WOULD_SWITCH` decisions, recommend Paladin auras, and execute a tightly gated same-account transition state machine when explicitly enabled.

The default remains safe: bot mode `shadow`, Party transitions disabled, aura automation disabled, exploration disabled, Brain shadow-only, `productionReplacement=false`.

## Implemented scope

Alpha.12 includes:

- deterministic Party Fingerprints using concrete character identity, class, level, gear/skill context and aura state;
- deterministic Encounter Fingerprints covering monster, damage profile, map/context, spawn density and content-safety disposition;
- realizable candidate generation: exactly one Merchant plus three distinct available combat characters, with duplicate classes allowed;
- safety-first scoring with explainable component scores and hard safety rejections;
- bounded persistent Party Performance profiles with schema versioning, aging/freshness and confidence;
- empirical v2 triple-Ranger bootstrap prior for known safe farming content only;
- trusted party telemetry via bounded `send_cm` reports;
- Paladin aura recommendation for `bulwark`, `sanctuary`, `zeal`, and `warding` with hysteresis;
- a bounded PartyTransitionController with preflight, stop, start, party, verify, abort, rollback and failed-safe states;
- verified multi-character lifecycle checks through `get_active_characters()`;
- trusted Party Control Lease handshake for incoming/rollback invites;
- official Adventure Land `performance_trick()` integration with timer-drift monitoring and focus/visibility re-arm;
- JSON-safe public status/diagnostics for all Party components.

## Authority and default-deny boundary

Alpha.12 does not silently become autonomous because scoring exists.

At startup:

- `AIO_V3.status().mode === "shadow"`;
- `party.transition.liveEnabled === false`;
- `party.aura.automationEnabled === false`;
- `party.orchestrator.explorationEnabled === false`;
- `party.actionAuthority === false`;
- strategic Brain remains `mode: "shadow"` with `actionAuthority: false`.

Live Party transitions require both:

1. runtime mode `active`;
2. explicit `AIO_V3.party.setTransitionsEnabled(true)`.

Aura execution independently requires runtime `active` plus explicit `setAuraAutomationEnabled(true)`.

No Brain recommendation may directly execute movement, combat, inventory, aura or character lifecycle actions.

## Transition safety contract

A transition is allowed only when all preflight conditions are satisfied:

- the local controller is the configured Merchant;
- target composition contains the same Merchant and exactly three distinct combat characters;
- required CODE slots exist for both incoming and rollback characters;
- current outgoing characters are alive/available and above the safety HP floor;
- no active combat is present;
- no emergency recovery is active;
- account active-character state is available;
- no cross-map routing is required;
- the transition lease has not expired.

Execution uses only bounded official lifecycle actions:

- `stop_character(name)` followed by verified disappearance from active lifecycle state;
- `start_character(name, codeSlot)` followed by verified running state (`active` / `code` / `self`);
- trusted party invitation plus postcondition verification.

`smart_move`, map changes and server changes remain forbidden in Party transition execution.

If any step fails, the controller aborts and attempts to restore the prior party. A rollback failure ends in `FAILED_SAFE` rather than continuing with an unverified composition.

## Party Control Lease

Party invites are no longer trusted merely because they came from a familiar name.

For a controlled transition:

1. Merchant sends a short-lived `aio-v3-party-control` CM authorization to the exact incoming character.
2. The target accepts the authorization only when Merchant, target and roster are trusted and timestamps/transaction ID are valid.
3. The target acknowledges the lease back to the Merchant.
4. Merchant waits for the acknowledgement before sending the party invite.
5. The target accepts exactly one invite from the configured Merchant while that lease is valid.
6. The lease is consumed immediately; replayed/out-of-window invites are rejected.

Rollback invitations use the same bounded handshake with a rollback-scoped transaction ID.

No arbitrary JavaScript command is used for this handshake.

## Safety-first scoring

Measured danger has priority over throughput. High death or retreat rates can hard-reject a composition even if measured XP/h is very high.

Unknown/quarantined content lowers confidence and shifts scoring toward survival. The v2 triple-Ranger setup contributes only a low-weight empirical prior on known safe content; it is never a universal winner.

The user-provided v2 logs remain the empirical benchmark, with multiple Ranger samples in the multi-million XP/h range and several-hundred-thousand Gold/h range on suitable content, while also containing evidence that the composition is not safe everywhere.

## Paladin aura policy

The policy models the current four official aura states:

- `bulwark` — physical survival / HP / armor pressure;
- `sanctuary` — magical survival / resistance / MP-oriented pressure;
- `zeal` — safe throughput bias;
- `warding` — status/elemental/MP-cost pressure.

Aura recommendations are shadow decisions by default. Hysteresis prevents rapid aura flapping. Live aura execution is separately gated.

## Background execution / browser throttling

Alpha.12 uses Adventure Land's own `performance_trick()` as the preferred browser-background workaround rather than an undocumented worker/timer exploit.

`BackgroundExecutionGuard`:

- arms the official trick on runtime start;
- detects severe scheduler drift;
- re-arms after bounded cooldown;
- re-arms on focus/visibility changes when useful;
- removes installed listeners on runtime stop;
- fails soft in headless environments where the function does not exist;
- reports `guarantee: false`, because browser scheduling cannot be guaranteed by application code.

## Internal certification

The Alpha.12 test suite covers at minimum:

- deterministic Party and Encounter fingerprints;
- candidate realizability and duplicate-class legality;
- safe-content-only v2 triple-Ranger prior;
- hard death/retreat rejection despite extreme XP;
- persistent bounded performance aging and corrupt-data fail-closed behavior;
- Paladin aura selection and hysteresis;
- trusted bounded party telemetry;
- `performance_trick()` guard, drift re-arm and listener cleanup;
- transition default-deny preflight;
- controlled successful stop/start/invite/postcondition flow;
- trusted CM Party Control Lease handshake and one-shot invite acceptance;
- forged/mismatched/expired control-message rejection;
- rollback restoration after synthetic incoming-start failure;
- hardened Alpha.12 runtime authority boundary and visible release-version reporting;
- all Alpha.8 / Alpha.9 / Alpha.10 / Alpha.11 regression tests;
- generated browser bundle smoke verification.

## Explicitly still forbidden/default-off

Alpha.12 does not enable:

- automatic cross-map party assembly;
- `smart_move` Party routing;
- server switching;
- aggressive unknown-content exploration;
- arbitrary remote JavaScript execution;
- Brain-controlled gameplay;
- destructive economy/inventory behavior;
- automatic live Party transitions by default.

## Release gate

Alpha.12 becomes `CONFIRMED` only after all of the following are true:

1. version is exactly `3.0.0-alpha.12.0`;
2. default mode remains `shadow`;
3. `productionReplacement` remains `false`;
4. every implementation change is under `v3/**`; `bot.js` / v2 are untouched;
5. Party transition, aura automation and exploration default to disabled;
6. Brain remains shadow-only;
7. all unit/integration/fault/synthetic/regression tests pass;
8. generated browser bundle matches source;
9. branch CI is green;
10. PR workflow is green on the exact final PR head;
11. that exact validated PR head is merged to `main`;
12. one combined safe Adventure Land FULL Alpha.12 certification test passes after merge;
13. final real runtime is restored to `shadow` with live Party controls disabled.

Only after item 12 is observed may Alpha.12 be marked FULL CONFIRMED.
