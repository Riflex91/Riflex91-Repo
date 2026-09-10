from pathlib import Path
import json

ROOT = Path('.')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, got {count}')
    return text.replace(old, new, 1)


bot_path = ROOT / 'bot.js'
bot = bot_path.read_text(encoding='utf-8')

bot = replace_once(
    bot,
    '/* Adventure Land • AiO Bot 2.14.12 | 2026-09-10',
    '/* Adventure Land • AiO Bot 2.14.13 | 2026-09-10',
    'bot header version',
)
bot = replace_once(
    bot,
    "  var VERSION = '2.14.12';",
    "  var VERSION = '2.14.13';",
    'bot VERSION',
)

old_contract_tail = """    'merchant-bank-warehouse','merchant-active-discovery','merchant-gathering','merchant-discovery-safety',
    'brain-world-model','brain-safe-experiments','brain-planner','brain-explainability','brain-module-permissions','dashboard-game-sprites'
  ];"""
new_contract_tail = """    'merchant-bank-warehouse','merchant-active-discovery','merchant-gathering','merchant-discovery-safety',
    'brain-world-model','brain-safe-experiments','brain-planner','brain-explainability','brain-module-permissions','dashboard-game-sprites',
    'merchant-bank-cleanup-confirmation','brain-teaching-hints','dashboard-terrain-tiles','dashboard-learning-feed'
  ];"""
bot = replace_once(bot, old_contract_tail, new_contract_tail, 'static FEATURE_CONTRACT tail')

old_economy_call = "    v2144AuditEconomy('sell',cand.item,cand.decision,{quantity:cand.qty});"
new_economy_call = "    audit('merchant_economy_decision','NPC-Verkauf nach Wert/Drop/Reserve-Prüfung',{item:cand.item.name,level:Number(cand.item.level)||0,quantity:cand.qty,decision:cand.decision});"
bot = replace_once(bot, old_economy_call, new_economy_call, 'undefined v2144AuditEconomy call')

old_bank_block = """  function v21412InventoryExact(name,level){var lv=Math.max(0,Number(level)||0),n=0;(character.items||[]).forEach(function(it){if(it&&it.name===name&&(Number(it.level)||0)===lv)n+=Number(it.q)||1;});return n;}
  function v21412BankCleanupAwaiting(st,now){
    var a=st&&st.awaiting;if(!a)return false;
    var local=v21412InventoryExact(a.name,a.level),free=freeSlots(),bank=v2149BankMap()?v2149BankCount(a.name,a.level):Number(a.beforeBank)||0;
    if(local<Number(a.beforeExact)||free>Number(a.beforeFree)||bank>Number(a.beforeBank)){
      st.awaiting=null;st.stores=Number(st.stores||0)+1;st.lastProgressAt=now;
      try{v2149RefreshBankSnapshot(true);}catch(e){}
      audit('merchant_bank_cleanup_confirmed','Banklagerung durch aktualisierten Zustand bestätigt',{item:a.name,level:a.level,beforeExact:a.beforeExact,afterExact:local,beforeFree:a.beforeFree,afterFree:free,stores:st.stores});
      return false;
    }
    if(now-Number(a.startedAt||now)>5000){
      S.times.bankCleanupRetry2148=now+15000;
      st.awaiting=null;
      v2148BankCleanupFinish('merchant_bank_cleanup_sync_wait','Bankantwort erhalten, aber Inventar-/Bankzustand wurde nicht rechtzeitig bestätigt; kein erneutes Senden desselben Slots','warning');
      return false;
    }
    return true;
  }"""
new_bank_block = """  function v21412InventoryExact(name,level){var lv=Math.max(0,Number(level)||0),n=0;(character.items||[]).forEach(function(it){if(it&&it.name===name&&(Number(it.level)||0)===lv)n+=Number(it.q)||1;});return n;}
  function v21413LiveBankCount(name,level){
    var lv=Math.max(0,Number(level)||0),n=0,bank=character.bank||{};
    Object.keys(bank).forEach(function(pack){
      if(!/^items\\d+$/.test(pack)||!Array.isArray(bank[pack]))return;
      bank[pack].forEach(function(it){if(it&&it.name===name&&(Number(it.level)||0)===lv)n+=Number(it.q)||1;});
    });
    return n;
  }
  function v21412BankCleanupAwaiting(st,now){
    var a=st&&st.awaiting;if(!a)return false;
    var local=v21412InventoryExact(a.name,a.level),free=freeSlots(),bank=Number(a.beforeBank)||0;
    if(v2149BankMap()&&character.bank){
      bank=v21413LiveBankCount(a.name,a.level);
      try{v2149RefreshBankSnapshot(true);}catch(e){}
    }
    if(local<Number(a.beforeExact)||free>Number(a.beforeFree)||bank>Number(a.beforeBank)){
      var confirmation=local<Number(a.beforeExact)?'inventory-quantity':(free>Number(a.beforeFree)?'free-slot':'live-bank');
      st.awaiting=null;st.stores=Number(st.stores||0)+1;st.lastProgressAt=now;
      audit('merchant_bank_cleanup_confirmed','Banklagerung durch aktualisierten Zustand bestätigt',{item:a.name,level:a.level,beforeExact:a.beforeExact,afterExact:local,beforeFree:a.beforeFree,afterFree:free,beforeBank:a.beforeBank,afterBank:bank,confirmation:confirmation,stores:st.stores});
      return false;
    }
    if(now-Number(a.startedAt||now)>5000){
      S.times.bankCleanupRetry2148=now+15000;
      st.awaiting=null;
      v2148BankCleanupFinish('merchant_bank_cleanup_sync_wait','Bankantwort erhalten, aber Inventar-/Bankzustand wurde nicht rechtzeitig bestätigt; kein erneutes Senden desselben Slots','warning');
      return false;
    }
    return true;
  }"""
