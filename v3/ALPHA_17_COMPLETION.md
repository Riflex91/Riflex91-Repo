# Alpha.17 — Controlled Merchant/Travel Canary + Session Monitor

Release target: `3.0.0-alpha.17.0`

## Phase status

- Implementation: in progress until exact-head CI passes and PR is merged.
- FULL confirmation: **NOT YET CONFIRMED**.
- Default runtime mode remains `shadow`.
- `productionReplacement=false` remains unchanged.
- No live canary authority is enabled by default.

## Scope

Alpha.17 introduces the first explicitly opt-in controlled live boundary for two previously shadow/synthetic foundations while keeping every higher-risk family outside scope.

### Controlled Merchant executor

- SELL and BANK only.
- Exact operator acknowledgement `CONTROLLED_CANARY` is required before enabling.
- Runtime must already be `active` and the controlled character must be a living Merchant.
- Supervisor must be HEALTHY or WATCH.
- Combat, stale Ledger state, changed item identity/quantity/disposition, expired transaction leases, Content Drift revalidation, open action-family circuits and missing game APIs fail closed.
- SELL/BANK use the official Promise APIs only.
- Transaction state is persisted before the raw action and again before verification.
- Completion requires bounded post-action inventory verification.
- Failure or mismatch enters `FAILED_SAFE` and feeds the existing per-family Economy circuit breaker.
- COMPOUND, UPGRADE, EXCHANGE, TRADE and SEND_ITEM remain outside live authority.

### Controlled Travel executor

- Uses only a previously validated Safe Travel plan.
- Exact operator acknowledgement `CONTROLLED_CANARY` is required before enabling.
- Runtime must already be `active`; Merchant/alive/no-combat/Supervisor gates apply.
- Plan lease, existing Travel circuit, known-map/content-drift contract and server-change prohibition are rechecked immediately before execution.
- Uses the official `smart_move()` Promise.
- Bounded timeout actively calls `stop("smart")`.
- Completion requires observed arrival through Safe Travel verification.
- Failure enters `FAILED_SAFE` and feeds the existing Travel circuit breaker.
- Unknown-map travel and server changes remain forbidden.

### Inventory action policy

- Runtime API can set bounded SELL/BANK/EXCHANGE classification allowlists.
- Policy configuration alone never grants action authority.
- Live SELL/BANK still require a separately planned transaction plus controlled-canary enable and all execution preconditions.

### Session monitor and debug GUI

- Read-only Session Monitor builds one bounded JSON session bundle from the canonical redacted EventLog and current runtime state.
- Export contains the complete currently retained EventLog, plus performance, registry, Inventory Ledger, Gear Progression, Economy transactions and Travel plans.
- GUI is optional and DOM-independent: headless operation remains fully supported.
- GUI includes a `Log kopieren` button.
- Copy path: Clipboard API -> legacy `execCommand('copy')` -> visible preselected textarea for manual Ctrl+C.
- GUI exposes no gameplay authority and cannot bypass safety gates.

## Explicit exclusions

Alpha.17 does not enable:

- automatic Economy execution,
- automatic Travel decisions,
- COMPOUND/UPGRADE/EXCHANGE execution,
- player trading or item sending,
- unknown-content exploration,
- server switching,
- Party transition/aura/exploration defaults,
- Strategic Brain gameplay authority,
- arbitrary JavaScript remote execution.

## Internal certification gate

Before merge the exact final implementation head must pass:

- all historical v3 regression tests,
- Alpha.17 unit/integration/fault tests,
- controlled SELL verified-commit test,
- controlled BANK verified-commit test,
- Merchant fail-safe/circuit test,
- controlled Travel verified-arrival test,
- Travel fail-safe/circuit test,
- acknowledgement/default-deny tests,
- monitor full-retained-log/redaction/clipboard tests,
- GUI copy-button/read-only tests,
- 2000-cycle bounded diagnostic/guard soak,
- browser bundle smoke,
- generated-bundle verification,
- `git diff --check`.

## Post-merge FULL gate

After the implementation PR is merged, run one combined operator phase test rather than separate manual tests for each sub-change. The live test must begin from safe defaults and use only deliberately selected low-risk canary actions. The resulting session bundle is copied with the GUI button and reviewed before Alpha.17 can be marked FULL CONFIRMED.

Do not mark this document FULL CONFIRMED from CI alone.
