# V4 Architektur

## Datenfluss

`Adventure Land -> Spielzustand -> Planung -> AktionsAnfrage -> AktionsAuswahl -> Sicherheit -> RessourcenVergabe -> Ausfuehrung -> Ergebnis -> Ereignisse -> Lernen`

Keine Ebene darf eine darunterliegende Sicherheitsstufe umgehen.

## Konto-, Charakter- und Verbundmodell

V4 behandelt Konto, Charakter und Verbund als drei getrennte Ebenen:

`Installation -> Konto -> Charakter -> Laufzeit`

Ein `Verbund` kann mehrere Charaktere aus einem oder mehreren Konten enthalten.

Wichtige Regeln:

- jeder Charakter gehoert genau zu einem Konto
- Bank und Konto-Bestand sind immer kontogebunden
- ein Verbund teilt Ziele und Aufgaben, aber keinen erfundenen gemeinsamen Besitz
- jede Laufzeit kennt nur eine nicht geheime `kontoKennung`, niemals das Kontokennwort
- kontouebergreifende Uebergaben benoetigen eine nachvollziehbare Bestaetigung beider Seiten
- faellt ein Konto aus, bleiben andere Konten unabhaengig lauffaehig
- die Verbundsteuerung darf keinen Charakterstart erlauben, der gegen das aktuelle Regelprofil verstoesst

Die Details stehen in `KONTEN_UND_CHARAKTERE.md`.

## Laufzeit

`laufzeit/quelle/` enthaelt ausschliesslich Code, der fuer die Bot-Laufzeit bestimmt ist.

- `vertraege/` – gemeinsame Datentypen
- `kern/` – zentrale Ereignis-, Aktions- und Ressourcensteuerung
- `spiel/` – spaetere Adventure-Land-Schnittstelle
- `welt/` – Wissen und Spielzustand
- `planung/` – Auswahl sinnvoller Ziele und Arbeit
- `sicherheit/` – unverhandelbare Schutzregeln
- `ausfuehrung/` – einzige Stelle fuer echte Adventure-Land-Aktionen
- `telemetrie/` – strukturierte Laufzeitdaten
- `wiederholung/` – Aufzeichnung und Offline-Wiederholung
- `lernen/` – spaetere Versuche und Lernergebnisse
- `spiellogik/` – Farmer, Gruppe, Haendler und weitere Spielfunktionen

## Plattform

`plattform/` laeuft ausserhalb von Adventure Land.

- `schnittstelle/` – HTTPS-Zugriff
- `web-oberflaeche/` – Bedienung, Kontoprofile und Analyse
- `archiv-abgleich/` – serverseitiger SFTP-Abgleich
- `entwicklungsdienst/` – spaetere Auswertung der Entwicklungswarteschlange

Die Plattform verwaltet spaeter die Kontoprofile und den Zustand isolierter Anmeldesitzungen. Geheime Anmeldedaten gehoeren nicht in die Bot-Laufzeit. Fuer unbeaufsichtigte Neuanmeldungen wird spaeter ein eigener serverseitiger Geheimnisspeicher benoetigt; bis dahin erfolgt eine notwendige erneute Anmeldung manuell.

## Verbundsteuerung

Alle aktiven Charaktere melden ihren Zustand an eine gemeinsame Verbundsicht. Die Verbundsteuerung verteilt nur Ziele und Aufgaben. Jede einzelne Laufzeit behaelt ihre lokale Sicherheitsentscheidung.

Dadurch gilt auch bei einem Plattformausfall:

- kein Charakter verliert seine lokale Notfalllogik
- keine Laufzeit wartet endlos auf einen anderen Charakter
- veraltete Verbundinformationen werden nach Ablauf verworfen
- ein fehlender Heiler, Tank oder Haendler wird als nicht verfuegbar behandelt

## Wichtigste Invarianten

- Nur die Ausfuehrung darf das Spiel aktiv veraendern.
- Eine Ressource hat gleichzeitig hoechstens einen Besitzer.
- Mehrere benoetigte Ressourcen werden gemeinsam oder gar nicht vergeben.
- Notfall- und Sicherheitsarbeit hat festen Vorrang.
- Unbekanntes Wissen bleibt unbekannt; es wird nicht stillschweigend geraten.
- Menschliche Fehlermeldungen muessen ohne Quellcodekenntnis verstaendlich sein.
- SFTP-Zugangsdaten existieren nur serverseitig.
- Adventure-Land-Kennwoerter existieren niemals in der Bot-Laufzeit, Telemetrie oder Wiederholung.
- Ein Charakter darf nie versehentlich dem falschen Konto zugeordnet werden.
- Bank, Inventar und Besitz werden nicht kontouebergreifend zusammengelegt.
- Charaktergrenzen und Spielregeln werden nicht umgangen.
