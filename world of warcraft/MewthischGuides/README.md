# Mewthisch Guides v0.12.0 — UI v2, Smart Routing und erweiterbare Guide-Plattform

v0.12.0 härtet den produktiven Forever-Betrieb: Questfortschritt wird über
moderne und Legacy-Questlog-APIs erkannt, die vorgegebene RestedXP-Route wird
auf die tatsächliche Questphase und das aktuelle Questziel synchronisiert, und
der Benutzer kann alternativ einen manuellen Modus wählen, der angenommene
Quests nach dem aktuell kürzesten erreichbaren Ziel ordnet. Das aktuelle Ziel
kann zusätzlich als Blizzard-Weltkarten-Wegpunkt markiert werden.

## Architektur-Migrationsreferenz

Die verbindliche, lebende Referenz für den weiteren Architekturumbau liegt in
[ARCHITECTURE_GAP_MATRIX.md](ARCHITECTURE_GAP_MATRIX.md).

Dort sind das Zielmodell **Guide → Steps → Goals**, die aktuelle Gap-Matrix,
Resolver-/Runtime-Grenzen, fehlende Regressionstests und die empfohlene
Migrationsreihenfolge dokumentiert. Für zukünftige Architekturarbeit soll diese
Datei vor größeren Refactors zuerst gelesen und bei relevanten Änderungen
aktualisiert werden.

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

Die obige Liste beschreibt den implementierten v0.12.0-Baseline-Stand. Die
weitere semantische Architektur-Migration ist in
`ARCHITECTURE_GAP_MATRIX.md` festgehalten; insbesondere werden Domain,
Resolver, Runtime-State und Consumer dort schrittweise stärker getrennt.

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

Zusätzlich zum Recorder-Seed lädt v0.12.0 die strukturierten Fakten aus allen
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
- Forever Classic ist der Default für neue Profile; ElvUI bleibt als adaptives Theme verfügbar und übernimmt bei erkanntem ElvUI
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

Nach diesem v0.12.0-Build folgt die gezielte Ingame-Verifikation anhand echter
Forever-Screenshots, SavedVariables und Recorder-Daten. Besonders geprüft
werden die Weltkarten-Wegpunkt-API des Forever-Clients, die Auswahl zwischen
manueller und vorgegebener Route sowie Auto-Equip unter realen Bag-/Item-APIs.


## v0.12.0 Screenshot-Fixes

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


## Routenmodus v0.12.0

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


## Auto-Equip-Meldung v0.12.0

Nach einem **bestätigten** automatischen Ausrüsten zeigt das Addon direkt unter
dem Hauptfenster kurz eine Meldung mit Gegenstands-Icon und dem Text:

`<Gegenstandsname> wurde angelegt.`

Die Meldung blendet weich ein, bleibt kurz sichtbar und blendet anschließend
wieder aus. Ein bloßer Equip-Versuch oder ein nicht bestätigter Slotwechsel
erzeugt bewusst keine Erfolgsmeldung. Wird ein Auto-Equip bereits während des
Login-Syncs bestätigt, wird die Meldung bis zur UI-Initialisierung zwischengespeichert.


## Auto-Equip-Erkennung v0.12.0

Die Forever-Runtime-Logs zeigten, dass echte Taschengegenstände als
`not_safely_equippable` verworfen wurden. Ein konkreter Fall war ein
`INVTYPE_WAIST`-Gegenstand bei leerem Gürtel-Slot.

v0.12.0 verwendet deshalb einen bekannten unterstützten `INVTYPE_*` als
primäres Signal dafür, dass ein Gegenstand Ausrüstung ist. Negative Ergebnisse
von `C_Item.IsEquippableItem` oder `IsEquippableItem` werden weiterhin
diagnostisch protokolliert, dürfen einen gültigen Equipment-Slot aber nicht mehr
pauschal verwerfen.

