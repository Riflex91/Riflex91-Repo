#!/usr/bin/env node
import fs from 'node:fs';
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.36 merchant transaction routing + compact verified dashboard fallback */')){
  bot=mustReplace(bot,'AiO Bot 2.14.35 | 2026-09-11','AiO Bot 2.14.36 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.35';","var VERSION = '2.14.36';",'bot version');
  const patch=fs.readFileSync('scripts/v21436-bot-patch.txt','utf8'),end=bot.lastIndexOf('\n})();');
  if(end<0)throw new Error('bot IIFE end missing');
  bot=bot.slice(0,end)+patch+bot.slice(end);
  fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
h=h.replaceAll('AiO Bot Dashboard 2.14.35','AiO Bot Dashboard 2.14.36');
h=h.replaceAll('Dashboard 2.14.35','Dashboard 2.14.36');
fs.writeFileSync(dashPath,h);

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
w=w.replace('version:"2.14.35",brain:','version:"2.14.36",brain:');
w=w.replace('"access-control-allow-methods":"POST, OPTIONS"','"access-control-allow-methods":"GET, POST, OPTIONS"');
if(!w.includes('async function handlePushAckJson(')){
  const marker='async function handleStatus(request,env){';
  if(!w.includes(marker))throw new Error('handleStatus marker missing');
  const ack=`async function handlePushAckJson(request,env){const cors=corsFor(request,env);if(cors===null)return json({ok:false,error:"origin not allowed"},403);const u=new URL(request.url),name=text(u.searchParams.get("name")||"",80).trim(),after=number(u.searchParams.get("after"));if(!name||!after)return json({ok:false,error:"name and after required"},400,cors||{});let row=null;try{row=await env.DB.prepare("SELECT payload,received_at FROM character_status WHERE name=?").bind(name).first();}catch{return json({ok:false,error:"state lookup failed"},503,cors||{});}if(!row)return json({ok:false,pending:true,name,updatedAt:0},404,cors||{});let updated=0;try{updated=number(JSON.parse(row.payload||"{}").updatedAt);}catch{}if(updated<after)return json({ok:false,pending:true,name,updatedAt:updated,receivedAt:number(row.received_at)},404,cors||{});return json({ok:true,name,updatedAt:updated,receivedAt:number(row.received_at)},200,cors||{});}\n`;
  w=w.replace(marker,ack+marker);
}
const imageRoute='if(request.method==="GET"&&url.pathname==="/api/push-ack.gif")return handlePushAckImage(request,env);';
if(!w.includes('url.pathname==="/api/push-ack"'))w=mustReplace(w,imageRoute,imageRoute+'if(request.method==="GET"&&url.pathname==="/api/push-ack")return handlePushAckJson(request,env);','push ack JSON route');
w=w.replace('["/api/push","/api/pushframe","/api/state","/api/brain","/api/brain-feedback"]','["/api/push","/api/pushframe","/api/push-ack","/api/state","/api/brain","/api/brain-feedback"]');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);
fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));
v.version='2.14.36';v.dashboardVersion='2.14.36';v.build='2026-09-11';
fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));
p.version='2.14.36';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.36 merchant transaction routing and compact dashboard acknowledgement');
