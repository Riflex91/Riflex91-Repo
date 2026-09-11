const fs=require('fs');
const bot=fs.readFileSync('bot.js','utf8');
const v=JSON.parse(fs.readFileSync('version.json','utf8'));
function ok(x,m){if(!x)throw new Error(m);}
ok(v.version==='2.14.20'&&v.dashboardVersion==='2.14.20','version sync');
ok(/var VERSION = '2\.14\.20'/.test(bot),'bot version');
['research-window-integrity','teacher-error-classification','teacher-quota-circuit-breaker','merchant-diagnostic-completeness','learning-observability'].forEach(x=>ok(bot.includes(x),'marker '+x));
ok(bot.includes("coverageStatus:measured?(coverage>=95?'complete':'partial'):'warming'"),'window coverage');
ok(bot.includes('xpGainWindow:measured?xp:null')&&bot.includes('goldGainWindow:measured?gold:null'),'null when unmeasured');
ok(bot.includes("allZero=vals.every")&&bot.includes("measurementStatus='not_measured'"),'zone zero/null semantics');
ok(/4006|daily free allocation|used up your daily free allocation/.test(bot),'quota classification');
ok(bot.includes("S.teacherSuppressedReason21419='quota-exhausted'")&&bot.includes('v210ResetMs()'),'quota breaker');
ok(bot.includes('v21420LocalStudentTick')&&bot.includes('v211MaybeApplyPolicy(pred)'),'local student continues');
ok(bot.includes('decisionOutcomeCoveragePct')&&bot.includes('errorClasses:Object.assign'),'learning observability');
ok(bot.includes('minFreeSlots')&&bot.includes('routeOwner')&&bot.includes('eventCounts'),'merchant diagnostics');
ok(bot.includes("brainStudentLearningRate: 0.012")&&bot.includes("brainStudentConfidencePct: 82")&&bot.includes("brainChallengerTrafficPct: 20"),'brain tuning unchanged');
console.log('2.14.20 measurement/teacher reliability smoke OK');
