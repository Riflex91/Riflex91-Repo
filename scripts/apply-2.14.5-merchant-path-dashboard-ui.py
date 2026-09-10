from pathlib import Path
import json
import re

ROOT = Path(".")

def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")

def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f"{label}: marker not found")
    return text.replace(old, new, 1)

bot_path = "bot.js"
s = read(bot_path)
s = replace_once(s, "Adventure Land • AiO Bot 2.14.4", "Adventure Land • AiO Bot 2.14.5", "bot header")
s = replace_once(s, "var VERSION = '2.14.4';", "var VERSION = '2.14.5';", "bot version")

insert_marker = "  // Preserve references so dispose can distinguish our CM handler on engines that support function identity.\n"
block = r'''
  // ---------------------------------------------------------------------------
  // 2.14.5 Merchant reliability: route arbitration, settled vendor actions,
  // fair economic selling and UI visibility/vitals.
  // ---------------------------------------------------------------------------
  function v2145MovePriority(kind){
    kind=String(kind||'').toLowerCase();
    if(/scroll|vendor|npc|sell|upgrade-bank-exit|compound-bank-exit/.test(kind))return 100;
    if(/bank/.test(kind))return 90;
    if(/merchant-service|service|collect|loot/.test(kind))return 80;
    if(/supply|deliver|distribution/.test(kind))return 70;
    if(/follow|farm/.test(kind))return 40;
    if(/explore/.test(kind))return 10;
    return 50;
  }
  function v2145MoveLockActive(lock){
    if(!lock)return false;
    var now=clock(),p=lock.target||{},sameMap=!p.map||p.map===character.map,near=sameMap&&isFinite(Number(p.x))&&isFinite(Number(p.y))&&dist(character,p)<=Number(lock.tolerance||85);
    if(near&&!character.moving&&!S.moveInFlight)return false;
    if(now-Number(lock.at||0)>45000&&!S.moveInFlight&&!character.moving)return false;
    return !!(S.moveInFlight||character.moving||now-Number(lock.at||0)<2500);
  }
  var v2145MoveBase=moveToGoal;
  moveToGoal=function(g,why,opts){
    opts=opts||{};if(!g)return false;
    var kind=opts.kind||String(why||'move'),priority=v2145MovePriority(kind),now=clock(),target={map:g.map||character.map,x:Math.round(Number(g.x)||0),y:Math.round(Number(g.y)||0)},lock=S.moveArbiter2145;
    if(lock&&!v2145MoveLockActive(lock)){S.moveArbiter2145=null;lock=null;}
    if(lock&&v2145MoveLockActive(lock)){
      var same=lock.target&&lock.target.map===target.map&&Math.hypot(Number(lock.target.x||0)-target.x,Number(lock.target.y||0)-target.y)<=Number(opts.tolerance||90);
      if(!same&&priority<Number(lock.priority||0)){
        if(clock()>Number(S.times.moveDeferred2145||0)){
          S.times.moveDeferred2145=clock()+5000;
          audit('move_deferred','Niedriger priorisierte Route wartet auf laufenden Merchant-Weg',{activeKind:lock.kind,activePriority:lock.priority,requestedKind:kind,requestedPriority:priority,target:target},'info');
        }
        return true;
      }
    }
    S.moveArbiter2145={kind:kind,priority:priority,target:target,tolerance:Number(opts.tolerance)||85,at:now};
    S.moveKind=kind;
    return v2145MoveBase(g,why,opts);
  };

  var v2145ExploreBase=v290ExploreTick;
  v290ExploreTick=function(){
    if(character.ctype!=='merchant'||!C.merchantExploreWhenIdle)return false;
    var lock=S.moveArbiter2145,mode=String(S.mode||'');
    if(S.merchantServiceTarget)return false;
    if(lock&&v2145MoveLockActive(lock)&&v2145MovePriority(lock.kind)>v2145MovePriority('explore'))return false;
    if(/Merchant · (Bank|Einkauf|NPC|Combine|Upgrade|Craft|Exchange|Versorgung|Service|Inventar)/.test(mode))return false;
    if(clock()-Math.max(Number(S.lastActionAt||0),Number(S.moveRequestedAt||0))<4500)return false;
    return v2145ExploreBase();
  };

  function v2145VendorReady(dest){
    return !!(dest&&dest.map===character.map&&!character.moving&&!S.moveInFlight&&dist(character,dest)<=75);
  }
  v273EnsureScroll=function(prefix,item){
    var name=v273ScrollName(prefix,item),idx=slot(name);if(idx>=0)return idx;
    if(freeSlots()<1){S.times['buy-scroll:'+name]=clock()+15000;S.status='Kein Platz für Scroll · Inventar zuerst bereinigen';S.mode='Merchant · Inventar';return -1;}
    if(!(typeof buy==='function'&&GD.items&&GD.items[name]))return -1;
    var price=Number(GD.items[name].g||0);if(character.gold-price<=C.merchantBankGoldReserve)return -1;
    var dest=v282VendorForScroll(name);
    if(dest&&!v2145VendorReady(dest)){
      S.status='Zum Scroll-Händler für '+name;S.mode='Merchant · Einkauf';
      moveToGoal(dest,'Scroll-Händler '+name,{kind:'merchant-scroll-vendor',tolerance:45,forceAfter:15000});
      return -1;
    }
    action('Scroll kaufen '+name,function(){return buy(name,1);},'buy-scroll:'+name,2200);
    return -1;
  };

  var v2145SellDecisionBase=v2144SellDecision;
  function v2145SellDecision(it){
    var base=v2145SellDecisionBase(it),d=it&&GD.items&&GD.items[it.name]||{};
    if(!it||!it.name||base.protected)return base;
    if(base.sell)return base;
    var level=Number(it.level)||0,owned=v273OwnedCount(it.name),keep=Number(base.keep||v273DesiredGroupCopies(it.name)||1),surplus=Math.max(0,owned-keep);
    var db=v273BuildKnowledgeDB(false),recipeUses=v2144RecipeUseCount(it.name,db),drop=v2144DropEconomics(it.name),value=v2144NpcValue(it);
    var maxedUpgrade=!!d.upgrade&&!d.compound&&level>=Number(C.merchantUpgradeMax||4);
    var safeRarity=!drop.rare&&(drop.bestChance==null||drop.bestChance>=0.005||drop.learnedRate>=0.003||owned>=keep+3);
    if(maxedUpgrade&&surplus>0&&recipeUses===0&&value>0&&safeRarity){
      return Object.assign({},base,{sell:true,reason:'maxed-upgrade-surplus',owned:owned,keep:keep,surplus:surplus,npcValue:value,drop:drop,recipeUses:recipeUses,level:level});
    }
    var pureTrash=!d.upgrade&&!d.compound&&recipeUses===0&&Number(base.utility)<0&&surplus>0;
    if(pureTrash&&value>0&&(safeRarity||owned>=keep+2)){
      return Object.assign({},base,{sell:true,reason:'safe-trash-surplus',owned:owned,keep:keep,surplus:surplus,npcValue:value,drop:drop,recipeUses:recipeUses,level:level});
    }
    return base;
  }
  v2144SellDecision=v2145SellDecision;
  v2144FindSellCandidate=function(){
    var best=null;
    (character.items||[]).forEach(function(it,i){
      if(!it)return;
      var dec=v2145SellDecision(it);if(!dec.sell)return;
      var q=Number(it.q)||1,surplus=Math.max(1,Number(dec.surplus)||1),sellQty=Math.max(1,Math.min(q,surplus));
      var score=(dec.reason==='maxed-upgrade-surplus'?1000000:0)+(dec.reason==='safe-trash-surplus'?600000:0)+Number(dec.npcValue||0)+Math.min(100000,Number(dec.owned||0)*50);
      if(!best||score>best.score)best={index:i,item:it,decision:dec,qty:sellQty,score:score};
    });
    return best;
  };

  v273SellTrashTick=function(){
    if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc||typeof sell!=='function')return false;
    var cand=v2144FindSellCandidate();
    if(!cand){
      if(clock()>Number(S.times.sellNoCandidate2145||0)){
        S.times.sellNoCandidate2145=clock()+30000;
        audit('merchant_sell_scan','Kein sicherer NPC-Verkaufskandidat',{free:freeSlots(),reserve:C.merchantInventoryReserve,inventory:(character.items||[]).filter(Boolean).length},'info');
      }
      return false;
    }
    var dest=v2144SellVendor();
    v2144AuditEconomy('sell',cand.item,cand.decision,{quantity:cand.qty});
    if(dest&&!v2145VendorReady(dest)){
      S.status='Zum NPC für Verkauf: '+v273Name(cand.item.name);S.mode='Merchant · NPC-Verkauf';
      return moveToGoal(dest,'NPC-Verkauf '+cand.item.name,{kind:'merchant-npc-sell',tolerance:45,forceAfter:15000});
    }
    S.status='NPC-Verkauf: '+v273Name(cand.item.name)+' ×'+cand.qty;S.mode='Merchant · NPC-Verkauf';
    return action('NPC-Verkauf '+cand.item.name,function(){return sell(cand.index,cand.qty);},'merchant-trash-sell:'+cand.item.name,2200);
  };

  function v2145EconomyMaintenanceTick(){
    if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc)return false;
    var cand=v2144FindSellCandidate();if(!cand)return false;
    var pressured=freeSlots()<=Math.max(2,Number(C.merchantInventoryReserve||5)+1);
    var urgent=false;try{urgent=(v277MerchantServiceCandidates()||[]).some(function(x){return x&&x.urgent;});}catch(e){}
    if(!pressured&&urgent)return false;
    if(!pressured&&clock()<Number(S.times.economy2145||0))return false;
    S.times.economy2145=clock()+10000;
    return v273SellTrashTick();
  }
  var v2145MerchantTickBase=merchantTick;
  merchantTick=function(){
    if(character.ctype==='merchant'&&v2145EconomyMaintenanceTick())return true;
    return v2145MerchantTickBase();
  };

  var v2145LayoutMainBase=layoutMain;
  layoutMain=function(){
    v2145LayoutMainBase();
    if(!S.mainBox)return;
    var vh=P.innerHeight||900;
    S.mainBox.style.maxHeight=Math.max(260,vh-16)+'px';
  };

  partyHTML=function(){
    var ps=partyState(),rows=peers(true),gs=v280GroupStrengthSnapshot();
    function rr(n){if(n===me)return report();return rows.find(function(x){return x.name===n;})||peerReport(n);}
    function vital(label,cur,max,type){
      cur=Number(cur)||0;max=Math.max(1,Number(max)||1);var pc=Math.round(clamp(cur/max*100,0,100));
      return '<div class="party-vital"><div class="line"><span>'+label+'</span><strong>'+Math.round(cur)+' / '+Math.round(max)+' · '+pc+'%</strong></div><div class="partybar '+type+'"><i style="width:'+pc+'%"></i></div></div>';
    }
    return '<h2>'+esc(T('party'))+'</h2><div class="card"><div class="line"><span>'+esc(v281L('groupStrength'))+'</span><strong>'+v280FmtCompact(gs.score)+'</strong></div><div class="line"><span>'+esc(v281L('groupDps'))+'</span><strong>'+v280FmtCompact(gs.totalDps)+'</strong></div></div>'+
      C.roster.map(function(n){var r=rr(n),role=roleForName(n),ic=v280RoleIcon(role);if(!r)return '<div class="card"><div class="line"><strong>'+ic+' '+esc(n)+'</strong><span class="tag">'+esc(roleLabel(role))+'</span></div><div class="muted">'+esc(v281L('noReport'))+'</div></div>';return '<div class="card party-live-card"><div class="line"><strong>'+ic+' '+esc(n)+'</strong><span class="tag">'+esc(roleLabel(role))+'</span></div><div class="muted">Lv. '+r.level+' · '+esc(r.map||'—')+' · '+v280FmtCompact(r.xpPerHour||0)+' EXP/h</div>'+vital('HP',r.hp,r.max_hp,'hp')+vital('MP',r.mp,r.max_mp,'mp')+'</div>';}).join('')+
      '<div class="notice '+(ps.complete?'':'bad')+'">'+(ps.complete?esc(v281L('complete')):esc(v281L('missing'))+': '+esc((ps.missing||[]).join(', ')))+'</div>';
  };

  CSS+=' .mainbox .maincontent{overflow-y:auto;overflow-x:hidden;max-height:calc(100vh - 118px);overscroll-behavior:contain;padding-bottom:8px}.mainbox .launcher{padding-bottom:8px}.party-live-card{overflow:hidden}.party-vital{margin-top:8px}.party-vital .line{font-size:9px;margin-bottom:4px}.partybar{height:9px;border-radius:999px;background:var(--surface);overflow:hidden;position:relative}.partybar i{height:100%;display:block;position:relative;transition:width .45s ease;border-radius:inherit}.partybar.hp i{background:#e5484d}.partybar.mp i{background:#3b82f6}.partybar i:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.32),transparent);transform:translateX(-100%);animation:v2145VitalFlow 1.6s linear infinite}@keyframes v2145VitalFlow{to{transform:translateX(100%)}}@media(prefers-reduced-motion:reduce){.partybar i,.partybar i:after{animation:none!important;transition:none!important}} ';
  audit('feature_contract','2.14.5 Merchant-Routenpriorität + Vendor-Settling + Verkaufsfairness + Dashboard/GUI geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C)});
'''
s = replace_once(s, insert_marker, block + "\n" + insert_marker, "2.14.5 insertion marker")
write(bot_path, s)

