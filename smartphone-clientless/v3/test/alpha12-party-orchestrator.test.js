'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Alpha12Runtime, createPartyFingerprint, createEncounterFingerprint, PartyPerformanceStore, PartyOrchestrator,
  PaladinAuraPolicy, PartyTelemetryBridge, PartyTransitionController, BackgroundExecutionGuard
} = require('../src');

function member(name, ctype, extra = {}) {
  return { name, ctype, level: 70, online: true, available: true, presence: 'ONLINE', primarySource: 'self', stateConfidence: 1, dead: false, skillUnlocks: [], stats: { hp: 3000, max_hp: 3000, armor: 300, resistance: 200 }, gear: {}, ...extra };
}
function encounter(monster = 'goo', raw = { hp: 1000, attack: 100, damage_type: 'physical', armor: 100, resistance: 100 }, disposition = 'APPROVED') {
  return createEncounterFingerprint({ snapshot: { character: { name: 'R1', map: 'main', hp: 100, max_hp: 100, mp: 100, max_mp: 100 }, entities: [] }, gameData: { monsters: { [monster]: raw } }, monster, contentDisposition: disposition });
}

test('Party and Encounter fingerprints are deterministic, gear/skill/context sensitive and JSON-safe', () => {
  const rows = [member('Merch','merchant'), member('R1','ranger'), member('R2','ranger'), member('R3','ranger')];
  const a = createPartyFingerprint(rows); const b = createPartyFingerprint(rows.slice().reverse());
  assert.equal(a.key, b.key);
  const geared = createPartyFingerprint(rows.map((row) => row.name === 'R1' ? { ...row, gear: { mainhand: { name: 'bow', level: 8 } } } : row));
  assert.notEqual(a.key, geared.key);
  const e1 = encounter('goo'); const e2 = encounter('boss', { hp: 100000, attack: 2000, damage_type: 'magical', armor: 900, resistance: 200 });
  assert.notEqual(e1.key, e2.key);
  assert.doesNotThrow(() => JSON.stringify({ a, geared, e1, e2 }));
});

test('Candidate generation uses one Merchant plus one to three distinct realizable combat characters while class duplicates remain legal', () => {
  const registry = { characters: [member('Merch','merchant'), member('R1','ranger'), member('R2','ranger'), member('R3','ranger'), member('P','paladin',{online:false,presence:'OFFLINE',primarySource:'configured',available:true,stateConfidence:.35})] };
  const orchestrator = new PartyOrchestrator(); const candidates = orchestrator.candidates(registry);
  assert.ok(candidates.some((row) => row.combat.length === 3 && row.combat.every((member) => member.ctype === 'ranger')));
  assert.ok(candidates.some((row) => row.combat.some((member) => member.ctype === 'paladin')));
  assert.deepEqual([...new Set(candidates.map((row) => row.members.length))].sort((a, b) => a - b), [2, 3, 4]);
  for (const candidate of candidates) {
    assert.ok(candidate.members.length >= 2 && candidate.members.length <= 4);
    assert.equal(candidate.members.filter((row) => row.ctype === 'merchant').length, 1);
    assert.equal(new Set(candidate.members.map((row) => row.name)).size, candidate.members.length);
  }
});

test('v2 triple-Ranger knowledge is only a safe-content bootstrap prior and gains confidence without becoming a universal winner', () => {
  const triple = [member('Merch','merchant'), member('R1','ranger'), member('R2','ranger'), member('R3','ranger')];
  const mixed = [member('Merch','merchant'), member('P','paladin',{skillUnlocks:['paladin_aura','guardians_oath'],stats:{hp:6000,max_hp:6000,armor:900,resistance:500}}), member('R1','ranger',{skillUnlocks:['huntersmark']}), member('Pri','priest',{skillUnlocks:['darkblessing']})];
  const orchestrator = new PartyOrchestrator();
  const safe = encounter('bee',{hp:1200,attack:80,damage_type:'physical',armor:100,resistance:100},'APPROVED');
  const t = orchestrator.score({fingerprint:createPartyFingerprint(triple),members:triple,merchant:triple[0],combat:triple.slice(1),id:'t'}, {encounter:safe});
  const m = orchestrator.score({fingerprint:createPartyFingerprint(mixed),members:mixed,merchant:mixed[0],combat:mixed.slice(1),id:'m'}, {encounter:safe});
  assert.ok(t.reasons.includes('V2_TRIPLE_RANGER_PRIOR')); assert.ok(t.confidence > 0.5); assert.ok(t.score >= m.score || t.components.progress > m.components.progress);
  const dangerous = encounter('boss',{hp:100000,attack:2500,damage_type:'physical',armor:100,resistance:100},'UNKNOWN');
  const td = orchestrator.score({fingerprint:createPartyFingerprint(triple),members:triple,merchant:triple[0],combat:triple.slice(1),id:'t'}, {encounter:dangerous});
  const md = orchestrator.score({fingerprint:createPartyFingerprint(mixed),members:mixed,merchant:mixed[0],combat:mixed.slice(1),id:'m'}, {encounter:dangerous});
  assert.ok(md.components.survival > td.components.survival);
});

