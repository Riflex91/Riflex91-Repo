# Block 8.5 – sichere Basisbedienung · Kern

Status: **8.5.7 in Arbeit – zentraler Bedien-/Pause-Kern implementiert; HUD-Bedienadapter folgt getrennt.**

## Ziel

Die erste veraendernde V4-Bedienung darf nicht als direkter Browser-Callback auf Produktionsfunktionen entstehen.

Der verbindliche Kernpfad lautet:

`BedienAnfrage -> BedienSicherung -> LaufzeitSteuerung / AktionsSteuerung`

Dieser PR implementiert genau diesen Kern. Die sichtbaren HUD-Schaltflaechen werden erst danach auf diesen Pfad gesetzt.

## Warum keine direkte Produktionsruntime-Pause

Die vorhandene `V4ProduktionsLaufzeit.pausiereLebensnachweisAutomatik()` pausiert nur den Gruppenheartbeat. Sie ist fuer Stoerungs-/Recovery-Tests gedacht und ist **keine allgemeine Bot-Pause**.

Die neue Basisbedienung ruft diese Methode deshalb nicht auf.

Eine Bot-Pause muss zentral bestimmen, ob normale Arbeit gestartet oder fortgesetzt werden darf.

## LaufzeitSteuerung

`LaufzeitSteuerung` besitzt zwei Betriebszustaende:

- `laeuft`
- `pausiert`

Der Status ist versioniert und enthaelt:

- Zustand,
- monotone `generation`,
- letzten Aenderungszeitpunkt,
- Grund,
- `automatischeFortsetzung: false`.

Es gibt keine Timer- oder automatische Wiederaufnahme.

### Aktionsgate waehrend Pause

Wenn die Laufzeit pausiert ist:

- `notfall` bleibt zugelassen,
- `sicherheit` bleibt zugelassen,
- `normal` wird blockiert,
- `hintergrund` wird blockiert.

Damit kann eine Nutzerpause nie Sicherheitsarbeit abschalten.

## Integration in AktionsSteuerung

Die vorhandene zentrale `AktionsSteuerung` erhaelt optional dieselbe `LaufzeitSteuerung`.

Ohne explizit uebergebene LaufzeitSteuerung wird eine standardmaessig laufende Instanz verwendet; bestehendes Verhalten bleibt damit unveraendert.

Bei gemeinsamer Pause gilt:

- neue normale/Hintergrund-Anfragen werden sofort als `abgebrochen` gespeichert und nicht fuer spaeter gesammelt,
- Sicherheits-/Notfall-Anfragen duerfen weiter warten und verarbeitet werden,
- bereits wartende, blockierte oder laufende normale/Hintergrund-Arbeit kann zentral ueber `brecheNormaleArbeitFuerPauseAb(...)` beendet werden,
- laufende Ressourcensperren dieser Arbeit werden ueber den bestehenden Abbruchpfad freigegeben.

Fortsetzen belebt keinen alten abgebrochenen Vorgang wieder.

Nur neue AktionsAnfragen koennen danach wieder normal angenommen werden.

## BasisBedienAktionen

Der Kern kennt genau:

- `diagnose_aktualisieren`
- `laufzeit_pausieren`
- `laufzeit_fortsetzen`

### Diagnose aktualisieren

- Risiko: `unkritisch`
- rein lesend,
- veraendert weder LaufzeitGeneration noch Aktionszustand.

### Laufzeit pausieren

- Risiko: `unkritisch`,
- Voraussetzung: Laufzeit ist aktuell `laeuft`,
- Pause ist fail-safe: normale/Hintergrundarbeit wird beendet,
- Sicherheits-/Notfallarbeit bleibt unberuehrt.

Pause ist absichtlich unkritisch eingestuft, weil sie normale Arbeit nur einschraenkt und keine neue Spielautoritaet freigibt.

### Laufzeit fortsetzen

- Risiko: `vorsicht`,
- Voraussetzung: Laufzeit ist aktuell `pausiert`,
- braucht `ausdruecklichBestaetigt: true`,
- gibt nur **neue** normale/Hintergrundarbeit wieder frei.

Alte abgebrochene Arbeit bleibt beendet.

## Schutz vor veralteten Ansichten

Jede erzeugte `BasisBedienAnfrage` traegt:

- `erwarteteLaufzeitGeneration`.

Beim Ausfuehren wird die Voraussetzung `laufzeit-generation-aktuell` gegen den **aktuellen** Laufzeitstatus neu berechnet.

Hat sich der Zustand inzwischen geaendert:

