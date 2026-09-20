# Mewthisch Guides v0.6 — Forever API + RouteEngine foundation

v0.6 is the first build produced after a fresh WoW Forever API review and a second architecture review of the uploaded Zygor Guides package.

## Why this build exists

Previous builds could receive a Blizzard navigation distance while having no trustworthy quest coordinate. That produced a visible distance but forced the arrow to hide because direction could not be proven.

v0.6 fixes the architecture rather than guessing a screen angle.

## New architecture

- ForeverAPI.lua
  - runtime capability survey
  - protected pcall-based access
  - modern quest/map/gossip/item/build/spell capability matrix
  - SavedVariables persistence probe
- RouteEngine.lua
  - ranks multiple coordinate sources
  - records all route candidates
  - prefers evidence-backed/modern sources
- Navigation.lua
  - consumes RouteEngine output only
  - converts map positions to world positions when possible
  - keeps fail-closed arrow behavior

## Important new Forever route source

C_QuestLog.GetQuestsOnMap is now queried for the active quest and map hierarchy. This is the key Forever-specific route source that previous Mewthisch Guides builds did not use.

## Diagnostics

Info now shows:

- Forever API mode
- GetQuestsOnMap availability
- world-coordinate availability
- secret-system presence
- selected RouteEngine source
- route candidate count/score
- SavedVariables persistence boot probe

Optional commands:

- /mg api
- /mg route
- /mg status

Normal gameplay still requires no commands.

## Research notes

See FOREVER_API_RESEARCH.md for the engineering contract used by the addon.

## Test evidence

After the in-game test, use /reload or log out while the client is still running, then send:

- WTF/Account/<account>/SavedVariables/MewthischGuides.lua
- WTF/Account/<account>/SavedVariables/MewthischGuidesRecorder.lua
- a screenshot of the Navigator

The diagnostics should tell us exactly which coordinate source Forever returned for each quest.
