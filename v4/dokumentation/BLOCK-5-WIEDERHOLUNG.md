# Block 5 – Wiederholungsmaschine und Vorher-Nachher-Vergleich

## Ziel

Block 5 macht aufgezeichnete V4-Laeufe offline reproduzierbar. Dieselben Eingabedaten muessen unabhaengig von Browser, Adventure Land, aktueller Uhrzeit und Testreihenfolge dasselbe Verhalten erzeugen.

Die Wiederholungsmaschine fuehrt keine Adventure-Land-Aktion aus. Sie liest keine Live-Spielwerte und besitzt keine versteckte Uhr oder Zufallsquelle. Zeitpunkte stammen ausschliesslich aus dem Wiederholungsdatensatz.

## Eingabedaten

Ein `WiederholungsDatensatz` kann enthalten:

- aufgezeichnete `Spielzustand`-Folgen, jeweils mit ausdruecklicher `charakterKennung`
- abgeschlossene Flugschreiber-Ereignisse
- `AblaufBeobachtung` fuer die erneute Vorfallerkennung
- geordnete Kontingentschritte: Dienstprofil, Anbieter-Verbrauch und Dienstanfrage
- einen gespeicherten `TelemetrieDauerzustand`
- feste Leistungszeitraeume fuer reproduzierbare historische Auswertungen

Mehrere Charaktere werden niemals anhand zufaelliger Reihenfolge vermischt. Jeder Spielzustand traegt im Replay eine ausdrueckliche CharakterKennung. Globale Ereignisse koennen mit `charakterKennung: null` allen Charakteren zur Verfuegung stehen.

## Laden abgeschlossener Segmente

`ladeWiederholungsSegment` akzeptiert nur abgeschlossene Block-4-Segmente. Vor Verwendung werden geprueft:

- Schemaversion
- gespeicherte Bytegroesse
- SHA-256 ueber exakt den gespeicherten NDJSON-Inhalt
- Ereignisanzahl
- erster und letzter Sequenzwert
- lueckenlose Sequenz innerhalb jedes Segments
- erster und letzter Ereigniszeitpunkt

Mehrere Segmente derselben Sitzung duerfen sich nicht ueberlappen. Luecken zwischen abgeschlossenen Segmenten werden ausdruecklich gemeldet; sie werden nicht stillschweigend als vollstaendige Wiederholung behandelt.

## Deterministische Wiederholung

Die `WiederholungsMaschine` sortiert Eingaben nach aufgezeichneten Zeit-, Charakter- und Sequenzwerten. Eine zu pruefende Fachlogik wird als `WiederholungsEntscheider` injiziert.

Der Entscheider erhaelt ausschliesslich:

- den aufgezeichneten Zeitpunkt als `jetzt`
- die CharakterKennung
- den zugehoerigen Spielzustand
- bis zu diesem Zeitpunkt bekannte passende Ereignisse
- bereits im selben Wiederholungslauf erzeugte Entscheidungen

Eine Replay-Entscheidung muss den injizierten Zeitpunkt verwenden. Dadurch faellt eine Fachlogik auf, die stattdessen unkontrolliert die aktuelle Uhrzeit verwendet.

Jeder Lauf besitzt zwei Fingerabdruecke:

- `eingabeFingerabdruck` – SHA-256 des kanonisch serialisierten Datensatzes
- `ausgabeFingerabdruck` – SHA-256 des erzeugten Verhaltens

Der Name der Testvariante fliesst nicht in den Verhaltens-Fingerabdruck ein. Zwei unterschiedlich benannte Varianten mit identischem Verhalten bleiben daher als identisch erkennbar.

## Vorher-Nachher-Vergleich

Zwei Laeufe duerfen nur verglichen werden, wenn `datensatzKennung` und `eingabeFingerabdruck` identisch sind. Ein Vergleich verschiedener Eingaben wird abgelehnt.

