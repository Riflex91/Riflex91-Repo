#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs');
const bot=fs.readFileSync('bot.js','utf8'),v=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(v.version,'2.14.19');assert.equal(v.dashboardVersion,'2.14.19');
const cm=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);assert(cm);const base=JSON.parse(cm[1].replace(/'/g,'"'));for(const f of ['merchant-route-owner','merchant-capacity-hard-state','merchant-exchange-capacity-gate','merchant-progress-loop-breaker','merchant-bank-state-backoff','merchant-presale-economics','merchant-state-hash-cache','merchant-phase-residual-profile','teacher-availability-circuit-breaker','research-window-telemetry'])assert.ok(bot.includes("'"+f+"'"),'missing '+f);
assert.ok(bot.includes('v21419OptionalBlocked()')&&bot.includes('v2149DiscoveryTick=function(){if(v21419OptionalBlocked())return false')&&bot.includes('v2149GatherTick=function(){if(v21419OptionalBlocked())return false'),'capacity must block discovery/gathering');
assert.ok(bot.includes('v21418MerchantLootBlocked=function(){return v21419LootBlockedBase()')&&bot.includes('v21419CapacityHard()||v21419EconomicLock()'),'active merchant loot capacity/route gate missing');
assert.ok(bot.includes("audit('merchant_exchange_capacity_blocked'")&&bot.includes('if(freeSlots()<reserve)return false'),'exchange capacity gate missing');
assert.ok(bot.includes("v21419RouteAcquire('bank'")&&bot.includes("v21419RouteAcquire('exchange'")&&bot.includes("audit('merchant_route_preempted'"),'route arbiter/preemption missing');
assert.ok(bot.includes('function v21419BankBackoffFingerprint')&&bot.includes('until:clock()+300000')&&bot.includes('b.fingerprint!==fp'),'bank state backoff/reset missing');
assert.ok(bot.includes("audit('merchant_loop_detected'")&&bot.includes("audit('merchant_loop_break'")&&bot.includes('qPreserved:!!character.q')&&!bot.includes('delete character.q'),'loop guard/q preservation missing');
assert.ok(bot.includes("out.decision='unknown';out.reason='missing-reliable-economics'")&&bot.includes("out.reason='non-positive-expected-value'")&&bot.includes("out.decision='execute';out.reason='positive-known-expected-value'"),'presale economics decisions missing');
assert.ok(bot.includes('function v21419Cached')&&bot.includes('row&&row.hash===h')&&bot.includes('inventory:v21419InventoryHash()'),'state hash cache missing');
assert.ok(bot.includes("v21418PhaseAdd('residualOther',res)")&&bot.includes('Math.max(0,total-Math.min(total,instrumented))')&&bot.includes("v21418ProfileWrap('plannerRecipe'"),'profiler planner/residual missing');
assert.ok(bot.includes("b.suppressedReason='missing-cloudflare-config'")&&bot.includes("audit('teacher_call_suppressed'")&&bot.includes('waits=[60000,120000,300000,900000]'),'teacher circuit breaker missing');
assert.ok(bot.includes("if(z[k]===0&&(!z.samples||Number(z.samples)<=0))z[k]=null")&&bot.includes('measurementStartAt:start')&&bot.includes('sourceCharacter:String(me)'),'research missing/null window telemetry missing');
console.log('2.14.19 stability smoke OK');