dash_path = "cloudflare-dashboard/dashboard.html"
d = read(dash_path)
d = d.replace("AiO Bot Dashboard 2.14.0", "AiO Bot Dashboard 2.14.5")

css_extra = r'''
.dash-section{margin:0 0 14px;background:#0c1d29;border:1px solid #29485e;border-radius:15px;overflow:hidden;box-shadow:0 12px 32px #0003}.dash-section>summary{display:flex;align-items:center;gap:9px;cursor:pointer;list-style:none;padding:13px 15px;background:#102331;font-size:16px;font-weight:900;user-select:none}.dash-section>summary::-webkit-details-marker{display:none}.dash-section>summary:after{content:"⌄";margin-left:auto;color:#63e1bd;font-size:18px;transition:transform .18s ease}.dash-section:not([open])>summary:after{transform:rotate(-90deg)}.section-body{padding:14px}.section-body.flush{padding:0}.dash-section .braincard,.dash-section .mapcard{margin:0;border:0;border-radius:0;box-shadow:none}.dash-section .braincard{background:transparent}.mini-live-map{position:relative;height:150px;margin:12px 0;border:1px solid #29485e;border-radius:11px;overflow:hidden;background:radial-gradient(circle at 50% 50%,#173a3f,#07141d 72%)}.mini-live-map svg{width:100%;height:100%;display:block}.mini-live-map .mini-label{position:absolute;left:8px;top:7px;z-index:2;padding:4px 7px;border-radius:7px;background:#07131dcc;border:1px solid #34566c;font-size:10px;color:#d8edf6}.mini-grid{stroke:#c7ffff18;stroke-width:1;vector-effect:non-scaling-stroke}.mini-spawn{fill:#55c89112;stroke:#55c89138;stroke-width:1.5;vector-effect:non-scaling-stroke}.mini-peer{fill:#7e9aab;stroke:#07131d;stroke-width:4;vector-effect:non-scaling-stroke}.mini-self{fill:#63e1bd;stroke:#07131d;stroke-width:5;vector-effect:non-scaling-stroke}.mini-self.merchant{fill:#ffc85a}.mini-pulse{fill:none;stroke:#63e1bd;stroke-width:5;vector-effect:non-scaling-stroke;animation:miniPulse2145 1.7s ease-out infinite;transform-box:fill-box;transform-origin:center}.mini-pulse.merchant{stroke:#ffc85a}@keyframes miniPulse2145{0%{opacity:.9;transform:scale(.45)}75%,100%{opacity:0;transform:scale(2.5)}}@media(prefers-reduced-motion:reduce){.dash-section>summary:after,.mini-pulse{transition:none!important;animation:none!important}}'''
d = replace_once(d, "</style>", css_extra + "\n</style>", "dashboard CSS")

