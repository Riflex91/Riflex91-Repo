#!/usr/bin/env python3
from pathlib import Path
import re

ROOT=Path('.')

def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def once(s,old,new,label):
    if old not in s: raise SystemExit('missing marker: '+label)
    if s.count(old)!=1: raise SystemExit('non-unique marker: '+label+' count='+str(s.count(old)))
    return s.replace(old,new,1)

# Align visible/release version markers. Historical runtime strings have been kept current by prior releases,
# so retained smoke expectations are advanced together.
for p in [Path('bot.js'),Path('version.json'),Path('cloudflare-dashboard/dashboard.html'),Path('cloudflare-dashboard/package.json'),Path('cloudflare-dashboard/src/worker.js')]:
    s=read(p)
    if '2.14.16' not in s: raise SystemExit(f'no 2.14.16 marker in {p}')
    write(p,s.replace('2.14.16','2.14.17'))
for p in sorted(Path('scripts').glob('smoke*.js'))+sorted(Path('scripts').glob('smoke*.mjs'))+[Path('scripts/verify-release.js')]:
    s=read(p)
    if '2.14.16' in s: s=s.replace('2.14.16','2.14.17')
    if r'2\.14\.16' in s: s=s.replace(r'2\.14\.16',r'2\.14\.17')
    write(p,s)

bot=read(Path('bot.js'))

# Keep new protections inside the literal static contract used by the updater.
m=re.search(r"(var FEATURE_CONTRACT\s*=\s*\[)([\s\S]*?)(\];)",bot)
if not m: raise SystemExit('FEATURE_CONTRACT marker missing')
body=m.group(2).rstrip()
for feature in ['config-newest-valid-source','merchant-economic-action-flight-guard','merchant-bank-retrieve-travel-lease','merchant-vendor-range-guard']:
    if "'"+feature+"'" not in body:
        body += (',' if body and not body.rstrip().endswith(',') else '') + "\n    '"+feature+"'"
bot=bot[:m.start(2)]+body+bot[m.end(2):]

# Timestamp the namespace config and stable mirror with one identical time so the newest valid source can win deterministically.
old="function write(k, value) { try { var ok=writeRaw(KEY + k, JSON.stringify(value)); if(k==='config')writeRaw(V21416_STABLE_CONFIG_KEY,JSON.stringify({schema:1,version:VERSION,at:clock(),config:value})); return ok; } catch (e) { return false; } }"
new="function write(k, value) { try { var ok=writeRaw(KEY + k, JSON.stringify(value)); if(k==='config'){var at=clock();writeRaw(KEY+'configAt',JSON.stringify(at));writeRaw(V21416_STABLE_CONFIG_KEY,JSON.stringify({schema:1,version:VERSION,at:at,config:value}));} return ok; } catch (e) { return false; } }"
bot=once(bot,old,new,'timestamp config writes')

insert_after="""  function v21416FindUpdateBackup(){
    var best=null;
    function take(v){if(v&&v.config&&typeof v.config==='object'&&Number(v.at||0)>Number(best&&best.at||0))best=v;}
    try{var direct=readRaw(V21416_STABLE_UPDATE_KEY);if(direct)take(JSON.parse(direct));}catch(e){}
    try{for(var i=0;i<P.localStorage.length;i++){var k=P.localStorage.key(i);if(!k||k.indexOf('ALBOT27:')!==0||k.indexOf(me)<0||k.slice(-19)!==':updateConfigBackup')continue;var raw=P.localStorage.getItem(k);if(raw)take(JSON.parse(raw));}}catch(e){}
    return best;
  }
"""
addition="""  function v21417StableConfigBox(){try{var raw=readRaw(V21416_STABLE_CONFIG_KEY),box=raw?JSON.parse(raw):null;return box&&box.config&&typeof box.config==='object'?box:null;}catch(e){return null;}}
  function v21417PickConfig(candidates){
    var rows=(candidates||[]).filter(function(x){return x&&x.config&&typeof x.config==='object';});
    rows.sort(function(a,b){var d=Number(b.at||0)-Number(a.at||0);if(d)return d;d=Number(b.priority||0)-Number(a.priority||0);if(d)return d;return String(a.source||'').localeCompare(String(b.source||''));});
    return rows[0]||null;
  }
"""
if insert_after not in bot: raise SystemExit('missing v21416FindUpdateBackup block')
bot=bot.replace(insert_after,insert_after+addition,1)

