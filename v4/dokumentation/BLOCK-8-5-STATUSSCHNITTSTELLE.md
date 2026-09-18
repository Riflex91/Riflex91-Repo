# Block 8.5 – gemeinsame StatusSchnittstelle

Status: **8.5.5 implementiert als austauschbare read-only Sicht ohne Spiel-, Bedien- oder Neustartautoritaet**.

## Ziel

Ingame-HUD, spaeteres Web-Command-Center und externer Host-Supervisor sollen denselben V4-Kern beobachten koennen, ohne Fachlogik zu duplizieren oder eigene Autoritaet ueber Spielaktionen zu erhalten.

Die gemeinsame StatusSchnittstelle fasst nur bereits vorhandene Kernzustaende zusammen.

Sie entscheidet nicht neu und veraendert keinen Laufzeitzustand.

## Eingaben

Die StatusSchnittstelle liest:

- aktuellen `Spielzustand`,
- `RuntimeGesundheitsZustand`,
- optionale `GruppenKoordinationsEntscheidung`,
- optionalen `EntscheidungsDatensatz`,
- vorhandene `AktionsLaufZustand`-Werte,
- Ergebnis des `RecoveryCheckpointSpeicher.lade()`,
- optionale letzte `BotMeldung`.

Diese Objekte bleiben Eigentum ihrer jeweiligen V4-Module.

## Ausgaben

Die gemeinsame Sicht enthaelt:

- Charakterstatus,
- Runtime-/Recovery-Zustand,
- Gruppenstatus,
- aktuelle Entscheidung,
- Aktionsphasen,
- Checkpoint-Zustand,
- letzte nutzerlesbare BotMeldung.

Der Top-Level-Vertrag setzt explizit:

- `nurLesen: true`
- `spielAutoritaet: false`
- `bedienAutoritaet: false`
- `neustartAutoritaet: false`

Diese Werte sind Teil des Vertrags und nicht konfigurierbar.

## Charakterstatus ohne Informationsverlust

V4 unterscheidet bereits zwischen:

- `bekannt`,
- `fehlend`,
- `unbekannt`.

Die StatusSchnittstelle behaelt diese Unterscheidung bei.

Ein bekannter `null`-Wert bleibt deshalb ein bekannter Wert und wird nicht mit fehlend oder unbekannt gleichgesetzt.

Fuer ausgewaehlte Charakterfelder werden jeweils ausgegeben:

- Wissenszustand,
- Quelle,
- Sicherheit,
- Wert,
- Grund.

Ist das gesamte Charakterobjekt nicht verfuegbar, werden die Einzelfelder nicht als bekannte Nullwerte erfunden.

## Runtime und Recovery

Die StatusSicht kopiert die vorhandene `RuntimeGesundheit`:

- Recovery-Stufe,
- Begruendung,
- Freshness-Alter,
- Gruppen-Liveness,
- Safety,
- offene/abgebrochene Arbeit,
- Nutzer-Handlungsbedarf,
- Host-Neustartempfehlung.

`automatischerNeustart` bleibt immer `false`.

Die Schnittstelle startet selbst nichts neu.

## Gruppenstatus

Bei vorhandener `GruppenKoordinationsEntscheidung` werden beobachtbar:

- Betriebsart,
- Begruendung,
- gemeinsame Gefahrenstufe,
- gemeinsames Ziel,
- aktive Teilnehmer,
- Teilnehmerbewertungen,
- Aufgabenverteilung.

Teilnehmerlisten werden nur fuer stabile Anzeige nach Kennung sortiert.

Die Sortierung aendert weder Gruppenrollen noch Gruppenentscheidungen.

Fehlt eine Gruppenentscheidung, lautet `verfuegbar: false`; es wird keine Ersatzentscheidung erzeugt.

## Entscheidungsstatus

Vom `EntscheidungsDatensatz` werden nur beobachtbare Identitaets- und Korrelationsinformationen dargestellt:

