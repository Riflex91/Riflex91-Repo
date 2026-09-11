#!/usr/bin/env node
import fs from 'node:fs';
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.29 Merchant town-route estimator */')){
  bot=mustReplace(bot,'AiO Bot 2.14.28 | 2026-09-11','AiO Bot 2.14.29 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.28';","var VERSION = '2.14.29';",'bot version');
  const patch=fs.readFileSync('scripts/v21429-bot-patch.txt','utf8'),end=bot.lastIndexOf('\n})();');if(end<0)throw new Error('bot IIFE end missing');bot=bot.slice(0,end)+patch+bot.slice(end);fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
if(!h.includes('v2.14.29 dashboard cleanup: group map name only; group information hidden')){
  h=mustReplace(h,'<title>AiO Bot Dashboard 2.14.28</title>','<title>AiO Bot Dashboard 2.14.29</title>','dashboard title');
  h=mustReplace(h,'<header class="top"><strong>AiO Bot Dashboard 2.14.28</strong>','<header class="top"><strong>AiO Bot Dashboard 2.14.29</strong>','dashboard header');
  const groupRe=/const gs=chars\.map\(c=>c\.groupStrength\)\.find\(Boolean\);document\.getElementById\('group'\)\.innerHTML=gs\?`[^`]*`:'';/;
  if(!groupRe.test(h))throw new Error('dashboard group summary renderer missing');
  h=h.replace(groupRe,"const groupEl=document.getElementById('group');if(groupEl){groupEl.hidden=true;groupEl.innerHTML='';}");
  const partyPrefix='${c.party&&!c.party.complete?`<div class="error">Gruppe unvollständig · ';
  const ps=h.indexOf(partyPrefix);if(ps<0)throw new Error('dashboard party warning renderer missing');const pe=h.indexOf("`:''}",ps);if(pe<0)throw new Error('dashboard party warning end missing');h=h.slice(0,ps)+h.slice(pe+5);
  h=mustReplace(h,'<text class="player-class21428" x="13" y="9">${esc(v21428ClassName(c))}</text>','','group-map class label');
  h=h.replace('// Gruppenkarte: no arrow. Keep a small position dot/pulse and show class below the 10px name.','// Gruppenkarte: no arrow. Keep only a small position dot/pulse and the 10px character name.');
  const end=h.lastIndexOf('</script>');if(end<0)throw new Error('dashboard script end missing');h=h.slice(0,end)+'\n/* v2.14.29 dashboard cleanup: group map name only; group information hidden */\n'+h.slice(end);fs.writeFileSync(dashPath,h);
}

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
if(w.includes('version:"2.14.28",brain:'))w=w.replace('version:"2.14.28",brain:','version:"2.14.29",brain:');
if(!w.includes('version:"2.14.29",brain:'))throw new Error('worker health version missing');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));v.version='2.14.29';v.dashboardVersion='2.14.29';v.build='2026-09-11';fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));p.version='2.14.29';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.29 dashboard cleanup and Merchant town-route estimator');
