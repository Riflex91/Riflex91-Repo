# V4 Architektur

## Datenfluss

`Adventure Land -> Spielzustand -> Planung -> AktionsAnfrage -> AktionsAuswahl -> Sicherheit -> RessourcenVergabe -> Ausfuehrung -> Ergebnis -> Ereignisse -> Lernen`

Keine Ebene darf eine darunterliegende Sicherheitsstufe umgehen.

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

V4 verwaltet keine Adventure-Land-Anmeldedaten. Die Laufzeit arbeitet innerhalb einer bereits bestehenden Adventure-Land-Sitzung.

## Plattform

`plattform/` laeuft ausserhalb von Adventure Land.

- `schnittstelle/` – HTTPS-Zugriff
- `web-oberflaeche/` – Bedienung und Analyse
- `archiv-abgleich/` – serverseitiger SFTP-Abgleich
- `entwicklungsdienst/` – spaetere Auswertung der Entwicklungswarteschlange

## Gruppensteuerung

Mehrere eigene Charaktere koennen ihren Zustand in eine gemeinsame Gruppensicht melden. Die Gruppensteuerung verteilt Ziele und Aufgaben. Jede einzelne Laufzeit behaelt ihre lokale Sicherheitsentscheidung.

Dadurch gilt auch bei einem Plattformausfall:

- kein Charakter verliert seine lokale Notfalllogik
- keine Laufzeit wartet endlos auf einen anderen Charakter
- veraltete Gruppeninformationen werden nach Ablauf verworfen
- ein fehlender Heiler, Tank oder Haendler wird als nicht verfuegbar behandelt

## Wichtigste Invarianten

- Nur die Ausfuehrung darf das Spiel aktiv veraendern.
- Eine Ressource hat gleichzeitig hoechstens einen Besitzer.
- Mehrere benoetigte Ressourcen werden gemeinsam oder gar nicht vergeben.
- Notfall- und Sicherheitsarbeit hat festen Vorrang.
- Unbekanntes Wissen bleibt unbekannt; es wird nicht stillschweigend geraten.
- Menschliche Fehlermeldungen muessen ohne Quellcodekenntnis verstaendlich sein.
- SFTP-Zugangsdaten existieren nur serverseitig.
- V4 speichert oder verarbeitet keine Adventure-Land-Kennwoerter.