old_app = '''<section id="app" hidden>
<div id="group" class="group"></div>
<section id="brainPanel" class="braincard"><div class="braintop"><h2>🧠 Gehirn</h2><span id="brainState" class="pill">lädt …</span></div><div id="brainContent" class="empty">Noch keine Brain-Daten.</div></section>
<section id="researchPanel" class="braincard researchcard"><div class="researchhead"><h2>🔬 AiO Research Bridge</h2><span id="researchState" class="pill">wartet auf Brain-Sync</span></div><p class="muted">Erzeugt aus vorhandenen D1-Lern-, Outcome- und Brain-Daten einen kompakten Prompt für eine übergeordnete ChatGPT-Analyse. Keine zusätzlichen Workers-AI-Neurons.</p><div class="bridgeflow"><b>Bot-Erfahrung</b><i>→</i><b>Relevanzfilter</b><i>→</i><b>Secret-Redaction</b><i>→</i><b>Analysebrief + JSON</b></div><div class="researchcontrols"><label>Analyseprofil<select id="researchProfile"><option value="development">Entwicklungsbrief</option><option value="overall">Gesamtanalyse</option><option value="errors">Fehleranalyse</option><option value="learning">Lernanalyse</option><option value="farm">Farmanalyse</option><option value="merchant">Merchant-Analyse</option></select></label><label>Zeitraum (Stunden)<input id="researchHours" type="number" min="1" max="168" value="24"></label><label class="researchtoggle"><input id="researchAnon" type="checkbox" checked> Charakternamen anonymisieren</label></div><div class="researchactions"><button class="btn alt" id="researchGenerate">Brief anzeigen</button><button class="btn" id="researchCopy">Prompt kopieren</button></div><div id="researchMeta" class="researchmeta">Der Web-Brief nutzt die sicher synchronisierten Daten. Lokale Roh-Auditlogs bleiben im Spielclient.</div><textarea id="researchPrompt" class="researchprompt" readonly hidden aria-label="AiO Research Prompt"></textarea></section>
<section class="mapcard"><div class="maptop"><strong>Live-Positionskarte</strong><select id="mapSelect"></select><button class="btn alt" id="zoomIn" title="Hineinzoomen">＋</button><button class="btn alt" id="zoomOut" title="Herauszoomen">−</button><button class="btn alt" id="fitMap">Einpassen</button></div><div class="mapwrap"><svg id="map" aria-label="Live Positionskarte"></svg><div class="maphint">Mausrad = Zoom · Ziehen = Verschieben · Hintergrund zeigt Live-Kartendaten wie Spawns, NPCs und Übergänge.</div></div></section>
<div id="cards" class="grid"></div>
<div class="footer">Live-Daten werden alle 3 Sekunden aktualisiert. Die Gehirn-Übersicht zeigt Teacher/Student, Brain League, Lernqualität und Tagebuch. Die Research Bridge erzeugt daraus sichere Analysebriefe für ChatGPT, ohne zusätzliche Workers-AI-Aufrufe.</div>
</section>'''

