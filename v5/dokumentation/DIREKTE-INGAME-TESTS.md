# V5 Direkte Ingame-Testpolitik

**Status:** VERBINDLICH  
**Stand:** 2026-09-22

## Grundsatz

Ein V5-Funktionstest gilt nur dann als echter Funktionsnachweis, wenn der zu pruefende JavaScript-Pfad in einem real laufenden Adventure-Land-Browser ausgefuehrt wird und dabei realen Spielzustand beobachtet. Fuer Public-CODE-Funktionen ist der browser-native Adventure-Land-CODE-Runner der bevorzugte Testtreiber; CDP/Node bleibt Diagnose-, Legacy- und Host-Reconcile-Werkzeug.

Node-Unit-Tests, Mocks, statische Guards, Typpruefungen, Strukturpruefungen und historische R3-R19-Matrizen duerfen weiterhin manuell zur Diagnose verwendet werden. Sie koennen jedoch keinen Ingame-Funktionsnachweis ersetzen und blockieren nicht mehr automatisch jeden Entwicklungs-PR.

## Verbindliche Eigenschaften direkter Tests

- Ziel ist ein realer Adventure-Land-Kontext auf `https://adventure.land`.
- Browser-native Testpakete werden direkt im Adventure-Land-CODE-Runner ausgefuehrt und duerfen keine Raw-Socket-Bypaesse enthalten.
- Falls CDP fuer Diagnose, Host-Reconcile oder noch nicht migrierte Runner verwendet wird, bleibt es auf Loopback begrenzt, standardmaessig `http://127.0.0.1:9222/`.
- Der getestete Paket-/Git-Stand wird als `sourceSha` bzw. source-locked Paketstand gebunden.
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

## Bevorzugter browser-nativer Bank-Harness

`werkzeuge/bank-function-test-paket.js` ist der bevorzugte direkte Ingame-Harness fuer `bank_retrieve`, `bank_store` und `bank_swap`. Er aktiviert/verifiziert `performance_trick()`, bietet Shadow/LIVE 1/LIVE 2, persistiert das Testbudget im Browser und zeigt kopierbare Ergebnis-/Diagnoseberichte. Nach moeglichem Send mit unklarem Ergebnis bleibt jeder weitere Live-Button derselben Funktion gesperrt.

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


## Testtaktung und Stop-Regel

- Pro Funktion sind maximal **zwei echte Funktions-Tests** zulaessig.
- Read-only Diagnose-/Reconcile-Laeufe zaehlen nicht als Funktions-Test, solange sie keine Gameplay-Authority und keinen Gameplay-Write erzeugen.
- Sobald ein Funktions-Test `BLOCKIERT`, `NICHT_BESTANDEN`, `UNBEKANNT` oder einen anderen Fehler liefert, wird **nicht** zum naechsten Thema gewechselt.
- Zuerst wird der konkrete Fehler lokalisiert und behoben.
- Danach darf dieselbe Funktion maximal noch einmal als zweiter Funktions-Test ausgefuehrt werden.
- Ein zweiter mutierender Test ist nur zulaessig, wenn Reconcile ausschliesst, dass der vorherige Versuch eine offene Transaktion, offene Lease oder einen nicht geklaerten moeglichen Send hinterlassen hat.
- Blindes Wiederholen eines Same-Intent bleibt verboten.

Fuer den aktuellen Withdraw-Pfad steht dafuer der read-only Diagnosebefehl `npm run ingame:bank-withdraw:reconcile` bereit.


### Post-Send-Reconcile fuer Withdraw

Wenn ein echter Withdraw-Lauf `gameWrites: 1` und `moeglicherSend: true` erreicht, aber Settlement/Recovery nicht bestaetigt werden konnte, ist ein weiterer Write verboten. Zuerst muss `npm run ingame:bank-withdraw:postsend-reconcile` ausgefuehrt werden. Der Runner liest den persistenten INTENT-Prestate, beobachtet einen frischen realen Bank-Snapshot und vergleicht exakt `characterGold +1` / `bankGold -1`. Er erzeugt 0 Gameplay-Writes und zaehlt nicht als Funktions-Test.


### Final-Preflight-Diagnose fuer Withdraw

Wenn ein echter Withdraw-Lauf den Adapter erreicht (`adapterAufrufe: 1`), aber mit `transportArt: NICHT_GESENDET`, `gameWrites: 0` und `moeglicherSend: false` endet, darf kein weiterer Funktionstest gestartet werden. `npm run ingame:bank-withdraw:final-preflight-diagnose` reproduziert die letzten Final-Preflight-Gates read-only gegen den realen Browser und vergleicht den aktuellen stabilen Bank-Snapshot mit dem persistenten INTENT-Prestate. Der Runner ruft niemals `bank_withdraw` auf und zaehlt nicht als Funktionstest.


### Adventure-Land-CODE-Bridge fuer Bank-Withdraw

Der Browser-Page-Kontext muss `bank_withdraw` nicht direkt bereitstellen. Adventure Land laedt die oeffentlichen CODE-Funktionen in den separaten `/runner`-Iframe. V5 bindet den Withdraw-Pfad deshalb an den Page-Kontext mit der offiziellen `call_code_function_f`-Bridge. Ist der CODE-Runner inaktiv, darf der Adapter ihn vor einem moeglichen Send mit dem harmlosen No-op `call_code_function_f('eval','void 0')` bounded starten. Danach werden Account, Character, Session, Server, Merchant, Idle/Queue, Bank-Mount, Gold und alternative Runtime vollstaendig erneut validiert. Erst dann existiert genau ein moeglicher Aufruf `maincode.contentWindow.bank_withdraw(1)`. Raw-Socket-`.emit` bleibt verboten.

`npm run ingame:code-bridge:bootstrap` prueft diesen Mechanismus ohne Gameplay-Write. Der Probe kann den CODE-Runner mit dem No-op starten, ruft aber niemals `bank_withdraw` auf und zaehlt nicht als Funktionstest.
