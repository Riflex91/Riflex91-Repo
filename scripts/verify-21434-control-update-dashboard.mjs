#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
function ok(x,m){if(!x)throw new Error(m);}
const bot=fs.readFileSync('bot.js','utf8');
const v=JSON.parse(fs.readFileSync('version.json','utf8'));
const dash=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const pkg=JSON.parse(fs.readFileSync('cloudflare-dashboard/package.json','utf8'));

ok(v.version==='2.14.34'&&v.dashboardVersion==='2.14.34','version.json not 2.14.34');
ok(pkg.version==='2.14.34','dashboard package not 2.14.34');
ok(bot.includes("var VERSION = '2.14.34';"),'bot version not 2.14.34');
ok(dash.includes('AiO Bot Dashboard 2.14.34'),'dashboard marker not 2.14.34');
ok(worker.includes('version:"2.14.34",brain:'),'worker health version not 2.14.34');

ok(!bot.includes("return v291ItemFingerprint? v291ItemFingerprint(x.it)"),'unsafe undeclared v291ItemFingerprint reference remains');
ok(bot.includes("(typeof v291ItemFingerprint==='function')?v291ItemFingerprint(x.it)"),'compound fingerprint guard missing');
ok(bot.includes("audit('update_manual_click'"),'manual update click telemetry missing');
ok(bot.includes('root.__aioManualUpdate21434'),'manual update delegate is not root-bound');
ok(bot.includes('button[data-action="update-check"],button[data-action="update-apply"]'),'manual update button interception missing');
ok(bot.includes('return selfUpdate(false);'),'manual update does not install immediately');
ok(bot.includes("P.__ALBOT2__.checkUpdate=v21434ManualUpdateInstall"),'public manual update API not rebound');

ok(worker.includes('function adventureOrigin(origin)'),'Adventure Land/null-origin CORS compatibility missing');
ok(worker.includes('origin==="null"'),'sandbox/null-origin CORS handling missing');
ok(worker.includes('async function handlePushFrame('),'verified frame POST handler missing');
ok(worker.includes('url.pathname==="/api/pushframe"'),'pushframe route missing');
ok(worker.includes('frame-ancestors https://adventure.land https://www.adventure.land'),'frame acknowledgement CSP missing');
ok(bot.includes("transport:'cloudflare-worker/frame-post'"),'verified frame transport missing in bot');
ok(bot.includes("audit('dashboard_frame_retry'"),'dashboard frame retry telemetry missing');
ok(bot.includes("audit('dashboard_ack'"),'dashboard acknowledgement telemetry missing');
ok(!bot.includes("C.brainMinConfidencePct=71"),'brain confidence unexpectedly changed');
ok(bot.includes("brainMinConfidencePct: 70"),'brain confidence default changed');
ok(bot.includes("brainModel: '@cf/qwen/qwen3-30b-a3b-fp8'"),'brain model changed');

for(const feature of ['merchant-compound-fingerprint-reference-guard','manual-update-root-bound-delegate','manual-update-immediate-install','dashboard-verified-frame-post','dashboard-null-origin-cors'])ok(bot.includes("'"+feature+"'"),'feature contract marker missing: '+feature);
new vm.Script(bot,{filename:'bot.js'});
new vm.Script(worker.replace(/\bexport\s+default\b/,'const __worker_default ='),{filename:'worker.js'});
for(const x of dash.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(x[1]);
console.log('v2.14.34 control/update/dashboard verification OK');
