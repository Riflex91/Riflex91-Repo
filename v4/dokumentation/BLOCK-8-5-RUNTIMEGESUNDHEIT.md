# Block 8.5 – RuntimeGesundheit und RecoveryZustand

Status: **8.5.3 implementiert als deterministische read-only Bewertung; keine automatische Recovery- oder Neustartautoritaet**.

## Ziel

V4 braucht fuer 24/7-Betrieb einen einheitlichen Gesundheitszustand, der nicht nur beantwortet, ob JavaScript noch laeuft, sondern ob die Laufzeit fachlich noch frisch und handlungsfaehig ist.

Bewertet werden getrennt:

- Snapshot-Freshness,
- Heartbeat-Freshness,
- fachlicher Fortschritt,
- Gruppen-Liveness,
- Safety,
- offene und abgebrochene Arbeit,
- kritische Laufzeitfehler.

## Recovery-Stufen

Der Vertrag kennt genau:

- `normal`
- `beobachten`
- `sicher_pausiert`
- `neustart_empfohlen`
- `blockiert`

Diese Stufen sind **Bewertung und Empfehlung**, keine versteckte Aktionsautoritaet.

## Keine automatische Neustartautoritaet

Der Zustand enthaelt absichtlich:

- `hostNeustartEmpfohlen`
- `automatischerNeustart: false`

Auch bei `neustart_empfohlen` wird kein Prozess, Browser, Tab oder Host durch die Adventure-Land-Laufzeit neu gestartet.

Ein spaeterer externer Supervisor kann die read-only Empfehlung auswerten. Die Neustartautoritaet bleibt ausserhalb der Spiellaufzeit.

## Freshness

Fuer erwartete Daten wird das Alter aus explizit uebergebenen Zeitpunkten berechnet.

Ist ein erwarteter Wert noch nie beobachtet worden, altert er ab `laufzeitGestartetAm`.

Nicht erwartete Aktivitaet erzeugt keinen falschen Stillstand. Beispiel: Wenn aktuell kein fachlicher Fortschritt erwartet wird, bleibt ein fehlender Fortschrittszeitpunkt ohne Einfluss.

Zukunftszeitpunkte, Zeitpunkte vor Laufzeitstart oder andere unplausible Zeitwerte werden nicht geraten. Die Bewertung wechselt fail-safe auf `blockiert`.

## Konfigurierbare Stufen

Die reine Bewertungslogik besitzt drei streng aufsteigende Zeitgrenzen:

- Beobachtungsgrenze,
- sichere-Pause-Grenze,
- Neustart-Empfehlungsgrenze.

Die Standardwerte sind Diagnosevorgaben dieser Instrumentierung und **keine Aenderung** der Block-8-Produktions-TTL oder des 2-Sekunden-Produktionsheartbeats.

Die Schwellen muessen positiv und streng aufsteigend sein.

## Gruppen-Liveness

Gruppen-Liveness wird getrennt von Transportzeit bewertet:

- `gesund` -> keine Eskalation,
- `beobachten` -> Recovery-Stufe mindestens `beobachten`,
- `degradiert` -> `sicher_pausiert`,
- `unbekannt` -> `sicher_pausiert`.

Damit kann ein technisch frischer Heartbeat trotzdem als fachlich problematisch markiert werden, ohne dass Telemetrie selbst Gruppenarbeit ausfuehrt.

## Safety

- `unbekannt` -> fail-safe `blockiert`
- `kritisch` -> mindestens `sicher_pausiert`
- `angespannt` oder `gefaehrlich` -> mindestens `beobachten`
- `sicher` -> keine zusaetzliche Eskalation

Die eigentliche Kampf-/Gruppensicherheitslogik bleibt unveraendert. RuntimeGesundheit beobachtet sie nur.

## Prioritaet

Hoehere Recovery-Stufen haben Vorrang:

1. unplausible Zeit / kritischer Laufzeitfehler / unbekannte Safety -> `blockiert`
2. sehr lange Freshness-/Fortschrittsluecke -> `neustart_empfohlen`
3. lange Luecke, degradierte/unbekannte Gruppen-Liveness oder kritische Safety -> `sicher_pausiert`
4. mittlere Luecke, beobachtete Gruppen-Liveness oder angespannte/gefaehrliche Safety -> `beobachten`
5. sonst -> `normal`

## Sicherheitsgrenze

`bewerteRuntimeGesundheit(...)`:

- ist deterministisch,
- verwendet kein `Date.now()`,
- ruft keine Adventure-Land-Aktion auf,
- pausiert nichts selbst,
- startet nichts neu,
- reicht keine AktionsAnfrage ein,
- veraendert keine Ressourcensperre,
- veraendert keine Gruppenentscheidung.

## Tests

`block8-5-runtime-gesundheit.test.mjs` prueft:

- gesunden Normalzustand,
- stufenweise Eskalation bei fehlendem fachlichem Fortschritt,
- lange Freshness-Luecke -> nur externe Neustartempfehlung,
- fehlenden erwarteten Heartbeat,
- nicht erwarteten Fortschritt ohne falschen Stillstand,
- degradierte und unbekannte Gruppen-Liveness,
- unbekannte Safety und kritischen Laufzeitfehler,
- unplausible Zeitwerte,
- streng aufsteigende Schwellen.

## Naechster Schritt

**8.5.4 – Recovery-Checkpoint v1.**

Der Checkpoint soll nur eindeutig wiederanlaufrelevante Daten speichern und darf keine fluechtige Aktionsautoritaet nach einem Neustart wiederbeleben.
