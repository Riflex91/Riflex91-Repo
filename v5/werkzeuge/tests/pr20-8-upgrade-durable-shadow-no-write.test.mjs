import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";

const source = fs.readFileSync(
  "werkzeuge/pr20-8-upgrade-durable-shadow-no-write.js",
  "utf8",
);

class MemoryStorage {
  constructor() {
    this.rows = new Map();
  }
  getItem(key) {
    return this.rows.has(key) ? this.rows.get(key) : null;
  }
  setItem(key,value) {
    this.rows.set(String(key),String(value));
  }
}

function defs() {
  return {
    gloves: {
      type:"gloves",
      g:3400,
      scroll:true,
      upgrade:{},
    },
    scroll0: {
      type:"uscroll",
      g:1000,
      grade:0,
    },
  };
}

function sandbox(items, options = {}) {
  let upgradeCalls = 0;
  const storage = options.storage ?? new MemoryStorage();
  const box = {
    console,
    Date,
    Promise,
    Object,
    Array,
    String,
    Number,
    Boolean,
    JSON,
    Math,
    Set,
    Map,
    Uint8Array,
    TextEncoder,
    crypto:webcrypto,
    localStorage:storage,
    setTimeout: fn => setImmediate(fn),
    clearTimeout: () => {},
    performance_trick() {},
    sounds: {
      empty: {
        cplaying:true,
        playing:() => true,
      },
    },
    server_region:"EU",
    server_identifier:"I",
    B:{ sell_dist:400 },
    entities:{},
    upgrade() {
      upgradeCalls += 1;
      throw new Error("MUTATION_MUST_NOT_BE_CALLED");
    },
    character: {
      name:"My_Merchant",
      id:"My_Merchant",
      ctype:"merchant",
      level:58,
      map:"main",
      x:-100,
      y:-160,
      moving:false,
      target:null,
      q:{},
      p:{ ugrace:{}, ograce:0 },
      s:{},
      items,
      ...options.character,
    },
    G:{
      items:defs(),
      maps:{ main:{ ref:{ u_mid:[-235,-203] } } },
      ...options.G,
    },
    S:{ ugrace:{} },
  };
  box.parent=box;
  return { box, storage, upgradeCalls:() => upgradeCalls };
}

function splitRootSandbox(items) {
  const env=sandbox(items);
  const host=env.box;
  const local={
    console,
    Date,
    Promise,
    Object,
    Array,
    String,
    Number,
    Boolean,
    JSON,
    Math,
    Set,
    Map,
    Uint8Array,
    TextEncoder,
    crypto:webcrypto,
    localStorage:env.storage,
    setTimeout:fn => setImmediate(fn),
    clearTimeout:() => {},
    AIO_V3:{
      operations:{
        status:() => ({
          v5AutonomousTest:{
            testId:"stale-test-id",
            version:"0.0.0",
            terminal:true,
            gameplayWrites:0,
            rawWriteCalls:0,
            sameIntentRetry:false,
            authority:{durableIntentCreated:false},
            intents:[],
          },
        }),
      },
    },
    parent:host,
  };
  return { box:local, host, storage:env.storage, upgradeCalls:env.upgradeCalls };
}

async function run(env) {
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-8-upgrade-durable-shadow-no-write.js",
  });
  for(let i=0;i<240;i+=1) {
    await new Promise(resolve => setImmediate(resolve));
    const status=env.box.V5PR208UpgradeDurableShadowNoWrite?.status?.();
    if(status?.terminal) return status;
  }
  throw new Error("TEST_DID_NOT_TERMINATE");
}

