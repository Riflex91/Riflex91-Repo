# Block 8 – Abschlussstatus und verbleibende Freigabekampagne

Stand: 2026-09-18

## Formales Ergebnis

Block 8 ist **noch nicht formal abgeschlossen**.

Die deterministische Gruppenkoordination, Mehrcharakter-Wiederholung, gezielte Ausfall-/Reconnect-Pfade und die zentrale Gruppen-AktionsSteuerung sind inzwischen weitgehend nachgewiesen. Offen sind noch die kontrollierte aktive Freigabekampagne mit one-shot Live-Smoke und danach der im Fahrplan geforderte 72-Stunden-Gruppentest.

Es wird **kein weiterer Zwischenblock zwischen Block 8 und Block 8.5** eingefuehrt. Die noch fehlende aktive Freigabekampagne ist Abschlussarbeit innerhalb von Block 8. Erst nach ihrem erfolgreichen Abschluss beginnt Block 8.5.

## Erreichte Block-8-Nachweise

### Mehrcharakter-Lebensnachweis und Wiederaufbau

Live mit `My_Ranger1` und `My_Ranger2` nachgewiesen:

- beide Teilnehmer aktiv,
- Teilnehmer wird nach ausbleibendem Lebensnachweis veraltet,
- veralteter Teilnehmer verliert seine Aufgabe,
- frischer Reconnect nimmt den Teilnehmer wieder auf,
- Aufgabe wird wieder zugeordnet,
- Block-7-Sicherheitslage wird automatisch in den Lebensnachweis uebernommen,
- keine echte Gruppen-Spielaktion wird dabei ausgefuehrt.

Der nachgewiesene Zyklus lautet:

`aktiv -> veraltet -> Aufgabe entzogen -> Reconnect -> aktiv -> Aufgabe wieder zugeordnet`

### Mehrcharakter-Wiederholung

`block8-mehrcharakter-wiederholung.test.mjs` fuehrt die echte Block-8-Gruppenkoordination und Gruppenaktionsplanung durch die vorhandene Block-5-`WiederholungsMaschine`.

Der Datensatz enthaelt zwei Charakterperspektiven und die Phasen:

1. aktiv,
2. stale,
3. reconnect,
4. safety.

Die Gruppensnapshots liegen im Wiederholungsdatensatz selbst und sind damit Bestandteil des Eingabe-Fingerabdrucks. Zwei identische Laeufe muessen denselben Ausgabe-Fingerabdruck und dieselben fachlichen Entscheidungen erzeugen.

### Zentrale Gruppen-AktionsSteuerung

Automatisiert nachgewiesen sind:

- exklusive Ressourcenbelegung auf `gruppe`,
- Blockierung konkurrierender normaler Gruppenarbeit,
- Unterbrechung normaler Gruppenarbeit durch eine wichtigere Sicherheitsanfrage,
- Ablauf einer bereits wartenden bzw. blockierten Gruppenanfrage,
- fail-safe Neustart ohne stillschweigende Fortsetzung fluechtigen alten Steuerungszustands,
- fail-safe Abbruch alter wartender, blockierter oder laufender Gruppenarbeit, wenn die aktuelle Gruppenplanung `blockiert` oder lokal `leer` ist,
- andere zentrale Arbeit wird durch diesen Gruppenabbruch nicht veraendert,
- eine reine Freigabesperre wird nicht faelschlich als Safety-Signal behandelt,
- Browserkern und Produktionskern bleiben source-locked und semantisch gleich.

Die zentrale Verarbeitung endet weiterhin in `SchattenAusfuehrung`.

## Noch nicht freigegeben

Der erste minimale Adventure-Land-Ausfuehrungsadapter fuer `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN` ist inzwischen **implementiert, aber standardmaessig gesperrt und noch nicht live freigegeben**.

Er liegt ausschliesslich unter `ausfuehrung/`, ist zusaetzlich durch eine an die AktionsAnfrage gebundene Einmal-Freigabe gehaertet und besitzt ein getrenntes read-only/one-shot Browserwerkzeug mit automatischer Wiedersperrung. Die feste delegierte `V4Block8GruppenZielAusfuehrungsBruecke` und ihre one-shot Live-Bindung an eine vorhandene zentrale `AktionsSteuerung` plus frische Produktions-Safety sind inzwischen unter `ausfuehrung/` implementiert und offline abgesichert. Der echte one-shot Live-Smoke wurde noch nicht ausgefuehrt. Die uebrigen `GRUPPE_*`-Aktionen haben weiterhin keinen aktiven Adventure-Land-Pfad.

## Verbleibende Block-8-Schritte

### 1. Genau einen minimalen Gruppen-Ausfuehrungspfad vorbereiten — **implementiert, Offline-Gates laufen**

Es wurde ausschliesslich `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN` ausgewaehlt. Andere Gruppenaktionen bleiben ohne aktiven Pfad.

Der erste Adapter muss:

- ausschliesslich unter `v4/laufzeit/quelle/ausfuehrung/` liegen,
- standardmaessig gesperrt sein,
- nur explizit freigegebene `GRUPPE_*`-Anfragen akzeptieren,
- den Besitz aller benoetigten Ressourcen respektieren,
- aktuelle Safety- und Zielvoraussetzungen vor der Adventure-Land-Aktion erneut pruefen,
- bei unbekannten oder veralteten Voraussetzungen fail-safe abbrechen,
- keine Klassenannahmen als Rollenlogik einfuehren.

