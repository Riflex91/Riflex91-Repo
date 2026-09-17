import { DASHBOARD_FRAGMENT_1 } from './dashboard-command-center-1.js';
import { DASHBOARD_FRAGMENT_2 } from './dashboard-command-center-2.js';
import { DASHBOARD_FRAGMENT_3 } from './dashboard-command-center-3.js';
import { DASHBOARD_FRAGMENT_4 } from './dashboard-command-center-4.js';
import { QUOTA_ROWS_FUNCTION } from './dashboard-quota.js';
import { MOBILE_SCRIPT, MOBILE_STYLE } from './dashboard-mobile.js';

const REDUCED_MOTION_STYLE = `
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms!important;
    animation-iteration-count:1!important;
    scroll-behavior:auto!important;
    transition-duration:.01ms!important;
  }
}
`;

const DASHBOARD_ENHANCEMENT_STYLE = `
.character-presence{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:11px 0 2px;padding:9px 10px;border:1px solid #1c3545;border-radius:10px;background:#06131c;font-size:10px;color:var(--muted)}
.character-presence b{font-size:12px;color:#74efcb;font-variant-numeric:tabular-nums;white-space:nowrap}
.character-presence.offline b{color:#ff7a8b}
.char-details{display:grid;gap:12px;margin-top:14px;padding-top:13px;border-top:1px solid #173244}
.char-detail-panel{border:1px solid #1c3545;border-radius:13px;background:#050f17;padding:11px}
.char-detail-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
.char-detail-head b{font-size:11px;color:#dcecf4}.char-detail-head span{font-size:9px;color:#718c9d}
.equipment-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.equip-slot{min-width:0;min-height:74px;padding:7px 5px;border:1px solid #214052;border-radius:10px;background:linear-gradient(160deg,#0b1b27,#061119);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.equip-slot.filled{border-color:#37657a;background:linear-gradient(160deg,#102635,#081620);box-shadow:inset 0 0 18px #68e8e00a}
.equip-slot.empty{opacity:.48;border-style:dashed}.equip-icon{font-size:17px;line-height:1}.equip-slot small{font-size:7px;text-transform:uppercase;letter-spacing:.05em;color:#68879a}.equip-slot b{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;color:#e9f6fb}.equip-slot em{min-height:11px;font-style:normal;font-size:8px;color:#7de7c6}
.inventory-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px;max-height:220px;overflow:auto;padding-right:2px}
.inv-slot{position:relative;min-width:0;min-height:58px;border:1px solid #1c394a;border-radius:9px;background:#081722;padding:8px 7px 6px 23px;display:flex;flex-direction:column;justify-content:center}
.inv-slot:hover{border-color:#37657a;background:#0b1d29}.inv-slot .inv-index{position:absolute;left:6px;top:6px;font-size:7px;color:#587789}.inv-slot b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;color:#e5f3f8}.inv-slot small{margin-top:3px;font-size:8px;color:#79a4b8}.inventory-empty{padding:10px;border:1px dashed #244457;border-radius:9px;color:#69889a;text-align:center;font-size:9px}

/* Event-Priorität: Status muss auf den ersten Blick erkennbar sein. */
.event{border-width:2px;border-left-width:8px;padding:15px 16px;min-height:70px}
.event .sev{display:inline-flex;align-items:center;justify-content:center;min-width:78px;padding:7px 9px;border:1px solid currentColor;border-radius:9px;font-size:10px;box-shadow:0 4px 14px #0005}
.event .component{font-weight:800;color:#a7c0ce}.event-main b{font-size:13px;color:#f2fbff}.event-main span{font-size:11px;color:#aec2cd}
.event.ok{border-color:#255f4d;border-left-color:#62e6a7;background:linear-gradient(90deg,#0b2b20 0,#081821 58%);box-shadow:0 12px 34px #0005,inset 0 0 32px #62e6a70b}.event.ok .sev{color:#081d16;background:#62e6a7;border-color:#82f1bc}.event.ok .sev:before{content:'✓ ';font-size:13px}
.event.warn,.event.warning{border-color:#8a6924;border-left-color:#ffd166;background:linear-gradient(90deg,#3a2909 0,#17170e 44%,#08151d 76%);box-shadow:0 12px 36px #0006,0 0 24px #ffd1661f,inset 0 0 34px #ffd16610}.event.warn .sev,.event.warning .sev{color:#241800;background:#ffd166;border-color:#ffe39a}.event.warn .sev:before,.event.warning .sev:before{content:'⚠ ';font-size:14px}
.event.error,.event.critical,.event.fatal,.event.emergency,.event.alert{border-color:#a93448;border-left-color:#ff4965;background:linear-gradient(90deg,#4b101d 0,#241018 44%,#09151d 78%);box-shadow:0 14px 40px #0007,0 0 30px #ff496535,inset 0 0 38px #ff496514;animation:eventIn .38s var(--ease) both,priorityPulse 1.8s ease-in-out infinite alternate}.event.error .sev,.event.critical .sev,.event.fatal .sev,.event.emergency .sev,.event.alert .sev{color:#fff;background:#e62f4d;border-color:#ff8294;text-shadow:0 1px 2px #5d0010}.event.error .sev:before,.event.critical .sev:before,.event.fatal .sev:before,.event.emergency .sev:before,.event.alert .sev:before{content:'⛔ ';font-size:13px}
@keyframes priorityPulse{from{box-shadow:0 14px 40px #0007,0 0 20px #ff496526,inset 0 0 30px #ff496510}to{box-shadow:0 14px 44px #0008,0 0 38px #ff49654a,inset 0 0 44px #ff49651b}}
@media(max-width:760px){.equipment-board{grid-template-columns:repeat(3,minmax(0,1fr))}.inventory-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.event{border-left-width:7px}.event .sev{min-width:70px;padding:6px 7px}}
`;

