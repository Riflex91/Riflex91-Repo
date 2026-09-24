(() => {
  'use strict';

  const VERSION = '1.0.0';
  const TEST_ID = 'pr20-7-gear-weapon-offhand-read-only-preflight';
  const SAFE_SLOTS = Object.freeze(['mainhand','offhand']);
  const DOUBLE_OBSERVE_DELAY_MS = 350;

  const events = [];
  let seq = 0;
  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: 'BOOT',
    phase: 'BOOT',
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    terminal: false,
    blocker: [],
    evidence: null,
    intents: [],
    gameplayWrites: 0,
    rawWriteCalls: 0,
    publicFunctionCalls: 0,
    sameIntentRetry: false,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    normalRuntimeAllowed: false,
    authority: {
      authorityIssued: false,
      durableIntentCreated: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      swapWriteRatification: false,
      farmerMerchantCoordinatorAuthority: false
    },
    supabase: {
      transport: 'WINDOWS_BRIDGE_5S_LOCAL_OBSERVE_60S_AGGREGATE_PLUS_TERMINAL_PUSH',
      localObservationSeconds: 5,
      statusIntervalSeconds: 60,
      terminalEventImmediate: true
    }
  };

  function text(value, max = 240) {
    return String(value == null ? '' : value).trim().slice(0, max);
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) {
        out.push(globalThis.parent);
      }
    } catch {}
    return out;
  }

  function root() {
    for (const candidate of roots()) {
      try {
        if (candidate?.character
            && Array.isArray(candidate.character.items)
            && candidate.character.slots
            && candidate.G?.items) {
          return candidate;
        }
      } catch {}
    }
    throw new Error('PR20_7_GEAR_SPIELKONTEXT_FEHLT');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ':' + canonical(value[key]))
      .join(',') + '}';
  }

  async function sha256(value) {
    const r = root();
    const cryptoApi = globalThis.crypto || r.crypto;
    if (!cryptoApi?.subtle?.digest) {
      throw new Error('PR20_7_GEAR_WEB_CRYPTO_UNAVAILABLE');
    }
    const bytes = new TextEncoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')).join('');
  }

  function stableItemMaterial(item) {
    if (!item || typeof item !== 'object') return null;
    const out = {};
    for (const key of Object.keys(item).sort().slice(0, 64)) {
      const value = item[key];
      if (value === null
          || typeof value === 'string'
          || typeof value === 'number'
          || typeof value === 'boolean') {
        out[key] = value;
      }
    }
    return canonical(out);
  }

  function serverBinding(r) {
    let parentRoot = null;
    try {
      if (r.parent && r.parent !== r) parentRoot = r.parent;
    } catch {}
    const region = [
      r.server_region,
      r.server?.region,
      parentRoot?.server_region,
      parentRoot?.server?.region
    ].map(value => text(value, 32)).find(Boolean) || '';
    const identifier = [
      r.server_identifier,
      r.server?.id,
      parentRoot?.server_identifier,
      parentRoot?.server?.id
    ].map(value => text(value, 32)).find(Boolean) || '';
    return { region, identifier };
  }

  function accountId(r) {
    for (const candidate of roots()) {
      try {
        const value = text(
          candidate?.user_id || candidate?.character?.owner || '',
          192
        );
        if (value) return value;
      } catch {}
    }
    return text(r.character?.owner || '', 192);
  }

  function runtimeConflict(r) {
    try {
      const v3 = r.AIO_V3?.__runtime;
      const status = v3 && typeof v3.status === 'function' ? v3.status() : null;
      if (v3 && (v3.timer || status?.running === true)) {
        return 'AIO_V3_RUNTIME_ACTIVE';
      }
    } catch {
      return 'AIO_V3_RUNTIME_UNREADABLE';
    }
    try {
      const v4 = r.AIO_V4 || r.V4Runtime;
      const status = v4 && typeof v4.status === 'function' ? v4.status() : null;
      if (status?.running === true || status?.aktivFreigegeben === true) {
        return 'V4_RUNTIME_ACTIVE';
      }
    } catch {
      return 'V4_RUNTIME_UNREADABLE';
    }
    return null;
  }

  async function ensurePerformanceTrick() {
    let available = false;
    let called = false;
    let lastError = null;
    for (const candidate of roots()) {
      try {
        if (typeof candidate?.performance_trick !== 'function') continue;
        available = true;
        candidate.performance_trick();
        called = true;
        break;
      } catch (error) {
        lastError = text(error?.message || error, 160);
      }
    }
    if (called) await sleep(350);

    const inspect = () => {
      let audioFound = false;
      let playing = false;
      let cplaying = false;
      for (const candidate of roots()) {
        try {
          const empty = candidate?.sounds?.empty;
          if (!empty) continue;
          audioFound = true;
          if (empty.cplaying === true) cplaying = true;
          if (typeof empty.playing === 'function' && empty.playing() === true) {
            playing = true;
          }
        } catch {}
      }
      return { audioFound, playing, cplaying };
    };

    let status = inspect();
    if (available && called && !status.playing) {
      for (const candidate of roots()) {
        try {
          if (typeof candidate?.performance_trick === 'function') {
            candidate.performance_trick();
            break;
          }
        } catch {}
      }
      await sleep(150);
      status = inspect();
    }

    return {
      available,
      called,
      audioFound: status.audioFound,
      playing: status.playing,
      cplaying: status.cplaying,
      active: available && called && status.audioFound && status.playing,
      verification: 'HOWLER_PLAYING_TRUE',
      error: lastError
    };
  }

  function observation() {
    const r = root();
    const c = r.character;
    const server = serverBinding(r);
    const account = accountId(r);
    if (!account) throw new Error('PR20_7_GEAR_ACCOUNT_BINDUNG_FEHLT');
    if (!text(c.name, 192)) throw new Error('PR20_7_GEAR_CHARACTER_BINDUNG_FEHLT');
    if (!text(c.id, 192)) throw new Error('PR20_7_GEAR_SESSION_BINDUNG_FEHLT');
    if (!server.region || !server.identifier) {
      throw new Error('PR20_7_GEAR_SERVER_BINDUNG_FEHLT');
    }
    if (text(c.ctype, 32).toLowerCase() !== 'merchant') {
      throw new Error('PR20_7_GEAR_MERCHANT_COORDINATOR_ERFORDERLICH');
    }
    if (c.rip === true || c.dead === true) {
      throw new Error('PR20_7_GEAR_CHARACTER_TOT');
    }
    if (c.moving === true) {
      throw new Error('PR20_7_GEAR_CHARACTER_BEWEGT_SICH');
    }
    if (c.target !== null && c.target !== undefined && text(c.target, 192)) {
      throw new Error('PR20_7_GEAR_CHARACTER_HAT_ZIEL');
    }
    if (c.q && typeof c.q === 'object' && Object.keys(c.q).length) {
      throw new Error('PR20_7_GEAR_CHARACTER_QUEUE_AKTIV');
    }
    const conflict = runtimeConflict(r);
    if (conflict) throw new Error('PR20_7_GEAR_ALTERNATIVE_RUNTIME_AKTIV:' + conflict);

    let hostile = 0;
    try {
      for (const entity of Object.values(r.entities || {})) {
        if (entity
            && entity.type === 'monster'
            && !entity.dead
            && !entity.rip
            && text(entity.target, 192) === text(c.name, 192)) {
          hostile += 1;
        }
      }
    } catch {
      throw new Error('PR20_7_GEAR_AGGRO_UNLESBAR');
    }
    if (hostile !== 0) {
      throw new Error('PR20_7_GEAR_CHARACTER_UNTER_ANGRIFF');
    }

    const inventory = c.items.map((item, index) => {
      if (!item || !item.name) return null;
      const def = r.G.items[item.name] || {};
      return {
        index,
        name: text(item.name, 128),
        level: Number(item.level || 0),
        type: text(def.type, 64),
        wtype: text(def.wtype, 64),
        classList: Array.isArray(def.class) ? def.class.map(x => text(x, 32)).filter(Boolean) : [],
        requiredLevel: Number(def.level || 0),
        locked: item.l === true || item.locked === true || item.lock === true,
        virtualB: item.b === true,
        material: stableItemMaterial(item)
      };
    }).filter(Boolean);

    const slots = {};
    for (const slot of SAFE_SLOTS) {
      const item = c.slots?.[slot] || null;
      if (!item || !item.name) {
        slots[slot] = null;
        continue;
      }
      const def = r.G.items[item.name] || {};
      slots[slot] = {
        slot,
        name: text(item.name, 128),
        level: Number(item.level || 0),
        type: text(def.type, 64),
        wtype: text(def.wtype, 64),
        locked: item.l === true || item.locked === true || item.lock === true,
        virtualB: item.b === true,
        material: stableItemMaterial(item)
      };
    }

    return {
      account,
      characterName: text(c.name, 192),
      sessionId: text(c.id, 192),
      ctype: text(c.ctype, 32).toLowerCase(),
      level: Number(c.level || 0),
      map: text(c.map, 96),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      inventory,
      slots,
      equipmentMaterial: Object.keys(c.slots || {})
        .filter(slot => !String(slot).startsWith('trade') && slot !== 'elixir')
        .sort()
        .map(slot => [slot, stableItemMaterial(c.slots?.[slot] || null)]),
      classRules: {
        mainhandWtypes: Object.keys(r.G.classes?.[text(c.ctype, 32).toLowerCase()]?.mainhand || {}).sort(),
        doublehandWtypes: Object.keys(r.G.classes?.[text(c.ctype, 32).toLowerCase()]?.doublehand || {}).sort(),
        offhandKinds: Object.keys(r.G.classes?.[text(c.ctype, 32).toLowerCase()]?.offhand || {}).sort()
      }
    };
  }

  function chooseCandidate(observed) {
    const candidates = [];
    const mainhand = observed.slots.mainhand;
    const offhand = observed.slots.offhand;
    const currentMainhandWtype = mainhand?.wtype || '';
    const mainhandIsDouble = !!currentMainhandWtype
      && observed.classRules.doublehandWtypes.includes(currentMainhandWtype);

    for (const item of observed.inventory) {
      if (!Number.isInteger(item.index) || item.index < 0 || item.index >= 128) continue;
      if (!item.material || item.locked || item.virtualB) continue;
      if (item.classList.length && !item.classList.includes(observed.ctype)) continue;
      if (Number.isFinite(item.requiredLevel) && item.requiredLevel > observed.level) continue;

      const possible = [];
      const isOneHand = !!item.wtype && observed.classRules.mainhandWtypes.includes(item.wtype);
      const isDouble = !!item.wtype && observed.classRules.doublehandWtypes.includes(item.wtype);
      if ((isOneHand || isDouble) && (!isDouble || offhand === null)) {
        possible.push({ slot: 'mainhand', candidateIsDoublehand: isDouble });
      }

      const typeOffhand = ['shield','source','quiver','misc_offhand'].includes(item.type)
        && observed.classRules.offhandKinds.includes(item.type);
      const weaponOffhand = ['weapon','tool'].includes(item.type)
        && !!item.wtype
        && observed.classRules.offhandKinds.includes(item.wtype)
        && !mainhandIsDouble;
      if ((typeOffhand || weaponOffhand) && !mainhandIsDouble) {
        possible.push({ slot: 'offhand', candidateIsDoublehand: false });
      }

      for (const option of possible) {
        const previous = observed.slots[option.slot];
        const oppositeSlot = option.slot === 'mainhand' ? 'offhand' : 'mainhand';
        const opposite = observed.slots[oppositeSlot];
        if (previous?.locked || previous?.virtualB) continue;
        if (opposite?.locked || opposite?.virtualB) continue;
        if (previous?.material && previous.material === item.material) continue;

        const restInventory = observed.inventory
          .filter(row => row.index !== item.index)
          .map(row => [row.index, row.material]);
        const restEquipment = observed.equipmentMaterial
          .filter(([slot]) => slot !== option.slot && slot !== oppositeSlot);

        candidates.push({
          slot: option.slot,
          oppositeSlot,
          inventoryIndex: item.index,
          candidateIsDoublehand: option.candidateIsDoublehand,
          candidate: item,
          previous: previous || null,
          opposite: opposite || null,
          restInventoryMaterial: canonical(restInventory),
          restEquipmentMaterial: canonical(restEquipment)
        });
      }
    }
    candidates.sort((a, b) =>
      SAFE_SLOTS.indexOf(a.slot) - SAFE_SLOTS.indexOf(b.slot)
      || Number(a.candidateIsDoublehand) - Number(b.candidateIsDoublehand)
      || a.inventoryIndex - b.inventoryIndex
    );
    return candidates[0] || null;
  }

  function stableCandidateIdentity(observed, selected) {
    return canonical({
      account: observed.account,
      characterName: observed.characterName,
      sessionId: observed.sessionId,
      serverRegion: observed.serverRegion,
      serverIdentifier: observed.serverIdentifier,
      slot: selected.slot,
      inventoryIndex: selected.inventoryIndex,
      candidateMaterial: selected.candidate.material,
      previousMaterial: selected.previous?.material ?? null,
      oppositeSlot: selected.oppositeSlot,
      oppositeMaterial: selected.opposite?.material ?? null,
      candidateIsDoublehand: selected.candidateIsDoublehand,
      classRules: observed.classRules,
      restInventoryMaterial: selected.restInventoryMaterial,
      restEquipmentMaterial: selected.restEquipmentMaterial
    });
  }

  function emit(type, severity, data = {}) {
    seq += 1;
    events.push({
      seq,
      ts: new Date().toISOString(),
      event: type,
      type,
      severity,
      reason: data.reason || null,
      component: 'v5-pr20-7-weapon-offhand-read-only-preflight',
      data
    });
    if (events.length > 128) events.splice(0, events.length - 128);
  }

  function setState(patch) {
    state = {
      ...state,
      ...patch,
      updatedAtMs: Date.now(),
      intents: [],
      gameplayWrites: 0,
      rawWriteCalls: 0,
      publicFunctionCalls: 0,
      sameIntentRetry: false,
      startCalls: 0,
      disconnectCalls: 0,
      farmerWorkersInstalled: 0,
      normalRuntimeAllowed: false,
      authority: {
        authorityIssued: false,
        durableIntentCreated: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        swapWriteRatification: false,
        farmerMerchantCoordinatorAuthority: false
      }
    };
    return state;
  }

  function installTelemetryFacade() {
    const r = root();
    r.AIO_V3 = r.AIO_V3 || {};
    const existing = r.AIO_V3.operations && typeof r.AIO_V3.operations === 'object'
      ? r.AIO_V3.operations
      : null;
    const oldStatus = existing && typeof existing.status === 'function'
      ? existing.status.bind(existing)
      : null;
    const oldHeartbeat = existing && typeof existing.hostHeartbeat === 'function'
      ? existing.hostHeartbeat.bind(existing)
      : null;

    r.AIO_V3.operations = {
      ...(existing || {}),
      __v5Pr207GearReadOnlyFacadeVersion: VERSION,
      status: () => {
        let base = {};
        try {
          const value = oldStatus ? oldStatus() : null;
          if (value && typeof value === 'object') base = value;
        } catch {}
        return {
          ...base,
          schemaVersion: Number(base.schemaVersion) || 1,
          mode: 'V5_AUTONOMOUS_TEST',
          v5AutonomousTest: state,
          telemetry: {
            queued: events.length,
            lastCapturedSeq: seq,
            dropped: 0
          }
        };
      },
      hostHeartbeat: () => {
        try {
          const value = oldHeartbeat ? oldHeartbeat() : null;
          if (value && typeof value === 'object') {
            return {
              ...value,
              v5Mode: 'V5_AUTONOMOUS_TEST',
              v5TestId: TEST_ID,
              v5ObservedAtMs: Date.now()
            };
          }
        } catch {}
        return {
          schemaVersion: 1,
          alive: true,
          mode: 'V5_AUTONOMOUS_TEST',
          testId: TEST_ID,
          observedAtMs: Date.now()
        };
      },
      reconciliationStatus: () => ({
        schemaVersion: 1,
        status: state.terminal
          ? 'TERMINAL_NO_MUTATION'
          : 'NO_MUTATION_RECONCILIATION_REQUIRED',
        v5AutonomousTestStatus: state.status,
        v5Terminal: state.terminal === true,
        sameIntentRetry: false
      }),
      peekTelemetry: (limit = 2000) =>
        events.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000)))
    };
  }

  async function run() {
    installTelemetryFacade();
    emit('PR20_7_WEAPON_OFFHAND_READ_ONLY_PREFLIGHT_STARTED', 'INFO');

    const performanceTrick = await ensurePerformanceTrick();
    if (!performanceTrick.active) {
      setState({
        status: 'BLOCKIERT',
        phase: 'BACKGROUND_EXECUTION',
        terminal: true,
        blocker: ['PR20_7_GEAR_PERFORMANCE_TRICK_NICHT_AKTIV'],
        performanceTrick
      });
      emit('PR20_7_WEAPON_OFFHAND_READ_ONLY_PREFLIGHT_BLOCKED', 'ERROR', {
        reason: 'PR20_7_GEAR_PERFORMANCE_TRICK_NICHT_AKTIV'
      });
      return;
    }

    const first = observation();
    const firstCandidate = chooseCandidate(first);
    if (!firstCandidate) {
      setState({
        status: 'BLOCKIERT',
        phase: 'REAL_READ_ONLY_PREFLIGHT',
        terminal: true,
        blocker: ['PR20_7_WEAPON_OFFHAND_KEIN_SICHERER_KANDIDAT'],
        performanceTrick,
        observedRecipient: {
          characterName: first.characterName,
          ctype: first.ctype,
          level: first.level,
          map: first.map,
          serverRegion: first.serverRegion,
          serverIdentifier: first.serverIdentifier,
          weaponSlots: SAFE_SLOTS.map(slot => ({
            slot,
            occupied: first.slots[slot] !== null,
            name: first.slots[slot]?.name || null,
            level: first.slots[slot]?.level ?? null,
            wtype: first.slots[slot]?.wtype || null
          })),
          classRules: first.classRules,
          inventoryItemCount: first.inventory.length
        }
      });
      emit('PR20_7_WEAPON_OFFHAND_READ_ONLY_PREFLIGHT_BLOCKED', 'WARN', {
        reason: 'PR20_7_WEAPON_OFFHAND_KEIN_SICHERER_KANDIDAT'
      });
      return;
    }

    const firstIdentity = stableCandidateIdentity(first, firstCandidate);
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const second = observation();
    const secondCandidate = chooseCandidate(second);
    if (!secondCandidate) {
      throw new Error('PR20_7_GEAR_KANDIDAT_ZWISCHEN_BEOBACHTUNGEN_VERLOREN');
    }
    const secondIdentity = stableCandidateIdentity(second, secondCandidate);
    if (firstIdentity !== secondIdentity) {
      throw new Error('PR20_7_GEAR_PREFLIGHT_SNAPSHOT_DRIFT');
    }

    const [
      accountBindingSha256,
      sessionBindingSha256,
      candidateFingerprintSha256,
      previousFingerprintSha256,
      oppositeFingerprintSha256,
      restInventoryFingerprintSha256,
      restEquipmentFingerprintSha256,
      prestateFingerprintSha256
    ] = await Promise.all([
      sha256(second.account),
      sha256(second.sessionId),
      sha256(secondCandidate.candidate.material),
      sha256(secondCandidate.previous?.material ?? 'null'),
      sha256(secondCandidate.opposite?.material ?? 'null'),
      sha256(secondCandidate.restInventoryMaterial),
      sha256(secondCandidate.restEquipmentMaterial),
      sha256(secondIdentity)
    ]);

    const evidence = {
      schemaVersion: 1,
      evidenceArt: 'V5_PR20_7_WEAPON_OFFHAND_REAL_BROWSER_PREFLIGHT',
      status: 'BESTANDEN',
      observedAtMs: Date.now(),
      recipient: {
        characterName: second.characterName,
        ctype: second.ctype,
        level: second.level,
        map: second.map,
        accountBindingSha256,
        sessionBindingSha256,
        serverRegion: second.serverRegion,
        serverIdentifier: second.serverIdentifier
      },
      candidate: {
        slot: secondCandidate.slot,
        inventoryIndex: secondCandidate.inventoryIndex,
        name: secondCandidate.candidate.name,
        level: secondCandidate.candidate.level,
        fingerprintSha256: candidateFingerprintSha256,
        physical: true,
        locked: false,
        virtualB: false
      },
      previousSlotItem: secondCandidate.previous ? {
        name: secondCandidate.previous.name,
        level: secondCandidate.previous.level,
        fingerprintSha256: previousFingerprintSha256,
        physical: true,
        locked: false,
        virtualB: false
      } : null,
      oppositeHand: secondCandidate.opposite ? {
        slot: secondCandidate.oppositeSlot,
        name: secondCandidate.opposite.name,
        level: secondCandidate.opposite.level,
        wtype: secondCandidate.opposite.wtype,
        fingerprintSha256: oppositeFingerprintSha256,
        physical: true,
        locked: false,
        virtualB: false
      } : {
        slot: secondCandidate.oppositeSlot,
        name: null,
        level: null,
        wtype: null,
        fingerprintSha256: oppositeFingerprintSha256,
        physical: true,
        locked: false,
        virtualB: false
      },
      candidateIsDoublehand: secondCandidate.candidateIsDoublehand,
      candidateClassList: secondCandidate.candidate.classList,
      candidateRequiredLevel: secondCandidate.candidate.requiredLevel,
      candidateWtype: secondCandidate.candidate.wtype,
      classRules: second.classRules,
      restInventoryFingerprintSha256,
      restEquipmentFingerprintSha256,
      prestateFingerprintSha256,
      stableDoubleObservation: true,
      doubleObserveDelayMs: DOUBLE_OBSERVE_DELAY_MS,
      performanceTrick,
      browserGameplayWrites: 0,
      publicFunctionCalls: 0,
      explicitWeaponSlotResolved: true,
      oppositeHandPinned: true,
      classRulesVerified: true,
      progressionDecisionGranted: false,
      authorityIssued: false,
      durableIntentCreated: false,
      swapWriteRatification: false,
      startCalls: 0,
      disconnectCalls: 0,
      farmerWorkersInstalled: 0,
      sameIntentRetry: false,
      normalRuntimeAllowed: false
    };

    setState({
      status: 'BESTANDEN',
      phase: 'COMPLETE',
      terminal: true,
      blocker: [],
      performanceTrick,
      evidence
    });
    emit('PR20_7_WEAPON_OFFHAND_READ_ONLY_PREFLIGHT_PASSED', 'INFO', {
      slot: evidence.candidate.slot,
      inventoryIndex: evidence.candidate.inventoryIndex,
      candidateWtype: evidence.candidateWtype,
      candidateIsDoublehand: evidence.candidateIsDoublehand,
      prestateFingerprintSha256
    });
  }

  installTelemetryFacade();
  globalThis.V5PR207WeaponOffhandReadOnlyTest = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    status: () => state,
    start: () => run()
  });

  Promise.resolve().then(run).catch(error => {
    const message = text(error?.message || error || 'PR20_7_GEAR_PREFLIGHT_FEHLER', 240);
    setState({
      status: 'FEHLER',
      phase: state.phase || 'UNKNOWN',
      terminal: true,
      error: message,
      blocker: [message]
    });
    emit('PR20_7_WEAPON_OFFHAND_READ_ONLY_PREFLIGHT_ERROR', 'ERROR', { reason: message });
  });
})();
