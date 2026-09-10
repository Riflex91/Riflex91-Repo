from pathlib import Path
import json

ROOT=Path('.')
bot_p=ROOT/'bot.js'
ver_p=ROOT/'version.json'
readme_p=ROOT/'README.md'
botreadme_p=ROOT/'BOT_README.md'
verify_p=ROOT/'scripts/verify-release.js'
test_paths=[
    ROOT/'scripts/smoke-merchant-stability.js',
    ROOT/'scripts/smoke-2144-merchant-party-ui.js',
    ROOT/'scripts/smoke-2145-merchant-path-dashboard-ui.js',
    ROOT/'scripts/smoke-2146-merchant-update-button.js',
]

bot=bot_p.read_text(encoding='utf-8')
assert "Adventure Land • AiO Bot 2.14.6 | 2026-09-10" in bot
assert "var VERSION = '2.14.6';" in bot

bot=bot.replace('Adventure Land • AiO Bot 2.14.6 | 2026-09-10','Adventure Land • AiO Bot 2.14.7 | 2026-09-10',1)
bot=bot.replace("var VERSION = '2.14.6';","var VERSION = '2.14.7';",1)

default_needle="    merchantBuyHPTo: 2200, merchantBuyMPTo: 1800, merchantCollectGoldOver: 25000, merchantInventoryReserve: 5,\n    showSettingHelp:"
assert default_needle in bot
bot=bot.replace(default_needle,
'''    merchantBuyHPTo: 2200, merchantBuyMPTo: 1800, merchantCollectGoldOver: 25000, merchantInventoryReserve: 5,
    merchantItemActions: {},
    showSettingHelp:''',1)

clean_needle="    out.merchantCraftTargets = safeString(out.merchantCraftTargets || '', 1200);\n    out.showSettingHelp"
assert clean_needle in bot
bot=bot.replace(clean_needle,
'''    out.merchantCraftTargets = safeString(out.merchantCraftTargets || '', 1200);
    if(!out.merchantItemActions||typeof out.merchantItemActions!=='object'||Array.isArray(out.merchantItemActions))out.merchantItemActions={};
    else{var itemActions2147={};Object.keys(out.merchantItemActions).slice(0,2000).forEach(function(name){var p=String(out.merchantItemActions[name]||'auto');if(['keep','bank','sell','exchange'].indexOf(p)>=0)itemActions2147[safeString(name,120)]=p;});out.merchantItemActions=itemActions2147;}
    out.showSettingHelp''',1)

loot_old="      if(typeof loot==='function'&&clock()>(S.times.loot||0)){S.times.loot=clock()+900;action('Loot einsammeln',function(){return loot();},'loot',850);}"
assert loot_old in bot
loot_new="      if(typeof loot==='function'&&clock()>(S.times.loot||0)&&!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)){S.times.loot=clock()+900;action('Loot einsammeln',function(){return loot();},'loot',850);}"
bot=bot.replace(loot_old,loot_new,1)

