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
- [ ] CI job for build/tests
- [ ] first render snapshot fixture

## AL25D-02 — Upstream logic inventory

- pin the exact Adventure Land source snapshot
- classify files as logic / networking / persistence / rendering / assets
- produce a parity manifest
- identify every direct Pixi/render dependency in gameplay code
- identify every UI call that has gameplay side effects

Deliverable: a machine-readable migration manifest.

## AL25D-03 — Legacy client bridge

- boot original client logic without its old scene renderer
- translate legacy entities to immutable RenderEntity snapshots
- preserve socket event behavior
- preserve movement/collision coordinates
- preserve map transitions
- add golden tests against legacy outputs

Deliverable: original game logic driving a blank/new renderer.

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