old_start="""  // Migrate useful 2.6 settings once, but intentionally replace its dashboard endpoint/token pair with the 2.7 connection URL model.
  var v21416ConfigRecoverySource='';
  var C = read('config', null);
  if(!C){var stable21416=v21416ReadStableConfig();if(stable21416){C=stable21416;v21416ConfigRecoverySource='stable-mirror';}}
  if(!C){var backup21416=v21416FindUpdateBackup();if(backup21416&&backup21416.config){C=backup21416.config;v21416ConfigRecoverySource='update-backup';}}
"""
new_start="""  // Migrate useful 2.6 settings once, but intentionally replace its dashboard endpoint/token pair with the 2.7 connection URL model.
  // 2.14.17: a stale current namespace must not mask a newer stable/update copy after hot reload.
  var v21416ConfigRecoverySource='',current21417=read('config',null),stable21417=v21417StableConfigBox(),backup21417=v21416FindUpdateBackup();
  var chosen21417=v21417PickConfig([
    {source:'current',priority:3,at:Number(read('configAt',0))||0,config:current21417},
    stable21417?{source:'stable-mirror',priority:2,at:Number(stable21417.at)||0,config:stable21417.config}:null,
    backup21417?{source:'update-backup',priority:1,at:Number(backup21417.at)||0,config:backup21417.config}:null
  ]);
  var C=chosen21417?chosen21417.config:null;
  if(chosen21417&&chosen21417.source!=='current')v21416ConfigRecoverySource=chosen21417.source;
"""
bot=once(bot,old_start,new_start,'newest config source selection')

# Bank retrieval lease starts only after the bank has actually been reached, not while travelling there.
old_bank="""  function v2149BankRetrieveTick(){
    var st=S.merchantBankRetrieve2149;if(!st)return false;var now=clock();
    if(v2149HigherRoute(90)){st.startedAt=now;return false;}
    if(now-Number(st.startedAt||now)>20000||Number(st.attempts||0)>=12){S.times.bankRetrieveRetry2149=now+15000;return v2149BankRetrieveFinish('merchant_bank_retrieve_timeout','Bankentnahme kontrolliert freigegeben; späterer Neuversuch','warning');}
    if(v2149BankWantMissing(st.wants[0])<=0&&st.wants.every(function(w){return v2149BankWantMissing(w)<=0;}))return v2149BankRetrieveFinish('merchant_bank_retrieve_done','Geplante Bankentnahme abgeschlossen');
    if(!v2149BankMap()){
      if(!v2149CanStartBankWork())return false;S.status=(C.language==='de'?'Bankentnahme · ':'Bank retrieve · ')+st.reason;S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},C.language==='de'?'Geplante Bankentnahme':'Planned bank retrieve',{kind:'merchant-bank-retrieve',forceAfter:9000});
    }
"""
new_bank="""  function v2149BankRetrieveTick(){
    var st=S.merchantBankRetrieve2149;if(!st)return false;var now=clock();
    if(v2149HigherRoute(90)){st.leaseAt=0;return false;}
    if(v2149BankWantMissing(st.wants[0])<=0&&st.wants.every(function(w){return v2149BankWantMissing(w)<=0;}))return v2149BankRetrieveFinish('merchant_bank_retrieve_done','Geplante Bankentnahme abgeschlossen');
    if(!v2149BankMap()){
      st.leaseAt=0;if(!v2149CanStartBankWork())return false;S.status=(C.language==='de'?'Bankentnahme · ':'Bank retrieve · ')+st.reason;S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},C.language==='de'?'Geplante Bankentnahme':'Planned bank retrieve',{kind:'merchant-bank-retrieve',forceAfter:9000});
    }
    if(!Number(st.leaseAt||0))st.leaseAt=now;
    if(now-Number(st.leaseAt||now)>20000||Number(st.attempts||0)>=12){S.times.bankRetrieveRetry2149=now+15000;return v2149BankRetrieveFinish('merchant_bank_retrieve_timeout','Bankentnahme kontrolliert freigegeben; späterer Neuversuch','warning');}
"""
bot=once(bot,old_bank,new_bank,'bank retrieve travel lease')
bot=once(bot,"S.merchantBankRetrieve2149={reason:String(reason||'logistics'),wants:wants,meta:meta||{},startedAt:clock(),attempts:0,waitUntil:0,allowUnknown:!!allowUnknown};","S.merchantBankRetrieve2149={reason:String(reason||'logistics'),wants:wants,meta:meta||{},startedAt:clock(),leaseAt:0,attempts:0,waitUntil:0,allowUnknown:!!allowUnknown};",'bank retrieve lease state')
bot=once(bot,"if(started){st.attempts=Number(st.attempts||0)+1;st.waitUntil=now+2700;","if(started){st.attempts=Number(st.attempts||0)+1;st.leaseAt=now;st.waitUntil=now+2700;",'bank retrieve progress resets lease')

