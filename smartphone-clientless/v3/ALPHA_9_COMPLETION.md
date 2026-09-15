# Alpha.9 Completion Gate — Same-Map Local Farming Autonomy

Version target: `3.0.0-alpha.9.0`

Alpha.9 is complete only when the deterministic Farmer can maintain a bounded autonomous farming loop on the **current map** without weakening any Alpha.8 safety contract.

## Phase goal

The combined loop is:

1. Alpha.8 observes and handles visible combat through the existing Farmer/Safety stack.
2. When no live monster is visible and the Farmer is otherwise idle/safe, Alpha.9 may select a known approved spawn on the current map.
3. Alpha.9 repositions toward that spawn using only bounded local `move(x, y)` steps through the Stability Game Adapter.
4. As soon as any live monster becomes visible, Alpha.9 yields and the Alpha.8 combat stack owns the situation again.
5. Plans are held with hysteresis, time-bounded with a lease, and aborted on loss of eligibility, map change or bounded no-progress.

## Safety boundary

Alpha.9 deliberately does **not** add:

- `smart_move`
- cross-map routing
- doors/transports/server changes
- deliberate pull-control logic
- unknown-content combat approval
- full skill rotations
- economy/Merchant actions
- Brain autonomy

The only new gameplay primitive remains the already allowlisted local `move(x, y)` command.

## Mandatory invariants

### Content and map safety

- Spawn candidates come only from current-map metadata.
- A monster type must already be `APPROVED` or `LEGACY_ALLOWED` by Content Safety.
- `QUARANTINED`, unknown or policy-missing monster types are never local-farming destinations.
- A current plan is aborted immediately after a map change.
- A current plan is aborted when its monster policy is no longer eligible.
- `mapChangeAllowed` remains `false`.
- `smartMoveAllowed` remains `false`.

### Combat precedence

Alpha.9 must not compete with Combat:

- any visible live monster causes local repositioning to yield immediately
- self aggro blocks local repositioning
- an existing Farmer target blocks local repositioning
- Farmer `ENGAGE`, `TRAVEL` and `RECOVER` states block local repositioning
- HP below the local-farming safety threshold blocks repositioning
- Emergency/Kiting/Retreat and all Alpha.8 deterministic safety rules remain authoritative

### Bounded movement

- movement is local `move(x, y)` only
- each step is bounded; default maximum is 120 distance units
- movement commands use the Alpha.8 command-outcome tracker
- a pending move outcome suppresses another local-farming move
- an open Alpha.8 movement circuit suppresses local farming
- movement command failures have a finite per-plan budget
- real no-progress has a timeout and aborts the plan
- shadow preview movement never consumes real no-progress/failure budgets

### Anti-thrashing

Every plan has:

- minimum hold time
- finite lease
- minimum material-improvement requirement before switching
- replan cooldown after abort
- finite no-progress window

A plan must not oscillate between spawns because of small scoring noise.

### Headless/dashboard contract

`AIO_V3.status().localFarming` and `AIO_V3.localFarming.status()` expose serializable status including:

- scope/navigation boundary
- configuration
- current/last plan
- latest movement decision
- latest abort
- bounded scalar counters

No DOM, visible browser, `game_log`, or dashboard connection is required for local farming.

## Internal certification

The Alpha.9 test suite must cover at minimum:

- approved same-map spawn extraction
- rejection of unknown/unapproved spawn metadata
- bounded shadow move preview
- bounded active move and pending-outcome coalescing
- visible-monster yield including unknown content
- low-HP suppression
- movement-circuit suppression
- bounded no-progress abort and replan cooldown
- minimum hold time and material-improvement hysteresis
- immediate map-change invalidation
- immediate content-policy invalidation
- dashboard-safe/JSON-serializable runtime status
- long synthetic shadow soak with bounded logs/scheduler/outcome history/plan churn

All existing Alpha.8 regression tests remain mandatory.

## Phase release gate

Alpha.9 becomes `CONFIRMED` only after all of the following are true:

1. version is `3.0.0-alpha.9.0`
2. default mode remains `shadow`
3. `productionReplacement` remains `false`
4. all repository changes are under `v3/**`; v2 `bot.js` is untouched
5. complete CI is green
6. browser bundle is generated and matches sources
7. the pull-request workflow is green on the **exact final PR head**
8. the exact validated PR head is merged to `main`
9. one combined safe FULL Alpha.9 Adventure Land certification test passes
10. final real runtime is restored to `shadow`

Only then may development proceed to the next phase.