Zusätzlich werden unvollständige Itemdaten per Item-ID nachgeladen,
`GET_ITEM_INFO_RECEIVED` und `ITEM_DATA_LOAD_RESULT` aktualisieren die
Gear-Auswertung auch bei deaktiviertem Auto-Equip, und Runtime-Diagnosen speichern
bis zu acht konkrete Rejection-Samples. Ein deaktiviertes Auto-Equip wird
ausdrücklich als `disabled` protokolliert statt als `no_upgrade`.

Die bestehenden Schutzregeln für unpassende Rüstung, Waffen, Kampfstatus,
Cursorzustand und erkannte Bind-on-Equip-Gegenstände bleiben bestehen.


## Pfeil-Skins v0.12.0

Der Navigator bietet fünf auswählbare Pfeil-Skins:

1. Kompass Schwarz
2. Zeiger Schwarz
3. Pfeil Blau
4. Pfeil Rot
5. Pfeil Orange

Die beiden schwarzen Varianten verwenden native WoW-Navigationsgrafiken. Die
blauen, roten und orangenen Varianten verwenden die entsprechenden öffentlichen
RestedXP-Navigationstexturen aus dem bereits referenzierten Forever-Quellstand.

Der Skin kann in den Optionen mit **Nächster Skin** gewechselt werden und wird
sofort auf den Navigator angewendet. Der Standard ist **Pfeil Blau**.

Die feste Standardgröße des Pfeils wurde von 104 auf 83 Pixel reduziert, also
um rund 20 Prozent. Die separate Navigator-Skalierung bleibt zusätzlich
verfügbar.


## Guide-Auswahl und Mulgore v0.12.0

Die manuelle Guide-Auswahl ist bewusst großzügiger als die automatische
Routenwahl:

- Horde-Charaktere können **alle Horde-Levelrouten** auswählen, unabhängig von
  aktuellem Level, Volk oder Klasse.
- Alliance-Charaktere können **alle Alliance-Levelrouten** auswählen.
- **Mage AoE Farm** ist ausschließlich für Magier anwählbar; die konkrete
  AoE-Route bleibt fraktionsgebunden.
- Die automatische Routenwahl verwendet weiterhin die strengeren
  RestedXP-Level-/Race-/Class-Bedingungen.

Für `1-6 Mulgore` wurde außerdem ein phasenspezifischer RestedXP-Filter
eingeführt. Quest 1519 **„Ruf der Erde“** ist in RestedXP bei der Annahme
Shaman-only. Andere Klassen überspringen diesen Annahmeschritt jetzt vollständig.
Für Schamanen wird der originale RestedXP-Annahmepunkt bei Seer Ravenfeather
(`1412/1,-250.09,-2882.08`) verwendet.

Der Standard-Navigator-Skin ist ab v0.12.0 **Pfeil Blau**. Bestehende Profile,
die noch den früheren Standard `Kompass Schwarz` ohne neuere Skin-Migration
tragen, werden einmalig auf Blau umgestellt. Andere bewusst gewählte Skins
bleiben erhalten.


## Auto-Equip-Icon v0.12.0

Die Erfolgsmeldung löst das Gegenstands-Icon jetzt über mehrere
Forever-kompatible Quellen auf. Da die Meldung erst nach einem bestätigten
Slotwechsel erscheint, wird zuerst `GetInventoryItemTexture("player", slot)`
verwendet. Danach folgen `C_Item.GetItemIconByID`, `GetItemIcon`,
`GetItemInfo` und `GetItemInfoInstant`.

Falls keine Quelle ein Icon liefert, wird immer
`Interface\\Icons\\INV_Misc_QuestionMark` angezeigt. Die Texture wird vor
jeder Meldung explizit entsättigungsfrei, weiß und voll sichtbar gesetzt.

Die Runtime-Logs enthalten für die Meldung zusätzlich `itemIcon` und
`iconSource`, damit ein weiterer Forever-spezifischer API-Unterschied sofort
sichtbar wird.


## v0.12.0 — großer UI- und Engine-Umbau

v0.12.0 führt die neue, nach dem abgestimmten Mockup aufgebaute Oberfläche ein.

### UI v2

