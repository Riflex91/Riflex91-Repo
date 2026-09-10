from pathlib import Path
import json

ROOT=Path('.')

def replace_once(text, old, new, label):
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected exactly 1 match, got {count}')
    return text.replace(old,new,1)

bot_path=ROOT/'bot.js'
bot=bot_path.read_text(encoding='utf-8')
bot=replace_once(bot,'/* Adventure Land • AiO Bot 2.14.13 | 2026-09-10','/* Adventure Land • AiO Bot 2.14.14 | 2026-09-10','bot header')
bot=replace_once(bot,"  var VERSION = '2.14.13';","  var VERSION = '2.14.14';",'bot VERSION')

old_contract='''    'brain-world-model','brain-safe-experiments','brain-planner','brain-explainability','brain-module-permissions','dashboard-game-sprites',
    'merchant-bank-cleanup-confirmation','brain-teaching-hints','dashboard-terrain-tiles','dashboard-learning-feed'
  ];'''
new_contract='''    'brain-world-model','brain-safe-experiments','brain-planner','brain-explainability','brain-module-permissions','dashboard-game-sprites',
    'merchant-bank-cleanup-confirmation','brain-teaching-hints','dashboard-terrain-tiles','dashboard-learning-feed',
    'merchant-performance-budget','merchant-performance-telemetry','dashboard-terrain-pass-through','dashboard-vector-map-fallback','cloud-unconfigured-idle'
  ];'''
bot=replace_once(bot,old_contract,new_contract,'FEATURE_CONTRACT 2.14.14')

needle="if(Number(S.brain.usedToday)>=v210BudgetTarget())return false;S.brainBusy=true;"
replacement="if(Number(S.brain.usedToday)>=v210BudgetTarget())return false;if(!v21414CloudConfigured()){S.brain.lastAt=now;S.brain.lastError='';v211MaybeApplyPolicy(pred);return false;}S.brainBusy=true;"
bot=replace_once(bot,needle,replacement,'brain unconfigured guard')

needle="if(clock()>(S.times.stateAudit||0)){S.times.stateAudit=clock()+1000;v273UpdateSessionRates();stateAuditTick();}"
replacement="if(clock()>(S.times.stateAudit||0)){S.times.stateAudit=clock()+(character.ctype==='merchant'?2000:1000);v273UpdateSessionRates();stateAuditTick();}"
bot=replace_once(bot,needle,replacement,'merchant state audit cadence')

needle="if(typeof loot==='function'&&clock()>(S.times.loot||0)&&!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)){S.times.loot=clock()+900;action('Loot einsammeln',function(){return loot();},'loot-action',800);}"
replacement="if(typeof loot==='function'&&clock()>(S.times.loot||0)&&!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)){var lootCadence=character.ctype==='merchant'?(S.moveInFlight||character.moving?2600:1600):900;S.times.loot=clock()+lootCadence;action('Loot einsammeln',function(){return loot();},'loot-action',800);}"
bot=replace_once(bot,needle,replacement,'merchant loot cadence')

needle="var timer=P.setInterval(tick,350),uiTimer=P.setInterval(function(){renderAll(false);},1500);"
replacement="var timer=P.setInterval(tick,350),uiCadence=character.ctype==='merchant'?2500:1500,uiTimer=P.setInterval(function(){renderAll(false);},uiCadence);"
bot=replace_once(bot,needle,replacement,'merchant UI cadence')

insert_marker='''  audit('feature_contract','2.14.12 bestätigte Merchant-Bankbereinigung + sichere Lernhinweise + Adventure-Land-Terrain + Lernfeed geprüft',{features:FEATURE_CONTRACT,hints:v21412HintLines().length});


  // Preserve references so dispose can distinguish our CM handler on engines that support function identity.'''
