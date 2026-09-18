# Block 8.5 – Freigabestufen · Adventure-Land-Nachweisrunner

Status: **Runner implementiert und offline testbar; Runtime 1.1.5 Candidate ist deployed und oeffentlich per HTTPS verifiziert; reale Schatten-/Live-/Soak-Ausfuehrung bleibt offen.**

## Zweck

Das Freigabe-Gate aus Schritt 8.5.9 braucht fuer den finalen Block-8.5-Aenderungsstand noch reale Nachweise fuer:

- Schattenbetrieb,
- begrenzten kontrollierten Live-Test,
- Soak-Test.

Dafuer existiert:

`v4/werkzeuge/block8-5-freigabestufen-live-test.js`

Globale API:

`V4Block85FreigabeLiveTest`

Version:

`1.0.0`

Der Runner besitzt selbst keinen Adventure-Land-Spielaktionsaufruf.

## Harte Runtime-Bindung

Der Runner akzeptiert ausschliesslich:

`V4ProduktionsLaufzeit.version === "1.1.5"`

Eine historische Runtime 1.1.4 wird abgewiesen.

Damit kann der bestandene immutable Block-8-Release nicht versehentlich als Live-Nachweis fuer die neuen Block-8.5-Bedienpfade verwendet werden.

Der Runner laedt oder veroeffentlicht selbst keine Runtime.

Der exakte Build-/Release-Nachweis fuer Runtime 1.1.5 liegt inzwischen vor; der reale Schattenlauf darf daher gegen den immutable Candidate vorbereitet werden.

Auch die Freigabestufe `offline` ist fuer `git:88185523c81687dc16f9647ca5e7568c5e2c228c` bereits kanonisch bestanden. Damit ist `schatten` die naechste zulaessige Stufe; kontrolliert live und Soak bleiben bis zu einem bestandenen Schattennachweis blockiert.

## Konfiguration

Vor dem Laden des Runners muss gesetzt sein:

```js
globalThis.AIO_V4_BLOCK85_FREIGABE_CONFIG = Object.freeze({
  aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c',
  laufKennung: 'eindeutiger-lauf',
  soakDauerMillisekunden: 600000
});
```

`aenderungsKennung` muss spaeter exakt dieselbe Kennung sein, die auch dem Offline-Nachweis und der Freigabeauswertung zugeordnet wird.

Fuer den Runtime-1.1.5-Candidate ist diese Kennung fest `git:88185523c81687dc16f9647ca5e7568c5e2c228c`. Der Candidate besitzt den verifizierten Runtime-SHA-256 `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`. Deployment und oeffentliche HTTPS-Verifikation sind durch Run `35402650432` fuer exakt diesen Candidate bestaetigt. Fuer zukuenftige V4-Releases ist ausschliesslich der isolierte manuelle `.github/workflows/release-v4-runtime.yml`-Pfad vorgesehen.

`laufKennung` trennt die Vorgangskennungen dieses konkreten Adventure-Land-Laufs.

Der Soak dauert mindestens:

**600000 ms = 10 Minuten**

und hoechstens eine Stunde.

Dieser 10-Minuten-Zwischennachweis ersetzt nicht die spaeteren uebergeordneten 24-Stunden-, 72-Stunden- oder 7-Tage-Systemkampagnen.

## Voraussetzung

Vor dem Runner muessen im Adventure-Land-Codekontext vorhanden sein:

- die exakt zu pruefende `V4ProduktionsLaufzeit` 1.1.5,
- `V4TestGui` aus `adventure-land-test-gui.js`,
- eine aktive Produktionsruntime mit laufendem Produktionsheartbeat,
- bei Browserbetrieb ein bestaetigt aktiviertes `performance_trick()`.

Der Runner blockiert fail-safe, wenn diese Voraussetzungen nicht eindeutig bestaetigt sind.

## Stufe 2 – Schattennachweis

Die Aktion:

**1 · Schattennachweis**

verwendet ausschliesslich:

- `basisBedienStatus()`
- `erstelleBasisBedienAnfrage(...)`
- `fuehreBasisBedienAnfrage(...)`

und fordert nur:

`diagnose_aktualisieren`

an.

PASS verlangt:

- Runtime 1.1.5,
- Runtime aktiv und nicht gestoppt,
- Produktionsheartbeat aktiv und nicht pausiert,
- Laufzeit `laeuft`,
- `automatischeFortsetzung: false`,
- Diagnose `status: ausgefuehrt`,
- unveraenderte Laufzeit-Generation.

Der erzeugte Nachweis setzt:

`spielAktionAusgefuehrt: false`

