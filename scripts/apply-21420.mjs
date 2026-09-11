import fs from 'fs';
import path from 'path';

const read = p => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s);
const mustReplace = (s, from, to, label) => {
  if (!s.includes(from)) throw new Error('Missing pattern: ' + label);
  return s.replace(from, to);
};

let bot = read('bot.js');
bot = mustReplace(bot, 'AiO Bot 2.14.19 | 2026-09-11', 'AiO Bot 2.14.20 | 2026-09-11', 'bot header');
bot = mustReplace(bot, "var VERSION = '2.14.19';", "var VERSION = '2.14.20';", 'bot version');

const block = String.raw`

  // ---------------------------------------------------------------------------
  // 2.14.20 Measurement integrity, Teacher classification, diagnostics
  // ---------------------------------------------------------------------------
  ['research-window-integrity','teacher-error-classification','teacher-quota-circuit-breaker','merchant-diagnostic-completeness','learning-observability'].forEach(function(f){if(FEATURE_CONTRACT.indexOf(f)<0)FEATURE_CONTRACT.push(f);});

  var V21420_RESEARCH_KEY='researchWindow21420:'+me;
  function v21420ResearchHistory(){var h=S.researchWindow21420;if(Array.isArray(h))return h;h=read(V21420_RESEARCH_KEY,[]);if(!Array.isArray(h))h=[];S.researchWindow21420=h;return h;}
  function v21420ResearchSample(force){var now=clock(),h=v21420ResearchHistory(),last=h[h.length-1];if(!force&&last&&now-Number(last.at||0)<60000)return false;var sid=Number(S.session&&S.session.started)||0,row={at:now,session:sid,xpGain:Number(S.session&&S.session.xpGain)||0,goldGain:Number(S.session&&S.session.goldGain)||0,level:Number(character.level)||0,rip:!!character.rip,free:freeSlots()};h.push(row);var cutoff=now-169*3600000;while(h.length&&(Number(h[0].at)||0)<cutoff)h.shift();if(force||now>Number(S.times.researchPersist21420||0)){S.times.researchPersist21420=now+300000;write(V21420_RESEARCH_KEY,h.slice(-2200));}return true;}
  function v21420WindowMeasurement(hours){v21420ResearchSample(true);var now=clock(),requestedMs=clamp(Number(hours)||Number(C.brainResearchHours)||24,1,168)*3600000,requestedStart=now-requestedMs,sid=Number(S.session&&S.session.started)||0,h=v21420ResearchHistory().filter(function(x){return x&&Number(x.session)===sid&&Number(x.at)>0&&Number(x.at)<=now;});if(!h.length)return {requestedStartAt:requestedStart,measurementStartAt:null,measurementEndAt:now,durationMs:0,coveragePct:0,coverageStatus:'not_measured',xpGainWindow:null,goldGainWindow:null,xpPerHour:null,goldPerHour:null,sourceCharacter:String(me)};var base=h[0];for(var i=0;i<h.length;i++){if(Number(h[i].at)<=requestedStart)base=h[i];else break;}var end=h[h.length-1],dur=Math.max(0,Number(end.at)-Number(base.at)),xp=Math.max(0,Number(end.xpGain)-Number(base.xpGain)),gold=Math.max(0,Number(end.goldGain)-Number(base.goldGain)),coverage=Math.max(0,Math.min(100,requestedMs?100*dur/requestedMs:0)),measured=dur>=60000;return {requestedStartAt:requestedStart,measurementStartAt:Number(base.at)||null,measurementEndAt:Number(end.at)||now,durationMs:dur,coveragePct:Math.round(coverage*10)/10,coverageStatus:measured?(coverage>=95?'complete':'partial'):'warming',xpGainWindow:measured?xp:null,goldGainWindow:measured?gold:null,xpPerHour:measured?Math.round(xp*3600000/Math.max(1,dur)):null,goldPerHour:measured?Math.round(gold*3600000/Math.max(1,dur)):null,sourceCharacter:String(me)};}

  var v21420ResearchLearningBase=v214ResearchLearning;
  v214ResearchLearning=function(aliases){var x=v21420ResearchLearningBase(aliases);(x.zones||[]).forEach(function(z){var vals=['xpPerHour','goldPerHour','safetyPct'].map(function(k){return z[k];}),allZero=vals.every(function(v){return v===0;});if(allZero){z.xpPerHour=null;z.goldPerHour=null;z.safetyPct=null;z.measurementStatus='not_measured';}else z.measurementStatus='measured';});return x;};

  function v21420TeacherMetrics(){return S.teacherMetrics21420||(S.teacherMetrics21420={attempted:0,succeeded:0,suppressed:0,errors:{},lastErrorClass:'',lastErrorAt:0,quotaUntil:0,providerUntil:0});}
  function v21420TeacherClass(err){var s=String(err||'');if(/4006|daily free allocation|used up your daily free allocation/i.test(s))return 'quota_exhausted';if(/3040/.test(s))return 'provider_capacity';if(/3048/.test(s))return 'provider_internal';if(/Cloudflare-Verbindung\/Schreibschlüssel fehlt|missing-cloudflare-config/i.test(s))return 'config_missing';return s?'other':'none';}
  function v21420LocalStudentTick(){try{v210SyncUtcDay();v210OutcomeTick();if(clock()-(S.brain.lastTrainAt||0)>30000){S.brain.lastTrainAt=clock();v210ReplayTrain(1);}var pred=v210Predict();v211MaybeApplyPolicy(pred);}catch(e){audit('student_local_tick_error','Lokale Student-Logik konnte nicht vollständig laufen',{error:reason(e)},'warning');}}
  function v21420ApplyTeacherError(err){var cls=v21420TeacherClass(err),m=v21420TeacherMetrics(),now=clock();if(cls==='none')return cls;m.errors[cls]=Number(m.errors[cls]||0)+1;m.lastErrorClass=cls;m.lastErrorAt=now;if(cls==='quota_exhausted'){m.quotaUntil=now+Math.max(3600000,v210ResetMs());S.teacherSuppressedReason21419='quota-exhausted';audit('teacher_quota_backoff','Teacher-Tageskontingent erschöpft; bis zum plausiblen UTC-Reset gesperrt',{error:safeString(err,500),backoffMs:m.quotaUntil-now},'warning');}else if(cls==='provider_capacity'||cls==='provider_internal'){var b=S.teacherBreaker21419||(S.teacherBreaker21419={configFingerprint:'',failures:0,until:0,suppressedReason:''});b.failures=Math.min(4,(Number(b.failures)||0)+1);var waits=[60000,120000,300000,900000],wait=waits[b.failures-1];b.until=now+wait;b.suppressedReason=cls;m.providerUntil=b.until;S.teacherSuppressedReason21419=cls;audit('teacher_provider_backoff','Teacher-Providerfehler klassifiziert; Backoff aktiv',{error:safeString(err,500),errorClass:cls,failures:b.failures,backoffMs:wait},'warning');}return cls;}

  var v21420AuditBase=audit;
  audit=function(kind,message,data,level){if(kind==='brain_error')v21420ApplyTeacherError(data&&(data.errorClass||data.error)||message);if(kind==='teacher_call_suppressed'){var mm=v21420TeacherMetrics();mm.suppressed++;mm.errors.config_missing=Number(mm.errors.config_missing||0)+1;mm.lastErrorClass='config_missing';mm.lastErrorAt=clock();}if(/^merchant_/.test(String(kind||''))){var md=S.merchantDiagnostics21420||(S.merchantDiagnostics21420={events:{},minFreeSlots:null,lastKind:'',lastAt:0});md.events[kind]=Number(md.events[kind]||0)+1;md.lastKind=kind;md.lastAt=clock();}return v21420AuditBase(kind,message,data,level);};

  var v21420TeacherBase=v290BrainTick;
  v290BrainTick=function(trigger,force){var now=clock(),m=v21420TeacherMetrics(),configured=!!(String(C.webDashboardConnectionUrl||'').trim()&&String(C.webDashboardWriteKey||'').trim()),b=S.teacherBreaker21419;if(!configured){m.suppressed++;m.errors.config_missing=Number(m.errors.config_missing||0)+1;m.lastErrorClass='config_missing';m.lastErrorAt=now;S.teacherSuppressedReason21419='missing-cloudflare-config';v21420LocalStudentTick();if(now>Number(S.times.teacherSuppressed21420||0)){S.times.teacherSuppressed21420=now+300000;v21420AuditBase('teacher_call_suppressed','Teacher-Aufruf wegen fehlender Cloudflare-Konfiguration unterdrückt',{reason:'missing-cloudflare-config'},'warning');}return false;}if(now<Number(m.quotaUntil||0)){m.suppressed++;S.teacherSuppressedReason21419='quota-exhausted';v21420LocalStudentTick();return false;}if(b&&now<Number(b.until||0)){m.suppressed++;S.teacherSuppressedReason21419=b.suppressedReason||'provider-backoff';v21420LocalStudentTick();return false;}var beforeReq=Number(S.brain&&S.brain.requests)||0,r=v21420TeacherBase(trigger,force);if(r)m.attempted++;P.setTimeout(function(){var err=String(S.brain&&S.brain.lastError||'');if(err)v21420ApplyTeacherError(err);else if(r&&Number(S.brain&&S.brain.requests)>beforeReq){m.succeeded++;m.lastErrorClass='';m.providerUntil=0;}},2500);return r;};

  function v21420MerchantBlockedReason(){if(character.ctype!=='merchant')return null;if(v21419CapacityHard())return 'capacity';var b=S.teacherBreaker21419,m=v21420TeacherMetrics();if(clock()<Number(m.quotaUntil||0))return 'teacher-quota';if(b&&clock()<Number(b.until||0))return 'teacher-provider';if(S.bankFull)return 'bank-full';if(S.inventoryPressureBusy)return 'inventory-pressure';if(S.exchangeRouteFlight21418&&S.exchangeRouteFlight21418.active)return 'exchange-route';return null;}
  function v21420MerchantTelemetry(){var r=v21419RouteState(),m=v21420TeacherMetrics(),md=S.merchantDiagnostics21420||(S.merchantDiagnostics21420={events:{},minFreeSlots:null,lastKind:'',lastAt:0}),free=freeSlots();md.minFreeSlots=md.minFreeSlots==null?free:Math.min(Number(md.minFreeSlots),free);return {blockedReason:v21420MerchantBlockedReason(),freeSlots:free,minFreeSlots:md.minFreeSlots,inventorySlots:(character.items||[]).length||0,capacityHard:v21419CapacityHard(),bankFull:!!S.bankFull,exchangeActive:!!(S.exchangeRouteFlight21418&&S.exchangeRouteFlight21418.active),economicFlight:v21417EconomicFlightKind(character.q)||null,loopSignature:S.merchantLoop21419&&S.merchantLoop21419.fingerprint||null,recoveryCount:Number(S.merchantLoop21419&&S.merchantLoop21419.recoveryCount)||0,routeOwner:r.owner||null,routePriority:Number(r.priority),routeAgeMs:r.owner?Math.max(0,clock()-Number(r.since||clock())):0,teacherSuppressedReason:S.teacherSuppressedReason21419||null,teacherErrorClass:m.lastErrorClass||null,eventCounts:Object.assign({},md.events||{}),lastMerchantEvent:md.lastKind||null,lastMerchantEventAt:Number(md.lastAt)||0};}

  function v21420LearningObservability(hours){var cutoff=clock()-clamp(Number(hours)||24,1,168)*3600000,diary=(S.brainDiary||[]).filter(function(e){return e&&Number(e.at||0)>=cutoff;}),outcomes=diary.filter(function(e){return e.kind==='outcome'&&e.reward!=null;}),rewards=outcomes.map(function(e){return Number(e.reward);}).filter(isFinite),decisions=(S.auditRecent||[]).filter(function(e){return e&&Number(e.at||0)>=cutoff&&(e.kind==='brain_decision'||e.kind==='brain_student_apply');}).length,tm=v21420TeacherMetrics(),sum=rewards.reduce(function(a,b){return a+b;},0);return {source:'local-audit-window',decisionCount:decisions,outcomeCount:outcomes.length,decisionOutcomeCoveragePct:decisions?Math.round(Math.min(100,100*outcomes.length/decisions)*10)/10:null,pendingOutcomes:Number(S.brainPending&&S.brainPending.length)||0,reward:{count:rewards.length,min:rewards.length?Math.min.apply(Math,rewards):null,max:rewards.length?Math.max.apply(Math,rewards):null,avg:rewards.length?Math.round(sum/rewards.length*10000)/10000:null,positive:rewards.filter(function(x){return x>0;}).length,zero:rewards.filter(function(x){return x===0;}).length,negative:rewards.filter(function(x){return x<0;}).length},teacher:{attempted:Number(tm.attempted)||0,succeeded:Number(tm.succeeded)||0,suppressed:Number(tm.suppressed)||0,errorClasses:Object.assign({},tm.errors||{}),lastErrorClass:tm.lastErrorClass||null,quotaUntil:Number(tm.quotaUntil)||0,providerUntil:Number(tm.providerUntil)||0},overconfidenceFailureRate:null,overconfidenceStatus:'not_measured'};}

  var v21420ResearchDataBase=v214ResearchData;
  v214ResearchData=function(profile,hours,anonymize){var d=v21420ResearchDataBase(profile,hours,anonymize),w=v21420WindowMeasurement(hours),f=S.farmHealth||{};d.measurement=Object.assign({botVersion:VERSION,build:BUILD},w);d.performance=d.performance||{};d.performance.xpGain=w.xpGainWindow;d.performance.goldGain=w.goldGainWindow;d.performance.xpPerHour=w.xpPerHour;d.performance.goldPerHour=w.goldPerHour;d.performance.farmSafetyPct=(Object.prototype.hasOwnProperty.call(f,'safetyPct')&&isFinite(Number(f.safetyPct)))?Number(f.safetyPct):null;(d.highlights||[]).forEach(function(x){if(x&&x.kind==='error'&&/Teacher vorübergehend nicht erreichbar/i.test(String(x.title||'')))x.reward=null;});d.learningObservability=v21420LearningObservability(hours);if(character.ctype==='merchant')d.merchantTelemetry=v21420MerchantTelemetry();d.dataLimitations=(d.dataLimitations||[]).concat(['Research-Fenster ist nur so vollständig wie die im aktuellen Bot-Session-Verlauf vorhandenen Messpunkte; coveragePct kennzeichnet Teilfenster.','Overconfidence-Fehlerrate bleibt null, solange keine belastbare Confidence-zu-Outcome-Zuordnung im Audit vorhanden ist.']);return d;};

  var v21420DashboardBase=dashboardPayload;
  dashboardPayload=function(){var d=v21420DashboardBase();d.learningObservability=v21420LearningObservability(Math.min(24,Number(C.brainResearchHours)||24));if(character.ctype==='merchant')d.merchantTelemetry=v21420MerchantTelemetry();return d;};

  var v21420TickBase=tick;
  tick=function(){v21420ResearchSample(false);if(character.ctype==='merchant')v21420MerchantTelemetry();return v21420TickBase();};

  audit('feature_contract','2.14.20 Research Window Integrity + Teacher Error Classification/Quota Breaker + Merchant/Learning Observability geprüft',{features:FEATURE_CONTRACT});
`;

