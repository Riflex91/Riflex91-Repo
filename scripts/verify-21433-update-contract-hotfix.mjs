#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
function ok(x,m){if(!x)throw new Error(m);}
const bot=fs.readFileSync('bot.js','utf8');
const v=JSON.parse(fs.readFileSync('version.json','utf8'));
const dash=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const pkg=JSON.parse(fs.readFileSync('cloudflare-dashboard/package.json','utf8'));
ok(v.version==='2.14.33'&&v.dashboardVersion==='2.14.33','version.json not 2.14.33');
ok(pkg.version==='2.14.33','dashboard package not 2.14.33');
ok(bot.includes("var VERSION = '2.14.33';"),'bot version not 2.14.33');
ok(dash.includes('AiO Bot Dashboard 2.14.33'),'dashboard marker not 2.14.33');
ok(worker.includes('version:"2.14.33",brain:'),'worker health version not 2.14.33');

const m=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);ok(m,'static FEATURE_CONTRACT missing');
const manifest=JSON.parse(m[1].replace(/'/g,'"'));
const legacyCritical=['bestiary-item-policy-authority','merchant-capacity-relief-v2','merchant-bank-explicit-target','farmer-self-service-eta','farmer-self-service-failsafe','farmer-self-service-lease','brain-source-separation','permission-menu-auto-close'];
for(const f of legacyCritical)ok(manifest.includes(f),'2.14.31 runtime feature missing from static manifest: '+f);
const release32=['transactional-economic-slot-reresolution','sell-transaction-confirmation','merchant-capacity-watchdog-v2','farmer-merchant-order-self-service','dashboard-transport-fallback','cloud-state-fetch-backoff','teacher-daily-quota-4006','recipe-analysis-throttle'];
for(const f of release32)ok(manifest.includes(f),'2.14.32 protected feature missing from static manifest: '+f);
for(const f of ['update-contract-static-runtime-closure','update-contract-array-registration-parser','update-fetch-cache-bust','update-auto-singleflight'])ok(manifest.includes(f),'2.14.33 feature missing: '+f);

// Simulate the exact failure mode seen in 2.14.31: its validator only trusted the static
// manifest for array/.forEach registrations. This candidate must therefore satisfy those
// currently-protected runtime features without executing the candidate first.
const missingLegacy=legacyCritical.filter(x=>!manifest.includes(x));
ok(missingLegacy.length===0,'legacy 2.14.31 validator would still reject: '+missingLegacy.join(', '));

ok(bot.includes('var arrays=/\\[((?:\\s*'), 'array registration parser missing');
ok(bot.includes("searchParams.set('_aio_update'"),'raw GitHub cache-bust missing');
ok(bot.includes('S.updateSingleflight21433'),'automatic update singleflight missing');
ok(bot.includes('clock()+8000'),'automatic update singleflight duration missing');
ok(bot.includes('Update-Contract-Hotfix aktiv'),'hotfix feature audit missing');

// Preserve all 2.14.32 liveness/dashboard work.
for(const marker of ['sell_transaction_confirmed','merchant_capacity_watchdog','dashboard_transport_fallback','cloud_state_backoff','teacher_daily_quota_block','V21432_SERVICE_ORDER'])ok(bot.includes(marker),'2.14.32 marker lost: '+marker);
ok(bot.includes("brainMinConfidencePct: 70"),'brain confidence changed');
ok(bot.includes("brainModel: '@cf/qwen/qwen3-30b-a3b-fp8'"),'brain model changed');

new vm.Script(bot,{filename:'bot.js'});
new vm.Script(worker.replace(/\bexport\s+default\b/,'const __worker_default ='),{filename:'worker.js'});
for(const x of dash.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(x[1]);
console.log('v2.14.33 update-contract hotfix verification OK');