## Stufe 3 – kontrollierter Live-Nachweis

Die Aktion:

**2 · Kontrolliert live**

ist erst nach bestandenem Schattennachweis aktiv.

Sie verlangt den exakten Bestaetigungstext:

`BLOCK8-5-KONTROLLIERT-LIVE:<laufKennung>`

Der Runner fuehrt genau aus:

1. sichere `laufzeit_pausieren`-Anfrage mit der zuletzt beobachteten Generation,
2. Pruefung auf `pausiert` und Generation +1,
3. Pruefung, dass der Produktionsheartbeat weiter aktiv ist,
4. sichere `laufzeit_fortsetzen`-Anfrage mit `ausdruecklichBestaetigt: true`,
5. Pruefung auf `laeuft` und Generation +2.

Der Nachweis setzt:

`begrenzt: true`

und weiterhin:

`spielAktionAusgefuehrt: false`

### Fail-safe bei Fehler nach Pause

Schlaegt der Test nach bestaetigter Pause fehl, setzt der Runner die Runtime **nicht automatisch fort**.

Es gibt absichtlich keinen versteckten Cleanup-Fortsetzungspfad.

Die pausierte Runtime bleibt sichtbar pausiert und muss danach ueber den normalen sicheren Bedienpfad untersucht bzw. ausdruecklich fortgesetzt werden.

## Stufe 4 – Soak

Die Aktion:

**3 · Soak starten**

ist erst nach bestandenem kontrollierten Live-Test aktiv.

Sie verlangt:

`BLOCK8-5-SOAK-STARTEN:<laufKennung>`

Der Soak veraendert die Runtime nicht.

Alle 5 Sekunden werden read-only geprueft:

- Runtime weiterhin aktiv und nicht gestoppt,
- Produktionsheartbeat weiterhin aktiv und nicht pausiert,
- Laufzeit weiterhin `laeuft`,
- `automatischeFortsetzung: false`,
- keine unerwartete Aenderung der Laufzeit-Generation,
- keine neue Produktionsheartbeat-Sendefehlerzahl.

Am Ende muss zusaetzlich:

- die erwartete Sampling-Dichte erreicht sein,
- mindestens ein neuer bestaetigter Heartbeat-Erfolg vorliegen.

Nur dann setzt der Nachweis gleichzeitig:

- `telemetrieNachweis: true`
- `recoveryNachweis: true`
- `gesamtauswertungBestanden: true`

Der Recovery-Nachweis ist dabei an den unmittelbar vorher bestandenen kontrollierten Pause-/Fortsetzen-Pfad und die waehrend des Soaks unveraenderten Recovery-Grenzen gebunden.

## Keine direkte Spielautoritaet

Der Runner ruft nicht direkt auf:

- `attack()`
- `move()`
- `smart_move()`
- `use_skill()`
- Trankfunktionen,
- `loot()`
- `send_cm()`
- Party-Aktionen,
- Kauf/Verkauf/Upgrade/Compound.

Er ruft auch nicht auf:

- Heartbeat-Pause/Fortsetzung,
- Gruppenziel-Vorbereitung,
- Live-Smoke-Installation,
- Runtime-`stoppe()`.

Die einzige veraendernde Stufe verwendet den in 8.5.7 bereits abgesicherten Basisbedienungskanal.

## Tests

`v4/laufzeit/tests/block8-5-freigabestufen-live-test.test.mjs`

prueft unter anderem:

- Runtime 1.1.4 wird abgewiesen,
- Schatten bleibt read-only und veraendert die Generation nicht,
- kontrolliert live erzeugt genau Pause und bestaetigtes Fortsetzen,
- Live ist ohne Schatten blockiert,
- ein Fortsetzen-Fehler fuehrt nicht zu automatischer Wiederaufnahme,
- Soak erzeugt Nachweise erst nach Mindestdauer,
- unerwartete Generation macht den Soak rot,
- weniger als zehn Minuten werden abgewiesen,
- kein direkter Adventure-Land-Spielaktionsaufruf ist vorhanden.

## Aktueller operativer Stand

Der Runner ist vorbereitet und offline abgesichert.

Ein echter Schatten-/Live-/Soak-Lauf wird hier **noch nicht** als bestanden dokumentiert. `deploymentPerformed` und `publicHttpsVerified` stehen inzwischen auf `true`; die drei Adventure-Land-Nachweisfelder bleiben auf `false`. Der Runner kann jetzt gegen die immutable Candidate-URL ausgefuehrt werden.

Block 9 bleibt bis zu diesen realen Nachweisen weiterhin gesperrt.
