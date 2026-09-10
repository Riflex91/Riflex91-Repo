from pathlib import Path
import json,re

ROOT=Path('.')

def once(text,old,new,label):
    n=text.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1 match, got {n}')
    return text.replace(old,new,1)

botp=ROOT/'bot.js'; bot=botp.read_text(encoding='utf-8')
bot=once(bot,'/* Adventure Land • AiO Bot 2.14.15 | 2026-09-10','/* Adventure Land • AiO Bot 2.14.16 | 2026-09-10','header')
bot=once(bot,"  var VERSION = '2.14.15';","  var VERSION = '2.14.16';",'VERSION')

old="""  var KEY = 'ALBOT27:' + ACCOUNT + ':';\n  var LEGACY_KEY = 'ALBOT2:' + ACCOUNT + ':';\n\n  function readRaw(key) { try { return P.localStorage.getItem(key); } catch (e) { return null; } }\n  function writeRaw(key, value) { try { P.localStorage.setItem(key, value); return true; } catch (e) { return false; } }\n  function read(k, fallback) { try { var raw = readRaw(KEY + k); return raw == null ? fallback : JSON.parse(raw); } catch (e) { return fallback; } }\n  function write(k, value) { try { return writeRaw(KEY + k, JSON.stringify(value)); } catch (e) { return false; } }\n  function readLegacy(k, fallback) { try { var raw = readRaw(LEGACY_KEY + k); return raw == null ? fallback : JSON.parse(raw); } catch (e) { return fallback; } }"""
new="""  var KEY = 'ALBOT27:' + ACCOUNT + ':';\n  var LEGACY_KEY = 'ALBOT2:' + ACCOUNT + ':';\n  var V21416_STABLE_CONFIG_KEY = 'ALBOT27:stable-config:' + me;\n  var V21416_STABLE_UPDATE_KEY = 'ALBOT27:stable-update-backup:' + me;\n\n  function readRaw(key) { try { return P.localStorage.getItem(key); } catch (e) { return null; } }\n  function writeRaw(key, value) { try { P.localStorage.setItem(key, value); return true; } catch (e) { return false; } }\n  function v21416ReadStableConfig(){try{var raw=readRaw(V21416_STABLE_CONFIG_KEY),box=raw?JSON.parse(raw):null;return box&&box.config&&typeof box.config==='object'?box.config:null;}catch(e){return null;}}\n  function v21416WriteStableUpdateBackup(value){try{return writeRaw(V21416_STABLE_UPDATE_KEY,JSON.stringify(value));}catch(e){return false;}}\n  function v21416FindUpdateBackup(){\n    var best=null;\n    function take(v){if(v&&v.config&&typeof v.config==='object'&&Number(v.at||0)>Number(best&&best.at||0))best=v;}\n    try{var direct=readRaw(V21416_STABLE_UPDATE_KEY);if(direct)take(JSON.parse(direct));}catch(e){}\n    try{for(var i=0;i<P.localStorage.length;i++){var k=P.localStorage.key(i);if(!k||k.indexOf('ALBOT27:')!==0||k.indexOf(me)<0||k.slice(-19)!==':updateConfigBackup')continue;var raw=P.localStorage.getItem(k);if(raw)take(JSON.parse(raw));}}catch(e){}\n    return best;\n  }\n  function read(k, fallback) { try { var raw = readRaw(KEY + k); return raw == null ? fallback : JSON.parse(raw); } catch (e) { return fallback; } }\n  function write(k, value) { try { var ok=writeRaw(KEY + k, JSON.stringify(value)); if(k==='config')writeRaw(V21416_STABLE_CONFIG_KEY,JSON.stringify({schema:1,version:VERSION,at:clock(),config:value})); return ok; } catch (e) { return false; } }\n  function readLegacy(k, fallback) { try { var raw = readRaw(LEGACY_KEY + k); return raw == null ? fallback : JSON.parse(raw); } catch (e) { return fallback; } }"""
bot=once(bot,old,new,'stable config storage')

