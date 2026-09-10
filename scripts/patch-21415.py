from pathlib import Path
import json,re

ROOT=Path('.')

def once(text,old,new,label):
    n=text.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1 match, got {n}')
    return text.replace(old,new,1)

botp=ROOT/'bot.js'; bot=botp.read_text(encoding='utf-8')
bot=once(bot,'/* Adventure Land • AiO Bot 2.14.14 | 2026-09-10','/* Adventure Land • AiO Bot 2.14.15 | 2026-09-10','header')
bot=once(bot,"  var VERSION = '2.14.14';","  var VERSION = '2.14.15';",'VERSION')
old="""    'merchant-performance-budget','merchant-performance-telemetry','dashboard-terrain-pass-through','dashboard-vector-map-fallback','cloud-unconfigured-idle'\n  ];"""
new="""    'merchant-performance-budget','merchant-performance-telemetry','dashboard-terrain-pass-through','dashboard-vector-map-fallback','cloud-unconfigured-idle',\n    'merchant-bank-progress-lease','merchant-bank-sync-diagnostics'\n  ];"""
bot=once(bot,old,new,'FEATURE_CONTRACT')
old="""  function v2148BankCleanupFinish(kind,detail,level){\n    var st=S.merchantBankCleanup2148;if(!st)return;\n    audit(kind,detail,{durationMs:clock()-Number(st.startedAt||clock()),stores:Number(st.stores)||0,free:freeSlots(),reserve:Number(C.merchantInventoryReserve||5)},level||'info');\n    S.merchantBankCleanup2148=null;\n  }"""
new="""  function v2148BankCleanupFinish(kind,detail,level,extra){\n    var st=S.merchantBankCleanup2148;if(!st)return;\n    var data=Object.assign({durationMs:clock()-Number(st.startedAt||clock()),stores:Number(st.stores)||0,free:freeSlots(),reserve:Number(C.merchantInventoryReserve||5)},extra||{});\n    audit(kind,detail,data,level||'info');\n    S.merchantBankCleanup2148=null;\n  }"""
bot=once(bot,old,new,'cleanup finish diagnostics')
old="""      v2148BankCleanupFinish('merchant_bank_cleanup_sync_wait','Bankantwort erhalten, aber Inventar-/Bankzustand wurde nicht rechtzeitig bestätigt; kein erneutes Senden desselben Slots','warning');"""
new="""      v2148BankCleanupFinish('merchant_bank_cleanup_sync_wait','Bankantwort erhalten, aber Inventar-/Bankzustand wurde nicht rechtzeitig bestätigt; kein erneutes Senden desselben Slots','warning',{item:a.name,level:Number(a.level)||0,waitedMs:now-Number(a.startedAt||now),beforeExact:Number(a.beforeExact)||0,afterExact:local,beforeFree:Number(a.beforeFree)||0,afterFree:free,beforeBank:Number(a.beforeBank)||0,afterBank:bank});"""
bot=once(bot,old,new,'sync wait detail')
marker="""  v2148BankCleanupTick=function(){\n    var now=clock(),st=S.merchantBankCleanup2148,cand;"""
replacement="""  function v21415BankCleanupLeaseExpired(st,now){\n    var anchor=Number(st&&st.lastProgressAt)||Number(st&&st.startedAt)||Number(now)||0;\n    return Number(now)-anchor>30000;\n  }\n  v2148BankCleanupTick=function(){\n    var now=clock(),st=S.merchantBankCleanup2148,cand;"""
bot=once(bot,marker,replacement,'progress lease helper')
bot=once(bot,"if(now-Number(st.startedAt||now)>30000||Number(st.stores||0)>=10){","if(v21415BankCleanupLeaseExpired(st,now)||Number(st.stores||0)>=10){",'progress lease use')
feature_audit="""  audit('feature_contract','2.14.14 Merchant-Performancebudget + Laufzeittelemetrie + Dashboard-Terrain-Pipeline geprüft',{features:FEATURE_CONTRACT,cloudConfigured:v21414CloudConfigured()});"""
bot=once(bot,feature_audit,feature_audit+"\n  audit('feature_contract','2.14.15 Bank-Fortschrittslease + Sync-Wait-Diagnostik geprüft',{features:FEATURE_CONTRACT});",'21415 feature audit')
botp.write_text(bot,encoding='utf-8')

vp=ROOT/'version.json'; v=json.loads(vp.read_text(encoding='utf-8'))
if v.get('version')!='2.14.14' or v.get('dashboardVersion')!='2.14.14': raise SystemExit('unexpected version baseline')
v['version']='2.14.15';v['dashboardVersion']='2.14.15';vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

dp=ROOT/'cloudflare-dashboard'/'dashboard.html'; dash=dp.read_text(encoding='utf-8')
if 'AiO Bot Dashboard 2.14.14' not in dash: raise SystemExit('dashboard baseline missing')
dash=dash.replace('2.14.14','2.14.15');dp.write_text(dash,encoding='utf-8')

