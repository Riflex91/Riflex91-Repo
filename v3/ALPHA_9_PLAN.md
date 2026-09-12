# Alpha.9 — Autonomous Local Farming & Strategic Brain Foundation

Alpha.9 is one coherent development phase. Internal milestones remain independently testable, but there is one external certification gate at the phase end. Alpha.10 does not begin until the complete Alpha.9 phase passes CI, fault injection, synthetic soak and one combined safe Adventure Land validation.

## Phase target

Freeze target: `3.0.0-alpha.9.10`.

Alpha.9 builds on the fully confirmed Alpha.8 Combat & Stability foundation. Default mode remains `shadow`; `productionReplacement` remains `false`; v2 `bot.js` remains untouched.

## Internal milestones

### Alpha.9.0 — Local Farming Loop

- Same-map spawn catalog from live/map metadata with tolerant shape parsing.
- Only already-safe/approved monster types may become local navigation goals.
- No cross-map routing, no unknown-content exploration and no deliberate pull expansion.
- If no safe live target is visible, choose a safe same-map spawn goal through the existing deterministic planner.
- Move toward that goal only through the verified Alpha.8 movement adapter, with bounded local steps, hold-time/hysteresis and movement-circuit respect.
- Visible combat, recovery and Emergency Retreat always outrank spawn seeking.

### Alpha.9.1 — Brain Interface v1

- Strategic observation only; no raw gameplay calls.
- Fixed action vocabulary: `continue`, `change_farm_target`, `replan_merchant`, `explore`, `wait`.
- Deterministic action masks disable unavailable/unsafe actions.

### Alpha.9.2 — v2 Feature Encoder → v3

- Exactly 32 normalized strategic features.
- Stable feature names/order and bounded values.
- Missing information maps to conservative neutral/default values rather than NaN/Infinity.

### Alpha.9.3 — Student + Replay

- Local 32 → 24 tanh → 5 softmax Student.
- Xavier-like initialization, SGD/backprop, gradient clipping and light L2.
- Bounded prioritized replay with deterministic validation sampling.

### Alpha.9.4 — Outcomes / Reward

- Bounded pending strategy outcomes with leases/timeouts.
- Reward from measured EXP/gold progress, safety, inventory headroom and party health where available.
- Death/error/safety regression penalties.
- Reward clamped to `[-1, 1]`.

### Alpha.9.5 — Teacher Distillation

- Teacher transport is host-provided; the gameplay bundle never requires network availability.
- Teacher responses are validated against the fixed action vocabulary and action mask.
- Confidence, action scores, reason, lesson and expected outcome changes are accepted as bounded telemetry/training data.
- No Teacher outage may block farming.

### Alpha.9.6 — Champion / Challenger

- Shadow-first eligibility gates.
- Champion snapshot, Challenger validation, bounded canary allocation, probation and rollback snapshot.
- Safety incident immediately blocks/rejects Challenger autonomy.

### Alpha.9.7 — Brain Quality / Quarantine / Rollback

- Rolling quality window.
- States: `warming`, `healthy`, `watch`, `degraded`, `quarantine`.
- Quality may reduce/disable strategic influence but can never bypass deterministic Alpha.8 safety.

### Alpha.9.8 — Brain Diary + Research Bridge

- Bounded deterministic diary; no extra LLM calls.
- Sanitized compact research summary without model weight matrices or credentials.
- Dashboard/status surfaces remain JSON-serializable and bounded.

### Alpha.9.9 — First Conservative Strategic Influence

Brain influence is deliberately narrow:

- Brain never calls `attack`, `move`, `use_skill`, potions or any other gameplay API.
- Brain may only affect the deterministic local farming planner through a short-lived preference/hold recommendation.
- `explore` remains masked for unknown content.
- `replan_merchant` remains masked until a deterministic Merchant exists.
- `wait` may suppress starting a new local spawn-seeking move for a bounded period, but never interrupts combat, retreat or recovery.
- `change_farm_target` can only choose among already-safe same-map spawn candidates produced by deterministic code.
- Strategic influence defaults OFF even though learning/shadow observation defaults ON.

### Alpha.9.10 — Phase Freeze

- Full regression against all Alpha.8 safety contracts.
- Brain/state persistence and restart reconciliation.
- Fault injection for malformed Teacher data, no Teacher, stale snapshots, no-progress farming, movement circuit, persistence faults and model corruption.
- Synthetic long-run soak proving bounded logs/replay/diary/outcomes/plans.

## Additional unattended-operation hardening

Alpha.9 also adds a local progress watchdog. Lack of meaningful progress never triggers unbounded retries: it first requests deterministic reassessment, then enters bounded cooldown/safe wait if repeated. Combat and emergency safety remain authoritative.

## Certification requirements

Alpha.9 is only `CONFIRMED` when:

1. Every Alpha.8 regression remains green.
2. All Alpha.9 unit/integration tests pass.
3. Browser VM smoke remains headless-safe (no DOM or `game_log` requirement).
4. Local navigation never targets quarantined content or crosses maps.
5. Brain feature vectors are finite, normalized and exactly 32 elements.
6. Student/replay/training remain bounded and serializable.
7. Teacher failure/malformed data is non-blocking and fail-closed.
8. Champion/Challenger/Quality rollback paths pass fault tests.
9. Brain cannot issue raw gameplay commands by construction.
10. Strategic influence cannot bypass Alpha.8 Content Safety, Combat Risk, movement circuit or Emergency Retreat.
11. Exact final PR-head CI is green.
12. One combined FULL Alpha.9 Adventure Land validation passes and ends in `shadow`.

## Explicit non-goals

Alpha.9 does not add cross-map navigation, server changes, Merchant/economy transactions, deliberate multi-pull control, autonomous unknown-content combat, full class rotations or direct Brain gameplay execution.
