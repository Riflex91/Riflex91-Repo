import test from "node:test";
import assert from "node:assert/strict";

import {
  bewerteShadowZertifizierung,
  erstelleZertifizierungsSample,
} from "../../erzeugt/index.js";

const grenzen={
  maximalerSampleAbstandMs:1000,
  maximaleMemoryHistoryEntries:2048,
  maximaleSsdAktiveBytes:10_000_000,
  maximaleSsdSegmente:256,
  minimaleFreieBytes:1_000_000,
  maximaleIoQueueTiefe:16,
  maximaleSsdIoLatenzMs:100,
};

function metrik(index){
  return {
    unexpectedGameWrites:0,
    duplicateIrreversibleEffects:0,
    unsafePreemptions:0,
    unverifiedActionUsage:0,
    unresolvedTransactions:0,
    invariantViolations:0,
    recorderDrops:0,
    memoryHistoryEntries:100+index,
    ssdAktiveBytes:100_000+index*1000,
    ssdSegmente:10,
    kritischePersistenzverluste:0,
    hotPathNichtkritischeSsdBlockaden:0,
    freieBytes:100_000_000-index*1000,
    ioQueueTiefe:2,
    ssdIoLatenzMs:5,
  };
}

test("automatische Shadow-Serie bleibt write-frei und bounded",()=>{
  const eins=erstelleZertifizierungsSample(1,100,"SHADOW",null,metrik(0));
  const zwei=erstelleZertifizierungsSample(2,500,"SHADOW",eins.evidenceFingerprint,metrik(1));
  const drei=erstelleZertifizierungsSample(3,900,"SHADOW",zwei.evidenceFingerprint,metrik(2));
  const nachweis=bewerteShadowZertifizierung([eins,zwei,drei],grenzen);
  assert.equal(nachweis.bestanden,true);
  assert.equal(nachweis.unexpectedGameWrites,0);
  assert.equal(nachweis.serienNachweis.sampleGaps,0);
  assert.equal(nachweis.shadowHatGameplayAutoritaet,false);
  assert.equal(nachweis.shadowHatRawWriteAutoritaet,false);
});