block=r'''  audit('feature_contract','2.14.12 bestätigte Merchant-Bankbereinigung + sichere Lernhinweise + Adventure-Land-Terrain + Lernfeed geprüft',{features:FEATURE_CONTRACT,hints:v21412HintLines().length});


  // ---------------------------------------------------------------------------
  // 2.14.14 Merchant performance budget + resilient dashboard terrain pipeline.
  // ---------------------------------------------------------------------------
  ['merchant-performance-budget','merchant-performance-telemetry','dashboard-terrain-pass-through','dashboard-vector-map-fallback','cloud-unconfigured-idle'].forEach(function(f){if(FEATURE_CONTRACT.indexOf(f)<0)FEATURE_CONTRACT.push(f);});

  function v21414CloudConfigured(){
    return !!(String(C.webDashboardConnectionUrl||'').trim()&&String(C.webDashboardWriteKey||'').trim()&&v290Endpoint('/api/state'));
  }
  var v21414CloudSyncBase=v290CloudSyncTick;
  v290CloudSyncTick=function(force){
    if(!v21414CloudConfigured()){if(S.cloudSync)S.cloudSync.lastError='';return false;}
    return v21414CloudSyncBase(force);
  };

  function v21414SellSignature(){
    return freeSlots()+'|'+(character.items||[]).map(function(it){return it?[it.name,Number(it.level)||0,Number(it.q)||1,it.l?1:0,it.p||''].join(':'):'-';}).join(',');
  }
  var v21414SellCandidateBase=v2144FindSellCandidate;
  v2144FindSellCandidate=function(){
    var now=clock(),sig=v21414SellSignature(),c=S.sellCandidate21414;
    if(c&&c.sig===sig&&now-Number(c.at||0)<1400)return c.value;
    var value=v21414SellCandidateBase();
    S.sellCandidate21414={at:now,sig:sig,value:value};
    return value;
  };

  var v21414ServiceCandidatesBase=v277MerchantServiceCandidates;
  v277MerchantServiceCandidates=function(){
    var now=clock(),c=S.serviceCandidates21414;
    if(c&&now-Number(c.at||0)<850)return c.rows;
    var rows=v21414ServiceCandidatesBase();
    S.serviceCandidates21414={at:now,rows:rows};
    return rows;
  };

  var v21414AnalyzeRecipesBase=v278AnalyzeRecipes;
  v278AnalyzeRecipes=function(force){
    var now=clock();
    if(!force&&S.recipeAnalysis&&now-Number(S.recipeAnalysis.at||0)<8000)return S.recipeAnalysis;
    return v21414AnalyzeRecipesBase(force);
  };

  function v21414CompactMerchantPlan(p){
    if(!p||typeof p!=='object')return null;
    var j=p.job||{},r=j.recipe||{},m=j.material||null;
    return {
      at:Number(p.at)||0,
      output:j.rootOutput||r.output||r.id||'',
      recipient:j.targetRecipient||'',
      material:m?{name:m.name,level:Number(m.level)||0,required:Number(m.required)||0,have:Number(m.have)||0}:null,
      farmOrder:p.farmOrder?{item:p.farmOrder.item,required:Number(p.farmOrder.required)||0,have:Number(p.farmOrder.have)||0,monster:p.farmOrder.monster||''}:null,
      farmGoal:p.farmGoal?{map:p.farmGoal.map||'',monster:p.farmGoal.monster||''}:null,
      steps:(p.steps||[]).slice(0,4).map(function(x){return safeString(x,180);})
    };
  }
  function v21414CompactMoveTarget(t){
    if(typeof t==='string')return t;
    if(!t||typeof t!=='object')return t;
    return {map:t.map||'',x:isFinite(Number(t.x))?Math.round(Number(t.x)):null,y:isFinite(Number(t.y))?Math.round(Number(t.y)):null,name:t.name||'',npc:t.npc||'',source:t.source||'',type:t.type||''};
  }

  var v21414AuditBase=audit;
  audit=function(kind,message,data,level){
    var now=clock(),d=data;
    if(kind==='merchant_economy_decision'){
      var item=d&&d.item||'',dec=d&&d.decision||{},sig=[item,d&&d.level,d&&d.quantity,dec.reason,dec.sell].join('|');
      if(S.economyAudit21414&&S.economyAudit21414.sig===sig&&now-S.economyAudit21414.at<5000)return null;
      S.economyAudit21414={sig:sig,at:now};
    }
    if(kind==='diag_update'){
      var usig=JSON.stringify([d&&d.version,d&&d.latest,d&&d.available,d&&d.checking,d&&d.applying,d&&d.error]);
      if(S.updateAudit21414&&S.updateAudit21414.sig===usig&&now-S.updateAudit21414.at<30000)return null;
      S.updateAudit21414={sig:usig,at:now};
    }
    if(kind==='state_change'&&d&&typeof d==='object'){
      var keys=Object.keys(d),noisy=keys.length&&keys.every(function(k){return k==='x'||k==='y'||k==='conditions'||k==='ping'||k==='q'||k==='moving';});
      if(noisy&&S.stateAudit21414&&now-S.stateAudit21414<2500)return null;
      if(noisy)S.stateAudit21414=now;
    }
    if(kind==='diag_merchant'&&d&&d.plan)d=Object.assign({},d,{plan:v21414CompactMerchantPlan(d.plan)});
    if(kind==='move'&&d&&d.smartDestination&&typeof d.smartDestination==='object')d=Object.assign({},d,{smartDestination:v21414CompactMoveTarget(d.smartDestination)});
    return v21414AuditBase(kind,message,d,level);
  };

  v2145EconomyMaintenanceTick=function(){
    if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc)return false;
    var now=clock(),lock=S.moveArbiter2145;
    if(lock&&String(lock.kind||'').indexOf('merchant-npc-sell')>=0&&v2145MoveLockActive(lock))return true;
    var pressured=freeSlots()<=Math.max(2,Number(C.merchantInventoryReserve||5)+1),gap=pressured?1400:10000;
    if(now<Number(S.times.economy2145||0))return false;
    S.times.economy2145=now+gap;
    var cand=v2144FindSellCandidate();if(!cand)return false;
    var urgent=false;try{urgent=(v277MerchantServiceCandidates()||[]).some(function(x){return x&&x.urgent;});}catch(e){}
    if(!pressured&&urgent)return false;
    var acted=v273SellTrashTick();
    return !!acted||pressured;
  };

  function v21414CompactLines(rows,limit){
    if(!Array.isArray(rows)||!rows.length)return [];
    var step=Math.max(1,Math.ceil(rows.length/Math.max(1,limit))),out=[];
    for(var i=0;i<rows.length&&out.length<limit;i+=step){
      var r=rows[i];if(!Array.isArray(r)||r.length<3)continue;
      var a=Number(r[0]),b=Number(r[1]),c=Number(r[2]);if(isFinite(a)&&isFinite(b)&&isFinite(c))out.push([a,b,c]);
    }
    return out;
  }
  var v21414TerrainBase=v21412TerrainPayload;
  v21412TerrainPayload=function(){
    var out=v21414TerrainBase(),mapId=String(character.map||''),geo=GD.geometry&&GD.geometry[mapId];
    if(out&&out.omitted&&geo){
      out.v={x:v21414CompactLines(geo.x_lines,420),y:v21414CompactLines(geo.y_lines,420)};
      out.fallback='collision-lines';
    }
    return out;
  };
  function v21414TerrainOwner(mapId){
    var now=clock(),names=[];
    C.roster.forEach(function(name){
      if(name===me){if(character.map===mapId)names.push(name);return;}
      var r=peerReport(name);if(r&&r.active!==false&&!r.rip&&r.map===mapId&&now-Number(r.at||0)<45000)names.push(name);
    });
    if(names.indexOf(me)<0&&character.map===mapId)names.push(me);
    names.sort();
    return names[0]||me;
  }
  var v21414DashboardBase=dashboardPayload;
  dashboardPayload=function(){
    var x=v21414DashboardBase();
    if(x&&x.terrain&&v21414TerrainOwner(String(x.map||character.map))!==me)x.terrain=null;
    return x;
  };

  function v21414PerfNow(){try{return P.performance&&typeof P.performance.now==='function'?P.performance.now():clock();}catch(e){return clock();}}
  var v21414RenderBase=renderAll;
  renderAll=function(force){
    if(character.ctype!=='merchant')return v21414RenderBase(force);
    var p=S.performance21414||(S.performance21414={tickN:0,tickSum:0,tickMax:0,tickSlow:0,renderN:0,renderSum:0,renderMax:0,lastAt:clock()}),t=v21414PerfNow();
    try{return v21414RenderBase(force);}finally{var ms=Math.max(0,v21414PerfNow()-t);p.renderN++;p.renderSum+=ms;p.renderMax=Math.max(p.renderMax,ms);}
  };
  var v21414TickBase=tick;
  tick=function(){
    if(character.ctype!=='merchant')return v21414TickBase();
    var p=S.performance21414||(S.performance21414={tickN:0,tickSum:0,tickMax:0,tickSlow:0,renderN:0,renderSum:0,renderMax:0,lastAt:clock()}),t=v21414PerfNow();
    try{return v21414TickBase();}finally{
      var ms=Math.max(0,v21414PerfNow()-t);p.tickN++;p.tickSum+=ms;p.tickMax=Math.max(p.tickMax,ms);if(ms>=16)p.tickSlow++;
      var now=clock();if(now-p.lastAt>=15000){
        var mem=null;try{var pm=P.performance&&P.performance.memory;if(pm)mem={usedMB:Math.round(Number(pm.usedJSHeapSize||0)/1048576*10)/10,totalMB:Math.round(Number(pm.totalJSHeapSize||0)/1048576*10)/10,limitMB:Math.round(Number(pm.jsHeapSizeLimit||0)/1048576)};}catch(e){}
        audit('merchant_performance_sample','Merchant-Laufzeitprofil',{windowMs:now-p.lastAt,tickCount:p.tickN,tickAvgMs:Math.round((p.tickSum/Math.max(1,p.tickN))*100)/100,tickMaxMs:Math.round(p.tickMax*100)/100,ticksOver16Ms:p.tickSlow,renderCount:p.renderN,renderAvgMs:Math.round((p.renderSum/Math.max(1,p.renderN))*100)/100,renderMaxMs:Math.round(p.renderMax*100)/100,heap:mem,auditRecent:S.auditRecent.length,auditQueue:S.auditQueue.length,free:freeSlots(),moving:!!(character.moving||S.moveInFlight)});
        S.performance21414={tickN:0,tickSum:0,tickMax:0,tickSlow:0,renderN:0,renderSum:0,renderMax:0,lastAt:now};
      }
    }
  };

  audit('feature_contract','2.14.14 Merchant-Performancebudget + Laufzeittelemetrie + Dashboard-Terrain-Pipeline geprüft',{features:FEATURE_CONTRACT,cloudConfigured:v21414CloudConfigured()});


  // Preserve references so dispose can distinguish our CM handler on engines that support function identity.'''