# Upgrades require the actual scroll/upgrader vendor position even when a scroll is already in inventory.
old_upgrade="var sc=v273EnsureScroll('scroll',best.it);if(sc<0)return true;S.status='Verbessere '+v273Name(best.it.name)+' auf +'+(best.lv+1);S.mode='Merchant · Upgrade';audit('merchant_economy_decision','Upgrade nach Nutzen/Kosten/Drop-Prüfung',{action:'upgrade',item:best.it.name,level:best.lv,utility:Math.round(best.utility),economics:best.econ});return action('Item verbessern '+best.it.name,function(){return upgrade(best.i,sc);},'merchant-upgrade',2600);"
new_upgrade="var sc=v273EnsureScroll('scroll',best.it);if(sc<0)return true;var vendor=v282VendorForScroll(v273ScrollName('scroll',best.it));if(vendor&&!v2145VendorReady(vendor)){S.status=(C.language==='de'?'Zum Upgrade-Händler für ':'Go to upgrade vendor for ')+v273Name(best.it.name);S.mode='Merchant · Upgrade';if(!character.moving&&!S.moveInFlight)moveToGoal(vendor,C.language==='de'?'Upgrade-Händler':'Upgrade vendor',{kind:'merchant-upgrade-vendor',tolerance:60,forceAfter:9000});return true;}S.status='Verbessere '+v273Name(best.it.name)+' auf +'+(best.lv+1);S.mode='Merchant · Upgrade';audit('merchant_economy_decision','Upgrade nach Nutzen/Kosten/Drop-Prüfung',{action:'upgrade',item:best.it.name,level:best.lv,utility:Math.round(best.utility),economics:best.econ});return action('Item verbessern '+best.it.name,function(){return upgrade(best.i,sc);},'merchant-upgrade',2600);"
bot=once(bot,old_upgrade,new_upgrade,'upgrade vendor guard')

# Exchanges route through Adventure Land's documented generic exchange smart-move target and cache the reached position.
old_exchange="""    S.status=(C.language==='de'?'Belohnungs-Item eintauschen: ':'Exchange reward item: ')+v273Name(row.it.name);S.mode='Merchant · Exchange';
    return action('Item eintauschen '+row.it.name,function(){return exchange(row.i);},'merchant-exchange:'+row.it.name,5000);
"""
new_exchange="""    if(v21417ExchangeRouteTick())return true;
    S.status=(C.language==='de'?'Belohnungs-Item eintauschen: ':'Exchange reward item: ')+v273Name(row.it.name);S.mode='Merchant · Exchange';
    return action('Item eintauschen '+row.it.name,function(){return exchange(row.i);},'merchant-exchange:'+row.it.name,5000);
"""
bot=once(bot,old_exchange,new_exchange,'exchange route guard')