Die konkrete erste Aktion wird erst gewaehlt, wenn ihr Adventure-Land-Aufruf und ihre Vorbedingungen eindeutig begrenzt werden koennen.

### 2. Adapter vor Live-Freigabe offline absichern

Vor einer echten Aktion sind mindestens erforderlich:

- deterministische Einheitstests fuer erlaubte und blockierte Faelle,
- Regressionstest gegen direkte Adventure-Land-Aufrufe ausserhalb `ausfuehrung/`,
- Nachweis, dass verlorener Ressourcenbesitz die Aktion verhindert,
- Nachweis, dass Safety-Wechsel die Aktion verhindert oder abbricht,
- Wiederholung bzw. deterministische Simulation des Entscheidungs- und Freigabepfads,
- Schattenbetrieb mit derselben Anfrage- und Ressourcenfolge.

Der Adapter ist dafuer implementiert und bleibt standardmaessig gesperrt. Er gilt weiterhin nicht als live freigegeben. Details stehen in `BLOCK-8-GRUPPENZIEL-AUSFUEHRUNG.md`.

### 3. Begrenzter one-shot Live-Smoke — **Produktions-Smoke-Huelle und Runner vorbereitet; echter Smoke und Runtime-Bootstrap noch offen**

Das Browserwerkzeug startet gesperrt, verlangt eine frische read-only Vorschau, bindet die Freigabe an genau eine AktionsAnfrage und sperrt vor der Delegation wieder. Es besitzt selbst keinen Adventure-Land-Aktionsaufruf.

Die feste `V4Block8GruppenZielAusfuehrungsBruecke`, die one-shot Live-Bindung und eine kontrollierte Produktions-Smoke-Huelle sind unter der `ausfuehrung/`-Grenze implementiert. Die Smoke-Huelle bindet Charakter/Server/Karte/Instanz/Ziel exakt, arbeitet auf der realen zentralen `AktionsSteuerung`, prueft frische Produktions-Safety und zaehlt den erlaubten `attack`-Aufruf an der Produktionsgrenze. Der Browser-Runner selbst besitzt keinen Adventure-Land-Aktionsaufruf. Offen ist der allgemeine Produktions-Bootstrap, der diese TypeScript-Laufzeit im Adventure-Land-Kontext installiert; deshalb wurde der echte Smoke noch nicht ausgefuehrt.

Erst nach gruenem Offline-/Replay-/Schattennachweis:

- genau eine bewusst ausgewaehlte Gruppenaktion,
- exakt definierte Charaktere, Server, Karte und Zielvoraussetzungen,
- explizite temporaere Freigabe,
- Zaehler fuer alle beobachteten Adventure-Land-Aktionen,
- keine Nebenaktion ausserhalb der erlaubten Aktion,
- automatische Wiedersperrung unmittelbar nach dem Versuch,
- anschliessende Auswertung des zentralen Zustands und der Ressourcensperren.

Ein unerwarteter Adventure-Land-Aufruf oder eine fehlende Wiedersperrung macht den Smoke-Test rot.

### 4. 72-Stunden-Gruppentest

Der 72-Stunden-Test beginnt erst nach bestandenem kontrollierten Live-Smoke.

Mindestens zu beobachten sind:

- aktive Teilnehmer und Heartbeat-Freshness,
- Stale-/Reconnect-Zyklen,
- Aufgabenverteilung und Aufgabenentzug,
- gemeinsame Sicherheitslage,
- Gruppen-AktionsAnfragen und ihre Phasen,
- Besitzer der Ressource `gruppe`,
- Blockierungen, Preemptions, Expiry und Abbrueche,
- Anzahl echter Gruppenaktionen je freigegebener Aktion,
- unerwartete bzw. blockierte Aktionsversuche,
- Todesfaelle und sicherheitsrelevante Vorfaelle,
- Neustarts bzw. absichtlich erzeugte Verbindungsabbrueche,
- keine direkte Spielaktion ausserhalb `ausfuehrung/`.

Der Test ist sofort als fehlgeschlagen zu behandeln, wenn unter anderem:

- ein stale/ausgefallener Teilnehmer weiter neue Gruppenarbeit ausfuehrt,
- normale Gruppenarbeit bei unbekannter Safety fortgesetzt wird,
- dieselbe exklusive Ressource gleichzeitig mehreren Besitzern gehoert,
- eine nicht freigegebene `GRUPPE_*`-Aktion Adventure Land erreicht,
- ein direkter Adventure-Land-Aufruf aus der Spiellogik erfolgt,
- Replay/Produktions- oder Browser/Produktions-Paritaet fuer den getesteten Pfad auseinanderlaeuft.

## Entscheidung zum Blockabschluss

Der Code- und Schattenstand ist ausreichend gehaertet, um die spaetere **kontrollierte aktive Freigabekampagne** vorzubereiten.

Block 8 darf aber erst als **abgeschlossen** markiert werden, wenn:

1. der minimale aktive Gruppenpfad seine deterministischen Tests, Replay/Simulation und Schattenpruefung bestanden hat,
2. der one-shot Live-Smoke bestanden und automatisch wiedergesperrt wurde,
3. der 72-Stunden-Gruppentest bestanden ist,
4. die relevanten V4-Gates auf dem finalen Block-8-Stand gruen sind.

Danach folgt verbindlich Block 8.5. Block 9 beginnt vorher nicht.
