'use strict';

const { BoundedReplayBuffer } = require('./replay-buffer');

const BRAIN_V2_MODE = 'teacher-student-strategic-brain-v2';
const ACTIONS = Object.freeze(['continue', 'change_farm_target', 'replan_merchant', 'explore', 'wait']);
const INPUT_NAMES = Object.freeze([
  'hpRatio','mpRatio','levelNorm','rangeNorm','speedNorm','attackNorm','partyPresentRatio','partyAliveRatio',
  'partyCohesion','selfAggro','visibleHostiles','targetHpRatio','riskHeadroom','deathSafety','xpRate','goldRate',
  'freeSlotsRatio','inventoryHealth','merchantIdle','marketLiquidity','gearHealth','travelEfficiency','worldConfidence','knowledgeFreshness',
  'errorHealth','recoveryHealth','currentPlanAffinity','targetEfficiency','kiteConfidence','teacherRecency','outcomeHealth','novelty'
]);
const HIDDEN_SIZE = 24;

function finite(value, fallback = 0) { if (value == null || value === '') return fallback; const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, finite(value, min))); }
function ratio(value, max, fallback = 0.5) { const d = finite(max, 0); return d > 0 ? clamp(finite(value, 0) / d) : fallback; }
function sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, x)))); }
function softmax(values) { const m = Math.max(...values); const xs = values.map((x) => Math.exp(Math.max(-30, Math.min(30, x - m)))); const sum = xs.reduce((a, b) => a + b, 0) || 1; return xs.map((x) => x / sum); }
function entropy(probs) { const h = probs.reduce((sum, p) => sum - (p > 0 ? p * Math.log(p) : 0), 0); return clamp(h / Math.log(Math.max(2, probs.length))); }
function safeClone(v) { try { return JSON.parse(JSON.stringify(v)); } catch (_) { return null; } }
function seeded(index) { return (((Math.sin((index + 1) * 91.173) * 43758.5453) % 1) + 1) % 1 - 0.5) * 0.16; }
function nowUtcDay(ts) { return new Date(ts).toISOString().slice(0, 10); }
function itemCount(items) { let count = 0; for (const item of items || []) if (item) count += Math.max(1, finite(item.q, 1)); return count; }
function freeSlots(character) { const size = Math.max(0, Math.floor(finite(character && character.isize, Array.isArray(character && character.inventory) ? character.inventory.length : 0))); const occupied = (character && character.inventory || []).slice(0, size || undefined).filter(Boolean).length; return { free: Math.max(0, size - occupied), size, ratio: size ? clamp((size - occupied) / size) : 0.5 }; }
function avg(values, fallback = 0) { const rows = values.filter((x) => Number.isFinite(Number(x))).map(Number); return rows.length ? rows.reduce((a,b)=>a+b,0) / rows.length : fallback; }

class TinyStrategyNetwork {
  constructor(state = null) {
    this.inputSize = INPUT_NAMES.length;
    this.hiddenSize = HIDDEN_SIZE;
    this.outputSize = ACTIONS.length;
    this.w1 = Array.from({ length: this.hiddenSize }, (_, h) => Array.from({ length: this.inputSize }, (_, i) => seeded(h * this.inputSize + i)));
    this.b1 = Array(this.hiddenSize).fill(0);
    this.w2 = Array.from({ length: this.outputSize }, (_, o) => Array.from({ length: this.hiddenSize }, (_, h) => seeded(2000 + o * this.hiddenSize + h)));
    this.b2 = Array(this.outputSize).fill(0);
    if (state) this.restore(state);
  }
  forward(input) {
    const x = input.map((v) => clamp(v));
    const hidden = this.w1.map((row, h) => Math.tanh(row.reduce((s, w, i) => s + w * x[i], this.b1[h])));
    const logits = this.w2.map((row, o) => row.reduce((s, w, h) => s + w * hidden[h], this.b2[o]));
    const probs = softmax(logits);
    return { x, hidden, logits, probs };
  }
  train(input, target, learningRate = 0.01) {
    const f = this.forward(input); const t = target.map((v) => clamp(v)); const tsum = t.reduce((a,b)=>a+b,0) || 1; const y = t.map((v)=>v/tsum);
    const dz2 = f.probs.map((p, i) => p - y[i]);
    const dh = Array(this.hiddenSize).fill(0);
    for (let o = 0; o < this.outputSize; o += 1) for (let h = 0; h < this.hiddenSize; h += 1) dh[h] += this.w2[o][h] * dz2[o];
    for (let o = 0; o < this.outputSize; o += 1) { for (let h = 0; h < this.hiddenSize; h += 1) this.w2[o][h] -= learningRate * dz2[o] * f.hidden[h]; this.b2[o] -= learningRate * dz2[o]; }
    for (let h = 0; h < this.hiddenSize; h += 1) { const dz1 = dh[h] * (1 - f.hidden[h] * f.hidden[h]); for (let i = 0; i < this.inputSize; i += 1) this.w1[h][i] -= learningRate * dz1 * f.x[i]; this.b1[h] -= learningRate * dz1; }
    return -y.reduce((sum, q, i) => sum + (q > 0 ? q * Math.log(Math.max(1e-9, f.probs[i])) : 0), 0);
  }
  snapshot() { return safeClone({ w1: this.w1, b1: this.b1, w2: this.w2, b2: this.b2 }); }
  restore(state) {
    if (!state || !Array.isArray(state.w1) || state.w1.length !== this.hiddenSize || !Array.isArray(state.w2) || state.w2.length !== this.outputSize) return false;
    try { this.w1 = state.w1.map((r)=>r.map(Number)); this.b1 = state.b1.map(Number); this.w2 = state.w2.map((r)=>r.map(Number)); this.b2 = state.b2.map(Number); return true; } catch (_) { return false; }
  }
}