marker='  // Preserve references so dispose can distinguish our CM handler on engines that support function identity.\n'
assert marker in bot
block=r'''  // ---------------------------------------------------------------------------
  // 2.14.7 Merchant bank-race guard + optional per-item disposition overrides.
  // ---------------------------------------------------------------------------
  var V2147_ITEM_POLICIES=['auto','keep','bank','sell','exchange'];

  function v2147ItemPolicy(name){
    var map=C.merchantItemActions;
    if(!name||!map||typeof map!=='object')return 'auto';
    var p=String(map[name]||'auto');
    return V2147_ITEM_POLICIES.indexOf(p)>=0?p:'auto';
  }
  function v2147SetItemPolicy(name,policy){
    name=String(name||'').trim();policy=String(policy||'auto');
    if(!name)return false;
    if(V2147_ITEM_POLICIES.indexOf(policy)<0)policy='auto';
    var map=Object.assign({},C.merchantItemActions||{});
    if(policy==='auto')delete map[name];else map[name]=policy;
    C.merchantItemActions=map;C=cleanConfig(C);write('config',C);S.cloudConfigDirty=true;
    audit('merchant_item_rule',(C.language==='de'?'Item-Regel geändert: ':'Item rule changed: ')+name,{item:name,policy:policy});
    return true;
  }
  function v2147BankExitActive(){
    var lock=S.moveArbiter2145;
    return !!(lock&&v2145MoveLockActive(lock)&&/bank-exit/i.test(String(lock.kind||'')));
  }
  function v2147BankReady(){
    return String(character.map||'').indexOf('bank')===0&&!character.moving&&!S.moveInFlight&&!v2147BankExitActive();
  }
  function v2147ItemIds(){
    var ids=Object.keys(GD.items||{});
    ids.sort(function(a,b){
      var an=String((GD.items[a]||{}).name||a),bn=String((GD.items[b]||{}).name||b);
      return an.localeCompare(bn)||a.localeCompare(b);
    });
    return ids;
  }
  function v2147PolicyLabel(policy){
    var de=C.language==='de';
    if(policy==='keep')return de?'Im Inventar behalten':'Keep in inventory';
    if(policy==='bank')return de?'In Bank lagern':'Store in bank';
    if(policy==='sell')return de?'An NPC verkaufen':'Sell to NPC';
    if(policy==='exchange')return de?'Exchange-Item eintauschen':'Exchange item';
    return de?'Automatisch (bestehende Botlogik)':'Automatic (existing bot logic)';
  }
  function v2147RulesHTML(){
    var de=C.language==='de',configured=Object.keys(C.merchantItemActions||{}).filter(function(id){return v2147ItemPolicy(id)!=='auto';});
    var ids=v2147ItemIds(),selected=String(S.merchantItemRuleSelected||'');
    if(!selected||ids.indexOf(selected)<0){
      selected=configured[0]||((character.items||[]).filter(Boolean)[0]||{}).name||ids[0]||'';
      S.merchantItemRuleSelected=selected;
    }
    var opts=ids.map(function(id){var d=GD.items[id]||{};return '<option value="'+esc(id)+'"'+(id===selected?' selected':'')+'>'+esc((d.name||id)+' · '+id)+'</option>';}).join('');
    var policy=v2147ItemPolicy(selected);
    var policies=V2147_ITEM_POLICIES.map(function(p){return '<option value="'+p+'"'+(p===policy?' selected':'')+'>'+esc(v2147PolicyLabel(p))+'</option>';}).join('');
    var rows=configured.sort(function(a,b){return a.localeCompare(b);}).map(function(id){var d=GD.items[id]||{};return '<div class="line"><span>'+esc((d.name||id)+' · '+id)+'</span><strong>'+esc(v2147PolicyLabel(v2147ItemPolicy(id)))+'</strong><button class="btn" data-action="merchant-item-rule-clear" data-item="'+esc(id)+'">'+(de?'Automatik':'Auto')+'</button></div>';}).join('');
    return '<div class="card merchant-item-rules"><h3>'+(de?'Item-Verhalten (optional)':'Item behavior (optional)')+'</h3>'+
      '<div class="notice">'+(de?'Ohne Eintrag bleibt für jedes Item exakt die bestehende Botlogik aktiv. Eine Einzelregel überschreibt nur Lagerung, NPC-Verkauf oder Exchange; Crafting-, Upgrade- und Compound-Planer bleiben unverändert.':'Without an entry, every item keeps the existing bot logic exactly. A per-item rule overrides only storage, NPC selling or exchange; crafting, upgrade and compound planners stay unchanged.')+'</div>'+
      '<div class="setting"><label>'+(de?'Item':'Item')+'</label><select data-merchant-item-picker="1">'+opts+'</select></div>'+
      '<div class="setting"><label>'+(de?'Aktion des Merchants':'Merchant action')+'</label><select data-merchant-item-action="1" data-item="'+esc(selected)+'">'+policies+'</select></div>'+
      (rows?'<div class="card"><h3>'+(de?'Aktive Einzelregeln':'Active item rules')+'</h3>'+rows+'</div>':'<div class="muted">'+(de?'Keine Einzelregeln gesetzt.':'No item rules configured.')+'</div>')+
      '</div>';
  }

  var v2147ToolDefsBase=toolDefs;
  toolDefs=function(){
    return v2147ToolDefsBase().map(function(row){
      if(row&&row[0]==='merchant'){
        row=row.slice();
        row[2]=C.language==='de'?'Merchant-Einstellungen':'Merchant settings';
        row[3]=C.language==='de'?'Merchant-Verhalten und Elixiere':'Merchant behavior and elixirs';
      }
      return row;
    });
  };

  var v2147MerchantHTMLBase=merchantHTML;
  merchantHTML=function(){
    var html=v2147MerchantHTMLBase(),title=C.language==='de'?'Merchant-Einstellungen':'Merchant settings';
    return html.replace(/^<h2>[\s\S]*?<\/h2>/,'<h2>'+esc(title)+'</h2>'+v2147RulesHTML());
  };

  var v2147SellDecisionBase=v2145SellDecision;
  v2145SellDecision=function(it){
    var base=v2147SellDecisionBase(it),policy=v2147ItemPolicy(it&&it.name);
    if(policy!=='auto')return Object.assign({},base,{sell:false,protected:true,reason:'item-policy-'+policy});
    return base;
  };
  v2144SellDecision=v2145SellDecision;

  v273StoreTrashBankTick=function(){
    if(character.ctype!=='merchant'||!C.merchantManageBank||freeSlots()>C.merchantInventoryReserve)return false;
    if(!v2147BankReady()||!character.bank){
      S.status=C.language==='de'?'Inventar organisieren · zur Bank':'Organize inventory · to bank';S.mode='Merchant · Bank';
      if(v2147BankExitActive())return true;
      return moveToGoal({map:'bank',x:0,y:0},C.language==='de'?'Bank organisieren':'Organize bank',{kind:'bank',forceAfter:7000});
    }
    var cap=v273BankCapacity();if(cap&&cap.free<=0){S.bankFull=true;return v273OpenBankPackTick();}
    var idx=(character.items||[]).findIndex(function(it){
      if(!it||v2147ItemPolicy(it.name)!=='auto'||it.l||it.p||isElixir(it)||it.name===C.hpot||it.name===C.mpot||/^c?scroll[0-4]$/.test(String(it.name||'')))return false;
      var d=GD.items&&GD.items[it.name]||{},required=S.merchantPlan&&S.merchantPlan.farmOrder&&S.merchantPlan.farmOrder.item===it.name;
      if(required)return false;
      return v273GroupUtility(it)<0||(!d.upgrade&&!d.compound&&!d.e&&!d.exchange&&!d.exchanges);
    });
    if(idx>=0&&typeof bank_store==='function'){
      var item=character.items[idx];
      return action('Item in Bank lagern '+item.name,function(){
        if(!v2147BankReady())throw Error('bank_location_changed');
        return bank_store(idx);
      },'bank-store',1300);
    }
    return false;
  };

  v273ExchangeTick=function(){
    if(character.ctype!=='merchant'||!C.merchantAutoExchange||typeof exchange!=='function')return false;
    var rows=[];
    (character.items||[]).forEach(function(it,i){
      if(!it||it.l||it.p)return;
      var p=v2147ItemPolicy(it.name),d=GD.items&&GD.items[it.name]||{};
      if((p==='auto'||p==='exchange')&&(d.e||d.exchange||d.exchanges))rows.push({i:i,it:it,explicit:p==='exchange'});
    });
    rows.sort(function(a,b){return (b.explicit?1:0)-(a.explicit?1:0)||a.i-b.i;});
    if(!rows.length)return false;
    var row=rows[0],d=GD.items[row.it.name]||{},need=Number(d.e)||Number(d.exchange)||1;
    if((Number(row.it.q)||1)<need)return false;
    if(String(character.map||'').indexOf('bank')===0){
      S.status=C.language==='de'?'Bank verlassen, bevor Belohnungs-Item eingetauscht wird':'Leave bank before exchanging reward item';S.mode='Merchant · Exchange';
      return moveToGoal({map:'main',x:0,y:0},C.language==='de'?'Bank für Eintausch verlassen':'Leave bank for exchange',{kind:'exchange-exit',forceAfter:9000});
    }
    S.status=(C.language==='de'?'Belohnungs-Item eintauschen: ':'Exchange reward item: ')+v273Name(row.it.name);S.mode='Merchant · Exchange';
    return action('Item eintauschen '+row.it.name,function(){return exchange(row.i);},'merchant-exchange:'+row.it.name,5000);
  };

  function v2147ExplicitItemTick(){
    if(character.ctype!=='merchant')return false;
    var items=character.items||[];
    for(var i=0;i<items.length;i++){
      var it=items[i];if(!it||it.l||it.p)continue;
      var policy=v2147ItemPolicy(it.name);
      if(policy==='bank'){
        if(!C.merchantManageBank)return false;
        if(!v2147BankReady()||!character.bank){
          S.status=(C.language==='de'?'Item-Regel: zur Bank · ':'Item rule: to bank · ')+v273Name(it.name);S.mode='Merchant · Bank';
          if(v2147BankExitActive())return true;
          return moveToGoal({map:'bank',x:0,y:0},'Item-Regel Bank '+it.name,{kind:'merchant-item-bank',forceAfter:9000});
        }
        var cap=v273BankCapacity();if(cap&&cap.free<=0){S.bankFull=true;return v273OpenBankPackTick()||true;}
        if(typeof bank_store!=='function')return false;
        return action('Item-Regel Bank '+it.name,function(){
          if(!v2147BankReady())throw Error('bank_location_changed');
          return bank_store(i);
        },'merchant-item-bank:'+it.name,1500);
      }
      if(policy==='sell'){
        if(!C.merchantSellTrashToNpc||typeof sell!=='function')return false;
        var dest=v2144SellVendor();
        if(!dest)return false;
        if(!v2145VendorReady(dest)){
          S.status=(C.language==='de'?'Item-Regel: NPC-Verkauf · ':'Item rule: NPC sale · ')+v273Name(it.name);S.mode='Merchant · NPC-Verkauf';
          return moveToGoal(dest,'Item-Regel NPC-Verkauf '+it.name,{kind:'merchant-item-npc-sell',tolerance:45,forceAfter:15000});
        }
        var q=Number(it.q)||1;
        audit('merchant_economy_decision','Explizite Item-Regel: NPC-Verkauf',{item:it.name,quantity:q,policy:'sell',npcValue:itemValueSafe(it)});
        return action('Item-Regel NPC-Verkauf '+it.name,function(){return sell(i,q);},'merchant-item-sell:'+it.name,2200);
      }
      if(policy==='exchange'){
        if(!C.merchantAutoExchange)return false;
        return v273ExchangeTick();
      }
    }
    return false;
  }

  var v2147MerchantTickBase=merchantTick;
  merchantTick=function(){
    if(character.ctype==='merchant'&&v2147ExplicitItemTick())return true;
    return v2147MerchantTickBase();
  };

  var v2147UiChangeBase=uiChange;
  uiChange=function(e){
    var el=e&&e.target;
    if(el&&el.dataset&&el.dataset.merchantItemPicker!==undefined){
      S.merchantItemRuleSelected=String(el.value||'');write('merchantItemRuleSelected:'+me,S.merchantItemRuleSelected);renderTool('merchant');return;
    }
    if(el&&el.dataset&&el.dataset.merchantItemAction!==undefined){
      var item=String(el.dataset.item||S.merchantItemRuleSelected||'');
      v2147SetItemPolicy(item,el.value);S.merchantItemRuleSelected=item;renderTool('merchant');return;
    }
    return v2147UiChangeBase(e);
  };
  var v2147UiClickBase=uiClick;
  uiClick=function(e){
    var t=e&&e.target&&e.target.closest?e.target.closest('button'):null;
    if(t&&t.dataset&&t.dataset.action==='merchant-item-rule-clear'){
      var item=String(t.dataset.item||'');v2147SetItemPolicy(item,'auto');
      renderTool('merchant');return;
    }
    return v2147UiClickBase(e);
  };

  try{S.merchantItemRuleSelected=read('merchantItemRuleSelected:'+me,S.merchantItemRuleSelected||'');}catch(e){}
  audit('feature_contract','2.14.7 Merchant-Bank-Race-Schutz + optionale Item-Einzelregeln geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C)});

'''
bot=bot.replace(marker,block+marker,1)
bot_p.write_text(bot,encoding='utf-8')

