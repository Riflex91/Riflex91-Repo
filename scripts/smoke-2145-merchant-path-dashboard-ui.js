#!/usr/bin/env node
"use strict";
const fs=require("fs"),assert=require("assert"),vm=require("vm");
const bot=fs.readFileSync("bot.js","utf8");
const dash=fs.readFileSync("cloudflare-dashboard/dashboard.html","utf8");
const worker=fs.readFileSync("cloudflare-dashboard/src/worker.js","utf8");

assert.match(bot,/var VERSION\s*=\s*['"]2\.14\.16['"]/);
assert.ok(bot.includes("function v2145MovePriority"),"move priority missing");
assert.ok(bot.includes("priority<Number(lock.priority||0)"),"lower priority moves must be deferred");
assert.ok(bot.includes("v2145MovePriority(lock.kind)>v2145MovePriority('explore')"),"Explorer must respect active Merchant routes");
assert.ok(bot.includes("dist(character,dest)<=75")&&bot.includes("!character.moving")&&bot.includes("!S.moveInFlight"),"vendor action must wait until settled");
assert.ok(bot.includes("maxed-upgrade-surplus"),"maxed useful surplus must become sellable");
assert.ok(bot.includes("function v2145EconomyMaintenanceTick"),"economy maintenance missing");
assert.ok(bot.includes("merchant_sell_scan"),"no-candidate sell diagnostic missing");
assert.ok(bot.includes(".mainbox .maincontent{overflow-y:auto"),"main menu must scroll to Headless");
assert.ok(bot.includes("v2145VitalFlow")&&bot.includes("vital('HP',r.hp,r.max_hp,'hp')")&&bot.includes("vital('MP',r.mp,r.max_mp,'mp')"),"animated party vitals missing");

assert.ok(dash.includes('data-section="characters"')&&dash.includes('data-section="map"')&&dash.includes('data-section="brain"')&&dash.includes('data-section="research"')&&dash.includes('data-section="group"'),"all dashboard categories must be collapsible");
assert.ok(dash.indexOf('data-section="characters"')<dash.indexOf('data-section="map"'),"characters must be first");
assert.ok(dash.indexOf('data-section="group"')>dash.indexOf('data-section="research"'),"group must be last");
assert.ok(dash.includes("function miniMapMarkup")&&dash.includes("mini-pulse"),"mini maps missing");
assert.ok(!dash.includes('<span>Gebiet</span>'),"Gebiet line remains");
assert.ok(worker.includes("miniMapMarkup"),"worker dashboard embed stale");
assert.doesNotThrow(()=>new vm.Script(bot),"bot syntax");
console.log("2.14.8 Merchant path/sell/dashboard/UI smoke OK");
