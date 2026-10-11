# FGDS 1.0 data contract

FGDS is the semantic contract shared by ForeverDataMiner and ForeverGuide Recorder.

## Identity

Every dataset must include:

- `schemaVersion`
- `source`
- creation/update time
- WoW version
- build number
- interface version when known

Miner-only identity may also include Build Key, CDN Key and product code.

## Serialization

The miner writes a ZIP containing `manifest.fgds.json` plus optional DB2 CSV files.

The recorder is constrained by WoW SavedVariables and therefore serializes the same semantic fields as a Lua table in `ForeverGuideRecorder.lua`.

The serialization differs; the data model does not.

## Correlation

Records are correlated in this order:

1. exact build number
2. exact entity ID, such as questID/itemID/NPC ID
3. map/position and timestamp when relevant
4. evidence class

No route fact should be inferred from display text alone when a stable numeric ID exists.

## Route verification policy

A route step can be marked `VERIFIED` only when the required quest transition was observed through recorder gameplay evidence on the applicable build.

Client DB2 data may establish IDs, relationships, item data and candidate prerequisites, but it does not by itself prove that a server-side quest is currently obtainable or completable.

A build or hotfix change affecting an entity used by a verified step must move that step to `REVALIDATION_REQUIRED` until the relevant gameplay evidence is observed again.

## Gear policy

Miner item data and recorder-observed item metadata are merged by item ID. A gear recommendation may only be auto-applied later by ForeverGuide when:

- the item is usable by the detected class/build,
- the evaluation has sufficient confidence,
- protected/valuable bind-on-equip rules do not require confirmation,
- WoW permits the equipment action in the current state.
