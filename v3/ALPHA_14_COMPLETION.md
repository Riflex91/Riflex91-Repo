# Alpha.14 Completion Gate — Inventory Ledger + Sustainable Gear Progression Foundation

Version target: `3.0.0-alpha.14.0`

Alpha.14 establishes the central non-destructive economy planning layer required before any Merchant executor may sell, bank, exchange, compound or upgrade items.

The default remains safe: runtime `shadow`, `productionReplacement=false`, Brain shadow-only, Supervisor safe actions OFF, Party transitions OFF, aura automation OFF, Party exploration OFF, Inventory/Gear action authority OFF.

## Inventory Ledger

The Inventory Ledger is the single planning truth for observed controlled-character inventory. Each observed item is assigned one deterministic disposition:

- `KEEP`
- `RESERVE_GROUP`
- `RESERVE_PROGRESSION`
- `RESERVE_COMPOUND`
- `RESERVE_UPGRADE`
- `SELL`
- `BANK`
- `EXCHANGE`
- `UNDECIDED`

Safety rules:

- locked or special items are `KEEP`;
- item metadata missing or requiring Content Drift revalidation stays `UNDECIDED`;
- active Gear Goals take precedence over disposal;
- configured HP/MP group reserves are protected;
- compound sets may be reserved, but are never executed;
- `SELL`, `BANK` and `EXCHANGE` classifications require explicit operator allowlists;
- the default disposition is `UNDECIDED`, never `SELL`;
- workspace-slot pressure is observed and reported;
- capacity is hard bounded and JSON-safe.

Alpha.14 does **not** add `sell`, `bank`, `compound`, `upgrade`, `exchange`, `trade` or item-transfer actions to the Safe Game Adapter allowlist.

## Sustainable Gear Progression Evaluator

The evaluator compares held candidate equipment against observed current group equipment using deterministic class-sensitive weighted item stats.

Responsibilities in Alpha.14:

- compare item / level / character / slot combinations;
- respect item class and character-level compatibility;
- derive numeric base plus per-upgrade metadata stats without allowing NaN/Infinity propagation;
- search for the first meaningful upgrade level instead of assuming `+0` is useful;
- create stable long-term Gear Goals;
- reserve held lower-level candidate ingredients for those goals;
- prioritize survivability-positive goals before pure efficiency when ordering goals;
- mark projected upgrades as `MATERIALS_AND_RISK_UNMODELED` rather than inventing success probabilities;
- block quarantined/changed item metadata until revalidated;
- persist goals with schema versioning and bounded capacity;
- fail closed on corrupt/unsupported persisted goal data.

Default progression mode is `sustainable`.

The evaluator does not claim that an upgrade is economically feasible when acquisition cost, scroll cost, success probability or item-loss risk has not yet been modeled. That belongs to the later transactional Merchant phase.

## Public diagnostics

Alpha.14 adds read/status APIs:

- `AIO_V3.inventory.status()`
- `AIO_V3.inventory.entries(limit)`
- `AIO_V3.inventory.item(character, index)`
- `AIO_V3.gearProgression.status()`
- `AIO_V3.gearProgression.goals(limit)`
- `AIO_V3.gearProgression.save()`

There is deliberately no public `sell`, `bank`, `compound`, `upgrade` or `exchange` executor API in Alpha.14.

## Internal certification

The Alpha.14 suite must cover at minimum:

- ledger schema/mode/action-authority boundary;
- hard capacity and JSON serialization;
- locked/special item protection;
- unknown metadata fail-closed behavior;
- Content Drift revalidation blocking disposal;
- explicit allowlist requirement for sell classification;
- group potion reserve behavior;
- progression reservations overriding disposal;
- deterministic finite gear stat scoring;
- class compatibility;
- first meaningful upgrade-level discovery;
- sustainable Gear Goal creation;
- corrupt persistence fail-closed behavior;
- destructive adapter actions still rejected;
- Alpha.14 runtime integration;
- all prior Alpha.8–13 regression tests;
- generated browser bundle smoke checks;
- 2000-cycle combined Inventory/Gear soak.

## Explicitly still forbidden/default-off

Alpha.14 does not enable:

- selling;
- banking;
- exchanging;
- compound execution;
- upgrade execution;
- trading/item transfers;
- arbitrary Merchant travel;
- destructive inventory cleanup;
- Brain gameplay authority;
- automatic unknown-content approval;
- Party transition/aura/exploration live defaults.

## Release gate

Alpha.14 becomes `CONFIRMED` only after:

1. version is exactly `3.0.0-alpha.14.0`;
2. default mode remains `shadow`;
3. `productionReplacement=false`;
4. all changes stay under `v3/**` and v2 remains untouched;
5. Inventory Ledger and Gear Progression have no gameplay authority;
6. destructive economy actions remain absent from the Safe Game Adapter allowlist;
7. all prior Brain/Party/Supervisor/Content/Combat safety defaults remain unchanged;
8. all unit/integration/fault/synthetic/regression/soak tests pass;
9. generated bundle matches source;
10. branch CI is green;
11. PR workflow is green on the exact final PR head;
12. that exact head is merged to `main`;
13. one combined safe Adventure Land Alpha.14 FULL certification passes after merge;
14. final runtime is restored to `shadow` with all live Party/economy controls disabled.

Freeze candidate: source implementation complete; full branch CI pending.
