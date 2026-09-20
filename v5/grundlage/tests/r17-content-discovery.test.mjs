import test from "node:test";
import assert from "node:assert/strict";

import {
  ContentQuarantaeneRegister,
  bildeDiscoveryCandidate,
  validiereMapGraph,
} from "../../erzeugt/index.js";

test("Map Graph akzeptiert nur bekannte Kanten und bleibt Planning Evidence",()=>{
  const g=validiereMapGraph({
    schemaVersion:1,
    definitionFingerprint:"maps-v1",
    maps:[
      {mapId:"main",fingerprint:"main-fp",pvp:false,safe:false,instance:false,ignore:false},
      {mapId:"cave",fingerprint:"cave-fp",pvp:false,safe:false,instance:false,ignore:false},
    ],
    kanten:[
      {vonMapId:"main",nachMapId:"cave",kanteId:"main:cave:0",fingerprint:"door-fp"},
    ],
  });
  assert.equal(g.planningEvidence,true);
  assert.equal(g.executionAuthority,false);
  assert.deepEqual(g.bekannteMaps,["cave","main"]);

  assert.throws(()=>validiereMapGraph({
    schemaVersion:1,
    definitionFingerprint:"maps-v1",
    maps:[{mapId:"main",fingerprint:"main-fp",pvp:false,safe:false,instance:false,ignore:false}],
    kanten:[{vonMapId:"main",nachMapId:"unknown",kanteId:"bad",fingerprint:"bad-fp"}],
  }),/MAPGRAPH_KANTE_ZIEL_UNBEKANNT/);
});

test("Rare/Boss Discovery braucht bekannte Definition plus frische Live Entity",()=>{
  const c=bildeDiscoveryCandidate({
    schemaVersion:1,mapId:"winterland",packId:"icegolem-pack",monsterTyp:"icegolem",
    count:1,definitionFingerprint:"pack-fp",seltenOderBoss:true,
  },{
    schemaVersion:1,entityId:"e1",entityFingerprint:"spawn-1",monsterTyp:"icegolem",
    mapId:"winterland",instanz:"main",serverRegion:"EU",serverIdentifier:"I",
    sichtbar:true,tot:false,beobachtetAmMs:100,gueltigBisMs:300,evidenceFingerprint:"live-fp",
  },150);
  assert.equal(c.seltenOderBoss,true);
  assert.equal(c.combatAuthority,false);

  assert.throws(()=>bildeDiscoveryCandidate({
    schemaVersion:1,mapId:"winterland",packId:"icegolem-pack",monsterTyp:"icegolem",
    count:1,definitionFingerprint:"pack-fp",seltenOderBoss:true,
  },{
    schemaVersion:1,entityId:"e1",entityFingerprint:"spawn-1",monsterTyp:"franky",
    mapId:"winterland",instanz:"main",serverRegion:"EU",serverIdentifier:"I",
    sichtbar:true,tot:false,beobachtetAmMs:100,gueltigBisMs:300,evidenceFingerprint:"live-fp",
  },150),/DISCOVERY_DEFINITION_LIVE_DRIFT/);
});

test("Unknown Content startet in Quarantaene und Discovery gibt ihn nicht frei",()=>{
  const r=new ContentQuarantaeneRegister();
  const first=r.beobachte({
    contentArt:"MONSTER",contentId:"brandnew",semantikVersion:1,
    definitionFingerprint:"unknown-v1",beobachtetAmMs:100,
  });
  assert.equal(first.disposition,"QUARANTAENE");
  assert.equal(r.darfAutomatisieren("MONSTER","brandnew"),false);

  const allowed=r.revalidiere("MONSTER","brandnew","unknown-v1",1,true,150);
  assert.equal(allowed.disposition,"ERLAUBT");
  assert.equal(r.darfAutomatisieren("MONSTER","brandnew"),true);
});

test("Definition Drift und Restart setzen Content wieder in Quarantaene",()=>{
  const r=new ContentQuarantaeneRegister();
  r.beobachte({
    contentArt:"EVENT",contentId:"event-x",semantikVersion:1,
    definitionFingerprint:"v1",beobachtetAmMs:100,
  });
  r.revalidiere("EVENT","event-x","v1",1,true,150);
  assert.equal(r.beobachte({
    contentArt:"EVENT",contentId:"event-x",semantikVersion:2,
    definitionFingerprint:"v2",beobachtetAmMs:200,
  }).disposition,"QUARANTAENE");

  r.revalidiere("EVENT","event-x","v2",2,true,220);
  const neu=new ContentQuarantaeneRegister();
  neu.importiereNachRestart(r.snapshot());
  assert.equal(neu.darfAutomatisieren("EVENT","event-x"),false);
});
