#!/usr/bin/env node
"use strict";
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
const start=bot.indexOf('function v211CloneModel');
const end=bot.indexOf('var v211StudentExportBase',start);
assert.ok(start>0&&end>start,'Brain League block not found');
const code=bot.slice(start,end);
const mkModel=()=>({schema:2,inputSize:32,hiddenSize:24,outputSize:5,w1:Array(768).fill(0),b1:Array(24).fill(0),w2:Array(120).fill(0),b2:Array(5).fill(0),samples:100,updates:120,lossEma:1,rewardEma:.1,agreementEma:.75,outcomes:20,lastTrainAt:Date.now(),lastTeacherAt:Date.now(),updatedAt:Date.now()});
const replay=Array.from({length:40},()=>({x:Array(32).fill(.2),target:[0,0,0,1,0],weight:1,reward:.1}));
const context={console,Math,Date,isFinite,Promise,
  V210_ACTIONS:['continue','change_farm_target','replan_merchant','explore','wait'],V210_INPUTS:32,V210_HIDDEN:24,V210_OUTPUTS:5,
  clamp:(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)),clock:()=>Date.now(),safeString:(x,n)=>String(x||'').slice(0,n||500),
  v210Round:(n,p=5)=>Math.round((Number(n)||0)*10**p)/10**p,
  v210StudentValid:m=>!!(m&&m.schema===2&&m.inputSize===32&&m.hiddenSize===24&&m.outputSize===5&&m.w1?.length===768&&m.b1?.length===24&&m.w2?.length===120&&m.b2?.length===5),
  v210Softmax:logits=>{const mx=Math.max(...logits),e=logits.map(v=>Math.exp(v-mx)),s=e.reduce((a,b)=>a+b,0)||1;return e.map(v=>v/s);},
  v210NormalizeTarget:a=>{const x=(a||[]).slice(0,5).map(v=>Math.max(0,Number(v)||0));while(x.length<5)x.push(0);let s=x.reduce((a,b)=>a+b,0);if(!s){x[0]=1;s=1;}return x.map(v=>v/s);},
  v210Features:()=>Array(32).fill(.2),v210StudentPromoted:()=>true,v210TargetFromDecision:()=>[.2,.2,.2,.2,.2],v213QualityCanChallenge:()=>true,v213QualityAutonomyAllowed:()=>true,v213QualityCanaryAllowed:()=>true,v213QualityConfidenceBoostPct:()=>0,
  autoGoal:()=>({monster:'goo'}),v290Fetch:()=>Promise.resolve({ok:true}),v290ApplyBrainDecision:()=>true,audit:()=>{},write:()=>true,read:()=>null,
  C:{brainLeagueEnabled:true,brainStudentEnabled:true,brainChallengeMinOutcomes:4,brainChallengerTrafficPct:20,brainRollbackRewardDropPct:5,brainStudentConfidencePct:82,brainOutcomeSeconds:180},
  S:{brainStudent:mkModel(),brainReplay:replay,brain:{outcomes:20,lastStudentAt:0,lastDecision:null,lastAt:0},brainPending:[]}
};
vm.createContext(context);vm.runInContext(code,context,{filename:'league-extract.js'});
// First stable shadow becomes Champion #1.
assert.equal(context.v211MaybeStartChallenge(),true);
assert.equal(context.S.brainLeague.generation,1);
assert.equal(context.S.brainLeague.status,'champion');
const firstChampion=JSON.stringify(context.S.brainLeague.champion.b2);
// Training Student improves dramatically on replay target 'explore'. Champion stays frozen.
context.S.brainStudent.b2[3]=4.5;context.S.brainStudent.updates=260;context.S.brainStudent.updatedAt=Date.now()+1;
assert.equal(JSON.stringify(context.S.brainLeague.champion.b2),firstChampion,'Champion mutated with Student');
assert.equal(context.v211MaybeStartChallenge(),true);
assert.equal(context.S.brainLeague.challenge.active,true);
assert.ok(context.S.brainLeague.challenge.challengerLoss<context.S.brainLeague.challenge.championLoss);
const safeBefore={rip:false,safety:80},safeAfter={rip:false,safety:82};
// Champion baseline then stronger Challenger outcomes -> promotion to probation.
for(let i=0;i<3;i++)context.v211RecordOutcome({policyRole:'champion'},.10,safeBefore,safeAfter);
for(let i=0;i<4;i++)context.v211RecordOutcome({policyRole:'challenger'},.35,safeBefore,safeAfter);
assert.equal(context.S.brainLeague.status,'probation');
assert.equal(context.S.brainLeague.generation,2);
assert.ok(context.S.brainLeague.previousChampion,'previous Champion snapshot missing');
// Poor probation rewards trigger automatic rollback.
for(let i=0;i<4;i++)context.v211RecordOutcome({policyRole:'probation'},-.25,safeBefore,safeAfter);
assert.equal(context.S.brainLeague.status,'champion');
assert.equal(context.S.brainLeague.generation,1);
assert.equal(context.S.brainLeague.rollbacks,1);
assert.equal(context.S.brainLeague.previousChampion,null);
console.log('Brain League smoke OK · frozen Champion · canary promotion · probation rollback');
