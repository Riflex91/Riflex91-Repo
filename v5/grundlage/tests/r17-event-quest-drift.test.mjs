import test from "node:test";
import assert from "node:assert/strict";

import {
  WeltPlanLedger,
  pinneWeltPlan,
  pruefeWeltDrift,
} from "../../erzeugt/index.js";

function state(overrides={}) {
  return {
    schemaVersion:1,
    art:"EVENT",
    stateId:"icegolem",
    serverRegion:"EU",
    serverIdentifier:"I",
    mapId:"winterland",
    characterId:null,
    aktiv:true,
    semantikVersion:1,
    beobachtetAmMs:100,
    gueltigBisMs:500,
    fingerprint:"event-fp-1",
    ...overrides,
  };
}

test("Event Drift zwischen Planung und Action erzwingt Replan",()=>{
  const pin=pinneWeltPlan("plan-1",state(),120);
  const drift=pruefeWeltDrift(pin,state({fingerprint:"event-fp-2",beobachtetAmMs:150}),160);
  assert.equal(drift.status,"REPLAN_ERFORDERLICH");
  assert.equal(drift.actionErlaubt,false);
});

test("Stale Event State blockiert fail-closed",()=>{
  const pin=pinneWeltPlan("plan-1",state(),120);
  const stale=pruefeWeltDrift(pin,state({beobachtetAmMs:100,gueltigBisMs:130}),200);
  assert.equal(stale.status,"BLOCKIERT_STALE");
  assert.equal(stale.actionErlaubt,false);
});

test("Unknown Semantik/State bindet Action nicht frei",()=>{
  const pin=pinneWeltPlan("plan-1",state(),120);
  const unknown=pruefeWeltDrift(pin,{...state(),stateId:"unknown",fingerprint:"unknown-fp"},150);
  assert.equal(unknown.status,"BLOCKIERT_UNBEKANNT");
  assert.equal(unknown.actionErlaubt,false);
});

test("World Plan braucht Revalidation vor Abschluss und nach Restart erneut",()=>{
  const alt=new WeltPlanLedger();
  alt.plane("plan-1",state(),120);
  assert.throws(()=>alt.markiereAbgeschlossen("plan-1"),/WELT_PLAN_COMMIT_OHNE_REVALIDIERUNG/);
  assert.equal(alt.revalidiere("plan-1",state({beobachtetAmMs:150}),160).status,"AKTIONSBEREIT");

  const neu=new WeltPlanLedger();
  neu.importiereNachRestart(alt.snapshot());
  assert.equal(neu.snapshot()[0].status,"REVALIDIERUNG_ERFORDERLICH");
  assert.throws(()=>neu.markiereAbgeschlossen("plan-1"),/WELT_PLAN_COMMIT_OHNE_REVALIDIERUNG/);
  assert.equal(neu.revalidiere("plan-1",state({beobachtetAmMs:170}),180).status,"AKTIONSBEREIT");
});
