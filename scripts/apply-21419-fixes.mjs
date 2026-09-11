#!/usr/bin/env node
import fs from 'node:fs';
const p='bot.js'; let s=fs.readFileSync(p,'utf8');
function must(oldText,newText,label){if(!s.includes(oldText))throw new Error('missing '+label);s=s.replace(oldText,newText);}
must("if(p>Number(r.priority||0)){var prev=r.owner;r.owner=owner;r.priority=p;r.since=now;r.token=(Number(r.token)||0)+1;r.meta=meta||null;audit('merchant_route_preempted','Merchant-Route kontrolliert priorisiert',{from:prev,to:owner,fromPriority:Number(r.priority)||0,toPriority:p,meta:meta||null},'warning');return true;}","if(p>Number(r.priority||0)){var prev=r.owner,prevPriority=Number(r.priority)||0;r.owner=owner;r.priority=p;r.since=now;r.token=(Number(r.token)||0)+1;r.meta=meta||null;audit('merchant_route_preempted','Merchant-Route kontrolliert priorisiert',{from:prev,to:owner,fromPriority:prevPriority,toPriority:p,meta:meta||null},'warning');return true;}",'preempt telemetry');
must("S.capacityHard21419=true;v21419RouteAcquire('capacity',V21419_ROUTE_PRIORITY.capacity,{free:freeSlots(),reserve:Number(C.merchantInventoryReserve)||0});var r=v21419PressureBase();if(!v21419CapacityHard()){S.capacityHard21419=false;v21419RouteRelease('capacity');}return r;","S.capacityHard21419=true;var r=v21419PressureBase();if(!v21419CapacityHard())S.capacityHard21419=false;return r;",'capacity recovery owner');
const insert=String.raw`
  var v21419VendorRouteBase=v273SellTrashTick;
  v273SellTrashTick=function(){if(!v21419RouteAcquire('vendor',V21419_ROUTE_PRIORITY.vendor,{bankFull:!!S.bankFull,capacity:v21419CapacityHard()}))return false;var r=v21419VendorRouteBase();if(!r&&!character.moving&&!S.moveInFlight)v21419RouteRelease('vendor');return r;};
  var v21419StandRouteBase=merchantStandTick;
  merchantStandTick=function(){if(v21419CapacityHard()&&!S.bankFull)return false;if(!v21419RouteAcquire('stand',V21419_ROUTE_PRIORITY.stand,{capacity:v21419CapacityHard()}))return false;var r=v21419StandRouteBase();if(!r&&!character.moving&&!S.moveInFlight)v21419RouteRelease('stand');return r;};
  if(typeof sell==='function'){
    var v21419SellBase=sell;
    sell=function(slotIndex,quantity){var it=character.items&&character.items[slotIndex];if(character.ctype==='merchant'&&it){['upgrade','compound'].forEach(function(question){var ev=v21419PresaleEvaluation({item:it.name,level:Number(it.level)||0,question:question,npcValueNow:null,projectedValue:null,scrollCost:null,successProbability:null,surplus:true,protected:false,rare:false,required:false});audit('merchant_presale_evaluation','Konservative Vorverkaufsbewertung',ev);});}return v21419SellBase.apply(this,arguments);};
  }
`;
const marker="  var v21419DashboardBase=dashboardPayload;";if(!s.includes(marker))throw new Error('dashboard marker missing');s=s.replace(marker,insert+'\n'+marker);
fs.writeFileSync(p,s);
let smoke=fs.readFileSync('scripts/smoke-21418-merchant-stability-performance.js','utf8');
smoke=smoke.replace("const cap=bot.slice(bot.lastIndexOf('v290InventoryPressureTick=function(){'),bot.indexOf('function v21418ConfigProvenance'));","const capStart=bot.indexOf('v290InventoryPressureTick=function(){',bot.indexOf('function v21418GuardedLoot'));const cap=bot.slice(capStart,bot.indexOf('function v21418ConfigProvenance',capStart));");
fs.writeFileSync('scripts/smoke-21418-merchant-stability-performance.js',smoke);
console.log('Applied 2.14.19 layering fixes');
