# Block 8.5 – sichere Basisbedienung · Produktionsruntime-Grenze

Status: **8.5.7 Produktionsruntime-Grenze implementiert; der sichtbare HUD-Bedienadapter ist inzwischen ebenfalls vorhanden.**

## Zweck

Der in Schritt 8.5.7 eingefuehrte sichere Bedienkern wird an die echte V4-Produktionsruntime angebunden, ohne dem HUD direkten Zugriff auf `LaufzeitSteuerung`, `AktionsSteuerung`, Heartbeat-Transport oder Adventure-Land-Aktionen zu geben.

Der Pfad bleibt:

`HUD -> BasisBedienAnfrage -> Produktionsruntime -> SichereBasisBedienung -> BedienSicherung -> LaufzeitSteuerung / AktionsSteuerung`

## Runtime-Version

Die aktuelle Entwicklungsruntime wird fuer diese neue Schnittstelle auf **1.1.5** angehoben.

Auch der Produktions-Bootstrap meldet **1.1.5**.

Der bereits bestandene Block-8-Abschluss bleibt historisch unveraendert auf:

- Runtime **1.1.4**
- Bootstrap **1.1.4**
- immutablem Block-8-Release `024c121246a3ad1b579e2dc8d32771b284b3f6e1`

Die historischen Block-8-Testwerkzeuge und Abschlussberichte werden nicht rueckwirkend auf 1.1.5 umgeschrieben.

## Eine gemeinsame LaufzeitSteuerung

`AdventureLandProduktionsBootstrap` besitzt jetzt genau eine `LaufzeitSteuerung`.

Die zentrale `AktionsSteuerung` wird mit genau dieser Instanz erzeugt:

`new AktionsSteuerung({ laufzeitSteuerung: this.laufzeitSteuerung })`

Dadurch kann die Bedienung nicht einen anderen Pause-Zustand veraendern als den, den die zentrale AktionsSteuerung bei jeder AktionsAnfrage prueft.

Der Bootstrap-Status zeigt die read-only `laufzeitSteuerung` mit Zustand, Generation, Aenderungszeitpunkt, Grund und `automatischeFortsetzung: false`.

## Oeffentliche Produktionsruntime-API

Die Runtime stellt fuer 8.5.7 genau drei sichere Bedienmethoden bereit:

- `basisBedienStatus()`
- `erstelleBasisBedienAnfrage(...)`
- `fuehreBasisBedienAnfrage(...)`

Es werden **keine** direkten `pausiere()`- oder `setzeFort()`-Methoden der `LaufzeitSteuerung` nach aussen gereicht.

### Anfrage erzeugen

Die Oberflaeche liefert nur:

- eindeutige Vorgangskennung,
- eine der drei erlaubten Basisaktionen,
- optional die zuletzt beobachtete Laufzeit-Generation,
- bei Fortsetzen die ausdrueckliche Bestaetigung.

Den Ausfuehrungszeitpunkt setzt die Produktionsruntime selbst mit ihrer lokalen Uhr.

Damit kann ein HUD keinen frei erfundenen historischen Zeitpunkt fuer eine veraendernde Bedienaktion einspeisen.

### Anfrage ausfuehren

Die Runtime uebergibt die Anfrage an `SichereBasisBedienung`.

Dort wird sie erneut kanonisch aufgebaut und durch die vorhandene `BedienSicherung` geprueft.

Der Aufrufer kann daher weder Risiko, Titel, Erklaerung noch Voraussetzungen manipulieren, um eine Freigabe zu umgehen.

## Produktions-Freigabe

`diagnose_aktualisieren` bleibt read-only verfuegbar, auch wenn die Produktionsruntime:

- nicht aktiv freigegeben ist,
- bereits gestoppt wurde.

Die veraendernden Aktionen:

- `laufzeit_pausieren`
- `laufzeit_fortsetzen`

werden bereits an der Produktionsgrenze blockiert, wenn:

- `aktivFreigegeben !== true`, oder
- der Bootstrap bereits gestoppt ist.

Diese Pruefung kommt zusaetzlich zur `BedienSicherung`.

## Bot-Pause ist keine Heartbeat-Pause

Die allgemeine Bot-Pause aus 8.5.7 und die historische Block-8-Methode `pausiereLebensnachweisAutomatik()` sind absichtlich getrennt.

Bei einer Bot-Pause:

- normale und Hintergrundarbeit wird zentral gesperrt,
- vorhandene normale Arbeit wird fail-safe beendet,
- Safety und Notfall bleiben erlaubt,
- der Produktionsheartbeat bleibt aktiv,
- der Lebensnachweis-Empfang bleibt aktiv.

Dadurch bleibt die pausierte Runtime weiterhin fuer Gruppen-Liveness und Diagnose sichtbar.

`pausiereLebensnachweisAutomatik()` bleibt ausschliesslich der bereits vorhandene kontrollierte Transport-/Stoerungspfad und wird von der Basisbedienung nicht aufgerufen.

## Stale-Schutz

Eine Oberflaeche darf ihre zuletzt beobachtete `erwarteteLaufzeitGeneration` mitsenden.

Hat sich die Laufzeit inzwischen geaendert, rekonstruiert die sichere Basisbedienung eine nicht erfuellte Voraussetzung `laufzeit-generation-aktuell`.

Die alte Anfrage wird blockiert, statt einen neueren Zustand zu ueberschreiben.

## Tests

Die Produktions-Tests pruefen unter anderem:

- Bootstrap und zentrale AktionsSteuerung teilen exakt dieselbe LaufzeitSteuerung,
- Runtime bietet nur den gesicherten Basisbedienungs-Kanal,
- Bot-Pause laeuft durch `BedienSicherung`,
- Produktionsheartbeat bleibt waehrend Bot-Pause aktiv,
- Fortsetzen ohne ausdrueckliche Bestaetigung bleibt blockiert,
- Fortsetzen mit Bestaetigung gibt neue normale Arbeit wieder frei,
- stale Laufzeit-Generation blockiert,
- gesperrte oder gestoppte Runtime verweigert veraendernde Basisbedienung,
- read-only Diagnose bleibt verfuegbar.

## Sicherheitsgrenze

Die neue Runtime-Grenze:

- fuegt keine Adventure-Land-Spielaktion hinzu,
- ruft `send_cm` nicht direkt auf,
- ruft keine Heartbeat-Pause fuer die Bot-Pause auf,
- startet keinen Browser-/Host-Neustart,
- bietet keine generische Methode zum direkten Veraendern von `AktionsSteuerung`,
- bietet keine automatische Fortsetzung.

## Abschluss

Der getrennte HUD-Bedienadapter verwendet inzwischen ausschliesslich die drei oben beschriebenen sicheren Produktionsruntime-Methoden. Diagnose, Pause und zweistufig bestaetigtes Fortsetzen sind damit an die Produktionsgrenze angebunden, ohne direkten Zugriff auf Heartbeat-, Aktions- oder Adventure-Land-Funktionen. Schritt 8.5.7 ist vollstaendig implementiert; als naechstes folgt 8.5.8 Recovery-Abnahme.
