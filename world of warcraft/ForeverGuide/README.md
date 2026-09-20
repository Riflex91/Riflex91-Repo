# ForeverGuide v0.2 - in-game test build

Second playable ForeverGuide test build for World of Warcraft: Forever 1.60.1 / build 69913.

## v0.2 changes

- rebuilt opaque UI panels that do not depend on the old backdrop API
- Options button and settings panel
- Minimap button: left click toggles the guide, right click opens Options
- automatic live quest-progress detection
- multi-source waypoint resolution:
  - C_QuestLog.GetNextWaypointForMap
  - C_QuestLog.GetNextWaypoint
  - legacy QuestPOIGetIconInfo
  - C_Navigation fallback
- rotating navigation arrow with live direction
- waypoint distance in yards when world-position/distance APIs are available
- automatic quest acceptance
- automatic quest turn-in
- safe reward handling: multiple reward choices pause automatic turn-in for manual selection
- structured diagnostics for progress, navigation, automation, UI and errors
- 30-second runtime heartbeat
- visible Info panel with version/build/data/log state
- credit rendered without relying on a Unicode heart glyph:
  "Programmiert mit [heart] von Riflex91 fuer die Gilde Mewthisch"

## Commands

- /fg
- /fg info
- /fg settings
- /fg status
- /fg next
- /fg prev
- /fg refresh
- /fg autoaccept on|off
- /fg autoturnin on|off
- /fg log
- /fg clearlog

## Test feedback

After testing, run /reload or log out and send:

WTF/Account/<account>/SavedVariables/ForeverGuide.lua

Screenshots are useful for UI/navigation problems as well.
