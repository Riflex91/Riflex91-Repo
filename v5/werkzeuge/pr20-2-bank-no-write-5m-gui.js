(() => {
  'use strict';

  const API_NAME = 'V5PR202BankNoWrite5m';
  const VERSION = '1.0.0';
  const SESSION_KEY = 'AIO_V5_PR20_2_BANK_NO_WRITE_5M_V1';
  const BANK_FUNCTION_STATE_KEY = 'AIO_V5_BANK_FUNCTION_TEST_STATE_V1';
  const BESTAETIGUNG = 'PR20.2-BANK-NO-WRITE-5M-START';
  const DAUER_MS = 5 * 60 * 1000;
  const INTERVALL_MS = 15 * 1000;
  const MAX_SAMPLE_GAP_MS = 45 * 1000;
  const MIN_SAMPLES = 20;
  const MAX_SAMPLES = 30;

  function rootFenster() {
    const kandidaten = [];
    try { kandidaten.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) kandidaten.push(parent); } catch {}
    for (const root of kandidaten) {
      try {
        if (root?.character && root.character.bank && root.bank_packs) return root;
      } catch {}
    }
    throw new Error('PR20_2_BANK_5M_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
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
    throw new Error('PR20_2_BANK_5M_STORAGE_FEHLT');
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
    return Object.freeze({ v3, v4, alternativeRuntimeAktiv: v3.aktiv || v4.aktiv });
  }

  function hashText(wert) {
    const text = String(wert ?? '');
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function evidenceFingerprint(basis) {
    return hashText(JSON.stringify(basis));
  }

  function packNummer(pack) {
    const m = /^items([0-9]+)$/.exec(String(pack));
    return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
  }

  function openPackKandidat(root) {
    const c = root.character;
    const katalog = Object.entries(root.bank_packs || {})
      .filter(([pack, row]) => /^items[0-9]+$/.test(pack) && Array.isArray(row))
      .map(([pack, row]) => ({
        pack,
        map: String(row[0] || ''),
        goldKosten: Number(row[1] || 0),
        shellKosten: Number(row[2] || 0),
        freigeschaltet: Object.prototype.hasOwnProperty.call(c.bank || {}, pack)
      }))
      .sort((a, b) => packNummer(a.pack) - packNummer(b.pack));
    for (const row of katalog) {
      if (row.map !== String(c.map || '')) continue;
      if (row.freigeschaltet) continue;
      if (!Number.isSafeInteger(row.goldKosten) || row.goldKosten < 0) continue;
      if (!Number.isSafeInteger(row.shellKosten) || row.shellKosten < 0) continue;
      if (row.goldKosten <= 0 && row.shellKosten <= 0) continue;
      return Object.freeze({
        pack: row.pack,
        map: row.map,
        goldKosten: row.goldKosten,
        shellKosten: row.shellKosten
      });
    }
    return null;
  }

  function bankFunktionsJournalFingerprint() {
    const raw = storage().getItem(BANK_FUNCTION_STATE_KEY);
    return Object.freeze({
      vorhanden: raw !== null,
      laenge: raw === null ? 0 : String(raw).length,
      fingerprint: hashText(raw === null ? '<NICHT_VORHANDEN>' : raw)
    });
  }

  function warteschlangeLeer(c) {
    try { return !c?.q || Object.keys(c.q).length === 0; }
    catch { return false; }
  }

  function snapshot() {
    const root = rootFenster();
    const c = root.character;
    const kandidat = openPackKandidat(root);
    const gold = Number(c.gold);
    const shells = Number(c.cash);
    const bankGold = Number(c.bank?.gold);
    const bindung = Object.freeze({
      accountId: String(c.owner ?? root.user_id ?? ''),
      characterName: String(c.name ?? ''),
      sessionId: String(c.id ?? ''),
      serverRegion: String(root.server_region ?? ''),
      serverKennung: String(root.server_identifier ?? ''),
      ctype: String(c.ctype ?? ''),
      map: String(c.map ?? '')
    });
    const inventory = JSON.stringify(Array.isArray(c.items) ? c.items : []);
    const bank = JSON.stringify(c.bank ?? {});
    const resource = Object.freeze({
      characterGold: Number.isSafeInteger(gold) && gold >= 0 ? gold : null,
      characterShells: Number.isSafeInteger(shells) && shells >= 0 ? shells : null,
      bankGold: Number.isSafeInteger(bankGold) && bankGold >= 0 ? bankGold : null
    });
    const openPack = kandidat === null ? null : Object.freeze({
      ...kandidat,
      goldBezahlbar: resource.characterGold !== null
        && kandidat.goldKosten > 0
        && resource.characterGold >= kandidat.goldKosten,
      shellsBezahlbar: resource.characterShells !== null
        && kandidat.shellKosten > 0
        && resource.characterShells >= kandidat.shellKosten
    });
    const journal = bankFunktionsJournalFingerprint();
    const core = Object.freeze({
      bindung,
      rip: !!c.rip,
      moving: !!c.moving,
      warteschlangeLeer: warteschlangeLeer(c),
      resource,
      inventoryFingerprint: hashText(inventory),
      bankFingerprint: hashText(bank),
      bankFunktionsJournalFingerprint: journal.fingerprint,
      openPack
    });
    return Object.freeze({
      zeitMs: Date.now(),
      ...core,
      coreFingerprint: evidenceFingerprint(core)
    });
  }

  function liesSession() {
    const raw = storage().getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'BESCHAEDIGT', samples: [] }; }
  }

  function schreibeSession(session) {
    const raw = JSON.stringify(session);
    if (raw.length > 800000) throw new Error('PR20_2_BANK_5M_SESSION_ZU_GROSS');
    const s = storage();
    s.setItem(SESSION_KEY, raw);
    if (s.getItem(SESSION_KEY) !== raw) {
      throw new Error('PR20_2_BANK_5M_SESSION_ROUNDTRIP_FEHLER');
    }
  }

  function validiereEvidenceKette(samples) {
    if (!Array.isArray(samples) || samples.length > MAX_SAMPLES) return false;
    let vorher = null;
    for (let i = 0; i < samples.length; i += 1) {
      const s = samples[i];
      if (!s || s.sequenz !== i + 1 || s.vorherigerFingerprint !== vorher) return false;
      const basis = { ...s };
      delete basis.evidenceFingerprint;
      if (s.evidenceFingerprint !== evidenceFingerprint(basis)) return false;
      vorher = s.evidenceFingerprint;
    }
    return true;
  }

  function openPackBleibtBlockiert(s) {
    return !!s?.openPack
      && s.openPack.goldBezahlbar === false
      && s.openPack.shellsBezahlbar === false;
  }

  function bindungKey(s) {
    return JSON.stringify(s?.bindung ?? null);
  }

  async function passiveVorpruefung() {
    const root = rootFenster();
    const c = root.character;
    const performanceTrick = await guiApi().aktivierePerformanceTrick();
    const frisch = snapshot();
    const runtime = runtimeStatus();
    const blocker = [];

    if (!frisch.bindung.accountId) blocker.push('ACCOUNT_BINDUNG_FEHLT');
    if (!frisch.bindung.characterName) blocker.push('CHARAKTER_BINDUNG_FEHLT');
    if (!frisch.bindung.sessionId) blocker.push('SESSION_BINDUNG_FEHLT');
    if (!frisch.bindung.serverRegion || !frisch.bindung.serverKennung) blocker.push('SERVER_BINDUNG_FEHLT');
    if (frisch.bindung.ctype !== 'merchant') blocker.push('NUR_MERCHANT');
    if (frisch.bindung.map !== 'bank' || !c.bank) blocker.push('BANK_NICHT_GEMOUNTET');
    if (frisch.rip) blocker.push('CHARAKTER_TOT');
    if (frisch.moving) blocker.push('CHARAKTER_BEWEGT_SICH');
    if (!frisch.warteschlangeLeer) blocker.push('CHARAKTER_QUEUE_NICHT_LEER');
    if (runtime.alternativeRuntimeAktiv) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (performanceTrick?.aktiv !== true || performanceTrick?.playing !== true) {
      blocker.push('PERFORMANCE_TRICK_NICHT_VERIFIZIERT');
    }
    if (frisch.resource.characterGold === null
        || frisch.resource.characterShells === null
        || frisch.resource.bankGold === null) {
      blocker.push('RESSOURCEN_UNGUELTIG');
    }
    if (!frisch.openPack) blocker.push('OPEN_PACK_KANDIDAT_FEHLT');
    else if (!openPackBleibtBlockiert(frisch)) {
      blocker.push('OPEN_PACK_RESOURCE_STATE_CHANGED_PATH_READY');
    }

    const bestehend = liesSession();
    if (bestehend?.status === 'RUNNING') blocker.push('VORHERIGE_5M_SESSION_UNTERBROCHEN');

    return Object.freeze({
      schemaVersion: 1,
      status: blocker.length === 0 ? 'BESTANDEN' : 'BLOCKIERT',
      testArt: 'PR20_2_BANK_NO_WRITE_5M_PREFLIGHT',
      performanceTrick,
      runtime,
      snapshot: frisch,
      blocker: Object.freeze(blocker),
      bankFunctionTestJournalReadOnly: true,
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      durableIntentErzeugt: false,
      authorityAusgestellt: false,
      liveMutationFreigegeben: false,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    });
  }

  async function sampleErstellen(session) {
    const s = snapshot();
    const runtime = runtimeStatus();
    const performanceTrick = guiApi().performanceTrickStatus();
    const vorher = session.samples.at(-1) || null;
    const gapMs = vorher ? s.zeitMs - vorher.zeitMs : 0;
    const blocker = [];

    if (bindungKey(s) !== session.baselineBindungKey) blocker.push('BINDUNG_DRIFT');
    if (s.coreFingerprint !== session.baselineCoreFingerprint) blocker.push('BANK_INVENTORY_RESOURCE_ODER_JOURNAL_DRIFT');
    if (s.rip) blocker.push('CHARAKTER_TOT');
    if (s.moving) blocker.push('CHARAKTER_BEWEGT_SICH');
    if (!s.warteschlangeLeer) blocker.push('CHARAKTER_QUEUE_NICHT_LEER');
    if (runtime.alternativeRuntimeAktiv) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (performanceTrick?.aktiv !== true || performanceTrick?.playing !== true) {
      blocker.push('PERFORMANCE_TRICK_AUSGEFALLEN');
    }
    if (!openPackBleibtBlockiert(s)) blocker.push('OPEN_PACK_RESOURCE_STATE_CHANGED');
    if (gapMs > MAX_SAMPLE_GAP_MS) blocker.push('SAMPLE_GAP');

    const basis = {
      schemaVersion: 1,
      sequenz: session.samples.length + 1,
      zeitMs: s.zeitMs,
      seitStartMs: s.zeitMs - session.gestartetAmMs,
      vorherigerFingerprint: vorher?.evidenceFingerprint ?? null,
      gapMs,
      bindung: s.bindung,
      coreFingerprint: s.coreFingerprint,
      inventoryFingerprint: s.inventoryFingerprint,
      bankFingerprint: s.bankFingerprint,
      bankFunktionsJournalFingerprint: s.bankFunktionsJournalFingerprint,
      resource: s.resource,
      openPack: s.openPack,
      runtime,
      performanceTrick,
      blocker: Object.freeze(blocker),
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      durableIntentErzeugt: false,
      authorityAusgestellt: false,
      liveMutationFreigegeben: false,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    };
    return Object.freeze({ ...basis, evidenceFingerprint: evidenceFingerprint(basis) });
  }

  function bewerte(session) {
    const samples = session.samples;
    const erster = samples[0] || null;
    const letzter = samples.at(-1) || null;
    const dauerMs = letzter ? letzter.zeitMs - session.gestartetAmMs : 0;
    const sampleGaps = samples.filter((s) => s.gapMs > MAX_SAMPLE_GAP_MS).length;
    const driftSamples = samples.filter((s) => Array.isArray(s.blocker) && s.blocker.length > 0).length;
    const performanceTrickFehler = samples.filter(
      (s) => s.performanceTrick?.aktiv !== true || s.performanceTrick?.playing !== true,
    ).length;
    const alternativeRuntimeSamples = samples.filter(
      (s) => s.runtime?.alternativeRuntimeAktiv === true,
    ).length;
    const blocker = [];

    if (dauerMs < DAUER_MS) blocker.push('DAUER_UNTER_5M');
    if (samples.length < MIN_SAMPLES) blocker.push('ZU_WENIGE_SAMPLES');
    if (!validiereEvidenceKette(samples)) blocker.push('EVIDENCE_KETTE_UNGUELTIG');
    if (sampleGaps !== 0) blocker.push('SAMPLE_GAPS');
    if (driftSamples !== 0) blocker.push('BANK_STABILITAETS_DRIFT');
    if (performanceTrickFehler !== 0) blocker.push('PERFORMANCE_TRICK_FEHLER');
    if (alternativeRuntimeSamples !== 0) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');

    return Object.freeze({
      schemaVersion: 1,
      status: blocker.length === 0 ? 'BESTANDEN' : 'NICHT_BESTANDEN',
      testArt: 'PR20_2_BANK_NO_WRITE_5M',
      dauerMs,
      sampleAnzahl: samples.length,
      sampleGaps,
      driftSamples,
      evidenceKetteGueltig: validiereEvidenceKette(samples),
      ersteEvidence: erster?.evidenceFingerprint ?? null,
      letzteEvidence: letzter?.evidenceFingerprint ?? null,
      performanceTrickFehler,
      alternativeRuntimeSamples,
      blocker: Object.freeze(blocker),
      grenzen: Object.freeze({
        testdauerMs: DAUER_MS,
        intervallMs: INTERVALL_MS,
        maximalerSampleGapMs: MAX_SAMPLE_GAP_MS,
        minimaleSamples: MIN_SAMPLES,
        maximaleSamples: MAX_SAMPLES
      }),
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      durableIntentErzeugt: false,
      authorityAusgestellt: false,
      liveMutationFreigegeben: false,
      functionalTestBudgetConsumed: false,
      withdrawTestbudgetVerbraucht: false,
      sameIntentErneutSenden: false,
      pr20_2ExitGateBleibt: 'BLOCKIERT_FAIL_CLOSED',
      schliesstWithdrawNicht: true,
      schliesstOpenPackLiveNicht: true,
      pr20_3MarktStartErlaubt: false,
      hinweis: blocker.length === 0
        ? '5-Minuten Bank-NO-WRITE-Stabilitaetsevidence BESTANDEN. PR20.2 bleibt wegen Withdraw und Open-Pack Live fail-closed.'
        : '5-Minuten Bank-NO-WRITE-Stabilitaetsevidence NICHT BESTANDEN. Kein Gameplay-Send; Bericht auswerten.'
    });
  }

  const gui = guiApi().erstelleTest({
    kennung: 'pr20-2-bank-no-write-5m',
    titel: 'V5 · PR20.2 Bank · NO-WRITE 5M',
    beschreibung: 'Fuenf Minuten reine Bank-/Inventory-/Ressourcenbeobachtung im Adventure-Land-CODE-Runner. Keine Bankmutation, kein Intent, keine Authority und kein Verbrauch des Live-Funktionstestbudgets.'
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
    gui.setzeRestzeit(restzeitMs(session), 'Verbleibende NO-WRITE-Testdauer');
  }

  function stoppeCountdown(abgeschlossen = false) {
    if (countdownTimer !== null) clearInterval(countdownTimer);
    countdownTimer = null;
    if (abgeschlossen) gui.setzeRestzeit(0, 'NO-WRITE-Testdauer erreicht');
    else gui.setzeRestzeit(null);
  }

  function starteCountdown() {
    stoppeCountdown(false);
    aktualisiereCountdown();
    countdownTimer = setInterval(aktualisiereCountdown, 1000);
  }

  async function tick() {
    if (!laeuft || sampling) return;
    sampling = true;
    try {
      const session = liesSession();
      if (!session || session.status !== 'RUNNING') {
        throw new Error('PR20_2_BANK_5M_SESSION_NICHT_RUNNING');
      }
      if (!validiereEvidenceKette(session.samples)) {
        throw new Error('PR20_2_BANK_5M_EVIDENCE_KETTE_MANIPULIERT');
      }
      const sample = await sampleErstellen(session);
      const samples = [...session.samples, sample];
      if (samples.length > MAX_SAMPLES) {
        throw new Error('PR20_2_BANK_5M_SAMPLE_GRENZE_UEBERSCHRITTEN');
      }
      const aktualisiert = { ...session, samples };
      schreibeSession(aktualisiert);
      const elapsed = sample.seitStartMs;

      gui.setzeErgebnis({
        status: 'LAEUFT',
        testArt: 'PR20_2_BANK_NO_WRITE_5M',
        seitStartMs: elapsed,
        sampleAnzahl: samples.length,
        letzterGapMs: sample.gapMs,
        letzterFingerprint: sample.evidenceFingerprint,
        letzterBlocker: sample.blocker,
        gameplayWrites: 0,
        mutatingPublicFunctionCalls: 0,
        functionalTestBudgetConsumed: false,
        restzeitMs: Math.max(0, DAUER_MS - elapsed)
      }, 'laeuft', 'Bank NO-WRITE 5M laeuft · Restzeit ' + Math.ceil(Math.max(0, DAUER_MS - elapsed) / 1000) + ' s');

      if (sample.blocker.length > 0 || elapsed >= DAUER_MS) {
        laeuft = false;
        if (timer !== null) clearInterval(timer);
        timer = null;
        stoppeCountdown(elapsed >= DAUER_MS);
        const finalSession = {
          ...aktualisiert,
          status: 'COMPLETED',
          abgeschlossenAmMs: Date.now()
        };
        const result = bewerte(finalSession);
        schreibeSession({ ...finalSession, result });
        gui.protokolliere('PR20.2 Bank NO-WRITE 5M abgeschlossen', result);
        gui.setzeErgebnis(
          result,
          result.status === 'BESTANDEN' ? 'bestanden' : 'fehler',
          result.status === 'BESTANDEN'
            ? 'Bank NO-WRITE 5M BESTANDEN · Gesamtbericht kopieren.'
            : 'Bank NO-WRITE 5M NICHT BESTANDEN · Kein Send. Gesamtbericht kopieren.'
        );
      }
    } catch (error) {
      laeuft = false;
      if (timer !== null) clearInterval(timer);
      timer = null;
      stoppeCountdown(false);
      const fehler = String(error?.message || error);
      const session = liesSession();
      if (session?.status === 'RUNNING') {
        try {
          schreibeSession({
            ...session,
            status: 'FAILED',
            fehler,
            abgeschlossenAmMs: Date.now()
          });
        } catch {}
      }
      gui.setzeErgebnis({
        status: 'FEHLER',
        testArt: 'PR20_2_BANK_NO_WRITE_5M',
        fehler,
        gameplayWrites: 0,
        mutatingPublicFunctionCalls: 0,
        functionalTestBudgetConsumed: false
      }, 'fehler', fehler);
      gui.protokolliere('PR20.2 Bank NO-WRITE 5M FEHLER', fehler);
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
      gui.protokolliere('PR20.2 Bank NO-WRITE 5M Vorpruefung', result);
      gui.setzeErgebnis(
        result,
        result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        result.status === 'BESTANDEN'
          ? 'Vorprüfung BESTANDEN. Read-only 5-Minuten-Lauf kann gestartet werden.'
          : 'Vorprüfung BLOCKIERT. Kein Lauf gestartet.'
      );
      gui.setzeAktionAktiv('start', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'start',
    titel: '2 · NO-WRITE 5M starten',
    art: 'primaer',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG,
    async ausfuehren() {
      if (laeuft) throw new Error('PR20_2_BANK_5M_BEREITS_AKTIV');
      const pre = await passiveVorpruefung();
      if (pre.status !== 'BESTANDEN') {
        gui.setzeErgebnis(pre, 'blockiert', 'Frische Vorprüfung blockiert. Kein Start.');
        return pre;
      }
      const start = pre.snapshot;
      const session = {
        schemaVersion: 1,
        status: 'RUNNING',
        controllerVersion: VERSION,
        testArt: 'PR20_2_BANK_NO_WRITE_5M',
        gestartetAmMs: Date.now(),
        abgeschlossenAmMs: null,
        baselineBindungKey: bindungKey(start),
        baselineCoreFingerprint: start.coreFingerprint,
        baselineSnapshot: start,
        bankFunctionTestJournalReadOnly: true,
        functionalTestBudgetConsumed: false,
        gameplayWrites: 0,
        mutatingPublicFunctionCalls: 0,
        durableIntentErzeugt: false,
        authorityAusgestellt: false,
        liveMutationFreigegeben: false,
        sameIntentErneutSenden: false,
        samples: []
      };
      schreibeSession(session);
      laeuft = true;
      starteCountdown();
      gui.protokolliere('PR20.2 Bank NO-WRITE 5M gestartet', {
        gestartetAmMs: session.gestartetAmMs,
        dauerMs: DAUER_MS,
        intervallMs: INTERVALL_MS,
        baselineCoreFingerprint: session.baselineCoreFingerprint,
        gameplayWrites: 0,
        functionalTestBudgetConsumed: false
      });
      await tick();
      if (laeuft) timer = setInterval(tick, INTERVALL_MS);
      return Object.freeze({
        status: 'LAEUFT',
        testArt: 'PR20_2_BANK_NO_WRITE_5M',
        gestartetAmMs: session.gestartetAmMs,
        dauerMs: DAUER_MS,
        gameplayWrites: 0,
        mutatingPublicFunctionCalls: 0,
        functionalTestBudgetConsumed: false,
        sameIntentErneutSenden: false
      });
    }
  });

  gui.registriereAktion({
    kennung: 'diagnose',
    titel: 'Diagnose / gespeicherter Stand',
    async ausfuehren() {
      const result = Object.freeze({
        schemaVersion: 1,
        session: liesSession(),
        aktuellerSnapshot: snapshot(),
        bankFunctionTestJournalReadOnly: true,
        gameplayWrites: 0,
        mutatingPublicFunctionCalls: 0,
        functionalTestBudgetConsumed: false,
        sameIntentErneutSenden: false
      });
      gui.protokolliere('PR20.2 Bank NO-WRITE 5M Diagnose', result);
      return gui.setzeErgebnis(result, 'info', 'Read-only Diagnose; kein Bank-Testbudget veraendert.');
    }
  });

  gui.protokolliere('PR20.2 Bank NO-WRITE 5M GUI gestartet', {
    controllerVersion: VERSION,
    testdauerMs: DAUER_MS,
    intervallMs: INTERVALL_MS,
    bankFunctionTestJournalReadOnly: true,
    gameplayWrites: 0,
    mutatingPublicFunctionCalls: 0,
    functionalTestBudgetConsumed: false,
    sameIntentErneutSenden: false
  });

  const api = Object.freeze({
    version: VERSION,
    sessionKey: SESSION_KEY,
    bankFunctionStateKey: BANK_FUNCTION_STATE_KEY,
    bestaetigung: BESTAETIGUNG,
    test: gui,
    passiveVorpruefung,
    diagnose: () => liesSession(),
    aktuellerSnapshot: snapshot,
    kopiereBericht: () => gui.kopiereBericht()
  });

  try { delete globalThis[API_NAME]; } catch {}
  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
  try {
    if (parent && parent !== globalThis) {
      try { delete parent[API_NAME]; } catch {}
      Object.defineProperty(parent, API_NAME, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    }
  } catch {}
})();
