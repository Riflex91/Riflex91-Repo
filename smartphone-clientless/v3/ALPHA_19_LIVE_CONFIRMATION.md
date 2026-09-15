# Alpha.19 — Production Live Confirmation

Release: `3.0.0-alpha.19.0`

Production gate date: 2026-09-12

Gate: `ALPHA19_FULL_LIVE_GATE`

## Result

Alpha.19 production live confirmation **PASSED** and is **confirmation-eligible**.

The captured production result reported:

- `pass=true`
- `confirmationEligible=true`
- no confirmation blockers
- `testMode=false`
- required production observation: `600000 ms`
- no fabricated capacity pressure
- no forced inventory mutation
- no Travel authority
- no shell-expansion authority
- raw-action budget remained `3`
- Emergency Reclaim limit remained exactly one unit with bulk reclaim forbidden
- Emergency Reclaim authority was deliberately disabled for this run

The gate started at `2026-09-12T15:56:45.708Z` and completed at `2026-09-12T16:06:46.944Z`.

## Precheck and authority containment

The production precheck passed with the Merchant alive in the bank and the Supervisor in the accepted `WATCH` state. The WATCH reason was `CONTENT_REVALIDATION_REQUIRED`; independent combat, persistence, party, brain and progress subsystems remained healthy.

Before controlled execution:

- Alpha.19 space recovery was disabled
- parent action authority was false
- direct gameplay access was false
- consolidation was disabled
- expansion purchase authority was false
- Emergency Reclaim authority was false
- all relevant circuits were closed

The wrong-ack probe passed with `WRONG_ACK_REJECTED` and proved that an invalid parent acknowledgement could not enable space-recovery, expansion-purchase or Emergency-Reclaim authority.

## Real recovery canary

The gate selected one real fresh Inventory Ledger item already classified `BANK` by operator policy. No inventory item or bank pressure was fabricated by the gate.

The live planner selected:

- action: `DEPOSIT_FREE_SLOT`
- reason: `FREE_BANK_SLOT_AVAILABLE`
- target pack: `items0`
- destructive: `false`

The reserved parent operation committed successfully as `SPACE_RECOVERY_DEPOSIT_COMMITTED`.

Execution evidence:

- raw gameplay actions: exactly `1`
- raw action: controlled BANK deposit through the existing Merchant transaction path
- transaction committed with server acknowledgement
- Emergency Reclaim count: `0`
- mandatory reobservations recorded: `2`
- invariant failures: none
- Travel authority: false
- shell-expansion authority: false
- direct gameplay access: false

No paid bank expansion and no SELL action occurred in this production confirmation run.

## Passive production observation

After the canary, the gate returned the runtime to the safe default state before beginning the passive window.

The complete passive observation passed:

- required duration: `600000 ms`
- confirmation duration satisfied: true
- samples: `121`
- first sample mode: `shadow`
- last sample mode: `shadow`
- Farmer disabled throughout sampled boundaries
- space recovery disabled
- expansion purchase authority disabled
- Emergency Reclaim authority disabled
- consolidation disabled
- controlled Merchant disabled
- controlled bank expansion disabled
- controlled Travel disabled
- SELL circuit closed
- BANK circuit closed
- Travel circuit closed
- bank-expansion circuit closed
- space-recovery circuit closed
- Bank Capacity retained `actionAuthority=false`
- violations: none
- error events: none
- unexpected parent attempts: `0`
- unexpected consolidation attempts: `0`
- unexpected Merchant attempts: `0`
- unexpected expansion attempts: `0`
- unexpected Travel attempts: `0`

## Final safe state

At gate completion:

- runtime mode: `shadow`
- Farmer: disabled
- Supervisor: `WATCH`
- Alpha.19 space recovery: disabled
- expansion purchase authority: false
- Emergency Reclaim authority: false
- consolidation: disabled
- controlled Merchant: disabled
- controlled bank expansion: disabled
- controlled Travel: disabled
- all monitored circuits: closed
- Bank Capacity action authority: false
- final safety violations: none

A small manual Merchant movement during the passive observation did not violate any gate invariant: the Merchant remained in a valid bank context and the gate completed with the full observation, zero violations, zero errors, zero unexpected action deltas and a valid final safe state.

## Confirmation decision

The production evidence satisfies the Alpha.19 FULL confirmation criteria defined by `ALPHA_19_COMPLETION.md`:

1. real production run, not test mode
2. exact combined live-gate acknowledgement
3. real fresh `BANK`-classified canary source
4. committed controlled recovery coverage
5. raw-action budget respected
6. no destructive Emergency Reclaim
7. full ten-minute production observation
8. no error events or unexpected actions
9. all relevant circuits closed
10. final runtime returned to `shadow` / default-off

**Decision: Alpha.19 production behavior is FULL CONFIRMED once this documentation-only confirmation PR is certified against its exact final head and merged.**