new_app = '''<section id="app" hidden>
<details class="dash-section" data-section="characters" open><summary>👥 Charaktere</summary><div class="section-body"><div id="cards" class="grid"></div></div></details>
<details class="dash-section" data-section="map" open><summary>🗺 Live-Positionskarte</summary><div class="section-body flush"><section class="mapcard"><div class="maptop"><strong>Gruppenkarte</strong><select id="mapSelect"></select><button class="btn alt" id="zoomIn" title="Hineinzoomen">＋</button><button class="btn alt" id="zoomOut" title="Herauszoomen">−</button><button class="btn alt" id="fitMap">Einpassen</button></div><div class="mapwrap"><svg id="map" aria-label="Live Positionskarte"></svg><div class="maphint">Mausrad = Zoom · Ziehen = Verschieben · Live-Positionen werden automatisch aktualisiert.</div></div></section></div></details>
<details class="dash-section" data-section="brain" open><summary>🧠 Gehirn</summary><div class="section-body"><section id="brainPanel" class="braincard"><div class="braintop"><h2>Brain-Status</h2><span id="brainState" class="pill">lädt …</span></div><div id="brainContent" class="empty">Noch keine Brain-Daten.</div></section></div></details>
<details class="dash-section" data-section="research" open><summary>🔬 AiO Research Bridge</summary><div class="section-body"><section id="researchPanel" class="braincard researchcard"><div class="researchhead"><h2>Analyse</h2><span id="researchState" class="pill">wartet auf Brain-Sync</span></div><p class="muted">Erzeugt aus vorhandenen D1-Lern-, Outcome- und Brain-Daten einen kompakten Prompt für eine übergeordnete ChatGPT-Analyse. Keine zusätzlichen Workers-AI-Neurons.</p><div class="bridgeflow"><b>Bot-Erfahrung</b><i>→</i><b>Relevanzfilter</b><i>→</i><b>Secret-Redaction</b><i>→</i><b>Analysebrief + JSON</b></div><div class="researchcontrols"><label>Analyseprofil<select id="researchProfile"><option value="development">Entwicklungsbrief</option><option value="overall">Gesamtanalyse</option><option value="errors">Fehleranalyse</option><option value="learning">Lernanalyse</option><option value="farm">Farmanalyse</option><option value="merchant">Merchant-Analyse</option></select></label><label>Zeitraum (Stunden)<input id="researchHours" type="number" min="1" max="168" value="24"></label><label class="researchtoggle"><input id="researchAnon" type="checkbox" checked> Charakternamen anonymisieren</label></div><div class="researchactions"><button class="btn alt" id="researchGenerate">Brief anzeigen</button><button class="btn" id="researchCopy">Prompt kopieren</button></div><div id="researchMeta" class="researchmeta">Der Web-Brief nutzt die sicher synchronisierten Daten. Lokale Roh-Auditlogs bleiben im Spielclient.</div><textarea id="researchPrompt" class="researchprompt" readonly hidden aria-label="AiO Research Prompt"></textarea></section></div></details>
<details class="dash-section" data-section="group" open><summary>🛡 Gruppeninformationen</summary><div class="section-body"><div id="group" class="group"></div></div></details>
<div class="footer">Live-Daten werden alle 3 Sekunden aktualisiert. Alle Bereiche können ein- und ausgeklappt werden.</div>
</section>'''
d = replace_once(d, old_app, new_app, "dashboard section order")

