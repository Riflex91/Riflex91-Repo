#!/usr/bin/env node
import fs from 'node:fs';
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.31 Farmer self-service arbitration, sell preference and Brain character context */')){
  bot=mustReplace(bot,'AiO Bot 2.14.30 | 2026-09-11','AiO Bot 2.14.31 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.30';","var VERSION = '2.14.31';",'bot version');
  const patch=fs.readFileSync('scripts/v21431-bot-patch.txt','utf8'),end=bot.lastIndexOf('\n})();');if(end<0)throw new Error('bot IIFE end missing');bot=bot.slice(0,end)+patch+bot.slice(end);fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
h=mustReplace(h,'<title>AiO Bot Dashboard 2.14.30</title>','<title>AiO Bot Dashboard 2.14.31</title>','dashboard title');
h=mustReplace(h,'<header class="top"><strong>AiO Bot Dashboard 2.14.30</strong>','<header class="top"><strong>AiO Bot Dashboard 2.14.31</strong>','dashboard header');
fs.writeFileSync(dashPath,h);

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
w=w.replace('version:"2.14.30",brain:','version:"2.14.31",brain:');
if(!w.includes('version:"2.14.31",brain:'))throw new Error('worker health version missing');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));v.version='2.14.31';v.dashboardVersion='2.14.31';v.build='2026-09-11';fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));p.version='2.14.31';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.31 Farmer self-service, ETA arbitration, sell preference and Brain character context');
