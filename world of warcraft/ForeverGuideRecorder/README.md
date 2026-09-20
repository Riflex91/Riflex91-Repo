# ForeverGuide Recorder v0.1

Developer data recorder for World of Warcraft: Forever.

## Installation

Copy this folder to the Forever client AddOns directory and enable **ForeverGuide Recorder**.

The addon records only data exposed through Blizzard's addon APIs. It does not read process memory, inject code, or write arbitrary files.

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