v=json.loads(ver_p.read_text(encoding='utf-8'))
v['version']='2.14.7'
v['build']='2026-09-10'
v['dashboardVersion']='2.14.5'
ver_p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

for p in (readme_p,botreadme_p):
    s=p.read_text(encoding='utf-8')
    s=s.replace('2.14.6','2.14.7',1)
    note='''
### 2.14.7 Merchant-Bank-Race + Item-Einzelregeln
- Behebt den beobachteten Bank-Race: `bank_store` läuft nur noch tatsächlich auf einer Bank-Map, im Stillstand und ohne aktiven Bank-Exit. Dadurch kann die höher priorisierte `compound-bank-exit`-Route keine nachlaufende Bankablage mehr in `main` auslösen.
- Der Merchant ruft `loot()` nicht mehr innerhalb der Bank auf; die normalen Loot-Aufrufe außerhalb der Bank bleiben unverändert.
- Das Fenster heißt auf Deutsch **„Merchant-Einstellungen“**. Ganz oben gibt es optionale Einzelregeln pro Item: **Automatisch**, **Im Inventar behalten**, **In Bank lagern**, **An NPC verkaufen** oder **Exchange-Item eintauschen**.
- Ohne gesetzte Einzelregel bleibt die bisherige Botlogik exakt der Standard. Die Einzelregeln steuern Lagerung/NPC-Verkauf/Exchange; Crafting-, Upgrade- und Compound-Planer bleiben unverändert.
- Dashboard/Worker und Brain bleiben unverändert auf dem 2.14.5-Stand.
'''
    if '2.14.7 Merchant-Bank-Race + Item-Einzelregeln' not in s:
        s += note
    p.write_text(s,encoding='utf-8')

