'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { HomePhase, EconomyEquipmentAutonomyV2 } = require('../src/reliability/economy-equipment-autonomy-v2');
const { PersistentMarketHistory } = require('../src/reliability/economy-v2-market-history');
const { AccountItemPool, GlobalGearOptimizer } = require('../src/reliability/economy-v2-planning');

function storage() { const data = new Map(); return { getItem: (k) => data.has(k) ? data.get(k) : null, setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k), data }; }

test('persistent market history derives trend and survives restore', () => {
  let now=1000, quote={fairValue:100,medianAsk:110,maxBid:90,sampleCount:4,confidence:.75,source:'market-spread'}; const root={localStorage:storage()};
  const h=new PersistentMarketHistory({root,oracle:{quote:()=>quote},now:()=>now,saveIntervalMs:5000}); h.observe('ringsj',0); now+=31000; quote={fairValue:125,medianAsk:130,maxBid:120,sampleCount:6,confidence:1,source:'market-spread'}; h.observe('ringsj',0); h.save(true);
  const a=h.analysis('ringsj',0); assert.equal(a.observations,2); assert.equal(Number(a.trendPct.toFixed(2)),.25); assert.ok(a.liquidity>0);
  const restored=new PersistentMarketHistory({root,oracle:{quote:()=>quote},now:()=>now}); assert.equal(restored.analysis('ringsj',0).observations,2);
});

test('global optimizer uses scarce account stock and emits multi-hop route', () => {
  const now=100000, characters=[{name:'My_Merchant',ctype:'merchant',inventory:[]},{name:'My_Ranger1',ctype:'ranger',inventory:[]},{name:'My_Ranger2',ctype:'ranger',inventory:[{index:4,name:'ringsj',level:0,q:1}]},{name:'My_Ranger3',ctype:'ranger',inventory:[{index:7,name:'hpamulet',level:0,q:1}]}];
  const goals=[{id:'g1',character:'My_Ranger1',ctype:'ranger',slot:'ring1',item:'ringsj',observedLevel:0,targetLevel:0,improvement:20,survivalImprovement:2,lastSeenAt:now-1000},{id:'g2',character:'My_Ranger1',ctype:'ranger',slot:'ring1',item:'hpamulet',observedLevel:0,targetLevel:0,improvement:5,survivalImprovement:5,lastSeenAt:now-1000},{id:'g3',character:'My_Ranger3',ctype:'ranger',slot:'amulet',item:'hpamulet',observedLevel:0,targetLevel:0,improvement:10,survivalImprovement:1,lastSeenAt:now-1000}];
  const runtime={now:()=>now,characterRegistry:{status:()=>({characters})},gearProgression:{list:()=>goals},root:{}}; const plan=new GlobalGearOptimizer(runtime,new AccountItemPool(runtime)).plan(); assert.equal(plan.assignments.length,2);
  const ring=plan.assignments.find((x)=>x.item==='ringsj'); assert.equal(ring.character,'My_Ranger1'); assert.equal(ring.route,'SOURCE_TO_MERCHANT_TO_TARGET'); assert.equal(ring.sourceCharacter,'My_Ranger2');
});

test('home service state persists explicit Market phase', () => {
  let now=50000; const localStorage=storage(), character={name:'My_Merchant',ctype:'merchant',map:'main',isize:42,inventory:[]}; const base={cfg:{targetSlots:14,lowSlots:8,compoundCap:500000},tick:()=>false,_need:()=>null,classifyItem:()=>({disposition:'KEEP',reason:'TEST'})};
  const make=()=>({root:{localStorage,character,parent:{character,entities:{}}},now:()=>now,adapter:{mode:'active',getGameData:()=>({items:{}})},merchantEconomyAutonomy:base,marketValueOracle:{quote:()=>({fairValue:null,sampleCount:0,confidence:0,source:'unknown'}),observe:()=>({})},characterRegistry:{status:()=>({characters:[{name:'My_Merchant',ctype:'merchant',inventory:[]}]})},gearProgression:{list:()=>[]}});
  const first=new EconomyEquipmentAutonomyV2(make()); first._transition(HomePhase.MARKET_TRAVEL,'TEST_PERSIST'); const second=new EconomyEquipmentAutonomyV2(make()); assert.equal(second.phase,HomePhase.MARKET_TRAVEL); assert.equal(second.phaseReason,'TEST_PERSIST');
});

test('party need preempts home service then returns toward Town', async () => {
  let now=100000, need={report:{name:'My_Ranger1',map:'main',x:100,y:100},priority:100,reason:'POTIONS_CRITICAL'}, moves=0; const localStorage=storage(), character={name:'My_Merchant',ctype:'merchant',map:'main',x:0,y:0,isize:42,inventory:[]};
  const base={cfg:{targetSlots:14,lowSlots:8,compoundCap:500000},tick:()=>false,_need:()=>need,_move:()=>{moves+=1;return true;},classifyItem:()=>({disposition:'KEEP',reason:'TEST'})};
  const runtime={root:{localStorage,character,parent:{character,entities:{}}},now:()=>now,adapter:{mode:'active',getGameData:()=>({items:{}})},merchantEconomyAutonomy:base,marketValueOracle:{quote:()=>({fairValue:null,sampleCount:0,confidence:0,source:'unknown'}),observe:()=>({})},characterRegistry:{status:()=>({characters:[{name:'My_Merchant',ctype:'merchant',inventory:[]}]})},gearProgression:{list:()=>[]}};
  const v2=new EconomyEquipmentAutonomyV2(runtime); v2.phase=HomePhase.STANDBY; await v2.cycle(); assert.equal(v2.phase,HomePhase.PARTY_SERVICE); assert.equal(moves,1); need=null; now+=1000; await v2.cycle(); assert.equal(v2.phase,HomePhase.TOWN_RETURN);
});
