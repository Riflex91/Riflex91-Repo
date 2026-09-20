# Mewthisch Guides v0.9 — roadmap-complete engine

v0.9 closes the planned engine roadmap before the dedicated Forever runtime
bug-fix/calibration phase. It does **not** claim complete 1-60 guide-data
coverage yet; the currently bundled route data is still the Recorder-backed
Durotar seed.

## Roadmap state

1. UI + standalone Navigator — implemented
2. Goal Engine + objective progress — implemented
3. Guide Step Engine + login/resync — implemented
4. Safe quest automation — implemented
5. Forever API facade + RouteEngine — implemented
6. QuestTracking + GuideParser/DataLoader + Validation — implemented
7. TravelGraph abstraction — implemented
8. Inventory + GearAdvisor + RewardAdvisor — implemented
9. BuildState + TalentAdvisor — implemented
10. State/Sync + Diagnostics/local telemetry + Themes — implemented

Step 10 is the final planned engine step. From here, runtime findings are
handled as fixes/hardening instead of adding another architectural layer.

## Runtime architecture

```
ForeverAPI
  ↓
QuestTracking / State / Inventory / BuildState
  ↓
GuideParser + DataLoader + Validation
  ↓
GuideEngine → StepEngine → GoalEngine
  ↓
RouteEngine ← TravelGraph
  ↓
Navigation → Navigator/UI

Side systems:
GearAdvisor / RewardAdvisor
TalentAdvisor
Sync
Diagnostics / local-only Telemetry
Themes
```

## Safety rules

- capability detection instead of assuming an API from the interface number
- uncertain API calls fail closed
- no guessed arrow direction
- quest automation is bound to the expected quest ID
- multiple quest rewards are never auto-selected
- TalentAdvisor never spends talent points automatically
- Gear auto-equip is disabled by default
- Gear auto-equip requires high confidence, no combat, an empty cursor and,
  with the default safety settings, a bound item
- plain item-level comparison is only medium confidence and therefore cannot
  pass the default auto-equip gate; high confidence requires a data-backed
  gear profile/stat-weight model
- weapons are not auto-equipped by default
- telemetry is local SavedVariables diagnostics only; nothing is transmitted

## Guide/data model

The runtime now supports multiple normalized guides, validation, applicability
by faction/race/class/level, explicit route coordinates, a TravelGraph and
build profiles and gear scoring profiles. Empty extension points exist in
`Data.lua` for generated DataMiner/Recorder imports.

Current bundled evidence remains intentionally small:

- Verlorene Waffen
- Galgars Kaktusapfel Surprise
- Stich des Skorpiden
- Üble Familiare

A large 1-60 route must be generated/verified from DataMiner + Recorder
evidence rather than invented inside the addon.

## User-facing systems

- compact guide viewer
- Goal progress and next-step preview
- movable/lockable/scalable arrow
- automatic SuperTrack
- safe auto-accept / auto-turn-in
- reward recommendation for multiple choices
- inventory/gear upgrade scan
- optional fail-closed gear auto-equip
- talent recommendation framework
- five themes:
  - Forever Classic
  - Obsidian
  - Arcane
  - Warcraft
  - Skyborne
- diagnostics and subsystem health

Useful commands:

- `/mg status`
- `/mg diag`
- `/mg api`
- `/mg route`
- `/mg refresh`
- `/mg guide <id>`
- `/mg theme <name>`
- `/mg gear`
- `/mg gearauto on|off`
- `/mg reward`
- `/mg talent`

## Next phase

After this v0.9 engine build is frozen, the next work is runtime
bug-fixing/calibration from real Forever evidence: screenshots,
`MewthischGuides.lua`, `MewthischGuidesRecorder.lua` and reproducible
client behavior.
