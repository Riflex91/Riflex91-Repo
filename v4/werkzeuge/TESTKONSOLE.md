# V4 Adventure-Land-Testkonsole

Die Testkonsole ist ein kleines Entwicklungswerkzeug fuer Live-Pruefungen direkt im Adventure-Land-Fenster. Sie ist **nicht** die spaetere V4-Web-Oberflaeche und fuehrt selbst keine Botlogik aus.

## Zweck

Sie soll Block-2- und spaetere Live-Tests vereinfachen, damit Werte nicht mehr in den Browser-Entwicklertools gesucht und manuell aus der Konsole kopiert werden muessen.

## Start

Datei:

`v4/werkzeuge/adventure-land-testkonsole.js`

Den Inhalt im Adventure-Land-Codekontext ausfuehren. Die Konsole versucht zuerst, sich im eigentlichen Spielfenster einzublenden und faellt sonst auf das aktuelle Dokument zurueck.

Wird das Skript erneut ausgefuehrt, waehrend die Testkonsole bereits offen ist, wird keine zweite Instanz erzeugt.

## Read-only Schnelltests

Die eingebauten Schnelltests lesen nur vorhandene Werte und loesen keine Adventure-Land-Aktion aus:

- Charakter
- Inventar
- Entities
- Monster
- Gruppe
- Map
- Block-2-Rohdaten

`Block-2-Rohdaten` fasst Charakter, Gruppe, Entities, Karte und Serverkennung fuer die kommenden Beobachtungs- und Spielzustandstests zusammen.

## Freies JavaScript

Das Eingabefeld kann beliebiges JavaScript ausfuehren. Dadurch koennen auch veraendernde Adventure-Land-Funktionen aufgerufen werden. Freies JavaScript ist deshalb **nicht read-only** und muss bewusst manuell ueber `Ausfuehren` oder `Strg+Enter` gestartet werden.

Beispiele:

```js
character
```

```js
console.log(character.hp, character.mp)
```

```js
Object.values(parent.entities).filter(e => e.type === 'monster')
```

`console.log`, `console.info`, `console.warn`, `console.error` und `console.debug` werden fuer den ausgefuehrten Befehl in der Testkonsole aufgefangen und direkt dort angezeigt.

## Bedienung

- `Strg+Enter`: freien JavaScript-Befehl ausfuehren
- `Alt+Pfeil hoch/runter`: Befehlsverlauf
- `Letzte kopieren`: letzte Ausgabe kopieren
- `Alles kopieren`: gesamten Verlauf mit Zeitstempeln kopieren
- `Kopieren` an einer Ausgabe: nur diese Ausgabe kopieren
- `Leeren`: Ausgabeverlauf leeren
- `–` / `+`: Konsole ein- oder ausklappen
- `×`: Konsole schliessen

Die Anzeige ist in der Groesse veraenderbar. Es werden maximal 100 Ausgaben gehalten. Sehr grosse oder tief verschachtelte Objekte werden begrenzt, damit die Testoberflaeche den Spieltab nicht durch unbegrenzte Ausgaben belastet.

## Globale Hilfs-API

Wenn der Adventure-Land-Kontext es erlaubt, wird `V4Testkonsole` bereitgestellt:

```js
V4Testkonsole.ausgeben({ test: true }, 'Eigener Test')
V4Testkonsole.block2Rohdaten()
V4Testkonsole.leeren()
V4Testkonsole.oeffnen()
V4Testkonsole.schliessen()
```

Diese API ist fuer spaetere Block-2-Testhelfer gedacht, damit Beobachter- oder Spielzustandsdaten direkt in die gleiche Ausgabe geschrieben werden koennen.

## Sicherheitsgrenze

Die Kennzeichnung `RO` gilt ausschliesslich fuer die fest eingebauten Schnelltests. Sie ist keine allgemeine Sicherheitsgarantie fuer frei eingegebenes JavaScript oder spaeter von Hand ergaenzte Befehle.
