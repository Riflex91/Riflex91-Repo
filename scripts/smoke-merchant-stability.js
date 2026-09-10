#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
assert.match(bot,/var VERSION = ['"]2\.14\.1['"]/);
assert.ok(bot.includes('gold>=trigger'));
assert.ok(bot.includes('serviceTrigger:trigger'));
assert.ok(bot.includes("'loot-gold',5000"));
assert.ok(bot.includes('recentlyServiced=age<gap'));
assert.ok(bot.includes('freeUrgent=freeNeed&&!recentlyServiced'));
assert.ok(bot.includes("S.times['cmAudit:'+name]=clock()+15000"));
assert.ok(bot.includes("audit('merchant_watchdog'"));
assert.ok(bot.includes("/^partyRequest:/.test(String(key))")&&bot.includes('clock()+15000'));
function goldTransfer(gold,keep,threshold){const trigger=Math.max(keep,threshold);return gold>=trigger?Math.max(0,gold-keep):0;}
assert.equal(goldTransfer(8814,5000,25000),0);
assert.equal(goldTransfer(24999,5000,25000),0);
assert.equal(goldTransfer(25000,5000,25000),20000);
function serviceFlags({age,gap=90000,free=0,pot=false,gold=0,trigger=25000}){const recentlyServiced=age<gap,freeNeed=free<=12,goldNeed=gold>=trigger,freeUrgent=freeNeed&&!recentlyServiced;return {urgent:pot||goldNeed||freeUrgent};}
assert.equal(serviceFlags({age:5000,free:0}).urgent,false);
assert.equal(serviceFlags({age:5000,free:0,pot:true}).urgent,true);
assert.equal(serviceFlags({age:100000,free:0}).urgent,true);
console.log('Merchant stability smoke OK');
