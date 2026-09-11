#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
function ok(x,m){if(!x)throw new Error(m)}
const b=fs.readFileSync('bot.js','utf8'),h=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8'),w=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8'),v=JSON.parse(fs.readFileSync('version.json','utf8')),p=JSON.parse(fs.readFileSync('cloudflare-dashboard/package.json','utf8'));
ok(v.version==='2.14.26'&&v.dashboardVersion==='2.14.26'&&p.version==='2.14.26','version mismatch');
ok(b.includes("var VERSION = '2.14.26';"),'bot version');
ok(b.includes('v21426BankEscapeTick')&&b.includes('merchant_bank_terminal_state_released')&&b.includes('merchant_bank_liveness_exit_attempt')&&b.includes('merchant_bank_liveness_fallback'),'terminal bank liveness missing');
ok(b.includes('quarantinePreserved:true'),'quarantine not explicitly preserved');
ok(b.includes('S.autoEconomy21422.tx=null'),'stale auto-economy transaction is not released');
ok(b.includes("brainMinConfidencePct: 70")&&b.includes("brainModel: '@cf/qwen/qwen3-30b-a3b-fp8'"),'Brain safety/model invariant changed');
ok(b.includes('v21426BrainModulesHTML')&&b.includes('data-brain-module')&&b.includes('data-brain-focus'),'clean Brain module/focus UI missing');
ok(b.includes('finde 100 bee wings'),'focus example missing');
ok(!b.includes('applyAppearance();P.setTimeout(v282ShowWhatsNew,400);'),'Whats New still scheduled');
ok(b.includes("button[data-action=\"update-check\"]")&&b.includes('v2148ManualUpdateInstall'),'manual update live delegate missing');
const terrainBlock=b.slice(b.indexOf('function v21426PackRows'),b.indexOf('// Clean Brain UI'));
ok(terrainBlock.includes("encoding:'base36-rows-v1'")&&terrainBlock.includes('v21426PackRows')&&terrainBlock.includes("source:'Adventure Land G.geometry/G.tilesets'")&&!terrainBlock.includes("fallback:'collision-lines'"),'v2.14.26 real terrain packing missing or collision fallback added');
ok(h.includes('AIO_PLAYER_ARROW_URL')&&h.includes('DSCK-w5WxbEcUXrjkq5KHyO7TN9BJmyGkiMVX2vDmEc'),'requested arrow marker missing');
ok(h.includes('.player-name21426{fill:#fff;font-size:10px'),'small character label missing');
ok(h.includes('terrainPlacements21426')&&h.includes('parseInt(v,36)'),'packed terrain decoder missing');
ok(!h.includes('G.geometry-Kollisionslinien als Vektor-Fallback'),'collision overlay hint returned');
ok(w.includes('const MAX_PUSH_BYTES = 128 * 1024;'),'worker push limit not raised for real terrain');
ok(w.includes('Dashboard 2.14.26'),'embedded dashboard stale');
new vm.Script(b,{filename:'bot.js'});
for(const m of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(m[1],{filename:'dashboard-inline.js'});
new vm.Script(w.replace(/\bexport\s+default\b/,'const __worker_default ='),{filename:'worker.js'});
console.log('v2.14.26 invariants OK');
