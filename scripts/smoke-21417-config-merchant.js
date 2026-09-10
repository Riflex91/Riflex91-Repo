#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.17');
assert.equal(version.dashboardVersion,'2.14.17');
for(const f of ['config-newest-valid-source','merchant-economic-action-flight-guard','merchant-bank-retrieve-travel-lease','merchant-vendor-range-guard'])assert.ok(bot.includes("'"+f+"'"),'missing feature '+f);
function extract(name){const start=bot.indexOf('function '+name+'(');assert.ok(start>=0,'missing '+name);let i=bot.indexOf('{',start),depth=0;for(;i<bot.length;i++){if(bot[i]==='{')depth++;else if(bot[i]==='}'&&--depth===0)return bot.slice(start,i+1);}throw Error('unterminated '+name);}
const ctx={};vm.createContext(ctx);vm.runInContext(extract('v21417PickConfig')+';this.pick=v21417PickConfig;',ctx);
let pick=ctx.pick([{source:'current',priority:3,at:100,config:{language:'en'}},{source:'stable-mirror',priority:2,at:200,config:{language:'de'}},{source:'update-backup',priority:1,at:150,config:{language:'fr'}}]);
assert.equal(pick.source,'stable-mirror','newer stable config must beat stale current namespace');
pick=ctx.pick([{source:'current',priority:3,at:300,config:{x:1}},{source:'stable-mirror',priority:2,at:200,config:{x:2}}]);assert.equal(pick.source,'current');
pick=ctx.pick([{source:'current',priority:3,at:300,config:{x:1}},{source:'stable-mirror',priority:2,at:300,config:{x:2}}]);assert.equal(pick.source,'current','equal timestamp must deterministically prefer current namespace');
vm.runInContext(extract('v21417EconomicFlightKind')+';this.flight=v21417EconomicFlightKind;',ctx);assert.equal(ctx.flight({upgrade:{}}),'upgrade');assert.equal(ctx.flight({compound:{}}),'compound');assert.equal(ctx.flight({exchange:{}}),'exchange');assert.equal(ctx.flight({craft:{}}),'craft');assert.equal(ctx.flight({}),'');
const bank=extract('v2149BankRetrieveTick');assert.ok(bank.indexOf('if(!v2149BankMap())')<bank.indexOf('merchant_bank_retrieve_timeout'),'travel branch must precede timeout');assert.ok(bank.includes('st.leaseAt=0')&&bank.includes('if(!Number(st.leaseAt||0))st.leaseAt=now'));
assert.ok(bot.includes("smart_move('exchange')"),'exchange must route to documented exchange target');assert.ok(bot.includes("kind:'merchant-upgrade-vendor',tolerance:60"),'upgrade vendor settle guard missing');assert.ok(bot.includes(">90||character.moving||S.moveInFlight")&&bot.includes("kind:'supply-buy',tolerance:60"),'potion vendor settle guard missing');
console.log('2.14.17 config precedence / Merchant serialization smoke OK');
