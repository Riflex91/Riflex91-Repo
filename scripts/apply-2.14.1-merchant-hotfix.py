from pathlib import Path
import json

BOT = Path("bot.js")
s = BOT.read_text(encoding="utf-8")

if "var VERSION = '2.14.1';" in s:
    print("2.14.1 already applied")
else:
    if "var VERSION = '2.14.0';" not in s:
        raise SystemExit("Expected bot 2.14.0 before hotfix")

    s = s.replace("/* Adventure Land • AiO Bot 2.14.0 | 2026-09-10", "/* Adventure Land • AiO Bot 2.14.1 | 2026-09-10", 1)
    s = s.replace("var VERSION = '2.14.0';", "var VERSION = '2.14.1';", 1)
    s = s.replace("audit('feature_contract','2.14.0 Brain-v2 + Research Bridge Kernfunktionen geprüft'", "audit('feature_contract','2.14.1 Stabilitäts-Hotfix + Brain-v2 + Research Bridge Kernfunktionen geprüft'", 1)

    old_action = """  function action(name, fn, cooldownKey, cooldownMs) {
    var key = cooldownKey || name, now = clock(); if (now < (S.times[key] || 0)) return false;
    S.times[key] = now + (cooldownMs || 250);
    S.lastAction = name; S.lastActionAt = now;
    var started = now; audit('action_start', name, null);
    try {
      var result = fn();
      if (result && typeof result.then === 'function') result.then(function (v) { audit('action_ok', name, { durationMs: clock() - started, result: compactData(v) }); }, function (e) { audit('action_error', name, { durationMs: clock() - started, error: reason(e) }, 'error'); });
      else audit('action_ok', name, { durationMs: clock() - started, sync: true });
      return true;
    } catch (e) { audit('action_error', name, { durationMs: clock() - started, error: reason(e) }, 'error'); return false; }
  }
"""
    new_action = """  function action(name, fn, cooldownKey, cooldownMs) {
    var key = cooldownKey || name, now = clock(); if (now < (S.times[key] || 0)) return false;
    S.times[key] = now + (cooldownMs || 250);
    S.lastAction = name; S.lastActionAt = now;
    var started = now; audit('action_start', name, null);
    function fail(e){var err=reason(e);if(/^partyRequest:/.test(String(key))&&/invalid/i.test(err))S.times[key]=Math.max(Number(S.times[key])||0,clock()+15000);audit('action_error', name, { durationMs: clock() - started, error: err }, 'error');}
    try {
      var result = fn();
      if (result && typeof result.then === 'function') result.then(function (v) { audit('action_ok', name, { durationMs: clock() - started, result: compactData(v) }); }, fail);
      else audit('action_ok', name, { durationMs: clock() - started, sync: true });
      return true;
    } catch (e) { fail(e); return false; }
  }
"""
    if old_action not in s:
        raise SystemExit("action block not found")
    s = s.replace(old_action, new_action, 1)

    old_cm = """  on_cm=function(name,data){
    audit('cm_receive','CM von '+name,data);
    if(accountCharacterName(name)&&data&&data.type==='aio27-report'&&data.name===name&&Number(data.protocol)===REPORT_PROTOCOL){S.reports[name]=data;write('report:'+name,data);syncAutoRoster(true);}
    if(C.roster.indexOf(name)>=0&&data&&data.type==='aio27-elixir-delivery'&&data.to===me){S.elixirDelivery=data;write('elixirDelivery:'+me,data);}
  };
"""
    new_cm = """  on_cm=function(name,data){
    var isReport=!!(data&&data.type==='aio27-report');
    if(!isReport||clock()>(S.times['cmAudit:'+name]||0)){if(isReport)S.times['cmAudit:'+name]=clock()+15000;var cmLog=isReport?{type:data.type,protocol:data.protocol,version:data.version,name:data.name,ctype:data.ctype,level:data.level,map:data.map,x:Math.round(Number(data.x)||0),y:Math.round(Number(data.y)||0),hp:data.hp,max_hp:data.max_hp,mp:data.mp,max_mp:data.max_mp,gold:data.gold,free:data.free,active:data.active,rip:data.rip,status:data.status,mode:data.mode,targetMtype:data.targetMtype,at:data.at}:data;audit('cm_receive','CM von '+name,cmLog);}
    if(accountCharacterName(name)&&data&&data.type==='aio27-report'&&data.name===name&&Number(data.protocol)===REPORT_PROTOCOL){S.reports[name]=data;write('report:'+name,data);syncAutoRoster(true);}
    if(C.roster.indexOf(name)>=0&&data&&data.type==='aio27-elixir-delivery'&&data.to===me){S.elixirDelivery=data;write('elixirDelivery:'+me,data);}
  };
"""
    if old_cm not in s:
        raise SystemExit("CM block not found")
    s = s.replace(old_cm, new_cm, 1)

    start = s.index("  function v277MerchantServiceCandidates(){")
    end = s.index("  function v277MerchantRestockSelfTick", start)
    new_candidates = """  function v277MerchantServiceCandidates(){
    var now=clock(),last=S.merchantLastService||{},urgent=S.merchantServiceUrgent||{},gap=Math.max(20000,Number(C.merchantServiceIntervalSeconds||90)*1000);return farmerReports().filter(function(r){return r&&r.active!==false&&!r.rip;}).map(function(r){var req=v277ReportSupplyRequest(r),inventory=(r.inventory||[]).filter(function(i){return i&&i.name!==C.hpot&&i.name!==C.mpot;}).length,age=now-Number(last[r.name]||0),recentlyServiced=age<gap,goldNeed=Number(r.gold||0)>=Math.max(Number(C.merchantCollectGoldOver)||0,Number(C.merchantFarmerGoldReserve)||0),freeNeed=Number(r.free||99)<=Number(C.merchantPickupFreeSlotsAt||12),routine=!recentlyServiced,lootNeed=!recentlyServiced&&(freeNeed||(inventory>0&&routine)),potNeed=req.hp||req.mp||!!urgent[r.name],freeUrgent=freeNeed&&!recentlyServiced,urgentNeed=potNeed||goldNeed||freeUrgent;var priority=(potNeed?1000000:0)+(goldNeed?400000:0)+(freeUrgent?250000:0)+(lootNeed?100000:0)+Math.min(age,120000);return {r:r,req:req,inventory:inventory,age:age,recentlyServiced:recentlyServiced,goldNeed:goldNeed,freeNeed:freeNeed,lootNeed:lootNeed,potNeed:potNeed,urgent:urgentNeed,routine:routine,priority:priority};}).filter(function(x){return x.urgent||x.lootNeed||x.routine;}).sort(function(a,b){return b.priority-a.priority||a.r.name.localeCompare(b.r.name);});
  }
"""
    s = s[:start] + new_candidates + s[end:]

    start = s.rfind("  function farmerLootTransferTick(){")
    end = s.index("  function v277MerchantServiceTick", start)
    new_transfer = """  function farmerLootTransferTick(){
    if(character.ctype==='merchant'||!C.merchantCollectLoot)return false;if(v273CollectRequestedMaterialsTick())return true;var mn=merchantName(),m=mn&&localPlayer(mn),mr=mn&&peerReport(mn);if(!m||!mr||dist(character,m)>260)return false;
    if(typeof send_gold==='function'){var keep=Math.max(0,Number(C.merchantFarmerGoldReserve)||0),gold=Math.max(0,Number(character.gold)||0),trigger=Math.max(keep,Number(C.merchantCollectGoldOver)||0);if(gold>=trigger){var amount=Math.max(0,gold-keep);if(amount>0)return action('Gold an Merchant',function(){audit('merchant_pickup_gold','Merchant ist in Reichweite · gebündelte Goldübergabe',{merchant:mn,amount:amount,keep:keep,serviceTrigger:trigger});return send_gold(mn,amount);},'loot-gold',5000);}}if(mr.free<2)return false;
    var idx=(character.items||[]).findIndex(function(i){if(!i||protectedStandItem(i)||isElixir(i)||i.name===C.hpot||i.name===C.mpot)return false;return true;});if(idx>=0&&typeof send_item==='function')return action('Loot/Ausrüstung an Merchant',function(){return send_item(mn,idx,character.items[idx].q||1);},'loot-item',1800);return false;
  }
"""
    s = s[:start] + new_transfer + s[end:]

    marker = "  var v281PartyReconcileBase=partyReconcileTick;\n"
    watchdog = """  var v2141MerchantTickBase=merchantTick;
  merchantTick=function(){var now=clock(),w=S.merchantWatchdog||(S.merchantWatchdog={windowAt:now,actions:0,suspendUntil:0,lastActionAt:Number(S.lastActionAt)||0});if(now-w.windowAt>=60000){w.windowAt=now;w.actions=0;}if(now<w.suspendUntil){S.status='Merchant-Schutzpause · Logistik kurz gedrosselt';S.mode='Merchant · Watchdog';return;}var before=Number(S.lastActionAt)||0,r=v2141MerchantTickBase();if((Number(S.lastActionAt)||0)!==before)w.actions++;if(w.actions>90){w.suspendUntil=now+10000;w.actions=0;audit('merchant_watchdog','Merchant-Logistik wegen ungewöhnlich hoher Aktionsrate kurz gedrosselt',{pauseMs:10000,thresholdPerMinute:90},'warning');}return r;};

"""
    if marker not in s:
        raise SystemExit("merchant watchdog insertion point not found")
    s = s.replace(marker, watchdog + marker, 1)
    BOT.write_text(s, encoding="utf-8")