m = re.search(r"function renderCards\(\)\{.*?\}\nfunction renderBrain", d, re.S)
if not m:
    raise RuntimeError("renderCards block not found")
new_render_cards = r'''function miniMapMarkup(c){
  const x=Number(c.x)||0,y=Number(c.y)||0,raw=c.mapBounds||{},valid=[raw.minX,raw.minY,raw.maxX,raw.maxY].every(Number.isFinite);
  const bounds=valid?raw:{minX:x-700,minY:y-450,maxX:x+700,maxY:y+450},bw=Math.max(500,bounds.maxX-bounds.minX),bh=Math.max(350,bounds.maxY-bounds.minY);
  const w=Math.min(bw,Math.max(750,bw*.42)),h=Math.min(bh,Math.max(480,bh*.42)),vx=Math.max(bounds.minX,Math.min(x-w/2,bounds.maxX-w)),vy=Math.max(bounds.minY,Math.min(y-h/2,bounds.maxY-h));
  let art=`<rect x="${vx}" y="${vy}" width="${w}" height="${h}" fill="#0b2730"/>`;
  const step=Math.max(120,Math.round(w/6));for(let gx=Math.floor(vx/step)*step;gx<=vx+w;gx+=step)art+=`<line class="mini-grid" x1="${gx}" y1="${vy}" x2="${gx}" y2="${vy+h}"/>`;for(let gy=Math.floor(vy/step)*step;gy<=vy+h;gy+=step)art+=`<line class="mini-grid" x1="${vx}" y1="${gy}" x2="${vx+w}" y2="${gy}"/>`;
  const visual=c.mapVisual||{};for(const z of visual.spawns||[]){const zx=Math.min(z.x1,z.x2),zy=Math.min(z.y1,z.y2),zw=Math.abs(z.x2-z.x1),zh=Math.abs(z.y2-z.y1);art+=`<rect class="mini-spawn" x="${zx}" y="${zy}" width="${zw}" height="${zh}" rx="10"/>`;}
  for(const p of chars.filter(p=>p.map===c.map&&p.name!==c.name))art+=`<circle class="mini-peer" cx="${Number(p.x)||0}" cy="${Number(p.y)||0}" r="11"/>`;
  const merchant=c.role==='merchant',klass=merchant?' merchant':'';art+=`<circle class="mini-pulse${klass}" cx="${x}" cy="${y}" r="21"/><circle class="mini-self${klass}" cx="${x}" cy="${y}" r="15"/>`;
  return `<div class="mini-live-map"><div class="mini-label">${esc(c.map||'—')} · X ${Math.round(x)} · Y ${Math.round(y)}</div><svg viewBox="${vx} ${vy} ${w} ${h}" aria-label="Mini Live Map ${esc(c.name)}">${art}</svg></div>`;
}
function renderCards(){const gs=chars.map(c=>c.groupStrength).find(Boolean);document.getElementById('group').innerHTML=gs?`<div>Gruppenstärke Ø<b>${compact(gs.score)}</b></div><div>Gruppen-DPS<b>${compact(gs.totalDps)}</b></div><div>Ø Level<b>${num(gs.avgLevel,1)}</b></div><div>Ø HP<b>${compact(gs.avgHp)}</b></div>`:'';document.getElementById('cards').innerHTML=chars.map(c=>{const off=c.ageSeconds>30;return `<article class="card"><div class="head"><div class="role" title="${esc(c.role)}">${roleIcon(c)}</div><div><h2>${esc(c.name)}</h2><div class="meta">${esc(c.ctype)} · ${esc(c.role)} · Level ${c.level} · ${esc(c.server?.region||'')} ${esc(c.server?.id||'')}${c.server?.pvp?' · PvP':''}</div></div><div class="status ${off?'offline':'live'}">${off?'OFFLINE':'LIVE'}</div></div>${miniMapMarkup(c)}<div class="bars"><div class="barrow">HP ${compact(c.hp)} / ${compact(c.maxHp)} · ${num(c.hpPct,1)}%<div class="bar hp"><i style="width:${pct(c.hpPct)}%"></i></div></div><div class="barrow">MP ${compact(c.mp)} / ${compact(c.maxMp)} · ${num(c.mpPct,1)}%<div class="bar mp"><i style="width:${pct(c.mpPct)}%"></i></div></div><div class="barrow">Erfahrung ${num(c.xpPct,1)}%<div class="bar"><i style="width:${pct(c.xpPct)}%"></i></div></div></div><div class="stats"><div class="stat">EXP/h<b>${compact(c.xpPerHour)}</b></div><div class="stat">Gold/h<b>${compact(c.goldPerHour)}</b></div><div class="stat">Level-up<b>${eta(c.levelEtaSeconds)}</b></div></div><div class="task">${esc(c.task||c.mode||'—')}</div>${c.taskReason?`<div class="why"><b>Warum?</b><br>${esc(c.taskReason)}</div>`:''}${c.party&&!c.party.complete?`<div class="error">Gruppe unvollständig · ${esc((c.party.missing||[]).join(', '))}</div>`:''}</article>`;}).join('')||'<div class="empty">Noch keine Charakterdaten.</div>';}
function renderBrain'''
d = d[:m.start()] + new_render_cards + d[m.end():]

