# Mewthisch Guides 1.0

Mewthisch Guides 1.0 is an independent WoW Forever guide addon built around one
semantic runtime: **Guide -> Steps -> Goals**.

The guide source is exclusively the transformed public RestedXP
Forever/Survival dataset in \`Data/\`. No proprietary guide text, code or assets
are required by this addon.

## Runtime contract

- RestedXP raw-step boundaries are preserved 1:1.
- Multiple goals may be active inside the same current step.
- Sticky / completewith goals remain parallel runtime state.
- Completion, visibility, routing and UI all project the same RuntimeRevision.
- DestinationGoal is separate from route and current waypoint.
- Navigation never completes kill/collect semantics by arrival alone.
- Unknown or unsafe completion and automation cases fail closed.

## 1.0 systems

The 1.0 branch contains the semantic parser/compiler, guide catalog/controller,
recovery, quest/inventory/player/position facts, completion resolvers,
ActionMemory, route/travel planning, quest automation policy, action bar,
gear/reward advising, build/talent advising, guide browser, settings, world map
marker, SuperTrack policy, local-only telemetry and the diagnostic/error log.

Player-facing UI includes a compact movable main viewer, movable/lockable/
scalable navigator, next-step preview, movable minimap launcher and five themes:
Forever Classic, Obsidian, Arcane, Warcraft Heritage and ElvUI. The ElvUI theme
adapts to exposed ElvUI colors and font data when available.

Navigation prefers guide-provided coordinates. If an otherwise navigable quest
goal has no guide waypoint, the resolver may use capability-probed live quest
coordinates (QuestLine / quest-map POI / next waypoint) without changing the
semantic DestinationGoal. Arrow direction prefers world-coordinate conversion.

## Safety defaults

- Auto-Accept: OFF
- Auto-Turn-in: OFF
- multiple rewards are never auto-selected
- talent points are never spent automatically
- gear recommendations are fail-closed
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
- \`/mg1 errors\`
- \`/mg1 settings\`

## Data licensing

See \`THIRD_PARTY_NOTICES.md\`.
