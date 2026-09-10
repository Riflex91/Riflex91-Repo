from pathlib import Path
import json


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new, 1)


botp = Path("bot.js")
bot = botp.read_text()
bot = replace_once(bot, "/* Adventure Land • AiO Bot 2.14.17 | 2026-09-10", "/* Adventure Land • AiO Bot 2.14.18 | 2026-09-10", "header version")
bot = replace_once(bot, "var VERSION = '2.14.17';", "var VERSION = '2.14.18';", "bot version")
bot = replace_once(
    bot,
    "    'merchant-bank-retrieve-travel-lease',\n    'merchant-vendor-range-guard'];",
    "    'merchant-bank-retrieve-travel-lease',\n    'merchant-vendor-range-guard',\n    'merchant-exchange-route-flight-lock','merchant-loot-flight-gate','merchant-capacity-blocked-state','config-control-write-dedupe','merchant-phase-profiler'];",
    "feature contract",
)

old_apply = "  function applyCfgControl(el){var key=el.dataset.cfg;if(!key)return;var before=C[key],v=parseControlValue(el);C[key]=v;C=cleanConfig(C);write('config',C);audit('config_change',key+' changed',{from:before,to:C[key]});if(key==='webDashboardEnabled'&&C[key]&&!before&&!C.webDashboardTutorialSeen)showDashboardTutorial(0);if(key==='language'||key==='theme'){applyAppearance();renderAll(true);}else renderMain();}"
new_apply = "  function applyCfgControl(el){var key=el.dataset.cfg;if(!key)return false;var before=C[key],v=parseControlValue(el);C[key]=v;C=cleanConfig(C);if(sameJSON(before,C[key]))return false;write('config',C);audit('config_change',key+' changed',{from:before,to:C[key]});if(key==='webDashboardEnabled'&&C[key]&&!before&&!C.webDashboardTutorialSeen)showDashboardTutorial(0);if(key==='language'||key==='theme'){applyAppearance();renderAll(true);}else renderMain();return true;}"
bot = replace_once(bot, old_apply, new_apply, "config write dedupe")
old_change = "  function uiChange(e){var el=e.target;if(el.dataset&&el.dataset.cfg){applyCfgControl(el);return;}"
new_change = "  function uiChange(e){var el=e.target;if(el.dataset&&el.dataset.cfg){var ck=el.dataset.cfg;if(S.inputSaveTimers21418&&S.inputSaveTimers21418[ck]){clearTimeout(S.inputSaveTimers21418[ck]);delete S.inputSaveTimers21418[ck];}applyCfgControl(el);return;}"
bot = replace_once(bot, old_change, new_change, "config change flush")
old_input = "if(el.dataset&&el.dataset.cfg&&['text','url','number'].indexOf(el.type)>=0){clearTimeout(S.inputSaveTimer);S.inputSaveTimer=P.setTimeout(function(){applyCfgControl(el);},350);}"
new_input = "if(el.dataset&&el.dataset.cfg&&['text','url','number'].indexOf(el.type)>=0){var ck=el.dataset.cfg;S.inputSaveTimers21418=S.inputSaveTimers21418||{};clearTimeout(S.inputSaveTimers21418[ck]);S.inputSaveTimers21418[ck]=P.setTimeout(function(){delete S.inputSaveTimers21418[ck];applyCfgControl(el);},450);}"
bot = replace_once(bot, old_input, new_input, "per-control config debounce")

old_loot_cond = "if(typeof loot==='function'&&clock()>(S.times.loot||0)&&!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)){var lootCadence"
new_loot_cond = "if(typeof loot==='function'&&clock()>(S.times.loot||0)&&!v21418MerchantLootBlocked()&&!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)){var lootCadence"
bot = replace_once(bot, old_loot_cond, new_loot_cond, "merchant loot pre-gate")
bot = replace_once(
    bot,
    "action('Loot einsammeln',function(){return loot();},'loot-action',800);",
    "action('Loot einsammeln',function(){return v21418GuardedLoot();},'loot-action',800);",
    "guarded merchant loot",
)

