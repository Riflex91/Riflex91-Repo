# ADR-008 – R7 Modul-, Capability-, Port- und Authority-Grenzen

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R7 muss Erweiterbarkeit und Authority technisch strukturieren, ohne das weiterhin gesperrte Gameplay-Runtime-Gesamtgate zu umgehen. Die Phase benoetigt Module Registry, Capability Registry, typisierte Ports, Single Owner fuer mutierende Faehigkeiten, Lifecycle-/Health-Regeln, versionierten Provider-Ersatz sowie eine Bediener-Richtlinie mit Nothalt.

Persistiertes Wissen, Modulaktivierung oder ein registrierter Capability-Provider duerfen dabei keine Gameplay- oder Raw-Write-Autoritaet erzeugen.

## Entscheidung

1. Registrierbare V5-Module werden ueber einen unveraenderlichen, versionierten Modulvertrag beschrieben und starten in R7 immer deaktiviert.
2. Modulabhaengigkeiten werden ueber versionierte Port-Vertragsreferenzen validiert. Direkte Cross-Domaenen-Implementierungsimporte werden durch den R7-Dependency-Guard blockiert.
3. Faehigkeiten besitzen die Modi `LESEN`, `PLANEN` oder `MUTIEREN`.
4. Eine mutierende Faehigkeit kann im Register nur genau einen Provider besitzen. Ein Providerwechsel ersetzt den inaktiven Provider ohne parallelen mutierenden Owner.
5. Mutierende Faehigkeiten sind in R7 zwingend default-off. Eine Aktivierung mutierender Faehigkeiten ist in R7 explizit gesperrt.
6. Module besitzen explizite Aktivierung, Deaktivierung, Health-/Quarantaene-Zustand und versionierten Austausch. Modulstart selbst verleiht keine Gameplay-Autoritaet.
7. Bedienersteuerung ist deny-only: `FAEHIGKEIT_SPERREN` und `NOTHALT_AKTIVIEREN` koennen Authority nur reduzieren.
8. Bediener-Deny wird vor der lokalen Richtlinienwirkung ueber einen typisierten durable Protokoll-Port geschrieben. Scheitert die Protokollierung, wird der Befehl nicht lokal angewendet.
9. Bedienerbefehle koennen keine harte Safety-Regel umgehen und erzeugen keine Gameplay- oder Raw-Write-Autoritaet.
10. Das Gameplay-Runtime-Gesamtgate bleibt in R7 `GESPERRT`. Adventure-Land-Mutationen und Raw Game Writes bleiben ausserhalb des R7-Scopes.

## Konsequenzen

- Ein zweiter mutierender Provider kann nicht still registriert werden.
- Neue mutierende Faehigkeiten koennen nicht versehentlich aktiv starten.
- Modulversionen koennen ohne Patchen fremder Implementierungen ausgetauscht werden, sofern ihre typisierten Port-Vertraege weiterhin erfuellt sind.
- Quarantaene und Deaktivierung reduzieren Authority deterministisch.
- Operator-Deny/Nothalt dominiert autonome Fallbacks.
- Spaetere Phasen muessen weiterhin Scheduler-, Resource-, Admission-, Fencing-, Transaction- und Execution-Grenzen implementieren; R7 allein autorisiert keine Spielaktion.

## Alternativen

- **Mutierende Provider parallel registrieren und erst spaeter auswaehlen:** verworfen, weil dadurch ein zweiter Write-Owner strukturell vorhanden waere.
- **Mutierende Capabilities in R7 aktivierbar machen:** verworfen, weil das separate Gameplay-Runtime-Gesamtgate weiterhin gesperrt ist.
- **Direkte Modul-zu-Modul-Implementierungsabhaengigkeiten:** verworfen zugunsten typisierter Ports/Vertraege.
- **Bediener-Override zum Lockern von Safety:** verworfen; Bedienersteuerung darf Authority nur reduzieren.
- **Nothalt automatisch ruecksetzen:** verworfen; R7 modelliert keinen stillen Authority-Wiedergewinn.

## Invarianten

Betroffen sind insbesondere:

- V5-ALT-001 – genau ein mutierender Owner;
- V5-ALT-044 – Cross-Modul-Abhaengigkeiten nur ueber Ports/Vertraege;
- V5-ALT-052 – Operator-Deny dominiert autonome Fallbacks;
- V5-INV-003 – mutierende Capabilities default-off;
- V5-INV-021 – Bediener kann Authority reduzieren, aber Safety nicht umgehen;
- V5-INV-103 – Disable-/Rollback-Pfad fuer spaeter live-faehige Capabilities;
- V5-INV-106 – azyklische Layer-/Dependency-Grenzen.

## Migration

R7 fuehrt ausschliesslich no-write Registries und Vertraege unter `v5/grundlage/**` ein. V3/V4-Runtime-Code wird nicht uebernommen oder veraendert. Spaetere Module muessen ihre Abhaengigkeiten ueber die typisierten R7-Port-Grenzen deklarieren. Mutierende Provider bleiben bis zu einer spaeteren expliziten Runtime-Freigabe deaktiviert.

## Rollback

R7-Artefakte koennen auf den vorherigen R6-Stand zurueckgesetzt werden, ohne Gameplay-Zustand zu migrieren, da R7 keine Gameplay-Mutation autorisiert. Ein Rollback darf weder mutierende Capabilities aktivieren noch Operator-Deny/Nothalt lockern. Bei inkonsistenter Registry oder unklarer Authority bleibt das System fail-closed.

## Nachweise

- `v5/grundlage/quelle/autoritaet/ports.ts`
- `v5/grundlage/quelle/autoritaet/modul-register.ts`
- `v5/grundlage/quelle/autoritaet/faehigkeits-register.ts`
- `v5/grundlage/quelle/autoritaet/bediener-richtlinie.ts`
- `v5/grundlage/tests/r7-module.test.mjs`
- `v5/grundlage/tests/r7-autoritaet.test.mjs`
- `v5/werkzeuge/r7-statische-guards.mjs`
- `v5/werkzeuge/r7-struktur-pruefen.mjs`
- `.github/workflows/v5-r7.yml`