old="""    out.roster = Array.isArray(out.roster) ? out.roster.filter(function (n, i, a) { return ACCOUNT_CHARS.some(function (x) { return x.name === n; }) && a.indexOf(n) === i; }).slice(0, 4) : defaults.roster.slice();\n    if (!out.roster.length) out.roster = [me];\n    out.autoRoster = out.autoRoster !== false;\n    out.rosterDiscoverySeconds = clamp(out.rosterDiscoverySeconds, 3, 30);\n    out.peerReportSeconds = clamp(out.peerReportSeconds, 15, 180);\n    if (out.leader !== 'auto' && out.roster.indexOf(out.leader) < 0) out.leader = 'auto';\n    if (out.fallbackTank !== 'none' && (!ACCOUNT_CHARS.some(function(x){return x.name===out.fallbackTank;}) || characterTypeForConfig(out.fallbackTank) === 'merchant')) out.fallbackTank = 'none';"""
new="""    out.roster = Array.isArray(out.roster) ? out.roster.map(function(n){return safeString(n,80).trim();}).filter(function (n, i, a) { return !!n && a.indexOf(n) === i; }).slice(0, 4) : defaults.roster.slice();\n    if (!out.roster.length) out.roster = [me];\n    out.autoRoster = out.autoRoster !== false;\n    out.rosterDiscoverySeconds = clamp(out.rosterDiscoverySeconds, 3, 30);\n    out.peerReportSeconds = clamp(out.peerReportSeconds, 15, 180);\n    if (out.leader !== 'auto' && out.roster.indexOf(out.leader) < 0) out.leader = 'auto';\n    if (out.fallbackTank !== 'none' && (out.roster.indexOf(out.fallbackTank)<0 || characterTypeForConfig(out.fallbackTank) === 'merchant')) out.fallbackTank = 'none';"""
bot=once(bot,old,new,'roster preservation')

old="""  var C = read('config', null);\n  if (!C) {\n    var legacy = readLegacy('config', null);"""
new="""  var v21416ConfigRecoverySource='';\n  var C = read('config', null);\n  if(!C){var stable21416=v21416ReadStableConfig();if(stable21416){C=stable21416;v21416ConfigRecoverySource='stable-mirror';}}\n  if(!C){var backup21416=v21416FindUpdateBackup();if(backup21416&&backup21416.config){C=backup21416.config;v21416ConfigRecoverySource='update-backup';}}\n  if (!C) {\n    var legacy = readLegacy('config', null);"""
bot=once(bot,old,new,'config startup recovery')

old="""    S.auditRecent.push(ev); if (S.auditRecent.length > 3000) S.auditRecent.splice(0, S.auditRecent.length - 3000);"""
new="""    S.auditRecent.push(ev); var recentCap=character.ctype==='merchant'?1200:3000; if (S.auditRecent.length > recentCap) S.auditRecent.splice(0, S.auditRecent.length - recentCap);"""
bot=once(bot,old,new,'merchant audit memory cap')

