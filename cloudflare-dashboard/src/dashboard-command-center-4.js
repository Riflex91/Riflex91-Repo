export const DASHBOARD_FRAGMENT_4 = `const AUTOMATION_CATALOG_CACHE_MS=60000,AUTOMATION_VIEW_STORAGE_KEY='aioV3AutomationView';
let automationCatalogRemote=null,automationCatalogFetchedAt=0,automationView='atlas';
try{const savedView=localStorage.getItem(AUTOMATION_VIEW_STORAGE_KEY);if(savedView==='atlas'||savedView==='details')automationView=savedView}catch(e){}
function automationCatalogSource(){
  const remote=automationCatalogRemote&&automationCatalogRemote.catalog;
  if(remote&&Array.isArray(remote.items)&&remote.items.length){
    const declared=Number(remote.declaredCount)>0?Number(remote.declaredCount):Number(remote.count);
    return {row:null,status:{automationCatalogVersion:Number(remote.version)||0,automationCatalogCount:declared},list:remote.items,receivedAt:Number(remote.receivedAt)||0,dedicated:true}
  }
  const chars=overview&&overview.characters||[];
  const merchant=chars.find(row=>String(row.status&&row.status.character&&row.status.character.ctype||'').toLowerCase()==='merchant');
  const candidates=[merchant].concat(chars).filter(Boolean);
  for(const row of candidates){const list=row.status&&row.status.automationCatalog;if(Array.isArray(list)&&list.length)return {row,status:row.status||{},list,receivedAt:Number(row.receivedAt)||0,dedicated:false}}
  return {row:null,status:{},list:[],receivedAt:0,dedicated:false}
}
function automationCatalog(){return automationCatalogSource().list}
function automationText(value){return String(value==null?'':value).normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function automationMatchesQuery(item,query){
  const terms=automationText(query).trim().split(' ').filter(Boolean);if(!terms.length)return true;
  const hay=automationText([item.id,item.name,item.type,item.wtype,item.description,(item.classes||[]).join(' '),(item.npc||[]).map(x=>x.npc+' '+(x.map||'')).join(' ')].join(' '));
  return terms.every(term=>hay.includes(term))
}
function setAutomationView(view){
  automationView=view==='details'?'details':'atlas';
  try{localStorage.setItem(AUTOMATION_VIEW_STORAGE_KEY,automationView)}catch(e){}
  document.querySelectorAll('[data-automation-view]').forEach(btn=>btn.setAttribute('aria-pressed',btn.dataset.automationView===automationView?'true':'false'));
}
function itemPermissionsValue(){
  const vals=settings&&settings.settings&&settings.settings.values||{};
  const raw=dirty['economy.itemPermissions']!==undefined?dirty['economy.itemPermissions']:vals['economy.itemPermissions'];
  return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}
}
function itemPermission(name,action){const row=itemPermissionsValue()[name];return row&&typeof row[action]==='boolean'?row[action]:null}
function itemPermissionText(v){return v===true?'erlaubt':v===false?'verboten':'auto'}
function itemProtection(item){const reasons=[];if(item&&item.locked)reasons.push('im Inventar gesperrt');if(item&&item.special)reasons.push('Spezial-Item');if(item&&item.quest)reasons.push('Quest-Item');if(item&&item.cash)reasons.push('Cash-Item');if(item&&item.soulbound)reasons.push('seelengebunden');return reasons}
function automationClassCanUse(item,ctype){if(!ctype)return true;const ct=String(ctype).toLowerCase(),classes=Array.isArray(item&&item.classes)?item.classes.map(x=>String(x).toLowerCase()):[];if(classes.length&&!classes.includes(ct))return false;const wt=String(item&&item.wtype||'').toLowerCase(),allowed={ranger:['bow','crossbow'],rogue:['dagger','claw','fist'],mage:['staff','wand'],priest:['staff','wand','mace'],warrior:['sword','axe','mace','hammer','spear','dagger'],paladin:['sword','mace','hammer','axe'],merchant:['staff','sword','dagger']};return !wt||!allowed[ct]||allowed[ct].includes(wt)}
function permissionBadges(name){return ['sell','bank','compound','upgrade'].map(a=>{const v=itemPermission(name,a),label={sell:'Verkaufen',bank:'Bank',compound:'Kombinieren',upgrade:'Verbessern'}[a];return '<span class="automation-perm '+(v===true?'allow':v===false?'deny':'auto')+'">'+label+': '+itemPermissionText(v)+'</span>'}).join('')}
function automationGold(value){const n=Number(value);return Number.isFinite(n)?fmt(n)+' Gold':'–'}
function automationEconomyMeta(item){
  const e=item&&item.economy||{},values=Array.isArray(e.npcSellValues)?e.npcSellValues:[],zero=values.find(x=>Number(x&&x.level)===0),chances=Array.isArray(e.baseChances)?e.baseChances:[],first=chances[0],parts=[];
  if(e.baseGold!=null)parts.push('Basis '+automationGold(e.baseGold));
  if(zero&&zero.value!=null)parts.push('NPC +0 '+automationGold(zero.value));
  if(e.progression)parts.push(e.progression==='UPGRADE'?'Upgrade':'Compound');
  if(first&&Number.isFinite(Number(first.chance)))parts.push('+'+first.level+' '+fmt(Number(first.chance)*100)+'%');
  return parts
}
function automationIcon(item){return item.sprite?'<div class="automation-icon al-slot filled" title="'+esc(item.name||item.id)+'">'+alSpriteMeta(item.sprite,false)+'</div>':'<div class="automation-icon al-slot empty"><span class="al-missing">?</span></div>'}
function automationAtlasCard(item){
  const prot=itemProtection(item),npcText=(item.npc||[]).map(x=>x.npc).filter(Boolean).join(', '),level=item.level==null?'–':item.level,econ=automationEconomyMeta(item),progress=item.upgrade?'Upgrade':item.compound?'Compound':'–';
  return '<article class="automation-atlas-item" data-item-name="'+esc(item.id)+'" data-item-protected="'+esc(prot.join(', '))+'"><div class="automation-atlas-visual">'+automationIcon(item)+'</div><div class="automation-atlas-copy"><div class="automation-atlas-title"><b>'+esc(item.name||item.id)+'</b><button class="automation-atlas-rule" data-open-item-perm="'+esc(item.id)+'">Regeln</button></div><code class="automation-atlas-id">'+esc(item.id)+'</code><div class="automation-atlas-meta"><strong>'+esc(item.type||'Item')+'</strong> · L'+esc(level)+' · '+esc(progress)+(npcText?' · '+esc(npcText):'')+(prot.length?' · ⚠ geschützt':'')+(econ.length?' · '+esc(econ.slice(0,2).join(' · ')):'')+'</div><div class="automation-atlas-perms">'+permissionBadges(item.id)+'</div></div></article>'
}
function automationDetailCard(item){
  const prot=itemProtection(item),npcText=(item.npc||[]).map(x=>x.npc+(x.map?' @ '+x.map:'')).join(', '),classText=(item.classes||[]).length?(item.classes||[]).join(', '):'alle/über Waffentyp',level=item.level==null?'–':item.level,icon=automationIcon(item),econ=automationEconomyMeta(item);
  return '<article class="automation-item" data-item-name="'+esc(item.id)+'" data-item-protected="'+esc(prot.join(', '))+'"><div class="automation-item-head"><div class="automation-item-identity">'+icon+'<div><b>'+esc(item.name||item.id)+'</b><small>'+esc(item.id)+' · '+esc(item.type||'Item')+'</small></div></div><button class="btn ghost" data-open-item-perm="'+esc(item.id)+'">Regeln</button></div>'+(item.description?'<div class="sub">'+esc(item.description)+'</div>':'')+(prot.length?'<div class="automation-warning">⚠ Geschützt/Spezial: '+esc(prot.join(', '))+'</div>':'')+'<div class="automation-meta"><span>Level '+esc(level)+'</span><span>Klasse '+esc(classText)+'</span><span>NPC '+esc(npcText||'–')+'</span><span>'+(item.upgrade?'verbesserbar':'')+(item.upgrade&&item.compound?' · ':'')+(item.compound?'kombinierbar':'')+'</span>'+econ.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div><div class="automation-perms">'+permissionBadges(item.id)+'</div></article>'
}
function fillAutomationSelect(id,values,allLabel){const el=$(id);if(!el)return;const current=el.value;el.innerHTML='<option value="">'+esc(allLabel)+'</option>'+values.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');el.value=values.includes(current)?current:''}
function renderAutomation(){
  const root=$('automationGrid');if(!root)return;
  setAutomationView(automationView);root.dataset.view=automationView;
  const compoundLimitEl=$('automationMaxCompound'),compoundLimit=settingValue('economy.maxCompound',1),compoundSave=$('saveAutomationMaxCompound');
  if(compoundLimitEl&&document.activeElement!==compoundLimitEl)compoundLimitEl.value=String(compoundLimit);
  if(compoundSave){compoundSave.disabled=!adminKey;compoundSave.title=adminKey?'Maximales automatisches Compound-/Combine-Level speichern':'ADMIN_KEY erforderlich'}
  const catalogSource=automationCatalogSource(),all=catalogSource.list,catalogStatus=catalogSource.status||{},catalogVersion=Number(catalogStatus.automationCatalogVersion)||0,declaredCount=Number(catalogStatus.automationCatalogCount),catalogHealth=$('automationCatalogHealth'),complete=Number.isFinite(declaredCount)&&declaredCount===all.length&&catalogVersion>=3,sourceLabel=catalogSource.dedicated?' · eigener Katalogkanal':' · Legacy-Snapshot';
  if(catalogHealth){catalogHealth.className='notice'+(complete?'':' warn');catalogHealth.textContent=all.length?(complete?'Item-Datenbank v'+catalogVersion+' vollständig synchronisiert · '+all.length+' Items'+sourceLabel:'Item-Datenbank unvollständig/veraltet · '+all.length+(Number.isFinite(declaredCount)?' / '+declaredCount:'')+' Items'+sourceLabel+' · Merchant-Katalog wird aktualisiert'):'Item-Datenbank noch nicht vom Merchant synchronisiert.'}
  const types=[...new Set(all.map(x=>String(x.type||'')).filter(Boolean))].sort(),npcs=[...new Set(all.flatMap(x=>(x.npc||[]).map(n=>String(n&&n.npc||'')).filter(Boolean)))].sort();
  fillAutomationSelect('automationType',types,'Alle Typen');fillAutomationSelect('automationNpc',npcs,'Alle NPCs');
  const q=String($('automationSearch')&&$('automationSearch').value||''),type=$('automationType')&&$('automationType').value||'',ct=$('automationClass')&&$('automationClass').value||'',npc=$('automationNpc')&&$('automationNpc').value||'',cap=$('automationCapability')&&$('automationCapability').value||'',minRaw=$('automationLevelMin')&&$('automationLevelMin').value,maxRaw=$('automationLevelMax')&&$('automationLevelMax').value,min=minRaw===''?null:Number(minRaw),max=maxRaw===''?null:Number(maxRaw);
  const rows=all.filter(item=>{
    if(!automationMatchesQuery(item,q))return false;if(type&&String(item.type||'')!==type)return false;if(ct&&!automationClassCanUse(item,ct))return false;if(npc&&!(item.npc||[]).some(x=>String(x&&x.npc||'')===npc))return false;
    if(min!=null&&(!Number.isFinite(Number(item.level))||Number(item.level)<min))return false;if(max!=null&&(!Number.isFinite(Number(item.level))||Number(item.level)>max))return false;
    if(cap==='upgrade'&&!item.upgrade)return false;if(cap==='compound'&&!item.compound)return false;if(cap==='npc'&&!(item.npc||[]).length)return false;if(cap==='protected'&&!itemProtection(item).length)return false;return true
  });
  $('automationCount').textContent=rows.length+' / '+all.length+' Items';
  if(!all.length){root.innerHTML='<div class="empty">Der vollständige Itemkatalog ist noch nicht vom Merchant synchronisiert worden.</div>';return}
  root.innerHTML=rows.map(automationView==='details'?automationDetailCard:automationAtlasCard).join('')||'<div class="empty">Keine Items passen zu den Filtern.</div>'
}
function openItemPermissionMenu(name,meta,x,y){
  if(!name)return;document.querySelectorAll('.item-permission-menu').forEach(el=>el.remove());
  const catalog=automationCatalog(),item=catalog.find(row=>String(row.id)===String(name))||{},merged=Object.assign({},item,meta||{}),protectedReasons=itemProtection(merged),el=document.createElement('div');el.className='item-permission-menu';el.style.left=Math.max(8,Math.min(window.innerWidth-360,Number(x)||20))+'px';el.style.top=Math.max(8,Math.min(window.innerHeight-390,Number(y)||20))+'px';
  const econ=merged.economy||{},sellValues=Array.isArray(econ.npcSellValues)?econ.npcSellValues.slice(0,7):[],econHtml=(econ.baseGold!=null||sellValues.length)?'<div class="sub" style="margin:8px 0"><b>Item-Datenbank</b> · Basis '+automationGold(econ.baseGold)+(sellValues.length?' · NPC '+sellValues.map(x=>'+'+x.level+': '+automationGold(x.value)).join(' / '):'')+'</div>':'',helps={sell:'Erlaubt nur den finalen Verkauf nach Gear-Prüfung und Wirtschaftlichkeitsentscheidung; kein Sofortverkauf.',bank:'Erlaubt das Einlagern.',compound:'Erlaubt wirtschaftlich oder für Gear sinnvolles Kombinieren.',upgrade:'Erlaubt wirtschaftlich oder für Gear sinnvolles Verbessern.'};
  el.innerHTML='<div class="item-permission-title"><b>'+esc(item.name||name)+'</b><small>'+esc(name)+'</small></div>'+econHtml+(protectedReasons.length?'<div class="automation-warning">⚠ Geschützt/gesperrt: '+esc(protectedReasons.join(', '))+'. Diese Schutzmerkmale werden durch eine Verkaufsfreigabe nicht aufgehoben.</div>':'')+['sell','bank','compound','upgrade'].map(a=>{const labels={sell:'Verkaufen',bank:'In Bank legen',compound:'Kombinieren',upgrade:'Verbessern'},v=itemPermission(name,a);return '<div class="item-permission-row"><span><b>'+labels[a]+'</b><small>Aktuell: '+itemPermissionText(v)+' · '+esc(helps[a])+'</small></span><div><button data-perm-action="'+a+'" data-perm-value="true" data-perm-name="'+esc(name)+'" class="'+(v===true?'selected allow':'')+'">Erlauben</button><button data-perm-action="'+a+'" data-perm-value="false" data-perm-name="'+esc(name)+'" class="'+(v===false?'selected deny':'')+'">Verbieten</button><button data-perm-action="'+a+'" data-perm-value="auto" data-perm-name="'+esc(name)+'" class="'+(v===null?'selected':'')+'">Auto</button></div></div>'}).join('');document.body.appendChild(el)
}
async function saveAutomationMaxCompound(){
  if(!adminKey){toast('ADMIN_KEY erforderlich, um das Compound-Limit zu ändern.',true);return}
  const el=$('automationMaxCompound'),raw=Number(el&&el.value);
  if(!Number.isFinite(raw)){toast('Bitte ein gültiges Compound-Level eingeben.',true);return}
  const value=Math.max(0,Math.min(10,Math.round(raw)));
  try{const j=await api('/api/v3/settings',{method:'PATCH',admin:true,body:{account:settings.account||'default',expectedRevision:settings.settings&&settings.settings.revision,patch:{'economy.maxCompound':value}}});settings=j;delete dirty['economy.maxCompound'];renderSettings();renderAutomation();toast('Max. Compound / Combine auf +'+value+' gesetzt.')}catch(e){toast(e.message,true)}
}
async function saveItemPermission(name,action,value){
  if(!adminKey){toast('ADMIN_KEY erforderlich, um Item-Regeln zu ändern.',true);return}
  const vals=settings&&settings.settings&&settings.settings.values||{},all=JSON.parse(JSON.stringify(vals['economy.itemPermissions']||{})),row=Object.assign({},all[name]||{});
  if(value==='auto')delete row[action];else row[action]=value==='true';if(Object.keys(row).length)all[name]=row;else delete all[name];
  try{const j=await api('/api/v3/settings',{method:'PATCH',admin:true,body:{account:settings.account||'default',expectedRevision:settings.settings&&settings.settings.revision,patch:{'economy.itemPermissions':all}}});settings=j;delete dirty['economy.itemPermissions'];renderSettings();renderAutomation();document.querySelectorAll('.item-permission-menu').forEach(el=>el.remove());toast('Item-Regel gespeichert. Der Bot übernimmt sie beim nächsten Cloud-Sync.')}catch(e){toast(e.message,true)}
}
function actionLabel(a){const map={continue:'Position halten',change_farm_target:'Farmziel wechseln',replan_merchant:'Merchant neu planen',explore:'Erkunden',wait:'Warten'};return map[String(a||'')]||String(a||'Strategie analysieren')}
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
  const q=($('settingsSearch').value||'').trim().toLowerCase(),defs=(settings.schema||[]).filter(d=>!d.hidden),vals=settings.settings&&settings.settings.values||{},groups={};
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
    const needCatalog=!automationCatalogRemote||Date.now()-automationCatalogFetchedAt>=AUTOMATION_CATALOG_CACHE_MS;
    const catalogRequest=needCatalog?api('/api/v3/automation-catalog').catch(()=>automationCatalogRemote||{ok:false,catalog:null}):Promise.resolve(automationCatalogRemote);
    const results=await Promise.all([api('/api/v3/overview'),api('/api/v3/settings'),api('/api/v3/brain').catch(()=>({ok:false})),publicApi('/api/health').catch(()=>null),catalogRequest]);
    overview=results[0];settings=results[1];brain=results[2];health=results[3];if(needCatalog&&results[4]){automationCatalogRemote=results[4];automationCatalogFetchedAt=Date.now()}
    $('login').classList.add('hidden');$('app').classList.remove('hidden');$('top').classList.remove('hidden');
    $('syncPill').className='pill good';$('syncPill').innerHTML='<i class="dot"></i>'+when(Date.now());
    renderOverview();renderBrain();renderSettings();renderAutomation()
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
['automationSearch','automationType','automationClass','automationNpc','automationLevelMin','automationLevelMax','automationCapability'].forEach(id=>{const el=$(id);if(el){el.oninput=renderAutomation;el.onchange=renderAutomation}});
if($('saveAutomationMaxCompound'))$('saveAutomationMaxCompound').onclick=saveAutomationMaxCompound;
if($('automationMaxCompound'))$('automationMaxCompound').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();saveAutomationMaxCompound()}};
document.addEventListener('contextmenu',e=>{const node=e.target.closest&&e.target.closest('.automation-item[data-item-name],.automation-atlas-item[data-item-name],.al-slot.filled[data-item-name]');if(!node)return;e.preventDefault();openItemPermissionMenu(node.dataset.itemName,{locked:node.dataset.itemLocked==='true',special:node.dataset.itemSpecial==='true'},e.clientX,e.clientY)});
document.addEventListener('click',e=>{const view=e.target.closest&&e.target.closest('[data-automation-view]');if(view){setAutomationView(view.dataset.automationView);renderAutomation();return}const open=e.target.closest&&e.target.closest('[data-open-item-perm]');if(open){const card=open.closest('.automation-item,.automation-atlas-item');openItemPermissionMenu(open.dataset.openItemPerm,{special:card&&card.dataset.itemProtected?true:false},e.clientX,e.clientY);return}const perm=e.target.closest&&e.target.closest('[data-perm-action]');if(perm){saveItemPermission(perm.dataset.permName,perm.dataset.permAction,perm.dataset.permValue);return}if(!e.target.closest||!e.target.closest('.item-permission-menu'))document.querySelectorAll('.item-permission-menu').forEach(el=>el.remove())});

document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();const page=document.querySelector('.page[data-page="settings"]');if(page&&page.classList.contains('active'))$('settingsSearch').focus()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&Object.keys(dirty).length&&adminKey){e.preventDefault();$('saveSettings').click()}});
if(readKey)load();
setInterval(()=>{if(readKey&&!document.hidden)load()},3000);
})();
</script>
</body>
</html>`;
