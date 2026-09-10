#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
assert.match(bot,/var VERSION = ['"]2\.15\.0['"]/);
assert.ok(bot.includes('gold>=trigger'));
assert.ok(bot.includes('serviceTrigger:trigger'));
assert.ok(bot.includes("'loot-gold',5000"));
assert.ok(bot.includes('recentlyServiced=age<gap'));
assert.ok(bot.includes('freeUrgent=freeNeed&&!recentlyServiced'));
assert.ok(bot.includes("S.times['cmAudit:'+name]=clock()+15000"));
assert.ok(bot.includes("audit('merchant_watchdog'"));
assert.ok(bot.includes("/^partyRequest:/.test(String(key))")&&bot.includes('clock()+15000'));
assert.ok(bot.includes('S.inventoryPressureBusy'),'inventory-pressure re-entry guard missing');
assert.ok(!bot.includes("S.mode='Merchant · Inventar';v290InventoryPressureTick();return -1;"),'recursive inventory-pressure call must be removed');
assert.ok(bot.includes("merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;"),'inventory pressure must run before compound');
assert.ok(bot.includes("/^c?scroll[0-4]$/.test(String(it.name||''))"),'operational scrolls must never be bank-cleanup trash');
assert.ok(bot.includes('dist(character,dest)>180'),'scroll buys must wait for conservative vendor range');
assert.ok(bot.includes('function v2144SellDecision'),'economic sell policy missing');
const sellOverridePos=bot.lastIndexOf("v273SellTrashTick=function(){");
assert.ok(sellOverridePos>=0,'2.14.8 NPC sell override missing');
const sellOverride=bot.slice(sellOverridePos,bot.indexOf("\n  };",sellOverridePos)+5);
assert.ok(!sellOverride.includes('!S.bankFull'),'latest NPC sell override must not require a full bank');
assert.ok(bot.includes("upgrade-bank-exit")&&bot.includes("compound-bank-exit"),'bank guards for upgrade/compound missing');
assert.ok(bot.includes("party_realm_mismatch")&&bot.includes("v2144PartyRealmGuard"),'party realm mismatch guard missing');
assert.ok(bot.includes(".mainbox.collapsed .body{display:none!important}")&&bot.includes("min-height:0!important"),'collapsed GUI body/min-height fix missing');
function goldTransfer(gold,keep,threshold){const trigger=Math.max(keep,threshold);return gold>=trigger?Math.max(0,gold-keep):0;}
assert.equal(goldTransfer(8814,5000,25000),0);
assert.equal(goldTransfer(24999,5000,25000),0);
assert.equal(goldTransfer(25000,5000,25000),20000);
function serviceFlags({age,gap=90000,free=0,pot=false,gold=0,trigger=25000}){const recentlyServiced=age<gap,freeNeed=free<=12,goldNeed=gold>=trigger,freeUrgent=freeNeed&&!recentlyServiced;return {urgent:pot||goldNeed||freeUrgent};}
assert.equal(serviceFlags({age:5000,free:0}).urgent,false);
assert.equal(serviceFlags({age:5000,free:0,pot:true}).urgent,true);
assert.equal(serviceFlags({age:100000,free:0}).urgent,true);
console.log('Merchant stability smoke OK');
