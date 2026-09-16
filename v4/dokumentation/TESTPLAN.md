# V4 Testplan

## Stufe 1 – statische Pruefung

- TypeScript streng
- deutsche Namenspruefung
- Struktur- und Geheimnispruefung
- Kontoprofile duerfen keine gespeicherten Kennwortfelder enthalten
- spaeter Abhaengigkeitsgrenzen

## Stufe 2 – Einheitstests

Jeder Kernbaustein wird isoliert getestet. Fehlertexte und Grenzfaelle gehoeren zum Vertrag.

## Stufe 3 – Eigenschaftstests

Kerninvarianten werden mit vielen automatisch erzeugten Eingaben geprueft, insbesondere Ressourcenbesitz, Prioritaeten, deterministische Auswahl und eindeutige Konto-Charakter-Zuordnung.

## Stufe 4 – Wiederholungstests

Echte historische Situationen werden offline gegen neue Versionen abgespielt. Unterschiede werden automatisch ausgewiesen.

Mehrcharakter-Wiederholungen muessen Konto- und Charakterkennungen enthalten, damit keine Bank-, Inventar- oder Besitzdaten zwischen Konten vermischt werden.

## Stufe 5 – Fehler-Einspritzung

Netzwerkausfall, langsame Antworten, fehlende Spielwerte, Zeitueberschreitungen, Neustarts, teilweise Daten, ausgefallene Kontositzungen und verspätete Verbundmeldungen werden absichtlich erzeugt.

## Stufe 6 – Adventure-Land-Schattenbetrieb

Mindestens 24 Stunden ohne echte Aktionen. Entscheidungen werden nur beobachtet und mit der laufenden Produktionslogik verglichen.

Vor einer aktiven Mehrkontenpruefung werden die aktuellen Adventure-Land-Regeln und Charaktergrenzen erneut geprueft.

## Stufe 7 – kontrollierter Aktivbetrieb

Zuerst ein einzelner Charakter, danach ein Verbund mit mehreren Charakteren, danach Haendler und Wirtschaft. Jede Erweiterung besitzt eine ausdrueckliche Rueckfallmoeglichkeit.

Die Mehrkontenpruefung umfasst mindestens:

- getrennte Anmeldesitzungen
- korrekte Konto-Charakter-Zuordnung
- gemeinsames Ziel ueber Kontogrenzen hinweg
- Ausfall eines Kontos ohne Stillstand der anderen
- kontogebundene Bankdaten
- sichere Gegenstandsuebergabe
- Regelprofil blockiert unzulaessige weitere Charakterstarts

## Stufe 8 – Dauertest

Vor einer Produktionsabloesung: sieben Tage 24/7 mit Neustart-, Update-, Netz-, Plattform- und Kontositzungsausfalltests.
