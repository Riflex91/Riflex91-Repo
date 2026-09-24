import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const review=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-no-candidate-exit-gate-review.json",
  "utf8",
));

test("PR20.8 no-candidate review keeps the roadmap exit gate blocked", () => {
  assert.equal(review.status,"BLOCKED_BY_REQUIRED_COMPOUND_EXCHANGE_LIVE_RATIFICATION");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
  assert.equal(review.roadmapCriteriaRelaxed,false);

  const families=review.exitGateCriteria.eachFamilyIndividuallyRatifiedAnd5mLiveTested;
  assert.equal(families.upgrade.ratified,true);
  assert.equal(families.compound.ratified,false);
  assert.equal(families.compound.live5mTested,false);
  assert.equal(families.compound.reason,"KEIN_NORMALKANDIDAT");
  assert.equal(families.exchange.ratified,false);
  assert.equal(families.exchange.live5mTested,false);
  assert.equal(families.exchange.reason,"KEIN_NORMALKANDIDAT");
  assert.equal(review.exitGateCriteria.noDuplicateValueMutationObserved,true);
  assert.equal(review.exitGateCriteria.exchangeAutonomyProductiveProven,false);
});

test("PR20.8 no-candidate evidence cannot silently create authority or substitute ratification", () => {
  assert.equal(review.noCandidateEvidence.ratifiedObservation,true);
  assert.equal(review.noCandidateEvidence.substitutesForCompoundRatification,false);
  assert.equal(review.noCandidateEvidence.substitutesForExchangeRatification,false);
  assert.equal(review.authority.compoundAuthority,false);
  assert.equal(review.authority.exchangeAuthority,false);
  assert.equal(review.authority.gameplayAuthority,false);
  assert.equal(review.authority.rawWriteAuthority,false);
  assert.equal(review.authority.acquisitionOrMutationToCreateCandidateAllowed,false);
  assert.equal(review.authority.normalRuntimeAllowed,false);
  assert.deepEqual(review.blockers,[
    "PR20_8_COMPOUND_NOT_RATIFIED_NO_NORMAL_CANDIDATE",
    "PR20_8_COMPOUND_5M_LIVE_NOT_RUN",
    "PR20_8_EXCHANGE_NOT_RATIFIED_NO_NORMAL_CANDIDATE",
    "PR20_8_EXCHANGE_5M_LIVE_NOT_RUN",
    "PR20_8_EXCHANGE_AUTONOMY_NOT_PRODUCTIVE_PROVEN",
  ]);
  assert.equal(
    review.nextAction,
    "WAIT_FOR_NATURAL_COMPOUND_OR_EXCHANGE_NORMAL_CANDIDATE_THEN_REPEAT_READONLY_TARGET_RESCAN",
  );
});
