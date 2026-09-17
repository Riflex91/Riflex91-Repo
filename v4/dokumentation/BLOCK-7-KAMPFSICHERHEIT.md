# Block 7 – Kampfsicherheit und Rueckzug

## Ziel

Block 7 stellt sicher, dass Kampfsicherheit Vorrang vor Farmleistung hat. Sicherheitslogik darf Adventure Land nicht direkt bedienen. Sie bewertet den unveraenderlichen `Spielzustand`, erzeugt bei Bedarf eine `AktionsAnfrage` und ueberlaesst Ressourcenvergabe und Unterbrechung ausschliesslich der zentralen `AktionsSteuerung`.

Dieser erste Block-7-Kern umfasst Gefahrenbewertung, Rueckzug, Abstandhalten, Reichweitenpruefung, blockierte Sicherheitsbewegung und den Nachweis, dass ein Notfall eine laufende normale Farmbewegung unterbrechen kann. Abklingzeiten und die spaetere aktive Adventure-Land-Ausfuehrung werden auf dieser Grundlage separat ergaenzt.

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

## Zentrale Unterbrechung

Block 7 besitzt keinen eigenen Unterbrechungsmechanismus. Die bestehende `AktionsSteuerung` entscheidet anhand der bereits vorhandenen Wichtigkeitsstufen `notfall`, `sicherheit`, `normal` und `hintergrund`.

Ein automatisierter Test startet deshalb zuerst eine normale Farmbewegung mit den Ressourcen `bewegung` und `kampfziel`. Anschliessend wird eine echte Block-7-Notfallanfrage eingereicht. Die zentrale Steuerung muss die Farmbewegung abbrechen und den Rueckzug starten.

## Wiederholung

`kampfsicherheit-wiederholung.ts` adaptiert die Sicherheitsentscheidung fuer die bestehende Wiederholungsmaschine. Gleiche aufgezeichnete Spielzustaende und gleiche Konfiguration muessen dieselbe Folge von Sicherheitsentscheidungen und denselben Ausgabe-Fingerabdruck erzeugen.

## Sicherheitsregeln

- Keine Block-7-Spiellogik ruft `attack`, `move`, `smart_move`, `use_skill`, `use_hp`, `use_mp` oder `loot` direkt auf.
- `Date.now()` und `Math.random()` duerfen nicht versteckt in der deterministischen Sicherheitslogik verwendet werden.
- Fehlende Pflichtdaten fuehren zu Blockierung, nicht zu erfundenen Ersatzwerten.
- Ein Rueckzug wird als `notfall` angefordert und kann normale Arbeit zentral unterbrechen.
- Eine nur geplante Schattenbewegung gilt nicht automatisch als ausgefuehrte Sicherheitsbewegung.

## Aktueller Umfang und naechste Block-7-Schritte

Der Kern ist bewusst noch nicht der vollstaendige Block-7-Abschluss. Als naechstes folgen auf diesem Fundament:

1. beobachtbare Abklingzeiten und Aktionsbereitschaft,
2. sichere Einbindung der Block-7-Entscheidung vor dem normalen Farmplan,
3. begrenzte Adventure-Land-Ausfuehrung fuer Rueckzug und Abstandhalten ueber die zentrale Ausfuehrungsgrenze,
4. Schatten- und kontrollierter Aktivtest mit Fehler-Einspritzfaellen.
