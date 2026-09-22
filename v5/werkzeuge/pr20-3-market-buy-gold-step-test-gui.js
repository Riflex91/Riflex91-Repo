(() => {
  'use strict';

  const API_NAME = 'V5PR203BuyGoldStepTest';
  const VERSION = '1.0.0';
  const TESTKENNUNG = 'pr20-3-market-buy-gold-step-test';
  const STATE_KEY = 'AIO_V5_PR20_3_BUY_GOLD_STEP_TEST_V1';

  const MENGE = 1;
  const MAX_TRUE_TESTS = 2;
  const TEST_GOLD_RESERVE = 1000000;
  const MAX_TEST_COST = 10000;
  const STABILITY_MS = 750;
  const SETTLEMENT_TIMEOUT_MS = 15000;
  const SETTLEMENT_POLL_MS = 250;

  const SOAK_MS = 5 * 60 * 1000;
  const SOAK_INTERVAL_MS = 15 * 1000;
  const MAX_SAMPLE_GAP_MS = 45 * 1000;
  const MIN_SAMPLES = 20;
  const MAX_SAMPLES = 30;

  const BESTAETIGUNG_LIVE_1 = 'PR20.3-BUY-GOLD-LIVE-1';
  const BESTAETIGUNG_LIVE_2 = 'PR20.3-BUY-GOLD-LIVE-2';

  let soakTimer = null;
  let soakSampling = false;

  function guiApi() {
    try { if (globalThis.V5TestGui) return globalThis.V5TestGui; } catch {}
    try { if (parent?.V5TestGui) return parent.V5TestGui; } catch {}
    throw new Error('PR20_3_MARKET_TEST_GUI_FEHLT');
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) out.push(parent); } catch {}
    for (const root of [...out]) {
      try {
        if (root?.parent && root.parent !== root && !out.includes(root.parent)) out.push(root.parent);
      } catch {}
    }
    return out;
  }

  function rootFenster() {
    for (const root of roots()) {
      try {
        if (root?.character && Array.isArray(root.character.items) && root.G?.items && root.G?.maps) {
          return root;
        }
      } catch {}
    }
    throw new Error('PR20_3_MARKET_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
  }

  function storage() {
    for (const root of roots()) {
      try { if (root?.localStorage) return root.localStorage; } catch {}
    }
    throw new Error('PR20_3_MARKET_LOCAL_STORAGE_FEHLT');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function text(wert) {
    return wert === null || wert === undefined ? '' : String(wert).trim();
  }

  function safeInt(wert) {
    const n = Number(wert);
    return Number.isSafeInteger(n) ? n : null;
  }

  function kanonisch(wert) {
    if (wert === null) return 'null';
    const typ = typeof wert;
    if (typ === 'string' || typ === 'boolean') return JSON.stringify(wert);
    if (typ === 'number') return Number.isFinite(wert) ? JSON.stringify(wert) : JSON.stringify(String(wert));
    if (typ === 'undefined') return '"[undefined]"';
    if (Array.isArray(wert)) return '[' + wert.map(kanonisch).join(',') + ']';
    if (typ === 'object') {
      const keys = Object.keys(wert).sort();
      return '{' + keys.map(k => JSON.stringify(k) + ':' + kanonisch(wert[k])).join(',') + '}';
    }
    return JSON.stringify(String(wert));
  }

  function fingerprint(wert) {
    const material = kanonisch(wert);
    let hash = 14695981039346656037n;
    for (let i = 0; i < material.length; i += 1) {
      hash ^= BigInt(material.charCodeAt(i));
      hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return hash.toString(16).padStart(16, '0');
  }

  function serverBindung() {
    const kandidaten = roots();
    const region = kandidaten.map(r => {
      try { return text(r?.server_region || r?.server?.region); } catch { return ''; }
    }).find(Boolean) || '';
    const kennung = kandidaten.map(r => {
      try { return text(r?.server_identifier || r?.server?.id); } catch { return ''; }
    }).find(Boolean) || '';
    const quelle = kandidaten.map(r => {
      try {
        if (text(r?.server_region) && text(r?.server_identifier)) return 'SERVER_GLOBALS';
        if (text(r?.server?.region) && text(r?.server?.id)) return 'SERVER_OBJECT';
      } catch {}
      return '';
    }).find(Boolean) || 'FEHLT';
    return Object.freeze({ region, kennung, quelle });
  }

  function alternativeRuntimeAktiv() {
    for (const root of roots()) {
      try {
        const v3 = root?.AIO_V3?.__runtime;
        const s3 = v3 && typeof v3.status === 'function' ? v3.status() : null;
        if (v3 && (v3.timer || s3?.running === true)) return true;
      } catch { return true; }
      try {
        const v4 = root?.AIO_V4 || root?.V4Runtime || root?.V4ProduktionsLaufzeit;
        const s4 = v4 && typeof v4.status === 'function' ? v4.status() : null;
        if (v4 && (s4?.running === true || s4?.aktivFreigegeben === true)) return true;
      } catch { return true; }
    }
    return false;
  }

  function buyApi() {
    for (const root of roots()) {
      try {
        if (typeof root?.buy_with_gold === 'function') {
          return Object.freeze({ owner: root, fn: root.buy_with_gold });
        }
      } catch {}
    }
    return null;
  }

  function sellDistance() {
    for (const root of roots()) {
      try {
        const n = Number(root?.B?.sell_dist);
        if (Number.isFinite(n) && n > 0) return n;
      } catch {}
    }
    return 120;
  }

  function xy(obj) {
    const x = Number(obj?.real_x ?? obj?.x);
    const y = Number(obj?.real_y ?? obj?.y);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  }

  function distanz(a, b) {
    const aa = xy(a);
    const bb = xy(b);
    if (!aa || !bb) return Infinity;
    return Math.hypot(aa.x - bb.x, aa.y - bb.y);
  }

  function itemGesamtmenge(character, name) {
    let summe = 0;
    for (const item of character.items || []) {
      if (!item || item.name !== name) continue;
      const q = safeInt(item.q);
      summe += q !== null && q > 0 ? q : 1;
    }
    return summe;
  }

  function inventoryFingerprint(character) {
    return fingerprint((character.items || []).map(item => {
      if (!item) return null;
      return {
        name: item.name,
        q: item.q ?? 1,
        level: item.level ?? 0,
        p: item.p ?? null,
        stat_type: item.stat_type ?? null,
        l: item.l ?? null,
        b: item.b ?? null,
        m: item.m ?? null,
        v: item.v ?? null
      };
    }));
  }

  function inventoryKannAufnehmen(character, def, name) {
    const items = Array.isArray(character.items) ? character.items : [];
    const capRaw = safeInt(character.isize);
    const cap = capRaw !== null && capRaw >= 1 ? Math.min(64, capRaw) : Math.min(64, items.length);
    const stackMax = safeInt(def?.s);
    if (stackMax !== null && stackMax > 1) {
      for (let i = 0; i < cap; i += 1) {
        const item = items[i];
        if (!item || item.name !== name) continue;
        const q = safeInt(item.q);
        const menge = q !== null && q > 0 ? q : 1;
        if (menge < stackMax) return true;
      }
    }
    for (let i = 0; i < cap; i += 1) {
      if ((items[i] ?? null) === null) return true;
    }
    return false;
  }

  function itemDefinitionFingerprint(def) {
    return fingerprint({
      name: def?.name ?? null,
      g: def?.g ?? null,
      s: def?.s ?? null,
      cash: def?.cash ?? null,
      p2w: def?.p2w ?? null,
      type: def?.type ?? null
    });
  }

  function vendorFingerprint(mapName, name, location) {
    return fingerprint({
      map: mapName,
      item: name,
      x: Number(location?.x),
      y: Number(location?.y),
      id: text(location?.id || '')
    });
  }

  function kandidaten(root) {
    const c = root.character;
    const G = root.G;
    const mapName = text(c.map);
    const map = G?.maps?.[mapName];
    const mapItems = map?.items;
    if (!mapItems || typeof mapItems !== 'object') return [];

    const gold = safeInt(c.gold);
    if (gold === null || gold < 0) return [];

    const maxRange = Math.max(45, sellDistance() * 0.85);
    const rows = [];

    for (const name of Object.keys(mapItems).sort()) {
      const def = G.items?.[name];
      if (!def || typeof def !== 'object') continue;
      if (def.cash || def.p2w) continue;
      const price = safeInt(def.g);
      if (price === null || price < 1 || price > MAX_TEST_COST) continue;
      if (gold - price < TEST_GOLD_RESERVE) continue;
      if (!inventoryKannAufnehmen(c, def, name)) continue;

      const locations = Array.isArray(mapItems[name]) ? mapItems[name] : [];
      let best = null;
      for (const location of locations) {
        const d = distanz(c, location);
        if (!Number.isFinite(d) || d >= maxRange) continue;
        if (!best || d < best.distanz) best = { location, distanz: d };
      }
      if (!best) continue;

      const stackMax = safeInt(def.s);
      const hatTeilStack = stackMax !== null && stackMax > 1
        && (c.items || []).some(item => {
          if (!item || item.name !== name) return false;
          const q = safeInt(item.q);
          return (q !== null && q > 0 ? q : 1) < stackMax;
        });

      const vendorId = text(best.location?.id) || [
        mapName,
        name,
        Math.round(Number(best.location?.x) || 0),
        Math.round(Number(best.location?.y) || 0)
      ].join(':');
      const itemDefFp = itemDefinitionFingerprint(def);
      const vendorFp = vendorFingerprint(mapName, name, best.location);
      rows.push(Object.freeze({
        itemName: name,
        menge: MENGE,
        einzelpreisGold: price,
        erwarteteKostenGold: price,
        map: mapName,
        vendorId,
        vendorX: Number(best.location?.x),
        vendorY: Number(best.location?.y),
        distanz: Math.round(best.distanz * 100) / 100,
        erlaubteDistanz: Math.round(maxRange * 100) / 100,
        stackBevorzugt: hatTeilStack,
        itemDefinitionFingerprint: itemDefFp,
        vendorFingerprint: vendorFp,
        key: fingerprint({
          map: mapName,
          name,
          price,
          vendorId,
          itemDefFp,
          vendorFp
        })
      }));
    }

    rows.sort((a, b) => {
      if (a.stackBevorzugt !== b.stackBevorzugt) return a.stackBevorzugt ? -1 : 1;
      if (a.erwarteteKostenGold !== b.erwarteteKostenGold) {
        return a.erwarteteKostenGold - b.erwarteteKostenGold;
      }
      if (a.distanz !== b.distanz) return a.distanz - b.distanz;
      return a.itemName.localeCompare(b.itemName);
    });
    return rows;
  }

  function snapshot() {
    const root = rootFenster();
    const c = root.character;
    const server = serverBindung();
    const candidate = kandidaten(root)[0] ?? null;
    const gold = safeInt(c.gold);
    const perf = guiApi().performanceTrickStatus();
    return Object.freeze({
      zeitMs: Date.now(),
      characterName: text(c.name),
      sessionId: text(c.id),
      serverRegion: server.region,
      serverKennung: server.kennung,
      serverBindungQuelle: server.quelle,
      ctype: text(c.ctype || c.type).toLowerCase(),
      map: text(c.map),
      rip: c.rip === true,
      moving: c.moving === true,
      warteschlangeLeer: !(c.q && typeof c.q === 'object' && Object.keys(c.q).length),
      alternativeRuntimeAktiv: alternativeRuntimeAktiv(),
      performanceTrick: perf,
      buyWithGoldVerfuegbar: buyApi() !== null,
      characterGold: gold,
      inventoryFingerprint: inventoryFingerprint(c),
      candidate,
      candidateItemGesamtmenge: candidate ? itemGesamtmenge(c, candidate.itemName) : null
    });
  }

  function bindungKey(s) {
    return [
      s.characterName,
      s.sessionId,
      s.serverRegion,
      s.serverKennung,
      s.ctype,
      s.map
    ].join('|');
  }

  function basisBlocker(s, candidateRequired = true) {
    const out = [];
    if (s.ctype !== 'merchant') out.push('NUR_MERCHANT');
    if (s.rip) out.push('CHARAKTER_TOT');
    if (s.moving) out.push('CHARAKTER_BEWEGT_SICH');
    if (!s.warteschlangeLeer) out.push('CHARAKTER_QUEUE_AKTIV');
    if (s.alternativeRuntimeAktiv) out.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (!s.characterName || !s.sessionId || !s.serverRegion || !s.serverKennung) {
      out.push('BINDUNG_UNVOLLSTAENDIG');
    }
    if (!s.performanceTrick?.aktiv || s.performanceTrick?.playing !== true) {
      out.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    }
    if (!s.buyWithGoldVerfuegbar) out.push('BUY_WITH_GOLD_API_FEHLT');
    if (!Number.isSafeInteger(s.characterGold)) out.push('GOLD_NICHT_LESBAR');
    if (candidateRequired && !s.candidate) out.push('KEIN_SICHERER_GOLD_KAUF_KANDIDAT_IN_REICHWEITE');
    return out;
  }

  function defaultState() {
    return {
      schemaVersion: 1,
      controllerVersion: VERSION,
      aktualisiertAmMs: Date.now(),
      steps: {
        "1": { status: 'OFFEN', evidence: null },
        "2": { status: 'OFFEN', evidence: null },
        "3": { status: 'OFFEN', evidence: null },
        "4": { status: 'OFFEN', evidence: null },
        "5": { status: 'OFFEN', evidence: null },
        "6": { status: 'OFFEN', evidence: null },
        "7": { status: 'OFFEN', evidence: null }
      },
      pinnedCandidate: null,
      liveAttempts: [],
      soak: null,
      sameIntentErneutSenden: false
    };
  }

  function normalisiereState(value) {
    if (!value || value.schemaVersion !== 1 || !value.steps || !Array.isArray(value.liveAttempts)) {
      throw new Error('PR20_3_MARKET_TEST_STATE_SCHEMA_UNGUELTIG');
    }
    if (value.liveAttempts.length > MAX_TRUE_TESTS) {
      throw new Error('PR20_3_MARKET_TEST_BUDGET_STATE_UNGUELTIG');
    }
    return value;
  }

  function liesState() {
    const raw = storage().getItem(STATE_KEY);
    if (!raw) return defaultState();
    let value;
    try { value = JSON.parse(raw); }
    catch { throw new Error('PR20_3_MARKET_TEST_STATE_BESCHAEDIGT'); }
    return normalisiereState(value);
  }

  function schreibeState(value) {
    const next = {
      ...value,
      controllerVersion: VERSION,
      aktualisiertAmMs: Date.now(),
      sameIntentErneutSenden: false
    };
    const raw = JSON.stringify(next);
    if (raw.length > 500000) throw new Error('PR20_3_MARKET_TEST_STATE_ZU_GROSS');
    storage().setItem(STATE_KEY, raw);
    return next;
  }

  function stepBestanden(state, nr) {
    return state.steps?.[String(nr)]?.status === 'BESTANDEN';
  }

  function setzeStep(state, nr, status, evidence) {
    return schreibeState({
      ...state,
      steps: {
        ...state.steps,
        [String(nr)]: {
          status,
          evidence,
          abgeschlossenAmMs: Date.now()
        }
      }
    });
  }

  function checkliste(state) {
    return Object.freeze([
      { schritt: 1, name: 'Umgebung / Bindung', status: state.steps["1"].status },
      { schritt: 2, name: 'Kandidat stabil pinnen', status: state.steps["2"].status },
      { schritt: 3, name: 'Read-only Shadow / Admission', status: state.steps["3"].status },
      { schritt: 4, name: 'LIVE 1 · buy_with_gold(..., 1)', status: state.steps["4"].status },
      { schritt: 5, name: 'Frische Re-Admission', status: state.steps["5"].status },
      { schritt: 6, name: 'LIVE 2 · buy_with_gold(..., 1)', status: state.steps["6"].status },
      { schritt: 7, name: 'NO-WRITE 5M Stabilitaet', status: state.steps["7"].status }
    ]);
  }

  async function frischePerformance() {
    await guiApi().aktivierePerformanceTrick();
    return guiApi().performanceTrickStatus();
  }

  async function step1Umgebung() {
    await frischePerformance();
    const s = snapshot();
    const blocker = basisBlocker(s, true);
    const result = Object.freeze({
      schemaVersion: 1,
      status: blocker.length ? 'BLOCKIERT' : 'BESTANDEN',
      testArt: 'PR20_3_BUY_GOLD_STEP_1_ENVIRONMENT',
      blocker,
      snapshot: s,
      testGoldReserve: TEST_GOLD_RESERVE,
      maxTestCost: MAX_TEST_COST,
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    });
    let state = liesState();
    if (!blocker.length) state = setzeStep(state, 1, 'BESTANDEN', result);
    return { result, state };
  }

  async function step2Kandidat() {
    let state = liesState();
    if (!stepBestanden(state, 1)) throw new Error('SCHRITT_1_NOCH_NICHT_BESTANDEN');
    await frischePerformance();
    const a = snapshot();
    const blockerA = basisBlocker(a, true);
    if (blockerA.length) {
      return { result: Object.freeze({ status: 'BLOCKIERT', blocker: blockerA, snapshot: a }), state };
    }
    await sleep(STABILITY_MS);
    const b = snapshot();
    const blockerB = basisBlocker(b, true);
    const stable = blockerB.length === 0
      && bindungKey(a) === bindungKey(b)
      && a.characterGold === b.characterGold
      && a.inventoryFingerprint === b.inventoryFingerprint
      && a.candidate?.key === b.candidate?.key;
    const result = Object.freeze({
      schemaVersion: 1,
      status: stable ? 'BESTANDEN' : 'BLOCKIERT',
      testArt: 'PR20_3_BUY_GOLD_STEP_2_CANDIDATE_LOCK',
      blocker: stable ? [] : [...blockerB, 'KANDIDAT_ODER_PRESTATE_NICHT_STABIL'],
      stabilityMs: STABILITY_MS,
      candidate: b.candidate,
      characterGold: b.characterGold,
      itemGesamtmenge: b.candidateItemGesamtmenge,
      inventoryFingerprint: b.inventoryFingerprint,
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    });
    if (stable) {
      state = schreibeState({ ...state, pinnedCandidate: b.candidate });
      state = setzeStep(state, 2, 'BESTANDEN', result);
    }
    return { result, state };
  }

  async function step3Shadow() {
    let state = liesState();
    if (!stepBestanden(state, 2)) throw new Error('SCHRITT_2_NOCH_NICHT_BESTANDEN');
    const pinned = state.pinnedCandidate;
    if (!pinned) throw new Error('GEPINNTER_KANDIDAT_FEHLT');
    await frischePerformance();
    const samples = [];
    for (let i = 0; i < 3; i += 1) {
      if (i > 0) await sleep(STABILITY_MS);
      const s = snapshot();
      const blocker = basisBlocker(s, true);
      samples.push(Object.freeze({
        zeitMs: s.zeitMs,
        bindungKey: bindungKey(s),
        characterGold: s.characterGold,
        inventoryFingerprint: s.inventoryFingerprint,
        candidateKey: s.candidate?.key ?? null,
        blocker
      }));
    }
    const first = samples[0];
    const stable = samples.every(x =>
      x.blocker.length === 0
      && x.bindungKey === first.bindungKey
      && x.characterGold === first.characterGold
      && x.inventoryFingerprint === first.inventoryFingerprint
      && x.candidateKey === pinned.key
    );
    const result = Object.freeze({
      schemaVersion: 1,
      status: stable ? 'BESTANDEN' : 'BLOCKIERT',
      testArt: 'PR20_3_BUY_GOLD_STEP_3_SHADOW_ADMISSION',
      blocker: stable ? [] : ['SHADOW_ODER_ADMISSION_DRIFT'],
      candidate: pinned,
      samples,
      durableIntentErzeugt: false,
      authorityAusgestellt: false,
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    });
    if (stable) state = setzeStep(state, 3, 'BESTANDEN', result);
    return { result, state };
  }

  function effectSnapshot(candidate) {
    const root = rootFenster();
    const c = root.character;
    const server = serverBindung();
    const def = root.G?.items?.[candidate.itemName];
    const currentRows = kandidaten(root);
    const currentCandidate = currentRows.find(x => x.key === candidate.key) ?? null;
    return Object.freeze({
      zeitMs: Date.now(),
      characterName: text(c.name),
      sessionId: text(c.id),
      serverRegion: server.region,
      serverKennung: server.kennung,
      map: text(c.map),
      characterGold: safeInt(c.gold),
      itemGesamtmenge: itemGesamtmenge(c, candidate.itemName),
      inventoryFingerprint: inventoryFingerprint(c),
      itemDefinitionFingerprint: itemDefinitionFingerprint(def),
      vendorFingerprint: currentCandidate?.vendorFingerprint ?? null,
      candidateNochErreichbar: currentCandidate !== null
    });
  }

  function bewerteSettlement(before, after, candidate) {
    const bindingDrift = before.characterName !== after.characterName
      || before.sessionId !== after.sessionId
      || before.serverRegion !== after.serverRegion
      || before.serverKennung !== after.serverKennung
      || before.map !== after.map
      || before.itemDefinitionFingerprint !== after.itemDefinitionFingerprint
      || before.vendorFingerprint !== after.vendorFingerprint;
    const goldDelta = after.characterGold - before.characterGold;
    const itemMengenDelta = after.itemGesamtmenge - before.itemGesamtmenge;
    const neuerInventoryFingerprint = after.inventoryFingerprint !== before.inventoryFingerprint;

    const out = (status, grund) => Object.freeze({
      status,
      grund,
      goldDelta,
      itemMengenDelta,
      neuerInventoryFingerprint,
      candidateNochErreichbar: after.candidateNochErreichbar,
      sameIntentErneutSenden: false
    });

    if (bindingDrift) return out('DRIFT', 'BINDUNG_ITEMDEF_ODER_VENDOR_DRIFT');
    if (goldDelta === -candidate.erwarteteKostenGold
        && itemMengenDelta === MENGE
        && neuerInventoryFingerprint) {
      return out('BESTAETIGT', 'EXAKTES_GOLD_UND_ITEM_DELTA');
    }
    if (goldDelta === 0 && itemMengenDelta === 0 && !neuerInventoryFingerprint) {
      return out('OFFEN', 'NOCH_KEINE_SICHTBARE_WIRKUNG');
    }
    if (goldDelta === -candidate.erwarteteKostenGold
        && itemMengenDelta === MENGE
        && !neuerInventoryFingerprint) {
      return out('OFFEN', 'EXAKTES_DELTA_FINGERPRINT_NOCH_NICHT_NEU');
    }
    return out('DRIFT', 'GOLD_ITEM_DELTA_WIDERSPRUCH');
  }

  async function fuehreLiveAus(testNr, voraussetzungStep, zielStep) {
    let state = liesState();
    if (!stepBestanden(state, voraussetzungStep)) {
      throw new Error('VORAUSSETZUNG_SCHRITT_' + voraussetzungStep + '_FEHLT');
    }
    if (state.liveAttempts.length >= MAX_TRUE_TESTS) {
      throw new Error('PR20_3_MARKET_LIVE_TESTLIMIT_ERREICHT');
    }
    if (state.liveAttempts.length !== testNr - 1) {
      throw new Error('PR20_3_MARKET_LIVE_TESTREIHENFOLGE_UNGUELTIG');
    }

    await frischePerformance();
    const pre = snapshot();
    const blockers = basisBlocker(pre, true);
    const pinned = state.pinnedCandidate;
    if (!pinned || pre.candidate?.key !== pinned.key) blockers.push('GEPINNTER_KANDIDAT_DRIFT');
    if (blockers.length) {
      return {
        result: Object.freeze({
          status: 'BLOCKIERT',
          testArt: 'PR20_3_BUY_GOLD_LIVE_' + testNr,
          blocker: blockers,
          gameplayWrites: 0,
          mutatingPublicFunctionCalls: 0,
          functionalTestBudgetConsumed: false,
          sameIntentErneutSenden: false
        }),
        state
      };
    }

    const api = buyApi();
    if (!api) throw new Error('BUY_WITH_GOLD_API_FEHLT');
    const before = effectSnapshot(pinned);
    const attempt = {
      schemaVersion: 1,
      testNr,
      status: 'POSSIBLE_SEND',
      intentId: 'PR20_3_BUY_GOLD_' + testNr + '_' + Date.now(),
      gestartetAmMs: Date.now(),
      candidate: pinned,
      before,
      publicFunction: 'buy_with_gold',
      publicFunctionAufrufe: 1,
      gameplayWrites: 1,
      sameIntentErneutSenden: false
    };
    state = schreibeState({ ...state, liveAttempts: [...state.liveAttempts, attempt] });

    let promiseStatus = 'PENDING';
    let promiseResult = null;
    let promiseError = null;
    try {
      const p = api.fn.call(api.owner, pinned.itemName, MENGE);
      Promise.resolve(p).then(
        value => { promiseStatus = 'RESOLVED'; promiseResult = value ?? null; },
        error => { promiseStatus = 'REJECTED'; promiseError = String(error?.reason || error?.message || error); }
      );
    } catch (error) {
      promiseStatus = 'THREW';
      promiseError = String(error?.message || error);
    }

    const deadline = Date.now() + SETTLEMENT_TIMEOUT_MS;
    let settlement = null;
    let after = before;
    while (Date.now() <= deadline) {
      await sleep(SETTLEMENT_POLL_MS);
      after = effectSnapshot(pinned);
      settlement = bewerteSettlement(before, after, pinned);
      if (settlement.status === 'BESTAETIGT' || settlement.status === 'DRIFT') break;
    }
    if (!settlement || settlement.status === 'OFFEN') {
      settlement = Object.freeze({
        ...(settlement || bewerteSettlement(before, after, pinned)),
        status: 'UNAUFGELOEST',
        grund: 'SETTLEMENT_TIMEOUT_KEIN_BLIND_RETRY',
        sameIntentErneutSenden: false
      });
    }

    const passed = settlement.status === 'BESTAETIGT';
    const finalAttempt = Object.freeze({
      ...attempt,
      status: passed ? 'COMMITTED' : settlement.status,
      abgeschlossenAmMs: Date.now(),
      after,
      settlement,
      promiseStatus,
      promiseResult,
      promiseError
    });
    state = schreibeState({
      ...state,
      liveAttempts: state.liveAttempts.map((x, i) =>
        i === state.liveAttempts.length - 1 ? finalAttempt : x)
    });

    const result = Object.freeze({
      schemaVersion: 1,
      status: passed ? 'BESTANDEN' : 'NICHT_BESTANDEN',
      testArt: 'PR20_3_BUY_GOLD_LIVE_' + testNr,
      testNr,
      candidate: pinned,
      publicFunctionAufrufe: 1,
      gameplayWrites: 1,
      functionalTestBudgetConsumed: true,
      testsConsumed: state.liveAttempts.length,
      maxTrueTests: MAX_TRUE_TESTS,
      promiseStatus,
      promiseResult,
      promiseError,
      settlement,
      sameIntentErneutSenden: false
    });

    if (passed) state = setzeStep(state, zielStep, 'BESTANDEN', result);
    else state = setzeStep(state, zielStep, 'NICHT_BESTANDEN', result);
    return { result, state };
  }

  async function step5Readmission() {
    let state = liesState();
    if (!stepBestanden(state, 4)) throw new Error('SCHRITT_4_NOCH_NICHT_BESTANDEN');
    if (state.liveAttempts.length !== 1) throw new Error('LIVE_1_JOURNAL_UNGUELTIG');
    await frischePerformance();
    const a = snapshot();
    const blockerA = basisBlocker(a, true);
    if (blockerA.length) {
      return { result: Object.freeze({ status: 'BLOCKIERT', blocker: blockerA, snapshot: a }), state };
    }
    await sleep(STABILITY_MS);
    const b = snapshot();
    const stable = basisBlocker(b, true).length === 0
      && bindungKey(a) === bindungKey(b)
      && a.characterGold === b.characterGold
      && a.inventoryFingerprint === b.inventoryFingerprint
      && a.candidate?.key === b.candidate?.key;
    const result = Object.freeze({
      schemaVersion: 1,
      status: stable ? 'BESTANDEN' : 'BLOCKIERT',
      testArt: 'PR20_3_BUY_GOLD_STEP_5_READMISSION',
      blocker: stable ? [] : ['READMISSION_DRIFT'],
      candidate: b.candidate,
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      functionalTestBudgetConsumed: false,
      testsConsumed: state.liveAttempts.length,
      sameIntentErneutSenden: false
    });
    if (stable) {
      state = schreibeState({ ...state, pinnedCandidate: b.candidate });
      state = setzeStep(state, 5, 'BESTANDEN', result);
    }
    return { result, state };
  }

  function soakBlocker(baseline, current, gapMs) {
    const out = [];
    if (gapMs > MAX_SAMPLE_GAP_MS) out.push('SAMPLE_GAP_ZU_GROSS');
    if (bindungKey(current) !== baseline.bindungKey) out.push('BINDUNG_DRIFT');
    if (current.rip) out.push('CHARAKTER_TOT');
    if (current.moving) out.push('CHARAKTER_BEWEGT_SICH');
    if (!current.warteschlangeLeer) out.push('CHARAKTER_QUEUE_AKTIV');
    if (current.alternativeRuntimeAktiv) out.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (!current.performanceTrick?.aktiv || current.performanceTrick?.playing !== true) {
      out.push('PERFORMANCE_TRICK_FEHLER');
    }
    if (current.characterGold !== baseline.characterGold) out.push('GOLD_DRIFT');
    if (current.inventoryFingerprint !== baseline.inventoryFingerprint) out.push('INVENTORY_DRIFT');
    if (current.candidate?.key !== baseline.candidateKey) out.push('KANDIDAT_DRIFT');
    return out;
  }

  async function soakTick(gui) {
    if (soakSampling) return;
    soakSampling = true;
    try {
      let state = liesState();
      const soak = state.soak;
      if (!soak || soak.status !== 'RUNNING') return;
      const now = Date.now();
      const previous = soak.samples.length
        ? soak.samples[soak.samples.length - 1].zeitMs
        : soak.gestartetAmMs;
      const s = snapshot();
      const gapMs = now - previous;
      const blocker = soakBlocker(soak.baseline, {
        ...s,
        bindungKey: bindungKey(s)
      }, gapMs);
      const sample = Object.freeze({
        nr: soak.samples.length + 1,
        zeitMs: now,
        seitStartMs: now - soak.gestartetAmMs,
        gapMs,
        evidenceFingerprint: fingerprint({
          bindungKey: bindungKey(s),
          gold: s.characterGold,
          inventory: s.inventoryFingerprint,
          candidate: s.candidate?.key ?? null,
          performance: s.performanceTrick,
          blocker
        }),
        blocker
      });
      const samples = [...soak.samples, sample];
      if (samples.length > MAX_SAMPLES) throw new Error('PR20_3_MARKET_SOAK_SAMPLE_GRENZE');
      const elapsed = sample.seitStartMs;
      const updated = { ...soak, samples };
      state = schreibeState({ ...state, soak: updated });

      gui.setzeRestzeit(Math.max(0, SOAK_MS - elapsed), 'Schritt 7 · NO-WRITE 5M');
      gui.setzeErgebnis({
        status: 'LAEUFT',
        testArt: 'PR20_3_BUY_GOLD_STEP_7_NO_WRITE_5M',
        seitStartMs: elapsed,
        sampleAnzahl: samples.length,
        letzterGapMs: gapMs,
        letzterBlocker: blocker,
        gameplayWrites: 0,
        functionalTestBudgetConsumed: false,
        liveTestsConsumed: state.liveAttempts.length,
        sameIntentErneutSenden: false
      }, 'laeuft', 'Schritt 7 laeuft · Restzeit ' + Math.ceil(Math.max(0, SOAK_MS - elapsed) / 1000) + ' s');

      if (blocker.length || elapsed >= SOAK_MS) {
        if (soakTimer !== null) clearInterval(soakTimer);
        soakTimer = null;
        gui.setzeRestzeit(null);
        const gaps = samples.filter(x => x.gapMs > MAX_SAMPLE_GAP_MS).length;
        const blockerSamples = samples.filter(x => x.blocker.length > 0).length;
        const passed = elapsed >= SOAK_MS
          && samples.length >= MIN_SAMPLES
          && samples.length <= MAX_SAMPLES
          && gaps === 0
          && blockerSamples === 0;
        const result = Object.freeze({
          schemaVersion: 1,
          status: passed ? 'BESTANDEN' : 'NICHT_BESTANDEN',
          testArt: 'PR20_3_BUY_GOLD_STEP_7_NO_WRITE_5M',
          dauerMs: elapsed,
          sampleAnzahl: samples.length,
          sampleGaps: gaps,
          blockerSamples,
          gameplayWrites: 0,
          mutatingPublicFunctionCalls: 0,
          functionalTestBudgetConsumed: false,
          liveTestsConsumed: state.liveAttempts.length,
          liveTestsMax: MAX_TRUE_TESTS,
          sameIntentErneutSenden: false
        });
        state = schreibeState({
          ...state,
          soak: {
            ...updated,
            status: 'COMPLETED',
            abgeschlossenAmMs: Date.now(),
            result
          }
        });
        state = setzeStep(state, 7, passed ? 'BESTANDEN' : 'NICHT_BESTANDEN', result);
        gui.protokolliere('PR20.3 Schritt 7 abgeschlossen', result);
        gui.setzeErgebnis(
          { ...result, checkliste: checkliste(state) },
          passed ? 'bestanden' : 'fehler',
          passed
            ? 'Alle PR20.3 Buy-Gold Testschritte BESTANDEN · Gesamtbericht kopieren.'
            : 'Schritt 7 NICHT BESTANDEN · kein weiterer Write.'
        );
        synchronisiereAktionen(gui, state);
      }
    } catch (error) {
      if (soakTimer !== null) clearInterval(soakTimer);
      soakTimer = null;
      gui.setzeRestzeit(null);
      gui.setzeErgebnis({
        status: 'FEHLER',
        fehler: String(error?.message || error),
        sameIntentErneutSenden: false
      }, 'fehler', String(error?.message || error));
    } finally {
      soakSampling = false;
    }
  }

  async function step7Start(gui) {
    let state = liesState();
    if (!stepBestanden(state, 6)) throw new Error('SCHRITT_6_NOCH_NICHT_BESTANDEN');
    if (state.liveAttempts.length !== MAX_TRUE_TESTS
        || state.liveAttempts.some(x => x.status !== 'COMMITTED')) {
      throw new Error('LIVE_EVIDENCE_2_OF_2_FEHLT');
    }
    await frischePerformance();
    const s = snapshot();
    const blocker = basisBlocker(s, true);
    if (blocker.length) {
      return {
        result: Object.freeze({
          status: 'BLOCKIERT',
          testArt: 'PR20_3_BUY_GOLD_STEP_7_PREFLIGHT',
          blocker,
          gameplayWrites: 0,
          functionalTestBudgetConsumed: false
        }),
        state
      };
    }
    const baseline = Object.freeze({
      bindungKey: bindungKey(s),
      characterGold: s.characterGold,
      inventoryFingerprint: s.inventoryFingerprint,
      candidateKey: s.candidate.key
    });
    const soak = {
      schemaVersion: 1,
      status: 'RUNNING',
      gestartetAmMs: Date.now(),
      abgeschlossenAmMs: null,
      baseline,
      samples: [],
      gameplayWrites: 0,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    };
    state = schreibeState({ ...state, soak });
    gui.setzeRestzeit(SOAK_MS, 'Schritt 7 · NO-WRITE 5M');
    await soakTick(gui);
    if (liesState().soak?.status === 'RUNNING') {
      soakTimer = setInterval(() => soakTick(gui), SOAK_INTERVAL_MS);
    }
    return {
      result: Object.freeze({
        status: 'LAEUFT',
        testArt: 'PR20_3_BUY_GOLD_STEP_7_NO_WRITE_5M',
        dauerMs: SOAK_MS,
        intervallMs: SOAK_INTERVAL_MS,
        gameplayWrites: 0,
        functionalTestBudgetConsumed: false,
        liveTestsConsumed: state.liveAttempts.length,
        sameIntentErneutSenden: false
      }),
      state
    };
  }

  function recoveryDiagnose() {
    const state = liesState();
    const offene = state.liveAttempts.find(x => x.status === 'POSSIBLE_SEND');
    if (!offene) {
      return Object.freeze({
        status: 'KEIN_OFFENER_LIVE_ATTEMPT',
        state,
        checkliste: checkliste(state),
        sameIntentErneutSenden: false
      });
    }
    const after = effectSnapshot(offene.candidate);
    const settlement = bewerteSettlement(offene.before, after, offene.candidate);
    return Object.freeze({
      status: 'RECOVERY_READ_ONLY',
      testNr: offene.testNr,
      attemptStatus: offene.status,
      settlement,
      after,
      hinweis: settlement.status === 'BESTAETIGT'
        ? 'Wirkung ist read-only erkennbar; Report senden. Kein erneuter Send.'
        : 'Kein erneuter Send. Unaufgeloesten Zustand zuerst extern dokumentieren.',
      sameIntentErneutSenden: false
    });
  }

  function synchronisiereAktionen(gui, state = liesState()) {
    gui.setzeAktionAktiv('step-1', !stepBestanden(state, 1));
    gui.setzeAktionAktiv('step-2', stepBestanden(state, 1) && !stepBestanden(state, 2));
    gui.setzeAktionAktiv('step-3', stepBestanden(state, 2) && !stepBestanden(state, 3));
    gui.setzeAktionAktiv(
      'step-4-live-1',
      stepBestanden(state, 3)
        && !stepBestanden(state, 4)
        && state.liveAttempts.length === 0
    );
    gui.setzeAktionAktiv(
      'step-5',
      stepBestanden(state, 4)
        && !stepBestanden(state, 5)
        && state.liveAttempts.length === 1
    );
    gui.setzeAktionAktiv(
      'step-6-live-2',
      stepBestanden(state, 5)
        && !stepBestanden(state, 6)
        && state.liveAttempts.length === 1
    );
    gui.setzeAktionAktiv(
      'step-7',
      stepBestanden(state, 6)
        && !stepBestanden(state, 7)
        && state.liveAttempts.length === 2
        && state.liveAttempts.every(x => x.status === 'COMMITTED')
    );
    gui.setzeAktionAktiv('diagnose', true);
  }

  const gui = guiApi().erstelleTest({
    kennung: TESTKENNUNG,
    titel: 'V5 · PR20.3 Markt · Buy-Gold Stufentest',
    beschreibung:
      'Ein Paket, sieben persistente Stufen. Nach BESTANDEN wird die naechste Stufe direkt freigeschaltet; kein Merge zwischen den Stufen erforderlich.'
  });

  gui.registriereAktion({
    kennung: 'step-1',
    titel: '1 · Umgebung / Bindung abhaken',
    art: 'primaer',
    async ausfuehren() {
      const { result, state } = await step1Umgebung();
      gui.protokolliere('PR20.3 Schritt 1', result);
      gui.setzeErgebnis(
        { ...result, checkliste: checkliste(state) },
        result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        result.status === 'BESTANDEN'
          ? 'Schritt 1 BESTANDEN · Schritt 2 ist freigeschaltet.'
          : 'Schritt 1 BLOCKIERT · nichts mutiert.'
      );
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-2',
    titel: '2 · Kandidat stabil pinnen',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const { result, state } = await step2Kandidat();
      gui.protokolliere('PR20.3 Schritt 2', result);
      gui.setzeErgebnis(
        { ...result, checkliste: checkliste(state) },
        result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        result.status === 'BESTANDEN'
          ? 'Schritt 2 BESTANDEN · Kandidat gepinnt. Schritt 3 ist freigeschaltet.'
          : 'Schritt 2 BLOCKIERT · Kandidat nicht stabil.'
      );
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-3',
    titel: '3 · Read-only Shadow / Admission',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const { result, state } = await step3Shadow();
      gui.protokolliere('PR20.3 Schritt 3', result);
      gui.setzeErgebnis(
        { ...result, checkliste: checkliste(state) },
        result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        result.status === 'BESTANDEN'
          ? 'Schritt 3 BESTANDEN · LIVE 1 ist freigeschaltet.'
          : 'Schritt 3 BLOCKIERT · kein Send.'
      );
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-4-live-1',
    titel: '4 · LIVE 1 · 1 Item mit Gold kaufen',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG_LIVE_1,
    async ausfuehren() {
      const { result, state } = await fuehreLiveAus(1, 3, 4);
      gui.protokolliere('PR20.3 Schritt 4 LIVE 1', result);
      gui.setzeErgebnis(
        { ...result, checkliste: checkliste(state) },
        result.status === 'BESTANDEN' ? 'bestanden' : 'fehler',
        result.status === 'BESTANDEN'
          ? 'LIVE 1 BESTANDEN · Schritt 5 ist direkt freigeschaltet.'
          : 'LIVE 1 NICHT BESTANDEN · kein Retry desselben Intents.'
      );
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-5',
    titel: '5 · Frische Re-Admission abhaken',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const { result, state } = await step5Readmission();
      gui.protokolliere('PR20.3 Schritt 5', result);
      gui.setzeErgebnis(
        { ...result, checkliste: checkliste(state) },
        result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        result.status === 'BESTANDEN'
          ? 'Schritt 5 BESTANDEN · LIVE 2 ist freigeschaltet.'
          : 'Schritt 5 BLOCKIERT · kein zweiter Send.'
      );
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-6-live-2',
    titel: '6 · LIVE 2 · 1 Item mit Gold kaufen',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG_LIVE_2,
    async ausfuehren() {
      const { result, state } = await fuehreLiveAus(2, 5, 6);
      gui.protokolliere('PR20.3 Schritt 6 LIVE 2', result);
      gui.setzeErgebnis(
        { ...result, checkliste: checkliste(state) },
        result.status === 'BESTANDEN' ? 'bestanden' : 'fehler',
        result.status === 'BESTANDEN'
          ? 'LIVE 2 BESTANDEN · 2/2 Testbudget erreicht. Schritt 7 ist freigeschaltet.'
          : 'LIVE 2 NICHT BESTANDEN · Testbudget nicht zuruecksetzen.'
      );
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-7',
    titel: '7 · NO-WRITE 5M Stabilitaet starten',
    art: 'primaer',
    aktiviert: false,
    einmalig: true,
    async ausfuehren() {
      const { result, state } = await step7Start(gui);
      gui.protokolliere('PR20.3 Schritt 7 gestartet', result);
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'diagnose',
    titel: 'Status / Recovery read-only',
    async ausfuehren() {
      const state = liesState();
      const result = Object.freeze({
        schemaVersion: 1,
        testArt: 'PR20_3_BUY_GOLD_STEP_TEST_STATUS',
        state,
        checkliste: checkliste(state),
        recovery: recoveryDiagnose(),
        aktuellerSnapshot: snapshot(),
        maxTrueTests: MAX_TRUE_TESTS,
        liveTestsConsumed: state.liveAttempts.length,
        sameIntentErneutSenden: false
      });
      gui.protokolliere('PR20.3 Status / Recovery', result);
      gui.setzeErgebnis(result, 'info', 'Persistenter Stand · kein Testbudget wird zurueckgesetzt.');
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  let startState = liesState();
  if (startState.soak?.status === 'RUNNING') {
    startState = schreibeState({
      ...startState,
      soak: {
        ...startState.soak,
        status: 'UNTERBROCHEN',
        unterbrochenAmMs: Date.now(),
        sameIntentErneutSenden: false
      }
    });
    gui.protokolliere('Unterbrochener NO-WRITE-Soak erkannt', {
      status: 'UNTERBROCHEN',
      gameplayWrites: 0,
      functionalTestBudgetConsumed: false
    });
  }

  gui.protokolliere('PR20.3 Buy-Gold Stufentest gestartet', {
    controllerVersion: VERSION,
    stateKey: STATE_KEY,
    testGoldReserve: TEST_GOLD_RESERVE,
    maxTestCost: MAX_TEST_COST,
    maxTrueTests: MAX_TRUE_TESTS,
    liveTestsConsumed: startState.liveAttempts.length,
    sameIntentErneutSenden: false
  });
  gui.setzeErgebnis({
    schemaVersion: 1,
    status: stepBestanden(startState, 7) ? 'BESTANDEN' : 'BEREIT',
    checkliste: checkliste(startState),
    liveTestsConsumed: startState.liveAttempts.length,
    maxTrueTests: MAX_TRUE_TESTS,
    sameIntentErneutSenden: false
  }, stepBestanden(startState, 7) ? 'bestanden' : 'bereit',
  stepBestanden(startState, 7)
    ? 'Alle sieben Schritte bereits BESTANDEN.'
    : 'Naechsten offenen Schritt ausfuehren.');
  synchronisiereAktionen(gui, startState);

  const api = Object.freeze({
    version: VERSION,
    stateKey: STATE_KEY,
    bestaetigungLive1: BESTAETIGUNG_LIVE_1,
    bestaetigungLive2: BESTAETIGUNG_LIVE_2,
    maxTrueTests: MAX_TRUE_TESTS,
    testGoldReserve: TEST_GOLD_RESERVE,
    maxTestCost: MAX_TEST_COST,
    snapshot,
    status: () => liesState(),
    checkliste: () => checkliste(liesState()),
    recoveryDiagnose,
    test: gui,
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
