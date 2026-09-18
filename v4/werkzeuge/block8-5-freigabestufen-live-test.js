(() => {
  'use strict';

  const API_NAME = 'V4Block85FreigabeLiveTest';
  const VERSION = '1.1.0';
  const LAUFZEIT_PFAD = 'block8.5-basisbedienung-runtime';
  const ERWARTETE_AENDERUNGS_KENNUNG = 'git:88185523c81687dc16f9647ca5e7568c5e2c228c';
  const ERWARTETE_RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';
  const ERWARTETE_RUNTIME_URL =
    'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js';
  const MODI = Object.freeze(['schatten', 'live']);
  const GUI_API_NAME = 'V4TestGui';
  const RUNTIME_API_NAME = 'V4ProduktionsLaufzeit';
  const ERWARTETE_RUNTIME_VERSION = '1.1.5';
  const CONFIG_NAME = 'AIO_V4_BLOCK85_FREIGABE_CONFIG';
  const SOAK_MIN_MILLIS = 10 * 60 * 1000;
  const SOAK_MAX_MILLIS = 60 * 60 * 1000;
  const SOAK_SAMPLE_MILLIS = 5_000;

  let vorgangsNummer = 0;

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Lokaler Kontext bleibt Fallback.
    }
    return null;
  }

  function holeGlobal(name) {
    try {
      if (globalThis?.[name] !== undefined) return globalThis[name];
    } catch {
      // Parent-Fallback.
    }
    const eltern = holeElternFenster();
    try {
      if (eltern?.[name] !== undefined) return eltern[name];
    } catch {
      // Nicht vorhanden.
    }
    return undefined;
  }

  function pruefeNichtLeer(name, wert) {
    if (typeof wert !== 'string' || wert.trim().length === 0) {
      throw new Error(`${name} darf nicht leer sein.`);
    }
    return wert.trim();
  }

  function konfiguration() {
    const roh = holeGlobal(CONFIG_NAME);
    if (!roh || typeof roh !== 'object') {
      throw new Error(`${CONFIG_NAME} fehlt.`);
    }
    const aenderungsKennung = pruefeNichtLeer('aenderungsKennung', roh.aenderungsKennung);
    if (aenderungsKennung !== ERWARTETE_AENDERUNGS_KENNUNG) {
      throw new Error(
        `aenderungsKennung muss exakt ${ERWARTETE_AENDERUNGS_KENNUNG} entsprechen.`
      );
    }
    const laufKennung = pruefeNichtLeer('laufKennung', roh.laufKennung);
    const modus = pruefeNichtLeer('modus', roh.modus);
    if (!MODI.includes(modus)) {
      throw new Error('modus muss schatten oder live sein.');
    }
    const soakDauerMillisekunden = Number(roh.soakDauerMillisekunden ?? SOAK_MIN_MILLIS);
    if (
      !Number.isFinite(soakDauerMillisekunden) ||
      soakDauerMillisekunden < SOAK_MIN_MILLIS ||
      soakDauerMillisekunden > SOAK_MAX_MILLIS
    ) {
      throw new Error(
        `soakDauerMillisekunden muss zwischen ${SOAK_MIN_MILLIS} und ${SOAK_MAX_MILLIS} liegen.`
      );
    }
    const schattenUebergabe = modus === 'live'
      ? pruefeSchattenUebergabe(roh.schattenUebergabe, laufKennung, aenderungsKennung)
      : null;
    return Object.freeze({
      aenderungsKennung,
      laufKennung,
      modus,
      soakDauerMillisekunden,
      schattenUebergabe
    });
  }

  function guiApi() {
    const api = holeGlobal(GUI_API_NAME);
    if (!api || typeof api.erstelleTest !== 'function') {
      throw new Error(`${GUI_API_NAME} fehlt. Zuerst adventure-land-test-gui.js laden.`);
    }
    return api;
  }

  function runtimeApi() {
    const api = holeGlobal(RUNTIME_API_NAME);
    if (!api || typeof api !== 'object') {
      throw new Error(`${RUNTIME_API_NAME} ist nicht geladen.`);
    }
    if (api.version !== ERWARTETE_RUNTIME_VERSION) {
      throw new Error(
        `Freigabe-Runner erwartet Runtime ${ERWARTETE_RUNTIME_VERSION}, gefunden wurde ${String(api.version)}.`
      );
    }
    for (const methode of [
      'status',
      'basisBedienStatus',
      'erstelleBasisBedienAnfrage',
      'fuehreBasisBedienAnfrage'
    ]) {
      if (typeof api[methode] !== 'function') {
        throw new Error(`${RUNTIME_API_NAME} besitzt die sichere Methode ${methode} nicht.`);
      }
    }
    return api;
  }

  function pruefeSchattenUebergabe(wert, laufKennung, aenderungsKennung) {
    if (!wert || typeof wert !== 'object') {
      throw new Error('Live-Modus braucht eine schattenUebergabe aus einem bestandenen strikten Schattenlauf.');
    }
    const nachweis = wert.nachweis;
    if (!nachweis || typeof nachweis !== 'object') {
      throw new Error('schattenUebergabe.nachweis fehlt.');
    }

    for (const [name, erwartetWert] of Object.entries({
      schemaVersion: 1,
      laufzeitPfadKennung: LAUFZEIT_PFAD,
      aenderungsKennung,
      laufKennung,
      runtimeVersion: ERWARTETE_RUNTIME_VERSION,
      runtimeSha256: ERWARTETE_RUNTIME_SHA256,
      runtimeUrl: ERWARTETE_RUNTIME_URL,
      betriebsart: 'gesperrt_nicht_gestartet',
      generation: 0,
      heartbeatVersuche: 0,
      heartbeatErfolge: 0,
      heartbeatFehler: 0
    })) {
      if (wert[name] !== erwartetWert) {
        throw new Error(`schattenUebergabe besitzt unerwarteten Wert fuer ${name}.`);
      }
    }

    for (const [name, erwartetWert] of Object.entries({
      schemaVersion: 1,
      laufzeitPfadKennung: LAUFZEIT_PFAD,
      aenderungsKennung,
      stufe: 'schatten',
      nachweisKennung: `${laufKennung}:schatten`,
      ergebnis: 'bestanden',
      deterministisch: false,
      spielAktionAusgefuehrt: false,
      begrenzt: false,
      telemetrieNachweis: false,
      recoveryNachweis: false,
      gesamtauswertungBestanden: false
    })) {
      if (nachweis[name] !== erwartetWert) {
        throw new Error(`schattenUebergabe.nachweis besitzt unerwarteten Wert fuer ${name}.`);
      }
    }
    if (!Number.isFinite(nachweis.durchgefuehrtAm) || nachweis.durchgefuehrtAm < 0) {
      throw new Error('schattenUebergabe.nachweis.durchgefuehrtAm ist ungueltig.');
    }

    return Object.freeze({
      ...wert,
      nachweis: Object.freeze({ ...nachweis })
    });
  }

  function neueVorgangsKennung(aktion) {
    vorgangsNummer += 1;
    return `${cfg.laufKennung}:${aktion}:${vorgangsNummer}`;
  }

  function pruefeBasisStatus(status, erwarteterZustand = null) {
    if (!status || typeof status !== 'object' || !status.laufzeit || typeof status.laufzeit !== 'object') {
      throw new Error('Basisbedienungs-Status ist unvollstaendig.');
    }
    if (status.laufzeit.schemaVersion !== 1) {
      throw new Error('Basisbedienungs-Laufzeit besitzt eine unbekannte schemaVersion.');
    }
    if (!Number.isSafeInteger(status.laufzeit.generation) || status.laufzeit.generation < 0) {
      throw new Error('Basisbedienungs-Laufzeit besitzt eine ungueltige Generation.');
    }
    if (status.laufzeit.automatischeFortsetzung !== false) {
      throw new Error('Automatische Fortsetzung muss fuer die Freigabe deaktiviert sein.');
    }
    if (erwarteterZustand !== null && status.laufzeit.zustand !== erwarteterZustand) {
      throw new Error(
        `Laufzeit ist ${String(status.laufzeit.zustand)} statt ${erwarteterZustand}.`
      );
    }
    return status;
  }

  function pruefeBootstrapBindung() {
    const bootstrap = holeGlobal('V4Bootstrap');
    if (!bootstrap || typeof bootstrap.status !== 'function') {
      throw new Error('V4Bootstrap fehlt; exakte immutable Runtime-Bindung kann nicht bestaetigt werden.');
    }
    const status = bootstrap.status();
    if (
      status?.bereit !== true ||
      status?.geladenVon !== ERWARTETE_RUNTIME_URL ||
      status?.geladenerSha256 !== ERWARTETE_RUNTIME_SHA256
    ) {
      throw new Error('V4Bootstrap bestaetigt nicht die exakt erwartete immutable Runtime 1.1.5.');
    }
    return status;
  }

  function pruefeSchattenRuntimeStatus(status) {
    if (!status || typeof status !== 'object') throw new Error('Runtime-Status fehlt.');
    if (status.aktivFreigegeben !== false) {
      throw new Error('Schattenbetrieb verlangt eine gesperrte Runtime mit aktivFreigegeben=false.');
    }
    if (status.gestoppt === true) {
      throw new Error('Schattenbetrieb akzeptiert keine bereits gestoppte Runtime.');
    }
    if (status.empfangInstalliert !== false) {
      throw new Error('Schattenbetrieb verlangt eine nicht gestartete Runtime ohne installierten CM-Empfang.');
    }
    if (status.lebensnachweisAutomatikAktiv !== false) {
      throw new Error('Schattenbetrieb verlangt einen nicht gestarteten Produktionsheartbeat.');
    }
    if (status.lebensnachweisAutomatikPausiert !== false) {
      throw new Error('Schattenbetrieb akzeptiert keinen zuvor gestarteten/pausierten Produktionsheartbeat.');
    }
    for (const feld of [
      'lebensnachweisSendeVersuche',
      'lebensnachweisSendeErfolge',
      'lebensnachweisSendeFehler',
      'lebensnachweisSendeOffen',
      'lebensnachweisSendeMaxOffen'
    ]) {
      if (status[feld] !== 0) {
        throw new Error(`Schattenbetrieb verlangt ${feld}=0.`);
      }
    }
    if (status.performanceTrickAufgerufen !== false || status.performanceTrickAufrufe !== 0) {
      throw new Error('Schattenbetrieb verlangt eine noch nicht gestartete Runtime ohne performance_trick-Aufruf.');
    }
    if (status.liveSmokeInstalliert === true || status.gruppenZielVorbereitungVerbraucht === true) {
      throw new Error('Schattenbetrieb akzeptiert keine vorbereitete oder installierte Live-Autoritaet.');
    }
    return status;
  }

  function pruefeLiveRuntimeStatus(status) {
    if (!status || typeof status !== 'object') throw new Error('Runtime-Status fehlt.');
    if (status.aktivFreigegeben !== true) {
      throw new Error('Live-Modus verlangt eine aktiv freigegebene Produktionsruntime.');
    }
    if (status.gestoppt === true) {
      throw new Error('Produktionsruntime ist bereits gestoppt.');
    }
    if (status.empfangInstalliert !== true) {
      throw new Error('Live-Modus verlangt eine gestartete Runtime mit installiertem CM-Empfang.');
    }
    if (status.lebensnachweisAutomatikAktiv !== true) {
      throw new Error('Produktionsheartbeat ist nicht aktiv.');
    }
    if (status.lebensnachweisAutomatikPausiert === true) {
      throw new Error('Produktionsheartbeat ist pausiert.');
    }
    if (!Number.isSafeInteger(status.lebensnachweisSendeVersuche) || status.lebensnachweisSendeVersuche < 1) {
      throw new Error('Live-Modus verlangt mindestens einen echten Produktionsheartbeat-Sendeversuch.');
    }
    if (
      status.performanceTrickErforderlich === true &&
      status.performanceTrickAufgerufen !== true
    ) {
      throw new Error('Browser-Hintergrundschutz performance_trick ist nicht bestaetigt aktiv.');
    }
    return status;
  }

  function schattenPreflight() {
    if (cfg.modus !== 'schatten') {
      throw new Error('Schattennachweis ist nur im Modus schatten erlaubt.');
    }
    const runtime = runtimeApi();
    const bootstrapStatus = pruefeBootstrapBindung();
    const runtimeStatus = pruefeSchattenRuntimeStatus(runtime.status());
    const basisStatus = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    if (basisStatus.laufzeit.generation !== 0) {
      throw new Error('Schattenbetrieb verlangt Laufzeit-Generation 0.');
    }
    return Object.freeze({ runtime, bootstrapStatus, runtimeStatus, basisStatus });
  }

  function livePreflight() {
    if (cfg.modus !== 'live') {
      throw new Error('Kontrollierter Live-Test und Soak sind nur im Modus live erlaubt.');
    }
    const runtime = runtimeApi();
    const bootstrapStatus = pruefeBootstrapBindung();
    const runtimeStatus = pruefeLiveRuntimeStatus(runtime.status());
    const basisStatus = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    return Object.freeze({ runtime, bootstrapStatus, runtimeStatus, basisStatus });
  }

  function erstelleNachweis(stufe, ergebnis, durchgefuehrtAm, optionen = {}) {
    return Object.freeze({
      schemaVersion: 1,
      laufzeitPfadKennung: LAUFZEIT_PFAD,
      aenderungsKennung: cfg.aenderungsKennung,
      stufe,
      nachweisKennung: `${cfg.laufKennung}:${stufe}`,
      ergebnis,
      durchgefuehrtAm,
      deterministisch: optionen.deterministisch === true,
      spielAktionAusgefuehrt: optionen.spielAktionAusgefuehrt === true,
      begrenzt: optionen.begrenzt === true,
      telemetrieNachweis: optionen.telemetrieNachweis === true,
      recoveryNachweis: optionen.recoveryNachweis === true,
      gesamtauswertungBestanden: optionen.gesamtauswertungBestanden === true
    });
  }

  const cfg = konfiguration();
  const test = guiApi().erstelleTest({
    kennung: `block8-5-freigabe-${cfg.laufKennung}`,
    titel: 'V4 Block 8.5.9 · Freigabestufen',
    beschreibung:
      'Modusgebundene Freigabe fuer Runtime 1.1.5: Schatten strikt gesperrt/nicht gestartet; Live/Soak erst in separater aktiver Sitzung mit importierter Schattenuebergabe.'
  });

  let schattenNachweis = cfg.schattenUebergabe?.nachweis ?? null;
  let schattenUebergabe = cfg.schattenUebergabe;
  let liveNachweis = null;
  let soakNachweis = null;

  function schatten() {
    const gestartetAm = Date.now();
    const { runtime, bootstrapStatus, runtimeStatus, basisStatus } = schattenPreflight();
    const generationVorher = basisStatus.laufzeit.generation;

    const anfrage = runtime.erstelleBasisBedienAnfrage(Object.freeze({
      vorgangsKennung: neueVorgangsKennung('schatten-diagnose'),
      aktion: 'diagnose_aktualisieren',
      erwarteteLaufzeitGeneration: generationVorher
    }));
    const ergebnis = runtime.fuehreBasisBedienAnfrage(anfrage);
    const basisNachher = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    const runtimeNachher = pruefeSchattenRuntimeStatus(runtime.status());

    const pass =
      ergebnis?.status === 'ausgefuehrt' &&
      ergebnis?.aktion === 'diagnose_aktualisieren' &&
      generationVorher === 0 &&
      basisNachher.laufzeit.generation === 0 &&
      runtimeNachher.lebensnachweisSendeVersuche === 0 &&
      runtimeNachher.lebensnachweisSendeErfolge === 0 &&
      runtimeNachher.lebensnachweisSendeFehler === 0;

    schattenNachweis = erstelleNachweis(
      'schatten',
      pass ? 'bestanden' : 'fehlgeschlagen',
      Date.now()
    );
    schattenUebergabe = pass
      ? Object.freeze({
          schemaVersion: 1,
          laufzeitPfadKennung: LAUFZEIT_PFAD,
          aenderungsKennung: cfg.aenderungsKennung,
          laufKennung: cfg.laufKennung,
          runtimeVersion: ERWARTETE_RUNTIME_VERSION,
          runtimeSha256: ERWARTETE_RUNTIME_SHA256,
          runtimeUrl: ERWARTETE_RUNTIME_URL,
          betriebsart: 'gesperrt_nicht_gestartet',
          generation: 0,
          heartbeatVersuche: 0,
          heartbeatErfolge: 0,
          heartbeatFehler: 0,
          nachweis: schattenNachweis
        })
      : null;

    const bericht = Object.freeze({
      stufe: 'schatten',
      pass,
      gestartetAm,
      nachweis: schattenNachweis,
      generationVorher,
      generationNachher: basisNachher.laufzeit.generation,
      diagnoseStatus: ergebnis?.status ?? null,
      bootstrap: bootstrapStatus,
      runtimeVorher: runtimeStatus,
      runtimeNachher,
      schattenUebergabe
    });
    test.setzeErgebnis(
      bericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Schattennachweis bestanden: Runtime blieb gesperrt, nicht gestartet und bei 0 Heartbeat-/CM-Versuchen. Fuer Live eine neue aktive Sitzung mit der ausgegebenen schattenUebergabe verwenden.'
        : 'Schattennachweis fehlgeschlagen.'
    );
    test.protokolliere('Schattennachweis', bericht);
    return bericht;
  }

  function kontrolliertLive() {
    if (schattenNachweis?.ergebnis !== 'bestanden') {
      throw new Error('Kontrollierter Live-Test verlangt zuerst einen bestandenen Schattennachweis.');
    }

    const gestartetAm = Date.now();
    const { runtime, runtimeStatus, basisStatus } = livePreflight();
    const generationVorher = basisStatus.laufzeit.generation;

    const pauseAnfrage = runtime.erstelleBasisBedienAnfrage(Object.freeze({
      vorgangsKennung: neueVorgangsKennung('live-pause'),
      aktion: 'laufzeit_pausieren',
      erwarteteLaufzeitGeneration: generationVorher
    }));
    const pause = runtime.fuehreBasisBedienAnfrage(pauseAnfrage);
    const nachPause = pruefeBasisStatus(runtime.basisBedienStatus(), 'pausiert');
    const runtimeNachPause = pruefeLiveRuntimeStatus(runtime.status());

    if (
      pause?.status !== 'ausgefuehrt' ||
      nachPause.laufzeit.generation !== generationVorher + 1
    ) {
      liveNachweis = erstelleNachweis('kontrolliert_live', 'fehlgeschlagen', Date.now(), {
        begrenzt: true,
        spielAktionAusgefuehrt: true
      });
      throw new Error(
        'Kontrollierter Live-Test konnte die sichere Pause nicht eindeutig bestaetigen; Runtime bleibt fail-safe im beobachteten Zustand.'
      );
    }

    const fortsetzenAnfrage = runtime.erstelleBasisBedienAnfrage(Object.freeze({
      vorgangsKennung: neueVorgangsKennung('live-fortsetzen'),
      aktion: 'laufzeit_fortsetzen',
      erwarteteLaufzeitGeneration: nachPause.laufzeit.generation,
      ausdruecklichBestaetigt: true
    }));
    const fortsetzen = runtime.fuehreBasisBedienAnfrage(fortsetzenAnfrage);
    const nachFortsetzen = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    const runtimeNachher = pruefeLiveRuntimeStatus(runtime.status());

    const pass =
      fortsetzen?.status === 'ausgefuehrt' &&
      nachFortsetzen.laufzeit.generation === generationVorher + 2 &&
      runtimeNachPause.lebensnachweisAutomatikAktiv === true &&
      runtimeNachher.lebensnachweisAutomatikAktiv === true &&
      runtimeNachher.lebensnachweisAutomatikPausiert === false;

    liveNachweis = erstelleNachweis(
      'kontrolliert_live',
      pass ? 'bestanden' : 'fehlgeschlagen',
      Date.now(),
      { begrenzt: true, spielAktionAusgefuehrt: true }
    );

    const bericht = Object.freeze({
      stufe: 'kontrolliert_live',
      pass,
      gestartetAm,
      nachweis: liveNachweis,
      generationVorher,
      generationNachPause: nachPause.laufzeit.generation,
      generationNachFortsetzen: nachFortsetzen.laufzeit.generation,
      pauseStatus: pause?.status ?? null,
      fortsetzenStatus: fortsetzen?.status ?? null,
      heartbeatVorher: runtimeStatus.lebensnachweisSendeErfolge,
      heartbeatNachPause: runtimeNachPause.lebensnachweisSendeErfolge,
      heartbeatNachher: runtimeNachher.lebensnachweisSendeErfolge
    });

    test.setzeErgebnis(
      bericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Kontrollierter Live-Test bestanden: genau eine sichere Pause und bestaetigte Fortsetzung; Produktionsheartbeat blieb aktiv.'
        : 'Kontrollierter Live-Test fehlgeschlagen.'
    );
    test.protokolliere('Kontrollierter Live-Test', bericht);
    test.setzeAktionAktiv('soak', pass);
    return bericht;
  }

  async function soak() {
    if (liveNachweis?.ergebnis !== 'bestanden') {
      throw new Error('Soak-Test verlangt zuerst einen bestandenen kontrollierten Live-Test.');
    }

    const { runtime, runtimeStatus, basisStatus } = livePreflight();
    const generation = basisStatus.laufzeit.generation;
    const gestartetAm = Date.now();
    const fehler = [];
    let samples = 0;

    test.protokolliere('Soak gestartet', Object.freeze({
      dauerMillisekunden: cfg.soakDauerMillisekunden,
      sampleMillisekunden: SOAK_SAMPLE_MILLIS,
      generation,
      heartbeatErfolge: runtimeStatus.lebensnachweisSendeErfolge,
      heartbeatFehler: runtimeStatus.lebensnachweisSendeFehler
    }));

    await new Promise((resolve) => {
      const timer = setInterval(() => {
        samples += 1;
        try {
          const status = pruefeLiveRuntimeStatus(runtime.status());
          const basis = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
          if (basis.laufzeit.generation !== generation) {
            fehler.push(
              `Unerwartete Laufzeit-Generation ${basis.laufzeit.generation}; erwartet ${generation}.`
            );
          }
          if (status.lebensnachweisSendeFehler > runtimeStatus.lebensnachweisSendeFehler) {
            fehler.push(
              `Produktionsheartbeat meldet neue SendeFehler: ${status.lebensnachweisSendeFehler}.`
            );
          }
        } catch (ursache) {
          fehler.push(ursache instanceof Error ? ursache.message : String(ursache));
        }

        if (Date.now() - gestartetAm >= cfg.soakDauerMillisekunden) {
          clearInterval(timer);
          resolve();
        }
      }, SOAK_SAMPLE_MILLIS);
    });

    const runtimeNachher = pruefeLiveRuntimeStatus(runtime.status());
    const basisNachher = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    const erwarteteSamples = Math.max(
      1,
      Math.floor(cfg.soakDauerMillisekunden / SOAK_SAMPLE_MILLIS) - 2
    );

    if (samples < erwarteteSamples) {
      fehler.push(
        `Soak-Sampling war zu duenn: ${samples} statt mindestens ${erwarteteSamples} Samples.`
      );
    }
    if (basisNachher.laufzeit.generation !== generation) {
      fehler.push('Laufzeit-Generation hat sich waehrend des Soak-Tests veraendert.');
    }
    if (runtimeNachher.lebensnachweisSendeErfolge <= runtimeStatus.lebensnachweisSendeErfolge) {
      fehler.push('Produktionsheartbeat hat waehrend des Soak-Tests keinen neuen Erfolg bestaetigt.');
    }

    const pass = fehler.length === 0;
    soakNachweis = erstelleNachweis(
      'soak',
      pass ? 'bestanden' : 'fehlgeschlagen',
      Date.now(),
      {
        spielAktionAusgefuehrt: true,
        telemetrieNachweis: pass,
        recoveryNachweis: pass && liveNachweis?.ergebnis === 'bestanden',
        gesamtauswertungBestanden: pass
      }
    );

    const bericht = Object.freeze({
      stufe: 'soak',
      pass,
      nachweis: soakNachweis,
      gestartetAm,
      beendetAm: Date.now(),
      dauerMillisekunden: cfg.soakDauerMillisekunden,
      sampleMillisekunden: SOAK_SAMPLE_MILLIS,
      samples,
      erwarteteSamples,
      fehler: Object.freeze([...fehler]),
      generation,
      generationNachher: basisNachher.laufzeit.generation,
      heartbeatErfolgeVorher: runtimeStatus.lebensnachweisSendeErfolge,
      heartbeatErfolgeNachher: runtimeNachher.lebensnachweisSendeErfolge,
      heartbeatFehlerVorher: runtimeStatus.lebensnachweisSendeFehler,
      heartbeatFehlerNachher: runtimeNachher.lebensnachweisSendeFehler
    });

    test.setzeErgebnis(
      bericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Soak-Test bestanden: Telemetrie stabil, Heartbeat fortgeschritten und Recovery-Grenzen unveraendert.'
        : 'Soak-Test fehlgeschlagen; Bericht enthaelt die beobachteten Abweichungen.'
    );
    test.protokolliere('Soak-Abschluss', bericht);
    return bericht;
  }

  const LIVE_TEXT = `BLOCK8-5-KONTROLLIERT-LIVE:${cfg.laufKennung}`;
  const SOAK_TEXT = `BLOCK8-5-SOAK-STARTEN:${cfg.laufKennung}`;

  test.registriereAktion({
    kennung: 'schatten',
    titel: '1 · Schattennachweis',
    art: 'primaer',
    aktiviert: cfg.modus === 'schatten',
    einmalig: true,
    ausfuehren: schatten
  });
  test.registriereAktion({
    kennung: 'kontrolliert-live',
    titel: '2 · Kontrolliert live',
    art: 'gefahr',
    aktiviert: cfg.modus === 'live' && schattenNachweis?.ergebnis === 'bestanden',
    einmalig: true,
    bestaetigungsText: LIVE_TEXT,
    ausfuehren: kontrolliertLive
  });
  test.registriereAktion({
    kennung: 'soak',
    titel: '3 · Soak starten',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: SOAK_TEXT,
    ausfuehren: soak
  });

  const api = Object.freeze({
    version: VERSION,
    erwarteteRuntimeVersion: ERWARTETE_RUNTIME_VERSION,
    aenderungsKennung: cfg.aenderungsKennung,
    laufKennung: cfg.laufKennung,
    modus: cfg.modus,
    erwarteteRuntimeSha256: ERWARTETE_RUNTIME_SHA256,
    erwarteteRuntimeUrl: ERWARTETE_RUNTIME_URL,
    liveBestaetigungsText: () => LIVE_TEXT,
    soakBestaetigungsText: () => SOAK_TEXT,
    test,
    status() {
      return Object.freeze({
        version: VERSION,
        erwarteteRuntimeVersion: ERWARTETE_RUNTIME_VERSION,
        aenderungsKennung: cfg.aenderungsKennung,
        laufKennung: cfg.laufKennung,
        modus: cfg.modus,
        soakDauerMillisekunden: cfg.soakDauerMillisekunden,
        schattenNachweis,
        schattenUebergabe,
        liveNachweis,
        soakNachweis,
        gui: test.status()
      });
    },
    kopiereBericht: () => test.kopiereBericht()
  });

  if (globalThis[API_NAME] !== undefined) {
    throw new Error(`${API_NAME} ist bereits im Codekontext vorhanden.`);
  }
  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });

  try {
    const eltern = holeElternFenster();
    if (eltern && eltern[API_NAME] === undefined) {
      Object.defineProperty(eltern, API_NAME, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    }
  } catch {
    // Lokale API bleibt verfuegbar.
  }
})();
