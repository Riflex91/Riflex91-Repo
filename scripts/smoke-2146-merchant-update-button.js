#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.11');
assert.equal(version.dashboardVersion,'2.14.11');
assert.match(bot,/var VERSION = ['"]2\.14\.11['"]/);
assert.ok(!bot.includes('v2144NpcValue(it)'),'undefined v2144NpcValue reference must be gone');
assert.ok(bot.includes('itemValueSafe(it)'),'sell decision must use existing safe item value helper');
assert.ok(bot.includes("C.language==='de'?'Auf Updates prüfen & installieren':'Check & install update'"),'German manual check-and-install label missing');
assert.ok(bot.includes("C.language==='de'?'Prüfe auf Updates …':'Checking for updates …'"),'checking state label missing');
assert.ok(bot.includes("audit('update_manual_check'"),'manual update click audit missing');
assert.ok(bot.includes('var started=updateCheckTick(true);'),'manual update button must force the checker');
assert.ok(bot.includes('update-manual-status'),'manual update status UI missing');
console.log('2.14.8 Merchant crash / manual update UX smoke OK');
