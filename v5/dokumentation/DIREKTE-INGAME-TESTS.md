# V5 Direkte Ingame-Testpolitik

**Status:** VERBINDLICH  
**Stand:** 2026-09-21

## Grundsatz

Ein V5-Funktionstest gilt nur dann als echter Funktionsnachweis, wenn der zu pruefende JavaScript-Pfad gegen einen real laufenden Adventure-Land-Browser ueber den Loopback-CDP-Endpunkt ausgefuehrt wird und dabei realen Spielzustand beobachtet.

Node-Unit-Tests, Mocks, statische Guards, Typpruefungen, Strukturpruefungen und historische R3-R19-Matrizen duerfen weiterhin manuell zur Diagnose verwendet werden. Sie koennen jedoch keinen Ingame-Funktionsnachweis ersetzen und blockieren nicht mehr automatisch jeden Entwicklungs-PR.

## Verbindliche Eigenschaften direkter Tests

- Ziel ist ein realer Adventure-Land-Kontext auf `https://adventure.land`.
- CDP bleibt auf Loopback begrenzt, standardmaessig `http://127.0.0.1:9222/`.
- Der ausgefuehrte Git-Commit wird als `sourceSha` gebunden.
- Read-only-Preflights muessen reale Character-, Session-, Server- und Domaenenzustaende im Spiel lesen.
- Shadow-Laeufe muessen im echten Browser stattfinden, auch wenn sie absichtlich 0 Gameplay-Writes erzeugen.
- Mutierende Tests benoetigen eine eigene explizite One-Shot-Bestaetigung.
- Ein One-Shot darf maximal den fuer den Test ratifizierten Gameplay-Write erzeugen.
- `BLOCKIERT`, `UNBEKANNT`, fehlende Settlement-Evidence oder Bindungsdrift sind kein bestandener Test.
- Nach moeglichem Send bleibt Same-Intent-Retry verboten; zuerst Reobserve/Reconcile.
- Evidence muss mindestens Source-SHA, relevante Bindung, Adapter-/Write-Zaehler, Settlement/Recovery und terminale Lease-/Authority-Zustaende enthalten.

## Regulärer Testpfad

Fuer jede neue Capability wird der kuerzeste reale Pfad verwendet:

1. realer read-only Ingame-Preflight;
2. falls erforderlich realer NO-WRITE-Shadow;
3. explizit bestaetigter One-Shot-Live-Test;
4. reale Funktions-/Soak-Beobachtung, wenn die Capability Dauerverhalten besitzt.

Nicht jede Aenderung muss alle vier Stufen wiederholen. Getestet wird direkt die betroffene Funktion und ihre reale Abhaengigkeitskette.

## Verfuegbare direkte Runner

- `npm run ingame:bank-planen`
- `npm run ingame:equip:preflight`
- `npm run ingame:equip:live`
- `npm run ingame:bank-deposit:shadow`
- `npm run ingame:bank-deposit:preflight`
- `npm run ingame:bank-deposit:live`
- `npm run ingame:bank-withdraw:shadow`
- `npm run ingame:bank-withdraw:preflight`
- `npm run ingame:bank-withdraw:live`

Die konkreten Runner koennen zusaetzliche `--cdp`, `--source-sha` und bei mutierenden Tests `--confirm`-Argumente verlangen.

## GitHub Actions

Die historischen R3-R19-Workflows laufen nicht mehr automatisch bei jedem Push oder Pull Request. Sie bleiben als `workflow_dispatch`-Diagnose erhalten.

GitHub-hosted Runner koennen den lokalen Adventure-Land-Browser nicht erreichen und sind deshalb nicht mehr die Quelle der Wahrheit fuer Gameplay-Funktionalitaet.

## Sicherheitsgrenze

Die Umstellung reduziert Testwiederholungen, nicht die Runtime-Sicherheitslogik. Durable Intent, Capability-/Authority-Grenzen, Fencing, Lease, Settlement, Recovery, No-Blind-Retry und fail-closed Verhalten bleiben Bestandteil des produktiven Codes und muessen im direkten Ingame-Test beobachtbar bleiben.
