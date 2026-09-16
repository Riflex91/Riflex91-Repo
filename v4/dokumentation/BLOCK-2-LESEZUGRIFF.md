# Block 2 – Adventure-Land-Lesezugriff und Spielzustand

## Ziel

Block 2 beobachtet Adventure Land ohne aktive Spielaktion. Alle weiteren V4-Funktionen sollen spaeter auf dem normalisierten `Spielzustand` arbeiten und nicht direkt auf globale Adventure-Land-Objekte zugreifen.

## Datenweg

`Adventure Land -> AdventureLandLesezugriff -> AdventureLandRohdaten -> SpielzustandErstellung -> Spielzustand`

Nur `AdventureLandLesezugriff` kennt die globalen Adventure-Land-Felder:

- `character`
- `entities`
- `party`
- `G`
- `server_region`
- `server_identifier`

Aktionsfunktionen wie Angriff, Bewegung, Fertigkeiten, Handel, Bank oder Inventarveraenderungen gehoeren nicht zur Leseschnittstelle.

## Wissensarten

Der Spielzustand trennt drei Bereiche:

- `beobachtet`: Werte, die aus Adventure Land gelesen wurden
- `abgeleitet`: Werte, die reproduzierbar aus Beobachtungen berechnet wurden
- `gelernt`: spaetere Lernergebnisse; in Block 2 bleibt dieser Bereich leer

Jeder Wissenswert besitzt einen ausdruecklichen Zustand:

- `bekannt`: ein Wert wurde tatsaechlich beobachtet oder sicher abgeleitet
- `fehlend`: Adventure Land hat den erwarteten Beobachtungswert nicht geliefert
- `unbekannt`: ein Wert war vorhanden, konnte aber nicht sicher interpretiert werden, oder eine Ableitung war nicht moeglich

Wichtig: Ein beobachtetes `null` ist ein bekannter Wert und wird nicht mit `fehlend` gleichgesetzt.

## Normalisierte Inhalte

Der Spielzustand enthaelt unter anderem:

- Serverregion und Serverkennung
- Charakterwerte und Ausruestung
- Inventar mit festen Platznummern
- Gruppe
- sichtbare Monster
- sichtbare Spieler
- sichtbare NPCs
- sonstige oder unbekannte Entities
- aktuelle Karte und kompakte statische Kartenzahlen
- abgeleitete Lebens- und Manaanteile
- abgeleitete Inventarbelegung und sichtbare Monsteranzahl

Entity- und Gruppenlisten werden stabil sortiert. Zeit, Laufnummer und Ablaufkennung werden von aussen uebergeben; die Zustandserstellung verwendet weder aktuelle Uhrzeit noch Zufall.

## Unveraenderlichkeit

Fertige Spielzustaende werden rekursiv eingefroren. Nach der Erstellung darf kein Teil des Zustands veraendert werden.

## Aufzeichnung

`SpielzustandAufzeichnung` speichert eine streng aufsteigende Folge von Spielzustaenden. Die Daten koennen als JSON serialisiert und ohne laufendes Adventure Land wieder geladen werden.

Versionen:

- `Spielzustand.schemaVersion = 2`
- `SpielzustandAufzeichnung.schemaVersion = 1`

Die zugehoerigen JSON-Schemata liegen unter:

- `v4/schemata/spielzustand.schema.json`
- `v4/schemata/spielzustand-aufzeichnung.schema.json`

Die Wiederholungsmaschine selbst ist nicht Bestandteil von Block 2 und folgt in Block 5.

## Automatische Abschlusspruefungen

`npm run pruefen` deckt fuer Block 2 unter anderem ab:

- gleiche Eingangsdaten ergeben gleiche Zustaende
- unterschiedliche Entity-Einfuegereihenfolge wird normalisiert
- fehlende Felder werden nicht erfunden
- explizites `null` bleibt von `fehlend` unterscheidbar
- ungueltige Werte werden `unbekannt`
- beobachtetes, abgeleitetes und gelerntes Wissen bleibt getrennt
- Spielzustaende sind tief eingefroren
- Einzelzustaende koennen offline geladen werden
- Zustandsaufzeichnungen koennen offline geladen werden
- doppelte oder rueckwaerts laufende Zustandsnummern werden abgelehnt
- die Adventure-Land-Leseschnittstelle ruft keine Aktionsfunktion auf

## Live-Beobachtungstest

Voraussetzung: Die V4-Testkonsole aus `v4/werkzeuge/adventure-land-testkonsole.js` laeuft im Adventure-Land-Fenster.

Danach `v4/werkzeuge/block2-beobachtung.js` ebenfalls im Adventure-Land-Codekontext starten.

Der Helfer stellt bereit:

```js
V4Block2Beobachtung.starte()
V4Block2Beobachtung.bericht()
V4Block2Beobachtung.stoppe()
```

Der Standardlauf liest alle 10 Sekunden fuer drei Stunden ausschliesslich `V4Testkonsole.block2Rohdaten()`. Alle fuenf Minuten erscheint ein kompakter Zwischenbericht in der Testkonsole. Es werden keine Spielaktionen aufgerufen und keine unbegrenzte Snapshot-Liste im Speicher gehalten.

Ein Abschlussbericht enthaelt:

- Anzahl erfolgreicher Proben
- Anzahl Lesefehler
- groesste beobachtete Entity- und Monsteranzahl
- groesste Rohdatenprobe in Zeichen
- letzten Probezeitpunkt
- maximal 50 letzte Fehler

Fuer den Blockabschluss gilt der Live-Test als bestanden, wenn der Beobachter ueber mehrere Stunden ohne aktive V4-Spielaktion laeuft und keine ungefangenen Lesefehler erzeugt.
