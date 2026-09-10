from pathlib import Path
import json, re

ROOT=Path('.')
BOT=ROOT/'bot.js'
DASH=ROOT/'cloudflare-dashboard/dashboard.html'
WORKER=ROOT/'cloudflare-dashboard/src/worker.js'
VER=ROOT/'version.json'

bot=BOT.read_text(encoding='utf-8')
dash=DASH.read_text(encoding='utf-8')
worker=WORKER.read_text(encoding='utf-8')

# Version bump.
bot=bot.replace("var VERSION = '2.14.11';", "var VERSION = '2.14.12';", 1)
bot=bot.replace('/* Adventure Land • AiO Bot 2.14.10 | 2026-09-10', '/* Adventure Land • AiO Bot 2.14.12 | 2026-09-10', 1)

# 2.14.11 had a primitive single-line keyword cfg field. Replace it with the new dedicated teaching card below.
old="+cfgField('brainTeachingKeywords','Lernhinweise / Stichworte','text','Beispiele: seashell, winterland, exchange. Stichworte priorisieren passende Weltmodell-Einträge; sie führen niemals fremden Code aus.')"
if old not in bot:
    raise SystemExit('brainTeachingKeywords primitive field marker missing')
bot=bot.replace(old, '', 1)

marker="\n\n  // Preserve references so dispose can distinguish our CM handler on engines that support function identity."
if marker not in bot:
    raise SystemExit('bot insertion marker missing')

