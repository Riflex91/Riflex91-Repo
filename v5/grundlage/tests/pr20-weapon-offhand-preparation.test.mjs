import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  pruefePr207WeaponVorbereitung,
} from "../../erzeugt/index.js";

function bindung(overrides = {}) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "My_Ranger1",
    sessionId: "ranger-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 21,
    rosterFingerprint: "roster-fp-21",
    ...overrides,
  };
}

function item(name, wtype, overrides = {}) {
  return {
    name,
    level: 2,
    type: "weapon",
    wtype,
    physischeKennung: "physical:" + name,
    beobachtungsFingerprint: "fp:" + name,
    physisch: true,
    gesperrt: false,
    virtuellB: false,
    ...overrides,
  };
}

function evidence(overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceId: "weapon-evidence-1",
    recipient: bindung(),
    merchantAccountId: "account-1",
    requestedSlot: "mainhand",
    kandidatIndex: 4,
    kandidat: item("bow-new", "bow"),
    slots: {
      mainhand: item("bow-old", "bow"),
      offhand: null,
    },
    klasse: {
      ctype: "ranger",
      mainhandWtypes: ["bow"],
      offhandWtypes: ["dagger"],
      doublehandWtypes: [],
      sourceFingerprint: "class-source-fp",
      verifiziert: true,
    },
    contentVerifiziert: true,
    dispositionErlaubt: true,
    beobachtetAmMs: 1_000,
    gueltigBisMs: 2_000,
    maximalesEvidenceAlterMs: 1_000,
    restInventarFingerprint: "rest-inv",
    restEquipmentFingerprint: "rest-equip",
    evidenceFingerprint: "evidence-fp",
    ...overrides,
  };
}

test("PR20.7 Weapon Foundation akzeptiert nur explizite Mainhand-Zuordnung", () => {
  const result = pruefePr207WeaponVorbereitung(evidence(), 1_200);
  assert.equal(result.status, "BEREIT_NO_WRITE");
  assert.ok(result.plan);
  assert.equal(result.plan.slot, "mainhand");
  assert.equal(result.plan.expliziteSlotAufloesung, true);
  assert.equal(result.plan.serverCanEquipAutoWeaponSlotVerboten, true);
  assert.equal(result.plan.offhandLeerErforderlich, false);
  assert.equal(result.plan.actionContractId, "AL-ACTION-EQUIP");
  assert.equal(result.plan.gameplayAutoritaet, false);
  assert.equal(result.plan.rawWriteAutoritaet, false);
  assert.equal(result.plan.weaponWriteRatification, false);
});

test("PR20.7 Weapon Foundation verbietet auto weapon routing", () => {
  const result = pruefePr207WeaponVorbereitung(
    evidence({ requestedSlot: "weapon" }),
    1_200,
  );
  assert.equal(result.status, "BLOCKIERT");
  assert.equal(result.plan, null);
  assert.ok(result.blocker.includes("SLOT_NICHT_EXPLIZIT"));
});

test("PR20.7 Doublehand verlangt gepinnte leere Offhand", () => {
  const double = evidence({
    kandidat: item("greatstaff", "great_staff"),
    klasse: {
      ctype: "mage",
      mainhandWtypes: ["staff"],
      offhandWtypes: ["source"],
      doublehandWtypes: ["great_staff"],
      sourceFingerprint: "mage-class-fp",
      verifiziert: true,
    },
    slots: {
      mainhand: item("staff-old", "staff"),
      offhand: null,
    },
  });
  const ready = pruefePr207WeaponVorbereitung(double, 1_200);
  assert.equal(ready.status, "BEREIT_NO_WRITE");
  assert.ok(ready.plan);
  assert.equal(ready.plan.offhandLeerErforderlich, true);

  const blocked = pruefePr207WeaponVorbereitung({
    ...double,
    slots: {
      ...double.slots,
      offhand: item("source-old", "source", { type: "source" }),
    },
  }, 1_200);
  assert.equal(blocked.status, "BLOCKIERT");
  assert.ok(blocked.blocker.includes("DOUBLEHAND_OFFHAND_BELEGT"));
});

