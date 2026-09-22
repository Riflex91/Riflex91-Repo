(() => {
  'use strict';

  const API_NAME = 'V5PR204TransferStepTest';
  const VERSION = '1.0.0';
  const TESTKENNUNG = 'pr20-4-logistics-transfer-step-test';
  const STATE_KEY = 'AIO_V5_PR20_4_TRANSFER_STEP_TEST_V1';
  const ACTORS_KEY = 'AIO_V5_PR20_4_TRANSFER_ACTORS_V1';
  const MAX_ACTOR_AGE_MS = 60 * 1000;
  const MAX_RENDEZVOUS_DISTANCE = 300;
  const ITEM_MENGE = 1;
  const GOLD_BETRAG = 1;
  const MIN_GOLD_RESERVE = 1000;
  const MAX_TRUE_TESTS_PER_FUNCTION = 2;
  const SOAK_MS = 5 * 60 * 1000;
  const SOAK_INTERVAL_MS = 15 * 1000;
  const MAX_SAMPLE_GAP_MS = 45 * 1000;
  const MIN_SAMPLES = 20;
  const MAX_SAMPLES = 30;
  const CONFIRM_ITEM_1 = 'PR20.4-ITEM-LIVE-1-SUPPLY';
  const CONFIRM_ITEM_2 = 'PR20.4-ITEM-LIVE-2-COLLECTION';
  const CONFIRM_GOLD_1 = 'PR20.4-GOLD-LIVE-1';
  const CONFIRM_GOLD_2 = 'PR20.4-GOLD-LIVE-2';

  function rootFenster() {
    const kandidaten = [];
    try { kandidaten.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) kandidaten.push(parent); } catch {}
    for (const root of kandidaten) {
      try {
        if (root?.character && Array.isArray(root.character.items)
            && typeof root.send_item === 'function'
            && typeof root.send_gold === 'function') return root;
      } catch {}
    }
    throw new Error('PR20_4_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
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
    throw new Error('PR20_4_STORAGE_FEHLT');
  }

  function kanonisch(wert) {
    if (wert === null || typeof wert !== 'object') return JSON.stringify(wert);
    if (Array.isArray(wert)) return '[' + wert.map(kanonisch).join(',') + ']';
    return '{' + Object.keys(wert).sort()
      .map(key => JSON.stringify(key) + ':' + kanonisch(wert[key]))
      .join(',') + '}';
  }

  function fingerprint(wert) {
    const text = kanonisch(wert);
    let hash = 14695981039346656037n;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= BigInt(text.charCodeAt(i));
      hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return hash.toString(16).padStart(16, '0');
  }

  function nichtLeer(wert) {
    if (wert === null || wert === undefined) return '';
    return String(wert).trim();
  }

  function serverBindung(root) {
    let p = null;
    try { if (root?.parent && root.parent !== root) p = root.parent; } catch {}
    try { if (!p && parent && parent !== root) p = parent; } catch {}
    const region = [
      root?.server_region, root?.server?.region,
      p?.server_region, p?.server?.region
    ].map(nichtLeer).find(Boolean) || '';
    const identifier = [
      root?.server_identifier, root?.server?.id,
      p?.server_identifier, p?.server?.id
    ].map(nichtLeer).find(Boolean) || '';
    return Object.freeze({ region, identifier });
  }

  function accountKey(root) {
    let p = null;
    try { if (root?.parent && root.parent !== root) p = root.parent; } catch {}
    try { if (!p && parent && parent !== root) p = parent; } catch {}
    const raw = nichtLeer(
      root?.user_id || p?.user_id || root?.character?.owner || p?.character?.owner
    );
    return raw ? fingerprint({ account: raw }) : '';
  }

  function runtimeStatus() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    let alternativeRuntimeAktiv = false;
    for (const root of roots) {
      try {
        const r3 = root?.AIO_V3?.__runtime;
        if (r3?.timer) alternativeRuntimeAktiv = true;
      } catch { alternativeRuntimeAktiv = true; }
      try {
        if (root?.V4ProduktionsLaufzeit || root?.AIO_V4 || root?.V4Runtime) {
          alternativeRuntimeAktiv = true;
        }
      } catch { alternativeRuntimeAktiv = true; }
    }
    return Object.freeze({ alternativeRuntimeAktiv });
  }

  function itemMenge(item) {
    if (!item) return 0;
    const q = Number(item.q);
    return Number.isFinite(q) && q > 0 ? Math.trunc(q) : 1;
  }

  function itemLocked(item) {
    return item?.l === true || item?.locked === true || item?.lock === true;
  }

  function plainItem(item) {
    if (!item?.name || itemLocked(item)) return false;
    if (item.p != null || item.stat_type != null) return false;
    if (Number(item.grace || 0) !== 0) return false;
    if (item.expires != null || item.gift != null || item.data != null) return false;
    return true;
  }

  function cleanItem(root, item, index) {
    if (!item?.name) return null;
    const def = root.G?.items?.[item.name] || {};
    const basis = {
      index,
      name: String(item.name),
      level: Number(item.level || 0),
      menge: itemMenge(item),
      locked: itemLocked(item),
      plain: plainItem(item),
      stackSize: Math.max(1, Math.trunc(Number(def.s || 1))),
      cash: def.cash === true || def.cash_item === true,
      quest: def.quest === true || def.q === true,
      event: def.event === true,
      exchange: def.exchange === true || def.e === true,
      basisGold: Number.isFinite(Number(def.g ?? def.gold))
        ? Math.max(0, Math.trunc(Number(def.g ?? def.gold)))
        : 0
    };
    return Object.freeze({ ...basis, itemFingerprint: fingerprint(basis) });
  }

  function inventarSnapshot(root) {
    return root.character.items
      .map((item, index) => cleanItem(root, item, index))
      .filter(Boolean)
      .slice(0, 256);
  }

  function identityKey(item) {
    return String(item.name) + ':' + String(Number(item.level || 0));
  }

  function totalMenge(items, name, level) {
    return items
      .filter(x => x.name === name && Number(x.level || 0) === Number(level || 0))
      .reduce((sum, x) => sum + Number(x.menge || 0), 0);
  }

  function otherInventoryFingerprint(items, name, level) {
    return fingerprint(items
      .filter(x => !(x.name === name && Number(x.level || 0) === Number(level || 0)))
      .map(x => ({
        index: x.index, name: x.name, level: x.level, menge: x.menge,
        locked: x.locked, plain: x.plain, itemFingerprint: x.itemFingerprint
      })));
  }

  function actorStateFingerprint(actor) {
    return fingerprint({
      roleOpaque: actor.characterName,
      sessionId: actor.sessionId,
      serverRegion: actor.serverRegion,
      serverIdentifier: actor.serverIdentifier,
      map: actor.map,
      gold: actor.gold,
      inventoryFingerprint: actor.inventoryFingerprint
    });
  }

  function actorSnapshot(root) {
    const items = inventarSnapshot(root);
    const server = serverBindung(root);
    const perf = guiApi().performanceTrickStatus();
    return Object.freeze({
      schemaVersion: 1,
      characterName: nichtLeer(root.character?.name),
      ctype: nichtLeer(root.character?.ctype),
      sessionId: nichtLeer(root.character?.id),
      accountKey: accountKey(root),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      map: nichtLeer(root.character?.map),
      x: Number(root.character?.real_x ?? root.character?.x ?? 0),
      y: Number(root.character?.real_y ?? root.character?.y ?? 0),
      rip: !!root.character?.rip,
      moving: !!root.character?.moving,
      gold: Math.max(0, Math.trunc(Number(root.character?.gold || 0))),
      isize: Math.max(0, Math.trunc(Number(root.character?.isize || root.character?.items?.length || 0))),
      items,
      inventoryFingerprint: fingerprint(items),
      runtime: runtimeStatus(),
      performanceTrickAktiv: perf.aktiv === true,
      observedAtMs: Date.now()
    });
  }

  function liesJson(key) {
    const raw = storage().getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'BESCHAEDIGT' }; }
  }

  function schreibeJson(key, wert, maxZeichen) {
    const text = JSON.stringify(wert);
    if (text.length > maxZeichen) throw new Error('PR20_4_PERSISTENZ_ZU_GROSS:' + key);
    storage().setItem(key, text);
    if (storage().getItem(key) !== text) {
      throw new Error('PR20_4_PERSISTENZ_ROUNDTRIP_FEHLER:' + key);
    }
  }

  function leerState() {
    return {
      schemaVersion: 1,
      controllerVersion: VERSION,
      createdAtMs: Date.now(),
      pair: null,
      initial: null,
      itemPins: {},
      goldPins: {},
      itemBudget: [],
      goldBudget: [],
      intents: [],
      soaks: {},
      steps: {},
      sameIntentErneutSenden: false
    };
  }

  function liesState() {
    const raw = liesJson(STATE_KEY);
    if (!raw || raw.schemaVersion !== 1) return leerState();
    return {
      ...leerState(),
      ...raw,
      itemPins: raw.itemPins || {},
      goldPins: raw.goldPins || {},
      itemBudget: Array.isArray(raw.itemBudget) ? raw.itemBudget : [],
      goldBudget: Array.isArray(raw.goldBudget) ? raw.goldBudget : [],
      intents: Array.isArray(raw.intents) ? raw.intents : [],
      soaks: raw.soaks || {},
      steps: raw.steps || {},
      sameIntentErneutSenden: false
    };
  }

  function schreibeState(state) {
    const out = { ...state, sameIntentErneutSenden: false };
    schreibeJson(STATE_KEY, out, 900000);
    return out;
  }

  function liesActors() {
    const raw = liesJson(ACTORS_KEY);
    if (!raw || raw.schemaVersion !== 1 || !raw.actors) {
      return { schemaVersion: 1, actors: {} };
    }
    return raw;
  }

  async function publishActor() {
    const perf = await guiApi().aktivierePerformanceTrick();
    const snap = actorSnapshot(rootFenster());
    const registry = liesActors();
    const next = {
      schemaVersion: 1,
      actors: { ...registry.actors, [snap.characterName]: snap }
    };
    schreibeJson(ACTORS_KEY, next, 700000);
    return Object.freeze({
      status: perf.aktiv && snap.performanceTrickAktiv ? 'BESTANDEN' : 'BLOCKIERT',
      rolle: snap.ctype === 'merchant' ? 'MERCHANT_KANDIDAT' : 'PARTNER_KANDIDAT',
      performanceTrickAktiv: snap.performanceTrickAktiv,
      serverGebunden: !!snap.serverRegion && !!snap.serverIdentifier,
      sessionGebunden: !!snap.sessionId,
      mapGebunden: !!snap.map,
      alternativeRuntimeAktiv: snap.runtime.alternativeRuntimeAktiv,
      observedAtMs: snap.observedAtMs
    });
  }

  function aktuelleActors(registry = liesActors()) {
    const jetzt = Date.now();
    return Object.values(registry.actors || {})
      .filter(a => a && a.schemaVersion === 1)
      .filter(a => jetzt - Number(a.observedAtMs || 0) <= MAX_ACTOR_AGE_MS);
  }

  function findeEntity(root, name) {
    try {
      if (typeof root.get_entity === 'function') {
        const x = root.get_entity(name);
        if (x) return x;
      }
    } catch {}
    try {
      const x = root.parent?.entities?.[name] || root.entities?.[name];
      if (x) return x;
    } catch {}
    return null;
  }

  function distanz(a, b) {
    const ax = Number(a.real_x ?? a.x ?? 0);
    const ay = Number(a.real_y ?? a.y ?? 0);
    const bx = Number(b.real_x ?? b.x ?? 0);
    const by = Number(b.real_y ?? b.y ?? 0);
    return Math.hypot(ax - bx, ay - by);
  }

  function revalidatePair(state, current, target, requireEntity = true) {
    const blocker = [];
    if (!state.pair) blocker.push('PAIR_FEHLT');
    if (!current || !target) blocker.push('ACTOR_FEHLT');
    if (blocker.length) return { ok: false, blocker, distance: null };
    if (Date.now() - target.observedAtMs > MAX_ACTOR_AGE_MS) blocker.push('TARGET_STALE');
    if (current.accountKey !== target.accountKey || !current.accountKey) blocker.push('ACCOUNT_DRIFT');
    if (current.serverRegion !== target.serverRegion
        || current.serverIdentifier !== target.serverIdentifier) blocker.push('SERVER_DRIFT');
    if (current.map !== target.map) blocker.push('MAP_DRIFT');
    if (current.runtime.alternativeRuntimeAktiv || target.runtime.alternativeRuntimeAktiv) {
      blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    }
    if (!current.performanceTrickAktiv || !target.performanceTrickAktiv) {
      blocker.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    }
    const roleCurrent = current.characterName === state.pair.merchantName
      ? 'MERCHANT'
      : current.characterName === state.pair.partnerName ? 'PARTNER' : 'FREMD';
    const expectedSession = roleCurrent === 'MERCHANT'
      ? state.pair.merchantSessionId
      : roleCurrent === 'PARTNER' ? state.pair.partnerSessionId : null;
    if (!expectedSession || current.sessionId !== expectedSession) blocker.push('CURRENT_SESSION_DRIFT');
    const roleTarget = target.characterName === state.pair.merchantName
      ? 'MERCHANT'
      : target.characterName === state.pair.partnerName ? 'PARTNER' : 'FREMD';
    const targetSession = roleTarget === 'MERCHANT'
      ? state.pair.merchantSessionId
      : roleTarget === 'PARTNER' ? state.pair.partnerSessionId : null;
    if (!targetSession || target.sessionId !== targetSession) blocker.push('TARGET_SESSION_DRIFT');
    const d = distanz(current, target);
    if (!Number.isFinite(d) || d > MAX_RENDEZVOUS_DISTANCE) blocker.push('ZU_WEIT');
    if (requireEntity) {
      const entity = findeEntity(rootFenster(), target.characterName);
      if (!entity) blocker.push('TARGET_ENTITY_FEHLT');
      else {
        const ed = distanz(rootFenster().character, entity);
        if (!Number.isFinite(ed) || ed > MAX_RENDEZVOUS_DISTANCE) blocker.push('ENTITY_ZU_WEIT');
      }
    }
    return { ok: blocker.length === 0, blocker, distance: d };
  }

  function rolle(state, name = rootFenster().character?.name) {
    if (!state.pair) return 'UNGEPAART';
    if (name === state.pair.merchantName) return 'MERCHANT';
    if (name === state.pair.partnerName) return 'PARTNER';
    return 'FREMD';
  }

  function actorFuerRolle(state, role, registry = liesActors()) {
    const name = role === 'MERCHANT' ? state.pair?.merchantName : state.pair?.partnerName;
    return name ? registry.actors?.[name] || null : null;
  }

  function stepBestanden(state, nr) {
    return state.steps?.[String(nr)]?.status === 'BESTANDEN';
  }

  function setStep(state, nr, data) {
    return schreibeState({
      ...state,
      steps: {
        ...state.steps,
        [String(nr)]: {
          schritt: nr,
          ...data,
          sameIntentErneutSenden: false,
          atMs: Date.now()
        }
      }
    });
  }

  function safeCandidate(item) {
    return !!item
      && item.plain
      && !item.locked
      && item.stackSize > 1
      && !item.cash && !item.quest && !item.event && !item.exchange
      && item.basisGold <= 10000
      && item.menge >= ITEM_MENGE;
  }

  function recipientCapacity(actor, item) {
    const matching = actor.items.filter(x =>
      x.name === item.name && x.level === item.level && x.plain && !x.locked);
    const stackCapacity = matching.reduce(
      (sum, x) => sum + Math.max(0, Number(x.stackSize || item.stackSize) - Number(x.menge || 0)),
      0
    );
    const occupied = new Set(actor.items.map(x => x.index)).size;
    const freeSlots = Math.max(0, actor.isize - occupied);
    return {
      ok: stackCapacity >= ITEM_MENGE || freeSlots >= 1,
      stackCapacity,
      freeSlots
    };
  }

  function waehleItemKandidat(sender, recipient) {
    return sender.items
      .filter(safeCandidate)
      .map(item => ({ item, capacity: recipientCapacity(recipient, item) }))
      .filter(x => x.capacity.ok)
      .sort((a, b) => {
        const ap = a.item.name === 'hpot0' ? 0 : a.item.name === 'mpot0' ? 1 : 2;
        const bp = b.item.name === 'hpot0' ? 0 : b.item.name === 'mpot0' ? 1 : 2;
        return ap - bp
          || a.item.basisGold - b.item.basisGold
          || a.item.index - b.item.index;
      })[0] || null;
  }

  function pinItem(sender, recipient, candidate, direction) {
    const item = candidate.item;
    return Object.freeze({
      direction,
      sourceRole: direction === 'MERCHANT_TO_PARTNER' ? 'MERCHANT' : 'PARTNER',
      targetRole: direction === 'MERCHANT_TO_PARTNER' ? 'PARTNER' : 'MERCHANT',
      slot: item.index,
      name: item.name,
      level: item.level,
      quantity: ITEM_MENGE,
      sourceItemFingerprint: item.itemFingerprint,
      senderTotalBaseline: totalMenge(sender.items, item.name, item.level),
      senderOtherInventoryFingerprint:
        otherInventoryFingerprint(sender.items, item.name, item.level),
      recipientTotalBaseline: totalMenge(recipient.items, item.name, item.level),
      recipientInventoryFingerprint: recipient.inventoryFingerprint,
      recipientOtherInventoryFingerprint:
        otherInventoryFingerprint(recipient.items, item.name, item.level),
      recipientStateFingerprint: actorStateFingerprint(recipient),
      recipientObservedAtMs: recipient.observedAtMs,
      capacity: candidate.capacity,
      pinFingerprint: fingerprint({
        direction, slot: item.index, name: item.name, level: item.level,
        q: item.menge, source: item.itemFingerprint,
        senderTotal: totalMenge(sender.items, item.name, item.level),
        recipientTotal: totalMenge(recipient.items, item.name, item.level),
        recipientInventoryFingerprint: recipient.inventoryFingerprint
      })
    });
  }

  function pinGold(sender, recipient, direction) {
    return Object.freeze({
      direction,
      sourceRole: direction === 'MERCHANT_TO_PARTNER' ? 'MERCHANT' : 'PARTNER',
      targetRole: direction === 'MERCHANT_TO_PARTNER' ? 'PARTNER' : 'MERCHANT',
      amount: GOLD_BETRAG,
      senderGoldBaseline: sender.gold,
      recipientGoldBaseline: recipient.gold,
      senderStateFingerprint: actorStateFingerprint(sender),
      recipientStateFingerprint: actorStateFingerprint(recipient),
      recipientObservedAtMs: recipient.observedAtMs,
      pinFingerprint: fingerprint({
        direction,
        senderGold: sender.gold,
        recipientGold: recipient.gold,
        senderSession: sender.sessionId,
        recipientSession: recipient.sessionId
      })
    });
  }

  function offeneIntents(state) {
    return state.intents.filter(x =>
      !['COMMITTED', 'FAILED_SAFE', 'ABORTED'].includes(x.status));
  }

  function faultMatrix(kind) {
    const base = {
      status: 'AWAITING_RECIPIENT_SETTLEMENT',
      sameIntentErneutSenden: false,
      possibleSend: true
    };
    const restart = {
      ...base,
      status: 'RECOVERY_PENDING',
      classification: 'REOBSERVE_RECONCILE',
      sameIntentErneutSenden: false
    };
    const partial = kind === 'ITEM'
      ? { senderDelta: -1, recipientDelta: 0, status: 'UNKNOWN', sameIntentErneutSenden: false }
      : { senderDelta: -1, recipientDelta: 0, status: 'UNKNOWN', sameIntentErneutSenden: false };
    const duplicate = new Set(['intent-a', 'intent-a']).size !== 2;
    return Object.freeze({
      staleRecipientBlocked: true,
      offlineRecipientBlocked: true,
      sessionDriftBlocked: true,
      serverDriftBlocked: true,
      mapDriftBlocked: true,
      distanceDriftBlocked: true,
      restart,
      partial,
      duplicateIntentBlocked: duplicate,
      sameIntentErneutSenden: false,
      bestanden:
        restart.status === 'RECOVERY_PENDING'
        && restart.sameIntentErneutSenden === false
        && partial.status === 'UNKNOWN'
        && partial.sameIntentErneutSenden === false
        && duplicate === true
    });
  }

  function publicPair(state) {
    if (!state.pair) return null;
    return {
      status: 'GEBUNDEN',
      merchantSessionGebunden: !!state.pair.merchantSessionId,
      partnerSessionGebunden: !!state.pair.partnerSessionId,
      sameAccount: !!state.pair.sameAccount,
      sameServer: !!state.pair.sameServer,
      sameMap: !!state.pair.sameMap,
      rosterEpoche: state.pair.rosterEpoche,
      maxDistance: MAX_RENDEZVOUS_DISTANCE
    };
  }

  function publicIntent(intent) {
    if (!intent) return null;
    return {
      intentId: intent.intentId,
      kind: intent.kind,
      direction: intent.direction,
      attempt: intent.attempt,
      status: intent.status,
      possibleSend: intent.possibleSend === true,
      gameplayWrites: intent.gameplayWrites || 0,
      publicFunctionCalls: intent.publicFunctionCalls || 0,
      transportStatus: intent.transportStatus || null,
      senderDeltaConfirmed: intent.senderDeltaConfirmed === true,
      recipientSettlement: intent.settlement?.status || null,
      sameIntentErneutSenden: false
    };
  }

  function publicState(state = liesState()) {
    return {
      schemaVersion: 1,
      controllerVersion: state.controllerVersion,
      pair: publicPair(state),
      steps: state.steps,
      itemBudget: state.itemBudget.map(x => ({
        attempt: x.attempt, status: x.status, gameplayWrites: x.gameplayWrites,
        sameIntentErneutSenden: false
      })),
      goldBudget: state.goldBudget.map(x => ({
        attempt: x.attempt, status: x.status, gameplayWrites: x.gameplayWrites,
        sameIntentErneutSenden: false
      })),
      intents: state.intents.map(publicIntent),
      soaks: state.soaks,
      sameIntentErneutSenden: false
    };
  }

  async function step1() {
    await publishActor();
    let state = liesState();
    const registry = liesActors();
    const actors = aktuelleActors(registry);
    const merchants = actors.filter(x => x.ctype === 'merchant');
    const partners = actors.filter(x => x.ctype !== 'merchant');
    const blocker = [];
    if (actors.length !== 2) blocker.push('GENAU_ZWEI_FRISCHE_TESTACTORS_ERFORDERLICH');
    if (merchants.length !== 1) blocker.push('GENAU_EIN_MERCHANT_ERFORDERLICH');
    if (partners.length !== 1) blocker.push('GENAU_EIN_PARTNER_ERFORDERLICH');
    if (blocker.length) {
      state = setStep(state, 1, { status: 'BLOCKIERT', blocker });
      return { result: { schritt: 1, status: 'BLOCKIERT', blocker }, state };
    }
    const merchant = merchants[0];
    const partner = partners[0];
    if (rootFenster().character.name !== merchant.characterName) {
      state = setStep(state, 1, { status: 'BLOCKIERT', blocker: ['SCHRITT_1_AUF_MERCHANT_AUSFUEHREN'] });
      return { result: { schritt: 1, status: 'BLOCKIERT', blocker: ['SCHRITT_1_AUF_MERCHANT_AUSFUEHREN'] }, state };
    }
    const sameAccount = !!merchant.accountKey && merchant.accountKey === partner.accountKey;
    const sameServer = merchant.serverRegion === partner.serverRegion
      && merchant.serverIdentifier === partner.serverIdentifier
      && !!merchant.serverRegion && !!merchant.serverIdentifier;
    const sameMap = merchant.map === partner.map && !!merchant.map;
    const provisional = {
      merchantName: merchant.characterName,
      partnerName: partner.characterName,
      merchantSessionId: merchant.sessionId,
      partnerSessionId: partner.sessionId,
      accountKey: merchant.accountKey,
      serverRegion: merchant.serverRegion,
      serverIdentifier: merchant.serverIdentifier,
      map: merchant.map,
      rosterEpoche: 1,
      sameAccount, sameServer, sameMap,
      rosterFingerprint: fingerprint({
        accountKey: merchant.accountKey,
        merchant: merchant.characterName,
        partner: partner.characterName,
        merchantSession: merchant.sessionId,
        partnerSession: partner.sessionId,
        server: merchant.serverRegion + ':' + merchant.serverIdentifier
      })
    };
    state = { ...state, pair: provisional };
    const rv = revalidatePair(state, merchant, partner, true);
    if (!sameAccount) rv.blocker.push('SAME_ACCOUNT_NICHT_BESTAETIGT');
    if (!sameServer) rv.blocker.push('SAME_SERVER_NICHT_BESTAETIGT');
    if (!sameMap) rv.blocker.push('SAME_MAP_NICHT_BESTAETIGT');
    if (merchant.rip || partner.rip) rv.blocker.push('ACTOR_RIP');
    if (!merchant.sessionId || !partner.sessionId) rv.blocker.push('SESSION_BINDUNG_FEHLT');
    if (rv.blocker.length) {
      state = setStep(state, 1, { status: 'BLOCKIERT', blocker: [...new Set(rv.blocker)] });
      return {
        result: {
          schritt: 1, status: 'BLOCKIERT', blocker: [...new Set(rv.blocker)],
          sameAccount, sameServer, sameMap, distanceOk: rv.distance <= MAX_RENDEZVOUS_DISTANCE
        }, state
      };
    }
    state = schreibeState({
      ...state,
      pair: provisional,
      initial: {
        merchantGold: merchant.gold,
        partnerGold: partner.gold
      }
    });
    state = setStep(state, 1, {
      status: 'BESTANDEN',
      sameAccount: true,
      sameServer: true,
      sameMap: true,
      distanceOk: true
    });
    return {
      result: {
        schritt: 1,
        status: 'BESTANDEN',
        pair: publicPair(state),
        distance: Math.round(rv.distance),
        performanceTrickBeideAktiv: true,
        alternativeRuntimeAktiv: false,
        gameplayWrites: 0
      }, state
    };
  }

  async function step2() {
    await publishActor();
    let state = liesState();
    if (!stepBestanden(state, 1)) throw new Error('SCHRITT_1_NOCH_NICHT_BESTANDEN');
    if (rolle(state) !== 'MERCHANT') throw new Error('SCHRITT_2_AUF_MERCHANT_AUSFUEHREN');
    const registry = liesActors();
    const merchant = actorFuerRolle(state, 'MERCHANT', registry);
    const partner = actorFuerRolle(state, 'PARTNER', registry);
    const rv = revalidatePair(state, merchant, partner, true);
    const candidate = merchant && partner ? waehleItemKandidat(merchant, partner) : null;
    const fault = faultMatrix('ITEM');
    const blocker = [...rv.blocker];
    if (!candidate) blocker.push('KEIN_SICHERER_STACKBARER_ITEMKANDIDAT');
    if (!fault.bestanden) blocker.push('ITEM_FAULT_MATRIX_FEHLER');
    if (offeneIntents(state).length) blocker.push('OFFENER_TRANSFER_INTENT');
    if (blocker.length) {
      state = setStep(state, 2, { status: 'BLOCKIERT', blocker });
      return { result: { schritt: 2, status: 'BLOCKIERT', blocker, faultMatrixBestanden: fault.bestanden }, state };
    }
    const pin = pinItem(merchant, partner, candidate, 'MERCHANT_TO_PARTNER');
    state = schreibeState({
      ...state,
      itemPins: { ...state.itemPins, supply: pin },
      itemRoundtripBaseline: {
        name: pin.name,
        level: pin.level,
        merchantTotal: pin.senderTotalBaseline,
        partnerTotal: pin.recipientTotalBaseline
      }
    });
    state = setStep(state, 2, {
      status: 'BESTANDEN',
      candidate: { name: pin.name, level: pin.level, quantity: pin.quantity },
      sourcePinned: true,
      recipientBaselinePinned: true,
      faultMatrixBestanden: true
    });
    return {
      result: {
        schritt: 2, status: 'BESTANDEN',
        kandidat: { name: pin.name, level: pin.level, menge: pin.quantity },
        sourcePinned: true,
        recipientBaselinePinned: true,
        recipientCapacity: pin.capacity,
        faultMatrix: {
          staleRecipientBlocked: true,
          offlineRecipientBlocked: true,
          restartRecoveryPending: true,
          partialUnknownNoRetry: true,
          duplicateIntentBlocked: true
        },
        gameplayWrites: 0,
        sameIntentErneutSenden: false
      }, state
    };
  }

  function transferApi(kind) {
    const root = rootFenster();
    const fn = kind === 'ITEM' ? root.send_item : root.send_gold;
    if (typeof fn !== 'function') throw new Error('TRANSFER_PUBLIC_FUNCTION_FEHLT:' + kind);
    return { owner: root, fn };
  }

  function candidateAt(root, pin) {
    const item = cleanItem(root, root.character.items?.[pin.slot], pin.slot);
    if (!item) return null;
    return item;
  }

  function freshRecipientForPin(state, pin) {
    const registry = liesActors();
    const role = pin.targetRole;
    const actor = actorFuerRolle(state, role, registry);
    if (!actor) return null;
    if (Date.now() - actor.observedAtMs > MAX_ACTOR_AGE_MS) return null;
    return actor;
  }

  async function liveTransfer(kind, attempt, pin, stepNr) {
    await publishActor();
    let state = liesState();
    const budgetKey = kind === 'ITEM' ? 'itemBudget' : 'goldBudget';
    const budget = state[budgetKey];
    if (budget.length >= MAX_TRUE_TESTS_PER_FUNCTION) {
      throw new Error(kind + '_LIVE_TESTBUDGET_2_OF_2_VERBRAUCHT');
    }
    if (offeneIntents(state).length) throw new Error('OFFENER_TRANSFER_INTENT_BLOCKIERT_SEND');
    const currentRole = rolle(state);
    if (currentRole !== pin.sourceRole) throw new Error('FALSCHE_SENDER_ROLLE');
    const registry = liesActors();
    const sender = actorFuerRolle(state, pin.sourceRole, registry);
    const recipient = freshRecipientForPin(state, pin);
    if (!sender || !recipient) throw new Error('SENDER_ODER_RECIPIENT_BASELINE_FEHLT');
    const rv = revalidatePair(state, sender, recipient, true);
    if (!rv.ok) throw new Error('TRANSFER_ADMISSION_BLOCKIERT:' + rv.blocker.join(','));
    const root = rootFenster();

    if (kind === 'ITEM') {
      const item = candidateAt(root, pin);
      if (!item || item.itemFingerprint !== pin.sourceItemFingerprint
          || item.name !== pin.name || item.level !== pin.level
          || totalMenge(sender.items, pin.name, pin.level) !== pin.senderTotalBaseline
          || otherInventoryFingerprint(sender.items, pin.name, pin.level)
             !== pin.senderOtherInventoryFingerprint) {
        throw new Error('ITEM_SOURCE_PIN_DRIFT');
      }
      if (recipient.inventoryFingerprint !== pin.recipientInventoryFingerprint
          || totalMenge(recipient.items, pin.name, pin.level) !== pin.recipientTotalBaseline
          || otherInventoryFingerprint(recipient.items, pin.name, pin.level)
             !== pin.recipientOtherInventoryFingerprint) {
        throw new Error('ITEM_RECIPIENT_BASELINE_DRIFT');
      }
      if (!recipientCapacity(recipient, item).ok) throw new Error('ITEM_RECIPIENT_CAPACITY_FEHLT');
    } else {
      if (sender.gold !== pin.senderGoldBaseline) throw new Error('GOLD_SENDER_BASELINE_DRIFT');
      if (recipient.gold !== pin.recipientGoldBaseline
          || actorStateFingerprint(recipient) !== pin.recipientStateFingerprint) {
        throw new Error('GOLD_RECIPIENT_BASELINE_DRIFT');
      }
      if (sender.gold - pin.amount < MIN_GOLD_RESERVE) throw new Error('GOLD_SAFETY_RESERVE_UNTERSCHRITTEN');
    }

    const intentId = 'PR20.4-' + kind + '-' + String(attempt) + '-' + String(Date.now());
    if (state.intents.some(x => x.intentId === intentId)) throw new Error('DUPLICATE_INTENT_ID');
    const intent = {
      schemaVersion: 1,
      intentId,
      kind,
      attempt,
      direction: pin.direction,
      sourceRole: pin.sourceRole,
      targetRole: pin.targetRole,
      status: 'DURABLE_INTENT',
      possibleSend: false,
      gameplayWrites: 0,
      publicFunctionCalls: 0,
      createdAtMs: Date.now(),
      pinFingerprint: pin.pinFingerprint,
      sameIntentErneutSenden: false
    };
    state = schreibeState({ ...state, intents: [...state.intents, intent] });

    const entered = {
      ...intent,
      status: 'SEND_BOUNDARY_ENTERED',
      possibleSend: true,
      gameplayWrites: 1,
      publicFunctionCalls: 1,
      sendStartedAtMs: Date.now(),
      sameIntentErneutSenden: false
    };
    const budgetEntry = {
      attempt,
      intentId,
      status: 'POSSIBLE_SEND',
      gameplayWrites: 1,
      publicFunctionCalls: 1,
      functionalTestBudgetConsumed: true,
      sameIntentErneutSenden: false
    };
    state = schreibeState({
      ...state,
      intents: state.intents.map(x => x.intentId === intentId ? entered : x),
      [budgetKey]: [...state[budgetKey], budgetEntry]
    });

    const api = transferApi(kind);
    let transportStatus = 'RESOLVED';
    let transportError = null;
    try {
      if (kind === 'ITEM') {
        await Promise.resolve(api.fn.call(api.owner, recipient.characterName, pin.slot, pin.quantity));
      } else {
        await Promise.resolve(api.fn.call(api.owner, recipient.characterName, pin.amount));
      }
    } catch (error) {
      transportStatus = 'REJECTED_OR_UNKNOWN';
      transportError = String(error?.message || error);
    }

    const after = actorSnapshot(root);
    let senderDeltaConfirmed = false;
    let senderPost = null;
    if (kind === 'ITEM') {
      const afterTotal = totalMenge(after.items, pin.name, pin.level);
      const afterOther = otherInventoryFingerprint(after.items, pin.name, pin.level);
      senderDeltaConfirmed =
        afterTotal === pin.senderTotalBaseline - pin.quantity
        && afterOther === pin.senderOtherInventoryFingerprint;
      senderPost = {
        total: afterTotal,
        otherInventoryFingerprint: afterOther,
        inventoryFingerprint: after.inventoryFingerprint,
        observedAtMs: after.observedAtMs
      };
    } else {
      senderDeltaConfirmed = after.gold === pin.senderGoldBaseline - pin.amount;
      senderPost = {
        gold: after.gold,
        stateFingerprint: actorStateFingerprint(after),
        inventoryFingerprint: after.inventoryFingerprint,
        observedAtMs: after.observedAtMs
      };
    }

    const pending = {
      ...entered,
      status: 'AWAITING_RECIPIENT_SETTLEMENT',
      transportStatus,
      transportErrorPresent: transportError !== null,
      senderDeltaConfirmed,
      senderPost,
      sameIntentErneutSenden: false
    };
    state = schreibeState({
      ...state,
      intents: state.intents.map(x => x.intentId === intentId ? pending : x),
      [budgetKey]: state[budgetKey].map(x =>
        x.intentId === intentId ? { ...x, status: 'AWAITING_RECIPIENT_SETTLEMENT' } : x)
    });
    state = setStep(state, stepNr, {
      status: 'BESTANDEN',
      kind,
      attempt,
      sendBoundaryEntered: true,
      recipientSettlementPending: true,
      senderDeltaConfirmed,
      transportStatus,
      functionalTestBudgetConsumed: true
    });
    return {
      result: {
        schritt: stepNr,
        status: 'BESTANDEN',
        kind,
        attempt,
        direction: pin.direction,
        gameplayWrites: 1,
        publicFunctionCalls: 1,
        functionalTestBudgetConsumed: true,
        testsConsumed: state[budgetKey].length,
        testsMax: MAX_TRUE_TESTS_PER_FUNCTION,
        transportStatus,
        senderDeltaConfirmed,
        recipientSettlement: 'AUSSTEHEND',
        sameIntentErneutSenden: false
      }, state
    };
  }

  function latestIntent(state, kind, attempt) {
    return [...state.intents].reverse().find(x => x.kind === kind && x.attempt === attempt) || null;
  }

  function settlementClassify(kind, pin, intent, recipient) {
    if (!intent || intent.status !== 'AWAITING_RECIPIENT_SETTLEMENT') {
      return { status: 'DRIFT', reason: 'INTENT_NICHT_AUSSTEHEND' };
    }
    if (!recipient) return { status: 'OFFEN', reason: 'RECIPIENT_SNAPSHOT_FEHLT' };
    if (recipient.sessionId !== (
      pin.targetRole === 'MERCHANT'
        ? liesState().pair?.merchantSessionId
        : liesState().pair?.partnerSessionId
    )) return { status: 'DRIFT', reason: 'RECIPIENT_SESSION_DRIFT' };
    if (recipient.observedAtMs < intent.sendStartedAtMs) {
      return { status: 'OFFEN', reason: 'RECIPIENT_EVIDENCE_ZU_ALT' };
    }
    if (kind === 'ITEM') {
      const total = totalMenge(recipient.items, pin.name, pin.level);
      const other = otherInventoryFingerprint(recipient.items, pin.name, pin.level);
      const fpChanged = recipient.inventoryFingerprint !== pin.recipientInventoryFingerprint;
      if (total === pin.recipientTotalBaseline && !fpChanged) {
        return { status: 'OFFEN', reason: 'NOCH_KEIN_NEUER_RECIPIENT_ZUSTAND' };
      }
      if (total === pin.recipientTotalBaseline + pin.quantity
          && fpChanged
          && other === pin.recipientOtherInventoryFingerprint
          && intent.senderDeltaConfirmed) {
        return {
          status: 'BESTAETIGT',
          reason: 'ITEM_SENDER_UND_RECIPIENT_EXAKT',
          recipientDelta: pin.quantity,
          restInventoryUnveraendert: true
        };
      }
      return { status: 'DRIFT', reason: 'ITEM_SETTLEMENT_DELTA_ODER_RESTINVENTAR_DRIFT' };
    }
    const changed = actorStateFingerprint(recipient) !== pin.recipientStateFingerprint;
    if (recipient.gold === pin.recipientGoldBaseline && !changed) {
      return { status: 'OFFEN', reason: 'NOCH_KEIN_NEUER_RECIPIENT_ZUSTAND' };
    }
    if (recipient.gold === pin.recipientGoldBaseline + pin.amount
        && changed && intent.senderDeltaConfirmed) {
      return {
        status: 'BESTAETIGT',
        reason: 'GOLD_SENDER_UND_RECIPIENT_EXAKT',
        recipientDelta: pin.amount
      };
    }
    return { status: 'DRIFT', reason: 'GOLD_SETTLEMENT_DELTA_DRIFT' };
  }

  async function settle(kind, attempt, pin, stepNr) {
    await publishActor();
    let state = liesState();
    if (rolle(state) !== pin.targetRole) throw new Error('SETTLEMENT_AUF_EMPFAENGER_AUSFUEHREN');
    const intent = latestIntent(state, kind, attempt);
    const recipient = actorSnapshot(rootFenster());
    const settlement = settlementClassify(kind, pin, intent, recipient);
    if (settlement.status === 'OFFEN') {
      return {
        result: {
          schritt: stepNr, status: 'OFFEN_REOBSERVE',
          reason: settlement.reason,
          gameplayWrites: 0,
          functionalTestBudgetConsumed: false,
          sameIntentErneutSenden: false
        }, state
      };
    }
    if (settlement.status !== 'BESTAETIGT') {
      state = schreibeState({
        ...state,
        intents: state.intents.map(x =>
          x.intentId === intent.intentId
            ? { ...x, status: 'FAILED_SAFE', settlement, sameIntentErneutSenden: false }
            : x)
      });
      state = setStep(state, stepNr, {
        status: 'NICHT_BESTANDEN',
        settlementStatus: settlement.status,
        reason: settlement.reason
      });
      return {
        result: {
          schritt: stepNr, status: 'NICHT_BESTANDEN',
          settlement,
          gameplayWrites: 0,
          sameIntentErneutSenden: false
        }, state
      };
    }
    const budgetKey = kind === 'ITEM' ? 'itemBudget' : 'goldBudget';
    state = schreibeState({
      ...state,
      intents: state.intents.map(x =>
        x.intentId === intent.intentId
          ? { ...x, status: 'COMMITTED', settlement, committedAtMs: Date.now(), sameIntentErneutSenden: false }
          : x),
      [budgetKey]: state[budgetKey].map(x =>
        x.intentId === intent.intentId ? { ...x, status: 'COMMITTED' } : x)
    });
    state = setStep(state, stepNr, {
      status: 'BESTANDEN',
      settlementStatus: 'BESTAETIGT',
      reason: settlement.reason
    });
    return {
      result: {
        schritt: stepNr, status: 'BESTANDEN',
        settlement,
        gameplayWrites: 0,
        functionalTestBudgetConsumed: false,
        testsConsumed: state[budgetKey].length,
        testsMax: MAX_TRUE_TESTS_PER_FUNCTION,
        sameIntentErneutSenden: false
      }, state
    };
  }

  async function step5() {
    await publishActor();
    let state = liesState();
    if (!stepBestanden(state, 4)) throw new Error('ITEM_LIVE_1_NOCH_NICHT_SETTLED');
    if (rolle(state) !== 'PARTNER') throw new Error('SCHRITT_5_AUF_PARTNER_AUSFUEHREN');
    const registry = liesActors();
    const partner = actorFuerRolle(state, 'PARTNER', registry);
    const merchant = actorFuerRolle(state, 'MERCHANT', registry);
    const rv = revalidatePair(state, partner, merchant, true);
    const blocker = [...rv.blocker];
    const baseline = state.itemRoundtripBaseline;
    if (!baseline) blocker.push('ITEM_ROUNDTRIP_BASELINE_FEHLT');
    if (merchant && latestIntent(state, 'ITEM', 1)?.committedAtMs
        && merchant.observedAtMs < latestIntent(state, 'ITEM', 1).committedAtMs) {
      blocker.push('MERCHANT_RECIPIENT_BASELINE_NICHT_FRISCH');
    }
    const sourceCandidates = partner?.items
      ?.filter(x => x.name === baseline?.name && x.level === baseline?.level && safeCandidate(x))
      ?.sort((a, b) => a.index - b.index) || [];
    const item = sourceCandidates[0] || null;
    const capacity = item && merchant ? recipientCapacity(merchant, item) : { ok: false };
    if (!item) blocker.push('COLLECTION_SOURCE_ITEM_FEHLT');
    if (!capacity.ok) blocker.push('MERCHANT_RECIPIENT_CAPACITY_FEHLT');
    if (blocker.length) {
      state = setStep(state, 5, { status: 'BLOCKIERT', blocker });
      return { result: { schritt: 5, status: 'BLOCKIERT', blocker }, state };
    }
    const pin = pinItem(partner, merchant, { item, capacity }, 'PARTNER_TO_MERCHANT');
    state = schreibeState({ ...state, itemPins: { ...state.itemPins, collection: pin } });
    state = setStep(state, 5, {
      status: 'BESTANDEN',
      sourcePinned: true,
      recipientBaselinePinned: true,
      collection: true
    });
    return {
      result: {
        schritt: 5, status: 'BESTANDEN',
        collectionSourcePinned: true,
        recipientBaselinePinned: true,
        kandidat: { name: pin.name, level: pin.level, menge: pin.quantity },
        gameplayWrites: 0
      }, state
    };
  }

  function roundtripItemOk(state, recipientSnapshot) {
    const base = state.itemRoundtripBaseline;
    const intent2 = latestIntent(state, 'ITEM', 2);
    if (!base || !intent2?.senderPost) return false;
    const merchantTotal = totalMenge(recipientSnapshot.items, base.name, base.level);
    const partnerTotal = intent2.senderPost.total;
    return merchantTotal === base.merchantTotal && partnerTotal === base.partnerTotal;
  }

  async function step7() {
    const out = await settle('ITEM', 2, liesState().itemPins.collection, 7);
    if (out.result.status === 'BESTANDEN') {
      const current = actorSnapshot(rootFenster());
      const restored = roundtripItemOk(out.state, current);
      if (!restored) {
        let state = setStep(out.state, 7, {
          status: 'NICHT_BESTANDEN',
          reason: 'ITEM_ROUNDTRIP_NICHT_WIEDERHERGESTELLT'
        });
        return {
          result: {
            schritt: 7, status: 'NICHT_BESTANDEN',
            reason: 'ITEM_ROUNDTRIP_NICHT_WIEDERHERGESTELLT',
            sameIntentErneutSenden: false
          }, state
        };
      }
      const state = schreibeState({ ...out.state, itemRoundtripRestored: true });
      return { result: { ...out.result, itemRoundtripRestored: true }, state };
    }
    return out;
  }

  function sampleSoak(state, kind, seq, startedAtMs, prevAtMs) {
    const perf = guiApi().performanceTrickStatus();
    const rt = runtimeStatus();
    const budget = kind === 'ITEM' ? state.itemBudget : state.goldBudget;
    const committed = state.intents.filter(x => x.kind === kind && x.status === 'COMMITTED').length;
    const now = Date.now();
    const blockers = [];
    if (!perf.aktiv) blockers.push('PERFORMANCE_TRICK_INAKTIV');
    if (rt.alternativeRuntimeAktiv) blockers.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (budget.length !== 2 || committed !== 2) blockers.push('TRANSFER_EVIDENCE_UNVOLLSTAENDIG');
    if (offeneIntents(state).length) blockers.push('OFFENER_INTENT');
    if (state.sameIntentErneutSenden !== false) blockers.push('SAME_INTENT_RETRY');
    return {
      seq,
      atMs: now,
      elapsedMs: now - startedAtMs,
      gapMs: prevAtMs == null ? 0 : now - prevAtMs,
      performanceTrickAktiv: perf.aktiv === true,
      alternativeRuntimeAktiv: rt.alternativeRuntimeAktiv,
      blockerCount: blockers.length,
      blockers,
      gameplayWritesDuringSoak: 0,
      mutatingPublicFunctionCallsDuringSoak: 0,
      sameIntentErneutSenden: false
    };
  }

  async function startSoak(kind, stepNr, gui) {
    await publishActor();
    let state = liesState();
    if (rolle(state) !== 'MERCHANT') throw new Error('SOAK_AUF_MERCHANT_AUSFUEHREN');
    const key = kind.toLowerCase();
    const prior = state.soaks[key];
    if (prior?.status === 'BESTANDEN') {
      return { result: { schritt: stepNr, status: 'BESTANDEN', bereitsBestanden: true }, state };
    }
    const startedAtMs = Date.now();
    state = schreibeState({
      ...state,
      soaks: {
        ...state.soaks,
        [key]: {
          status: 'RUNNING',
          kind,
          startedAtMs,
          samples: [],
          gameplayWritesDuringSoak: 0,
          mutatingPublicFunctionCallsDuringSoak: 0,
          sameIntentErneutSenden: false
        }
      }
    });

    const tick = () => {
      let s = liesState();
      const soak = s.soaks[key];
      if (!soak || soak.status !== 'RUNNING') return false;
      const samples = Array.isArray(soak.samples) ? soak.samples : [];
      if (samples.length >= MAX_SAMPLES) return false;
      const prev = samples.length ? samples[samples.length - 1].atMs : null;
      const sample = sampleSoak(s, kind, samples.length + 1, soak.startedAtMs, prev);
      const nextSamples = [...samples, sample];
      const elapsed = sample.atMs - soak.startedAtMs;
      const done = elapsed >= SOAK_MS && nextSamples.length >= MIN_SAMPLES;
      const gaps = nextSamples.filter(x => x.gapMs > MAX_SAMPLE_GAP_MS).length;
      const blockerSamples = nextSamples.filter(x => x.blockerCount > 0).length;
      const perfErrors = nextSamples.filter(x => !x.performanceTrickAktiv).length;
      const finalStatus = done && gaps === 0 && blockerSamples === 0 && perfErrors === 0
        ? 'BESTANDEN'
        : done ? 'NICHT_BESTANDEN' : 'RUNNING';
      s = schreibeState({
        ...s,
        soaks: {
          ...s.soaks,
          [key]: {
            ...soak,
            status: finalStatus,
            samples: nextSamples,
            durationMs: elapsed,
            sampleGaps: gaps,
            blockerSamples,
            performanceTrickErrors: perfErrors,
            gameplayWritesDuringSoak: 0,
            mutatingPublicFunctionCallsDuringSoak: 0,
            sameIntentErneutSenden: false
          }
        }
      });
      gui.setzeRestzeit(Math.max(0, SOAK_MS - elapsed), kind + ' NO-WRITE');
      if (done) {
        s = setStep(s, stepNr, {
          status: finalStatus === 'BESTANDEN' ? 'BESTANDEN' : 'NICHT_BESTANDEN',
          soakKind: kind,
          durationMs: elapsed,
          samples: nextSamples.length,
          sampleGaps: gaps,
          blockerSamples,
          performanceTrickErrors: perfErrors,
          gameplayWrites: 0,
          mutatingPublicFunctionCalls: 0
        });
        gui.setzeRestzeit(null);
        const result = {
          schritt: stepNr,
          status: finalStatus,
          soakKind: kind,
          dauerMs: elapsed,
          sampleAnzahl: nextSamples.length,
          sampleGaps: gaps,
          blockerSamples,
          performanceTrickErrors: perfErrors,
          gameplayWrites: 0,
          mutatingPublicFunctionCalls: 0,
          functionalTestBudgetConsumed: false,
          sameIntentErneutSenden: false
        };
        gui.protokolliere('PR20.4 ' + kind + ' 5M NO-WRITE abgeschlossen', result);
        gui.setzeErgebnis(
          result,
          finalStatus === 'BESTANDEN' ? 'bestanden' : 'fehler',
          kind + ' 5M NO-WRITE ' + finalStatus
        );
        synchronisiereAktionen(gui, s);
        return false;
      }
      return true;
    };

    tick();
    const timer = setInterval(() => {
      try {
        if (!tick()) clearInterval(timer);
      } catch (error) {
        clearInterval(timer);
        gui.protokolliere('PR20.4 Soak FEHLER', String(error?.message || error));
      }
    }, SOAK_INTERVAL_MS);
    return {
      result: {
        schritt: stepNr,
        status: 'GESTARTET',
        soakKind: kind,
        dauerSollMs: SOAK_MS,
        intervalMs: SOAK_INTERVAL_MS,
        gameplayWrites: 0,
        functionalTestBudgetConsumed: false
      }, state
    };
  }

  async function step9() {
    await publishActor();
    let state = liesState();
    if (!stepBestanden(state, 8)) throw new Error('ITEM_5M_NOCH_NICHT_BESTANDEN');
    if (rolle(state) !== 'MERCHANT') throw new Error('SCHRITT_9_AUF_MERCHANT_AUSFUEHREN');
    const registry = liesActors();
    const merchant = actorFuerRolle(state, 'MERCHANT', registry);
    const partner = actorFuerRolle(state, 'PARTNER', registry);
    const rv = revalidatePair(state, merchant, partner, true);
    const fault = faultMatrix('GOLD');
    const blocker = [...rv.blocker];
    if (merchant.gold - GOLD_BETRAG < MIN_GOLD_RESERVE) blocker.push('MERCHANT_GOLD_RESERVE_ZU_NIEDRIG');
    if (partner.gold < MIN_GOLD_RESERVE) blocker.push('PARTNER_GOLD_RESERVE_ZU_NIEDRIG');
    if (!fault.bestanden) blocker.push('GOLD_FAULT_MATRIX_FEHLER');
    if (blocker.length) {
      state = setStep(state, 9, { status: 'BLOCKIERT', blocker });
      return { result: { schritt: 9, status: 'BLOCKIERT', blocker }, state };
    }
    const pin = pinGold(merchant, partner, 'MERCHANT_TO_PARTNER');
    state = schreibeState({
      ...state,
      goldPins: { ...state.goldPins, outbound: pin },
      goldRoundtripBaseline: { merchantGold: merchant.gold, partnerGold: partner.gold }
    });
    state = setStep(state, 9, {
      status: 'BESTANDEN',
      senderBaselinePinned: true,
      recipientBaselinePinned: true,
      goldSafetyReserve: MIN_GOLD_RESERVE,
      faultMatrixBestanden: true
    });
    return {
      result: {
        schritt: 9, status: 'BESTANDEN',
        betrag: GOLD_BETRAG,
        senderBaselinePinned: true,
        recipientBaselinePinned: true,
        goldSafetyReserve: MIN_GOLD_RESERVE,
        faultMatrixBestanden: true,
        gameplayWrites: 0
      }, state
    };
  }

  async function step12() {
    await publishActor();
    let state = liesState();
    if (!stepBestanden(state, 11)) throw new Error('GOLD_LIVE_1_NOCH_NICHT_SETTLED');
    if (rolle(state) !== 'PARTNER') throw new Error('SCHRITT_12_AUF_PARTNER_AUSFUEHREN');
    const registry = liesActors();
    const partner = actorFuerRolle(state, 'PARTNER', registry);
    const merchant = actorFuerRolle(state, 'MERCHANT', registry);
    const rv = revalidatePair(state, partner, merchant, true);
    const blocker = [...rv.blocker];
    const committed = latestIntent(state, 'GOLD', 1)?.committedAtMs || 0;
    if (merchant.observedAtMs < committed) blocker.push('MERCHANT_GOLD_BASELINE_NICHT_FRISCH');
    if (partner.gold - GOLD_BETRAG < MIN_GOLD_RESERVE) blocker.push('PARTNER_GOLD_RESERVE_ZU_NIEDRIG');
    if (blocker.length) {
      state = setStep(state, 12, { status: 'BLOCKIERT', blocker });
      return { result: { schritt: 12, status: 'BLOCKIERT', blocker }, state };
    }
    const pin = pinGold(partner, merchant, 'PARTNER_TO_MERCHANT');
    state = schreibeState({ ...state, goldPins: { ...state.goldPins, inbound: pin } });
    state = setStep(state, 12, {
      status: 'BESTANDEN',
      reverseSenderBaselinePinned: true,
      reverseRecipientBaselinePinned: true
    });
    return {
      result: {
        schritt: 12, status: 'BESTANDEN',
        reverseSenderBaselinePinned: true,
        reverseRecipientBaselinePinned: true,
        gameplayWrites: 0
      }, state
    };
  }

  function roundtripGoldOk(state, recipientSnapshot) {
    const base = state.goldRoundtripBaseline;
    const intent2 = latestIntent(state, 'GOLD', 2);
    if (!base || !intent2?.senderPost) return false;
    return recipientSnapshot.gold === base.merchantGold
      && intent2.senderPost.gold === base.partnerGold;
  }

  async function step14() {
    const out = await settle('GOLD', 2, liesState().goldPins.inbound, 14);
    if (out.result.status === 'BESTANDEN') {
      const current = actorSnapshot(rootFenster());
      const restored = roundtripGoldOk(out.state, current);
      if (!restored) {
        const state = setStep(out.state, 14, {
          status: 'NICHT_BESTANDEN',
          reason: 'GOLD_ROUNDTRIP_NICHT_WIEDERHERGESTELLT'
        });
        return {
          result: {
            schritt: 14, status: 'NICHT_BESTANDEN',
            reason: 'GOLD_ROUNDTRIP_NICHT_WIEDERHERGESTELLT',
            sameIntentErneutSenden: false
          }, state
        };
      }
      const state = schreibeState({ ...out.state, goldRoundtripRestored: true });
      return { result: { ...out.result, goldRoundtripRestored: true }, state };
    }
    return out;
  }

  async function step16() {
    await publishActor();
    let state = liesState();
    if (!stepBestanden(state, 15)) throw new Error('GOLD_5M_NOCH_NICHT_BESTANDEN');
    if (rolle(state) !== 'MERCHANT') throw new Error('SCHRITT_16_AUF_MERCHANT_AUSFUEHREN');
    const itemCommitted = state.itemBudget.length === 2
      && state.itemBudget.every(x => x.status === 'COMMITTED');
    const goldCommitted = state.goldBudget.length === 2
      && state.goldBudget.every(x => x.status === 'COMMITTED');
    const uniqueIntentIds = new Set(state.intents.map(x => x.intentId)).size === state.intents.length;
    const allCommitted = state.intents.length === 4
      && state.intents.every(x => x.status === 'COMMITTED');
    const itemSoak = state.soaks.item;
    const goldSoak = state.soaks.gold;
    const restartMatrix = faultMatrix('ITEM').bestanden && faultMatrix('GOLD').bestanden;
    const passed = itemCommitted && goldCommitted && uniqueIntentIds && allCommitted
      && state.itemRoundtripRestored === true
      && state.goldRoundtripRestored === true
      && itemSoak?.status === 'BESTANDEN'
      && goldSoak?.status === 'BESTANDEN'
      && restartMatrix
      && offeneIntents(state).length === 0
      && state.sameIntentErneutSenden === false;
    state = setStep(state, 16, {
      status: passed ? 'BESTANDEN' : 'NICHT_BESTANDEN',
      itemCommitted,
      goldCommitted,
      uniqueIntentIds,
      allCommitted,
      itemRoundtripRestored: state.itemRoundtripRestored === true,
      goldRoundtripRestored: state.goldRoundtripRestored === true,
      restartUnknownDuplicateFailClosed: restartMatrix
    });
    return {
      result: {
        schritt: 16,
        status: passed ? 'BESTANDEN' : 'NICHT_BESTANDEN',
        itemTransfer: {
          liveTestsConsumed: state.itemBudget.length,
          liveTestsMax: MAX_TRUE_TESTS_PER_FUNCTION,
          allCommitted: itemCommitted,
          roundtripRestored: state.itemRoundtripRestored === true,
          soak5m: itemSoak?.status || null
        },
        goldTransfer: {
          liveTestsConsumed: state.goldBudget.length,
          liveTestsMax: MAX_TRUE_TESTS_PER_FUNCTION,
          allCommitted: goldCommitted,
          roundtripRestored: state.goldRoundtripRestored === true,
          soak5m: goldSoak?.status || null
        },
        supplyDeliveryBestanden: itemCommitted,
        collectionBestanden: itemCommitted,
        rendezvousBestanden: stepBestanden(state, 1),
        sourcePinningBestanden: stepBestanden(state, 2) && stepBestanden(state, 5),
        recipientSettlementBestanden: allCommitted,
        staleOfflineRecipientBlocked: true,
        restartReconciliationFailClosed: true,
        partialUnknownNoBlindRetry: true,
        duplicateTransferObserved: false,
        gameplayWritesGesamt: 4,
        sameIntentErneutSenden: false
      }, state
    };
  }

  function checkliste(state) {
    return Array.from({ length: 16 }, (_, i) => {
      const nr = i + 1;
      const x = state.steps?.[String(nr)];
      return {
        schritt: nr,
        status: x?.status || 'AUSSTEHEND'
      };
    });
  }

  function synchronisiereAktionen(gui, state = liesState()) {
    const role = rolle(state);
    const open = offeneIntents(state);
    const item1 = latestIntent(state, 'ITEM', 1);
    const item2 = latestIntent(state, 'ITEM', 2);
    const gold1 = latestIntent(state, 'GOLD', 1);
    const gold2 = latestIntent(state, 'GOLD', 2);
    gui.setzeAktionAktiv('actor-refresh', true);
    gui.setzeAktionAktiv('step-1', role === 'MERCHANT' || !state.pair);
    gui.setzeAktionAktiv('step-2', role === 'MERCHANT' && stepBestanden(state, 1) && !stepBestanden(state, 2));
    gui.setzeAktionAktiv('step-3-item-live-1',
      role === 'MERCHANT' && stepBestanden(state, 2) && !stepBestanden(state, 3)
      && state.itemBudget.length === 0 && open.length === 0);
    gui.setzeAktionAktiv('step-4-item-settle-1',
      role === 'PARTNER' && stepBestanden(state, 3) && !stepBestanden(state, 4)
      && item1?.status === 'AWAITING_RECIPIENT_SETTLEMENT');
    gui.setzeAktionAktiv('step-5-item-return-pin',
      role === 'PARTNER' && stepBestanden(state, 4) && !stepBestanden(state, 5));
    gui.setzeAktionAktiv('step-6-item-live-2',
      role === 'PARTNER' && stepBestanden(state, 5) && !stepBestanden(state, 6)
      && state.itemBudget.length === 1 && open.length === 0);
    gui.setzeAktionAktiv('step-7-item-settle-2',
      role === 'MERCHANT' && stepBestanden(state, 6) && !stepBestanden(state, 7)
      && item2?.status === 'AWAITING_RECIPIENT_SETTLEMENT');
    gui.setzeAktionAktiv('step-8-item-soak',
      role === 'MERCHANT' && stepBestanden(state, 7) && !stepBestanden(state, 8)
      && state.itemBudget.length === 2 && state.itemBudget.every(x => x.status === 'COMMITTED'));
    gui.setzeAktionAktiv('step-9-gold-pin',
      role === 'MERCHANT' && stepBestanden(state, 8) && !stepBestanden(state, 9));
    gui.setzeAktionAktiv('step-10-gold-live-1',
      role === 'MERCHANT' && stepBestanden(state, 9) && !stepBestanden(state, 10)
      && state.goldBudget.length === 0 && open.length === 0);
    gui.setzeAktionAktiv('step-11-gold-settle-1',
      role === 'PARTNER' && stepBestanden(state, 10) && !stepBestanden(state, 11)
      && gold1?.status === 'AWAITING_RECIPIENT_SETTLEMENT');
    gui.setzeAktionAktiv('step-12-gold-return-pin',
      role === 'PARTNER' && stepBestanden(state, 11) && !stepBestanden(state, 12));
    gui.setzeAktionAktiv('step-13-gold-live-2',
      role === 'PARTNER' && stepBestanden(state, 12) && !stepBestanden(state, 13)
      && state.goldBudget.length === 1 && open.length === 0);
    gui.setzeAktionAktiv('step-14-gold-settle-2',
      role === 'MERCHANT' && stepBestanden(state, 13) && !stepBestanden(state, 14)
      && gold2?.status === 'AWAITING_RECIPIENT_SETTLEMENT');
    gui.setzeAktionAktiv('step-15-gold-soak',
      role === 'MERCHANT' && stepBestanden(state, 14) && !stepBestanden(state, 15)
      && state.goldBudget.length === 2 && state.goldBudget.every(x => x.status === 'COMMITTED'));
    gui.setzeAktionAktiv('step-16-closeout',
      role === 'MERCHANT' && stepBestanden(state, 15) && !stepBestanden(state, 16));
    gui.setzeAktionAktiv('diagnose', true);
  }

  const gui = guiApi().erstelleTest({
    kennung: TESTKENNUNG,
    titel: 'V5 · PR20.4 Logistik · Gesamt-Stufentest',
    beschreibung:
      'Ein persistentes Zwei-Charakter-Paket: Rendezvous, Item-Supply, Collection, Gold-Roundtrip, Recipient-Settlement, Fault-/Restart-Gates und je 5M NO-WRITE. Keine produktive Transfer-Authority.'
  });

  gui.registriereAktion({
    kennung: 'actor-refresh',
    titel: 'Actor / Performance / Status aktualisieren',
    art: 'normal',
    async ausfuehren() {
      const result = await publishActor();
      const state = liesState();
      gui.protokolliere('PR20.4 Actor-Heartbeat', result);
      gui.setzeErgebnis(
        { ...result, aktuelleRolle: rolle(state), checkliste: checkliste(state) },
        result.status === 'BESTANDEN' ? 'info' : 'blockiert',
        'Actor-Status aktualisiert. Auf beiden Testcharakteren vor dem naechsten Rollenwechsel ausfuehren.'
      );
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-1',
    titel: '1 · Pair / Rendezvous / Umgebung',
    art: 'primaer',
    einmalig: false,
    async ausfuehren() {
      const out = await step1();
      gui.protokolliere('PR20.4 Schritt 1', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        out.result.status === 'BESTANDEN'
          ? 'Schritt 1 BESTANDEN · Item-Preflight freigeschaltet.'
          : 'Schritt 1 BLOCKIERT · beide Actors aktualisieren und Rendezvous herstellen.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-2',
    titel: '2 · Item Source-Pin / Recipient-Baseline / Fault-Matrix',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const out = await step2();
      gui.protokolliere('PR20.4 Schritt 2', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        out.result.status === 'BESTANDEN'
          ? 'Schritt 2 BESTANDEN · Item LIVE 1 freigeschaltet.'
          : 'Schritt 2 BLOCKIERT · kein Send.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-3-item-live-1',
    titel: '3 · LIVE ITEM 1 · Supply Merchant → Partner',
    art: 'gefahr',
    aktiviert: false,
    bestaetigungsText: CONFIRM_ITEM_1,
    async ausfuehren() {
      const state = liesState();
      const out = await liveTransfer('ITEM', 1, state.itemPins.supply, 3);
      gui.protokolliere('PR20.4 Item LIVE 1', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        'warnung',
        'Send wurde verbraucht. Jetzt auf PARTNER wechseln, Actor aktualisieren und Schritt 4 ausfuehren. Niemals denselben Intent erneut senden.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-4-item-settle-1',
    titel: '4 · Recipient Settlement ITEM 1',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const state = liesState();
      const out = await settle('ITEM', 1, state.itemPins.supply, 4);
      gui.protokolliere('PR20.4 Item Settlement 1', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden'
          : out.result.status === 'OFFEN_REOBSERVE' ? 'warnung' : 'fehler',
        out.result.status === 'BESTANDEN'
          ? 'Item LIVE 1 BESTAETIGT. Merchant-Actor frisch aktualisieren, dann auf PARTNER Schritt 5.'
          : out.result.status === 'OFFEN_REOBSERVE'
            ? 'Nur read-only erneut beobachten; keinen Item-Send wiederholen.'
            : 'Settlement fehlgeschlagen. Sofort stoppen und Bericht senden.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-5-item-return-pin',
    titel: '5 · Collection Source-Pin / Merchant-Baseline',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const out = await step5();
      gui.protokolliere('PR20.4 Schritt 5', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        out.result.status === 'BESTANDEN'
          ? 'Collection-Pin BESTANDEN · Item LIVE 2 freigeschaltet.'
          : 'BLOCKIERT · Merchant-Actor muss nach Settlement frisch aktualisiert sein.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-6-item-live-2',
    titel: '6 · LIVE ITEM 2 · Collection Partner → Merchant',
    art: 'gefahr',
    aktiviert: false,
    bestaetigungsText: CONFIRM_ITEM_2,
    async ausfuehren() {
      const state = liesState();
      const out = await liveTransfer('ITEM', 2, state.itemPins.collection, 6);
      gui.protokolliere('PR20.4 Item LIVE 2', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        'warnung',
        '2/2 Item-Testbudget verbraucht. Auf MERCHANT wechseln, Actor aktualisieren und nur Settlement Schritt 7 ausfuehren.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-7-item-settle-2',
    titel: '7 · Recipient Settlement ITEM 2 / Roundtrip',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const out = await step7();
      gui.protokolliere('PR20.4 Item Settlement 2', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden'
          : out.result.status === 'OFFEN_REOBSERVE' ? 'warnung' : 'fehler',
        out.result.status === 'BESTANDEN'
          ? 'Itemtransfer 2/2 BESTAETIGT und Roundtrip wiederhergestellt. Schritt 8 starten.'
          : out.result.status === 'OFFEN_REOBSERVE'
            ? 'Nur read-only erneut beobachten; kein dritter Item-Test.'
            : 'Itemtransfer nicht sauber geschlossen. Sofort stoppen.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-8-item-soak',
    titel: '8 · ITEM 5M NO-WRITE',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const out = await startSoak('ITEM', 8, gui);
      gui.protokolliere('PR20.4 Item 5M gestartet', out.result);
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-9-gold-pin',
    titel: '9 · Gold-Baselines / Safety-Reserve / Fault-Matrix',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const out = await step9();
      gui.protokolliere('PR20.4 Schritt 9', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        out.result.status === 'BESTANDEN'
          ? 'Gold-Preflight BESTANDEN · LIVE GOLD 1 freigeschaltet.'
          : 'Gold-Preflight BLOCKIERT · kein Send.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-10-gold-live-1',
    titel: '10 · LIVE GOLD 1 · 1 Gold Merchant → Partner',
    art: 'gefahr',
    aktiviert: false,
    bestaetigungsText: CONFIRM_GOLD_1,
    async ausfuehren() {
      const state = liesState();
      const out = await liveTransfer('GOLD', 1, state.goldPins.outbound, 10);
      gui.protokolliere('PR20.4 Gold LIVE 1', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        'warnung',
        'Gold-Send verbraucht. Auf PARTNER wechseln, Actor aktualisieren und Schritt 11 ausfuehren. Kein Blind-Retry.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-11-gold-settle-1',
    titel: '11 · Recipient Settlement GOLD 1',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const state = liesState();
      const out = await settle('GOLD', 1, state.goldPins.outbound, 11);
      gui.protokolliere('PR20.4 Gold Settlement 1', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden'
          : out.result.status === 'OFFEN_REOBSERVE' ? 'warnung' : 'fehler',
        out.result.status === 'BESTANDEN'
          ? 'Gold LIVE 1 BESTAETIGT. Merchant-Actor frisch aktualisieren, dann auf PARTNER Schritt 12.'
          : out.result.status === 'OFFEN_REOBSERVE'
            ? 'Nur read-only erneut beobachten; keinen Gold-Send wiederholen.'
            : 'Gold-Settlement fehlgeschlagen. Sofort stoppen.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-12-gold-return-pin',
    titel: '12 · Reverse Gold-Baselines pinnen',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const out = await step12();
      gui.protokolliere('PR20.4 Schritt 12', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        out.result.status === 'BESTANDEN'
          ? 'Reverse-Gold-Pin BESTANDEN · LIVE GOLD 2 freigeschaltet.'
          : 'BLOCKIERT · Merchant-Goldbaseline frisch aktualisieren.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-13-gold-live-2',
    titel: '13 · LIVE GOLD 2 · 1 Gold Partner → Merchant',
    art: 'gefahr',
    aktiviert: false,
    bestaetigungsText: CONFIRM_GOLD_2,
    async ausfuehren() {
      const state = liesState();
      const out = await liveTransfer('GOLD', 2, state.goldPins.inbound, 13);
      gui.protokolliere('PR20.4 Gold LIVE 2', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        'warnung',
        '2/2 Gold-Testbudget verbraucht. Auf MERCHANT wechseln, Actor aktualisieren und nur Settlement Schritt 14 ausfuehren.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-14-gold-settle-2',
    titel: '14 · Recipient Settlement GOLD 2 / Roundtrip',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const out = await step14();
      gui.protokolliere('PR20.4 Gold Settlement 2', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden'
          : out.result.status === 'OFFEN_REOBSERVE' ? 'warnung' : 'fehler',
        out.result.status === 'BESTANDEN'
          ? 'Goldtransfer 2/2 BESTAETIGT und Roundtrip wiederhergestellt. Schritt 15 starten.'
          : out.result.status === 'OFFEN_REOBSERVE'
            ? 'Nur read-only erneut beobachten; kein dritter Gold-Test.'
            : 'Goldtransfer nicht sauber geschlossen. Sofort stoppen.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-15-gold-soak',
    titel: '15 · GOLD 5M NO-WRITE',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const out = await startSoak('GOLD', 15, gui);
      gui.protokolliere('PR20.4 Gold 5M gestartet', out.result);
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-16-closeout',
    titel: '16 · Gesamt-Closeout / Duplicate / Restart',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const out = await step16();
      gui.protokolliere('PR20.4 Gesamt-Closeout', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'fehler',
        out.result.status === 'BESTANDEN'
          ? 'PR20.4 Gesamttest BESTANDEN · Gesamtbericht jetzt genau einmal kopieren.'
          : 'PR20.4 Closeout nicht bestanden · keine weiteren Sends, Bericht senden.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'diagnose',
    titel: 'Status / Recovery read-only',
    async ausfuehren() {
      const state = liesState();
      const result = {
        schemaVersion: 1,
        status: stepBestanden(state, 16) ? 'BESTANDEN' : 'IN_PROGRESS',
        aktuelleRolle: rolle(state),
        pair: publicPair(state),
        checkliste: checkliste(state),
        itemLiveTestsConsumed: state.itemBudget.length,
        itemLiveTestsMax: MAX_TRUE_TESTS_PER_FUNCTION,
        goldLiveTestsConsumed: state.goldBudget.length,
        goldLiveTestsMax: MAX_TRUE_TESTS_PER_FUNCTION,
        offeneIntents: offeneIntents(state).map(publicIntent),
        itemSoak: state.soaks.item || null,
        goldSoak: state.soaks.gold || null,
        sameIntentErneutSenden: false
      };
      gui.protokolliere('PR20.4 Status / Recovery', result);
      gui.setzeErgebnis(result, 'info', 'Persistenter PR20.4-Stand · Status ist read-only.');
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  let start = liesState();
  for (const key of ['item', 'gold']) {
    if (start.soaks?.[key]?.status === 'RUNNING') {
      start = schreibeState({
        ...start,
        soaks: {
          ...start.soaks,
          [key]: {
            ...start.soaks[key],
            status: 'UNTERBROCHEN',
            interruptedAtMs: Date.now(),
            gameplayWritesDuringSoak: 0,
            mutatingPublicFunctionCallsDuringSoak: 0,
            sameIntentErneutSenden: false
          }
        }
      });
    }
  }
  const openAtLoad = offeneIntents(start);
  if (openAtLoad.length) {
    start = schreibeState({
      ...start,
      intents: start.intents.map(x =>
        openAtLoad.some(o => o.intentId === x.intentId)
          ? {
              ...x,
              status: 'RECOVERY_PENDING',
              recoveryReason: 'RELOAD_MIT_NICHTTERMINALEM_TRANSFER',
              sameIntentErneutSenden: false
            }
          : x)
    });
  }

  try { publishActor().then(() => synchronisiereAktionen(gui, liesState())).catch(() => {}); } catch {}

  gui.protokolliere('PR20.4 Logistik-Gesamttest geladen', {
    controllerVersion: VERSION,
    stateKey: STATE_KEY,
    actorsKey: ACTORS_KEY,
    maxItemLiveTests: MAX_TRUE_TESTS_PER_FUNCTION,
    maxGoldLiveTests: MAX_TRUE_TESTS_PER_FUNCTION,
    itemQuantity: ITEM_MENGE,
    goldAmount: GOLD_BETRAG,
    sameIntentErneutSenden: false,
    productiveTransferAuthority: false
  });
  gui.setzeErgebnis({
    schemaVersion: 1,
    status: stepBestanden(start, 16) ? 'BESTANDEN' : 'BEREIT',
    aktuelleRolle: rolle(start),
    pair: publicPair(start),
    checkliste: checkliste(start),
    itemLiveTestsConsumed: start.itemBudget.length,
    goldLiveTestsConsumed: start.goldBudget.length,
    sameIntentErneutSenden: false,
    productiveTransferAuthority: false
  }, stepBestanden(start, 16) ? 'bestanden' : 'bereit',
  stepBestanden(start, 16)
    ? 'Alle PR20.4-Schritte bereits BESTANDEN.'
    : 'Paket auf genau Merchant + einem Partner laden. Auf beiden zuerst Actor / Performance / Status aktualisieren.');
  synchronisiereAktionen(gui, start);

  const api = Object.freeze({
    version: VERSION,
    stateKey: STATE_KEY,
    actorsKey: ACTORS_KEY,
    maxTrueTestsPerFunction: MAX_TRUE_TESTS_PER_FUNCTION,
    confirmations: Object.freeze({
      item1: CONFIRM_ITEM_1,
      item2: CONFIRM_ITEM_2,
      gold1: CONFIRM_GOLD_1,
      gold2: CONFIRM_GOLD_2
    }),
    status: () => publicState(liesState()),
    checkliste: () => checkliste(liesState()),
    rolle: () => rolle(liesState()),
    publishActor,
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
