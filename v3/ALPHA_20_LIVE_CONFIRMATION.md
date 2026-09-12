# Alpha.20 — Production Live Confirmation

Release: `3.0.0-alpha.20.0`

## Evidence source

- Live-gate implementation source `main`: `bce44c2e12b779222e414e754bb7412ee6168e21`
- Source tree: `d06bd7aa9d17f4a87892e28e891ff5a936633930`
- Certified live-gate preparation parent: `8d3dce7f5a5dda11eb532e64addf152343da8b3f`
- Required gate acknowledgement: `ALPHA20_FULL_LIVE_GATE`
- Production run started: `2026-09-12T17:25:07.839Z`
- Production run finished: `2026-09-12T17:35:09.535Z`
- Test mode: `false`

The complete operator-supplied live-gate result was reviewed after the run. This document records the confirmation evidence; it does not change gameplay authority.

## Overall result

- `pass: true`
- `confirmationEligible: true`
- `confirmationBlockers: []`
- required observation: `600000 ms`
- actual passive observation: `601676 ms`
- passive samples: `121`
- `confirmationDurationSatisfied: true`
- `fourCharacterCoverage: true`
- `lifecycleEvaluationCoverage: true`
- cancellation: `false`

## Precheck evidence

The production precheck passed with no failures.

Observed real party shape:

- one Merchant controller
- three Ranger combat characters
- four unique members total
- all four `online: true`
- all four `presence: ONLINE`
- all four alive and available
- all four on map `main`

The Supervisor was `WATCH` because of `CONTENT_REVALIDATION_REQUIRED`. `WATCH` is an explicitly permitted Alpha.20 live-gate state; the party, combat, persistence, brain and progress subsystems were healthy and no economy emergency was active.

Lifecycle boundaries were intact:

- maximum Development slots: `1`
- Development slots used: `0`
- controlled lifecycle default-off
- transition authority default-off
- Development rotation authority default-off
- controlled Paladin aura default-off
- aura action authority default-off
- no pre-existing Development session
- lifecycle circuit closed
- legacy transition child disabled
- legacy transition/aura bypasses disabled

## Wrong-ack and aura boundary

The wrong-ack probe passed. Invalid acknowledgements did not enable either controlled party-lifecycle authority or controlled aura authority.

Merchant-hosted remote Paladin aura execution was not attempted, by design. The combined Merchant gate only validates the Paladin aura authority boundary; a Merchant process may not fabricate execution on another character process merely for coverage.

## Candidate and transition canary

The real lifecycle evidence reported:

- candidate state: `NO_CHANGE_JUSTIFIED`
- Promotion candidates: `0`
- Development candidates: `0`
- active combat members: `3`
- lifecycle evaluations before the passive window: `124`

Accordingly, the controlled transition canary returned:

- `pass: true`
- state: `NOT_JUSTIFIED`
- reason: `NO_ELIGIBLE_LIFECYCLE_CHANGE`
- executed: `false`
- raw transition attempts: `0`

This is the expected safe result. Alpha.20 explicitly forbids fabricating a Promotion or Development candidate only to obtain action coverage. Zero raw transition attempts are confirmation-valid when no real permanent change is justified.

## Passive observation

The full production passive window completed for `601676 ms` with `121` samples.

At both the beginning and end of the window:

- runtime mode was `shadow`
- Farmer was disabled
- Supervisor remained `WATCH`
- economy emergency remained false
- the real Merchant + three-combat party remained valid
- Development slots used remained `0`
- controlled party lifecycle remained disabled
- party transition authority remained disabled
- Development rotation authority remained disabled
- controlled aura remained disabled
- aura action authority remained disabled
- legacy transition/aura bypasses remained disabled
- controlled Merchant space recovery, consolidation, Merchant executor, bank expansion and travel remained disabled
- monitored circuits remained closed
- Merchant remained alive
- Merchant remained out of combat
- no cancellation was requested

Lifecycle evaluations advanced from `125` in the first sample to `365` in the last sample, providing real observation coverage while action authority remained closed.

## Unexpected-action and fault evidence

Passive-window violations: `[]`

Error events: `[]`

Unexpected action deltas were all exactly zero:

- party transition attempts: `0`
- aura attempts: `0`
- Merchant space-recovery attempts: `0`
- bank-consolidation attempts: `0`
- controlled Merchant attempts: `0`
- bank-expansion attempts: `0`
- controlled travel attempts: `0`

The countdown completed normally with `durationMs: 600000`, `remainingMs: 0` and `completed: true`.

## Final safe state

Final state remained fail-safe/default-off:

- release: `3.0.0-alpha.20.0`
- mode: `shadow`
- Farmer disabled
- valid Merchant + three-combat party
- Supervisor `WATCH`
- economy emergency false
- all monitored circuits closed
- controlled lifecycle/aura/economy/travel authority off
- legacy transition/aura bypasses off
- Merchant alive and out of combat
- cancellation false
- `finalViolations: []`

## Confirmation conclusion

The reviewed production evidence satisfies the Alpha.20 combined four-character live-gate requirements. The absence of a raw party transition is intentional and correct because no genuine Promotion or Development change was justified by the measured lifecycle state.

This live result is therefore **eligible for Alpha.20 production confirmation**.

Alpha.20 must still not be called **FULL CONFIRMED** until this documentation-only confirmation change is exact-final-head certified by the complete release CI, SHA-bound merged, and the resulting `main` commit/tree/both parents are verified.
