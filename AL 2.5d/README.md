# AL 2.5D

A compatibility-first 2.5D visual fork of Adventure Land.

## Product rule

The project starts with one non-negotiable rule:

> Gameplay, networking, persistence, combat, classes, skills, items, events, quests, movement rules and server-authoritative behavior stay logically equivalent to Adventure Land. The fork replaces the presentation layer and assets, not the game rules.

Gameplay changes are out of scope unless they are explicitly approved in a later milestone.

## Visual target

- Adventure-Land-like readability and scale
- new, independently produced 2.5D assets
- stronger depth, lighting, shadows and elevation
- fixed/controlled camera so gameplay remains easy to read
- modern HUD without changing gameplay semantics
- client-side rendering upgrade only; no 3D rendering workload on the game server

## Current milestone: AL25D-01 Foundation

This first milestone establishes the technical boundary that protects gameplay logic from visual changes:

1. 2.5D coordinate projection with inverse pointer mapping
2. renderer adapter fed by immutable game snapshots
3. PixiJS-based scene renderer
4. camera state separated from world state
5. asset namespaces for characters, monsters, maps, props, UI and VFX
6. tests proving projection round-trips
7. roadmap for importing the Adventure Land logic layer without altering semantics

## Development

```bash
cd "AL 2.5d"
npm install
npm run dev
npm test
npm run build
```

## Folder policy

- `src/logic/`: compatibility/adaptation only; do not redesign game rules
- `src/render/`: all 2.5D rendering
- `assets/`: only new fork assets
- `docs/`: architecture, parity and migration records

## Upstream attribution

Adventure Land is the gameplay/reference basis for this fork. The upstream project uses the AdventureLandOnlyUse license and requires attribution for derivatives using its source/files. See `NOTICE.md`.