test('Measured death/retreat danger is a hard safety rejection that cannot be bought off by huge XP', () => {
  const party = [member('Merch','merchant'), member('R1','ranger'), member('R2','ranger'), member('R3','ranger')]; const candidate = {fingerprint:createPartyFingerprint(party),members:party,merchant:party[0],combat:party.slice(1),id:'x'}; const orchestrator = new PartyOrchestrator();
  const store = { profile: () => ({ deathsPerHour: 2, retreatsPerHour: 12, recoverySecondsPerHour: 0, hpPotionsPerHour: 0, mpPotionsPerHour: 0, movementFailures: 0, skillFailures: 0, samples: 30, scoreEwma: .99, confidence: .95, xpPerHour: 20000000, avgSafetyMargin: .8 }) };
  const score = orchestrator.score(candidate,{encounter:encounter(),performanceStore:store}); assert.equal(score.hardSafetyRejected,true); assert.equal(score.score,0); assert.ok(score.reasons.includes('HIGH_DEATH_RATE'));
});

test('Party Performance persistence is schema-safe, bounded, confidence-aged and corrupt data fails closed', () => {
  let now = 1000; let raw = null; const storage = { get: () => raw, set: (_, value) => { raw = value; } }; const store = new PartyPerformanceStore({now:()=>now,storage,capacity:32,halfLifeMs:3600000,minSaveMs:5000}); store.load();
  store.record('e','p',{seconds:900,xp:1000000,gold:100000,deaths:0,safetyMargin:.9,score:.9}); const fresh=store.profile('e','p'); assert.equal(fresh.xpPerHour,4000000); assert.ok(fresh.confidence>0); store.save({force:true});
  const restored = new PartyPerformanceStore({now:()=>now,storage,halfLifeMs:3600000}); assert.equal(restored.load(),true); assert.ok(restored.profile('e','p'));
  now += 10*3600000; assert.ok(restored.profile('e','p').freshness < .01);
  raw='{broken'; const corrupt=new PartyPerformanceStore({storage}); assert.equal(corrupt.load(),false); assert.equal(corrupt.status().size,0);
  for(let i=0;i<2000;i++) store.record('e'+i,'p',{seconds:5,score:.5}); assert.ok(store.status().size<=32); assert.doesNotThrow(()=>JSON.stringify(store.status()));
});

test('Paladin Aura policy uses current official aura states and hysteresis prevents flapping', () => {
  let now=0; const policy=new PaladinAuraPolicy({now:()=>now,minHoldMs:30000}); const pala=member('P','paladin',{skillUnlocks:['paladin_aura']});
  assert.equal(policy.recommend({paladin:pala,encounter:{monster:{damageType:'physical'}},risk:{mediumRisk:true}}).aura,'bulwark'); policy.noteApplied('bulwark');
  now=1000; const held=policy.recommend({paladin:pala,encounter:{monster:{damageType:'physical'}},risk:{}}); assert.equal(held.aura,'bulwark'); assert.equal(held.reason,'AURA_HYSTERESIS_HOLD');
  now=40000; assert.equal(policy.recommend({paladin:pala,encounter:{monster:{damageType:'magical'}},risk:{mediumRisk:true}}).aura,'sanctuary');
  now=80000; assert.equal(policy.recommend({paladin:pala,encounter:{monster:{damageType:'magical'}},risk:{mpStarvation:true}}).aura,'warding');
});