bot=replace_once(bot,insert_marker,block,'2.14.14 runtime block')
bot_path.write_text(bot,encoding='utf-8')

vp=ROOT/'version.json'
v=json.loads(vp.read_text(encoding='utf-8'))
if v.get('version')!='2.14.13' or v.get('dashboardVersion')!='2.14.13': raise SystemExit(f'unexpected version baseline {v}')
v['version']='2.14.14';v['dashboardVersion']='2.14.14'
vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

dp=ROOT/'cloudflare-dashboard'/'dashboard.html'
dash=dp.read_text(encoding='utf-8')
if 'AiO Bot Dashboard 2.14.13' not in dash: raise SystemExit('dashboard baseline title missing')
dash=dash.replace('2.14.13','2.14.14')
dash=replace_once(dash,
    ".sprite-map-label{paint-order:stroke;stroke:#06151c;stroke-width:5px;fill:#fff;font-size:22px;font-weight:800}",
    ".sprite-map-label{paint-order:stroke;stroke:#06151c;stroke-width:5px;fill:#fff;font-size:22px;font-weight:800}.terrain-wall{stroke:#8fc7c080;stroke-width:2;vector-effect:non-scaling-stroke}.terrain-wall.x{stroke:#71b5c080}.terrain-wall.y{stroke:#a5d8b980}",
    'dashboard vector terrain css')
