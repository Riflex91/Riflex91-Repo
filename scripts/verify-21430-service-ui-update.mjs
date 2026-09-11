#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
function ok(x,m){if(!x)throw new Error(m)}
const b=fs.readFileSync('bot.js','utf8'),h=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8'),w=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8'),v=JSON.parse(fs.readFileSync('version.json','utf8')),p=JSON.parse(fs.readFileSync('cloudflare-dashboard/package.json','utf8'));
ok(v.version==='2.14.30'&&v.dashboardVersion==='2.14.30'&&p.version==='2.14.30','version mismatch');
ok(b.includes("var VERSION = '2.14.30';")&&b.includes('/* v2.14.30 Merchant service preparation, update compatibility and inventory context UX */'),'bot release marker missing');
const m=b.lastIndexOf('/* v2.14.30 Merchant service preparation, update compatibility and inventory context UX */'),tail=b.slice(m);
const order=['st.stage===\'compound\'','st.stage===\'upgrade\'','st.stage===\'sell\'','st.stage===\'potions\'','st.stage===\'bank\''];let last=-1;for(const needle of order){const i=tail.indexOf(needle);ok(i>last,'merchant service preparation order broken at '+needle);last=i;}
ok(tail.includes("typeof v273CompoundTick==='function'&&v273CompoundTick()"),'compound phase missing');
ok(tail.includes("typeof v273UpgradeTick==='function'&&v273UpgradeTick()"),'upgrade phase missing');
ok(tail.includes("typeof v273SellTrashTick==='function'&&v273SellTrashTick()"),'sell phase missing');
ok(tail.includes('Number(C.merchantBuyHPTo)')&&tail.includes('Number(C.merchantBuyMPTo)'),'configured potion targets missing');
ok(tail.includes("typeof v2148BankCleanupCandidate==='function'")&&tail.includes("typeof v2148BankCleanupTick==='function'"),'bankable item phase missing');
ok(tail.includes("audit('merchant_service_prep_done'")&&tail.includes('freeBefore:st.initialFree')&&tail.includes('freeAfter:freeSlots()'),'service preparation telemetry missing');
ok(tail.includes("el.addEventListener('mouseleave',shut,{once:true})")&&tail.includes("close.textContent='×'")&&tail.includes("close.addEventListener('click'"),'inventory context auto-close/X missing');
ok(tail.includes('v21430ClearUpdateFailure')&&tail.includes("write('updateFailure21421',null)")&&tail.includes('v2148ManualUpdateInstall=v21430ManualUpdateInstall'),'manual update backoff bypass missing');
function legacyContract(code){const mm=code.match(/var FEATURE_CONTRACT = (\[[^\n]+\]);/);if(!mm)return [];let out=JSON.parse(mm[1]),x,re=/FEATURE_CONTRACT\.push\(([\s\S]*?)\);/g;while((x=re.exec(code))){let q,y,qr=/['\"]([^'\"]+)['\"]/g;while((y=qr.exec(x[1])))if(!out.includes(y[1]))out.push(y[1]);}return out;}
const parsed=legacyContract(b);for(const f of ['merchant-equipment-first-priority','merchant-gold-second-priority','merchant-acquisition-source-router','merchant-player-market-buy','merchant-offbank-capacity-work-window','dashboard-class-markers','merchant-town-route-estimator','dashboard-map-name-only','dashboard-group-info-hidden'])ok(parsed.includes(f),'legacy updater cannot see protected feature '+f);
ok(parsed.includes('merchant-service-prep-sequence')&&parsed.includes('manual-update-backoff-bypass')&&parsed.includes('inventory-context-auto-close')&&parsed.includes('dashboard-map-fullscreen'),'new contract markers not legacy-parser visible');
ok(b.includes('/* v2.14.29 Merchant town-route estimator */')&&b.includes("audit('merchant_town_shortcut'"),'2.14.29 town routing regressed');
ok(b.includes('function v2149RefreshBankSnapshot(force)')&&b.includes('Object.keys(character.bank||{}).sort().forEach'),'multi-bank awareness regressed');
ok(b.includes('bankStoreNoProgress21423')&&b.includes('quarantinePreserved:true'),'bank quarantine safety regressed');
ok(b.includes("brainMinConfidencePct: 70")&&b.includes("brainModel: '@cf/qwen/qwen3-30b-a3b-fp8'"),'Brain invariant changed');
ok(h.includes('<title>AiO Bot Dashboard 2.14.30</title>')&&h.includes('<strong>AiO Bot Dashboard 2.14.30</strong>'),'dashboard version stale');
ok(h.includes('id="mapFullscreen"')&&h.includes('v2.14.30 group-map fullscreen'),'fullscreen control missing');
ok(h.includes('.mapcard:fullscreen')&&h.includes('requestFullscreen')&&h.includes('exitFullscreen'),'fullscreen implementation missing');
ok(h.includes('data-section="group" hidden'),'group information section is visible again');
ok(!h.includes('Gruppe unvollständig ·')&&!h.includes('Gruppenstärke Ø'),'removed dashboard group information returned');
ok(w.includes('AiO Bot Dashboard 2.14.30')&&w.includes('version:"2.14.30",brain:')&&w.includes('mapFullscreen'),'worker embedded dashboard/version stale');
new vm.Script(b,{filename:'bot.js'});for(const x of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(x[1],{filename:'dashboard-inline.js'});new vm.Script(w.replace(/\bexport\s+default\b/,'const __worker_default ='),{filename:'worker.js'});
console.log('v2.14.30 Merchant service/update/dashboard invariants OK');
