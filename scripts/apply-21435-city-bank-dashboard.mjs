#!/usr/bin/env node
import fs from 'node:fs';
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.35 city combat guard, committed bank routing and image-verified dashboard transport */')){
  bot=mustReplace(bot,'AiO Bot 2.14.34 | 2026-09-11','AiO Bot 2.14.35 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.34';","var VERSION = '2.14.35';",'bot version');
  const patch=fs.readFileSync('scripts/v21435-bot-patch.txt','utf8'),end=bot.lastIndexOf('\n})();');
  if(end<0)throw new Error('bot IIFE end missing');
  bot=bot.slice(0,end)+patch+bot.slice(end);
  fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
h=h.replaceAll('AiO Bot Dashboard 2.14.34','AiO Bot Dashboard 2.14.35');
h=h.replaceAll('Dashboard 2.14.34','Dashboard 2.14.35');
fs.writeFileSync(dashPath,h);

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
w=w.replace('version:"2.14.34",brain:','version:"2.14.35",brain:');
if(!w.includes('async function handlePushAckImage(')){
  const marker='async function handleStatus(request,env){';
  if(!w.includes(marker))throw new Error('handleStatus marker missing');
  const ack=`const PUSH_ACK_GIF=Uint8Array.from([71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,255,255,255,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59]);\nasync function handlePushAckImage(request,env){const u=new URL(request.url),name=text(u.searchParams.get("name")||"",80).trim(),after=number(u.searchParams.get("after"));if(!name||!after)return new Response(null,{status:404,headers:{"cache-control":"no-store"}});let row=null;try{row=await env.DB.prepare("SELECT payload,received_at FROM character_status WHERE name=?").bind(name).first();}catch{return new Response(null,{status:404,headers:{"cache-control":"no-store"}});}if(!row)return new Response(null,{status:404,headers:{"cache-control":"no-store"}});let updated=0;try{updated=number(JSON.parse(row.payload||"{}").updatedAt);}catch{}if(updated<after)return new Response(null,{status:404,headers:{"cache-control":"no-store"}});return new Response(PUSH_ACK_GIF,{status:200,headers:{"content-type":"image/gif","cache-control":"no-store, no-cache, must-revalidate","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});}\n`;
  w=w.replace(marker,ack+marker);
}
const statusRoute='if(request.method==="GET"&&url.pathname==="/api/status")return handleStatus(request,env);';
if(!w.includes('url.pathname==="/api/push-ack.gif"'))w=mustReplace(w,statusRoute,'if(request.method==="GET"&&url.pathname==="/api/push-ack.gif")return handlePushAckImage(request,env);'+statusRoute,'push ack image route');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);
fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));
v.version='2.14.35';v.dashboardVersion='2.14.35';v.build='2026-09-11';
fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));
p.version='2.14.35';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.35 city combat guard, bank route commit and dashboard image acknowledgement');
