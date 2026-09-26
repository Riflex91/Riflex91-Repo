import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";

import {
  GearAllokationsLedger,
  planeUndReserviereGearProgression,
} from "../../erzeugt/index.js";

function bindung(characterId, sessionId = "session-1") {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId,
    sessionId,
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    rosterFingerprint: "roster-fp",
  };
}

function evidence(id, overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceId: id,
    recipient: bindung("warrior", "warrior-session"),
    slot: "ring1",
    prioritaet: "FARMER",
    aktuellerScore: 100,
    minimaleVerbesserung: 5,
    kandidat: {
      physischeKennung: "merchant:" + id,
      name: "ringofluck",
      level: 1,
      score: 120,
      beobachtungsFingerprint: "item-fp-" + id,
    },
    zielAktuell: true,
    kompatibel: true,
    contentVerifiziert: true,
    physischVerfuegbar: true,
    dispositionErlaubt: true,
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    evidenceFingerprint: "evidence-fp-" + id,
    ...overrides,
  };
}

function anfrage(evidenzen, overrides = {}) {
  return {
    merchantAccountId: "account-1",
    evidenzen,
    richtlinie: {
      richtlinienVersion: "gear-v1",
      maximalesEvidenceAlterMs: 1_000,
      maximaleNeueZiele: 8,
      farmerVorMerchantSelf: true,
    },
    ...overrides,
  };
}

test("Gear Progression priorisiert Farmer vor Merchant-Self auch bei groesserem Merchant-Score", () => {
  const ledger = new GearAllokationsLedger();
  const plan = planeUndReserviereGearProgression(
    anfrage([
      evidence("merchant-self", {
        recipient: bindung("merchant", "merchant-session"),
        prioritaet: "MERCHANT_SELF",
        kandidat: {
          physischeKennung: "merchant:item-self",
          name: "speedcape",
          level: 0,
          score: 500,
          beobachtungsFingerprint: "self-fp",
        },
      }),
      evidence("farmer", {
        recipient: bindung("warrior", "warrior-session"),
        prioritaet: "FARMER",
        kandidat: {
          physischeKennung: "merchant:item-farmer",
          name: "ringofluck",
          level: 1,
          score: 120,
          beobachtungsFingerprint: "farmer-fp",
        },
      }),
    ], {
      richtlinie: {
        richtlinienVersion: "gear-v1",
        maximalesEvidenceAlterMs: 1_000,
        maximaleNeueZiele: 1,
        farmerVorMerchantSelf: true,
      },
    }),
    ledger,
    200,
  );

  assert.equal(plan.neueZiele.length, 1);
  assert.equal(plan.neueZiele[0].ziel.prioritaet, "FARMER");
  assert.equal(plan.neueZiele[0].ziel.kandidat.name, "ringofluck");
  assert.equal(plan.farmerVorMerchantSelf, true);
  assert.equal(plan.ausfuehrungsAutoritaet, false);
  assert.equal(plan.gameplayAutoritaet, false);
  assert.equal(plan.rawWriteAutoritaet, false);
});

test("derselbe physische Kandidat wird autonom nur einem Ziel zugeordnet", () => {
  const ledger = new GearAllokationsLedger();
  const shared = "merchant:slot5:shared-item";
  const plan = planeUndReserviereGearProgression(
    anfrage([
      evidence("farmer-a", {
        recipient: bindung("warrior", "warrior-session"),
        slot: "ring1",
        kandidat: {
          physischeKennung: shared,
          name: "ringofluck",
          level: 1,
          score: 130,
          beobachtungsFingerprint: "shared-fp",
        },
      }),
      evidence("farmer-b", {
        recipient: bindung("ranger", "ranger-session"),
        slot: "ring1",
        kandidat: {
          physischeKennung: shared,
          name: "ringofluck",
          level: 1,
          score: 125,
          beobachtungsFingerprint: "shared-fp",
        },
      }),
    ]),
    ledger,
    200,
  );

  assert.equal(plan.neueZiele.length, 1);
  assert.equal(plan.neueZiele[0].ziel.recipient.characterId, "warrior");
  assert.ok(plan.abgelehnt.some(
    x => x.evidenceId === "farmer-b"
      && x.grund === "KANDIDAT_BEREITS_RESERVIERT",
  ));
});