function partyRows(snapshot) {
  const rows = []; const seen = new Set();
  const add = (x) => { if (!x) return; const name = String(x.name || x.id || ''); if (!name || seen.has(name)) return; seen.add(name); rows.push(x); };
  add(snapshot && snapshot.character); for (const p of snapshot && snapshot.party || []) add(p); return rows;
}
function performanceStatus(runtime) { try { return runtime && runtime.performance && typeof runtime.performance.status === 'function' ? runtime.performance.status() || {} : {}; } catch (_) { return {}; } }
function latestPerf(runtime) { const s = performanceStatus(runtime); return s.current || (Array.isArray(s.recent) && s.recent[s.recent.length - 1]) || {}; }
function currentRates(runtime) { const p = latestPerf(runtime); return p.rates || {}; }
function worldConfidence(runtime) {
  try { const s = runtime && runtime.world && typeof runtime.world.status === 'function' ? runtime.world.status() : null; return clamp(finite(s && (s.confidence || s.averageConfidence), 0.5)); } catch (_) { return 0.5; }
}
function currentKiteConfidence(runtime) { try { const h = runtime && runtime.alpha24AdaptiveRangeRiskLogisticsHotfix; const s = h && h.status && h.status(); return clamp(finite(s && s.currentTankAssessment && s.currentTankAssessment.kiteConfidence, 0)); } catch (_) { return 0; } }
function currentMarketLiquidity(runtime) {
  try { const h = runtime && runtime.economyEquipmentAutonomyV2 && runtime.economyEquipmentAutonomyV2.status(); const rows = h && h.marketDecisions || []; return clamp(avg(rows.map((x)=>x && x.liquidity), 0.25)); } catch (_) { return 0.25; }
}
function recentErrorHealth(runtime) {
  try { const rows = runtime && runtime.log && runtime.log.list ? runtime.log.list(80) : []; const bad = rows.filter((x)=>x && ['warn','error','fatal'].includes(String(x.severity))).length; return clamp(1 - bad / 20); } catch (_) { return 0.75; }
}
function targetCandidate(context) { const rows = Array.isArray(context && context.teacherRanking) ? context.teacherRanking : []; return rows[0] || (Array.isArray(context && context.candidates) ? context.candidates[0] : null) || null; }

