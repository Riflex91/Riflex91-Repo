#!/usr/bin/env node
"use strict";
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
const start=bot.indexOf('function v212DiarySanitize');
const end=bot.indexOf('var v212AuditBase',start);
assert.ok(start>0&&end>start,'Brain Diary core block not found');
const code=bot.slice(start,end);
const store={};
const context={console,Math,Date,isFinite,
  clock:()=>Date.now(),safeString:(x,n)=>String(x==null?'':x).slice(0,n||500),v210Round:(n,p=5)=>Math.round((Number(n)||0)*10**p)/10**p,
  v210Hash:text=>{let h=2166136261;for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;},
  v210UtcDay:()=>new Date().toISOString().slice(0,10),read:(k,f)=>k in store?store[k]:f,write:(k,v)=>{store[k]=JSON.parse(JSON.stringify(v));return true;},
  C:{brainDiaryEnabled:true,brainDiaryMaxEntries:3},S:{brainStudent:{samples:10},brain:{outcomes:4},brainLeague:{promotions:1,rollbacks:0}}
};
vm.createContext(context);vm.runInContext(code,context,{filename:'diary-extract.js'});
context.v212DiaryFromAudit('brain_decision','teacher',{decision:{action:'explore',lesson:'Explore safe novel states.',reason:'novel'},neurons:12},null,{data:{seq:1}});
context.v212DiaryFromAudit('brain_outcome','outcome',{action:'explore',target:'main',source:'teacher',reward:.42,before:{xp:1000,gold:200,safety:70,free:3},after:{xp:1400,gold:250,safety:82,free:6}},null,{data:{seq:2}});
context.v212DiaryFromAudit('brain_champion_rollback','rollback',{fromGeneration:3,toGeneration:2,reason:'reward fell'},null,{data:{seq:3}});
assert.equal(context.S.brainDiary.length,3);
assert.equal(context.S.brainDiary[0].kind,'teacher');
assert.equal(context.S.brainDiary[1].reward,.42);
assert.equal(context.S.brainDiary[2].kind,'rollback');
context.v212DiaryAdd('extra','Extra','bounded',{tone:'neutral'});
assert.equal(context.S.brainDiary.length,3,'Diary ring limit failed');
assert.equal(context.S.brainDiary.at(-1).title,'Extra');
assert.ok(store.brainDiaryV212,'Diary was not persisted');
console.log('Brain Diary smoke OK · teacher lesson · outcome · rollback · bounded persistence');