test("ein Recipient-Slot erhaelt hoechstens ein aktives Gear-Ziel", () => {
  const ledger = new GearAllokationsLedger();
  const plan = planeUndReserviereGearProgression(
    anfrage([
      evidence("weak", {
        kandidat: {
          physischeKennung: "merchant:weak",
          name: "ringofluck",
          level: 1,
          score: 115,
          beobachtungsFingerprint: "weak-fp",
        },
      }),
      evidence("strong", {
        kandidat: {
          physischeKennung: "merchant:strong",
          name: "ringofluck",
          level: 2,
          score: 140,
          beobachtungsFingerprint: "strong-fp",
        },
      }),
    ]),
    ledger,
    200,
  );

  assert.equal(plan.neueZiele.length, 1);
  assert.equal(plan.neueZiele[0].ziel.kandidat.physischeKennung, "merchant:strong");
  assert.ok(plan.abgelehnt.some(
    x => x.evidenceId === "weak"
      && x.grund === "RECIPIENT_SLOT_BEREITS_BELEGT",
  ));
});

test("stale, unbekannte, inkompatible oder gesperrte Evidence erzeugt kein Gear-Ziel", () => {
  const ledger = new GearAllokationsLedger();
  const plan = planeUndReserviereGearProgression(
    anfrage([
      evidence("stale", {
        beobachtetAmMs: 0,
        gueltigBisMs: 500,
      }),
      evidence("unknown", {
        contentVerifiziert: false,
      }),
      evidence("incompatible", {
        kompatibel: false,
      }),
      evidence("unavailable", {
        physischVerfuegbar: false,
      }),
      evidence("disposition", {
        dispositionErlaubt: false,
      }),
      evidence("small", {
        kandidat: {
          physischeKennung: "merchant:small",
          name: "ringofluck",
          level: 1,
          score: 103,
          beobachtungsFingerprint: "small-fp",
        },
      }),
    ], {
      richtlinie: {
        richtlinienVersion: "gear-v1",
        maximalesEvidenceAlterMs: 100,
        maximaleNeueZiele: 8,
        farmerVorMerchantSelf: true,
      },
    }),
    ledger,
    200,
  );

  assert.equal(plan.neueZiele.length, 0);
  assert.deepEqual(
    [...plan.abgelehnt.map(x => x.grund)].sort(),
    [
      "EVIDENCE_STALE",
      "CONTENT_NICHT_VERIFIZIERT",
      "NICHT_KOMPATIBEL",
      "PHYSISCH_NICHT_VERFUEGBAR",
      "DISPOSITION_GESPERRT",
      "VERBESSERUNG_ZU_KLEIN",
    ].sort(),
  );
});

test("Account- oder Ziel-Drift wird fail-closed abgelehnt", () => {
  const ledger = new GearAllokationsLedger();
  const plan = planeUndReserviereGearProgression(
    anfrage([
      evidence("wrong-account", {
        recipient: {
          ...bindung("warrior", "warrior-session"),
          accountId: "other-account",
        },
      }),
      evidence("stale-target", {
        recipient: bindung("ranger", "ranger-session"),
        zielAktuell: false,
      }),
    ]),
    ledger,
    200,
  );

  assert.equal(plan.neueZiele.length, 0);
  assert.ok(plan.abgelehnt.some(
    x => x.evidenceId === "wrong-account"
      && x.grund === "ACCOUNT_DRIFT",
  ));
  assert.ok(plan.abgelehnt.some(
    x => x.evidenceId === "stale-target"
      && x.grund === "ZIEL_NICHT_AKTUELL",
  ));
});

