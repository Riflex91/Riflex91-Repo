# CAP-022 – Production Material Acquisition / Handoff

**Status:** PREPARED / NO-WRITE  
**Zweck:** V5-native Verbindung zwischen Production-`FARM`-Planung und spaeterer produktiver Farmer-Ausfuehrung.

## Ausgangslage

Der V5 Production Planner kann bereits `FARM`-Nodes in einem bounded Production-Graph planen. PR20.9 Craft wartet aktuell jedoch auf einen natuerlich vorhandenen `NORMAL_CRAFT_ONLY`-Kandidaten. Die produktiven Farmer-Aktionen Movement, Combat und Loot werden laut Post-R19-Roadmap erst in PR23 ratifiziert; deren Multi-Character-Transport/Koordination haengt wiederum von PR22 ab.

CAP-022 schliesst deshalb jetzt nur die **NO-WRITE-Planungsluecke**. Sie erzeugt keine Crafting-Materialien, fuehrt keine Farmer-Aktion aus und darf den aktuellen PR20.9-Blocker nicht umgehen.

## V5-native Implementierung

Quelle:

- `grundlage/quelle/koordination/production-material-acquisition.ts`

Vertrag:

- `grundlage/vertraege/runtime/pr22-23-production-material-acquisition-foundation.json`

Tests:

- `grundlage/tests/pr22-23-production-material-acquisition.test.mjs`

Die Implementierung wird neu auf V5-Vertraegen gebaut. `v3/src/party/production-material-acquisition.js` bleibt ausschliesslich Wissens- und Fehlerquelle.

## Ablauf

Der vorbereitete Pfad lautet:

`Production FARM-Node -> MaterialObjective -> FARM_REQUIRED -> MATERIAL_READY_FOR_HANDOFF -> PR22-Koordination -> PR23 Movement/Combat/Loot -> Collection/Handoff -> spaeterer PR20.9-Recheck`

Die Foundation:

- liest `FARM`-Nodes aus einem bereits validierten V5-Produktionsplan;
- bindet frische Farm-Source-Evidence an Item, Level, Monster, Map und Spawn-Fingerprint;
- waehlt deterministisch nur einen frischen, selben Account/Server gebundenen Farmer;
- verlangt vorbereitete Movement-/Combat-/Loot-Faehigkeiten;
- erzeugt nur ein Planning-Objective;
- bewertet frische Inventory-Evidence fuer den Materialfortschritt;
- fordert bei erreichter Zielmenge sofort `MATERIAL_READY_FOR_HANDOFF`, Farm-Stop und Handoff.

Damit wird das historische CAP-022-Risiko **„Farmer farmt nach READY weiter“** explizit geschlossen.

## Safety-Grenze

Diese Foundation besitzt und erzeugt keine:

- Execution-Authority;
- Gameplay-Authority;
- Raw-Write-Authority;
- `send_cm`-Authority;
- Movement-/Combat-/Loot-Authority;
- breite Production-Graph-Authority;
- Normal-Runtime-Freigabe.

Produktive Materialbeschaffung bleibt gesperrt, bis die dafuer benoetigten PR22-/PR23-Gates mit realer Evidence ratifiziert sind.

## Beziehung zu PR20.9

CAP-022 ist **kein** Mechanismus, um den aktuellen Craft-Test kuenstlich mit Material zu versorgen.

Insbesondere gilt:

- `candidateAcquisitionOrMutationAllowedNow = false`;
- ein geplantes Farmziel ist kein natuerlicher aktueller Inventar-Kandidat;
- die Foundation zaehlt nicht als Craft-Ratifizierung;
- Craft-Authority bleibt geschlossen;
- PR20.9 bleibt `CRAFT_DURABLE_SHADOW_BLOCKED_NO_NORMAL_CANDIDATE`.

Erst wenn spaeter im normalen produktiven Betrieb Material durch ratifizierte Farmer-Funktionen entsteht und dadurch ein echter `NORMAL_CRAFT_ONLY`-Kandidat im Inventar vorhanden ist, darf PR20.9 erneut beobachtet und nach seinen eigenen Craft-Gates fortgesetzt werden.

## Naechster produktiver Pfad

1. PR20.9 bleibt fail-closed, solange kein natuerlicher Craft-Kandidat existiert.
2. PR22 muss produktive Multi-Character-Koordination ratifizieren.
3. PR23 muss mindestens Movement, Combat und Loot separat produktiv ratifizieren.
4. CAP-022 darf danach Materialziele real ausfuehren lassen und bei Zielmenge in den Handoff wechseln.
5. Ein dadurch im normalen Betrieb entstandener Craft-Kandidat kann einen neuen PR20.9-Shadow-Lauf ausloesen.
6. Erst die separate Craft-Evidence darf Craft-Authority und spaetere Production-Schritte oeffnen.
