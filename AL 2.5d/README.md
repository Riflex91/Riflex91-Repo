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

## Windows local admin sandbox

For local gameplay/client testing without a real Adventure Land account, AL 2.5D
has a loopback-only sandbox mode.

Prerequisites:

- Windows PowerShell
- Git
- Node.js / npm
- Docker Desktop recommended (a local MongoDB on port 27017 also works)

From the `AL 2.5d` directory:

```powershell
npm run local:setup
npm run local:start
```

The setup command:

1. clones the pinned original Adventure Land runtime at
   `ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`;
2. clones pinned compatible `common_engine` and development config sources;
3. verifies `Dev: true`, `Local: true` and `unsecure_admin: true`;
4. starts/uses MongoDB only on `127.0.0.1:27017`;
5. imports the upstream development datastore needed for map geometry;
6. immediately removes imported users, characters and other player/account data;
7. rebuilds local pathfinding data.

The start command launches:

- local Adventure Land web backend: `http://localhost:8090`
- local Adventure Land game server: `localhost:7192`
- AL 2.5D Vite renderer: `http://localhost:5173`

It then opens:

```text
http://localhost:5173/?localAdmin=1&legacy=/legacy/
```

The browser creates/reuses the deliberately local identity
`local-admin@al25d.invalid` and the warrior `LocalAdmin`.

A round graphics switch is fixed in the upper-right game UI at the requested
toolbar position. It shows `2.5D` or `ORG`; clicking it swaps the visible
renderer instantly while the same local legacy runtime, character and socket
session continue running. The selected graphics mode is remembered in browser
localStorage. Because the pinned
development config uses `Local: true` together with `unsecure_admin: true`,
the localhost account receives development-admin behavior without changing
production authentication or using an Adventure Land account.

The local-admin bootstrap refuses to run on non-loopback hosts. The Vite proxy
also points only at the local backend, so this mode is not used for
`adventure.land`.

To stop processes started by the launcher:

```powershell
npm run local:stop
```

All downloaded runtime repositories, database files and process metadata live
under `.local-dev/` and are excluded from Git.