test("bestehende aktive Reservierung blockiert doppelte Gear-Allokation", () => {
  const ledger = new GearAllokationsLedger();
  planeUndReserviereGearProgression(
    anfrage([evidence("first")]),
    ledger,
    200,
  );

  const second = planeUndReserviereGearProgression(
    anfrage([evidence("second", {
      kandidat: {
        physischeKennung: "merchant:first",
        name: "ringofluck",
        level: 1,
        score: 130,
        beobachtungsFingerprint: "second-fp",
      },
      recipient: bindung("ranger", "ranger-session"),
    })]),
    ledger,
    250,
  );

  assert.equal(second.neueZiele.length, 0);
  assert.deepEqual(second.abgelehnt, [{
    evidenceId: "second",
    grund: "KANDIDAT_BEREITS_RESERVIERT",
  }]);
});

test("abgelaufene Reservierung wird freigegeben und pinnt Kandidaten nicht dauerhaft", () => {
  const ledger = new GearAllokationsLedger();
  const first = planeUndReserviereGearProgression(
    anfrage([evidence("old", {
      gueltigBisMs: 250,
    })]),
    ledger,
    200,
  );
  assert.equal(first.neueZiele.length, 1);

  const second = planeUndReserviereGearProgression(
    anfrage([evidence("new", {
      recipient: bindung("ranger", "ranger-session"),
      kandidat: {
        physischeKennung: "merchant:old",
        name: "ringofluck",
        level: 1,
        score: 130,
        beobachtungsFingerprint: "new-fp",
      },
      beobachtetAmMs: 300,
      gueltigBisMs: 800,
    })]),
    ledger,
    300,
  );

  assert.equal(second.abgelaufeneReservierungen.length, 1);
  assert.equal(second.abgelaufeneReservierungen[0].status, "ABGEBROCHEN");
  assert.equal(second.neueZiele.length, 1);
  assert.equal(second.neueZiele[0].ziel.recipient.characterId, "ranger");
});

test("priorisierteOffene bereinigt abgelaufene Ziele ebenfalls fail-safe", () => {
  const ledger = new GearAllokationsLedger();
  planeUndReserviereGearProgression(
    anfrage([evidence("expire", {
      gueltigBisMs: 250,
    })]),
    ledger,
    200,
  );

  assert.equal(ledger.priorisierteOffene(300).length, 0);
  assert.equal(ledger.snapshot()[0].status, "ABGEBROCHEN");
});


function gitBlobSha(text) {
  const body = Buffer.from(text, "utf8");
  return createHash("sha1")
    .update(Buffer.from(`blob ${body.length}\0`, "utf8"))
    .update(body)
    .digest("hex");
}

