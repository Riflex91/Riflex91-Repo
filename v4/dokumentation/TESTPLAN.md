# V4 Testplan

## Stufe 1 – statische Pruefung

- TypeScript streng
- deutsche Namenspruefung
- Struktur- und Geheimnispruefung
- spaeter Abhaengigkeitsgrenzen

## Stufe 2 – Einheitstests

Jeder Kernbaustein wird isoliert getestet. Fehlertexte und Grenzfaelle gehoeren zum Vertrag.

Fuer den Tagesbericht werden insbesondere Zeitraum, Aggregation, Vergleichswerte, Handlungsangabe und eindeutige Berichtskennung getestet.

## Stufe 3 – Eigenschaftstests

Kerninvarianten werden mit vielen automatisch erzeugten Eingaben geprueft, insbesondere Ressourcenbesitz, Prioritaeten und deterministische Auswahl.

Fuer Berichte gilt zusaetzlich: derselbe Datenbestand und derselbe Zeitraum muessen denselben Bericht ergeben; Ereignisse ausserhalb des 24-Stunden-Zeitraums duerfen nicht einfließen.

## Stufe 4 – Wiederholungstests

Echte historische Situationen werden offline gegen neue Versionen abgespielt. Unterschiede werden automatisch ausgewiesen.

Mehrcharakter-Wiederholungen muessen die beteiligten Charaktere eindeutig unterscheiden, damit Zustandsdaten nicht vermischt werden.

Historische Daten muessen auch zur reproduzierbaren Erzeugung eines Tagesberichts verwendet werden koennen.

## Stufe 5 – Fehler-Einspritzung

Netzwerkausfall, langsame Antworten, fehlende Spielwerte, Zeitueberschreitungen, Neustarts, teilweise Daten und verspaetete Gruppenmeldungen werden absichtlich erzeugt.

Fuer den Tagesbericht werden zusaetzlich getestet:

- Neustart waehrend des 24-Stunden-Zeitraums
- Neustart unmittelbar vor dem Versand
- Serverausfall beim Erstellen des Berichts
- E-Mail-Ausfall beim Versand
- erneuter Versandversuch ohne doppelten Bericht
- fehlende Messwerte werden als fehlend behandelt und nicht als Null erfunden
- Zeitumstellung veraendert nicht die ausgewertete Dauer von exakt 24 Stunden

## Stufe 6 – Adventure-Land-Schattenbetrieb

Mindestens 24 Stunden ohne echte Aktionen. Entscheidungen werden nur beobachtet und mit der laufenden Produktionslogik verglichen.

Nach dem ersten vollstaendigen 24-Stunden-Schattenlauf muss aus den aufgezeichneten Daten ein gueltiger Tagesbericht erzeugt werden koennen.

## Stufe 7 – kontrollierter Aktivbetrieb

Zuerst ein einzelner Charakter, danach mehrere eigene Charaktere als Gruppe, danach Haendler und Wirtschaft. Jede Erweiterung besitzt eine ausdrueckliche Rueckfallmoeglichkeit.

Die Gruppenpruefung umfasst mindestens:

- gemeinsames Ziel
- Ausfall eines Gruppenmitglieds
- Wiederaufbau der Gruppe
- sichere Gegenstandsuebergabe
- veraltete Gruppendaten werden verworfen

Der Tagesbericht muss die aktiven Charaktere getrennt ausweisen und gemeinsame Vorfaelle nachvollziehbar zusammenfassen.

## Stufe 8 – Dauertest

Vor einer Produktionsabloesung: sieben Tage 24/7 mit Neustart-, Update-, Netz- und Plattformausfalltests.

Waehrend des Dauertests muss an jedem geplanten Versandtag genau ein automatischer Tagesbericht entstehen. Fehlgeschlagene Zustellungen duerfen nachgeholt werden, ohne Berichte doppelt zu erzeugen.
