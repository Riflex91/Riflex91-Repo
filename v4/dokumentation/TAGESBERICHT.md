# Automatischer 24-Stunden-Bericht

## Ziel

V4 erstellt einmal pro Tag automatisch einen Bericht ueber die vergangenen exakt 24 Stunden. Der Bericht wird in der Web-Oberflaeche gespeichert und kann zusaetzlich per E-Mail versendet werden.

Der Bericht wird nicht aus Konsolentexten erzeugt. Er verwendet strukturierte Telemetrie-, Vorfall-, Leistungs- und Entwicklungsdaten.

## Zeitraum

Der Versand erfolgt zu einer konfigurierbaren lokalen Uhrzeit. Der ausgewertete Zeitraum umfasst immer exakt die letzten 24 Stunden vor dem festgelegten Berichtsende.

Ein Neustart des Bots, Browsers oder Servers darf den Zeitraum nicht zuruecksetzen. Bereits uebertragene Daten bleiben Teil des Berichts.

## Inhalt

Jeder Bericht enthaelt mindestens:

- kurze Zusammenfassung
- gesamte beobachtete Laufzeit
- Verbindungsabbrueche, Neustarts und ungefangene Fehler
- automatisch behobene Probleme
- Werte pro Charakter
- Erfahrung und Gold im Zeitraum
- Erfahrung und Gold pro Stunde
- Tode und Rueckzuege
- wichtige Vorfaelle mit Anzahl und betroffenen Charakteren
- Kennzeichnung, ob ein Vorfall automatisch behoben wurde
- Kennzeichnung, ob der Nutzer handeln muss
- Entwicklungsstatus mit neuen, bekannten und unbekannten Vorfaellen
- Zahl offline reproduzierbarer Vorfaelle
- offene Entwicklungsaufgaben
- Vergleich mit den vorherigen 24 Stunden

Spaetere Spielfunktionen duerfen eigene fachliche Werte ergaenzen, zum Beispiel Heilungen, Haendlerdienste, Bankvorgaenge, Aufwertungen oder Gruppenrettungen.

## Nutzerhandlung

Ganz oben muss eindeutig stehen, ob der Nutzer handeln muss.

Wenn keine Handlung notwendig ist, lautet die Aussage sinngemaess:

```text
Nutzer muss handeln: NEIN
Was soll ich tun: Nichts. Der Bot arbeitet normal weiter.
```

Wenn eine Handlung notwendig ist, muss der Bericht den konkreten Grund und die erwartete Nutzeraktion nennen.

## Vergleich

Der Bericht vergleicht wichtige Kennzahlen mit den unmittelbar vorherigen 24 Stunden. Beispiele:

- Erfahrung pro Stunde
- Gold pro Stunde
- Tode
- Stillstaende
- Gruppen-Leerlauf
- Haendler-Erfolgsrate

Eine Veraenderung wird nur berechnet, wenn beide Zeitraeume ausreichend Daten enthalten. Fehlende Daten werden als fehlend gekennzeichnet und niemals als Null erfunden.

## Versand

Vorgesehene Versandarten:

- `web_oberflaeche`
- `email`

Der Bericht wird serverseitig erstellt und versendet. Adventure Land versendet niemals selbst E-Mails.

E-Mail-Zugangsdaten und Versandschluessel befinden sich ausschliesslich auf der Server-Seite und duerfen niemals in Adventure Land, Telemetrie, Wiederholungen oder Browser-Code gelangen.

## Doppelte Berichte verhindern

Fuer jeden Berichtszeitraum existiert eine eindeutige `berichtKennung`. Derselbe Zeitraum darf durch Neustarts oder wiederholte Zeitgeberausloesung nicht mehrfach versendet werden.

Ein manueller Aufruf `Bericht jetzt erstellen` darf einen zusaetzlichen Bericht erzeugen, muss aber ausdruecklich als manuell erzeugt gekennzeichnet werden, sobald die konkrete Implementierung gebaut wird.

## Fehlerverhalten

Kann ein Bericht nicht versendet werden, bleiben Bericht und Versandstatus serverseitig erhalten. Ein Versandfehler darf die Adventure-Land-Laufzeit nicht beeinflussen.

Nach einem voruebergehenden E-Mail- oder Serverfehler darf der Versand spaeter erneut versucht werden, ohne den Bericht doppelt zu erzeugen.

## Entwicklungsreihenfolge

- Block 4 sammelt die notwendigen strukturierten Telemetrie- und Vorfalldaten.
- Bloecke 6 bis 11 ergaenzen fachliche Leistungswerte.
- Block 12 baut Erstellung, Vergleich, Web-Ansicht, Zeitsteuerung und E-Mail-Versand.

Der Tagesbericht ist damit kein eigener Kleinst-Entwicklungsblock, sondern Teil der bereits geplanten Plattformarbeit.
