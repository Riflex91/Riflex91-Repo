import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  klassifizierePr207WeaponOffhandSettlement,
  pruefePr207WeaponOffhandVorbereitung,
} from "../../erzeugt/index.js";

function bindung(overrides = {}) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "My_Merchant",
    sessionId: "merchant-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 21,
    rosterFingerprint: "roster-21",
    ...overrides,
  };
}

function item(name, {
  type = "weapon",
  wtype = "staff",
  level = 0,
  requiredLevel = 0,
  classList = [],
  fingerprint = "fp:" + name,
  ...overrides
} = {}) {
  return {
    name,
    level,
    type,
    wtype,
    classList,
    requiredLevel,
    physischeKennung: "physical:" + name + ":" + fingerprint,
    beobachtungsFingerprint: fingerprint,
    physisch: true,
    gesperrt: false,
    virtuellB: false,
    ...overrides,
  };
}

const merchantRules = Object.freeze({
  ctype: "merchant",
  mainhandWtypes: Object.freeze([
    "mace","staff","bow","spear","short_sword","fist","dartgun","dagger",
  ]),
  doublehandWtypes: Object.freeze(["rod","pickaxe","axe","basher"]),
  offhandKinds: Object.freeze(["shield","source","quiver","misc_offhand"]),
});

function evidence(overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceId: "weapon-evidence-1",
    recipient: bindung(),
    merchantAccountId: "account-1",
    recipientCtype: "merchant",
    recipientLevel: 58,
    slot: "mainhand",
    kandidatIndex: 4,
    kandidat: item("blade2", { wtype: "short_sword", fingerprint: "candidate-fp" }),
    vorherigesSlotItem: item("staff", { wtype: "staff", fingerprint: "previous-fp" }),
    gegenhandItem: item("source1", {
      type: "source", wtype: "", fingerprint: "other-fp",
    }),
    klassenRegeln: merchantRules,
    contentVerifiziert: true,
    dispositionErlaubt: true,
    beobachtetAmMs: 1_000,
    gueltigBisMs: 2_000,
    maximalesEvidenceAlterMs: 1_000,
    restInventarFingerprint: "rest-inventory",
    restEquipmentFingerprint: "rest-equipment",
    ...overrides,
  };
}

test("PR20.7 weapon mainhand admits explicit one-hand swap and pins opposite hand", () => {
  const result = pruefePr207WeaponOffhandVorbereitung(evidence(), 1_100);
  assert.equal(result.status, "BEREIT_NO_WRITE");
  assert.deepEqual(result.blocker, []);
  assert.ok(result.plan);
  assert.equal(result.plan.slot, "mainhand");
  assert.equal(result.plan.kandidatIstDoublehand, false);
  assert.equal(result.plan.prestate.gegenhandFingerprint, "other-fp");
  assert.equal(result.plan.expectedPostcondition.gegenhandFingerprint, "other-fp");
  assert.equal(
    result.plan.expectedPostcondition.serverSemantik,
    "EXPLICIT_SLOT_ATOMIC_REPLACE",
  );
  assert.equal(result.plan.ausfuehrungsAutoritaet, false);
  assert.equal(result.plan.gameplayAutoritaet, false);
  assert.equal(result.plan.rawWriteAutoritaet, false);
  assert.equal(result.plan.weaponOffhandWriteRatification, false);
});

test("PR20.7 doublehand is allowed only with empty offhand", () => {
  const blocked = pruefePr207WeaponOffhandVorbereitung(evidence({
    kandidat: item("rod", { wtype: "rod", fingerprint: "rod-fp" }),
  }), 1_100);
  assert.equal(blocked.status, "BLOCKIERT");
  assert.ok(blocked.blocker.includes("DOUBLEHAND_OFFHAND_BELEGT"));

  const allowed = pruefePr207WeaponOffhandVorbereitung(evidence({
    kandidat: item("rod", { wtype: "rod", fingerprint: "rod-fp" }),
    gegenhandItem: null,
  }), 1_100);
  assert.equal(allowed.status, "BEREIT_NO_WRITE");
  assert.equal(allowed.plan.kandidatIstDoublehand, true);
});

