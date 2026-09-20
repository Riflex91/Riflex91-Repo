# Mewthisch Guides v0.3 - Roadmap Step 1

First development stage after the Zygor architecture review.

## Visible changes

- addon renamed from ForeverGuide to **Mewthisch Guides**
- compact modern guide viewer
- separate, freely movable navigation arrow
- navigator position and scale persist between sessions
- distance display in meters/kilometers
- Blizzard navigation screen-position fallback when no direct quest waypoint is available
- short objective instruction such as Sammle 10x ... or Toete 12x ...
- lightweight objective progress bar
- draggable round minimap button (MG)
- Info and Options remain separate from the normal guide view
- diagnostic logs continue in SavedVariables

## Commands

Primary command: /mg

Compatibility alias: /fg

Useful commands:
- /mg info
- /mg settings
- /mg navigator
- /mg status
- /mg next
- /mg prev
- /mg refresh
- /mg log

## Test file

After /reload or logout send:

WTF/Account/<account>/SavedVariables/MewthischGuides.lua

The old ForeverGuide.lua is only the v0.1/v0.2 test history.
