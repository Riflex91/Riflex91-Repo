# Alpha.11 Completion Gate — Party Observation Foundation

Version target: `3.0.0-alpha.11.0`

Alpha.11 starts the adaptive Party Orchestrator roadmap with the smallest allowed step: a **read-only Character Registry**. It observes known characters and party members, but it does not score party compositions, recommend a switch, select a Paladin aura, log characters in/out or execute any gameplay action.

Alpha.10 is the prerequisite strategic layer and was FULL CONFIRMED before this phase began. The Alpha.8/Alpha.9 deterministic combat, safety and local-farming stack remains the sole gameplay authority; the Alpha.10 Brain remains shadow-only.

## Phase goal

Establish a bounded, JSON-safe and explainable source of truth for character observations that later Party Fingerprints and candidate generation can consume.

The registry records, where evidence exists:

- character name and class;
- level and map;
- online/presence state;
- availability state;
- observed position and death state;
- local-character gear;
- relevant numeric stats;
- level-unlocked class skills from current `G.skills` metadata;
- local-character inventory and HP/MP potion supply counts;
- observation source(s), timestamps and state confidence.

Missing evidence stays unknown instead of being guessed.

## Observation sources and confidence

Alpha.11 merges four read-only evidence sources with explicit source confidence:

- configured roster: bootstrap metadata, low confidence;
- current Adventure Land party snapshot: party presence/class/level/map;
- visible player entities: stronger live presence/position/vital evidence;
- current local character: highest-confidence live evidence, including read-only gear/stats/inventory enrichment.

Higher-quality observations may enrich lower-quality bootstrap records. The registry never converts an absent/stale observation directly into an `OFFLINE` claim. Once live evidence exceeds the stale lease it becomes `STALE` with `online=null` and `available=null` until refreshed. Explicit configured `online=false` remains an explicit offline bootstrap fact.

## Hard bounds and sanitization

- Registry capacity defaults to 32 and is hard-clamped to 4–128 characters.
- Inventory snapshots are bounded.
- Skill-unlock lists are bounded.
- Configured stats/supplies and live numeric observations are sanitized to finite values.
- `NaN`/`Infinity` never become trusted numeric registry state.
- Capacity pressure may evict lower-confidence non-self records; the current self observation is protected from normal eviction.
- Status and diagnostics remain JSON-serializable.

## Authority boundary

The registry reports:

- `mode: "observation-only"`
- `actionAuthority: false`
- `directActionAccess: false`
- `executorBypassAllowed: false`

It has no `command`, `move`, `attack`, `smart_move`, login/logout, party-switch or aura-control path.

Switching the bot adapter to `active` does not promote the registry or the Alpha.10 Brain to action authority.

## Runtime / public API

`Alpha11Runtime` extends `Alpha10Runtime` and samples party/character state on a bounded observation interval (default 1000 ms, hard-clamped).

Read-only diagnostics are exposed through:

- `AIO_V3.status().party.registry`
- `AIO_V3.party.status()`
- `AIO_V3.party.registry()`
- `AIO_V3.party.character(name)`
- `AIO_V3.exportDiagnostics()`

No party mutation API is exposed.

## Telemetry

Material registry lifecycle events use component `party-registry`, including:

- `CHARACTER_REGISTRY_MEMBER_ADDED`
- `CHARACTER_REGISTRY_MEMBER_CHANGED`
- `CHARACTER_REGISTRY_MEMBER_EVICTED`
- `CHARACTER_REGISTRY_OBSERVATION_REJECTED`

Routine timestamp refreshes do not emit a material-change event, preventing per-tick telemetry spam.

## Internal certification

The Alpha.11 suite covers at minimum:

- configured + party + visible + self observation merging;
- source precedence and state confidence;
- local read-only gear/stats/inventory/supply enrichment;
- level-dependent skill-unlock extraction;
- stale live evidence becomes `STALE/UNKNOWN`, not fabricated offline state;
- explicit offline bootstrap state remains distinguishable;
- hard registry capacity and low-confidence eviction;
- malformed numeric fault injection;
- JSON-safe status and diagnostics;
- active bot mode cannot grant Party Registry authority;
- Alpha.10 Brain remains shadow-only;
- no recommendation/transition state is created in this phase;
- 2000-observation synthetic soak with bounded registry size;
- all Alpha.8, Alpha.9 and Alpha.10 regression tests;
- generated browser bundle smoke coverage.

## Explicitly out of scope

Alpha.11 does **not** add:

- Encounter Fingerprints;
- Party Fingerprints beyond the pre-existing capability profile helper;
- party candidate generation;
- party scoring;
- `WOULD_KEEP` / `WOULD_SWITCH` recommendations;
- confidence learning for party performance;
- persistent party-performance data;
- Paladin aura recommendation or switching;
- character login/logout or character switching;
- PartyTransitionController execution;
- cross-map routing or server switching;
- Brain-controlled gameplay.

Those remain separate later phases.

## Phase release gate

Alpha.11 becomes `CONFIRMED` only after all of the following are true:

1. version is `3.0.0-alpha.11.0`;
2. default mode remains `shadow`;
3. `productionReplacement` remains `false`;
4. all implementation changes are under `v3/**`; v2 `bot.js` remains untouched;
5. Registry remains observation-only with zero action authority;
6. complete CI is green;
7. generated browser bundle matches sources;
8. pull-request workflow is green on the **exact final PR head**;
9. the exact validated PR head is merged to `main`;
10. one combined safe FULL Alpha.11 Adventure Land certification test passes;
11. final real runtime is restored to `shadow`.

Only after the FULL gate is confirmed should the next Party Orchestrator increment begin. The likely next coherent step is Party + Encounter Fingerprint telemetry, still without party scoring or switching.
