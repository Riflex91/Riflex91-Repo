#!/usr/bin/env node
"use strict";
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
const start=bot.indexOf('var V214_RESEARCH_PROFILES');
const end=bot.indexOf('var v214StudentExportBase',start);
assert.ok(start>0&&end>start,'Research Bridge core block not found');
const code=bot.slice(start,end);
const now=Date.now(),store={};
const C={brainResearchProfile:'development',brainResearchHours:24,brainResearchMaxHighlights:20,brainResearchAnonymize:true,webDashboardWriteKey:'SUPER_SECRET_WRITE',brainDiaryEnabled:true};
const S={auditRecent:[
  {at:now-1000,kind:'action_error',level:'error',message:'Merchant scroll buy failed WRITE_KEY=SUPER_SECRET_WRITE',data:{errorClass:'inventory_full'}},
  {at:now-900,kind:'action_error',level:'error',message:'Merchant scroll buy failed WRITE_KEY=SUPER_SECRET_WRITE',data:{errorClass:'inventory_full'}}
],brainDiary:[
  {at:now-5000,kind:'teacher',tone:'learn',title:'Teacher-Lektion',detail:'My_Merchant should explore safely',action:'explore',target:'main'},
  {at:now-4000,kind:'outcome',tone:'good',title:'Strategie bestätigt',detail:'EXP/h improved',action:'explore',target:'main',reward:.62},
  {at:now-3000,kind:'rollback',tone:'bad',title:'Automatischer Rollback',detail:'Champion degraded',reward:-.9,generation:2}
],
  farmHealth:{safetyPct:88,visible:5,competitors:1},status:'Merchant arbeitet',mode:'Merchant · Explore',goal:{map:'main',monster:'bee'},merchantPlan:{steps:['Besuche My_Ranger1','Bank prüfen'],farmOrder:null},
  brainStudent:{samples:200,updates:500,lossEma:.4,rewardEma:.2,agreementEma:.8},brain:{outcomes:30},brainLeague:{}
};
const learning={schema:1,updatedAt:now,monsters:{bee:{kills:120,lootEvents:10,gold:5000,lastAt:now}},zones:{'main|bee':{samples:45,xpPerHour:123456,goldPerHour:2222,safetyPct:88,lastAt:now}}};
const context={console,Math,Date,isFinite,JSON,VERSION:'2.14.2',BUILD:'2026-09-10',
  C,S,ACCOUNT_CHARS:[{name:'My_Merchant',ctype:'merchant'},{name:'My_Ranger1',ctype:'ranger'},{name:'My_Ranger2',ctype:'ranger'}],me:'My_Merchant',character:{ctype:'merchant',level:70,map:'main',items:Array(42).fill(null)},
  clock:()=>now,clamp:(n,a,b)=>Math.max(a,Math.min(b,Number(n))),safeString:(v,n)=>String(v==null?'':v).slice(0,n||500),
  v210Round:(n,p=5)=>Math.round((Number(n)||0)*10**p)/10**p,v290CompactLearning:()=>learning,
  v273RateStats:()=>({xpPerHour:123456,goldPerHour:2222,xpGain:9999,goldGain:888}),partyState:()=>({members:['My_Merchant','My_Ranger1','My_Ranger2'],missing:['My_Ranger3'],complete:false}),freeSlots:()=>7,
  v210BrainTelemetry:()=>({usedToday:9500,limit:10000,target:9950,teacherRequests:600,avgNeurons:15,outcomes:30,student:{confidence:.91,entropy:.2}}),
  v213QualitySummary:()=>({status:'healthy',score:92,recentReward:.2,overconfidenceFailureRate:.05}),v211LeagueSummary:()=>({status:'champion',generation:2,hasChampion:true}),
  P:{navigator:{}},HEADLESS:true,gameMessage:()=>{},audit:()=>{},uiRoot:null,esc:x=>String(x)
};
vm.createContext(context);vm.runInContext(code,context,{filename:'research-extract.js'});
const data=context.v214ResearchData('development',24,true);
assert.equal(data.bot.character,'Merchant');
assert.equal(data.party.members[1],'Farmer1');
assert.equal(data.repeatedErrors[0].count,2);
assert.equal(data.highlights[0].kind,'rollback');
const prompt=context.v214ResearchPrompt('development',24,true);
assert.ok(prompt.includes('AiO Research Bridge · Entwicklungsbrief'));
assert.ok(prompt.includes('Strukturierte Bot-Daten'));
assert.ok(prompt.includes('Merchant'));
assert.ok(!prompt.includes('My_Merchant'));
assert.ok(!prompt.includes('My_Ranger1'));
assert.ok(!prompt.includes('SUPER_SECRET_WRITE'));
assert.ok(prompt.includes('[REDACTED]'));
const err=context.v214ResearchPrompt('errors',12,true);
assert.ok(err.includes('Fehleranalyse'));
assert.ok(err.includes('inventory_full'));
console.log('Research Bridge smoke OK · profiles · relevance · anonymization · secret redaction · structured prompt');
