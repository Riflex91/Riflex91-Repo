#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function fail(message) { console.error("REGRESSION CHECK FAILED:", message); process.exitCode = 1; }
function ok(condition, message) { if (!condition) fail(message); }
function read(file) { try { return fs.readFileSync(file, "utf8"); } catch (e) { fail(`cannot read ${file}: ${e.message}`); return ""; } }

const bot = read("bot.js");
const version = JSON.parse(read("version.json") || "{}");
const dash = read("cloudflare-dashboard/dashboard.html");
const worker = read("cloudflare-dashboard/src/worker.js");
const schema = read("cloudflare-dashboard/schema.sql");
const wrangler = read("cloudflare-dashboard/wrangler.jsonc");
const pkg = read("cloudflare-dashboard/package.json");
const EXPECTED_REPO = "https://github.com/Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public";
const EXPECTED_RAW = "https://raw.githubusercontent.com/Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public/main/bot.js";
const OLD_REPO_TOKEN = "Adventure-Land---The-Code-MMORPG---" + "AiO-Bot";

ok(version.repository === EXPECTED_REPO, `version.json repository must be ${EXPECTED_REPO}`);
ok(version.botRawUrl === EXPECTED_RAW, "version.json botRawUrl must target public main/bot.js");
ok(bot.includes("updateRepositoryUrl: '" + EXPECTED_REPO + "'"), "bot default update repository is not public canonical repo");
ok(bot.includes("out.updateRepositoryUrl = defaults.updateRepositoryUrl") || bot.includes("out.updateRepositoryUrl=defaults.updateRepositoryUrl"), "stored repo overrides can still redirect updater");

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = path.join(dir, name), st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}
for (const file of walk(".")) {
  const ext = path.extname(file).toLowerCase();
  if (![".js", ".json", ".jsonc", ".md", ".sql", ".yml", ".yaml", ""].includes(ext)) continue;
  const text = read(file);
  ok(!text.includes(OLD_REPO_TOKEN), `old canonical repository reference remains in ${file}`);
}

try { new vm.Script(bot, { filename: "bot.js" }); } catch (e) { fail(`bot.js syntax: ${e.message}`); }
try { new vm.SourceTextModule(worker, { identifier: "worker.js" }); } catch (e) {
  try { new vm.Script(worker.replace(/\bexport\s+default\b/, "const __worker_default ="), { filename: "worker.js" }); }
  catch (x) { fail(`worker.js syntax: ${x.message}`); }
}

