(() => {
  "use strict";

  const TEST_ID = "pr20-8-exchange-candidate-acquisition-readonly";
  const VERSION = "1.0.1";
  const API_NAME = "V5PR208ExchangeCandidateAcquisitionReadonly";
  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_CLASS = "merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const MAX_EXCHANGE_BASE_GOLD = 50000;
  const SPECIAL_EXCHANGE_NAMES = Object.freeze(new Set(["sixcake"]));

  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: "PR20_8_EXCHANGE_ACQUISITION_DISCOVERY",
    status: "BOOT",
    terminal: false,
    blocker: [],
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    recipient: null,
    bankSnapshotAvailable: false,
    observedBankPacks: [],
    inventoryCandidateCount: 0,
    bankCandidateCount: 0,
    selected: null,
    emptyInventorySlot: null,
    nextAction: null,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    acquisitionAuthority: {
      movement: false,
      bankRetrieve: false,
      buy: false,
      farm: false,
      exchange: false,
      gameplay: false,
      rawWrite: false
    },
    normalRuntimeAllowed: false
  };

  function text(value, max = 192) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent
          && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  function root() {
    for (const candidate of roots()) {
      try {
        if (candidate?.character
            && Array.isArray(candidate.character.items)
            && candidate.G?.items) return candidate;
      } catch {}
    }
    throw new Error("PR20_8_ACQUISITION_DISCOVERY_SPIELKONTEXT_FEHLT");
  }

  function serverBinding(r) {
    let p = null;
    try { if (r.parent && r.parent !== r) p = r.parent; } catch {}
    return {
      region: [
        r.server_region, r.server?.region,
        p?.server_region, p?.server?.region
      ].map(v => text(v, 32)).find(Boolean) || "",
      identifier: [
        r.server_identifier, r.server?.id,
        p?.server_identifier, p?.server?.id
      ].map(v => text(v, 32)).find(Boolean) || ""
    };
  }

  function runtimeConflict(r) {
    try {
      const v3 = r.AIO_V3?.__runtime;
      const s = v3 && typeof v3.status === "function" ? v3.status() : null;
      if (v3 && (v3.timer || s?.running === true)) return "AIO_V3_RUNTIME_ACTIVE";
    } catch { return "AIO_V3_RUNTIME_UNREADABLE"; }
    try {
      const v4 = r.AIO_V4 || r.V4Runtime;
      const s = v4 && typeof v4.status === "function" ? v4.status() : null;
      if (s?.running === true || s?.aktivFreigegeben === true) return "V4_RUNTIME_ACTIVE";
    } catch { return "V4_RUNTIME_UNREADABLE"; }
    return null;
  }

  function quantity(item) {
    const q = Number(item?.q == null ? 1 : item.q);
    return Number.isSafeInteger(q) && q >= 1 ? q : null;
  }

  function unsafePhysical(item) {
    return !item
      || item.l === true
      || item.locked === true
      || item.lock === true
      || item.b === true
      || item.blocked === true
      || item.giveaway === true
      || item.list === true
      || item.expires != null
      || item.acl != null
      || item.rid != null
      || item.p != null
      || item.gift != null;
  }

  function unsafeDefinition(def) {
    return !def
      || def.cash === true
      || def.event === true
      || def.quest === true
      || def.exclusive === true;
  }

  function candidate(item, location, G) {
    if (!item || typeof item !== "object") return null;
    const name = text(item.name, 128);
    const def = G.items?.[name];
    const exchangeQuantity = Number(def?.e);
    const observedQuantity = quantity(item);
    const baseGold = Number(def?.g);
    if (!name
        || !Number.isSafeInteger(exchangeQuantity)
        || exchangeQuantity < 1
        || observedQuantity === null
        || observedQuantity < exchangeQuantity
        || !Number.isFinite(baseGold)
        || baseGold < 0
        || baseGold > MAX_EXCHANGE_BASE_GOLD
        || SPECIAL_EXCHANGE_NAMES.has(name)
        || unsafePhysical(item)
        || unsafeDefinition(def)) return null;
    return {
      source: location.source,
      name,
      quantity: observedQuantity,
      exchangeQuantity,
      baseGold,
      inventorySlot: location.inventorySlot ?? null,
      pack: location.pack ?? null,
      bankSlot: location.bankSlot ?? null
    };
  }

  function compare(a, b) {
    return a.baseGold - b.baseGold
      || a.exchangeQuantity - b.exchangeQuantity
      || a.name.localeCompare(b.name)
      || String(a.pack || "").localeCompare(String(b.pack || ""))
      || Number(a.bankSlot ?? a.inventorySlot ?? 0)
        - Number(b.bankSlot ?? b.inventorySlot ?? 0);
  }

  function bankSnapshot(c) {
    const bank = c.bank;
    if (!bank || typeof bank !== "object" || Array.isArray(bank)) {
      return {available:false,packs:[],rows:[]};
    }
    const packs = Object.keys(bank)
      .filter(x => /^items[0-9]+$/.test(x) && Array.isArray(bank[x]))
      .sort((a,b) => Number(a.slice(5)) - Number(b.slice(5)));
    if (packs.length === 0) return {available:false,packs:[],rows:[]};
    const rows = [];
    for (const pack of packs) {
      const slots = bank[pack];
      for (let bankSlot = 0; bankSlot < slots.length && bankSlot < 42; bankSlot += 1) {
        rows.push({pack,bankSlot,item:slots[bankSlot] || null});
      }
    }
    return {available:true,packs,rows};
  }

  function installTelemetry(owner) {
    if (!owner) return;
    owner.AIO_V3 = owner.AIO_V3 || {};
    const old = owner.AIO_V3.operations && typeof owner.AIO_V3.operations === "object"
      ? owner.AIO_V3.operations
      : {};
    const oldStatus = typeof old.status === "function" ? old.status.bind(old) : null;
    const oldHeartbeat = typeof old.hostHeartbeat === "function" ? old.hostHeartbeat.bind(old) : null;
    owner.AIO_V3.operations = {
      ...old,
      __v5Pr208ExchangeAcquisitionDiscoveryVersion: VERSION,
      status: () => {
        let base = {};
        try {
          const value = oldStatus ? oldStatus() : null;
          if (value && typeof value === "object") base = value;
        } catch {}
        return {
          ...base,
          schemaVersion: Number(base.schemaVersion) || 1,
          mode: "V5_AUTONOMOUS_TEST",
          v5AutonomousTest: JSON.parse(JSON.stringify(state)),
          telemetry: {queued:0,lastCapturedSeq:0,dropped:0}
        };
      },
      hostHeartbeat: () => {
        let base = {};
        try {
          const value = oldHeartbeat ? oldHeartbeat() : null;
          if (value && typeof value === "object") base = value;
        } catch {}
        return {
          ...base,
          schemaVersion: Number(base.schemaVersion) || 1,
          mode: "V5_AUTONOMOUS_TEST",
          v5Mode: "V5_AUTONOMOUS_TEST",
          v5TestId: TEST_ID,
          alive: true,
          observedAtMs: Date.now(),
          v5ObservedAtMs: Date.now()
        };
      },
      reconciliationStatus: () => ({
        schemaVersion:1,
        status:state.terminal ? "TERMINAL_NO_MUTATION" : "OBSERVING",
        v5AutonomousTestStatus:state.status,
        v5Terminal:state.terminal === true,
        sameIntentRetry:false
      }),
      peekTelemetry: () => []
    };
  }

  function publish() {
    state.updatedAtMs = Date.now();
    for (const owner of roots()) {
      try { installTelemetry(owner); } catch {}
    }
  }

  function finish(status, blocker, patch = {}) {
    state = {
      ...state,
      ...patch,
      status,
      terminal:true,
      blocker:[...new Set(blocker || [])],
      updatedAtMs:Date.now()
    };
    publish();
    return state;
  }

  async function run() {
    try {
      publish();
      const r = root();
      const c = r.character;
      const server = serverBinding(r);
      if (text(c.name,192) !== EXPECTED_CHARACTER) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_EXAKTER_MERCHANT_ERFORDERLICH"]);
      }
      if (text(c.ctype || c.type,32).toLowerCase() !== EXPECTED_CLASS) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_MERCHANT_KLASSE_ERFORDERLICH"]);
      }
      if (!text(c.id,192)) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_SESSION_FEHLT"]);
      }
      if (server.region !== EXPECTED_SERVER_REGION
          || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_SERVER_BINDUNG_DRIFT"]);
      }
      if (c.rip === true || c.dead === true) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_CHARACTER_TOT"]);
      }
      if (c.moving === true) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_CHARACTER_BEWEGT_SICH"]);
      }
      if (c.q && typeof c.q === "object" && Object.keys(c.q).length > 0) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_Q_NICHT_FREI"]);
      }
      const conflict = runtimeConflict(r);
      if (conflict) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_ALTERNATIVE_RUNTIME_AKTIV:"+conflict]);
      }

      const capacityRaw = Number(c.isize);
      const capacity = Number.isSafeInteger(capacityRaw) && capacityRaw >= 1 && capacityRaw <= 64
        ? capacityRaw
        : Math.min(64,c.items.length);
      let emptyInventorySlot = null;
      const inventory = [];
      for (let i=0;i<capacity;i+=1) {
        const item = c.items[i] || null;
        if (item === null && emptyInventorySlot === null) emptyInventorySlot = i;
        const selected = candidate(item,{source:"INVENTORY",inventorySlot:i},r.G);
        if (selected) inventory.push(selected);
      }
      inventory.sort(compare);

      const bank = bankSnapshot(c);
      const bankCandidates = [];
      if (bank.available) {
        for (const row of bank.rows) {
          const selected = candidate(
            row.item,
            {source:"BANK",pack:row.pack,bankSlot:row.bankSlot},
            r.G
          );
          if (selected) bankCandidates.push(selected);
        }
        bankCandidates.sort(compare);
      }

      const recipient = {
        characterName:text(c.name,192),
        sessionId:text(c.id,192),
        serverRegion:server.region,
        serverIdentifier:server.identifier
      };
      const common = {
        recipient,
        bankSnapshotAvailable:bank.available,
        observedBankPacks:bank.packs,
        inventoryCandidateCount:inventory.length,
        bankCandidateCount:bankCandidates.length,
        emptyInventorySlot
      };

      if (inventory[0]) {
        return finish("BESTANDEN",[],{
          ...common,
          selected:inventory[0],
          nextAction:"RUN_EXISTING_EXCHANGE_SCANNER"
        });
      }
      if (!bank.available) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_BANK_SNAPSHOT_REQUIRED"],{
          ...common,
          selected:null,
          nextAction:"ACQUIRE_FRESH_BANK_SNAPSHOT_READ_ONLY"
        });
      }
      if (bankCandidates[0] && emptyInventorySlot !== null) {
        return finish("BESTANDEN",[],{
          ...common,
          selected:bankCandidates[0],
          nextAction:"PREPARE_EXACT_BANK_RETRIEVE_ONE_SHOT"
        });
      }
      if (bankCandidates[0] && emptyInventorySlot === null) {
        return finish("BLOCKIERT",["PR20_8_ACQUISITION_INVENTORY_VOLL"],{
          ...common,
          selected:bankCandidates[0],
          nextAction:"FREE_EXACT_INVENTORY_SLOT_BEFORE_BANK_RETRIEVE"
        });
      }
      return finish("BLOCKIERT",["PR20_8_ACQUISITION_KEIN_INVENTORY_ODER_BANK_KANDIDAT"],{
        ...common,
        selected:null,
        nextAction:"PREPARE_BUY_OR_FARM_ACQUISITION_STAGE"
      });
    } catch (error) {
      return finish("FEHLER",[
        text(error?.message || error,500) || "PR20_8_ACQUISITION_UNBEKANNTER_FEHLER"
      ]);
    }
  }

  let runPromise = null;
  function start() {
    if (runPromise === null) runPromise = run();
    return runPromise;
  }

  publish();
  const api = Object.freeze({
    testId:TEST_ID,
    version:VERSION,
    status:()=>state,
    start
  });
  globalThis[API_NAME] = api;
  try {
    const r = root();
    if (r !== globalThis) r[API_NAME] = api;
  } catch {}
  try {
    if (globalThis.parent && globalThis.parent !== globalThis) {
      globalThis.parent[API_NAME] = api;
    }
  } catch {}
  Promise.resolve().then(start).catch(() => {});
})();