test("PR20.8 Upgrade durable shadow persists exact no-send intent and reobserves NOT_APPLIED", async () => {
  const items = Array(22).fill(null);
  items[6]={ name:"gloves", level:0 };
  items[13]={ name:"gloves", level:0 };
  items[14]={ name:"scroll0", q:36 };
  const env=sandbox(items);
  const status=await run(env);

  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.equal(status.blocker.length,0);
  assert.equal(env.upgradeCalls(),0);

  const e=status.evidence;
  assert.equal(e.evidenceArt,"V5_PR20_8_UPGRADE_DURABLE_SHADOW_NO_WRITE");
  assert.equal(e.recipient.characterName,"My_Merchant");
  assert.equal(e.recipient.serverRegion,"EU");
  assert.equal(e.recipient.serverIdentifier,"I");
  assert.equal(e.candidate.name,"gloves");
  assert.equal(e.candidate.level,0);
  assert.equal(e.candidate.inventoryIndex,6);
  assert.equal(e.candidate.matchingCandidateCount,2);
  assert.equal(e.scroll.name,"scroll0");
  assert.equal(e.scroll.inventoryIndex,14);
  assert.equal(e.scroll.observedQuantity,36);
  assert.equal(e.scroll.consumeQuantity,1);
  assert.equal(e.offering,null);
  assert.equal(e.normalPathOnly,true);
  assert.equal(e.publicFunctionAvailable,true);
  assert.equal(e.serviceReachability.reachable,true);
  assert.equal(e.serviceReachability.viaComputer,false);
  assert.equal(e.serviceReachability.serverLimit,400);
  assert.equal(e.serviceReachability.safetyLimit,300);
  assert.ok(e.serviceReachability.distance < 300);
  assert.equal(e.sourceSnapshotCommit,
    "ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4");
  assert.equal(e.ratifiedCandidateEvidenceCommit,
    "00847a4f314237bc5535e06024a1f08a7f35e8a2");
  assert.equal(e.stableDoubleObservation,true);
  assert.equal(e.stablePostIntentReobserve,true);
  assert.equal(e.durableIntentCreatedShadowOnly,true);
  assert.equal(e.durableReadback,true);
  assert.equal(e.journalTerminalArt,"ABBRUCH");
  assert.equal(e.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(e.reconciliationClassification,"NOT_APPLIED");
  assert.equal(e.exactPhysicalCandidateIndexPinned,true);
  assert.equal(e.exactPhysicalScrollIndexPinned,true);
  assert.equal(e.freshReresolutionRequiredBeforeFutureSend,true);
  assert.equal(e.oneShotBindingPrepared,true);
  assert.equal(e.oneShotMaximumUses,1);
  assert.equal(e.oneShotUpgradeAuthorityIssued,false);
  assert.equal(e.inventoryFencePrepared,true);
  assert.equal(e.qFencePrepared,true);
  assert.equal(e.upgradeActionChannelFencePrepared,true);
  assert.equal(e.socketBudgetFencePrepared,true);
  assert.equal(e.gameplayWrites,0);
  assert.equal(e.publicFunctionCalls,0);
  assert.equal(e.rawWriteCalls,0);
  assert.equal(e.authorityIssued,false);
  assert.equal(e.upgradeAuthority,false);
  assert.equal(e.gameplayAuthority,false);
  assert.equal(e.rawWriteAuthority,false);
  assert.equal(e.normalUpgradeWriteRatification,false);
  assert.equal(e.sameIntentRetry,false);
  assert.equal(e.normalRuntimeAllowed,false);

  assert.equal(env.storage.rows.size,1);
  const durable=JSON.parse([...env.storage.rows.values()][0]);
  assert.equal(durable.art,
    "PR20_8_UPGRADE_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE");
  assert.equal(durable.actionContractId,"AL-ACTION-UPGRADE");
  assert.equal(durable.serviceReachability.reachable,true);
  assert.equal(durable.serviceReachability.serverLimit,400);
  assert.equal(durable.recoveryContractId,"AL-RECOVERY-UPGRADE");
  assert.equal(durable.verifierId,"AL-VERIFIER-UPGRADE");
  assert.equal(durable.candidate.index,6);
  assert.equal(durable.scroll.index,14);
  assert.equal(durable.journalTerminalArt,"ABBRUCH");
  assert.equal(durable.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(durable.sameIntentRetry,false);
  assert.equal(durable.oneShot.maximumUses,1);
  assert.equal(durable.oneShot.upgradeAuthorityIssued,false);
  assert.equal(durable.upgradeAuthority,false);
  assert.equal(durable.gameplayAuthority,false);
  assert.equal(durable.rawWriteAuthority,false);
  assert.equal(durable.normalUpgradeWriteRatification,false);
});

test("PR20.8 Upgrade shadow mirrors telemetry into stale local CDP and game root", async () => {
  const items=Array(8).fill(null);
  items[2]={ name:"gloves", level:0 };
  items[3]={ name:"scroll0", q:2 };
  const env=splitRootSandbox(items);
  const status=await run(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(env.upgradeCalls(),0);

  const localStatus=env.box.AIO_V3.operations.status().v5AutonomousTest;
  const hostStatus=env.host.AIO_V3.operations.status().v5AutonomousTest;
  assert.equal(localStatus.testId,"pr20-8-upgrade-durable-shadow-no-write");
  assert.equal(localStatus.version,"1.0.0");
  assert.equal(hostStatus.testId,"pr20-8-upgrade-durable-shadow-no-write");
  assert.equal(hostStatus.version,"1.0.0");
  assert.equal(
    env.box.V5PR208UpgradeDurableShadowNoWrite.testId,
    "pr20-8-upgrade-durable-shadow-no-write",
  );
  assert.equal(
    env.host.V5PR208UpgradeDurableShadowNoWrite.testId,
    "pr20-8-upgrade-durable-shadow-no-write",
  );
});

test("PR20.8 Upgrade shadow re-resolves current physical indexes instead of trusting evidence index 6", async () => {
  const items=Array(12).fill(null);
  items[2]={ name:"gloves", level:0 };
  items[9]={ name:"scroll0", q:4 };
  const status=await run(sandbox(items));
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.evidence.candidate.inventoryIndex,2);
  assert.equal(status.evidence.scroll.inventoryIndex,9);
  assert.equal(status.evidence.freshReresolutionRequiredBeforeFutureSend,true);
});

test("PR20.8 Upgrade shadow blocks service-distance and scroll-definition drift", async () => {
  {
    const items=Array(8).fill(null);
    items[2]={ name:"gloves", level:0 };
    items[3]={ name:"scroll0", q:2 };
    const env=sandbox(items,{character:{x:1000,y:1000}});
    const status=await run(env);
    assert.equal(status.status,"FEHLER");
    assert.ok(status.blocker.some(x =>
      x.includes("PR20_8_UPGRADE_SHADOW_SERVICE_NICHT_ERREICHBAR")));
    assert.equal(env.storage.rows.size,0);
    assert.equal(env.upgradeCalls(),0);
  }
  {
    const items=Array(8).fill(null);
    items[2]={ name:"gloves", level:0 };
    items[3]={ name:"scroll0", q:2 };
    const env=sandbox(items,{
      G:{
        items:{
          ...defs(),
          scroll0:{type:"pscroll",g:1000,grade:0},
        },
        maps:{main:{ref:{u_mid:[-235,-203]}}},
      },
    });
    const status=await run(env);
    assert.equal(status.status,"FEHLER");
    assert.ok(status.blocker.some(x =>
      x.includes("PR20_8_UPGRADE_SHADOW_SCROLL_DEFINITION_DRIFT")));
    assert.equal(env.storage.rows.size,0);
    assert.equal(env.upgradeCalls(),0);
  }
});

test("PR20.8 Upgrade shadow blocks active q before durable intent", async () => {
  const items=Array(8).fill(null);
  items[2]={ name:"gloves", level:0 };
  items[3]={ name:"scroll0", q:2 };
  const env=sandbox(items,{character:{q:{upgrade:{ms:500}}}});
  const status=await run(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.some(x => x.includes("PR20_8_UPGRADE_SHADOW_Q_NICHT_FREI")));
  assert.equal(env.storage.rows.size,0);
  assert.equal(env.upgradeCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.rawWriteCalls,0);
});

test("PR20.8 Upgrade shadow blocks unsafe gift candidate and never invents authority", async () => {
  const items=Array(8).fill(null);
  items[2]={ name:"gloves", level:0, gift:1 };
  items[3]={ name:"scroll0", q:2 };
  const env=sandbox(items);
  const status=await run(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.some(x => x.includes("PR20_8_UPGRADE_SHADOW_CANDIDATE_FEHLT")));
  assert.equal(env.storage.rows.size,0);
  assert.equal(status.authority.authorityIssued,false);
  assert.equal(status.authority.upgradeAuthority,false);
});

test("PR20.8 same shadow intent is never silently reused", async () => {
  const items=Array(8).fill(null);
  items[2]={ name:"gloves", level:0 };
  items[3]={ name:"scroll0", q:2 };
  const shared=new MemoryStorage();
  const first=await run(sandbox(items,{storage:shared}));
  assert.equal(first.status,"BESTANDEN");
  const second=await run(sandbox(items,{storage:shared}));
  assert.equal(second.status,"FEHLER");
  assert.ok(second.blocker.some(x =>
    x.includes("PR20_8_UPGRADE_SHADOW_GLEICHER_INTENT_BEREITS_TERMINAL")));
  assert.equal(shared.rows.size,1);
});

test("PR20.8 Upgrade shadow package contains no gameplay mutation bypass", () => {
  for(const marker of [
    "upgrade(",
    "compound(",
    "exchange(",
    "buy(",
    "buy_with_gold(",
    "equip(",
    "unequip(",
    "sell(",
    "bank_retrieve(",
    "bank_store(",
    "send_item(",
    "send_gold(",
    "use_skill(",
    "start_character(",
    "command_character(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(source.includes(marker),false,marker);

  for(const marker of [
    "PR20_8_UPGRADE_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE",
    "journalTerminalArt:'ABBRUCH'",
    "sendBoundaryState:'NICHT_GESENDET'",
    "reconciliationClassification:'NOT_APPLIED'",
    "maximumUses:1",
    "upgradeAuthorityIssued:false",
    "freshReresolutionRequiredBeforeFutureSend:true",
    "SOURCE_PINNED_SELL_DISTANCE = 400",
    "SERVICE_REACHABILITY_SAFETY_MAX = 300",
    "scrollDef.type,64) !== 'uscroll'",
    "publishTelemetryFacades()",
    "installTelemetryFacade(owner)",
    "gameplayWrites:0",
    "publicFunctionCalls:0",
    "rawWriteCalls:0",
    "sameIntentRetry:false",
    "normalRuntimeAllowed:false",
  ]) assert.ok(source.includes(marker),marker);
});
