from pathlib import Path
import json

ROOT=Path('.')
bot_p=ROOT/'bot.js'
ver_p=ROOT/'version.json'
readme_p=ROOT/'README.md'
botreadme_p=ROOT/'BOT_README.md'
verify_p=ROOT/'scripts/verify-release.js'

bot=bot_p.read_text(encoding='utf-8')
assert "Adventure Land • AiO Bot 2.14.7 | 2026-09-10" in bot
assert "var VERSION = '2.14.7';" in bot
assert "function v2147BankReady" in bot
assert "function v2147ExplicitItemTick" in bot

bot=bot.replace('Adventure Land • AiO Bot 2.14.7 | 2026-09-10','Adventure Land • AiO Bot 2.14.8 | 2026-09-10',1)
bot=bot.replace("var VERSION = '2.14.7';","var VERSION = '2.14.8';",1)

# The visible manual button now states its actual behavior.
old_label="return C.language==='de'?'Auf Updates prüfen':'Check for update';"
assert old_label in bot
bot=bot.replace(old_label,"return C.language==='de'?'Auf Updates prüfen & installieren':'Check & install update';",1)

# 2.14.7 patched an older tick variant. Guard the actual final tick that uses loot-action.
old_loot="if(typeof loot==='function'&&clock()>(S.times.loot||0)){S.times.loot=clock()+900;action('Loot einsammeln',function(){return loot();},'loot-action',800);}"
assert bot.count(old_loot)==1, bot.count(old_loot)
new_loot="if(typeof loot==='function'&&clock()>(S.times.loot||0)&&!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)){S.times.loot=clock()+900;action('Loot einsammeln',function(){return loot();},'loot-action',800);}"
bot=bot.replace(old_loot,new_loot,1)

# Explicit bank rules are handled by the same atomic cleanup state machine as automatic cleanup.
fn=bot.index('  function v2147ExplicitItemTick(){')
start=bot.index("      if(policy==='bank'){",fn)
end=bot.index("      if(policy==='sell'){",start)
assert start<end
bot=bot[:start]+"      if(policy==='bank')continue;\n"+bot[end:]

