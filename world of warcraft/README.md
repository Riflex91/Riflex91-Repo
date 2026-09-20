# ForeverGuide data pipeline

This folder contains the data collection tooling for **World of Warcraft: Forever**.

## Components

- `ForeverDataMiner` — Windows/.NET tool that detects local Forever build changes, fingerprints client files, optionally exports selected DB2 tables through a local wow.tools.local instance, and writes a versioned FGDS bundle.
- `ForeverGuideRecorder` — in-game addon that records real quest/gameplay evidence through Blizzard's addon API into SavedVariables.
- `schema` — the shared **ForeverGuide Data Schema (FGDS)** contract used by both sources.

## Reliability rule

Data source and confidence are never hidden. Client data from the miner and observed gameplay from the recorder remain independently traceable by build. A route step should only become VERIFIED after the relevant gameplay has been observed on the applicable Forever build.

Current evidence classes:

- `client-db2-hotfix-applied` — structured client data exported for a concrete build with hotfixes applied.
- `gameplay-api` — state observed through Blizzard's addon API.
- `gameplay-event` — concrete event observed during play, such as a death or quest turn-in.
- `gameplay-sample` — route/position sample.
- `tester-marker` — explicit human marker such as danger, waiting or a bug.

See `schema/DATA_CONTRACT.md` for the merge rules.

## Quick start

### Recorder
Copy `ForeverGuideRecorder` to the Forever client's `Interface/AddOns` folder, enable it, play normally, then use `/reload` or log out before collecting:

`WTF/Account/<account>/SavedVariables/ForeverGuideRecorder.lua`

The recorder currently captures quest state, NPC quest gossip, route samples, deaths, class/talent-build snapshots, equipped gear, inventory deltas and item metadata. Character name and realm are intentionally not stored.

### DataMiner
Requires .NET 8 when run from source. The CI pipeline also produces a self-contained Windows build.

```powershell
cd "world of warcraft\ForeverDataMiner"
dotnet build -c Release
dotnet run -- selftest
dotnet run -- scan --wow "C:\Program Files (x86)\World of Warcraft" --wtl "http://localhost:5000"
dotnet run -- watch --wow "C:\Program Files (x86)\World of Warcraft" --wtl "http://localhost:5000"
```

`--wtl` is optional. Without it the miner still detects builds, executable changes and hotfix-cache changes and produces fingerprints. With wow.tools.local running, selected DB2 CSV exports with hotfixes applied are bundled as well.

Exports are written to `ForeverDataMiner/exports`.

## Files to send back for analysis

1. The latest `ForeverDataMiner-*.fgds.zip`.
2. `ForeverGuideRecorder.lua` after `/reload` or logout.

Both carry `fgds-1.0` semantics and build identity fields, so miner evidence and gameplay evidence can be correlated by build without guessing.
