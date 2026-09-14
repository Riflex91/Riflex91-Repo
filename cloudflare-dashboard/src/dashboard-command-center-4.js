export const DASHBOARD_FRAGMENT_4 = `function actionLabel(a){const map={continue:'Position halten',change_farm_target:'Farmziel wechseln',replan_merchant:'Merchant neu planen',explore:'Erkunden',wait:'Warten'};return map[String(a||'')]||String(a||'Strategie analysieren')}
function renderBrain(){
  if(!brain||!brain.brain){$('brainRoot').innerHTML='<div class="empty">Noch kein Merchant-Brain-State vorhanden.</div>';return}
  const b=brain.brain,q=b.quality||{},st=b.student||{},t=b.teacher||{},l=b.league||{},cur=b.current||{},sd=cur.student||{},td=cur.teacher||{},usage=brain.usage||{};
  const phase=t.shouldAsk?'Teacher konsultieren':b.pendingOutcome?'Ergebnis beobachten':q.state==='warming'?'Muster lernen':'Strategie bewerten';
  const thought='Ich sehe '+(sd.target?esc(sd.target):'die aktuelle Lage')+'. Student: '+esc(actionLabel(sd.action))+', Confidence '+fmt(100*Number(sd.confidence||0))+'%. '+(td.action?'Teacher tendiert zu '+esc(actionLabel(td.action))+(td.target?' auf '+esc(td.target):'')+'.':'Ich sammle weitere Signale bevor ich den Teacher brauche.');
  $('brainRoot').innerHTML=
    '<div class="brain-stage"><div class="brain-layout">'+
      '<div><div class="neural-core"><div class="core-shell"></div><span class="synapse s1"></span><span class="synapse s2"></span><span class="synapse s3"></span><span class="synapse s4"></span><span class="synapse s5"></span><div class="core-brain">🧠</div></div></div>'+
      '<div class="brain-copy"><small>'+esc(phase)+'</small><h2>'+esc(actionLabel(sd.action))+'</h2><div class="thought-live">'+thought+'<span class="thought-cursor"></span></div></div>'+
      '<div class="brain-quality"><div class="label">COGNITIVE QUALITY</div><div class="score">'+fmt(100*Number(q.score||0))+'%</div>'+pill(q.state||'warming',q.state||'warming')+'<div class="sub" style="margin-top:10px">Keine direkte Executor-Autorität</div></div>'+
    '</div>'+
    '<div class="signal-flow"><div class="signal-step"><small>01 · Observe</small><b>'+fmt(b.architecture&&b.architecture.inputs)+' Eingangssignale</b></div><div class="signal-step"><small>02 · Evaluate</small><b>'+fmt(b.architecture&&b.architecture.hidden)+' Hidden Units · Entropie '+fmt(sd.entropy)+'</b></div><div class="signal-step"><small>03 · Decide & Learn</small><b>'+fmt(b.architecture&&b.architecture.outputs)+' Aktionen · Reward '+fmt(st.rewardEma)+'</b></div></div>'+
    '</div>'+
    '<div class="brain-panels">'+
      '<div class="card"><h3>Neuronales Lernen</h3><div class="brainmetrics"><div class="mini">Samples<b>'+fmt(st.samples)+'</b></div><div class="mini">Updates<b>'+fmt(st.updates)+'</b></div><div class="mini">Replay<b>'+fmt(st.replay&&st.replay.size)+'</b></div><div class="mini">Loss EMA<b>'+fmt(st.lossEma)+'</b></div><div class="mini">Reward EMA<b>'+fmt(st.rewardEma)+'</b></div><div class="mini">Agreement<b>'+fmt(100*Number(st.agreementEma||0))+'%</b></div></div><div class="line"><span>Novelty</span><b>'+fmt(sd.novelty)+'</b></div><div class="line"><span>Teacher fällig</span><b>'+esc(t.shouldAsk?'ja':'nein')+'</b></div><div class="line"><span>Teacher Calls</span><b>'+fmt(usage.requests)+'</b></div></div>'+
      '<div class="card"><h3>Champion / Challenger</h3><div class="line"><span>Generation</span><b>'+fmt(l.generation)+'</b></div><div class="line"><span>Champion</span><b>'+esc(l.hasChampion?'aktiv':'noch keiner')+'</b></div><div class="line"><span>Promotions</span><b>'+fmt(l.promotions)+'</b></div><div class="line"><span>Rollbacks</span><b>'+fmt(l.rollbacks)+'</b></div><div class="line"><span>Rejections</span><b>'+fmt(l.rejections)+'</b></div><div class="sub">'+esc(l.lastReason||'Liga beobachtet die Lernqualität.')+'</div></div>'+
      '<div class="card"><h3>Letzte Teacher-Lektion</h3><div class="line"><span>Aktion</span><b>'+esc(actionLabel(t.lastDecision&&t.lastDecision.action))+'</b></div><div class="line"><span>Ziel</span><b>'+esc(t.lastDecision&&t.lastDecision.target||'–')+'</b></div><div class="sub" style="font-size:12px;color:#b8ceda">'+esc(t.lastDecision&&t.lastDecision.lesson||'Der Teacher wartet auf einen Zustand mit genügend Neuheit oder Unsicherheit.')+'</div></div>'+
      '<div class="card"><h3>Gedanken-Tagebuch</h3><div class="diary">'+((b.diary&&b.diary.entries||[]).slice().reverse().slice(0,16).map(d=>'<div class="diaryrow"><div class="ico">'+esc(d.icon||'•')+'</div><div><b>'+esc(d.title||d.kind)+'</b><p>'+esc(d.detail||'')+'</p><small class="sub">'+when(d.at)+'</small></div></div>').join('')||'<div class="empty">Noch keine Einträge.</div>')+'</div></div>'+
    '</div>'
}
function controlInput(def,value){const dis=def.locked?' disabled':'';if(def.type==='boolean')return '<div class="control"><div class="toggle-row"><span class="sub">'+(value?'Aktiv':'Inaktiv')+'</span><label class="switch"><input data-key="'+esc(def.key)+'" type="checkbox" '+(value?'checked ':'')+dis+'><span class="slider"></span></label></div></div>';if(def.type==='select')return '<div class="control"><select data-key="'+esc(def.key)+'"'+dis+'>'+def.values.map(v=>'<option value="'+esc(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></div>';return '<div class="control"><input data-key="'+esc(def.key)+'" type="number" value="'+esc(value)+'" min="'+esc(def.min)+'" max="'+esc(def.max)+'" step="'+esc(def.step)+'"'+dis+'><div class="rangehint"><span>'+esc(def.min)+'</span><span>Schritt '+esc(def.step)+'</span><span>'+esc(def.max)+'</span></div></div>'}
function saveOpenState(){try{localStorage.setItem('aioV3SettingsOpen',JSON.stringify(openCats))}catch(e){}}
function renderSettings(){
  if(!settings)return;
  const q=($('settingsSearch').value||'').trim().toLowerCase(),defs=settings.schema||[],vals=settings.settings&&settings.settings.values||{},groups={};
  defs.filter(d=>!q||[d.key,d.category,d.label,d.description].join(' ').toLowerCase().includes(q)).forEach(d=>(groups[d.category]||(groups[d.category]=[])).push(d));
  $('settingsRevision').textContent='Revision '+fmt(settings.settings&&settings.settings.revision);
  const changed=Object.keys(dirty).length;$('dirtyPill').textContent=changed+' Änderung'+(changed===1?'':'en');$('dirtyPill').className='pill '+(changed?'warn':'');
  $('adminModePill').textContent=adminKey?'Admin aktiv':'Read-only';$('adminModePill').className='pill '+(adminKey?'good':'');
  $('settingsRoot').innerHTML=Object.entries(groups).map(g=>{const open=q||openCats[g[0]]===true;return '<details class="settingscat" data-category="'+esc(g[0])+'" '+(open?'open':'')+'><summary><span class="cat-icon">'+esc(categoryIcons[g[0]]||'⚙')+'</span><span class="cat-title"><b>'+esc(g[0])+'</b><small>'+g[1].length+' Befehle / Parameter</small></span><span class="cat-count">'+g[1].length+'</span><span class="chev">⌃</span></summary><div class="settingsgrid">'+g[1].map(d=>{const current=dirty[d.key]!==undefined?dirty[d.key]:(vals[d.key]===undefined?d.default:vals[d.key]);return '<div class="setting '+(dirty[d.key]!==undefined?'dirty':'')+'"><div class="settingtop"><label>'+esc(d.label)+'</label><div>'+(d.locked?'<span class="tag lock">Safety Lock</span>':d.hot?'<span class="tag hot">Live</span>':'<span class="tag restart">Restart</span>')+'</div></div><p>'+esc(d.description)+'</p>'+controlInput(d,current)+'<div class="settingkey">'+(dirty[d.key]!==undefined?'<span class="dirtydot"></span>':'')+esc(d.key)+'</div></div>'}).join('')+'</div></details>'}).join('')||'<div class="empty">Keine Einstellung passt zu dieser Suche.</div>';
  $('saveSettings').disabled=!changed||!adminKey;
  $('settingsNotice').innerHTML=adminKey?'':'<div class="notice">READ-ONLY: Mit ADMIN_KEY kannst du Befehle ändern. Safety-Locks bleiben grundsätzlich gesperrt.</div>'
}
function readSetting(el){return el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value}
function dbMetric(label,value,hint){return '<div class="dbbox"><div><span>'+esc(label)+'</span>'+(hint?'<br><em>'+esc(hint)+'</em>':'')+'</div><b>'+esc(value==null?'–':fmt(value))+'</b></div>'}
function renderData(db){
  const available=db.available!==false;
  $('dbRoot').innerHTML=
    '<section class="data-category"><div class="head"><i>⚡</i><div><b>Live-Zustand</b><small>Was der Bot gerade weiß und tut</small></div></div><div class="db-list">'+
      dbMetric('Runtime Snapshots',db.runtimeStatuses,'D1 · aktueller Zustand je Charakter')+
      dbMetric('Brain States',db.brainStates,'D1 · lernender Zustand')+
    '</div></section>'+
    '<section class="data-category"><div class="head"><i>🧠</i><div><b>Lernen & Entscheidungen</b><small>Warum sich das Verhalten verändert</small></div></div><div class="db-list">'+
      dbMetric('Brain Decisions',db.brainDecisions,'Teacher / Strategie')+
      dbMetric('Learning Outcomes',db.learningEvents,'Rewards und Feedback')+
    '</div></section>'+
    '<section class="data-category"><div class="head"><i>🛡</i><div><b>Diagnose & Audit</b><small>Nur nachvollziehbare, wichtige Historie</small></div></div><div class="db-list">'+
      dbMetric('Wichtige Events',db.events,'D1 · gefilterte Meldungen')+
      dbMetric('Settings Audits',db.settingAudits,'Änderungshistorie')+
    '</div></section>'+
    '<section class="data-category"><div class="head"><i>☁</i><div><b>Cloud & Langzeitgedächtnis</b><small>Speicher nach Aufgabe getrennt</small></div></div><div class="db-list">'+
      '<div class="dbbox"><div><span>Cloudflare D1</span><br><em>'+esc(available?'online · kompakter Betriebszustand':'degraded / quota fallback')+'</em></div><b>'+esc(available?'ONLINE':'DEGRADED')+'</b></div>'+
      '<div class="dbbox"><div><span>Cloudflare R2</span><br><em>Roh-Logarchiv · wichtige Diagnose</em></div><b>ARCHIV</b></div>'+
      '<div class="dbbox"><div><span>Supabase</span><br><em>Aio-bot · externe Telemetrie / Debug-Daten</em></div><b>EXTERN</b></div>'+
    '</div></section>'
}
function eventLevel(e){const s=String(e.severity||'info').toLowerCase();if(['error','critical','fatal','emergency','alert'].includes(s))return 'critical';if(['warn','warning'].includes(s))return 'warn';return 'ok'}
function isImportantEvent(e){
  const level=eventLevel(e);if(level!=='ok')return true;
  const name=String(e.event||'').toUpperCase();
  return /AUTO_UPDATE_APPLIED|REMOTE_SETTINGS_APPLIED|PROGRESSION_POLICY_RESYNCED|CREDENTIALS_MIGRATED|PROMOTED|RECOVERED|READY|CONNECTED/.test(name)
}
function dedupeEvents(rows){
  const seen=new Set(),out=[];
  for(const e of rows){if(!isImportantEvent(e))continue;const key=[e.character,e.event,e.reason,eventLevel(e)].join('|');if(seen.has(key))continue;seen.add(key);out.push(e);if(out.length>=60)break}
  return out
}
async function loadEvents(){
  try{
    const j=await api('/api/v3/events?limit=220'),rows=dedupeEvents(j.events||[]);
    const fp=rows.slice(0,8).map(e=>[e.eventAt,e.character,e.event].join(':')).join('|'),changed=eventFingerprint&&fp!==eventFingerprint;eventFingerprint=fp;
    $('eventsRoot').innerHTML=rows.length?rows.map(e=>{const level=eventLevel(e),sev=level==='critical'?'KRITISCH':level==='warn'?'WARNUNG':'OK',cls=level==='critical'?(String(e.severity||'critical').toLowerCase()):level;return '<div class="event '+esc(cls)+'"><span class="muted">'+new Date(e.eventAt).toLocaleTimeString('de-DE')+'</span><b class="sev">'+sev+'</b><span class="component">'+esc(e.component||'System')+'</span><span class="event-main"><b>'+esc(e.event||'event')+'</b><br><span>'+esc(e.character||'')+(e.reason?' · '+esc(e.reason):'')+'</span></span></div>'}).join(''):'<div class="event-empty">Alles ruhig. Keine wichtigen Events.</div>';
    if(changed)toast('Neues wichtiges Event eingetroffen.')
  }catch(e){$('eventsRoot').innerHTML='<div class="error">'+esc(e.message)+'</div>'}
}
async function load(){
  if(!readKey)return;
  try{
    const results=await Promise.all([api('/api/v3/overview'),api('/api/v3/settings'),api('/api/v3/brain').catch(()=>({ok:false})),publicApi('/api/health').catch(()=>null)]);
    overview=results[0];settings=results[1];brain=results[2];health=results[3];
    $('login').classList.add('hidden');$('app').classList.remove('hidden');$('top').classList.remove('hidden');
    $('syncPill').className='pill good';$('syncPill').innerHTML='<i class="dot"></i>'+when(Date.now());
    renderOverview();renderBrain();renderSettings()
  }catch(e){
    $('syncPill').className='pill bad';$('syncPill').innerHTML='<i class="dot"></i>Fehler';
    $('loginError').innerHTML='<div class="error">'+esc(e.message)+'</div>'
  }
}
nav();
$('readKey').value=readKey;$('adminKey').value=adminKey;
$('open').onclick=()=>{readKey=$('readKey').value.trim();adminKey=$('adminKey').value.trim();sessionStorage.setItem('aioV3ReadKey',readKey);sessionStorage.setItem('aioV3AdminKey',adminKey);load()};
$('logout').onclick=()=>{sessionStorage.removeItem('aioV3ReadKey');sessionStorage.removeItem('aioV3AdminKey');location.reload()};
$('settingsSearch').oninput=renderSettings;
$('settingsRoot').onchange=e=>{const el=e.target.closest('[data-key]');if(!el)return;dirty[el.dataset.key]=readSetting(el);renderSettings();renderEconomy(overview&&overview.characters||[])};
$('settingsRoot').addEventListener('toggle',e=>{const d=e.target;if(!d.matches||!d.matches('details[data-category]'))return;openCats[d.dataset.category]=d.open;saveOpenState()},true);
$('expandSettings').onclick=()=>{document.querySelectorAll('.settingscat').forEach(d=>{d.open=true;openCats[d.dataset.category]=true});saveOpenState()};
$('collapseSettings').onclick=()=>{document.querySelectorAll('.settingscat').forEach(d=>{d.open=false;openCats[d.dataset.category]=false});saveOpenState()};
$('discardSettings').onclick=()=>{dirty={};renderSettings();renderEconomy(overview&&overview.characters||[]);toast('Änderungen verworfen.')};
$('saveSettings').onclick=async()=>{try{const j=await api('/api/v3/settings',{method:'PATCH',admin:true,body:{account:settings.account||'default',expectedRevision:settings.settings&&settings.settings.revision,patch:dirty}});dirty={};settings=j;renderSettings();await load();toast('Einstellungen gespeichert.')}catch(e){$('settingsNotice').innerHTML='<div class="error">'+esc(e.message)+'</div>';toast(e.message,true)}};
$('reloadEvents').onclick=loadEvents;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();const page=document.querySelector('.page[data-page="settings"]');if(page&&page.classList.contains('active'))$('settingsSearch').focus()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&Object.keys(dirty).length&&adminKey){e.preventDefault();$('saveSettings').click()}});
if(readKey)load();
setInterval(()=>{if(readKey&&!document.hidden)load()},3000);
})();
</script>
</body>
</html>`;