v = Path("version.json")
data = json.loads(v.read_text(encoding="utf-8"))
data["version"] = "2.14.1"
data["build"] = "2026-09-10"
data["dashboardVersion"] = "2.14.0"
v.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

for fn in ("README.md", "BOT_README.md"):
    p = Path(fn)
    text = p.read_text(encoding="utf-8")
    text = text.replace("Adventure Land – AiO Bot 2.14.0", "Adventure Land – AiO Bot 2.14.1", 1)
    text = text.replace("Aktueller Stand: **2.14.0**", "Aktueller Stand: **2.14.1**", 1)
    if fn == "README.md" and "2.14.1 Stabilitäts-Hotfix" not in text:
        note = "\n> **2.14.1 Stabilitäts-Hotfix:** bündelt Farmer→Merchant-Goldtransfers erst ab dem konfigurierten Schwellwert, verhindert sofortige Wiederholungs-Services, drosselt übermäßige Merchant-Aktionsraten und reduziert CM-Auditlast. Brain/Teacher-Gewichte und Cloudflare-Dashboard bleiben unverändert.\n"
        text = text.replace("\n> Aktueller Stand:", note + "\n> Aktueller Stand:", 1)
    if fn == "BOT_README.md" and "## 2.14.1 Stabilitäts-Hotfix" not in text:
        note = "\n## 2.14.1 Stabilitäts-Hotfix\n\nMerchant-Fokus: Goldtransfers beachten `merchantCollectGoldOver`, Farmer-Service erhält Hysterese, Party-`invalid` erhält Backoff, Report-CM-Audits werden gedrosselt/komprimiert und ein Merchant-Watchdog begrenzt ungewöhnliche Aktionsspitzen. Das neuronale Brain bleibt unverändert.\n\n"
        text = text.replace("\n", "\n" + note, 1)
    p.write_text(text, encoding="utf-8")

