# Block 7 – Kampfsicherheit und Rueckzug

## Ziel

Block 7 stellt sicher, dass Kampfsicherheit Vorrang vor Farmleistung hat. Sicherheitslogik darf Adventure Land nicht direkt bedienen. Sie bewertet den unveraenderlichen `Spielzustand`, erzeugt bei Bedarf eine `AktionsAnfrage` und ueberlaesst Ressourcenvergabe und Unterbrechung ausschliesslich der zentralen `AktionsSteuerung`.

Der aktuelle Block-7-Stand umfasst Gefahrenbewertung, Rueckzug, Abstandhalten, Reichweitenpruefung, blockierte Sicherheitsbewegung, beobachtbare Angriffs-Abklingzeit und einen festen Orchestrator, der Kampfsicherheit immer vor dem normalen Farmplan auswertet.

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
- Kampfsicherheit wird vor jedem normalen Farmplan ausgewertet.
- Ein Angriff ohne frische und bekannte Aktionsbereitschaft wird nicht angefordert.

## Aktueller Umfang und naechste Block-7-Schritte

Gefahrenkern, Replay, zentrale Notfall-Unterbrechung, Abklingzeitbeobachtung und die feste Sicherheits-vor-Farm-Reihenfolge sind umgesetzt. Fuer den vollstaendigen Block-7-Abschluss fehlen noch:

1. begrenzte Adventure-Land-Ausfuehrung fuer Rueckzug und Abstandhalten ueber die zentrale Ausfuehrungsgrenze,
2. erneute Reichweitenpruefung unmittelbar vor einem aktiven Angriff,
3. Schattenlauf fuer den kombinierten Block-6/7-Plan,
4. kontrollierter Aktivtest mit absichtlich erzeugten Gefahr- und Fehlerfaellen.