old='''function terrainDims(d){if(!d)return [0,0];if(Array.isArray(d[3]))return [Number(d[3][0])||0,Number(d[3][1])||0];const w=Number(d[3])||0;return [w,Number(d[4])||w];}
function terrainData(){return mapChars().map(c=>c.terrain).find(t=>t&&t.map===selectedMap&&!t.omitted&&Array.isArray(t.t)&&Array.isArray(t.p))||null;}
async function renderTerrain(t){'''
new='''function terrainDims(d){if(!d)return [0,0];if(Array.isArray(d[3]))return [Number(d[3][0])||0,Number(d[3][1])||0];const w=Number(d[3])||0;return [w,Number(d[4])||w];}
function terrainMeta(){return mapChars().map(c=>c.terrain).find(t=>t&&t.map===selectedMap)||null;}
function terrainData(){const t=terrainMeta();return t&&!t.omitted&&Array.isArray(t.t)&&Array.isArray(t.p)?t:null;}
function terrainVectorMarkup(t){if(!t||!t.v)return '';let s='';for(const l of t.v.x||[]){if(Array.isArray(l)&&l.length>=3)s+=`<line class="terrain-wall x" x1="${Number(l[0])||0}" y1="${Number(l[1])||0}" x2="${Number(l[0])||0}" y2="${Number(l[2])||0}"/>`;}for(const l of t.v.y||[]){if(Array.isArray(l)&&l.length>=3)s+=`<line class="terrain-wall y" x1="${Number(l[1])||0}" y1="${Number(l[0])||0}" x2="${Number(l[2])||0}" y2="${Number(l[0])||0}"/>`;}return s;}
function terrainGridMarkup(b){const sx=Math.max(120,Math.round((b.maxX-b.minX)/10)),sy=Math.max(120,Math.round((b.maxY-b.minY)/8));let s='';for(let x=Math.floor(b.minX/sx)*sx;x<=b.maxX;x+=sx)s+=`<line class="gridline" x1="${x}" y1="${b.minY-500}" x2="${x}" y2="${b.maxY+500}"/>`;for(let y=Math.floor(b.minY/sy)*sy;y<=b.maxY;y+=sy)s+=`<line class="gridline" x1="${b.minX-500}" y1="${y}" x2="${b.maxX+500}" y2="${y}"/>`;return s;}
async function renderTerrain(t){'''
dash=replace_once(dash,old,new,'dashboard terrain helpers')
old="const cs=mapChars(),b=mapBounds(),visual=cs.map(c=>c.mapVisual).find(v=>v&&typeof v==='object')||{},terrain=terrainData();renderTerrain(terrain);let bg=terrain?'':terrainMarkup(b);"
new="const cs=mapChars(),b=mapBounds(),visual=cs.map(c=>c.mapVisual).find(v=>v&&typeof v==='object')||{},terrain=terrainData(),terrainInfo=terrainMeta();renderTerrain(terrain);let bg=terrainInfo&&terrainInfo.v?terrainVectorMarkup(terrainInfo):(terrain?terrainGridMarkup(b):terrainMarkup(b));"
dash=replace_once(dash,old,new,'dashboard terrain render fallback')
dash=replace_once(dash,'Original-Terrain aus Adventure Land G.geometry/G.tilesets · AdventureLandOnlyUse, Quelle: offizielles Open-Source-Spiel.','Original-Terrain aus Adventure Land G.geometry/G.tilesets; bei großen/fehlenden Tilesets echte G.geometry-Kollisionslinien als Vektor-Fallback · AdventureLandOnlyUse.','dashboard map hint')
dp.write_text(dash,encoding='utf-8')