- Entscheidungskennung,
- Art,
- Quelle,
- gewaehlte Entscheidung,
- Grund,
- fachlicher Fingerabdruck,
- verknuepfte AktionsAnfrage-Kennungen.

Die StatusSchnittstelle erzeugt keine neue Entscheidung und veraendert keine fachlichen Fingerabdruecke.

## Aktionsstatus

Aus `AktionsLaufZustand` werden nur fuer Diagnose und Anzeige benoetigte Felder ausgegeben:

- Kennung,
- Aktionsname,
- Phase,
- Wichtigkeit,
- Prioritaet,
- Zustandsgrund,
- benoetigte Ressourcennamen.

Nicht gespiegelt werden:

- `details`,
- interne ausfuehrungsspezifische Nutzlasten,
- Methoden oder Funktionsreferenzen.

Die Liste wird fuer reproduzierbare Anzeige nach Kennung sortiert.

## Recovery-Checkpoint

Der Status zeigt nur:

- Ladestatus,
- Grund,
- Slot,
- Fallback-Nutzung,
- Sequenz,
- Speicherzeit,
- feste Sicherheitsflags,
- Kennungen offener AktionsAnfragen.

Der vollstaendige Checkpoint-Inhalt wird nicht als Oberflaechenobjekt durchgereicht.

Damit bleibt insbesondere sichtbar:

- `wiederaufnahmeErlaubt: false`
- `abgleichErforderlich: true`
- `aktionsAutoritaet: false`

wenn ein gueltiger Checkpoint geladen wurde.

## BotMeldung

Die letzte `BotMeldung` wird in ihren nutzerlesbaren Pflichtfeldern gespiegelt.

`technischeDetails` werden nicht ungeprueft in die Oberflaechen-Sicht uebernommen.

Spaetere Oberflaechen koennen dadurch Warnungen anzeigen, ohne beliebige interne Datenstrukturen zu kennen.

## Determinismus

Fuer stabile Anzeige werden sortiert:

- aktive Teilnehmerkennungen,
- Teilnehmerbewertungen nach Kennung,
- AktionsAnfragen in der Entscheidungsanzeige,
- Aktionsstatus nach Kennung,
- offene AktionsAnfragen des Checkpoints.

Die Eingabeobjekte selbst werden nicht umsortiert oder veraendert.

## Sicherheitsgrenze

`NurLeseStatusSchnittstelle` besitzt genau eine fachliche Methode:

`lese(...)`

Sie besitzt keine Methoden fuer:

- Pause,
- Fortsetzen,
- AktionsAnfragen,
- Spielaktionen,
- RessourcenSperren,
- Neustarts,
- Updates.

Die veraendernde Basisbedienung beginnt erst in Schritt 8.5.7 und muss durch `BedienSicherung` und zentrale Laufzeit-/Aktionssteuerung laufen.

## Tests

`block8-5-status-schnittstelle.test.mjs` prueft:

- gemeinsame read-only Sicht ueber die vorhandenen Kernzustaende,
- feste Autoritaetsflags,
- Erhalt von bekannt/fehlend/unbekannt,
- bekannten `null`-Wert ohne Bedeutungsverlust,
- fehlendes Gesamtcharakterobjekt ohne erfundene Werte,
- deterministische Sortierung ohne Mutation der Quellen,
- Ausschluss von Aktions-`details` und `technischeDetails`,
- explizit leere optionale Kernzustaende,
- Schnittstelle mit nur `lese`,
- fail-safe Ablehnung ungueltiger Status-Metadaten.

## Naechster Schritt

**8.5.6 – schlankes Ingame-HUD.**

Das HUD darf diese StatusSchnittstelle lesen, aber keine V4-Fachlogik duplizieren. Schliessen oder Fehler des HUD duerfen die laufende Bot-Logik nicht beeinflussen.