persist_marker = "const login=document.getElementById('login'),app=document.getElementById('app'),key=document.getElementById('key'),sync=document.getElementById('sync'),mapSelect=document.getElementById('mapSelect'),svg=document.getElementById('map');key.value=readKey;\n"
persist_code = persist_marker + r'''document.querySelectorAll('.dash-section').forEach(el=>{const k='aioDashOpen:'+el.dataset.section,s=localStorage.getItem(k);if(s!==null)el.open=s==='1';el.addEventListener('toggle',()=>{localStorage.setItem(k,el.open?'1':'0');if(el.open&&el.dataset.section==='map')setTimeout(()=>fitMap(),0);});});
'''
d = replace_once(d, persist_marker, persist_code, "dashboard collapse persistence")
write(dash_path, d)

v = json.loads(read("version.json"))
if v.get("version") != "2.14.4":
    raise RuntimeError(f"expected version 2.14.4, got {v.get('version')}")
v["version"] = "2.14.5"
v["dashboardVersion"] = "2.14.5"
write("version.json", json.dumps(v, ensure_ascii=False, indent=2) + "\n")

pkg = json.loads(read("cloudflare-dashboard/package.json"))
pkg["version"] = "2.14.5"
write("cloudflare-dashboard/package.json", json.dumps(pkg, ensure_ascii=False, indent=2) + "\n")

