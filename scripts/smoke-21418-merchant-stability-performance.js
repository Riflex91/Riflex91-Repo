#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs');
const bot=fs.readFileSync('bot.js','utf8'),version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.20');assert.equal(version.dashboardVersion,'2.14.20');
const cm=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);assert(cm);const contract=JSON.parse(cm[1].replace(/'/g,'"'));
for(const f of ['merchant-exchange-route-flight-lock','merchant-loot-flight-gate','merchant-capacity-blocked-state','config-control-write-dedupe','merchant-phase-profiler'])assert.ok(contract.includes(f),'missing feature '+f);
assert.ok(bot.includes('S.exchangeRouteFlight21418')&&bot.includes("smart_move('exchange')")&&bot.includes("if(flight&&flight.active)"),'exchange route lock missing');
assert.ok(bot.includes('function v21418MerchantLootBlocked')&&bot.includes('if(S.lootFlight21418)return true')&&bot.includes('function v21418GuardedLoot')&&bot.includes('!v21418MerchantLootBlocked()'),'loot flight gate missing');
const capStart=bot.indexOf('v290InventoryPressureTick=function(){',bot.indexOf('function v21418GuardedLoot'));const cap=bot.slice(capStart,bot.indexOf('function v21418ConfigProvenance',capStart));
assert.ok(cap.includes('S.capacityBlocked21418')&&cap.includes('blocked.retryAt=now+15000')&&cap.includes('merchant_capacity_blocked'),'capacity retry state missing');
assert.ok(!cap.includes('v273CompoundTick()'),'capacity mode must not compound recursively');
assert.ok(bot.includes('S.inputSaveTimers21418')&&bot.includes('},450)')&&bot.includes('if(sameJSON(before,C[key]))return false'),'config debounce/dedupe missing');
const prov=bot.slice(bot.indexOf('function v21418ConfigProvenance'),bot.indexOf('function v21418PhaseState'));
assert.ok(prov.includes('sourceAt:chosen21417?Number(chosen21417.at||0):0'),'config provenance missing');
for(const secret of ['webDashboardWriteKey','WRITE_KEY','API_KEY'])assert.ok(!prov.includes(secret),'secret leaked in config provenance');
for(const phase of ['inventory','plannerRecipe','service','movement','bank','economy','dashboard','audit'])assert.ok(bot.includes("v21418ProfileWrap('"+phase+"'"),'phase missing '+phase);
assert.ok(bot.includes("audit('merchant_phase_profile'")&&bot.includes('phases:phases,sizes:sizes'),'phase payload missing');
console.log('2.14.20 Merchant stability / performance smoke OK');
