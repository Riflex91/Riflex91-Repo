import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  admitPr208CompoundNachDurableReadback,
  admitPr208ExchangeNachDurableReadback,
  admitPr208UpgradeNachDurableReadback,
  erteilePr208CompoundOneShotAuthority,
  erteilePr208ExchangeOneShotAuthority,
  erteilePr208UpgradeOneShotAuthority,
  persistierePr208CompoundDurableIntent,
  persistierePr208ExchangeDurableIntent,
  persistierePr208UpgradeDurableIntent,
  pruefePr208CompoundPreflight,
  pruefePr208ExchangePreflight,
  pruefePr208UpgradePreflight,
  pruefePr208WertmutationVorAuthorityCurrentFence,
} from "../../erzeugt/index.js";

class MemoryAuthorityProtocol {
  constructor({ fail = false, wrong = false } = {}) {
    this.fail = fail;
    this.wrong = wrong;
    this.entries = [];
  }
  async schreibeDurable(intent) {
    if (this.fail) throw new Error("DISK_DOWN");
    this.entries.push(intent);
    return {
      durable: true,
      bestaetigungsId: "ACK:" + intent.binding.aktivierungsId,
      aktivierungsId: intent.binding.aktivierungsId,
      transaktionsId: this.wrong ? "WRONG" : intent.binding.transaktionsId,
    };
  }
}

class MemoryJournal {
  constructor({ readback = true } = {}) {
    this.readback = readback;
    this.entries = [];
  }
  async haengeDurableAn(e) {
    this.entries.push(e);
    return {
      durable: true,
      bestaetigungsId: "MEM:" + e.journalId,
      journalId: e.journalId,
      transaktionsId: e.transaktionsId,
      sequenz: e.sequenz,
    };
  }
  async liesTransaktion(tx) {
    if (!this.readback) return [];
    return this.entries.filter(x => x.transaktionsId === tx);
  }
}

function epochs(overrides = {}) {
  return {
    inventory: 11,
    q: 12,
    socketBudget: 13,
    actionChannel: 14,
    ...overrides,
  };
}

function snapshot(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "My_Merchant",
    sessionId: "My_Merchant",
    serverRegion: "EU",
    serverIdentifier: "I",
    prestateFingerprint: "pre-fp",
    inventoryFingerprint: "inventory-fp",
    qFingerprint: "q-fp",
    itemFingerprints: ["item-a", "item-b"],
    resourceEpochen: epochs(),
    offeneUpgradeAuthority: false,
    offeneCompoundAuthority: false,
    offeneExchangeAuthority: false,
    offeneUpgradeTransaktionId: null,
    offeneCompoundTransaktionId: null,
    offeneExchangeTransaktionId: null,
    ...overrides,
  };
}

function binding(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "AUTH-1",
    transaktionsId: "TX-1",
    characterId: "My_Merchant",
    sessionId: "My_Merchant",
    serverRegion: "EU",
    serverIdentifier: "I",
    prestateFingerprint: "pre-fp",
    inventoryFingerprint: "inventory-fp",
    qFingerprint: "q-fp",
    itemFingerprints: ["item-a", "item-b"],
    resourceEpochen: epochs(),
    ausgestelltAmMs: 100,
    gueltigBisMs: 1_600,
    maximaleVerwendungen: 1,
    ...overrides,
  };
}

function plan(family, overrides = {}) {
  const map = {
    UPGRADE: {
      actionContractId: "AL-ACTION-UPGRADE",
      recoveryContractId: "AL-RECOVERY-UPGRADE",
      verifierId: "AL-VERIFIER-UPGRADE",
      publicFunction: "upgrade",
    },
    COMPOUND: {
      actionContractId: "AL-ACTION-COMPOUND",
      recoveryContractId: "AL-RECOVERY-COMPOUND",
      verifierId: "AL-VERIFIER-COMPOUND",
      publicFunction: "compound",
    },
    EXCHANGE: {
      actionContractId: "AL-ACTION-EXCHANGE",
      recoveryContractId: "AL-RECOVERY-EXCHANGE",
      verifierId: "AL-VERIFIER-EXCHANGE",
      publicFunction: "exchange",
    },
  };
  return {
    schemaVersion: 1,
    transaktionsId: "TX-1",
    auftragId: "ORDER-1",
    ablaufId: "FLOW-1",
    characterId: "My_Merchant",
    sessionId: "My_Merchant",
    serverRegion: "EU",
    serverIdentifier: "I",
    prestateFingerprint: "pre-fp",
    inventoryFingerprint: "inventory-fp",
    qFingerprint: "q-fp",
    itemFingerprints: ["item-a", "item-b"],
    resourceEpochen: epochs(),
    ...map[family],
    observedAtMs: 100,
    gueltigBisMs: 1_600,
    ...overrides,
  };
}

