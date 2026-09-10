from pathlib import Path
import json


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'{label} marker not found')
    return text.replace(old, new, 1)


root = Path('.')

# -----------------------------------------------------------------------------
# bot.js
# -----------------------------------------------------------------------------
p = root / 'bot.js'
s = p.read_text(encoding='utf-8')
s = replace_once(s, 'Adventure Land • AiO Bot 2.14.3', 'Adventure Land • AiO Bot 2.14.4', 'bot header version')
s = replace_once(s, "var VERSION = '2.14.3';", "var VERSION = '2.14.4';", 'bot VERSION')

# A collapsed launcher must truly shrink to its title bar. 2.14.3 hid the
# children, but the .mainbox min-height and body padding still reserved space.
old_collapse = ".mainbox.collapsed .maincontent,.mainbox.collapsed .statusline{display:none!important}.mainbox.collapsed{height:auto!important}"
new_collapse = ".mainbox.collapsed .maincontent,.mainbox.collapsed .statusline{display:none!important}.mainbox.collapsed .body{display:none!important}.mainbox.collapsed{height:auto!important;min-height:0!important}.mainbox.collapsed .head{border-bottom:0!important}"
s = replace_once(s, old_collapse, new_collapse, 'collapsed GUI CSS')

marker = "  var v2141MerchantTickBase=merchantTick;\n"
if marker not in s:
    raise RuntimeError('2.14.4 insertion marker not found')