section=r'''

  // ---------------------------------------------------------------------------
  // 2.14.12 Merchant bank confirmation + teaching hints + real terrain telemetry.
  // ---------------------------------------------------------------------------
  ['merchant-bank-cleanup-confirmation','brain-teaching-hints','dashboard-terrain-tiles','dashboard-learning-feed'].forEach(function(f){if(FEATURE_CONTRACT.indexOf(f)<0)FEATURE_CONTRACT.push(f);});

  function v21412InventoryExact(name,level){var lv=Math.max(0,Number(level)||0),n=0;(character.items||[]).forEach(function(it){if(it&&it.name===name&&(Number(it.level)||0)===lv)n+=Number(it.q)||1;});return n;}
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
  }

  v2148BankCleanupTick=function(){
    var now=clock(),st=S.merchantBankCleanup2148,cand;
    if(!st){
      cand=v2148BankCleanupCandidate();
      if(now<Number(S.times.bankCleanupRetry2148||0)||!cand)return false;
      st=S.merchantBankCleanup2148={startedAt:now,stores:0,lastProgressAt:now,awaiting:null};
      audit('merchant_bank_cleanup_start','Bestätigte Bankbereinigung gestartet',{item:cand.item.name,explicit:!!cand.explicit,free:freeSlots(),reserve:Number(C.merchantInventoryReserve||5)});
    }
    if(st.awaiting){v21412BankCleanupAwaiting(st,now);return !!S.merchantBankCleanup2148;}
    if(now-Number(st.startedAt||now)>30000||Number(st.stores||0)>=10){
      S.times.bankCleanupRetry2148=now+15000;
      v2148BankCleanupFinish('merchant_bank_cleanup_timeout','Bankbereinigung nach bestätigten Fortschritten kontrolliert freigegeben; späterer Neuversuch','warning');
      return false;
    }
    cand=v2148BankCleanupCandidate();
    if(!cand){v2148BankCleanupFinish('merchant_bank_cleanup_done','Bankbereinigung abgeschlossen');return false;}
    if(String(character.map||'').indexOf('bank')!==0){
      S.status='Bankbereinigung · zur Bank: '+v273Name(cand.item.name);S.mode='Merchant · Bank';
      if(v2147BankExitActive())return true;
      moveToGoal({map:'bank',x:0,y:0},'Bestätigte Bankbereinigung',{kind:'merchant-bank-cleanup',forceAfter:9000});return true;
    }
    S.status='Bankbereinigung · '+v273Name(cand.item.name);S.mode='Merchant · Bank';
    if(character.moving||S.moveInFlight||v2147BankExitActive())return true;
    if(!character.bank)return true;
    var cap=v273BankCapacity();if(cap&&cap.free<=0){S.bankFull=true;v273OpenBankPackTick();return true;}
    if(now<Number(S.times['bank-store-2148']||0)||typeof bank_store!=='function')return true;
    var idx=cand.index,name=cand.item.name,lv=Number(cand.item.level)||0,explicit=!!cand.explicit;
    st.awaiting={index:idx,name:name,level:lv,beforeExact:v21412InventoryExact(name,lv),beforeFree:freeSlots(),beforeBank:v2149BankCount(name,lv),startedAt:now};
    var started=action((explicit?'Item-Regel Bank ':'Item in Bank lagern ')+name,function(){
      if(String(character.map||'').indexOf('bank')!==0||character.moving||S.moveInFlight||v2147BankExitActive())throw Error('bank_location_changed');
      return Promise.resolve(bank_store(idx)).catch(function(e){S.times.bankCleanupRetry2148=clock()+15000;if(S.merchantBankCleanup2148){S.merchantBankCleanup2148.awaiting=null;v2148BankCleanupFinish('merchant_bank_cleanup_error','Banklagerung fehlgeschlagen; späterer Neuversuch','warning');}throw e;});
    },'bank-store-2148',900);
    if(!started)st.awaiting=null;
    return true;
  };

  function v21412HintLines(){return String(C.brainTeachingKeywords||'').split(/[\n;]+/).map(function(x){return x.trim();}).filter(Boolean).slice(0,30);}
  function v21412TeachingTokens(){
    var stop={ich:1,glaube:1,der:1,die:1,das:1,ein:1,eine:1,npc:1,item:1,verkauft:1,tauscht:1,gibt:1,bei:1,in:1,auf:1,und:1,oder:1,von:1,zu:1,ist:1,sind:1,kann:1,koennte:1,könnte:1};
    var out=[];String(C.brainTeachingKeywords||'').toLowerCase().replace(/[^a-z0-9_\-äöüß]+/g,' ').split(/\s+/).forEach(function(w){if(w.length<2||stop[w]||out.indexOf(w)>=0)return;out.push(w);});return out.slice(0,40);
  }
  v21411Words=v21412TeachingTokens;

  function v21412HintHypothesis(line,index){
    var clean=safeString(line,240),m=clean.match(/^(?:ich\s+glaube\s+)?(?:der\s+)?npc\s+([a-z0-9_\-]+)\s+(verkauft|tauscht|gibt)\s+(?:das\s+)?(?:item\s+)?([a-z0-9_\-]+)/i);
    if(m){
      var npc=m[1],verb=m[2].toLowerCase(),item=m[3],id='user:npc-'+verb+'|'+npc+'|'+item,def=GD.npcs&&GD.npcs[npc],supported=!!(def&&Array.isArray(def.items)&&def.items.indexOf(item)>=0&&verb==='verkauft');
      return {id:id,type:'user-hint',target:'npc|'+npc,text:clean,status:supported?'supported':'open',confidence:supported?.94:.25,attempts:supported?1:0,successes:supported?1:0,lastAt:clock(),gameVersion:String(v273GameVersion()||''),source:'user',focus:[npc,item],evidence:supported?['G.npcs.items bestätigt den Verkauf']:[]};
    }
    return {id:'user:belief|'+v21411Hash(clean),type:'user-hint',target:'focus',text:clean,status:'open',confidence:.2,attempts:0,successes:0,lastAt:clock(),gameVersion:String(v273GameVersion()||''),source:'user',focus:v21412TeachingTokens().slice(0,8),evidence:[]};
  }
  function v21412ApplyTeachingHints(){
    var lines=v21412HintLines(),changed=false;
    lines.forEach(function(line,i){if(!/^ich\s+glaube\b/i.test(line)&&!/\bnpc\b/i.test(line))return;var h=v21412HintHypothesis(line,i),old=v21411Hyp.find(function(x){return x&&x.id===h.id;});if(old){old.text=h.text;old.gameVersion=h.gameVersion;old.focus=h.focus;if(h.status==='supported'){old.status='supported';old.confidence=Math.max(Number(old.confidence)||0,h.confidence);old.evidence=h.evidence;}}else{v21411Hyp.push(h);changed=true;}});
    v21411Hyp=v21411Hyp.slice(-120);if(changed||lines.length)write(V21411_HYP_KEY,v21411Hyp);return lines.length;
  }
  v21412ApplyTeachingHints();

  // Backfill/retain the discovery key in records; 2.14.11's recent record omitted it.
  try{Object.keys(v2149Discovery.knowledge||{}).forEach(function(k){if(v2149Discovery.knowledge[k])v2149Discovery.knowledge[k].key=k;});write(V2149_DISCOVERY_KEY,v2149Discovery);}catch(e){}
  var v21412RecordBase=v2149RecordDiscovery;
  v2149RecordDiscovery=function(entry,probe){var result=v21412RecordBase(entry,probe);try{var r=v2149Discovery.knowledge&&v2149Discovery.knowledge[entry.key];if(r)r.key=entry.key;var recent=v2149Discovery.recent||[],last=recent[recent.length-1];if(last&&last.kind===entry.kind&&last.id===entry.id&&last.map===entry.map)last.key=entry.key;write(V2149_DISCOVERY_KEY,v2149Discovery);}catch(e){}return result;};

  function v21412TeachingHTML(){
    var hints=v21412HintLines(),userHyp=v21411Hyp.filter(function(h){return h&&h.source==='user';}).slice(-6).reverse();
    var rows=userHyp.map(function(h){return '<div class="line"><span>'+esc(h.text)+'</span><strong>'+Math.round(Number(h.confidence||0)*100)+'% · '+esc(h.status||'open')+'</strong></div>';}).join('');
    return '<div class="card brain-teaching-card"><h3>💬 Vermutungen & Lernhinweise</h3><div class="muted">Hier kannst du einzelne Stichworte oder kurze Sätze eintragen. Beispiele: <b>seashell</b>, <b>winterland</b>, <b>exchange</b> oder <b>Ich glaube NPC X verkauft Item Y</b>. Das Brain nutzt sie ausschließlich als Suchfokus bzw. prüfbare Hypothese. Daraus wird niemals Code erzeugt oder ausgeführt; es werden keine Käufe, zerstörerischen Aktionen oder neuen Berechtigungen freigeschaltet.</div><textarea class="brain-teaching-input" data-brain-hints placeholder="seashell; winterland; exchange\nIch glaube NPC X verkauft Item Y">'+esc(C.brainTeachingKeywords||'')+'</textarea><div class="buttons"><button class="btn primary" data-action="brain-hints-save">Lernhinweise übernehmen</button></div><div class="muted">Aktiv: '+hints.length+' Hinweis(e) · Fokusbegriffe: '+esc(v21412TeachingTokens().join(', ')||'—')+'</div>'+(rows?'<div class="brain-hint-list">'+rows+'</div>':'')+'</div>';
  }
  function v21412StripGeneralSettings(html){
    var keys=['language','theme','showSettingHelp','uiTransparencyPct','fastTravelEnabled','auditEnabled','diagnosticMode','diagnosticSeconds','logSegmentHours','logRetentionDays'];
    keys.forEach(function(k){var re=new RegExp('<div class="setting">(?:(?!<div class="setting">)[\\s\\S])*?data-cfg="'+k+'"(?:(?!<div class="setting">)[\\s\\S])*?<\\/div>','g');html=html.replace(re,'');});return html;
  }
  var v21412BrainHTMLBase=v290BrainHTML;
  v290BrainHTML=function(){return v21412StripGeneralSettings(v21412BrainHTMLBase())+v21412TeachingHTML();};
  var v21412UiClickBase=uiClick;
  uiClick=function(e){var t=e&&e.target&&e.target.closest?e.target.closest('button'):null;if(t&&t.dataset&&t.dataset.action==='brain-hints-save'){var w=S.toolWindows&&S.toolWindows.brain,ta=w&&w.el&&w.el.querySelector('[data-brain-hints]');C.brainTeachingKeywords=safeString(ta?ta.value:'',2000);saveConfig();var n=v21412ApplyTeachingHints();if(character.ctype==='merchant'&&S.explorer)S.explorer.force=true;audit('brain_teaching_hints','Lernhinweise übernommen',{lines:n,tokens:v21412TeachingTokens(),safeFocusOnly:true});renderTool('brain');return;}return v21412UiClickBase(e);};
  CSS+=' .brain-teaching-card{border-color:color-mix(in srgb,var(--accent) 48%,var(--border))!important}.brain-teaching-input{width:100%;min-height:110px;margin:10px 0;padding:9px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font:10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical}.brain-hint-list{margin-top:9px;padding-top:7px;border-top:1px solid var(--line)} ';

  function v21412TerrainPayload(){
    var mapId=String(character.map||''),geo=GD.geometry&&GD.geometry[mapId];if(!geo||!Array.isArray(geo.tiles)||!Array.isArray(geo.placements))return null;
    var sets={},used={};geo.tiles.forEach(function(d){if(d&&d[0]!=null)used[String(d[0])]=1;});Object.keys(used).forEach(function(id){var t=GD.tilesets&&GD.tilesets[id];if(t&&t.file)sets[id]=String(t.file);});
    var out={map:mapId,d:geo.default,t:geo.tiles,p:geo.placements,g:Array.isArray(geo.groups)?geo.groups:[],a:Array.isArray(geo.animations)?geo.animations:[],s:sets,source:'Adventure Land G.geometry/G.tilesets'};
    var bytes=0;try{bytes=JSON.stringify(out).length;}catch(e){return null;}if(bytes>42000)return {map:mapId,omitted:true,bytes:bytes,source:out.source};out.bytes=bytes;return out;
  }
  function v21412ConfidenceName(n){n=Number(n)||0;return n>=.85?'Hoch':n>=.6?'Mittel':'Niedrig';}
  function v21412LearningFeed(){
    var out=[],seen={},recent=(v2149Discovery.recent||[]).slice().reverse();
    recent.forEach(function(rec){if(out.length>=6||!rec)return;var key=rec.key||'',wm=key&&v21411World.entries[(rec.kind||'unknown')+'|'+key],conf=wm?Number(wm.confidence)||0:.35,n=wm?Number(wm.confirmations)||0:0,id=safeString(rec.label||rec.id||rec.type||key,100),service=rec.classification&&rec.classification.service||wm&&wm.what||rec.kind||'Weltobjekt',sig=(rec.kind||'')+'|'+id;if(seen[sig])return;seen[sig]=1;if(n>=2){out.push({icon:'🧠',title:'Neue Erkenntnis',text:'Ich habe bestätigt, dass '+id+' als '+safeString(service,100)+' eingeordnet werden kann.',detail:n+' Beobachtungen/Bestätigungen lieferten ein konsistentes Ergebnis.',confidence:v21412ConfidenceName(conf),confidencePct:Math.round(conf*100),at:Number(rec.at)||clock()});}else{out.push({icon:'🔎',title:'Ich untersuche gerade',text:id+' ist noch nicht ausreichend bestätigt.',detail:'Ich sammle sichere Beobachtungen, bevor daraus eine feste Regel wird.',confidence:v21412ConfidenceName(conf),confidencePct:Math.round(conf*100),at:Number(rec.at)||clock()});}});
    var h=v21411Hyp.slice().reverse().find(function(x){return x&&x.status!=='supported';});if(h&&out.length<8)out.push({icon:'💭',title:'Offene Vermutung',text:safeString(h.text,200),detail:h.source==='user'?'Vom Benutzer als Lernhinweis vorgegeben; wird nur sicher geprüft.':'Automatisch erzeugte Hypothese.',confidence:v21412ConfidenceName(h.confidence),confidencePct:Math.round(Number(h.confidence||0)*100),at:Number(h.lastAt)||clock()});
    var p=v21411Planner();if(p&&p.chosen&&p.chosen.id!=='wait'&&out.length<9)out.push({icon:'💡',title:'Aktuelle Strategie',text:'Momentan bevorzuge ich '+safeString(p.chosen.label,100)+'.',detail:safeString(p.chosen.reason,220),confidence:'Planer',confidencePct:null,at:Number(p.at)||clock()});
    return out.slice(0,9);
  }
  var v21412DashboardBase=dashboardPayload;
  dashboardPayload=function(){var x=v21412DashboardBase();try{x.terrain=v21412TerrainPayload();x.learningFeed=v21412LearningFeed();x.teachingHints={lines:v21412HintLines(),tokens:v21412TeachingTokens()};}catch(e){}return x;};

  audit('feature_contract','2.14.12 bestätigte Merchant-Bankbereinigung + sichere Lernhinweise + Adventure-Land-Terrain + Lernfeed geprüft',{features:FEATURE_CONTRACT,hints:v21412HintLines().length});
'''
bot=bot.replace(marker,section+marker,1)
BOT.write_text(bot,encoding='utf-8')

