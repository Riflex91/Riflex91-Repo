# ForeverGuide Recorder v0.3

Developer data recorder for World of Warcraft: Forever.

## Installation

Copy this folder to the Forever client AddOns directory and enable **ForeverGuide Recorder**.

The addon records only data exposed through Blizzard's addon APIs. It does not read process memory, inject code, or write arbitrary files.

## Captured evidence

- build/interface version and basic anonymous player profile
- quest accepts, removals, turn-ins and objective-state changes
- questgiver gossip with available/active quest IDs
- opened quest dialogs: title, quest text, objective/progress/reward text
- quest reward/choice items and available reward currencies when exposed by the API
- route samples and zone changes
- player deaths
- talent-tree/spec point distribution and learned talent ranks when exposed by the client API
- equipped gear snapshots
- bag inventory snapshots/deltas
- item links, metadata and stat tables when available
- explicit tester markers

## SavedVariables

After logout or `/reload`, send:

`WTF/Account/<account>/SavedVariables/ForeverGuideRecorder.lua`

The top-level object is `ForeverGuideRecorderDB` and mirrors FGDS fields:

- `schemaVersion = "fgds-1.0"`
- `source = "recorder"`
- `build`
- `records`

Character name and realm are intentionally omitted.

## Commands

- `/fgr status`
- `/fgr danger`
- `/fgr wait`
- `/fgr bug`
- `/fgr good`
- `/fgr note <text>`
- `/fgr clear CONFIRM`
