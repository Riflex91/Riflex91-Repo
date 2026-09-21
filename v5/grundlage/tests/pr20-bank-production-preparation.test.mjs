import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const prep = lies("grundlage/vertraege/runtime/bank-production-preparation.json");
const bindungen = lies("grundlage/vertraege/r9/action-bindungen.json");
const actionContracts = lies("wissensbasis/vertraege/action-contracts.json");
const produktionsKomposition = fs.readFileSync(
  "grundlage/quelle/runtime/produktions-komposition.ts",
  "utf8",
);

const erwartete = new Map([
  ["AL-ACTION-BANK-DEPOSIT", ["AL-RECOVERY-BANK-DEPOSIT", "AL-VERIFIER-BANK-DEPOSIT", "bank_deposit"]],
  ["AL-ACTION-BANK-WITHDRAW", ["AL-RECOVERY-BANK-WITHDRAW", "AL-VERIFIER-BANK-WITHDRAW", "bank_withdraw"]],
  ["AL-ACTION-BANK-STORE", ["AL-RECOVERY-BANK-STORE", "AL-VERIFIER-BANK-STORE", "bank_store"]],
  ["AL-ACTION-BANK-RETRIEVE", ["AL-RECOVERY-BANK-RETRIEVE", "AL-VERIFIER-BANK-RETRIEVE", "bank_retrieve"]],
  ["AL-ACTION-BANK-SWAP", ["AL-RECOVERY-BANK-SWAP", "AL-VERIFIER-BANK-SWAP", "bank_swap"]],
]);

test("PR20.2 Vorbereitung bleibt strikt NO-WRITE; PR20.1 ist als vorausgehendes Gate dokumentiert", () => {
  assert.equal(prep.schemaVersion, 1);
  assert.equal(prep.status, "REAL_BROWSER_SHADOW_BESTANDEN_WRITE_GATE_VORBEREITUNG");
  assert.equal(prep.blockingGate, "PR20.1_EQUIP_PRODUKTIONSNACHWEIS");
  assert.equal(prep.blockingGateStatus, "BESTANDEN");
  assert.equal(prep.authorityGrenze.produktiveRegistrierungErlaubt, true);
  assert.equal(prep.authorityGrenze.produktiverAktivierungspfadErlaubt, false);
  assert.equal(prep.authorityGrenze.oneShotAuthorityAusstellungImplementiert, true);
  assert.equal(prep.authorityGrenze.oneShotMaxVerwendungen, 1);
  assert.equal(prep.authorityGrenze.oneShotMaxLebensdauerMs, 2000);
  assert.equal(prep.authorityGrenze.gameplayAutoritaet, false);
  assert.equal(prep.authorityGrenze.rawWriteAutoritaet, false);
  assert.equal(prep.authorityGrenze.actionAuthority, false);
  assert.equal(prep.authorityGrenze.direkteAdventureLandPublicFunctionAufrufe, 0);
  assert.equal(prep.authorityGrenze.browserGameplayWrites, 0);
  assert.equal(prep.authorityGrenze.persistenteBankLeaseImplementiert, true);
  assert.equal(prep.authorityGrenze.restartReconciliationImplementiert, true);
  assert.equal(prep.authorityGrenze.r9AdmissionShadowImplementiert, true);
  assert.equal(prep.authorityGrenze.shadowGameplayWrites, 0);
  assert.equal(prep.authorityGrenze.restartRecoveryRealEvidence, "BESTANDEN");
  assert.equal(
    prep.authorityGrenze.restartRecoveryEvidencePfad,
    "roadmap/pr20-2-bank-shadow-recovery-evidence.json",
  );
  assert.equal(prep.authorityGrenze.realBrowserShadowLiveEvidence, "BESTANDEN");
  assert.equal(
    prep.authorityGrenze.realBrowserShadowEvidencePfad,
    "roadmap/pr20-2-bank-real-browser-shadow-evidence.json",
  );
  assert.equal(prep.bestehendePlanung.capabilityId, "merchant.bank.planen");
  assert.equal(prep.bestehendePlanung.mutationsAuthorityAusPlanung, false);
});