pp=ROOT/'cloudflare-dashboard'/'package.json'; pkg=json.loads(pp.read_text(encoding='utf-8'))
if pkg.get('version')!='2.14.14': raise SystemExit('package baseline mismatch')
pkg['version']='2.14.15';pp.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

wp=ROOT/'cloudflare-dashboard'/'src'/'worker.js'; worker=wp.read_text(encoding='utf-8').replace('2.14.14','2.14.15')
start=worker.index('const DASHBOARD_HTML = ');q=worker.index('"',start);i=q+1
while i<len(worker):
    if worker[i]=='\\': i+=2; continue
    if worker[i]=='"' and i+1<len(worker) and worker[i+1]==';': end=i+2;break
    i+=1
else: raise SystemExit('DASHBOARD_HTML terminator missing')
worker=worker[:start]+'const DASHBOARD_HTML = '+json.dumps(dash,ensure_ascii=False)+';'+worker[end:]
wp.write_text(worker,encoding='utf-8')

vr=ROOT/'scripts'/'verify-release.js'; verify=vr.read_text(encoding='utf-8').replace('2.14.14','2.14.15')
old='  "merchant-performance-budget","merchant-performance-telemetry","dashboard-terrain-pass-through","dashboard-vector-map-fallback","cloud-unconfigured-idle"\n];'
new='  "merchant-performance-budget","merchant-performance-telemetry","dashboard-terrain-pass-through","dashboard-vector-map-fallback","cloud-unconfigured-idle",\n  "merchant-bank-progress-lease","merchant-bank-sync-diagnostics"\n];'
verify=once(verify,old,new,'verify feature list')
final='if (!process.exitCode) console.log(`Regression checks OK · ${requiredFeatures.length} protected features · version ${version.version} · Brain v2.14 · Research Bridge · Merchant performance + terrain pipeline`);'
checks='''for (const feature of ["merchant-bank-progress-lease","merchant-bank-sync-diagnostics"]) ok(contract.includes(feature), `2.14.15 protected feature missing: ${feature}`);\nok(bot.includes("function v21415BankCleanupLeaseExpired"), "2.14.15 bank progress lease helper missing");\nok(bot.includes("v21415BankCleanupLeaseExpired(st,now)"), "2.14.15 bank timeout is not progress-relative");\nok(bot.includes("beforeExact:Number(a.beforeExact)||0") && bot.includes("afterBank:bank"), "2.14.15 sync-wait before/after diagnostics missing");\nok(bot.includes("function v2148BankCleanupFinish(kind,detail,level,extra)"), "2.14.15 cleanup finish extra diagnostics channel missing");\n\n'''+final.replace('Merchant performance + terrain pipeline','Merchant performance + terrain + bank lease')
verify=once(verify,final,checks,'verify checks')
vr.write_text(verify,encoding='utf-8')

for p in (ROOT/'scripts').glob('smoke*'):
    if not p.is_file() or p.suffix not in ('.js','.mjs'): continue
    s=p.read_text(encoding='utf-8').replace(r'2\.14\.14',r'2\.14\.15').replace('2.14.14','2.14.15')
    p.write_text(s,encoding='utf-8')

smoke=r'''const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.15');
const cm=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);assert(cm);
const contract=JSON.parse(cm[1].replace(/'/g,'"'));
for(const f of ['merchant-bank-progress-lease','merchant-bank-sync-diagnostics'])assert(contract.includes(f),f);
const m=bot.match(/function v21415BankCleanupLeaseExpired\(st,now\)\{[\s\S]*?\n  \}/);assert(m,'lease helper missing');
const ctx={Number};vm.createContext(ctx);vm.runInContext(m[0],ctx);
assert.strictEqual(ctx.v21415BankCleanupLeaseExpired({startedAt:1000,lastProgressAt:29000},31000),false,'recent confirmed progress must extend cleanup lease');
assert.strictEqual(ctx.v21415BankCleanupLeaseExpired({startedAt:1000,lastProgressAt:1000},31001),true,'30s without progress must expire cleanup lease');
assert(bot.includes("v2148BankCleanupFinish('merchant_bank_cleanup_sync_wait'"));
for(const k of ['beforeExact','afterExact','beforeFree','afterFree','beforeBank','afterBank','waitedMs'])assert(bot.includes(k+':')||bot.includes(k+':Number'),k+' diagnostic missing');
assert(bot.includes('function v2148BankCleanupFinish(kind,detail,level,extra)'));
console.log('2.14.15 bank progress lease / sync diagnostics smoke OK');
'''
(ROOT/'scripts'/'smoke-21415-bank-lease.js').write_text(smoke,encoding='utf-8')
print('Prepared 2.14.15 bank lease diagnostics hotfix')