class BrainStateEncoderV2 {
  encode(runtime, context = {}, meta = {}) {
    const snapshot = context.snapshot || runtime && runtime.lastSnapshot || {}; const c = snapshot.character || {}; const party = partyRows(snapshot); const alive = party.filter((x)=>!(x.dead || x.rip));
    const hostiles = (snapshot.entities || []).filter((x)=>x && x.mtype && !x.dead && (x.hp == null || finite(x.hp) > 0)); const selfAggro = hostiles.filter((x)=>String(x.target || '') === String(c.name || '')).length;
    const target = targetCandidate(context); const liveTarget = target && (snapshot.entities || []).find((x)=>String(x.id)===String(target.entityId || target.id)) || null; const fs = freeSlots(c); const rates = currentRates(runtime);
    const maxXp = Math.max(1, ...((context.candidates || []).map((x)=>Math.max(0,finite(x.xpPerHour,0))))); const maxGold = Math.max(1, ...((context.candidates || []).map((x)=>Math.max(0,finite(x.goldPerHour,0)))));
    const risk = runtime && runtime.lastRiskSkip; const riskThreshold = finite(runtime && runtime.combatRisk && runtime.combatRisk.threshold, 0.65); const riskScore = finite(risk && risk.score, riskThreshold * 0.5);
    const deaths = Math.max(0, finite(rates.deathsPerHour, 0)); const eta = Math.max(0, finite(target && target.travelSeconds, 60)); const ttk = Math.max(0, finite(target && target.expectedKillSeconds, 25)); const currentPlan = context.currentPlan || {};
    const targetId = target && String(target.id || target.monster || ''); const planId = String(currentPlan.id || currentPlan.monster || '');
    const marketLiquidity = currentMarketLiquidity(runtime); let gearGoals = 0; try { gearGoals = runtime.gearProgression && runtime.gearProgression.list ? runtime.gearProgression.list(64).length : 0; } catch (_) {}
    let merchantBusy = false; try { const s = runtime.economyEquipmentAutonomyV2 && runtime.economyEquipmentAutonomyV2.status(); merchantBusy = !!(s && s.busy); } catch (_) {}
    const values = {
      hpRatio: ratio(c.hp,c.max_hp), mpRatio: ratio(c.mp,c.max_mp), levelNorm: clamp(finite(c.level,1)/120), rangeNorm: clamp(finite(c.range,0)/250), speedNorm: clamp(finite(c.speed,0)/120), attackNorm: clamp(finite(c.attack,0)/2500),
      partyPresentRatio: clamp(party.length/4), partyAliveRatio: party.length ? clamp(alive.length/party.length) : 0.25, partyCohesion: meta.partyCohesion == null ? (party.length>=3?0.8:0.4) : clamp(meta.partyCohesion), selfAggro: clamp(selfAggro/3),
      visibleHostiles: clamp(hostiles.length/12), targetHpRatio: liveTarget ? ratio(liveTarget.hp,liveTarget.max_hp || liveTarget.hp,1) : 0.5, riskHeadroom: clamp((riskThreshold-riskScore+1)/1.5), deathSafety: clamp(1-deaths/1.0),
      xpRate: clamp(Math.max(0,finite(target&&target.xpPerHour,finite(rates.xpPerHour,0)))/maxXp), goldRate: clamp(Math.max(0,finite(target&&target.goldPerHour,finite(rates.goldPerHour,0)))/maxGold), freeSlotsRatio: fs.ratio, inventoryHealth: clamp(0.25+fs.ratio*0.75),
      merchantIdle: merchantBusy?0:1, marketLiquidity, gearHealth: clamp(1-gearGoals/20), travelEfficiency: clamp(1-eta/600), worldConfidence: worldConfidence(runtime), knowledgeFreshness: meta.knowledgeFreshness==null?0.7:clamp(meta.knowledgeFreshness),
      errorHealth: recentErrorHealth(runtime), recoveryHealth: ratio(c.hp,c.max_hp), currentPlanAffinity: targetId && planId && (targetId===planId || String(target&&target.monster||'')===planId) ? 1 : 0, targetEfficiency: clamp(1-ttk/90),
      kiteConfidence: currentKiteConfidence(runtime), teacherRecency: clamp(1-finite(meta.teacherAgeMs,300000)/600000), outcomeHealth: clamp((finite(meta.rewardEma,0)+1)/2), novelty: clamp(finite(meta.novelty,0.5))
    };
    return { names: INPUT_NAMES.slice(), values, vector: INPUT_NAMES.map((name)=>clamp(values[name])) };
  }
}

