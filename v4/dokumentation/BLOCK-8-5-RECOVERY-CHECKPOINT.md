# Block 8.5 – Recovery-Checkpoint v1

Status: **8.5.4 implementiert als versionierter, integritaetsgesicherter Wiederanlauf-Beleg ohne Aktionsautoritaet**.

## Ziel

Ein Neustart darf offene oder unterbrochene Vorgaenge nicht stillschweigend als erfolgreich behandeln und darf alte Laufzeitautoritaet nicht wiederbeleben.

Der Recovery-Checkpoint speichert deshalb nur kleine, eindeutig pruefbare Wiederanlauf-Belege:

- Charakterkennung,
- Ablaufkennung,
- letzte Entscheidungskennung,
- fachlicher Entscheidungs-Fingerabdruck,
- beobachtete Recovery-Stufe,
- Kennungen offener AktionsAnfragen,
- letzte bekannte Ereignisnummer.

Nicht gespeichert werden ausfuehrbare Aktionsobjekte, RessourcenSperren, Adventure-Land-Funktionen oder andere fluechtige Autoritaet.

## Verbindliche Sicherheitsflags

Jede gespeicherte Nutzlast enthaelt fest:

- `wiederaufnahmeErlaubt: false`
- `abgleichErforderlich: true`
- `aktionsAutoritaet: false`

Diese Werte werden beim Laden erneut validiert. Ein Checkpoint, der davon abweicht, ist ungueltig.

Damit bedeutet ein erfolgreich geladener Checkpoint **nicht**, dass alte Arbeit automatisch fortgesetzt werden darf. Er ist nur Beleg fuer den nachfolgenden Abgleich.

## Integritaet

Die Nutzlast wird mit dem bereits vorhandenen kanonischen JSON serialisiert.

Ueber genau diesen serialisierten Inhalt wird SHA-256 berechnet. Gespeichert wird eine Huelle mit:

- `schemaVersion: 1`
- `sha256`
- `serialisiert`

Beim Laden muessen Schema, Hash und Nutzlaststruktur gemeinsam stimmen. Eine manipulierte, abgeschnittene oder unvollstaendige Nutzlast wird nicht teilweise rekonstruiert.

## A/B-Slots

Der Speicher verwendet zwei wechselnde Slots:

- `A`
- `B`

und einen kleinen Zeiger auf den zuletzt bestaetigten Slot.

Beim Speichern wird zuerst der jeweils andere Slot geschrieben und erst danach der Zeiger umgestellt.

Dadurch bleibt der vorherige bestaetigte Checkpoint erhalten, wenn der neue Schreibvorgang vor der Zeigeraktualisierung scheitert.

Beim Laden gilt:

1. der aktuelle Zeiger-Slot wird bevorzugt,
2. ist er ungueltig, wird ein gueltiger zweiter Slot als Fallback verwendet,
3. sind vorhandene Slots beide ungueltig, lautet das Ergebnis `beschaedigt`,
4. existieren keine Checkpoint-Daten, lautet das Ergebnis `nicht_vorhanden`.

Ein Fallback wird explizit als `fallbackVerwendet: true` sichtbar.

## Monotone Sequenz

Jeder neu gespeicherte Checkpoint erhaelt eine streng steigende `sequenz`.

Die naechste Sequenz wird aus den noch gueltig lesbaren Slots bestimmt. Sie dient nur der Nachvollziehbarkeit und gibt keine Aktionsautoritaet.

## Speichergrenze

Der Checkpoint besitzt ein festes Byte-Limit.

Die Groesse wird vor dem Schreiben ueber die UTF-8-Bytes der kompletten Huelle gemessen.

Ist der Checkpoint zu gross:

- wird nichts geschrieben,
- der Zeiger wird nicht veraendert,
- das Ergebnis lautet `zu_gross`,
- ein vorheriger gueltiger Checkpoint bleibt erhalten.

Ein Schreibfehler wird als `speicher_fehler` zurueckgegeben. Die lokale Spiellogik wird dadurch nicht automatisch fortgesetzt und der Fehler wird nicht als erfolgreicher Checkpoint ausgegeben.

## Offene Arbeit

Offene Arbeit wird ausschliesslich als sortierte, deduplizierte Liste von `AktionsAnfrage`-Kennungen gespeichert.

Es werden insbesondere nicht gespeichert:

- `aktion`,
- `details`,
- `benoetigteRessourcen`,
- Funktionsreferenzen,
- laufende RessourcenSperren,
- Freigabestatus fuer echte Adventure-Land-Aktionen.

Nach einem Neustart muss ein spaeterer Recovery-Abgleich die aktuelle Welt, Safety, Gruppen-Liveness und zentrale AktionsSteuerung erneut beobachten.

## Bezug zu V3

Aus `v3/src/ops/reliability-checkpoint.js` wurden bewusst nur die bewaehrten Prinzipien uebernommen:

- versionierter Checkpoint,
- Integritaetspruefung,
- A/B-Fallback,
- begrenzte Groesse,
- sichtbarer Speicherfehler,
- keine automatische Wiederaufnahme,
- externer beziehungsweise spaeterer Abgleich vor Fortsetzung.

Nicht uebernommen wurden V3-Hotfix-Strukturen oder implizite Runtime-Autoritaeten.

V4 verwendet fuer die Integritaet die bereits vorhandene SHA-256-Implementierung statt des alten V3-Kurzchecksums.

## Sicherheitsgrenze

`RecoveryCheckpointSpeicher`:

- ruft keine Adventure-Land-Spielaktion auf,
- erzeugt keine AktionsAnfrage,
- reicht keine AktionsAnfrage ein,
- verarbeitet keine AktionsAnfrage,
- setzt keine RessourcenSperre,
- startet keinen Prozess, Browser oder Host neu,
- verwendet kein `Date.now()` und keine Zufallswerte als versteckte Eingabe.

Zeitpunkt und Grund werden vom Aufrufer explizit uebergeben.

## Tests

`block8-5-recovery-checkpoint.test.mjs` prueft:

- versionierte Speicherung mit SHA-256,
- feste Sicherheitsflags ohne Aktionsautoritaet,
- A/B-Wechsel und monotone Sequenz,
- Fallback bei beschaedigtem aktuellen Slot,
- fail-safe `beschaedigt` bei zwei ungueltigen Slots,
- manipulierte Nutzlast,
- formal gehashte aber unvollstaendige Nutzlast,
- Byte-Limit ohne Verlust des letzten gueltigen Checkpoints,
- Schreibfehler beim Zeiger ohne Aktivierung des unbestaetigten neuen Slots,
- Speicherung offener Arbeit nur als Kennungen,
- Deduplizierung und Sortierung,
- ungueltige Fingerabdruecke/Ereignisnummern,
- fehlende Daten als `nicht_vorhanden`.

## Naechster Schritt

**8.5.5 – gemeinsame StatusSchnittstelle.**

Sie soll RuntimeGesundheit, Recovery-Stufe, Gruppenstatus, aktuelle Entscheidung/Aktion und Checkpoint-Zustand read-only fuer HUD, spaeteres Web-Command-Center und externen Supervisor zusammenfassen.
