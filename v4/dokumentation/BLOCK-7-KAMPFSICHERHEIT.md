# Block 7 – Kampfsicherheit und Rueckzug

## Ziel

Block 7 stellt sicher, dass Kampfsicherheit Vorrang vor Farmleistung hat. Sicherheitslogik darf Adventure Land nicht direkt bedienen. Sie bewertet den unveraenderlichen `Spielzustand`, erzeugt bei Bedarf eine `AktionsAnfrage` und ueberlaesst Ressourcenvergabe und Unterbrechung ausschliesslich der zentralen `AktionsSteuerung`.

Der aktuelle Block-7-Stand umfasst Gefahrenbewertung, Rueckzug, Abstandhalten, Reichweitenpruefung, blockierte Sicherheitsbewegung, beobachtbare Angriffs-Abklingzeit, einen festen Safety-vor-Farm-Orchestrator und eine kontrollierte aktive Ausfuehrungsgrenze fuer Sicherheitsbewegungen.

## Gefahrenbewertung

Die Bewertung arbeitet nur mit bekannten Daten. Fehlende Lebens- oder Manawerte werden nicht geraten; normale Aktionen bleiben dann blockiert.

Beruecksichtigt werden derzeit:

- Lebensanteil waehrend ein Monster den Charakter angreift,
- Manaanteil waehrend eines laufenden Angriffs,
- Anzahl gleichzeitig auf den Charakter zielender Monster,
- Abstand des naechsten Angreifers relativ zur Charakterreichweite,
- bekannte Positionen der Angreifer fuer einen Rueckzugsvektor.

Die Gefahrenstufen lauten `unbekannt`, `sicher`, `angespannt`, `gefaehrlich` und `kritisch`.

## Rueckzug und Abstandhalten

Ein gefaehrlicher oder kritischer Zustand erzeugt `KAMPF_RUECKZUG` mit:

- `wichtigkeit: "notfall"`,
- hoher Prioritaet,
- den Ressourcen `bewegung` und `kampfziel`.

Ist nur der Abstand zu klein, wird `KAMPF_ABSTAND_HERSTELLEN` mit `wichtigkeit: "sicherheit"` angefordert.

Der Rueckzugspunkt wird deterministisch vom Schwerpunkt der bekannten Angreiferpositionen weg berechnet. Fehlen dafuer Positionen oder ist kein eindeutiger Vektor bestimmbar, wird keine Bewegungsrichtung erfunden. Stattdessen blockiert die Sicherheitslogik normale Aktionen und erzeugt eine erklaerende Meldung.

## Bewegungsfortschritt

Die reine Planung markiert eine Sicherheitsbewegung noch nicht als ausgefuehrt. Erst wenn die zentrale Ausfuehrung eine Sicherheitsbewegung tatsaechlich startet, kann `markiereSicherheitsBewegungGestartet(...)` den Fortschrittswaechter aktivieren.

Bleibt danach die Charakterposition laenger als `bewegungsStillstandNachMillisekunden` unveraendert, wird `KAMPF_RUECKZUG_BLOCKIERT` gemeldet und normales Farmen bleibt blockiert. Dadurch erzeugt Schattenbetrieb keinen falschen Bewegungsstillstand nur weil er absichtlich keine Spielaktion ausfuehrt.

## Abklingzeit und Aktionsbereitschaft

`AdventureLandKampfBereitschaftLesezugriff` liest fuer den normalen Angriff ausschliesslich `ms_to_next_skill("attack")`. Dabei wird keine Spielaktion ausgeloest. Die Beobachtung wird als expliziter `KampfAktionsBereitschaft`-Datensatz mit Aufnahmezeitpunkt, Zustand, Restzeit und absolutem `bereitAb` festgehalten.

Die deterministische Planung ruft `ms_to_next_skill` nicht selbst auf. Sie bekommt nur den bereits beobachteten Datensatz. Dadurch kann dieselbe Bereitschaft spaeter in Tests und Wiederholungen reproduziert werden.

Ein Angriff wird nur freigegeben, wenn der Bereitschaftsdatensatz:

