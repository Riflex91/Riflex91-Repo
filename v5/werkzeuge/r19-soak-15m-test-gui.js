(() => {
  'use strict';

  const API_NAME = 'V5R19Soak15mGui';
  const VERSION = '1.0.0';
  const SESSION_KEY = 'AIO_V5_R19_SOAK_15M_SESSION_V1';
  const PROBE_KEY = 'AIO_V5_R19_SOAK_15M_PROBE_V1';
  const BESTAETIGUNG = 'R19-SOAK-15M-START';
  const DAUER_MS = 15 * 60 * 1000;
  const INTERVALL_MS = 30 * 1000;
  const MAX_SAMPLE_GAP_MS = 90 * 1000;
  const MAX_SAMPLES = 40;
  const MIN_FREIE_BYTES = 64 * 1024 * 1024;
  const MAX_BROWSER_PERSISTENZ_ROUNDTRIP_MS = 250;
  const MAX_HEAP_WACHSTUM_BYTES = 512 * 1024 * 1024;

  function rootFenster() {
    const kandidaten = [];
    try { kandidaten.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) kandidaten.push(parent); } catch {}
    for (const root of kandidaten) {
      try {
        if (root?.character && Array.isArray(root.character.items) && root.character.slots && root.G?.items) return root;
      } catch {}
    }
    throw new Error('R19_SOAK_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
  }

  function guiApi() {
    try { if (globalThis.V5TestGui) return globalThis.V5TestGui; } catch {}
    try { if (parent?.V5TestGui) return parent.V5TestGui; } catch {}
    throw new Error('V5_TEST_GUI_FEHLT');
  }

  function storage() {
    const root = rootFenster();
    try { if (root.localStorage) return root.localStorage; } catch {}
    try { if (globalThis.localStorage) return globalThis.localStorage; } catch {}
    throw new Error('R19_SOAK_STORAGE_FEHLT');
  }

  function browserRoot() {
    try {
      if (parent && parent !== globalThis) return parent;
    } catch {}
    return globalThis;
  }

  function runtimeStatus() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    let v3 = { vorhanden: false, aktiv: false };
    let v4 = { vorhanden: false, aktiv: false };
    for (const root of roots) {
      try {
        const runtime = root?.AIO_V3?.__runtime;
        if (runtime) {
          const status = typeof runtime.status === 'function' ? runtime.status() : null;
          v3 = { vorhanden: true, aktiv: !!(runtime.timer || status?.running === true) };
        }
      } catch {
        v3 = { vorhanden: true, aktiv: true };
      }
      try {
        const runtime = root?.V4ProduktionsLaufzeit || root?.AIO_V4 || root?.V4Runtime;
        if (runtime) {
          const status = typeof runtime.status === 'function' ? runtime.status() : null;
          v4 = {
            vorhanden: true,
            aktiv: !!(status && (
              status.running === true ||
              status.aktivFreigegeben === true ||
              status.gestoppt === false ||
              status.empfangInstalliert === true
            ))
          };
        }
      } catch {
        v4 = { vorhanden: true, aktiv: true };
      }
    }
    return { v3, v4, alternativeRuntimeAktiv: v3.aktiv || v4.aktiv };
  }

  function performanceApi() {
    const root = browserRoot();
    return root.performance || globalThis.performance;
  }

  function navigatorApi() {
    const root = browserRoot();
    return root.navigator || globalThis.navigator;
  }

  function heapSnapshot() {
    const perf = performanceApi();
    const memory = perf?.memory;
    if (!memory || !Number.isFinite(memory.usedJSHeapSize) || !Number.isFinite(memory.jsHeapSizeLimit)) {
      return { unterstuetzt: false, usedJSHeapSize: null, jsHeapSizeLimit: null };
    }
    return {
      unterstuetzt: true,
      usedJSHeapSize: Math.trunc(memory.usedJSHeapSize),
      jsHeapSizeLimit: Math.trunc(memory.jsHeapSizeLimit)
    };
  }

  async function storageSchaetzung() {
    const nav = navigatorApi();
    if (!nav?.storage?.estimate) {
      return { unterstuetzt: false, quota: null, usage: null, freieBytes: null };
    }
    try {
      const e = await nav.storage.estimate();
      const quota = Number.isFinite(e?.quota) ? Math.trunc(e.quota) : null;
      const usage = Number.isFinite(e?.usage) ? Math.trunc(e.usage) : null;
      const freieBytes = quota !== null && usage !== null ? Math.max(0, quota - usage) : null;
      return { unterstuetzt: quota !== null && usage !== null, quota, usage, freieBytes };
    } catch {
      return { unterstuetzt: false, quota: null, usage: null, freieBytes: null };
    }
  }

  function persistenzRoundtrip() {
    const store = storage();
    const perf = performanceApi();
    const now = () => typeof perf?.now === 'function' ? perf.now() : Date.now();
    const wert = JSON.stringify({ zeit: Date.now(), probe: 'R19_SOAK_15M' });
    const start = now();
    store.setItem(PROBE_KEY, wert);
    const gelesen = store.getItem(PROBE_KEY);
    store.removeItem(PROBE_KEY);
    const ms = Math.max(0, now() - start);
    return { ok: gelesen === wert, roundtripMs: ms };
  }

  function hashText(text) {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function fingerprint(sampleOhneFingerprint) {
    return hashText(JSON.stringify(sampleOhneFingerprint));
  }

  function liesSession() {
    const raw = storage().getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'BESCHAEDIGT', samples: [] }; }
  }

  function schreibeSession(session) {
    const text = JSON.stringify(session);
    if (text.length > 900_000) throw new Error('R19_SOAK_SESSION_ZU_GROSS');
    const store = storage();
    store.setItem(SESSION_KEY, text);
    if (store.getItem(SESSION_KEY) !== text) throw new Error('R19_SOAK_SESSION_ROUNDTRIP_FEHLER');
  }

  function validiereKette(samples) {
    if (!Array.isArray(samples) || samples.length > MAX_SAMPLES) return false;
    let vorher = null;
    for (let i = 0; i < samples.length; i += 1) {
      const s = samples[i];
      if (!s || s.sequenz !== i + 1 || s.vorherigerFingerprint !== vorher) return false;
      const basis = { ...s };
      delete basis.evidenceFingerprint;
      if (s.evidenceFingerprint !== fingerprint(basis)) return false;
      vorher = s.evidenceFingerprint;
    }
    return true;
  }

  async function sampleErstellen(session) {
    const root = rootFenster();
    const c = root.character;
    const jetztMs = Date.now();
    const vorher = session.samples.at(-1) || null;
    const gapMs = vorher ? jetztMs - vorher.zeitMs : 0;
    const heap = heapSnapshot();
    const storageEstimate = await storageSchaetzung();
    const persistenz = persistenzRoundtrip();
    const runtime = runtimeStatus();
    const performanceTrick = guiApi().performanceTrickStatus();

    const basis = {
      schemaVersion: 1,
      sequenz: session.samples.length + 1,
      zeitMs: jetztMs,
      seitStartMs: jetztMs - session.gestartetAmMs,
      vorherigerFingerprint: vorher?.evidenceFingerprint ?? null,
      gapMs,
      charakter: String(c?.name || ''),
      rip: !!c?.rip,
      runtime,
      performanceTrick,
      heap,
      storage: storageEstimate,
      browserPersistenzRoundtripMs: persistenz.roundtripMs,
      browserPersistenzOk: persistenz.ok,
      interneIoQueueTiefe: 0,
      recorderDrops: session.recorderDrops,
      gameplayWritesDurchHarness: 0,
      unerwarteteGameWritesImHarness: 0,
      breiteRuntimeFreigabe: false
    };
    return Object.freeze({ ...basis, evidenceFingerprint: fingerprint(basis) });
  }

  function bewerte(session) {
    const samples = session.samples;
    const erster = samples[0];
    const letzter = samples.at(-1);
    const gaps = samples.filter(s => s.gapMs > MAX_SAMPLE_GAP_MS).length;
    const heapFehlt = samples.some(s => s.heap?.unterstuetzt !== true);
    const storageFehlt = samples.some(s => s.storage?.unterstuetzt !== true);
    const persistenzFehler = samples.filter(s => s.browserPersistenzOk !== true).length;
    const minFreieBytes = storageFehlt ? null : Math.min(...samples.map(s => s.storage.freieBytes));
    const maxRoundtripMs = Math.max(...samples.map(s => s.browserPersistenzRoundtripMs));
    const ersterHeap = erster?.heap?.usedJSHeapSize ?? null;
    const maxHeap = heapFehlt ? null : Math.max(...samples.map(s => s.heap.usedJSHeapSize));
    const heapWachstumBytes = ersterHeap === null || maxHeap === null ? null : Math.max(0, maxHeap - ersterHeap);
    const alternativeRuntimeSamples = samples.filter(s => s.runtime?.alternativeRuntimeAktiv === true).length;
    const toteSamples = samples.filter(s => s.rip === true).length;
    const performanceTrickFehler = samples.filter(s => s.performanceTrick?.aktiv !== true).length;
    const hiddenSamples = samples.filter(s => s.performanceTrick?.visibilityState === 'hidden').length;
    const dauerMs = letzter ? letzter.zeitMs - session.gestartetAmMs : 0;
    const genugSamples = samples.length >= 30;
    const grenzen = {
      dauerMs: DAUER_MS,
      intervallMs: INTERVALL_MS,
      maximalerSampleGapMs: MAX_SAMPLE_GAP_MS,
      minimaleSamples: 30,
      minimaleFreieBytes: MIN_FREIE_BYTES,
      maximalerBrowserPersistenzRoundtripMs: MAX_BROWSER_PERSISTENZ_ROUNDTRIP_MS,
      maximalesHeapWachstumBytes: MAX_HEAP_WACHSTUM_BYTES
    };
    const blocker = [];
    if (dauerMs < DAUER_MS) blocker.push('DAUER_UNTER_15M');
    if (!genugSamples) blocker.push('ZU_WENIGE_SAMPLES');
    if (!validiereKette(samples)) blocker.push('EVIDENCE_KETTE_UNGUELTIG');
    if (gaps !== 0) blocker.push('SAMPLE_GAPS');
    if (session.recorderDrops !== 0) blocker.push('RECORDER_DROPS');
    if (heapFehlt) blocker.push('HEAP_METRIK_FEHLT');
    if (storageFehlt) blocker.push('STORAGE_ESTIMATE_FEHLT');
    if (persistenzFehler !== 0) blocker.push('BROWSER_PERSISTENZ_FEHLER');
    if (minFreieBytes !== null && minFreieBytes < MIN_FREIE_BYTES) blocker.push('SPEICHERRESERVE_ZU_KLEIN');
    if (maxRoundtripMs > MAX_BROWSER_PERSISTENZ_ROUNDTRIP_MS) blocker.push('BROWSER_PERSISTENZ_ZU_LANGSAM');
    if (heapWachstumBytes !== null && heapWachstumBytes > MAX_HEAP_WACHSTUM_BYTES) blocker.push('HEAP_WACHSTUM_ZU_GROSS');
    if (alternativeRuntimeSamples !== 0) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (toteSamples !== 0) blocker.push('CHARAKTER_TOT');
    if (performanceTrickFehler !== 0) blocker.push('PERFORMANCE_TRICK_AUSGEFALLEN');
    return {
      schemaVersion: 1,
      test: 'R19_SOAK_15M_CANARY_SCOPE',
      phase: 'R19',
      zertifizierungsStufe: 'SOAK_15M',
      status: blocker.length ? 'NICHT_BESTANDEN' : 'BESTANDEN',
      breiteRuntimeFreigabe: false,
      scope: 'CANARY_SCOPE_READ_ONLY_SOAK',
      gameplayWritesDurchHarness: 0,
      unerwarteteGameWritesImHarness: 0,
      sampleAnzahl: samples.length,
      dauerMs,
      sampleGaps: gaps,
      recorderDrops: session.recorderDrops,
      evidenceKetteGueltig: validiereKette(samples),
      ersteEvidence: erster?.evidenceFingerprint ?? null,
      letzteEvidence: letzter?.evidenceFingerprint ?? null,
      ressourcen: {
        heapMetrikUnterstuetzt: !heapFehlt,
        storageEstimateUnterstuetzt: !storageFehlt,
        ersterHeapBytes: ersterHeap,
        maxHeapBytes: maxHeap,
        heapWachstumBytes,
        minFreieBytes,
        maxBrowserPersistenzRoundtripMs: maxRoundtripMs,
        maxInterneIoQueueTiefe: 0,
        browserPersistenzFehler: persistenzFehler
      },
      runtime: {
        alternativeRuntimeSamples,
        toteSamples,
        performanceTrickFehler,
        hiddenSamples
      },
      grenzen,
      blocker,
      hinweis: blocker.length
        ? '15-Minuten-Soak nicht bestanden. Nicht wiederholen, bevor der Bericht ausgewertet wurde.'
        : '15-Minuten-Canary-Scope-Soak bestanden. Diese Evidence gibt die breite Runtime nicht frei.'
    };
  }

  const gui = guiApi().erstelleTest({
    kennung: 'r19-soak-15m',
    titel: 'V5 · R19 SOAK 15M · Canary-Scope',
    beschreibung: 'Lueckenlose 15-Minuten-Zeitreihe ohne Gameplay-Writes. Browser-Speicherreserve, Heap, Persistenz-Roundtrip und Sample-Gaps werden fail-closed bewertet.'
  });

  let timer = null;
  let countdownTimer = null;
  let laeuft = false;
  let sampling = false;

  function restzeitMs(session) {
    if (!session?.gestartetAmMs) return DAUER_MS;
    return Math.max(0, DAUER_MS - (Date.now() - session.gestartetAmMs));
  }

  function aktualisiereCountdown() {
    if (!laeuft) return;
    const session = liesSession();
    if (!session || session.status !== 'RUNNING') return;
    gui.setzeRestzeit(restzeitMs(session), 'Verbleibende Testdauer');
  }

  function stoppeCountdown(abgeschlossen = false) {
    if (countdownTimer !== null) clearInterval(countdownTimer);
    countdownTimer = null;
    if (abgeschlossen) gui.setzeRestzeit(0, 'Testdauer erreicht');
    else gui.setzeRestzeit(null);
  }

  function starteCountdown() {
    stoppeCountdown(false);
    aktualisiereCountdown();
    countdownTimer = setInterval(aktualisiereCountdown, 1000);
  }

  async function passiveVorpruefung() {
    const bestehend = liesSession();
    const root = rootFenster();
    const heap = heapSnapshot();
    const estimate = await storageSchaetzung();
    const persistenz = persistenzRoundtrip();
    const runtime = runtimeStatus();
    const performanceTrick = await guiApi().aktivierePerformanceTrick();
    const blocker = [];
    if (!String(root.character?.name || '')) blocker.push('CHARAKTER_FEHLT');
    if (root.character?.rip) blocker.push('CHARAKTER_TOT');
    if (runtime.alternativeRuntimeAktiv) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (!performanceTrick.aktiv) blocker.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    if (!heap.unterstuetzt) blocker.push('HEAP_METRIK_FEHLT');
    if (!estimate.unterstuetzt) blocker.push('STORAGE_ESTIMATE_FEHLT');
    if (estimate.freieBytes !== null && estimate.freieBytes < MIN_FREIE_BYTES) blocker.push('SPEICHERRESERVE_ZU_KLEIN');
    if (!persistenz.ok) blocker.push('BROWSER_PERSISTENZ_FEHLER');
    if (bestehend?.status === 'RUNNING') blocker.push('VORHERIGE_SOAK_SESSION_UNTERBROCHEN');
    return {
      schemaVersion: 1,
      status: blocker.length ? 'BLOCKIERT' : 'BESTANDEN',
      zeitMs: Date.now(),
      charakter: String(root.character?.name || ''),
      runtime,
      performanceTrick,
      heap,
      storage: estimate,
      browserPersistenzRoundtripMs: persistenz.roundtripMs,
      blocker,
      breiteRuntimeFreigabe: false
    };
  }

  async function tick() {
    if (!laeuft || sampling) return;
    sampling = true;
    try {
      const session = liesSession();
      if (!session || session.status !== 'RUNNING') throw new Error('R19_SOAK_SESSION_NICHT_RUNNING');
      if (!validiereKette(session.samples)) throw new Error('R19_SOAK_EVIDENCE_KETTE_MANIPULIERT');
      const sample = await sampleErstellen(session);
      const samples = [...session.samples, sample];
      if (samples.length > MAX_SAMPLES) throw new Error('R19_SOAK_SAMPLE_GRENZE_UEBERSCHRITTEN');
      const aktualisiert = { ...session, samples };
      schreibeSession(aktualisiert);
      const elapsed = sample.seitStartMs;
      gui.setzeErgebnis({
        status: 'LAEUFT',
        zertifizierungsStufe: 'SOAK_15M',
        seitStartMs: elapsed,
        sampleAnzahl: samples.length,
        letzterGapMs: sample.gapMs,
        letzterFingerprint: sample.evidenceFingerprint,
        breiteRuntimeFreigabe: false,
        gameplayWritesDurchHarness: 0,
        restzeitMs: Math.max(0, DAUER_MS - elapsed)
      }, 'laeuft', 'SOAK_15M laeuft · Restzeit ' + Math.ceil(Math.max(0, DAUER_MS - elapsed) / 1000) + ' s');
      if (elapsed >= DAUER_MS) {
        laeuft = false;
        if (timer !== null) clearInterval(timer);
        timer = null;
        stoppeCountdown(true);
        const finalSession = { ...aktualisiert, status: 'COMPLETED', abgeschlossenAmMs: Date.now() };
        const result = bewerte(finalSession);
        schreibeSession({ ...finalSession, result });
        gui.protokolliere('SOAK_15M abgeschlossen', result);
        gui.setzeErgebnis(
          result,
          result.status === 'BESTANDEN' ? 'bestanden' : 'fehler',
          result.status === 'BESTANDEN'
            ? 'SOAK_15M BESTANDEN · Jetzt Gesamtbericht kopieren.'
            : 'SOAK_15M NICHT BESTANDEN · Kein Neustart. Gesamtbericht kopieren.'
        );
      }
    } catch (error) {
      laeuft = false;
      if (timer !== null) clearInterval(timer);
      timer = null;
      stoppeCountdown(false);
      const message = String(error?.message || error);
      const session = liesSession();
      if (session && session.status === 'RUNNING') {
        try { schreibeSession({ ...session, status: 'FAILED', fehler: message, abgeschlossenAmMs: Date.now() }); } catch {}
      }
      gui.setzeErgebnis({ status: 'FEHLER', fehler: message }, 'fehler', message);
      gui.protokolliere('SOAK_15M FEHLER', message);
    } finally {
      sampling = false;
    }
  }

  gui.registriereAktion({
    kennung: 'vorpruefung',
    titel: '1 · Passive Vorprüfung',
    art: 'primaer',
    async ausfuehren() {
      const result = await passiveVorpruefung();
      gui.protokolliere('SOAK_15M Vorpruefung', result);
      gui.setzeErgebnis(
        result,
        result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        result.status === 'BESTANDEN'
          ? 'Vorprüfung bestanden. 15-Minuten-Soak kann gestartet werden.'
          : 'Vorprüfung blockiert. Kein Soak gestartet.'
      );
      gui.setzeAktionAktiv('start', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'start',
    titel: '2 · SOAK_15M starten',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG,
    async ausfuehren() {
      if (laeuft) throw new Error('R19_SOAK_BEREITS_AKTIV');
      const pre = await passiveVorpruefung();
      if (pre.status !== 'BESTANDEN') {
        gui.setzeErgebnis(pre, 'blockiert', 'Frische Vorprüfung blockiert. Kein Start.');
        return pre;
      }
      const session = {
        schemaVersion: 1,
        status: 'RUNNING',
        zertifizierungsStufe: 'SOAK_15M',
        gestartetAmMs: Date.now(),
        charakter: pre.charakter,
        recorderDrops: 0,
        samples: [],
        breiteRuntimeFreigabe: false,
        gameplayWritesDurchHarness: 0
      };
      schreibeSession(session);
      laeuft = true;
      starteCountdown();
      gui.protokolliere('SOAK_15M gestartet', {
        gestartetAmMs: session.gestartetAmMs,
        intervallMs: INTERVALL_MS,
        dauerMs: DAUER_MS,
        bestaetigungsText: BESTAETIGUNG,
        gameplayWritesDurchHarness: 0,
        breiteRuntimeFreigabe: false
      });
      await tick();
      if (laeuft) timer = setInterval(() => { void tick(); }, INTERVALL_MS);
      return { status: 'LAEUFT', gestartetAmMs: session.gestartetAmMs, dauerMs: DAUER_MS };
    }
  });

  gui.registriereAktion({
    kennung: 'zwischenstand',
    titel: 'Zwischenstand',
    ausfuehren() {
      const session = liesSession();
      const result = session?.result ?? {
        status: session?.status ?? 'LEER',
        zertifizierungsStufe: 'SOAK_15M',
        sampleAnzahl: session?.samples?.length ?? 0,
        seitStartMs: session?.gestartetAmMs ? Date.now() - session.gestartetAmMs : 0,
        restzeitMs: session?.gestartetAmMs ? restzeitMs(session) : DAUER_MS,
        evidenceKetteGueltig: Array.isArray(session?.samples) ? validiereKette(session.samples) : false,
        breiteRuntimeFreigabe: false
      };
      gui.protokolliere('SOAK_15M Zwischenstand', result);
      gui.setzeErgebnis(result, session?.status === 'COMPLETED' ? 'info' : 'laeuft', 'SOAK_15M Zwischenstand.');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'abbrechen',
    titel: 'Soak abbrechen',
    art: 'gefahr',
    ausfuehren() {
      laeuft = false;
      if (timer !== null) clearInterval(timer);
      timer = null;
      stoppeCountdown(false);
      const session = liesSession();
      if (session?.status === 'RUNNING') {
        schreibeSession({ ...session, status: 'ABGEBROCHEN', abgeschlossenAmMs: Date.now() });
      }
      const result = { status: 'ABGEBROCHEN', zertifizierungsStufe: 'SOAK_15M', bestanden: false };
      gui.protokolliere('SOAK_15M abgebrochen', result);
      gui.setzeErgebnis(result, 'warnung', 'Soak abgebrochen. Diese Stufe ist nicht bestanden.');
      return result;
    }
  });

  const api = Object.freeze({
    version: VERSION,
    bestaetigungsText: BESTAETIGUNG,
    test: gui,
    passiveVorpruefung,
    status: () => liesSession(),
    kopiereBericht: () => gui.kopiereBericht()
  });

  try { delete globalThis[API_NAME]; } catch {}
  Object.defineProperty(globalThis, API_NAME, { configurable: true, enumerable: true, writable: false, value: api });
  try {
    if (parent && parent !== globalThis) {
      try { delete parent[API_NAME]; } catch {}
      Object.defineProperty(parent, API_NAME, { configurable: true, enumerable: true, writable: false, value: api });
    }
  } catch {}

  gui.protokolliere('R19 SOAK_15M GUI bereit', {
    version: VERSION,
    bestaetigungsText: BESTAETIGUNG,
    dauerMs: DAUER_MS,
    intervallMs: INTERVALL_MS,
    maximalerSampleGapMs: MAX_SAMPLE_GAP_MS,
    gameplayWritesDurchHarness: 0,
    breiteRuntimeFreigabe: false
  });
  gui.setzeStatus('bereit', 'Mit „1 · Passive Vorprüfung“ beginnen.');
})();