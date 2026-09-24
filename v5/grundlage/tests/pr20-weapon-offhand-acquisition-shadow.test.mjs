import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  CharacterSocketBudget,
  GoldBudgetLedger,
  MutationsKanalKoordination,
  Pr207WeaponOffhandAcquisitionShadow,
  RessourcenVerwalter,
} from "../../erzeugt/index.js";

class MemoryJournal {
  constructor() {
    this.entries = [];
  }

  async haengeDurableAn(eintrag) {
    this.entries.push(eintrag);
    return {
      durable: true,
      bestaetigungsId: "ack:" + eintrag.journalId,
      journalId: eintrag.journalId,
      transaktionsId: eintrag.transaktionsId,
      sequenz: eintrag.sequenz,
    };
  }

  async liesTransaktion(transaktionsId) {
    return this.entries.filter(x => x.transaktionsId === transaktionsId);
  }
}

function request(overrides = {}) {
  return {
    schemaVersion: 1,
    transaktionsId: "pr20-7-acq-shadow-tx-1",
    auftragId: "pr20-7-acq-shadow-order-1",
    ablaufId: "pr20-7-acq-shadow-flow-1",
    characterId: "My_Merchant",
    sessionId: "My_Merchant",
    serverRegion: "EU",
    serverIdentifier: "I",
    itemName: "wshield",
    quantity: 1,
    unitPrice: 4800,
    observedGold: 14_493_644,
    safetyReserve: 1_000,
    inventoryFingerprint: "inventory-fp-1",
    goldFingerprint: "gold-fp-1",
    vendorFingerprint: "vendor-fp-1",
    itemDefinitionFingerprint: "item-def-fp-1",
    observedAtMs: 10_000,
    ...overrides,
  };
}

function env() {
  const goldBudget = new GoldBudgetLedger();
  const ressourcen = new RessourcenVerwalter();
  const socketBudget = new CharacterSocketBudget();
  const mutationsKanaele = new MutationsKanalKoordination(
    ressourcen,
    socketBudget,
  );
  const journal = new MemoryJournal();
  return {
    deps: {
      goldBudget,
      ressourcen,
      socketBudget,
      mutationsKanaele,
      journal,
    },
    goldBudget,
    ressourcen,
    socketBudget,
    journal,
  };
}

