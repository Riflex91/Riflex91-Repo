#!/usr/bin/env node
import fs from 'node:fs';
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.38 targeted capacity relief, rate-ranked fallback, autonomous farmer loot service and dashboard heartbeat */')){
  bot=mustReplace(bot,'AiO Bot 2.14.37 | 2026-09-11','AiO Bot 2.14.38 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.37';","var VERSION = '2.14.38';",'bot version');
  const patch=fs.readFileSync('scripts/v21438-bot-patch.txt','utf8'),end=bot.lastIndexOf('\n})();');
  if(end<0)throw new Error('bot IIFE end missing');
  bot=bot.slice(0,end)+patch+bot.slice(end);
  fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
h=h.replaceAll('AiO Bot Dashboard 2.14.37','AiO Bot Dashboard 2.14.38');
h=h.replaceAll('Dashboard 2.14.37','Dashboard 2.14.38');
if(!h.includes("state=String(c.connectionState||'').toLowerCase()")){
  h=mustReplace(h,"const off=c.ageSeconds>30;return", "const age=Number(c.ageSeconds)||0,state=String(c.connectionState||'').toLowerCase(),off=state?state==='offline':age>120,delayed=!off&&(state==='delayed'||age>30);return",'dashboard presence state');
  h=mustReplace(h,"class=\"status ${off?'offline':'live'}\">${off?'OFFLINE':'LIVE'}</div>","class=\"status ${off?'offline':delayed?'warn':'live'}\">${off?'OFFLINE':delayed?'VERZÖGERT':'LIVE'}</div>",'dashboard presence label');
}
fs.writeFileSync(dashPath,h);

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
w=w.replace('version:"2.14.37",brain:','version:"2.14.38",brain:');
if(!w.includes('async function handlePushSimple(')){
  const marker='function pushFrameReply(data){';
  if(!w.includes(marker))throw new Error('push frame marker missing');
  const simple=`async function handlePushSimple(request,env){const cors=corsFor(request,env);if(cors===null)return new Response(null,{status:403,headers:securityHeaders()});let raw='';try{raw=await request.text();}catch{return new Response(null,{status:400,headers:securityHeaders()});}if(raw.length>MAX_PUSH_BYTES)return new Response(null,{status:413,headers:securityHeaders()});const form=new URLSearchParams(raw),writeKey=form.get('writeKey')||'',statusRaw=form.get('status')||'';if(!(await secretMatches(writeKey,env.WRITE_KEY)))return new Response(null,{status:401,headers:securityHeaders()});let input;try{input=JSON.parse(statusRaw);}catch{return new Response(null,{status:400,headers:securityHeaders()});}const status=cleanStatus(input);if(!status)return new Response(null,{status:400,headers:securityHeaders()});const receivedAt=Date.now();await env.DB.prepare(\`INSERT INTO character_status (name,payload,received_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET payload=excluded.payload,received_at=excluded.received_at\`).bind(status.name,JSON.stringify(status),receivedAt).run();return new Response(null,{status:204,headers:{...securityHeaders(),'cache-control':'no-store',...(cors||{})}});}\n`;
  w=w.replace(marker,simple+marker);
}
if(!w.includes("p.connectionState=p.ageSeconds<=30?'live':p.ageSeconds<=120?'delayed':'offline'")){
  w=mustReplace(w,"p.ageSeconds=Math.max(0,Math.round((now-p.receivedAt)/1000));return p;","p.ageSeconds=Math.max(0,Math.round((now-p.receivedAt)/1000));p.connectionState=p.ageSeconds<=30?'live':p.ageSeconds<=120?'delayed':'offline';return p;",'server presence state');
}
if(!w.includes('url.pathname==="/api/push-simple"'))w=mustReplace(w,'if(request.method==="POST"&&url.pathname==="/api/push")return handlePush(request,env);','if(request.method==="POST"&&url.pathname==="/api/push")return handlePush(request,env);if(request.method==="POST"&&url.pathname==="/api/push-simple")return handlePushSimple(request,env);','simple push route');
w=w.replace('["/api/push","/api/pushframe","/api/push-ack","/api/state","/api/brain","/api/brain-feedback"]','["/api/push","/api/push-simple","/api/pushframe","/api/push-ack","/api/state","/api/brain","/api/brain-feedback"]');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);
fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));
v.version='2.14.38';v.dashboardVersion='2.14.38';v.build='2026-09-11';
fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));
p.version='2.14.38';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.38 capacity, farm, self-service and dashboard heartbeat hotfix');