old="""  function v273OpenBankPackTick(){\n    if(character.ctype!=='merchant'||!C.merchantAutoUnlockBank||!character.bank||typeof open_bank_pack!=='function')return false;"""
new="""  function v21416BankPackCost(pack,currency){try{var table=(typeof bank_packs!=='undefined'&&bank_packs)||(P&&P.bank_packs)||null,row=table&&table[pack];if(!row)return 0;return Math.max(0,Number(row[currency==='shells'?2:1])||0);}catch(e){return 0;}}\n  function v273OpenBankPackTick(){\n    if(character.ctype!=='merchant'||!C.merchantAutoUnlockBank||!character.bank||typeof open_bank_pack!=='function')return false;"""
bot=once(bot,old,new,'bank affordability helper')
old="""var currency=(C.merchantAllowShellBankUnlock&&character.gold<=C.merchantBankGoldReserve)?'shells':'gold';return action('Bankpack öffnen '+pack+' ('+currency+')',function(){return Promise.resolve(open_bank_pack(pack,currency)).then(function(v){S.bankUnlockReady=null;S.bankUnlockTarget=null;return v;});},'bank-open:'+pack,15000);"""
new="""var currency=(C.merchantAllowShellBankUnlock&&character.gold<=C.merchantBankGoldReserve)?'shells':'gold',cost=v21416BankPackCost(pack,currency),reserve=Math.max(0,Number(C.merchantBankGoldReserve)||0);if(currency==='gold'&&cost>0&&Number(character.gold||0)<cost+reserve){S.bankFull=true;S.times.bankCleanupRetry2148=clock()+60000;S.status='Bank voll · '+pack+' derzeit nicht bezahlbar';S.mode='Merchant · Bank';if(clock()>Number(S.times.bankUnlockDeferred21416||0)){S.times.bankUnlockDeferred21416=clock()+60000;audit('merchant_bank_unlock_deferred','Bankpack wird erst bei ausreichendem Gold geöffnet',{pack:pack,cost:cost,gold:Number(character.gold)||0,reserve:reserve,required:cost+reserve},'warning');}if(S.merchantBankCleanup2148&&typeof v2148BankCleanupFinish==='function')v2148BankCleanupFinish('merchant_bank_cleanup_deferred','Bankbereinigung pausiert: nächstes Bankpack derzeit nicht bezahlbar','warning',{pack:pack,cost:cost,gold:Number(character.gold)||0,required:cost+reserve});return false;}return action('Bankpack öffnen '+pack+' ('+currency+')',function(){return Promise.resolve(open_bank_pack(pack,currency)).then(function(v){S.bankUnlockReady=null;S.bankUnlockTarget=null;return v;});},'bank-open:'+pack,15000);"""
bot=once(bot,old,new,'bank affordability guard')

old="""    'merchant-bank-progress-lease','merchant-bank-sync-diagnostics'\n  ];"""
new="""    'merchant-bank-progress-lease','merchant-bank-sync-diagnostics',\n    'config-stable-mirror','config-update-namespace-recovery','merchant-compound-flight-guard','merchant-bank-unlock-affordability','merchant-audit-memory-cap'\n  ];"""
bot=once(bot,old,new,'FEATURE_CONTRACT 21416')

old="""  audit('feature_contract','2.14.14 Merchant-Performancebudget + Laufzeittelemetrie + Dashboard-Terrain-Pipeline geprüft',{features:FEATURE_CONTRACT,cloudConfigured:v21414CloudConfigured()});\n  audit('feature_contract','2.14.15 Bank-Fortschrittslease + Sync-Wait-Diagnostik geprüft',{features:FEATURE_CONTRACT});"""
new="""  var v21416MerchantTickBase=merchantTick;\n  merchantTick=function(){\n    if(character.ctype==='merchant'&&character.q&&character.q.compound){S.status='Combine läuft · warte auf Abschluss';S.mode='Merchant · Combine';S.times['merchant-compound']=Math.max(Number(S.times['merchant-compound'])||0,clock()+1200);return true;}\n    return v21416MerchantTickBase();\n  };\n  var v21416SelfUpdateBase=selfUpdate;\n  selfUpdate=function(auto){try{v21416WriteStableUpdateBackup({version:VERSION,at:clock(),config:C,ui:S.ui||null,mainCollapsed:!!S.mainCollapsed});}catch(e){}return v21416SelfUpdateBase(auto);};\n  if(v21416ConfigRecoverySource)audit('config_namespace_recovery','Gespeicherte Einstellungen aus stabilem Update-Speicher wiederhergestellt',{source:v21416ConfigRecoverySource,configHash:v282ConfigHash(C)});\n\n  audit('feature_contract','2.14.14 Merchant-Performancebudget + Laufzeittelemetrie + Dashboard-Terrain-Pipeline geprüft',{features:FEATURE_CONTRACT,cloudConfigured:v21414CloudConfigured()});\n  audit('feature_contract','2.14.15 Bank-Fortschrittslease + Sync-Wait-Diagnostik geprüft',{features:FEATURE_CONTRACT});\n  audit('feature_contract','2.14.16 Update-Konfiguration + Merchant-Compound/Bank/Memory-Guards geprüft',{features:FEATURE_CONTRACT});"""
bot=once(bot,old,new,'21416 runtime guards')

