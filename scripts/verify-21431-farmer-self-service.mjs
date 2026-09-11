#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
function ok(x,m){if(!x)throw new Error(m)}
const b=fs.readFileSync('bot.js','utf8'),h=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8'),w=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8'),v=JSON.parse(fs.readFileSync('version.json','utf8')),p=JSON.parse(fs.readFileSync('cloudflare-dashboard/package.json','utf8'));
ok(v.version==='2.14.31'&&v.dashboardVersion==='2.14.31'&&p.version==='2.14.31','version mismatch');
ok(b.includes("var VERSION = '2.14.31';")&&b.includes('/* v2.14.31 Farmer self-service, Bestiary item policy, Merchant liveness and Brain source separation */'),'bot release marker missing');
const m=b.lastIndexOf('/* v2.14.31 Farmer self-service, Bestiary item policy, Merchant liveness and Brain source separation */'),tail=b.slice(m);
for(const f of ['bestiary-item-policy-authority','merchant-capacity-relief-v2','merchant-bank-explicit-target','farmer-self-service-eta','farmer-self-service-failsafe','farmer-self-service-lease','brain-source-separation','permission-menu-auto-close'])ok(tail.includes("'"+f+"'"),'feature marker missing '+f);

// Bestiary/Items is authoritative; legacy Merchant editor is no longer rendered.
ok(tail.includes('merchantHTML=function()')&&tail.includes('v2147MerchantHTMLBase()'),'Merchant settings override missing');
ok(!tail.includes('+v2147RulesHTML()'),'legacy Item-Verhalten still rendered by final override');
ok(tail.includes('merchant_item_policy_migrated')&&tail.includes('C.merchantItemPermissions=permissions'),'legacy item policy migration missing');
ok(tail.includes("reason:'bestiary-'+forcedKey+'-selected'")&&tail.includes('v21431ForcedPermission'),'Bestiary positive policy selection is not authoritative');
ok(tail.includes("reason:'bestiary-'+key+'-denied'"),'Bestiary deny policy missing');

// Popup must close both ways.
ok(tail.includes("close.textContent='×'")&&tail.includes("close.addEventListener('click'")&&tail.includes("el.addEventListener('mouseleave'"),'Bestiary permission popup auto-close/X missing');

// Merchant capacity/root-cause repair.
ok(tail.includes('function v21431ServicePlan()')&&tail.includes("v21422Policy(it,'inventory')"),'shared policy plan missing');
ok(tail.includes('var v21431BankStoreBase=typeof bank_store')&&tail.includes('v21431BankStoreBase(num,autoTarget.pack,autoTarget.slot)'),'explicit bank pack/slot targeting missing');
ok(tail.includes('v21423StoreBlocked(it.name,it.level)'),'bank quarantine not respected');
ok(tail.includes("audit('merchant_capacity_emergency_sell'")&&tail.includes('v21422Protected(it)')&&tail.includes('v2144PlanNeeds(it)'),'safe Merchant capacity fallback missing');
ok(tail.includes("if(plan.sell.length&&v21431UnifiedSellTick('merchant-capacity'))")&&tail.includes('if(plan.bank.length&&v273StoreTrashBankTick())'),'capacity relief priority missing');
ok(tail.includes("return v21431UnifiedSellTick('merchant')||v21431SellTrashBase()"),'classified Merchant sale path missing');

// Farmer self-service: ETA, hysteresis, failsafe, lease, service order, return.
for(const ev of ['farmer_self_service_evaluated','farmer_self_service_selected','farmer_self_service_deferred','farmer_self_service_start','farmer_self_service_stage','farmer_self_service_done','farmer_self_service_return','farmer_self_service_failsafe','merchant_service_eta','farmer_service_eta'])ok(tail.includes("'"+ev+"'"),'telemetry event missing '+ev);
ok(tail.includes('V21431_MIN_SAVING_SECONDS=25')&&tail.includes('V21431_MIN_SAVING_PCT=30'),'ETA hysteresis thresholds changed');
ok(tail.includes('V21431_MERCHANT_STALE_MS=60000')&&tail.includes('merchant-report-stale'),'stale Merchant failsafe missing');
ok(tail.includes("type:'aio21431-self-service-lease'")&&tail.includes('V21431_LEASE_MS=150000')&&tail.includes('expiresAt'),'expiring Farmer coordination lease missing');
ok(tail.includes('if(leaseBlocked&&!critical)')&&tail.includes('critical&&(m.blocked||!m.credible'),'critical safety bypass/lease handling missing');
ok(tail.includes('origin={map:character.map,x:Number(character.x)||0,y:Number(character.y)||0,targetMtype:S.targetMtype||null,goal:S.goal?Object.assign({},S.goal):null'),'farmspot/context capture missing');
ok(tail.includes("S.targetMtype=st.origin.targetMtype")&&tail.includes("returned-to-farmspot"),'farm context restoration missing');
ok(tail.includes("route:'town'")&&tail.includes("action('Farmer-Selbstservice town()'"),'Farmer Town-vs-walk route missing');
ok(tail.includes("stage:'capacity-prep'")&&tail.includes('no-safe-capacity-for-compound-scroll')&&tail.includes('no-safe-capacity-for-upgrade-scroll'),'safe scroll-capacity preparation missing');
const serviceStart=tail.indexOf("if(st.stage==='service')");
const serviceEnd=tail.indexOf("if(st.stage==='return')");
const service=tail.slice(serviceStart,serviceEnd);
const serviceOrder=["plan.compound.length","plan.upgrade.length","plan.sell.length","plan.bank.length","v21431FarmerPotionTick()"];let pos=-1;
for(const n of serviceOrder){const i=service.indexOf(n);ok(i>pos,'Farmer service order broken at '+n);pos=i;}