wp=ROOT/'cloudflare-dashboard'/'src'/'worker.js'
worker=wp.read_text(encoding='utf-8').replace('2.14.13','2.14.14')
clean_marker="function cleanStatus(input){"
helpers=r'''function cleanTerrainTuple(row,max){
  if(!Array.isArray(row))return null;
  return row.slice(0,max||6).map((v,i)=>Array.isArray(v)?v.slice(0,4).map(n=>number(n)):(typeof v==="string"?text(v,120):number(v)));
}
function cleanTerrainRows(rows,limit,max){return Array.isArray(rows)?rows.slice(0,limit).map(r=>cleanTerrainTuple(r,max)).filter(Boolean):[];}
function cleanTerrain(input){
  if(!input||typeof input!=="object")return null;
  const vector=input.v&&typeof input.v==="object"?{x:cleanTerrainRows(input.v.x,420,3),y:cleanTerrainRows(input.v.y,420,3)}:null;
  const base={map:text(input.map,80),source:text(input.source,160),omitted:Boolean(input.omitted),bytes:number(input.bytes),fallback:text(input.fallback,80),v:vector};
  if(input.omitted)return base;
  const sets={};Object.keys(input.s&&typeof input.s==="object"?input.s:{}).slice(0,48).forEach(k=>{sets[text(k,80)]=text(input.s[k],500);});
  const groups=Array.isArray(input.g)?input.g.slice(0,64).map(g=>cleanTerrainRows(g,240,6)).filter(g=>g.length):[];
  const out=Object.assign({},base,{d:input.d==null?null:number(input.d),t:cleanTerrainRows(input.t,640,6),p:cleanTerrainRows(input.p,2600,6),g:groups,a:cleanTerrainRows(input.a,500,6),s:sets});
  try{if(JSON.stringify(out).length>46000)return Object.assign({},base,{omitted:true,fallback:base.fallback||"worker-size-guard"});}catch{}
  return out;
}
function cleanLearningFeed(input){return Array.isArray(input)?input.slice(0,9).map(x=>x&&typeof x==="object"?{icon:text(x.icon,12),title:text(x.title,100),text:text(x.text,260),detail:text(x.detail,320),confidence:text(x.confidence,40),confidencePct:x.confidencePct==null?null:number(x.confidencePct),at:number(x.at)}:null).filter(Boolean):[];}
function cleanTeachingHints(input){return input&&typeof input==="object"?{lines:Array.isArray(input.lines)?input.lines.slice(0,20).map(x=>text(x,180)):[],tokens:Array.isArray(input.tokens)?input.tokens.slice(0,40).map(x=>text(x,80)):[]}:null;}
function cleanSprite(input){return input&&typeof input==="object"?{skin:text(input.skin,80),file:text(input.file,500),row:number(input.row),column:number(input.column),rows:number(input.rows,1),columns:number(input.columns,1)}:null;}
function cleanBrainExplanation(input){if(!input||typeof input!=="object")return null;const w=input.world&&typeof input.world==="object"?input.world:{};return {current:text(input.current,220),why:text(input.why,420),next:text(input.next,300),learned:text(input.learned,360),confidenceLabel:text(input.confidenceLabel,60),confidencePct:number(input.confidencePct),repetitions:number(input.repetitions),world:{total:number(w.total),stale:number(w.stale),lowConfidence:number(w.lowConfidence),gameVersion:text(w.gameVersion,60),hypotheses:number(w.hypotheses),supported:number(w.supported)}};}

function cleanStatus(input){'''
worker=replace_once(worker,clean_marker,helpers,'worker sanitizers')
tail=':null,brain:input.brain&&typeof input.brain==="object"?input.brain:null,updatedAt:number(input.updatedAt,Date.now())};'
newtail=':null,terrain:cleanTerrain(input.terrain),learningFeed:cleanLearningFeed(input.learningFeed),teachingHints:cleanTeachingHints(input.teachingHints),sprite:cleanSprite(input.sprite),skin:text(input.skin,80),brainExplanation:cleanBrainExplanation(input.brainExplanation),brain:input.brain&&typeof input.brain==="object"?input.brain:null,updatedAt:number(input.updatedAt,Date.now())};'
worker=replace_once(worker,tail,newtail,'worker cleanStatus pass-through')
start=worker.index('const DASHBOARD_HTML = ');q=worker.index('"',start);i=q+1
while i<len(worker):
    if worker[i]=='\\': i+=2; continue
    if worker[i]=='"' and i+1<len(worker) and worker[i+1]==';': end=i+2;break
    i+=1