r = read("README.md")
r = r.replace("# Adventure Land – AiO Bot 2.14.4", "# Adventure Land – AiO Bot 2.14.5", 1)
r = r.replace("> Aktueller Stand: **2.14.4** · Build **2026-09-10**", "> Aktueller Stand: **2.14.5** · Build **2026-09-10**", 1)
anchor = "> **2.14.4 Merchant-Ökonomie/Party/UI-Hotfix:**"
idx = r.find(anchor)
if idx < 0: raise RuntimeError("README 2.14.4 anchor missing")
line_end = r.find("\n", idx)
note = "\n> **2.14.5 Merchant-Reliability/Dashboard-Hotfix:** verhindert konkurrierende Explorer-/Service-Routen durch Bewegungsprioritäten, wartet vor Kauf/Verkauf auf einen vollständig erreichten NPC, verkauft sicheren +4-/Max-Level-Überschuss nach Gruppenreserve und macht die Merchant-Ökonomie unter Inventardruck handlungsfähig. Dashboard 2.14.5 ordnet Charaktere nach oben, Gruppeninfos nach unten, ergänzt Mini-Live-Maps und einklappbare Kategorien. Die Ingame-GUI erhält eine scrollbar sichtbare Headless-Zeile sowie animierte HP-/MP-Balken in den Gruppeneinstellungen.\n"
r = r[:line_end+1] + note + r[line_end+1:]
write("README.md", r)

br = read("BOT_README.md")
br = br.replace("# Adventure Land – AiO Bot 2.14.4", "# Adventure Land – AiO Bot 2.14.5", 1)
section = '''## 2.14.5 Merchant-Reliability / Dashboard / GUI

- Merchant-Routen besitzen Prioritäten; Explorer darf Service, Bank, Scroll-/NPC-Wege und Upgrade-/Compound-Exits nicht mehr verdrängen.
- `buy()` und `sell()` werden erst bei <= 75 Einheiten NPC-Distanz und nach vollständigem Bewegungsstopp ausgelöst.
- Sicherer Max-Level-Upgrade-Überschuss darf verkauft werden, sobald Gruppenreserve, Rezeptschutz und Drop-Seltenheit dies zulassen.
- Unter Inventardruck erhält sicherer NPC-Verkauf eine echte Ausführungschance vor weiteren Bank-/Compound-Schleifen.
- Dashboard-Kategorien sind einklappbar; Charaktere stehen oben, Gruppeninformationen unten; jede Charakterkarte besitzt eine Mini-Live-Map.
- Das Ingame-Hauptfenster ist viewport-sicher scrollbar; Gruppeneinstellungen zeigen animierte HP-/MP-Balken.

'''
pos = br.find("\n## 2.14.4")
if pos < 0: raise RuntimeError("BOT_README 2.14.4 section missing")
br = br[:pos+1] + "\n" + section + br[pos+1:]
write("BOT_README.md", br)

worker_path = "cloudflare-dashboard/src/worker.js"
w = read(worker_path)
dash_now = read(dash_path)
lines = w.splitlines()
replaced = False
for i, line in enumerate(lines):
    if line.startswith("const DASHBOARD_HTML = "):
        lines[i] = "const DASHBOARD_HTML = " + json.dumps(dash_now, ensure_ascii=False) + ";"
        replaced = True
        break
if not replaced:
    raise RuntimeError("DASHBOARD_HTML declaration missing")
w = "\n".join(lines) + ("\n" if w.endswith("\n") else "")
w = w.replace('version:"2.14.0"', 'version:"2.14.5"')
w = w.replace('version: "2.14.0"', 'version: "2.14.5"')
write(worker_path, w)