if (bot.includes('// 2.14.20 Measurement integrity')) throw new Error('2.14.20 block already present');
bot = mustReplace(bot, "\n})();", block + "\n})();", 'bot closure');
write('bot.js', bot);

const version = JSON.parse(read('version.json'));
version.version = '2.14.20';
version.dashboardVersion = '2.14.20';
version.build = '2026-09-11';
write('version.json', JSON.stringify(version, null, 2) + '\n');

const pkgPath='cloudflare-dashboard/package.json';
const pkg=JSON.parse(read(pkgPath));pkg.version='2.14.20';write(pkgPath,JSON.stringify(pkg,null,2)+'\n');

for (const p of ['cloudflare-dashboard/src/worker.js','cloudflare-dashboard/dashboard.html','scripts/verify-release.js']) {
  let s=read(p);s=s.replaceAll('2.14.19','2.14.20');write(p,s);
}
for (const name of fs.readdirSync('scripts').filter(n=>/^smoke.*\.(?:js|mjs)$/.test(n))) {
  const p=path.join('scripts',name);let s=read(p);s=s.replaceAll('2.14.19','2.14.20');write(p,s);
}

const smoke = `const fs=require('fs');\nconst bot=fs.readFileSync('bot.js','utf8');\nconst v=JSON.parse(fs.readFileSync('version.json','utf8'));\nfunction ok(x,m){if(!x)throw new Error(m);}\nok(v.version==='2.14.20'&&v.dashboardVersion==='2.14.20','version sync');\nok(/var VERSION = '2\\.14\\.20'/.test(bot),'bot version');\n['research-window-integrity','teacher-error-classification','teacher-quota-circuit-breaker','merchant-diagnostic-completeness','learning-observability'].forEach(x=>ok(bot.includes(x),'marker '+x));\nok(bot.includes("coverageStatus:measured?(coverage>=95?'complete':'partial'):'warming'"),'window coverage');\nok(bot.includes('xpGainWindow:measured?xp:null')&&bot.includes('goldGainWindow:measured?gold:null'),'null when unmeasured');\nok(bot.includes("allZero=vals.every")&&bot.includes("measurementStatus='not_measured'"),'zone zero/null semantics');\nok(/4006\|daily free allocation\|used up your daily free allocation/.test(bot),'quota classification');\nok(bot.includes("S.teacherSuppressedReason21419='quota-exhausted'")&&bot.includes('v210ResetMs()'),'quota breaker');\nok(bot.includes('v21420LocalStudentTick')&&bot.includes('v211MaybeApplyPolicy(pred)'),'local student continues');\nok(bot.includes('decisionOutcomeCoveragePct')&&bot.includes('errorClasses:Object.assign'),'learning observability');\nok(bot.includes('minFreeSlots')&&bot.includes('routeOwner')&&bot.includes('eventCounts'),'merchant diagnostics');\nok(bot.includes("brainStudentLearningRate: 0.012")&&bot.includes("brainStudentConfidencePct: 82")&&bot.includes("brainChallengerTrafficPct: 20"),'brain tuning unchanged');\nconsole.log('2.14.20 measurement/teacher reliability smoke OK');\n`;
write('scripts/smoke-21420-measurement-reliability.js',smoke);
console.log('Applied 2.14.20');