function localTeacher(context) {
  const rows = Array.isArray(context.teacherRanking) ? context.teacherRanking : []; const top = rows[0] || null; const current = context.currentPlan || null;
  if (!top) return { action: 'wait', target: '', confidence: 0.8, scores: { continue:0.04, change_farm_target:0.02, replan_merchant:0.04, explore:0.1, wait:0.8 }, reason:'no deterministic candidate', lesson:'Wait when deterministic safety has no eligible target.', source:'deterministic' };
  const topId = String(top.id || top.monster || ''); const currentId = String(current && (current.id || current.monster) || ''); const same = currentId && (currentId === topId || currentId === String(top.monster || ''));
  const action = same ? 'continue' : 'change_farm_target';
  const scores = { continue:0.08, change_farm_target:0.08, replan_merchant:0.04, explore:0.03, wait:0.02 }; scores[action] = 0.75;
  return { action, target:String(top.monster || top.id || ''), confidence:0.75, scores, reason:same?'deterministic planner confirms current plan':'deterministic planner prefers another safe target', lesson:'Use deterministic planner ranking as safe strategic baseline.', source:'deterministic' };
}
function scoreVector(scores) { const raw = ACTIONS.map((a)=>Math.max(0,finite(scores&&scores[a],0))); const sum = raw.reduce((a,b)=>a+b,0); return sum>0?raw.map((x)=>x/sum):ACTIONS.map(()=>1/ACTIONS.length); }
function actionFrom(probs) { let idx = 0; for (let i=1;i<probs.length;i+=1) if (probs[i]>probs[idx]) idx=i; return { index:idx, action:ACTIONS[idx], confidence:probs[idx] }; }
function vectorDistance(a,b) { if (!a || !b || a.length!==b.length) return 1; return Math.sqrt(a.reduce((sum,x,i)=>sum+(x-b[i])*(x-b[i]),0)/a.length); }