Entscheidungen werden ueber `charakterKennung + entscheidungsKennung` zugeordnet. Der Vergleich kennzeichnet:

- `gleich`
- `geaendert`
- `verbessert`
- `verschlechtert`
- `sicherheitsverletzung`

Der `bewertungsWert` stammt aus der jeweils getesteten Fachlogik; ein hoeherer Wert bedeutet innerhalb genau dieser Fachlogik ein besseres Ergebnis. Der generische Replay-Unterbau erfindet keine fachliche Erfolgsmetrik.

Eine neue Sicherheitsverletzung hat immer Vorrang vor einem hoeheren Bewertungswert. Sicherheit darf durch eine Leistungsverbesserung nicht als Verbesserung kaschiert werden.

## Vorfaelle

Gespeicherte `AblaufBeobachtung` werden mit denselben `VorfallErkennungsRegeln` erneut durch die Block-4-`VorfallErkennung` geschickt. Damit koennen insbesondere Stillstand, Schleife, Zeitueberschreitung und unerwarteter Zustandswechsel offline reproduziert werden.

Der absichtlich erzeugte Block-4-Teststillstand ist Teil der Block-5-Regressionspruefung.

## Kontingente

Kontingententscheidungen werden nicht aus einem gespeicherten Endwert geraten. Die Wiederholung spielt die urspruengliche Reihenfolge aus:

1. Dienstprofil setzen,
2. gemeldeten Anbieter-Verbrauch aktualisieren,
3. Dienstanfragen mit ihren bekannten Zeitfenstern pruefen und reservieren.

Dadurch entstehen lokale Reservierungen erneut in derselben Reihenfolge. Gleiche Profile, Verbrauchsmeldungen, Anfragen und Zeitpunkte muessen dieselbe `KontingentEntscheidung` liefern.

## Historische Leistungsdaten

Ist ein `TelemetrieDauerzustand` enthalten, kann die Wiederholungsmaschine feste Zeitraeume erneut mit `TelemetrieSpeicher.fasseLeistungZusammen` auswerten. Das ist die reproduzierbare Grundlage fuer spaetere Tagesberichte, ohne Block 5 bereits mit Versand- oder Web-Logik zu vermischen.

## Goldener Wiederholungssatz

Seltene, sicherheitsrelevante und regressionskritische Datensaetze koennen in `GoldenerWiederholungsSatz` geschuetzt werden.

- Der Satz besitzt feste Eintrags- und Bytegrenzen.
- Normale Speicherbereinigung entfernt keinen goldenen Eintrag.
- Ist die Grenze erreicht, wird ein neuer Eintrag abgelehnt statt ein vorhandener Beleg verdraengt.
- Entfernen ist nur ueber `entferneAusdruecklich` moeglich.
- Jeder Eintrag speichert einen SHA-256 des kanonischen Datensatzes.

Damit kann normale Speicherbereinigung den goldenen Wiederholungssatz nicht entfernen.

## Abnahme

Block 5 ist abgeschlossen, wenn mindestens automatisiert nachgewiesen ist:

- derselbe Datensatz und dieselbe Logik ergeben denselben Verhaltens-Fingerabdruck
- Mehrcharakter-Daten bleiben eindeutig getrennt
- der Block-4-Stillstand wird offline reproduziert
- Verbesserungen, Verschlechterungen und neue Sicherheitsverletzungen werden unterschieden
- verschiedene Eingabedatensaetze koennen nicht als Vorher/Nachher verglichen werden
- Kontingententscheidungen werden deterministisch erneut erzeugt
- historische Leistungsdaten liefern fuer denselben Zeitraum dieselbe Zusammenfassung
- Segmentmanipulation wird durch SHA-256-, Byte-, Anzahl- oder Sequenzpruefung erkannt
- goldene Wiederholungen ueberstehen normale Bereinigung
- keine Block-5-Datei ruft Adventure-Land-Aktionsfunktionen, `Date.now()` oder `Math.random()` auf
