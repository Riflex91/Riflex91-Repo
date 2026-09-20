# V5 Ingame-Test-GUI

Status: **verbindlicher Standard fuer manuelle Adventure-Land-Tests ab R12.**

## Ziel

Der Benutzer soll fuer manuelle V5-Live-Tests nur noch **ein Codepaket im Adventure-Land-Codefenster ausfuehren** muessen.

Danach erfolgt die Bedienung ueber eine sichtbare GUI:

1. Testschritt per Button starten.
2. Status `BESTANDEN`, `BLOCKIERT`, `WARNUNG` oder `FEHLER` sehen.
3. Ergebnis als strukturiertes JSON lesen.
4. Mit **Ergebnis kopieren** nur das aktuelle JSON kopieren.
5. Mit **Gesamtbericht kopieren** Ergebnis plus zeitgestempeltes Protokoll kopieren.
6. Den kopierten Bericht unveraendert an ChatGPT senden.

PowerShell, DevTools-Abschriften und manuelles Log-Zusammensuchen sind fuer normale manuelle Testabnahmen nicht mehr der Benutzer-Workflow.

## Architektur

Die generische GUI liegt in:

`v5/werkzeuge/v5-adventure-land-test-gui.js`

Sie besitzt selbst **keine Adventure-Land-Spielaktion**.

Ein konkreter Test registriert ausschliesslich seine eigenen Schritte und Regeln. Aktuell:

`v5/werkzeuge/r12-controlled-live-test-gui.js`

Das einteilige Paste-Paket ist:

`v5/werkzeuge/r12-controlled-live-test-paket.js`

Es ist source-locked aus GUI + R12-Controller erzeugt.

## R12 Bedienung

Nach Einfuegen des Pakets erscheinen:

- **1 · Alte Runtime stoppen**
- **2 · Passive Vorprüfung**
- **3 · ONE-SHOT equip**
- **Testjournal anzeigen**
- **Ergebnis kopieren**
- **Gesamtbericht kopieren**

Der One-Shot verlangt exakt:

`R12-EQUIP-ONCE`

## R12 Safety

Der R12-Controller:

- stoppt/erkennt parallele V3/V4-Gameplay-Runtime;
- verlangt einen ruhenden, lebenden Charakter ohne Ziel/Aggro;
- waehlt nur eindeutige Nicht-Waffen-Slots wie Cape, Belt, Amulet, Orb, Helmet, Gloves, Shoes, Pants oder Chest;
- verwendet keine Weapons, Rings oder Earrings;
- revalidiert den Kandidaten direkt vor dem Send;
- schreibt vorher ein kleines bounded Browser-Testjournal;
- blockiert bei offenem/unklarem vorherigem Versuch;
- fuehrt hoechstens **einen** direkten `equip`-Send aus;
- fuehrt **keinen Same-Intent-Retry** aus;
- bestaetigt Erfolg nur ueber Postcondition-Evidence;
- markiert unklare Ergebnisse als `UNGEKLAERT` und verlangt Berichtsauswertung;
- oeffnet keine breite Runtime.

Das Browser-Testjournal ist ein **manueller Test-Witness**, keine Produktionspersistenz. Produktions-/Runtime-Durability bleibt separat durch die V5-Persistenzarchitektur geregelt.

## Standard fuer kommende Tests

Neue manuelle V5-Tests sollen:

1. `V5TestGui` verwenden;
2. alle Aktionen als klar benannte Buttons registrieren;
3. aktive/mutierende Schritte explizit bestaetigen lassen;
4. vor jedem mutierenden Schritt frische Preconditions pruefen;
5. nach moeglichem Send keinen Blind-Retry erlauben;
6. ein maschinenlesbares Ergebnisobjekt erzeugen;
7. ein kopierbares Gesamtprotokoll liefern;
8. keine generische Remote-Command- oder Gameplay-Bridge voraussetzen.

## CI

`npm run r12:test-gui:pruefen`

prueft Syntax, Copy-Vertrag, Source-Lock, One-Shot-Grenze, verbotene Gameplay-Aktionen, Journal-Sperre und Pflichtfelder des kopierbaren Berichts.