verify = Path("scripts/verify-release.js")
text = verify.read_text(encoding="utf-8")
text = text.replace('ok(version.version === "2.14.0", "prepared release must be 2.14.0");', 'ok(version.version === "2.14.1", "prepared release must be 2.14.1");')
old = '''  ok(dash.includes(`Dashboard ${versionMatch[1]}`), "dashboard version marker not aligned with bot");\n  ok(worker.includes(`version:\"${versionMatch[1]}\"`) || worker.includes(`version: \"${versionMatch[1]}\"`) || worker.includes(`version:"${versionMatch[1]}"`), "worker health version not aligned with bot");\n  ok(pkg.includes(`\\"version\\": \\"${versionMatch[1]}\\"`), "dashboard package version not aligned");'''
if old not in text:
    start = text.index('  ok(dash.includes(`Dashboard ${versionMatch[1]}`)')
    end = text.index('\n}', start)
    replacement = '''  ok(version.dashboardVersion === "2.14.0", "dashboard version must remain 2.14.0 for bot-only hotfix");\n  ok(dash.includes(`Dashboard ${version.dashboardVersion}`), "dashboard version marker not aligned with dashboardVersion");\n  ok(worker.includes(`version:\"${version.dashboardVersion}\"`) || worker.includes(`version: \"${version.dashboardVersion}\"`) || worker.includes(`version:"${version.dashboardVersion}"`), "worker health version not aligned with dashboardVersion");\n  ok(pkg.includes(`\\"version\\": \\"${version.dashboardVersion}\\"`), "dashboard package version not aligned with dashboardVersion");'''
    text = text[:start] + replacement + text[end:]
