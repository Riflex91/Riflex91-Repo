#!/usr/bin/env node
"use strict";
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
const start=bot.indexOf('function v213QualityNew');
const end=bot.indexOf('var v213RecordOutcomeBase',start);
assert.ok(start>0&&end>start,'Learning Quality Monitor block not found');
const code=bot.slice(start,end);
let now=Date.now();
const store={};
const mkModel=(bias=0)=>({schema:2,inputSize:32,hiddenSize:24,outputSize:5,w1:Array(768).fill(0),b1:Array(24).fill(0),w2:Array(120).fill(0),b2:[bias,0,0,0,0],samples:120,updates:500,lossEma:.7,rewardEma:.2,agreementEma:.75,outcomes:40,lastTrainAt:now,lastTeacherAt:now,updatedAt:now});
const context={console,Math,Date,isFinite,
  clock:()=>now,clamp:(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)),safeString:(x,n)=>String(x==null?'':x).slice(0,n||500),
  v210Round:(n,p=5)=>Math.round((Number(n)||0)*10**p)/10**p,
  v210StudentValid:m=>!!(m&&m.schema===2&&m.inputSize===32&&m.hiddenSize===24&&m.outputSize===5&&m.w1?.length===768&&m.b1?.length===24&&m.w2?.length===120&&m.b2?.length===5),
  v211CloneModel:m=>JSON.parse(JSON.stringify(m)),v211SetEvent:(k,r)=>{context.S.brainLeague.lastEvent=k;context.S.brainLeague.lastReason=r;},v211PostLeagueEvent:()=>{},
  v211RejectCandidate:r=>{context.S.brainLeague.challenge.active=false;context.S.brainLeague.candidate=null;context.S.brainLeague.status='champion';context.S.brainLeague.rejections++;},
  v211Rollback:r=>{if(!context.S.brainLeague.previousChampion)return false;context.S.brainLeague.champion=context.S.brainLeague.previousChampion;context.S.brainLeague.generation=context.S.brainLeague.previousGeneration;context.S.brainLeague.previousChampion=null;context.S.brainLeague.probation.active=false;context.S.brainLeague.status='champion';context.S.brainLeague.rollbacks++;return true;},
  audit:()=>{},v212DiaryAdd:()=>{},reason:e=>String(e&&e.message||e),read:(k,f)=>k in store?store[k]:f,write:(k,v)=>{store[k]=JSON.parse(JSON.stringify(v));return true;},
  C:{brainQualityMonitorEnabled:true,brainQualityWindow:16,brainQualityMinOutcomes:8,brainQualityOverconfidencePct:88,brainQualityRewardDropPct:15,brainQualityCooldownMinutes:20},
  S:{brainStudent:mkModel(),brainLeague:{status:'champion',generation:1,champion:mkModel(),previousChampion:null,previousGeneration:0,previousRewardEma:0,candidate:null,candidateGeneration:0,challenge:{active:false},probation:{active:false},rollbacks:0,rejections:0,championRewardEma:.2}}
};
vm.createContext(context);vm.runInContext(code,context,{filename:'quality-extract.js'});
const before={rip:false,partyComplete:true,safety:80},safeAfter={rip:false,partyComplete:true,safety:82};
for(let i=0;i<8;i++){context.v213QualityObserve({confidence:.82,source:'teacher',policyRole:'champion',policyGeneration:1},.28,before,safeAfter);now+=1000;}
let q=context.v213QualitySummary();
assert.equal(q.status,'healthy');assert.ok(q.score>=80);assert.equal(q.healthyGeneration,1);assert.equal(q.autonomyAllowed,true);
// Simulate a newer Champion becoming confidently wrong. The monitor should quarantine and restore healthy #1.
context.S.brainLeague.champion=mkModel(2);context.S.brainLeague.generation=2;context.S.brainLeague.status='champion';
assert.equal(context.v213QualitySnapshotHealthy(),false,'fresh Champion replaced healthy rollback snapshot too early');assert.equal(context.S.brainQuality.healthyGeneration,1);
context.S.brainStudent.lossEma=1.3;
for(let i=0;i<6;i++){context.v213QualityObserve({confidence:.96,source:'student',policyRole:'champion',policyGeneration:2},-.55,before,safeAfter);now+=1000;}
q=context.v213QualitySummary();
assert.ok(['degraded','quarantine'].includes(q.status));assert.ok(q.overconfidenceFailureRate>=.5);assert.ok(q.teacherBoost>1);assert.ok(q.learningRateScale<1);assert.equal(q.autonomyAllowed,false);
assert.equal(context.S.brainLeague.generation,1,'last healthy Champion was not restored');
assert.ok(context.S.brainLeague.rollbacks>=1);
assert.ok(store.brainQualityV213,'quality state not persisted');
console.log(`Learning Quality smoke OK · ${q.status} · score ${q.score}/100 · teacher ×${q.teacherBoost} · LR ×${q.learningRateScale} · rollback to Champion #${context.S.brainLeague.generation}`);
