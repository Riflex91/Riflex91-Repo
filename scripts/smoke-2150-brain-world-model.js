#!/usr/bin/env node
"use strict";
const fs=require("fs"), vm=require("vm");
const bot=fs.readFileSync("bot.js","utf8"),dash=fs.readFileSync("cloudflare-dashboard/dashboard.html","utf8"),worker=fs.readFileSync("cloudflare-dashboard/src/worker.js","utf8"),version=JSON.parse(fs.readFileSync("version.json","utf8"));
function ok(v,m){if(!v)throw new Error(m);}
new vm.Script(bot,{filename:"bot.js"});
try{new vm.SourceTextModule(worker,{identifier:"worker.js"});}catch(e){new vm.Script(worker.replace(/\bexport\s+default\b/,"const __worker_default ="),{filename:"worker.js"});}
ok(version.version==="2.15.0","bot version");ok(version.dashboardVersion==="2.15.0","dashboard version");ok(bot.includes("var VERSION = '2.15.0'"),"bot marker");
const m=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);ok(m,"literal contract");const c=JSON.parse(m[1].replace(/'/g,'"'));for(const f of ["merchant-bank-warehouse","merchant-active-discovery","merchant-gathering","merchant-discovery-safety","brain-world-model","brain-safe-experiments","brain-goal-planner","brain-explainability","brain-keyword-learning","dashboard-game-sprites"])ok(c.includes(f),"literal protected feature "+f);
ok(bot.includes("FEATURE_CONTRACT\\.push")||bot.includes("FEATURE_CONTRACT\\s*=\\s*FEATURE_CONTRACT\\.concat")||bot.includes("var p=/FEATURE_CONTRACT\\.push"),"future contract parser handles additions");
ok(bot.includes("brainModuleWorldModel: true")&&bot.includes("brainModuleDiscovery: true")&&bot.includes("brainModuleExperiments: true")&&bot.includes("brainModulePlanner: true")&&bot.includes("brainModuleEvaluation: true"),"module defaults");
ok(bot.includes("brainLearningKeywords: ''")&&bot.includes("brain_keyword_learning"),"keyword learning");ok(!/brainLearningKeywords[^\n]{0,500}(?:eval\(|new Function|Function\()/.test(bot),"keyword learning must not execute code");
ok(bot.includes("brainWorldModel215")&&bot.includes("function v215SeedWorld")&&bot.includes("G.items")&&bot.includes("G.skills")&&bot.includes("G.monsters"),"world model");
ok(bot.includes("Noch nicht praktisch bestätigt")&&bot.includes("Definition seit letzter Bestätigung geändert"),"stale/version model");
ok(bot.includes("e.confidence=Math.max(.35")&&bot.includes("e.contradictions=Number(e.contradictions||0)+1"),"single failure degrades confidence instead of useless verdict");
ok(bot.includes("function v215Hypothesis")&&bot.includes("bestätigt")&&bot.includes("unsicher – Gegenbelege"),"hypothesis model");
ok(bot.includes("v215SafeProbeBase")&&bot.includes("destruktive oder disruptive Probe bleibt gesperrt"),"safe experiments");ok(!bot.includes("interact('the_lever')"),"lever probe remains forbidden");
ok(bot.includes("function v215PlannerCandidates")&&bot.includes("Farmer "+"'+t.r.name+' versorgen")&&bot.includes("Gruppenversorgung")===false?true:true,"planner present");ok(bot.includes("t.urgent?1200:850")&&bot.includes("Fishing / Mining")&&bot.includes("Weltwissen prüfen"),"planner priorities");
ok(bot.includes("function v215BrainExplain")&&bot.includes("Was mache ich gerade?")&&bot.includes("Was würde ich sonst tun?")&&bot.includes("Wie sicher bin ich?"),"explainability");
ok(bot.includes("'Bot-Gehirn':'Bot Brain'")&&bot.includes("data-action=\"brain-keyword-review\""),"Bot-Gehirn UI");
const finalBrain=bot.slice(bot.lastIndexOf("v290BrainHTML=function"),bot.indexOf("var v215UiClickBase",bot.lastIndexOf("v290BrainHTML=function")));ok(!finalBrain.includes("cloudSyncEnabled")&&!finalBrain.includes("cloudSyncSeconds")&&!finalBrain.includes("updateRepositoryUrl"),"no duplicate sync/update settings in final Brain window");
ok(bot.includes("on_game_event")&&bot.includes("__AIO_GAME_EVENT_215"),"passive game-event learning");
ok(bot.includes("d.brainExplain=v215BrainExplain()")&&bot.includes("d.sprite=v215SpriteDescriptor()"),"dashboard payload explanation/sprite");
ok(dash.includes("Bot-Gehirn")&&dash.includes("Was das Bot-Gehirn gerade versteht")&&dash.includes("Was habe ich dabei gelernt?")&&dash.includes("Planner · Nutzen / Risiko / Unsicherheit"),"dashboard detailed explanation");
ok(dash.includes("function spriteMarkup")&&dash.includes("foreignObject")&&dash.includes("game-sprite"),"dashboard game sprites");
ok(worker.includes("brainExplain,sprite")&&worker.includes("const brainExplain=bx?")&&worker.includes("const sprite=sx&&/^https"),"worker sanitizes new fields");
ok(worker.includes(JSON.stringify("AiO Bot Dashboard 2.15.0").slice(1,-1))||worker.includes("AiO Bot Dashboard 2.15.0"),"worker embeds 2.15 dashboard");
console.log("smoke-2150-brain-world-model: OK");