marker='  // Preserve references so dispose can distinguish our CM handler on engines that support function identity.\n'
assert marker in bot
block=r'''  // ---------------------------------------------------------------------------
  // 2.14.8 Merchant atomic bank-cleanup + explicit manual update install.
  // ---------------------------------------------------------------------------
  function v2148BankCleanupCandidate(){
    if(character.ctype!=='merchant'||!C.merchantManageBank)return null;
    var items=character.items||[],i,it,policy;
    for(i=0;i<items.length;i++){
      it=items[i];if(!it||it.l||it.p)continue;
      policy=v2147ItemPolicy(it.name);
      if(policy==='bank')return {index:i,item:it,explicit:true};
    }
    if(freeSlots()>Number(C.merchantInventoryReserve||5))return null;
    for(i=0;i<items.length;i++){
      it=items[i];if(!it||it.l||it.p||v2147ItemPolicy(it.name)!=='auto'||isElixir(it)||it.name===C.hpot||it.name===C.mpot||/^c?scroll[0-4]$/.test(String(it.name||'')))continue;
      var d=GD.items&&GD.items[it.name]||{},required=S.merchantPlan&&S.merchantPlan.farmOrder&&S.merchantPlan.farmOrder.item===it.name;
      if(required)continue;
      if(v273GroupUtility(it)<0||(!d.upgrade&&!d.compound&&!d.e&&!d.exchange&&!d.exchanges))return {index:i,item:it,explicit:false};
    }
    return null;
  }
  function v2148BankCleanupSig(c){
    if(!c||!c.item)return '';
    return [c.index,c.item.name,Number(c.item.level)||0,Number(c.item.q)||1,c.explicit?'E':'A'].join('|');
  }
  function v2148BankCleanupFinish(kind,detail,level){
    var st=S.merchantBankCleanup2148;if(!st)return;
    audit(kind,detail,{durationMs:clock()-Number(st.startedAt||clock()),stores:Number(st.stores)||0,free:freeSlots(),reserve:Number(C.merchantInventoryReserve||5)},level||'info');
    S.merchantBankCleanup2148=null;
  }
  function v2148BankCleanupTick(){
    var now=clock(),st=S.merchantBankCleanup2148,cand=v2148BankCleanupCandidate();
    if(!st){
      if(now<Number(S.times.bankCleanupRetry2148||0)||!cand)return false;
      st=S.merchantBankCleanup2148={startedAt:now,stores:0,lastSig:'',lastStoreAt:0,lastProgressAt:now};
      audit('merchant_bank_cleanup_start',C.language==='de'?'Atomare Bankbereinigung gestartet':'Atomic bank cleanup started',{item:cand.item.name,explicit:!!cand.explicit,free:freeSlots(),reserve:Number(C.merchantInventoryReserve||5)});
    }
    if(now-Number(st.startedAt||now)>15000||Number(st.stores||0)>=10){
      S.times.bankCleanupRetry2148=now+12000;
      v2148BankCleanupFinish('merchant_bank_cleanup_timeout',C.language==='de'?'Bankbereinigung kontrolliert freigegeben; späterer Neuversuch':'Bank cleanup released by safety lease; retry later','warning');
      return false;
    }
    cand=v2148BankCleanupCandidate();
    if(!cand){
      v2148BankCleanupFinish('merchant_bank_cleanup_done',C.language==='de'?'Bankbereinigung abgeschlossen':'Bank cleanup completed');
      return false;
    }
    if(String(character.map||'').indexOf('bank')!==0){
      S.status=(C.language==='de'?'Bankbereinigung · zur Bank: ':'Bank cleanup · to bank: ')+v273Name(cand.item.name);S.mode='Merchant · Bank';
      if(v2147BankExitActive())return true;
      moveToGoal({map:'bank',x:0,y:0},C.language==='de'?'Atomare Bankbereinigung':'Atomic bank cleanup',{kind:'merchant-bank-cleanup',forceAfter:9000});
      return true;
    }
    S.status=(C.language==='de'?'Bankbereinigung · ':'Bank cleanup · ')+v273Name(cand.item.name);S.mode='Merchant · Bank';
    if(character.moving||S.moveInFlight||v2147BankExitActive())return true;
    if(!character.bank)return true;
    var cap=v273BankCapacity();
    if(cap&&cap.free<=0){S.bankFull=true;v273OpenBankPackTick();return true;}
    var sig=v2148BankCleanupSig(cand);
    if(st.lastSig===sig&&now-Number(st.lastStoreAt||0)<2600)return true;
    if(now<Number(S.times['bank-store-2148']||0))return true;
    if(typeof bank_store!=='function')return true;
    var idx=cand.index,name=cand.item.name,explicit=!!cand.explicit;
    var started=action((explicit?'Item-Regel Bank ':'Item in Bank lagern ')+name,function(){
      if(String(character.map||'').indexOf('bank')!==0||character.moving||S.moveInFlight||v2147BankExitActive())throw Error('bank_location_changed');
      return bank_store(idx);
    },'bank-store-2148',900);
    if(started){st.lastSig=sig;st.lastStoreAt=now;st.lastProgressAt=now;st.stores=Number(st.stores||0)+1;}
    return true;
  }

  // Never travel to the bank merely because inventory pressure is high. There must
  // be a real bank candidate first; the atomic phase owns the route until it settles.
  v273StoreTrashBankTick=function(){
    if(character.ctype!=='merchant'||!C.merchantManageBank)return false;
    if(S.merchantBankCleanup2148||v2148BankCleanupCandidate())return v2148BankCleanupTick();
    return false;
  };
  var v2148MerchantTickBase=merchantTick;
  merchantTick=function(){
    if(character.ctype==='merchant'&&(S.merchantBankCleanup2148||v2148BankCleanupCandidate())){
      if(v2148BankCleanupTick())return true;
    }
    return v2148MerchantTickBase();
  };

  function v2148ManualUpdateInstall(){
    if(S.update.checking||S.update.applying){if(S.toolWindows.settings)renderTool('settings');return false;}
    S.update.checking=true;S.update.checkedAt=clock();S.update.error='';
    var repo=defaults.updateRepositoryUrl;
    audit('update_manual_check',C.language==='de'?'Manuelle Update-Prüfung und Installation gestartet':'Manual update check and install started',{version:VERSION,repo:repo});
    checkRepo(repo).then(function(r){
      S.update.checking=false;S.update.latest=r.version;S.update.repo=r.repo;S.update.raw=r.raw;S.update.available=newer(r.version,VERSION);S.update.error='';
      if(!S.update.available){audit('update_manual_current',C.language==='de'?'Bot ist bereits aktuell':'Bot is already current',{version:VERSION,found:r.version});renderAll(true);return false;}
      audit('update_manual_found',C.language==='de'?'Neue Version gefunden; manuelle Installation startet':'New version found; manual install starts',{from:VERSION,to:r.version,repo:r.repo},'warning');
      renderAll(true);
      return selfUpdate(false);
    }).catch(function(e){
      S.update.checking=false;S.update.error=reason(e);audit('update_manual_error',(C.language==='de'?'Manuelles Update fehlgeschlagen: ':'Manual update failed: ')+S.update.error,{repo:repo},'error');renderAll(true);
    });
    if(S.toolWindows.settings)renderTool('settings');
    return true;
  }
  var v2148UiClickBase=uiClick;
  uiClick=function(e){
    var t=e&&e.target&&e.target.closest?e.target.closest('button'):null;
    if(t&&t.dataset&&t.dataset.action==='update-check'){v2148ManualUpdateInstall();return;}
    return v2148UiClickBase(e);
  };

  audit('feature_contract','2.14.8 Atomare Merchant-Bankbereinigung + finaler Bank-Loot-Guard + manueller Update-Installationspfad geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C)});

'''
bot=bot.replace(marker,block+marker,1)
bot_p.write_text(bot,encoding='utf-8')

