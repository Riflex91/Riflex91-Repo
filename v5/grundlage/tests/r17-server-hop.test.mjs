import test from "node:test";
import assert from "node:assert/strict";

import { pruefeServerHop } from "../../erzeugt/index.js";

const current={
  schemaVersion:1,region:"EU",identifier:"I",modus:"NORMAL",online:true,
  beobachtetAmMs:100,gueltigBisMs:500,fingerprint:"eu-i",
};

function target(overrides={}) {
  return {
    schemaVersion:1,region:"US",identifier:"I",modus:"NORMAL",online:true,
    beobachtetAmMs:100,gueltigBisMs:500,fingerprint:"us-i",
    ...overrides,
  };
}
const policy={
  pvpErlaubt:false,hardcoreErlaubt:false,testErlaubt:false,dungeonErlaubt:false,
  minimalerHopAbstandMs:1000,maximaleHopsImFenster:3,fensterMs:10000,
};

test("Server Hop erlaubt frischen bekannten Normalserver ohne Fatigue",()=>{
  const n=pruefeServerHop(current,target(),policy,{letzteHopsMs:[]},200);
  assert.equal(n.erlaubt,true);
  assert.equal(n.actionAuthority,false);
});

test("Unknown/PvP/Hardcore und stale Registry blockieren fail-closed",()=>{
  assert.equal(pruefeServerHop(current,target({modus:"UNBEKANNT"}),policy,{letzteHopsMs:[]},200).grund,"MODUS_UNBEKANNT");
  assert.equal(pruefeServerHop(current,target({modus:"PVP"}),policy,{letzteHopsMs:[]},200).grund,"MODUS_GESPERRT");
  assert.equal(pruefeServerHop(current,target({modus:"HARDCORE"}),policy,{letzteHopsMs:[]},200).grund,"MODUS_GESPERRT");
  assert.equal(pruefeServerHop(current,target({gueltigBisMs:150}),policy,{letzteHopsMs:[]},200).grund,"STALE");
});

test("Server Hop respektiert Mindestabstand und Fensterlimit",()=>{
  assert.equal(pruefeServerHop(current,target(),policy,{letzteHopsMs:[-1,50,150]},200).grund,"FATIGUE");
  const p={...policy,minimalerHopAbstandMs:0,maximaleHopsImFenster:2};
  assert.equal(pruefeServerHop(current,target(),p,{letzteHopsMs:[100,150]},200).grund,"FATIGUE");
});

test("PvP/Hardcore brauchen expliziten Opt-in",()=>{
  assert.equal(pruefeServerHop(current,target({modus:"PVP"}),{...policy,pvpErlaubt:true},{letzteHopsMs:[]},200).erlaubt,true);
  assert.equal(pruefeServerHop(current,target({modus:"HARDCORE"}),{...policy,hardcoreErlaubt:true},{letzteHopsMs:[]},200).erlaubt,true);
});
