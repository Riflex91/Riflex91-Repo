#!/usr/bin/env node
import fs from 'node:fs';

function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error('missing '+label);return s.replace(from,to);}
function addOnce(arr,x){if(arr.indexOf(x)<0)arr.push(x);}

const botPath='bot.js';let bot=fs.readFileSync(botPath,'utf8');
if(!bot.includes('/* v2.14.33 Update contract static/runtime closure hotfix */')){
  bot=mustReplace(bot,'AiO Bot 2.14.32 | 2026-09-11','AiO Bot 2.14.33 | 2026-09-11','bot header');
  bot=mustReplace(bot,"var VERSION = '2.14.32';","var VERSION = '2.14.33';",'bot version');

  const cm=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);
  if(!cm)throw new Error('FEATURE_CONTRACT missing');
  let manifest=JSON.parse(cm[1].replace(/'/g,'"'));
  const required=[
    'bestiary-item-policy-authority','merchant-capacity-relief-v2','merchant-bank-explicit-target',
    'farmer-self-service-eta','farmer-self-service-failsafe','farmer-self-service-lease',
    'brain-source-separation','permission-menu-auto-close',
    'transactional-economic-slot-reresolution','sell-transaction-confirmation','merchant-capacity-watchdog-v2',
    'farmer-merchant-order-self-service','dashboard-transport-fallback','cloud-state-fetch-backoff',
    'teacher-daily-quota-4006','recipe-analysis-throttle',
    'update-contract-static-runtime-closure','update-contract-array-registration-parser',
    'update-fetch-cache-bust','update-auto-singleflight'
  ];
  required.forEach(x=>addOnce(manifest,x));
  bot=bot.replace(cm[0],'var FEATURE_CONTRACT = '+JSON.stringify(manifest)+';');

  const patch=`\n\n  /* v2.14.33 Update contract static/runtime closure hotfix */\n  // The v2.14.31 runtime appended its protected features through an array/.forEach registration.\n  // The legacy updater in 2.14.31 only extracted the static manifest plus direct .push('x') calls,\n  // so it falsely rejected 2.14.32 even though those features were still present. The static manifest\n  // above now contains every critical v2.14.31 feature so old clients can accept this build.\n  try{[\n    'bestiary-item-policy-authority','merchant-capacity-relief-v2','merchant-bank-explicit-target',\n    'farmer-self-service-eta','farmer-self-service-failsafe','farmer-self-service-lease',\n    'brain-source-separation','permission-menu-auto-close',\n    'transactional-economic-slot-reresolution','sell-transaction-confirmation','merchant-capacity-watchdog-v2',\n    'farmer-merchant-order-self-service','dashboard-transport-fallback','cloud-state-fetch-backoff',\n    'teacher-daily-quota-4006','recipe-analysis-throttle',\n    'update-contract-static-runtime-closure','update-contract-array-registration-parser',\n    'update-fetch-cache-bust','update-auto-singleflight'\n  ].forEach(function(f){if(FEATURE_CONTRACT.indexOf(f)<0)FEATURE_CONTRACT.push(f);});}catch(e){}\n\n  var v21433ExtractContractBase=v282ExtractContract;\n  v282ExtractContract=function(code){\n    var out=v21433ExtractContractBase(code)||[],src=String(code||''),m;\n    function add(x){x=String(x||'');if(x&&out.indexOf(x)<0)out.push(x);}\n    var direct=/FEATURE_CONTRACT\\.push\\(([\\s\\S]*?)\\);/g;\n    while((m=direct.exec(src))){var q=/['\"]([^'\"]+)['\"]/g,x;while((x=q.exec(m[1])))add(x[1]);}\n    var arrays=/\\[((?:\\s*['\"][^'\"]+['\"]\\s*,?\\s*)+)\\]\\.forEach\\(function\\(f\\)\\{if\\(FEATURE_CONTRACT\\.indexOf\\(f\\)<0\\)FEATURE_CONTRACT\\.push\\(f\\);\\}\\);/g;\n    while((m=arrays.exec(src))){var aq=/['\"]([^'\"]+)['\"]/g,ax;while((ax=aq.exec(m[1])))add(ax[1]);}\n    return out;\n  };\n\n  // raw.githubusercontent.com can briefly serve a just-replaced main object through an edge cache.\n  // Cache-bust updater GETs so a newly published version and its bot.js are fetched as one release.\n  var v21433FetchTextBase=fetchText;\n  fetchText=function(url){\n    var u=String(url||'');\n    try{if(/^https:\\/\\/raw\\.githubusercontent\\.com\\//i.test(u)){var x=new URL(u);x.searchParams.set('_aio_update',String(clock()));u=x.toString();}}catch(e){}\n    return v21433FetchTextBase(u);\n  };\n\n  // Multiple peer update signals can queue timers before the first attempt settles. Keep automatic\n  // installation single-flight per target version; manual update remains available immediately.\n  S.updateSingleflight21433=S.updateSingleflight21433||{version:'',until:0};\n  var v21433SelfUpdateBase=selfUpdate;\n  selfUpdate=function(auto){\n    var v=String(S.update&&S.update.latest||'');\n    if(auto&&v&&S.updateSingleflight21433.version===v&&clock()<Number(S.updateSingleflight21433.until||0))return false;\n    if(auto&&v)S.updateSingleflight21433={version:v,until:clock()+8000};\n    return v21433SelfUpdateBase(auto);\n  };\n\n  audit('feature_contract','2.14.33 Update-Contract-Hotfix aktiv',{staticManifestClosed:true,arrayRegistrationParser:true,cacheBust:true,autoSingleflightMs:8000,features:FEATURE_CONTRACT});\n`;
  const end=bot.lastIndexOf('\n})();');if(end<0)throw new Error('bot IIFE end missing');
  bot=bot.slice(0,end)+patch+bot.slice(end);
  fs.writeFileSync(botPath,bot);
}

const dashPath='cloudflare-dashboard/dashboard.html';let h=fs.readFileSync(dashPath,'utf8');
h=h.replace(/AiO Bot Dashboard 2\.14\.32/g,'AiO Bot Dashboard 2.14.33');
fs.writeFileSync(dashPath,h);

const workerPath='cloudflare-dashboard/src/worker.js';let w=fs.readFileSync(workerPath,'utf8');
w=w.replace('version:"2.14.32",brain:','version:"2.14.33",brain:');
if(!w.includes('version:"2.14.33",brain:'))throw new Error('worker health version missing');
w=w.replace(/const DASHBOARD_HTML = [\s\S]*?;\n\n(?=function )/,`const DASHBOARD_HTML = ${JSON.stringify(h)};\n\n`);
fs.writeFileSync(workerPath,w);

const vp='version.json',v=JSON.parse(fs.readFileSync(vp,'utf8'));
v.version='2.14.33';v.dashboardVersion='2.14.33';v.build='2026-09-11';
fs.writeFileSync(vp,JSON.stringify(v,null,2)+'\n');
const pp='cloudflare-dashboard/package.json',p=JSON.parse(fs.readFileSync(pp,'utf8'));
p.version='2.14.33';fs.writeFileSync(pp,JSON.stringify(p,null,2)+'\n');
console.log('Applied v2.14.33 update-contract hotfix');