test("PR20.2 erster Live-Kandidat ist eng auf bank_deposit(1) begrenzt", () => {
  const kandidat = prep.ersterLiveKandidat;
  assert.ok(kandidat);
  assert.equal(kandidat.status, "REAL_BROWSER_SHADOW_BESTANDEN_WRITE_GATE_VORBEREITUNG");
  assert.equal(kandidat.publicFunction, "bank_deposit");
  assert.equal(kandidat.betragGold, 1);
  assert.equal(kandidat.actionContractId, "AL-ACTION-BANK-DEPOSIT");
  assert.equal(kandidat.recoveryContractId, "AL-RECOVERY-BANK-DEPOSIT");
  assert.equal(kandidat.verifierId, "AL-VERIFIER-BANK-DEPOSIT");
  assert.equal(kandidat.sameIntentRetry, false);
  assert.equal(kandidat.gameplayAutoritaet, false);
  assert.equal(kandidat.rawWriteAutoritaet, false);
  assert.equal(kandidat.provider, "merchant-bank-core@1");
  assert.equal(kandidat.capabilityId, "merchant.bank.gold_einlagern");
  assert.equal(kandidat.produktiveCapabilityNochNichtRegistriert, false);
  assert.equal(kandidat.oneShotAuthorityImplementiert, true);
  assert.equal(kandidat.currentFenceImplementiert, true);
  assert.equal(kandidat.readOnlyPreflightImplementiert, true);
  assert.equal(kandidat.persistentBankLease, true);
  assert.equal(kandidat.restartReconciliation, true);
  assert.equal(kandidat.r9AdmissionShadow, true);
  assert.equal(kandidat.shadowGameplayWrites, 0);
  assert.equal(kandidat.restartRecoveryRealEvidence, "BESTANDEN");
  assert.equal(
    kandidat.restartRecoveryEvidencePfad,
    "roadmap/pr20-2-bank-shadow-recovery-evidence.json",
  );
  assert.equal(kandidat.realBrowserShadowLiveEvidence, "BESTANDEN");
  assert.equal(
    kandidat.realBrowserShadowEvidencePfad,
    "roadmap/pr20-2-bank-real-browser-shadow-evidence.json",
  );
  assert.equal(kandidat.writeAdapterNochNichtVorhanden, true);
  assert.equal(kandidat.liveRunnerNochNichtVorhanden, true);
});

test("PR20.2 Kandidaten besitzen exakt vorhandene R9 Action/Recovery/Verifier-Bindungen", () => {
  assert.equal(prep.kandidaten.length, erwartete.size);
  const r9 = bindungen.bindungen ?? bindungen.actionBindungen ?? bindungen.actions ?? [];
  assert.ok(Array.isArray(r9) && r9.length > 0);

  for (const kandidat of prep.kandidaten) {
    const soll = erwartete.get(kandidat.actionContractId);
    assert.ok(soll, "unerwarteter Bankkandidat " + kandidat.actionContractId);
    const binding = r9.find(x => x.actionContractId === kandidat.actionContractId);
    assert.ok(binding, "R9-Bindung fehlt: " + kandidat.actionContractId);
    assert.deepEqual(
      [binding.recoveryContractId, binding.verifierId, binding.publicFunction],
      soll,
    );
    assert.deepEqual(
      [kandidat.recoveryContractId, kandidat.verifierId, kandidat.publicFunction],
      soll,
    );
  }
});

test("PR20.2 Kandidaten sind verifizierte non-idempotente Bankactions ohne Blind-Retry", () => {
  const contracts = actionContracts.contracts ?? [];
  for (const kandidat of prep.kandidaten) {
    const contract = contracts.find(x => x.id === kandidat.actionContractId);
    assert.ok(contract, "Action Contract fehlt: " + kandidat.actionContractId);
    assert.equal(contract.status, "VERIFIED_SOURCE_SNAPSHOT");
    assert.equal(contract.family, "bank");
    assert.equal(contract.idempotency, "NON_IDEMPOTENT");
    assert.equal(contract.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
    assert.equal(contract.client?.correlationChannel, "bank");
    assert.equal(contract.client?.requestId, false);
    assert.ok(contract.resourceDomains?.includes("account:bank_lease"));
    assert.ok(contract.resourceDomains?.includes("character:socket_call_budget"));
    assert.ok(contract.liveRevalidation?.includes("character"));
    assert.ok(contract.liveRevalidation?.includes("bank"));
    assert.ok(contract.dangerFlags?.includes("BANK_MOUNT_REQUIRED"));
    assert.ok(contract.dangerFlags?.includes("LIMITDC_AFTER_SEND_CAN_BE_UNKNOWN"));
  }
});

test("open_bank_pack bleibt wegen eigener Capacity-/Backend-Risiken bewusst ausserhalb des ersten Satzes", () => {
  assert.equal(
    prep.kandidaten.some(x => x.actionContractId === "AL-ACTION-OPEN-BANK-PACK"),
    false,
  );
  const deferred = prep.bewusstZurueckgestellt.find(
    x => x.actionContractId === "AL-ACTION-OPEN-BANK-PACK",
  );
  assert.ok(deferred);
  const contract = actionContracts.contracts.find(
    x => x.id === "AL-ACTION-OPEN-BANK-PACK",
  );
  assert.ok(contract);
  assert.ok(contract.dangerFlags.includes("ASYNC_BACKEND_TX"));
  assert.equal(contract.idempotency, "NON_IDEMPOTENT");
});

test("Produktionskomposition registriert nur den engen Deposit-Single-Owner default-off", () => {
  assert.ok(
    produktionsKomposition.includes(
      "merchantBankDepositMutationsFaehigkeitDefinition",
    ),
  );
  assert.ok(produktionsKomposition.includes("merchantBankCoreModulDefinition"));
  assert.equal(produktionsKomposition.includes("bank_withdraw"), false);
  assert.equal(produktionsKomposition.includes("bank_store"), false);
  assert.equal(produktionsKomposition.includes("bank_retrieve"), false);
  assert.equal(produktionsKomposition.includes("bank_swap"), false);
  assert.equal(produktionsKomposition.includes("open_bank_pack"), false);
  assert.equal(produktionsKomposition.includes("merchant.bank.mutieren"), false);
  assert.equal(produktionsKomposition.includes("bankMutations"), false);
});
