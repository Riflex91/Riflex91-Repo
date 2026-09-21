# Mewthisch Guides — Architektur-Gap-Matrix und Migrationsreferenz

> **Living architecture reference**
>
> Dieses Dokument hält den aktuellen Architekturstand, die aus der Zygor-Analyse
> abgeleiteten Zielprinzipien, die konkrete Gap-Matrix und die empfohlene
> Migrationsreihenfolge für Mewthisch Guides fest.
>
> Bei zukünftiger Arbeit am Addon soll dieses Dokument als primärer
> Architektur-Einstiegspunkt verwendet und nach relevanten Architekturänderungen
> aktualisiert werden.

## Analyse-Snapshot

Stand der Analyse: **2026-09-21**

Analysierter Arbeitsstand:

- Repository: **Riflex91/Riflex91-Repo**
- Addon: **world of warcraft/MewthischGuides/**
- Branch: **wow/mewthisch-guides-v0.11-runtime-routing-r3**
- analysierter Branch-HEAD: **1cb8fa41cc5920bbe003113c1cd83812ee97837c**
- PR: **#523**, Draft/Open
- Zielversion: **v0.12.0**
- CI auf dem analysierten Head: **Mewthisch Guides addon v0.12.0 #454 — SUCCESS**

Diese Git-Daten sind nur ein historischer Analyse-Snapshot. Vor Repository-Writes
immer PR, Branch-HEAD und aktuellen main live prüfen und parallele Änderungen
berücksichtigen.

## Arbeitsregel für Architekturänderungen

- Keine Architekturannahme nur aus dem UI ableiten.
- Vor größeren Refactors zuerst Source-Daten, Domain, Runtime und Consumer
  getrennt betrachten.
- Änderungen klein, nachvollziehbar und testbar halten.
- Regressionstests zusammen mit neuen Semantiken ergänzen.
- Ein erfolgreicher CI-Lauf ist Voraussetzung, bevor eine Änderung als
  funktionierend betrachtet wird.
- Kein Merge allein aufgrund dieser Roadmap; Merge bleibt eine separate
  bewusste Repository-Aktion.

# 1. Zielmodell

Der wichtigste korrigierte Grundsatz lautet:

~~~text
Guide
  → Steps
      → Goals
~~~

Mehrere sichtbare Zeilen können Goals **innerhalb desselben aktuellen Steps**
sein. Sie sind nicht automatisch zukünftige Questphasen.

Beispiel eines einzelnen Steps:

~~~text
Töte Named Mob
  Hinweis: Inside the building.
Sammle Item 0/6
  passive From-/Source-Information
~~~

Die langfristige Zielstruktur ist:

~~~text
1. DOMAIN / SEMANTIC CORE

CompiledGuide
CompiledStep
CompiledGoal
Requirements
Sticky Relations


2. RESOLVERS

RequirementResolver
VisibilityResolver
CompletionResolver
GoalStateResolver
LocalizationResolver
PresentationResolver
NavigationTargetResolver
RoutePlanner
GearScoreResolver / LoadoutResolver


3. POLICIES

ProgressPolicy
VisibilityPolicy
WaypointPolicy
TravelPolicy
AutomationPolicy
GearPolicy
RecommendationPolicy


4. RUNTIME STATE

CurrentGuide
CurrentStep
CurrentStickies

GoalStates
StepState
DestinationGoal
DestinationWaypoint
Route
CurrentRouteSegment

RuntimeRevision


5. CONSUMERS

Main Viewer
Navigator
World Map
ActionBar
Guide Browser
Gear Advisor
Automation


6. DIAGNOSTICS

Warum ist Goal sichtbar?
Warum ist Goal incomplete?
Warum ist Goal impossible?
Warum wurde Step übersprungen?
Warum ist Goal X das Navigationsziel?
Warum wurde Route Y gewählt?
Warum ist Item A ein Upgrade?
~~~

## Zentraler Architekturgrundsatz

**Kein Consumer besitzt die Wahrheit.**

Das bedeutet insbesondere:

- Viewer entscheidet nicht Completion.
- Navigator/Pointer entscheidet nicht Task Priority.
- WorldMapMarker entscheidet nicht das semantische Ziel.
- ActionBar entscheidet nicht Goal Activity.
- QuestAutomation entscheidet nicht selbst, welche Quest relevant ist.
- GearFinder/Gear-UI entscheidet nicht den GearScore.

Alle Consumer lesen bereits aufgelöste semantische Runtime-Zustände.

# 2. Wichtigste Erkenntnis des aktuellen Codes

Mewthisch ist bereits deutlich weiter als ein monolithischer Quest-Viewer.
Es existieren unter anderem:

- GoalEngine
- StepEngine
- GuideEngine
- QuestTracking
- GuideParser / DataLoader
- RestedXPImport
- RestedXPActionEngine
- SmartResync
- RouteEngine
- ManualRoute
- TravelGraph / TravelPlanner
- Navigation / Navigator
- WorldMapMarker
- State / Sync
- Diagnostics
- GuideRegistry
- SettingsSchema
- GearAdvisor

Der zentrale Architekturbruch liegt aber zwischen Domain/Runtime und den
Consumern.

**GoalEngine:BuildQuestGoals() erzeugt mehrere Goals.**
Danach wählt **GetActiveGoal()** aber genau ein Goal aus. StepEngine schreibt
dieses als **step.goal**. UI2, RouteEngine, RestedXP-Kontext, Navigation und
ActionEngine orientieren sich anschließend an diesem einzelnen Goal.

Das effektive Modell ist deshalb noch:

~~~text
Guide
→ quest-basierte Steps
→ mehrere Goal-Daten
→ EIN ausgewähltes step.goal
→ UI / Navigation / Actions
~~~

Das Zielmodell ist stattdessen:

~~~text
Compiled Guide
→ Current Step
→ mehrere semantisch gleichberechtigte Goals
→ GoalStateResolver
→ StepStateResolver
→ Runtime Snapshot
   ├ Viewer Projection
   ├ Navigation Projection
   ├ Action Projection
   └ Automation Projection
~~~

# 3. Gap-Matrix

## RestedXPImport

### Existiert bereits

- umfangreicher Parser für öffentliche RestedXP-/Forever-Daten
- Selector- und Tag-Logik
- Klassen-/Rassen-/Fraktionsfilter
- rxpOccurrences
- Objective-Indices
- Koordinaten und Route-Points
- Hints
- Instruction Context
- strukturierte Action-Typen
- Klassenquest-Audit

### Gut und wiederverwendbar

Die Rohdatenbasis, Selector-Auswertung, Objective-spezifischen Occurrences und
Koordinaten sind wertvoll und sollten erhalten bleiben.

### Haupt-Gap

Der Import kollabiert Raw-Guide-Schritte im Wesentlichen nach **questID** zu
Questdefinitionen mit mehreren Occurrences.

Dadurch geht eine wichtige Information verloren:

**Ein RestedXP-Raw-Step ist nicht dasselbe wie eine Questphase.**

Ein Raw-Step mit mehreren Direktiven muss langfristig als ein CompiledStep mit
mehreren Goals/Annotations erhalten bleiben.

Beispiel:

~~~text
.goto ...
.target ...
.complete 123,1
.mob ...
.collect ...
~~~

soll strukturell nicht mehr nur zu

~~~text
Quest 123
→ Phase Objectives
→ aktuell ausgewähltes Objective
~~~

werden.

## GuideParser / DataLoader

### Existiert bereits

- Normalisierung mehrerer Guides
- Sortierung
- Validierung
- zentrale Guide-Auswahl
- SupportedRoutes-Validierung
- GuideRegistry-Anbindung

### Gap

Es fehlt eine echte Compile-Phase:

~~~text
Raw Source
→ CompiledGuide
→ CompiledStep
→ CompiledGoal
~~~

GuideParser ist der natürliche Ort beziehungsweise Einstiegspunkt für diese
Trennung.

## GoalEngine

### Existiert bereits

- mehrere Quest-Objectives als Goal-Liste
- Quest-ID und Objective-Index
- Goal-Typklassifikation
- Current/Required
- Prozentfortschritt
- Optional-Flag
- Finished/Complete-Daten

### Gut

Diese Felder sind eine gute Fact-/Goal-Basis:

~~~text
questID
index
type
current
required
percent
optional
finished
~~~

### Haupt-Gaps

Der heutige Zustand ACTIVE/PENDING erzwingt künstlich ein einziges aktives
Goal.

Es fehlen insbesondere:

- visible
- complete als Resolver-Ergebnis
- possible
- hidden
- passive
- impossible
- obsolete
- warning
- navigationEligible
- explanation
- completionResolver
- visibilityResolver

Zusätzlich erzeugt GoalEngine bereits fertige deutsche Instructions wie
"Sammle ..." oder "Töte ...". Damit mischt die Domain bereits Presentation.

Langfristig besser:

~~~text
CompiledGoal
    action = kill
    questID = 123
    objectiveIndex = 2

RuntimeGoalState
    visible = true
    complete = false
    possible = true
    status = incomplete
    done = 3
    needed = 6

PresentationProjection
    text = "Töte ..."
~~~

## StepEngine

### Existiert bereits

- Accept/Objectives/Turnin/Complete/Live
- Faction/Race/Class/Level-Prüfungen
- Prerequisite Quest IDs
- RestedXP Selector-Prüfungen
- Resync-Logik
- Live-Fallback-Steps

### Gap

Der Step entspricht heute primär einer **Questphase**, nicht einem echten
Guide-Step mit mehreren semantischen Goals.

Es fehlen unter anderem:

- eigener StepStateResolver
- OR-Gruppen
- Passive Goals
- Hidden Goals
- Impossible Goals
- Optional-Completion-Semantik
- Confirm
- Override
- custom completion logic
- anywascompletable
- auxiliary semantics

Step Completion darf langfristig nicht einfach "alle Goalzeilen grün" bedeuten.

## QuestTracking

### Existiert bereits

- moderner Questlog-Snapshot
- Legacy-Fallback
- Objective-Texte
- done / needed
- readyForTurnIn
- completed
- Change-Signatur

### Bewertung

QuestTracking ist einer der Bereiche, die **nahe am Zielprinzip** liegen.

Es sollte Fakten liefern, aber keine Runtime-Transition entscheiden.

Zielpipeline:

~~~text
WoW Quest Event
→ QuestTracking Fact Snapshot
→ Runtime Resolver
→ Goal/Step State
→ Transition Detector
→ Consumer Events
~~~

### Gap

Es fehlen zentrale semantische Transitions:

- GOAL_COMPLETED
- GOAL_UNCOMPLETED
- GOAL_PROGRESS
- GOAL_VISIBILITY_CHANGED
- STEP_COMPLETE / STEP_CHANGED

Initialzustand und echte Transition müssen getrennt werden.

## GuideEngine / Runtime

### Existiert bereits

- steps
- currentStep
- currentStepIndex
- Refresh-Kette
- Progress-Signatur
- Step-/Goal-Change Logging
- Auto-Resync
- Navigation/UI-Refresh

### Haupt-Gap

Es existiert noch kein zentraler atomarer Runtime-Commit.

Benötigt wird ungefähr:

~~~text
FocusStep / CommitStep
  old step leave
  → CurrentStep setzen
  → GoalStates einmal auflösen
  → StepState auflösen
  → Initialzustände merken
  → RuntimeRevision erhöhen
  → Semantic Events
  → Viewer Projection
  → Navigation Projection
  → Action Projection
  → weitere Consumer
~~~

Es fehlt außerdem ein **RuntimeRevision**-Modell.

## State.lua

### Existiert bereits

- Profil
- Position
- aktive Questanzahl
- Build
- aktive Guide-ID

### Gap

State.lua ist noch kein Guide-Runtime-State.

Es fehlen:

- CurrentStep semantic state
- GoalStates
- CurrentStickies
- DestinationGoal
- DestinationWaypoint
- Route
- CurrentRouteSegment
- RuntimeRevision

## SmartResync

### Existiert bereits

- sichere Resume-Position
- Priorität für Turnin/Objectives/Live
- kein blindes Level-Raten

### Gap

SmartResync arbeitet noch auf Questphasen und step.complete.

Langfristig sollte es eine **ProgressPolicy / RecoveryPolicy** auf bereits
aufgelöstem StepState sein.

## UI2

### Existiert bereits

- modernes Hauptfenster
- Guide Browser
- Settings
- separate Navigator-UI
- Questgeber-/Source-/Location-Darstellung
- Icons und Progress

### Haupt-Gap

UI2 besitzt aktuell eigene Semantik.

Die Funktion zur Instruction-Darstellung entscheidet selbst:

- accept
- turnin
- kill
- collect
- interact
- source
- questGiver

und fragt RestedXPImport direkt nach Instruction Context.

Damit besitzt der Consumer einen Teil der Wahrheit.

Ziel:

~~~text
ViewerProjection {
    rows = {
        {
            icon
            text
            status
            progress
            hint
            indent
        }
    }
}
~~~

UI2 soll diese Projection nur darstellen.

## Legacy UI.lua

### Existiert bereits

- Goal-Rows
- Progressbar
- dynamische Progressfarben
- Tooltips
- zahlreiche UI-Primitives
- AutoEquip-Notice

### Bewertung

Einige alte Darstellungsbausteine sind für den zukünftigen Multi-Goal-Viewer
sogar näher am Ziel als das heutige UI2-Ein-Goal-Modell.

### Gap

Legacy UI und UI2 existieren parallel; UI2 versteckt Legacy-Frames.

Langfristig:

- sinnvolle UI-Primitives übernehmen
- semantische Logik entfernen
- Legacy-Hauptviewer vollständig löschen, sobald UI2 auf ViewerProjection läuft

## Navigation / Navigator

### Existiert bereits

- separates Navigator-Fenster
- Bearing
- Entfernung
- ETA
- Arrow-Skins
- fail-closed Richtung

### Gut

Die Trennung Hauptviewer versus Navigator ist bereits richtig.

### Haupt-Gap

Navigation hängt am einzelnen **step.goal**.

Benötigt wird die explizite Trennung:

~~~text
DestinationGoal
→ DestinationWaypoint
→ Route
→ CurrentRouteSegment
→ Navigator
~~~

## RouteEngine

### Existiert bereits

Mehrere Koordinatenquellen:

- explizite Route-Daten
- RestedXP-Koordinaten
- ForeverQuestDB
- TravelGraph
- QuestLine Start
- moderne Quest-POIs
- Quest Waypoint
- Legacy POI
- Blizzard Navigation

Dazu Kandidatenscoring und Diagnose.

### Gut

Diese Quellen und die Fallbacklogik sind wertvoll.

### Gap

RouteEngine entscheidet aus Step + Phase + step.goal.index.

Es fehlt ein eigener **NavigationTargetResolver**, der zuerst semantisch
entscheidet, welches Goal überhaupt navigierbar und aktuell das Ziel ist.

Erst danach soll RouteEngine den Weg beziehungsweise die beste Koordinate
bestimmen.

## ManualRoute

### Existiert bereits

- nächstes aktives Questziel nach Entfernung
- fail-closed bei fehlenden Koordinaten

### Gap

ManualRoute wählt ganze Quests beziehungsweise Questphasen.

Langfristig sollte es eine Waypoint-/GoalSelection-Policy auf
navigationEligible GoalStates sein.

## TravelGraph

### Existiert bereits

- gewichteter Graph
- Pfadkosten
- Edge-Conditions
- nächster Hop

### Gut

Das ist strukturell bereits der richtige Ansatz.

### Gap

TravelGraph ist noch nur schwach mit dem Guide-Domainmodell integriert.
Travel-Definitionen sind ein Sonderpfad.

## TravelPlanner

### Existiert bereits

- Walk
- Flight
- Hearthstone
- Transport
- geschätzte Zeit
- Taxi-Knoten
- Travel-Settings

### Gap

Es fehlt eine explizite zentrale TravelPolicy.

TravelPlanner liest aktuell Settings unmittelbar und mischt Capability,
Policy und Presentation Hint.

## WorldMapMarker

### Bewertung

WorldMapMarker ist bereits sehr nah am Zielmodell:

- bekommt ein Target
- entscheidet nicht selbst die Questpriorität
- setzt beziehungsweise löscht nur die Kartenprojektion

Langfristig soll er nur noch RuntimeNavigationState statt globalem
navigation.target lesen.

## RestedXPActionEngine

### Existiert bereits

Strukturierte Aktionen für:

- Travel
- Trainer
- Economy
- Gate
- Timer
- Item
- Interaction

### Gap

Der ActionEngine-Plan ist heute ein paralleler Runtime-Strang.

Langfristig müssen relevante Actions entweder:

- echte CompiledGoals sein, oder
- strukturierte Goal-Metadaten/Annotations besitzen.

Action Consumer sollen dieselbe Runtime-Wahrheit lesen wie Viewer und
Navigation.

## ActionBar

Eine eigenständige ActionBar existiert derzeit nicht.

Voraussetzung für eine saubere ActionBar:

1. GoalStates
2. CurrentStickies
3. Action Eligibility
4. Deduplizierung
5. Consumer Projection

Nicht vorzeitig eine UI bauen, die selbst Aktivität ermittelt.

## QuestAutomation

### Existiert bereits

- AutoAccept
- AutoTurnin
- Gossip-Unterstützung
- Sicherheitsprüfungen
- Reward-Guards

### Gap

Automation reagiert heute weitgehend auf Questdialoge und Settings.

Langfristig braucht sie eine **AutomationPolicy** plus explizite semantische
Freigabe aus dem Runtime-State.

Automation darf nicht selbst bestimmen, welche Quest beziehungsweise Aktion
gerade relevant ist.

## GuideRegistry / Guide Browser

### Existiert bereits

- zentrale Registry
- 43 freigegebene Routen
- Kategorien
- Suche
- Favoriten
- Recommendation Score
- Featured-Metadaten

### Gut

Die Registry ist eine wertvolle Basis.

### Gaps

Folgende Konzepte müssen semantisch getrennt werden:

- loadable
- browse-visible
- searchable
- eligible
- suggested
- recommendation priority
- featured
- favorite
- recent

Featured ist redaktionell.
Suggested ist spielzustandsabhängig.
Favorites/Recent beruhen auf Benutzerverhalten.

## Guide-Aktivierung

### Existiert bereits

- DataLoader.activeGuide
- preferredGuideID
- RefreshGuide

### Gap

Es fehlt ein zentraler Guide-Lifecycle ähnlich:

~~~text
old step leave
→ Guide finden
→ Validity prüfen
→ CompiledGuide laden
→ CurrentGuide setzen
→ passenden Step bestimmen
→ FocusStep / Runtime Commit
→ Consumer aktualisieren
~~~

## Tabs / Sessions

Noch nicht als echtes Runtime-Konzept vorhanden.

Langfristig sollen mehrere Guide-Sessions parallel existieren können:

~~~text
GuideSession
  guideID
  currentStep
  position/state metadata
~~~

Nur eine Session ist CurrentGuide.

Wichtig für spätere Dungeon-/Context-Switches.

## Sticky

Noch nicht als vollständiges Konzept vorhanden.

Benötigt werden:

- Parser-/Compiled-Metadaten
- Sticky Relations
- CurrentStickies Runtime
- Visibility
- Completion
- separate Viewer Projection
- Action Consumer
- keine konkurrierende normale Destination-Auswahl ohne Policy

Sticky ist parallel zum Current Step, nicht "der nächste Step".

## Settings / Policies

### Existiert bereits

SettingsSchema mit sinnvollen visuellen Kategorien.

### Gap

Darunter liegt weiterhin hauptsächlich eine flache Settings-Tabelle.

Semantisch müssen mindestens getrennt werden:

~~~text
PresentationPolicy
VisibilityPolicy
ProgressPolicy
WaypointPolicy
TravelPolicy
AutomationPolicy
GearPolicy
RecommendationPolicy
~~~

Die bestehende SavedVariables-Struktur kann zunächst kompatibel bleiben.
Neue Policy-Fassaden dürfen die alten Settings lesen, damit keine harte
Datenmigration nötig ist.

## Persistenz

### Existiert bereits

- settings
- logs
- sessions/log sessions
- runtime
- guideFavorites
- journey
- learned coordinates

### Gap

Flüchtiger Runtime-State und persistente Benutzer-/Lerndaten sind nicht sauber
getrennt.

Langfristig gilt:

**Persistenz ist nicht die Runtime-Wahrheit.**

Beim Login muss der Runtime-State aus echten Facts neu aufgebaut werden.

## Diagnostics

### Existiert bereits

Sammelt unter anderem:

- Validation
- QuestTracking
- Route
- Build
- Travel
- Inventory
- Gear
- Reward
- Talent
- Actions
- Localization
- Journey
- SmartResync

### Gap

Es fehlen Explainability-Fragen:

- Warum sichtbar?
- Warum hidden?
- Warum complete?
- Warum impossible?
- Warum Step übersprungen?
- Warum dieses DestinationGoal?
- Warum diese Route?
- Warum dieses Gear-Upgrade?

Resolver sollten dafür Reason Codes beziehungsweise Explanation-Strukturen
liefern.

## Localization

### Existiert bereits

- sieben Addon-Sprachen
- Client-Locale-Erkennung
- zentrale UI-Lokalisierung

### Gap

GoalEngine erzeugt teilweise schon deutsche Domain-Strings.

Langfristig ID-first:

- NPC IDs
- Item IDs
- Quest IDs
- Objective-Daten

und erst im PresentationResolver lokalisieren.

## GearAdvisor

### Existiert bereits

- Equippability
- Armor Proficiency
- Binding Checks
- Statweights
- Itemlevel-Fallback
- Strict Stat Dominance
- Confidence
- AutoEquip Guards
- Slotvergleich

### Haupt-Gap

Bewertung bleibt slotorientiert.

Insbesondere Waffen brauchen langfristig:

~~~text
Current Loadout
→ Candidate Loadouts
→ Gesamt-Score alt
→ Gesamt-Score neu
→ Gültigkeit / sichere Wechselstrategie
~~~

Der bekannte Medium-Confidence-Waffenfall darf nicht isoliert durch Entfernen
eines Guards "gefixt" werden.

Gear sollte langfristig getrennt werden in:

~~~text
ValidityResolver
→ GearScoreResolver
→ LoadoutResolver
→ GearRecommendation
→ GearActuation
~~~

# 4. Wichtige semantische Zielregeln

## Goal Status vor Rendering

Ein GoalState soll vor jedem Consumer aufgelöst sein.

Mögliche Statusfamilie:

- hidden
- passive
- incomplete
- complete
- impossible
- obsolete
- warning

## Passive Goals

Passive Informationen wie source/from dürfen einen Step nicht blockieren.

## Completion und Action sind getrennte Konzepte

Ein kill-Goal kann beispielsweise über ein Questobjective abgeschlossen werden.

Action sagt "was".
CompletionResolver sagt "wann erledigt".

## Koordinaten und Action sind getrennt

Koordinaten sagen "wo".
Action sagt "was".

Ein Kill-/Collect-/Talk-Goal mit Koordinaten bleibt semantisch Kill/Collect/Talk.

## Route Arrival ist nicht Goal Completion

~~~text
RouteSegmentArrival
≠
GoalCompletion
~~~

Bei Kill/Collect reicht räumliches Ankommen nicht.

## QuestTracking entscheidet nicht den Stepwechsel

~~~text
data changed
≠
runtime transition
~~~

QuestTracking aktualisiert Facts.
Runtime Resolver + Step Gatekeeper entscheiden.

## Initial State ist keine Transition

Wenn ein Goal beim Betreten des Steps bereits complete ist, darf daraus kein
falscher Completion-Flash, Sound oder GOAL_COMPLETED Event entstehen.

Erst ein späterer Übergang incomplete → complete ist eine echte Transition.

## Destination und Route sind getrennt

~~~text
Destination
= dauerhaftes semantisches Ziel

Route
= aktuelle Lösung, wie man dieses Ziel erreicht
~~~

Eine Route darf neu berechnet werden, ohne dass das semantische Ziel wechselt.

# 5. Fehlende Charakterisierungstests

Vor beziehungsweise während der Migration ergänzen:

## Multi-Goal Step

- mindestens zwei gleichzeitig sichtbare unvollständige Goals
- alle Goals bleiben im selben Step
- Viewer zeigt mehrere Zeilen
- Navigation darf ein Goal priorisieren, ohne die anderen semantisch zu
  deaktivieren

## Passive Goal

- passive Source-/From-Zeile blockiert Completion nicht

## Visibility

Tests für:

- hidden
- condition
- default
- ditto
- hidewhencomplete

## Step Completion

Tests für:

- optional
- impossible
- hidden
- passive
- custom completion

## OR-Gruppen

- eine erfüllte Gruppe kann genügen
- optionale orlogic-Auswertung später separat

## anywascompletable

Wenn ein zuvor sichtbares completable Goal nach Completion/Visibility
verschwindet, darf der Step nicht hängen bleiben.

## Initial vs Transition

- bereits complete beim FocusStep → kein Completion Event
- später incomplete → complete → exakt ein Completion Event

## Progress Transition

- done/needed ändern sich
- kein Stepwechsel
- eigener Progress Event

## Runtime Revision / Consumer Consistency

Viewer, Navigator, Map und Action Consumer lesen dieselbe RuntimeRevision und
dieselben GoalStates.

## Destination vs Route

DestinationGoal bleibt gleich, während Route oder CurrentRouteSegment neu
berechnet werden.

## Arrival vs Completion

Navigation Arrival komplettiert Kill/Collect nicht.

## Sticky

CurrentStep und CurrentStickies gleichzeitig aktiv.

## Policy Isolation

Presentation-Optionen dürfen Completion nicht verändern.

Visibility-/Progress-Policies dürfen nur die dafür vorgesehenen Resolver
beeinflussen.

## Automation

AutoAccept/AutoTurnin nur bei semantischer Freigabe.

## Persistence

Alte db.runtime-Daten dürfen beim Login nicht als aktuelle Wahrheit übernommen
werden.

## Tabs

Mehrere Guide-Sessions behalten unabhängig ihre Position.

## Gear Loadout

1H + Offhand versus 2H als Gesamtloadout vergleichen.

# 6. Empfohlene Migrationsreihenfolge

## Phase 0 — Charakterisierung des heutigen Verhaltens

Noch keine semantische Produktionsänderung.

Regressionstests hinzufügen für:

- Multi-Objective
- heutige Step-Auswahl
- Navigation
- Consumer-Verhalten
- QuestTracking-Facts

Ziel: Migration gegen unbeabsichtigte Regressionen absichern.

## Phase A — Compiled Domain Model

Einführen:

- CompiledGuide
- CompiledStep
- CompiledGoal

Wichtigster Punkt:

**RestedXP-Raw-Step-Grenzen nicht mehr nach questID wegaggregieren.**

Bestehende Questdefinitionen können vorerst über einen Legacy Adapter weiter
verwendet werden.

Erste sinnvolle Goal-Felder:

~~~text
id
action / goalType

questID
objectiveIndex
npcID
itemID

mapID
x
y
worldX
worldY
radius

requirements
visibility metadata
completion metadata

hint
tooltip
source/from
indent

sticky metadata
route target metadata

raw source metadata
~~~

## Phase B — Runtime Resolver

Einführen:

- RequirementResolver
- VisibilityResolver
- CompletionResolver
- GoalStateResolver
- StepStateResolver

Dazu:

- RuntimeRevision
- RuntimeGoalState[]
- RuntimeStepState
- Reason Codes / Explanation

Noch keine große UI-Neuschreibung.

## Phase C — Runtime Commit + QuestTracking Integration

Zentralen FocusStep-/Commit-Lifecycle schaffen.

QuestTracking bleibt Fact Provider.

Transition Detector ergänzen:

- completion
- uncompletion
- progress
- visibility

Initialzustand und Transition explizit trennen.

## Phase D — Policy-Fassaden

Bestehende SavedVariables zunächst behalten.

Neue Fassaden lesen die alten Settings:

- ProgressPolicy
- VisibilityPolicy
- WaypointPolicy
- TravelPolicy
- AutomationPolicy
- GearPolicy

So kann die Semantik getrennt werden, ohne sofort Benutzerprofile zu migrieren.

## Phase E — Viewer als reine Projection

UI2 auf ViewerProjection umstellen.

Danach echte kompakte Multi-Goal-Zeilen:

- Statusicon
- Text
- Inline Counter
- Progressfarbe
- Hint/Tooltip
- Indentation
- passive Darstellung
- Sticky separat

Legacy-UI-Primitives bei Bedarf wiederverwenden.

## Phase F — NavigationTargetResolver

Explizit trennen:

~~~text
DestinationGoal
→ DestinationWaypoint
→ Route
→ CurrentRouteSegment
~~~

RouteEngine behält seine Koordinatenquellen.

ManualRoute wird Goal-/Waypoint-Selection-Policy.

WorldMapMarker und Navigator bleiben Consumer.

## Phase G — Sticky + Action Consumers

Erst Runtime-Sticky modellieren.

Danach RestedXPActionEngine an GoalState/CompiledGoal anbinden.

Erst dann echte ActionBar implementieren.

## Phase H — Guide-Orchestrierung

- Guide Status
- Guide Completion
- Suggested versus Featured
- Recommendation Priority
- Guide Chaining
- Sessions / Tabs
- Context Switches

GuideRegistry und Browser weitgehend weiterverwenden.

## Phase I — Gear Loadout Resolver

GearAdvisor aufteilen:

~~~text
Validity
→ Score
→ Loadout Evaluation
→ Recommendation
→ Actuation
~~~

Danach Waffen-/2H-/Offhand-Fälle als Gesamtloadout lösen.

## Phase J — Diagnostics + Cleanup

- Explainability vollständig machen
- Runtime und Persistenz sauber trennen
- Legacy Adapter entfernen, sobald nicht mehr benötigt
- Legacy UI-Pfade entfernen
- direkte Consumer-Zugriffe auf Source/Domain verbieten

# 7. Kleinster sinnvoller erster Produktions-Refactor

Nicht mit UI2 anfangen.
Nicht RouteEngine zuerst umbauen.

Der beste erste vertikale Refactor ist:

~~~text
RestedXP Raw Guide
        ↓
CompiledGuide / CompiledStep / CompiledGoal
        ↓
Legacy Adapter
        ↓
heutiger StepEngine zunächst funktional unverändert
~~~

Damit wird der größte strukturelle Informationsverlust beseitigt, ohne den
heutigen v0.12-Runtime-Pfad sofort zu zerlegen.

Erste vertikale Scheibe:

- neue Compiled-Datentypen
- Raw-Step-Grenzen erhalten
- Action/Quest/Objective-Zuordnung
- Koordinaten
- Hint/Source
- Selector/Requirements
- passive/indent/sticky Metadaten soweit aus Quelle ableitbar
- Legacy-Projektion für heutigen StepEngine
- Charakterisierungstests

Noch nicht Teil dieses ersten Refactors:

- neue Completion Engine
- neuer Viewer
- neue Navigation
- ActionBar
- Tabs
- Loadout-Gear

# 8. Was ausdrücklich nicht neu geschrieben werden muss

Folgende Systeme liefern bereits wertvolle Bausteine und sollen möglichst
evolutionär migriert werden:

- QuestTracking
- RestedXP Source Data und Selector-Auswertung
- GuideRegistry
- SupportedRoutes
- RouteEngine-Koordinatenquellen
- ForeverQuestDB
- Navigation/Bearing
- Navigator
- TravelGraph
- WorldMapMarker
- Settings UI
- große Teile des GearAdvisor
- Diagnostics-Infrastruktur
- Localization-Infrastruktur

Das Projekt benötigt keinen Komplett-Neustart.

Der Kernumbau besteht darin, diese Systeme um einen zentralen semantischen
Runtime-Kern zu ordnen:

~~~text
Source Data
   ↓
Compiled Domain
   ↓
Facts
   ↓
Resolvers
   ↓
RuntimeRevision
   ↓
────────────────────────────
Viewer  Navigator  Actions
Map     Automation  Diagnostics
────────────────────────────
~~~

# 9. Definition of Done für die Kernmigration

Die zentrale Architektur ist erst dann als erreicht anzusehen, wenn:

1. ein echter Current Step mehrere gleichberechtigte GoalStates besitzen kann,
2. kein Consumer Completion oder Visibility selbst berechnet,
3. QuestTracking nur Facts liefert,
4. Goal/Step Transitions zentral erkannt werden,
5. alle Consumer dieselbe RuntimeRevision lesen,
6. DestinationGoal und Route getrennt sind,
7. passive/hidden/optional/impossible Semantik Step Completion korrekt
   beeinflusst,
8. Sticky parallel zum Current Step modelliert werden kann,
9. UI2 reine Projection ist,
10. Diagnostics erklären kann, warum ein Zustand entstanden ist.

Bis dahin sind GoalEngine/StepEngine/GuideEngine funktional nützlich, aber noch
eine Übergangsarchitektur.

# 10. Pflege dieses Dokuments

Bei zukünftigen Architekturänderungen dieses Dokument aktualisieren, wenn sich
mindestens einer dieser Punkte ändert:

- Domain-Modell
- Resolver-Verantwortung
- Runtime-State
- Consumer-Verantwortung
- Policy-Grenzen
- Persistenzmodell
- Migrationsphase
- bekannte Architektur-Gaps
- Definition of Done

Für konkrete kurzfristige Bugfixes muss die Gap-Matrix nicht bei jeder kleinen
Codeänderung angepasst werden. Sie soll die **langfristige Architekturwahrheit**
und den **aktuellen Migrationsstand** dokumentieren.
