# Mewthisch Guides Recorder v0.5

Automatic gameplay evidence recorder for World of Warcraft: Forever and Mewthisch Guides development.

## No commands required

The recorder starts automatically on PLAYER_LOGIN and immediately records a session.
You can simply play normally.

Automatic recording includes, where the WoW addon API exposes the data:

- session start/end and 30 second health heartbeat
- route position samples while moving, including facing and movement state
- quest acceptance/removal/turn-in
- quest objective snapshots and progress changes
- quest dialog text/rewards/choices
- NPC gossip and offered/active quests
- inventory snapshots/deltas and equipped gear
- talent/build profile changes
- player level, XP and money changes
- target changes without collecting other player names
- combat enter/leave
- successful player spell casts
- loot window contents
- merchant interactions and merchant inventory
- trainer interactions and services
- taxi map and taxi nodes
- bank/tradeskill/interaction window events
- zone/subzone changes
- death/recovery
- mount/swim/fly/indoors state in route samples

Chat messages and raw keyboard/mouse input are intentionally not recorded.

## Optional command

No command is necessary for testing.

Optional diagnostic command:

- /mgr status
- /mgr check
- /mgr note <text>

## SavedVariables

After testing, use /reload or log out so WoW flushes SavedVariables.

Then send:

WTF/Account/<account>/SavedVariables/MewthischGuidesRecorder.lua
