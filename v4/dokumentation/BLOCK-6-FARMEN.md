# Block 6 – Grundlegendes Farmen

## Ziel

Block 6 fuehrt die erste vollstaendige Spielfunktion der V4 ein: Ein einzelner Charakter kann aus einem zentralen `Spielzustand` einen einfachen, nachvollziehbaren Farm-Schritt ableiten. Die Fachlogik bleibt vom Adventure-Land-Browserkontext getrennt und ist mit der Wiederholungsmaschine offline ausfuehrbar.

Enthalten sind:

- deterministische Zielauswahl aus ausdruecklich erlaubten MonsterArten,
- Bewegung zu einem sichtbaren Ziel,
- normaler Angriff,
- Lebens- und Manawiederherstellung,
- Beuteaufnahme nach dem Verschwinden eines zuvor verfolgten Ziels,
- konservative Inventarbehandlung,
- XP-/Gold- und Laufzeiterfassung ueber die vorhandene Telemetrie,
- verstaendliche Meldungen fuer fehlende Voraussetzungen und Stillstand,
- Replay-Anbindung fuer Farmentscheidungen,
- eine explizit gesperrte aktive Adventure-Land-Ausfuehrungsgrenze,
- ein Zeittest-Helfer fuer 24-h-Schattenbetrieb und den anschliessenden begrenzten Aktivtest.

## Architektur

### 1. Fachlogik

`laufzeit/quelle/spiellogik/grundlegendes-farmen.ts` arbeitet nur mit:

- `Spielzustand`,
- `FarmKonfiguration`,
- explizitem `FarmAblaufZustand`,
- injiziertem Zeitpunkt.

Es gibt keine versteckte aktuelle Uhrzeit, keine Zufallsquelle und keine direkte Adventure-Land-Aktion.

**Pflichtregel:** Keine Farmentscheidung ruft Adventure Land direkt auf.

`planeGrundlegendenFarmSchritt(...)` liefert genau eine nachvollziehbare Entscheidung. Falls eine Spielaktion erforderlich ist, wird lediglich eine normale `AktionsAnfrage` fuer die zentrale `AktionsSteuerung` erzeugt.

### 2. Expliziter Farmzustand

Der Ablaufzustand enthaelt nur die Informationen, die zwischen zwei Beobachtungen fuer den einfachen Farmablauf benoetigt werden:

- Startzeitpunkt,
- letzter beobachteter Fortschritt,
- Fortschrittskennung,
- zuletzt verfolgte Zielkennung.

Er ist Teil der Ausgabe der Fachlogik und wird im Replay in den Entscheidungsdetails mitgefuehrt. Dadurch entsteht kein versteckter globaler Zustand.

**Pflichtregel:** Gleicher Spielzustand plus gleicher expliziter Farmzustand ergibt die gleiche Entscheidung.

### 3. Zielauswahl

Ein Ziel kommt nur infrage, wenn:

- seine MonsterArt ausdruecklich in der Farmkonfiguration erlaubt ist,
- seine Kennung bekannt ist,
- es als lebend erkennbar ist,
- Karte und Position bekannt sind,
- es auf derselben Karte wie der Charakter liegt.

Unter allen Kandidaten wird die kleinste Distanz gewaehlt. Bei gleicher Distanz entscheidet die Zielkennung lexikografisch. Dadurch ist die Auswahl deterministisch.

Block 6 erfindet kein Ziel und wandert nicht spekulativ in unbekannte Bereiche. Wenn kein geeignetes Ziel sichtbar ist, wartet der Ablauf und meldet nach Ueberschreiten der Stillstandsgrenze den fehlenden Fortschritt.

### 4. Wiederherstellung

Vor Bewegung oder Angriff wird geprueft:

1. Lebensanteil,
2. Manaanteil.

Liegt der Anteil unter der konfigurierten Schwelle, erzeugt die Fachlogik eine Aktionsanfrage fuer `FARM_LEBEN_WIEDERHERSTELLEN` beziehungsweise `FARM_MANA_WIEDERHERSTELLEN`. Die aktive Ausfuehrungsgrenze verwendet dafuer Adventure Lands `use_hp` / `use_mp` und nur bei fehlender Direktfunktion den vorhandenen gemeinsamen Fallback `use_hp_or_mp`.

