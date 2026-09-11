#!/usr/bin/env node
import fs from 'node:fs';
function ok(cond,msg){if(!cond)throw new Error(msg);}
const bot=fs.readFileSync('bot.js','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('cloudflare-dashboard/package.json','utf8'));
ok(version.version==='2.14.37'&&version.dashboardVersion==='2.14.37','version.json not 2.14.37');
ok(pkg.version==='2.14.37','dashboard package not 2.14.37');
ok(bot.includes("var VERSION = '2.14.37';"),'bot VERSION missing');
for(const f of ['dashboard-lean-write-fallback','dashboard-submitted-unverified-state','merchant-bank-retrieve-capacity-preflight','merchant-bank-retrieve-capacity-relief','merchant-farm-goal-liveness','farmer-farm-goal-watchdog'])ok(bot.includes("'"+f+"'"),'missing feature '+f);
ok(bot.includes('requiredFree:reserve+needSlots'),'bank retrieval must preserve reserve plus incoming slots');
ok(bot.includes("merchant_bank_retrieve_capacity_deferred"),'bank capacity deferral audit missing');
ok(bot.includes("v21431UnifiedSellTick('merchant-bank-preflight')"),'classified sell-first capacity relief missing');
ok(bot.includes('v21431EmergencySellTick()'),'safe emergency sell capacity relief missing');
ok(bot.includes('v2148BankCleanupTick()'),'bank cleanup capacity relief missing');
ok(bot.includes("source:'live-preflight'" )||bot.includes("'live-preflight'"),'live bank preflight missing');
ok(bot.includes('function v21437SafeFarmFallback()'),'safe farm fallback missing');
ok(bot.includes("merchant_farm_goal_fallback"),'merchant farm goal liveness audit missing');
ok(bot.includes("farmer_farm_goal_watchdog"),'farmer watchdog audit missing');
ok(bot.includes('now-S.noMerchantFarmGoalSince21437<8000'),'farmer watchdog timeout changed unexpectedly');
ok(bot.includes('function v21437LeanDashboardPayload'),'lean dashboard payload missing');
ok(bot.includes("cloudflare-worker/lean-write-unverified"),'unverified dashboard state missing');
ok(bot.includes("dashboard_submit_unverified"),'transparent unverified dashboard audit missing');
ok(bot.includes('v21436DashboardAckFetch(endpoint,lean,1800)'),'best-effort readable ACK missing');
ok(worker.includes('version:"2.14.37",brain:'),'worker health version missing');
ok(bot.includes("brainModel: '@cf/qwen/qwen3-30b-a3b-fp8'"),'brain model changed unexpectedly');
ok(bot.includes('brainMinConfidencePct: 70'),'brain confidence changed unexpectedly');
console.log('v2.14.37 dashboard/bank/farm-goal regression verifier OK');
