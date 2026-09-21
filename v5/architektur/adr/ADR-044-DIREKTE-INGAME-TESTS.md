# ADR-044 – Direkte Ingame-Tests als primaerer V5-Funktionsnachweis

**Status:** RATIFIZIERT  
**Stand:** 2026-09-21

## Kontext

Die historische V5-CI startet fuer kleine Aenderungen zahlreiche R3-R19-Workflows. Viele dieser Phasen wiederholen Typecheck, Build, Grundlagentests und statische Guards. Das erzeugt lange Laufzeiten, obwohl die entscheidende Frage in der aktuellen Produktivierungsphase ist, ob der JavaScript-Code im echten Adventure-Land-Kontext korrekt arbeitet.

## Entscheidung

Funktionale V5-Freigaben basieren primaer auf source-locked direkten Ingame-Tests ueber Loopback-CDP. Die automatischen R3-R19-Push-/PR-Trigger werden entfernt. Die bisherigen Offline-Pruefungen bleiben nur als manuelle Diagnose ueber `workflow_dispatch` erhalten.

Ein Offline-Test darf keine reale Capability als bestanden klassifizieren. Mutationsevidence muss aus einem realen Browserlauf stammen und die vorhandenen One-Shot-, Settlement-, Recovery- und No-Retry-Grenzen einhalten.

## Alternativen

Die vollstaendige R3-R19-Matrix bei jedem PR beizubehalten wurde verworfen, weil sie viel redundante Offline-Arbeit wiederholt und keinen realen Browserzustand beweist.

Nur Unit-Tests zu behalten wurde verworfen, weil sie echte Adventure-Land-Session-, Server-, Bank-, Inventory- und Transportzustaende nicht nachweisen.

Alle Sicherheitspruefungen zu entfernen wurde verworfen. Die Runtime-Grenzen bleiben unveraendert und werden stattdessen im realen Testpfad beobachtet.

## Konsequenzen

Entwicklungs-PRs werden deutlich schneller. Reale Funktionsfehler werden frueher im tatsaechlichen Spielkontext sichtbar.

Direkte Tests benoetigen einen lokal laufenden Adventure-Land-Browser mit CDP. GitHub Actions koennen diese Freigabe daher nicht selbst erzeugen.

## Invarianten

- Loopback-CDP only.
- Source-SHA-Bindung fuer direkte Tests.
- Keine breite Gameplay-Authority durch den Testmechanismus.
- Mutierende Tests bleiben explizite One-Shots.
- Same-Intent-Retry nach moeglichem Send bleibt verboten.
- BLOCKIERT oder UNBEKANNT ist niemals BESTANDEN.
- Offline-Diagnostik ersetzt keine reale Ingame-Evidence.

- Pro Funktion maximal zwei echte Funktions-Tests; nach einem fehlgeschlagenen Test zuerst lokalisieren und beheben, bevor irgendein anderes Thema begonnen wird.
- Read-only Reconcile/Diagnose ohne Gameplay-Write zaehlt nicht als Funktions-Test.

## Migration

R3-R19-Workflows werden auf `workflow_dispatch` umgestellt. Bestehende reale Evidence bleibt gueltig. Neue Funktionsaenderungen erhalten einen passenden direkten Runner oder verwenden einen bestehenden production/shadow/preflight Runner.

## Rollback

Falls ein Fehler nur offline reproduzierbar ist, koennen die manuellen Diagnoseworkflows jederzeit gestartet werden. Eine Rueckkehr zu automatischer Vollmatrix erfordert eine neue explizite Testpolitik; sie wird nicht implizit durch einzelne Fehler aktiviert.
