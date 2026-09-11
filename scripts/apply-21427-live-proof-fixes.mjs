#!/usr/bin/env node
import fs from 'node:fs';

function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';
let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.27 live-proof Merchant, Brain UI and full-terrain payload */')){
  bot=mustReplace(bot,'AiO Bot 2.14.26 | 2026-09-11','AiO Bot 2.14.27 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.26';","var VERSION = '2.14.27';",'bot version');
  const patch=fs.readFileSync('scripts/v21427-bot-patch.txt','utf8');
  const end=bot.lastIndexOf('\n})();');if(end<0)throw new Error('bot IIFE end missing');
  bot=bot.slice(0,end)+patch+bot.slice(end);
  fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';
let h=fs.readFileSync(dashPath,'utf8');
if(!h.includes('v2.14.27 inline player arrow + packed group terrain recovery')){
  h=mustReplace(h,'<title>AiO Bot Dashboard 2.14.26</title>','<title>AiO Bot Dashboard 2.14.27</title>','dashboard title');
  h=mustReplace(h,'<header class="top"><strong>AiO Bot Dashboard 2.14.26</strong>','<header class="top"><strong>AiO Bot Dashboard 2.14.27</strong>','dashboard header');
  const patch=fs.readFileSync('scripts/v21427-dashboard-patch.js','utf8');
  const end=h.lastIndexOf('</script>');if(end<0)throw new Error('dashboard script end missing');
  h=h.slice(0,end)+patch+'\n'+h.slice(end);
  fs.writeFileSync(dashPath,h);
}

const workerPath='cloudflare-dashboard/src/worker.js';
let w=fs.readFileSync(workerPath,'utf8');
w=mustReplace(w,'const MAX_PUSH_BYTES = 128 * 1024;','const MAX_PUSH_BYTES = 512 * 1024;','worker push limit');
const oldTerrain=`  const groups=Array.isArray(input.g)?input.g.slice(0,64).map(g=>cleanTerrainRows(g,240,6)).filter(g=>g.length):[];\n  const packed=typeof input.pc==="string"?input.pc.slice(0,120000):"";\n  const out=Object.assign({},base,{d:input.d==null?null:number(input.d),t:cleanTerrainRows(input.t,640,6),p:cleanTerrainRows(input.p,2600,6),pc:packed,g:groups,a:cleanTerrainRows(input.a,500,6),s:sets});\n  try{if(JSON.stringify(out).length>118000)return Object.assign({},base,{omitted:true,fallback:base.fallback||"worker-size-guard"});}catch{}\n  return out;`;
const newTerrain=`  const groups=Array.isArray(input.g)?input.g.slice(0,64).map(g=>cleanTerrainRows(g,240,6)).filter(g=>g.length):[];\n  const packed=typeof input.pc==="string"?input.pc.slice(0,480000):"";\n  const packedGroups=Array.isArray(input.gc)?input.gc.slice(0,96).map(x=>text(x,480000)):[];\n  const packedAnimations=typeof input.ac==="string"?input.ac.slice(0,480000):"";\n  const out=Object.assign({},base,{d:input.d==null?null:number(input.d),t:cleanTerrainRows(input.t,1600,8),p:cleanTerrainRows(input.p,6000,6),pc:packed,g:groups,gc:packedGroups,a:cleanTerrainRows(input.a,1200,8),ac:packedAnimations,s:sets});\n  try{if(JSON.stringify(out).length>480000)return Object.assign({},base,{omitted:true,fallback:base.fallback||"worker-size-guard-v21427"});}catch{}\n  return out;`;
w=mustReplace(w,oldTerrain,newTerrain,'worker packed terrain sanitizer');
// Re-embed the exact dashboard release in the Worker after dashboard modifications.
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);
fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));v.version='2.14.27';v.dashboardVersion='2.14.27';v.build='2026-09-11';fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));p.version='2.14.27';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.27 live-proof fixes');