- zur Aktion `attack` gehoert,
- nicht in der Zukunft aufgenommen wurde,
- nicht aelter als `maxAktionsBereitschaftAlterMillisekunden` ist,
- nicht `unbekannt` ist,
- gueltige Zeitwerte besitzt,
- und `bereitAb` nicht mehr in der Zukunft liegt.

Unbekannte oder veraltete Bereitschaft fuehrt zu Blockierung statt zu einem geratenen Angriff. Eine normale Zielbewegung, Heilung oder Beuteaufnahme wird durch den Attack-Cooldown nicht unnoetig blockiert.

## Sicherheitsentscheidung vor Farmplan

`planeSicherenFarmSchritt(...)` ist die feste Verbindung zwischen Block 7 und Block 6. Die Reihenfolge ist verbindlich:

1. `planeKampfSicherheitsSchritt(...)`
2. nur bei `normalAktionenErlaubt: true` folgt `planeGrundlegendenFarmSchritt(...)`
3. nur ein geplanter Angriff wird danach noch durch die frische Angriffsbereitschaft gegated
4. erst die daraus resultierende `AktionsAnfrage` darf an die zentrale `AktionsSteuerung` weitergegeben werden

Wenn Kampfsicherheit Rueckzug oder Abstandhalten verlangt, wird der Farmplan in diesem Schritt gar nicht erst erzeugt. Wenn Kampfsicherheit wegen unbekannter Pflichtdaten blockiert, bleibt auch Farmen blockiert.

## Aktive Kampfsicherheits-Ausfuehrungsgrenze

`AdventureLandKampfSicherheitsAusfuehrung` ist die einzige aktive Block-7-Grenze fuer Rueckzug und Abstandhalten. Aktive Kampfsicherheitsausfuehrung bleibt standardmaessig gesperrt.

Nur wenn alle folgenden Bedingungen gleichzeitig erfuellt sind, darf `move(x, y)` aufgerufen werden:

- die Ausfuehrungsinstanz wurde mit `{ aktivFreigegeben: true }` erzeugt,
- die `AktionsSteuerung` hat die Anfrage tatsaechlich gestartet,
- die gestartete Anfrage ist weiterhin als `laeuft` bestaetigt,
- der Aktionsname ist exakt `KAMPF_RUECKZUG` oder `KAMPF_ABSTAND_HERSTELLEN`,
- beide Zielkoordinaten sind endliche Zahlen.

Fremde Aktionsnamen oder ungueltige Koordinaten werden abgebrochen und die zentral gehaltenen Ressourcen wieder freigegeben. Die Sicherheits-Ausfuehrungsgrenze besitzt keinen Pfad zu `attack`, `use_skill`, Heilung oder Loot.

## Reichweiten-Recheck unmittelbar vor Angriff

Die Planung kann korrekt gewesen sein und das Ziel sich danach trotzdem bewegen. Deshalb wird die Reichweite unmittelbar vor `attack(...)` erneut geprueft.

`AdventureLandFarmAusfuehrung` liest direkt vor der aktiven Attacke die aktuellen Charakter- und Zielkoordinaten sowie die aktuelle Charakterreichweite. Ist das Ziel inzwischen ausserhalb der Reichweite, wird die laufende Farmaktion abgebrochen und `attack(...)` nicht aufgerufen. Sind Position oder Reichweite unbekannt, wird ebenfalls kein Angriff geraten.

Damit gibt es zwei getrennte Gates:

1. Planung: Ziel und Angriff muessen im aufgezeichneten Spielzustand sinnvoll sein.
2. Ausfuehrung: Die reale Spielsituation muss unmittelbar vor dem API-Aufruf weiterhin passen.

## Zentrale Unterbrechung

Block 7 besitzt keinen eigenen Unterbrechungsmechanismus. Die bestehende `AktionsSteuerung` entscheidet anhand der bereits vorhandenen Wichtigkeitsstufen `notfall`, `sicherheit`, `normal` und `hintergrund`.

Ein automatisierter Test startet deshalb zuerst eine normale Farmbewegung mit den Ressourcen `bewegung` und `kampfziel`. Anschliessend wird eine echte Block-7-Notfallanfrage eingereicht. Die zentrale Steuerung muss die Farmbewegung abbrechen und den Rueckzug starten.

## Wiederholung