# Dashboard version/title.
dash=dash.replace('AiO Bot Dashboard 2.14.11','AiO Bot Dashboard 2.14.12')

# Add a real terrain canvas behind the SVG overlay and visible attribution.
old_map='<div class="mapwrap"><svg id="map" aria-label="Live Positionskarte"></svg><div class="maphint">Mausrad = Zoom · Ziehen = Verschieben · Live-Positionen werden automatisch aktualisiert.</div></div>'
new_map='<div class="mapwrap"><canvas id="terrainCanvas" aria-label="Adventure-Land-Terrainkarte"></canvas><svg id="map" aria-label="Live Positionskarte"></svg><div class="maphint">Mausrad = Zoom · Ziehen = Verschieben · Original-Terrain aus Adventure Land G.geometry/G.tilesets · AdventureLandOnlyUse, Quelle: offizielles Open-Source-Spiel.</div></div>'
if old_map not in dash:
    raise SystemExit('dashboard map markup marker missing')
dash=dash.replace(old_map,new_map,1)

learn_section='<details class="dash-section" data-section="learned" open><summary>📚 Was mein Bot gelernt hat</summary><div class="section-body"><section class="braincard learnedcard"><div class="braintop"><h2>Was mein Bot gelernt hat</h2><span class="pill">beobachten · prüfen · bestätigen</span></div><div id="learningFeed" class="learningfeed"><div class="empty">Noch keine bestätigten Erkenntnisse.</div></div></section></div></details>\n'
research_marker='<details class="dash-section" data-section="research" open>'
if research_marker not in dash:
    raise SystemExit('dashboard research marker missing')