test("PR20.7 offhand type requires class support and rejects doublehand opposite", () => {
  const allowed = pruefePr207WeaponOffhandVorbereitung(evidence({
    slot: "offhand",
    kandidatIndex: 9,
    kandidat: item("source2", {
      type: "source", wtype: "", fingerprint: "source-candidate",
    }),
    vorherigesSlotItem: item("source1", {
      type: "source", wtype: "", fingerprint: "source-old",
    }),
    gegenhandItem: item("staff", {
      type: "weapon", wtype: "staff", fingerprint: "staff-main",
    }),
  }), 1_100);
  assert.equal(allowed.status, "BEREIT_NO_WRITE");
  assert.equal(allowed.plan.slot, "offhand");
  assert.equal(allowed.plan.prestate.gegenhandFingerprint, "staff-main");

  const blocked = pruefePr207WeaponOffhandVorbereitung(evidence({
    slot: "offhand",
    kandidat: item("source2", {
      type: "source", wtype: "", fingerprint: "source-candidate",
    }),
    vorherigesSlotItem: item("source1", {
      type: "source", wtype: "", fingerprint: "source-old",
    }),
    gegenhandItem: item("rod", {
      type: "weapon", wtype: "rod", fingerprint: "rod-main",
    }),
  }), 1_100);
  assert.equal(blocked.status, "BLOCKIERT");
  assert.ok(blocked.blocker.includes("OFFHAND_GEGENSEITE_DOUBLEHAND"));
});

test("PR20.7 offhand supports an empty target with exact null-index postcondition", () => {
  const prepared = pruefePr207WeaponOffhandVorbereitung(evidence({
    slot: "offhand",
    kandidatIndex: 9,
    kandidat: item("source2", {
      type: "source", wtype: "", fingerprint: "source-candidate",
    }),
    vorherigesSlotItem: null,
    gegenhandItem: item("staff", {
      type: "weapon", wtype: "staff", fingerprint: "staff-main",
    }),
  }), 1_100);
  assert.equal(prepared.status, "BEREIT_NO_WRITE");
  assert.equal(prepared.plan.prestate.slotFingerprint, null);
  assert.equal(prepared.plan.expectedPostcondition.indexFingerprint, null);

  const settlement = klassifizierePr207WeaponOffhandSettlement(
    prepared.plan,
    {
      schemaVersion: 1,
      recipient: bindung(),
      slot: "offhand",
      kandidatIndex: 9,
      slotFingerprint: "source-candidate",
      indexFingerprint: null,
      gegenhandFingerprint: "staff-main",
      restInventarFingerprint: "rest-inventory",
      restEquipmentFingerprint: "rest-equipment",
      beobachtetAmMs: 1_200,
    },
  );
  assert.equal(settlement.klassifikation, "BESTAETIGT");
  assert.equal(settlement.sameIntentRetry, false);
});

test("PR20.7 weapon admission fails closed on class, level, slot or wtype mismatch", () => {
  const cases = [
    evidence({
      kandidat: item("restricted", {
        wtype: "staff", classList: ["mage"], fingerprint: "restricted",
      }),
    }),
    evidence({
      kandidat: item("high", {
        wtype: "staff", requiredLevel: 99, fingerprint: "high",
      }),
    }),
    evidence({
      kandidat: item("sword", {
        wtype: "great_sword", fingerprint: "bad-wtype",
      }),
    }),
    evidence({ slot: "weapon" }),
  ];
  for (const row of cases) {
    const result = pruefePr207WeaponOffhandVorbereitung(row, 1_100);
    assert.equal(result.status, "BLOCKIERT");
    assert.equal(result.plan, null);
  }
});

test("PR20.7 weapon settlement requires slot, index, opposite hand and rest state", () => {
  const prepared = pruefePr207WeaponOffhandVorbereitung(evidence(), 1_100);
  assert.ok(prepared.plan);
  const base = {
    schemaVersion: 1,
    recipient: bindung(),
    slot: "mainhand",
    kandidatIndex: 4,
    slotFingerprint: "candidate-fp",
    indexFingerprint: "previous-fp",
    gegenhandFingerprint: "other-fp",
    restInventarFingerprint: "rest-inventory",
    restEquipmentFingerprint: "rest-equipment",
    beobachtetAmMs: 1_200,
  };
  assert.equal(
    klassifizierePr207WeaponOffhandSettlement(prepared.plan, base)
      .klassifikation,
    "BESTAETIGT",
  );
  assert.equal(
    klassifizierePr207WeaponOffhandSettlement(prepared.plan, {
      ...base,
      slotFingerprint: "previous-fp",
      indexFingerprint: "candidate-fp",
    }).klassifikation,
    "NICHT_AUSGEFUEHRT",
  );
  assert.equal(
    klassifizierePr207WeaponOffhandSettlement(prepared.plan, {
      ...base,
      gegenhandFingerprint: "drift",
    }).klassifikation,
    "UNGEKLAERT",
  );
});

test("PR20.7 weapon/offhand foundation has no gameplay write path", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/equipment/pr20-7-weapon-offhand-vorbereitung.ts",
    "utf8",
  );
  for (const forbidden of [
    ".equip(",
    "unequip(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "use_skill(",
    "send_item(",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
  assert.ok(source.includes("ausfuehrungsAutoritaet: false"));
  assert.ok(source.includes("gameplayAutoritaet: false"));
  assert.ok(source.includes("rawWriteAutoritaet: false"));
  assert.ok(source.includes("weaponOffhandWriteRatification: false"));
});