v=json.loads(ver_p.read_text(encoding='utf-8'))
assert v.get('version')=='2.14.7'
v['version']='2.14.8'
v['build']='2026-09-10'
v['dashboardVersion']='2.14.5'
ver_p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Retained regression tests must run against the new bot version.
test_paths=[
    verify_p,
    ROOT/'scripts/smoke-merchant-stability.js',
    ROOT/'scripts/smoke-2144-merchant-party-ui.js',
    ROOT/'scripts/smoke-2145-merchant-path-dashboard-ui.js',
    ROOT/'scripts/smoke-2146-merchant-update-button.js',
    ROOT/'scripts/smoke-2147-merchant-bank-item-rules.js',
]
for p in test_paths:
    if not p.exists():continue
    s=p.read_text(encoding='utf-8')
    s=s.replace('2.14.7','2.14.8').replace('2\\.14\\.7','2\\.14\\.8')
    if p.name=='verify-release.js':
        s=s.replace('dashboard version must be 2.14.8 for dashboard release','dashboard version must remain 2.14.5 for bot-only release')
    if p.name=='smoke-2146-merchant-update-button.js':
        s=s.replace("C.language==='de'?'Auf Updates prüfen':'Check for update'","C.language==='de'?'Auf Updates prüfen & installieren':'Check & install update'")
        s=s.replace('German update button label missing','German manual check-and-install label missing')
    p.write_text(s,encoding='utf-8')

# Strengthen the release contract for the exact regressions seen live.
s=verify_p.read_text(encoding='utf-8')
needle="if (!process.exitCode) console.log("
assert needle in s
checks='''\nok(bot.includes("function v2148BankCleanupTick"), "2.14.8 atomic Merchant bank cleanup missing");\nok(bot.includes("function v2148BankCleanupCandidate"), "2.14.8 bank candidate preflight missing");\nok(bot.includes("S.merchantBankCleanup2148||v2148BankCleanupCandidate()"), "2.14.8 Merchant must hold atomic bank phase before legacy logic");\nok(bot.includes("bankCleanupRetry2148=now+12000"), "2.14.8 bank cleanup safety lease/backoff missing");\nok(bot.includes("'bank-store-2148',900"), "2.14.8 bank cleanup cooldown/hold missing");\nok(bot.includes("'loot-action',800") && bot.includes("String(character.map||'').indexOf('bank')===0"), "2.14.8 final Merchant tick must suppress loot() in bank");\nok(bot.includes("function v2148ManualUpdateInstall"), "2.14.8 dedicated manual updater missing");\nok(bot.includes("return selfUpdate(false)"), "2.14.8 manual updater must explicitly install as manual");\nok(bot.includes("Auf Updates prüfen & installieren"), "2.14.8 manual update button label missing");\n'''
s=s.replace(needle,checks+'\n'+needle,1)
verify_p.write_text(s,encoding='utf-8')

