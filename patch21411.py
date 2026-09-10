from pathlib import Path
import json,re
root=Path('.')
bot=root/'bot.js'
dash=root/'cloudflare-dashboard/dashboard.html'
worker=root/'cloudflare-dashboard/src/worker.js'
versionp=root/'version.json'
s=bot.read_text(encoding='utf-8')
assert "var VERSION = '2.14.10';" in s
s=s.replace("var VERSION = '2.14.10';","var VERSION = '2.14.11';",1)
# Ensure updater-visible base contract contains every protected 2.14.9+ feature.
old="'brain-research-bridge','research-prompt-profiles','research-secret-redaction','research-dashboard'\n  ];"
new="'brain-research-bridge','research-prompt-profiles','research-secret-redaction','research-dashboard',\n    'merchant-bank-warehouse','merchant-active-discovery','merchant-gathering','merchant-discovery-safety',\n    'brain-world-model','brain-safe-experiments','brain-planner','brain-explainability','brain-module-permissions','dashboard-game-sprites'\n  ];"
assert old in s
s=s.replace(old,new,1)
# Add brain-specific module defaults only; generic settings remain outside the brain window.
needle="brainEnabled: true, brainDailyNeuronLimit: 10000,"
repl="brainEnabled: true, brainWorldModelEnabled: true, brainDiscoveryModuleEnabled: true, brainExperimentModuleEnabled: true, brainPlannerModuleEnabled: true, brainExplainModuleEnabled: true, brainGatheringModuleEnabled: true, brainStandModuleEnabled: true, brainTeachingKeywords: '', brainDailyNeuronLimit: 10000,"
assert needle in s
s=s.replace(needle,repl,1)
marker="\n\n  // Preserve references so dispose can distinguish our CM handler on engines that support function identity."
assert marker in s
section=r'''

  // ---------------------------------------------------------------------------
  // 2.14.11 Layered world model, safe experiments, planner and explainability.
  // ---------------------------------------------------------------------------
  ['brain-world-model','brain-safe-experiments','brain-planner','brain-explainability','brain-module-permissions','dashboard-game-sprites'].forEach(function(f){if(FEATURE_CONTRACT.indexOf(f)<0)FEATURE_CONTRACT.push(f);});
  var V21411_WORLD_KEY='brainWorldModel21411',V21411_HYP_KEY='brainHypotheses21411';
  var v21411World=read(V21411_WORLD_KEY,{schema:1,gameVersion:'',updatedAt:0,entries:{}})||{schema:1,gameVersion:'',updatedAt:0,entries:{}};
  if(!v21411World.entries||typeof v21411World.entries!=='object')v21411World.entries={};
  var v21411Hyp=read(V21411_HYP_KEY,[]);if(!Array.isArray(v21411Hyp))v21411Hyp=[];
  function v21411Hash(v){try{return v2149TinyHash(v);}catch(e){try{return JSON.stringify(v).length+':'+safeString(JSON.stringify(v),120);}catch(x){return String(v);}}}
  function v21411Words(){return csv(C.brainTeachingKeywords).map(function(x){return String(x).toLowerCase();}).slice(0,20);}
  function v21411CompactReq(obj){var out=[];if(!obj)return out;[['level','Level'],['mp','MP'],['gold','Gold'],['cooldown','Cooldown'],['class','Klasse'],['type','Typ']].forEach(function(p){if(obj[p[0]]!=null&&obj[p[0]]!=='')out.push(p[1]+': '+safeString(obj[p[0]],50));});return out.slice(0,6);}
  function v21411Upsert(kind,id,name,definition,actions,requirements,outcomes,source){
    var key=kind+'|'+id,gv=String(v273GameVersion()||''),hash=v21411Hash(definition),old=v21411World.entries[key]||{},same=old.definitionHash===hash,conf=same?Math.max(.62,Number(old.confidence)||.62):Math.min(.58,Number(old.confidence)||.58),changed=!!old.definitionHash&&!same;
    if(same&&old.lastConfirmedVersion&&old.lastConfirmedVersion!==gv)conf=Math.max(conf,.72);
    v21411World.entries[key]={key:key,kind:kind,id:String(id),name:safeString(name||id,100),what:safeString((definition&&definition.description)||(definition&&definition.role)||(definition&&definition.type)||kind,160),actions:(actions||[]).slice(0,8),requirements:(requirements||[]).slice(0,8),outcomes:(outcomes||[]).slice(0,8),confidence:Math.max(.05,Math.min(.99,conf)),confirmations:Number(old.confirmations)||0,lastObservedAt:Number(old.lastObservedAt)||0,lastConfirmedVersion:same?gv:String(old.lastConfirmedVersion||''),gameVersion:gv,definitionHash:hash,stale:changed,source:source||'G'};
    return v21411World.entries[key];
  }
  function v21411RefreshWorld(force){
    if(!C.brainWorldModelEnabled)return false;var now=clock();if(!force&&now-Number(v21411World.updatedAt||0)<300000)return false;var gv=String(v273GameVersion()||''),seen={};
    Object.keys(GD.items||{}).forEach(function(id){var d=GD.items[id]||{},a=['inventory','trade'];if(d.type==='pot'||d.type==='elixir')a.push('use');if(d.upgrade)a.push('upgrade');if(d.compound)a.push('compound');if(d.e)a.push('exchange');var r=v21411Upsert('item',id,d.name||id,d,a,v21411CompactReq(d),[], 'G.items');seen[r.key]=1;});
    Object.keys(GD.skills||{}).forEach(function(id){var d=GD.skills[id]||{},r=v21411Upsert('skill',id,d.name||id,d,['use_skill'],v21411CompactReq(d),d.condition?['Condition: '+d.condition]:[], 'G.skills');seen[r.key]=1;});
    Object.keys(GD.monsters||{}).forEach(function(id){var d=GD.monsters[id]||{},req=[];if(Number(d.aggro)>0)req.push('Aggressiv');if(Number(d.rage)>0)req.push('Rage');var r=v21411Upsert('monster',id,d.name||id,d,['observe','attack','loot'],req,d.xp!=null?['XP: '+d.xp]:[], 'G.monsters');seen[r.key]=1;});
    Object.keys(GD.maps||{}).forEach(function(id){var d=GD.maps[id]||{},req=[];if(d.pvp)req.push('PvP');if(d.instance)req.push('Instanz');var r=v21411Upsert('map',id,d.name||id,d,['travel','explore'],req,[], 'G.maps');seen[r.key]=1;});
    v2149DiscoveryCatalog().forEach(function(e){var def=e.definition||{kind:e.kind,type:e.type,label:e.label,map:e.map},acts=['observe'];if(e.kind==='npc')acts.push('interact');if(e.kind==='door')acts.push('travel');if(e.kind==='zone'&&(e.type==='fishing'||e.type==='mining'))acts.push(e.type);if(e.kind==='machine')acts.push('interact');var req=[];if(e.staticOnly)req.push('Nur statisch: '+safeString(e.discoveryDanger&&e.discoveryDanger.reason||'unsicher',70));var r=v21411Upsert(e.kind,e.key,e.label||e.id||e.type||e.key,def,acts,req,[], 'discovery-catalog');seen[r.key]=1;});
    Object.keys(v21411World.entries).forEach(function(k){if(!seen[k])v21411World.entries[k].stale=true;});v21411World.schema=1;v21411World.gameVersion=gv;v21411World.updatedAt=now;write(V21411_WORLD_KEY,v21411World);return true;
  }
  function v21411Confirm(entry,probe){if(!entry)return;var key=entry.kind+'|'+entry.key,r=v21411World.entries[key];if(!r){v21411RefreshWorld(true);r=v21411World.entries[key];}if(!r)return;var ok=!probe||probe.ok!==false;r.confirmations=Math.min(999,Number(r.confirmations||0)+(ok?1:0));r.lastObservedAt=clock();r.lastConfirmedVersion=String(v273GameVersion()||'');r.stale=false;r.confidence=Math.min(.99,Math.max(Number(r.confidence)||.55,.58)+(.07*Math.min(5,r.confirmations)));if(probe&&probe.error)r.outcomes=(r.outcomes||[]).concat(['Fehler: '+safeString(probe.error,100)]).slice(-8);write(V21411_WORLD_KEY,v21411World);}
  var v21411RecordBase=v2149RecordDiscovery;
  v2149RecordDiscovery=function(entry,probe){var x=v21411RecordBase(entry,probe);try{v21411Confirm(entry,probe);v21411UpdateHypothesis(entry,probe);}catch(e){}return x;};
  function v21411HypothesisFor(entry){if(!entry)return null;var id=entry.key,type='definition',text='Prüfen, ob '+safeString(entry.label||entry.id||entry.type||entry.key,90)+' seit dem letzten Spielupdate unverändert funktioniert.';if(entry.kind==='npc')type='npc-service';if(entry.kind==='machine'||entry.kind==='quirk')type='interaction';if(entry.kind==='door')type='travel';if(entry.kind==='zone')type='gathering';return {id:type+'|'+id,type:type,target:id,text:text,status:'open',confidence:.35,attempts:0,successes:0,lastAt:0,gameVersion:String(v273GameVersion()||'')};}
  function v21411UpdateHypothesis(entry,probe){if(!C.brainExperimentModuleEnabled||!entry)return;var id=(entry.kind==='npc'?'npc-service':entry.kind==='door'?'travel':entry.kind==='zone'?'gathering':'interaction')+'|'+entry.key,h=v21411Hyp.find(function(x){return x.id===id;});if(!h){h=v21411HypothesisFor(entry);if(!h)return;v21411Hyp.push(h);}h.attempts=Number(h.attempts||0)+1;if(!probe||probe.ok!==false)h.successes=Number(h.successes||0)+1;h.lastAt=clock();var ratio=h.successes/Math.max(1,h.attempts);h.confidence=Math.min(.98,.35+.12*Math.min(5,h.attempts)+.15*ratio);h.status=h.attempts>=2&&ratio>=.66?'supported':h.attempts>=3&&ratio<.34?'uncertain':'open';v21411Hyp=v21411Hyp.slice(-120);write(V21411_HYP_KEY,v21411Hyp);}
  function v21411WorldStats(){var a=Object.keys(v21411World.entries||{}).map(function(k){return v21411World.entries[k];}),stale=a.filter(function(x){return x.stale;}).length,low=a.filter(function(x){return Number(x.confidence)<.6;}).length;return {total:a.length,stale:stale,lowConfidence:low,gameVersion:v21411World.gameVersion||String(v273GameVersion()||''),updatedAt:Number(v21411World.updatedAt)||0,hypotheses:v21411Hyp.length,supported:v21411Hyp.filter(function(x){return x.status==='supported';}).length};}
  function v21411Planner(){
    var options=[],urgent=(typeof v277MerchantServiceCandidates==='function'?v277MerchantServiceCandidates():[]).filter(function(x){return x&&x.urgent;})[0],ws=v21411WorldStats();
    if(urgent)options.push({id:'supply',score:1000,label:'Gruppenversorgung',reason:(urgent.name||'Farmer')+' hat dringenden Versorgungsbedarf.'});
    if(S.merchantBankRetrieve2149||S.merchantBankCleanup2148)options.push({id:'bank',score:900,label:'Banklogistik',reason:'Eine laufende Bankaufgabe wird sicher abgeschlossen.'});
    if(C.brainDiscoveryModuleEnabled&&(ws.stale||ws.lowConfidence))options.push({id:'discovery',score:220+Math.min(120,ws.stale*4+ws.lowConfidence),label:'Discovery',reason:ws.stale+' veraltete und '+ws.lowConfidence+' unsichere Weltmodell-Einträge.'});
    if(C.brainGatheringModuleEnabled&&character.level>=16&&v2149GatherDue())options.push({id:'gathering',score:150,label:'Fishing / Mining',reason:'Merchant ist frei; Gathering ist als produktive Nebenarbeit möglich.'});
    if(C.brainStandModuleEnabled)options.push({id:'stand',score:120,label:'Merchant-Stand',reason:'Keine höhere Gruppenpriorität; Handel kann Merchant-XP und Gold erzeugen.'});
    options.push({id:'wait',score:20,label:'Beobachten',reason:'Keine sichere höherwertige Aktion erkannt.'});options.sort(function(a,b){return b.score-a.score;});return {chosen:options[0],alternatives:options.slice(1,4),all:options,at:clock()};
  }
  function v21411LatestLearning(){var rows=(v2149Discovery.recent||[]).slice(-30),last=rows[rows.length-1];if(!last)return {text:'Noch keine neue Discovery-Beobachtung.',repetitions:0,confidencePct:0};var same=rows.filter(function(x){return x&&x.key===last.key;}),r=v21411World.entries[(last.kind||'unknown')+'|'+last.key],n=r?Number(r.confirmations)||same.length:same.length,p=r?Math.round(Number(r.confidence||0)*100):Math.min(95,45+n*12);return {text:safeString((last.label||last.id||last.type||last.key)+' wurde '+n+'× beobachtet'+(last.probe&&last.probe.ok===false?' (letzter Test ohne Erfolg)':''),180),repetitions:n,confidencePct:p};}
  function v21411Explain(){var p=v21411Planner(),learn=v21411LatestLearning(),cur=safeString(S.status||S.mode||'Beobachtet den Spielzustand',180),why=safeString(S.taskReason||p.chosen.reason||'Die lokale Sicherheits- und Prioritätslogik hat diese Aufgabe gewählt.',260),next=p.alternatives[0]?p.alternatives[0].label+': '+p.alternatives[0].reason:'Weiter beobachten.',cl=learn.confidencePct>=85?'Sehr sicher':learn.confidencePct>=65?'Ziemlich sicher':learn.confidencePct>=40?'Noch unsicher':'Noch keine belastbare Aussage';return {short:safeString(cur,55),current:cur,why:why,next:safeString(next,220),learned:learn.text,confidenceLabel:cl,confidencePct:learn.confidencePct,repetitions:learn.repetitions,planner:p,world:v21411WorldStats(),modules:{worldModel:!!C.brainWorldModelEnabled,discovery:!!C.brainDiscoveryModuleEnabled,experiments:!!C.brainExperimentModuleEnabled,planner:!!C.brainPlannerModuleEnabled,explain:!!C.brainExplainModuleEnabled,gathering:!!C.brainGatheringModuleEnabled,stand:!!C.brainStandModuleEnabled},teachingKeywords:v21411Words()};}
  function v21411PlannerTick(){if(character.ctype!=='merchant'||!C.brainPlannerModuleEnabled)return false;v21411RefreshWorld(false);var p=v21411Planner();S.brainPlanner21411=p;if(p.chosen&&p.chosen.id==='discovery'&&C.brainDiscoveryModuleEnabled&&!S.moveInFlight&&!character.moving)S.explorer.force=true;return false;}
  var v21411MerchantTickBase=merchantTick;
  merchantTick=function(){if(character.ctype==='merchant')v21411PlannerTick();return v21411MerchantTickBase();};
  var v21411CatalogBase=v2149DiscoveryCatalog;
  v2149DiscoveryCatalog=function(){var rows=v21411CatalogBase(),words=v21411Words();rows.sort(function(a,b){function score(e){var r=v21411World.entries[e.kind+'|'+e.key],s=!r?80:(r.stale?70:0)+(Number(r.confidence)<.6?40:0);if(words.length&&words.some(function(w){return (String(e.id||'')+' '+String(e.label||'')+' '+String(e.type||'')+' '+String(e.map||'')).toLowerCase().indexOf(w)>=0;}))s+=60;return s;}return score(b)-score(a);});return rows;};
  function v21411SpriteMeta(skin){skin=String(skin||'');if(!skin)return null;var defs=GD.sprites||P.sprites||{};for(var k in defs){var d=defs[k]||{},mx=d.matrix||[];for(var r=0;r<mx.length;r++){for(var c=0;c<(mx[r]||[]).length;c++){if(mx[r][c]===skin&&d.file)return {skin:skin,file:String(d.file),row:r,column:c,rows:Math.max(1,Number(d.rows)||mx.length||1),columns:Math.max(1,Number(d.columns)||(mx[r]||[]).length||1)};}}}return null;}
  var v21411DashboardBase=dashboardPayload;
  dashboardPayload=function(){var x=v21411DashboardBase();try{x.brainExplanation=v21411Explain();x.sprite=v21411SpriteMeta(character.skin);x.skin=String(character.skin||'');}catch(e){}return x;};
  var v21411BrainStateBase=v290BrainState;
  v290BrainState=function(trigger){var st=v21411BrainStateBase(trigger);st.worldModel=v21411WorldStats();st.explanation=v21411Explain();st.hypotheses=v21411Hyp.slice(-8);return st;};
  var v21411TelemetryBase=v210BrainTelemetry;
  v210BrainTelemetry=function(){var x=v21411TelemetryBase();x.explanation=v21411Explain();x.worldModel=v21411WorldStats();x.hypotheses=v21411Hyp.slice(-8);return x;};
  var v21411ToolDefsBase=toolDefs;
  toolDefs=function(){var rows=v21411ToolDefsBase();rows.forEach(function(r){if(r&&r[0]==='brain'){r[2]=C.language==='de'?'Bot-Gehirn':'Bot Brain';r[3]=C.language==='de'?'Versteht, plant, lernt und erklärt Entscheidungen':'Understands, plans, learns and explains decisions';}});return rows;};
  function v21411ModulesHTML(){return '<div class="card"><h3>🧩 Module · was das Bot-Gehirn darf</h3><div class="muted">Sicherheitsreflexe, Kampf- und Versorgungsregeln bleiben deterministisch. Diese Schalter begrenzen nur Lernen und strategische Autonomie.</div>'+cfgField('brainWorldModelEnabled','Wissensbasis / Weltmodell','check','Speichert Bedeutung, Aktionen, Voraussetzungen, Folgen, Sicherheit und zuletzt bestätigte G.version.')+cfgField('brainDiscoveryModuleEnabled','Discovery priorisieren','check','Darf unbekannte/veraltete sichere Ziele für den Merchant priorisieren.')+cfgField('brainExperimentModuleEnabled','Sichere Experimente','check','Formuliert Hypothesen und wertet nur reversible/kostenfreie, bereits erlaubte Probes aus. Keine zerstörerischen Tests.')+cfgField('brainPlannerModuleEnabled','Strategischer Planner','check','Gewichtet Ziele, Nutzen, Risiko, Zeit und Unsicherheit; dringende Gruppenversorgung bleibt höher priorisiert.')+cfgField('brainGatheringModuleEnabled','Gathering als freie Arbeit einplanen','check')+cfgField('brainStandModuleEnabled','Merchant-Stand als freie Arbeit einplanen','check')+cfgField('brainExplainModuleEnabled','Erklärungen anzeigen','check')+cfgField('brainTeachingKeywords','Lernhinweise / Stichworte','text','Beispiele: seashell, winterland, exchange. Stichworte priorisieren passende Weltmodell-Einträge; sie führen niemals fremden Code aus.')+'</div>';}
  v290BrainHTML=function(){var e=v21411Explain(),w=e.world,p=e.planner||{alternatives:[]},alts=(p.alternatives||[]).map(function(x){return '<li><b>'+esc(x.label)+'</b> · '+esc(x.reason)+'</li>';}).join('')||'<li>Keine weitere sichere Aufgabe erkannt.</li>',hy=v21411Hyp.slice(-6).reverse().map(function(h){return '<div class="line"><span>'+esc(h.text)+'</span><strong>'+Math.round(Number(h.confidence||0)*100)+'%</strong></div>';}).join('');return '<h2>🧠 '+(C.language==='de'?'Bot-Gehirn':'Bot Brain')+'</h2><div class="notice"><b>Wofür ist das gut?</b> Das Bot-Gehirn merkt sich die Spielwelt, prüft unsichere Annahmen, plant freie Merchant-Zeit und erklärt seine Entscheidungen. Sicherheitskritische Aktionen bleiben feste Bot-Regeln.</div><div class="card brain-explain"><h3>Was mache ich gerade?</h3><b>'+esc(e.current)+'</b><h3>Warum?</h3><div>'+esc(e.why)+'</div><h3>Was würde ich sonst tun?</h3><div>'+esc(e.next)+'</div><h3>Was habe ich gelernt?</h3><div>'+esc(e.learned)+'</div><h3>Wie sicher bin ich?</h3><div><b>'+esc(e.confidenceLabel)+'</b> · '+Number(e.confidencePct||0)+'% · '+Number(e.repetitions||0)+' Bestätigung(en)</div></div>'+v21411ModulesHTML()+'<div class="card"><h3>🌍 Weltmodell</h3><div class="line"><span>Bekannte Einträge</span><strong>'+w.total+'</strong></div><div class="line"><span>Nach Spielupdate veraltet</span><strong>'+w.stale+'</strong></div><div class="line"><span>Noch unsicher</span><strong>'+w.lowConfidence+'</strong></div><div class="line"><span>Bestätigte Hypothesen</span><strong>'+w.supported+' / '+w.hypotheses+'</strong></div><div class="line"><span>G.version</span><strong>'+esc(w.gameVersion||'—')+'</strong></div></div><div class="card"><h3>🧭 Planner · nächste Optionen</h3><ul>'+alts+'</ul></div><div class="card"><h3>🧪 Letzte Hypothesen</h3>'+(hy||'<div class="muted">Noch keine Hypothesen ausgewertet.</div>')+'</div>';};
  CSS+=' .brain-explain h3{font-size:11px;margin:10px 0 3px;color:var(--accent)}.brain-explain>div{font-size:10px;line-height:1.45}.brain-explain>b{font-size:13px} ';
  v21411RefreshWorld(true);
  audit('feature_contract','2.14.11 Weltmodell + sichere Hypothesen + Planner + verständliche Bot-Gehirn-Erklärungen + Sprite-Telemetrie geprüft',{features:FEATURE_CONTRACT,world:v21411WorldStats()});
'''
s=s.replace(marker,section+marker,1)
bot.write_text(s,encoding='utf-8')
# Dashboard: Bot-Gehirn wording, detailed plain-language explanation, real Adventure Land base-skin sprites.
d= dash.read_text(encoding='utf-8')
d=d.replace('Dashboard 2.14.5','Dashboard 2.14.11').replace('🧠 Gehirn</summary>','🧠 Bot-Gehirn</summary>').replace('<h2>Brain-Status</h2>','<h2>Bot-Gehirn</h2>')
css='''\n.gamesprite{position:relative;display:inline-block;overflow:hidden;width:42px;height:54px;vertical-align:middle;image-rendering:pixelated;border-radius:8px;background:#071722}.gamesprite img{position:absolute;max-width:none;image-rendering:pixelated}.head .gamesprite{flex:0 0 auto}.brain-explain-web{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;margin:10px 0}.brain-explain-web>div{background:#071722;border:1px solid #24475b;border-radius:9px;padding:9px;font-size:11px;line-height:1.45}.brain-explain-web b{display:block;color:#63e1bd;margin-bottom:4px}.sprite-map-label{paint-order:stroke;stroke:#06151c;stroke-width:5px;fill:#fff;font-size:22px;font-weight:800}\n'''
assert '</style>' in d
d=d.replace('</style>',css+'</style>',1)
# helper for genuine game sprite sheets, cropped by matrix row/column supplied by the bot.
needle='function miniMapMarkup(c){'
helper=r'''function gameSprite(c,w=42,h=54){const s=c&&c.sprite;if(!s||!s.file)return `<span class="role">${roleIcon(c||{})}</span>`;const cols=Math.max(1,Number(s.columns)||1),rows=Math.max(1,Number(s.rows)||1),col=Math.max(0,Number(s.column)||0),row=Math.max(0,Number(s.row)||0),src=(String(s.file).startsWith('http')?String(s.file):'https://adventure.land'+String(s.file));return `<span class="gamesprite" style="width:${w}px;height:${h}px"><img alt="${esc(c.name||s.skin||'Sprite')}" src="${esc(src)}" style="width:${cols*w}px;height:${rows*h}px;left:${-col*w}px;top:${-row*h}px"></span>`;}
function mapSprite(c,size=48){const s=c&&c.sprite;if(!s||!s.file)return `<circle r="14"></circle>`;const cols=Math.max(1,Number(s.columns)||1),rows=Math.max(1,Number(s.rows)||1),col=Math.max(0,Number(s.column)||0),row=Math.max(0,Number(s.row)||0),src=(String(s.file).startsWith('http')?String(s.file):'https://adventure.land'+String(s.file)),h=Math.round(size*1.28);return `<foreignObject x="${-size/2}" y="${-h/2}" width="${size}" height="${h}">${gameSprite(c,size,h)}</foreignObject>`;}
'''
assert needle in d
d=d.replace(needle,helper+needle,1)
old="const pins=cs.map(c=>`<g class=\"pin ${c.role==='merchant'?'merchant':''}\" transform=\"translate(${Number(c.x)||0} ${Number(c.y)||0})\"><circle class=\"pulse\" r=\"20\"></circle><circle r=\"14\"></circle><text x=\"24\" y=\"8\">${esc(c.name)}</text></g>`).join('');"
new="const pins=cs.map(c=>`<g class=\"pin ${c.role==='merchant'?'merchant':''}\" transform=\"translate(${Number(c.x)||0} ${Number(c.y)||0})\"><circle class=\"pulse\" r=\"24\"></circle>${mapSprite(c,48)}<text class=\"sprite-map-label\" x=\"32\" y=\"8\">${esc(c.name)}</text></g>`).join('');"
assert old in d
d=d.replace(old,new,1)
old2='<div class="role" title="${esc(c.role)}">${roleIcon(c)}</div>'
new2='${gameSprite(c,42,54)}'
assert old2 in d
d=d.replace(old2,new2,1)
# mini-map: replace local/peer circles with cropped sprites via foreignObject.
old3="for(const p of chars.filter(p=>p.map===c.map&&p.name!==c.name))art+=`<circle class=\"mini-peer\" cx=\"${Number(p.x)||0}\" cy=\"${Number(p.y)||0}\" r=\"11\"/>`;\n  const merchant=c.role==='merchant',klass=merchant?' merchant':'';art+=`<circle class=\"mini-pulse${klass}\" cx=\"${x}\" cy=\"${y}\" r=\"21\"/><circle class=\"mini-self${klass}\" cx=\"${x}\" cy=\"${y}\" r=\"15\"/>`;"
new3="for(const p of chars.filter(p=>p.map===c.map&&p.name!==c.name)){const px=Number(p.x)||0,py=Number(p.y)||0;art+=`<g transform=\"translate(${px} ${py})\">${mapSprite(p,34)}</g>`;}\n  const merchant=c.role==='merchant',klass=merchant?' merchant':'';art+=`<circle class=\"mini-pulse${klass}\" cx=\"${x}\" cy=\"${y}\" r=\"25\"/><g transform=\"translate(${x} ${y})\">${mapSprite(c,40)}</g>`;"
assert old3 in d
d=d.replace(old3,new3,1)
# Detailed explanation comes from the Merchant status payload. Inject at top of renderBrain.
brainneedle="const diaryPayload=(Array.isArray(live.diary)&&live.diary.length)?{entries:live.diary,stats:live.diaryStats||{}}:(st.diary||{}),diary=(diaryPayload.entries||[]).slice(-14).reverse(),diaryStats=diaryPayload.stats||{},latestDiary=diary[0]||null;"
brainrepl=brainneedle+"\n  const merchant=chars.find(c=>c.role==='merchant')||{},ex=merchant.brainExplanation||live.explanation||st.explanation||{},webExplain=ex.current?`<div class=\"brain-explain-web\"><div><b>Was mache ich gerade?</b>${esc(ex.current)}</div><div><b>Warum?</b>${esc(ex.why||'—')}</div><div><b>Was würde ich sonst tun?</b>${esc(ex.next||'—')}</div><div><b>Was habe ich gelernt?</b>${esc(ex.learned||'—')}</div><div><b>Wie sicher bin ich?</b>${esc(ex.confidenceLabel||'—')} · ${Number(ex.confidencePct||0)}% · ${Number(ex.repetitions||0)} Bestätigung(en)</div><div><b>Weltmodell</b>${Number(ex.world?.total||0)} Einträge · ${Number(ex.world?.stale||0)} veraltet · G.version ${esc(ex.world?.gameVersion||'—')}</div></div>`:'';"
assert brainneedle in d
d=d.replace(brainneedle,brainrepl,1)
# prepend detailed explanation to final brain HTML assignment(s)
d=d.replace("el.innerHTML=organism+", "el.innerHTML=webExplain+organism+",1)
dash.write_text(d,encoding='utf-8')
# Worker/source version labels only; no API/schema change required.
w=worker.read_text(encoding='utf-8')
w=w.replace('2.14.5','2.14.11')
worker.write_text(w,encoding='utf-8')
# Version manifest.
v=json.loads(versionp.read_text(encoding='utf-8'));v['version']='2.14.11';v['build']='2026-09-10';v['dashboardVersion']='2.14.11';versionp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Update current-version assertions in retained smoke/release scripts.
for p in (root/'scripts').glob('*.js'):
    t=p.read_text(encoding='utf-8')
    if '2.14.10' in t:t=t.replace('2.14.10','2.14.11')
    p.write_text(t,encoding='utf-8')
