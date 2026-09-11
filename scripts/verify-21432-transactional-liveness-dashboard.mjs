#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';
const bot=fs.readFileSync('bot.js','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const dash=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));

assert.equal(version.version,'2.14.32');
assert.equal(version.dashboardVersion,'2.14.32');
assert(bot.includes("var VERSION = '2.14.32';"));
assert(bot.includes('/* v2.14.32 Transactional Merchant liveness, mirrored Farmer service order and resilient dashboard transport */'));
assert(bot.includes("var V21432_SERVICE_ORDER=['compound','upgrade','sell','potions','bank'];"));
assert(bot.includes('bank_store_slot_relocated'));
assert(bot.includes('economic_slot_relocated'));
assert(bot.includes('sell_transaction_started'));
assert(bot.includes('sell_transaction_confirmed'));
assert(bot.includes('sell_transaction_no_progress'));
assert(bot.includes('merchant_capacity_watchdog'));
assert(bot.includes('farmer_self_service_complete'));
assert(bot.includes("mode:'no-cors'"));
assert(bot.includes('sendBeacon'));
assert(bot.includes('dashboard_transport_fallback'));
assert(bot.includes('v21432DashboardBackoffMs'));
assert(bot.includes("path==='/api/state'"));
assert(bot.includes('cloud_state_backoff'));
assert(bot.includes('<12000'));

const mark=bot.lastIndexOf('/* v2.14.32 Transactional Merchant liveness');
assert(mark>=0);
const tail=bot.slice(mark);
const compound=tail.indexOf("plan.compound.length");
const upgrade=tail.indexOf("plan.upgrade.length");
const sell=tail.indexOf("plan.sell.length");
const potions=tail.indexOf('v21431FarmerPotionTick()');
const bank=tail.indexOf("plan.bank.length",potions);
assert(compound>=0&&upgrade>compound&&sell>upgrade&&potions>sell&&bank>potions,'Farmer city-service order must match Merchant: compound -> upgrade -> sell -> potions -> bank');

assert(worker.includes('version:"2.14.32",brain:'));
assert(worker.includes('Workers AI daily neuron quota reached'));
assert(worker.includes('/\\b4006\\b|daily free allocation/i'));
assert(worker.includes('blocked:true'));
assert(worker.includes('MAX(brain_usage.neurons,excluded.neurons)'));
assert(worker.includes('https://adventure.land'));
assert(worker.includes('https://www.adventure.land'));
assert(dash.includes('AiO Bot Dashboard 2.14.32'));
console.log('v2.14.32 verification OK');
