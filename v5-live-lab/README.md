# V5 Live Lab

Experimental live-runtime workspace derived from official V5 at main commit:

`3fde62bd75aaed495b60cc71b1cfc4c197af4316`

## Purpose

This branch is intentionally isolated from the official V5 verification track.

The official `main:v5/` roadmap, historical evidence, PR gates and automated test sequence remain authoritative and must not be rewritten by Live Lab work.

Live Lab exists to run the future integrated bot early in real Adventure Land gameplay so long-running and cross-feature faults can be observed and converted into V5 Live-Test Bug issues.

## Authority model

Live Lab may grant real runtime authority when its own admission checks pass:

- gameplayAuthority = true
- normalRuntimeAllowed = true
- liveExecutionAllowed = true

This does **not** disable safety. The following remain fail-closed:

- emergency stop / capability deny
- stale session, roster, target and evidence checks
- duplicate irreversible-effect protection
- retry bounds and transaction reconciliation
- movement / target ownership
- AoE hard caps
- Merchant ping-pong / thrash protection
- server-mode / PvP-hardcore policy gates
- unknown or quarantined world content

## Isolation rules

1. Never merge Live Lab authority changes into official V5 merely because they worked in Live Lab.
2. Never rewrite historical V5 evidence from Live Lab.
3. Every Live Lab observation must include the Live Lab commit SHA/build id.
4. Production V5 gates remain independently ratified by the verification track.
5. Live faults are recorded using the V5 Live-Test Bug schema.
6. Live Lab writes stay on the dedicated `chatgpt/v5-live-lab-pr28` branch unless explicitly promoted through a reviewed fix.

## Initial implementation target

Integrate the already prepared PR21-PR28 foundations into a live-capable runtime overlay while keeping all hard safety invariants intact:

- PR21 Merchant integration
- PR22 multi-character coordination
- PR23 Farmer runtime
- PR24 group topology/capability handling
- PR25 grouped runtime/evidence telemetry
- PR26 task/party optimizer
- PR27 account progression
- PR28 world autonomy

Live Lab authority is granted only by the overlay. Official PR21-PR28 shadow contracts remain unchanged.
