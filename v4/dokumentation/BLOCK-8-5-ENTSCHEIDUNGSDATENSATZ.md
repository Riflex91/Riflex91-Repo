# Block 8.5 – EntscheidungsDatensatz v1

Status: **8.5.1 implementiert; die darauf aufbauende Aktions-/Ergebnis-Korrelation aus 8.5.2 ist inzwischen ebenfalls implementiert**.

## Ziel

Wichtige Gruppenentscheidungen sollen nicht nur als Laufzeittext sichtbar sein, sondern als versionierter, wiederholbarer Datensatz vorliegen.

Der Datensatz trennt bewusst:

- eine konkrete Entscheidungsinstanz mit Zeitpunkt und Kennung,
- den fachlichen Eingangszustand,
- die erkannte Entscheidung,
- das erwartete Ergebnis,
- spaetere AktionsAnfragen und tatsaechliche Ergebnisse.

Damit koennen zwei Laeufe fachlich verglichen werden, ohne dass reine Zeitstempel oder Laufzeitkennungen den Vergleich verfaelschen.

## Allgemeiner Vertrag

`vertraege/entscheidungs-datensatz.ts` definiert `EntscheidungsDatensatz`.

Pflichtfelder sind unter anderem:

- `schemaVersion: 1`
- `art`
- `entscheidungKennung`
- `ablaufKennung`
- `quelle`
- `zeitpunkt`
- `eingabeFingerabdruck`
- `fachlicherFingerabdruck`
- `situation`
- `erkannteEreignisse`
- `moeglichkeiten`
- `gewaehlteEntscheidung`
- `grund`
- `erwartetesErgebnis`
- `aktionsAnfrageKennungen`
- `tatsaechlichesErgebnis`

8.5.1 erzeugt `aktionsAnfrageKennungen` zunaechst leer und `tatsaechlichesErgebnis` als `null`. Schritt 8.5.2 verknuepft diese Felder anschliessend read-only mit der echten zentralen Aktionskette.

## Gruppen-EntscheidungsDatensatz

`telemetrie/gruppen-entscheidungs-datensatz.ts` erzeugt aus:

- den Gruppen-Lebensnachweisen,
- der echten `GruppenKoordinationsEntscheidung`,
- einer expliziten `ablaufKennung`

einen `GruppenEntscheidungsDatensatz`.

Die Erzeugung ist read-only. Sie:

- ruft keine Adventure-Land-Aktion auf,
- erzeugt keine AktionsAnfrage,
- reicht keine AktionsAnfrage ein,
- veraendert die Gruppenentscheidung nicht,
- verwendet weder `Date.now()` noch Zufall als versteckte fachliche Eingabe.

## Zwei Fingerabdruecke

### Eingabe-Fingerabdruck

Der `eingabeFingerabdruck` beschreibt die fachliche Situation.

Enthalten sind zum Beispiel:

- Teilnehmerkennung und Name,
- Klasse nur als beobachtete Diagnoseinformation,
- Server, Karte und Instanz,
- Lebenszustand,
- Lebens- und Manaanteil,
- Ziel,
- Gefahrenstufe,
- Faehigkeitsprofil,
- fachlicher Koordinationsstatus wie `aktiv` oder `veraltet`.

Bewusst **nicht** enthalten sind:

- `gesendetAm`,
- `laufendeNummer`,
- exaktes `alterMillisekunden`,
- Entscheidungszeitpunkt,
- laufzeitspezifische Aktionskennungen.

Die Freshness-Klasse bleibt trotzdem fachlich relevant: `aktiv` und `veraltet` erzeugen unterschiedliche Fingerabdruecke.

### Fachlicher Entscheidungs-Fingerabdruck

Der `fachlicherFingerabdruck` umfasst zusaetzlich:

- erkannte Ereignisse,
- betrachtete Betriebsarten,
- die gewaehlte Betriebsart,
- das erwartete fachliche Ergebnis.

Damit gilt:

- gleiche fachliche Eingaben + gleiche Entscheidung -> gleicher Fingerabdruck,
- andere reine Uhrzeit -> gleicher fachlicher Fingerabdruck,
- andere Eingabereihenfolge -> gleicher fachlicher Fingerabdruck,
- andere Safety/Freshness/Ziel-/Aufgabenlage -> anderer Fingerabdruck.

Beide Fingerabdruecke werden ueber das vorhandene kanonische JSON und die vorhandene SHA-256-Implementierung erzeugt.

## Entscheidungskennung

Die konkrete Instanzkennung lautet:

`gruppenentscheidung:<zeitpunkt>:<16-Zeichen-aus-fachlichem-Fingerabdruck>`

Sie identifiziert den konkreten Laufzeitmoment. Fuer den fachlichen Vergleich wird dagegen der 64-stellige Fingerabdruck verwendet.

## Erkannte Ereignisse

8.5.1 erzeugt nur deterministische, bereits belegte Gruppenereignisse, zum Beispiel:

- `teilnehmer:<kennung>:veraltet`
- `gruppen_sicherheit:kritisch`
- `gemeinsames_ziel:<kennung>`

Es werden keine unbekannten Ursachen oder Motive erfunden.

## Sicherheitsgrenze

Der EntscheidungsDatensatz ist Instrumentierung.

Er darf:

- beobachten,
- normalisieren,
- kanonisieren,
- hashen,
- erklaeren.

Er darf nicht:

- `attack`, `move`, `use_skill` oder andere Adventure-Land-Aktionen aufrufen,
- eine AktionsAnfrage erzeugen oder einreichen,
- Safety oder Ressourcenfreigaben veraendern,
- aus Telemetrie eine neue Spielentscheidung erfinden.

## Tests

Der Regressionstest `block8-5-entscheidungs-datensatz.test.mjs` prueft:

- Versionierung und Erklaerbarkeit,
- leere Aktions-/Ergebnis-Korrelation in 8.5.1,
- gleiche Fingerabdruecke bei verschobenen Zeitstempeln/laufenden Nummern,
- gleiche Fingerabdruecke bei anderer Eingabereihenfolge,
- andere Fingerabdruecke bei fachlich anderer Safety,
- Freshness-Klasse als fachlich relevante Information,
- fail-safe Ablehnung ungueltiger Metadaten.

## Weiterfuehrung

Die Entscheidung-Aktion-Ergebnis-Korrelation ist in `BLOCK-8-5-ENTSCHEIDUNG-AKTION-ERGEBNIS.md` dokumentiert. Die zentrale `AktionsSteuerung` bleibt dabei die einzige Autoritaet.
