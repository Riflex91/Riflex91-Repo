const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const dash=fs.readFileSync('cloudflare-dashboard/dashboard.html','utf8');
const worker=fs.readFileSync('cloudflare-dashboard/src/worker.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));

assert.equal(version.version,'2.14.13');
assert.equal(version.dashboardVersion,'2.14.13');
assert(bot.includes("var VERSION = '2.14.13';"));
assert(dash.includes('AiO Bot Dashboard 2.14.13'));
assert(worker.includes('AiO Bot Dashboard 2.14.13'));
assert(!bot.includes('v2144AuditEconomy('),'undefined v2144AuditEconomy reference must be gone');

const contractMatch=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);
assert(contractMatch,'FEATURE_CONTRACT missing');
const contract=JSON.parse(contractMatch[1].replace(/'/g,'"'));
for(const feature of ['merchant-bank-cleanup-confirmation','brain-teaching-hints','dashboard-terrain-tiles','dashboard-learning-feed']) assert(contract.includes(feature),'static FEATURE_CONTRACT missing '+feature);

assert(bot.includes('function v21413LiveBankCount'));
assert(bot.includes('beforeBank:v21413LiveBankCount(name,lv)'));
const start=bot.indexOf('  function v21413LiveBankCount');
const end=bot.indexOf('\n\n  v2148BankCleanupTick=function',start);
assert(start>=0&&end>start,'bank confirmation functions not extractable');
const source=bot.slice(start,end);
const ctx={
  character:{items:[{name:'slice_honey',level:0,q:38},null],bank:{items0:[{name:'slice_honey',level:0,q:100}]}},
  S:{times:{},merchantBankCleanup2148:{}},
  audits:[],refreshes:0,finish:'',
  freeSlots:null,
  v2149BankMap:()=>true,
  v2149RefreshBankSnapshot:()=>{ctx.refreshes++;},
  audit:(kind,message,data)=>ctx.audits.push({kind,message,data}),
  v2148BankCleanupFinish:(kind)=>{ctx.finish=kind;ctx.S.merchantBankCleanup2148=null;}
};
ctx.freeSlots=()=>ctx.character.items.filter(x=>!x).length;
ctx.v21412InventoryExact=(name,level)=>ctx.character.items.reduce((n,it)=>n+(it&&it.name===name&&(Number(it.level)||0)===(Number(level)||0)?(Number(it.q)||1):0),0);
vm.createContext(ctx);
vm.runInContext(source,ctx);

const progressed={awaiting:{name:'slice_honey',level:0,beforeExact:38,beforeFree:1,beforeBank:100,startedAt:1000},stores:0,lastProgressAt:1000};
ctx.character.bank.items0[0].q=138;
assert.strictEqual(ctx.v21412BankCleanupAwaiting(progressed,2000),false);
assert.strictEqual(progressed.awaiting,null);
assert.strictEqual(progressed.stores,1);
const confirmed=ctx.audits.find(x=>x.kind==='merchant_bank_cleanup_confirmed');
assert(confirmed,'live bank delta must confirm cleanup');
assert.strictEqual(confirmed.data.confirmation,'live-bank');
assert.strictEqual(confirmed.data.beforeBank,100);
assert.strictEqual(confirmed.data.afterBank,138);
assert(ctx.refreshes>0,'confirmed live state should refresh the warehouse snapshot');

ctx.audits=[];ctx.finish='';ctx.S.merchantBankCleanup2148={};
ctx.character.bank.items0[0].q=138;
const stalled={awaiting:{name:'slice_honey',level:0,beforeExact:38,beforeFree:1,beforeBank:138,startedAt:1000},stores:0,lastProgressAt:1000};
assert.strictEqual(ctx.v21412BankCleanupAwaiting(stalled,7001),false);
assert.strictEqual(ctx.finish,'merchant_bank_cleanup_sync_wait');
assert.strictEqual(stalled.stores,0,'stalled state must not be falsely confirmed');
assert.strictEqual(ctx.S.times.bankCleanupRetry2148,22001);

console.log('2.14.13 merchant stability smoke OK');
