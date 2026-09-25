# AL 2.5D roadmap

## AL25D-01 — Foundation

Status: in progress

- [x] project skeleton
- [x] renderer boundary
- [x] reversible 2.5D projection
- [x] PixiJS scene bootstrap
- [x] depth sorting baseline
- [x] asset namespace policy
- [x] projection tests
- [x] first deterministic render snapshot fixture
- [x] stable 2.5D asset registry
- [ ] CI job for build/tests

## AL25D-02 — Upstream logic inventory

Status: complete

- [x] pin the exact Adventure Land source snapshot
- [x] classify core files as logic / networking / persistence / mixed / presentation
- [x] produce a machine-readable parity manifest
- [x] identify initial direct Pixi/render migration hooks
- [x] identify public CODE drawing/click APIs that must preserve behavior

Deliverable: `docs/upstream-manifest.json`.

## AL25D-03 — Legacy client bridge

Status: in progress

- [x] translate legacy entities to immutable RenderEntity snapshots
- [x] preserve authoritative world x/y coordinates in the snapshot
- [x] map 2.5D pointer coordinates back to legacy world x/y
- [x] preserve `on_map_click` callback return semantics
- [ ] boot original client state/network logic without its old scene renderer
- [ ] redirect `add_character` into the snapshot/render bridge
- [ ] redirect `add_monster` into the snapshot/render bridge
- [ ] preserve map transitions
- [ ] add golden tests against captured legacy outputs

Deliverable: original game logic driving the new renderer.

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