Cooldown-, Klassen- und spaetere Kampfsicherheitslogik werden in Block 6 nicht vorgezogen.

### 5. Inventar

Block 6 prueft vor neuem Kampf und Loot, ob die konfigurierte Mindestzahl freier Inventarplaetze sicher bekannt und vorhanden ist.

**Pflichtregel:** Ein volles Inventar fuehrt in Block 6 niemals zu automatischem Verkauf, Zerstoeren oder Verschieben von Gegenstaenden.

Stattdessen wird der Farmablauf blockiert und der Nutzer bekommt eine klare Meldung. Bank-, Verkaufs- und weitergehende Inventarlogik gehoeren in spaetere Fahrplanbloecke.

### 6. Beuteaufnahme

Die Fachlogik merkt sich die zuletzt verfolgte Zielkennung. Ist dieses Ziel im naechsten Spielzustand nicht mehr als lebendes erlaubtes Ziel sichtbar und ist Inventarplatz vorhanden, wird einmal `FARM_BEUTE_AUFNEHMEN` angefordert. Danach wird die gemerkte Zielkennung geloescht und im folgenden Schritt wieder normal ein Ziel gewaehlt.

### 7. Zentrale Aktionssteuerung und aktive Ausfuehrung

Die Fachlogik fuehrt keine Spielaktion aus. Eine erzeugte `AktionsAnfrage` muss zuerst mit `AktionsSteuerung.reicheAnfrageEin(...)` eingereiht und durch `AktionsSteuerung.verarbeiteNaechsteAktion(...)` gestartet werden. Erst ein solcher gestarteter Steuerungsschritt darf an `AdventureLandFarmAusfuehrung` uebergeben werden.

**Pflichtregel:** Aktive Farmaktionen werden nur nach einer gestarteten Anfrage der zentralen `AktionsSteuerung` ausgefuehrt.

`AdventureLandFarmAusfuehrung` ist zusaetzlich standardmaessig gesperrt. Echte Adventure-Land-Aufrufe sind nur moeglich, wenn sie mit `{ aktivFreigegeben: true }` konstruiert wurde. Diese explizite Freigabe ist fuer den begrenzten Aktivtest vorgesehen, nicht fuer Replay oder Schattenbetrieb.

Die Ausfuehrungsgrenze akzeptiert ausschliesslich die fuenf Block-6-Aktionsnamen:

- `FARM_BEWEGEN`,
- `FARM_ANGREIFEN`,
- `FARM_LEBEN_WIEDERHERSTELLEN`,
- `FARM_MANA_WIEDERHERSTELLEN`,
- `FARM_BEUTE_AUFNEHMEN`.

Fehler fuehren zum Abbruch der laufenden zentralen Aktionsanfrage und geben dadurch deren Ressourcen wieder frei.

## Telemetrie und Tagesbericht

`telemetrie/farm-leistungs-erfassung.ts` erzeugt aus zwei aufeinanderfolgenden Spielzustaenden die bereits in Block 4 definierten Eintraege:

- `LaufzeitAbschnitt`,
- `LeistungsZaehlerEintrag`.

Dadurch werden keine parallelen Statistikvertraege eingefuehrt. Die vorhandene `TelemetrieSpeicher.fasseLeistungZusammen(...)` kann daraus bereits Erfahrung/Stunde und Gold/Stunde fuer Tagesberichte berechnen.

Bei genau einem Stufenaufstieg wird der XP-Gewinn aus Rest-XP der alten Stufe plus aktuellem XP-Wert berechnet. Mehrere Stufen zwischen zwei Beobachtungen werden nicht geraten; in diesem Fall wird nur sicher bestimmbarer Gewinn erfasst.

## Replay

`erstelleFarmWiederholungsEntscheider(...)` bindet dieselbe Fachlogik direkt an Block 5 an. Der explizite `FarmAblaufZustand` wird aus der letzten Replay-Entscheidung desselben Charakters rekonstruiert. Replay ruft niemals `AdventureLandFarmAusfuehrung` auf.