dash=dash.replace(research_marker,learn_section+research_marker,1)

css='''\n/* 2.14.12 real terrain + learning feed */\n#terrainCanvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;image-rendering:pixelated;background:#080b0d;pointer-events:none}#map{position:absolute;inset:0;z-index:1}.maphint{max-width:min(760px,calc(100% - 24px))}.learnedcard{border-color:#315f72}.learningfeed{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.learningitem{padding:12px;border:1px solid #2c5064;border-radius:11px;background:#081923}.learningitem .learnhead{display:flex;gap:8px;align-items:center}.learningitem .learnicon{font-size:22px}.learningitem h3{margin:0;font-size:14px}.learningitem p{margin:8px 0 5px;font-size:12px;line-height:1.45}.learningitem small{display:block;color:#8fa9ba;font-size:10px;line-height:1.4}.learnconfidence{display:inline-block;margin-top:8px;padding:4px 7px;border-radius:999px;background:#102b36;border:1px solid #315f72;font-size:10px}.learnconfidence.high{border-color:#2f705d;color:#71e2b7}.learnconfidence.low{border-color:#79622f;color:#ffc85a}\n'''
if '</style>' not in dash:
    raise SystemExit('dashboard style marker missing')
dash=dash.replace('</style>',css+'</style>',1)