for p in [verify_p]+test_paths:
    if not p.exists():continue
    s=p.read_text(encoding='utf-8')
    s=s.replace('2.14.6','2.14.7')
    s=s.replace('2\\.14\\.6','2\\.14\\.7')
    p.write_text(s,encoding='utf-8')

s=verify_p.read_text(encoding='utf-8')
insert=r'''
ok(bot.includes("merchantItemActions: {}"), "2.14.7 merchant item action defaults missing");
ok(bot.includes("function v2147ItemPolicy"), "2.14.7 per-item policy helper missing");
ok(bot.includes("Merchant-Einstellungen"), "2.14.7 German Merchant settings title missing");
ok(bot.includes("Automatisch (bestehende Botlogik)"), "2.14.7 automatic/default item behavior label missing");
ok(bot.includes("function v2147BankExitActive"), "2.14.7 bank-exit guard missing");
ok(bot.includes("function v2147BankReady"), "2.14.7 bank readiness guard missing");
ok(bot.includes("bank_location_changed"), "2.14.7 bank action recheck missing");
ok(bot.includes("merchant_item_rule"), "2.14.7 item rule audit missing");
ok(bot.includes("v2147ExplicitItemTick"), "2.14.7 explicit item action tick missing");
ok(bot.includes("!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)"), "2.14.7 Merchant bank loot suppression missing");
'''
needle="if (!process.exitCode) console.log("
assert needle in s
s=s.replace(needle,insert+'\n'+needle,1)
verify_p.write_text(s,encoding='utf-8')

