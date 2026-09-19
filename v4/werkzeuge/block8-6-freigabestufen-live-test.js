(() => {
  'use strict';

  const API_NAME = 'V4Block86FreigabeLiveTest';
  const VERSION = '1.0.0';
  const PFAD = 'block8.6-capability-runtime';
  const STANDARD_SOAK_MILLIS = 600000;
  const STANDARD_SAMPLE_MILLIS = 5000;

  function objekt(wert) {
    return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
  }

  function text(name, wert) {
    if (typeof wert !== 'string' || wert.trim().length === 0) {
      throw new Error(name + ' darf nicht leer sein.');
    }
    return wert.trim();
  }

  function konfiguration() {
    const roh = globalThis.AIO_V4_BLOCK86_FREIGABE_CONFIG;
    if (!objekt(roh)) throw new Error('AIO_V4_BLOCK86_FREIGABE_CONFIG fehlt.');
    const modus = roh.modus;
    if (!['schatten', 'live', 'soak'].includes(modus)) {
      throw new Error('Block-8.6-Freigabemodus muss schatten, live oder soak sein.');
    }
    const soakDauerMillisekunden = Number(roh.soakDauerMillisekunden ?? STANDARD_SOAK_MILLIS);
    const sampleMillisekunden = Number(roh.sampleMillisekunden ?? STANDARD_SAMPLE_MILLIS);
    if (
      !Number.isFinite(soakDauerMillisekunden) ||
      soakDauerMillisekunden < STANDARD_SOAK_MILLIS ||
      soakDauerMillisekunden > 3600000
    ) {
      throw new Error('Soak-Dauer muss zwischen 600000 und 3600000 ms liegen.');
    }
    if (
      !Number.isFinite(sampleMillisekunden) ||
      sampleMillisekunden < 1000 ||
      sampleMillisekunden > 30000
    ) {
      throw new Error('Soak-Sampling muss zwischen 1000 und 30000 ms liegen.');
    }
    return Object.freeze({
      aenderungsKennung: text('aenderungsKennung', roh.aenderungsKennung),
      laufKennung: text('laufKennung', roh.laufKennung),
      modus,
      soakDauerMillisekunden,
      sampleMillisekunden,
      recoveryReplayVerified: roh.recoveryReplayVerified === true,
      schattenUebergabe: roh.schattenUebergabe ?? null,
      liveUebergabe: roh.liveUebergabe ?? null
    });
  }

  const cfg = konfiguration();
  const candidate = globalThis.V4Block86Candidate;
  const runtime = globalThis.V4ProduktionsLaufzeit;
  const capability = globalThis.V4CapabilityLaufzeit;

  if (!objekt(candidate) || candidate.version !== '1.0.0') {
    throw new Error('Block-8.6-Freigaberunner verlangt V4Block86Candidate 1.0.0.');
  }
  if (!objekt(runtime) || runtime.version !== '1.1.5') {
    throw new Error('Block-8.6-Freigaberunner verlangt die eingebettete Produktionsruntime 1.1.5.');
  }
  if (!objekt(capability) || capability.version !== '1.0.0') {
    throw new Error('Block-8.6-Freigaberunner verlangt V4CapabilityLaufzeit 1.0.0.');
  }

  let letzterBericht = null;
  let verbraucht = false;

  function nachweis(stufe, daten) {
    return Object.freeze({
      schemaVersion: 1,
      laufzeitPfadKennung: PFAD,
      aenderungsKennung: cfg.aenderungsKennung,
      stufe,
      nachweisKennung: cfg.laufKennung + ':' + stufe,
      ergebnis: daten.bestanden ? 'bestanden' : 'fehlgeschlagen',
      durchgefuehrtAm: daten.durchgefuehrtAm,
      deterministisch: daten.deterministisch === true,
      spielAktionAusgefuehrt: daten.spielAktionAusgefuehrt === true,
      begrenzt: daten.begrenzt === true,
      telemetrieNachweis: daten.telemetrieNachweis === true,
      recoveryNachweis: daten.recoveryNachweis === true,
      gesamtauswertungBestanden: daten.gesamtauswertungBestanden === true
    });
  }

  function pruefeEinmalig(erwarteterModus) {
    if (cfg.modus !== erwarteterModus) {
      throw new Error('Diese Aktion ist nur im Modus ' + erwarteterModus + ' erlaubt.');
    }
    if (verbraucht) throw new Error('Dieser Freigabelauf ist one-shot und bereits verbraucht.');
    verbraucht = true;
  }

  function shadowPreflight() {
    const runtimeStatus = runtime.status();
    const capStatus = capability.status();
    if (
      runtimeStatus.aktivFreigegeben !== false ||
      runtimeStatus.empfangInstalliert !== false ||
      runtimeStatus.lebensnachweisAutomatikAktiv !== false ||
      runtimeStatus.lebensnachweisSendeVersuche !== 0 ||
      runtimeStatus.lebensnachweisSendeErfolge !== 0 ||
      runtimeStatus.lebensnachweisSendeFehler !== 0
    ) {
      throw new Error('Schatten verlangt gesperrte, nicht gestartete Runtime mit exakt 0 Heartbeat-Sendezaehlern.');
    }
    if (
      capStatus.aktivFreigegeben !== false ||
      capStatus.remoteBeobachtungInstalliert !== false ||
      capStatus.capabilityEmpfangInstalliert !== false ||
      capStatus.senden.versuche !== 0
    ) {
      throw new Error('Schatten verlangt gesperrte Capability-Laufzeit ohne Remote-Beobachtung und ohne Sendeversuch.');
    }
  }

  function schatten() {
    pruefeEinmalig('schatten');
    shadowPreflight();
    const update = capability.aktualisiere();
    const status = update.status;
    const fehler = [];

    if (!status.audit?.produktionsbereit) fehler.push('Skill-Katalog-Audit ist im Schatten nicht produktionsbereit.');
    if (update.lokalerSnapshot === null) fehler.push('Lokaler Capability-Snapshot konnte im Schatten nicht gebildet werden.');
    if (status.senden.versuche !== 0) fehler.push('Schatten hat unerwartet Capability-Sendeversuche erzeugt.');
    if (runtime.status().lebensnachweisSendeVersuche !== 0) fehler.push('Schatten hat unerwartet Heartbeat-Sendeversuche erzeugt.');
    if (status.capabilityStatus?.spielAutoritaet !== false) fehler.push('CapabilityStatus besitzt unerwartete Spielautoritaet.');

    const bestanden = fehler.length === 0;
    const durchgefuehrtAm = Date.now();
    const beweis = nachweis('schatten', {
      bestanden,
      durchgefuehrtAm,
      deterministisch: false,
      spielAktionAusgefuehrt: false,
      begrenzt: false,
      telemetrieNachweis: false,
      recoveryNachweis: false,
      gesamtauswertungBestanden: false
    });
    letzterBericht = Object.freeze({
      schemaVersion: 1,
      runnerVersion: VERSION,
      stufe: 'schatten',
      pass: bestanden,
      fehler: Object.freeze(fehler),
      nachweis: beweis,
      katalogFingerprint: status.audit?.katalog?.fingerprint ?? null,
      capabilityFingerprint: status.faehigkeiten?.fingerprint ?? null,
      lokalerSnapshotFingerprint: update.lokalerSnapshot?.fingerprint ?? null,
      runtimeHeartbeatVersuche: runtime.status().lebensnachweisSendeVersuche,
      capabilitySendeVersuche: status.senden.versuche,
      schattenUebergabe: bestanden
        ? Object.freeze({
            schemaVersion: 1,
            laufKennung: cfg.laufKennung,
            aenderungsKennung: cfg.aenderungsKennung,
            nachweis: beweis,
            katalogFingerprint: status.audit.katalog.fingerprint,
            capabilityFingerprint: status.faehigkeiten.fingerprint
          })
        : null
    });
    return letzterBericht;
  }

  function pruefeUebergabe(uebergabe, stufe) {
    if (!objekt(uebergabe)) throw new Error(stufe + '-Uebergabe fehlt.');
    if (uebergabe.laufKennung !== cfg.laufKennung) throw new Error(stufe + '-Uebergabe gehoert zu anderem Lauf.');
    if (uebergabe.aenderungsKennung !== cfg.aenderungsKennung) {
      throw new Error(stufe + '-Uebergabe gehoert zu anderem Aenderungsstand.');
    }
    if (!objekt(uebergabe.nachweis) || uebergabe.nachweis.ergebnis !== 'bestanden') {
      throw new Error(stufe + '-Uebergabe besitzt keinen bestandenen Nachweis.');
    }
    return uebergabe;
  }

  function livePreflight() {
    pruefeUebergabe(cfg.schattenUebergabe, 'Schatten');
    const runtimeStatus = runtime.status();
    if (
      runtimeStatus.aktivFreigegeben !== true ||
      runtimeStatus.empfangInstalliert !== true ||
      runtimeStatus.lebensnachweisAutomatikAktiv !== true ||
      runtimeStatus.lebensnachweisSendeErfolge < 1 ||
      runtimeStatus.lebensnachweisSendeFehler !== 0
    ) {
      throw new Error('Kontrolliert live verlangt aktive 1.1.5-Runtime mit bestaetigtem fehlerfreiem Produktionsheartbeat.');
    }
    if (capability.status().aktivFreigegeben !== true) {
      throw new Error('Kontrolliert live verlangt aktiv freigegebene Capability-Laufzeit.');
    }
  }

  async function kontrolliertLive(bestaetigungsText) {
    pruefeEinmalig('live');
    livePreflight();
    const erwartet = 'BLOCK8-6-KONTROLLIERT-LIVE:' + cfg.laufKennung;
    if (bestaetigungsText !== erwartet) {
      throw new Error('Falscher Bestaetigungstext. Erwartet wird exakt: ' + erwartet);
    }

    capability.installiereRemoteBeobachtung();
    const update = capability.aktualisiere();
    const localName = update.status.capabilityStatus?.charakterName;
    const vertrauensNamen = Array.isArray(globalThis.AIO_V4_CAPABILITY_CONFIG?.vertrauensNamen)
      ? [...new Set(globalThis.AIO_V4_CAPABILITY_CONFIG.vertrauensNamen)]
          .map((name) => String(name).trim())
          .filter((name) => name && name !== localName)
          .sort()
      : [];
    if (vertrauensNamen.length < 1) {
      throw new Error('Kontrolliert live benoetigt mindestens einen anderen vertrauten Zielcharakter.');
    }

    const sendeErgebnisse = [];
    for (const zielName of vertrauensNamen) {
      const antwort = await capability.sendeCapabilityEinmal(
        zielName,
        capability.sendeBestaetigungsText(zielName)
      );
      sendeErgebnisse.push(antwort.ergebnis);
    }
    const nachher = capability.aktualisiere().status;
    const fehler = [];
    if (sendeErgebnisse.some((row) => row.gesendet !== true)) {
      fehler.push('Mindestens ein Capability-One-Shot wurde nicht als zugestellt bestaetigt.');
    }
    if (nachher.senden.versuche !== vertrauensNamen.length) {
      fehler.push('Capability-Sendeversuche entsprechen nicht exakt der Zahl der kontrollierten Ziele.');
    }
    if (nachher.senden.fehler !== 0) fehler.push('Capability-Laufzeit meldet Sende-Fehler.');
    if (!nachher.remoteBeobachtungInstalliert || !nachher.capabilityEmpfangInstalliert) {
      fehler.push('Remote-Beobachtung oder Capability-Empfang ist nicht installiert.');
    }

    const bestanden = fehler.length === 0;
    const durchgefuehrtAm = Date.now();
    const beweis = nachweis('kontrolliert_live', {
      bestanden,
      durchgefuehrtAm,
      deterministisch: false,
      spielAktionAusgefuehrt: true,
      begrenzt: true,
      telemetrieNachweis: false,
      recoveryNachweis: false,
      gesamtauswertungBestanden: false
    });
    letzterBericht = Object.freeze({
      schemaVersion: 1,
      runnerVersion: VERSION,
      stufe: 'kontrolliert_live',
      pass: bestanden,
      fehler: Object.freeze(fehler),
      nachweis: beweis,
      ziele: Object.freeze(vertrauensNamen),
      sendeErgebnisse: Object.freeze(sendeErgebnisse),
      capabilitySendeStatus: nachher.senden,
      beobachteteLebensnachweise: nachher.beobachteteLebensnachweise,
      empfangeneCapabilitySnapshots: nachher.empfangeneCapabilitySnapshots,
      liveUebergabe: bestanden
        ? Object.freeze({
            schemaVersion: 1,
            laufKennung: cfg.laufKennung,
            aenderungsKennung: cfg.aenderungsKennung,
            nachweis: beweis,
            ziele: Object.freeze(vertrauensNamen)
          })
        : null
    });
    return letzterBericht;
  }

  function soakPreflight() {
    pruefeUebergabe(cfg.schattenUebergabe, 'Schatten');
    pruefeUebergabe(cfg.liveUebergabe, 'Live');
    if (!cfg.recoveryReplayVerified) {
      throw new Error('Soak verlangt den an denselben Candidate gebundenen 8.6.8-Recovery-Replay-Nachweis.');
    }
    const runtimeStatus = runtime.status();
    if (
      runtimeStatus.aktivFreigegeben !== true ||
      runtimeStatus.empfangInstalliert !== true ||
      runtimeStatus.lebensnachweisAutomatikAktiv !== true ||
      runtimeStatus.lebensnachweisSendeErfolge < 1 ||
      runtimeStatus.lebensnachweisSendeFehler !== 0
    ) {
      throw new Error('Soak verlangt aktive fehlerfreie Produktionsheartbeat-Basis.');
    }
  }

  async function soak(bestaetigungsText) {
    pruefeEinmalig('soak');
    soakPreflight();
    const erwartet = 'BLOCK8-6-SOAK-STARTEN:' + cfg.laufKennung;
    if (bestaetigungsText !== erwartet) {
      throw new Error('Falscher Bestaetigungstext. Erwartet wird exakt: ' + erwartet);
    }

    capability.installiereRemoteBeobachtung();
    const runtimeVorher = runtime.status();
    const capVorher = capability.aktualisiere().status;
    const heartbeatErfolgeVorher = runtimeVorher.lebensnachweisSendeErfolge;
    const heartbeatFehlerVorher = runtimeVorher.lebensnachweisSendeFehler;
    const capabilitySendeFehlerVorher = capVorher.senden.fehler;
    const katalogFingerprint = capVorher.audit?.katalog?.fingerprint ?? null;
    const gestartetAm = Date.now();
    const fehler = [];
    let samples = 0;

    await new Promise((resolve) => {
      let timer = null;
      timer = setInterval(() => {
        samples += 1;
        try {
          const status = capability.aktualisiere().status;
          const runtimeStatus = runtime.status();
          if (!status.audit?.produktionsbereit) fehler.push('Skill-Katalog-Audit verlor Produktionsbereitschaft.');
          if (status.audit?.katalog?.fingerprint !== katalogFingerprint) fehler.push('Skill-Katalog-Fingerprint hat sich im Soak geaendert.');
          if (status.lokalerSnapshot === null) fehler.push('Lokaler Capability-Snapshot war im Soak nicht verfuegbar.');
          if (status.senden.fehler !== capabilitySendeFehlerVorher) fehler.push('Capability-Sendefehlerzahl hat sich im Soak veraendert.');
          if (runtimeStatus.lebensnachweisSendeFehler !== heartbeatFehlerVorher) fehler.push('Produktionsheartbeat-Sendefehlerzahl hat sich im Soak veraendert.');
        } catch (ursache) {
          fehler.push(ursache instanceof Error ? ursache.message : String(ursache));
        }

        if (Date.now() - gestartetAm >= cfg.soakDauerMillisekunden) {
          if (timer !== null) clearInterval(timer);
          resolve();
        }
      }, cfg.sampleMillisekunden);
    });

    const runtimeNachher = runtime.status();
    const capNachher = capability.aktualisiere().status;
    const erwarteteSamples = Math.max(
      1,
      Math.floor(cfg.soakDauerMillisekunden / cfg.sampleMillisekunden) - 2
    );
    if (samples < erwarteteSamples) {
      fehler.push('Soak-Sampling war zu duenn: ' + samples + ' statt mindestens ' + erwarteteSamples + '.');
    }
    if (runtimeNachher.lebensnachweisSendeErfolge <= heartbeatErfolgeVorher) {
      fehler.push('Produktionsheartbeat hat im Soak keinen neuen Erfolg bestaetigt.');
    }

    const bestanden = fehler.length === 0;
    const durchgefuehrtAm = Date.now();
    const beweis = nachweis('soak', {
      bestanden,
      durchgefuehrtAm,
      deterministisch: false,
      spielAktionAusgefuehrt: true,
      begrenzt: false,
      telemetrieNachweis: bestanden,
      recoveryNachweis: bestanden && cfg.recoveryReplayVerified,
      gesamtauswertungBestanden: bestanden
    });
    letzterBericht = Object.freeze({
      schemaVersion: 1,
      runnerVersion: VERSION,
      stufe: 'soak',
      pass: bestanden,
      fehler: Object.freeze(fehler),
      nachweis: beweis,
      gestartetAm,
      beendetAm: durchgefuehrtAm,
      dauerMillisekunden: cfg.soakDauerMillisekunden,
      sampleMillisekunden: cfg.sampleMillisekunden,
      samples,
      erwarteteSamples,
      katalogFingerprint,
      heartbeatErfolgeVorher,
      heartbeatErfolgeNachher: runtimeNachher.lebensnachweisSendeErfolge,
      heartbeatFehlerVorher,
      heartbeatFehlerNachher: runtimeNachher.lebensnachweisSendeFehler,
      capabilitySendeFehlerVorher,
      capabilitySendeFehlerNachher: capNachher.senden.fehler,
      recoveryReplayVerified: cfg.recoveryReplayVerified
    });
    return letzterBericht;
  }

  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: Object.freeze({
      version: VERSION,
      modus: cfg.modus,
      laufKennung: cfg.laufKennung,
      aenderungsKennung: cfg.aenderungsKennung,
      schatten,
      kontrolliertLive,
      soak,
      status() {
        return Object.freeze({
          schemaVersion: 1,
          version: VERSION,
          modus: cfg.modus,
          laufKennung: cfg.laufKennung,
          aenderungsKennung: cfg.aenderungsKennung,
          verbraucht,
          letzterBericht
        });
      }
    })
  });
})();