test('Party telemetry accepts only trusted bounded fresh reports and aggregates group rates', () => {
  let now=10000; const bridge=new PartyTelemetryBridge({root:{},now:()=>now,trustedNames:['A','B'],merchantName:'M',reportTtlMs:10000}); const report={type:'aio-v3-party-report',protocol:1,at:now,ctype:'ranger',level:70,map:'main',hpRatio:.8,mpRatio:.5,rates:{xpPerHour:4000000,goldPerHour:300000,deathsPerHour:0},safety:{}};
  assert.equal(bridge.receive('X',report),false); assert.equal(bridge.receive('A',report),true); assert.equal(bridge.aggregate(['A']).xpPerHour,4000000); now+=11000; assert.equal(bridge.aggregate(['A']).freshReports,0); assert.ok(bridge.status().stats.rejected>=1);
});

test('Background execution guard uses official performance_trick, re-arms on severe drift and is headless fail-soft', () => {
  let calls=0,now=0; const guard=new BackgroundExecutionGuard({root:{performance_trick(){calls++;}},now:()=>now,expectedTickMs:250,driftThresholdMs:1000,rearmCooldownMs:5000}); assert.equal(guard.start().armed,true); assert.equal(calls,1); guard.noteTick(); now=6000; guard.noteTick(); assert.equal(calls,2); assert.equal(guard.status().guarantee,false); assert.equal(guard.status().strategy,'adventure-land-performance-trick'); const missing=new BackgroundExecutionGuard({root:{}}); assert.equal(missing.start().armed,false);
});

test('Transition controller is default-deny and blocks combat, missing rollback slots, cross-map switching and non-Merchant control', async () => {
  const root={character:{name:'Merch'},parent:{party:{}},get_active_characters:()=>({Merch:'self',R1:'code',R2:'code',R3:'code'})}; const plan={merchant:{name:'Merch'},members:[member('Merch','merchant'),member('R1','ranger'),member('R2','ranger'),member('P','paladin')]};
  const off=new PartyTransitionController({root,merchantName:'Merch',codeSlots:{R1:1,R2:1,R3:1,P:1}}); assert.equal((await off.execute(plan,{runtimeMode:'active',currentMembers:['Merch','R1','R2','R3'],registryStatus:{characters:[]}})).reason,'TRANSITIONS_DISABLED');
  const on=new PartyTransitionController({root,merchantName:'Merch',liveEnabled:true,codeSlots:{R1:1,R2:1,P:1}}); const pre=on.preflight(plan,{runtimeMode:'active',currentMembers:['Merch','R1','R2','R3'],registryStatus:{characters:[]},inCombat:true,requiresCrossMapRouting:true}); assert.ok(pre.reasons.includes('ACTIVE_COMBAT')); assert.ok(pre.reasons.includes('CROSS_MAP_ROUTING_NOT_ALLOWED')); assert.ok(pre.reasons.includes('MISSING_CODE_SLOT'));
});

test('Controlled same-account transition verifies stop/start/party postconditions and completes in a fully mocked safe case', async () => {
  const active={Merch:'self',R1:'code',R2:'code',R3:'code'}; const party={R1:{},R2:{},R3:{}}; const root={character:{name:'Merch'},parent:{party},get_active_characters:()=>({...active}),stop_character:(name)=>{delete active[name];delete party[name];},start_character:async(name)=>{active[name]='code';},send_party_invite:async(name)=>{party[name]={};}};
  const controller=new PartyTransitionController({root,merchantName:'Merch',liveEnabled:true,codeSlots:{R1:1,R2:1,R3:1,P:1},pollMs:100,stepTimeoutMs:3000}); const plan={merchant:{name:'Merch'},members:[member('Merch','merchant'),member('R1','ranger'),member('R2','ranger'),member('P','paladin')]};
  const result=await controller.execute(plan,{runtimeMode:'active',currentMembers:['Merch','R1','R2','R3'],registryStatus:{characters:[]},inCombat:false,emergency:false,requiresCrossMapRouting:false,verifyTargetState:()=>true}); assert.equal(result.executed,true); assert.equal(active.R3,undefined); assert.equal(active.P,'code'); assert.ok(party.P); assert.equal(controller.status().smartMoveAllowed,false);
});