test("PR20.7 Farmer-Gear-Allocation ist als NO-WRITE Foundation ratifiziert", () => {
  const ratification = JSON.parse(fs.readFileSync(
    "roadmap/pr20-7-farmer-gear-allocation-ratification.json",
    "utf8",
  ));
  const roadmap = JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  const allocationSource = fs.readFileSync(
    "grundlage/quelle/merchant/gear-allokation.ts",
    "utf8",
  );
  const progressionSource = fs.readFileSync(
    "grundlage/quelle/merchant/gear-progression.ts",
    "utf8",
  );

  assert.equal(ratification.gate, "PR20.7_GEAR");
  assert.equal(ratification.status, "BESTANDEN_NO_WRITE_FOUNDATION_RATIFIED");
  assert.equal(ratification.sourceMainCommit,
    "e5430a06e2088a03a6797b628a9526ce6b18a407");
  assert.equal(
    gitBlobSha(allocationSource),
    ratification.sources.gearAllokation.gitBlobSha,
  );
  assert.equal(
    gitBlobSha(progressionSource),
    ratification.sources.gearProgression.gitBlobSha,
  );

  for (const key of [
    "physicalCandidateReservedAtMostOnce",
    "recipientSlotReservedAtMostOnce",
    "farmerBeforeMerchantSelf",
    "evidenceFreshnessRequired",
    "targetCurrentRequired",
    "compatibilityRequired",
    "contentVerifiedRequired",
    "physicalAvailabilityRequired",
    "dispositionAllowedRequired",
    "minimumImprovementRequired",
    "restartNonTerminalBecomesRecoveryPending",
    "expiredReservationsBecomeAborted",
  ]) assert.equal(ratification.invariants[key], true, key);

  assert.equal(ratification.invariants.boundedNewGoalsMaximum, 64);
  assert.equal(ratification.invariants.boundedEvidenceMaximum, 512);
  assert.equal(ratification.authorityBoundary.planningOnly, true);
  assert.equal(ratification.authorityBoundary.executionAuthority, false);
  assert.equal(ratification.authorityBoundary.gameplayAuthority, false);
  assert.equal(ratification.authorityBoundary.rawWriteAuthority, false);
  assert.equal(ratification.authorityBoundary.farmerGameplayAuthority, false);
  assert.equal(ratification.authorityBoundary.liveFarmerWorkerRequired, false);
  assert.equal(ratification.authorityBoundary.gameplayWrites, 0);
  assert.equal(ratification.authorityBoundary.publicFunctionCalls, 0);
  assert.equal(ratification.authorityBoundary.rawWriteCalls, 0);
  assert.equal(ratification.authorityBoundary.normalRuntimeAllowed, false);

  assert.equal(ratification.prerequisiteMutationEvidence.occupiedNonWeapon.status,
    "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(ratification.prerequisiteMutationEvidence.weaponOffhandPurchase.status,
    "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(ratification.prerequisiteMutationEvidence.weaponOffhandEquip.status,
    "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");

  assert.equal(ratification.interpretation.ratifiesAllocationPlanningAndReservation, true);
  assert.equal(ratification.interpretation.doesNotRatifyFarmerTransferOrEquipExecution, true);
  assert.equal(ratification.interpretation.noAdditionalLiveWriteRequiredForThisNoWriteGate, true);
  assert.equal(ratification.interpretation.futureFarmerMutationStillRequiresItsOwnAuthorityAndEvidence, true);
  assert.equal(ratification.ratified, true);
  assert.deepEqual(ratification.blocker, []);
  assert.equal(ratification.nextGate, "PR20.8_WERTMUTATIONEN");
  assert.equal(roadmap.currentGate, "PR21_MERCHANT_INTEGRATION");
  assert.equal(roadmap.safePreparationBoundary.activeLiveGate, "PR20.8_WERTMUTATIONEN");
  assert.equal(roadmap.pr20_7.status,
    "ROADMAP_ABGESCHLOSSEN_MUTATIONS_RATIFIED_ALLOCATION_NO_WRITE");
  assert.equal(roadmap.pr20_7.remainingGates.weaponOffhand,
    "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(roadmap.pr20_7.remainingGates.farmerGearAllocation,
    "BESTANDEN_NO_WRITE_FOUNDATION_RATIFIED");
  assert.equal(roadmap.pr20_7.gameplayAuthority, false);
  assert.equal(roadmap.pr20_7.rawWriteAuthority, false);
  assert.equal(roadmap.pr20_7.normalRuntimeAllowed, false);
  assert.equal(roadmap.pr20_7.nextAction, "PR20.8_WERTMUTATIONEN");
  assert.equal(roadmap.pr20_7.weaponOffhand.acquisitionShadowEvidenceStatus,
    "BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE");

  for (const marker of [
    "GEAR_KANDIDAT_BEREITS_RESERVIERT",
    "GEAR_RECIPIENT_SLOT_BEREITS_BELEGT",
    "RECOVERY_PENDING",
  ]) assert.ok(allocationSource.includes(marker), marker);
  for (const marker of [
    "GEAR_PROGRESS_FARMER_PRIORITAET_ERFORDERLICH",
    "EVIDENCE_STALE",
    "CONTENT_NICHT_VERIFIZIERT",
    "PHYSISCH_NICHT_VERFUEGBAR",
    "DISPOSITION_GESPERRT",
    "VERBESSERUNG_ZU_KLEIN",
    "ausfuehrungsAutoritaet: false",
    "gameplayAutoritaet: false",
    "rawWriteAutoritaet: false",
  ]) assert.ok(progressionSource.includes(marker), marker);
});
