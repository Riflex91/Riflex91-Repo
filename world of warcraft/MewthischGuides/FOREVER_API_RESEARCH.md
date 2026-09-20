# WoW Forever API research contract — Mewthisch Guides v0.6

This document records the engineering conclusions used by Mewthisch Guides after reviewing the current WoW Forever 1.60.1 API surface and the uploaded Zygor Guides Viewer Retail source package.

## Flavor model

Mewthisch Guides must not treat Interface 16001 as an old Classic API.

WoW Forever 1.60.1 uses the modern Retail-derived addon engine on Classic-style game data. Therefore the addon uses capability detection rather than choosing APIs from the interface number alone.

Engineering rule:

- prefer modern C_* APIs when present;
- probe capabilities at runtime;
- wrap uncertain reads in pcall;
- keep legacy APIs only as compatibility fallbacks;
- never infer that a Retail API is safe solely because its global exists;
- fail closed when a route/action identity cannot be proven.

## Quest and guide state

Primary state sources:

1. C_QuestLog structured quest log data.
2. C_QuestLog.GetQuestObjectives when available.
3. C_QuestLog.GetQuestsOnMap for quest POI coordinates.
4. C_QuestLine.GetQuestLineInfo for quest-start context.
5. expected Guide -> Step -> Goal state.
6. legacy QuestPOI APIs only as fallback.

Quest automation stays guide-ID-bound. It must not select the first offered quest when the expected quest ID cannot be established.

## Navigation

Navigation is split into:

- Step/Goal engine: decides WHAT the player should do.
- RouteEngine: decides WHERE the destination is.
- Navigator: only renders the selected destination.

Route source priority in v0.6:

1. VERIFIED route data generated from validated evidence.
2. QuestLine coordinate.
3. modern GetQuestsOnMap POI.
4. quest next-waypoint API.
5. legacy QuestPOI.
6. Blizzard navigation map fallback.

Every selected route source and competing candidate is recorded in diagnostics.

Distance shown to the user is metric. Blizzard distances that are returned in yards are converted with 0.9144.

## Map coordinates

The addon prefers C_Map map/world conversions when available.

A route may use different UiMap IDs for the player and target. If both convert to the same world/continent coordinate space, direction can still be calculated. Same-map normalized coordinates are the fallback.

The arrow is fail-closed: no reliable coordinate means no guessed direction.

## Modern/secret values

Forever inherits modern protected/secret-value behavior. Reads that may become protected or secret must be treated as capability-dependent and error-prone, especially during combat.

The API facade therefore records the presence of:

- C_Secrets;
- unit identity secret checks;
- chat messaging lockdown;
- modern C_Spell;
- modern specialization/trait APIs.

This v0.6 foundation does not attempt to bypass protected or secret information.

## Items, rewards and builds

The researched Forever surface includes modern-style item, reward and specialization APIs. Later gear/reward logic should be built behind the same API facade rather than calling globals throughout the UI.

The planned separation is:

- ItemState
- RewardAdvisor
- BuildState
- Guide/Goal integration

Automatic reward selection must remain fail-closed until scoring confidence is high.

## Travel

Taxi/travel APIs are capability-gated. A future TravelGraph will be separate from the local RouteEngine and will represent walking, taxi nodes, portals, hearth/teleport options and zone transitions as weighted edges.

Do not embed travel decisions in the arrow renderer.

## Persistence warning for current beta

Build 69913 has public reports of SavedVariables being written but not reliably restored on reload/relog/cold start. Mewthisch Guides therefore stores a persistence sentinel and boot counter for diagnostics.

This is diagnostic only; the addon cannot repair a client-level SavedVariables loader failure from normal addon code.

## Zygor architecture lessons used

The uploaded Zygor package was used as an architectural reference, not copied.

Useful concepts adopted:

- Parser/data state separated from UI.
- Guide -> Step -> Goal separation.
- quest cache separate from goal text.
- destination selection separate from pointer rendering.
- travel/pathfinding separate from local waypoint logic.
- sticky/parallel goal concept.
- gear/reward subsystems separate from guide engine.
- detailed route and option diagnostics.
- explicit test/performance infrastructure.

Mewthisch Guides remains an original implementation designed specifically around WoW Forever, DataMiner evidence and MewthischGuidesRecorder gameplay evidence.
