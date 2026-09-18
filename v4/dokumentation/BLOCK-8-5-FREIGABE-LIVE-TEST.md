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

`1.1.0`

Der Runner besitzt selbst keinen direkten Adventure-Land-Spielaktionsaufruf. Die Semantik unterscheidet jetzt jedoch streng zwischen einem wirklich nicht sendenden Schattenmodus und einem aktiven Live-/Soak-Modus, dessen Produktionsheartbeat ueber die Runtime `send_cm(...)` verwendet.

## Harte Runtime-Bindung

Der Runner akzeptiert ausschliesslich:

`V4ProduktionsLaufzeit.version === "1.1.5"`

und verlangt zusaetzlich ueber `V4Bootstrap.status()` exakt:

- die immutable Candidate-URL `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js`,
- SHA-256 `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`.

Eine historische Runtime 1.1.4 oder eine andere Runtime-URL/SHA wird abgewiesen.

Damit kann der bestandene immutable Block-8-Release nicht versehentlich als Live-Nachweis fuer die neuen Block-8.5-Bedienpfade verwendet werden.

Der Runner laedt oder veroeffentlicht selbst keine Runtime.

Der exakte Build-/Release-Nachweis fuer Runtime 1.1.5 liegt inzwischen vor; der reale Schattenlauf darf daher gegen den immutable Candidate vorbereitet werden.

Auch die Freigabestufe `offline` ist fuer `git:88185523c81687dc16f9647ca5e7568c5e2c228c` bereits kanonisch bestanden. Damit ist `schatten` die naechste zulaessige Stufe; kontrolliert live und Soak bleiben bis zu einem bestandenen Schattennachweis blockiert.

## Konfiguration

Vor dem Laden des Runners muss fuer den Schattenlauf gesetzt sein:

```js
globalThis.AIO_V4_BLOCK85_FREIGABE_CONFIG = Object.freeze({
  aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c',
  laufKennung: 'eindeutiger-lauf',
  modus: 'schatten',
  soakDauerMillisekunden: 600000
});
```

Der Live-/Soak-Modus wird bewusst in einer **separaten aktiven Sitzung** geladen und braucht zusaetzlich die vom bestandenen Schattenlauf ausgegebene `schattenUebergabe`:

```js
globalThis.AIO_V4_BLOCK85_FREIGABE_CONFIG = Object.freeze({
  aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c',
  laufKennung: 'eindeutiger-lauf',
  modus: 'live',
  soakDauerMillisekunden: 600000,
  schattenUebergabe: /* exakt aus dem Schattenbericht */
});
```

`aenderungsKennung` ist auf den Candidate fest gepinnt. `laufKennung` und die importierte Schattenuebergabe muessen ebenfalls exakt zusammenpassen.

Fuer den Runtime-1.1.5-Candidate ist diese Kennung fest `git:88185523c81687dc16f9647ca5e7568c5e2c228c`. Der Candidate besitzt den verifizierten Runtime-SHA-256 `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`. Deployment und oeffentliche HTTPS-Verifikation sind durch Run `35402650432` fuer exakt diesen Candidate bestaetigt. Fuer zukuenftige V4-Releases ist ausschliesslich der isolierte manuelle `.github/workflows/release-v4-runtime.yml`-Pfad vorgesehen.

`laufKennung` trennt die Vorgangskennungen dieses konkreten Adventure-Land-Laufs.

Der Soak dauert mindestens:

**600000 ms = 10 Minuten**

und hoechstens eine Stunde.

Dieser 10-Minuten-Zwischennachweis ersetzt nicht die spaeteren uebergeordneten 24-Stunden-, 72-Stunden- oder 7-Tage-Systemkampagnen.

## Voraussetzung

Vor dem Runner muessen im Adventure-Land-Codekontext vorhanden sein:

- die exakt ueber `V4Bootstrap` geladene immutable `V4ProduktionsLaufzeit` 1.1.5,
- `V4TestGui` aus `adventure-land-test-gui.js`.

Die Betriebsart ist absichtlich unterschiedlich:

### Schatten-Sitzung

- `AIO_V4_RUNTIME_CONFIG.aktivFreigegeben: false`,
- Runtime nur laden, **nicht** `V4ProduktionsLaufzeit.starte()` aufrufen,
- kein installierter CM-Empfang,
- Produktionsheartbeat nicht aktiv und nicht pausiert,
- `lebensnachweisSendeVersuche = 0`,
- `lebensnachweisSendeErfolge = 0`,
- `lebensnachweisSendeFehler = 0`,
- kein `performance_trick()`-Aufruf,
- Laufzeit-Generation 0.

