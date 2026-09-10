#!/usr/bin/env node
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

class FakeDB {
  constructor(){this.state=new Map();this.usage=new Map();this.decisions=[];this.events=[];this.status=new Map();this.ids={d:0,e:0};}
  prepare(sql){return new Stmt(this,sql);}
}
class Stmt {
  constructor(db,sql){this.db=db;this.sql=String(sql).replace(/\s+/g,' ').trim();this.args=[];}
  bind(...args){this.args=args;return this;}
  async run(){const q=this.sql,d=this.db,a=this.args;
    if(q.startsWith('CREATE TABLE')||q.startsWith('CREATE INDEX'))return {success:true};
    if(q.startsWith('INSERT INTO character_status')){d.status.set(a[0],{name:a[0],payload:a[1],received_at:a[2]});return {success:true};}
    if(q.startsWith('INSERT INTO aio_state')){d.state.set(a[0]+'|'+a[1],{account:a[0],namespace:a[1],payload:a[2],updated_at:a[3]});return {success:true};}
    if(q.startsWith('INSERT INTO brain_usage')){const old=d.usage.get(a[0])||{day:a[0],neurons:0,requests:0,updated_at:0};old.neurons+=Number(a[1])||0;old.requests+=1;old.updated_at=a[2];d.usage.set(a[0],old);return {success:true};}
    if(q.startsWith('INSERT INTO brain_decisions')){d.decisions.push({id:++d.ids.d,account:a[0],character:a[1],trigger:a[2],decision:a[3],neurons:a[4],created_at:a[5]});return {success:true};}
    if(q.startsWith('INSERT INTO brain_learning_events')){d.events.push({id:++d.ids.e,account:a[0],character:a[1],event_type:a[2],action:a[3],target:a[4],reward:a[5],payload:a[6],created_at:a[7]});return {success:true};}
    throw new Error('Unhandled run SQL: '+q);
  }
  async first(){const q=this.sql,d=this.db,a=this.args;
    if(q.startsWith('SELECT neurons,requests FROM brain_usage WHERE day=?'))return d.usage.get(a[0])||null;
    if(q.startsWith('SELECT neurons,requests,updated_at FROM brain_usage WHERE day=?'))return d.usage.get(a[0])||null;
    if(q.startsWith("SELECT payload FROM aio_state WHERE namespace='config'")){
      return [...d.state.values()].filter(x=>x.namespace==='config').sort((x,y)=>y.updated_at-x.updated_at)[0]||null;
    }
    if(q.startsWith("SELECT namespace,payload,updated_at FROM aio_state WHERE namespace LIKE 'student:%'")){
      return [...d.state.values()].filter(x=>x.namespace.startsWith('student:')).sort((x,y)=>y.updated_at-x.updated_at)[0]||null;
    }
    throw new Error('Unhandled first SQL: '+q);
  }
  async all(){const q=this.sql,d=this.db,a=this.args;
    if(q.startsWith('SELECT name,payload,received_at FROM character_status'))return {results:[...d.status.values()].sort((x,y)=>x.name.localeCompare(y.name))};
    if(q.startsWith('SELECT namespace,payload,updated_at FROM aio_state WHERE account=?'))return {results:[...d.state.values()].filter(x=>x.account===a[0]).sort((x,y)=>y.updated_at-x.updated_at)};
    if(q.startsWith('SELECT account,character,trigger,decision,neurons,created_at FROM brain_decisions'))return {results:[...d.decisions].sort((x,y)=>y.id-x.id).slice(0,12)};
    if(q.startsWith('SELECT account,character,event_type,action,target,reward,payload,created_at FROM brain_learning_events'))return {results:[...d.events].sort((x,y)=>y.id-x.id).slice(0,20)};
    if(q.startsWith("SELECT namespace,payload,updated_at FROM aio_state WHERE namespace LIKE 'student:%'"))return {results:[...d.state.values()].filter(x=>x.namespace.startsWith('student:')).sort((x,y)=>y.updated_at-x.updated_at).slice(0,8)};
    if(q.startsWith('SELECT character,trigger,decision,neurons,created_at FROM brain_decisions WHERE created_at>=?'))return {results:[...d.decisions].filter(x=>x.created_at>=Number(a[0]||0)).sort((x,y)=>y.id-x.id).slice(0,40)};
    if(q.startsWith('SELECT character,event_type,action,target,reward,payload,created_at FROM brain_learning_events WHERE created_at>=?'))return {results:[...d.events].filter(x=>x.created_at>=Number(a[0]||0)).sort((x,y)=>y.id-x.id).slice(0,80)};
    throw new Error('Unhandled all SQL: '+q);
  }
}