old="""audit('merchant_performance_sample','Merchant-Laufzeitprofil',{windowMs:now-p.lastAt,tickCount:p.tickN,tickAvgMs:Math.round((p.tickSum/Math.max(1,p.tickN))*100)/100,tickMaxMs:Math.round(p.tickMax*100)/100,ticksOver16Ms:p.tickSlow,renderCount:p.renderN,renderAvgMs:Math.round((p.renderSum/Math.max(1,p.renderN))*100)/100,renderMaxMs:Math.round(p.renderMax*100)/100,heap:mem,auditRecent:S.auditRecent.length,auditQueue:S.auditQueue.length,free:freeSlots(),moving:!!(character.moving||S.moveInFlight)});"""
new="""audit('merchant_performance_sample','Merchant-Laufzeitprofil',{windowMs:now-p.lastAt,tickCount:p.tickN,tickAvgMs:Math.round((p.tickSum/Math.max(1,p.tickN))*100)/100,tickMaxMs:Math.round(p.tickMax*100)/100,ticksOver16Ms:p.tickSlow,renderCount:p.renderN,renderAvgMs:Math.round((p.renderSum/Math.max(1,p.renderN))*100)/100,renderMaxMs:Math.round(p.renderMax*100)/100,heap:mem,auditRecent:S.auditRecent.length,auditRecentCap:1200,auditQueue:S.auditQueue.length,free:freeSlots(),moving:!!(character.moving||S.moveInFlight)});"""
bot=once(bot,old,new,'performance memory telemetry')

botp.write_text(bot,encoding='utf-8')

vp=ROOT/'version.json'; v=json.loads(vp.read_text(encoding='utf-8'))
if v.get('version')!='2.14.15' or v.get('dashboardVersion')!='2.14.15': raise SystemExit('unexpected version baseline')
v['version']='2.14.16';v['dashboardVersion']='2.14.16';vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

dp=ROOT/'cloudflare-dashboard'/'dashboard.html'; dash=dp.read_text(encoding='utf-8')
if '2.14.15' not in dash: raise SystemExit('dashboard baseline version missing')
dash=dash.replace('2.14.15','2.14.16');dp.write_text(dash,encoding='utf-8')

pp=ROOT/'cloudflare-dashboard'/'package.json'; pkg=json.loads(pp.read_text(encoding='utf-8'))
if pkg.get('version')!='2.14.15': raise SystemExit('package baseline mismatch')
pkg['version']='2.14.16';pp.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

wp=ROOT/'cloudflare-dashboard'/'src'/'worker.js'; worker=wp.read_text(encoding='utf-8').replace('2.14.15','2.14.16')
start=worker.index('const DASHBOARD_HTML = ');q=worker.index('"',start);i=q+1
while i<len(worker):
    if worker[i]=='\\': i+=2; continue
    if worker[i]=='"' and i+1<len(worker) and worker[i+1]==';': end=i+2;break
    i+=1
else: raise SystemExit('DASHBOARD_HTML terminator missing')
worker=worker[:start]+'const DASHBOARD_HTML = '+json.dumps(dash,ensure_ascii=False)+';'+worker[end:]
wp.write_text(worker,encoding='utf-8')

# Align retained version-sensitive smoke scripts.
for p in (ROOT/'scripts').glob('smoke*'):
    if not p.is_file() or p.suffix not in ('.js','.mjs'): continue
    s=p.read_text(encoding='utf-8').replace(r'2\.14\.15',r'2\.14\.16').replace('2.14.15','2.14.16')
    p.write_text(s,encoding='utf-8')