// Pure decision matrix.
const fnMatch=tail.match(/function v21431SelfServiceDecision\(m,f,coord\)\{[\s\S]*?\n  \}\n\n  function v21431PeerLease/);
ok(fnMatch,'self-service decision function not extractable');
const fnCode=fnMatch[0].replace(/\n\n  function v21431PeerLease[\s\S]*$/,'');
const ctx={result:null};vm.createContext(ctx);
vm.runInContext(`var V21431_MIN_SAVING_SECONDS=25,V21431_MIN_SAVING_PCT=30;${fnCode}`,ctx);
const decide=(m,f,c)=>vm.runInContext(`v21431SelfServiceDecision(${JSON.stringify(m)},${JSON.stringify(f)},${JSON.stringify(c)})`,ctx);
let d=decide({seconds:40,credible:true,blocked:false},{seconds:100,credible:true},{critical:false,leaseBlocked:false});ok(!d.selected,'Farmer should wait when Merchant is faster');
d=decide({seconds:180,credible:true,blocked:false},{seconds:80,credible:true},{critical:false,leaseBlocked:false});ok(d.selected&&!d.failsafe&&d.savingSeconds===100,'Farmer should self-service when roundtrip is clearly faster');
d=decide({seconds:null,credible:false,blocked:true},{seconds:90,credible:true},{critical:true,leaseBlocked:true});ok(d.selected&&d.failsafe,'critical Farmer failsafe missing for unavailable Merchant');
d=decide({seconds:180,credible:true,blocked:false},{seconds:80,credible:true},{critical:false,leaseBlocked:true});ok(!d.selected&&d.reason==='peer-self-service-lease','voluntary concurrent Farmer service not deferred');
d=decide({seconds:120,credible:true,blocked:false},{seconds:100,credible:true},{critical:false,leaseBlocked:false});ok(!d.selected,'minimum absolute saving hysteresis not enforced');
d=decide({seconds:100,credible:true,blocked:false},{seconds:75,credible:true},{critical:false,leaseBlocked:false});ok(!d.selected,'minimum percentage saving hysteresis not enforced');

// Item safety and shared classification.
ok(tail.includes("if(!it||!p||p.protected)return null")&&tail.includes("!d.quest&&!d.event&&!d.cash&&!d.rare"),'forced sale safety guards missing');
ok(tail.includes('v21431ServicePlan()')&&tail.includes("var plan=v21431ServicePlan()"),'Merchant/Farmer shared classification not reused');
ok(tail.includes("return v21431BankStore(plan.bank[0],'farmer-self-service')"),'Farmer bank stage missing');
ok(tail.includes("v273EnsureScroll('scroll',row.item)")&&tail.includes("v273EnsureScroll('cscroll',row.item)"),'Farmer upgrade/compound does not reuse scroll logic');

// Existing critical behavior must remain.
ok(b.includes('/* v2.14.30 Merchant service preparation, update compatibility and inventory context UX */'),'v2.14.30 service-prep release regressed');
ok(b.includes("'merchant-service-prep-sequence'")&&b.includes("audit('merchant_service_prep_done'"),'v2.14.30 Merchant service preparation missing');
ok(b.includes('v21430ClearUpdateFailure')&&b.includes("write('updateFailure21421',null)"),'legacy update/backoff compatibility regressed');
ok(b.includes('/* v2.14.29 Merchant town-route estimator */')&&b.includes("audit('merchant_town_shortcut'"),'Merchant Town estimator regressed');
ok(b.includes("brainMinConfidencePct: 70")&&b.includes("brainModel: '@cf/qwen/qwen3-30b-a3b-fp8'"),'Brain confidence/model invariant changed');

// Brain explanation source is separated from deterministic Merchant state.
ok(tail.includes("x.sourceKind='brain'")&&tail.includes("x.current='Keine aktive neuronale Entscheidung'")&&tail.includes('x.runtimeCurrent=safeString(S.status'),'bot-side Brain source separation missing');
ok(h.includes('v2.14.31 brain source separation')&&h.includes('<b>Quelle</b>')&&h.includes('Deterministische Laufzeit')&&h.includes("sourceKind==='brain'"),'dashboard Brain source separation missing');
ok(h.includes('<title>AiO Bot Dashboard 2.14.31</title>')&&h.includes('<strong>AiO Bot Dashboard 2.14.31</strong>'),'dashboard version stale');
ok(w.includes('AiO Bot Dashboard 2.14.31')&&w.includes('version:"2.14.31",brain:')&&w.includes('v2.14.31 brain source separation'),'worker embedded dashboard/version stale');

new vm.Script(b,{filename:'bot.js'});
for(const x of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(x[1],{filename:'dashboard-inline.js'});
new vm.Script(w.replace(/\bexport\s+default\b/,'const __worker_default ='),{filename:'worker.js'});
console.log('v2.14.31 Farmer self-service / Merchant policy / Brain source invariants OK');
