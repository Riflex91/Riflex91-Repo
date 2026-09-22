# Mewthisch Guides 1.0

Mewthisch Guides is an independent WoW Forever guide addon built around one
semantic runtime:

\`Guide -> Steps -> Goals\`

Guide route data is packaged in transformed form under \`Data/\`. Licensing and
required third-party attribution are kept separately in
\`THIRD_PARTY_NOTICES.md\`; source branding is not exposed in the player-facing
guide UI or diagnostic report.

## Runtime contract

- Raw imported step boundaries are preserved 1:1.
- Multiple goals may be active inside the same current step.
- Sticky / complete-with goals remain parallel runtime state.
- Completion, visibility, routing and UI all project the same RuntimeRevision.
- DestinationGoal is separate from route and current waypoint.
- Navigation never completes kill/collect semantics by arrival alone.
- Unknown or unsafe completion and automation cases fail closed.

## 1.0 systems

The 1.0 branch contains parser/compiler, guide catalog/controller, recovery,
quest/inventory/player/position facts, completion resolvers, ActionMemory,
route/travel planning, quest automation policy, action bar, gear/reward
advising, build/talent advising, guide browser, settings, world map marker,
SuperTrack policy, local-only telemetry and diagnostics.

Player-facing systems additionally include:

- movable/lockable/scalable guide viewer with opacity and combat-hide options
- contextual quest hints for kill/collect/interact/NPC/travel goals
- progress-aware semantic coloring for the current goal
- movable/lockable/scalable navigator with calibrated direction
- world map marker and minimap launcher
- transparent additive navigator arrow without an opaque background tile
- notification popups plus persistent notification archive
- low-bag-space notifications
- inventory/merchant utility window
- optional automatic sale of safe poor-quality vendor items
- optional automatic repair, including optional guild-repair preference
- five skins with global recoloring of addon windows/buttons
- safe defaults for all destructive or money-spending automation

## Safety defaults

- Auto-Accept: OFF
- Auto-Turn-in: OFF
- Auto-Sell gray items: OFF
- Auto-Repair: OFF
- multiple rewards are never auto-selected
- talent points are never spent automatically
- gear recommendations are fail-closed
- quest items are excluded from gray-item selling
- no arrow is rendered without player-facing information
- uncertain APIs are guarded with capability probing / pcall
- telemetry remains local in SavedVariables and sends nothing

## Commands

- \`/mg1\`
- \`/mg1 show|hide\`
- \`/mg1 status\`
- \`/mg1 browser\`
- \`/mg1 guides\`
- \`/mg1 start <id/title>\`
- \`/mg1 next|prev\`
- \`/mg1 refresh\`
- \`/mg1 done\`
- \`/mg1 build\`
- \`/mg1 inventory\`
- \`/mg1 notifications\`
- \`/mg1 errors\`
- \`/mg1 settings\`

## Data licensing

See \`THIRD_PARTY_NOTICES.md\`.
