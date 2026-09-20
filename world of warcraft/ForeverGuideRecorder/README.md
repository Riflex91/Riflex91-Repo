# ForeverGuide Recorder v0.4

Developer data recorder for World of Warcraft: Forever.

## Test-1 health guarantees

- visible `RECORDING` message on login
- immediate heartbeat plus automatic heartbeat every 30 seconds
- session start/end timestamps and duration
- live record/heartbeat counters via `/fgr status`
- manual health checkpoint via `/fgr check`
- export marker via `/fgr save`
- stale/unclean previous sessions are explicitly marked on the next login

Important: WoW writes SavedVariables to disk on `/reload` or logout. Always do one of those before copying the file.

## Commands

- `/fgr status`
- `/fgr check`
- `/fgr save`
- `/fgr danger`
- `/fgr wait`
- `/fgr bug`
- `/fgr good`
- `/fgr note <text>`
- `/fgr clear CONFIRM`

## SavedVariables

After `/reload` or logout, send:

`WTF/Account/<account>/SavedVariables/ForeverGuideRecorder.lua`

Character name and realm are intentionally omitted.