bot = replace_once(bot, old_bank_block, new_bank_block, '2.14.12 bank confirmation block')
bot = replace_once(
    bot,
    'beforeBank:v2149BankCount(name,lv),startedAt:now',
    'beforeBank:v21413LiveBankCount(name,lv),startedAt:now',
    'bank cleanup live baseline',
)

bot_path.write_text(bot, encoding='utf-8')

version_path = ROOT / 'version.json'
version = json.loads(version_path.read_text(encoding='utf-8'))
if version.get('version') != '2.14.12' or version.get('dashboardVersion') != '2.14.12':
    raise SystemExit(f'unexpected version.json baseline: {version!r}')
version['version'] = '2.14.13'
version['dashboardVersion'] = '2.14.13'
version_path.write_text(json.dumps(version, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

dash_path = ROOT / 'cloudflare-dashboard' / 'dashboard.html'
dash = dash_path.read_text(encoding='utf-8')
if 'AiO Bot Dashboard 2.14.12' not in dash:
    raise SystemExit('dashboard 2.14.12 title missing')
dash = dash.replace('2.14.12', '2.14.13')
dash_path.write_text(dash, encoding='utf-8')

pkg_path = ROOT / 'cloudflare-dashboard' / 'package.json'
pkg = json.loads(pkg_path.read_text(encoding='utf-8'))
if pkg.get('version') != '2.14.12':
    raise SystemExit(f'unexpected dashboard package baseline: {pkg.get("version")}')
pkg['version'] = '2.14.13'
pkg_path.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

worker_path = ROOT / 'cloudflare-dashboard' / 'src' / 'worker.js'
worker = worker_path.read_text(encoding='utf-8')
worker = worker.replace('2.14.12', '2.14.13')
start = worker.index('const DASHBOARD_HTML = ')
q = worker.index('"', start)
i = q + 1
while i < len(worker):
    if worker[i] == '\\':
        i += 2
        continue
    if worker[i] == '"' and i + 1 < len(worker) and worker[i + 1] == ';':
        end = i + 2
        break
    i += 1
else:
    raise SystemExit('worker DASHBOARD_HTML terminator missing')
worker = worker[:start] + 'const DASHBOARD_HTML = ' + json.dumps(dash, ensure_ascii=False) + ';' + worker[end:]
worker_path.write_text(worker, encoding='utf-8')

verify_path = ROOT / 'scripts' / 'verify-release.js'
verify = verify_path.read_text(encoding='utf-8').replace('2.14.12', '2.14.13')
required_marker = '  "champion-challenger","brain-auto-rollback","brain-life-visualization","brain-diary","brain-diary-cloud-sync","brain-diary-dashboard","brain-quality-monitor","brain-overconfidence-guard","brain-drift-quarantine","adaptive-learning-control","brain-research-bridge","research-prompt-profiles","research-secret-redaction","research-dashboard"\n];'
required_replacement = '  "champion-challenger","brain-auto-rollback","brain-life-visualization","brain-diary","brain-diary-cloud-sync","brain-diary-dashboard","brain-quality-monitor","brain-overconfidence-guard","brain-drift-quarantine","adaptive-learning-control","brain-research-bridge","research-prompt-profiles","research-secret-redaction","research-dashboard",\n  "merchant-bank-cleanup-confirmation","brain-teaching-hints","dashboard-terrain-tiles","dashboard-learning-feed"\n];'
verify = replace_once(verify, required_marker, required_replacement, 'verify-release protected feature list')
final_marker = 'if (!process.exitCode) console.log(`Regression checks OK · ${requiredFeatures.length} protected features · version ${version.version} · Brain v2.14 · Research Bridge · Merchant stability hotfix`);'
extra_checks = """for (const feature of ["merchant-bank-cleanup-confirmation","brain-teaching-hints","dashboard-terrain-tiles","dashboard-learning-feed"]) ok(contract.includes(feature), `2.14.13 static protected feature missing: ${feature}`);
ok(!bot.includes("v2144AuditEconomy("), "2.14.13 undefined Merchant economy audit helper reference remains");
ok(bot.includes("function v21413LiveBankCount"), "2.14.13 live bank confirmation helper missing");
ok(bot.includes("beforeBank:v21413LiveBankCount(name,lv)"), "2.14.13 bank cleanup baseline must use live bank state");
ok(bot.includes("confirmation:confirmation"), "2.14.13 bank cleanup confirmation source diagnostic missing");

""" + final_marker
verify = replace_once(verify, final_marker, extra_checks, 'verify-release 2.14.13 checks')
verify_path.write_text(verify, encoding='utf-8')

for p in (ROOT / 'scripts').glob('smoke*'):
    if not p.is_file() or p.suffix not in ('.js', '.mjs'):
        continue
    s = p.read_text(encoding='utf-8')
    s = s.replace(r'2\.14\.12', r'2\.14\.13')
    s = s.replace('2.14.12', '2.14.13')
    p.write_text(s, encoding='utf-8')

smoke = r'''const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const dash=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));

assert.equal(version.version,'2.14.13');
assert.equal(version.dashboardVersion,'2.14.13');
assert(bot.includes("var VERSION = '2.14.13';"));
assert(dash.includes('AiO Bot Dashboard 2.14.13'));
assert(worker.includes('AiO Bot Dashboard 2.14.13'));
assert(!bot.includes('v2144AuditEconomy('),'undefined v2144AuditEconomy reference must be gone');

const contractMatch=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);
assert(contractMatch,'FEATURE_CONTRACT missing');
const contract=JSON.parse(contractMatch[1].replace(/'/g,'"'));
for(const feature of ['merchant-bank-cleanup-confirmation','brain-teaching-hints','dashboard-terrain-tiles','dashboard-learning-feed']) assert(contract.includes(feature),'static FEATURE_CONTRACT missing '+feature);

assert(bot.includes('function v21413LiveBankCount'));
assert(bot.includes('beforeBank:v21413LiveBankCount(name,lv)'));
const start=bot.indexOf('  function v21413LiveBankCount');
const end=bot.indexOf('\n\n  v2148BankCleanupTick=function',start);
assert(start>=0&&end>start,'bank confirmation functions not extractable');
const source=bot.slice(start,end);
const ctx={
  character:{items:[{name:'slice_honey',level:0,q:38},null],bank:{items0:[{name:'slice_honey',level:0,q:100}]}},
  S:{times:{},merchantBankCleanup2148:{}},
  audits:[],refreshes:0,finish:'',
  freeSlots:null,
  v2149BankMap:()=>true,
  v2149RefreshBankSnapshot:()=>{ctx.refreshes++;},
  audit:(kind,message,data)=>ctx.audits.push({kind,message,data}),
  v2148BankCleanupFinish:(kind)=>{ctx.finish=kind;ctx.S.merchantBankCleanup2148=null;}
};
ctx.freeSlots=()=>ctx.character.items.filter(x=>!x).length;
ctx.v21412InventoryExact=(name,level)=>ctx.character.items.reduce((n,it)=>n+(it&&it.name===name&&(Number(it.level)||0)===(Number(level)||0)?(Number(it.q)||1):0),0);
vm.createContext(ctx);
vm.runInContext(source,ctx);

const progressed={awaiting:{name:'slice_honey',level:0,beforeExact:38,beforeFree:1,beforeBank:100,startedAt:1000},stores:0,lastProgressAt:1000};
ctx.character.bank.items0[0].q=138;
assert.strictEqual(ctx.v21412BankCleanupAwaiting(progressed,2000),false);
assert.strictEqual(progressed.awaiting,null);
assert.strictEqual(progressed.stores,1);
const confirmed=ctx.audits.find(x=>x.kind==='merchant_bank_cleanup_confirmed');
assert(confirmed,'live bank delta must confirm cleanup');
assert.strictEqual(confirmed.data.confirmation,'live-bank');
assert.strictEqual(confirmed.data.beforeBank,100);
assert.strictEqual(confirmed.data.afterBank,138);
assert(ctx.refreshes>0,'confirmed live state should refresh the warehouse snapshot');

ctx.audits=[];ctx.finish='';ctx.S.merchantBankCleanup2148={};
ctx.character.bank.items0[0].q=138;
const stalled={awaiting:{name:'slice_honey',level:0,beforeExact:38,beforeFree:1,beforeBank:138,startedAt:1000},stores:0,lastProgressAt:1000};
assert.strictEqual(ctx.v21412BankCleanupAwaiting(stalled,7001),false);
assert.strictEqual(ctx.finish,'merchant_bank_cleanup_sync_wait');
assert.strictEqual(stalled.stores,0,'stalled state must not be falsely confirmed');
assert.strictEqual(ctx.S.times.bankCleanupRetry2148,22001);

console.log('2.14.13 merchant stability smoke OK');
'''
(ROOT / 'scripts' / 'smoke-21413-merchant-stability.js').write_text(smoke, encoding='utf-8')

print('Prepared AiO Bot 2.14.13 merchant stability patch')
