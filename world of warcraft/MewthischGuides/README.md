# Mewthisch Guides v0.11.4 — Runtime-Routing, Config und Weltkarten-Ziel

v0.11.4 härtet den produktiven Forever-Betrieb: Questfortschritt wird über
moderne und Legacy-Questlog-APIs erkannt, die vorgegebene RestedXP-Route wird
auf die tatsächliche Questphase und das aktuelle Questziel synchronisiert, und
der Benutzer kann alternativ einen manuellen Modus wählen, der angenommene
Quests nach dem aktuell kürzesten erreichbaren Ziel ordnet. Das aktuelle Ziel
kann zusätzlich als Blizzard-Weltkarten-Wegpunkt markiert werden.

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
RouteEngine ← TravelGraph / ManualRoute
  ↓
Navigation → WorldMapMarker → Navigator/UI

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
- Gear auto-equip requires no combat and an empty cursor; weapons remain
  protected by default
- safe non-weapon item-level upgrades may use the item-level fallback even
  without a class-specific stat profile
- same-itemlevel non-weapon gear may auto-equip only when its comparable
  numeric stats strictly dominate the currently equipped item with no loss
- armor proficiency is checked conservatively before auto-equip
- unbound gear is not treated as BoE by default: actual bind type is inspected;
  recognized BoE and unknown binding state remain protected
- rings and trinkets are compared against the weaker of their two slots
- weapons are not auto-equipped by default
- telemetry is local SavedVariables diagnostics only; nothing is transmitted

## Guide/data model

The runtime now supports multiple normalized guides, validation, applicability
by faction/race/class/level, explicit route coordinates, a TravelGraph and
build profiles and gear scoring profiles. Empty extension points exist in
`Data.lua` for generated DataMiner/Recorder imports.

Zusätzlich zum Recorder-Seed lädt v0.11.4 die strukturierten Fakten aus allen
öffentlich in `GuideList-forever.xml` referenzierten RestedXP-Forever- und
Survival-Routen. Importiert werden ausschließlich maschinenlesbare Fakten und
Direktiven (z. B. Quest-IDs, Item-/Spell-IDs, Selektoren, Bedingungen,
Koordinaten, Reise-, Trainer- und Händlerkommandos); narrative Guide-Texte
werden nicht übernommen.

Die RestedXP-basierten Datendateien sind als transformierte Datenbasis mit
Quelle, Commit und CC BY-NC-SA 4.0 gekennzeichnet. Details stehen in
`THIRD_PARTY_NOTICES.md`.

`RestedXPActionCatalog.lua` klassifiziert alle aktuell im öffentlichen
Datensatz vorkommenden strukturierten Aktionstypen. Die CI verlangt vollständige
Abdeckung ohne unbekannte Aktionstypen. Passende Reise-, Händler-, Trainer-,
Ziel-, Item- und weitere strukturierte Hinweise werden am aktiven Questschritt
kompakt eingeblendet; die vollständigen Rohdirektiven bleiben weiterhin in der
transformierten Datenbasis erhalten.

## User-facing systems

- compact guide viewer with a direct **Config** button
- selectable route mode:
  - **Vorgegeben**: RestedXP route synchronized to actual quest/objective progress
  - **Manuell**: accepted quests are dynamically ordered by the nearest current target
- modern + Legacy Forever quest-progress detection
- optional world-map marker for the current target
- Goal progress and next-step preview
- movable/lockable/scalable arrow
- automatic SuperTrack
- safe auto-accept / auto-turn-in
- reward recommendation for multiple choices
- inventory/gear upgrade scan
- optional fail-closed gear auto-equip
- talent recommendation framework
- sieben Themes in fester Reihenfolge:
  - ElvUI
  - EllesmereUI
  - ToxiUI
  - Forever Classic
  - Obsidian
  - Arcane
  - Warcraft Heritage
- ElvUI ist der Default für neue Profile und übernimmt bei erkanntem ElvUI
  dessen Hintergrund-, Rahmen-, Akzentfarben und Standardschrift
- EllesmereUI und ToxiUI verwenden adaptive Integrationen, wenn die jeweilige
  UI verfügbar ist, und statische Fallbacks andernfalls
- diagnostics and subsystem health

Useful commands:

