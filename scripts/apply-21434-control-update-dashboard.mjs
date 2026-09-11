#!/usr/bin/env node
import fs from 'node:fs';
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.34 control-loop, manual updater and verified dashboard transport hotfix */')){
  bot=mustReplace(bot,'AiO Bot 2.14.33 | 2026-09-11','AiO Bot 2.14.34 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.33';","var VERSION = '2.14.34';",'bot version');
  const bad="return v291ItemFingerprint? v291ItemFingerprint(x.it):x.it.name+'|'+(Number(x.it.level)||0);";
  const good="return (typeof v291ItemFingerprint==='function')?v291ItemFingerprint(x.it):x.it.name+'|'+(Number(x.it.level)||0);";
  bot=mustReplace(bot,bad,good,'undefined compound fingerprint reference');
  const patch=fs.readFileSync('scripts/v21434-bot-patch.txt','utf8'),end=bot.lastIndexOf('\n})();');
  if(end<0)throw new Error('bot IIFE end missing');
  bot=bot.slice(0,end)+patch+bot.slice(end);
  fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
h=h.replaceAll('AiO Bot Dashboard 2.14.33','AiO Bot Dashboard 2.14.34');
h=h.replaceAll('Dashboard 2.14.33','Dashboard 2.14.34');
fs.writeFileSync(dashPath,h);

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
w=w.replace('version:"2.14.33",brain:','version:"2.14.34",brain:');
const oldCors=`function allowedOrigins(env) { const configured=String(env.PUSH_ORIGINS||"").split(",").map(v=>v.trim()).filter(Boolean); return configured.length?configured:DEFAULT_PUSH_ORIGINS; }
function corsFor(request, env) { const origin=request.headers.get("origin"); if(!origin)return {}; if(!allowedOrigins(env).includes(origin))return null; return {"access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type","access-control-max-age":"86400",vary:"Origin"}; }`;
const newCors=`function allowedOrigins(env) { const configured=String(env.PUSH_ORIGINS||"").split(",").map(v=>v.trim()).filter(Boolean); return [...new Set([...DEFAULT_PUSH_ORIGINS,...configured])]; }
function adventureOrigin(origin){try{const u=new URL(origin);return u.protocol==="https:"&&(u.hostname==="adventure.land"||u.hostname.endsWith(".adventure.land"));}catch{return false;}}
function corsFor(request, env) { const origin=request.headers.get("origin"); const base={"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type","access-control-max-age":"86400",vary:"Origin"}; if(!origin||origin==="null")return {...base,"access-control-allow-origin":"*"}; if(!allowedOrigins(env).includes(origin)&&!adventureOrigin(origin))return null; return {...base,"access-control-allow-origin":origin}; }`;
if(!w.includes('function adventureOrigin(origin)'))w=mustReplace(w,oldCors,newCors,'worker CORS policy');

if(!w.includes('async function handlePushFrame(')){
  const marker='async function handleStatus(request,env){';
  if(!w.includes(marker))throw new Error('handleStatus marker missing');
  const bridge=`function pushFrameReply(data){const payload=JSON.stringify(data).replace(/</g,"\\u003c");return new Response('<!doctype html><meta charset="utf-8"><script>parent.postMessage('+payload+',"*")<\\/script>',{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; frame-ancestors https://adventure.land https://www.adventure.land"}});}
async function handlePushFrame(request,env){const token=text(new URL(request.url).searchParams.get("ack")||"",80).replace(/[^A-Za-z0-9_-]/g,"");const cors=corsFor(request,env);if(cors===null)return pushFrameReply({type:"aio-dashboard-ack",token,ok:false,error:"origin not allowed"});let form;try{form=await request.formData();}catch{return pushFrameReply({type:"aio-dashboard-ack",token,ok:false,error:"invalid form"});}if(!(await secretMatches(form.get("writeKey"),env.WRITE_KEY)))return pushFrameReply({type:"aio-dashboard-ack",token,ok:false,error:"unauthorized"});let raw=String(form.get("status")||""),input;try{input=JSON.parse(raw);}catch{return pushFrameReply({type:"aio-dashboard-ack",token,ok:false,error:"invalid status JSON"});}const status=cleanStatus(input);if(!status)return pushFrameReply({type:"aio-dashboard-ack",token,ok:false,error:"invalid status"});const receivedAt=Date.now();await env.DB.prepare(\`INSERT INTO character_status (name,payload,received_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET payload=excluded.payload,received_at=excluded.received_at\`).bind(status.name,JSON.stringify(status),receivedAt).run();return pushFrameReply({type:"aio-dashboard-ack",token,ok:true,name:status.name,receivedAt});}
`;
  w=w.replace(marker,bridge+marker);
}
const oldRoutes='if(request.method==="OPTIONS"&&["/api/push","/api/state","/api/brain","/api/brain-feedback"].includes(url.pathname))';
const newRoutes='if(request.method==="OPTIONS"&&["/api/push","/api/pushframe","/api/state","/api/brain","/api/brain-feedback"].includes(url.pathname))';
w=w.replace(oldRoutes,newRoutes);
const pushRoute='if(request.method==="POST"&&url.pathname==="/api/push")return handlePush(request,env);';
if(!w.includes('url.pathname==="/api/pushframe"'))w=mustReplace(w,pushRoute,pushRoute+'if(request.method==="POST"&&url.pathname==="/api/pushframe")return handlePushFrame(request,env);','pushframe route');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);
fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));
v.version='2.14.34';v.dashboardVersion='2.14.34';v.build='2026-09-11';
fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));
p.version='2.14.34';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.34 control-loop, manual updater and verified dashboard transport hotfix');
