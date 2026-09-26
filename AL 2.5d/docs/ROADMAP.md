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
- [x] route 2.5D entity clicks to original monster/player/NPC click handlers
- [x] preserve map transitions in mirrored map state and camera follow
- [ ] add golden tests against captured legacy outputs

Deliverable: original game logic driving the visible new renderer.

## AL25D-04 — First playable 2.5D map

Status: in progress

- [ ] new Main/Town visual asset set
- [x] original Main/Town ground tileset crops projected into read-only 2.5D surfaces
- [x] original structure/group tile crops projected onto raised 2.5D tops
- [x] group-aware structure elevation to keep vegetation/props shallow and architecture deeper
- [x] depth-aware structure/entity occlusion in projected world order
- [x] decorative vegetation/fence groups flattened to remove residual dark plinths
- [x] mirrored immutable tile placements/groups from G.geometry
- [x] materialized 2.5D Main/Town surface massing from original placement footprints
- [x] presentation cleanup: seamless ground surfaces, quieter grid, stronger structure massing
- [x] tile-identity material detail pass for ground and structure surfaces
- [x] authored Main/Town material-language baseline for stone, grass, water, wood and architecture with deterministic facade lighting
- [x] procedural 2.5D ground/grid from immutable map bounds
- [x] optional collision-debug visualization from copied G.geometry lines
- [x] visible procedural fallbacks for characters, NPCs, monsters and props
- [x] camera follows the local character without changing gameplay coordinates
- [x] click-to-move continues through the original map_click/on_map_click path
- [ ] authored character/NPC/monster artwork and animation states
- [x] authored player class sprite baseline (warrior/mage/ranger/rogue/priest/paladin/merchant)
- [x] authored NPC/monster baseline sprites with first-party renderer priority
- [x] custom-player-art priority with live legacy sprite fallback for uncovered entities
- [x] baseline nameplates, HP/MP bars and target highlight
- [x] priority-based HUD decluttering for dense NPC/monster clusters
- [x] baseline HUD: custom player frame + target frame with mirrored HP/MP/XP
- [x] graphics-mode toggle docked beside the original top-bar X control

Deliverable: walkable Main with original gameplay logic.

## AL25D-05 — Combat and VFX parity

- [x] right-click attack input routed through the original combat handlers
- [ ] attack animation parity
- [x] attack intent VFX baseline: local-to-target slash trail + impact spark
- [ ] projectiles
- [x] mirrored projectile recognition + first-party projectile fallback visual
- [ ] skill VFX parity
- [x] hotbar action/cast flare baseline while original action dispatch stays authoritative
- [x] damage/heal floating feedback from mirrored authoritative HP deltas
- [x] death feedback baseline when mirrored HP crosses to zero
- [ ] full death/respawn presentation parity
- [x] authoritative HP-transition respawn feedback baseline
- [ ] loot/chests
- [x] combat UI baseline: target frame + attack pulse + floating feedback

## AL25D-06 — Full HUD replacement

- [x] character frame baseline
- [ ] party frame
- [x] target frame baseline
- [x] skill/hotbar baseline driven by original live keymap
- [ ] chat
- [x] inventory/equipment read-only baseline
- [x] unified character/equipment/inventory presentation surface
- [ ] interactive inventory/equipment actions
- [ ] quests/events
- [x] minimap baseline from immutable map bounds, collision lines and entity snapshots
- [ ] expanded world-map / route interaction layer
- [x] first-party gameplay menu baseline
- [ ] settings

## AL25D-07 — Content coverage

Replace visual assets map-by-map and entity-by-entity until no original art is required by the new client.

## AL25D-08 — Release hardening

- performance budgets
- reconnect torture tests
- renderer fallback handling
- asset validation
- browser/device matrix
- packaging and deployment