### Live-/Soak-Sitzung

- separate Sitzung,
- aktive Produktionsruntime,
- `V4ProduktionsLaufzeit.starte()` bereits erfolgt,
- CM-Empfang und Produktionsheartbeat aktiv,
- bei Browserbetrieb `performance_trick()` bestaetigt,
- gueltige `schattenUebergabe` aus dem vorherigen strikten Schattenlauf importiert.

Der Runner blockiert fail-safe, wenn die jeweilige Betriebsart nicht eindeutig bestaetigt ist.

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

- exakt gebundene immutable Runtime 1.1.5,
- Runtime **nicht aktiv freigegeben**,
- Runtime nicht gestartet und nicht gestoppt,
- kein installierter CM-Empfang,
- Produktionsheartbeat nicht aktiv,
- alle Heartbeat-Sendezaehler exakt 0,
- kein `performance_trick()`-Aufruf,
- keine Gruppen-Ziel-/Live-Smoke-Autoritaet,
- Laufzeit `laeuft`,
- Laufzeit-Generation exakt 0,
- `automatischeFortsetzung: false`,
- Diagnose `status: ausgefuehrt`,
- Generation bleibt 0.

Bei PASS erzeugt der Runner eine `schattenUebergabe`. Erst diese darf in einer neuen aktiven Sitzung den Live-Modus freischalten.

Der erzeugte Nachweis setzt:

`spielAktionAusgefuehrt: false`

## Stufe 3 – kontrollierter Live-Nachweis

Die Aktion:

**2 · Kontrolliert live**

ist nur im Modus `live` aktiv und verlangt die validierte `schattenUebergabe` aus einer vorherigen separaten Schatten-Sitzung.

Sie verlangt den exakten Bestaetigungstext:

`BLOCK8-5-KONTROLLIERT-LIVE:<laufKennung>`

Der Runner fuehrt genau aus:

1. sichere `laufzeit_pausieren`-Anfrage mit der zuletzt beobachteten Generation,
2. Pruefung auf `pausiert` und Generation +1,
3. Pruefung, dass der Produktionsheartbeat weiter aktiv ist,
4. sichere `laufzeit_fortsetzen`-Anfrage mit `ausdruecklichBestaetigt: true`,
5. Pruefung auf `laeuft` und Generation +2.

Der Nachweis setzt:

- `begrenzt: true`
- `spielAktionAusgefuehrt: true`

Das `true` ist absichtlich konservativ und ehrlich: Der Runner ruft zwar selbst kein `send_cm()` auf, aber die aktive Produktionsruntime betreibt waehrend Live den Produktionsheartbeat ueber Adventure Lands `send_cm(...)`.

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

- `spielAktionAusgefuehrt: true`
- `telemetrieNachweis: true`
- `recoveryNachweis: true`
- `gesamtauswertungBestanden: true`

Auch hier ist `spielAktionAusgefuehrt: true` wegen des laufenden Produktionsheartbeats korrekt.

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
- Schatten verlangt gesperrte, nicht gestartete Runtime mit exakt 0 Heartbeat-Sendeversuchen,
- Schatten lehnt aktive/gestartete Runtime fail-safe ab,
- Schatten ist an exakte immutable Candidate-URL und SHA-256 gebunden,
- Live verlangt eine gueltige Schattenuebergabe aus separater Sitzung,
- kontrolliert live erzeugt genau Pause und bestaetigtes Fortsetzen,
- Live-/Soak-Nachweise markieren `spielAktionAusgefuehrt: true`,
- ein Fortsetzen-Fehler fuehrt nicht zu automatischer Wiederaufnahme,
- Soak erzeugt Nachweise erst nach Mindestdauer,
- unerwartete Generation macht den Soak rot,
- weniger als zehn Minuten werden abgewiesen,
- kein direkter Adventure-Land-Spielaktionsaufruf ist im Runner vorhanden.

## Aktueller operativer Stand

Der Runner ist vorbereitet und offline abgesichert.

Ein echter Schatten-/Live-/Soak-Lauf wird hier **noch nicht** als bestanden dokumentiert. `deploymentPerformed` und `publicHttpsVerified` stehen inzwischen auf `true`; die drei Adventure-Land-Nachweisfelder bleiben auf `false`. Der Runner kann jetzt gegen die immutable Candidate-URL ausgefuehrt werden.

Block 9 bleibt bis zu diesen realen Nachweisen weiterhin gesperrt.
