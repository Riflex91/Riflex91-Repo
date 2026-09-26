# Upstream migration inventory

Reference snapshot:

- repository: `kaansoral/adventureland_mongodb`
- commit: `ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`
- tree: `7bb2e90f4eed513b441ec3f463d872e10c85c86b`

The upstream tree contains more than two thousand files. The 2.5D fork must not copy that tree indiscriminately. The migration is split by semantic responsibility so visual replacement cannot accidentally rewrite game rules.

## Preserve server behavior

The core server is already server-authoritative and should remain behaviorally equivalent:

- `node/server.js`
- `node/server_functions.js`
- `node/server_worker.js`
- `models.js`
- `adventure_functions.js`

These files cover the networking/world/combat/persistence side of the game. They are not render targets.

## Preserve gameplay data semantics

The following data is gameplay content, even if some records contain visual IDs:

- classes
- conditions
- drops
- events
- items
- levels
- monsters
- NPCs
- projectiles
- recipes
- skills
- tokens
- upgrades

Their game-facing values are preserved. Visual fields such as sprite/skin/icon references will be mapped to new 2.5D asset IDs without changing their gameplay meaning.

## Mixed files: highest migration risk

### `js/game.js`

This is the main client hotspot. It contains both state handling and direct PIXI scene construction.

Confirmed render coupling includes:

- PIXI display groups/layers
- `add_character(data, me)`
- `add_monster(data)`
- direct sprite creation
- click-to-world coordinate handling
- nameplates/effects/entity layering

Strategy: extract read-only render snapshots and keep the existing socket/state/gameplay pathways intact.

### `js/functions.js`

Contains shared helpers and texture/sprite construction. Functions that are gameplay-neutral can remain. Texture creation and image lookups move behind the 2.5D renderer/asset registry.

### `js/html.js`

Legacy UI implementation. UI semantics and actions must remain equivalent, while layout and visuals are replaced.

### `design/maps.js`

Mixed content. It contains map topology/gameplay information such as spawns, doors, monster packs and map flags, while also referencing visual map keys.

Strategy: preserve topology and all gameplay fields; remap only visual representation.

### `design/dimensions.js`

Contains dimensions/visual metadata used by sprites and layout. Treat as compatibility input during migration, not as final art truth.

### `js/runner_functions.js`

Mostly part of the public CODE API and therefore compatibility-critical, but it also exposes visual helpers such as drawing circles and lines.

Strategy: preserve function signatures and behavior; delegate visual implementation to the new renderer.

## Replace presentation

The final 2.5D client should not depend on original visual files.

Replacement targets include:

- `design/sprites.js`
- `design/animations.js`
- `design/precomputed_images.js`
- `images/sprites/**`
- `images/tiles/**`
- legacy CSS/HUD presentation

Each logical entity keeps a stable ID while its visual implementation is resolved through the new asset registry.

## First migration hooks

The first client bridge will target these symbols:

1. `add_character`
2. `add_monster`
3. `map_click`
4. `on_map_click`
5. `draw_line`
6. `draw_circle`

This gives us characters, monsters, pointer movement and public drawing APIs without modifying combat/network rules.

## Acceptance rule

For the same authoritative state and user/CODE input, the legacy client and 2.5D client must produce equivalent gameplay actions. Differences are allowed only in pixels, animation interpolation, camera, lighting, VFX and UI layout.