vr=ROOT/'scripts'/'verify-release.js'; verify=vr.read_text(encoding='utf-8').replace('2.14.15','2.14.16')
old='  "merchant-bank-progress-lease","merchant-bank-sync-diagnostics"\n];'
new='  "merchant-bank-progress-lease","merchant-bank-sync-diagnostics",\n  "config-stable-mirror","config-update-namespace-recovery","merchant-compound-flight-guard","merchant-bank-unlock-affordability","merchant-audit-memory-cap"\n];'
verify=once(verify,old,new,'verify feature list')
needle='if (!process.exitCode) console.log(`Regression checks OK'
pos=verify.find(needle)
if pos<0: raise SystemExit('verify final success line missing')
checks='''for (const feature of ["config-stable-mirror","config-update-namespace-recovery","merchant-compound-flight-guard","merchant-bank-unlock-affordability","merchant-audit-memory-cap"]) ok(contract.includes(feature), `2.14.16 protected feature missing: ${feature}`);\nok(bot.includes("V21416_STABLE_CONFIG_KEY") && bot.includes("v21416FindUpdateBackup"), "2.14.16 stable config recovery missing");\nok(bot.includes("if(k==='config')writeRaw(V21416_STABLE_CONFIG_KEY"), "2.14.16 config writes do not refresh stable mirror");\nok(bot.includes("v21416ConfigRecoverySource='update-backup'"), "2.14.16 prior namespace update backup recovery missing");\nok(bot.includes("character.q&&character.q.compound") && bot.includes("Combine läuft · warte auf Abschluss"), "2.14.16 compound flight guard missing");\nok(bot.includes("function v21416BankPackCost") && bot.includes("merchant_bank_unlock_deferred"), "2.14.16 bank unlock affordability guard missing");\nok(bot.includes("character.ctype==='merchant'?1200:3000"), "2.14.16 Merchant audit memory cap missing");\nok(bot.includes("auditRecentCap:1200"), "2.14.16 Merchant performance memory-cap telemetry missing");\n\n'''
verify=verify[:pos]+checks+verify[pos:]
verify=verify.replace('Merchant performance + terrain + bank lease','Merchant config + performance + bank/compound guards')
vr.write_text(verify,encoding='utf-8')

smoke=r'''const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.16');
assert.equal(version.dashboardVersion,'2.14.16');
const cm=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);assert(cm);
const contract=JSON.parse(cm[1].replace(/'/g,'"'));
for(const f of ['config-stable-mirror','config-update-namespace-recovery','merchant-compound-flight-guard','merchant-bank-unlock-affordability','merchant-audit-memory-cap'])assert(contract.includes(f),f);
assert(bot.includes("var V21416_STABLE_CONFIG_KEY = 'ALBOT27:stable-config:' + me"));
assert(bot.includes("if(k==='config')writeRaw(V21416_STABLE_CONFIG_KEY"));
assert(bot.includes("v21416ConfigRecoverySource='stable-mirror'"));
assert(bot.includes("v21416ConfigRecoverySource='update-backup'"));
assert(bot.includes("out.roster.map(function(n){return safeString(n,80).trim();})"));
assert(bot.includes("character.q&&character.q.compound"));
assert(bot.includes("S.times['merchant-compound']"));
assert(bot.includes("character.ctype==='merchant'?1200:3000"));
const costFn=bot.match(/function v21416BankPackCost\(pack,currency\)\{[^\n]+\}/);assert(costFn,'bank cost helper missing');
const ctx={P:{bank_packs:{items2:['bank',75000000,600]}},bank_packs:undefined,Math,Number};vm.createContext(ctx);vm.runInContext(costFn[0],ctx);
assert.equal(ctx.v21416BankPackCost('items2','gold'),75000000);
assert.equal(ctx.v21416BankPackCost('items2','shells'),600);
assert(bot.includes("Number(character.gold||0)<cost+reserve"));
assert(bot.includes("S.times.bankCleanupRetry2148=clock()+60000"));
assert(bot.includes("merchant_bank_cleanup_deferred"));
console.log('2.14.16 config preservation / Merchant guards smoke OK');
'''
(ROOT/'scripts'/'smoke-21416-config-merchant.js').write_text(smoke,encoding='utf-8')
print('Prepared 2.14.16 config preservation and Merchant stability release')