else:
    text = text.replace(old, '''  ok(version.dashboardVersion === "2.14.0", "dashboard version must remain 2.14.0 for bot-only hotfix");\n  ok(dash.includes(`Dashboard ${version.dashboardVersion}`), "dashboard version marker not aligned with dashboardVersion");\n  ok(worker.includes(`version:\"${version.dashboardVersion}\"`) || worker.includes(`version: \"${version.dashboardVersion}\"`) || worker.includes(`version:"${version.dashboardVersion}"`), "worker health version not aligned with dashboardVersion");\n  ok(pkg.includes(`\\"version\\": \\"${version.dashboardVersion}\\"`), "dashboard package version not aligned with dashboardVersion");''')
anchor = 'ok(bot.includes("V214_RESEARCH_PROFILES") && bot.includes("development:{label:\'Entwicklungsbrief\'"), "Research prompt profiles missing");\n'
extra = 'ok(bot.includes("serviceTrigger:trigger") && bot.includes("gold>=trigger"), "2.14.1 bundled gold threshold guard missing");\nok(bot.includes("recentlyServiced=age<gap") && bot.includes("freeUrgent=freeNeed&&!recentlyServiced"), "2.14.1 Merchant service hysteresis missing");\nok(bot.includes("cmAudit:") && bot.includes("clock()+15000"), "2.14.1 CM audit throttling missing");\nok(bot.includes("merchant_watchdog") && bot.includes("thresholdPerMinute:90"), "2.14.1 Merchant watchdog missing");\nok(bot.includes("/^partyRequest:/.test") && bot.includes("clock()+15000"), "2.14.1 party invalid backoff missing");\n'
if extra not in text:
    text = text.replace(anchor, anchor + extra)
text = text.replace('version ${version.version} · Brain v2.14 · Research Bridge', 'version ${version.version} · Brain v2.14 · Research Bridge · Merchant stability hotfix')
verify.write_text(text, encoding="utf-8")

research = Path("scripts/smoke-research.js")
research.write_text(research.read_text(encoding="utf-8").replace("VERSION:'2.14.0'", "VERSION:'2.14.1'"), encoding="utf-8")

smoke = Path("scripts/smoke-merchant-stability.js")
smoke.write_text('''#!/usr/bin/env node\n"use strict";\nconst fs=require('fs'),assert=require('assert/strict');\nconst bot=fs.readFileSync('bot.js','utf8');\nassert.match(bot,/var VERSION = ['"]2\\.14\\.1['"]/);\nassert.ok(bot.includes('gold>=trigger'));\nassert.ok(bot.includes('serviceTrigger:trigger'));\nassert.ok(bot.includes("'loot-gold',5000"));\nassert.ok(bot.includes('recentlyServiced=age<gap'));\nassert.ok(bot.includes('freeUrgent=freeNeed&&!recentlyServiced'));\nassert.ok(bot.includes("S.times['cmAudit:'+name]=clock()+15000"));\nassert.ok(bot.includes("audit('merchant_watchdog'"));\nassert.ok(bot.includes("/^partyRequest:/.test(String(key))")&&bot.includes('clock()+15000'));\nfunction goldTransfer(gold,keep,threshold){const trigger=Math.max(keep,threshold);return gold>=trigger?Math.max(0,gold-keep):0;}\nassert.equal(goldTransfer(8814,5000,25000),0);\nassert.equal(goldTransfer(24999,5000,25000),0);\nassert.equal(goldTransfer(25000,5000,25000),20000);\nfunction serviceFlags({age,gap=90000,free=0,pot=false,gold=0,trigger=25000}){const recentlyServiced=age<gap,freeNeed=free<=12,goldNeed=gold>=trigger,freeUrgent=freeNeed&&!recentlyServiced;return {urgent:pot||goldNeed||freeUrgent};}\nassert.equal(serviceFlags({age:5000,free:0}).urgent,false);\nassert.equal(serviceFlags({age:5000,free:0,pot:true}).urgent,true);\nassert.equal(serviceFlags({age:100000,free:0}).urgent,true);\nconsole.log('Merchant stability smoke OK');\n''', encoding="utf-8")

print("2.14.1 merchant hotfix prepared")