hotfix = r'''  // ---------------------------------------------------------------------------
  // 2.14.4 deterministic Merchant economy + bank/realm/UI guards
  // ---------------------------------------------------------------------------
  function v2144InBank(){return /^bank(?:$|_)/.test(String(character.map||''));}
  function v2144PlanNeeds(item){
    if(!item||!item.name)return false;var p=S.merchantPlan||{},name=item.name,lv=Number(item.level)||0;
    if(p.farmOrder&&p.farmOrder.item===name&&(p.farmOrder.itemLevel==null||Number(p.farmOrder.itemLevel||0)===lv))return true;
    if((p.collectOrder||[]).some(function(x){return x&&x.name===name&&(x.level==null||Number(x.level||0)===lv);} ))return true;
    var recipe=p.job&&p.job.recipe;
    return !!(recipe&&Array.isArray(recipe.items)&&recipe.items.some(function(x){return x&&x.name===name&&(x.level==null||Number(x.level||0)===lv);}));
  }
  function v2144RecipeUseCount(name){
    var c=S.merchantEconomyRecipeCache||(S.merchantEconomyRecipeCache={at:0,rows:{}}),now=clock();
    if(now-Number(c.at||0)>30000){var rows={};try{var db=v273BuildKnowledgeDB(false);Object.keys(db.recipes||{}).forEach(function(id){((db.recipes[id]||{}).items||[]).forEach(function(x){if(x&&x.name)rows[x.name]=(rows[x.name]||0)+1;});});}catch(e){}c.at=now;c.rows=rows;}
    return Number(c.rows&&c.rows[name])||0;
  }
  function v2144DropEconomics(name){
    var db=v273BuildKnowledgeDB(false),rows=(db.drops&&db.drops[name])||[],chance=0,monster='',empirical=null,kills=0;
    rows.forEach(function(r){var c=Number(r&&r.chance)||0;if(c>chance){chance=c;monster=r.monster||'';}});
    Object.keys(db.empiricalDrops||{}).forEach(function(mon){((db.empiricalDrops||{})[mon]||[]).forEach(function(r){if(!r||r.item!==name||Number(r.kills||0)<20||r.rate==null)return;var rate=Number(r.rate)||0;if(empirical==null||rate>empirical){empirical=rate;kills=Number(r.kills)||0;}});});
    var effective=empirical!=null&&kills>=50?empirical:chance;
    return {known:chance>0||empirical!=null,chance:chance,monster:monster,empiricalRate:empirical,empiricalKills:kills,effective:effective,common:effective>=.03,rare:effective>0&&effective<.01};
  }
  function v2144ProjectedNpcValue(item,nextLevel){
    if(!item)return 0;try{if(typeof item_value==='function'){var clone=Object.assign({},item,{level:Math.max(0,Number(nextLevel)||0)});return Number(item_value(clone))||0;}}catch(e){}return 0;
  }
  function v2144ActionEconomics(prefix,item,copies){
    copies=Math.max(1,Number(copies)||1);var current=itemValueSafe(item)*copies,nextLevel=(Number(item&&item.level)||0)+1,projected=v2144ProjectedNpcValue(item,nextLevel),scrollName=v273ScrollName(prefix,item),scrollCost=Number(GD.items&&GD.items[scrollName]&&GD.items[scrollName].g)||0,drop=v2144DropEconomics(item&&item.name),delta=projected>0?projected-current-scrollCost:null;
    return {npcValueNow:Math.round(current),npcValueAfter:Math.round(projected),scroll:scrollName,scrollCost:Math.round(scrollCost),netNpcDelta:delta==null?null:Math.round(delta),dropChance:drop.chance,empiricalDropRate:drop.empiricalRate,dropMonster:drop.monster,dropKnown:drop.known,dropCommon:drop.common,dropRare:drop.rare};
  }
  function v2144SellDecision(item){
    if(!item||!item.name)return {sell:false,reason:'empty'};var d=GD.items&&GD.items[item.name]||{},name=item.name;
    if(item.l||item.p||item.gift||protectedStandItem(item)||/^c?scroll[0-4]$/.test(name)||isElixir(item)||name===C.hpot||name===C.mpot)return {sell:false,reason:'protected'};
    if(d.e||d.exchange||d.exchanges||d.quest||v2144PlanNeeds(item))return {sell:false,reason:'special-or-planned'};
    var utility=v273GroupUtility(item),useful=utility>=0,desired=useful?v273DesiredGroupCopies(name):0,owned=v273OwnedCount(name),recipeUses=v2144RecipeUseCount(name),drop=v2144DropEconomics(name),value=itemValueSafe(item),compoundReserve=d.compound?2:0,keep=desired+compoundReserve;
    if(recipeUses>0)keep=Math.max(keep,Math.min(12,Math.max(3,desired+6)));
    if(drop.rare)keep=Math.max(keep,desired+4);
    var surplus=owned-keep,pureTrash=!d.upgrade&&!d.compound&&recipeUses===0,abundant=owned>=Math.max(8,keep+5),bankEmergency=!!S.bankFull&&surplus>0;
    var sell=value>0&&surplus>0&&(
      (pureTrash&&(drop.common||abundant||bankEmergency))||
      (!useful&&drop.common&&recipeUses===0)||
      (bankEmergency&&!drop.rare&&recipeUses===0)
    );
    var reasonText=sell?(bankEmergency?'bank-full-safe-surplus':(pureTrash?'common-trash':'unusable-surplus')):(drop.rare?'rare-drop-reserve':(recipeUses?'recipe-reserve':(surplus<=0?'group-reserve':'strategic-item')));
    return {sell:sell,reason:reasonText,npcValue:Math.round(value),owned:owned,keep:keep,surplus:surplus,utility:Math.round(utility),recipeUses:recipeUses,dropChance:drop.chance,empiricalDropRate:drop.empiricalRate,dropKnown:drop.known,dropCommon:drop.common,dropRare:drop.rare,upgradeEconomics:d.upgrade?v2144ActionEconomics('scroll',item,1):null,compoundEconomics:d.compound?v2144ActionEconomics('cscroll',item,3):null};
  }
  function v2144FindSellCandidate(){
    var best=null;(character.items||[]).forEach(function(it,i){var d=v2144SellDecision(it);if(!d.sell)return;var q=Math.max(1,Number(it.q)||1),drop=Number(d.empiricalDropRate!=null?d.empiricalDropRate:d.dropChance)||0,score=d.npcValue*q*(1+Math.min(.5,drop*4))+Math.max(0,d.surplus)*25;if(!best||score>best.score)best={it:it,i:i,q:q,d:d,score:score};});return best;
  }
  function v2144SellVendor(){return v282VendorForScroll('scroll0')||{map:'main',x:-225,y:-125,npc:'scroll_vendor'};}

  v273SellTrashTick=function(){
    if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc||typeof sell!=='function')return false;var c=v2144FindSellCandidate();if(!c)return false;var dest=v2144SellVendor();
    if(v2144InBank()||character.map!==dest.map||dist(character,dest)>180){S.status=(C.language==='de'?'Zum NPC-Verkauf: ':'Move to NPC sale: ')+v273Name(c.it.name);S.mode='Merchant · NPC';return moveToGoal(dest,C.language==='de'?'Zum Händler für sicheren NPC-Verkauf':'Move to vendor for safe NPC sale',{kind:'merchant-npc-sell',forceAfter:9000});}
    S.status=(C.language==='de'?'Verkaufe wirtschaftlichen Überschuss: ':'Sell economic surplus: ')+v273Name(c.it.name);S.mode='Merchant · NPC';
    audit('merchant_economy_decision','NPC-Verkauf nach Wert/Drop/Reserve-Prüfung',{item:c.it.name,level:Number(c.it.level)||0,quantity:c.q,decision:c.d});
    return action('NPC-Verkauf '+c.it.name,function(){return sell(c.i,c.q);},'merchant-trash-sell:'+c.it.name,4000);
  };

  v273StoreTrashBankTick=function(){
    if(character.ctype!=='merchant'||!C.merchantManageBank||freeSlots()>C.merchantInventoryReserve)return false;
    if(v2144FindSellCandidate())return false;
    if(!character.bank){S.status='Inventar organisieren · zur Bank';S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},'Bank organisieren',{kind:'bank',forceAfter:7000});}
    var cap=v273BankCapacity();if(cap&&cap.free<=0){S.bankFull=true;return v273OpenBankPackTick();}
    var idx=(character.items||[]).findIndex(function(it){if(!it||it.l||it.p||isElixir(it)||it.name===C.hpot||it.name===C.mpot||/^c?scroll[0-4]$/.test(String(it.name||'')))return false;if(v2144SellDecision(it).sell)return false;var d=GD.items&&GD.items[it.name]||{};var required=S.merchantPlan&&S.merchantPlan.farmOrder&&S.merchantPlan.farmOrder.item===it.name;if(required||v2144PlanNeeds(it))return false;return v273GroupUtility(it)<0||(!d.upgrade&&!d.compound&&!d.e&&!d.exchange&&!d.exchanges);});
    if(idx>=0&&typeof bank_store==='function')return action('Item in Bank lagern '+character.items[idx].name,function(){return bank_store(idx);},'bank-store',1300);return false;
  };

  function v2144UpgradeCandidate(){
    var best=null;(character.items||[]).forEach(function(it,i){if(!it||it.l||it.p||!GD.items[it.name]||!GD.items[it.name].upgrade)return;var lv=Number(it.level)||0,utility=v273GroupUtility(it);if(lv>=C.merchantUpgradeMax||utility<0)return;var econ=v2144ActionEconomics('scroll',it,1),spendable=Math.max(0,Number(character.gold||0)-Number(C.merchantBankGoldReserve||0));if(econ.scrollCost>spendable)return;if(utility===0&&!(econ.netNpcDelta>0))return;var rarity=(econ.dropRare?250:0),costPenalty=econ.scrollCost/Math.max(1000,spendable||1000),score=utility+rarity-costPenalty*100;if(!best||score>best.score||score===best.score&&lv<best.lv)best={it:it,i:i,lv:lv,utility:utility,econ:econ,score:score};});return best;
  }
  v273UpgradeTick=function(){
    if(character.ctype!=='merchant'||!C.merchantAutoUpgrade||typeof upgrade!=='function')return false;var best=v2144UpgradeCandidate();if(!best)return false;
    if(v2144InBank()){S.status=(C.language==='de'?'Bank verlassen vor Upgrade: ':'Leave bank before upgrade: ')+v273Name(best.it.name);S.mode='Merchant · Upgrade';return moveToGoal({map:'main',x:0,y:0},C.language==='de'?'Bank vor Upgrade verlassen':'Leave bank before upgrade',{kind:'upgrade-bank-exit',forceAfter:9000});}
    var sc=v273EnsureScroll('scroll',best.it);if(sc<0)return true;S.status='Verbessere '+v273Name(best.it.name)+' auf +'+(best.lv+1);S.mode='Merchant · Upgrade';audit('merchant_economy_decision','Upgrade nach Nutzen/Kosten/Drop-Prüfung',{action:'upgrade',item:best.it.name,level:best.lv,utility:Math.round(best.utility),economics:best.econ});return action('Item verbessern '+best.it.name,function(){return upgrade(best.i,sc);},'merchant-upgrade',2600);
  };

  function v2144CompoundCandidate(){
    var groups={};(character.items||[]).forEach(function(it,i){if(!it||it.l||it.p||!GD.items[it.name]||!GD.items[it.name].compound)return;var utility=v273GroupUtility(it);if(utility<0)return;var desired=utility>=0?v273DesiredGroupCopies(it.name):0;if(v273OwnedCount(it.name)-desired<2)return;var lv=Number(it.level)||0;if(lv>=v273EffectiveCompoundMax(it.name))return;var key=it.name+'|'+lv;groups[key]=groups[key]||[];groups[key].push({it:it,i:i,utility:utility});});
    var best=null;Object.keys(groups).forEach(function(k){if(groups[k].length<3)return;var g=groups[k].slice(0,3),item=g[0].it,econ=v2144ActionEconomics('cscroll',item,3),utility=g[0].utility,spendable=Math.max(0,Number(character.gold||0)-Number(C.merchantBankGoldReserve||0));if(econ.scrollCost>spendable)return;if(utility===0&&!(econ.netNpcDelta>0))return;var lv=Number(item.level)||0,score=utility+(econ.dropRare?300:0)-econ.scrollCost/Math.max(1000,spendable||1000)*100;if(!best||score>best.score||score===best.score&&lv<best.lv)best={g:g,it:item,lv:lv,utility:utility,econ:econ,score:score};});return best;
  }
  v273CompoundTick=function(){
    if(character.ctype!=='merchant'||!C.merchantAutoCompound||typeof compound!=='function')return false;var best=v2144CompoundCandidate();if(!best)return false;
    if(v2144InBank()){S.status=(C.language==='de'?'Bank verlassen vor Combine: ':'Leave bank before combine: ')+v273Name(best.it.name);S.mode='Merchant · Combine';return moveToGoal({map:'main',x:0,y:0},C.language==='de'?'Bank vor Combine verlassen':'Leave bank before combine',{kind:'compound-bank-exit',forceAfter:9000});}
    var sc=v273EnsureScroll('cscroll',best.it);if(sc<0)return true;S.status='Kombiniere '+v273Name(best.it.name)+' +'+best.lv;S.mode='Merchant · Combine';audit('merchant_economy_decision','Combine nach Nutzen/Kosten/Drop-Prüfung',{action:'compound',item:best.it.name,level:best.lv,utility:Math.round(best.utility),economics:best.econ});return action('Items kombinieren '+best.it.name,function(){return compound(best.g[0].i,best.g[1].i,best.g[2].i,sc);},'merchant-compound',3200);
  };

  // Reports now carry the actual Adventure Land realm. Party repair uses a
  // majority/consensus realm so one stray character is moved instead of three.
  var v2144ReportBase=report;
  report=function(withRole){var r=v2144ReportBase(withRole),realm=currentRealm();r.realm={region:realm.region,id:realm.id,pvp:!!realm.pvp};return r;};
  function v2144RealmKey(r){return r&&r.region&&r.id?String(r.region)+'|'+String(r.id):'';}
  function v2144PartyRealmSnapshot(){
    var rows=[];C.roster.forEach(function(name){var rep=name===me?report(false):peerReport(name),realm=name===me?currentRealm():(rep&&rep.realm);if(realm&&v2144RealmKey(realm))rows.push({name:name,realm:{region:String(realm.region),id:String(realm.id),pvp:!!realm.pvp},key:v2144RealmKey(realm)});});
    if(rows.length<2)return null;var counts={};rows.forEach(function(x){counts[x.key]=(counts[x.key]||0)+1;});var leader=canonicalLeader(),leaderRow=rows.find(function(x){return x.name===leader;}),leaderKey=leaderRow&&leaderRow.key||'',keys=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]||(a===leaderKey?-1:b===leaderKey?1:a.localeCompare(b));}),targetKey=keys[0],targetRow=rows.find(function(x){return x.key===targetKey;}),mismatch=rows.filter(function(x){return x.key!==targetKey;});if(!targetRow||!mismatch.length)return null;return {known:rows.length,total:C.roster.length,target:targetRow.realm,targetKey:targetKey,mismatch:mismatch,rows:rows};
  }
  function v2144PartyRealmGuard(){
    if(!S.running||!C.autoParty)return false;var snap=v2144PartyRealmSnapshot();if(!snap){S.partyRealmMismatch=null;return false;}S.partyRealmMismatch=snap;var now=clock();
    if(now>Number(S.times.partyRealmAudit||0)){S.times.partyRealmAudit=now+15000;audit('party_realm_mismatch','Party-Charaktere laufen auf unterschiedlichen Servern',{target:snap.targetKey,known:snap.known,total:snap.total,mismatch:snap.mismatch.map(function(x){return {name:x.name,realm:x.key};})},'warning');}
    if(snap.known<Math.min(3,snap.total)){S.status=C.language==='de'?'Party wartet auf aktuelle Servermeldungen':'Party waits for current realm reports';S.mode='Party · Server';return true;}
    var current=currentRealm(),currentKey=v2144RealmKey(current);if(currentKey===snap.targetKey){S.status=(C.language==='de'?'Party-Server angleichen: ':'Align party realm: ')+snap.mismatch.map(function(x){return x.name+' '+x.key+' → '+snap.targetKey;}).join(', ');S.mode='Party · Server';return true;}
    var pvpKey=snap.targetKey;if(snap.target.pvp&&(C.autoFarmPvPConfirmed||[]).indexOf(pvpKey)<0){if(now>Number(S.times.partyRealmPvpWarn||0)){S.times.partyRealmPvpWarn=now+60000;audit('party_realm_switch_blocked','Automatische Party-Serverangleichung zu PvP ohne Bestätigung blockiert',{target:pvpKey},'warning');}S.status='Party-Serverwechsel zu PvP nicht bestätigt';S.mode='Party · Server';return true;}
    if(typeof change_server!=='function'){S.status='Party-Server unterschiedlich · change_server nicht verfügbar';S.mode='Party · Server';return true;}
    if(now<Number(S.partyRealmSwitchUntil||0))return true;S.partyRealmSwitchUntil=now+30000;S.status=(C.language==='de'?'Wechsle für Party auf ':'Switching for party to ')+snap.targetKey;S.mode='Party · Server';audit('party_realm_switch','Charakter auf Mehrheitsserver der Bot-Gruppe verschieben',{from:currentKey,to:snap.targetKey,mismatch:snap.mismatch.map(function(x){return x.name;})},'warning');try{change_server(snap.target.region,snap.target.id);}catch(e){audit('party_realm_switch_error','Party-Serverwechsel fehlgeschlagen',{error:reason(e),target:snap.targetKey},'error');}return true;
  }
  var v2144PartyReconcileBase=partyReconcileTick;
  partyReconcileTick=function(){if(v2144PartyRealmGuard())return true;return v2144PartyReconcileBase();};

  audit('feature_contract','2.14.4 Merchant-Ökonomie + Bank-Guard + Party-Realm-Repair + GUI-Collapse geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C)});

'''
s = s.replace(marker, hotfix + marker, 1)
s = replace_once(
    s,
    "audit('feature_contract','2.14.3 Scroll-/Bank-Loop-Schutz + Brain-v2 + Research Bridge Kernfunktionen geprüft'",
    "audit('feature_contract','2.14.4 Scroll-/Bank-Loop-Schutz + Brain-v2 + Research Bridge Kernfunktionen geprüft'",
    'feature contract release label'
)
p.write_text(s, encoding='utf-8')