- blockiert `BedienSicherung` die Anfrage,
- die alte Ansicht muss aktualisiert werden,
- die alte Anfrage darf keinen neueren Zustand ueberschreiben.

Damit gilt die allgemeine V4-Regel gegen veraendernde Aktionen aus veralteten Ansichten bereits fuer die lokale Basisbedienung.

## Schutz vor manipulierten BedienAnfragen

`SichereBasisBedienung` vertraut nicht blind den vom Aufrufer gelieferten Feldern wie:

- Risiko,
- Titel,
- Erklaerung,
- Auswirkung,
- Voraussetzungen.

Vor der Entscheidung rekonstruiert sie aus:

- Basisaktion,
- Vorgangskennung,
- Zeitpunkt,
- erwarteter LaufzeitGeneration,
- Bestaetigungszustand,
- aktuellem Laufzeitstatus

eine kanonische `BasisBedienAnfrage`.

**Diese kanonische Anfrage** wird an die vorhandene `BedienSicherung` uebergeben.

Ein Aufrufer kann daher zum Beispiel `laufzeit_fortsetzen` nicht durch ein manipuliertes `risiko: unkritisch` ohne Bestaetigung freigeben.

## Doppelklick- und Wiederholungsschutz

Jede Bedienaktion besitzt eine `vorgangsKennung`.

Bereits verarbeitete Kennungen werden nicht erneut ausgefuehrt.

Ein Wiederholungsversuch liefert:

- `status: wiederholt`.

Der lokale Idempotenzspeicher ist hart begrenzt. Standard:

- **100 Vorgangskennungen**.

Eine unbegrenzt wachsende Bedienhistorie entsteht damit nicht.

## Zeitkonsistenz

Zustandswechsel der `LaufzeitSteuerung` duerfen zeitlich nicht vor der letzten bereits registrierten Zustandsaenderung liegen.

Ein rueckwaertiger Pause-/Fortsetzungszeitpunkt wird fail-safe abgewiesen.

## Gemeinsame Instanz als Pflicht

`SichereBasisBedienung` und `AktionsSteuerung` muessen dieselbe `LaufzeitSteuerung` verwenden.

Eine falsch verdrahtete Kombination wird bereits beim Erzeugen der sicheren Basisbedienung abgewiesen.

Damit kann die Bedienung nicht "pausiert" melden, waehrend die zentrale AktionsSteuerung auf einer anderen Instanz weiterlaeuft.

## Sicherheitsgrenze

Dieser Kern:

- ruft keine Adventure-Land-Spielaktion auf,
- ruft keinen Produktionsheartbeat direkt auf,
- besitzt keinen `send_cm`-Pfad,
- startet oder stoppt keinen Browser/Host,
- fuehrt keinen automatischen Neustart aus,
- verwendet keine UI-/DOM-Funktion.

Die einzige veraendernde Wirkung ist die zentrale Freigabe bzw. Sperre normaler Arbeit sowie der bestehende zentrale Aktionsabbruch.

## Tests

`block8-5-basisbedienung-kern.test.mjs` prueft unter anderem:

- Laufzeit startet freigegeben,
- Pause blockiert normal/hintergrund,
- Pause laesst Notfall/Safety zu,
- neue normale Arbeit wird waehrend Pause nicht gesammelt,
- vorhandene normale Arbeit wird beim Pause-Befehl zentral abgebrochen,
- Sicherheitsarbeit bleibt erhalten,
- Fortsetzen braucht ausdrueckliche Bestaetigung,
- Fortsetzen belebt alte Arbeit nicht wieder,
- Diagnose bleibt read-only,
- doppelte Vorgangskennung fuehrt nicht doppelt aus,
- Idempotenzspeicher bleibt begrenzt,
- falsch verdrahtete LaufzeitSteuerungen werden abgewiesen,
- stale LaufzeitGeneration blockiert eine alte Bedienanfrage,
- manipuliertes Risiko umgeht `BedienSicherung` nicht,
- rueckwaertige Zustandszeitpunkte werden abgewiesen.

## Noch offen in 8.5.7

Als naechster kleiner PR folgt der **HUD-Bedienadapter**:

- Diagnose aktualisieren,
- Pause anfordern,
- Fortsetzen mit ausdruecklicher Bestaetigung.

Der Adapter darf keine Laufzeitmethode direkt aufrufen. Er darf nur kanonische Anfragen an `SichereBasisBedienung` uebergeben und das strukturierte Ergebnis anzeigen.

Erst nach dieser Anbindung wird Schritt 8.5.7 als vollstaendig implementiert markiert.