test('Alpha12 runtime integrates all Party components while default active bot still grants no Party live authority and Brain stays shadow', () => {
  let now=10000; let trick=0; const storageData={}; const storage={get:(key)=>storageData[key]||null,set:(key,value)=>{storageData[key]=value;}};
  const root={
    character:{name:'Merch',ctype:'merchant',level:70,map:'main',real_x:0,real_y:0,hp:2000,max_hp:2000,mp:1000,max_mp:1000,xp:0,gold:0,items:[],slots:{},speed:40,rip:false},
    parent:{entities:{},party:{R1:{type:'ranger',level:70,map:'main'},R2:{type:'ranger',level:70,map:'main'},R3:{type:'ranger',level:70,map:'main'}}},
    G:{monsters:{goo:{xp:100,hp:100,attack:10,damage_type:'physical'}},maps:{main:{monsters:[{type:'goo',boundary:[100,100,200,200]}]}},skills:{}},
    performance_trick:()=>{trick++;}
  };
  const runtime=new Alpha12Runtime({root,parent:root.parent,mode:'shadow',now:()=>now,visibleStatus:false,storage,partyDecisionMs:2000,characterRoster:[{name:'Merch',ctype:'merchant',level:70,available:true},{name:'R1',ctype:'ranger',level:70,available:true},{name:'R2',ctype:'ranger',level:70,available:true},{name:'R3',ctype:'ranger',level:70,available:true},{name:'P',ctype:'paladin',level:70,online:false,available:true}],partyMerchantName:'Merch'});
  runtime.combatRisk.approveMonsterType(runtime.world,'goo'); runtime.tick(); const shadow=runtime.status(); assert.equal(shadow.version,'3.0.0-alpha.12.0'); assert.equal(shadow.party.mode,'adaptive-orchestrator'); assert.equal(shadow.party.actionAuthority,false); assert.equal(shadow.party.transition.liveEnabled,false); assert.equal(shadow.party.aura.automationEnabled,false); assert.equal(shadow.party.orchestrator.explorationEnabled,false); assert.equal(shadow.brain.mode,'shadow'); assert.equal(shadow.brain.actionAuthority,false); assert.ok(shadow.party.fingerprints.party); assert.ok(shadow.party.fingerprints.encounter); assert.ok(shadow.party.decision); assert.doesNotThrow(()=>JSON.stringify(shadow));
  runtime.setMode('active'); const active=runtime.status(); assert.equal(active.mode,'active'); assert.equal(active.party.actionAuthority,false); assert.equal(active.brain.mode,'shadow'); assert.equal(active.brain.actionAuthority,false); assert.equal(runtime.partyTransitions.status().liveEnabled,false); runtime.backgroundExecution.start(); assert.equal(trick,1);
});

test('2000 Party evaluations stay finite, bounded and explainable', () => {
  let now=1000000; const orchestrator=new PartyOrchestrator({now:()=>now,maxCandidates:32}); const registry={characters:[member('Merch','merchant'),member('R1','ranger'),member('R2','ranger'),member('R3','ranger'),member('P','paladin',{primarySource:'configured',online:false,presence:'OFFLINE',available:true,stateConfidence:.35}),member('Pri','priest',{primarySource:'configured',online:false,presence:'OFFLINE',available:true,stateConfidence:.35})]}; const current=registry.characters.slice(0,4);
  for(let i=0;i<2000;i++){now+=5000; const d=orchestrator.decide({registryStatus:registry,currentMembers:current,encounter:encounter(i%2?'bee':'goo',{hp:1000,attack:100,damage_type:'physical'},'APPROVED'),switchCostSeconds:180}); assert.ok(Number.isFinite(d.projectedGain)); assert.ok(d.top.length<=8);}
  const status=orchestrator.status(); assert.ok(['WOULD_KEEP','WOULD_SWITCH'].includes(status.lastDecision.decision)); assert.doesNotThrow(()=>JSON.stringify(status));
});
