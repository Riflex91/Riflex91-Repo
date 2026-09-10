#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
assert.match(bot,/var VERSION = ['"]2\.14\.6['"]/);
assert.ok(bot.includes('netNpcDelta'),'upgrade/compound economics must compare projected NPC value with input + scroll cost');
assert.ok(bot.includes('empiricalDropRate'),'Merchant economy must consider learned drop frequency');
assert.ok(bot.includes('recipeUses'),'Merchant economy must reserve crafting inputs');
assert.ok(bot.includes("drop.rare")&&bot.includes('rare-drop-reserve'),'rare drops must receive an explicit reserve');
assert.ok(bot.includes("v2144FindSellCandidate())return false"),'safe sell candidates must not be banked first under inventory pressure');
assert.ok(bot.includes("if(v2144InBank())")&&bot.includes("upgrade-bank-exit")&&bot.includes("compound-bank-exit"),'upgrade/compound must leave the bank first');
assert.ok(bot.includes("r.realm={region:realm.region,id:realm.id,pvp:!!realm.pvp}"),'peer reports must publish realm');
assert.ok(bot.includes("counts[x.key]=(counts[x.key]||0)+1"),'party realm repair must use group consensus counts');
assert.ok(bot.includes("snap.known<Math.min(3,snap.total)"),'realm switching must wait for enough fresh peer reports');
assert.ok(bot.includes("autoFarmPvPConfirmed")&&bot.includes("party_realm_switch_blocked"),'automatic party alignment must not enter unconfirmed PvP');
assert.ok(bot.includes(".mainbox.collapsed .body{display:none!important}"),'collapsed GUI must hide the whole body');
assert.ok(bot.includes(".mainbox.collapsed{height:auto!important;min-height:0!important}"),'collapsed GUI must remove its minimum height');
function consensus(rows,leader){const counts={};for(const r of rows)counts[r.key]=(counts[r.key]||0)+1;const lk=(rows.find(r=>r.name===leader)||{}).key||'';return Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||(a===lk?-1:b===lk?1:a.localeCompare(b)))[0];}
assert.equal(consensus([{name:'Farmer1',key:'EU|I'},{name:'Farmer2',key:'EU|I'},{name:'Farmer3',key:'EU|I'},{name:'Merchant',key:'EU|II'}],'Merchant'),'EU|I','3-vs-1 split must choose the farmers majority realm');
assert.equal(consensus([{name:'Farmer1',key:'EU|I'},{name:'Farmer2',key:'EU|I'},{name:'Farmer3',key:'EU|II'},{name:'Merchant',key:'EU|II'}],'Merchant'),'EU|II','2-vs-2 tie must prefer canonical leader realm');
console.log('2.14.6 Merchant economy / party realm / GUI smoke OK');