test("PR20.7 Offhand blockiert neben Doublehand-Mainhand", () => {
  const result = pruefePr207WeaponVorbereitung(evidence({
    requestedSlot: "offhand",
    kandidat: item("dagger-new", "dagger"),
    slots: {
      mainhand: item("greatstaff", "great_staff"),
      offhand: item("dagger-old", "dagger"),
    },
    klasse: {
      ctype: "mage",
      mainhandWtypes: ["staff"],
      offhandWtypes: ["dagger"],
      doublehandWtypes: ["great_staff"],
      sourceFingerprint: "mage-class-fp",
      verifiziert: true,
    },
  }), 1_200);
  assert.equal(result.status, "BLOCKIERT");
  assert.ok(result.blocker.includes("OFFHAND_NEBEN_DOUBLEHAND_VERBOTEN"));
});

test("PR20.7 Offhand akzeptiert nur class-erlaubten Wtype neben gueltiger Mainhand", () => {
  const allowed = pruefePr207WeaponVorbereitung(evidence({
    requestedSlot: "offhand",
    kandidat: item("dagger-new", "dagger"),
    slots: {
      mainhand: item("sword-old", "sword"),
      offhand: item("dagger-old", "dagger"),
    },
    klasse: {
      ctype: "warrior",
      mainhandWtypes: ["sword"],
      offhandWtypes: ["dagger"],
      doublehandWtypes: ["great_sword"],
      sourceFingerprint: "warrior-class-fp",
      verifiziert: true,
    },
  }), 1_200);
  assert.equal(allowed.status, "BEREIT_NO_WRITE");
  assert.equal(allowed.plan.slot, "offhand");

  const denied = pruefePr207WeaponVorbereitung(evidence({
    requestedSlot: "offhand",
    kandidat: item("wand-new", "wand"),
    slots: {
      mainhand: item("sword-old", "sword"),
      offhand: item("dagger-old", "dagger"),
    },
    klasse: {
      ctype: "warrior",
      mainhandWtypes: ["sword"],
      offhandWtypes: ["dagger"],
      doublehandWtypes: ["great_sword"],
      sourceFingerprint: "warrior-class-fp",
      verifiziert: true,
    },
  }), 1_200);
  assert.equal(denied.status, "BLOCKIERT");
  assert.ok(denied.blocker.includes("OFFHAND_WTYPE_NICHT_ERLAUBT"));
});

test("PR20.7 Weapon Foundation blockiert stale, virtuelle, locked und unverifizierte Evidence", () => {
  const cases = [
    [evidence({ gueltigBisMs: 1_100 }), "EVIDENCE_STALE"],
    [evidence({ kandidat: item("x", "bow", { gesperrt: true }) }), "KANDIDAT_GESPERRT"],
    [evidence({ kandidat: item("x", "bow", { virtuellB: true }) }), "KANDIDAT_VIRTUELL"],
    [evidence({ klasse: { ...evidence().klasse, verifiziert: false } }), "KLASSE_NICHT_VERIFIZIERT"],
    [evidence({ contentVerifiziert: false }), "CONTENT_NICHT_VERIFIZIERT"],
    [evidence({ dispositionErlaubt: false }), "DISPOSITION_GESPERRT"],
  ];
  for (const [input, blocker] of cases) {
    const result = pruefePr207WeaponVorbereitung(input, 1_200);
    assert.equal(result.status, "BLOCKIERT");
    assert.ok(result.blocker.includes(blocker));
  }
});

test("PR20.7 Weapon Foundation enthaelt keinen Gameplay- oder Raw-Write-Pfad", () => {
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
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("gameplayAutoritaet: false"));
  assert.ok(source.includes("rawWriteAutoritaet: false"));
  assert.ok(source.includes("weaponWriteRatification: false"));
});