# Dedicated regression smoke.
sm=root/'scripts/smoke-21411-brain-world.js'
sm.write_text(r'''const fs=require('fs'),vm=require('vm'),assert=require('assert');
const s=fs.readFileSync('bot.js','utf8'),d=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8');
assert(s.includes("var VERSION = '2.14.11';"));
for(const f of ['merchant-bank-warehouse','merchant-active-discovery','merchant-gathering','merchant-discovery-safety','brain-world-model','brain-safe-experiments','brain-planner','brain-explainability','brain-module-permissions','dashboard-game-sprites']) assert(s.includes("'"+f+"'"),f);
assert(/var FEATURE_CONTRACT[\s\S]*merchant-bank-warehouse[\s\S]*merchant-discovery-safety/.test(s),'protected markers must be in updater-visible base contract');
for(const k of ['brainWorldModelEnabled','brainDiscoveryModuleEnabled','brainExperimentModuleEnabled','brainPlannerModuleEnabled','brainTeachingKeywords'])assert(s.includes(k),k);
for(const k of ['what:','actions:','requirements:','outcomes:','confidence:','lastConfirmedVersion:','stale:'])assert(s.includes(k),k);
assert(s.includes("status=h.attempts>=2&&ratio>=.66?'supported'"),'experiments need repeated evidence');
assert(s.includes("Nur statisch:"),'unsafe discovery remains static-only');
assert(s.includes("S.explorer.force=true"),'planner may prioritize safe discovery');
assert(s.includes('Gruppenversorgung')&&s.includes('score:1000'),'urgent group service outranks idle learning');
assert(s.includes("r[2]=C.language==='de'?'Bot-Gehirn'"),'button renamed');
assert(s.includes('Lernhinweise / Stichworte')&&s.includes('sie führen niemals fremden Code aus'),'keyword teaching is non-executable');
assert(d.includes('🧠 Bot-Gehirn')&&d.includes('Was mache ich gerade?')&&d.includes('Wie sicher bin ich?'));
assert(d.includes('https://adventure.land')&&d.includes('gameSprite(c')&&d.includes('foreignObject'),'dashboard uses real game sprite sheets');
new vm.Script(s);console.log('smoke-21411-brain-world OK');
''',encoding='utf-8')
print('patched 2.14.11')
