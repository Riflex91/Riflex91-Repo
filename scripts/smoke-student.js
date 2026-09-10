#!/usr/bin/env node
"use strict";
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
const start=bot.indexOf("var V210_ACTIONS=['continue'");
const end=bot.indexOf('function v210ReplayAdd',start);
assert.ok(start>0&&end>start,'Student NN block not found');
const code=bot.slice(start,end);
const context={
  console,Math,Date,isFinite,
  clamp:(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)),
  clock:()=>Date.now(),
  v213QualityLearningRateScale:()=>1,
  read:(_k,f)=>f,
  S:{brain:{},auditRecent:[],actionFailures:{},explorer:{}},
  C:{brainReplaySize:512,brainStudentLearningRate:.012}
};
vm.createContext(context);vm.runInContext(code,context,{filename:'student-extract.js'});
assert.equal(context.S.brainStudent.inputSize,32);assert.equal(context.S.brainStudent.hiddenSize,24);assert.equal(context.S.brainStudent.outputSize,5);
const x=Array(32).fill(.25), target=[0,0,0,1,0];
const before=context.v210Forward(x).p[3];
for(let i=0;i<300;i++)context.v210TrainOne({x,target,weight:1});
const after=context.v210Forward(x).p[3];
assert.ok(after>before,'training did not improve target probability');
assert.ok(after>.75,`target probability remained too low: ${after}`);
assert.equal(context.S.brainStudent.updates,300);
assert.ok(Number.isFinite(context.S.brainStudent.lossEma));
console.log(`Student NN smoke OK · explore probability ${before.toFixed(3)} → ${after.toFixed(3)} · 300 updates`);