async function authorityFor(family, options = {}) {
  const protocol = options.protocol ?? new MemoryAuthorityProtocol();
  const b = options.binding ?? binding();
  const s = options.snapshot ?? snapshot();
  const issue = family === "UPGRADE"
    ? erteilePr208UpgradeOneShotAuthority
    : family === "COMPOUND"
      ? erteilePr208CompoundOneShotAuthority
      : erteilePr208ExchangeOneShotAuthority;
  const result = await issue(b, s, protocol);
  return { result, protocol, binding: b, snapshot: s };
}

const families = {
  UPGRADE: {
    preflight: pruefePr208UpgradePreflight,
    persist: persistierePr208UpgradeDurableIntent,
    admit: admitPr208UpgradeNachDurableReadback,
  },
  COMPOUND: {
    preflight: pruefePr208CompoundPreflight,
    persist: persistierePr208CompoundDurableIntent,
    admit: admitPr208CompoundNachDurableReadback,
  },
  EXCHANGE: {
    preflight: pruefePr208ExchangePreflight,
    persist: persistierePr208ExchangeDurableIntent,
    admit: admitPr208ExchangeNachDurableReadback,
  },
};

test("PR20.8 Current-Fence blockiert jede offene Wertmutations-Authority oder Transaktion", () => {
  assert.equal(pruefePr208WertmutationVorAuthorityCurrentFence(snapshot()).status, "BEREIT");
  for (const patch of [
    { offeneUpgradeAuthority: true },
    { offeneCompoundAuthority: true },
    { offeneExchangeAuthority: true },
    { offeneUpgradeTransaktionId: "U-1" },
    { offeneCompoundTransaktionId: "C-1" },
    { offeneExchangeTransaktionId: "E-1" },
  ]) {
    const result = pruefePr208WertmutationVorAuthorityCurrentFence(snapshot(patch));
    assert.equal(result.status, "BLOCKIERT");
    assert.equal(result.actionAuthority, false);
    assert.equal(result.gameplayAutoritaet, false);
    assert.equal(result.rawWriteAutoritaet, false);
  }
});

test("PR20.8 Upgrade Compound Exchange stellen getrennte durable One-Shot-Authorities aus", async () => {
  for (const family of Object.keys(families)) {
    const { result, protocol } = await authorityFor(family);
    assert.equal(result.erfolgreich, true, family);
    assert.equal(result.durableReadback, true, family);
    assert.equal(result.maximaleVerwendungen, 1, family);
    assert.equal(result.gameplayWrites, 0, family);
    assert.equal(result.publicFunctionCalls, 0, family);
    assert.equal(result.rawWriteCalls, 0, family);
    assert.equal(result.normalRuntimeAllowed, false, family);
    assert.ok(result.authority, family);
    assert.equal(protocol.entries.length, 1, family);
    assert.equal(protocol.entries[0].sameIntentRetry, false, family);
    assert.equal(protocol.entries[0].gameplayWriteNochNichtAusgefuehrt, true, family);
    assert.equal(protocol.entries[0].rawWriteAutoritaet, false, family);
    assert.equal(protocol.entries[0].breiteRuntimeFreigabe, false, family);
  }
});

test("PR20.8 Authority TTL >1500ms und falscher Durable-Readback werden abgelehnt", async () => {
  await assert.rejects(
    () => erteilePr208UpgradeOneShotAuthority(
      binding({ gueltigBisMs: 1_601 }),
      snapshot(),
      new MemoryAuthorityProtocol(),
    ),
    /PR20_8_AUTHORITY_TTL_UNGUELTIG/,
  );
  const wrong = await erteilePr208CompoundOneShotAuthority(
    binding(),
    snapshot(),
    new MemoryAuthorityProtocol({ wrong: true }),
  );
  assert.equal(wrong.erfolgreich, false);
  assert.equal(wrong.grund, "PR20_8_COMPOUND_DURABLE_READBACK_FEHLER");
  assert.equal(wrong.authority, null);

  const failed = await erteilePr208ExchangeOneShotAuthority(
    binding(),
    snapshot(),
    new MemoryAuthorityProtocol({ fail: true }),
  );
  assert.equal(failed.erfolgreich, false);
  assert.equal(failed.grund, "PR20_8_EXCHANGE_DURABLE_WRITE_FEHLER");
  assert.equal(failed.authority, null);
});

test("PR20.8 Character Session Server Fingerprint und Fence-Epoch Drift widerrufen fail-closed", async () => {
  const drifts = [
    { characterId: "Other" },
    { sessionId: "Other" },
    { serverRegion: "US" },
    { serverIdentifier: "II" },
    { prestateFingerprint: "pre-drift" },
    { inventoryFingerprint: "inventory-drift" },
    { qFingerprint: "q-drift" },
    { itemFingerprints: ["item-a", "item-c"] },
    { resourceEpochen: epochs({ inventory: 99 }) },
    { resourceEpochen: epochs({ q: 99 }) },
    { resourceEpochen: epochs({ socketBudget: 99 }) },
    { resourceEpochen: epochs({ actionChannel: 99 }) },
  ];
  for (const [family, api] of Object.entries(families)) {
    for (const drift of drifts) {
      const { result } = await authorityFor(family);
      const authority = result.authority;
      assert.ok(authority);
      const current = snapshot(drift);
      const pf = api.preflight(plan(family), authority, current, 200);
      assert.equal(pf.status, "BLOCKIERT", family + ":" + JSON.stringify(drift));
      assert.equal(authority.widerrufen(), true);
      assert.equal(pf.gameplayWrites, 0);
      assert.equal(pf.rawWriteCalls, 0);
    }
  }
});