- `/mg status`
- `/mg diag`
- `/mg api`
- `/mg route`
- `/mg mode manual|preset`
- `/mg mapmarker on|off`
- `/mg config`
- `/mg refresh`
- `/mg guide <id>`
- `/mg theme <name>`
- `/mg gear`
- `/mg gearauto on|off`
- `/mg reward`
- `/mg talent`

## Next phase

Nach diesem v0.11.4-Build folgt die gezielte Ingame-Verifikation anhand echter
Forever-Screenshots, SavedVariables und Recorder-Daten. Besonders geprüft
werden die Weltkarten-Wegpunkt-API des Forever-Clients, die Auswahl zwischen
manueller und vorgegebener Route sowie Auto-Equip unter realen Bag-/Item-APIs.


## v0.11.4 Screenshot-Fixes

- RestedXP-Weltkoordinaten werden nicht mehr mit den vertauschten Blizzard-
  Vectorachsen verglichen. Das beseitigt die kilometerweit falsche Distanz und
  den dadurch ebenfalls falsch gesetzten Weltkarten-Marker.
- Loop-/Farm-Schritte verwenden den dem Spieler nächstgelegenen verifizierten
  RestedXP-Wegpunkt statt immer nur den letzten Punkt der Schleife.
- Questziele zeigen den echten Live-Fortschritt (z. B. `5/7`) direkt im
  Viewer. Die Fortschrittsfarbe läuft kontinuierlich von Rot über Gelb zu Grün.
- Der separate Pfeil-Button im Footer entfällt; der Navigator wird vollständig
  über **Config** gesteuert.
- Der Navigator-Pfeil hat eine feste größere Darstellungsgröße, damit Atlas-
  Native-Size und Entfernungstext nicht mehr in einem falschen Größenverhältnis
  stehen.
- Gear-Erkennung verwendet `IsUsableItem` nicht mehr als pauschales
  Ausschlusskriterium, lädt fehlende Itemdaten über
  `GET_ITEM_INFO_RECEIVED` / `ITEM_DATA_LOAD_RESULT` nach und schützt
  nicht tragbare Rüstung über die Rüstungsprofi-Prüfung.
- Ungebunden bedeutet nicht mehr automatisch BoE: Der echte Bind-Typ wird
  ausgewertet. Erkannte BoE-Items und unbekannte Bind-Zustände bleiben
  fail-closed geschützt.
- Sichere gleiche-Itemlevel-Upgrades werden zusätzlich über strikte
  Stat-Dominanz erkannt. Der Recorder-Fall „Ausgefranste Hose“ gegenüber der
  Start-Hose ist als Regression abgedeckt.
- Auto-Equip unterscheidet nun zwischen angefordert und tatsächlich bestätigt;
  fehlende Bestätigung wird als Diagnose-Warnung protokolliert.


## Routenmodus v0.11.4

- **Manuell** ist der Standard. Das Addon verwendet nur vom Spieler angenommene
  Quests und ordnet sie nach belastbaren Navigationszielen, um unnötige Laufwege
  zu reduzieren.
- **Auto** wird nur freigeschaltet, wenn der geprüfte RestedXP-Forever-Katalog
  vollständig geladen wurde. Erwartet werden exakt 43 freigegebene Levelrouten
  aus dem öffentlichen Quellstand
  `a688a75d595f5884dba8044a5ba4e7d7bd859c09`.
- Fehlt eine Route, ist eine Route doppelt vorhanden oder stimmt der Quellcommit
  nicht, fällt das Addon fail-closed auf den manuellen Modus zurück.
- Der Guide-Auswahldialog wird über den runden Button im Hauptfenster geöffnet
  und bietet die Kategorien **Horde**, **Ally** und **Mage AoE Farm**. Routen
  werden innerhalb der Kategorie nach Level sortiert.
- Im manuellen Modus zeigt die Guide-Zeile **Manueller Modus**.
- Die frühere Anzeige `Ziel: ... · bereit` unten links wurde entfernt.

## Quest-Automatik

Neue Profile starten mit **Auto-Annahme** und **Auto-Abgabe** aktiviert.
Verfügbare Quests werden unabhängig von der aktuell gewählten Route automatisch
angenommen, fertige Quests automatisch bis zur Belohnung fortgeführt und
abgegeben. Bei mehreren unterschiedlichen Questbelohnungen bleibt die Auswahl
weiterhin manuell, damit keine unsichere Belohnungsentscheidung erzwungen wird.