else: raise SystemExit('worker DASHBOARD_HTML terminator missing')
worker=worker[:start]+'const DASHBOARD_HTML = '+json.dumps(dash,ensure_ascii=False)+';'+worker[end:]
wp.write_text(worker,encoding='utf-8')

pp=ROOT/'cloudflare-dashboard'/'package.json'
pkg=json.loads(pp.read_text(encoding='utf-8'))
if pkg.get('version')!='2.14.13': raise SystemExit('unexpected dashboard package version')
pkg['version']='2.14.14'
pp.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

vr=ROOT/'scripts'/'verify-release.js'
verify=vr.read_text(encoding='utf-8').replace('2.14.13','2.14.14')
feature_tail='  "merchant-bank-cleanup-confirmation","brain-teaching-hints","dashboard-terrain-tiles","dashboard-learning-feed"\n];'
feature_new='  "merchant-bank-cleanup-confirmation","brain-teaching-hints","dashboard-terrain-tiles","dashboard-learning-feed",\n  "merchant-performance-budget","merchant-performance-telemetry","dashboard-terrain-pass-through","dashboard-vector-map-fallback","cloud-unconfigured-idle"\n];'
verify=replace_once(verify,feature_tail,feature_new,'verify requiredFeatures 21414')
final='if (!process.exitCode) console.log(`Regression checks OK · ${requiredFeatures.length} protected features · version ${version.version} · Brain v2.14 · Research Bridge · Merchant stability hotfix`);'
checks=r'''for (const feature of ["merchant-performance-budget","merchant-performance-telemetry","dashboard-terrain-pass-through","dashboard-vector-map-fallback","cloud-unconfigured-idle"]) ok(contract.includes(feature), `2.14.14 protected feature missing: ${feature}`);
ok(bot.includes("function v21414CloudConfigured"), "2.14.14 cloud configuration guard missing");
ok(bot.includes("now-Number(c.at||0)<1400"), "2.14.14 sell candidate cache missing");
ok(bot.includes("now-Number(c.at||0)<850"), "2.14.14 service candidate cache missing");
ok(bot.includes("now-Number(S.recipeAnalysis.at||0)<8000"), "2.14.14 recipe analysis budget missing");
ok(bot.includes("lootCadence=character.ctype==='merchant'"), "2.14.14 Merchant loot cadence missing");
ok(bot.includes("merchant_performance_sample"), "2.14.14 Merchant performance telemetry missing");
ok(bot.includes("v21414CompactMoveTarget"), "2.14.14 move audit compaction missing");
ok(worker.includes("terrain:cleanTerrain(input.terrain)"), "Worker strips terrain telemetry");
ok(worker.includes("learningFeed:cleanLearningFeed(input.learningFeed)"), "Worker strips learning feed");
ok(worker.includes("sprite:cleanSprite(input.sprite)"), "Worker strips sprite metadata");
ok(worker.includes("brainExplanation:cleanBrainExplanation(input.brainExplanation)"), "Worker strips explainability metadata");
ok(dash.includes("function terrainVectorMarkup"), "dashboard vector terrain fallback missing");
ok(dash.includes("function terrainMeta"), "dashboard terrain metadata selection missing");

''' + final.replace('Merchant stability hotfix','Merchant performance + terrain pipeline')
verify=replace_once(verify,final,checks,'verify 2.14.14 checks')
vr.write_text(verify,encoding='utf-8')