test("PR20.8 Contract-Binding Drift blockiert vor Durable Intent", async () => {
  for (const [family, api] of Object.entries(families)) {
    const { result } = await authorityFor(family);
    assert.ok(result.authority);
    const wrong = plan(family, {
      actionContractId: family === "UPGRADE"
        ? "AL-ACTION-COMPOUND"
        : "AL-ACTION-UPGRADE",
    });
    const pf = api.preflight(wrong, result.authority, snapshot(), 200);
    assert.equal(pf.status, "BLOCKIERT");
    assert.match(pf.grund, /CONTRACT_BINDING_DRIFT/);
  }
});

test("PR20.8 Durable Intent wird vor Admission geschrieben und exakt gelesen", async () => {
  for (const [family, api] of Object.entries(families)) {
    const { result } = await authorityFor(family);
    const authority = result.authority;
    assert.ok(authority);
    const journal = new MemoryJournal();
    const p = plan(family);
    const durable = await api.persist(p, authority, snapshot(), 200, journal);
    assert.equal(durable.status, "INTENT_DURABLE_NO_WRITE", family);
    assert.equal(durable.durable, true, family);
    assert.equal(durable.sendBoundaryState, "NICHT_GESENDET", family);
    assert.equal(durable.sameIntentRetry, false, family);
    assert.equal(durable.gameplayWrites, 0, family);
    assert.equal(durable.publicFunctionCalls, 0, family);
    assert.equal(durable.rawWriteCalls, 0, family);
    assert.deepEqual(journal.entries.map(x => x.art), ["INTENT"], family);
    assert.equal(journal.entries[0].inhalt.send_boundary_state, "NICHT_GESENDET");
    assert.equal(journal.entries[0].inhalt.same_intent_retry, false);
  }
});

test("PR20.8 fehlender Durable-Readback widerruft Authority und verhindert Admission", async () => {
  for (const [family, api] of Object.entries(families)) {
    const { result } = await authorityFor(family);
    const authority = result.authority;
    assert.ok(authority);
    await assert.rejects(
      () => api.persist(
        plan(family),
        authority,
        snapshot(),
        200,
        new MemoryJournal({ readback: false }),
      ),
      /DURABLE_READBACK_FEHLER/,
    );
    assert.equal(authority.widerrufen(), true, family);
    assert.equal(authority.verbraucht(), false, family);
  }
});

test("PR20.8 Admission konsumiert exakt einmal und sendet selbst nichts", async () => {
  for (const [family, api] of Object.entries(families)) {
    const { result } = await authorityFor(family);
    const authority = result.authority;
    assert.ok(authority);
    const p = plan(family);
    const durable = await api.persist(
      p,
      authority,
      snapshot(),
      200,
      new MemoryJournal(),
    );
    const admitted = api.admit(p, authority, snapshot(), 201, durable);
    assert.equal(admitted.status, "ADMITTED_ONE_SHOT_NO_SEND", family);
    assert.equal(admitted.authorityConsumed, true, family);
    assert.equal(admitted.sendBoundaryState, "NICHT_GESENDET", family);
    assert.equal(admitted.sameIntentRetry, false, family);
    assert.equal(admitted.gameplayWrites, 0, family);
    assert.equal(admitted.publicFunctionCalls, 0, family);
    assert.equal(admitted.rawWriteCalls, 0, family);
    assert.equal(admitted.normalRuntimeAllowed, false, family);
    assert.equal(authority.verbraucht(), true, family);

    const second = api.admit(p, authority, snapshot(), 202, durable);
    assert.equal(second.status, "BLOCKIERT", family);
    assert.equal(second.authorityConsumed, false, family);
  }
});

test("PR20.8 Foundation enthaelt keine produktiven API-Aufrufe", () => {
  const sources = [
    fs.readFileSync("grundlage/quelle/merchant/pr20-8-wertmutation-one-shot.ts", "utf8"),
    fs.readFileSync("grundlage/quelle/merchant/pr20-8-wertmutation-durable-admission.ts", "utf8"),
  ].join("\n");
  for (const marker of [
    "upgrade(",
    "compound(",
    "exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "send_item(",
    "send_gold(",
  ]) assert.equal(sources.includes(marker), false, marker);
  for (const marker of [
    "sameIntentRetry: false",
    "gameplayWrites: 0",
    "publicFunctionCalls: 0",
    "rawWriteCalls: 0",
    "normalRuntimeAllowed: false",
    "sendBoundaryState: \"NICHT_GESENDET\"",
  ]) assert.ok(sources.includes(marker), marker);
});
