# Mewthisch Guides v0.5 - Roadmap Steps 3 + 4

This build combines the next two roadmap stages so the next in-game test covers a much more complete guide loop.

## Step 3 - Guide Step Engine and Resync

- evidence-backed route seed from the quests already captured by DataMiner/Recorder
- explicit guide phases:
  - accept
  - objectives
  - turnin
  - complete
- automatic resync on login and quest-progress changes
- already completed route steps are skipped
- already active route quests are preferred over older missing route steps
- applicability model supports:
  - faction
  - race
  - class
  - min/max level
  - prerequisite quests
- unknown active quests remain available as live fallback
- resync decisions and skip reasons are stored in diagnostics

## Step 4 - Safe Quest Automation

- automatic quest interaction is now tied to the expected guide quest ID
- auto-accept only accepts the quest currently expected in the accept phase
- auto-turn-in only turns in the quest currently expected in the turnin phase
- unrelated offered quests are not selected
- unsafe legacy "select first quest" behavior was removed
- if an API cannot prove the quest ID, automation does nothing and logs the reason
- multiple reward choices still pause for manual player selection

## UI adjustment

- Info opens in the exact center of the screen
- Options opens in the exact center of the screen
- Viewer and Navigator remain independently movable

## Existing Step 1/2 features retained

- compact guide viewer
- separate transparent navigation arrow
- metric distance
- GoalEngine with per-objective progress
- movable minimap button
- diagnostic logging

## Commands

Primary command: /mg
Compatibility alias: /fg

Useful:
- /mg info
- /mg settings
- /mg navigator
- /mg status
- /mg next
- /mg prev
- /mg refresh
- /mg log

## Test evidence

After testing, use /reload or log out and send:

WTF/Account/<account>/SavedVariables/MewthischGuides.lua

Screenshots are still useful for UI/navigation issues.
