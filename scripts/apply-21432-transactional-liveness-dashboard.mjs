#!/usr/bin/env node
import fs from 'node:fs';
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.32 Transactional Merchant liveness, mirrored Farmer service order and resilient dashboard transport */')){
  bot=mustReplace(bot,'AiO Bot 2.14.31 | 2026-09-11','AiO Bot 2.14.32 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.31';","var VERSION = '2.14.32';",'bot version');
  const patch=fs.readFileSync('scripts/v21432-bot-patch.txt','utf8'),end=bot.lastIndexOf('\n})();');
  if(end<0)throw new Error('bot IIFE end missing');
  bot=bot.slice(0,end)+patch+bot.slice(end);
  fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
if(h.includes('AiO Bot Dashboard 2.14.31'))h=h.replaceAll('AiO Bot Dashboard 2.14.31','AiO Bot Dashboard 2.14.32');
fs.writeFileSync(dashPath,h);

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
w=w.replace('version:"2.14.31",brain:','version:"2.14.32",brain:');
if(!w.includes('version:"2.14.32",brain:'))throw new Error('worker health version missing');
const oldBrainCatch='catch(e){return json({ok:false,error:"AI inference failed: "+text(e&&e.message||e,200),usedToday:used,limit},502,cors||{});}';
const newBrainCatch='catch(e){const aiError=text(e&&e.message||e,200);if(/\\b4006\\b|daily free allocation/i.test(aiError)){await env.DB.prepare(`INSERT INTO brain_usage(day,neurons,requests,updated_at) VALUES(?,?,1,?) ON CONFLICT(day) DO UPDATE SET neurons=MAX(brain_usage.neurons,excluded.neurons),requests=brain_usage.requests+1,updated_at=excluded.updated_at`).bind(day,limit,Date.now()).run();return json({ok:true,blocked:true,error:"Workers AI daily neuron quota reached",usedToday:limit,limit},200,cors||{});}return json({ok:false,error:"AI inference failed: "+aiError,usedToday:used,limit},502,cors||{});}';
if(!w.includes('Workers AI daily neuron quota reached'))w=mustReplace(w,oldBrainCatch,newBrainCatch,'Workers AI quota catch');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);
fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));
v.version='2.14.32';v.dashboardVersion='2.14.32';v.build='2026-09-11';
fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));
p.version='2.14.32';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.32 transactional Merchant liveness, mirrored Farmer service and resilient dashboard transport');
