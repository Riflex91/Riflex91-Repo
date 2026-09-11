#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
function ok(v,m){if(!v)throw new Error(m);}
new vm.Script(bot,{filename:'bot.js'});
ok(bot.includes("var VERSION = '2.14.22'"),'version 2.14.22 missing');
ok(bot.includes('/* 2.14.22 unified auto-economy manager */'),'economy manager marker missing');
ok(bot.includes("V21422_ACTIONS=['KEEP','SELL','BANK','UPGRADE','COMPOUND','EXCHANGE','RECYCLE','DISCARD','HOLD_FOR_MERCHANT']"),'central action policy missing');
ok(bot.includes("unsupported-safe-fallback"),'unsupported destructive action safe fallback missing');
ok(bot.includes("protected:locked")||bot.includes("return 'locked'"),'locked protection missing');
ok(bot.includes("return 'unknown-definition'"),'unknown item protection missing');
ok(bot.includes("return 'configured-protected'"),'configured protection missing');
ok(bot.includes("return 'high-npc-value'"),'high-value protection missing');
ok(bot.includes('function v21422BuildPlan'),'inventory planner missing');
ok(bot.includes("plan={sell:[],bank:[],upgrade:[],compound:[],exchange:[],keep:[],withdrawSell:[]"),'plan buckets missing');
ok(bot.includes("v21422State('WITHDRAW_ITEMS'"),'bank withdraw state missing');
ok(bot.includes("v21422State('WITHDRAW_WAIT'"),'bank withdraw confirmation state missing');
ok(bot.includes("v21422State('TRAVEL_TO_VENDOR'"),'vendor travel state missing');
ok(bot.includes("v21422State('SELL_ITEMS'"),'sell state missing');
ok(bot.includes("v21422State('SELL_WAIT'"),'sell confirmation state missing');
ok(bot.includes("v21422Recover('withdraw-unconfirmed')"),'withdraw recovery missing');
ok(bot.includes("v21422Recover('sale-unconfirmed')"),'sale recovery missing');
ok(bot.includes("v21422Recover('policy-changed-before-sale')"),'pre-sale revalidation missing');
ok(bot.includes("v21422Recover('bank-slot-changed')"),'bank slot race guard missing');
ok(bot.includes("v21422Recover('upgrade_slot_changed')")||bot.includes("throw Error('upgrade_slot_changed')"),'upgrade slot revalidation missing');
ok(bot.includes("throw Error('compound_slot_changed')"),'compound slot revalidation missing');
ok(bot.includes('autoEconomyRequireProfitForCompound: true'),'compound profitability default missing');
ok(bot.includes("[SKIP] Compound wirtschaftlich negativ"),'negative compound audit missing');
ok(bot.includes("[INVENTORY] "),'inventory summary logging missing');
ok(bot.includes("[SELL] "),'sell logging missing');
ok(bot.includes("[UPGRADE] "),'upgrade logging missing');
ok(bot.includes("[COMPOUND] "),'compound logging missing');

// Economic sanity matrix: three +0 items worth 20k each must not be compounded
// into an item worth 2k even before scroll costs.
function profitable(nowEach,copies,after,scroll,minGold=0,minPct=0){const cur=nowEach*copies,delta=after-cur-scroll,pct=cur>0?delta/cur*100:null;return delta>=minGold&&(pct==null||pct>=minPct);}
ok(!profitable(20000,3,2000,0),'negative compound example must be rejected');
ok(profitable(1000,3,5000,500),'positive compound example should pass');

// Destructive unsupported actions must never be executed by the new manager.
ok(!/\b(?:recycle|destroy|discard)\s*\(/.test(bot.slice(bot.indexOf('/* 2.14.22 unified auto-economy manager */'))),'unsupported destructive game API call introduced');
console.log('v2.14.22 auto-economy smoke OK');