anchor = "  var v21416SelfUpdateBase=selfUpdate;"
block = r'''
  function v21418MerchantLootBlocked(){
    if(character.ctype!=='merchant')return false;
    if(v21417EconomicFlightKind(character.q))return true;
    var route=S.exchangeRouteFlight21418;if(route&&route.active)return true;
    var cap=S.capacityBlocked21418;if(cap&&clock()<Number(cap.retryAt||0))return true;
    return false;
  }
  function v21418GuardedLoot(){
    if(v21418MerchantLootBlocked()||S.lootFlight21418)return Promise.resolve({success:false,skipped:true,reason:'merchant_loot_gate'});
    S.lootFlight21418=true;
    try{var r=loot();if(r&&typeof r.then==='function')return Promise.resolve(r).then(function(v){S.lootFlight21418=false;return v;},function(e){S.lootFlight21418=false;throw e;});S.lootFlight21418=false;return r;}catch(e){S.lootFlight21418=false;throw e;}
  }
  v21417ExchangeRouteTick=function(){
    if(v21417ExchangeReady()){S.exchangeRouteFlight21418=null;return false;}
    var now=clock(),flight=S.exchangeRouteFlight21418;
    if(flight&&flight.active){if(now-Number(flight.startedAt||now)<20000){S.status=C.language==='de'?'Eintausch-Anreise läuft':'Exchange route in progress';S.mode='Merchant · Exchange';return true;}audit('merchant_exchange_route_timeout','Eintausch-Anreise ohne Abschluss verworfen',{durationMs:now-Number(flight.startedAt||now)},'warning');S.exchangeRouteFlight21418=null;}
    if(character.moving||S.moveInFlight)return true;if(typeof smart_move!=='function')return false;
    var state={active:true,startedAt:now};S.exchangeRouteFlight21418=state;S.status=C.language==='de'?'Zum Eintausch-NPC':'Go to exchange NPC';S.mode='Merchant · Exchange';
    var started=action('Zum Eintausch-NPC',function(){return Promise.resolve(smart_move('exchange')).then(function(v){var p=pos(character);if(p)S.exchangeReady21417={map:p.map,x:p.x,y:p.y,at:clock()};state.active=false;return v;},function(e){state.active=false;throw e;});},'merchant-exchange-route',8000);
    if(!started){state.active=false;S.exchangeRouteFlight21418=null;}return true;
  };

  var v21418InventoryPressureBase=v290InventoryPressureTick;
  v290InventoryPressureTick=function(){
    if(character.ctype!=='merchant')return v21418InventoryPressureBase();
    var reserve=Math.max(1,Number(C.merchantInventoryReserve)||0),now=clock(),free=freeSlots(),blocked=S.capacityBlocked21418;
    if(free>reserve){if(blocked)audit('merchant_capacity_recovered','Merchant-Kapazität wieder verfügbar',{durationMs:now-Number(blocked.since||now),free:free,reserve:reserve});S.capacityBlocked21418=null;return false;}
    if(blocked&&now<Number(blocked.retryAt||0)){S.status=C.language==='de'?'Kapazität blockiert · sichere Freigabe später erneut prüfen':'Capacity blocked · safe recovery will retry later';S.mode='Merchant · Kapazität';return true;}
    var r=v21418InventoryPressureBase();
    if(freeSlots()>reserve){S.capacityBlocked21418=null;return r;}
    if(r&&S.status==='Inventar voll · sichere Bereinigung nötig'){
      if(C.merchantAutoExchange&&v273ExchangeTick()){S.capacityBlocked21418=null;return true;}
      if(C.merchantStandAutomation&&merchantStandTick()){S.capacityBlocked21418=null;return true;}
      blocked=blocked||{since:now};blocked.retryAt=now+15000;blocked.free=freeSlots();blocked.reserve=reserve;blocked.bankFull=!!S.bankFull;S.capacityBlocked21418=blocked;
      S.status=C.language==='de'?'Kapazität blockiert · sichere Freigabe nicht möglich':'Capacity blocked · no safe release available';S.mode='Merchant · Kapazität';
      if(now>Number(S.times.capacityBlockedWarn21418||0)){S.times.capacityBlockedWarn21418=now+60000;audit('merchant_capacity_blocked','Merchant-Kapazität sicher blockiert; langsamer Retry aktiv',{free:blocked.free,reserve:reserve,bankFull:blocked.bankFull,retryMs:15000},'warning');}
      return true;
    }
    if(!r)S.capacityBlocked21418=null;return r;
  };

  function v21418ConfigProvenance(){return {source:chosen21417?chosen21417.source:'defaults-or-legacy',sourceAt:chosen21417?Number(chosen21417.at||0):0,configHash:v282ConfigHash(C),settings:{language:C.language,autoFarmSwitchEnabled:!!C.autoFarmSwitchEnabled,merchantAllowShellBankUnlock:!!C.merchantAllowShellBankUnlock,standItemMode:C.standItemMode,merchantCollectGoldOver:Number(C.merchantCollectGoldOver)||0,merchantInventoryReserve:Number(C.merchantInventoryReserve)||0,merchantAutoExchange:!!C.merchantAutoExchange}};}

  function v21418PhaseState(){return S.phaseProfiler21418||(S.phaseProfiler21418={windowAt:clock(),phases:{},calls:0});}
  function v21418PhaseAdd(name,ms){var p=v21418PhaseState(),x=p.phases[name]||(p.phases[name]={n:0,sum:0,max:0});x.n++;x.sum+=ms;x.max=Math.max(x.max,ms);p.calls++;}
  function v21418ProfileCall(name,fn,ctx,args){if(character.ctype!=='merchant')return fn.apply(ctx,args);var t=v21414PerfNow();try{return fn.apply(ctx,args);}finally{v21418PhaseAdd(name,Math.max(0,v21414PerfNow()-t));}}
  function v21418ProfileWrap(name,fn){return function(){return v21418ProfileCall(name,fn,this,arguments);};}
  function v21418PhaseSnapshot(){var p=v21418PhaseState(),out={};Object.keys(p.phases).sort().forEach(function(k){var x=p.phases[k];out[k]={calls:x.n,avgMs:Math.round((x.sum/Math.max(1,x.n))*100)/100,maxMs:Math.round(x.max*100)/100,totalMs:Math.round(x.sum*100)/100};});return out;}
  function v21418PhaseSizes(){return {auditRecent:S.auditRecent.length,auditQueue:S.auditQueue.length,actionFailures:Object.keys(S.actionFailures||{}).length,inventoryUsed:(character.items||[]).filter(Boolean).length,inventoryFree:freeSlots(),bankPacks:Object.keys(character.bank||{}).filter(function(k){return /^items\d+$/.test(k);}).length};}

  v290InventoryPressureTick=v21418ProfileWrap('inventory',v290InventoryPressureTick);
  v273MerchantPlannerTick=v21418ProfileWrap('plannerRecipe',v273MerchantPlannerTick);v273CraftTick=v21418ProfileWrap('plannerRecipe',v273CraftTick);
  v277MerchantServiceCandidates=v21418ProfileWrap('service',v277MerchantServiceCandidates);v277MerchantServiceTick=v21418ProfileWrap('service',v277MerchantServiceTick);
  moveToGoal=v21418ProfileWrap('movement',moveToGoal);v21417ExchangeRouteTick=v21418ProfileWrap('movement',v21417ExchangeRouteTick);
  v2149BankRetrieveTick=v21418ProfileWrap('bank',v2149BankRetrieveTick);v273StoreTrashBankTick=v21418ProfileWrap('bank',v273StoreTrashBankTick);
  v273SellTrashTick=v21418ProfileWrap('economy',v273SellTrashTick);v273UpgradeTick=v21418ProfileWrap('economy',v273UpgradeTick);v273CompoundTick=v21418ProfileWrap('economy',v273CompoundTick);v273ExchangeTick=v21418ProfileWrap('economy',v273ExchangeTick);
  dashboardPayload=v21418ProfileWrap('dashboard',dashboardPayload);dashboardPublishTick=v21418ProfileWrap('dashboard',dashboardPublishTick);
  var v21418AuditBase=audit;audit=v21418ProfileWrap('audit',v21418AuditBase);
  var v21418TickBase=tick;
  tick=function(){var r=v21418TickBase();if(character.ctype==='merchant'){var now=clock(),p=v21418PhaseState();if(now-Number(p.windowAt||now)>=15000){var phases=v21418PhaseSnapshot(),sizes=v21418PhaseSizes(),windowMs=now-Number(p.windowAt||now),calls=p.calls;S.phaseProfiler21418={windowAt:now,phases:{},calls:0};audit('merchant_phase_profile','Merchant-Phasenprofil',{windowMs:windowMs,calls:calls,phases:phases,sizes:sizes});}}return r;};
'''
bot = replace_once(bot, anchor, block + "\n" + anchor, "2.14.18 runtime block")
bot = replace_once(
    bot,
    "  if(v21416ConfigRecoverySource)audit('config_namespace_recovery','Gespeicherte Einstellungen aus stabilem Update-Speicher wiederhergestellt',{source:v21416ConfigRecoverySource,configHash:v282ConfigHash(C)});",
    "  if(v21416ConfigRecoverySource)audit('config_namespace_recovery','Gespeicherte Einstellungen aus stabilem Update-Speicher wiederhergestellt',{source:v21416ConfigRecoverySource,configHash:v282ConfigHash(C)});\n  audit('config_source_selected','Konfigurationsquelle gewählt',v21418ConfigProvenance());",
    "config provenance audit",
)
bot = replace_once(
    bot,
    "  audit('feature_contract','2.14.17 neueste Config-Quelle + Merchant-Aktionsserialisierung + Bank-/Vendor-Leases geprüft',{features:FEATURE_CONTRACT});",
    "  audit('feature_contract','2.14.17 neueste Config-Quelle + Merchant-Aktionsserialisierung + Bank-/Vendor-Leases geprüft',{features:FEATURE_CONTRACT});\n  audit('feature_contract','2.14.18 Exchange-/Loot-/Capacity-Guards + Config-Dedupe + Merchant-Phasenprofil geprüft',{features:FEATURE_CONTRACT});",
    "2.14.18 feature audit",
)
botp.write_text(bot)