terrain_js=r'''
const terrainImages=new Map();
function terrainSource(file){file=String(file||'');if(!file)return '';return /^https?:/i.test(file)?file:'https://adventure.land'+(file.startsWith('/')?'':'/')+file;}
function terrainImage(file){const src=terrainSource(file);if(!src)return Promise.resolve(null);if(terrainImages.has(src))return terrainImages.get(src);const p=new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src;});terrainImages.set(src,p);return p;}
function terrainDims(d){if(!d)return [0,0];if(Array.isArray(d[3]))return [Number(d[3][0])||0,Number(d[3][1])||0];const w=Number(d[3])||0;return [w,Number(d[4])||w];}
function terrainData(){return mapChars().map(c=>c.terrain).find(t=>t&&t.map===selectedMap&&!t.omitted&&Array.isArray(t.t)&&Array.isArray(t.p))||null;}
async function renderTerrain(t){const canvas=document.getElementById('terrainCanvas');if(!canvas||!view)return;const wrap=canvas.parentElement,r=wrap.getBoundingClientRect(),dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));const W=Math.max(1,Math.round(r.width*dpr)),H=Math.max(1,Math.round(r.height*dpr));if(canvas.width!==W)canvas.width=W;if(canvas.height!==H)canvas.height=H;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#080b0d';ctx.fillRect(0,0,W,H);if(!t)return;const ids=[...new Set((t.t||[]).map(d=>d&&String(d[0])).filter(Boolean))],imgs={};await Promise.all(ids.map(async id=>{imgs[id]=await terrainImage((t.s||{})[id]);}));if(terrainData()!==t)return;const sx=W/Math.max(1,view.w),sy=H/Math.max(1,view.h);function drawPlacement(p){const d=t.t&&t.t[p&&p[0]],im=d&&imgs[String(d[0])];if(!d||!im||!p)return;const wh=terrainDims(d),tw=wh[0],th=wh[1];if(!tw||!th)return;const srcX=Number(d[1])||0,srcY=Number(d[2])||0;const x1=Number(p[1])||0,y1=Number(p[2])||0,x2=p[3]==null?x1:Number(p[3]),y2=p[4]==null?y1:Number(p[4]);for(let y=y1;y<=y2;y+=th){if(y+th<view.y||y>view.y+view.h)continue;for(let x=x1;x<=x2;x+=tw){if(x+tw<view.x||x>view.x+view.w)continue;ctx.drawImage(im,srcX,srcY,tw,th,(x-view.x)*sx,(y-view.y)*sy,tw*sx,th*sy);}}}
if(t.d!=null&&t.t[t.d]){const d=t.t[t.d],wh=terrainDims(d),tw=wh[0],th=wh[1];if(tw&&th){const startX=Math.floor(view.x/tw)*tw,startY=Math.floor(view.y/th)*th;for(let y=startY;y<view.y+view.h+th;y+=th)for(let x=startX;x<view.x+view.w+tw;x+=tw)drawPlacement([t.d,x,y]);}}
(t.p||[]).forEach(drawPlacement);(t.a||[]).forEach(drawPlacement);(t.g||[]).forEach(g=>(g||[]).forEach(drawPlacement));}
function renderLearningFeed(){const el=document.getElementById('learningFeed');if(!el)return;const merchant=chars.find(c=>c.role==='merchant')||{},rows=Array.isArray(merchant.learningFeed)?merchant.learningFeed:[];el.innerHTML=rows.length?rows.map(x=>{const cp=x.confidencePct==null?'':` · ${Number(x.confidencePct)}%`,klass=Number(x.confidencePct)>=85?'high':Number(x.confidencePct)<60?'low':'';return `<article class="learningitem"><div class="learnhead"><span class="learnicon">${esc(x.icon||'🧠')}</span><h3>${esc(x.title||'Erkenntnis')}</h3></div><p>${esc(x.text||'')}</p><small>${esc(x.detail||'')}</small><span class="learnconfidence ${klass}">Sicherheit: ${esc(x.confidence||'—')}${cp}</span></article>`;}).join(''):'<div class="empty">Noch keine Lernkarten. Der Bot zeigt hier erst Beobachtungen, Vermutungen und Strategien, die er tatsächlich im eigenen Zustand hat.</div>';}
'''
insert_before='function mapBounds()'
if insert_before not in dash:
    raise SystemExit('dashboard mapBounds marker missing')
