# Mewthisch Guides v0.4 - Roadmap Step 2

Second development stage after the Zygor architecture review.

## Step 2

- dedicated GoalEngine with Quest -> Step -> Goal separation
- one quest may expose multiple goals with independent state and progress
- active goal is selected automatically
- compact human-readable goal instructions such as:
  - Sammle 10x Kaktusapfel
  - Toete 12x Uebler Familiar
  - Interagiere mit: <Questobjekt>
- additional goals remain visible as a compact summary
- goal changes are logged separately from step changes

## Navigation correction

- the navigator has no background, panel, border or target label
- only the arrow and the meter/kilometer distance remain visible
- the old guessed screen-position direction fallback was removed
- Quest POIs are refreshed after SuperTrack
- navigation is re-resolved after a short delay so Forever has time to populate quest POI data
- world-coordinate Y direction is corrected
- arrow direction is displayed only when a real target coordinate and player facing produce a reliable bearing
- if no reliable direction is available, Mewthisch Guides does not show a false arrow

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

After /reload or logout send:

WTF/Account/<account>/SavedVariables/MewthischGuides.lua

For navigation testing, screenshots plus the SavedVariables file are especially useful.