const mod=await import(pathToFileURL(new URL('../cloudflare-dashboard/src/worker.js',import.meta.url).pathname).href+'?smoke='+Date.now());
const worker=mod.default,db=new FakeDB();
let aiCalls=0;
const env={DB:db,WRITE_KEY:'write-test',READ_KEY:'read-test',AI:{async run(){aiCalls++;return {response:JSON.stringify({action:'explore',target:'',confidence:.91,scores:{continue:.04,change_farm_target:.05,replan_merchant:.06,explore:.8,wait:.05},reason:'Novel world state',lesson:'Explore novel safe states before exploiting.',expected:{xpDeltaPct:0,goldDeltaPct:0,safetyDeltaPct:0,freeSlotsDelta:0},recheckSeconds:120}),usage:{prompt_tokens:1400,completion_tokens:120}};}}};
const post=(path,body)=>new Request('https://example.test'+path,{method:'POST',headers:{'content-type':'text/plain;charset=UTF-8'},body:JSON.stringify({writeKey:'write-test',account:'acct',character:'Merch',...body})});

// Student/config state round-trip.
const student={schema:2,inputSize:32,hiddenSize:24,outputSize:5,w1:Array(768).fill(.001),b1:Array(24).fill(0),w2:Array(120).fill(.001),b2:Array(5).fill(0),samples:100,updates:500,lossEma:.8,rewardEma:.12,agreementEma:.7,lastTrainAt:Date.now(),updatedAt:Date.now(),telemetry:{confidence:.88,entropy:.2,novelty:.4,replay:256,pendingOutcomes:1,outcomes:20,promoted:true,action:'explore',league:{enabled:true,status:'challenge',generation:2,hasChampion:true,hasCandidate:true,candidateGeneration:3,canaryActive:true,probationActive:false,promotions:2,rollbacks:1,rejections:1,championRewardEma:.12,championLoss:.8,challengerLoss:.7,championCanaryReward:.1,challengerCanaryReward:.2,championCanaryOutcomes:5,challengerCanaryOutcomes:4,probationReward:0,probationOutcomes:0,probationBaseline:0,lastEvent:'challenge_start',lastEventAt:Date.now(),lastReason:'testing'},life:{state:'challenging',label:'prüft einen Challenger',detail:'Canary läuft',intensity:.9,beatMs:950},quality:{enabled:true,status:'healthy',score:93,outcomes:24,recentReward:.22,baselineReward:.18,rewardDrop:-.04,recentConfidence:.86,baselineConfidence:.81,confidenceGain:.05,overconfidenceFailureRate:.05,instability:.12,lossDrift:.03,safetyIncidents:0,teacherBoost:1,learningRateScale:1,autonomyAllowed:true,canaryAllowed:true,blockedSeconds:0,lastReason:'stabil',healthyGeneration:2,interventions:1,recoveries:2},diary:[{id:'live1',at:Date.now(),kind:'teacher',tone:'learn',icon:'🎓',title:'Teacher-Lektion',detail:'Explore novel safe states.',source:'teacher'}],diaryStats:{today:1,positive:0,negative:0,teacherLessons:1,total:1,lastAt:Date.now()}},diary:{schema:1,entries:[{id:'d1',at:Date.now(),kind:'teacher',tone:'learn',icon:'🎓',title:'Teacher-Lektion',detail:'Explore novel safe states.',source:'teacher'}],stats:{today:1,positive:0,negative:0,teacherLessons:1,total:1,lastAt:Date.now()},updatedAt:Date.now()},research:{schema:1,summary:{schema:1,profile:'development',profileLabel:'Entwicklungsbrief',generatedAt:Date.now(),windowHours:24,anonymized:true,quality:{status:'healthy',score:93,recentReward:.22,overconfidenceFailureRate:.05},performance:{xpPerHour:123456,goldPerHour:2222,freeSlots:7,inventorySlots:42,farmSafetyPct:88,visibleMonsters:5,competitors:1,partyComplete:true},repeatedErrors:[{kind:'action_error',message:'scroll buy inventory_full WRITE_KEY=DO_NOT_LEAK',errorClass:'inventory_full',count:4,lastAt:Date.now(),level:'error'}],highlights:[{at:Date.now(),kind:'outcome',title:'Strategie bestätigt',detail:'EXP/h gestiegen',action:'explore',target:'main',reward:.42,generation:2}],teacherLessons:[{at:Date.now(),title:'Teacher-Lektion',lesson:'Explore novel safe states.',action:'explore',target:'main'}],strongestOutcomes:[{at:Date.now(),title:'Strategie bestätigt',detail:'EXP/h gestiegen',reward:.42,action:'explore',target:'main'}],learning:{monsters:[{monster:'bee',kills:120,lootEvents:10,gold:5000,lastAt:Date.now()}],zones:[{zone:'main|bee',samples:45,xpPerHour:123456,goldPerHour:2222,safetyPct:88,lastAt:Date.now()}]}},updatedAt:Date.now()}};
let r=await worker.fetch(post('/api/state',{config:{brainDailyNeuronLimit:10000,brainBudgetTargetPct:99.5,brainWorkPct:100},configHash:'h',student}),env);assert.equal(r.status,200);let j=await r.json();assert.equal(j.ok,true);assert.equal(j.student.samples,100);

