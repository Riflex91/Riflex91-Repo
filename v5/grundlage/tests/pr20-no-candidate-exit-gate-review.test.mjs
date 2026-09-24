import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const review=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-no-candidate-exit-gate-review.json",
  "utf8",
));

test("PR20.8 no-candidate review keeps the roadmap exit gate blocked", () => {
  assert.equal(review.status,"BLOCKED_COMPOUND_5M_EXCHANGE_NO_CANDIDATE");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
  assert.equal(review.roadmapCriteriaRelaxed,false);

  const families=review.exitGateCriteria.eachFamilyIndividuallyRatifiedAnd5mLiveTested;
  assert.equal(families.upgrade.ratified,true);
  assert.equal(families.compound.ratified,true);
  assert.equal(families.compound.live5mTested,false);
  assert.equal(families.compound.reason,"PRODUCTIVE_ONE_WRITE_RATIFIED_LIVE_5M_PENDING");
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
    "PR20_8_COMPOUND_5M_LIVE_NOT_RUN",
    "PR20_8_EXCHANGE_NOT_RATIFIED_NO_NORMAL_CANDIDATE",
    "PR20_8_EXCHANGE_5M_LIVE_NOT_RUN",
    "PR20_8_EXCHANGE_AUTONOMY_NOT_PRODUCTIVE_PROVEN",
  ]);
  assert.equal(
    review.nextAction,
    "PR20_8_COMPOUND_LIVE_5M_PREPARATION",
  );
});