# Potion purchases use a real vendor-settle radius instead of the previous 500px coarse gate.
bot=once(bot,"if(character.map!=='main'||Math.hypot((Number(character.x)||0)+56,(Number(character.y)||0)-402)>500){S.status='Zulieferung vorbereiten · Tränke kaufen';S.mode='Merchant · Versorgung';return moveToGoal({map:'main',x:-56,y:402},'Zum Trankhändler',{kind:'supply-buy',tolerance:120,forceAfter:7000});}","if(character.map!=='main'||Math.hypot((Number(character.x)||0)+56,(Number(character.y)||0)-402)>90||character.moving||S.moveInFlight){S.status='Zulieferung vorbereiten · Tränke kaufen';S.mode='Merchant · Versorgung';return moveToGoal({map:'main',x:-56,y:402},'Zum Trankhändler',{kind:'supply-buy',tolerance:60,forceAfter:7000});}",'potion vendor settle guard')

# Replace the 2.14.16 compound-only outer lock by one action-flight guard for all timed Merchant economic operations.
old_tail="""  var v21416MerchantTickBase=merchantTick;
  merchantTick=function(){
    if(character.ctype==='merchant'&&character.q&&character.q.compound){S.status='Combine läuft · warte auf Abschluss';S.mode='Merchant · Combine';S.times['merchant-compound']=Math.max(Number(S.times['merchant-compound'])||0,clock()+1200);return true;}
    return v21416MerchantTickBase();
  };
"""
new_tail="""  function v21417EconomicFlightKind(q){q=q||{};return q.upgrade?'upgrade':q.compound?'compound':q.exchange?'exchange':q.craft?'craft':'';}
  function v21417ExchangeReady(){var p=S.exchangeReady21417;return !!(p&&p.map===character.map&&!character.moving&&!S.moveInFlight&&dist(character,p)<=120);}
  function v21417ExchangeRouteTick(){
    if(v21417ExchangeReady())return false;if(character.moving||S.moveInFlight)return true;if(typeof smart_move!=='function')return false;
    S.status=C.language==='de'?'Zum Eintausch-NPC':'Go to exchange NPC';S.mode='Merchant · Exchange';
    return action('Zum Eintausch-NPC',function(){return Promise.resolve(smart_move('exchange')).then(function(v){var p=pos(character);if(p)S.exchangeReady21417={map:p.map,x:p.x,y:p.y,at:clock()};return v;});},'merchant-exchange-route',8000);
  }
  var v21416MerchantTickBase=merchantTick;
  merchantTick=function(){
    if(character.ctype==='merchant'){var flight=v21417EconomicFlightKind(character.q);if(flight){S.status=(C.language==='de'?'Warte auf laufende Merchant-Aktion: ':'Waiting for active merchant action: ')+flight;S.mode=flight==='compound'?'Merchant · Combine':flight==='upgrade'?'Merchant · Upgrade':flight==='exchange'?'Merchant · Exchange':'Merchant · Crafting';return true;}}
    return v21416MerchantTickBase();
  };
"""
bot=once(bot,old_tail,new_tail,'generic merchant action flight guard')

# Expand current feature audit wording rather than adding another startup burst.
bot=once(bot,"audit('feature_contract','2.14.17 Update-Konfiguration + Merchant-Compound/Bank/Memory-Guards geprüft',{features:FEATURE_CONTRACT});","audit('feature_contract','2.14.17 neueste Config-Quelle + Merchant-Aktionsserialisierung + Bank-/Vendor-Leases geprüft',{features:FEATURE_CONTRACT});",'2.14.17 feature audit')
write(Path('bot.js'),bot)