Die Block-6-Tests decken Zielwahl, Bewegung, Angriff, Wiederherstellung, Loot, Inventargrenze, fehlende Daten, Stillstand sowie reproduzierbare Replay-Entscheidungen ab.

## Live-Test

Vor einem Live-Test zuerst die bestehende `v4/werkzeuge/adventure-land-testkonsole.js` laden. Danach `v4/werkzeuge/block6-live-test.js` laden.

Der Helfer stellt bereit:

- `V4Block6LiveTest.starteSchatten24h()` fuer den geforderten 24-Stunden-Schattenlauf,
- `V4Block6LiveTest.starteAktivBegrenzt()` fuer den anschliessenden begrenzten Einzelcharakter-Test,
- `V4Block6LiveTest.stoppe("Grund")` fuer einen kontrollierten manuellen Stopp.

Die Titelleiste zeigt waehrend eines laufenden Tests sichtbar `Block 6 · Restzeit ...`. Nach Ablauf steht dort eindeutig `Block 6 · beendet`, nach manuellem Stopp `Block 6 · gestoppt`.

Der Timer zeigt nur die Restzeit an, protokolliert Start/Ende und beeinflusst keinerlei Farmentscheidung oder Spielaktion.

### 30-Minuten-Ranger-Schattenlauf

Fuer den ersten realen Browser-Smoke-Test gibt es zusaetzlich `v4/werkzeuge/block6-schattenlauf-ranger.js`. Dieser Vorabtest ersetzt nicht den spaeteren Langzeittest, reduziert den ersten Lauf aber bewusst auf 30 Minuten.

Der Runner ist read-only. Er liest `character`, `entities`, Serverdaten und Inventar, bildet die Block-6-Entscheidungsreihenfolge fuer Zielwahl, Bewegung, Angriff, Wiederherstellung, Loot, Inventargrenze und Stillstand im Adventure-Land-Browser nach und protokolliert nur die Aktionen, die der Bot anfordern wuerde. Er ruft keine Adventure-Land-Spielaktion auf.

Der Runner ist fuer diesen ersten Test absichtlich auf `ranger` begrenzt und verlangt mindestens eine ausdruecklich erlaubte MonsterArt. Dadurch wird kein Ziel automatisch geraten.

Startreihenfolge im Ranger-Codekontext:

1. `v4/werkzeuge/adventure-land-testkonsole.js` laden.
2. `v4/werkzeuge/block6-schattenlauf-ranger.js` laden.
3. Mit `V4Block6SchattenRanger.sichtbareMonsterArten()` die aktuell sichtbaren `mtype`-Werte anzeigen.
4. Mit beispielsweise `V4Block6SchattenRanger.starte(["goo"])` den 30-Minuten-Schattenlauf starten.
5. Nach Ende `V4Block6SchattenRanger.ergebnis()` ausgeben und den Bericht ueber die Testkonsole kopieren.

Der Bericht enthaelt unter anderem Entscheidungszaehler, Meldungszaehler, Zielzaehler, Stillstaende, Fehler, Zustandswechsel sowie Start-/Endwerte fuer XP und Gold. Die Sicherheitsmarkierung `echteSpielaktionenAusgefuehrt: false` ist Bestandteil des Berichts.

### Reihenfolge der Abnahme

1. `npm run pruefen` erfolgreich.
2. Replay-Szenarien erfolgreich und reproduzierbar.
3. 30-Minuten-Ranger-Schattenlauf als Browser-Smoke-Test ohne ungefangenen Fehler; Bericht pruefen.
4. Fuer die endgueltige Langzeit-Abnahme weiterhin 24 Stunden realer Schattenbetrieb eines einzelnen Charakters ohne ungefangenen Fehler; Leistungsdaten pruefen.
5. Erst danach `AdventureLandFarmAusfuehrung` fuer einen zeitlich begrenzten Einzelcharakter-Test explizit aktiv freigeben.
6. Nach dem Aktivtest Telemetrie, Stillstandsmeldungen, Ressourcenfreigaben und XP-/Gold-Raten pruefen.

Der Zeittest-Helfer ersetzt weder den realen Langzeit-Schattenlauf noch den begrenzten Aktivtest; er stellt nur die vorgeschriebene sichtbare Zeitbegrenzung und den eindeutigen Endzustand sicher.
