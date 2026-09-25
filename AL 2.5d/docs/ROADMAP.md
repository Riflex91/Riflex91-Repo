# AL 2.5D roadmap

## AL25D-01 — Foundation

Status: complete

- [x] project skeleton
- [x] renderer boundary
- [x] reversible 2.5D projection
- [x] PixiJS scene bootstrap
- [x] depth sorting baseline
- [x] asset namespace policy
- [x] projection tests
- [x] first deterministic render snapshot fixture
- [x] stable 2.5D asset registry
- [x] scoped CI job for verify/tests/build

## AL25D-02 — Upstream logic inventory

Status: complete

- [x] pin the exact Adventure Land source snapshot
- [x] classify core files as logic / networking / persistence / mixed / presentation
- [x] produce a machine-readable parity manifest
- [x] identify initial direct Pixi/render migration hooks
- [x] identify public CODE drawing/click APIs that must preserve behavior
- [x] document upstream PIXI/game-state coupling and compatibility strategy

Deliverable: `docs/upstream-manifest.json`.

## AL25D-03 — Legacy client bridge

Status: in progress

- [x] translate legacy entities to immutable RenderEntity snapshots
- [x] preserve authoritative world x/y coordinates in the snapshot
- [x] map 2.5D pointer coordinates back to legacy world x/y
- [x] preserve `on_map_click` callback return semantics
- [x] implement read-only mirror loop for legacy global state
- [x] keep legacy PIXI entity objects as temporary hidden compatibility state
- [x] embed/attach the pinned original client state/network runtime through a same-origin compatibility host
- [x] hide legacy visual canvas while keeping compatibility objects alive
- [x] route 2.5D map clicks through the original `map_click` / `on_map_click` path
- [x] mirror `current_map` plus immutable `G.maps` / `G.geometry` metadata summaries
- [ ] route 2.5D entity clicks to original target/click handlers
- [ ] preserve map transitions
- [ ] add golden tests against captured legacy outputs

Deliverable: original game logic driving the visible new renderer.

## AL25D-04 — First playable 2.5D map

- new Main/Town visual asset set
- 2.5D map renderer
- characters
- NPCs
- Goo/first monsters
- camera
- click-to-move
- nameplates and target bars
- baseline HUD

Deliverable: walkable Main with original gameplay logic.

## AL25D-05 — Combat and VFX parity

- attacks
- projectiles
- skills
- damage/heal feedback
- death/respawn
- loot/chests
- combat UI

## AL25D-06 — Full HUD replacement

- character frame
- party frame
- target frame
- skill bars
- chat
- inventory/equipment
- quests/events
- minimap
- menus/settings

## AL25D-07 — Content coverage

Replace visual assets map-by-map and entity-by-entity until no original art is required by the new client.

## AL25D-08 — Release hardening

- performance budgets
- reconnect torture tests
- renderer fallback handling
- asset validation
- browser/device matrix
- packaging and deployment