# Release verifier: require the new static guarantees.
ver=read(Path('scripts/verify-release.js'))
needle='"merchant-bank-progress-lease","merchant-bank-sync-diagnostics"'
if needle not in ver: raise SystemExit('verify requiredFeatures marker missing')
ver=ver.replace(needle,needle+',\n  "config-newest-valid-source","merchant-economic-action-flight-guard","merchant-bank-retrieve-travel-lease","merchant-vendor-range-guard"',1)
extra="""
ok(bot.includes("writeRaw(KEY+'configAt'") && bot.includes('function v21417PickConfig'), '2.14.17 newest config source selector missing');
ok(bot.includes("source:'current',priority:3") && bot.includes("source:'stable-mirror',priority:2") && bot.includes("source:'update-backup',priority:1"), '2.14.17 config source ordering missing');
ok(bot.includes('st.leaseAt=0') && bot.includes('if(!Number(st.leaseAt||0))st.leaseAt=now') && bot.includes('st.leaseAt=now;st.waitUntil'), '2.14.17 bank retrieve travel lease missing');
ok(bot.includes('function v21417EconomicFlightKind') && bot.includes("q.upgrade?'upgrade':q.compound?'compound':q.exchange?'exchange':q.craft?'craft'"), '2.14.17 economic action serialization missing');
ok(bot.includes('function v21417ExchangeRouteTick') && bot.includes("smart_move('exchange')") && bot.includes("kind:'merchant-upgrade-vendor'") && bot.includes("tolerance:60"), '2.14.17 vendor range guards missing');
"""
anchor='ok(contract.length >= 42, `expected at least 42 protected features, got ${contract.length}`);\n'
if anchor not in ver: raise SystemExit('verify contract length anchor missing')
ver=ver.replace(anchor,anchor+extra,1)
write(Path('scripts/verify-release.js'),ver)

smoke=r'''#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.17');
assert.equal(version.dashboardVersion,'2.14.17');
for(const f of ['config-newest-valid-source','merchant-economic-action-flight-guard','merchant-bank-retrieve-travel-lease','merchant-vendor-range-guard'])assert.ok(bot.includes("'"+f+"'"),'missing feature '+f);
function extract(name){const start=bot.indexOf('function '+name+'(');assert.ok(start>=0,'missing '+name);let i=bot.indexOf('{',start),depth=0;for(;i<bot.length;i++){if(bot[i]==='{')depth++;else if(bot[i]==='}'&&--depth===0)return bot.slice(start,i+1);}throw Error('unterminated '+name);}
const ctx={};vm.createContext(ctx);vm.runInContext(extract('v21417PickConfig')+';this.pick=v21417PickConfig;',ctx);
let pick=ctx.pick([{source:'current',priority:3,at:100,config:{language:'en'}},{source:'stable-mirror',priority:2,at:200,config:{language:'de'}},{source:'update-backup',priority:1,at:150,config:{language:'fr'}}]);
assert.equal(pick.source,'stable-mirror','newer stable config must beat stale current namespace');
pick=ctx.pick([{source:'current',priority:3,at:300,config:{x:1}},{source:'stable-mirror',priority:2,at:200,config:{x:2}}]);assert.equal(pick.source,'current');
pick=ctx.pick([{source:'current',priority:3,at:300,config:{x:1}},{source:'stable-mirror',priority:2,at:300,config:{x:2}}]);assert.equal(pick.source,'current','equal timestamp must deterministically prefer current namespace');
vm.runInContext(extract('v21417EconomicFlightKind')+';this.flight=v21417EconomicFlightKind;',ctx);assert.equal(ctx.flight({upgrade:{}}),'upgrade');assert.equal(ctx.flight({compound:{}}),'compound');assert.equal(ctx.flight({exchange:{}}),'exchange');assert.equal(ctx.flight({craft:{}}),'craft');assert.equal(ctx.flight({}),'');
const bank=extract('v2149BankRetrieveTick');assert.ok(bank.indexOf('if(!v2149BankMap())')<bank.indexOf('merchant_bank_retrieve_timeout'),'travel branch must precede timeout');assert.ok(bank.includes('st.leaseAt=0')&&bank.includes('if(!Number(st.leaseAt||0))st.leaseAt=now'));
assert.ok(bot.includes("smart_move('exchange')"),'exchange must route to documented exchange target');assert.ok(bot.includes("kind:'merchant-upgrade-vendor',tolerance:60"),'upgrade vendor settle guard missing');assert.ok(bot.includes(">90||character.moving||S.moveInFlight")&&bot.includes("kind:'supply-buy',tolerance:60"),'potion vendor settle guard missing');
console.log('2.14.17 config precedence / Merchant serialization smoke OK');
'''
write(Path('scripts/smoke-21417-config-merchant.js'),smoke)

print('Prepared 2.14.17 newest-config + Merchant serialization release')
