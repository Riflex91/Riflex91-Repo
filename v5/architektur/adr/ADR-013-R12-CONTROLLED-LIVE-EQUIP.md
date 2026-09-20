# ADR-013 – R12 Controlled Live mit genau einer Equip-Action

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R12 soll nach bestandenem Shadow-Nachweis den ersten minimalen mutierenden Vertical Slice kontrolliert live pruefen. Die V5-Verfassung verlangt fuer die erste mutierende Scheibe geringes Schadenspotenzial, gute Beobachtbarkeit und leichte Ausgleichbarkeit. Bank-, Trade-, Transfer-, Upgrade-, Compound- und Production-Pfade sind fuer den Erstlauf ausgeschlossen.

Der Shadow-End-to-End-Pfad ist auf `main` erfolgreich nachgewiesen und erzeugt null Raw Game Writes. Die aktuelle globale Readiness ist jedoch weiterhin `GESPERRT`. Zusaetzlich zeigt die aktuelle lokale Bridge-Telemetrie zwar einen laufenden Prozess, aber eine degradierte bestehende V3-Runtime mit stale Snapshot, Host-Restart-Empfehlung, vollem Alert-Spool und Quota-Druck im Checkpoint-Pfad.

## Entscheidung

1. Erste Controlled-Live-Action ist ausschliesslich `AL-ACTION-EQUIP` / `equip`.
2. Pro Controlled-Live-Lauf ist exakt eine Action erlaubt.
3. Bank, Trade, Transfer, Upgrade, Compound, Exchange, Craft und andere wert-/accountweite Aktionen bleiben fuer R12 ausgeschlossen.
4. Ein bestandener Shadow-Nachweis mit `unerwarteteGameWrites=0` ist Pflicht.
5. Controlled Live bleibt bei `readiness.status != FREIGEGEBEN` technisch blockiert.
6. Fehlende/stale/degradierte lokale Health-Evidence blockiert Controlled Live.
7. Ein aktiver Recovery-/Reconciliation-Blocker blockiert Controlled Live.
8. Ein voller kritischer Alert-Spool oder nicht belastbare Persistenz-/Checkpoint-Gesundheit blockiert Controlled Live.
9. Die vorhandene Windows Bridge wird nicht zu einem Remote-Gameplay- oder generischen Command-Kanal erweitert.
10. V3/V4-Runtime wird nicht als V5-Live-Nachweis wiederverwendet.
11. Der echte Live-Nachweis muss spaeter `gameWrites=1`, `unerwarteteGameWrites=0`, den exakten V5-Build-/Knowledge-/Config-Fingerprint und die Postcondition-/Restart-Evidence enthalten.
12. Solange diese Bedingungen fehlen, bleibt `V5-ANF-TEST-008` offen und R12 `IN_PROGRESS`.

## Alternativen

- **V3/V4-Live-Pfad als V5-Nachweis verwenden:** verworfen; verletzt die Migrations- und Authority-Grenzen.
- **Bridge um generische Remote-Evaluate/Command-Funktion erweitern:** verworfen; wuerde die Host-/Gameplay-Trust-Boundary brechen.
- **Controlled Live trotz DEGRADED-Health ausfuehren:** verworfen; R11-Health bleibt fail-closed.
- **Bank/Trade/Upgrade als erste Action:** verworfen; zu hohes Schadens-/Recovery-Risiko.
- **Shadow-Erfolg als Ersatz fuer echten Live-Nachweis werten:** verworfen; TEST-008 verlangt Controlled Live.

## Konsequenzen

- R12-Shadow kann formal abgeschlossen werden, ohne den Live-Nachweis zu faelschen.
- Controlled Live startet erst nach sauberer Host-/Runtime-Gesundheit und formaler Runtime-Freigabe.
- Die erste reale Mutation ist auf eine einzige, beobachtbare Equip-Action begrenzt.
- Die Windows Bridge behaelt ihre Rolle als Host/Telemetry/Knowledge-Transport ohne Gameplay-Autoritaet.

## Invarianten

- V5-INV-030 – erster mutierender Slice ist geringriskant und gut beobachtbar.
- V5-ALT-043 – fehlende/degradierte kritische Health ist nicht gesund.
- V5-INV-002 – mehrere unabhaengige Verriegelungen bleiben Pflicht.
- V5-INV-004 / V5-INV-005 – typisierte kurzlebige Freigabe und direkte Revalidierung vor Write.
- V5-ALT-024 – Live-Preconditions unmittelbar vor Mutation frisch pruefen.

## Migration

Der Shadow-Teil bleibt unter `v5/grundlage/**`. Ein echter V5-Raw-Write-Adapter wird erst nach formaler Readiness-Freigabe unter der bereits vorgesehenen Execution-Adapter-Grenze eingefuehrt. Bestehende V3/V4-Runtime wird nicht importiert.

## Rollback

Ein Rollback entfernt nur R12-Shadow-/Preflight-Artefakte. Es existiert noch keine V5-Live-Mutation und keine Gameplay-Zustandsmigration.

## Nachweise

- `v5/grundlage/tests/r12-vertical-slice-shadow.test.mjs`
- `v5/grundlage/quelle/vertical-slice/controlled-live-policy.ts`
- `v5/roadmap/r12-controlled-live-preflight.json`
- `v5/werkzeuge/r12-struktur-pruefen.mjs`
- `ops/windows-bridge/README.md`