dash=dash.replace(insert_before,terrain_js+'\n'+insert_before,1)

# Replace schematic-only map renderer with terrain-aware renderer while keeping overlays.
pat=re.compile(r"function renderMap\(\)\{.*?\nfunction gameSprite",re.S)
m=pat.search(dash)
if not m:
    raise SystemExit('dashboard renderMap function marker missing')
new_render=r'''function renderMap(){if(!view)return;svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);const cs=mapChars(),b=mapBounds(),visual=cs.map(c=>c.mapVisual).find(v=>v&&typeof v==='object')||{},terrain=terrainData();renderTerrain(terrain);let bg=terrain?'':terrainMarkup(b);for(const z of visual.spawns||[]){const x=Math.min(z.x1,z.x2),y=Math.min(z.y1,z.y2),w=Math.abs(z.x2-z.x1),h=Math.abs(z.y2-z.y1);bg+=`<g><rect class="spawn" x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/><text class="spawnlabel" x="${x+8}" y="${y+24}">${esc(z.type||'Spawn')}</text></g>`;}for(const n of visual.npcs||[])bg+=`<g><circle class="npc" cx="${n.x}" cy="${n.y}" r="9"/><text class="npclabel" x="${n.x+15}" y="${n.y+6}">${esc(n.id||'NPC')}</text></g>`;for(const d of visual.doors||[])bg+=`<g><rect class="door" x="${d.x-8}" y="${d.y-8}" width="16" height="16" rx="3"/><text class="doorlabel" x="${d.x+15}" y="${d.y+6}">${esc(d.to||'Übergang')}</text></g>`;const pins=cs.map(c=>`<g class="pin ${c.role==='merchant'?'merchant':''}" transform="translate(${Number(c.x)||0} ${Number(c.y)||0})"><circle class="pulse" r="24"></circle>${mapSprite(c,48)}<text class="sprite-map-label" x="32" y="8">${esc(c.name)}</text></g>`).join('');svg.innerHTML=bg+pins;}
function gameSprite'''
dash=dash[:m.start()]+new_render+dash[m.end():]

