# Block 7 – Abschlussnachweis

Status: **abgeschlossen am 17. September 2026**.

Block 7 gilt als technisch abgeschlossen, weil alle vorgesehenen Nachweisarten gemeinsam bestanden wurden. Kein einzelner Test ersetzt dabei die anderen.

## Nachweise

### 1. 10-Minuten-Schattenlauf

Der abschliessende read-only Schattenlauf lief 600018 ms und lieferte exakt 601 von 601 erwarteten Schritten.

- Sampling-Abdeckung: 100 %
- maximale Tick-Luecke: 1016 ms bei erlaubten 5000 ms
- verpasste Intervalle: 0
- lange Tick-Luecken: 0
- Fehler: 0
- Stillstaende: 0
- verlorene Ereignisse: 0
- echte Spielaktionen: 0
- `performance_trick()` erfolgreich aktiviert

Die Farmplanung erzeugte 592 geplante Angriffe, 5 Loot-Entscheidungen und 4 Bewegungsentscheidungen.

### 2. Reale Angriffsbereitschaft

Nach Korrektur der anfangs falschen Annahme `ms_to_next_skill` wurde die reale Adventure-Land-Cooldown-Semantik ueber `is_on_cooldown`, `next_skill` und den konservativen `can_use`-Fallback angebunden.

Im abschliessenden Schattenlauf wurde die Angriffsbereitschaft in allen 601 Schritten als `bereit` erkannt. Es gab keine unbekannten Bereitschaftszustaende und keine Bereitschaftsfehler.

### 3. Integrierte Produktionscode-Abnahmesuite

`laufzeit/tests/block7-abnahme.test.mjs` prueft gemeinsam gegen die echten V4-Produktionsklassen:

- kritische HP unter Beschuss -> `KAMPF_RUECKZUG`
- Notfall-Rueckzug verdraengt laufende normale Farmbewegung ueber `AktionsSteuerung`
- freigegebener Rueckzug fuehrt genau eine Sicherheitsbewegung aus
- zu kleiner Abstand -> `KAMPF_ABSTAND_HERSTELLEN`
- niedriges Mana -> Rueckzug
- fehlendes Mana -> fail-safe Blockierung
- gestartete Sicherheitsbewegung ohne Fortschritt -> blockiert
- Ziel ausserhalb Reichweite -> Abbruch unmittelbar vor `attack(...)`, ohne Angriff
- aktive Sicherheitsbewegung bleibt standardmaessig gesperrt

Diese Suite bestand in `v4-ci` und `v4-grundlage-pruefen` auf dem fuer PR #235 gemergten Head.

### 4. Kontrollierter Adventure-Land-Live-Smoke-Test

Der one-shot Live-Test wurde mit einem sichtbaren angreifenden `goo` ausgefuehrt.

Ergebnis:

- Art: `abstand`
- Status: `bestanden`
- angeforderte Distanz: 8
- beobachtete Bewegung: 8.000000000000016
- `bewegungBeobachtet: true`
- echte Spielaktionen `move`: 1
- sonstige echte Spielaktionen: 0
- `automatischWiederGesperrt: true`

Startposition:

```text
[-159.45629894664802, 772.5426842690484]
```

Ziel- und beobachtete Endposition:

```text
[-153.07871021690252, 777.372421528385]
```

Der einzige Angreifer war ein `goo`; die geplante und beobachtete Bewegung fuehrte vom Angreifer weg.

## Erfuellte Block-7-Abnahmekriterien

- absichtlich erzeugte Gefahrensituationen werden sicher behandelt
- keine normale Aktion blockiert einen Rueckzug
- Fehler-Einspritzung fuer niedrige Lebenspunkte, niedriges und fehlendes Mana, falsche Reichweite und blockierte Bewegung bestanden
- Angriffsbereitschaft wird aus der realen Adventure-Land-Cooldown-Semantik beobachtet
- Safety-vor-Farm-Reihenfolge ist abgesichert
- Reichweite wird unmittelbar vor einer aktiven Attacke erneut geprueft
- aktive Sicherheitsbewegung ist standardmaessig gesperrt und nur eng begrenzt freigebbar
- echter Spielclient-Nachweis fuer genau eine kontrollierte Sicherheitsbewegung bestanden

## Abgrenzung

Der bestandene 10-Minuten-Block-7-Schattenlauf ersetzt nicht die allgemeinen spaeteren 24-Stunden-, 72-Stunden- oder 7-Tage-Freigabekampagnen der gesamten V4. Diese bleiben als uebergeordnete Systemtests bestehen.

## Naechster Entwicklungsblock

Der naechste Entwicklungsblock ist **Block 8 – Gruppenkoordination**.
