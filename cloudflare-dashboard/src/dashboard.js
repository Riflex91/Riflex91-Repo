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

const CHARACTER_PRESENCE_STYLE = `
.character-presence{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:11px 0 2px;padding:9px 10px;border:1px solid #1c3545;border-radius:10px;background:#06131c;font-size:10px;color:var(--muted)}
.character-presence b{font-size:12px;color:#74efcb;font-variant-numeric:tabular-nums;white-space:nowrap}
.character-presence.offline b{color:#ff7a8b}
`;

function replaceSection(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`dashboard patch marker missing: ${startMarker}`);
  return source.slice(0, start) + replacement + '\n' + source.slice(end);
}

function installCharacterPresenceDurations(source) {
  const whenMarker = "const when=t=>t?new Date(Number(t)).toLocaleTimeString('de-DE'):'–';";
  const durationHelper = "const durationHms=seconds=>{if(seconds==null||!Number.isFinite(Number(seconds))||Number(seconds)<0)return '–';const total=Math.floor(Number(seconds)),hours=Math.floor(total/3600),minutes=Math.floor((total%3600)/60),secs=total%60;return hours+' Std · '+String(minutes).padStart(2,'0')+' Min · '+String(secs).padStart(2,'0')+' Sek';};";
  const cardDataMarker = "const s=row.status||row,c=s.character||{},age=row.ageSeconds==null?s.ageSeconds:row.ageSeconds,state=row.connectionState||s.connectionState||'offline',perf=";
  const cardDataReplacement = "const s=row.status||row,c=s.character||{},age=row.ageSeconds==null?s.ageSeconds:row.ageSeconds,state=String(row.connectionState||s.connectionState||'offline').toLowerCase(),startedAt=Number(s.startedAt)||0,presenceNow=Number(overview&&overview.now)||Date.now(),onlineSeconds=state==='offline'?0:(startedAt>0?Math.max(0,Math.floor((presenceNow-startedAt)/1000)):null),offlineSeconds=state==='offline'?Math.max(0,(Number(age)||0)-120):0,presenceLabel=state==='offline'?'Offlinezeit':'Onlinezeit',presenceSeconds=state==='offline'?offlineSeconds:onlineSeconds,perf=";
  const stateMarker = "<div class=\"charstate\">'+pill(state,state+' · '+fmt(age)+'s')+'</div></div><div class=\"bars\">";
  const stateReplacement = "<div class=\"charstate\">'+pill(state,state+' · '+durationHms(age))+'</div></div><div class=\"character-presence '+(state==='offline'?'offline':'online')+'\"><span>'+presenceLabel+'</span><b>'+durationHms(presenceSeconds)+'</b></div><div class=\"bars\">";
  for (const marker of [whenMarker, cardDataMarker, stateMarker]) {
    if (!source.includes(marker)) throw new Error(`dashboard presence patch marker missing: ${marker}`);
  }
  return source
    .replace(whenMarker, whenMarker + '\n' + durationHelper)
    .replace(cardDataMarker, cardDataReplacement)
    .replace(stateMarker, stateReplacement);
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
  .replace('</style>', CHARACTER_PRESENCE_STYLE + MOBILE_STYLE + REDUCED_MOTION_STYLE + '</style>')
  .replace('</body>', MOBILE_SCRIPT + '</body>');