// Teacher produces normalized strategic supervision and records real usage.
r=await worker.fetch(post('/api/brain',{dailyLimit:10000,model:'@cf/qwen/qwen3-30b-a3b-fp8',state:{trigger:'smoke',student:{action:'continue',confidence:.3}}}),env);j=await r.json();assert.equal(j.ok,true);assert.equal(j.blocked,false);assert.equal(j.decision.action,'explore');assert.ok(j.decision.scores.explore>.5);assert.equal(aiCalls,1);assert.ok(j.neurons>0);

// Outcome feedback reaches D1.
r=await worker.fetch(post('/api/brain-feedback',{feedback:{action:'explore',target:'',source:'teacher',reward:.42,before:{xp:100},after:{xp:120}}}),env);j=await r.json();assert.equal(j.ok,true);assert.equal(db.events.length,1);
// League events share the same feedback channel.
r=await worker.fetch(post('/api/brain-feedback',{feedback:{eventType:'promotion',action:'brain_league',target:'generation-3',reward:.2,reason:'canary won'}}),env);j=await r.json();assert.equal(j.ok,true);assert.equal(db.events.at(-1).event_type,'promotion');

// Frequent character status carries a live Brain pulse between slower Student syncs.
r=await worker.fetch(post('/api/push',{status:{type:'aio-bot-status',name:'Merch',ctype:'merchant',role:'merchant',brain:{league:{status:'challenge',generation:2,hasChampion:true},life:{state:'thinking',label:'denkt mit dem Teacher',detail:'live pulse',beatMs:800},quality:{enabled:true,status:'watch',score:72,autonomyAllowed:true,canaryAllowed:false,lastReason:'Confidence steigt ohne Reward-Fortschritt'}},updatedAt:Date.now()}}),env);j=await r.json();assert.equal(j.ok,true);

// Dashboard Brain endpoint returns safe summary incl. promotion state, not weights.
r=await worker.fetch(new Request('https://example.test/api/brain-status',{headers:{'x-aio-read-key':'read-test'}}),env);j=await r.json();assert.equal(j.ok,true);assert.equal(j.usage.limit,10000);assert.equal(j.usage.target,9950);assert.equal(j.students[0].stats.promoted,true);assert.equal(j.students[0].stats.league.canaryActive,true);assert.equal(j.students[0].stats.league.generation,2);assert.equal(j.students[0].stats.life.state,'challenging');assert.equal(j.students[0].stats.quality.status,'healthy');assert.equal(j.students[0].stats.quality.score,93);assert.equal(j.students[0].stats.quality.autonomyAllowed,true);assert.equal(j.students[0].stats.diary.entries[0].title,'Teacher-Lektion');assert.equal(j.students[0].stats.diary.stats.teacherLessons,1);assert.equal(j.students[0].stats.research.enabled,true);assert.equal(j.students[0].stats.research.repeatedErrors[0].count,4);assert.ok(!JSON.stringify(j.students[0].stats.research).includes('DO_NOT_LEAK'));assert.equal(j.liveBrain.life.state,'thinking');assert.equal(j.liveBrain.league.generation,2);assert.equal(j.liveBrain.quality.status,'watch');assert.equal('w1' in j.students[0].stats,false);assert.ok(j.decisions.length>=1);assert.ok(j.events.length>=1);

// Research Bridge returns a redacted, optionally anonymized ChatGPT-ready brief without AI inference.
r=await worker.fetch(new Request('https://example.test/api/research-brief?profile=development&hours=24&anonymize=1',{headers:{'x-aio-read-key':'read-test'}}),env);j=await r.json();assert.equal(j.ok,true);assert.equal(j.profile,'development');assert.ok(j.prompt.includes('AiO Research Bridge · Entwicklungsbrief'));assert.ok(j.prompt.includes('Strukturierte Bot-Daten'));assert.ok(!j.prompt.includes('DO_NOT_LEAK'));assert.ok(!j.prompt.includes('write-test'));assert.equal(aiCalls,1);

// Hard-budget preflight blocks inference near 10k.
const day=new Date().toISOString().slice(0,10);db.usage.set(day,{day,neurons:9998,requests:999,updated_at:Date.now()});
r=await worker.fetch(post('/api/brain',{dailyLimit:10000,model:'@cf/qwen/qwen3-30b-a3b-fp8',state:{trigger:'budget-smoke'}}),env);j=await r.json();assert.equal(j.ok,true);assert.equal(j.blocked,true);assert.equal(aiCalls,1);

console.log('Worker Brain v2.14 Research Bridge smoke OK · state sync · teacher · league feedback · living dashboard · hard budget');
