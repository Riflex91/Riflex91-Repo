# ADR-015 – V5 Ingame-Test-GUI als Standard für manuelle Live-Abnahmen

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

Manuelle Adventure-Land-Live-Tests sollen reproduzierbar sein und den Benutzer nicht dazu zwingen, PowerShell-Ausgaben, Browser-DevTools oder interne Logs manuell zusammenzusuchen. V4 hatte bereits eine Test-GUI; V5 benötigt denselben Bedienkomfort mit strengeren Safety-Grenzen.

## Entscheidung

1. Alle manuellen V5-Live-Abnahmen verwenden grundsätzlich `V5TestGui`.
2. Der Benutzer soll für normale manuelle Tests nur ein pastebares Codepaket im Adventure-Land-Codefenster ausführen müssen.
3. Die generische GUI besitzt selbst keine Gameplay-Aktion.
4. Fachliche Tests registrieren klar benannte Buttons und liefern maschinenlesbare Ergebnisse.
5. Mutierende Schritte verlangen eine explizite Bestätigung und frische Preconditions.
6. Nach möglichem Send ist ein Same-Intent-Blind-Retry verboten.
7. Jeder Test liefert:
   - sichtbaren Status;
   - strukturiertes Ergebnis;
   - Zeitstempel-Protokoll;
   - **Ergebnis kopieren**;
   - **Gesamtbericht kopieren**.
8. Unklare Resultate werden als `UNGEKLAERT`/blockiert sichtbar und dürfen nicht automatisch erneut ausgeführt werden.
9. Ein Test-Controller darf nur die für seinen Test ausdrücklich ratifizierten Gameplay-Aktionen enthalten.
10. CI prüft Syntax, Source-Lock, Copy-Vertrag und Action-Grenzen.
11. Externe Produktions-Durability, GitHub-CI und andere nicht im Spiel beweisbare Nachweise bleiben automatisch/extern; die GUI darf diese nicht vortäuschen.
12. Für R12 ist das einteilige Paket `r12-controlled-live-test-paket.js` der kanonische manuelle Einstieg.

## Konsequenzen

- Der Benutzer kann Testergebnisse per Knopfdruck kopieren und an ChatGPT senden.
- Kommende manuelle Tests können denselben GUI-Unterbau wiederverwenden.
- Die UI wird nicht zu einem generischen Gameplay-Command-Center.
- Safety-Grenzen bleiben test-spezifisch und CI-prüfbar.

## Nachweise

- `v5/werkzeuge/v5-adventure-land-test-gui.js`
- `v5/werkzeuge/r12-controlled-live-test-gui.js`
- `v5/werkzeuge/r12-controlled-live-test-paket.js`
- `v5/werkzeuge/r12-test-gui-paket-bauen.mjs`
- `v5/werkzeuge/tests/r12-test-gui.test.mjs`
- `v5/werkzeuge/V5-TEST-GUI.md`
