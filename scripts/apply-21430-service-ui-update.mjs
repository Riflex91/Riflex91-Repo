#!/usr/bin/env node
import fs from 'node:fs';
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.30 Merchant service preparation, update compatibility and inventory context UX */')){
  bot=mustReplace(bot,'AiO Bot 2.14.29 | 2026-09-11','AiO Bot 2.14.30 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.29';","var VERSION = '2.14.30';",'bot version');
  const patch=fs.readFileSync('scripts/v21430-bot-patch.txt','utf8'),end=bot.lastIndexOf('\n})();');if(end<0)throw new Error('bot IIFE end missing');bot=bot.slice(0,end)+patch+bot.slice(end);fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
if(!h.includes('v2.14.30 group-map fullscreen')){
  h=mustReplace(h,'<title>AiO Bot Dashboard 2.14.29</title>','<title>AiO Bot Dashboard 2.14.30</title>','dashboard title');
  h=mustReplace(h,'<header class="top"><strong>AiO Bot Dashboard 2.14.29</strong>','<header class="top"><strong>AiO Bot Dashboard 2.14.30</strong>','dashboard header');
  h=mustReplace(h,'<button class="btn alt" id="fitMap">Einpassen</button>','<button class="btn alt" id="fitMap">Einpassen</button><button class="btn alt" id="mapFullscreen" title="Gruppenkarte im Vollbild öffnen">⛶ Vollbild</button>','fullscreen map button');
  h=h.replace('<details class="dash-section" data-section="group" open>','<details class="dash-section" data-section="group" hidden>');
  const css='\n.mapcard:fullscreen,.mapcard:-webkit-full-screen{width:100vw;height:100vh;margin:0;border-radius:0;border:0;background:#07111a;display:flex;flex-direction:column}.mapcard:fullscreen .maptop,.mapcard:-webkit-full-screen .maptop{flex:0 0 auto}.mapcard:fullscreen .mapwrap,.mapcard:-webkit-full-screen .mapwrap{flex:1 1 auto;height:auto;min-height:0}.mapcard:fullscreen #map,.mapcard:-webkit-full-screen #map{height:100%}\n';
  const styleEnd=h.indexOf('</style>');if(styleEnd<0)throw new Error('dashboard style end missing');h=h.slice(0,styleEnd)+css+h.slice(styleEnd);
  const js=`\n/* v2.14.30 group-map fullscreen */\n(function(){\n  const btn=document.getElementById('mapFullscreen');if(!btn)return;const card=btn.closest('.mapcard');if(!card)return;\n  function active(){return document.fullscreenElement===card||document.webkitFullscreenElement===card;}\n  function sync(){btn.textContent=active()?'⛶ Vollbild verlassen':'⛶ Vollbild';btn.title=active()?'Vollbild verlassen':'Gruppenkarte im Vollbild öffnen';setTimeout(()=>{try{if(typeof renderMap==='function'&&view)renderMap();}catch(e){}},60);}\n  btn.addEventListener('click',async()=>{try{if(active()){if(document.exitFullscreen)await document.exitFullscreen();else if(document.webkitExitFullscreen)document.webkitExitFullscreen();}else{if(card.requestFullscreen)await card.requestFullscreen();else if(card.webkitRequestFullscreen)card.webkitRequestFullscreen();}}catch(e){console.warn('Fullscreen nicht verfügbar',e);}});\n  document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);sync();\n})();\n`;
  const end=h.lastIndexOf('</script>');if(end<0)throw new Error('dashboard script end missing');h=h.slice(0,end)+js+h.slice(end);fs.writeFileSync(dashPath,h);
}

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
w=w.replace('version:"2.14.29",brain:','version:"2.14.30",brain:');
if(!w.includes('version:"2.14.30",brain:'))throw new Error('worker health version missing');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));v.version='2.14.30';v.dashboardVersion='2.14.30';v.build='2026-09-11';fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));p.version='2.14.30';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.30 Merchant service preparation, update compatibility and dashboard fullscreen');