smoke=ROOT/'scripts/smoke-2148-merchant-atomic-bank-manual-update.js'
smoke.write_text(r'''#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.8');
assert.equal(version.dashboardVersion,'2.14.5');
assert.match(bot,/var VERSION = ['"]2\.14\.8['"]/);
assert.ok(bot.includes('function v2148BankCleanupCandidate'),'bank candidate preflight missing');
assert.ok(bot.includes('function v2148BankCleanupTick'),'atomic bank cleanup state machine missing');
assert.ok(bot.includes("policy==='bank')continue"),'legacy explicit bank route must yield to atomic cleanup');
assert.ok(bot.includes("if(freeSlots()>Number(C.merchantInventoryReserve||5))return null"),'automatic bank route must require pressure before selecting automatic candidate');
assert.ok(bot.includes("bankCleanupRetry2148=now+12000"),'bounded bank cleanup retry backoff missing');
assert.ok(bot.includes("now-Number(st.startedAt||now)>15000")&&bot.includes("Number(st.stores||0)>=10"),'bank cleanup safety lease missing');
assert.ok(bot.includes("if(st.lastSig===sig&&now-Number(st.lastStoreAt||0)<2600)return true"),'bank cleanup must hold while bank_store inventory sync settles');
assert.ok(bot.includes("if(now<Number(S.times['bank-store-2148']||0))return true"),'bank cleanup must hold during store cooldown');
assert.ok(bot.includes("v273StoreTrashBankTick=function()")&&bot.includes("if(S.merchantBankCleanup2148||v2148BankCleanupCandidate())return v2148BankCleanupTick()"),'legacy bank cleanup must not route without a candidate');
assert.ok(bot.includes("if(character.ctype==='merchant'&&(S.merchantBankCleanup2148||v2148BankCleanupCandidate()))"),'atomic cleanup must precede legacy Merchant planner actions');
const finalTick=bot.slice(bot.lastIndexOf("function tick()"),bot.lastIndexOf("function pause("));
assert.ok(finalTick.includes("'loot-action',800"),'final tick loot action marker missing');
assert.ok(finalTick.includes("!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)"),'final tick must suppress Merchant loot while in bank');
assert.ok(bot.includes('function v2148ManualUpdateInstall'),'dedicated manual updater missing');
assert.ok(bot.includes("audit('update_manual_check'")&&bot.includes("audit('update_manual_found'"),'manual update audit trail missing');
assert.ok(bot.includes('return selfUpdate(false);'),'manual check must directly invoke manual install');
assert.ok(bot.includes("data-action==='update-check'){v2148ManualUpdateInstall();return;"),'final click wrapper must own update button');
assert.ok(bot.includes("C.language==='de'?'Auf Updates prüfen & installieren':'Check & install update'"),'manual update button semantics missing');
console.log('2.14.8 atomic Merchant bank cleanup / manual updater smoke OK');
''',encoding='utf-8')

note='''\n> **2.14.8 Merchant-State-/Updater-Hotfix:** Bankbereinigung ist jetzt eine atomare, zeitlich begrenzte Phase: Der Merchant fährt nur zur Bank, wenn vorab tatsächlich ein lagerbarer Kandidat existiert, bleibt während `bank_store`/Inventarsynchronisation in der Bank und gibt die Phase erst nach Abschluss oder Sicherheits-Timeout frei. Der tatsächlich aktive finale Tick unterdrückt `loot()` auf Bank-Maps. **„Auf Updates prüfen & installieren“** prüft manuell und installiert eine gefundene neuere Version unmittelbar über den manuellen Self-Update-Pfad, ohne auf den periodischen Auto-Updater zu warten. Dashboard/Worker und Brain bleiben unverändert auf 2.14.5.\n'''
for p in (readme_p,botreadme_p):
    s=p.read_text(encoding='utf-8')
    s=s.replace('AiO Bot 2.14.7','AiO Bot 2.14.8',1)
    if '2.14.8 Merchant-State-/Updater-Hotfix' not in s:
        # Put the newest hotfix close to the other release notes.
        pos=s.find('\n',s.find('\n')+1)
        if pos>=0:s=s[:pos+1]+note+s[pos+1:]
        else:s+=note
    p.write_text(s,encoding='utf-8')

print('2.14.8 patch prepared')
