export const DASHBOARD_FRAGMENT_3 = `  <p>Verbinde dich mit dem v3-Dashboard. Der READ_KEY öffnet die Telemetrie; mit ADMIN_KEY werden Einstellungen freigeschaltet.</p>
  <div class="field"><label>READ_KEY</label><input id="readKey" type="password" autocomplete="off"></div>
  <div class="field"><label>ADMIN_KEY <span class="sub">optional</span></label><input id="adminKey" type="password" autocomplete="off"></div>
  <button class="btn" id="open">Kommandozentrale öffnen</button>
  <div id="loginError" style="margin-top:12px"></div>
</section>

<div class="hidden" id="app">
  <section class="page active" data-page="overview">
    <div class="pagehead"><div><h1>Übersicht</h1><p>Nur das Wesentliche: wie viel Cloud-Spielraum noch übrig ist.</p></div><span class="pill" id="overviewTime">–</span></div>
    <div class="capacity-deck" id="capacityDeck"></div>
  </section>

  <section class="page" data-page="characters">
    <div class="pagehead"><div><h1>Charaktere</h1><p>Live-Zustand, Ressourcen und aktuelle Arbeit der Party.</p></div></div>
    <div class="chargrid" id="characterCards"></div>
  </section>

  <section class="page" data-page="automation">
    <div class="pagehead"><div><h1>Automation</h1><p>Alle bekannten Adventure-Land-Items und Materialien suchen, filtern und pro Aktion freigeben oder sperren.</p></div><span class="pill" id="automationCount">0 Items</span></div>
    <div class="automation-toolbar">
      <input id="automationSearch" placeholder="Name, ID, Typ, NPC oder Material suchen …">
      <select id="automationType"><option value="">Alle Typen</option></select>
      <select id="automationClass"><option value="">Alle Klassen</option><option>warrior</option><option>paladin</option><option>priest</option><option>ranger</option><option>rogue</option><option>mage</option><option>merchant</option></select>
      <select id="automationNpc"><option value="">Alle NPCs</option></select>
      <input id="automationLevelMin" type="number" min="0" placeholder="Level min">
      <input id="automationLevelMax" type="number" min="0" placeholder="Level max">
      <select id="automationCapability"><option value="">Alle Fähigkeiten</option><option value="upgrade">Verbesserbar</option><option value="compound">Kombinierbar</option><option value="npc">Beim NPC</option><option value="protected">Geschützt/Spezial</option></select>
    </div>
    <div class="automation-policy">
      <label for="automationMaxCompound"><span>Max. Compound / Combine-Level</span><input id="automationMaxCompound" type="number" min="0" max="10" step="1"></label>
      <button class="btn" id="saveAutomationMaxCompound">Compound-Limit speichern</button>
      <span class="sub">Gilt global für automatische Compounds · Hard Cap +10</span>
    </div>
    <div class="notice">Rechtsklick auf ein Item öffnet dieselben Regeln wie im Charakter-Inventar: Auto / Erlauben / Verbieten für Verkaufen, Bank, Kombinieren und Verbessern.</div>
    <div id="automationCatalogHealth" class="notice">Item-Datenbank wird geprüft …</div>
    <div id="automationGrid" class="automation-grid"></div>
  </section>

  <section class="page" data-page="economy">
    <div class="pagehead"><div><h1>Merchant & Economy</h1><p>Service, Inventar, Gear, Marktgedächtnis und Progressions-Limits.</p></div></div>
    <div class="grid" id="economyGrid"></div>
  </section>

  <section class="page" data-page="brain">
    <div class="pagehead"><div><h1>Gehirn</h1><p>Ein Blick in die strategische Denkmaschine: beobachten, bewerten, lernen.</p></div></div>
    <div id="brainRoot"></div>
  </section>

  <section class="page" data-page="settings">
    <div class="pagehead"><div><h1>Einstellungen</h1><p>Die Bot-Kommandozentrale: wenige Ebenen, klare Gruppen, sichere Grenzen.</p></div><div class="settings-summary"><span class="pill" id="settingsRevision">Revision –</span><span class="pill" id="dirtyPill">0 Änderungen</span></div></div>
    <div class="command-shell">
      <div class="command-banner">
        <div class="command-title"><small>COMMAND AUTHORITY</small><b>Strategie steuern. Safety bleibt unverhandelbar.</b></div>
        <div class="command-lights"><span class="pill good"><i class="dot"></i>Safety aktiv</span><span class="pill" id="adminModePill">Read-only</span></div>
      </div>
      <div class="command-toolbar">
        <div class="settings-search"><input id="settingsSearch" placeholder="Befehl oder Einstellung suchen …"></div>
        <div class="settings-actions"><button class="btn ghost" id="expandSettings">Öffnen</button><button class="btn ghost" id="collapseSettings">Schließen</button><button class="btn alt" id="discardSettings">Verwerfen</button><button class="btn" id="saveSettings" disabled>Speichern</button></div>
      </div>
      <div id="settingsNotice"></div>
      <div id="settingsRoot"></div>
    </div>
  </section>

  <section class="page" data-page="events">
    <div class="pagehead"><div><h1>Events</h1><p>Nur Meldungen, die wirklich etwas bedeuten. Grün = gut, Gelb = Warnung, Rot = kritisch.</p></div><button class="btn alt" id="reloadEvents">Neu laden</button></div>
    <div class="events" id="eventsRoot"></div>
  </section>

</div>
</main>

<div id="toast" class="toast hidden"></div>
<script>
(function(){
const pages=[['overview','Übersicht'],['characters','Charaktere'],['automation','Automation'],['economy','Merchant & Economy'],['brain','Gehirn'],['settings','Einstellungen'],['events','Events']];
const categoryIcons={'Runtime':'⏱','Party & Formation':'👥','Kampf & Risiko':'⚔','Fernkampf & Kiting':'🏹','Skills & Ressourcen':'✨','Farming & Ziele':'🎯','Travel & Recovery':'🧭','Merchant & Service':'🧳','Economy, Gear & Markt':'💰','Gehirn & Lernen':'🧠','Cloud & Telemetrie':'☁'};
let readKey=sessionStorage.getItem('aioV3ReadKey')||'',adminKey=sessionStorage.getItem('aioV3AdminKey')||'',overview=null,settings=null,brain=null,health=null,dirty={},eventFingerprint='';
let openCats={};try{openCats=JSON.parse(localStorage.getItem('aioV3SettingsOpen')||'{}')||{}}catch(e){}
const $=id=>document.getElementById(id),esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(Number(n)):'–';
const pct=(a,b)=>b>0?Math.max(0,Math.min(100,100*Number(a||0)/Number(b||1))):0;
const when=t=>t?new Date(Number(t)).toLocaleTimeString('de-DE'):'–';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
function toast(msg,bad){const el=$('toast');el.textContent=msg;el.className='toast'+(bad?' bad':'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add('hidden'),2600)}
function nav(){const root=$('nav');root.innerHTML=pages.map((p,i)=>'<button data-page="'+p[0]+'" class="'+(i?'':'active')+'">'+p[1]+'</button>').join('');root.onclick=e=>{const b=e.target.closest('button[data-page]');if(!b)return;document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.dataset.page===b.dataset.page));if(b.dataset.page==='events')loadEvents()}}
async function api(path,opt){opt=opt||{};const h=Object.assign({'x-aio-read-key':readKey},opt.headers||{});if(opt.admin)h['x-aio-admin-key']=adminKey;if(opt.body)h['content-type']='application/json';const r=await fetch(path,{method:opt.method||'GET',cache:'no-store',headers:h,body:opt.body?JSON.stringify(opt.body):undefined});let j={};try{j=await r.json()}catch(e){}if(r.status===401)throw new Error('READ_KEY ist falsch oder fehlt.');if(r.status===403)throw new Error('ADMIN_KEY ist falsch oder fehlt.');if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}
async function publicApi(path){const r=await fetch(path,{cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j}
function pill(state,label){const s=String(state||'').toLowerCase(),cls=s==='live'||s==='healthy'||s==='ok'?'good':s==='offline'||s==='quarantine'||s==='degraded'||s==='critical'?'bad':'warn';return '<span class="pill '+cls+'"><i class="dot"></i>'+esc(label||state||'–')+'</span>'}
function humanBytes(bytes){const n=Number(bytes);if(!Number.isFinite(n))return '–';if(n>=1e9)return fmt(n/1e9)+' GB';if(n>=1e6)return fmt(n/1e6)+' MB';if(n>=1e3)return fmt(n/1e3)+' KB';return fmt(n)+' B'}
function humanCount(n){const x=Number(n);if(!Number.isFinite(x))return '–';if(x>=1e6)return fmt(x/1e6)+' Mio.';if(x>=1e3)return fmt(x/1e3)+' Tsd.';return fmt(x)}
function charCard(row){const s=row.status||row,c=s.character||{},age=row.ageSeconds==null?s.ageSeconds:row.ageSeconds,state=row.connectionState||s.connectionState||'offline',perf=s.performance&&s.performance.current&&s.performance.current.rates||{},f=s.farmer||{},brainS=s.brain||{};return '<article class="card"><div class="charhead"><div class="avatar">'+(String(c.ctype).toLowerCase()==='merchant'?'🧳':'🏹')+'</div><div><strong>'+esc(c.name||row.character||'Unbekannt')+'</strong><small>'+esc(c.ctype||'–')+' · L'+fmt(c.level)+' · '+esc(c.map||'–')+'</small></div><div class="charstate">'+pill(state,state+' · '+fmt(age)+'s')+'</div></div><div class="bars"><div class="barrow">HP '+fmt(c.hp)+' / '+fmt(c.max_hp)+'<div class="bar hp"><i style="width:'+pct(c.hp,c.max_hp)+'%"></i></div></div><div class="barrow">MP '+fmt(c.mp)+' / '+fmt(c.max_mp)+'<div class="bar mp"><i style="width:'+pct(c.mp,c.max_mp)+'%"></i></div></div></div><div class="triple"><div class="mini">XP/h<b>'+fmt(perf.xpPerHour)+'</b></div><div class="mini">Gold/h<b>'+fmt(perf.goldPerHour)+'</b></div><div class="mini">Deaths/h<b>'+fmt(perf.deathsPerHour)+'</b></div></div><div class="line"><span>Farmer-State</span><b>'+esc(f.state||'–')+'</b></div><div class="line"><span>Ziel</span><b>'+esc(f.targetType||f.targetId||'–')+'</b></div><div class="line"><span>Brain</span><b>'+esc(brainS.quality&&brainS.quality.state||'–')+'</b></div></article>'}
function budgetFromStatus(s){const list=[s&&s.controlCenter&&s.controlCenter.cloud,s&&s.cloud,s&&s.control&&s.control.cloud,s&&s.alpha25&&s.alpha25.cloud,s&&s.controlCenterBrain&&s.controlCenterBrain.cloud];for(const x of list){if(x&&x.freeTierBudget)return x.freeTierBudget}return null}
function supabaseSnapshot(){let x=null;try{x=JSON.parse(localStorage.getItem('aioV3SupabaseUsageSnapshot')||'null')}catch(e){}return x&&typeof x==='object'?x:{}}
function quotaRows(){
  const chars=overview&&overview.characters||[];let workerUsed=0,workerSeen=0;
  chars.forEach(row=>{const b=budgetFromStatus(row.status||{});if(b&&Number.isFinite(Number(b.used))){workerUsed+=Number(b.used)||0;workerSeen++}});
  const workerHard=Number(health&&health.cloudflareConfiguration&&health.cloudflareConfiguration.freeTierGuard&&health.cloudflareConfiguration.freeTierGuard.workers&&health.cloudflareConfiguration.freeTierGuard.workers.freeDailyRequests)||100000;
  const workerRemaining=workerSeen?Math.max(0,workerHard-workerUsed):null;
  const snap=supabaseSnapshot();
  const gb=1000*1000*1000;
  const supaLimit=Number(snap.egressLimitBytes)||5*gb,supaCachedLimit=Number(snap.cachedEgressLimitBytes)||5*gb;
  const supaUsed=snap.egressUsedBytes!=null&&Number.isFinite(Number(snap.egressUsedBytes))?Number(snap.egressUsedBytes):null;
  const supaCachedUsed=snap.cachedEgressUsedBytes!=null&&Number.isFinite(Number(snap.cachedEgressUsedBytes))?Number(snap.cachedEgressUsedBytes):null;
  return [
    {icon:'☁',title:'Cloudflare Worker',note:workerSeen?'Bot-Request-Guard · '+workerSeen+' Charaktere':'Request-Limit · Bot-Zähler noch nicht im Snapshot',remaining:workerRemaining,limit:workerHard,unit:'count',source:workerSeen?'lokaler v3 Free-Tier-Guard':'Live-Wert fehlt'},
    {icon:'⇣',title:'Supabase Egress',note:'Uncached · Free-Plan-Kontingent',remaining:supaUsed==null?null:Math.max(0,supaLimit-supaUsed),limit:supaLimit,unit:'bytes',source:supaUsed==null?'Live-Abrechnung nicht an Worker angebunden':'Supabase Usage Snapshot'},
    {icon:'⚡',title:'Supabase Cached Egress',note:'CDN Cache · eigenes Kontingent',remaining:supaCachedUsed==null?null:Math.max(0,supaCachedLimit-supaCachedUsed),limit:supaCachedLimit,unit:'bytes',source:supaCachedUsed==null?'Live-Abrechnung nicht an Worker angebunden':'Supabase Usage Snapshot'}
  ]
}
function renderQuotaDeck(){
  const rows=quotaRows();
  $('capacityDeck').innerHTML=rows.map((r,i)=>{
    const known=r.remaining!=null&&Number.isFinite(Number(r.limit))&&Number(r.limit)>0;
    const percent=known?clamp(100*Number(r.remaining)/Number(r.limit),0,100):null;
    const state=!known?'unknown':percent<=10?'bad':percent<=30?'warn':'good';
    const value=!known?'Live-Wert fehlt':(r.unit==='bytes'?humanBytes(r.remaining):humanCount(r.remaining));
    const total=r.unit==='bytes'?humanBytes(r.limit):humanCount(r.limit);
    return '<article class="capacity-strip '+state+'"><div class="capacity-head"><div class="capacity-icon">'+r.icon+'</div><div class="capacity-title"><b>'+esc(r.title)+'</b><small>'+esc(r.note)+'</small></div><div class="capacity-value"><strong>'+esc(value)+'</strong><small>'+(!known?'Quota '+esc(total):fmt(percent)+'% frei')+'</small></div></div><div class="capacity-track"><div class="capacity-fill" data-width="'+(known?percent:100)+'" style="width:0"></div></div><div class="capacity-foot"><span><strong>'+esc(known?'verfügbar':'Status')+'</strong> · '+esc(r.source)+'</span><span>Limit '+esc(total)+'</span></div></article>'
  }).join('');
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll('.capacity-fill[data-width]').forEach(el=>{el.style.width=el.dataset.width+'%'})))
}
function settingValue(key,fallback){const vals=settings&&settings.settings&&settings.settings.values||{};return dirty[key]!==undefined?dirty[key]:(vals[key]===undefined?fallback:vals[key])}
function renderOverview(){if(!overview)return;const chars=overview.characters||[];$('overviewTime').textContent='Stand '+new Date(overview.now||Date.now()).toLocaleTimeString('de-DE');$('characterCards').innerHTML=chars.length?chars.map(charCard).join(''):'<div class="empty">Noch keine v3 Runtime-Snapshots.</div>';renderQuotaDeck();renderAutomation();renderEconomy(chars)}
function renderEconomy(chars){const m=chars.find(x=>String(x.status&&x.status.character&&x.status.character.ctype||'').toLowerCase()==='merchant');if(!m){$('economyGrid').innerHTML='<div class="empty">Merchant noch nicht synchronisiert.</div>';return}const s=m.status||{},e=s.economy||{},home=e.homeService||{},mh=e.marketHistory||{},go=e.gearOptimization||{},tr=e.transferQueue||{},conv=s.alpha27||s.combat&&s.combat.alpha27||{},risk=conv.merchant&&conv.merchant.risk||{};const upgrade=risk.maxUpgradeLevel!=null?risk.maxUpgradeLevel:settingValue('economy.maxUpgrade',2),compound=risk.maxCompoundLevel!=null?risk.maxCompoundLevel:settingValue('economy.maxCompound',1);$('economyGrid').innerHTML=[['Home Service',home.phase||'–','Grund: '+(home.phaseReason||'–')],['Account Pool',fmt(e.accountItemPool&&e.accountItemPool.itemCount)+' Items',fmt(e.accountItemPool&&e.accountItemPool.uniqueItems)+' unique'],['Gear Optimizer',fmt(go.assignments)+' Assignments',fmt(go.multiHop)+' Multi-Hop'],['Transfer Queue',fmt(tr.total)+' Jobs',fmt(tr.readyMerchantToTarget)+' bereit'],['Market History',fmt(mh.trackedItems)+' Items','Save Errors '+fmt(mh.stats&&mh.stats.saveErrors)],['Capacity',e.capacityPlan?fmt(e.capacityPlan.effectiveFreeSlots)+' frei':'–',e.capacityPlan&&e.capacityPlan.shouldBank?'Bank nötig':'kein Bankdruck'],['Upgrade-Limit','+'+fmt(upgrade),'Hard Cap +7'],['Compound-Limit','+'+fmt(compound),'Hard Cap +10']].map(x=>'<div class="card"><h3>'+x[0]+'</h3><div class="metric">'+esc(x[1])+'</div><div class="sub">'+esc(x[2])+'</div></div>').join('')}
`;