old_render="function render(charsNow){const old=selectedMap;chars=charsNow;renderCards();renderMapSelect();if(!view||old!==selectedMap)fitMap();else renderMap();}"
new_render2="function render(charsNow){const old=selectedMap;chars=charsNow;renderCards();renderLearningFeed();renderMapSelect();if(!view||old!==selectedMap)fitMap();else renderMap();}"
if old_render not in dash:
    raise SystemExit('dashboard render wrapper marker missing')
dash=dash.replace(old_render,new_render2,1)
DASH.write_text(dash,encoding='utf-8')

# Keep the embedded Worker dashboard byte-for-byte synced with dashboard.html.
start=worker.index('const DASHBOARD_HTML = ')
q=worker.index('"',start)
i=q+1
while i<len(worker):
    if worker[i]=='\\': i+=2; continue
    if worker[i]=='"' and i+1<len(worker) and worker[i+1]==';':
        end=i+2;break
    i+=1
else:
    raise SystemExit('worker DASHBOARD_HTML terminator missing')
worker=worker[:start]+'const DASHBOARD_HTML = '+json.dumps(dash,ensure_ascii=False)+';'+worker[end:]
WORKER.write_text(worker,encoding='utf-8')

# Release metadata and retained smoke expectations.
ver=json.loads(VER.read_text(encoding='utf-8'))
ver['version']='2.14.12';ver['build']='2026-09-10';ver['dashboardVersion']='2.14.12'
VER.write_text(json.dumps(ver,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for p in (ROOT/'scripts').glob('*'):
    if p.name=='patch-21412.py' or not p.is_file() or p.suffix not in ('.js','.mjs'): continue
    s=p.read_text(encoding='utf-8')
    if '2.14.11' in s:
        p.write_text(s.replace('2.14.11','2.14.12'),encoding='utf-8')

smoke=ROOT/'scripts/smoke-21412-merchant-brain-dashboard.js'
smoke.write_text(r'''const fs=require('fs');
const assert=require('assert');
const bot=fs.readFileSync('bot.js','utf8');
const dash=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.12');
assert.equal(version.dashboardVersion,'2.14.12');
assert(bot.includes("var VERSION = '2.14.12';"));
assert(bot.includes('merchant-bank-cleanup-confirmation'));
assert(bot.includes('function v21412BankCleanupAwaiting'));
assert(bot.includes('merchant_bank_cleanup_confirmed'));
assert(bot.includes('merchant_bank_cleanup_sync_wait'));
assert(bot.includes('beforeExact:v21412InventoryExact'));
assert(bot.includes('💬 Vermutungen & Lernhinweise'));
assert(bot.includes('Ich glaube NPC X verkauft Item Y'));
assert(bot.includes("source:'user'"));
assert(bot.includes('safeFocusOnly:true'));
assert(bot.includes('v21411Words=v21412TeachingTokens'));
assert(bot.includes('function v21412StripGeneralSettings'));
for(const k of ['language','theme','showSettingHelp','uiTransparencyPct','fastTravelEnabled','auditEnabled','diagnosticMode','diagnosticSeconds','logSegmentHours','logRetentionDays']) assert(bot.includes("'"+k+"'"));
assert(bot.includes('function v21412TerrainPayload'));
assert(bot.includes('GD.geometry&&GD.geometry[mapId]'));
assert(bot.includes('GD.tilesets&&GD.tilesets[id]'));
assert(bot.includes('function v21412LearningFeed'));
assert(dash.includes('AiO Bot Dashboard 2.14.12'));
assert(dash.includes('id="terrainCanvas"'));
assert(dash.includes('Original-Terrain aus Adventure Land G.geometry/G.tilesets'));
assert(dash.includes('AdventureLandOnlyUse'));
assert(dash.includes('Was mein Bot gelernt hat'));
assert(dash.includes('function renderLearningFeed'));
assert(dash.includes('function renderTerrain'));
assert(dash.includes('terrainImage'));
assert(worker.includes('AiO Bot Dashboard 2.14.12'));
assert(worker.includes('Was mein Bot gelernt hat'));
console.log('2.14.12 merchant/brain/dashboard smoke OK');
''',encoding='utf-8')
print('patched 2.14.12')