function replaceSection(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`dashboard patch marker missing: ${startMarker}`);
  return source.slice(0, start) + replacement + '\n' + source.slice(end);
}

function installCharacterPresenceDurations(source) {
  const whenMarker = "const when=t=>t?new Date(Number(t)).toLocaleTimeString('de-DE'):'–';";
  const durationHelper = "const durationHms=seconds=>{if(seconds==null||!Number.isFinite(Number(seconds))||Number(seconds)<0)return '–';const total=Math.floor(Number(seconds)),hours=Math.floor(total/3600),minutes=Math.floor((total%3600)/60),secs=total%60,parts=[];if(hours)parts.push(hours+' Std');if(minutes)parts.push(minutes+' Min');if(secs||!parts.length)parts.push(secs+' Sek');return parts.join(' · ');};";
  const loadoutHelpers = "const gearSlotDefs=[['earring1','Ohrring 1','◇'],['ring1','Ring 1','◉'],['helmet','Helm','⛑'],['ring2','Ring 2','◉'],['earring2','Ohrring 2','◇'],['amulet','Amulett','◆'],['cape','Umhang','◫'],['chest','Rüstung','◈'],['orb','Orb','●'],['belt','Gürtel','▬'],['mainhand','Haupthand','⚔'],['gloves','Handschuhe','✦'],['pants','Hose','▥'],['shoes','Schuhe','◒'],['offhand','Nebenhand','🛡']];function equipmentHtml(gear){const g=gear&&typeof gear==='object'?gear:{};return '<section class=\"char-detail-panel\"><div class=\"char-detail-head\"><b>Getragene Ausrüstung</b><span>'+Object.keys(g).filter(k=>g[k]).length+' belegt</span></div><div class=\"equipment-board\">'+gearSlotDefs.map(d=>{const it=g[d[0]],lv=it&&Number(it.level)>0?'+'+fmt(it.level):'',marks=it?[(it.locked?'🔒':''),(it.special?'✦':'')].filter(Boolean).join(' '):'';return '<div class=\"equip-slot '+(it?'filled':'empty')+'\" title=\"'+esc(d[1]+(it&&it.name?' · '+it.name:''))+'\"><span class=\"equip-icon\">'+d[2]+'</span><small>'+esc(d[1])+'</small><b>'+esc(it&&it.name||'Leer')+'</b><em>'+esc([lv,marks].filter(Boolean).join(' · '))+'</em></div>'}).join('')+'</div></section>';}function inventoryHtml(items){const list=Array.isArray(items)?items.filter(Boolean).slice().sort((a,b)=>(Number(a.index)||0)-(Number(b.index)||0)):[];if(!list.length)return '<section class=\"char-detail-panel\"><div class=\"char-detail-head\"><b>Inventar</b><span>0 belegt</span></div><div class=\"inventory-empty\">Keine Inventardaten vorhanden.</div></section>';return '<section class=\"char-detail-panel\"><div class=\"char-detail-head\"><b>Inventar</b><span>'+list.length+' belegte Slots</span></div><div class=\"inventory-grid\">'+list.map((it,i)=>{const level=Number(it.level)||0,q=Number(it.q)||1,meta=[];if(level>0)meta.push('+'+level);if(q>1)meta.push('×'+fmt(q));if(it.locked)meta.push('🔒');if(it.special)meta.push('✦');const idx=Number.isFinite(Number(it.index))?Number(it.index)+1:i+1;return '<div class=\"inv-slot\" title=\"Slot '+idx+' · '+esc(it.name||'Unbekannt')+'\"><span class=\"inv-index\">'+idx+'</span><b>'+esc(it.name||'Unbekannt')+'</b><small>'+esc(meta.join(' · ')||'1 Stück')+'</small></div>'}).join('')+'</div></section>';};";
  const cardDataMarker = "const s=row.status||row,c=s.character||{},age=row.ageSeconds==null?s.ageSeconds:row.ageSeconds,state=row.connectionState||s.connectionState||'offline',perf=";
  const cardDataReplacement = "const s=row.status||row,c=s.character||{},age=row.ageSeconds==null?s.ageSeconds:row.ageSeconds,state=String(row.connectionState||s.connectionState||'offline').toLowerCase(),displayState=state==='offline'?'offline':'online',startedAt=Number(s.startedAt)||0,presenceNow=Number(overview&&overview.now)||Date.now(),onlineSeconds=state==='offline'?0:(startedAt>0?Math.max(0,Math.floor((presenceNow-startedAt)/1000)):null),offlineSeconds=state==='offline'?Math.max(0,(Number(age)||0)-120):0,presenceLabel=state==='offline'?'Offlinezeit':'Onlinezeit',presenceSeconds=state==='offline'?offlineSeconds:onlineSeconds,registryRows=s.party&&Array.isArray(s.party.characters)?s.party.characters:[],registryCharacter=registryRows.find(x=>String(x&&x.name||'')===String(c.name||row.character||''))||{},inventory=Array.isArray(registryCharacter.inventory)?registryCharacter.inventory:[],gear=registryCharacter.gear&&typeof registryCharacter.gear==='object'?registryCharacter.gear:{},perf=";
  const stateMarker = "<div class=\"charstate\">'+pill(state,state+' · '+fmt(age)+'s')+'</div></div><div class=\"bars\">";
  const stateReplacement = "<div class=\"charstate\">'+pill(state,displayState+' · '+durationHms(age))+'</div></div><div class=\"character-presence '+(state==='offline'?'offline':'online')+'\"><span>'+presenceLabel+'</span><b>'+durationHms(presenceSeconds)+'</b></div><div class=\"bars\">";
  const footerMarker = "<div class=\"line\"><span>Brain</span><b>'+esc(brainS.quality&&brainS.quality.state||'–')+'</b></div></article>'";
  const footerReplacement = "<div class=\"line\"><span>Brain</span><b>'+esc(brainS.quality&&brainS.quality.state||'–')+'</b></div><div class=\"char-details\">'+equipmentHtml(gear)+inventoryHtml(inventory)+'</div></article>'";
  for (const marker of [whenMarker, cardDataMarker, stateMarker, footerMarker]) {
    if (!source.includes(marker)) throw new Error(`dashboard presence patch marker missing: ${marker}`);
  }
  return source
    .replace(whenMarker, whenMarker + '\n' + durationHelper + '\n' + loadoutHelpers)
    .replace(cardDataMarker, cardDataReplacement)
    .replace(stateMarker, stateReplacement)
    .replace(footerMarker, footerReplacement);
}

const DASHBOARD_BASE_HTML = DASHBOARD_FRAGMENT_1 + DASHBOARD_FRAGMENT_2 + DASHBOARD_FRAGMENT_3 + DASHBOARD_FRAGMENT_4;
const DASHBOARD_WITH_QUOTAS = replaceSection(
  DASHBOARD_BASE_HTML,
  'function quotaRows(){',
  'function renderQuotaDeck(){',
  QUOTA_ROWS_FUNCTION
).replace(
  'Nur das Wesentliche: wie viel Cloud-Spielraum noch übrig ist.',
  'Verfügbare Aufrufe und Zugriffe für Worker, D1, R2, Supabase und das Gehirn.'
);
const DASHBOARD_WITH_PRESENCE = installCharacterPresenceDurations(DASHBOARD_WITH_QUOTAS);

export const DASHBOARD_HTML = DASHBOARD_WITH_PRESENCE
  .replace('</style>', MOBILE_STYLE + DASHBOARD_ENHANCEMENT_STYLE + REDUCED_MOTION_STYLE + '</style>')
  .replace('</body>', MOBILE_SCRIPT + '</body>');