`kampfsicherheit-wiederholung.ts` adaptiert die Sicherheitsentscheidung fuer die bestehende Wiederholungsmaschine. Gleiche aufgezeichnete Spielzustaende und gleiche Konfiguration muessen dieselbe Folge von Sicherheitsentscheidungen und denselben Ausgabe-Fingerabdruck erzeugen.

## 10-Minuten-Schattenlauf mit Sampling-Qualitaet

Der offizielle Block-7-Schatten-Abnahmelauf dauert **10 Minuten**. Bei einem Intervall von 1 Sekunde tickt der Quellrunner sofort beim Start und danach einmal pro Sekunde. Erwartet werden deshalb **601 Schritte**.

Vor jedem Lauf wird `performance_trick()` verpflichtend aktiviert. Fehlt die Funktion oder wirft sie einen Fehler, startet der Test nicht. Die Sampling-Qualitaet gilt nur als ausreichend, wenn:

- mindestens 95 % der erwarteten Schritte vorhanden sind,
- die maximale beobachtete Tick-Luecke hoechstens 5 Sekunden betraegt,
- der Quelllauf normal abgeschlossen wurde.

Verpasste Browser-Ticks werden nicht kuenstlich nachgeholt. Ein formal abgelaufener Quelllauf mit schlechter Sampling-Abdeckung wird als `unvollstaendig` markiert.

Ladereihenfolge im Ranger-Codekontext:

1. `v4/werkzeuge/adventure-land-testkonsole.js`
2. `v4/werkzeuge/block7-schattenlauf-ranger.js`
3. `v4/werkzeuge/block7-schattenlauf-qualitaet.js`

Start:

```js
V4Block7SchattenQualitaet.starte(["goo"])
```

Zwischenstand:

```js
V4Block7SchattenQualitaet.status()
```

Finaler Bericht:

```js
V4Block7SchattenQualitaet.kompaktErgebnis()
```

Fruehzeitiger Stopp:

```js
V4Block7SchattenQualitaet.stoppe("Grund")
```

Der Schattenlauf bleibt read-only. Er beobachtet die Reihenfolge `Kampfsicherheit -> Farmplanung -> Angriffsbereitschaft`, Sicherheitsentscheidungen, Farmentscheidungen, Cooldown-Zustaende und Gefahrenursachen, fuehrt aber keine Spielaktion aus.

## Sicherheitsregeln

- Keine Block-7-Spiellogik ruft `attack`, `move`, `smart_move`, `use_skill`, `use_hp`, `use_mp` oder `loot` direkt auf.
- `Date.now()` und `Math.random()` duerfen nicht versteckt in der deterministischen Sicherheitslogik verwendet werden.
- Fehlende Pflichtdaten fuehren zu Blockierung, nicht zu erfundenen Ersatzwerten.
- Ein Rueckzug wird als `notfall` angefordert und kann normale Arbeit zentral unterbrechen.
- Eine nur geplante Schattenbewegung gilt nicht automatisch als ausgefuehrte Sicherheitsbewegung.
- Kampfsicherheit wird vor jedem normalen Farmplan ausgewertet.
- Ein Angriff ohne frische und bekannte Aktionsbereitschaft wird nicht angefordert.
- Aktive Kampfsicherheitsausfuehrung bleibt standardmaessig gesperrt.
- Vor einer aktiven Attacke wird die Reichweite unmittelbar vor `attack(...)` erneut geprueft.

## Aktueller Umfang und naechste Block-7-Schritte

Gefahrenkern, Replay, zentrale Notfall-Unterbrechung, Abklingzeitbeobachtung, Safety-vor-Farm, aktive Sicherheitsbewegung, Reichweiten-Recheck und die Infrastruktur fuer den 10-Minuten-Schattenlauf mit Sampling-Qualitaet sind umgesetzt. Fuer den vollstaendigen Block-7-Abschluss fehlen noch:

1. der reale 10-Minuten-Read-only-Schattenlauf auf dem Ranger,
2. ein kontrollierter Aktivtest, der Rueckzug/Abstandhalten und den Reichweiten-Abbruch gezielt ausloest,
3. die abschliessende Auswertung gegen die Block-7-Abnahmekriterien.