- kompaktes Hauptfenster mit Guide-Zeile, Schrittzähler, Zielbeschreibung,
  Detailzeilen und direkten Buttons für Ziele, Karte, Details und Überspringen
- eigenständiger Guide-Browser mit **Empfohlen**, **Alle Guides** und
  **Favoriten**, Suche, Fraktions-/Klassen-/Kategorie-Filter und Seitenwechsel
- komplett neu gegliedertes Einstellungsfenster:
  **Allgemein, Guides, Navigation, Automation, Ausrüstung, Trainer & Talente,
  Karte & Marker, Anzeige, Audio, Daten & Import, Erweitert**
- Navigation enthält eine Live-Vorschau des ausgewählten Pfeil-Skins
- der bestätigte Auto-Equip-Hinweis bleibt unter dem neuen Hauptfenster verankert

### Mehrsprachigkeit

Unterstützte Addon-Sprachen:

- English
- 中文
- हिन्दी
- Español
- Français
- Deutsch
- Русский

Die Einstellung **Automatisch (WoW-Client)** verwendet `GetLocale()`. Unterstützte
WoW-Locale-Zuordnungen sind `enUS/enGB`, `zhCN/zhTW`, `esES/esMX`,
`frFR`, `deDE` und `ruRU`. Hindi ist manuell auswählbar.

### Erweiterbare Guide-Plattform

`GuideRegistry.lua` ist die einzige zentrale Registry für freigegebene
Levelrouten und deren Metadaten. Neue Routen können mit
`GuideRegistry:RegisterRoute(...)` ergänzt werden. Guide-Browser,
SupportedRoutes-Validierung, Suche, Favoriten und Empfehlungen verwenden
automatisch dieselbe Registry.

### Smart Resync

`SmartResync.lua` synchronisiert anhand aktiver Questphasen und bestätigter
Quest-Historie. Es wird bewusst **nicht nur nach Charakterlevel geraten**, damit
Vorquestketten nicht übersprungen werden.

### RestedXP-Aktionsengine

`RestedXPActionEngine.lua` wandelt die bereits importierten strukturierten
RestedXP-Direktiven in einen Runtime-Aktionsplan um. Reise-, Trainer-,
Wirtschafts-, Gate-, Timer-, Item- und Interaktionsaktionen bleiben als
strukturierte Schritte verfügbar. Geschützte WoW-Aktionen werden nicht
unsicher erzwungen.

### TravelPlanner

`TravelPlanner.lua` bewertet direkte Laufwege sowie vorhandene RestedXP-
Flug-, Hearthstone- und Transporthinweise. Taxi-Knoten werden bei geöffnetem
Flugmeister erfasst. Die schnellste bekannte belastbare Option kann im
Hauptfenster als Reisehinweis erscheinen.

### ForeverQuestDB

`ForeverQuestDB.lua` baut aus den importierten Forever-Guides eine
questphasenbezogene Koordinatendatenbank auf. RouteEngine verwendet sie als
zusätzlichen Fallback zwischen RestedXP-Direktkoordinaten und schwächeren
Blizzard-POI-Quellen. Verifizierte Runtime-Ziele können lokal gelernt werden.

### Trainer, Talente, Verlauf und Audio

- `TrainerAdvisor.lua` erzeugt Trainerhinweise aus den strukturierten
  RestedXP-Aktionen.
- TalentAdvisor führt diese Hinweise gemeinsam mit datenbasierten
  Talentempfehlungen.
- `Journey.lua` speichert bis zu 500 lokale Quest-Annahme-, Quest-Abgabe- und Level-Up-Ereignisse inklusive Level sowie Map-/Zonen-Kontext, soweit verfügbar.
- optionale Sounds für Schrittwechsel und bestätigtes Auto-Equip sind
  standardmäßig ausgeschaltet.

### Neue Befehle

- `/mg guides`
- `/mg language auto|en|zh|hi|es|fr|de|ru`
- `/mg find <Questname>`
- `/mg journey`
- `/mg travel`