class StrategicBrainV2 {
  constructor(options = {}) {
    this.runtime = options.runtime || null; this.control = options.controlPlane || null; this.legacy = options.legacyBrain || null; this.root = options.root || this.runtime && this.runtime.root || globalThis; this.now = options.now || this.runtime && this.runtime.now || (()=>Date.now()); this.log = options.log || this.runtime && this.runtime.log || null;
    this.encoder = new BrainStateEncoderV2(); this.replayBuffer = new BoundedReplayBuffer({ capacity: this._cfg('brain.replayCapacity', 512) }); this.network = new TinyStrategyNetwork();
    this.remoteTeacher = null; this.remoteTeacherAt = 0; this.lastObservation = null; this.pendingOutcome = null; this.rewardEma = 0; this.lossEma = null; this.agreementEma = null; this.overconfidenceFailures = 0; this.outcomes = 0; this.samples = 0; this.updates = 0; this.lastTrainAt = 0;
    this.quality = { state:'warming', score:0.5, reason:'collecting evidence' }; this.diary = []; this.league = { generation:0, champion:null, championLoss:null, promotions:0, rollbacks:0, rejections:0, lastEvent:null, lastEventAt:0, lastReason:null };
    this.stats = { observations:0, teacherSamples:0, remoteTeacherSamples:0, deterministicTeacherSamples:0, replayTrains:0, outcomeRewards:0, saves:0, restoreSuccess:0, restoreErrors:0 };
    this.storageKey = 'aio-v3:brain-v2:state:v1'; this.lastSaveAt = 0; this._restore(); this._diary('learn','🧠','Brain v2 bereit','32→24→5 Student, Experience Replay und Teacher-Distillation aktiv.','neutral');
  }
  _cfg(key, fallback) { return this.control && typeof this.control.get==='function' ? this.control.get(key,fallback) : fallback; }
  _storage() { try { return this.root && (this.root.localStorage || this.root.parent && this.root.parent.localStorage) || null; } catch (_) { return null; } }
  _diary(kind, icon, title, detail, tone='neutral', extra={}) { const row={ id:`brain-${this.now()}-${this.diary.length}`, at:this.now(), kind, icon, title, detail, tone, ...extra }; this.diary.push(row); const max=Math.max(20,Math.min(300,Math.floor(this._cfg('brain.diaryMaxEntries',100)))); if(this.diary.length>max)this.diary.splice(0,this.diary.length-max); return row; }
  _restore() { const s=this._storage(); if(!s)return false; try{const x=JSON.parse(s.getItem(this.storageKey)||'null');if(!x)return false;if(x.network)this.network.restore(x.network);this.rewardEma=finite(x.rewardEma,0);this.lossEma=x.lossEma==null?null:finite(x.lossEma);this.agreementEma=x.agreementEma==null?null:finite(x.agreementEma);this.samples=Math.max(0,finite(x.samples));this.updates=Math.max(0,finite(x.updates));this.outcomes=Math.max(0,finite(x.outcomes));this.league={...this.league,...(x.league||{})};this.diary=Array.isArray(x.diary)?x.diary.slice(-100):[];this.stats.restoreSuccess+=1;return true}catch(_){this.stats.restoreErrors+=1;return false} }
  _save(force=false) { const now=this.now(); if(!force&&now-this.lastSaveAt<15000)return false;this.lastSaveAt=now;const s=this._storage();if(!s)return false;try{s.setItem(this.storageKey,JSON.stringify(this.exportState()));this.stats.saves+=1;return true}catch(_){return false} }
  _novelty(vector) { const rows=this.replayBuffer.list(48).filter((x)=>Array.isArray(x.vector)); if(!rows.length)return 1;return clamp(Math.min(...rows.map((x)=>vectorDistance(vector,x.vector)))*2.5); }
  _quality() {
    const minSamples=Math.max(16,Math.floor(this._cfg('brain.championMinSamples',120)/3)); let state='healthy',reason='stable learning'; let score=0.75;
    if(this.samples<minSamples){state='warming';reason='collecting evidence';score=clamp(this.samples/minSamples*0.7);}
    else if(this.rewardEma<-0.35||this.overconfidenceFailures>=5){state='quarantine';reason='negative outcomes or repeated overconfidence';score=0.1;}
    else if(this.rewardEma<-0.15||finite(this.lossEma,0)>1.45){state='degraded';reason='reward/loss degraded';score=0.3;}
    else if(this.rewardEma<0||finite(this.lossEma,0)>1.15){state='watch';reason='learning quality under observation';score=0.55;}
    this.quality={state,score:Number(score.toFixed(3)),reason,rewardEma:Number(this.rewardEma.toFixed(4)),lossEma:this.lossEma==null?null:Number(this.lossEma.toFixed(4)),overconfidenceFailures:this.overconfidenceFailures};return this.quality;
  }
  _train(vector,target,source='teacher') { const lr=clamp(this._cfg('brain.learningRate',0.012),0.001,0.08); const loss=this.network.train(vector,target,lr);this.lossEma=this.lossEma==null?loss:this.lossEma*0.94+loss*0.06;this.updates+=1;this.lastTrainAt=this.now();this.replayBuffer.push({at:this.now(),vector:vector.slice(),target:target.slice(),source,loss});return loss; }
  _replayTrain() { const rows=this.replayBuffer.list(Math.max(4,Math.floor(this._cfg('brain.replayBatchSize',12))));if(!rows.length)return;for(const row of rows){if(Array.isArray(row.vector)&&Array.isArray(row.target))this.network.train(row.vector,row.target,clamp(this._cfg('brain.learningRate',0.012),0.001,0.08)*0.35);}this.stats.replayTrains+=1; }
  _teacherFor(context) { const maxAge=Math.max(30000,finite(this._cfg('brain.teacherMaxIntervalMs',300000))); if(this.remoteTeacher&&this.now()-this.remoteTeacherAt<=maxAge)return{...this.remoteTeacher,source:'cloudflare'};return localTeacher(context); }
  observe(context={}) {
    this.stats.observations+=1;if(this._cfg('brain.enabled',true)!==true)return this.lastObservation;
    let legacy=null;try{legacy=this.legacy&&typeof this.legacy.observe==='function'?this.legacy.observe(context):null}catch(_){}
    const preliminary=this.encoder.encode(this.runtime,context,{teacherAgeMs:this.now()-this.remoteTeacherAt,rewardEma:this.rewardEma,novelty:0.5});const novelty=this._novelty(preliminary.vector);const encoded=this.encoder.encode(this.runtime,context,{teacherAgeMs:this.now()-this.remoteTeacherAt,rewardEma:this.rewardEma,novelty});
    const pred=this.network.forward(encoded.vector);const student=actionFrom(pred.probs);const teacher=this._teacherFor(context);const target=scoreVector(teacher.scores);const teacherAction=actionFrom(target);const loss=this._train(encoded.vector,target,teacher.source);this.samples+=1;this.stats.teacherSamples+=1;if(teacher.source==='cloudflare')this.stats.remoteTeacherSamples+=1;else this.stats.deterministicTeacherSamples+=1;
    const agreement=student.action===teacherAction.action;this.agreementEma=this.agreementEma==null?(agreement?1:0):this.agreementEma*0.94+(agreement?1:0)*0.06;this._replayTrain();
    const record={at:this.now(),mode:'shadow',actionAuthority:false,directActionAccess:false,student:{action:student.action,confidence:Number(student.confidence.toFixed(4)),scores:Object.fromEntries(ACTIONS.map((a,i)=>[a,Number(pred.probs[i].toFixed(4))])),entropy:Number(entropy(pred.probs).toFixed(4)),novelty:Number(novelty.toFixed(4))},teacher:{source:teacher.source,action:teacher.action,target:teacher.target||'',confidence:finite(teacher.confidence,teacherAction.confidence),reason:teacher.reason||'',lesson:teacher.lesson||''},agreement,loss:Number(loss.toFixed(5)),target:teacher.target||'',quality:this._quality(),legacy:legacy&&legacy.recommendation?{recommendation:legacy.recommendation}:null,inputs:encoded.values};
    this.lastObservation=record;this.replayBuffer.push({at:record.at,vector:encoded.vector.slice(),target:target.slice(),source:'observation',student:record.student,teacher:record.teacher,agreement,loss});
    if(!this.pendingOutcome)this.pendingOutcome={startedAt:this.now(),dueAt:this.now()+Math.max(15000,finite(this._cfg('brain.outcomeWindowMs',60000))),action:student.action,target:teacher.target||'',confidence:student.confidence,baseline:this.captureMetrics()};
    this._leagueCheck();this._save();if(this.log)this.log.emit({component:'brain-v2',event:'BRAIN_V2_OBSERVATION',data:{student:record.student,teacher:record.teacher,agreement,quality:record.quality.state}});return record;
  }
  ingestTeacher(decision,meta={}) { if(!decision||!ACTIONS.includes(String(decision.action)))return false;const scores=scoreVector(decision.scores);const clean={action:String(decision.action),target:String(decision.target||''),confidence:clamp(decision.confidence),scores:Object.fromEntries(ACTIONS.map((a,i)=>[a,scores[i]])),reason:String(decision.reason||'').slice(0,300),lesson:String(decision.lesson||'').slice(0,400),expected:decision.expected&&typeof decision.expected==='object'?safeClone(decision.expected):null,recheckSeconds:Math.max(5,Math.min(1800,finite(decision.recheckSeconds,60))),source:'cloudflare',neurons:finite(meta.neurons,0)};this.remoteTeacher=clean;this.remoteTeacherAt=this.now();this._diary('teacher','🎓',`Teacher: ${clean.action}`,clean.lesson||clean.reason||'Neue strategische Lektion.','learn',{action:clean.action,target:clean.target});if(this.lastObservation&&this.lastObservation.inputs){const vector=INPUT_NAMES.map((n)=>clamp(this.lastObservation.inputs[n]));this._train(vector,scores,'remote-teacher');}this._save(true);return true; }
  captureMetrics() { const snapshot=this.runtime&&this.runtime.lastSnapshot||{};const c=snapshot.character||{};const rates=currentRates(this.runtime);const fs=freeSlots(c);return{at:this.now(),xpPerHour:finite(rates.xpPerHour,0),goldPerHour:finite(rates.goldPerHour,0),deathsPerHour:finite(rates.deathsPerHour,0),damageTakenPerHour:finite(rates.damageTakenPerHour,0),hpRatio:ratio(c.hp,c.max_hp),freeSlots:fs.free,freeSlotsRatio:fs.ratio,rip:!!c.rip,errorHealth:recentErrorHealth(this.runtime)}; }
  tickOutcome() { if(!this.pendingOutcome||this.now()<this.pendingOutcome.dueAt)return null;const before=this.pendingOutcome.baseline||{},after=this.captureMetrics();const rel=(a,b,scale)=>clamp((finite(a)-finite(b))/Math.max(scale,Math.abs(finite(b)),1),-1,1);const xp=rel(after.xpPerHour,before.xpPerHour,250000);const gold=rel(after.goldPerHour,before.goldPerHour,50000);const slots=clamp((finite(after.freeSlots)-finite(before.freeSlots))/8,-1,1);const safety=clamp((finite(before.deathsPerHour)-finite(after.deathsPerHour))/0.5,-1,1);const hp=clamp((finite(after.hpRatio)-finite(before.hpRatio))*2,-1,1);const errors=clamp(finite(after.errorHealth)-finite(before.errorHealth),-1,1);let reward=0.30*xp+0.16*gold+0.12*slots+0.25*safety+0.10*hp+0.07*errors;if(after.rip)reward-=0.8;reward=clamp(reward,-1,1);this.rewardEma=this.outcomes?this.rewardEma*0.88+reward*0.12:reward;this.outcomes+=1;this.stats.outcomeRewards+=1;if(this.pendingOutcome.confidence>0.72&&reward<-0.25)this.overconfidenceFailures+=1;else if(reward>0)this.overconfidenceFailures=Math.max(0,this.overconfidenceFailures-1);const outcome={at:this.now(),action:this.pendingOutcome.action,target:this.pendingOutcome.target,confidence:this.pendingOutcome.confidence,reward:Number(reward.toFixed(4)),before,after,components:{xp:Number(xp.toFixed(3)),gold:Number(gold.toFixed(3)),slots:Number(slots.toFixed(3)),safety:Number(safety.toFixed(3)),hp:Number(hp.toFixed(3)),errors:Number(errors.toFixed(3))}};this._diary('outcome',reward>0.08?'✅':reward<-0.08?'⚠️':'📊',`Outcome ${reward>=0?'+':''}${reward.toFixed(3)}`,`${outcome.action}${outcome.target?' · '+outcome.target:''} · XP ${Math.round(after.xpPerHour)}/h · Gold ${Math.round(after.goldPerHour)}/h`,reward>0.08?'good':reward<-0.08?'bad':'neutral',{action:outcome.action,target:outcome.target,reward:outcome.reward});this.pendingOutcome=null;this._quality();this._leagueCheck(outcome);this._save(true);if(this.log)this.log.emit({component:'brain-v2',event:'BRAIN_V2_OUTCOME',data:outcome});return outcome; }
  _validationLoss(networkState=null) { const rows=this.replayBuffer.list(64).filter((x)=>Array.isArray(x.vector)&&Array.isArray(x.target));if(!rows.length)return null;const net=networkState?new TinyStrategyNetwork(networkState):this.network;return avg(rows.map((row)=>{const p=net.forward(row.vector).probs;return-row.target.reduce((sum,q,i)=>sum+(q>0?q*Math.log(Math.max(1e-9,p[i])):0),0);}),null); }
  _leagueEvent(kind,reason,tone='learn'){this.league.lastEvent=kind;this.league.lastEventAt=this.now();this.league.lastReason=reason;this._diary('league',kind==='rollback'?'↩️':'🏆',kind,reason,tone);}
  _leagueCheck(outcome=null) { const min=Math.max(32,Math.floor(this._cfg('brain.championMinSamples',120)));if(!this.league.champion&&this.samples>=min){this.league.champion=this.network.snapshot();this.league.championLoss=this._validationLoss(this.league.champion);this.league.generation=1;this._leagueEvent('first_champion','Erster stabiler Student-Snapshot nach Mindest-Samples.','good');return;}
    if(!this.league.champion)return;if(outcome&&outcome.reward<-0.55){this.network.restore(this.league.champion);this.league.rollbacks+=1;this._leagueEvent('rollback',`Starker negativer Reward ${outcome.reward.toFixed(3)}; Champion wiederhergestellt.`,'bad');return;}
    if(this.updates%32!==0)return;const challenger=this._validationLoss();const champion=this._validationLoss(this.league.champion);if(challenger==null||champion==null)return;const improvement=(champion-challenger)/Math.max(1e-6,champion);const needed=clamp(this._cfg('brain.challengerLossImprovement',0.04),0.005,0.3);if(improvement>=needed&&this.rewardEma>=-0.03){this.league.champion=this.network.snapshot();this.league.championLoss=challenger;this.league.generation+=1;this.league.promotions+=1;this._leagueEvent('promotion',`Challenger verbessert Validierungs-Loss um ${(improvement*100).toFixed(1)}%.`,'good');}else if(improvement<-needed*1.5){this.league.rejections+=1;this._leagueEvent('challenge_reject',`Challenger-Loss ist ${(Math.abs(improvement)*100).toFixed(1)}% schlechter als Champion.`,'warn');}
  }
  teacherRequest(trigger='periodic') { const o=this.lastObservation; if(!o)return null;return{schemaVersion:2,trigger,brainMode:this._cfg('brain.mode','shadow'),quality:o.quality,student:o.student,inputs:o.inputs,deterministicTeacher:o.teacher&&o.teacher.source==='deterministic'?o.teacher:null,party:this.runtime&&this.runtime.characterRegistry&&this.runtime.characterRegistry.status?this.runtime.characterRegistry.status():null,economy:this.runtime&&this.runtime.economyEquipmentAutonomyV2&&this.runtime.economyEquipmentAutonomyV2.status?this.runtime.economyEquipmentAutonomyV2.status():null,performance:performanceStatus(this.runtime),policies:{survivalFirst:true,directActionAuthority:false,deterministicSafetyCannotBeOverridden:true}}; }
  shouldAskTeacher() { if(!this._cfg('brain.teacherEnabled',true)||!this.lastObservation)return false;const age=this.now()-this.remoteTeacherAt;const min=Math.max(5000,finite(this._cfg('brain.teacherMinIntervalMs',30000)));const max=Math.max(min,finite(this._cfg('brain.teacherMaxIntervalMs',300000)));if(age<min)return false;if(age>=max)return true;return this.lastObservation.student.entropy>=this._cfg('brain.entropyTeacherThreshold',0.72)||this.lastObservation.student.novelty>=this._cfg('brain.noveltyTeacherThreshold',0.45)||['watch','degraded','quarantine'].includes(this.quality.state); }
  replay(limit=32){return this.replayBuffer.list(limit);}
  exportState(){return{schemaVersion:2,mode:BRAIN_V2_MODE,savedAt:this.now(),network:this.network.snapshot(),samples:this.samples,updates:this.updates,outcomes:this.outcomes,rewardEma:this.rewardEma,lossEma:this.lossEma,agreementEma:this.agreementEma,league:safeClone(this.league),quality:safeClone(this.quality),diary:this.diary.slice(-Math.max(20,Math.floor(this._cfg('brain.diaryMaxEntries',100))))};}
  importState(state){if(!state||Number(state.schemaVersion)!==2)return false;const ok=this.network.restore(state.network);if(!ok)return false;this.samples=Math.max(this.samples,finite(state.samples));this.updates=Math.max(this.updates,finite(state.updates));this.outcomes=Math.max(this.outcomes,finite(state.outcomes));if(finite(state.samples)>this.samples/2){this.rewardEma=finite(state.rewardEma,this.rewardEma);this.lossEma=state.lossEma==null?this.lossEma:finite(state.lossEma);this.agreementEma=state.agreementEma==null?this.agreementEma:finite(state.agreementEma);}this._save(true);return true;}
  status(){const q=this._quality();return{schemaVersion:2,mode:BRAIN_V2_MODE,operatingMode:this._cfg('brain.mode','shadow'),enabled:this._cfg('brain.enabled',true),actionAuthority:false,directActionAccess:false,executorBypassAllowed:false,architecture:{inputs:INPUT_NAMES.length,inputNames:INPUT_NAMES.slice(),hidden:HIDDEN_SIZE,outputs:ACTIONS.length,actions:ACTIONS.slice()},student:{samples:this.samples,updates:this.updates,outcomes:this.outcomes,lossEma:this.lossEma==null?null:Number(this.lossEma.toFixed(5)),rewardEma:Number(this.rewardEma.toFixed(5)),agreementEma:this.agreementEma==null?null:Number(this.agreementEma.toFixed(5)),lastTrainAt:this.lastTrainAt,replay:this.replayBuffer.status()},teacher:{remoteAvailable:!!this.remoteTeacher,lastAt:this.remoteTeacherAt,ageMs:this.remoteTeacherAt?this.now()-this.remoteTeacherAt:null,lastDecision:this.remoteTeacher,shouldAsk:this.shouldAskTeacher()},quality:q,league:{generation:this.league.generation,hasChampion:!!this.league.champion,championLoss:this.league.championLoss,promotions:this.league.promotions,rollbacks:this.league.rollbacks,rejections:this.league.rejections,lastEvent:this.league.lastEvent,lastEventAt:this.league.lastEventAt,lastReason:this.league.lastReason},current:this.lastObservation, pendingOutcome:this.pendingOutcome?{startedAt:this.pendingOutcome.startedAt,dueAt:this.pendingOutcome.dueAt,action:this.pendingOutcome.action,target:this.pendingOutcome.target}:null,diary:{entries:this.diary.slice(-40),total:this.diary.length},stats:{...this.stats},policies:{strategicOnly:true,deterministicCombatSafetyAuthoritative:true,dangerousContentCannotBeOverridden:true,commandCharacterAuthorityWidened:false,cloudFailureSafe:true}};}
}

module.exports={BRAIN_V2_MODE,BRAIN_V2_ACTIONS:ACTIONS,BRAIN_V2_INPUT_NAMES:INPUT_NAMES,TinyStrategyNetwork,BrainStateEncoderV2,StrategicBrainV2,scoreVector};
