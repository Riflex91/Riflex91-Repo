# V4 Testplan

## Stufe 1 – statische Pruefung

- TypeScript streng
- deutsche Namenspruefung
- Struktur- und Geheimnispruefung
- spaeter Abhaengigkeitsgrenzen

## Stufe 2 – Einheitstests

Jeder Kernbaustein wird isoliert getestet. Fehlertexte und Grenzfaelle gehoeren zum Vertrag.

## Stufe 3 – Eigenschaftstests

Kerninvarianten werden mit vielen automatisch erzeugten Eingaben geprueft, insbesondere Ressourcenbesitz, Prioritaeten und deterministische Auswahl.

## Stufe 4 – Wiederholungstests

Echte historische Situationen werden offline gegen neue Versionen abgespielt. Unterschiede werden automatisch ausgewiesen.

Mehrcharakter-Wiederholungen muessen die beteiligten Charaktere eindeutig unterscheiden, damit Zustandsdaten nicht vermischt werden.

## Stufe 5 – Fehler-Einspritzung

Netzwerkausfall, langsame Antworten, fehlende Spielwerte, Zeitueberschreitungen, Neustarts, teilweise Daten und verspätete Gruppenmeldungen werden absichtlich erzeugt.

## Stufe 6 – Adventure-Land-Schattenbetrieb

Mindestens 24 Stunden ohne echte Aktionen. Entscheidungen werden nur beobachtet und mit der laufenden Produktionslogik verglichen.

## Stufe 7 – kontrollierter Aktivbetrieb

Zuerst ein einzelner Charakter, danach mehrere Charaktere desselben Kontos als Gruppe, danach Haendler und Wirtschaft. Jede Erweiterung besitzt eine ausdrueckliche Rueckfallmoeglichkeit.

Die Gruppenpruefung umfasst mindestens:

- gemeinsames Ziel
- Ausfall eines Gruppenmitglieds
- Wiederaufbau der Gruppe
- sichere Gegenstandsuebergabe
- veraltete Gruppendaten werden verworfen

## Stufe 8 – Dauertest

Vor einer Produktionsabloesung: sieben Tage 24/7 mit Neustart-, Update-, Netz- und Plattformausfalltests.