smoke=ROOT/'scripts/smoke-2147-merchant-bank-item-rules.js'
smoke.write_text(r'''#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.7');
assert.equal(version.dashboardVersion,'2.14.5');
assert.match(bot,/var VERSION = ['"]2\.14\.7['"]/);
assert.ok(bot.includes("merchantItemActions: {}"),'item action default must be empty so legacy automation stays default');
assert.ok(bot.includes("function v2147ItemPolicy"),'per-item policy helper missing');
assert.ok(bot.includes("return V2147_ITEM_POLICIES.indexOf(p)>=0?p:'auto'"),'unknown/missing item policy must fall back to auto');
assert.ok(bot.includes("Merchant-Einstellungen"),'German Merchant window title missing');
assert.ok(bot.includes("Automatisch (bestehende Botlogik)"),'German automatic item behavior label missing');
assert.ok(bot.includes("Eine Einzelregel überschreibt nur Lagerung, NPC-Verkauf oder Exchange"),'scope disclosure missing');
assert.ok(bot.includes("function v2147BankExitActive"),'bank-exit guard missing');
assert.ok(bot.includes("function v2147BankReady"),'bank readiness guard missing');
assert.ok(bot.includes("String(character.map||'').indexOf('bank')===0&&!character.moving&&!S.moveInFlight&&!v2147BankExitActive()"),'bank readiness must require bank map, settled movement and no bank-exit');
assert.ok(bot.includes("if(!v2147BankReady())throw Error('bank_location_changed')"),'bank_store must recheck location at action execution');
assert.ok(bot.includes("v2147ItemPolicy(it.name)!=='auto'"),'automatic bank cleanup must skip explicit item rules');
assert.ok(bot.includes("policy!=='auto')return Object.assign({},base,{sell:false,protected:true"),'automatic NPC seller must skip explicit item rules');
assert.ok(bot.includes("p==='auto'||p==='exchange'"),'automatic exchange must respect explicit non-exchange rules');
assert.ok(bot.includes("function v2147ExplicitItemTick"),'explicit item behavior tick missing');
assert.ok(bot.includes("!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)"),'Merchant loot() must be suppressed while in bank');
console.log('2.14.7 Merchant bank race / item rules smoke OK');
''',encoding='utf-8')

print('2.14.7 patch prepared')