test("PR20.7 acquisition shadow reserves exact gold/resources and persists durable no-send intent", async () => {
  const e = env();
  const result = await new Pr207WeaponOffhandAcquisitionShadow().pruefe(
    request(),
    e.deps,
  );

  assert.equal(result.status, "SHADOW_BESTANDEN_KEIN_SEND");
  assert.equal(result.exactCost, 4800);
  assert.equal(result.safetyReserve, 1000);
  assert.equal(result.goldBudgetLedgerReservationSatisfied, true);
  assert.equal(result.inventoryFenceSatisfied, true);
  assert.equal(result.goldFenceSatisfied, true);
  assert.equal(result.buyChannelFenceSatisfied, true);
  assert.equal(result.socketBudgetFenceSatisfied, true);
  assert.equal(result.oneShotBindingPrepared, true);
  assert.equal(result.oneShotMaximumUses, 1);
  assert.equal(result.oneShotPurchaseAuthorityIssued, false);
  assert.equal(result.durableIntent, true);
  assert.equal(result.journalTerminalArt, "ABBRUCH");
  assert.equal(result.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(result.gameplayWrites, 0);
  assert.equal(result.publicFunctionCalls, 0);
  assert.equal(result.rawWriteCalls, 0);
  assert.equal(result.purchaseAuthority, false);
  assert.equal(result.gameplayAuthority, false);
  assert.equal(result.rawWriteAuthority, false);
  assert.equal(result.sameIntentRetry, false);
  assert.equal(result.normalRuntimeAllowed, false);
  assert.deepEqual(
    result.resourceClaims.map(x => x.ressourcenId).sort(),
    [
      "character:My_Merchant:gold",
      "character:My_Merchant:inventory",
    ],
  );
  assert.equal(
    result.actionChannelResourceId,
    "character:My_Merchant:action_channel:buy",
  );
  assert.equal(
    result.socketBudgetReservationId,
    "pr20-7-acq-shadow-tx-1:socket-budget",
  );

  assert.equal(e.journal.entries.length, 2);
  assert.equal(e.journal.entries[0].art, "INTENT");
  assert.equal(e.journal.entries[1].art, "ABBRUCH");
  const intent = e.journal.entries[0].inhalt;
  assert.equal(intent.action_contract_id, "AL-ACTION-BUY-WITH-GOLD");
  assert.equal(intent.recovery_contract_id, "AL-RECOVERY-BUY-WITH-GOLD");
  assert.equal(intent.verifier_id, "AL-VERIFIER-BUY-WITH-GOLD");
  assert.equal(intent.item_name, "wshield");
  assert.equal(intent.quantity, 1);
  assert.equal(intent.exact_cost, 4800);
  assert.equal(intent.safety_reserve, 1000);
  assert.equal(intent.send_boundary_state, "NICHT_GESENDET");
  assert.equal(intent.same_intent_retry, false);
  assert.equal(intent.one_shot_maximum_uses, 1);
  assert.equal(intent.one_shot_purchase_authority_issued, false);
  assert.equal(intent.purchase_authority, false);
  assert.equal(intent.resource_claims_and_fencing.length, 3);

  assert.equal(e.goldBudget.sicht().reserviert, 0);
  assert.equal(e.ressourcen.sicht().every(x => x.status === "FREI"), true);
  assert.equal(
    e.socketBudget.sicht("My_Merchant", 10_000).belegt,
    0,
  );
});

test("PR20.7 acquisition shadow rejects reserve below ratified minimum", async () => {
  const e = env();
  await assert.rejects(
    () => new Pr207WeaponOffhandAcquisitionShadow().pruefe(
      request({ safetyReserve: 999 }),
      e.deps,
    ),
    /PR20_7_ACQUISITION_SHADOW_GOLD_RESERVE_ZU_KLEIN/,
  );
  assert.equal(e.journal.entries.length, 0);
});

test("PR20.7 acquisition shadow rejects insufficient gold after reserve", async () => {
  const e = env();
  await assert.rejects(
    () => new Pr207WeaponOffhandAcquisitionShadow().pruefe(
      request({ observedGold: 5_799 }),
      e.deps,
    ),
    /GOLD_BUDGET_NICHT_VERFUEGBAR/,
  );
  assert.equal(e.journal.entries.length, 0);
});

test("PR20.7 acquisition shadow blocks occupied inventory/gold fence", async () => {
  const e = env();
  e.ressourcen.beanspruche(
    "other-flow",
    [{
      ressourcenId: "character:My_Merchant:inventory",
      art: "EXKLUSIV",
      leaseDauerMs: null,
    }],
    9_999,
  );

  await assert.rejects(
    () => new Pr207WeaponOffhandAcquisitionShadow().pruefe(
      request(),
      e.deps,
    ),
    /RESSOURCE_BELEGT:character:My_Merchant:inventory/,
  );
  assert.equal(e.journal.entries.length, 0);
  assert.equal(e.goldBudget.sicht().reserviert, 0);
});

test("PR20.7 acquisition shadow uses whole V5 plan budget for isolated no-send proof", async () => {
  const e = env();
  const competing = e.socketBudget.reserviere(
    "competing-budget",
    "other-flow",
    {
      schemaVersion: 1,
      characterId: "My_Merchant",
      kanalId: "other",
      actionKanalRessourcenId: "character:My_Merchant:action_channel:other",
      socketBudgetRessourcenId: "character:My_Merchant:socket_call_budget",
      geplanteGewichteteKosten: 1,
    },
    10_000,
  );
  assert.ok(competing);

  await assert.rejects(
    () => new Pr207WeaponOffhandAcquisitionShadow().pruefe(
      request(),
      e.deps,
    ),
    /SOCKET_BUDGET_PLANLIMIT_UEBERSCHRITTEN/,
  );
  assert.equal(e.journal.entries.length, 0);
  assert.equal(e.goldBudget.sicht().reserviert, 0);
  assert.equal(
    e.ressourcen.sicht().filter(x => x.eigentuemerAblaufId === request().ablaufId).length,
    0,
  );
});

test("PR20.7 acquisition shadow foundation contains no gameplay mutation path", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/equipment/pr20-7-weapon-offhand-acquisition-shadow.ts",
    "utf8",
  );
  for (const forbidden of [
    "buy_with_gold(",
    "buy(",
    "equip(",
    "unequip(",
    "sell(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "use_skill(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("GoldBudgetLedger"));
  assert.ok(source.includes("MutationsKanalKoordination"));
  assert.ok(source.includes("CharacterSocketBudget"));
  assert.ok(source.includes("PersistVorMutationTor"));
  assert.ok(source.includes("AL-ACTION-BUY-WITH-GOLD"));
  assert.ok(source.includes("NICHT_GESENDET"));
  assert.ok(source.includes("oneShotPurchaseAuthorityIssued: false"));
  assert.ok(source.includes("sameIntentRetry: false"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
