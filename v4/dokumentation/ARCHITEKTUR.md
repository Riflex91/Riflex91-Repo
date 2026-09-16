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
- `lernen/` – spaetere Experimente und Lernergebnisse
- `spiellogik/` – Farmer, Gruppe, Merchant und weitere Spielfunktionen

## Plattform

`plattform/` laeuft ausserhalb von Adventure Land.

- `schnittstelle/` – HTTPS-Zugriff
- `web-oberflaeche/` – Bedienung und Analyse
- `archiv-abgleich/` – serverseitiger SFTP-Abgleich
- `entwicklungsdienst/` – spaetere Auswertung der Entwicklungswarteschlange

## Wichtigste Invarianten

- Nur die Ausfuehrung darf das Spiel aktiv veraendern.
- Eine Ressource hat gleichzeitig hoechstens einen Besitzer.
- Mehrere benoetigte Ressourcen werden gemeinsam oder gar nicht vergeben.
- Notfall- und Sicherheitsarbeit hat festen Vorrang.
- Unbekanntes Wissen bleibt unbekannt; es wird nicht stillschweigend geraten.
- Menschliche Fehlermeldungen muessen ohne Quellcodekenntnis verstaendlich sein.
- SFTP-Zugangsdaten existieren nur serverseitig.
