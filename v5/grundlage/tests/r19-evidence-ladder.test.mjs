import test from "node:test";
import assert from "node:assert/strict";

import {
  ZertifizierungsLadder,
  bewerteShadowZertifizierung,
  erstelleZertifizierungsSample,
  pruefeZertifizierungsSerie,
} from "../../erzeugt/index.js";

const grenzen={
  maximalerSampleAbstandMs:1000,
  maximaleMemoryHistoryEntries:1000,
  maximaleSsdAktiveBytes:1_000_000,
  maximaleSsdSegmente:100,
  minimaleFreieBytes:10_000,
  maximaleIoQueueTiefe:8,
  maximaleSsdIoLatenzMs:50,
};

function metrik(overrides={}) {
  return {
    unexpectedGameWrites:0,
    duplicateIrreversibleEffects:0,
    unsafePreemptions:0,
    unverifiedActionUsage:0,
    unresolvedTransactions:0,
    invariantViolations:0,
    recorderDrops:0,
    memoryHistoryEntries:100,
    ssdAktiveBytes:10_000,
    ssdSegmente:5,
    kritischePersistenzverluste:0,
    hotPathNichtkritischeSsdBlockaden:0,
    freieBytes:1_000_000,
    ioQueueTiefe:1,
    ssdIoLatenzMs:3,
    ...overrides,
  };
}

function serie() {
  const eins=erstelleZertifizierungsSample(1,100,"SHADOW",null,metrik());
  const zwei=erstelleZertifizierungsSample(2,500,"SHADOW",eins.evidenceFingerprint,metrik({
    memoryHistoryEntries:110,
    ssdAktiveBytes:12_000,
  }));
  return [eins,zwei];
}

test("hashverkettete Zertifizierungsevidence ohne Gaps besteht",()=>{
  const nachweis=pruefeZertifizierungsSerie(serie(),grenzen);
  assert.equal(nachweis.bestanden,true);
  assert.equal(nachweis.sampleGaps,0);
  assert.equal(nachweis.fingerprintFehler,0);
  assert.equal(nachweis.nullToleranzVerletzungen,0);
  assert.equal(nachweis.ressourcenVerletzungen,0);
  assert.equal(nachweis.unveraenderlicheKette,true);
});

test("manipulierte Evidence wird erkannt",()=>{
  const [eins,zwei]=serie();
  const manipuliert={...zwei,metrik:{...zwei.metrik,ioQueueTiefe:7}};
  const nachweis=pruefeZertifizierungsSerie([eins,manipuliert],grenzen);
  assert.equal(nachweis.bestanden,false);
  assert.ok(nachweis.fingerprintFehler>0);
});

test("Sequenz- und Zeit-Gaps werden erkannt",()=>{
  const eins=erstelleZertifizierungsSample(1,100,"SHADOW",null,metrik());
  const drei=erstelleZertifizierungsSample(3,2500,"SHADOW",eins.evidenceFingerprint,metrik());
  const nachweis=pruefeZertifizierungsSerie([eins,drei],grenzen);
  assert.equal(nachweis.bestanden,false);
  assert.ok(nachweis.sampleGaps>0);
});

test("jede globale Null-Toleranz-Metrik blockiert Shadow",()=>{
  const eins=erstelleZertifizierungsSample(1,100,"SHADOW",null,metrik({unexpectedGameWrites:1}));
  const nachweis=bewerteShadowZertifizierung([eins],grenzen);
  assert.equal(nachweis.bestanden,false);
  assert.equal(nachweis.shadowHatGameplayAutoritaet,false);
  assert.equal(nachweis.shadowHatRawWriteAutoritaet,false);
});

test("bounded SSD/RAM/Queue/Reserve sind Teil der Zertifizierung",()=>{
  for(const delta of [
    {memoryHistoryEntries:1001},
    {ssdAktiveBytes:1_000_001},
    {ssdSegmente:101},
    {freieBytes:9999},
    {ioQueueTiefe:9},
    {ssdIoLatenzMs:51},
    {kritischePersistenzverluste:1},
    {hotPathNichtkritischeSsdBlockaden:1},
    {recorderDrops:1},
  ]){
    const eins=erstelleZertifizierungsSample(1,100,"SHADOW",null,metrik(delta));
    assert.equal(pruefeZertifizierungsSerie([eins],grenzen).bestanden,false);
  }
});

test("Ladder kann keine Stufe ueberspringen",()=>{
  const ladder=new ZertifizierungsLadder();
  assert.throws(
    ()=>ladder.markiereBestanden("SHADOW","E-SHADOW",false),
    /ZERT_LADDER_STUFE_UEBERSPRUNGEN:SIMULATOR_REPLAY/,
  );
  ladder.markiereBestanden("SIMULATOR_REPLAY","E-REPLAY",false);
  ladder.markiereBestanden("FAULT_SUITE","E-FAULT",false);
  const sicht=ladder.markiereBestanden("SHADOW","E-SHADOW",false);
  assert.equal(sicht.naechsteStufe,"CONTROLLED_LIVE");
  assert.equal(sicht.breiteRuntimeFreigegeben,false);
});

test("Controlled Live und Canary koennen nicht durch CI auto-bestaetigt werden",()=>{
  const ladder=new ZertifizierungsLadder();
  ladder.markiereBestanden("SIMULATOR_REPLAY","E-REPLAY",false);
  ladder.markiereBestanden("FAULT_SUITE","E-FAULT",false);
  ladder.markiereBestanden("SHADOW","E-SHADOW",false);
  assert.throws(
    ()=>ladder.markiereBestanden("CONTROLLED_LIVE","E-LIVE",false),
    /ZERT_LADDER_MANUELLE_BESTAETIGUNG_ERFORDERLICH:CONTROLLED_LIVE/,
  );
  ladder.markiereBestanden("CONTROLLED_LIVE","E-LIVE",true);
  assert.throws(
    ()=>ladder.markiereBestanden("CANARY","E-CANARY",false),
    /ZERT_LADDER_MANUELLE_BESTAETIGUNG_ERFORDERLICH:CANARY/,
  );
});


test("beschleunigte Soak-Ladder endet nach 5m 10m 30m 60m",()=>{
  const ladder=new ZertifizierungsLadder();
  ladder.markiereBestanden("SIMULATOR_REPLAY","E-REPLAY-X",false);
  ladder.markiereBestanden("FAULT_SUITE","E-FAULT-X",false);
  ladder.markiereBestanden("SHADOW","E-SHADOW-X",false);
  ladder.markiereBestanden("CONTROLLED_LIVE","E-LIVE-X",true);
  let sicht=ladder.markiereBestanden("CANARY","E-CANARY-X",true);
  assert.equal(sicht.naechsteStufe,"SOAK_5M");
  sicht=ladder.markiereBestanden("SOAK_5M","E-5M",false);
  assert.equal(sicht.naechsteStufe,"SOAK_10M");
  sicht=ladder.markiereBestanden("SOAK_10M","E-10M",false);
  assert.equal(sicht.naechsteStufe,"SOAK_30M");
  sicht=ladder.markiereBestanden("SOAK_30M","E-30M",false);
  assert.equal(sicht.naechsteStufe,"SOAK_60M");
  sicht=ladder.markiereBestanden("SOAK_60M","E-60M",false);
  assert.equal(sicht.naechsteStufe,null);
});
