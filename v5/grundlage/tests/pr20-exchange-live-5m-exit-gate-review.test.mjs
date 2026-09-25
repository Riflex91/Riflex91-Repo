import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const review=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-live-5m-exit-gate-review.json","utf8"
));

test("PR20.8 exit gate after Exchange 5m is blocked only by autonomy",()=>{
  assert.equal(review.status,"BLOCKED_EXCHANGE_AUTONOMY_ONLY");
  assert.equal(review.currentExitGateSatisfied,false);
  const f=review.exitGateCriteria.eachFamilyIndividuallyRatifiedAnd5mLiveTested;
  assert.equal(f.upgrade.ratified,true);
  assert.equal(f.compound.ratified,true);
  assert.equal(f.compound.live5mTested,true);
  assert.equal(f.exchange.ratified,true);
  assert.equal(f.exchange.live5mTested,true);
  assert.equal(f.exchange.live5mNotificationId,2986);
  assert.equal(review.exitGateCriteria.noDuplicateValueMutationObserved,true);
  assert.equal(review.exitGateCriteria.exchangeAutonomyProductiveProven,false);
  assert.deepEqual(review.remainingBlockers,[
    "PR20_8_EXCHANGE_AUTONOMY_NOT_PRODUCTIVE_PROVEN",
  ]);
  assert.equal(review.authority.exchangeAuthority,false);
  assert.equal(review.authority.gameplayAuthority,false);
  assert.equal(review.authority.rawWriteAuthority,false);
  assert.equal(review.authority.normalRuntimeAllowed,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
  assert.equal(review.roadmapCriteriaRelaxed,false);
});