vpath = Path("version.json")
v = json.loads(vpath.read_text())
v["version"] = "2.14.18"
v["dashboardVersion"] = "2.14.18"
vpath.write_text(json.dumps(v, ensure_ascii=False, indent=2) + "\n")
for filename in ["cloudflare-dashboard/dashboard.html", "cloudflare-dashboard/src/worker.js", "cloudflare-dashboard/package.json"]:
    p = Path(filename)
    text = p.read_text()
    if "2.14.17" not in text:
        raise SystemExit(f"{filename}: no 2.14.17 marker found")
    p.write_text(text.replace("2.14.17", "2.14.18"))

# Retained smokes validate feature generations without pinning every future current version.
for p in Path("scripts").glob("smoke*.js"):
    text = p.read_text()
    text = text.replace(
        "assert.equal(version.version,'2.14.17');\nassert.equal(version.dashboardVersion,'2.14.17');",
        "assert.ok(/^2\\.14\\.\\d+$/.test(version.version));\nassert.equal(version.dashboardVersion,version.version);",
    )
    p.write_text(text)

vr = Path("scripts/verify-release.js")
text = vr.read_text()
text = replace_once(text, 'ok(version.version === "2.14.17", "prepared release must be 2.14.17");', 'ok(version.version === "2.14.18", "prepared release must be 2.14.18");', "verify version")
text = replace_once(text, 'ok(version.dashboardVersion === "2.14.17", "dashboard version must be 2.14.17 for layered brain/dashboard release");', 'ok(version.dashboardVersion === "2.14.18", "dashboard version must be 2.14.18 for layered brain/dashboard release");', "verify dashboard version")
text = replace_once(
    text,
    '  "config-newest-valid-source","merchant-economic-action-flight-guard","merchant-bank-retrieve-travel-lease","merchant-vendor-range-guard",',
    '  "config-newest-valid-source","merchant-economic-action-flight-guard","merchant-bank-retrieve-travel-lease","merchant-vendor-range-guard",\n  "merchant-exchange-route-flight-lock","merchant-loot-flight-gate","merchant-capacity-blocked-state","config-control-write-dedupe","merchant-phase-profiler",',
    "verify required features",
)
marker = "ok(bot.includes('function v21417ExchangeRouteTick') && bot.includes(\"smart_move('exchange')\") && bot.includes(\"kind:'merchant-upgrade-vendor'\") && bot.includes(\"tolerance:60\"), '2.14.17 vendor range guards missing');"
extra = """
ok(bot.includes('S.exchangeRouteFlight21418') && bot.includes("Eintausch-Anreise läuft") && bot.includes("merchant_exchange_route_timeout"), '2.14.18 exchange route flight lock missing');
ok(bot.includes('function v21418MerchantLootBlocked') && bot.includes('function v21418GuardedLoot') && bot.includes('!v21418MerchantLootBlocked()'), '2.14.18 merchant loot flight gate missing');
ok(bot.includes('merchant_capacity_blocked') && bot.includes('blocked.retryAt=now+15000') && bot.includes("S.mode='Merchant · Kapazität'"), '2.14.18 capacity blocked state missing');
ok(bot.includes('S.inputSaveTimers21418') && bot.includes('},450)') && bot.includes('if(sameJSON(before,C[key]))return false'), '2.14.18 config write debounce/dedupe missing');
ok(bot.includes("audit('config_source_selected'") && bot.includes('function v21418ConfigProvenance'), '2.14.18 config provenance missing');
ok(bot.includes('function v21418ProfileCall') && bot.includes("audit('merchant_phase_profile'") && bot.includes("v21418ProfileWrap('inventory'") && bot.includes("v21418ProfileWrap('dashboard'"), '2.14.18 Merchant phase profiler missing');
"""
text = replace_once(text, marker, marker + extra, "verify 2.14.18 checks")
vr.write_text(text)

