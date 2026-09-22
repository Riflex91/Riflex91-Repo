import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(fs.readFileSync("roadmap/pr20-2-bank-direct-ingame-function-evidence.json", "utf8"));
const roadmap = JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json", "utf8"));

test("direkte Bank-Ingame-Evidence ratifiziert Retrieve Store Swap jeweils 2/2", () => {
  for (const art of ["bank_retrieve", "bank_store", "bank_swap"]) {
    const row = evidence.firstMutationSet[art];
    assert.equal(row.status, "BESTANDEN");
    assert.equal(row.shadow.status, "BESTANDEN");
    assert.equal(row.shadow.gameplayWrites, 0);
    assert.equal(row.live.length, 2);
    assert.equal(row.functionalTestsConsumed, 2);
    assert.equal(row.additionalFunctionalTestAllowed, false);
    for (const live of row.live) {
      assert.equal(live.journalStatus, "COMMITTED");
      assert.equal(live.gameplayWrites, 1);
      assert.equal(live.publicFunctionAufrufe, 1);
      assert.equal(live.callFehler, null);
      assert.equal(live.sameIntentErneutSenden, false);
      assert.match(live.settlement, /_EXAKT_BESTAETIGT$/);
    }
  }
});

test("Withdraw bleibt fail-closed und open_bank_pack separat", () => {
  assert.equal(evidence.firstMutationSet.bank_withdraw.status, "NICHT_BESTANDEN_TESTLIMIT_ERREICHT");
  assert.equal(evidence.firstMutationSet.bank_withdraw.functionalTestsConsumed, 2);
  assert.equal(evidence.firstMutationSet.bank_withdraw.additionalFunctionalTestAllowed, false);
  assert.equal(
    evidence.deferred.open_bank_pack.status,
    "SHADOW_AND_ADMISSION_READ_ONLY_BESTANDEN_RESOURCE_BLOCKED_NO_LIVE",
  );
  assert.equal(evidence.deferred.open_bank_pack.safetyChecks, "BESTANDEN");
  assert.equal(evidence.deferred.open_bank_pack.functionalResult, "RESOURCE_BLOCKED_NO_LIVE");
  assert.equal(evidence.deferred.open_bank_pack.liveMutationFreigegeben, false);
  assert.equal(evidence.exitGate.pr20_2Complete, false);
  assert.equal(evidence.exitGate.productionWideActivationAllowed, false);
  assert.equal(roadmap.pr20_2.bankRetrieveStatus, "BESTANDEN_2_OF_2_DIRECT_INGAME");
  assert.equal(roadmap.pr20_2.bankStoreStatus, "BESTANDEN_2_OF_2_DIRECT_INGAME");
  assert.equal(roadmap.pr20_2.bankSwapStatus, "BESTANDEN_2_OF_2_DIRECT_INGAME");
});
