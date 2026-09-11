#!/usr/bin/env node
import fs from 'node:fs';
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.31 Farmer self-service, Bestiary item policy, Merchant liveness and Brain source separation */')){
  bot=mustReplace(bot,'AiO Bot 2.14.30 | 2026-09-11','AiO Bot 2.14.31 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.30';","var VERSION = '2.14.31';",'bot version');
  const patch=['scripts/v21431-bot-patch.txt','scripts/v21431-bot-patch-2.txt','scripts/v21431-bot-patch-3.txt','scripts/v21431-bot-patch-4.txt','scripts/v21431-bot-patch-5.txt'].map(x=>fs.readFileSync(x,'utf8')).join(''),end=bot.lastIndexOf('\n})();');
  if(end<0)throw new Error('bot IIFE end missing');
  bot=bot.slice(0,end)+patch+bot.slice(end);
  fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
if(!h.includes('v2.14.31 brain source separation')){
  h=mustReplace(h,'<title>AiO Bot Dashboard 2.14.30</title>','<title>AiO Bot Dashboard 2.14.31</title>','dashboard title');
  h=mustReplace(h,'<header class="top"><strong>AiO Bot Dashboard 2.14.30</strong>','<header class="top"><strong>AiO Bot Dashboard 2.14.31</strong>','dashboard header');
  const brainLine=/  const merchant=chars\.find\(c=>c\.role==='merchant'\)\|\|\{\},ex=.*?\n/;
  const m=h.match(brainLine);if(!m)throw new Error('dashboard brain explanation line missing');
  const replacement=`  /* v2.14.31 brain source separation */
  const merchant=chars.find(c=>c.role==='merchant')||{},ex=merchant.brainExplanation||live.explanation||st.explanation||{},sourceKind=String(ex.sourceKind||'unknown'),sourceLabel=ex.sourceLabel||(sourceKind==='brain'?'Aktive Brain-/Student-Entscheidung':'Deterministische Bot-Automatik'),isBrain=sourceKind==='brain',runtimeExplain=(!isBrain&&ex.runtimeCurrent)?'<div><b>Deterministische Laufzeit</b>'+esc(ex.runtimeCurrent)+'</div><div><b>Lokaler Grund</b>'+esc(ex.runtimeWhy||'—')+'</div>':'',webExplain=ex.current?'<div class="brain-explain-web"><div><b>Quelle</b><span class="'+(isBrain?'good':'warn')+'">'+esc(sourceLabel)+'</span></div>'+runtimeExplain+'<div><b>Was mache ich gerade?</b>'+esc(ex.current)+'</div><div><b>Warum?</b>'+esc(ex.why||'—')+'</div><div><b>Was würde ich sonst tun?</b>'+esc(ex.next||'—')+'</div><div><b>Was habe ich gelernt?</b>'+esc(ex.learned||'—')+'</div><div><b>Wie sicher bin ich?</b>'+esc(ex.confidenceLabel||'—')+' · '+Number(ex.confidencePct||0)+'% · '+Number(ex.repetitions||0)+' Bestätigung(en)</div><div><b>Weltmodell</b>'+Number(ex.world?.total||0)+' Einträge · '+Number(ex.world?.stale||0)+' veraltet · G.version '+esc(ex.world?.gameVersion||'—')+'</div></div>':'';
`;
  h=h.replace(brainLine,replacement);
  fs.writeFileSync(dashPath,h);
}

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
w=w.replace('version:"2.14.30",brain:','version:"2.14.31",brain:');
if(!w.includes('version:"2.14.31",brain:'))throw new Error('worker health version missing');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);
fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));
v.version='2.14.31';v.dashboardVersion='2.14.31';v.build='2026-09-11';
fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));
p.version='2.14.31';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.31 Farmer self-service, Merchant liveness, Bestiary item policy and Brain source separation');