smoke = Path("scripts/smoke-21418-merchant-stability-performance.js")
smoke.write_text(r'''#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs');
const bot=fs.readFileSync('bot.js','utf8'),version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.18');assert.equal(version.dashboardVersion,'2.14.18');
const cm=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);assert(cm);const contract=JSON.parse(cm[1].replace(/'/g,'"'));
for(const f of ['merchant-exchange-route-flight-lock','merchant-loot-flight-gate','merchant-capacity-blocked-state','config-control-write-dedupe','merchant-phase-profiler'])assert.ok(contract.includes(f),'missing feature '+f);
assert.ok(bot.includes('S.exchangeRouteFlight21418')&&bot.includes("smart_move('exchange')")&&bot.includes("if(flight&&flight.active)"),'exchange route lock missing');
assert.ok(bot.includes('function v21418MerchantLootBlocked')&&bot.includes('function v21418GuardedLoot')&&bot.includes('!v21418MerchantLootBlocked()'),'loot flight gate missing');
assert.ok(bot.includes('S.capacityBlocked21418')&&bot.includes('blocked.retryAt=now+15000')&&bot.includes('merchant_capacity_blocked'),'capacity retry state missing');
assert.ok(bot.includes('S.inputSaveTimers21418')&&bot.includes('},450)')&&bot.includes('if(sameJSON(before,C[key]))return false'),'config debounce/dedupe missing');
const prov=bot.slice(bot.indexOf('function v21418ConfigProvenance'),bot.indexOf('function v21418PhaseState'));
assert.ok(prov.includes('sourceAt:chosen21417?Number(chosen21417.at||0):0'),'config provenance missing');
for(const secret of ['webDashboardWriteKey','WRITE_KEY','API_KEY'])assert.ok(!prov.includes(secret),'secret leaked in config provenance');
for(const phase of ['inventory','plannerRecipe','service','movement','bank','economy','dashboard','audit'])assert.ok(bot.includes("v21418ProfileWrap('"+phase+"'"),'phase missing '+phase);
assert.ok(bot.includes("audit('merchant_phase_profile'")&&bot.includes('phases:phases,sizes:sizes'),'phase payload missing');
console.log('2.14.18 Merchant stability / performance smoke OK');
''')

# The final tested tree contains neither temporary CI helper.
Path(".github/workflows/release-21418.yml").unlink(missing_ok=True)
Path("scripts/prepare-21418.py").unlink(missing_ok=True)