const versionMatch = bot.match(/var VERSION\s*=\s*['"](\d+\.\d+\.\d+)['"]/);
ok(versionMatch, "bot VERSION marker missing");
if (versionMatch) {
  ok(version.version === versionMatch[1], `version.json (${version.version}) != bot.js (${versionMatch[1]})`);
  ok(version.version === "2.14.15", "prepared release must be 2.14.15");
  ok(version.dashboardVersion === "2.14.15", "dashboard version must be 2.14.15 for layered brain/dashboard release");
  ok(dash.includes(`Dashboard ${version.dashboardVersion}`), "dashboard version marker not aligned with dashboardVersion");
  ok(worker.includes(`version:"${version.dashboardVersion}"`) || worker.includes(`version: "${version.dashboardVersion}"`) || worker.includes(`version:"${version.dashboardVersion}"`), "worker health version not aligned with dashboardVersion");
  ok(pkg.includes(`\"version\": \"${version.dashboardVersion}\"`), "dashboard package version not aligned with dashboardVersion");
}

const contractMatch = bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);
ok(contractMatch, "FEATURE_CONTRACT missing");
let contract = [];
if (contractMatch) { try { contract = JSON.parse(contractMatch[1].replace(/'/g, '"')); } catch { fail("FEATURE_CONTRACT is not parseable"); } }
const requiredFeatures = [
  "character-info","inventory-window","party-manager","farm-mode","bestiary-items","skill-manager",
  "merchant-director","merchant-stand","meters","web-dashboard","audit-logs","settings","headless",
  "auto-update","config-preservation","fast-travel","task-reason","aio-brain","cloud-state-sync",
  "farmer-auto-equip","merchant-explorer","inventory-pressure-guard","gui-window-toggle",
  "self-training-brain","teacher-student-learning","experience-replay","prioritized-replay","brain-dashboard",
  "champion-challenger","brain-auto-rollback","brain-life-visualization","brain-diary","brain-diary-cloud-sync","brain-diary-dashboard","brain-quality-monitor","brain-overconfidence-guard","brain-drift-quarantine","adaptive-learning-control","brain-research-bridge","research-prompt-profiles","research-secret-redaction","research-dashboard",
  "merchant-bank-cleanup-confirmation","brain-teaching-hints","dashboard-terrain-tiles","dashboard-learning-feed",
  "merchant-performance-budget","merchant-performance-telemetry","dashboard-terrain-pass-through","dashboard-vector-map-fallback","cloud-unconfigured-idle",
  "merchant-bank-progress-lease","merchant-bank-sync-diagnostics"
];
for (const feature of requiredFeatures) ok(contract.includes(feature), `protected feature missing: ${feature}`);
ok(contract.length >= 42, `expected at least 42 protected features, got ${contract.length}`);

const mustContain = [
  ["Inventar tool", "['inventory'"], ["inventory right-click policy", "data-inv-rule"],
  ["skill filter", "data-skill-filter"], ["skill live explanation", "d.explanation"],
  ["fixed merchant stand location", "standLocation"], ["merchant scroll route", "merchant_scroll_route"],
  ["bestiary focus restore", "setSelectionRange"], ["task reason", "v282TaskReason"],
  ["GUI transparency", "uiTransparencyPct"], ["fast travel", "fastTravelEnabled"],
  ["update config backup", "updateConfigBackup"], ["feature-contract blocker", "v282ValidateContract"],
  ["brain teacher", "v290BrainTick=function"], ["student forward pass", "function v210Forward"],
  ["student backprop", "function v210TrainOne"], ["experience replay", "function v210ReplayTrain"], ["prioritized replay", "function v210ReplaySample"],
  ["outcome reward", "function v210Reward"], ["UTC budget reset", "function v210SyncUtcDay"],
  ["student champion gate", "function v210StudentPromoted"], ["cloud student sync", "v210StudentExport"],
  ["brain telemetry", "v210BrainTelemetry"], ["brain dashboard payload", "d.brain=v210BrainTelemetry()"],
  ["champion challenger league", "function v211MaybeStartChallenge"], ["automatic brain rollback", "function v211Rollback"],
  ["challenger canary policy", "function v211MaybeApplyPolicy"], ["brain life state", "function v211LifeState"],
  ["ingame brain pulse", "brainlife-mini"], ["brain league persistence", "brainLeagueV211"],
  ["brain diary", "function v212DiaryAdd"], ["brain diary audit translator", "function v212DiaryFromAudit"],
  ["brain diary cloud sync", "x.diary={schema:1"], ["brain diary UI", "Gehirn-Tagebuch"],
  ["learning quality monitor", "function v213QualityEvaluate"], ["overconfidence guard", "overconfidenceFailureRate"],
  ["quality quarantine", "status==='quarantine'"], ["adaptive learning rate", "v213QualityLearningRateScale"],
  ["adaptive teacher cadence", "v213QualityTeacherBoost"], ["healthy champion snapshot", "v213QualityRestoreHealthy"],
  ["research bridge", "function v214ResearchData"], ["research prompt", "function v214ResearchPrompt"],
  ["research relevance", "function v214ResearchHighlights"], ["research redaction", "function v214ResearchSafeText"]
];
for (const [label, marker] of mustContain) ok(bot.includes(marker), `${label} marker missing`);

ok(!bot.includes("preview_item("), "inventory must never call preview_item()");
ok(bot.includes("brainDailyNeuronLimit: 10000"), "default Brain hard limit must be 10000");
ok(bot.includes("brainBudgetTargetPct: 99.5"), "default Brain budget target must be 99.5%");
ok(bot.includes("clamp(out.brainDailyNeuronLimit,100,10000)"), "Brain hard limit must be clamped to 10000");
ok(bot.includes("samples>=80") && bot.includes("agreementEma") && bot.includes("reward>=-.05"), "Student champion safety gate incomplete");
ok(bot.includes("S.brain.usedToday=0") && bot.includes("brain_day_reset"), "UTC day rollover reset missing");

ok(bot.includes("brainLeagueEnabled: true") && bot.includes("brainChallengerTrafficPct: 20"), "Champion/Challenger defaults missing");
ok(bot.includes("l.previousChampion=v211CloneModel(l.champion)"), "previous Champion rollback snapshot missing");
ok(bot.includes("v211RejectCandidate('Challenger verursachte einen Sicherheitsvorfall')"), "Challenger safety rejection missing");
ok(bot.includes("v211Rollback('Neuer Champion verursachte auf Bewährung einen Sicherheitsvorfall')"), "probation safety rollback missing");
ok(bot.includes("prefers-reduced-motion:reduce"), "ingame brain animation must respect reduced motion");
ok(bot.includes("brainDiaryEnabled: true") && bot.includes("brainDiaryMaxEntries: 80"), "Brain Diary defaults missing");
ok(bot.includes("brainDiaryV212") && bot.includes("v212DiaryMerge"), "Brain Diary persistence/sync missing");
ok(bot.includes("Teacher-Lektion") && bot.includes("Strategie bestätigt") && bot.includes("Automatischer Rollback"), "Brain Diary event explanations incomplete");
ok(bot.includes("brainQualityMonitorEnabled: true") && bot.includes("brainQualityWindow: 24"), "Learning Quality defaults missing");
ok(bot.includes("Confidence steigt ohne Reward-Fortschritt"), "overconfidence-without-reward detection missing");
ok(bot.includes("q.teacherBoost=2.4") && bot.includes("q.learningRateScale=.18"), "quality quarantine adaptive controls missing");
ok(bot.includes("v211RejectCandidate('Lernqualitäts-Wächter stoppte Canary: ") && bot.includes("v211Rollback('Lernqualitäts-Wächter stoppte Bewährung: "), "quality monitor does not stop unsafe league experiments");
ok(bot.includes("healthyChampion:v210StudentValid(q.healthyChampion)") && bot.includes("brainQualityV213"), "healthy Champion snapshot/persistence missing");
ok(bot.includes("brainResearchBridgeEnabled: true") && bot.includes("brainResearchProfile: 'development'"), "Research Bridge defaults missing");
ok(bot.includes("WRITE_KEY|READ_KEY|API[_-]?KEY|TOKEN|SECRET|AUTHORIZATION") && bot.includes("[REDACTED]"), "Research secret redaction missing");
ok(bot.includes("V214_RESEARCH_PROFILES") && bot.includes("development:{label:'Entwicklungsbrief'"), "Research prompt profiles missing");
ok(bot.includes("serviceTrigger:trigger") && bot.includes("gold>=trigger"), "2.14.1 bundled gold threshold guard missing");
ok(bot.includes("recentlyServiced=age<gap") && bot.includes("freeUrgent=freeNeed&&!recentlyServiced"), "2.14.1 Merchant service hysteresis missing");
ok(bot.includes("cmAudit:") && bot.includes("clock()+15000"), "2.14.1 CM audit throttling missing");
ok(bot.includes("merchant_watchdog") && bot.includes("thresholdPerMinute:90"), "2.14.1 Merchant watchdog missing");
ok(bot.includes("/^partyRequest:/.test") && bot.includes("clock()+15000"), "2.14.1 party invalid backoff missing");

const toolBlock = bot.slice(bot.lastIndexOf("toolDefs=function"), bot.indexOf("toolHTML=function", bot.lastIndexOf("toolDefs=function")));
const charPos = toolBlock.indexOf("['character'"), invPos = toolBlock.indexOf("['inventory'");
ok(charPos >= 0 && invPos > charPos, "Inventar must be directly after Charakterinfo in toolDefs");
ok((toolBlock.slice(charPos, invPos).match(/\['/g) || []).length === 1, "another tool appears between Charakterinfo and Inventar");

const ensureScrollPos = bot.lastIndexOf("v273EnsureScroll=function");
const ensureScroll = bot.slice(ensureScrollPos, bot.indexOf("\n  };", ensureScrollPos) + 5);
ok(ensureScroll.includes("moveToGoal"), "scroll acquisition does not route to vendor first");
ok(ensureScroll.indexOf("moveToGoal") < ensureScroll.indexOf("buy(name,1)"), "scroll buy can happen before vendor routing");
ok(bot.includes("buy_cant_space|inventory_full"), "inventory-full circuit breaker missing");
ok(bot.includes("surplusNonCompound=(Number(it.level)||0)>=4&&!id.compound"), "+4 non-compound surplus sale guard missing");
ok(bot.includes("v273OwnedCount(it.name)>v273DesiredGroupCopies(it.name)"), "group reserve guard for +4 sale missing");
ok(bot.includes("merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;"), "inventory pressure must precede compound");

ok(wrangler.includes('"ai": { "binding": "AI" }'), "Workers AI binding missing");
ok(worker.includes("Math.min(10000"), "Worker Brain limit is not hard-capped to 10000");
ok(worker.includes("@cf/qwen/qwen3-30b-a3b-fp8"), "budgeted Qwen teacher model missing");
ok(worker.includes("/api/brain-feedback") && worker.includes("/api/brain-status"), "Brain v2 API routes missing");
ok(worker.includes("scores must contain a probability for every allowed action"), "Teacher distillation score prompt missing");
ok(worker.includes("brain_learning_events") && schema.includes("brain_learning_events"), "Outcome learning D1 persistence missing");
ok(worker.includes("challenge_start") && worker.includes("champion_confirmed") && worker.includes("challenge_reject"), "Brain League events are not persisted by Worker");
ok(worker.includes("league:{enabled:Boolean(l.enabled)") && worker.includes("life:{state:text(life.state"), "Brain League/life summary missing from Worker status");
ok(worker.includes("liveBrain") && worker.includes("character_status ORDER BY received_at DESC"), "live Brain pulse is not sourced from frequent status pushes");
ok(worker.includes("function diarySummary") && worker.includes("diary:diarySummary(payload)"), "safe Brain Diary summary missing from Worker");
ok(worker.includes("quality:{enabled:Boolean(q.enabled)") && worker.includes("overconfidenceFailureRate:number(q.overconfidenceFailureRate)"), "safe Learning Quality summary missing from Worker");
ok(worker.includes("/api/research-brief") && worker.includes("handleResearchBrief"), "Research Bridge Worker endpoint missing");
ok(worker.includes("function researchSummary") && worker.includes("function researchMapObject"), "Research Worker sanitization missing");
ok(schema.includes("brain_usage") && schema.includes("brain_decisions") && schema.includes("aio_state"), "Brain D1 schema incomplete");

ok(dash.includes("🧠 Bot-Gehirn"), "web dashboard Brain overview missing");
ok(dash.includes("Neurons heute") && dash.includes("Teacher-Aufrufe") && dash.includes("Samples / Replay"), "Brain dashboard core telemetry missing");
ok(dash.includes("Reward EMA") && dash.includes("Teacher-Übereinstimmung") && dash.includes("Policy-Freigabe"), "Brain dashboard learning telemetry missing");
ok(dash.includes("Champion / Challenger") && dash.includes("Canary Reward C / Ch") && dash.includes("Promotions / Rollbacks"), "Brain League dashboard telemetry missing");
ok(dash.includes("brain-organism") && dash.includes("brainPulse211") && dash.includes("neuronaler Puls"), "living Brain dashboard effect missing");
ok(dash.includes("prefers-reduced-motion:reduce"), "dashboard Brain animation must respect reduced motion");
ok(dash.includes("📖 Gehirn-Tagebuch") && dash.includes("diaryPayload") && dash.includes("latestDiary"), "web Brain Diary missing");
ok(dash.includes("🩺 Lernqualität · Selbstkontrolle") && dash.includes("Overconfidence-Fehler") && dash.includes("Teacher-Verstärkung / Lernrate"), "web Learning Quality overview missing");
ok(dash.includes("quality.autonomyAllowed") && dash.includes("quality.canaryAllowed"), "web quality safety state missing");
ok(dash.includes("🔬 AiO Research Bridge") && dash.includes("researchProfile") && dash.includes("researchCopy"), "web Research Bridge controls missing");
ok(dash.includes("/api/research-brief") && dash.includes("buildResearchBrief"), "web Research Bridge API integration missing");
ok(dash.includes("/api/brain-status"), "dashboard does not load Brain status endpoint");
ok(dash.includes("Live-Positionskarte") && dash.includes("wheel") && dash.includes("pointermove") && dash.includes("fitMap"), "dashboard live map/controls missing");
ok(!dash.includes("Monster / Konkurrenz") && !dash.includes("Sicherheit</span>") && !dash.includes("Status vor ${c.ageSeconds}"), "removed dashboard regression fields returned");
ok(worker.includes("mapVisual") && worker.includes("taskReason") && worker.includes("brain:"), "worker status sanitization is missing current fields");

ok(!fs.existsSync("tools"), "temporary tools directory must not ship");
ok(bot.includes("S.inventoryPressureBusy") && bot.includes("Re-Entry blockiert"), "2.14.2 inventory-pressure re-entry guard missing");
ok(!bot.includes("S.mode='Merchant · Inventar';v290InventoryPressureTick();return -1;"), "2.14.2 recursive ensure-scroll path still present");
ok(bot.includes("merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;"), "2.14.2 inventory pressure must run before compound");
ok(bot.includes("/^c?scroll[0-4]$/.test(String(it.name||''))"), "2.14.3 operational scrolls must be protected from bank cleanup");
ok(bot.includes("dist(character,dest)>180"), "2.14.3 scroll vendor proximity guard missing");
ok(bot.includes("function v2144SellDecision"), "2.14.4 Merchant economic sell decision missing");
ok(bot.includes("merchant_economy_decision"), "2.14.4 Merchant economic audit missing");
ok(bot.includes("function v2144InBank"), "2.14.4 bank location guard missing");
ok(bot.includes("upgrade-bank-exit") && bot.includes("compound-bank-exit"), "2.14.4 upgrade/compound bank exits missing");
ok(bot.includes("r.realm={region:realm.region,id:realm.id,pvp:!!realm.pvp}"), "2.14.4 peer realm report missing");
ok(bot.includes("party_realm_mismatch") && bot.includes("party_realm_switch"), "2.14.4 party realm repair missing");
ok(bot.includes(".mainbox.collapsed .body{display:none!important}") && bot.includes("min-height:0!important"), "2.14.4 collapsed GUI must show title only");

ok(bot.includes("function v2145MovePriority"), "2.14.8 Merchant move arbitration missing");
ok(bot.includes("move_deferred") && bot.includes("requestedPriority"), "2.14.8 route deferral diagnostics missing");
ok(bot.includes("function v2145VendorReady") && bot.includes("dist(character,dest)<=75"), "2.14.8 settled vendor guard missing");
ok(bot.includes("maxed-upgrade-surplus") && bot.includes("safe-trash-surplus"), "2.14.8 safe surplus selling missing");
ok(bot.includes("function v2145EconomyMaintenanceTick"), "2.14.8 economy maintenance priority missing");
ok(bot.includes(".mainbox .maincontent{overflow-y:auto"), "2.14.8 main GUI scrolling missing");
ok(bot.includes("vital('HP',r.hp,r.max_hp,'hp')") && bot.includes("vital('MP',r.mp,r.max_mp,'mp')") && bot.includes("v2145VitalFlow"), "2.14.8 animated party HP/MP bars missing");
ok(dash.includes('data-section="characters"') && dash.includes('data-section="group"'), "2.14.8 dashboard collapsible sections missing");
ok(dash.indexOf('data-section="characters"') < dash.indexOf('data-section="brain"'), "characters must be first dashboard category");
ok(dash.indexOf('data-section="group"') > dash.indexOf('data-section="research"'), "group information must be last dashboard category");
ok(dash.includes("function miniMapMarkup") && dash.includes("mini-live-map"), "character mini live maps missing");
ok(!dash.includes('<span>Gebiet</span>'), "character Gebiet text must be removed");
ok(worker.includes("const DASHBOARD_HTML = ") && worker.includes("miniMapMarkup"), "worker embedded dashboard is not synchronized");


ok(!bot.includes("v2144NpcValue(it)"), "2.14.8 undefined Merchant NPC value helper reference remains");
ok(bot.includes("itemValueSafe(it)"), "2.14.8 Merchant sell decision must use itemValueSafe");
ok(bot.includes("function v2146UpdateLabel"), "2.14.8 localized update label helper missing");
ok(bot.includes("Auf Updates prüfen") && bot.includes("Prüfe auf Updates"), "2.14.8 German manual update labels missing");
ok(bot.includes("update_manual_check") && bot.includes("updateCheckTick(true)"), "2.14.8 manual update click wiring missing");
ok(bot.includes("update-manual-status"), "2.14.8 visible manual update status missing");


ok(bot.includes("merchantItemActions: {}"), "2.14.8 merchant item action defaults missing");
ok(bot.includes("function v2147ItemPolicy"), "2.14.8 per-item policy helper missing");
ok(bot.includes("Merchant-Einstellungen"), "2.14.8 German Merchant settings title missing");
ok(bot.includes("Automatisch (bestehende Botlogik)"), "2.14.8 automatic/default item behavior label missing");
ok(bot.includes("function v2147BankExitActive"), "2.14.8 bank-exit guard missing");
ok(bot.includes("function v2147BankReady"), "2.14.8 bank readiness guard missing");
ok(bot.includes("bank_location_changed"), "2.14.8 bank action recheck missing");
ok(bot.includes("merchant_item_rule"), "2.14.8 item rule audit missing");
ok(bot.includes("v2147ExplicitItemTick"), "2.14.8 explicit item action tick missing");
ok(bot.includes("!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)"), "2.14.8 Merchant bank loot suppression missing");


ok(bot.includes("function v2148BankCleanupTick"), "2.14.8 atomic Merchant bank cleanup missing");
ok(bot.includes("function v2148BankCleanupCandidate"), "2.14.8 bank candidate preflight missing");
ok(bot.includes("S.merchantBankCleanup2148||v2148BankCleanupCandidate()"), "2.14.8 Merchant must hold atomic bank phase before legacy logic");
ok(bot.includes("bankCleanupRetry2148=now+12000"), "2.14.8 bank cleanup safety lease/backoff missing");
ok(bot.includes("'bank-store-2148',900"), "2.14.8 bank cleanup cooldown/hold missing");
ok(bot.includes("'loot-action',800") && bot.includes("String(character.map||'').indexOf('bank')===0"), "2.14.8 final Merchant tick must suppress loot() in bank");
ok(bot.includes("function v2148ManualUpdateInstall"), "2.14.8 dedicated manual updater missing");
ok(bot.includes("return selfUpdate(false)"), "2.14.8 manual updater must explicitly install as manual");
ok(bot.includes("Auf Updates prüfen & installieren"), "2.14.8 manual update button label missing");

for (const feature of ["merchant-bank-cleanup-confirmation","brain-teaching-hints","dashboard-terrain-tiles","dashboard-learning-feed"]) ok(contract.includes(feature), `2.14.15 static protected feature missing: ${feature}`);
ok(!bot.includes("v2144AuditEconomy("), "2.14.15 undefined Merchant economy audit helper reference remains");
ok(bot.includes("function v21413LiveBankCount"), "2.14.15 live bank confirmation helper missing");
ok(bot.includes("beforeBank:v21413LiveBankCount(name,lv)"), "2.14.15 bank cleanup baseline must use live bank state");
ok(bot.includes("confirmation:confirmation"), "2.14.15 bank cleanup confirmation source diagnostic missing");

for (const feature of ["merchant-performance-budget","merchant-performance-telemetry","dashboard-terrain-pass-through","dashboard-vector-map-fallback","cloud-unconfigured-idle"]) ok(contract.includes(feature), `2.14.15 protected feature missing: ${feature}`);
ok(bot.includes("function v21414CloudConfigured"), "2.14.15 cloud configuration guard missing");
ok(bot.includes("now-Number(c.at||0)<1400"), "2.14.15 sell candidate cache missing");
ok(bot.includes("now-Number(c.at||0)<850"), "2.14.15 service candidate cache missing");
ok(bot.includes("now-Number(S.recipeAnalysis.at||0)<8000"), "2.14.15 recipe analysis budget missing");
ok(bot.includes("lootCadence=character.ctype==='merchant'"), "2.14.15 Merchant loot cadence missing");
ok(bot.includes("merchant_performance_sample"), "2.14.15 Merchant performance telemetry missing");
ok(bot.includes("v21414CompactMoveTarget"), "2.14.15 move audit compaction missing");
ok(worker.includes("terrain:cleanTerrain(input.terrain)"), "Worker strips terrain telemetry");
ok(worker.includes("learningFeed:cleanLearningFeed(input.learningFeed)"), "Worker strips learning feed");
ok(worker.includes("sprite:cleanSprite(input.sprite)"), "Worker strips sprite metadata");
ok(worker.includes("brainExplanation:cleanBrainExplanation(input.brainExplanation)"), "Worker strips explainability metadata");
ok(dash.includes("function terrainVectorMarkup"), "dashboard vector terrain fallback missing");
ok(dash.includes("function terrainMeta"), "dashboard terrain metadata selection missing");

for (const feature of ["merchant-bank-progress-lease","merchant-bank-sync-diagnostics"]) ok(contract.includes(feature), `2.14.15 protected feature missing: ${feature}`);
ok(bot.includes("function v21415BankCleanupLeaseExpired"), "2.14.15 bank progress lease helper missing");
ok(bot.includes("v21415BankCleanupLeaseExpired(st,now)"), "2.14.15 bank timeout is not progress-relative");
ok(bot.includes("beforeExact:Number(a.beforeExact)||0") && bot.includes("afterBank:bank"), "2.14.15 sync-wait before/after diagnostics missing");
ok(bot.includes("function v2148BankCleanupFinish(kind,detail,level,extra)"), "2.14.15 cleanup finish extra diagnostics channel missing");

if (!process.exitCode) console.log(`Regression checks OK · ${requiredFeatures.length} protected features · version ${version.version} · Brain v2.14 · Research Bridge · Merchant performance + terrain + bank lease`);
