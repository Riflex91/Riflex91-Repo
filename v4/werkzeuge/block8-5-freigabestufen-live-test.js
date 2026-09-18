(() => {
  'use strict';

  const API_NAME = 'V4Block85FreigabeLiveTest';
  const VERSION = '1.0.0';
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
    const laufKennung = pruefeNichtLeer('laufKennung', roh.laufKennung);
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
    return Object.freeze({
      aenderungsKennung,
      laufKennung,
      soakDauerMillisekunden
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

  function pruefeRuntimeStatus(status) {
    if (!status || typeof status !== 'object') throw new Error('Runtime-Status fehlt.');
    if (status.aktivFreigegeben !== true) {
      throw new Error('Produktionsruntime ist fuer den Freigabetest nicht aktiv freigegeben.');
    }
    if (status.gestoppt === true) {
      throw new Error('Produktionsruntime ist bereits gestoppt.');
    }
    if (status.lebensnachweisAutomatikAktiv !== true) {
      throw new Error('Produktionsheartbeat ist nicht aktiv.');
    }
    if (status.lebensnachweisAutomatikPausiert === true) {
      throw new Error('Produktionsheartbeat ist pausiert.');
    }
    if (
      status.performanceTrickErforderlich === true &&
      status.performanceTrickAufgerufen !== true
    ) {
      throw new Error('Browser-Hintergrundschutz performance_trick ist nicht bestaetigt aktiv.');
    }
    return status;
  }

  function preflight() {
    const runtime = runtimeApi();
    const runtimeStatus = pruefeRuntimeStatus(runtime.status());
    const basisStatus = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    return Object.freeze({ runtime, runtimeStatus, basisStatus });
  }

  function erstelleNachweis(stufe, ergebnis, durchgefuehrtAm, optionen = {}) {
    return Object.freeze({
      schemaVersion: 1,
      laufzeitPfadKennung: 'block8.5-basisbedienung-runtime',
      aenderungsKennung: cfg.aenderungsKennung,
      stufe,
      nachweisKennung: `${cfg.laufKennung}:${stufe}`,
      ergebnis,
      durchgefuehrtAm,
      deterministisch: optionen.deterministisch === true,
      spielAktionAusgefuehrt: false,
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
      'Schatten -> kontrolliert live -> Soak fuer Runtime 1.1.5. Keine Adventure-Land-Spielaktion wird von diesem Runner direkt aufgerufen.'
  });

  let schattenNachweis = null;
  let liveNachweis = null;
  let soakNachweis = null;

  function schatten() {
    const gestartetAm = Date.now();
    const { runtime, runtimeStatus, basisStatus } = preflight();
    const generationVorher = basisStatus.laufzeit.generation;

    const anfrage = runtime.erstelleBasisBedienAnfrage(Object.freeze({
      vorgangsKennung: neueVorgangsKennung('schatten-diagnose'),
      aktion: 'diagnose_aktualisieren',
      erwarteteLaufzeitGeneration: generationVorher
    }));
    const ergebnis = runtime.fuehreBasisBedienAnfrage(anfrage);
    const basisNachher = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    const runtimeNachher = pruefeRuntimeStatus(runtime.status());

    const pass =
      ergebnis?.status === 'ausgefuehrt' &&
      ergebnis?.aktion === 'diagnose_aktualisieren' &&
      basisNachher.laufzeit.generation === generationVorher &&
      runtimeNachher.lebensnachweisSendeErfolge >= runtimeStatus.lebensnachweisSendeErfolge;

    schattenNachweis = erstelleNachweis(
      'schatten',
      pass ? 'bestanden' : 'fehlgeschlagen',
      Date.now()
    );

    const bericht = Object.freeze({
      stufe: 'schatten',
      pass,
      gestartetAm,
      nachweis: schattenNachweis,
      generationVorher,
      generationNachher: basisNachher.laufzeit.generation,
      diagnoseStatus: ergebnis?.status ?? null,
      runtimeVorher: runtimeStatus,
      runtimeNachher
    });
    test.setzeErgebnis(
      bericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Schattennachweis bestanden: Diagnose lief ueber den sicheren Kanal ohne Laufzeitmutation.'
        : 'Schattennachweis fehlgeschlagen.'
    );
    test.protokolliere('Schattennachweis', bericht);
    test.setzeAktionAktiv('kontrolliert-live', pass);
    return bericht;
  }

  function kontrolliertLive() {
    if (schattenNachweis?.ergebnis !== 'bestanden') {
      throw new Error('Kontrollierter Live-Test verlangt zuerst einen bestandenen Schattennachweis.');
    }

    const gestartetAm = Date.now();
    const { runtime, runtimeStatus, basisStatus } = preflight();
    const generationVorher = basisStatus.laufzeit.generation;

    const pauseAnfrage = runtime.erstelleBasisBedienAnfrage(Object.freeze({
      vorgangsKennung: neueVorgangsKennung('live-pause'),
      aktion: 'laufzeit_pausieren',
      erwarteteLaufzeitGeneration: generationVorher
    }));
    const pause = runtime.fuehreBasisBedienAnfrage(pauseAnfrage);
    const nachPause = pruefeBasisStatus(runtime.basisBedienStatus(), 'pausiert');
    const runtimeNachPause = pruefeRuntimeStatus(runtime.status());

    if (
      pause?.status !== 'ausgefuehrt' ||
      nachPause.laufzeit.generation !== generationVorher + 1
    ) {
      liveNachweis = erstelleNachweis('kontrolliert_live', 'fehlgeschlagen', Date.now(), {
        begrenzt: true
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
    const runtimeNachher = pruefeRuntimeStatus(runtime.status());

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
      { begrenzt: true }
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

    const { runtime, runtimeStatus, basisStatus } = preflight();
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
          const status = pruefeRuntimeStatus(runtime.status());
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

    const runtimeNachher = pruefeRuntimeStatus(runtime.status());
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
    einmalig: true,
    ausfuehren: schatten
  });
  test.registriereAktion({
    kennung: 'kontrolliert-live',
    titel: '2 · Kontrolliert live',
    art: 'gefahr',
    aktiviert: false,
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
    liveBestaetigungsText: () => LIVE_TEXT,
    soakBestaetigungsText: () => SOAK_TEXT,
    test,
    status() {
      return Object.freeze({
        version: VERSION,
        erwarteteRuntimeVersion: ERWARTETE_RUNTIME_VERSION,
        aenderungsKennung: cfg.aenderungsKennung,
        laufKennung: cfg.laufKennung,
        soakDauerMillisekunden: cfg.soakDauerMillisekunden,
        schattenNachweis,
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