vf = read("scripts/verify-release.js")
vf = vf.replace('ok(version.version === "2.14.4", "prepared release must be 2.14.4");', 'ok(version.version === "2.14.5", "prepared release must be 2.14.5");', 1)
vf = vf.replace('ok(version.dashboardVersion === "2.14.0", "dashboard version must remain 2.14.0 for bot-only hotfix");', 'ok(version.dashboardVersion === "2.14.5", "dashboard version must be 2.14.5 for dashboard release");', 1)
extra_verify = r'''
ok(bot.includes("function v2145MovePriority"), "2.14.5 Merchant move arbitration missing");
ok(bot.includes("move_deferred") && bot.includes("requestedPriority"), "2.14.5 route deferral diagnostics missing");
ok(bot.includes("function v2145VendorReady") && bot.includes("dist(character,dest)<=75"), "2.14.5 settled vendor guard missing");
ok(bot.includes("maxed-upgrade-surplus") && bot.includes("safe-trash-surplus"), "2.14.5 safe surplus selling missing");
ok(bot.includes("function v2145EconomyMaintenanceTick"), "2.14.5 economy maintenance priority missing");
ok(bot.includes(".mainbox .maincontent{overflow-y:auto"), "2.14.5 main GUI scrolling missing");
ok(bot.includes("partybar hp") && bot.includes("partybar mp") && bot.includes("v2145VitalFlow"), "2.14.5 animated party HP/MP bars missing");
ok(dash.includes('data-section="characters"') && dash.includes('data-section="group"'), "2.14.5 dashboard collapsible sections missing");
ok(dash.indexOf('data-section="characters"') < dash.indexOf('data-section="brain"'), "characters must be first dashboard category");
ok(dash.indexOf('data-section="group"') > dash.indexOf('data-section="research"'), "group information must be last dashboard category");
ok(dash.includes("function miniMapMarkup") && dash.includes("mini-live-map"), "character mini live maps missing");
ok(!dash.includes('<span>Gebiet</span>'), "character Gebiet text must be removed");
ok(worker.includes("const DASHBOARD_HTML = ") && worker.includes("miniMapMarkup"), "worker embedded dashboard is not synchronized");
'''
vf = vf.replace('if (!process.exitCode) console.log(`Regression checks OK', extra_verify + '\nif (!process.exitCode) console.log(`Regression checks OK', 1)
write("scripts/verify-release.js", vf)

smoke = r'''#!/usr/bin/env node
"use strict";
const fs=require("fs"),assert=require("assert"),vm=require("vm");
const bot=fs.readFileSync("bot.js","utf8");
const dash=fs.readFileSync("cloudflare-dashboard/dashboard.html","utf8");
const worker=fs.readFileSync("cloudflare-dashboard/src/worker.js","utf8");

assert.match(bot,/var VERSION\s*=\s*['"]2\.14\.5['"]/);
assert.ok(bot.includes("function v2145MovePriority"),"move priority missing");
assert.ok(bot.includes("priority<Number(lock.priority||0)"),"lower priority moves must be deferred");
assert.ok(bot.includes("v2145MovePriority(lock.kind)>v2145MovePriority('explore')"),"Explorer must respect active Merchant routes");
assert.ok(bot.includes("dist(character,dest)<=75")&&bot.includes("!character.moving")&&bot.includes("!S.moveInFlight"),"vendor action must wait until settled");
assert.ok(bot.includes("maxed-upgrade-surplus"),"maxed useful surplus must become sellable");
assert.ok(bot.includes("function v2145EconomyMaintenanceTick"),"economy maintenance missing");
assert.ok(bot.includes("merchant_sell_scan"),"no-candidate sell diagnostic missing");
assert.ok(bot.includes(".mainbox .maincontent{overflow-y:auto"),"main menu must scroll to Headless");
assert.ok(bot.includes("v2145VitalFlow")&&bot.includes("partybar hp")&&bot.includes("partybar mp"),"animated party vitals missing");

assert.ok(dash.includes('data-section="characters"')&&dash.includes('data-section="map"')&&dash.includes('data-section="brain"')&&dash.includes('data-section="research"')&&dash.includes('data-section="group"'),"all dashboard categories must be collapsible");
assert.ok(dash.indexOf('data-section="characters"')<dash.indexOf('data-section="map"'),"characters must be first");
assert.ok(dash.indexOf('data-section="group"')>dash.indexOf('data-section="research"'),"group must be last");
assert.ok(dash.includes("function miniMapMarkup")&&dash.includes("mini-pulse"),"mini maps missing");
assert.ok(!dash.includes('<span>Gebiet</span>'),"Gebiet line remains");
assert.ok(worker.includes("miniMapMarkup"),"worker dashboard embed stale");
assert.doesNotThrow(()=>new vm.Script(bot),"bot syntax");
console.log("2.14.5 Merchant path/sell/dashboard/UI smoke OK");
'''
write("scripts/smoke-2145-merchant-path-dashboard-ui.js", smoke)

ms = read("scripts/smoke-merchant-stability.js")
ms = ms.replace("2\\.14\\.4", "2\\.14\\.5")
ms = ms.replace("2.14.4", "2.14.5")
write("scripts/smoke-merchant-stability.js", ms)

print("2.14.5 patch prepared")