# -----------------------------------------------------------------------------
# version.json -- dashboard deliberately remains 2.14.0
# -----------------------------------------------------------------------------
p = root / 'version.json'
v = json.loads(p.read_text(encoding='utf-8'))
if v.get('version') != '2.14.3':
    raise RuntimeError(f"version.json expected 2.14.3, got {v.get('version')}")
v['version'] = '2.14.4'
v['build'] = '2026-09-10'
if v.get('dashboardVersion') != '2.14.0':
    raise RuntimeError('dashboardVersion must remain 2.14.0')
p.write_text(json.dumps(v, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# -----------------------------------------------------------------------------
# README.md
# -----------------------------------------------------------------------------
p = root / 'README.md'
r = p.read_text(encoding='utf-8')
r = replace_once(r, '# Adventure Land – AiO Bot 2.14.3', '# Adventure Land – AiO Bot 2.14.4', 'README title')
r = replace_once(r, '> Aktueller Stand: **2.14.3** · Build **2026-09-10**', '> Aktueller Stand: **2.14.4** · Build **2026-09-10**', 'README current version')
anchor = '> **2.14.3 Merchant-Scroll-Hotfix:** Upgrade- und Compound-Scrolls werden von der Inventar-/Bankbereinigung geschützt. Damit kann ein gerade gekaufter `cscroll` nicht mehr sofort eingelagert und erneut gekauft werden. Scroll-Käufe starten außerdem erst in konservativer Händlernähe, um `distance`-Fehler während laufender Bewegung zu vermeiden.\n'
extra = '\n> **2.14.4 Merchant-Ökonomie/Party/UI-Hotfix:** Der Merchant verkauft sicheren normalen Überschuss jetzt auch ohne volle Bank und bewertet dafür NPC-Wert, Drop-Häufigkeit, Gruppenreserve, Rezeptbedarf sowie Upgrade-/Compound-Scrollkosten. Upgrade und Compound verlassen die Bank deterministisch vor der Aktion. Peer-Reports enthalten den Server-Realm; bei EU1/EU2-Mismatch wird die Party nicht mehr mit ungültigen Einladungen gespammt, sondern auf den Mehrheitsserver der eigenen Bot-Gruppe angeglichen (PvP nur nach vorhandener Bestätigung). Die eingeklappte Bot-GUI zeigt nur noch die Titelleiste. Brain/Teacher und Cloudflare-Dashboard bleiben unverändert.\n'
r = replace_once(r, anchor, anchor + extra, 'README 2.14.3 note')
p.write_text(r, encoding='utf-8')

# -----------------------------------------------------------------------------
# BOT_README.md
# -----------------------------------------------------------------------------
p = root / 'BOT_README.md'
b = p.read_text(encoding='utf-8')
b = replace_once(b, '# Adventure Land – AiO Bot 2.14.3 · technische Notizen', '# Adventure Land – AiO Bot 2.14.4 · technische Notizen', 'BOT_README title')
marker_doc = '## 2.14.3 Scroll-/Bank-Loop-Hotfix\n'
insert_doc = '''## 2.14.4 Merchant-Ökonomie, Party-Realm und GUI-Collapse\n\n- NPC-Verkauf ist nicht mehr an `S.bankFull` gekoppelt. Vor einem Verkauf werden Schutzstatus, Gruppenreserve, aktueller Merchant-Plan, Rezeptnutzung, theoretische/empirische Drop-Häufigkeit und NPC-Wert geprüft. Upgrade-/Compound-Kandidaten protokollieren zusätzlich Scrollkosten und den über `item_value()` projizierten NPC-Wert der nächsten Stufe. Profit-only-Upgrades werden ohne echten Gruppennutzen nicht erzwungen.\n- Wirtschaftlich sicher verkäuflicher Überschuss wird nicht zuerst in die Bank verschoben; bei Bedarf fährt der Merchant kontrolliert zum NPC-Händler. Seltene Drops, aktuelle Craft-/Quest-/Exchange-Bedarfe, Scrolls, geschützte Items und benötigte Gruppenexemplare bleiben erhalten.\n- Upgrade und Compound besitzen einen harten Bank-Location-Guard. In `bank*` wird zuerst nach `main` gewechselt; erst danach darf `upgrade()` bzw. `compound()` aufgerufen werden.\n- Bot-Peer-Reports enthalten `realm.region`, `realm.id` und `realm.pvp`. Bei unterschiedlichen Servern unterdrückt die Party-Reparatur Einladungen und wählt den Mehrheitsserver der eigenen Bot-Gruppe; dadurch wechselt bei drei Farmern auf EU1 und einem Merchant auf EU2 nur der Merchant. Ein automatischer Wechsel zu PvP bleibt ohne bestehende PvP-Bestätigung blockiert.\n- Beim Einklappen der Haupt-GUI wird auch `.body` ausgeblendet und `min-height` aufgehoben. Sichtbar bleibt nur die Titelleiste.\n- Keine Änderung an Brain-Gewichten, Teacher-Strategie, D1-Schema oder Cloudflare-Worker/Dashboard (weiter 2.14.0).\n\n'''
b = replace_once(b, marker_doc, insert_doc + marker_doc, 'BOT_README 2.14.3 section')
p.write_text(b, encoding='utf-8')

# -----------------------------------------------------------------------------
# Existing release verification
# -----------------------------------------------------------------------------
p = root / 'scripts' / 'verify-release.js'
t = p.read_text(encoding='utf-8')
t = replace_once(t, 'ok(version.version === "2.14.3", "prepared release must be 2.14.3");', 'ok(version.version === "2.14.4", "prepared release must be 2.14.4");', 'verify release version')
needle = "ok(bot.includes(\"dist(character,dest)>180\"), \"2.14.3 scroll vendor proximity guard missing\");\n"
checks = '''ok(bot.includes("function v2144SellDecision"), "2.14.4 Merchant economic sell decision missing");
ok(bot.includes("merchant_economy_decision"), "2.14.4 Merchant economic audit missing");
ok(bot.includes("function v2144InBank"), "2.14.4 bank location guard missing");
ok(bot.includes("upgrade-bank-exit") && bot.includes("compound-bank-exit"), "2.14.4 upgrade/compound bank exits missing");
ok(bot.includes("r.realm={region:realm.region,id:realm.id,pvp:!!realm.pvp}"), "2.14.4 peer realm report missing");
ok(bot.includes("party_realm_mismatch") && bot.includes("party_realm_switch"), "2.14.4 party realm repair missing");
ok(bot.includes(".mainbox.collapsed .body{display:none!important}") && bot.includes("min-height:0!important"), "2.14.4 collapsed GUI must show title only");
'''
t = replace_once(t, needle, needle + checks, 'verify 2.14.4 checks')
p.write_text(t, encoding='utf-8')

# -----------------------------------------------------------------------------
# Existing Merchant smoke test
# -----------------------------------------------------------------------------
p = root / 'scripts' / 'smoke-merchant-stability.js'
m = p.read_text(encoding='utf-8')
m = replace_once(m, "assert.match(bot,/var VERSION = ['\"]2\\.14\\.3['\"]/);", "assert.match(bot,/var VERSION = ['\"]2\\.14\\.4['\"]/);", 'merchant smoke version')
needle = "assert.ok(bot.includes('dist(character,dest)>180'),'scroll buys must wait for conservative vendor range');\n"
checks = '''assert.ok(bot.includes('function v2144SellDecision'),'economic sell policy missing');
assert.ok(!bot.includes("if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc||!S.bankFull||typeof sell!=='function')"),'NPC selling must not require a full bank');
assert.ok(bot.includes("upgrade-bank-exit")&&bot.includes("compound-bank-exit"),'bank guards for upgrade/compound missing');
assert.ok(bot.includes("party_realm_mismatch")&&bot.includes("v2144PartyRealmGuard"),'party realm mismatch guard missing');
assert.ok(bot.includes(".mainbox.collapsed .body{display:none!important}")&&bot.includes("min-height:0!important"),'collapsed GUI body/min-height fix missing');
'''
m = replace_once(m, needle, needle + checks, 'merchant smoke 2.14.4 checks')
p.write_text(m, encoding='utf-8')

# Dedicated behavioral regression checks for the new deterministic policies.
p = root / 'scripts' / 'smoke-2144-merchant-party-ui.js'
p.write_text(r'''#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
assert.match(bot,/var VERSION = ['"]2\.14\.4['"]/);
assert.ok(bot.includes('netNpcDelta'),'upgrade/compound economics must compare projected NPC value with input + scroll cost');
assert.ok(bot.includes('empiricalDropRate'),'Merchant economy must consider learned drop frequency');
assert.ok(bot.includes('recipeUses'),'Merchant economy must reserve crafting inputs');
assert.ok(bot.includes("drop.rare")&&bot.includes('rare-drop-reserve'),'rare drops must receive an explicit reserve');
assert.ok(bot.includes("v2144FindSellCandidate())return false"),'safe sell candidates must not be banked first under inventory pressure');
assert.ok(bot.includes("if(v2144InBank())")&&bot.includes("upgrade-bank-exit")&&bot.includes("compound-bank-exit"),'upgrade/compound must leave the bank first');
assert.ok(bot.includes("r.realm={region:realm.region,id:realm.id,pvp:!!realm.pvp}"),'peer reports must publish realm');
assert.ok(bot.includes("counts[x.key]=(counts[x.key]||0)+1"),'party realm repair must use group consensus counts');
assert.ok(bot.includes("snap.known<Math.min(3,snap.total)"),'realm switching must wait for enough fresh peer reports');
assert.ok(bot.includes("autoFarmPvPConfirmed")&&bot.includes("party_realm_switch_blocked"),'automatic party alignment must not enter unconfirmed PvP');
assert.ok(bot.includes(".mainbox.collapsed .body{display:none!important}"),'collapsed GUI must hide the whole body');
assert.ok(bot.includes(".mainbox.collapsed{height:auto!important;min-height:0!important}"),'collapsed GUI must remove its minimum height');
function consensus(rows,leader){const counts={};for(const r of rows)counts[r.key]=(counts[r.key]||0)+1;const lk=(rows.find(r=>r.name===leader)||{}).key||'';return Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||(a===lk?-1:b===lk?1:a.localeCompare(b)))[0];}
assert.equal(consensus([{name:'Farmer1',key:'EU|I'},{name:'Farmer2',key:'EU|I'},{name:'Farmer3',key:'EU|I'},{name:'Merchant',key:'EU|II'}],'Merchant'),'EU|I','3-vs-1 split must choose the farmers majority realm');
assert.equal(consensus([{name:'Farmer1',key:'EU|I'},{name:'Farmer2',key:'EU|I'},{name:'Farmer3',key:'EU|II'},{name:'Merchant',key:'EU|II'}],'Merchant'),'EU|II','2-vs-2 tie must prefer canonical leader realm');
console.log('2.14.4 Merchant economy / party realm / GUI smoke OK');
''', encoding='utf-8')

print('2.14.4 merchant economy / party realm / GUI hotfix prepared')
