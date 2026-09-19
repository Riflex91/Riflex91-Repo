# ADR-001 – R3 no-write Grundlage und Knowledge-PR-Grenze

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R3 muss Build-, Static-, Host- und Knowledge-Grenzen technisch beweisen, ohne das weiterhin gesperrte Gameplay-Runtime-Gate zu umgehen. Gleichzeitig darf der Wissenswaechter keine ungeprueften Commits direkt auf `main` schreiben.

## Entscheidung

1. Die R3-Headless-Basis lebt unter `v5/grundlage/**`, nicht unter den fuer echte Gameplay-Implementierung reservierten Verzeichnissen wie `v5/laufzeit/**`.
2. Die Grundlage besitzt fest `gameplayAutoritaet=false` und `rawWriteAutoritaet=false`.
3. Mutierende Faehigkeiten sind default-off und eine spaetere Mutation benoetigt eine typisierte Mehrfach-Verriegelungsfreigabe.
4. Der Wissenswaechter pusht ausschliesslich auf `v5/wissenswaechter-automatisch`.
5. Ein GitHub-Workflow akzeptiert dort nur `v5/wissensbasis/**`, validiert die Wissensbasis und oeffnet/aktualisiert danach einen PR gegen `main`.
6. Der automatische Knowledge-Pfad verwendet keinen Force-Push; neuer `main` wird normal in den Knowledge-Branch integriert.
7. R3-Builds sind an exakten Git-SHA, Dependency-Lock, Verfassungs-Schema und R3-Konfigurationshash gebunden.

## Alternativen

- **Direkter Wissenswaechter-Push auf main:** verworfen, weil CI/Review umgangen werden koennen.
- **R3-Grundlage unter v5/laufzeit:** verworfen, weil dies das strenge Wissens-/Readiness-Gate fuer echte Gameplay-Implementierung ausloesen und V5-INV-018 verwischen wuerde.
- **Rebase/Force-Push des automatischen Knowledge-Branches:** verworfen, weil veröffentlichte Automation-Historie nicht umgeschrieben werden soll.
- **Historische V3/V4-Runtime als Scaffold:** verworfen; die ratifizierte Migrationsmatrix verlangt Neubau.

## Konsequenzen

- R3 kann Headless-Lifecycle, Guards und Host-/Persistenzgrenzen testen, ohne Gameplay-Authority zu erzeugen.
- Knowledge-Updates koennen zeitweise auf einem offenen PR warten; laufendes Gameplay darf davon nicht abhaengen.
- Der Knowledge-Branch kann Merge-Commits von `main` enthalten, bleibt aber pfadbegrenzt.
- Spaetere echte Runtime-Verzeichnisse bleiben bis zur formalen Laufzeitfreigabe blockiert.

## Invarianten

Betroffen sind insbesondere:

- V5-INV-002 – Mehrfach-Verriegelung;
- V5-INV-011 – Wissenswaechter darf keine Runtime-/Safety-/Host-Pfade automatisch aendern;
- V5-INV-018 – keine echte Runtime-Implementierung vor Laufzeitfreigabe;
- V5-INV-022 – Bridge/Host ohne Gameplay-Autoritaet;
- V5-INV-025 – Build-Provenienz;
- V5-INV-035/041 – aktueller Wissensstand und Driftbewertung;
- V5-INV-103 – Capability Disable/Rollback;
- V5-INV-106 – azyklische Layer-/Dependency-Grenzen.

## Migration

Der bisherige direkte `main`-Push wird durch den dedizierten Knowledge-Branch ersetzt. Bereits gespeicherte Wissensdaten und P0/R2-Vertraege werden nicht umgeschrieben. Die Windows Bridge behaelt ihre enge Wissenspfad-Allowlist.

## Rollback

Bei Fehlern im neuen Knowledge-PR-Pfad wird der Wissenswaechter fail-closed gestoppt bzw. der automatische Push deaktiviert. Ein Rollback darf **nicht** zum direkten Push auf `main` zurueckkehren. R3-Grundlagenartefakte koennen entfernt werden, ohne Gameplay-Zustand zu migrieren, da sie keine Gameplay-Authority besitzen.
