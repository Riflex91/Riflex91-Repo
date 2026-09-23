import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  klassifizierePr207GearSwapSettlement,
  pruefePr207GearSwapVorbereitung,
} from "../../erzeugt/index.js";

function bindung(overrides = {}) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "My_Ranger1",
    sessionId: "ranger-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    rosterFingerprint: "roster-fp",
    ...overrides,
  };
}

function item(id, overrides = {}) {
  return {
    name: id,
    level: 1,
    physischeKennung: "physical:" + id,
    beobachtungsFingerprint: "fp:" + id,
    physisch: true,
    gesperrt: false,
    virtuellB: false,
    ...overrides,
  };
}

function evidence(overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceId: "gear-swap-evidence-1",
    recipient: bindung(),
    merchantAccountId: "account-1",
    slot: "helmet",
    kandidatIndex: 12,
    kandidat: item("newhat"),
    vorherigesSlotItem: item("oldhat"),
    kompatibel: true,
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

function settlement(plan, overrides = {}) {
  return {
    schemaVersion: 1,
    recipient: plan.recipient,
    slot: plan.slot,
    kandidatIndex: plan.kandidatIndex,
    slotFingerprint: plan.expectedPostcondition.slotFingerprint,
    indexFingerprint: plan.expectedPostcondition.indexFingerprint,
    restInventarFingerprint: plan.expectedPostcondition.restInventarFingerprint,
    restEquipmentFingerprint: plan.expectedPostcondition.restEquipmentFingerprint,
    beobachtetAmMs: 1_500,
    ...overrides,
  };
}

test("PR20.7 bereitet belegten sicheren Armor-Slot nur als NO-WRITE Swap vor", () => {
  const result = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.equal(result.status, "BEREIT_NO_WRITE");
  assert.deepEqual(result.blocker, []);
  assert.ok(result.plan);
  assert.equal(result.plan.slot, "helmet");
  assert.equal(result.plan.expectedPostcondition.slotFingerprint, "fp:newhat");
  assert.equal(result.plan.expectedPostcondition.indexFingerprint, "fp:oldhat");
  assert.equal(
    result.plan.expectedPostcondition.serverSemantik,
    "ATOMIC_REPLACE_AND_RETURN_PREVIOUS_TO_SOURCE_INDEX",
  );
  assert.equal(result.plan.actionContractId, "AL-ACTION-EQUIP");
  assert.equal(result.plan.recoveryContractId, "AL-RECOVERY-EQUIP");
  assert.equal(result.plan.verifierId, "AL-VERIFIER-EQUIP");
  assert.equal(result.plan.ausfuehrungsAutoritaet, false);
  assert.equal(result.plan.gameplayAutoritaet, false);
  assert.equal(result.plan.rawWriteAutoritaet, false);
  assert.equal(result.plan.swapWriteRatification, false);
});

test("PR20.7 blockiert Waffen, Offhand, leere Slots und virtuelle Altobjekte", () => {
  const cases = [
    [evidence({ slot: "mainhand" }), "SLOT_NICHT_FREIGEGEBEN"],
    [evidence({ slot: "offhand" }), "SLOT_NICHT_FREIGEGEBEN"],
    [evidence({ vorherigesSlotItem: null }), "SLOT_IST_LEER"],
    [
      evidence({
        vorherigesSlotItem: item("oldhat", { physisch: false, virtuellB: true }),
      }),
      "ALTITEM_NICHT_PHYSISCH",
    ],
  ];
  for (const [input, blocker] of cases) {
    const result = pruefePr207GearSwapVorbereitung(input, 1_200);
    assert.equal(result.status, "BLOCKIERT");
    assert.equal(result.plan, null);
    assert.ok(result.blocker.includes(blocker));
    assert.equal(result.gameplayAutoritaet, false);
  }
});

test("PR20.7 blockiert stale oder unsichere Kandidaten vor jeder Ausfuehrungsplanung", () => {
  const cases = [
    [evidence({ gueltigBisMs: 1_100 }), "EVIDENCE_STALE"],
    [evidence({ kandidat: item("newhat", { gesperrt: true }) }), "KANDIDAT_GESPERRT"],
    [evidence({ vorherigesSlotItem: item("oldhat", { gesperrt: true }) }), "ALTITEM_GESPERRT"],
    [evidence({ vorherigesSlotItem: item("oldhat", { beobachtungsFingerprint: "fp:newhat" }) }), "IDENTITAET_NICHT_EINDEUTIG"],
    [evidence({ kompatibel: false }), "NICHT_KOMPATIBEL"],
    [evidence({ contentVerifiziert: false }), "CONTENT_NICHT_VERIFIZIERT"],
    [evidence({ dispositionErlaubt: false }), "DISPOSITION_GESPERRT"],
    [
      evidence({ recipient: bindung({ accountId: "other-account" }) }),
      "ACCOUNT_DRIFT",
    ],
  ];
  for (const [input, blocker] of cases) {
    const result = pruefePr207GearSwapVorbereitung(input, 1_200);
    assert.equal(result.status, "BLOCKIERT");
    assert.ok(result.blocker.includes(blocker));
    assert.equal(result.ausfuehrungsAutoritaet, false);
  }
});

test("PR20.7 Settlement bestaetigt nur den exakten Zwei-Ort-Swap", () => {
  const prep = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.ok(prep.plan);
  const result = klassifizierePr207GearSwapSettlement(
    prep.plan,
    settlement(prep.plan),
  );
  assert.equal(result.klassifikation, "BESTAETIGT");
  assert.equal(result.sameIntentRetry, false);
  assert.equal(result.neuerIntentAutomatischErlaubt, false);
  assert.deepEqual(result.gruende, []);
});

test("PR20.7 Settlement erkennt unveraenderten Prestate als NICHT_AUSGEFUEHRT", () => {
  const prep = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.ok(prep.plan);
  const result = klassifizierePr207GearSwapSettlement(
    prep.plan,
    settlement(prep.plan, {
      slotFingerprint: prep.plan.prestate.slotFingerprint,
      indexFingerprint: prep.plan.prestate.indexFingerprint,
    }),
  );
  assert.equal(result.klassifikation, "NICHT_AUSGEFUEHRT");
  assert.equal(result.sameIntentRetry, false);
  assert.equal(result.neuerIntentAutomatischErlaubt, false);
});

test("PR20.7 Settlement klassifiziert einseitigen Swap nur als TEILWEISE", () => {
  const prep = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.ok(prep.plan);
  const result = klassifizierePr207GearSwapSettlement(
    prep.plan,
    settlement(prep.plan, {
      indexFingerprint: prep.plan.prestate.indexFingerprint,
    }),
  );
  assert.equal(result.klassifikation, "TEILWEISE");
  assert.ok(result.gruende.includes("NUR_TEILMENGE_DER_SWAP_POSTCONDITION"));
  assert.equal(result.sameIntentRetry, false);
});

test("PR20.7 Settlement bleibt bei Recipient- oder Restzustandsdrift UNGEKLAERT", () => {
  const prep = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.ok(prep.plan);
  const result = klassifizierePr207GearSwapSettlement(
    prep.plan,
    settlement(prep.plan, {
      recipient: bindung({ sessionId: "other-session" }),
      restInventarFingerprint: "drifted-rest",
    }),
  );
  assert.equal(result.klassifikation, "UNGEKLAERT");
  assert.ok(result.gruende.includes("RECIPIENT_BINDUNG_DRIFT"));
  assert.ok(result.gruende.includes("REST_INVENTAR_DRIFT"));
  assert.equal(result.sameIntentRetry, false);
  assert.equal(result.neuerIntentAutomatischErlaubt, false);
});

test("PR20.7 Foundation enthaelt keinerlei Gameplay- oder Raw-Write-Pfad", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/equipment/pr20-7-gear-swap-vorbereitung.ts",
    "utf8",
  );
  for (const forbidden of [
    "root.equip(",
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
  assert.ok(source.includes("swapWriteRatification: false"));
});


test("PR20.7 maschinenlesbarer Vertrag bleibt NO-WRITE und trennt Waffen/Offhand", () => {
  const contract = JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr20-7-gear-production-preparation.json",
    "utf8",
  ));
  assert.equal(contract.status, "READ_ONLY_BROWSER_PREFLIGHT_IMPLEMENTIERT_NO_WRITE");
  assert.equal(contract.basis.actionContractId, "AL-ACTION-EQUIP");
  assert.equal(contract.basis.recoveryContractId, "AL-RECOVERY-EQUIP");
  assert.equal(contract.basis.verifierId, "AL-VERIFIER-EQUIP");
  assert.equal(
    contract.serverSemantik.settlement,
    "ATOMIC_REPLACE_AND_RETURN_PREVIOUS_TO_SOURCE_INDEX",
  );
  assert.equal(contract.serverSemantik.virtualExistingB, "BLOCKED_FOR_PR20_7");
  assert.equal(contract.scope.mainhand, "SEPARATE_GATE");
  assert.equal(contract.scope.offhand, "SEPARATE_GATE");
  assert.equal(contract.authority.produktiveRegistrierungErlaubt, false);
  assert.equal(contract.authority.produktiverAktivierungspfadErlaubt, false);
  assert.equal(contract.authority.ausfuehrungsAutoritaet, false);
  assert.equal(contract.authority.gameplayAutoritaet, false);
  assert.equal(contract.authority.rawWriteAutoritaet, false);
  assert.equal(contract.authority.swapWriteRatification, false);
  assert.equal(contract.settlement.sameIntentRetry, false);
  assert.equal(contract.settlement.newIntentAutomaticallyAllowed, false);
  assert.equal(contract.preflight.implemented, true);
  assert.equal(contract.preflight.readOnly, true);
  assert.equal(contract.preflight.performanceTrickRequiredAndVerified, true);
  assert.equal(contract.preflight.authorityAusstellung, false);
  assert.equal(contract.preflight.browserGameplayWrites, 0);
  assert.equal(contract.nextGate.weaponsAndOffhandRemainSeparate, true);
});
