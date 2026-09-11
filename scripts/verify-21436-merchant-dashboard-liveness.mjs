#!/usr/bin/env node
import fs from 'node:fs';
function ok(cond,msg){if(!cond)throw new Error(msg);}
const bot=fs.readFileSync('bot.js','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('cloudflare-dashboard/package.json','utf8'));
ok(version.version==='2.14.36'&&version.dashboardVersion==='2.14.36','version.json not 2.14.36');
ok(pkg.version==='2.14.36','dashboard package not 2.14.36');
ok(bot.includes("var VERSION = '2.14.36';"),'bot VERSION missing');
for(const f of ['merchant-bank-quarantine-operation-scope','merchant-service-route-serialization','merchant-emergency-sell-slot-release','dashboard-compact-write-fallback','dashboard-cors-ack-poll'])ok(bot.includes("'"+f+"'"),'missing feature '+f);
ok(bot.includes('function v21436CommittedBankWork()'),'scoped bank work guard missing');
ok(bot.includes('if(v21436CommittedBankWork())'),'bank escape scope guard missing');
ok(bot.includes("v21436ServicePrepOwnsRoute()"),'service route serialization missing');
ok(bot.includes("sell(row.index,sellQ)"),'batch emergency sell missing');
ok(bot.includes("if(sellQ<localQ)return false"),'slot-release requirement missing');
ok(bot.includes("/api/push-ack"),'CORS ack endpoint missing in bot');
ok(bot.includes('v21436CompactDashboardPayload'),'compact dashboard fallback missing');
ok(bot.includes("dashboard_cors_ack_retry"),'dashboard fallback audit missing');
ok(worker.includes('async function handlePushAckJson('),'worker JSON ack handler missing');
ok(worker.includes('url.pathname==="/api/push-ack"'),'worker JSON ack route missing');
ok(worker.includes('"access-control-allow-methods":"GET, POST, OPTIONS"'),'worker GET CORS support missing');
ok(worker.includes('version:"2.14.36",brain:'),'worker health version missing');
ok(bot.includes("brainModel: '@cf/qwen/qwen3-30b-a3b-fp8'"),'brain model changed unexpectedly');
ok(bot.includes('brainMinConfidencePct: 70'),'brain confidence changed unexpectedly');
console.log('v2.14.36 merchant/dashboard regression verifier OK');
