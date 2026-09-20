# ForeverGuide data pipeline

This folder contains the data collection tooling for **World of Warcraft: Forever**.

## Components

- `ForeverDataMiner` — Windows/.NET tool that detects local Forever build changes, fingerprints client files, optionally exports selected DB2 tables through a local wow.tools.local instance, and writes a versioned FGDS bundle.
- `ForeverGuideRecorder` — in-game addon that records real quest/gameplay evidence through Blizzard's addon API into SavedVariables.
- `schema` — the shared **ForeverGuide Data Schema (FGDS)** contract used by both sources.

## Reliability rule

Data source and confidence are never hidden. Client data from the miner and observed gameplay from the recorder remain independently traceable by build. A route step should only become VERIFIED after the relevant gameplay has been observed on the applicable Forever build.

## Quick start

### Recorder
Copy `ForeverGuideRecorder` to the Forever client's `Interface/AddOns` folder, enable it, play normally, then use `/reload` or log out before collecting:

`WTF/Account/<account>/SavedVariables/ForeverGuideRecorder.lua`

No character name or realm is intentionally stored.

### DataMiner
Requires .NET 8.

```powershell
cd "world of warcraft\ForeverDataMiner"
dotnet build -c Release
dotnet run -- scan --wow "C:\Program Files (x86)\World of Warcraft" --wtl "http://localhost:5000"
dotnet run -- watch --wow "C:\Program Files (x86)\World of Warcraft" --wtl "http://localhost:5000"
```

`--wtl` is optional. Without it the miner still detects builds and produces client fingerprints. With wow.tools.local running, selected DB2 CSV exports (including hotfixes) are bundled as well.

Exports are written to `ForeverDataMiner/exports`.

## Files to send back for analysis

1. The latest `ForeverDataMiner-*.fgds.zip`.
2. `ForeverGuideRecorder.lua` after `/reload` or logout.

Both carry the same FGDS schema version and build identity fields, so they can be correlated deterministically.
