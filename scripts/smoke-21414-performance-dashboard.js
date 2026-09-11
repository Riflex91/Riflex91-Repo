const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const dash=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));

assert.ok(/^2\.14\.\d+$/.test(version.version));
assert.equal(version.dashboardVersion,version.version);
assert(bot.includes("var VERSION = '2.14.21';"));
const contractMatch=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);
assert(contractMatch);
const contract=JSON.parse(contractMatch[1].replace(/'/g,'"'));
for(const f of ['merchant-performance-budget','merchant-performance-telemetry','dashboard-terrain-pass-through','dashboard-vector-map-fallback','cloud-unconfigured-idle']) assert(contract.includes(f),f);

assert(bot.includes("gap=pressured?1400:10000"));
assert(bot.includes("now-Number(c.at||0)<1400"));
assert(bot.includes("now-Number(c.at||0)<850"));
assert(bot.includes("now-Number(S.recipeAnalysis.at||0)<8000"));
assert(bot.includes("character.ctype==='merchant'?(S.moveInFlight||character.moving?2600:1600):900"));
assert(bot.includes("character.ctype==='merchant'?2500:1500"));
assert(bot.includes("merchant_performance_sample"));
assert(bot.includes("v21414CompactMoveTarget"));
assert(bot.includes("v21414CompactMerchantPlan"));
assert(bot.includes("v21414TerrainOwner"));
assert(bot.includes("fallback='collision-lines'"));

const helperStart=worker.indexOf('function cleanTerrainTuple');
const helperEnd=worker.indexOf('\n\nasync function ensureAiTables',helperStart);
assert(helperStart>=0&&helperEnd>helperStart,'Worker sanitizer block missing');
const ctx={text:(v,max)=>String(v==null?'':v).slice(0,max||500),number:(v,d=0)=>Number.isFinite(Number(v))?Number(v):d,Date};
vm.createContext(ctx);
vm.runInContext(worker.slice(helperStart,helperEnd),ctx);
const cleaned=ctx.cleanStatus({
  type:'aio-bot-status',version:6,botVersion:'2.14.17',name:'Ranger1',ctype:'ranger',role:'dps',
  map:'main',x:10,y:20,updatedAt:123,
  terrain:{map:'main',d:0,t:[['forest',0,0,32,32]],p:[[0,0,0,64,64]],g:[],a:[],s:{forest:'/images/tiles/map/forest.png'},source:'Adventure Land G.geometry/G.tilesets',bytes:1234},
  learningFeed:[{icon:'x',title:'seen',text:'fact',detail:'data',confidence:'high',confidencePct:90,at:1}],
  sprite:{skin:'ranger',file:'/images/characters/ranger.png',row:0,column:1,rows:4,columns:4},
  brainExplanation:{current:'work',why:'reason',world:{total:3,gameVersion:'15623'}}
});
assert(cleaned,'cleanStatus rejected valid payload');
assert(cleaned.terrain&&cleaned.terrain.t.length===1&&cleaned.terrain.p.length===1,'terrain stripped');
assert.equal(cleaned.terrain.s.forest,'/images/tiles/map/forest.png');
assert.equal(cleaned.learningFeed.length,1,'learning feed stripped');
assert(cleaned.sprite&&cleaned.sprite.file.includes('ranger.png'),'sprite stripped');
assert(cleaned.brainExplanation&&cleaned.brainExplanation.current==='work','brain explanation stripped');

assert(dash.includes('AiO Bot Dashboard 2.14.21'));
assert(dash.includes('function terrainMeta'));
assert(dash.includes('function terrainVectorMarkup'));
assert(dash.includes('function terrainGridMarkup'));
assert(dash.includes('G.geometry-Kollisionslinien als Vektor-Fallback'));
assert(worker.includes('AiO Bot Dashboard 2.14.21'));
console.log('2.14.17 Merchant performance / dashboard terrain smoke OK');
