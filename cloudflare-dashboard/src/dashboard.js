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
.al-panel{overflow:auto;border:5px solid #777;background:#000;padding:8px;box-shadow:0 8px 24px #0009}
.al-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 7px;color:#d7d7d7;font-size:10px}
.al-panel-head b{font-size:11px;color:#fff}.al-panel-head span{color:#999}
.al-equipment-grid{display:grid;grid-template-columns:repeat(4,50px);gap:2px;width:max-content;margin:auto}
.al-inventory-grid{display:grid;grid-template-columns:repeat(7,50px);gap:2px;width:max-content;margin:auto}
.al-slot{position:relative;width:50px;height:50px;overflow:hidden;border:2px solid #666;background:#000;box-sizing:border-box;image-rendering:pixelated}
.al-slot.empty{border-color:#292929}.al-slot.filled:hover{border-color:#bcbcbc;box-shadow:0 0 0 1px #ffffff30 inset}.al-slot.pompous{border-color:#c5c5c5}
.al-sprite-frame{position:absolute;left:3px;top:3px;width:40px;height:40px;overflow:hidden;pointer-events:none}
.al-sprite-frame.shade{opacity:.4}
.al-sprite-frame img{position:absolute;max-width:none!important;image-rendering:pixelated;pointer-events:none}
.al-missing{position:absolute;inset:0;display:grid;place-items:center;color:#454545;font:900 24px/1 ui-monospace,SFMono-Regular,Consolas,monospace}
.al-qty,.al-level,.al-lock,.al-special{position:absolute;z-index:2;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:900;text-shadow:1px 1px 0 #000,-1px -1px 0 #000}
.al-qty{right:0;bottom:0;padding:0 2px;background:#050505dc;color:#fff;font-size:13px;line-height:15px}
.al-level{left:0;bottom:0;min-width:15px;padding:0 2px;border:1px solid #aaa;background:#111;color:#fff;font-size:12px;line-height:14px;text-align:center}
.al-lock{right:1px;top:0;color:#ff5c6e;font-size:11px}.al-special{left:2px;top:0;color:#72f1d3;font-size:10px}
.al-slot-name{display:none}
.automation-toolbar{display:grid;grid-template-columns:minmax(220px,2fr) repeat(5,minmax(130px,1fr));gap:10px;margin-bottom:12px}
.automation-toolbar input,.automation-toolbar select{width:100%;box-sizing:border-box;background:#08151d;color:#e8f4f8;border:1px solid #284756;border-radius:9px;padding:10px}
.automation-policy{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px;padding:10px 12px;border:1px solid #274654;border-radius:10px;background:#08151d}
.automation-policy label{display:flex;align-items:center;gap:9px;font-size:11px;font-weight:800;color:#dcecf3}.automation-policy input{width:76px;background:#050d12;color:#fff;border:1px solid #365766;border-radius:8px;padding:8px;text-align:center;font-weight:800}
.automation-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:12px;margin-top:12px}
.automation-item{border:1px solid #254352;border-radius:12px;background:#07141c;padding:12px;box-shadow:0 8px 22px #0004}
.automation-item-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.automation-item-identity{display:flex;align-items:center;gap:10px;min-width:0}.automation-item-head b{display:block;font-size:13px}.automation-item-head small{display:block;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}
.automation-icon{flex:0 0 50px;cursor:default}.automation-icon .al-sprite-frame{pointer-events:none}
.automation-meta{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.automation-meta span{padding:4px 7px;border:1px solid #1d3b4a;border-radius:999px;color:#a9c2cf;font-size:10px}
.automation-perms{display:flex;flex-wrap:wrap;gap:5px}.automation-perm{font-size:9px;padding:4px 6px;border-radius:6px;border:1px solid #36505d}.automation-perm.allow{border-color:#2b765d;color:#79e6ba}.automation-perm.deny{border-color:#8a3a49;color:#ff8799}.automation-perm.auto{color:#a9c2cf}
.automation-warning{margin:9px 0;padding:8px 9px;border:1px solid #8a6924;border-radius:8px;background:#33250b;color:#ffd77b;font-size:10px;line-height:1.45}
.item-permission-menu{position:fixed;z-index:2147483647;width:min(350px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow:auto;padding:12px;border:1px solid #496675;border-radius:12px;background:#071018;color:#edf7fb;box-shadow:0 18px 50px #000b}
.item-permission-title b,.item-permission-title small{display:block}.item-permission-title small{color:#8da8b6;margin-top:2px}
.item-permission-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 0;border-top:1px solid #19313e}.item-permission-row span small{display:block;color:#8da8b6;margin-top:2px}.item-permission-row>div{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
.item-permission-row button{border:1px solid #36505d;border-radius:7px;background:#10212b;color:#dcecf3;padding:6px 8px;cursor:pointer}.item-permission-row button.selected{box-shadow:0 0 0 1px #8ebfd4 inset}.item-permission-row button.allow{border-color:#2b765d;color:#79e6ba}.item-permission-row button.deny{border-color:#8a3a49;color:#ff8799}

/* Event-Priorität: Status muss auf den ersten Blick erkennbar sein. */
.event{border-width:2px;border-left-width:8px;padding:15px 16px;min-height:70px}
.event .sev{display:inline-flex;align-items:center;justify-content:center;min-width:78px;padding:7px 9px;border:1px solid currentColor;border-radius:9px;font-size:10px;box-shadow:0 4px 14px #0005}
.event .component{font-weight:800;color:#a7c0ce}.event-main b{font-size:13px;color:#f2fbff}.event-main span{font-size:11px;color:#aec2cd}
.event.ok{border-color:#255f4d;border-left-color:#62e6a7;background:linear-gradient(90deg,#0b2b20 0,#081821 58%);box-shadow:0 12px 34px #0005,inset 0 0 32px #62e6a70b}.event.ok .sev{color:#081d16;background:#62e6a7;border-color:#82f1bc}.event.ok .sev:before{content:'✓ ';font-size:13px}
.event.warn,.event.warning{border-color:#8a6924;border-left-color:#ffd166;background:linear-gradient(90deg,#3a2909 0,#17170e 44%,#08151d 76%);box-shadow:0 12px 36px #0006,0 0 24px #ffd1661f,inset 0 0 34px #ffd16610}.event.warn .sev,.event.warning .sev{color:#241800;background:#ffd166;border-color:#ffe39a}.event.warn .sev:before,.event.warning .sev:before{content:'⚠ ';font-size:14px}
.event.error,.event.critical,.event.fatal,.event.emergency,.event.alert{border-color:#a93448;border-left-color:#ff4965;background:linear-gradient(90deg,#4b101d 0,#241018 44%,#09151d 78%);box-shadow:0 14px 40px #0007,0 0 30px #ff496535,inset 0 0 38px #ff496514;animation:eventIn .38s var(--ease) both,priorityPulse 1.8s ease-in-out infinite alternate}.event.error .sev,.event.critical .sev,.event.fatal .sev,.event.emergency .sev,.event.alert .sev{color:#fff;background:#e62f4d;border-color:#ff8294;text-shadow:0 1px 2px #5d0010}.event.error .sev:before,.event.critical .sev:before,.event.fatal .sev:before,.event.emergency .sev:before,.event.alert .sev:before{content:'⛔ ';font-size:13px}
@keyframes priorityPulse{from{box-shadow:0 14px 40px #0007,0 0 20px #ff496526,inset 0 0 30px #ff496510}to{box-shadow:0 14px 44px #0008,0 0 38px #ff49654a,inset 0 0 44px #ff49651b}}
@media(max-width:1000px){.automation-toolbar{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.al-panel{padding:5px}.event{border-left-width:7px}.event .sev{min-width:70px;padding:6px 7px}.automation-toolbar{grid-template-columns:1fr}.automation-policy{align-items:stretch}.automation-policy label{justify-content:space-between;width:100%}.automation-grid{grid-template-columns:1fr}}
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
  const loadoutHelpers = "const gearSlotRows=[['earring1','helmet','earring2','amulet'],['mainhand','chest','offhand','cape'],['ring1','pants','ring2','orb'],['belt','shoes','gloves','elixir']];function alSpriteMeta(sp,shade){if(!sp)return '<span class=\"al-missing\">?</span>';const cell=40,cols=Math.max(1,Number(sp.columns)||1),rows=Math.max(1,Number(sp.rows)||1),x=Math.max(0,Number(sp.x)||0),y=Math.max(0,Number(sp.y)||0);return '<span class=\"al-sprite-frame'+(shade?' shade':'')+'\"><img loading=\"lazy\" decoding=\"async\" referrerpolicy=\"no-referrer\" src=\"'+esc(sp.file)+'\" style=\"width:'+cols*cell+'px;height:'+rows*cell+'px;left:'+(-x*cell)+'px;top:'+(-y*cell)+'px\"></span>';}function alSprite(it,sprites){return alSpriteMeta(it&&sprites&&sprites[it.name],false)}function alLevel(level){const n=Number(level)||0;return n===10?'X':n===11?'Y':n===12?'Z':String(n)}function alSlot(it,sprites,label,shade){const title=label+(it&&it.name?' · '+it.name:' · Leer'),q=it?Number(it.q)||1:1,level=it?Number(it.level)||0:0,pompous=!!(it&&(it.special||level>8));return '<div class=\"al-slot '+(it?'filled':'empty')+(pompous?' pompous':'')+'\" title=\"'+esc(title)+'\"'+(it?' data-item-name=\"'+esc(it.name)+'\" data-item-locked=\"'+(it.locked?'true':'false')+'\" data-item-special=\"'+(it.special?'true':'false')+'\"':'')+'>'+(it?alSprite(it,sprites):(shade?alSpriteMeta(shade,true):''))+(q>1?'<span class=\"al-qty\">'+esc(fmt(q))+'</span>':'')+(level>0?'<span class=\"al-level\">'+esc(alLevel(level))+'</span>':'')+(it&&it.locked?'<span class=\"al-lock\">X</span>':'')+(it&&it.special?'<span class=\"al-special\">✦</span>':'')+'<span class=\"al-slot-name\">'+esc(it&&it.name||label)+'</span></div>';}function equipmentHtml(gear,sprites,shades){const g=gear&&typeof gear==='object'?gear:{},labels={earring1:'Ohrring 1',helmet:'Helm',earring2:'Ohrring 2',amulet:'Amulett',mainhand:'Haupthand',chest:'Rüstung',offhand:'Nebenhand',cape:'Umhang',ring1:'Ring 1',pants:'Hose',ring2:'Ring 2',orb:'Orb',belt:'Gürtel',shoes:'Schuhe',gloves:'Handschuhe',elixir:'Elixier'},sd=shades&&typeof shades==='object'?shades:{};return '<section class=\"al-panel\"><div class=\"al-panel-head\"><b>GETRAGENE AUSRÜSTUNG</b><span>Adventure-Land-Layout</span></div><div class=\"al-equipment-grid\">'+gearSlotRows.flat().map(slot=>alSlot(g[slot],sprites,labels[slot]||slot,sd[slot])).join('')+'</div></section>';}function inventoryHtml(items,sprites,size){const list=Array.isArray(items)?items.filter(Boolean):[],byIndex=new Map();let highest=-1;list.forEach((it,i)=>{const idx=Number.isFinite(Number(it.index))?Math.max(0,Math.floor(Number(it.index))):i;byIndex.set(idx,it);highest=Math.max(highest,idx)});const requested=Number.isFinite(Number(size))?Math.max(0,Math.floor(Number(size))):0,resolved=Math.min(160,Math.max(requested,highest+1)),slots=Math.ceil(Math.max(1,resolved)/7)*7;return '<section class=\"al-panel\"><div class=\"al-panel-head\"><b>INVENTAR</b><span>'+list.length+' / '+resolved+' belegt</span></div><div class=\"al-inventory-grid\">'+Array.from({length:slots},(_,idx)=>alSlot(byIndex.get(idx),sprites,'Slot '+(idx+1),null)).join('')+'</div></section>';};";
  const cardDataMarker = "const s=row.status||row,c=s.character||{},age=row.ageSeconds==null?s.ageSeconds:row.ageSeconds,state=row.connectionState||s.connectionState||'offline',perf=";
  const cardDataReplacement = "const s=row.status||row,c=s.character||{},age=row.ageSeconds==null?s.ageSeconds:row.ageSeconds,state=String(row.connectionState||s.connectionState||'offline').toLowerCase(),displayState=state==='offline'?'offline':'online',startedAt=Number(s.startedAt)||0,presenceNow=Number(overview&&overview.now)||Date.now(),onlineSeconds=state==='offline'?0:(startedAt>0?Math.max(0,Math.floor((presenceNow-startedAt)/1000)):null),offlineSeconds=state==='offline'?Math.max(0,(Number(age)||0)-120):0,presenceLabel=state==='offline'?'Offlinezeit':'Onlinezeit',presenceSeconds=state==='offline'?offlineSeconds:onlineSeconds,registryRows=s.party&&Array.isArray(s.party.characters)?s.party.characters:[],registryCharacter=registryRows.find(x=>String(x&&x.name||'')===String(c.name||row.character||''))||{},inventory=Array.isArray(registryCharacter.inventory)?registryCharacter.inventory:[],gear=registryCharacter.gear&&typeof registryCharacter.gear==='object'?registryCharacter.gear:{},itemSprites=s.itemSprites&&typeof s.itemSprites==='object'?s.itemSprites:{},equipmentShades=s.equipmentShades&&typeof s.equipmentShades==='object'?s.equipmentShades:{},inventorySize=Number(c.isize)||0,perf=";
  const stateMarker = "<div class=\"charstate\">'+pill(state,state+' · '+fmt(age)+'s')+'</div></div><div class=\"bars\">";
  const stateReplacement = "<div class=\"charstate\">'+pill(state,displayState+' · '+durationHms(age))+'</div></div><div class=\"character-presence '+(state==='offline'?'offline':'online')+'\"><span>'+presenceLabel+'</span><b>'+durationHms(presenceSeconds)+'</b></div><div class=\"bars\">";
  const footerMarker = "<div class=\"line\"><span>Brain</span><b>'+esc(brainS.quality&&brainS.quality.state||'–')+'</b></div></article>'";
  const footerReplacement = "<div class=\"line\"><span>Brain</span><b>'+esc(brainS.quality&&brainS.quality.state||'–')+'</b></div><div class=\"char-details\">'+equipmentHtml(gear,itemSprites,equipmentShades)+inventoryHtml(inventory,itemSprites,inventorySize)+'</div></article>'";
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