for p in (ROOT/'scripts').glob('smoke*'):
    if not p.is_file() or p.suffix not in ('.js','.mjs'): continue
    s=p.read_text(encoding='utf-8')
    s=s.replace(r'2\.14\.13',r'2\.14\.14').replace('2.14.13','2.14.14')
    p.write_text(s,encoding='utf-8')

smoke=r'''const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const dash=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));

assert.equal(version.version,'2.14.14');
assert.equal(version.dashboardVersion,'2.14.14');
assert(bot.includes("var VERSION = '2.14.14';"));
const contractMatch=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);
assert(contractMatch);
const contract=JSON.parse(contractMatch[1].replace(/'/g,'"'));
for(const f of ['merchant-performance-budget','merchant-performance-telemetry','dashboard-terrain-pass-through','dashboard-vector-map-fallback','cloud-unconfigured-idle']) assert(contract.includes(f),f);

assert(bot.includes("gap=pressured?1400:10000"));
assert(bot.includes("now-Number(c.at||0)<1400"));
assert(bot.includes("now-Number(c.at||0)<850"));
assert(bot.includes("now-Number(S.recipeAnalysis.at||0)<8000"));
assert(bot.includes("character.ctype==='merchant'?(S.moveInFlight||character.moving?2600:1600):900"));
assert(bot.includes("character.ctype==='merchant'?2500:1500"));
assert(bot.includes("merchant_performance_sample"));
assert(bot.includes("v21414CompactMoveTarget"));
assert(bot.includes("v21414CompactMerchantPlan"));
assert(bot.includes("v21414TerrainOwner"));
assert(bot.includes("fallback='collision-lines'"));

const helperStart=worker.indexOf('function cleanTerrainTuple');
const helperEnd=worker.indexOf('\n\nasync function ensureAiTables',helperStart);
assert(helperStart>=0&&helperEnd>helperStart,'Worker sanitizer block missing');
const ctx={text:(v,max)=>String(v==null?'':v).slice(0,max||500),number:(v,d=0)=>Number.isFinite(Number(v))?Number(v):d,Date};
vm.createContext(ctx);
vm.runInContext(worker.slice(helperStart,helperEnd),ctx);
const cleaned=ctx.cleanStatus({
  type:'aio-bot-status',version:6,botVersion:'2.14.14',name:'Ranger1',ctype:'ranger',role:'dps',
  map:'main',x:10,y:20,updatedAt:123,
  terrain:{map:'main',d:0,t:[['forest',0,0,32,32]],p:[[0,0,0,64,64]],g:[],a:[],s:{forest:'/images/tiles/map/forest.png'},source:'Adventure Land G.geometry/G.tilesets',bytes:1234},
  learningFeed:[{icon:'x',title:'seen',text:'fact',detail:'data',confidence:'high',confidencePct:90,at:1}],
  sprite:{skin:'ranger',file:'/images/characters/ranger.png',row:0,column:1,rows:4,columns:4},
  brainExplanation:{current:'work',why:'reason',world:{total:3,gameVersion:'15623'}}
});
assert(cleaned,'cleanStatus rejected valid payload');
assert(cleaned.terrain&&cleaned.terrain.t.length===1&&cleaned.terrain.p.length===1,'terrain stripped');
assert.equal(cleaned.terrain.s.forest,'/images/tiles/map/forest.png');
assert.equal(cleaned.learningFeed.length,1,'learning feed stripped');
assert(cleaned.sprite&&cleaned.sprite.file.includes('ranger.png'),'sprite stripped');
assert(cleaned.brainExplanation&&cleaned.brainExplanation.current==='work','brain explanation stripped');

assert(dash.includes('AiO Bot Dashboard 2.14.14'));
assert(dash.includes('function terrainMeta'));
assert(dash.includes('function terrainVectorMarkup'));
assert(dash.includes('function terrainGridMarkup'));
assert(dash.includes('G.geometry-Kollisionslinien als Vektor-Fallback'));
assert(worker.includes('AiO Bot Dashboard 2.14.14'));
console.log('2.14.14 Merchant performance / dashboard terrain smoke OK');
'''
(ROOT/'scripts'/'smoke-21414-performance-dashboard.js').write_text(smoke,encoding='utf-8')

print('Prepared AiO Bot 2.14.14 Merchant performance + dashboard terrain patch')
