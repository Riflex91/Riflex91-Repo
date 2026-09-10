/* Adventure Land • AiO Bot 2.14.6 | 2026-09-10
 * One codebase for farmer classes + merchant.
 * Focus: Merchant-directed 4-character logistics, shared inventory/crafting knowledge,
 * stable pathing, autonomous updates, deep diagnostics and Merchant service logistics.
 */
(function () {
  'use strict';

  var P = parent;
  var D = P.document;
  var GD = (typeof G !== 'undefined' ? G : (P.G || {}));
  var VERSION = '2.14.6';
  var BUILD = '2026-09-10';
  var REPORT_PROTOCOL = 6;
  var HEADLESS = !!(P.__AIO_HEADLESS__ || P.__AIO_HEADLESS_MODE__ || P.caracAL || P.no_graphics);
  var clock = function () { return Date.now(); };
  var me = character.name;

  // Cleanly retire older instances and the 2.6 diagnostic window.
  try { if (P.__ALBOT2__ && typeof P.__ALBOT2__.dispose === 'function') P.__ALBOT2__.dispose(); } catch (e) {}
  try { if (P.__ALBOT2_DIAG__ && typeof P.__ALBOT2_DIAG__.dispose === 'function') P.__ALBOT2_DIAG__.dispose(); } catch (e) {}
  try { delete P.__ALBOT2_DIAG__; } catch (e) {}
  try { var oldDiag = D && D.getElementById && D.getElementById('albot2-diagnostics'); if (oldDiag) oldDiag.remove(); } catch (e) {}

  function accountCharacters() {
    var out = [];
    try {
      out = (typeof get_characters === 'function' ? get_characters() : []).map(function (c) {
        return { name: c.name, ctype: String(c.ctype || c.type || '') };
      }).filter(function (c) { return !!c.name; });
    } catch (e) {}
    if (!out.some(function (c) { return c.name === me; })) out.push({ name: me, ctype: character.ctype });
    out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return out;
  }

  var ACCOUNT_CHARS = accountCharacters();
  var ACCOUNT = ACCOUNT_CHARS.map(function (c) { return c.name; }).join('|');
  var KEY = 'ALBOT27:' + ACCOUNT + ':';
  var LEGACY_KEY = 'ALBOT2:' + ACCOUNT + ':';

  function readRaw(key) { try { return P.localStorage.getItem(key); } catch (e) { return null; } }
  function writeRaw(key, value) { try { P.localStorage.setItem(key, value); return true; } catch (e) { return false; } }
  function read(k, fallback) { try { var raw = readRaw(KEY + k); return raw == null ? fallback : JSON.parse(raw); } catch (e) { return fallback; } }
  function write(k, value) { try { return writeRaw(KEY + k, JSON.stringify(value)); } catch (e) { return false; } }
  function readLegacy(k, fallback) { try { var raw = readRaw(LEGACY_KEY + k); return raw == null ? fallback : JSON.parse(raw); } catch (e) { return fallback; } }
  function clamp(n, a, b) { n = Number(n); return isFinite(n) ? Math.max(a, Math.min(b, n)) : a; }
  function ratio(o, key) { var max = Number(o && o['max_' + key]) || Number(o && o['max' + key.charAt(0).toUpperCase() + key.slice(1)]) || 1; return (Number(o && o[key]) || 0) / Math.max(1, max); }
  function pos(o) { o = o || character; return o && isFinite(o.x) && isFinite(o.y) ? { map: o.map || character.map, x: Number(o.x), y: Number(o.y) } : null; }
  function dist(a, b) { try { if (typeof distance === 'function') return distance(a, b); } catch (e) {} var pa = pos(a), pb = pos(b); if (!pa || !pb || pa.map !== pb.map) return Infinity; return Math.hypot(pa.x - pb.x, pa.y - pb.y); }
  function freeSlots() { return (character.items || []).filter(function (i) { return !i; }).length; }
  function slot(name) { for (var i = 0; i < (character.items || []).length; i++) if (character.items[i] && character.items[i].name === name) return i; return -1; }
  function qty(name) { return (character.items || []).reduce(function (n, i) { return n + (i && i.name === name ? (Number(i.q) || 1) : 0); }, 0); }
  function csv(v) { return String(v || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); }
  function safeString(v, max) { var s = String(v == null ? '' : v); return s.length > (max || 500) ? s.slice(0, max || 500) : s; }
  function reason(e) { return safeString(e && (e.reason || e.message || e.error) || e || 'unknown', 300); }
  function sameJSON(a, b) { try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; } }
  function semver(v) { return String(v || '0.0.0').match(/\d+/g) ? String(v).match(/\d+/g).slice(0, 3).map(Number) : [0, 0, 0]; }
  function newer(a, b) { var A = semver(a), B = semver(b); for (var i = 0; i < 3; i++) { if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) > (B[i] || 0); } return false; }
  function currentRealm() { return { region: String(P.server_region || (typeof server_region !== 'undefined' ? server_region : '')), id: String(P.server_identifier || (typeof server_identifier !== 'undefined' ? server_identifier : '')), pvp: !!(P.is_pvp && P.is_pvp()) }; }
  function entities() { return Object.keys(P.entities || {}).map(function (k) { return P.entities[k]; }).filter(Boolean); }
  function localPlayer(name) { return entities().find(function (e) { return e && e.type === 'character' && e.name === name; }) || null; }
  function targetID(e) { return e && (e.id || e.name); }
  function gameMessage(text, color) { try { if (typeof game_log === 'function') game_log(text, color); else if (typeof log === 'function') log(text, color); } catch (e) {} }

  function characterTypeForConfig(name) {
    if (name === me) return String(character.ctype || '');
    var c = ACCOUNT_CHARS.find(function (x) { return x.name === name; });
    return c ? String(c.ctype || '') : '';
  }

  var defaults = {
    roster: [me], autoRoster: true, rosterDiscoverySeconds: 8, peerReportSeconds: 45,
    leader: 'auto', autoParty: true, strictFourParty: true, partyRepairSeconds: 3,
    fallbackTank: 'none', tankAggroRadius: 280, tankMaxAggroTargets: 4,
    healerHealStartPct: 92, healerEmergencyPct: 65, healerSafeDamagePct: 97, healerManaReservePct: 65,
    farmMode: 'auto', monster: 'goo', searchRadius: 1500, followDistance: 170, maxTargets: 2, autoFarmMinSpawnCount: 3, goalEmptyReplanSeconds: 8,
    safety: true, risk: 45, kite: true, kiteSafetyPct: 82, kiteExtraDistance: 30,
    hp: 72, mp: 52, retreatHP: 28, resumeHP: 82, healAt: 82,
    hpot: 'hpot0', mpot: 'mpot0', minHP: 120, minMP: 120, stockHP: 500, stockMP: 500,
    weakMobSkillSaving: true, weakMobSkillFactor: 1.5, manaReserve: 28,
    skills: {},
    webDashboardEnabled: false, webDashboardConnectionUrl: '', webDashboardWriteKey: '', webDashboardIntervalSeconds: 5,
    webDashboardTutorialSeen: false,
    autoFarmSwitchEnabled: false, autoFarmAreaSwitchEnabled: true, autoFarmServerSwitchEnabled: true,
    autoFarmMinVisibleMonsters: 2, autoFarmMinExpectedPct: 60, autoFarmMinXpPerHour: 0, autoFarmCompetitionPlayers: 2,
    autoFarmBadSeconds: 45, autoFarmSwitchCooldownSeconds: 180, autoFarmServers: [], autoFarmPvPConfirmed: [],
    auditEnabled: true, diagnosticMode: true, diagnosticSeconds: 5, logSegmentHours: 12, logRetentionDays: 7, logPositionSeconds: 5,
    updateCheckEnabled: true, updateCheckMinutes: 1, autoUpdateEnabled: true,
    updateRepositoryUrl: 'https://github.com/Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public',
    autoElixirs: true, upgradeElixirs: true, elixirUpgradeTo: 2, distributeElixirs: true,
    merchantStandAutomation: false,
    standPriority: 'idle', standMaxOpenMinutes: 120, standCooldownMinutes: 15,
    standMaxListings: 6, standMaxUnitsPerListing: 20, standMaxUnitsPerWindow: 40, standWindowMinutes: 60,
    standRefreshSeconds: 30, standDailyRuntimeMinutes: 720, standMinMarginPct: 12, standUndercutPct: 2,
    standItemMode: 'allowlist', standAllowedItems: '', standBlockedItems: '', standKeepQuantity: 2,
    standCloseWhenPartyIncomplete: true, standOnlyMerchant: true,
    merchantSupply: true, merchantCollectLoot: true,
    merchantForceLeader: true, merchantPlannerEnabled: true, merchantAutoCraft: true,
    merchantAutoUpgrade: true, merchantUpgradeMax: 4, merchantAutoCompound: true, merchantCompoundMax: 0,
    merchantRecipeRefreshHours: 24, merchantManageBank: true, merchantAutoUnlockBank: true,
    merchantAllowShellBankUnlock: false, merchantBankGoldReserve: 100000, merchantFarmerGoldReserve: 50000,
    merchantSellTrashToNpc: true, merchantAutoExchange: true, merchantBalanceFarmers: true,
    merchantCraftTargets: '', merchantFarmerHPStock: 500, merchantFarmerMPStock: 500,
    merchantDeliveryHPQty: 500, merchantDeliveryMPQty: 500, merchantRestockHPAt: 0, merchantRestockMPAt: 0, merchantServiceIntervalSeconds: 90, merchantPickupFreeSlotsAt: 12,
    merchantBankRecheckSeconds: 180, merchantUpgradeCadenceMinutes: 20,
    merchantBuyHPTo: 2200, merchantBuyMPTo: 1800, merchantCollectGoldOver: 25000, merchantInventoryReserve: 5,
    showSettingHelp: true, uiTransparencyPct: 0, fastTravelEnabled: true, inventoryProtectedItems: '', standLocation: null,
    brainEnabled: true, brainDailyNeuronLimit: 10000, brainBudgetTargetPct: 99.5, brainWorkPct: 100, brainPriorityPct: 55, brainMinConfidencePct: 70, brainModel: '@cf/qwen/qwen3-30b-a3b-fp8',
    brainStudentEnabled: true, brainStudentConfidencePct: 82, brainOutcomeSeconds: 180, brainReplaySize: 512, brainStudentLearningRate: 0.012, brainTeacherMinIntervalSeconds: 30, brainTeacherMaxIntervalSeconds: 600,
    brainLeagueEnabled: true, brainChallengerTrafficPct: 20, brainChallengeMinOutcomes: 8, brainRollbackRewardDropPct: 12,
    brainDiaryEnabled: true, brainDiaryMaxEntries: 80,
    brainQualityMonitorEnabled: true, brainQualityWindow: 24, brainQualityMinOutcomes: 12, brainQualityOverconfidencePct: 88, brainQualityRewardDropPct: 15, brainQualityCooldownMinutes: 20,
    brainResearchBridgeEnabled: true, brainResearchProfile: 'development', brainResearchHours: 24, brainResearchMaxHighlights: 20, brainResearchAnonymize: true,
    cloudSyncEnabled: true, cloudSyncSeconds: 45, farmerUpgradeCheckSeconds: 90, merchantExploreWhenIdle: true,
    language: 'en', theme: 'midnight', uiScale: 1
  };

  function cleanConfig(c) {
    var out = Object.assign({}, defaults, c || {});
    out.roster = Array.isArray(out.roster) ? out.roster.filter(function (n, i, a) { return ACCOUNT_CHARS.some(function (x) { return x.name === n; }) && a.indexOf(n) === i; }).slice(0, 4) : defaults.roster.slice();
    if (!out.roster.length) out.roster = [me];
    out.autoRoster = out.autoRoster !== false;
    out.rosterDiscoverySeconds = clamp(out.rosterDiscoverySeconds, 3, 30);
    out.peerReportSeconds = clamp(out.peerReportSeconds, 15, 180);
    if (out.leader !== 'auto' && out.roster.indexOf(out.leader) < 0) out.leader = 'auto';
    if (out.fallbackTank !== 'none' && (!ACCOUNT_CHARS.some(function(x){return x.name===out.fallbackTank;}) || characterTypeForConfig(out.fallbackTank) === 'merchant')) out.fallbackTank = 'none';
    ['hp','mp','retreatHP','resumeHP','healAt','risk','manaReserve','healerHealStartPct','healerEmergencyPct','healerSafeDamagePct','healerManaReservePct','kiteSafetyPct'].forEach(function (k) { out[k] = clamp(out[k], 1, 99); });
    out.tankAggroRadius = clamp(out.tankAggroRadius, 80, 800); out.tankMaxAggroTargets = clamp(out.tankMaxAggroTargets, 1, 8); out.kiteExtraDistance = clamp(out.kiteExtraDistance, 0, 150);
    out.maxTargets = clamp(out.maxTargets, 1, 5); out.searchRadius = clamp(out.searchRadius, 250, 3500); out.followDistance = clamp(out.followDistance, 60, 500); out.autoFarmMinSpawnCount = clamp(out.autoFarmMinSpawnCount, 2, 20); out.goalEmptyReplanSeconds = clamp(out.goalEmptyReplanSeconds, 3, 60);
    out.partyRepairSeconds = clamp(out.partyRepairSeconds, 2, 20); out.webDashboardIntervalSeconds = clamp(out.webDashboardIntervalSeconds, 3, 60);
    out.autoFarmMinVisibleMonsters=clamp(out.autoFarmMinVisibleMonsters,1,25); out.autoFarmMinExpectedPct=clamp(out.autoFarmMinExpectedPct,10,100); out.autoFarmMinXpPerHour=clamp(out.autoFarmMinXpPerHour,0,1000000000); out.autoFarmCompetitionPlayers=clamp(out.autoFarmCompetitionPlayers,1,20); out.autoFarmBadSeconds=clamp(out.autoFarmBadSeconds,15,600); out.autoFarmSwitchCooldownSeconds=clamp(out.autoFarmSwitchCooldownSeconds,60,3600);
    out.autoFarmServers=Array.isArray(out.autoFarmServers)?out.autoFarmServers.map(function(x){return safeString(x,40);}).filter(function(x,i,a){return x&&a.indexOf(x)===i;}).slice(0,30):[]; out.autoFarmPvPConfirmed=Array.isArray(out.autoFarmPvPConfirmed)?out.autoFarmPvPConfirmed.filter(function(x){return out.autoFarmServers.indexOf(x)>=0;}).slice(0,30):[];
    out.diagnosticMode = out.diagnosticMode !== false; out.diagnosticSeconds = clamp(out.diagnosticSeconds, 2, 60); out.logSegmentHours = clamp(out.logSegmentHours, 1, 24); out.logRetentionDays = clamp(out.logRetentionDays, 1, 30); out.logPositionSeconds = clamp(out.logPositionSeconds, 1, 60);
    out.updateCheckEnabled = true; out.updateCheckMinutes = 1; out.autoUpdateEnabled = true; out.weakMobSkillFactor = clamp(out.weakMobSkillFactor, 0.2, 10);
    out.elixirUpgradeTo = clamp(out.elixirUpgradeTo, 0, 10);
    out.standMaxOpenMinutes = clamp(out.standMaxOpenMinutes, 1, 1440); out.standCooldownMinutes = clamp(out.standCooldownMinutes, 0, 1440);
    out.standMaxListings = clamp(out.standMaxListings, 1, 16); out.standMaxUnitsPerListing = clamp(out.standMaxUnitsPerListing, 1, 9999); out.standMaxUnitsPerWindow = clamp(out.standMaxUnitsPerWindow, 1, 99999);
    out.standWindowMinutes = clamp(out.standWindowMinutes, 1, 1440); out.standRefreshSeconds = clamp(out.standRefreshSeconds, 10, 600); out.standDailyRuntimeMinutes = clamp(out.standDailyRuntimeMinutes, 1, 1440);
    out.standMinMarginPct = clamp(out.standMinMarginPct, 0, 1000); out.standUndercutPct = clamp(out.standUndercutPct, 0, 50); out.standKeepQuantity = clamp(out.standKeepQuantity, 0, 9999);
    out.merchantUpgradeMax = clamp(out.merchantUpgradeMax, 0, 15); out.merchantCompoundMax = clamp(out.merchantCompoundMax, 0, 20);
    out.merchantRecipeRefreshHours = clamp(out.merchantRecipeRefreshHours, 1, 168); out.merchantBankGoldReserve = clamp(out.merchantBankGoldReserve, 0, 1000000000);
    out.merchantFarmerGoldReserve = clamp(out.merchantFarmerGoldReserve, 0, 1000000000); out.merchantCollectGoldOver = clamp(out.merchantCollectGoldOver, 0, 1000000000);
    out.merchantFarmerHPStock = clamp(out.merchantFarmerHPStock, 0, 99999); out.merchantFarmerMPStock = clamp(out.merchantFarmerMPStock, 0, 99999);
    out.merchantDeliveryHPQty = clamp(out.merchantDeliveryHPQty, 0, 99999); out.merchantDeliveryMPQty = clamp(out.merchantDeliveryMPQty, 0, 99999); out.merchantServiceIntervalSeconds = clamp(out.merchantServiceIntervalSeconds, 20, 900); out.merchantPickupFreeSlotsAt = clamp(out.merchantPickupFreeSlotsAt, 1, 40); out.merchantBankRecheckSeconds = clamp(out.merchantBankRecheckSeconds, 30, 1800); out.merchantUpgradeCadenceMinutes = clamp(out.merchantUpgradeCadenceMinutes, 2, 240);
    out.merchantRestockHPAt = clamp(out.merchantRestockHPAt, 0, 99999); out.merchantRestockMPAt = clamp(out.merchantRestockMPAt, 0, 99999);
    out.merchantBuyHPTo = clamp(out.merchantBuyHPTo, 0, 99999); out.merchantBuyMPTo = clamp(out.merchantBuyMPTo, 0, 99999); out.merchantInventoryReserve = clamp(out.merchantInventoryReserve, 2, 20);
    out.merchantCraftTargets = safeString(out.merchantCraftTargets || '', 1200);
    out.showSettingHelp = out.showSettingHelp !== false; out.uiTransparencyPct = clamp(out.uiTransparencyPct, 0, 85); out.fastTravelEnabled = out.fastTravelEnabled !== false; out.inventoryProtectedItems = safeString(out.inventoryProtectedItems || '', 2400);
    out.brainEnabled=out.brainEnabled!==false; out.brainDailyNeuronLimit=clamp(out.brainDailyNeuronLimit,100,10000); out.brainBudgetTargetPct=clamp(out.brainBudgetTargetPct,80,99.5); out.brainWorkPct=clamp(out.brainWorkPct,0,100); out.brainPriorityPct=clamp(out.brainPriorityPct,0,100); out.brainMinConfidencePct=clamp(out.brainMinConfidencePct,50,99); out.brainModel='@cf/qwen/qwen3-30b-a3b-fp8'; out.brainStudentEnabled=out.brainStudentEnabled!==false; out.brainStudentConfidencePct=clamp(out.brainStudentConfidencePct,55,99); out.brainOutcomeSeconds=clamp(out.brainOutcomeSeconds,60,900); out.brainReplaySize=clamp(out.brainReplaySize,64,1024); out.brainStudentLearningRate=clamp(out.brainStudentLearningRate,0.001,0.05); out.brainTeacherMinIntervalSeconds=clamp(out.brainTeacherMinIntervalSeconds,20,600); out.brainTeacherMaxIntervalSeconds=clamp(out.brainTeacherMaxIntervalSeconds,60,3600); if(out.brainTeacherMaxIntervalSeconds<out.brainTeacherMinIntervalSeconds)out.brainTeacherMaxIntervalSeconds=out.brainTeacherMinIntervalSeconds; out.brainLeagueEnabled=out.brainLeagueEnabled!==false; out.brainChallengerTrafficPct=clamp(out.brainChallengerTrafficPct,5,35); out.brainChallengeMinOutcomes=clamp(out.brainChallengeMinOutcomes,4,24); out.brainRollbackRewardDropPct=clamp(out.brainRollbackRewardDropPct,5,35); out.brainDiaryEnabled=out.brainDiaryEnabled!==false; out.brainDiaryMaxEntries=clamp(out.brainDiaryMaxEntries,20,200); out.brainQualityMonitorEnabled=out.brainQualityMonitorEnabled!==false; out.brainQualityWindow=clamp(out.brainQualityWindow,12,64); out.brainQualityMinOutcomes=clamp(out.brainQualityMinOutcomes,8,32); if(out.brainQualityMinOutcomes>out.brainQualityWindow)out.brainQualityMinOutcomes=out.brainQualityWindow; out.brainQualityOverconfidencePct=clamp(out.brainQualityOverconfidencePct,70,99); out.brainQualityRewardDropPct=clamp(out.brainQualityRewardDropPct,5,40); out.brainQualityCooldownMinutes=clamp(out.brainQualityCooldownMinutes,5,120); out.brainResearchBridgeEnabled=out.brainResearchBridgeEnabled!==false; out.brainResearchProfile=['overall','errors','learning','farm','merchant','development'].indexOf(String(out.brainResearchProfile))>=0?String(out.brainResearchProfile):'development'; out.brainResearchHours=clamp(out.brainResearchHours,1,168); out.brainResearchMaxHighlights=clamp(out.brainResearchMaxHighlights,5,40); out.brainResearchAnonymize=out.brainResearchAnonymize!==false; out.cloudSyncEnabled=out.cloudSyncEnabled!==false; out.cloudSyncSeconds=clamp(out.cloudSyncSeconds,15,600); out.farmerUpgradeCheckSeconds=clamp(out.farmerUpgradeCheckSeconds,30,1800); out.merchantExploreWhenIdle=out.merchantExploreWhenIdle!==false;
    if (!out.standLocation || typeof out.standLocation !== 'object' || !out.standLocation.map || !isFinite(Number(out.standLocation.x)) || !isFinite(Number(out.standLocation.y))) out.standLocation = null; else out.standLocation = { map:safeString(out.standLocation.map,80), x:Math.round(Number(out.standLocation.x)), y:Math.round(Number(out.standLocation.y)) };
    if (['idle','normal','high'].indexOf(out.standPriority) < 0) out.standPriority = 'idle';
    if (['allowlist','safe_spares','all_unprotected'].indexOf(out.standItemMode) < 0) out.standItemMode = 'allowlist';
    if (!out.skills || typeof out.skills !== 'object' || Array.isArray(out.skills)) out.skills = {};
    out.webDashboardConnectionUrl = safeString(out.webDashboardConnectionUrl, 800).trim();
    out.webDashboardWriteKey = safeString(out.webDashboardWriteKey, 300).trim();
    out.updateRepositoryUrl = defaults.updateRepositoryUrl; // canonical public bot repository; ignore stale/local/cloud-synced repo overrides
    delete out.updateFallbackRepositoryUrl;
    var langs=['en','zh','hi','es','ar','fr','bn','pt','ru','id','ur','de','ja','pcm','arz'];
    if(langs.indexOf(out.language)<0) out.language='en';
    var themes=['midnight','arctic','solarized','neon','forest','crimson','royal','sakura','contrast','paper'];
    if(themes.indexOf(out.theme)<0) out.theme='midnight';
    return out;
  }


  // Migrate useful 2.6 settings once, but intentionally replace its dashboard endpoint/token pair with the 2.7 connection URL model.
  var C = read('config', null);
  if (!C) {
    var legacy = readLegacy('config', null);
    if (legacy) C = Object.assign({}, defaults, legacy, {
      webDashboardEnabled: false,
      webDashboardConnectionUrl: '',
      merchantStandAutomation: false,
      standItemMode: legacy.standItemMode === 'allowlist' ? 'allowlist' : 'safe_spares'
    });
  }
  C = cleanConfig(C || {});
  // 2.7.7 migration: automatic supply thresholds become the default; updater can no longer be disabled.
  try { if (!read('migrate277', false)) { if (Number(C.merchantRestockHPAt)===150) C.merchantRestockHPAt=0; if (Number(C.merchantRestockMPAt)===150) C.merchantRestockMPAt=0; if (Number(C.merchantCollectGoldOver)===100000) C.merchantCollectGoldOver=25000; if (Number(C.merchantFarmerGoldReserve)===50000) C.merchantFarmerGoldReserve=5000; C.autoUpdateEnabled=true; C.updateCheckEnabled=true; write('migrate277', true); } } catch(e) {}
  // Headless-friendly environment overrides. They avoid hard-coding secrets into bot.js.
  try {
    var env27 = P.process && P.process.env;
    if (env27 && env27.AIO_DASHBOARD_URL) { C.webDashboardConnectionUrl = String(env27.AIO_DASHBOARD_URL); C.webDashboardEnabled = true; }
    if (env27 && env27.AIO_DASHBOARD_WRITE_KEY) C.webDashboardWriteKey = String(env27.AIO_DASHBOARD_WRITE_KEY);
  } catch (e) {}
  try { if (P.__AIO_BOT_CONFIG__ && typeof P.__AIO_BOT_CONFIG__ === 'object') C = cleanConfig(Object.assign({}, C, P.__AIO_BOT_CONFIG__)); } catch (e) {}
  write('config', C);

  var S = {
    running: read('run:' + me, true), disposed: false, status: 'Start', mode: 'Initialisierung',
    target: null, goal: null, reports: {}, times: {}, pending: {}, alerts: [],
    discoveryStarted: clock(), discoveredNames: [me], lastRosterSync: 0, rosterValidated: false,
    lastAction: '', lastActionAt: 0, lastXPAt: 0, lastKillAt: 0, lastMoveAt: clock(),
    lastXP: character.xp || 0, lastGold: character.gold || 0, lastLevel: character.level || 0,
    lastDashboardPublish: 0, dashboardSending: false, dashboardLastOK: 0, dashboardFailAt: 0,
    dashboardLastAck: 0, dashboardLastError: '', dashboardAckName: '', dashboardUnverifiedAt: 0,
    partyIncompleteSince: 0, partyLastRepair: 0, partyLastState: null,
    auditQueue: [], auditRecent: [], logDB: null, logDBReady: false, logDBFailed: false,
    segmentStart: Number(read('segmentStart:' + me, 0)) || clock(), readySegments: read('readySegments:' + me, []),
    lastStateSnapshot: null, lastPositionLog: 0,
    update: { checking: false, applying: false, available: false, latest: VERSION, repo: '', raw: '', error: '', checkedAt: 0, lastApplied: read('lastAppliedUpdate:'+me,null) },
    dashboardTutorialOpen: false, dashboardTutorialStep: 0,
    headlessGuideOpen: false, headlessStep: 0, headlessOS: 'windows',
    bestiarySearch: '', bestiaryMode: 'all', dashboardTransport: '',
    standOpenSince: 0, standCooldownUntil: 0, standSales: read('standSales:' + me, []), standRuntime: read('standRuntime:' + me, { day: '', ms: 0 }), standLastSample: null,
    elixirDelivery: read('elixirDelivery:' + me, null), lastElixirScan: 0,
    meter: { damage: 0, heal: 0, started: clock(), sources: {} },
    session: { started: clock(), xpGain: 0, goldGain: 0, lastXP: Number(character.xp)||0, lastGold: Number(character.gold)||0, lastLevel: Number(character.level)||0 },
    merchantPlan: read('merchantPlan', null), knowledgeDB: read('knowledgeDB', null), bankFull: false, bankScanAt: 0,
    moveInFlight: false, moveKind: '', moveRequestedAt: 0, moveDestination: null, moveSeq: 0, goalEmptySince: 0, lastGoalEmptyMark: 0,
    rejoinUntil: 0, rejoinReason: '', kiteNav: null, merchantServiceTarget: null, merchantServiceArrivedAt: 0, merchantServiceDelivered: {hp:false,mp:false}, merchantLastService: read('merchantLastService',{}), merchantServiceUrgent: {}, supplyTelemetry: {}, localPotionTelemetry: null, diagSeq: 0,
    dashboardProbe: { ok:false, at:0, error:'' }, dashboardTransportErrors: [], dashboardCompatibility: null, uiTyping: false, mainCollapsed: !!read('mainCollapsed:' + me, false),
    toolWindows: {}, lastToolKey: null, windowZ: 9960, ui: read('ui:' + me, null)
  };

  function saveConfig() { C = cleanConfig(C); write('config', C); audit('config', 'Konfiguration gespeichert', configAuditView()); renderAll(true); }
  function configAuditView() {
    return { roster: C.roster, leader: C.leader, autoParty: C.autoParty, fallbackTank: C.fallbackTank, farmMode: C.farmMode, monster: C.monster, webDashboardEnabled: C.webDashboardEnabled, merchantStandAutomation: C.merchantStandAutomation, autoElixirs: C.autoElixirs, updateRepositoryUrl: C.updateRepositoryUrl };
  }

  function compactData(data) {
    if (data == null) return null;
    try {
      return JSON.parse(JSON.stringify(data, function (k, v) {
        if (typeof v === 'string' && v.length > 1000) return v.slice(0, 1000) + '…';
        if (Array.isArray(v) && v.length > 80) return v.slice(0, 80).concat(['…']);
        if (v && typeof v === 'object' && (v.type === 'character' || v.type === 'monster')) return { id: v.id, name: v.name, mtype: v.mtype, hp: v.hp, x: v.x, y: v.y, map: v.map, target: v.target };
        return v;
      }));
    } catch (e) { return { serializationError: reason(e) }; }
  }

  function audit(kind, message, data, level) {
    if (!C.auditEnabled) return;
    var p = pos(character) || {};
    var ev = { at: clock(), iso: new Date().toISOString(), version: VERSION, build: BUILD, char: me, ctype: character.ctype, server: currentRealm(), map: character.map, x: Math.round(p.x || 0), y: Math.round(p.y || 0), kind: String(kind || 'event'), level: String(level || 'info'), message: safeString(message, 700), data: compactData(data) };
    S.auditRecent.push(ev); if (S.auditRecent.length > 3000) S.auditRecent.splice(0, S.auditRecent.length - 3000);
    // In caracAL/headless, mirror structured events to its persistent logger when available.
    try { if (HEADLESS && P.caracAL && P.caracAL.log && typeof P.caracAL.log.info === 'function') P.caracAL.log.info({ aio: ev }, ev.message); } catch (e) {}
    S.auditQueue.push(ev); if (S.auditQueue.length > 1000) flushAuditQueue();
    if (level === 'error' || level === 'critical') gameMessage('[AiO 2.7] ' + message, '#ff5b69');
    return ev;
  }
  function userLog(message, level, data) { audit('user', message, data, level || 'info'); }

  function initLogDB() {
    var idb = P.indexedDB || (typeof indexedDB !== 'undefined' ? indexedDB : null);
    if (!idb) { S.logDBFailed = true; audit('logging', 'IndexedDB nicht verfügbar; Langzeitlog nur im Arbeitsspeicher.', null, 'error'); return; }
    try {
      var req = idb.open('AiOBotLogsV27', 1);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('events')) {
          var st = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
          st.createIndex('at', 'at', { unique: false });
          st.createIndex('char', 'char', { unique: false });
        }
      };
      req.onsuccess = function (e) { S.logDB = e.target.result; S.logDBReady = true; audit('logging', 'Langzeitprotokoll bereit', { segmentStart: S.segmentStart }); flushAuditQueue(); };
      req.onerror = function () { S.logDBFailed = true; audit('logging', 'IndexedDB konnte nicht geöffnet werden', { error: req.error && req.error.message }, 'error'); };
    } catch (e) { S.logDBFailed = true; audit('logging', 'IndexedDB Fehler', { error: reason(e) }, 'error'); }
  }

  function flushAuditQueue() {
    if (!S.logDBReady || !S.logDB || !S.auditQueue.length) return;
    var rows = S.auditQueue.splice(0, S.auditQueue.length);
    try {
      var tx = S.logDB.transaction(['events'], 'readwrite'), st = tx.objectStore('events');
      rows.forEach(function (r) { try { st.add(r); } catch (e) {} });
      tx.onerror = function () { Array.prototype.unshift.apply(S.auditQueue, rows.slice(-300)); };
    } catch (e) { Array.prototype.unshift.apply(S.auditQueue, rows.slice(-300)); }
  }

  function rotateLogSegment() {
    var span = C.logSegmentHours * 3600000, now = clock();
    if (now - S.segmentStart < span) return;
    var seg = { start: S.segmentStart, end: now, char: me, version: VERSION, readyAt: now };
    S.readySegments.push(seg); if (S.readySegments.length > 20) S.readySegments = S.readySegments.slice(-20);
    write('readySegments:' + me, S.readySegments);
    S.segmentStart = now; write('segmentStart:' + me, now);
    audit('logging', '12-Stunden-Logsegment ist zum Download/Kopieren bereit.', seg, 'info');
    renderAll(true);
  }

  function logRowsBetween(start, end, cb) {
    if (!S.logDBReady || !S.logDB) { cb(S.auditRecent.filter(function (x) { return x.at >= start && x.at <= end; })); return; }
    try {
      var out = [], tx = S.logDB.transaction(['events'], 'readonly'), st = tx.objectStore('events'), idx = st.index('at');
      var KR = P.IDBKeyRange || (typeof IDBKeyRange !== 'undefined' ? IDBKeyRange : null);
      var req = KR ? idx.openCursor(KR.bound(start, end)) : idx.openCursor();
      req.onsuccess = function (e) { var cur = e.target.result; if (!cur) { cb(out); return; } var v = cur.value; if (v && v.char === me && v.at >= start && v.at <= end) out.push(v); cur.continue(); };
      req.onerror = function () { cb([]); };
    } catch (e) { cb([]); }
  }

  function logText(rows, start, end) {
    var header = { format: 'aio-bot-log-jsonl', botVersion: VERSION, character: me, from: new Date(start).toISOString(), to: new Date(end).toISOString(), note: 'Bot-observable decisions/actions/state changes. Not a raw network packet capture.' };
    return [JSON.stringify(header)].concat(rows.map(function (r) { return JSON.stringify(r); })).join('\n');
  }

  function downloadText(filename, text, mime) {
    try { var blob = new P.Blob([text], { type: mime || 'text/plain;charset=utf-8' }), url = P.URL.createObjectURL(blob), a = D.createElement('a'); a.href = url; a.download = filename; D.body.appendChild(a); a.click(); a.remove(); P.setTimeout(function () { P.URL.revokeObjectURL(url); }, 2000); return true; } catch (e) { return false; }
  }

  function copyText(text) {
    try {
      if (P.navigator && P.navigator.clipboard && P.navigator.clipboard.writeText) return P.navigator.clipboard.writeText(text).then(function () { return true; });
    } catch (e) {}
    try { var ta = D.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; D.body.appendChild(ta); ta.focus(); ta.select(); var ok = D.execCommand('copy'); ta.remove(); return Promise.resolve(!!ok); } catch (e) { return Promise.resolve(false); }
  }

  function exportLog(start, end, mode) {
    logRowsBetween(start, end, function (rows) {
      var text = logText(rows, start, end), fn = 'aio-bot-' + me + '-' + new Date(start).toISOString().replace(/[:.]/g, '-') + '.jsonl';
      if (mode === 'copy') copyText(text).then(function (ok) { userLog(ok ? 'Log in Zwischenablage kopiert.' : 'Log konnte nicht automatisch kopiert werden.', 'info', { rows: rows.length }); renderAll(true); });
      else { downloadText(fn, text, 'application/x-ndjson;charset=utf-8'); userLog('Logdatei bereitgestellt: ' + fn, 'info', { rows: rows.length }); }
    });
  }

  function pruneOldLogs() {
    if (!S.logDBReady || !S.logDB) return;
    var cutoff = clock() - C.logRetentionDays * 86400000;
    try {
      var tx = S.logDB.transaction(['events'], 'readwrite'), idx = tx.objectStore('events').index('at');
      var KR = P.IDBKeyRange || (typeof IDBKeyRange !== 'undefined' ? IDBKeyRange : null); if (!KR) return;
      var req = idx.openCursor(KR.upperBound(cutoff));
      req.onsuccess = function (e) { var cur = e.target.result; if (!cur) return; if (cur.value && cur.value.char === me) cur.delete(); cur.continue(); };
    } catch (e) {}
  }

  function action(name, fn, cooldownKey, cooldownMs) {
    var key = cooldownKey || name, now = clock(); if (now < (S.times[key] || 0)) return false;
    S.times[key] = now + (cooldownMs || 250);
    S.lastAction = name; S.lastActionAt = now;
    var started = now; audit('action_start', name, null);
    function fail(e){var err=reason(e);if(/^partyRequest:/.test(String(key))&&/invalid/i.test(err))S.times[key]=Math.max(Number(S.times[key])||0,clock()+15000);audit('action_error', name, { durationMs: clock() - started, error: err }, 'error');}
    try {
      var result = fn();
      if (result && typeof result.then === 'function') result.then(function (v) { audit('action_ok', name, { durationMs: clock() - started, result: compactData(v) }); }, fail);
      else audit('action_ok', name, { durationMs: clock() - started, sync: true });
      return true;
    } catch (e) { fail(e); return false; }
  }

  // --------------------------- Reports / automatic same-bot discovery + deterministic party ---------------------------
  function accountCharacterName(name) { return ACCOUNT_CHARS.some(function (x) { return x.name === name; }); }
  function characterType(name) {
    if (name === me) return character.ctype;
    var r = peerReport(name); if (r && r.ctype) return r.ctype;
    var c = ACCOUNT_CHARS.find(function (x) { return x.name === name; }); return c ? c.ctype : '';
  }

  function naturalRoleForClass(ctype) {
    ctype = String(ctype || '').toLowerCase();
    if (ctype === 'merchant') return 'merchant';
    if (ctype === 'priest') return 'healer';
    if (ctype === 'warrior' || ctype === 'paladin') return 'tank';
    return 'dps';
  }
  function naturalTankCandidates() {
    return C.roster.filter(function (n) {
      var ct = characterType(n);
      return ct === 'warrior' || ct === 'paladin';
    }).sort(function (a, z) {
      var aa = characterType(a) === 'warrior' ? 0 : 1, zz = characterType(z) === 'warrior' ? 0 : 1;
      return aa - zz || a.localeCompare(z);
    });
  }
  function roleSummary() {
    var naturalTanks = naturalTankCandidates(), tanks = naturalTanks.slice(), fallback = null;
    if (!tanks.length && C.fallbackTank !== 'none' && C.roster.indexOf(C.fallbackTank) >= 0 && characterType(C.fallbackTank) !== 'merchant') {
      tanks = [C.fallbackTank]; fallback = C.fallbackTank;
    }
    var healers = C.roster.filter(function (n) { return characterType(n) === 'priest' && tanks.indexOf(n) < 0; }).sort();
    var dps = C.roster.filter(function (n) {
      return characterType(n) !== 'merchant' && tanks.indexOf(n) < 0 && healers.indexOf(n) < 0;
    }).sort();
    var merchants = C.roster.filter(function (n) { return characterType(n) === 'merchant'; }).sort();
    return { tanks: tanks, primaryTank: tanks[0] || null, naturalTanks: naturalTanks, fallbackTank: fallback, healers: healers, dps: dps, merchants: merchants };
  }
  function roleForName(name) {
    var rs = roleSummary();
    if (rs.tanks.indexOf(name) >= 0) return 'tank';
    if (rs.healers.indexOf(name) >= 0) return 'healer';
    if (rs.dps.indexOf(name) >= 0) return 'dps';
    if (rs.merchants.indexOf(name) >= 0) return 'merchant';
    return naturalRoleForClass(characterType(name));
  }
  function roleLabel(role) {
    var map = {
      en:{tank:'Tank',healer:'Healer',dps:'Damage dealer',merchant:'Merchant'},
      de:{tank:'Tank',healer:'Heiler',dps:'Damage Dealer',merchant:'Merchant'},
      zh:{tank:'坦克',healer:'治疗',dps:'输出',merchant:'商人'},
      hi:{tank:'टैंक',healer:'हीलर',dps:'डैमेज डीलर',merchant:'मर्चेंट'},
      es:{tank:'Tanque',healer:'Sanador',dps:'Daño',merchant:'Mercader'},
      ar:{tank:'دبابة',healer:'معالج',dps:'ضرر',merchant:'تاجر'},
      fr:{tank:'Tank',healer:'Soigneur',dps:'Dégâts',merchant:'Marchand'},
      bn:{tank:'ট্যাঙ্ক',healer:'হিলার',dps:'ড্যামেজ',merchant:'মার্চেন্ট'},
      pt:{tank:'Tanque',healer:'Curandeiro',dps:'Dano',merchant:'Mercador'},
      ru:{tank:'Танк',healer:'Лекарь',dps:'Урон',merchant:'Торговец'},
      id:{tank:'Tank',healer:'Healer',dps:'Damage dealer',merchant:'Merchant'},
      ur:{tank:'ٹینک',healer:'ہیلر',dps:'ڈیمیج ڈیلر',merchant:'مرچنٹ'},
      ja:{tank:'タンク',healer:'ヒーラー',dps:'ダメージ',merchant:'商人'},
      pcm:{tank:'Tank',healer:'Healer',dps:'Damage dealer',merchant:'Merchant'},
      arz:{tank:'تانك',healer:'هيلر',dps:'دامج',merchant:'تاجر'}
    };
    var lang = map[C.language] || map.en;
    return lang[role] || role;
  }
  function activeTankName() {
    var rs = roleSummary(), now = clock();
    for (var i = 0; i < rs.tanks.length; i++) {
      var n = rs.tanks[i], r = n === me ? report(false) : peerReport(n);
      if (r && !r.rip && r.active !== false && now - r.at < C.peerReportSeconds * 1000) return n;
    }
    return null;
  }

  function report(withRole) {
    var p = pos(character) || {};
    var r = { type: 'aio27-report', protocol: REPORT_PROTOCOL, version: VERSION, name: me, ctype: character.ctype, level: character.level, at: clock(), map: character.map, x: p.x || 0, y: p.y || 0, hp: character.hp, max_hp: character.max_hp, mp: character.mp, max_mp: character.max_mp, attack: character.attack, frequency: character.frequency, armor: character.armor, resistance: character.resistance, range: character.range, speed: character.speed, damage_type: character.damage_type, slots: character.slots, active: !!S.running, rip: !!character.rip, status: S.status, mode: S.mode, target: S.target, goal: S.goal, free: freeSlots(), gold: character.gold, hpot: qty(C.hpot), mpot: qty(C.mpot) };
    if (withRole !== false) { r.role = roleForName(me); r.primaryTank = roleSummary().primaryTank; }
    return r;
  }
  function validBotReport(name, r, maxAge) {
    return !!(r && r.type === 'aio27-report' && Number(r.protocol) === REPORT_PROTOCOL && r.name === name && accountCharacterName(name) && isFinite(r.at) && clock() - r.at < (maxAge || C.peerReportSeconds * 1000));
  }
  function peerReport(name) {
    if (name === me) return report();
    var a = read('report:' + name, null), b = S.reports[name], ttl = C.peerReportSeconds * 1000;
    if (validBotReport(name, b, ttl) && (!a || b.at > a.at)) a = b;
    return validBotReport(name, a, ttl) ? a : null;
  }
  function discoveredBotReports() {
    var ttl = C.peerReportSeconds * 1000, out = [report()];
    ACCOUNT_CHARS.forEach(function (c) {
      if (c.name === me) return;
      var r = peerReport(c.name);
      if (validBotReport(c.name, r, ttl)) out.push(r);
    });
    var uniq = {};
    return out.filter(function (r) { if (uniq[r.name]) return false; uniq[r.name] = true; return true; });
  }
  function selectFourBotNames(reports) {
    var names = reports.map(function (r) { return r.name; }).filter(accountCharacterName).sort();
    if (names.length <= 4) return names;
    var merchants = names.filter(function (n) { return characterType(n) === 'merchant'; });
    var farmers = names.filter(function (n) { return characterType(n) !== 'merchant'; });
    return (merchants.length ? [merchants[0]] : []).concat(farmers).slice(0, 4).sort();
  }
  function syncAutoRoster(force) {
    if (!C.autoRoster) { S.rosterValidated = true; return false; }
    var now = clock(); if (!force && now - S.lastRosterSync < 1200) return false; S.lastRosterSync = now;
    var reports = discoveredBotReports(), selected = selectFourBotNames(reports); S.discoveredNames = selected.slice();
    // Important: never shrink a previously valid four-character roster because one heartbeat was briefly missed.
    // A roster change is only committed after four current protocol reports are visible at the same time.
    if (selected.length !== 4) return false;
    S.rosterValidated = true;
    if (!sameJSON(selected.slice().sort(), C.roster.slice().sort())) {
      var before = C.roster.slice();
      C.roster = selected.slice();
      if (C.leader !== 'auto' && C.roster.indexOf(C.leader) < 0) C.leader = 'auto';
      if (C.fallbackTank !== 'none' && C.roster.indexOf(C.fallbackTank) < 0) C.fallbackTank = 'none';
      write('config', C);
      audit('roster_auto', 'Bot-Charaktere automatisch erkannt', { from: before, to: C.roster, protocol: REPORT_PROTOCOL, reports: reports.map(function (r) { return { name: r.name, ctype: r.ctype, role: r.role, version: r.version, age: now - r.at }; }) });
      renderAll(true); return true;
    }
    return false;
  }
  function peers(includeInactive) { var ttl=C.peerReportSeconds*1000; return C.roster.map(peerReport).filter(function (r) { return r && (includeInactive || r.active) && clock() - r.at < ttl; }); }
  function farmers() { return peers().filter(function (r) { return r.ctype !== 'merchant' && !r.rip; }); }
  function merchantName() { var names = C.roster.filter(function (n) { return characterType(n) === 'merchant'; }).sort(); return names[0] || null; }
  function canonicalLeader() {
    if (C.leader !== 'auto' && C.roster.indexOf(C.leader) >= 0) return C.leader;
    var f = C.roster.filter(function (n) { return characterType(n) !== 'merchant'; }).sort();
    return f[0] || C.roster.slice().sort()[0] || me;
  }
  function partyMembers() { var names=[me];Object.keys(P.party||{}).forEach(function(n){if(names.indexOf(n)<0)names.push(n);});return names.sort(); }
  function partyState() {
    var expected=C.roster.slice().sort(),members=partyMembers(),missing=expected.filter(function(n){return members.indexOf(n)<0;}),foreign=members.filter(function(n){return expected.indexOf(n)<0;}),lead=canonicalLeader(),actualLeader=String(character.party || (members.length>1&&members.indexOf(lead)>=0?lead:'') || '');
    var discovered=(S.discoveredNames||[]).slice().sort(),roles=roleSummary();
    return { expected:expected,members:members,missing:missing,foreign:foreign,canonicalLeader:lead,actualLeader:actualLeader,discovered:discovered,discoveryCount:discovered.length,roles:roles,complete:expected.length===4&&missing.length===0&&foreign.length===0&&members.length===4 };
  }
  function publishReport() {
    var r=report();write('report:'+me,r);
    if(typeof send_cm==='function'&&clock()>(S.times.cmReport||0)){
      S.times.cmReport=clock()+3000;var names=ACCOUNT_CHARS.map(function(c){return c.name;}).filter(function(n){return n!==me;});
      if(names.length)try{Promise.resolve(send_cm(names,r)).catch(function(){});}catch(e){}
    }
  }

  function partyReconcileTick() {
    syncAutoRoster(false);
    if(!S.running||!C.autoParty||clock()-S.partyLastRepair<C.partyRepairSeconds*1000)return false;
    S.partyLastRepair=clock();var st=partyState(),lead=st.canonicalLeader;
    if(!sameJSON(st,S.partyLastState)){audit('party_state',st.complete?'Party vollständig':'Party unvollständig',st,st.complete?'info':'warning');S.partyLastState=compactData(st);}
    if(st.complete)S.partyIncompleteSince=0;else if(!S.partyIncompleteSince)S.partyIncompleteSince=clock();
    if(C.autoRoster&&!S.rosterValidated){S.status='Detecting same-bot characters ('+(S.discoveredNames||[]).length+'/4)';S.mode='Group discovery';return false;}
    if(C.autoRoster&&st.expected.length<4){S.status='Detecting same-bot characters ('+st.expected.length+'/4)';S.mode='Group discovery';return false;}
    if(clock()-S.discoveryStarted<2500)return false;
    if(character.party&&String(character.party)!==lead){if(typeof leave_party==='function')return action('Falsche Teilgruppe verlassen',function(){return leave_party();},'partyLeaveWrong',3500);return false;}
    if(me===lead){
      if(character.party&&String(character.party)!==me)return false;
      if(st.foreign.length&&typeof kick_party_member==='function')return action('Fremdes Partymitglied entfernen '+st.foreign[0],function(){return kick_party_member(st.foreign[0]);},'partyKick',3000);
      var missing=C.roster.filter(function(n){return n!==me&&st.members.indexOf(n)<0;});
      if(missing.length&&typeof send_party_invite==='function')return action('Party-Einladung '+missing[0],function(){return send_party_invite(missing[0]);},'partyInvite:'+missing[0],5000);
    }else if(!character.party&&typeof send_party_request==='function')return action('Party-Anfrage an '+lead,function(){return send_party_request(lead);},'partyRequest:'+lead,5000);
    return false;
  }

  var oldCM=typeof on_cm!=='undefined'?on_cm:null,oldInvite=typeof on_party_invite!=='undefined'?on_party_invite:null,oldRequest=typeof on_party_request!=='undefined'?on_party_request:null;
  on_cm=function(name,data){
    var isReport=!!(data&&data.type==='aio27-report');
    if(!isReport||clock()>(S.times['cmAudit:'+name]||0)){if(isReport)S.times['cmAudit:'+name]=clock()+15000;var cmLog=isReport?{type:data.type,protocol:data.protocol,version:data.version,name:data.name,ctype:data.ctype,level:data.level,map:data.map,x:Math.round(Number(data.x)||0),y:Math.round(Number(data.y)||0),hp:data.hp,max_hp:data.max_hp,mp:data.mp,max_mp:data.max_mp,gold:data.gold,free:data.free,active:data.active,rip:data.rip,status:data.status,mode:data.mode,targetMtype:data.targetMtype,at:data.at}:data;audit('cm_receive','CM von '+name,cmLog);}
    if(accountCharacterName(name)&&data&&data.type==='aio27-report'&&data.name===name&&Number(data.protocol)===REPORT_PROTOCOL){S.reports[name]=data;write('report:'+name,data);syncAutoRoster(true);}
    if(C.roster.indexOf(name)>=0&&data&&data.type==='aio27-elixir-delivery'&&data.to===me){S.elixirDelivery=data;write('elixirDelivery:'+me,data);}
  };
  on_party_invite=function(name){audit('party_invite','Party-Einladung von '+name,{canonicalLeader:canonicalLeader(),currentLeader:character.party});if(!S.running||!C.autoParty||name!==canonicalLeader()||C.roster.indexOf(name)<0)return;if(character.party&&String(character.party)!==name&&typeof leave_party==='function'){action('Vor richtiger Party falsche Gruppe verlassen',function(){return Promise.resolve(leave_party()).then(function(){P.setTimeout(function(){try{accept_party_invite(name);}catch(e){}},500);});},'partyInviteRepair',3000);return;}if(typeof accept_party_invite==='function')action('Party-Einladung annehmen '+name,function(){return accept_party_invite(name);},'partyAccept:'+name,3000);};
  on_party_request=function(name){audit('party_request','Party-Anfrage von '+name,{canonicalLeader:canonicalLeader()});if(S.running&&C.autoParty&&me===canonicalLeader()&&C.roster.indexOf(name)>=0&&typeof accept_party_request==='function')action('Party-Anfrage annehmen '+name,function(){return accept_party_request(name);},'partyRequestAccept:'+name,2500);};

  // --------------------------- Web Dashboard 2.7 ---------------------------
  function dashboardMapBounds(){var g=GD.geometry&&GD.geometry[character.map],p=pos(character)||{x:0,y:0};var minX=g&&isFinite(g.min_x)?Number(g.min_x):p.x-1200,minY=g&&isFinite(g.min_y)?Number(g.min_y):p.y-1200,maxX=g&&isFinite(g.max_x)?Number(g.max_x):p.x+1200,maxY=g&&isFinite(g.max_y)?Number(g.max_y):p.y+1200;return {minX:minX,minY:minY,maxX:maxX,maxY:maxY};}
  function dashboardAlerts(){
    var out=[],ps=partyState();
    if(C.strictFourParty&&!ps.complete&&S.partyIncompleteSince&&clock()-S.partyIncompleteSince>12000)out.push({code:'party_incomplete',severity:'critical',text:'Party incomplete. Missing: '+(ps.missing.join(', ')||'unknown')+(ps.foreign.length?' · Foreign: '+ps.foreign.join(', '):'')});
    if(character.rip)out.push({code:'dead',severity:'critical',text:me+' is dead.'});
    if(S.update.available)out.push({code:'update_available',severity:'warning',text:'AiO Bot '+S.update.latest+' is available.'});
    if(C.webDashboardEnabled&&S.dashboardFailAt&&clock()-S.dashboardLastAck>Math.max(30000,C.webDashboardIntervalSeconds*4000))out.push({code:'dashboard_connection',severity:'warning',text:'Web dashboard has not confirmed a status update: '+safeString(S.dashboardLastError||'unknown error',220)});
    return out;
  }
  function dashboardPayload(){
    var p=pos(character)||{},realm=currentRealm(),ps=partyState(),rs=roleSummary();
    return {type:'aio-bot-status',version:3,botVersion:VERSION,language:C.language||'en',name:me,ctype:character.ctype,role:roleForName(me),roles:rs,level:character.level,hp:character.hp,maxHp:character.max_hp,hpPct:Math.round(ratio(character,'hp')*1000)/10,mp:character.mp,maxMp:character.max_mp,mpPct:Math.round(ratio(character,'mp')*1000)/10,task:safeString(S.status,500),taskCode:safeString(S.mode,80),mode:safeString(S.mode,120),active:!!S.running,rip:!!character.rip,map:character.map,x:Number(p.x)||0,y:Number(p.y)||0,mapBounds:dashboardMapBounds(),server:realm,party:ps,alerts:dashboardAlerts(),lastXpAt:S.lastXPAt,lastKillAt:S.lastKillAt,lastMoveAt:S.lastMoveAt,lastActionAt:S.lastActionAt,lastAction:safeString(S.lastAction,150),updatedAt:clock()};
  }
  function normalizeDashboardEndpoint(value){
    var endpoint=String(value||'').trim();if(!/^https?:\/\//i.test(endpoint))return '';
    try{var u=new URL(endpoint);var pageProtocol=String(P.location&&P.location.protocol||'');if(u.protocol==='http:'&&(pageProtocol==='https:'||/\.bplaced\.net$/i.test(u.hostname))){u.protocol='https:';endpoint=u.toString();}}catch(e){}
    return endpoint;
  }
  function dashboardFormFallback(endpoint,payload){
    try{
      if(!D||!D.body)return false;
      var frame=D.getElementById('aio27-dashboard-sink');
      if(!frame){frame=D.createElement('iframe');frame.id='aio27-dashboard-sink';frame.name='aio27-dashboard-sink';frame.style.display='none';D.body.appendChild(frame);}
      var form=D.createElement('form');form.method='POST';form.action=endpoint;form.target=frame.name;form.style.display='none';
      var input=D.createElement('input');input.type='hidden';input.name='status';input.value=JSON.stringify(payload);form.appendChild(input);D.body.appendChild(form);form.submit();form.remove();
      S.dashboardTransport='form/unverified';S.dashboardUnverifiedAt=clock();return true;
    }catch(e){return false;}
  }
  function dashboardPublishTick(force){
    if((!C.webDashboardEnabled&&!force)||S.dashboardSending)return false;
    var original=String(C.webDashboardConnectionUrl||'').trim(),endpoint=normalizeDashboardEndpoint(original);
    if(!endpoint){S.dashboardLastError='Invalid dashboard URL';S.dashboardFailAt=clock();return false;}
    if(!force&&clock()-S.lastDashboardPublish<C.webDashboardIntervalSeconds*1000)return false;
    if(endpoint!==original&&clock()>(S.times.dashboardUpgradeLog||0)){S.times.dashboardUpgradeLog=clock()+60000;audit('dashboard_url_upgrade','Dashboard URL automatically upgraded to HTTPS',{from:original.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'),to:endpoint.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***')});}
    S.lastDashboardPublish=clock();
    var payload=dashboardPayload(),body=JSON.stringify(payload),fetcher=typeof fetch==='function'?fetch:(P.fetch?P.fetch.bind(P):null);S.dashboardSending=true;
    audit('dashboard_send','Dashboard status send',{endpointHost:endpoint.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'),payload:payload});
    if(!fetcher){
      S.dashboardSending=false;S.dashboardFailAt=clock();S.dashboardLastError='fetch() unavailable';
      if(dashboardFormFallback(endpoint,payload))audit('dashboard_fallback','Dashboard submitted via form fallback; server acknowledgement unavailable',{transport:'form/unverified'},'warning');
      else audit('dashboard_error','Dashboard connection: fetch() unavailable and form fallback failed',null,'error');
      renderAll(true);return false;
    }
    try{
      Promise.resolve(fetcher(endpoint,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',redirect:'follow',headers:{'Content-Type':'text/plain;charset=UTF-8','Accept':'application/json'},body:body}))
      .then(function(resp){return Promise.resolve(resp.text()).then(function(text){return {resp:resp,text:text};});})
      .then(function(x){
        var ack=null;try{ack=JSON.parse(x.text||'{}');}catch(e){}
        if(!x.resp||!x.resp.ok||!ack||ack.ok!==true)throw new Error('HTTP '+(x.resp&&x.resp.status||0)+(ack&&ack.error?' · '+ack.error:'')+(x.text&&!ack?' · invalid JSON response':''));
        if(ack.name&&ack.name!==me)throw new Error('Dashboard acknowledged another character: '+ack.name);
        S.dashboardLastOK=clock();S.dashboardLastAck=clock();S.dashboardFailAt=0;S.dashboardLastError='';S.dashboardAckName=ack.name||me;S.dashboardTransport='cors/json';
        audit('dashboard_ack','Dashboard confirmed status',{transport:S.dashboardTransport,status:x.resp.status,name:ack.name||me,receivedAt:ack.receivedAt||0});
      })
      .catch(function(e){
        S.dashboardFailAt=clock();S.dashboardLastError=reason(e);S.dashboardTransport='cors/error';
        audit('dashboard_error','Dashboard confirmation failed: '+reason(e),null,'error');
        if(dashboardFormFallback(endpoint,payload))audit('dashboard_fallback','Fallback request submitted, but cannot be confirmed',{transport:'form/unverified',error:reason(e)},'warning');
      })
      .finally(function(){S.dashboardSending=false;renderAll(true);});
      return true;
    }catch(e){
      S.dashboardSending=false;S.dashboardFailAt=clock();S.dashboardLastError=reason(e);S.dashboardTransport='cors/error';
      audit('dashboard_error','Dashboard connection: '+reason(e),null,'error');
      if(dashboardFormFallback(endpoint,payload))audit('dashboard_fallback','Fallback request submitted, but cannot be confirmed',{transport:'form/unverified',error:reason(e)},'warning');
      renderAll(true);return false;
    }
  }


  // --------------------------- GitHub update checker / updater ---------------------------
  function repoRaw(repo,file){var m=String(repo||'').match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/#?]+)(?:[\/#?].*)?$/i);if(!m)return '';return 'https://raw.githubusercontent.com/'+m[1]+'/'+m[2].replace(/\.git$/i,'')+'/main/'+file;}
  function fetchText(url){var f=typeof fetch==='function'?fetch:(P.fetch?P.fetch.bind(P):null);if(!f)return Promise.reject(Error('fetch unavailable'));return Promise.resolve(f(url,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store'})).then(function(r){if(!r||!r.ok)throw Error('HTTP '+(r&&r.status));return r.text();});}
  function checkRepo(repo){var versionUrl=repoRaw(repo,'version.json'),botUrl=repoRaw(repo,'bot.js');if(!botUrl)return Promise.reject(Error('Invalid GitHub repository URL'));return fetchText(versionUrl).then(function(txt){var j=JSON.parse(txt);return {version:String(j.version||''),raw:String(j.botRawUrl||botUrl),repo:repo};}).catch(function(){return fetchText(botUrl).then(function(txt){var m=txt.match(/(?:VERSION\s*=\s*['\"]|AiO Bot\s+)(\d+\.\d+\.\d+)/i);if(!m)throw Error('No version found');return {version:m[1],raw:botUrl,repo:repo};});});}
  function updateCheckTick(force){
    if(!C.updateCheckEnabled||S.update.checking||S.update.applying)return false;if(!force&&clock()-S.update.checkedAt<60000)return false;S.update.checking=true;S.update.checkedAt=clock();S.update.error='';var repo=defaults.updateRepositoryUrl;
    checkRepo(repo).then(function(r){S.update.checking=false;S.update.latest=r.version;S.update.repo=r.repo;S.update.raw=r.raw;S.update.available=newer(r.version,VERSION);S.update.error='';audit('update_check',S.update.available?'New bot version available: '+r.version:'Bot is current',r,S.update.available?'warning':'info');renderAll(true);if(S.update.available&&C.autoUpdateEnabled)P.setTimeout(function(){selfUpdate(true);},250);}).catch(function(e){S.update.checking=false;S.update.error=reason(e);audit('update_error','Update check failed: '+S.update.error,{repo:repo},'warning');renderAll(true);});return true;
  }
  function fetchLatestBotCode(){var raw=S.update.raw||repoRaw(S.update.repo||defaults.updateRepositoryUrl,'bot.js');return raw?fetchText(raw):Promise.reject(Error('No raw URL'));}
  function activeCodeSlot(){try{return typeof get_active_code_slot==='function'?get_active_code_slot():null;}catch(e){return null;}}
  function v275ValidateUpdateCode(code,expected){if(typeof code!=='string'||code.length<50000)throw Error('Downloaded bot code is incomplete');if(code.indexOf('Adventure Land • AiO Bot')<0||code.indexOf('__ALBOT2__')<0)throw Error('Downloaded file is not a valid AiO Bot build');var m=code.match(/var VERSION = ['"](\d+\.\d+\.\d+)['"]/);if(!m)throw Error('Downloaded bot version marker missing');if(expected&&m[1]!==expected)throw Error('Version mismatch: expected '+expected+', got '+m[1]);if(!newer(m[1],VERSION))throw Error('Downloaded bot is not newer');try{new Function(code);}catch(e){throw Error('Downloaded bot syntax invalid: '+reason(e));}return m[1];}
  function v275HotReload(code,version){write('lastAppliedUpdate:'+me,{from:VERSION,to:version,at:clock()});audit('update_reload','Update gespeichert · Hot-Reload startet',{from:VERSION,to:version,bytes:code.length});P.setTimeout(function(){try{(0,eval)(code);}catch(e){try{S.update.applying=false;S.update.error=reason(e);audit('update_reload_error','Hot-Reload fehlgeschlagen: '+reason(e),null,'error');}catch(_){};}},120);}
  function selfUpdate(auto){if(S.update.applying)return Promise.resolve(false);S.update.applying=true;audit('update_apply',(auto?'Automatic':'Manual')+' self-update started',{latest:S.update.latest,repo:S.update.repo});return fetchLatestBotCode().then(function(code){var v=v275ValidateUpdateCode(code,S.update.latest),slotId=activeCodeSlot();if(typeof upload_code!=='function'||slotId==null||String(slotId)===''||!/^\d+$/.test(String(slotId)))throw Error('Active CODE slot cannot be saved automatically');return Promise.resolve(upload_code(Number(slotId),'bot',code)).then(function(res){audit('update_saved','New bot version saved to active CODE slot '+slotId,{from:VERSION,to:v,result:res});v275HotReload(code,v);return true;});}).catch(function(e){S.update.applying=false;S.update.error=reason(e);audit('update_auto_error','Automatic update failed: '+reason(e),{latest:S.update.latest},'error');renderAll(true);return false;});}

  // ---------------------------------------------------------------------------
  // Class-aware elixir optimisation
  // ---------------------------------------------------------------------------
  function classStat(ctype) {
    return ({ ranger: 'dex', rogue: 'dex', mage: 'int', priest: 'int', warrior: 'str', paladin: 'str', merchant: 'int' })[String(ctype || '').toLowerCase()] || 'vit';
  }
  function itemProps(item) {
    if (!item) return {};
    try { if (typeof item_properties === 'function') return item_properties(item) || {}; } catch (e) {}
    return GD.items && GD.items[item.name] || {};
  }
  function elixirRankName(name) { var m = String(name || '').match(/(\d+)$/); return m ? Number(m[1]) : 0; }
  function isElixir(item) { return !!(item && GD.items && GD.items[item.name] && GD.items[item.name].type === 'elixir'); }
  function elixirScoreFor(item, ctype) {
    if (!item || !isElixir(item)) return -Infinity;
    var p = itemProps(item), stat = classStat(ctype), score = 0;
    score += (Number(p[stat]) || 0) * 1000;
    score += (Number(p.attack) || 0) * 50 + (Number(p.frequency) || 0) * 800 + (Number(p.crit) || 0) * 80 + (Number(p.critdamage) || 0) * 20;
    score += (Number(p.apiercing) || 0) * (stat === 'dex' || stat === 'str' ? 2 : .5);
    score += (Number(p.rpiercing) || 0) * (stat === 'int' ? 2 : .5);
    score += (Number(p.output) || 0) * 30 + (Number(p.speed) || 0) * 2;
    score += elixirRankName(item.name) * 100;
    return score;
  }
  function currentElixirOfReport(r) {
    var e = r && r.slots && r.slots.elixir;
    return e || null;
  }
  function bestInventoryElixir(ctype) {
    var best = null;
    (character.items || []).forEach(function (i, n) {
      if (!isElixir(i)) return;
      var score = elixirScoreFor(i, ctype);
      if (!best || score > best.score) best = { index: n, item: i, score: score };
    });
    return best;
  }
  function elixirRecipeTargets() {
    var out = [];
    Object.keys(GD.craft || {}).forEach(function (recipeId) {
      var recipe = GD.craft[recipeId] || {}, d = GD.items && GD.items[recipeId];
      if (!d || d.type !== 'elixir' || !Array.isArray(recipe.items)) return;
      var req = recipe.items.length === 1 && recipe.items[0];
      if (!req || Number(req[0]) < 2 || (GD.items[req[1]] || {}).type !== 'elixir') return;
      out.push({ output: recipeId, input: req[1], count: Number(req[0]) || 1, cost: Number(recipe.cost) || 0, rank: elixirRankName(recipeId) });
    });
    return out.sort(function (a, b) { return b.rank - a.rank; });
  }
  function elixirCraftUpgradeTick() {
    if (character.ctype !== 'merchant' || !C.autoElixirs || !C.upgradeElixirs || typeof auto_craft !== 'function') return false;
    var targets = elixirRecipeTargets().filter(function (r) { return r.rank <= C.elixirUpgradeTo && qty(r.input) >= r.count; });
    if (!targets.length) return false;
    var job = targets[0];
    if (character.gold < job.cost) return false;
    S.status = 'Elixier verbessern: ' + ((GD.items[job.output] || {}).name || job.output); S.mode = 'Elixiere';
    return action('Elixier craften ' + job.output, function () {
      return Promise.resolve(auto_craft(job.output)).then(function (v) {
        audit('elixir_upgrade', job.count + ' × ' + job.input + ' → ' + job.output, { recipe: job, result: v });
        return v;
      });
    }, 'elixir-craft', 1800);
  }
  function farmerReports() { return peers(true).filter(function (r) { return r.ctype !== 'merchant' && !r.rip && r.active !== false; }); }
  function elixirDeliveryCandidate() {
    if (character.ctype !== 'merchant' || !C.autoElixirs || !C.distributeElixirs) return null;
    var candidates = [];
    farmerReports().forEach(function (r) {
      var best = bestInventoryElixir(r.ctype), current = currentElixirOfReport(r);
      if (!best) return;
      var oldScore = current ? elixirScoreFor(current, r.ctype) : -Infinity;
      if (best.score > oldScore + 1) candidates.push({ to: r.name, report: r, index: best.index, item: best.item, gain: best.score - oldScore });
    });
    return candidates.sort(function (a, b) { return b.gain - a.gain; })[0] || null;
  }
  function deliverElixirTick() {
    var c = elixirDeliveryCandidate(); if (!c) return false;
    var p = localPlayer(c.to);
    if (!p || dist(character, p) > 260) {
      if (typeof smart_move === 'function' && (!S.lastSmartMove || clock() - S.lastSmartMove > 3500)) {
        S.lastSmartMove = clock(); S.status = 'Elixier zu ' + c.to + ' bringen'; S.mode = 'Lieferung';
        audit('move', 'Merchant bringt Elixier zu ' + c.to, { target: c.report && pos(c.report) });
        try { smart_move(c.report); } catch (e) {}
      }
      return true;
    }
    var live = character.items[c.index]; if (!live || live.name !== c.item.name) return false;
    return action('Elixier senden ' + c.to, function () {
      write('elixirDelivery:' + c.to, { name: live.name, from: me, at: clock(), score: c.gain });
      return Promise.resolve(send_item(c.to, c.index, 1)).then(function (v) { audit('elixir_delivery', live.name + ' → ' + c.to, { ctype: c.report.ctype, gain: c.gain }); return v; });
    }, 'elixir-send', 1300);
  }
  function applyDeliveredElixirTick() {
    if (character.ctype === 'merchant' || !C.autoElixirs) return false;
    var delivery = read('elixirDelivery:' + me, null), best = bestInventoryElixir(character.ctype), current = character.slots && character.slots.elixir;
    if (!best) return false;
    var should = !current || elixirScoreFor(best.item, character.ctype) > elixirScoreFor(current, character.ctype) + 1;
    if (!should) { if (delivery) write('elixirDelivery:' + me, null); return false; }
    var idx = best.index;
    return action('Elixier aktivieren', function () {
      var fn;
      if (typeof use === 'function') fn = function () { return use(idx); };
      else if (typeof equip === 'function') fn = function () { return equip(idx, 'elixir'); };
      else throw Error('Keine Elixier-Funktion verfügbar');
      return Promise.resolve(fn()).then(function (v) { write('elixirDelivery:' + me, null); audit('elixir_equip', best.item.name + ' aktiviert', { score: best.score }); return v; });
    }, 'elixir-equip', 1500);
  }

  // ---------------------------------------------------------------------------
  // Combat, farming and support
  // ---------------------------------------------------------------------------
  function mobs() { return entities().filter(function (e) { return e && e.type === 'monster' && !e.dead && e.hp > 0 && e.visible !== false; }); }
  function safeEnemy(e) {
    if (!e || e.type !== 'monster' || e.dead || e.hp <= 0) return false;
    if (e.target && C.roster.indexOf(e.target) < 0) return false;
    if (!C.safety) return true;
    var d = GD.monsters && GD.monsters[e.mtype] || {}, incoming = Number(e.attack || d.attack) || 0;
    return incoming < Math.max(300, character.max_hp * (C.risk / 100));
  }
  function classSkills() {
    return Object.keys(GD.skills || {}).filter(function (id) {
      var d = GD.skills[id] || {}; if (d.class && [].concat(d.class).indexOf(character.ctype) < 0) return false;
      return ['magiport','blink','dash','warp','pickpocket','fishing','mining','throw','alchemy','track'].indexOf(id) < 0;
    });
  }
  function skillCfg(id) {
    var map = C.skills[me] || {}, c = map[id] || {}, d = GD.skills[id] || {};
    var offensive = !!d.hostile || d.target === 'monster' || d.target === 'enemy';
    return Object.assign({ enabled: offensive || ['heal','partyheal','selfheal','energize','rspeed','mluck','warcry','darkblessing','huntersmark','curse','taunt','agitate','charge','scare'].indexOf(id) >= 0, target: 'auto', hp: 80 }, c);
  }
  function skillCanUse(id) {
    var d = GD.skills[id] || {}, c = skillCfg(id); if (!c.enabled) return false;
    if (d.class && [].concat(d.class).indexOf(character.ctype) < 0) return false;
    if (character.level < (Number(d.level) || 0)) return false;
    try { if (typeof can_use === 'function') return !!can_use(id); } catch (e) {}
    try { if (typeof is_on_cooldown === 'function' && is_on_cooldown(id)) return false; } catch (e) {}
    return character.mp >= (Number(d.mp) || 0);
  }
  function manaReserve() {
    var enabledCosts = classSkills().filter(function (id) { return skillCfg(id).enabled; }).map(function (id) { return Number((GD.skills[id] || {}).mp) || 0; });
    return Math.max(character.max_mp * C.manaReserve / 100, enabledCosts.length ? Math.max.apply(null, enabledCosts) : 0);
  }
  function useSkillSafe(id, target, extra, emergency) {
    if (!skillCanUse(id)) return false;
    var d = GD.skills[id] || {}, cost = Number(d.mp) || 0;
    if (!emergency && character.mp - cost < Math.min(character.max_mp, manaReserve())) return false;
    if (target && typeof target !== 'string') { try { if (typeof is_in_range === 'function' && !is_in_range(target, id)) return false; } catch (e) {} }
    return action('Skill ' + id, function () { return use_skill(id, target && targetID(target) || target, extra); }, 'skill:' + id, Math.max(180, Number(d.cooldown) || 300));
  }
  function groupLocalPlayers() {
    return C.roster.map(function (n) { return n === me ? character : localPlayer(n); }).filter(function (e) { return e && !e.rip; });
  }
  function reportHpRatio(r) {
    if (!r) return 0;
    var max = Number(r.max_hp || r.maxHp) || 1;
    return Math.max(0, Math.min(1, (Number(r.hp) || 0) / max));
  }
  function partyThreats() {
    return mobs().filter(function (m) { return safeEnemy(m) && C.roster.indexOf(m.target) >= 0; });
  }
  function healerCanDamage() {
    if (roleForName(me) !== 'healer') return true;
    if (ratio(character,'mp') < C.healerManaReservePct / 100) return false;
    var sameMapReports = C.roster.map(function (n) { return n === me ? report(false) : peerReport(n); }).filter(function (r) {
      return r && r.ctype !== 'merchant' && !r.rip && r.map === character.map;
    });
    if (sameMapReports.some(function (r) { return reportHpRatio(r) < C.healerSafeDamagePct / 100; })) return false;
    var threats = partyThreats(); if (!threats.length) return true;
    var tank = activeTankName(); if (!tank) return false;
    var tankReport = tank === me ? report(false) : peerReport(tank);
    if (!tankReport || tankReport.rip || reportHpRatio(tankReport) < Math.max(.90, C.healerHealStartPct / 100)) return false;
    if (threats.length > C.tankMaxAggroTargets) return false;
    return threats.every(function (m) { return m.target === tank; });
  }
  function healerPriorityTick() {
    if (roleForName(me) !== 'healer') return false;
    var allies = groupLocalPlayers().filter(function (a) { return a && characterType(a.name || me) !== 'merchant'; });
    if (!allies.length) allies = [character];
    var hurt = allies.slice().sort(function (a, z) { return ratio(a,'hp') - ratio(z,'hp'); })[0];
    var hurtCount = allies.filter(function (a) { return ratio(a,'hp') < C.healerHealStartPct / 100; }).length;
    if (hurtCount >= 2 && skillCanUse('partyheal')) {
      if (useSkillSafe('partyheal', null, null, true)) return true;
    }
    if (hurt && ratio(hurt,'hp') < C.healerHealStartPct / 100) {
      var emergency = ratio(hurt,'hp') < C.healerEmergencyPct / 100;
      try {
        if (typeof can_heal === 'function' && can_heal(hurt) && typeof heal === 'function') {
          S.status = 'Heilen: ' + (hurt.name || me); S.mode = 'Heilen';
          return action('Heilen ' + (hurt.name || me), function () { return heal(hurt); }, 'heal', emergency ? 160 : 220);
        }
      } catch (e) {}
      if (useSkillSafe('heal', hurt, null, true)) return true;
    }
    return false;
  }
  function tankSupportTick() {
    if (roleForName(me) !== 'tank') return false;
    if (ratio(character,'hp') < .45 && useSkillSafe('selfheal', null, null, true)) return true;
    var buffs=['warcry','charge'];
    for(var bi=0;bi<buffs.length;bi++){
      var bid=buffs[bi];if(!skillCanUse(bid))continue;var bd=GD.skills[bid]||{},cond=bd.condition;
      if(cond&&character.s&&character.s[cond]&&(character.s[cond].ms==null||character.s[cond].ms>5000))continue;
      if(useSkillSafe(bid,null,null,false))return true;
    }
    return false;
  }
  function supportTick() {
    var role = roleForName(me);
    if (role === 'healer') return healerPriorityTick();
    if (role === 'tank') { if (tankAggroTick()) return true; return tankSupportTick(); }
    // Damage dealers deliberately do not spend combat time on support buffs.
    return false;
  }
  function activeTankReport() {
    var n = activeTankName(); if (!n) return null;
    return n === me ? report(false) : peerReport(n);
  }
  function tankAggroTick() {
    var tank = activeTankName();
    if (!tank || me !== tank || roleForName(me) !== 'tank') return false;
    var threats = partyThreats().filter(function (m) { return dist(character,m) <= C.tankAggroRadius; });
    var loose = threats.filter(function (m) { return m.target && m.target !== me; }).sort(function (a,z) {
      var ar=roleForName(a.target), zr=roleForName(z.target);
      var ap=ar==='healer'?0:ar==='dps'?1:2, zp=zr==='healer'?0:zr==='dps'?1:2;
      return ap-zp || a.hp-z.hp;
    });
    if (!loose.length) return false;
    if (loose.length >= 2 && threats.length <= C.tankMaxAggroTargets && skillCanUse('agitate')) {
      S.status='Aggro übernehmen ('+loose.length+')';S.mode='Tanken';
      if (useSkillSafe('agitate', null, null, true)) return true;
    }
    var target=loose[0];S.target=targetID(target);S.status='Aggro übernehmen: '+((GD.monsters&&GD.monsters[target.mtype]&&GD.monsters[target.mtype].name)||target.mtype);S.mode='Tanken';
    if (skillCanUse('taunt') && useSkillSafe('taunt', target, null, true)) return true;
    try {
      if (typeof can_attack==='function'&&can_attack(target)) return action('Tank-Angriff',function(){return attack(target);},'tank-attack',Math.max(80,420/Math.max(.2,character.frequency||1)));
    } catch(e){}
    if (dist(character,target)>Math.max(40,Number(character.range)||50)) return moveToGoal(target,'Tank zu bedrohtem Gruppenmitglied');
    return false;
  }
  function kiteThreatTick() {
    if (!C.kite || roleForName(me) !== 'dps' || typeof move !== 'function') return false;
    var threats = partyThreats().filter(function (m) { return m.target === me && m.map === character.map; });
    if (!threats.length) return false;
    var nearest = threats.slice().sort(function(a,z){return dist(character,a)-dist(character,z);})[0];
    var md = GD.monsters && GD.monsters[nearest.mtype] || {};
    var enemyRange = Number(nearest.range || md.range) || 20;
    var ownRange = Math.max(20, Number(character.range) || 20);
    var desired = Math.max(enemyRange + C.kiteExtraDistance, ownRange * C.kiteSafetyPct / 100);
    var current = dist(character,nearest);
    if (current >= desired) return false;
    var cx=Number(character.x)||0,cy=Number(character.y)||0,vx=0,vy=0;
    threats.forEach(function(m){var dx=cx-(Number(m.x)||0),dy=cy-(Number(m.y)||0),d=Math.max(1,Math.hypot(dx,dy));var w=1/Math.max(20,d);vx+=dx/d*w;vy+=dy/d*w;});
    var len=Math.hypot(vx,vy);if(len<.001){vx=cx-(Number(nearest.x)||0);vy=cy-(Number(nearest.y)||0);len=Math.max(1,Math.hypot(vx,vy));}
    vx/=len;vy/=len;var step=clamp(desired-current+25,35,95),base=Math.atan2(vy,vx),angles=[0,.35,-.35,.70,-.70],dest=null;
    for(var i=0;i<angles.length;i++){
      var a=base+angles[i],x=cx+Math.cos(a)*step,y=cy+Math.sin(a)*step,ok=true;
      try{if(typeof can_move_to==='function')ok=!!can_move_to(x,y);}catch(e){ok=true;}
      if(ok){dest={x:x,y:y};break;}
    }
    if(!dest)return false;
    try{
      S.moveGoal=null;S.lastMoveAt=clock();move(dest.x,dest.y);
      if(clock()>(S.times.kiteLog||0)){S.times.kiteLog=clock()+1000;audit('kite','Damage dealer hält Sicherheitsabstand',{threats:threats.map(targetID),distance:Math.round(current),desired:Math.round(desired),x:Math.round(dest.x),y:Math.round(dest.y)});}
      S.status='Kiten · '+threats.length+' Gegner';S.mode='Kampf / Kiten';return true;
    }catch(e){return false;}
  }
  function offensiveSkillTick(target) {
    if (!target) return false;
    var weak = target.hp <= Math.max(1, character.attack * C.weakMobSkillFactor);
    var rows = classSkills();
    for (var i = 0; i < rows.length; i++) {
      var id = rows[i], d = GD.skills[id] || {}, hostile = !!d.hostile || d.target === 'monster' || d.target === 'enemy';
      if (!hostile || !skillCanUse(id)) continue;
      if (id === 'taunt' || id === 'agitate') continue; // threat tools are controlled only by the tank routine
      if (C.weakMobSkillSaving && weak && ['mentalburst','piercingshot'].indexOf(id) < 0) continue;
      if (id === 'taunt' && target.target === me) continue;
      if (d.list || ['3shot','5shot'].indexOf(id) >= 0) {
        var limit = id === '3shot' ? 3 : 5;
        var list = mobs().filter(function (m) { return safeEnemy(m) && C.roster.indexOf(m.target) >= 0; }).slice(0, Math.min(limit, C.maxTargets));
        if (list.length >= 2 && useSkillSafe(id, list.map(targetID), null, false)) return true;
        continue;
      }
      if (useSkillSafe(id, target, null, false)) return true;
    }
    return false;
  }
  function sustainTick() {
    var hp = ratio(character, 'hp'), mp = ratio(character, 'mp');
    if (hp < C.hp / 100 && qty(C.hpot) > 0 && (typeof is_on_cooldown !== 'function' || !is_on_cooldown('use_hp'))) {
      var hi = slot(C.hpot); if (hi >= 0 && typeof consume === 'function') return action('HP-Trank', function () { return consume(hi); }, 'potion', 700);
    }
    if (mp < C.mp / 100 && qty(C.mpot) > 0 && (typeof is_on_cooldown !== 'function' || !is_on_cooldown('use_mp'))) {
      var mi = slot(C.mpot); if (mi >= 0 && typeof consume === 'function') return action('MP-Trank', function () { return consume(mi); }, 'potion', 700);
    }
    return false;
  }
  function buildSpawnAtlas() {
    var out = [], seen = {};
    function add(map, sp, si, bi, x, y) {
      if (!sp || !sp.type || !isFinite(x) || !isFinite(y)) return;
      var count = Math.max(1, Number(sp.count) || 1), key = map+'|'+sp.type+'|'+Math.round(x)+'|'+Math.round(y);
      if (seen[key]) { seen[key].count = Math.max(seen[key].count, count); return; }
      var row = { id: map + ':' + si + ':' + bi, map: map, monster: sp.type, x: Number(x), y: Number(y), count: count, radius: Number(sp.radius)||0 };
      seen[key]=row; out.push(row);
    }
    Object.keys(GD.maps || {}).forEach(function (map) {
      var md = GD.maps[map] || {}; if (md.instance || md.ignore) return;
      (md.monsters || []).forEach(function (sp, si) {
        var added=false, bounds=sp.boundaries||[];
        if (Array.isArray(bounds) && bounds.length && typeof bounds[0] === 'number') bounds=[bounds];
        (bounds || []).forEach(function (b, bi) {
          if (!Array.isArray(b)) return; var z = b.length === 5 ? b.slice(1) : b, m = b.length === 5 ? String(b[0]||map) : map; if (z.length !== 4) return;
          add(m,sp,si,bi,(Number(z[0])+Number(z[2]))/2,(Number(z[1])+Number(z[3]))/2); added=true;
        });
        if (!added && Array.isArray(sp.position) && sp.position.length >= 2) add(map,sp,si,'p',Number(sp.position[0]),Number(sp.position[1]));
        if (!added && Array.isArray(sp.positions)) sp.positions.forEach(function(q, qi){ if(Array.isArray(q)&&q.length>=2) add(map,sp,si,'p'+qi,Number(q[0]),Number(q[1])); });
      });
    });
    return out;
  }
  var SPAWNS = buildSpawnAtlas();
  function autoGoal() {
    var fs = farmerReports(), partyAttack = fs.reduce(function (n, r) { return n + (Number(r.attack) || 0) * (Number(r.frequency) || 1); }, 0) || character.attack * character.frequency;
    function scoreRows(requireStable) {
      return SPAWNS.map(function (s) {
        var m = GD.monsters && GD.monsters[s.monster] || {}, count=Math.max(1,Number(s.count)||1); if (!m.hp || !m.xp || (requireStable && count < C.autoFarmMinSpawnCount)) return null;
        if (m.boss || m.cooperative || m.event || m.special) return null;
        var ttk = m.hp / Math.max(1, partyAttack), danger = (Number(m.attack) || 0) * (Number(m.frequency) || .5);
        if (C.safety && danger > character.max_hp * C.risk / 100) return null;
        var travelTax = s.map === character.map ? (1 + dist(character, s) / 3000) : 1.35;
        var population = Math.min(1, count / 6), rarePenalty = count >= 3 ? 1 : count === 2 ? .18 : .04;
        return { spawn: s, score: (Number(m.xp) || 1) / Math.max(.15, ttk) / travelTax * (.55 + .45 * population) * rarePenalty };
      }).filter(Boolean).sort(function (a, b) { return b.score - a.score; });
    }
    var rows=scoreRows(true); return rows[0] && rows[0].spawn || null;
  }
  function chooseGoal() {
    if (C.farmMode === 'manual') {
      var opts = SPAWNS.filter(function (s) { return s.monster === C.monster; });
      S.goal = opts.sort(function (a, b) { return (a.map === character.map ? 0 : 1) - (b.map === character.map ? 0 : 1) || dist(character, a) - dist(character, b); })[0] || null;
    } else S.goal = autoGoal();
    audit('goal', S.goal ? 'Farmziel: ' + S.goal.monster + ' · ' + S.goal.map : 'Kein Farmziel gefunden', S.goal);
    return S.goal;
  }
  function moveToGoal(g, why) {
    if (!g || typeof smart_move !== 'function') return false;
    if (S.moveGoal && sameJSON(S.moveGoal, { map:g.map,x:Math.round(g.x),y:Math.round(g.y) }) && clock() - (S.moveStarted || 0) < 8000) return true;
    S.moveGoal = { map:g.map,x:Math.round(g.x),y:Math.round(g.y) }; S.moveStarted = clock(); S.lastMoveAt = clock();
    audit('move', why || 'smart_move', S.moveGoal);
    try { Promise.resolve(smart_move(g)).then(function () { S.moveGoal = null; audit('move_done', 'Ziel erreicht', g); }, function (e) { S.moveGoal = null; audit('move_error', reason(e), g, 'warning'); }); return true; } catch (e) { S.moveGoal = null; return false; }
  }
  function leaderReport() { var lead = canonicalLeader(); return peers(true).find(function (r) { return r.name === lead; }) || null; }
  function targetForCombat() {
    var ms=mobs().filter(safeEnemy),role=roleForName(me),tank=activeTankName(),tr=activeTankReport(),lr=leaderReport();
    function byId(id){return id?ms.find(function(m){return targetID(m)===id;}):null;}
    if(role==='tank'&&me===tank){
      var loose=ms.filter(function(m){return C.roster.indexOf(m.target)>=0&&m.target!==me;});
      if(loose.length)return loose.sort(function(a,z){
        var ar=roleForName(a.target),zr=roleForName(z.target),ap=ar==='healer'?0:ar==='dps'?1:2,zp=zr==='healer'?0:zr==='dps'?1:2;
        return ap-zp||a.hp-z.hp;
      })[0];
      var mine=ms.filter(function(m){return m.target===me;});if(mine.length)return mine.sort(function(a,z){return a.hp-z.hp;})[0];
    }
    if(role!=='tank'&&tr&&tr.target){var tt=byId(tr.target);if(tt)return tt;}
    if(role==='dps'){
      var own=ms.filter(function(m){return m.target===me;});if(own.length)return own.sort(function(a,z){return dist(character,a)-dist(character,z)||a.hp-z.hp;})[0];
    }
    if(canonicalLeader()!==me&&lr&&lr.target){var same=byId(lr.target);if(same)return same;}
    var threats=ms.filter(function(m){return C.roster.indexOf(m.target)>=0;});if(threats.length)return threats.sort(function(a,z){return a.hp-z.hp;})[0];
    if(S.goal){
      var intended=ms.filter(function(m){return m.mtype===S.goal.monster&&dist(character,m)<=C.searchRadius;});
      if(intended.length){S.goalEmptySince=0;return intended.sort(function(a,z){return dist(character,a)-dist(character,z);})[0];}
      if(!S.goalEmptySince)S.goalEmptySince=clock();
      if(clock()-S.goalEmptySince>=C.goalEmptyReplanSeconds*1000){v275MarkGoalEmpty(S.goal);var fb=v275VisibleFallbackTarget(ms);if(fb)return fb;}
    }
    return v275VisibleFallbackTarget(ms);
  }
  function farmerTick() {
    if (applyDeliveredElixirTick()) return;
    var role=roleForName(me);
    if (ratio(character,'hp')<C.retreatHP/100){S.status='Erholung / Sicherheit';S.mode='Erholung';S.target=null;if(S.goal)moveToGoal(S.goal,'Sicherheitsrückzug');return;}
    var lead=canonicalLeader(),lr=leaderReport();
    if(!S.goal||clock()-(S.lastGoalCheck||0)>20000){S.lastGoalCheck=clock();if(lead===me||!lr||!lr.goal)chooseGoal();else S.goal=lr.goal;}
    if(lead!==me&&lr&&(character.map!==lr.map||dist(character,lr)>C.followDistance*2.2)){S.status='Zur Gruppe aufschließen';S.mode='Folgen';moveToGoal(lr,'Gruppenführer folgen');return;}

    if(role==='healer'&&!healerCanDamage()){
      S.target=null;S.status='Heilbereitschaft';S.mode='Heilen';
      var tankR=activeTankReport();
      if(tankR&&tankR.map===character.map&&dist(character,tankR)>C.followDistance*1.35)moveToGoal(tankR,'Heiler folgt dem Tank');
      return;
    }

    if(role==='tank'&&tankAggroTick())return;
    var pullTank=activeTankReport();
    if((role==='dps'||role==='healer')&&pullTank&&pullTank.name!==me&&pullTank.map===character.map&&dist(character,pullTank)<=C.followDistance*2.2&&!pullTank.target&&!partyThreats().length){
      S.target=null;S.status='Warte auf Tank-Pull';S.mode=role==='healer'?'Heilen':'Damage';return;
    }
    var t=targetForCombat();
    if(!t){
      S.target=null;S.status=S.goal?'Zum Farmgebiet / Zielsuche':'Warte auf Farmziel';S.mode='Farmen';
      if(S.goal&&(character.map!==S.goal.map||dist(character,S.goal)>180))moveToGoal(S.goal,'Farmgebiet');
      return;
    }

    S.target=targetID(t);
    var mobName=(GD.monsters&&GD.monsters[t.mtype]&&GD.monsters[t.mtype].name)||t.mtype;
    S.status=(role==='tank'?'Tanken: ':role==='healer'?'Sicherer Schaden: ':'Schaden: ')+mobName;
    S.mode=role==='tank'?'Tanken':role==='healer'?'Heilen / Schaden':'Damage';

    var kiting=role==='dps'&&kiteThreatTick();
    var inRange=true;
    try{if(typeof is_in_range==='function')inRange=!!is_in_range(t);}catch(e){}
    if(!inRange){
      if(kiting)return;
      moveToGoal(t,role==='tank'?'Tank in Angriffsreichweite':'In Angriffsreichweite');return;
    }
    if(offensiveSkillTick(t))return;
    try{
      if(typeof can_attack==='function'&&can_attack(t)&&character.mp>=(character.mp_cost||0)){
        action(role==='tank'?'Tank-Basisangriff':'Basisangriff',function(){return attack(t);},role==='tank'?'tank-basic':'attack',Math.max(80,420/Math.max(.2,character.frequency||1)));
      }
    }catch(e){}
  }


  // ---------------------------------------------------------------------------
  // Merchant logistics + explicit stand automation
  // ---------------------------------------------------------------------------
  function itemValueSafe(item) {
    if (!item) return 0;
    try { if (typeof item_value === 'function') return Number(item_value(item)) || 0; } catch (e) {}
    return Number((GD.items && GD.items[item.name] || {}).g) || 0;
  }
  function protectedStandItem(item) {
    if (!item || item.l || item.gift || item.p) return true;
    if (isElixir(item)) return true;
    if (item.name === C.hpot || item.name === C.mpot) return true;
    var d = GD.items && GD.items[item.name] || {};
    if (['uscroll','cscroll','pot'].indexOf(d.type) >= 0) return true;
    return csv(C.standBlockedItems).indexOf(item.name) >= 0;
  }
  function inventoryQuantity(name, level) {
    return (character.items || []).reduce(function (n, i) { return n + (i && i.name === name && (Number(i.level) || 0) === (Number(level) || 0) ? (Number(i.q) || 1) : 0); }, 0);
  }
  function legacyMarketRow(name, level) {
    var db = readLegacy('marketdb', null) || read('marketdb', null), key = name + '|' + String(Number(level) || 0);
    return db && db.items && db.items[key] || null;
  }
  function average(side) { return side && side.count ? Number(side.sum) / Math.max(1, Number(side.count)) : 0; }
  function standPrice(item) {
    var row = legacyMarketRow(item.name, item.level), sellMin = row && row.sell && Number(row.sell.min), buyAvg = row && average(row.buy), base = Math.max(1, itemValueSafe(item));
    var floor = Math.ceil(base * (1 + C.standMinMarginPct / 100)), price = floor;
    if (buyAvg > 0) price = Math.max(price, Math.ceil(buyAvg * (1 + C.standMinMarginPct / 100)));
    if (sellMin > 0) price = Math.max(floor, Math.floor(sellMin * (1 - C.standUndercutPct / 100)));
    return Math.max(1, price);
  }
  function standItemAllowed(item) {
    if (protectedStandItem(item)) return false;
    var allow = csv(C.standAllowedItems);
    if (C.standItemMode === 'allowlist') return allow.indexOf(item.name) >= 0;
    if (C.standItemMode === 'safe_spares') return inventoryQuantity(item.name, item.level) > C.standKeepQuantity;
    return true;
  }
  function ownTradeListings() {
    return Object.keys(character.slots || {}).filter(function (k) { return /^trade(?:[1-9]|1[0-6])$/.test(k) && character.slots[k]; }).map(function (k) { return { slot: k, item: character.slots[k] }; });
  }
  function standIsOpen() { return !!(character.stand || character.standed || S.standOpenSince); }
  function standWindowSales() {
    var cutoff = clock() - C.standWindowMinutes * 60000;
    S.standSales = (S.standSales || []).filter(function (x) { return x && x.at >= cutoff; }); write('standSales:' + me, S.standSales);
    return S.standSales.reduce(function (n, x) { return n + (Number(x.qty) || 0); }, 0);
  }
  function standRuntimeToday() {
    var day = new Date().toISOString().slice(0, 10);
    if (!S.standRuntime || S.standRuntime.day !== day) S.standRuntime = { day: day, ms: 0 };
    return S.standRuntime;
  }
  function sampleStandSales() {
    var now = clock(), current = {};
    ownTradeListings().forEach(function (x) { current[x.slot] = { name: x.item.name, level: Number(x.item.level) || 0, q: Number(x.item.q) || 1, price: Number(x.item.price != null ? x.item.price : x.item.p) || 0 }; });
    var prev = S.standLastSample || {};
    Object.keys(prev).forEach(function (slotName) {
      var a = prev[slotName], b = current[slotName], sold = !b ? a.q : (a.name === b.name && a.level === b.level ? Math.max(0, a.q - b.q) : a.q);
      if (sold > 0) { S.standSales.push({ at: now, qty: sold, name: a.name, level: a.level, price: a.price }); audit('stand_sale', sold + ' × ' + a.name + ' über Merchant-Stand verkauft', { price: a.price, slot: slotName }); }
    });
    S.standLastSample = current; standWindowSales();
  }
  function closeStand(reasonText) {
    if (!standIsOpen() || typeof close_stand !== 'function') { S.standOpenSince = 0; return false; }
    return action('Merchant-Stand schließen', function () { return Promise.resolve(close_stand()).then(function (v) { audit('stand_close', reasonText || 'Stand geschlossen'); S.standOpenSince = 0; S.standCooldownUntil = clock() + C.standCooldownMinutes * 60000; return v; }); }, 'stand-close', 1200);
  }
  function openStand() {
    if (standIsOpen()) { if (!S.standOpenSince) S.standOpenSince = clock(); return false; }
    if (typeof open_stand !== 'function') return false;
    return action('Merchant-Stand öffnen', function () { return Promise.resolve(open_stand()).then(function (v) { S.standOpenSince = clock(); audit('stand_open', 'Merchant-Stand geöffnet'); return v; }); }, 'stand-open', 1200);
  }
  function standCandidate() {
    var used = {}; ownTradeListings().forEach(function (x) { used[x.item.name + '|' + (Number(x.item.level) || 0)] = true; });
    var candidates = [];
    (character.items || []).forEach(function (i, index) {
      if (!standItemAllowed(i) || used[i.name + '|' + (Number(i.level) || 0)]) return;
      var total = inventoryQuantity(i.name, i.level), spare = Math.max(0, total - C.standKeepQuantity), q = Math.min(Number(i.q) || 1, C.standMaxUnitsPerListing, spare || (C.standItemMode === 'all_unprotected' ? (Number(i.q) || 1) : 0));
      if (q < 1) return;
      candidates.push({ index:index, item:i, q:q, price:standPrice(i), value:itemValueSafe(i) });
    });
    return candidates.sort(function (a, b) { return (b.price - b.value) - (a.price - a.value); })[0] || null;
  }
  function shouldYieldStand() {
    if (C.standPriority === 'high') return false;
    if (!partyState().complete && C.standCloseWhenPartyIncomplete) return true;
    var fs = farmerReports(), need = fs.some(function (r) { return r.hpot < C.minHP || r.mpot < C.minMP || r.free < 3; });
    if (C.standPriority === 'normal') return need;
    return need || !!elixirDeliveryCandidate();
  }
  function merchantStandTick() {
    if (character.ctype !== 'merchant' || !C.merchantStandAutomation) { if (standIsOpen()) closeStand('Automatisierung deaktiviert'); return false; }
    sampleStandSales();
    var rt = standRuntimeToday(), now = clock();
    if (standIsOpen() && S.standRuntimeLastAt) rt.ms += Math.max(0, Math.min(5000, now - S.standRuntimeLastAt));
    S.standRuntimeLastAt = now; write('standRuntime:' + me, rt);
    if (rt.ms >= C.standDailyRuntimeMinutes * 60000) { closeStand('Tägliches Stand-Zeitlimit erreicht'); S.status = 'Stand-Zeitlimit für heute erreicht'; return true; }
    if (standWindowSales() >= C.standMaxUnitsPerWindow) { closeStand('Verkaufslimit im Zeitfenster erreicht'); S.status = 'Stand-Verkaufslimit im Zeitfenster'; return true; }
    if (standIsOpen() && S.standOpenSince && now - S.standOpenSince >= C.standMaxOpenMinutes * 60000) { closeStand('Maximale Öffnungsdauer erreicht'); return true; }
    if (shouldYieldStand()) { closeStand('Höher priorisierte Gruppenaufgabe'); return false; }
    if (now < S.standCooldownUntil) return false;
    var listings = ownTradeListings();
    if (listings.length >= C.standMaxListings) { openStand(); S.status = 'Merchant-Stand · ' + listings.length + ' Angebote'; S.mode = 'Stand'; return true; }
    var c = standCandidate();
    if (!c) { if (listings.length) { openStand(); S.status = 'Merchant-Stand · ' + listings.length + ' Angebote'; S.mode = 'Stand'; return true; } return false; }
    if (!standIsOpen()) { openStand(); return true; }
    var no = 1; while (no <= 16 && character.slots['trade' + no]) no++;
    if (no <= 16 && typeof trade === 'function') {
      S.status = 'Stand-Angebot: ' + ((GD.items[c.item.name] || {}).name || c.item.name); S.mode = 'Stand';
      return action('Stand-Angebot einstellen', function () { return Promise.resolve(trade(c.index, no, c.price, c.q)).then(function (v) { audit('stand_list', c.q + ' × ' + c.item.name + ' @ ' + c.price, { slot:no, marginPct:Math.round((c.price/Math.max(1,c.value)-1)*1000)/10 }); return v; }); }, 'stand-list', C.standRefreshSeconds * 1000);
    }
    return false;
  }
  function merchantSupplyTick() {
    if (character.ctype !== 'merchant' || !C.merchantSupply) return false;
    var fs = farmerReports().sort(function (a,b) { return Math.min(a.hpot / Math.max(1,C.minHP), a.mpot / Math.max(1,C.minMP)) - Math.min(b.hpot / Math.max(1,C.minHP), b.mpot / Math.max(1,C.minMP)); });
    for (var i = 0; i < fs.length; i++) {
      var r = fs[i], lp = localPlayer(r.name); if (!lp || dist(character, lp) > 260) continue;
      var needH = Math.max(0, C.stockHP - (Number(r.hpot)||0)), needM = Math.max(0, C.stockMP - (Number(r.mpot)||0));
      if (needH > 0 && qty(C.hpot) > 80 && r.free > 0) { var hi = slot(C.hpot), hq = Math.min(needH, qty(C.hpot)-80); if (hi >= 0 && hq > 0) return action('HP-Tränke liefern ' + r.name, function () { return send_item(r.name, hi, hq); }, 'supply-hp:' + r.name, 1400); }
      if (needM > 0 && qty(C.mpot) > 80 && r.free > 0) { var mi = slot(C.mpot), mq = Math.min(needM, qty(C.mpot)-80); if (mi >= 0 && mq > 0) return action('MP-Tränke liefern ' + r.name, function () { return send_item(r.name, mi, mq); }, 'supply-mp:' + r.name, 1400); }
    }
    return false;
  }
  function farmerElixirTransferTick() {
    if (character.ctype === 'merchant' || !C.autoElixirs || !C.upgradeElixirs) return false;
    var mn=merchantName(),m=mn&&localPlayer(mn),mr=mn&&peerReport(mn);if(!m||!mr||dist(character,m)>260||mr.free<2)return false;
    var idx=(character.items||[]).findIndex(function(i){return isElixir(i);});
    if(idx<0)return false;var it=character.items[idx],q=Math.max(1,Number(it.q)||1);
    return action('Elixier zum Merchant '+it.name,function(){return send_item(mn,idx,q);},'elixir-to-merchant',1500);
  }
  function farmerLootTransferTick() {
    if (character.ctype === 'merchant' || !C.merchantCollectLoot) return false;
    var mn = merchantName(), m = mn && localPlayer(mn), mr = mn && peerReport(mn); if (!m || !mr || dist(character, m) > 260) return false;
    if (character.gold > 100000 && typeof send_gold === 'function') return action('Gold an Merchant', function () { return send_gold(mn, character.gold - 50000); }, 'loot-gold', 2500);
    if (mr.free < 2) return false;
    var idx = (character.items || []).findIndex(function (i) { if(!i||protectedStandItem(i)||isElixir(i))return false;var d=GD.items&&GD.items[i.name]||{};return ['weapon','offhand','helmet','chest','pants','gloves','shoes','cape','ring','earring','amulet','belt','orb','shield','source','quiver'].indexOf(d.type)<0; });
    if (idx >= 0 && typeof send_item === 'function') return action('Loot an Merchant', function () { return send_item(mn, idx, character.items[idx].q || 1); }, 'loot-item', 1400);
    return false;
  }
  function merchantTick() {
    if (elixirCraftUpgradeTick()) return;
    if (deliverElixirTick()) return;
    if (merchantSupplyTick()) return;
    if (merchantStandTick()) return;
    S.status = 'Merchant bereit'; S.mode = 'Logistik';
  }

  // ---------------------------------------------------------------------------
  // Deep state audit: everything the bot can observe/decide without packet sniffing
  // ---------------------------------------------------------------------------
  function inventorySnapshot() {
    return (character.items || []).map(function (i) { return i ? [i.name,Number(i.level)||0,Number(i.q)||1,i.l||'',i.p||''] : null; });
  }
  function slotSnapshot() {
    var o = {}; Object.keys(character.slots || {}).forEach(function (k) { var i = character.slots[k]; if (i) o[k] = [i.name,Number(i.level)||0,Number(i.q)||1]; }); return o;
  }
  function conditionSnapshot() {
    var o = {}; Object.keys(character.s || {}).sort().forEach(function (k) { var s=character.s[k]||{}; o[k]={ms:isFinite(Number(s.ms))?Math.max(0,Math.ceil(Number(s.ms)/5000)*5000):s.ms, f:s.f, stacks:s.stacks}; }); return o;
  }
  function stateSnapshot() {
    var t = null; try { t = typeof get_targeted_monster === 'function' && get_targeted_monster(); } catch(e){}
    return {
      level:character.level, xp:character.xp, gold:character.gold, hp:character.hp, mp:character.mp, map:character.map,
      x:Math.round(character.x||0), y:Math.round(character.y||0), moving:!!character.moving, rip:!!character.rip,
      target:S.target || (t && targetID(t)) || null, party:partyState(), status:S.status, mode:S.mode,
      inventory:inventorySnapshot(), slots:slotSnapshot(), conditions:conditionSnapshot(), q:compactData(character.q||{}),
      ping:character.ping, speed:character.speed, attack:character.attack, frequency:character.frequency
    };
  }
  function diffObject(prev, next) {
    var changed = {}; Object.keys(next).forEach(function (k) { if (!sameJSON(prev && prev[k], next[k])) changed[k] = { from:prev && prev[k], to:next[k] }; }); return changed;
  }
  function stateAuditTick() {
    if (!C.auditEnabled) return;
    var now = clock(), snap = stateSnapshot();
    if (!S.lastStateSnapshot) { S.lastStateSnapshot = snap; audit('state_initial', 'Initialer Spielzustand', snap); return; }
    var diff = diffObject(S.lastStateSnapshot, snap), keys = Object.keys(diff);
    if (keys.length) audit('state_change', 'Spielzustand geändert: ' + keys.join(', '), diff);
    if (now - S.lastPositionLog >= C.logPositionSeconds * 1000) { S.lastPositionLog = now; audit('position_sample', 'Positions-/Leistungssample', { x:snap.x,y:snap.y,map:snap.map,hp:snap.hp,mp:snap.mp,xp:snap.xp,gold:snap.gold,target:snap.target,status:snap.status,mode:snap.mode,ping:snap.ping }); }
    if (snap.xp > S.lastXP) S.lastXPAt = now;
    if (snap.x !== S.lastStateSnapshot.x || snap.y !== S.lastStateSnapshot.y || snap.map !== S.lastStateSnapshot.map) S.lastMoveAt = now;
    S.lastXP = snap.xp; S.lastGold = snap.gold; S.lastLevel = snap.level; S.lastStateSnapshot = snap;
  }

  // ---------------------------------------------------------------------------
  // Modern multi-window GUI + themes + internationalisation
  // ---------------------------------------------------------------------------
  var UI_HOST='aio27-ui-host',uiHost=null,uiRoot=null;
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var I18N_KEYS=['character','party','farm','bestiary','skills','merchant','stand','meters','dashboard','logs','settings','headless','start','pause','active','paused','search','all','monsters','items','language','theme','back','next','close','online','offline','detect','leader','repair','assemble','verify','no_data','update','current_version','found_version','settings_updates','headless_title','bestiary_items','skill_manager'];
  var I18N={
    en:['Character info','Group settings','Farm targets','Bestiary / Items','Skill manager','Merchant & Elixirs','Merchant stand automation','Damage / Heal','Web dashboard','Event log','Settings & Updates','Headless step by step','Start','Pause','Active','Paused','Search','All','Monsters','Items','Language','GUI theme','Back','Next','Close','online','offline','Detect bot characters','Choose common leader','Repair split parties','Assemble 4/4 party','Verify and continue','No data','Update','Current version','Found version','Settings & Updates','Headless setup','Bestiary / Items','Skill manager'],
    zh:['角色信息','队伍设置','刷怪目标','怪物图鉴 / 物品','技能管理','商人与药剂','商店自动化','伤害 / 治疗','网页仪表板','事件日志','设置与更新','无界面逐步设置','开始','暂停','运行中','已暂停','搜索','全部','怪物','物品','语言','界面主题','返回','下一步','关闭','在线','离线','检测机器人角色','选择共同队长','修复分裂队伍','组成 4/4 队伍','验证并继续','无数据','更新','当前版本','发现版本','设置与更新','无界面设置','怪物图鉴 / 物品','技能管理'],
    hi:['चरित्र जानकारी','समूह सेटिंग','फार्म लक्ष्य','बेस्टियरी / आइटम','स्किल मैनेजर','मर्चेंट और एलिक्सिर','मर्चेंट स्टैंड ऑटोमेशन','डैमेज / हील','वेब डैशबोर्ड','इवेंट लॉग','सेटिंग और अपडेट','हेडलेस चरण-दर-चरण','शुरू','रोकें','सक्रिय','रुका हुआ','खोज','सभी','मॉन्स्टर','आइटम','भाषा','GUI थीम','वापस','आगे','बंद करें','ऑनलाइन','ऑफलाइन','बॉट चरित्र पहचानें','साझा लीडर चुनें','टूटी पार्टियां ठीक करें','4/4 पार्टी बनाएं','जांचें और आगे बढ़ें','कोई डेटा नहीं','अपडेट','वर्तमान संस्करण','मिला संस्करण','सेटिंग और अपडेट','हेडलेस सेटअप','बेस्टियरी / आइटम','स्किल मैनेजर'],
    es:['Información del personaje','Ajustes de grupo','Objetivos de farmeo','Bestiario / Objetos','Gestor de habilidades','Mercader y elixires','Automatización del puesto','Daño / Curación','Panel web','Registro de eventos','Ajustes y actualizaciones','Headless paso a paso','Iniciar','Pausar','Activo','Pausado','Buscar','Todo','Monstruos','Objetos','Idioma','Tema de interfaz','Atrás','Siguiente','Cerrar','en línea','sin conexión','Detectar personajes del bot','Elegir líder común','Reparar grupos divididos','Formar grupo 4/4','Verificar y continuar','Sin datos','Actualizar','Versión actual','Versión encontrada','Ajustes y actualizaciones','Configuración headless','Bestiario / Objetos','Gestor de habilidades'],
    ar:['معلومات الشخصية','إعدادات المجموعة','أهداف الزراعة','الدليل / العناصر','مدير المهارات','التاجر والإكسير','أتمتة متجر التاجر','الضرر / العلاج','لوحة الويب','سجل الأحداث','الإعدادات والتحديثات','إعداد بدون واجهة خطوة بخطوة','بدء','إيقاف مؤقت','نشط','متوقف','بحث','الكل','الوحوش','العناصر','اللغة','سمة الواجهة','رجوع','التالي','إغلاق','متصل','غير متصل','اكتشاف شخصيات البوت','اختيار قائد مشترك','إصلاح المجموعات المنقسمة','تجميع فريق 4/4','تحقق وتابع','لا توجد بيانات','تحديث','الإصدار الحالي','الإصدار الموجود','الإعدادات والتحديثات','إعداد بدون واجهة','الدليل / العناصر','مدير المهارات'],
    fr:['Infos personnage','Réglages du groupe','Cibles de farm','Bestiaire / Objets','Gestionnaire de compétences','Marchand et élixirs','Automatisation du stand','Dégâts / Soins','Tableau de bord web','Journal des événements','Paramètres et mises à jour','Headless pas à pas','Démarrer','Pause','Actif','En pause','Rechercher','Tout','Monstres','Objets','Langue','Thème GUI','Retour','Suivant','Fermer','en ligne','hors ligne','Détecter les personnages du bot','Choisir un chef commun','Réparer les groupes divisés','Former le groupe 4/4','Vérifier et continuer','Aucune donnée','Mise à jour','Version actuelle','Version trouvée','Paramètres et mises à jour','Configuration headless','Bestiaire / Objets','Gestionnaire de compétences'],
    bn:['চরিত্র তথ্য','গ্রুপ সেটিংস','ফার্ম লক্ষ্য','বেস্টিয়ারি / আইটেম','স্কিল ম্যানেজার','মার্চেন্ট ও এলিক্সির','মার্চেন্ট স্ট্যান্ড অটোমেশন','ড্যামেজ / হিল','ওয়েব ড্যাশবোর্ড','ইভেন্ট লগ','সেটিংস ও আপডেট','হেডলেস ধাপে ধাপে','শুরু','বিরতি','সক্রিয়','বিরত','খুঁজুন','সব','মনস্টার','আইটেম','ভাষা','GUI থিম','পেছনে','পরবর্তী','বন্ধ','অনলাইন','অফলাইন','বট চরিত্র শনাক্ত করুন','একই লিডার নির্বাচন','ভাঙা পার্টি ঠিক করুন','4/4 পার্টি তৈরি','যাচাই করে চালিয়ে যান','ডেটা নেই','আপডেট','বর্তমান সংস্করণ','পাওয়া সংস্করণ','সেটিংস ও আপডেট','হেডলেস সেটআপ','বেস্টিয়ারি / আইটেম','স্কিল ম্যানেজার'],
    pt:['Informações do personagem','Configurações do grupo','Alvos de farm','Bestiário / Itens','Gerenciador de habilidades','Mercador e elixires','Automação da loja','Dano / Cura','Painel web','Registro de eventos','Configurações e atualizações','Headless passo a passo','Iniciar','Pausar','Ativo','Pausado','Pesquisar','Tudo','Monstros','Itens','Idioma','Tema da interface','Voltar','Próximo','Fechar','online','offline','Detectar personagens do bot','Escolher líder comum','Corrigir grupos divididos','Montar grupo 4/4','Verificar e continuar','Sem dados','Atualizar','Versão atual','Versão encontrada','Configurações e atualizações','Configuração headless','Bestiário / Itens','Gerenciador de habilidades'],
    ru:['Информация о персонаже','Настройки группы','Цели фарма','Бестиарий / Предметы','Менеджер навыков','Торговец и эликсиры','Автоматизация лавки','Урон / Лечение','Веб-панель','Журнал событий','Настройки и обновления','Headless пошагово','Старт','Пауза','Активен','Пауза','Поиск','Все','Монстры','Предметы','Язык','Тема GUI','Назад','Далее','Закрыть','онлайн','офлайн','Найти персонажей бота','Выбрать общего лидера','Исправить разделённые группы','Собрать группу 4/4','Проверить и продолжить','Нет данных','Обновление','Текущая версия','Найденная версия','Настройки и обновления','Headless настройка','Бестиарий / Предметы','Менеджер навыков'],
    id:['Info karakter','Pengaturan grup','Target farming','Bestiary / Item','Pengelola skill','Merchant & Elixir','Otomasi stand merchant','Damage / Heal','Dashboard web','Log peristiwa','Pengaturan & Pembaruan','Headless langkah demi langkah','Mulai','Jeda','Aktif','Dijeda','Cari','Semua','Monster','Item','Bahasa','Tema GUI','Kembali','Berikutnya','Tutup','online','offline','Deteksi karakter bot','Pilih pemimpin bersama','Perbaiki party terpisah','Susun party 4/4','Verifikasi dan lanjut','Tidak ada data','Pembaruan','Versi saat ini','Versi ditemukan','Pengaturan & Pembaruan','Pengaturan headless','Bestiary / Item','Pengelola skill'],
    ur:['کردار کی معلومات','گروپ سیٹنگز','فارم اہداف','بیسٹیری / آئٹمز','اسکل مینیجر','مرچنٹ اور ایلکسر','مرچنٹ اسٹینڈ آٹومیشن','ڈیمیج / ہیل','ویب ڈیش بورڈ','ایونٹ لاگ','سیٹنگز اور اپڈیٹس','ہیڈ لیس مرحلہ وار','شروع','وقفہ','فعال','روکا ہوا','تلاش','سب','مونسٹر','آئٹمز','زبان','GUI تھیم','واپس','اگلا','بند','آن لائن','آف لائن','بوٹ کردار شناخت کریں','مشترکہ لیڈر منتخب کریں','تقسیم پارٹی درست کریں','4/4 پارٹی بنائیں','تصدیق اور جاری','کوئی ڈیٹا نہیں','اپڈیٹ','موجودہ ورژن','ملا ہوا ورژن','سیٹنگز اور اپڈیٹس','ہیڈ لیس سیٹ اپ','بیسٹیری / آئٹمز','اسکل مینیجر'],
    de:['Charakterinfo','Gruppeneinstellungen','Farmziele','Bestiarium / Items','Skillmanager','Merchant & Elixiere','Merchant-Stand-Automatisierung','Schaden / Heilung','Web-Dashboard','Ereignisprotokoll','Einstellungen & Updates','Headless Schritt für Schritt','Start','Pause','Aktiv','Pausiert','Suchen','Alle','Monster','Items','Sprache','GUI-Theme','Zurück','Weiter','Schließen','online','offline','Bot-Charaktere erkennen','Gemeinsamen Anführer wählen','Geteilte Gruppen reparieren','4/4-Gruppe zusammensetzen','Prüfen und fortfahren','Keine Daten','Update','Aktuelle Version','Gefundene Version','Einstellungen & Updates','Headless-Einrichtung','Bestiarium / Items','Skillmanager'],
    ja:['キャラクター情報','グループ設定','狩り目標','モンスター図鑑 / アイテム','スキル管理','商人とエリクサー','商店自動化','ダメージ / 回復','Webダッシュボード','イベントログ','設定と更新','ヘッドレス手順','開始','一時停止','稼働中','一時停止中','検索','すべて','モンスター','アイテム','言語','GUIテーマ','戻る','次へ','閉じる','オンライン','オフライン','Botキャラクターを検出','共通リーダーを選択','分裂パーティーを修復','4/4パーティーを構成','確認して続行','データなし','更新','現在のバージョン','検出バージョン','設定と更新','ヘッドレス設定','モンスター図鑑 / アイテム','スキル管理'],
    pcm:['Character info','Group settings','Farm target','Bestiary / Items','Skill manager','Merchant & Elixir','Merchant stand automation','Damage / Heal','Web dashboard','Event log','Settings & Update','Headless step by step','Start','Pause','Active','Pause','Search','All','Monsters','Items','Language','GUI theme','Back','Next','Close','online','offline','Find bot characters','Choose one leader','Fix split party','Gather 4/4 party','Check and continue','No data','Update','Current version','Version we find','Settings & Update','Headless setup','Bestiary / Items','Skill manager'],
    arz:['معلومات الشخصية','إعدادات الجروب','أهداف الفارم','دليل الوحوش / الأدوات','مدير المهارات','التاجر والإكسير','أوتوماتيك ستاند التاجر','الضرر / العلاج','داشبورد الويب','سجل الأحداث','الإعدادات والتحديثات','هيدلس خطوة بخطوة','تشغيل','إيقاف','شغال','متوقف','بحث','الكل','وحوش','أدوات','اللغة','شكل الواجهة','رجوع','التالي','قفل','أونلاين','أوفلاين','اكتشف شخصيات البوت','اختار ليدر واحد','صلّح الجروبات المتقسمة','كوّن جروب 4/4','راجع وكمل','مفيش بيانات','تحديث','الإصدار الحالي','الإصدار الموجود','الإعدادات والتحديثات','إعداد هيدلس','دليل الوحوش / الأدوات','مدير المهارات']
  };
  function T(k){var i=I18N_KEYS.indexOf(k),lang=I18N[C.language]||I18N.en;return i>=0?(lang[i]||I18N.en[i]||k):k;}
  var LANGS=[['en','English'],['zh','中文 / Mandarin'],['hi','हिन्दी'],['es','Español'],['ar','العربية الفصحى'],['fr','Français'],['bn','বাংলা'],['pt','Português'],['ru','Русский'],['id','Bahasa Indonesia'],['ur','اردو'],['de','Deutsch'],['ja','日本語'],['pcm','Nigerian Pidgin'],['arz','العربية المصرية']];
  var THEMES={
    midnight:{bg:'#0e1822',surface:'#162735',card:'#132431',border:'#315063',text:'#eaf5f2',muted:'#8ea8b8',accent:'#62e0ba',accent2:'#74a8ff',good:'#69e7bf',warn:'#ffd16c',bad:'#ff6675',shadow:'#0009'},
    arctic:{bg:'#eef7fb',surface:'#ffffff',card:'#e5f2f7',border:'#9ab7c4',text:'#17313d',muted:'#5d7885',accent:'#168aad',accent2:'#4f6edb',good:'#158b66',warn:'#a66c00',bad:'#c13b4a',shadow:'#31506333'},
    solarized:{bg:'#002b36',surface:'#073642',card:'#0b3f49',border:'#586e75',text:'#eee8d5',muted:'#93a1a1',accent:'#2aa198',accent2:'#268bd2',good:'#859900',warn:'#b58900',bad:'#dc322f',shadow:'#0008'},
    neon:{bg:'#070713',surface:'#111127',card:'#161635',border:'#4b3f72',text:'#f7f3ff',muted:'#a99aca',accent:'#00f5d4',accent2:'#f15bb5',good:'#72ff72',warn:'#fee440',bad:'#ff4d6d',shadow:'#000c'},
    forest:{bg:'#101b15',surface:'#17281e',card:'#1b3024',border:'#3e664d',text:'#edf7ef',muted:'#9db5a3',accent:'#75d69c',accent2:'#a7c957',good:'#80ed99',warn:'#e9c46a',bad:'#e76f51',shadow:'#0009'},
    crimson:{bg:'#1b1013',surface:'#2a171c',card:'#351b22',border:'#70404c',text:'#fff0f2',muted:'#c0a0a6',accent:'#ff6b81',accent2:'#ff9f43',good:'#7bed9f',warn:'#ffd56b',bad:'#ff4757',shadow:'#000a'},
    royal:{bg:'#111326',surface:'#1b1f3d',card:'#23284d',border:'#4d568f',text:'#f2f3ff',muted:'#a5acd2',accent:'#8b9cff',accent2:'#c084fc',good:'#77e6b6',warn:'#ffd166',bad:'#ff6b8a',shadow:'#000a'},
    sakura:{bg:'#26171f',surface:'#35212c',card:'#422937',border:'#795267',text:'#fff2f8',muted:'#d0a9bb',accent:'#ff9ac2',accent2:'#c4a7ff',good:'#8ee3b3',warn:'#ffd59a',bad:'#ff6b91',shadow:'#0009'},
    contrast:{bg:'#000000',surface:'#0b0b0b',card:'#141414',border:'#ffffff',text:'#ffffff',muted:'#d0d0d0',accent:'#00ff88',accent2:'#00c8ff',good:'#00ff66',warn:'#ffff00',bad:'#ff3b3b',shadow:'#000'},
    paper:{bg:'#f4efe5',surface:'#fffaf0',card:'#ebe3d4',border:'#b7a98f',text:'#2e2a24',muted:'#746b5d',accent:'#276b5f',accent2:'#7a5c9e',good:'#2f7d59',warn:'#9a6a17',bad:'#a63d40',shadow:'#5b4d3a33'}
  };
  function applyAppearance(){if(!uiHost)return;var t=THEMES[C.theme]||THEMES.midnight;Object.keys(t).forEach(function(k){uiHost.style.setProperty('--'+k,t[k]);});uiHost.style.setProperty('--scale',String(C.uiScale||1));uiHost.setAttribute('dir',['ar','ur','arz'].indexOf(C.language)>=0?'rtl':'ltr');}
  function icon(name){var p={user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.2a4 4 0 0 1 0 7.6"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z"/><path d="M4 6.5v13"/>',spark:'<path d="M12 3l1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1L6.5 8.5l4.1-1.4z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/>',store:'<path d="M3 10l2-6h14l2 6"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',log:'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21v4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',terminal:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/>',flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8"/>'}[name]||'<circle cx="12" cy="12" r="8"/>';return '<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';}
  var CSS='\
    :host{all:initial;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:var(--text);font-size:calc(14px * var(--scale,1))}*{box-sizing:border-box}\
    .mainbox,.tool{position:fixed;z-index:9950;background:var(--bg);border:1px solid var(--border);border-radius:14px;box-shadow:0 16px 50px var(--shadow);overflow:hidden;color:var(--text)}.mainbox{width:350px;min-height:340px}\
    .head{height:48px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;padding:0 10px;cursor:move;user-select:none}.head strong{flex:1;min-width:0}.ver{font-size:10px;color:var(--muted)}.close,.mini{border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:7px;padding:6px 9px;cursor:pointer}.power{border:1px solid transparent;border-radius:8px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer}.power.running{background:color-mix(in srgb,var(--good) 24%,var(--surface));border-color:var(--good);color:var(--good)}.power.paused{background:color-mix(in srgb,var(--bad) 20%,var(--surface));border-color:var(--bad);color:var(--bad)}\
    .body{padding:11px;max-height:calc(100vh - 110px);overflow:auto}.launcher{display:grid;grid-template-columns:1fr;gap:7px}.launch{display:flex;align-items:center;gap:11px;width:100%;text-align:left;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:10px;padding:10px 12px;cursor:pointer;transition:.15s}.launch:hover{border-color:var(--accent);transform:translateX(2px)}.launch.open{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 18%,var(--card));box-shadow:inset 3px 0 0 var(--accent)}.launch svg,.head svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.launch b{display:block;font-size:12px}.launch small{display:block;color:var(--muted);font-size:9px;margin-top:2px}.launch .arrow{margin-left:auto;color:var(--accent)}\
    .statusline{display:flex;justify-content:space-between;gap:8px;padding:8px 11px;border-top:1px solid var(--border);font-size:10px;color:var(--muted)}.good{color:var(--good)}.warn{color:var(--warn)}.bad{color:var(--bad)}.tag{padding:3px 6px;background:var(--card);border-radius:99px;font-size:9px}.update{margin:0 11px 9px;padding:10px;border:1px solid var(--good);background:var(--card);border-radius:9px;color:var(--good);font-weight:800;animation:blinkgreen 1s infinite}.update button{margin-top:7px;width:100%;background:var(--good);color:var(--bg);border:0;border-radius:7px;padding:8px;font-weight:900;cursor:pointer}@keyframes blinkgreen{50%{box-shadow:0 0 18px 3px color-mix(in srgb,var(--good) 60%,transparent)}}\
    .tool{width:560px;height:620px;resize:both}.tool .toolbody{height:calc(100% - 48px);overflow:auto;padding:14px}.tool h2{font-size:18px;margin:0 0 12px}.tool h3{font-size:13px;margin:18px 0 8px;color:var(--accent)}.card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:11px;margin:8px 0}.line{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:5px 0}.muted{font-size:10px;color:var(--muted);line-height:1.45}.setting{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--border);padding:9px 0}.setting label{font-size:11px;flex:1}.setting small{display:block;color:var(--muted);font-size:9px;margin-top:3px}.setting input[type=text],.setting input[type=url],.setting input[type=number],.setting select,.searchbar input,.searchbar select{width:230px;max-width:55%;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:7px;padding:7px}.setting input[type=checkbox]{width:18px;height:18px;accent-color:var(--accent)}.btn{border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:8px;padding:8px 11px;cursor:pointer;font-size:10px}.btn.primary{background:var(--accent);color:var(--bg);border-color:var(--accent);font-weight:800}.btn.danger{border-color:var(--bad);color:var(--bad)}.buttons{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.notice{padding:10px;border-radius:8px;background:var(--card);border-left:3px solid var(--accent);margin:8px 0;font-size:10px;line-height:1.5}.notice.warn{border-color:var(--warn);color:var(--warn)}.notice.bad{border-color:var(--bad);color:var(--bad)}\
    table{width:100%;border-collapse:collapse;font-size:10px}th,td{text-align:left;padding:7px 5px;border-bottom:1px solid var(--border);vertical-align:top}th{color:var(--muted);position:sticky;top:0;background:var(--bg);z-index:1}.bar{height:8px;border-radius:99px;background:var(--surface);overflow:hidden}.bar i{display:block;height:100%;background:var(--accent)}.bar.hp i{background:var(--bad)}.logrow{font-size:9px;padding:5px;border-bottom:1px solid var(--border);line-height:1.4}.logrow time{color:var(--muted)}\
    .overlay,.wizard{position:fixed;inset:0;z-index:100000;background:#000a;display:grid;place-items:center}.modal{width:min(650px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;background:var(--bg);border:1px solid var(--border);border-radius:14px;padding:18px;box-shadow:0 18px 60px var(--shadow);color:var(--text)}.modaltop{display:flex;align-items:center;gap:10px}.modaltop h2{flex:1;margin:0 0 12px}.wizard pre,.overlay textarea{width:100%;white-space:pre-wrap;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:9px}.steps{font-size:10px;color:var(--muted);margin-bottom:10px}.navrow{display:flex;justify-content:space-between;gap:10px;margin-top:16px}.osgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.osbtn{border:1px solid var(--border);background:var(--card);color:var(--text);padding:14px;border-radius:9px;cursor:pointer}.osbtn.on{border-color:var(--accent);color:var(--accent)}\
    .partyplan{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:10px 0}.pstep{padding:9px 6px;border:1px solid var(--border);border-radius:9px;text-align:center;font-size:9px;background:var(--surface)}.pstep b{display:block;font-size:13px;margin-bottom:4px}.pstep.done{border-color:var(--good);color:var(--good)}.pstep.current{border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 15%,transparent)}\
    .searchbar{display:flex;gap:8px;margin:10px 0}.searchbar input{flex:1;max-width:none;width:auto}.searchbar select{width:150px}.catalog{max-height:520px;overflow:auto;border:1px solid var(--border);border-radius:10px}.visualcell{display:flex;align-items:flex-start;gap:9px}.gamevisual{width:46px;height:46px;min-width:46px;display:grid;place-items:center;overflow:hidden;border-radius:8px;background:var(--surface);border:1px solid var(--border)}.gamevisual>*{max-width:100%!important;max-height:100%!important}.badges{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}.badge{font-size:8px;padding:2px 5px;border-radius:99px;background:var(--surface);border:1px solid var(--border);color:var(--muted)}.skillcard{display:grid;grid-template-columns:52px 1fr;gap:10px}.skillstats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin-top:8px}.skillstat{background:var(--surface);padding:6px;border-radius:7px;text-align:center;font-size:8px}.skillstat b{display:block;font-size:10px;color:var(--text);margin-top:2px}\
    input,textarea,select{pointer-events:auto!important;user-select:text!important;-webkit-user-select:text!important}.mainbox.collapsed .maincontent,.mainbox.collapsed .statusline{display:none!important}.mainbox.collapsed .body{display:none!important}.mainbox.collapsed{height:auto!important;min-height:0!important}.mainbox.collapsed .head{border-bottom:0!important}.planlist{display:grid;gap:6px;margin-top:8px}.planstep{display:grid;grid-template-columns:24px 1fr;gap:8px;align-items:start;padding:7px;border:1px solid var(--border);border-radius:8px;background:var(--surface)}.planstep.current{border-color:var(--accent)}.planstep b{color:var(--accent)}.bar.mp i{background:#3b82f6!important}.bar.hp i{background:#e5484d!important}.dbstats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.dbstats>div{padding:7px;background:var(--surface);border-radius:7px;text-align:center}.dbstats b{display:block;font-size:14px}.material{color:var(--accent);font-weight:700}\
    @media(max-width:850px){.mainbox{width:min(350px,calc(100vw - 16px))}.tool{width:min(560px,calc(100vw - 16px));height:min(620px,calc(100vh - 16px))}.osgrid,.partyplan{grid-template-columns:1fr}.skillstats{grid-template-columns:repeat(2,1fr)}.dbstats{grid-template-columns:1fr}}\
  ';
  function gameHTML(fn,args){try{var f=P&&P[fn];if(typeof f!=='function'&&typeof globalThis!=='undefined'&&typeof globalThis[fn]==='function')f=globalThis[fn];if(typeof f!=='function')return '';return String(f.apply(P,args)||'');}catch(e){return '';}}
  function monsterVisual(id,size){var d=GD.monsters[id]||{},html=gameHTML('sprite',[d.skin||id,{height:size||42}]);return '<span class="gamevisual">'+html+'</span>';}
  function itemVisual(id,size){var d=GD.items[id]||{},html=d.skin?gameHTML('item_container',[{skin:d.skin,size:size||40,bcolor:'transparent'},{name:id}]):'';return '<span class="gamevisual">'+html+'</span>';}
  function skillVisual(id,size){var d=GD.skills[id]||{},html=d.skin?gameHTML('item_container',[{skin:d.skin,size:size||40,bcolor:'transparent',skname:id,loader:id}]):'';return '<span class="gamevisual">'+html+'</span>';}
  function toolDefs(){return [['character','user',T('character'),'HP, MP, equipment, position'],['party','users',T('party'),'4/4 detection and repair'],['farm','target',T('farm'),'Automatic or manual target selection'],['bestiary','book',T('bestiary'),'All monsters, items and event items'],['skills','spark',T('skills'),'Mana, cooldown and damage efficiency'],['merchant','flask',T('merchant'),'Supply and class-aware elixirs'],['stand','store',T('stand'),'Explicit opt-in and precise limits'],['meters','chart',T('meters'),'Session combat meters'],['dashboard','globe',T('dashboard'),'Dashboard 2.7 connection'],['logs','log',T('logs'),'Detailed audit and 12-hour exports'],['settings','settings',T('settings'),'Themes, languages and updates'],['headless','terminal',T('headless'),'Guided Windows/Linux/macOS setup']];}
  function defaultMainUI(){var vw=P.innerWidth||1200;return {x:Math.max(8,vw-370),y:50,w:350,h:Math.min(780,(P.innerHeight||900)-70)};}
  function initUI(){if(HEADLESS||!D||!D.body)return;var old=D.getElementById(UI_HOST);if(old)old.remove();uiHost=D.createElement('div');uiHost.id=UI_HOST;D.body.appendChild(uiHost);uiRoot=uiHost.attachShadow?uiHost.attachShadow({mode:'open'}):uiHost;applyAppearance();var style=D.createElement('style');style.textContent=CSS;uiRoot.appendChild(style);var box=D.createElement('section');box.className='mainbox';box.innerHTML='<div class="head">'+icon('spark')+'<strong>AiO Bot</strong><span class="ver">'+VERSION+'</span><button class="power" data-action="toggle-run"></button><button class="mini" data-main-min>−</button></div><div class="maincontent"></div><div class="statusline"><span class="mainstate"></span><span class="partystate"></span></div>';uiRoot.appendChild(box);S.mainBox=box;S.ui=Object.assign(defaultMainUI(),S.ui||{});layoutMain();bindDrag(box,box.querySelector('.head'),S.ui,function(){write('ui:'+me,S.ui);});uiRoot.addEventListener('click',uiClick);uiRoot.addEventListener('change',uiChange);uiRoot.addEventListener('input',uiInput);uiRoot.addEventListener('focusin',function(e){if(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))S.uiTyping=true;});uiRoot.addEventListener('focusout',function(){S.uiTyping=false;});['keydown','keyup','keypress'].forEach(function(ev){uiRoot.addEventListener(ev,function(e){if(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)){e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}},true);});S.globalTypingGuard=function(e){if(!S.uiTyping)return;e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();};try{if(P.addEventListener)['keydown','keyup','keypress'].forEach(function(ev){P.addEventListener(ev,S.globalTypingGuard,true);});}catch(e){}renderAll(true);}
  function layoutMain(){if(!S.mainBox)return;var vw=P.innerWidth||1200,vh=P.innerHeight||900;S.ui.x=clamp(S.ui.x,0,Math.max(0,vw-250));S.ui.y=clamp(S.ui.y,0,Math.max(0,vh-60));S.mainBox.style.left=S.ui.x+'px';S.mainBox.style.top=S.ui.y+'px';S.mainBox.style.width=(S.ui.w||350)+'px';S.mainBox.style.maxHeight=(S.ui.h||740)+'px';}
  function bindDrag(el,handle,model,save){var drag=null;handle.addEventListener('pointerdown',function(e){if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,l:model.x||0,t:model.y||0};try{handle.setPointerCapture(e.pointerId);}catch(err){}e.preventDefault();});handle.addEventListener('pointermove',function(e){if(!drag)return;model.x=drag.l+e.clientX-drag.x;model.y=drag.t+e.clientY-drag.y;el.style.left=model.x+'px';el.style.top=model.y+'px';});handle.addEventListener('pointerup',function(){if(drag&&save)save();drag=null;});}
  function nextWindowPosition(w,h){var vw=P.innerWidth||1200,vh=P.innerHeight||900,anchor=S.mainBox&&S.mainBox.getBoundingClientRect();if(S.lastToolKey&&S.toolWindows[S.lastToolKey])anchor=S.toolWindows[S.lastToolKey].el.getBoundingClientRect();var x=(anchor?anchor.right+10:20),y=(anchor?anchor.top:60);if(x+w>vw-8)x=Math.max(8,(anchor?anchor.left:vw-w)-w-10);if(x<8)x=8;if(y+h>vh-8)y=Math.max(8,vh-h-8);return {x:x,y:y,w:w,h:h};}
  function openTool(key){if(key==='headless'){showHeadlessGuide();return;}var w=S.toolWindows[key];if(w){w.el.style.zIndex=String(++S.windowZ);S.lastToolKey=key;renderTool(key);return;}var wide=key==='bestiary'||key==='skills'||key==='logs',p=nextWindowPosition(wide?760:560,wide?700:620),el=D.createElement('section');el.className='tool';el.dataset.tool=key;el.style.zIndex=String(++S.windowZ);var def=toolDefs().find(function(x){return x[0]===key;})||[];el.innerHTML='<div class="head">'+icon(def[1]||'settings')+'<strong>'+esc(toolTitle(key))+'</strong><button class="close" data-close-tool="'+esc(key)+'">×</button></div><div class="toolbody"></div>';uiRoot.appendChild(el);el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.width=p.w+'px';el.style.height=p.h+'px';S.toolWindows[key]={el:el,ui:p};S.lastToolKey=key;bindDrag(el,el.querySelector('.head'),p,function(){});el.addEventListener('pointerdown',function(){el.style.zIndex=String(++S.windowZ);S.lastToolKey=key;});renderTool(key);}
  function closeTool(key){var w=S.toolWindows[key];if(!w)return;w.el.remove();delete S.toolWindows[key];if(S.lastToolKey===key)S.lastToolKey=null;}
  function toolTitle(key){var x=toolDefs().find(function(r){return r[0]===key;});return x?x[2]:key;}
  function cfgField(key,label,type,help,options){var v=C[key],control='';if(type==='check')control='<input type="checkbox" data-cfg="'+esc(key)+'"'+(v?' checked':'')+'>';else if(type==='select')control='<select data-cfg="'+esc(key)+'">'+(options||[]).map(function(o){return '<option value="'+esc(o[0])+'"'+(String(v)===String(o[0])?' selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select>';else control='<input data-cfg="'+esc(key)+'" type="'+(type||'text')+'" value="'+esc(v)+'">';return '<div class="setting"><label>'+esc(label)+(help?'<small>'+esc(help)+'</small>':'')+'</label>'+control+'</div>';}
  function characterHTML(){var ps=partyState(),el=character.slots&&character.slots.elixir;return '<h2>'+esc(T('character'))+'</h2><div class="card"><div class="line"><strong>'+esc(me)+'</strong><span class="tag">'+esc(character.ctype)+' · Lv. '+character.level+'</span></div><div class="muted">'+esc(character.map)+' · X '+Math.round(character.x||0)+' · Y '+Math.round(character.y||0)+'</div><p>HP '+character.hp+' / '+character.max_hp+'</p><div class="bar hp"><i style="width:'+Math.round(ratio(character,'hp')*100)+'%"></i></div><p>MP '+character.mp+' / '+character.max_mp+'</p><div class="bar"><i style="width:'+Math.round(ratio(character,'mp')*100)+'%"></i></div></div><div class="card"><div class="line"><span>Task</span><strong>'+esc(S.status)+'</strong></div><div class="line"><span>Mode</span><span>'+esc(S.mode)+'</span></div><div class="line"><span>Party</span><span class="'+(ps.complete?'good':'bad')+'">'+(ps.complete?'4/4':ps.members.length+'/'+Math.max(4,ps.expected.length))+'</span></div><div class="line"><span>Elixir</span><span>'+esc(el?((GD.items[el.name]||{}).name||el.name):'—')+'</span></div></div>';}
  function partyPlan(st){var wrong=!!(character.party&&String(character.party)!==st.canonicalLeader),idx=st.discoveryCount<4?0:!st.canonicalLeader?1:wrong?2:!st.complete?3:4;var labels=[T('detect'),T('leader'),T('repair'),T('assemble'),T('verify')];return labels.map(function(label,i){return {label:label,state:i<idx?'done':i===idx?'current':'pending'};});}
  function partyHTML(){
    var st=partyState(),rs=roleSummary(),tank=activeTankName(),de=C.language==='de';
    var rows=C.roster.map(function(n){
      var r=peerReport(n),role=roleForName(n),primary=(tank===n&&role==='tank');
      return '<tr><td>'+esc(n)+'</td><td>'+esc(characterType(n)||'—')+'</td><td><span class="tag">'+esc(roleLabel(role))+(primary?' ★':'')+'</span></td><td class="'+(r&&r.active?'good':'warn')+'">'+esc(r&&r.active?T('online'):T('offline'))+'</td><td>'+esc(r&&r.map||'—')+'</td></tr>';
    }).join('');
    var plan=partyPlan(st),fallbackOptions=[['none',de?'Kein Ersatz-Tank':'No fallback tank']].concat(C.roster.filter(function(n){return characterType(n)!=='merchant';}).map(function(n){return[n,n+' · '+roleLabel(n===C.fallbackTank?'tank':naturalRoleForClass(characterType(n)))];}));
    var roleNotice='<div class="card"><div class="line"><span>'+(de?'Aktiver Tank':'Active tank')+'</span><strong>'+esc(tank||'—')+'</strong></div><div class="line"><span>'+(de?'Heiler':'Healers')+'</span><strong>'+esc(rs.healers.join(', ')||'—')+'</strong></div><div class="line"><span>Damage Dealer</span><strong>'+esc(rs.dps.join(', ')||'—')+'</strong></div>'+(rs.fallbackTank?'<div class="notice warn">'+esc((de?'Kein natürlicher Tank erkannt. Ersatz-Tank: ':'No natural tank detected. Fallback tank: ')+rs.fallbackTank)+'</div>':(!rs.tanks.length?'<div class="notice warn">'+esc(de?'Kein Tank erkannt. Optional unten einen Ersatz-Tank auswählen.':'No tank detected. You can optionally choose a fallback tank below.')+'</div>':''))+'</div>';
    return '<h2>'+esc(T('party'))+'</h2><div class="partyplan">'+plan.map(function(x,i){return '<div class="pstep '+x.state+'"><b>'+(i+1)+'</b>'+esc(x.label)+'</div>';}).join('')+'</div>'+
      '<div class="notice '+(st.complete?'':'bad')+'"><b>'+esc(st.complete?(de?'4/4-Gruppe bestätigt.':'4/4 party verified.'):(de?'Automatische Bot-Erkennung ist aktiv.':'Automatic same-bot detection is active.'))+'</b><br>'+esc(de?'Erkannt: ':'Detected: ')+esc((st.discovered||[]).join(', ')||me)+' ('+st.discoveryCount+'/4)<br>'+esc(de?'Anführer: ':'Leader: ')+esc(st.canonicalLeader||'—')+'<br>'+esc(de?'Fehlend: ':'Missing: ')+esc(st.missing.join(', ')||'—')+(st.foreign.length?'<br>'+esc(de?'Fremd: ':'Foreign: ')+esc(st.foreign.join(', ')):'')+'</div>'+
      roleNotice+
      cfgField('autoRoster',de?'Charaktere mit diesem Bot automatisch erkennen':'Automatically detect characters using this bot','check',de?'Die Gruppe wird erst geändert, wenn vier aktuelle 2.7.2-Heartbeats gleichzeitig bestätigt sind.':'The roster changes only after four current 2.7.2 heartbeats are confirmed together.')+
      cfgField('fallbackTank',de?'Optionaler Ersatz-Tank':'Optional fallback tank','select',de?'Wird nur benutzt, wenn Warrior/Paladin nicht automatisch als Tank erkannt werden.':'Used only when no Warrior/Paladin is automatically detected as a tank.',fallbackOptions)+
      cfgField('autoParty',de?'Automatische Gruppe':'Automatic party','check',de?'Einladungen, Anfragen und Reparatur geteilter Gruppen.':'Invites, requests and split-party repair.')+
      cfgField('strictFourParty',de?'Strikte 4/4-Prüfung':'Strict 4/4 verification','check')+
      cfgField('leader',de?'Gruppenanführer':'Party leader','select',de?'Auto wählt deterministisch einen Nicht-Merchant.':'Auto selects one non-merchant deterministically.',[['auto','Auto']].concat(C.roster.map(function(n){return[n,n];})))+
      '<table><thead><tr><th>Name</th><th>'+esc(de?'Klasse':'Class')+'</th><th>'+esc(de?'Rolle':'Role')+'</th><th>Status</th><th>Map</th></tr></thead><tbody>'+rows+'</tbody></table>';
  }
  function farmHTML(){return '<h2>'+esc(T('farm'))+'</h2>'+cfgField('farmMode','Farm mode','select','Auto evaluates live monster data.',[['auto','Auto'],['manual','Manual']])+cfgField('monster','Manual monster ID','text')+cfgField('searchRadius','Search radius','number')+cfgField('risk','Maximum risk %','number')+cfgField('maxTargets','Maximum simultaneous targets','number')+cfgField('followDistance','Group distance','number')+cfgField('autoFarmMinSpawnCount','Minimum monsters per automatic farm spawn','number','Prevents rare single bosses from becoming normal farm targets.')+cfgField('goalEmptyReplanSeconds','Replan after empty spawn (sec)','number')+'<div class="card"><div class="line"><span>Current target area</span><strong>'+esc(S.goal?S.goal.monster+' · '+S.goal.map:'—')+'</strong></div><button class="btn primary" data-action="goal-now">Re-evaluate</button></div>';}
  var spawnMapCache=null;
  function monsterSpawnMaps(id){if(!spawnMapCache){spawnMapCache={};Object.keys(GD.maps||{}).forEach(function(map){var md=GD.maps[map]||{};(md.monsters||[]).forEach(function(m){if(!m||!m.type)return;(spawnMapCache[m.type]||(spawnMapCache[m.type]=[]));if(spawnMapCache[m.type].indexOf(map)<0)spawnMapCache[m.type].push(map);});});}return (spawnMapCache[id]||[]).slice();}
  function normaliseSearch(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}
  function itemSpecial(d){return !!(d&&(d.event||d.e||d.quest||d.type==='quest'||d.type==='token'));}
  function monsterSpecial(d){return !!(d&&(d.boss||d.special||d.cooperative||d.abilities||Number(d.respawn)<0));}
  function monsterCatalogRows(q){q=normaliseSearch(q);return Object.keys(GD.monsters||{}).map(function(id){var d=GD.monsters[id]||{},maps=monsterSpawnMaps(id),hay=normaliseSearch([id,d.name,d.explanation,d.damage_type,maps.join(' ')].join(' '));return {id:id,d:d,maps:maps,hay:hay};}).filter(function(r){return !q||r.hay.indexOf(q)>=0;}).sort(function(a,b){return String(a.d.name||a.id).localeCompare(String(b.d.name||b.id));});}
  function itemCatalogRows(q){q=normaliseSearch(q);return Object.keys(GD.items||{}).map(function(id){var d=GD.items[id]||{},hay=normaliseSearch([id,d.name,d.type,d.explanation,d.class&&[].concat(d.class).join(' ')].join(' '));return {id:id,d:d,hay:hay};}).filter(function(r){return !q||r.hay.indexOf(q)>=0;}).sort(function(a,b){return String(a.d.name||a.id).localeCompare(String(b.d.name||b.id));});}
  function bestiaryHTML(){var q=S.bestiarySearch||'',mode=S.bestiaryMode||'all',mons=mode==='items'?[]:monsterCatalogRows(q),items=mode==='monsters'?[]:itemCatalogRows(q);var mhtml=mons.map(function(r){var d=r.d;return '<tr><td><div class="visualcell">'+monsterVisual(r.id,42)+'<div><b>'+esc(d.name||r.id)+'</b><br><small>'+esc(r.id)+'</small><div class="badges">'+(monsterSpecial(d)?'<span class="badge">Boss/Special</span>':'')+(d.aggro?'<span class="badge">Aggro</span>':'')+'</div></div></div></td><td>HP '+Number(d.hp||0).toLocaleString()+'<br>XP '+Number(d.xp||0).toLocaleString()+'<br>ATK '+Number(d.attack||0).toLocaleString()+'</td><td>'+esc(d.damage_type||'—')+'<br>Range '+esc(d.range==null?'—':d.range)+'<br>APS '+(Number(d.frequency)||0).toFixed(2)+'</td><td>Armor '+esc(d.armor==null?'—':d.armor)+'<br>Res '+esc(d.resistance==null?'—':d.resistance)+'<br>Respawn '+esc(d.respawn==null?'—':d.respawn+'s')+'</td><td>'+esc(r.maps.join(', ')||'—')+(d.explanation?'<br><small>'+esc(d.explanation)+'</small>':'')+'</td></tr>';}).join('');var ihtml=items.map(function(r){var d=r.d,classes=d.class?[].concat(d.class).join(', '):'all';return '<tr><td><div class="visualcell">'+itemVisual(r.id,40)+'<div><b>'+esc(d.name||r.id)+'</b><br><small>'+esc(r.id)+'</small><div class="badges">'+(itemSpecial(d)?'<span class="badge">Event/Special</span>':'')+(d.upgrade?'<span class="badge">Upgrade</span>':'')+(d.compound?'<span class="badge">Compound</span>':'')+'</div></div></div></td><td>'+esc(d.type||'—')+'<br>Lv '+esc(d.level==null?'—':d.level)+'</td><td>Value '+Number(d.g||0).toLocaleString()+'<br>Class '+esc(classes)+'</td><td colspan="2">'+esc(d.explanation||'—')+'</td></tr>';}).join('');return '<h2>'+esc(T('bestiary_items'))+'</h2><div class="notice">All entries come from the game\'s live <code>G.monsters</code> and <code>G.items</code> data, including currently loaded event/special items.</div><div class="searchbar"><input type="search" data-best-search placeholder="'+esc(T('search'))+'…" value="'+esc(q)+'"><select data-best-mode><option value="all"'+(mode==='all'?' selected':'')+'>'+esc(T('all'))+'</option><option value="monsters"'+(mode==='monsters'?' selected':'')+'>'+esc(T('monsters'))+'</option><option value="items"'+(mode==='items'?' selected':'')+'>'+esc(T('items'))+'</option></select></div><div class="muted">'+mons.length+' '+esc(T('monsters'))+' · '+items.length+' '+esc(T('items'))+'</div><div class="catalog">'+(mons.length?'<h3>'+esc(T('monsters'))+'</h3><table><thead><tr><th>Monster</th><th>HP / XP / ATK</th><th>Combat</th><th>Defense</th><th>Maps / Notes</th></tr></thead><tbody>'+mhtml+'</tbody></table>':'')+(items.length?'<h3>'+esc(T('items'))+'</h3><table><thead><tr><th>Item</th><th>Type / Level</th><th>Value / Class</th><th colspan="2">Description</th></tr></thead><tbody>'+ihtml+'</tbody></table>':'')+(!mons.length&&!items.length?'<div class="notice warn">'+esc(T('no_data'))+'</div>':'')+'</div>';}
  function cooldownText(v){v=Number(v)||0;if(!v)return '—';return v>=100?(v/1000).toFixed(v<1000?2:1)+' s':v+' ms';}
  function skillDamageStats(id,d){var mp=Number(d.mp)||0,est=null,note='dynamic';if(isFinite(Number(d.damage))&&Number(d.damage)>0){est=Number(d.damage);note='fixed';}else if(isFinite(Number(d.output))&&Number(d.output)>0&&d.hostile){est=(Number(character.attack)||0)*(Number(d.output)/100);note='estimated';}else if(['burst','cburst','mentalburst'].indexOf(id)>=0&&isFinite(Number(d.ratio))){return {damage:'MP-based',perMp:'×'+Number(d.ratio).toFixed(2),note:'game ratio'};}return {damage:est==null?'—':'≈ '+Math.round(est),perMp:est!=null&&mp>0?(est/mp).toFixed(2):'—',note:note};}
  function skillsHTML(){var rows=classSkills();return '<h2>'+esc(T('skill_manager'))+'</h2><div class="notice">Damage/MP is shown only when the live skill definition provides enough numeric information; dynamic skills are labelled instead of guessed.</div>'+cfgField('weakMobSkillSaving','Save offensive skills on weak monsters','check','Avoids unnecessary mana/cooldown use.')+cfgField('weakMobSkillFactor','Weak threshold × basic attack','number')+cfgField('manaReserve','Mana reserve %','number')+'<h3>'+esc(T('skills'))+'</h3>'+rows.map(function(id){var d=GD.skills[id]||{},c=skillCfg(id),st=skillDamageStats(id,d);return '<div class="card skillcard">'+skillVisual(id,42)+'<div><div class="line"><label><input type="checkbox" data-skill="'+esc(id)+'"'+(c.enabled?' checked':'')+'> <b>'+esc(d.name||id)+'</b></label><span class="tag">'+esc(id)+'</span></div><div class="muted">'+esc(d.explanation||'—')+'</div><div class="skillstats"><div class="skillstat">Mana<b>'+esc(d.mp==null?'0':d.mp)+'</b></div><div class="skillstat">Cooldown<b>'+esc(cooldownText(d.cooldown))+'</b></div><div class="skillstat">Damage<b>'+esc(st.damage)+'</b></div><div class="skillstat">Dmg / MP<b>'+esc(st.perMp)+'</b></div><div class="skillstat">Range / Target<b>'+esc((d.range||'—')+' / '+(d.target||'—'))+'</b></div></div></div></div>';}).join('');}
  function merchantHTML(){var fs=farmerReports();return '<h2>'+esc(T('merchant'))+'</h2>'+cfgField('autoElixirs','Automatic elixir optimisation','check')+cfgField('upgradeElixirs','Craft higher elixir tiers when recipes/materials exist','check')+cfgField('elixirUpgradeTo','Maximum elixir tier','number')+cfgField('distributeElixirs','Distribute best class elixirs to farmers','check')+cfgField('merchantSupply','Deliver potions automatically','check')+cfgField('merchantCollectLoot','Collect loot/gold at merchant','check')+'<h3>Detected farmers</h3><table><thead><tr><th>Name</th><th>Class</th><th>Preferred stat</th></tr></thead><tbody>'+fs.map(function(r){return '<tr><td>'+esc(r.name)+'</td><td>'+esc(r.ctype)+'</td><td>'+classStat(r.ctype).toUpperCase()+'</td></tr>';}).join('')+'</tbody></table>';}
  function standHTML(){return '<h2>'+esc(T('stand'))+'</h2><div class="notice warn"><b>OFF by default.</b> Automatic selling starts only after explicit opt-in.</div>'+cfgField('merchantStandAutomation','EXPLICITLY ENABLE AUTOMATIC SELLING','check')+cfgField('standPriority','Stand priority','select','', [['idle','Low / idle only'],['normal','Normal'],['high','High']])+cfgField('standMaxOpenMinutes','Max open time per session (min)','number')+cfgField('standCooldownMinutes','Cooldown after closing (min)','number')+cfgField('standDailyRuntimeMinutes','Max stand runtime per day (min)','number')+cfgField('standMaxListings','Max simultaneous listings','number')+cfgField('standMaxUnitsPerListing','Max units per listing','number')+cfgField('standMaxUnitsPerWindow','Max sold units per window','number')+cfgField('standWindowMinutes','Sales limit window (min)','number')+cfgField('standRefreshSeconds','Refresh interval (sec)','number')+cfgField('standMinMarginPct','Minimum margin %','number')+cfgField('standUndercutPct','Undercut %','number')+cfgField('standItemMode','Item policy','select','',[['allowlist','Allowlist only'],['safe_spares','Safe spares'],['all_unprotected','All unprotected']])+cfgField('standAllowedItems','Allowed item IDs','text')+cfgField('standBlockedItems','Blocked item IDs','text')+cfgField('standKeepQuantity','Minimum inventory reserve','number')+cfgField('standCloseWhenPartyIncomplete','Close stand if 4/4 party is incomplete','check')+'<div class="card"><div class="line"><span>Active listings</span><strong>'+ownTradeListings().length+'</strong></div><div class="line"><span>Sold in current window</span><strong>'+standWindowSales()+' / '+C.standMaxUnitsPerWindow+'</strong></div></div>';}
  function metersHTML(){var sec=Math.max(1,(clock()-S.meter.started)/1000);return '<h2>'+esc(T('meters'))+'</h2><div class="card"><div class="line"><span>Total damage</span><strong>'+Math.round(S.meter.damage)+'</strong></div><div class="line"><span>Session DPS</span><strong>'+Math.round(S.meter.damage/sec)+'</strong></div><div class="line"><span>Total healing</span><strong>'+Math.round(S.meter.heal)+'</strong></div><div class="line"><span>Session HPS</span><strong>'+Math.round(S.meter.heal/sec)+'</strong></div></div>';}
  function dashboardHTML(){
    var normalized=normalizeDashboardEndpoint(C.webDashboardConnectionUrl),de=C.language==='de',confirmed=!!S.dashboardLastAck;
    return '<h2>'+esc(T('dashboard'))+' 2.7</h2>'+
      '<div class="notice">'+esc(de?'2.7.2 verlangt jetzt eine echte Server-Bestätigung. Ein Request mit Status 0 / opaque gilt nicht mehr fälschlich als erfolgreich.':'2.7.2 now requires a real server acknowledgement. A status-0 / opaque request is no longer treated as a successful dashboard update.')+'</div>'+
      cfgField('webDashboardConnectionUrl',de?'Bot-Verbindungs-URL':'Bot connection URL','url',de?'Komplette URL inklusive ?api=push&key=…':'Complete URL including ?api=push&key=…')+
      cfgField('webDashboardEnabled',de?'Web-Dashboard aktivieren':'Enable web dashboard','check')+
      cfgField('webDashboardIntervalSeconds',de?'Status senden alle (Sek.)':'Send status every (sec)','number')+
      '<div class="buttons"><button class="btn primary" data-action="dashboard-test">'+esc(de?'Verbindung jetzt testen':'Test connection now')+'</button><button class="btn" data-action="dashboard-tutorial">'+esc(de?'Tutorial öffnen':'Open tutorial')+'</button></div>'+
      '<div class="card"><div class="line"><span>'+esc(de?'Effektiver Endpunkt':'Effective endpoint')+'</span><strong>'+esc(normalized?normalized.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'):'—')+'</strong></div>'+
      '<div class="line"><span>'+esc(de?'Letzte bestätigte Annahme':'Last confirmed acknowledgement')+'</span><strong class="'+(confirmed?'good':'warn')+'">'+(confirmed?Math.round((clock()-S.dashboardLastAck)/1000)+' s':'—')+'</strong></div>'+
      '<div class="line"><span>'+esc(de?'Transport':'Transport')+'</span><strong>'+esc(S.dashboardTransport||'—')+'</strong></div>'+
      '<div class="line"><span>'+esc(de?'Bestätigter Charakter':'Acknowledged character')+'</span><strong>'+esc(S.dashboardAckName||'—')+'</strong></div>'+
      (S.dashboardLastError?'<div class="notice bad"><b>'+esc(de?'Letzter Fehler: ':'Last error: ')+'</b>'+esc(S.dashboardLastError)+'</div>':'')+
      (S.dashboardUnverifiedAt&&!confirmed?'<div class="notice warn">'+esc(de?'Ein Formular-Fallback wurde abgeschickt, konnte aber nicht vom Bot bestätigt werden.':'A form fallback was submitted, but the bot could not verify server acceptance.')+'</div>':'')+
      '</div>';
  }
  function logsHTML(){var current={start:S.segmentStart,end:clock()},ready=(S.readySegments||[]).slice().reverse();return '<h2>'+esc(T('logs'))+'</h2><div class="notice">Detailed bot-observable decisions, actions, party state, inventory/equipment, HP/MP/XP/gold, positions, skills, errors, dashboard and updates. It is not raw packet capture.</div><h3>Current segment</h3><div class="card"><div class="line"><span>'+new Date(current.start).toLocaleString()+' → now</span><span>'+S.auditRecent.length+' events</span></div><div class="buttons"><button class="btn primary" data-log="download" data-start="'+current.start+'" data-end="'+current.end+'">Download</button><button class="btn" data-log="copy" data-start="'+current.start+'" data-end="'+current.end+'">Copy</button></div></div><h3>Completed 12-hour segments</h3>'+(ready.length?ready.map(function(s){return '<div class="card"><div class="line"><span>'+new Date(s.start).toLocaleString()+'</span><span>'+new Date(s.end).toLocaleString()+'</span></div><div class="buttons"><button class="btn primary" data-log="download" data-start="'+s.start+'" data-end="'+s.end+'">Download</button><button class="btn" data-log="copy" data-start="'+s.start+'" data-end="'+s.end+'">Copy</button></div></div>';}).join(''):'<div class="muted">'+esc(T('no_data'))+'</div>')+'<h3>Live events</h3>'+S.auditRecent.slice(-180).reverse().map(function(e){return '<div class="logrow"><time>'+new Date(e.at).toLocaleTimeString()+'</time> <span class="'+(e.level==='error'||e.level==='critical'?'bad':e.level==='warning'?'warn':'')+'">['+esc(e.kind)+'] '+esc(e.message)+'</span></div>';}).join('');}
  function settingsHTML(){var themeOptions=[['midnight','Midnight Glass'],['arctic','Arctic Light'],['solarized','Solarized'],['neon','Neon Cyber'],['forest','Forest'],['crimson','Crimson'],['royal','Royal Violet'],['sakura','Sakura'],['contrast','High Contrast'],['paper','Paper / Sepia']];return '<h2>'+esc(T('settings_updates'))+'</h2>'+cfgField('language',T('language'),'select','15 widely spoken languages; English is the default for new installs.',LANGS)+cfgField('theme',T('theme'),'select','10 visually distinct themes.',themeOptions)+'<div class="notice"><b>Vollautomatisches Update:</b> GitHub wird fest einmal pro Minute geprüft. Eine neuere Version wird heruntergeladen, geprüft, in den aktiven CODE-Slot geschrieben und sofort per Hot-Reload angewendet. Diese Funktion ist absichtlich nicht abschaltbar.</div>'+cfgField('updateRepositoryUrl','Bot repository','url','Single repository only; no fallback repository is used.')+cfgField('auditEnabled','Detailed audit log','check')+cfgField('diagnosticMode','Gezielter Diagnosemodus','check','Schreibt regelmäßig Entscheidungs-, Merchant-, Kampf-, Update- und Dashboarddiagnosen in den Ereignislog.')+cfgField('diagnosticSeconds','Diagnose-Snapshot alle (Sek.)','number')+cfgField('logSegmentHours','Log segment hours','number')+cfgField('logRetentionDays','Log retention days','number')+'<div class="buttons"><button class="btn primary" data-action="update-check">Check for update</button>'+(S.update.available?'<button class="btn primary" data-action="update-apply">'+esc(T('update'))+' '+esc(S.update.latest)+'</button>':'')+'</div><div class="card"><div class="line"><span>'+esc(T('current_version'))+'</span><strong>'+VERSION+'</strong></div><div class="line"><span>'+esc(T('found_version'))+'</span><strong class="'+(S.update.available?'good':'')+'">'+esc(S.update.latest||'—')+'</strong></div>'+(S.update.error?'<div class="notice warn">'+esc(S.update.error)+(/HTTP 404/.test(S.update.error)?'<br><small>Private GitHub repositories cannot be checked anonymously from Adventure Land.</small>':'')+'</div>':'')+'</div>';}
  function toolHTML(key){return key==='character'?characterHTML():key==='party'?partyHTML():key==='farm'?farmHTML():key==='bestiary'?bestiaryHTML():key==='skills'?skillsHTML():key==='brain'?v290BrainHTML():key==='merchant'?merchantHTML():key==='stand'?standHTML():key==='meters'?metersHTML():key==='dashboard'?dashboardHTML():key==='logs'?logsHTML():settingsHTML();}
  function renderTool(key){var w=S.toolWindows[key];if(!w)return;var body=w.el.querySelector('.toolbody');if(body)body.innerHTML=toolHTML(key);}
  function renderMain(){if(!S.mainBox)return;var content=S.mainBox.querySelector('.maincontent'),ps=partyState(),defs=toolDefs();content.innerHTML=(S.update.available?'<div class="update">● UPDATE '+esc(S.update.latest)+'<button data-action="update-apply">'+esc(T('update'))+'</button></div>':'')+'<div class="launcher">'+defs.map(function(x){return '<button class="launch '+(S.toolWindows[x[0]]?'open':'')+'" data-open="'+x[0]+'">'+icon(x[1])+'<span><b>'+esc(x[2])+'</b><small>'+esc(x[3])+'</small></span><span class="arrow">›</span></button>';}).join('')+'</div>';var st=S.mainBox.querySelector('.mainstate'),pt=S.mainBox.querySelector('.partystate'),power=S.mainBox.querySelector('.power');if(st)st.innerHTML='<span class="'+(S.running?'good':'warn')+'">● '+esc(S.running?T('active'):T('paused'))+'</span> · '+esc(S.mode);if(pt)pt.innerHTML='<span class="'+(ps.complete?'good':'bad')+'">Party '+ps.members.length+'/4</span>';if(power){power.className='power '+(S.running?'running':'paused');power.textContent=S.running?T('pause'):T('start');}}
  function renderAll(force){if(HEADLESS||!S.mainBox)return;renderMain();if(force)Object.keys(S.toolWindows).forEach(renderTool);else ['character','party','meters','logs','brain'].forEach(function(k){if(S.toolWindows[k]&&!(D.activeElement&&S.toolWindows[k].el.contains(D.activeElement)))renderTool(k);});}
  function showNotice(title,text,kind){if(HEADLESS||!uiRoot){gameMessage(title+': '+text,'#63e1bd');return;}var el=D.createElement('div');el.className='overlay';el.innerHTML='<div class="modal"><div class="modaltop"><h2>'+esc(title)+'</h2><button class="close" data-action="modal-close">×</button></div><div class="notice '+esc(kind||'')+'">'+esc(text)+'</div></div>';uiRoot.appendChild(el);}
  function showRepoFallback(repo,why){if(HEADLESS){gameMessage('Update: '+repo,'#63e1bd');return;}var el=D.createElement('div');el.className='overlay';el.innerHTML='<div class="modal"><div class="modaltop"><h2>Open update manually</h2><button class="close" data-action="modal-close">×</button></div><div class="notice warn">'+esc(why||'')+'</div><p>The single repository link is selected below:</p><textarea id="repo-fallback" readonly>'+esc(repo)+'</textarea></div>';uiRoot.appendChild(el);P.setTimeout(function(){var ta=el.querySelector('#repo-fallback');if(ta){ta.focus();ta.select();}},50);}
  function showDashboardTutorial(step){if(HEADLESS)return;S.dashboardTutorialOpen=true;S.dashboardTutorialStep=step==null?0:step;var old=uiRoot.querySelector('.dashboard-guide');if(old)old.remove();var steps=['<b>1. Open the web dashboard.</b><p>Open your uploaded <code>dashboard/index.php</code> and finish first-time setup.</p>','<b>2. Copy the Bot Connection URL.</b><p>Copy the complete URL containing <code>?api=push&key=…</code>.</p>','<b>3. Paste the URL into the bot.</b><p>Use the same connection URL on all four bot characters.</p>','<b>4. Enable and test.</b><p>Enable Web Dashboard and press Test connection now. HTTP bplaced links are automatically upgraded to HTTPS.</p>','<b>5. Done.</b><p>The dashboard should receive one status record per connected bot character.</p>'];var el=D.createElement('div');el.className='wizard dashboard-guide';el.innerHTML='<div class="modal"><div class="modaltop"><h2>Web Dashboard 2.7</h2><button class="close" data-action="dash-close">×</button></div><div class="steps">Step '+(S.dashboardTutorialStep+1)+' / '+steps.length+'</div>'+steps[S.dashboardTutorialStep]+'<div class="navrow"><button class="btn" data-action="dash-prev"'+(S.dashboardTutorialStep===0?' disabled':'')+'>'+esc(T('back'))+'</button><button class="btn primary" data-action="'+(S.dashboardTutorialStep===steps.length-1?'dash-done':'dash-next')+'">'+esc(S.dashboardTutorialStep===steps.length-1?T('close'):T('next'))+'</button></div></div>';uiRoot.appendChild(el);}
  function headlessSteps(os){var repo='https://github.com/numbereself/caracAL',cmd='git clone '+repo+'.git\\ncd caracAL\\nnpm install',install=os==='windows'?'<p>Install Node.js and Git, then open PowerShell.</p><pre>'+cmd+'</pre>':os==='mac'?'<p>Install Node.js and Git, then open Terminal.</p><pre>'+cmd+'</pre>':'<p>Install Git + Node.js/npm in a terminal.</p><pre>'+cmd+'</pre>',env=os==='windows'?'$env:AIO_DASHBOARD_URL="YOUR_BOT_CONNECTION_URL"':"export AIO_DASHBOARD_URL='YOUR_BOT_CONNECTION_URL'";return ['<h3>Select operating system</h3><p>Choose the machine that will run Adventure Land without game graphics.</p>','<h3>1. Install prerequisites</h3>'+install,'<h3>2. Start caracAL once</h3><pre>node main.js</pre><p>Follow its account/character/server setup. Keep <code>config.js</code> and your session key private.</p>','<h3>3. Provide bot.js</h3><p>Place this AiO <code>bot.js</code> in caracAL\'s CODE folder and assign it to all four characters.</p>','<h3>4. Dashboard + party</h3><p>The GUI is not rendered headless, but party, combat, logs and dashboard continue to run.</p><pre>'+env+'</pre>','<h3>5. Start</h3><pre>node main.js</pre><p>The bot will discover the four running same-bot characters and then assemble one 4/4 party.</p>'];}
  function showHeadlessGuide(step){if(HEADLESS)return;S.headlessGuideOpen=true;S.headlessStep=step==null?0:step;var old=uiRoot.querySelector('.headless-guide');if(old)old.remove();var steps=headlessSteps(S.headlessOS),content=steps[S.headlessStep];if(S.headlessStep===0)content+='<div class="osgrid"><button class="osbtn '+(S.headlessOS==='windows'?'on':'')+'" data-os="windows">Windows</button><button class="osbtn '+(S.headlessOS==='linux'?'on':'')+'" data-os="linux">Linux</button><button class="osbtn '+(S.headlessOS==='mac'?'on':'')+'" data-os="mac">macOS</button></div>';var el=D.createElement('div');el.className='wizard headless-guide';el.innerHTML='<div class="modal"><div class="modaltop"><h2>'+esc(T('headless_title'))+'</h2><button class="close" data-action="head-close">×</button></div><div class="steps">Step '+(S.headlessStep+1)+' / '+steps.length+'</div>'+content+'<div class="navrow"><button class="btn" data-action="head-prev"'+(S.headlessStep===0?' disabled':'')+'>'+esc(T('back'))+'</button><button class="btn primary" data-action="'+(S.headlessStep===steps.length-1?'head-done':'head-next')+'">'+esc(S.headlessStep===steps.length-1?T('close'):T('next'))+'</button></div></div>';uiRoot.appendChild(el);}
  function uiClick(e){var t=e.target.closest('button');if(!t)return;if(t.dataset.open){openTool(t.dataset.open);return;}if(t.dataset.closeTool){closeTool(t.dataset.closeTool);return;}if(t.dataset.os){S.headlessOS=t.dataset.os;showHeadlessGuide(S.headlessStep);return;}if(t.dataset.log){exportLog(Number(t.dataset.start),Number(t.dataset.end),t.dataset.log);return;}var a=t.dataset.action;if(!a)return;if(a==='toggle-run'){pause();return;}if(a==='goal-now'){S.lastGoalCheck=0;chooseGoal();renderAll(true);return;}if(a==='dashboard-test'){S.lastDashboardPublish=0;dashboardPublishTick(true);return;}if(a==='dashboard-tutorial'){showDashboardTutorial(0);return;}if(a==='update-check'){S.update.checkedAt=0;updateCheckTick(true);return;}if(a==='update-apply'){selfUpdate();return;}if(a==='modal-close'){var ov=t.closest('.overlay');if(ov)ov.remove();return;}if(a==='dash-close'){var dg0=t.closest('.dashboard-guide');if(dg0)dg0.remove();S.dashboardTutorialOpen=false;return;}if(a==='dash-prev'){showDashboardTutorial(Math.max(0,S.dashboardTutorialStep-1));return;}if(a==='dash-next'){showDashboardTutorial(S.dashboardTutorialStep+1);return;}if(a==='dash-done'){var dg=t.closest('.dashboard-guide');if(dg)dg.remove();S.dashboardTutorialOpen=false;C.webDashboardTutorialSeen=true;saveConfig();return;}if(a==='head-close'){var hg0=t.closest('.headless-guide');if(hg0)hg0.remove();S.headlessGuideOpen=false;return;}if(a==='head-prev'){showHeadlessGuide(Math.max(0,S.headlessStep-1));return;}if(a==='head-next'){showHeadlessGuide(S.headlessStep+1);return;}if(a==='head-done'){var hg=t.closest('.headless-guide');if(hg)hg.remove();S.headlessGuideOpen=false;return;}}
  function parseControlValue(el){if(el.type==='checkbox')return !!el.checked;if(el.type==='number')return Number(el.value);return el.value;}
  function applyCfgControl(el){var key=el.dataset.cfg;if(!key)return;var before=C[key],v=parseControlValue(el);C[key]=v;C=cleanConfig(C);write('config',C);audit('config_change',key+' changed',{from:before,to:C[key]});if(key==='webDashboardEnabled'&&C[key]&&!before&&!C.webDashboardTutorialSeen)showDashboardTutorial(0);if(key==='language'||key==='theme'){applyAppearance();renderAll(true);}else renderMain();}
  function uiChange(e){var el=e.target;if(el.dataset&&el.dataset.cfg){applyCfgControl(el);return;}if(el.dataset&&el.dataset.skill){var id=el.dataset.skill;C.skills[me]=C.skills[me]||{};C.skills[me][id]=Object.assign({},C.skills[me][id]||{},{enabled:!!el.checked});write('config',C);audit('skill_config',id+' '+(el.checked?'enabled':'disabled'));return;}if(el.dataset&&el.dataset.bestMode!==undefined){S.bestiaryMode=el.value;renderTool('bestiary');}}
  function uiInput(e){var el=e.target;if(el.dataset&&el.dataset.bestSearch!==undefined){S.bestiarySearch=el.value;clearTimeout(S.bestSearchTimer);S.bestSearchTimer=P.setTimeout(function(){renderTool('bestiary');},120);return;}if(el.dataset&&el.dataset.cfg&&['text','url','number'].indexOf(el.type)>=0){clearTimeout(S.inputSaveTimer);S.inputSaveTimer=P.setTimeout(function(){applyCfgControl(el);},350);}}


  // ---------------------------------------------------------------------------
  // 2.7.3 Merchant Director, shared inventory knowledge, movement coalescing and dashboard diagnostics
  // ---------------------------------------------------------------------------
  function v273Name(id) { var d=(GD.items&&GD.items[id])||(GD.monsters&&GD.monsters[id])||{}; return d.name||id||'—'; }
  function v273InventoryReport() {
    return (character.items||[]).map(function(i,index){if(!i)return null;var p=itemProps(i)||{};return {slot:index,name:i.name,level:Number(i.level)||0,q:Number(i.q)||1,l:!!i.l,gift:!!i.gift,p:i.p||'',str:Number(p.str)||0,dex:Number(p.dex)||0,int:Number(p.int)||0,vit:Number(p.vit)||0,attack:Number(p.attack)||0,armor:Number(p.armor)||0,resistance:Number(p.resistance)||0,hp:Number(p.hp)||0,mp:Number(p.mp)||0};}).filter(Boolean);
  }
  function v273CompactSlots() { var o={};Object.keys(character.slots||{}).forEach(function(k){var i=character.slots[k];if(i)o[k]={name:i.name,level:Number(i.level)||0,p:i.p||'',l:!!i.l};});return o; }
  function v273RateStats() {
    var sec=Math.max(1,(clock()-S.session.started)/1000);return {xpGain:Math.max(0,S.session.xpGain),goldGain:Math.max(0,S.session.goldGain),xpPerHour:Math.round(Math.max(0,S.session.xpGain)*3600/sec),goldPerHour:Math.round(Math.max(0,S.session.goldGain)*3600/sec)};
  }
  function v273UpdateSessionRates() {
    var xp=Number(character.xp)||0,gold=Number(character.gold)||0,lv=Number(character.level)||0;
    if(lv===S.session.lastLevel&&xp>S.session.lastXP)S.session.xpGain+=xp-S.session.lastXP;
    else if(lv>S.session.lastLevel){var prevNeed=Number((GD.levels||[])[S.session.lastLevel])||0;if(prevNeed>S.session.lastXP)S.session.xpGain+=prevNeed-S.session.lastXP;S.session.xpGain+=Math.max(0,xp);}
    if(gold>S.session.lastGold)S.session.goldGain+=gold-S.session.lastGold;
    S.session.lastXP=xp;S.session.lastGold=gold;S.session.lastLevel=lv;
  }
  function v273GameVersion(){return safeString(GD.version==null?'unknown':GD.version,80);}
  function v273ExtractDropRows(node,out,chance,depth){
    out=out||[];chance=chance==null?1:chance;depth=depth||0;if(depth>8||node==null)return out;
    if(Array.isArray(node)){
      if(node.length>=2&&typeof node[0]==='number'&&typeof node[1]==='string'){out.push({name:node[1],chance:Math.max(0,Math.min(1,chance*Number(node[0]))),q:Number(node[2])||1});return out;}
      node.forEach(function(x){v273ExtractDropRows(x,out,chance,depth+1);});return out;
    }
    if(typeof node==='object'){
      if(typeof node.name==='string'||typeof node.item==='string'){out.push({name:node.name||node.item,chance:Math.max(0,Math.min(1,chance*(Number(node.chance)||1))),q:Number(node.q||node.quantity)||1});return out;}
      Object.keys(node).forEach(function(k){var v=node[k];if(k==='chance'||k==='q'||k==='quantity')return;v273ExtractDropRows(v,out,chance,depth+1);});
    }
    return out;
  }
  function v273BuildKnowledgeDB(force){
    var now=clock(),gv=v273GameVersion(),cached=S.knowledgeDB||read('knowledgeDB',null),ttl=C.merchantRecipeRefreshHours*3600000;
    if(!force&&cached&&cached.gameVersion===gv&&now-Number(cached.refreshedAt||0)<ttl){S.knowledgeDB=cached;return cached;}
    var recipes={};Object.keys(GD.craft||{}).forEach(function(id){var r=GD.craft[id]||{};if(!Array.isArray(r.items))return;recipes[id]={output:id,cost:Number(r.cost)||0,items:r.items.map(function(x){return {q:Number(x&&x[0])||1,name:x&&x[1],level:Number(x&&x[2])||0};}).filter(function(x){return x.name;})};});
    var drops={};var dm=GD.drops&&GD.drops.monsters||{};Object.keys(dm).forEach(function(mon){var rows=v273ExtractDropRows(dm[mon],[]);rows.forEach(function(row){if(!drops[row.name])drops[row.name]=[];drops[row.name].push({monster:mon,chance:row.chance,q:row.q});});});
    Object.keys(drops).forEach(function(k){drops[k].sort(function(a,b){return b.chance-a.chance;});});
    var spawns={};SPAWNS.forEach(function(sp){if(!spawns[sp.monster])spawns[sp.monster]=[];spawns[sp.monster].push(sp);});
    var db={schema:1,gameVersion:gv,refreshedAt:now,recipes:recipes,drops:drops,spawns:spawns,recipeCount:Object.keys(recipes).length,dropItemCount:Object.keys(drops).length,spawnCount:SPAWNS.length};S.knowledgeDB=db;write('knowledgeDB',db);audit('knowledge_refresh','Live knowledge database refreshed',{gameVersion:gv,recipes:db.recipeCount,dropItems:db.dropItemCount,spawns:db.spawnCount});return db;
  }
  function v273ClassCanUse(itemName,ctype){
    var d=GD.items&&GD.items[itemName]||{},ct=String(ctype||'').toLowerCase(),restr=d.class||d.classes;
    if(restr&&[].concat(restr).map(String).indexOf(ct)<0)return false;
    var wt=String(d.wtype||'').toLowerCase(),allowed={ranger:['bow','crossbow'],rogue:['dagger','claw','fist'],mage:['staff','wand'],priest:['staff','wand','mace'],warrior:['sword','axe','mace','hammer','spear','dagger'],paladin:['sword','mace','hammer','axe'],merchant:['staff','sword','dagger']};
    if(wt&&allowed[ct]&&allowed[ct].indexOf(wt)<0)return false;
    return true;
  }
  function v273GroupClasses(){var out={};farmerReports().forEach(function(r){if(r.ctype&&r.ctype!=='merchant')out[r.ctype]=true;});C.roster.forEach(function(n){var ct=characterType(n);if(ct&&ct!=='merchant')out[ct]=true;});if(character.ctype!=='merchant')out[character.ctype]=true;return Object.keys(out);}
  function v273ItemScoreForClass(itemLike,ctype){
    if(!itemLike||!itemLike.name||!v273ClassCanUse(itemLike.name,ctype))return -1e12;var d=GD.items&&GD.items[itemLike.name]||{},p=itemProps(itemLike)||d,stat=classStat(ctype),score=0;
    score+=(Number(p[stat])||0)*180;['attack','frequency','crit','critdamage','apiercing','rpiercing','armor','resistance','hp','mp','speed'].forEach(function(k){var w={attack:18,frequency:500,crit:15,critdamage:3,apiercing:1.2,rpiercing:1.2,armor:.35,resistance:.35,hp:.08,mp:.05,speed:1}[k]||1;score+=(Number(p[k])||0)*w;});score+=(Number(itemLike.level)||0)*45;return score;
  }
  function v273GroupUtility(itemLike){var cs=v273GroupClasses(),best=-1e12;cs.forEach(function(c){best=Math.max(best,v273ItemScoreForClass(itemLike,c));});return best;}
  function v273FarmerStrength(r){return (Number(r.attack)||0)*Math.max(.1,Number(r.frequency)||1)*10+(Number(r.max_hp)||0)*.12+(Number(r.armor)||0)*.7+(Number(r.resistance)||0)*.7+(Number(r.level)||0)*20;}
  function v273AggregateInventory(){
    var rows={},byChar={};peers(true).forEach(function(r){var inv=Array.isArray(r.inventory)?r.inventory:[];byChar[r.name]=inv;inv.forEach(function(i){if(!i||!i.name)return;rows[i.name]=rows[i.name]||{q:0,holders:{}};rows[i.name].q+=Number(i.q)||1;rows[i.name].holders[r.name]=(rows[i.name].holders[r.name]||0)+(Number(i.q)||1);});});return {items:rows,byChar:byChar};
  }
  function v273LocalMaterialCount(name){return qty(name);}
  function v273RecipeMissing(recipe,agg){return (recipe.items||[]).map(function(x){var have=(agg.items[x.name]&&agg.items[x.name].q)||0;return {name:x.name,required:x.q,have:have,missing:Math.max(0,x.q-have)};}).filter(function(x){return x.missing>0;});}
  function v273DropMonsterFor(itemName){var db=v273BuildKnowledgeDB(false),rows=(db.drops&&db.drops[itemName])||[];for(var i=0;i<rows.length;i++){if((db.spawns[rows[i].monster]||[]).length)return rows[i];}return null;}
  function v273GoalForMonster(mon){var opts=SPAWNS.filter(function(s){return s.monster===mon;});if(!opts.length)return null;var fs=farmerReports(),anchor=fs[0]||report(false);return opts.sort(function(a,b){var aa=(a.map===anchor.map?0:100000)+dist(anchor,a),bb=(b.map===anchor.map?0:100000)+dist(anchor,b);return aa-bb;})[0];}
  function v273GameCompoundMax(itemName){var d=GD.items&&GD.items[itemName]||{},g=Array.isArray(d.grades)?d.grades:[];var last=Number(g[3]);if(isFinite(last)&&last>0)return last;return 12;}
  function v273EffectiveCompoundMax(itemName){return Number(C.merchantCompoundMax)>0?Number(C.merchantCompoundMax):v273GameCompoundMax(itemName);}
  function v273ScrollName(prefix,item){var grade=0;try{if(typeof item_grade==='function')grade=Number(item_grade(item))||0;}catch(e){}return prefix+Math.max(0,Math.min(4,grade));}
  function v273EnsureScroll(prefix,item){var name=v273ScrollName(prefix,item),idx=slot(name);if(idx>=0)return idx;if(typeof buy==='function'&&GD.items&&GD.items[name]&&character.gold-Number(GD.items[name].g||0)>C.merchantBankGoldReserve){action('Scroll kaufen '+name,function(){return buy(name,1);},'buy-scroll:'+name,1800);}return -1;}
  function v273UpgradeTick(){
    if(character.ctype!=='merchant'||!C.merchantAutoUpgrade||typeof upgrade!=='function')return false;
    var best=null;(character.items||[]).forEach(function(it,i){if(!it||it.l||it.p||!GD.items[it.name]||!GD.items[it.name].upgrade)return;var lv=Number(it.level)||0;if(lv>=C.merchantUpgradeMax||v273GroupUtility(it)<0)return;var x={it:it,i:i,score:v273GroupUtility(it),lv:lv};if(!best||x.lv<best.lv||x.score>best.score)best=x;});if(!best)return false;
    var sc=v273EnsureScroll('scroll',best.it);if(sc<0)return true;S.status='Verbessere '+v273Name(best.it.name)+' auf +'+(best.lv+1);S.mode='Merchant · Upgrade';return action('Item verbessern '+best.it.name,function(){return upgrade(best.i,sc);},'merchant-upgrade',2600);
  }
  function v273CompoundTick(){
    if(character.ctype!=='merchant'||!C.merchantAutoCompound||typeof compound!=='function')return false;var groups={};
    (character.items||[]).forEach(function(it,i){if(!it||it.l||it.p||!GD.items[it.name]||!GD.items[it.name].compound||v273GroupUtility(it)<0)return;if(v273OwnedCount(it.name)-v273DesiredGroupCopies(it.name)<2)return;var lv=Number(it.level)||0;if(lv>=v273EffectiveCompoundMax(it.name))return;var key=it.name+'|'+lv;groups[key]=groups[key]||[];groups[key].push({it:it,i:i});});
    var keys=Object.keys(groups).filter(function(k){return groups[k].length>=3;}).sort(function(a,b){return Number(a.split('|')[1])-Number(b.split('|')[1]);});if(!keys.length)return false;var g=groups[keys[0]].slice(0,3),item=g[0].it,sc=v273EnsureScroll('cscroll',item);if(sc<0)return true;S.status='Kombiniere '+v273Name(item.name)+' +'+(Number(item.level)||0);S.mode='Merchant · Combine';return action('Items kombinieren '+item.name,function(){return compound(g[0].i,g[1].i,g[2].i,sc);},'merchant-compound',3200);
  }
  function v273OwnedCount(name){var total=0;peers(true).forEach(function(r){(r.inventory||[]).forEach(function(i){if(i&&i.name===name)total+=Number(i.q)||1;});Object.keys(r.slots||{}).forEach(function(k){var i=r.slots[k];if(i&&i.name===name)total+=1;});});return total;}
  function v273DesiredGroupCopies(name){var d=GD.items&&GD.items[name]||{},per=(d.type==='ring'||d.type==='earring')?2:1,n=0;C.roster.forEach(function(ch){var ct=characterType(ch);if(ct&&ct!=='merchant'&&v273ClassCanUse(name,ct))n+=per;});return Math.max(per,n);}
  function v273UsefulCraftTargets(){
    var db=v273BuildKnowledgeDB(false),explicit=csv(C.merchantCraftTargets),rows=[];Object.keys(db.recipes||{}).forEach(function(id){if(explicit.length&&explicit.indexOf(id)<0)return;var probe={name:id,level:0};var util=v273GroupUtility(probe);if(util<0)return;var r=db.recipes[id];if(!r.items||!r.items.length)return;var desired=v273DesiredGroupCopies(id),owned=v273OwnedCount(id);if(owned>=desired)return;rows.push({recipe:r,utility:util,desired:desired,owned:owned});});return rows.sort(function(a,b){return b.utility-a.utility||a.owned-b.owned;});
  }
  function v273ChooseCraftJob(){
    var rows=v273UsefulCraftTargets(),agg=v273AggregateInventory();if(!rows.length)return null;var explicit=csv(C.merchantCraftTargets);
    for(var i=0;i<rows.length;i++){var r=rows[i].recipe,missing=v273RecipeMissing(r,agg);if(explicit.length||missing.length<=2)return {recipe:r,missing:missing,agg:agg};}return null;
  }
  function v273PlanSteps(job,stage){
    var steps=[];if(job&&job.material){var mn=v273Name(job.monster),inm=v273Name(job.material.name);steps.push('Bekämpfe '+mn+' für '+inm+' ['+job.material.have+'/'+job.material.required+']');steps.push('Material von allen Farmern beim Merchant sammeln');steps.push('Fehlende Bank-Materialien holen');steps.push('Crafting: '+v273Name(job.recipe.output));steps.push('Ausrüstung bewerten und EXP-Farmziel neu wählen');}
    else if(job&&job.recipe){steps.push(stage||('Crafting vorbereiten: '+v273Name(job.recipe.output)));steps.push('Materialbestände aller 4 Charaktere abgleichen');steps.push('Crafting durchführen');steps.push('Ausrüstung fair an die Farmer verteilen');steps.push('Bestes EXP-Farmgebiet wählen');}
    else {steps=['Gruppeninventare und Ausrüstung analysieren','Upgrades / Combines für nützliche Items prüfen','Tränke, Gold und Bankbestand organisieren','Farmer-Stärke ausgleichen','Bestes EXP-Farmgebiet bestimmen'];}
    return steps.slice(0,5);
  }
  function v273SetMerchantPlan(plan){plan=plan||{};plan.at=clock();plan.steps=(plan.steps||v273PlanSteps(plan.job,plan.stage)).slice(0,5);S.merchantPlan=plan;write('merchantPlan',plan);return plan;}
  function v273MerchantReport(){var mn=merchantName();return mn?peerReport(mn):null;}
  function v273FarmOrder(){var mr=character.ctype==='merchant'?null:v273MerchantReport();return character.ctype==='merchant'&&S.merchantPlan?S.merchantPlan.farmOrder:(mr&&mr.merchantPlan&&mr.merchantPlan.farmOrder)||null;}
  function v273CurrentPlanSteps(){var mr=character.ctype==='merchant'?null:v273MerchantReport(),p=character.ctype==='merchant'?S.merchantPlan:(mr&&mr.merchantPlan)||S.merchantPlan;return p&&Array.isArray(p.steps)?p.steps.slice(0,5):[];}
  function canonicalLeader(){
    var mn=merchantName();if(C.merchantForceLeader&&mn)return mn;if(C.leader!=='auto'&&C.roster.indexOf(C.leader)>=0)return C.leader;if(mn)return mn;var f=C.roster.filter(function(n){return characterType(n)!=='merchant';}).sort();return f[0]||me;
  }
  function v273CombatAnchorName(){var tank=activeTankName();if(tank)return tank;var fs=farmerReports().slice().sort(function(a,b){return v273FarmerStrength(b)-v273FarmerStrength(a)||a.name.localeCompare(b.name);});return fs[0]&&fs[0].name||C.roster.filter(function(n){return characterType(n)!=='merchant';}).sort()[0]||me;}
  function v273CombatAnchorReport(){var n=v273CombatAnchorName();return n===me?report(false):peerReport(n);}
  function report(withRole){
    var p=pos(character)||{},rates=v273RateStats();var r={type:'aio27-report',protocol:REPORT_PROTOCOL,version:VERSION,name:me,ctype:character.ctype,level:character.level,at:clock(),map:character.map,x:p.x||0,y:p.y||0,hp:character.hp,max_hp:character.max_hp,mp:character.mp,max_mp:character.max_mp,attack:character.attack,frequency:character.frequency,armor:character.armor,resistance:character.resistance,range:character.range,speed:character.speed,damage_type:character.damage_type,slots:v273CompactSlots(),inventory:v273InventoryReport(),active:!!S.running,rip:!!character.rip,status:S.status,mode:S.mode,target:S.target,goal:S.goal,free:freeSlots(),gold:character.gold,hpot:qty(C.hpot),mpot:qty(C.mpot),xp:character.xp,xpPerHour:rates.xpPerHour,goldPerHour:rates.goldPerHour,merchantPlan:character.ctype==='merchant'?S.merchantPlan:null};if(withRole!==false){r.role=roleForName(me);r.primaryTank=roleSummary().primaryTank;}return r;
  }
  function v273GroupGoal(){var mr=v273MerchantReport();if(mr&&mr.merchantPlan&&mr.merchantPlan.farmGoal)return mr.merchantPlan.farmGoal;return mr&&mr.goal||null;}
  function v273GroupAutoGoal(){
    var fs=farmerReports();if(!fs.length)return autoGoal();var partyAttack=fs.reduce(function(n,r){return n+(Number(r.attack)||0)*Math.max(.1,Number(r.frequency)||1);},0),avgHP=fs.reduce(function(n,r){return n+(Number(r.max_hp)||0);},0)/fs.length,avgDef=fs.reduce(function(n,r){return n+(Number(r.armor)||0)+(Number(r.resistance)||0);},0)/fs.length;
    function scoreRows(requireStable){return SPAWNS.map(function(sp){var m=GD.monsters&&GD.monsters[sp.monster]||{},count=Math.max(1,Number(sp.count)||1);if(!m.hp||!m.xp||(requireStable&&count<C.autoFarmMinSpawnCount))return null;if(m.boss||m.cooperative||m.event||m.special)return null;var ttk=Number(m.hp)/Math.max(1,partyAttack),incoming=(Number(m.attack)||0)*Math.max(.2,Number(m.frequency)||.5),safety=Math.max(0,Math.min(1,(avgHP+avgDef*2)/(Math.max(1,incoming*12))));if(C.safety&&safety<C.risk/100)return null;var anchor=fs[0],tax=sp.map===anchor.map?1+dist(anchor,sp)/3500:1.32,pop=Math.min(1,count/6),rare=count>=3?1:count===2?.18:.04;return {spawn:sp,score:Number(m.xp)/Math.max(.15,ttk)/tax*(.5+.5*safety)*(.55+.45*pop)*rare};}).filter(Boolean).sort(function(a,b){return b.score-a.score;});}
    var avoid=v275FarmAvoidMap(),rows=scoreRows(true).filter(function(x){return !avoid[x.spawn.id];});return rows[0]&&rows[0].spawn||null;
  }
  function v275FarmAvoidMap(){var now=clock(),m=read('farmAvoid',{})||{},changed=false;Object.keys(m).forEach(function(k){if(Number(m[k]||0)<=now){delete m[k];changed=true;}});if(changed)write('farmAvoid',m);return m;}
  function v275MarkGoalEmpty(goal){if(!goal||!goal.id)return;var now=clock();if(now-(S.lastGoalEmptyMark||0)<5000)return;S.lastGoalEmptyMark=now;var m=v275FarmAvoidMap();m[goal.id]=now+180000;write('farmAvoid',m);audit('farm_replan','Farmziel ohne Monster vorübergehend gesperrt',{goal:goal,avoidMs:180000},'warning');}
  function v275VisibleFallbackTarget(ms){return (ms||mobs().filter(safeEnemy)).filter(function(m){var d=GD.monsters&&GD.monsters[m.mtype]||{};if(d.boss||d.cooperative||d.event||d.special)return false;return dist(character,m)<=Math.min(C.searchRadius,900);}).sort(function(a,b){var da=GD.monsters&&GD.monsters[a.mtype]||{},db=GD.monsters&&GD.monsters[b.mtype]||{};var sa=(Number(da.xp)||1)/Math.max(1,Number(a.hp)||Number(da.hp)||1),sb=(Number(db.xp)||1)/Math.max(1,Number(b.hp)||Number(db.hp)||1);return sb-sa||dist(character,a)-dist(character,b);})[0]||null;}
  function v273MerchantPlannerTick(){
    if(character.ctype!=='merchant'||!C.merchantPlannerEnabled)return null;var db=v273BuildKnowledgeDB(false),job=v273ChooseCraftJob(),plan={job:null,farmOrder:null,farmGoal:null,knowledge:{gameVersion:db.gameVersion,recipes:db.recipeCount,drops:db.dropItemCount,spawns:db.spawnCount}};
    if(C.merchantAutoCraft&&job){
      var miss=job.missing&&job.missing[0];if(miss){var dr=v273DropMonsterFor(miss.name),goal=dr&&v273GoalForMonster(dr.monster);if(dr&&goal){var total=job.agg.items[miss.name]&&job.agg.items[miss.name].q||0;plan.job={recipe:job.recipe,material:{name:miss.name,required:miss.required,have:total},monster:dr.monster};plan.farmOrder={item:miss.name,required:miss.required,have:total,monster:dr.monster};plan.farmGoal=goal;plan.steps=v273PlanSteps(plan.job);return v273SetMerchantPlan(plan);}}
      else {var collect=(job.recipe.items||[]).map(function(x){return {name:x.name,required:x.q,merchantHave:qty(x.name)};}).filter(function(x){return x.merchantHave<x.required;});plan.job={recipe:job.recipe};plan.collectOrder=collect;plan.steps=v273PlanSteps(plan.job,collect.length?'Alle Materialien vorhanden · beim Merchant sammeln':'Alle Materialien beim Merchant · Crafting starten');return v273SetMerchantPlan(plan);}
    }
    plan.farmGoal=v273GroupAutoGoal();plan.steps=v273PlanSteps(null);return v273SetMerchantPlan(plan);
  }
  function v273CollectRequestedMaterialsTick(){
    if(character.ctype==='merchant'||!C.merchantCollectLoot)return false;var mr=v273MerchantReport(),mn=merchantName(),lp=mn&&localPlayer(mn);if(!mr||!lp||dist(character,lp)>260)return false;var mp=mr.merchantPlan||{},names=[];if(mp.farmOrder&&mp.farmOrder.item)names.push(mp.farmOrder.item);(mp.collectOrder||[]).forEach(function(x){if(x&&x.name&&names.indexOf(x.name)<0)names.push(x.name);});for(var n=0;n<names.length;n++){var idx=slot(names[n]);if(idx>=0&&typeof send_item==='function')return action('Crafting-Material an Merchant: '+names[n],function(){return send_item(mn,idx,character.items[idx].q||1);},'material-to-merchant:'+names[n],1500);}return false;
  }
  function farmerLootTransferTick(){
    if(character.ctype==='merchant'||!C.merchantCollectLoot)return false;if(v273CollectRequestedMaterialsTick())return true;var mn=merchantName(),m=mn&&localPlayer(mn),mr=mn&&peerReport(mn);if(!m||!mr||dist(character,m)>260)return false;
    if(character.gold>C.merchantCollectGoldOver&&typeof send_gold==='function')return action('Gold an Merchant',function(){return send_gold(mn,Math.max(0,character.gold-C.merchantFarmerGoldReserve));},'loot-gold',2500);if(mr.free<2)return false;
    var idx=(character.items||[]).findIndex(function(i){if(!i||protectedStandItem(i)||isElixir(i)||i.name===C.hpot||i.name===C.mpot)return false;return true;});if(idx>=0&&typeof send_item==='function')return action('Loot/Ausrüstung an Merchant',function(){return send_item(mn,idx,character.items[idx].q||1);},'loot-item',1400);return false;
  }
  function v273CollectFromFarmersTick(){
    if(character.ctype!=='merchant'||!S.merchantPlan||!Array.isArray(S.merchantPlan.collectOrder)||!S.merchantPlan.collectOrder.length)return false;var wanted={};S.merchantPlan.collectOrder.forEach(function(x){if(x&&x.name)wanted[x.name]=true;});var holders=farmerReports().filter(function(r){return (r.inventory||[]).some(function(i){return i&&wanted[i.name]&&(Number(i.q)||1)>0;});}).sort(function(a,b){return dist(character,a)-dist(character,b);});if(!holders.length)return false;var h=holders[0],lp=localPlayer(h.name);if(lp&&dist(character,lp)<=250){S.status='Material von '+h.name+' übernehmen';S.mode='Merchant · Sammeln';return false;}S.status='Material bei '+h.name+' abholen';S.mode='Merchant · Sammeln';return moveToGoal(h,'Material beim Farmer abholen',{kind:'collect',tolerance:90,forceAfter:6500});
  }
  function v273RetrieveMaterialFromBankTick(recipe){
    if(character.ctype!=='merchant'||!C.merchantManageBank||!recipe)return false;var needed=(recipe.items||[]).filter(function(x){return v273LocalMaterialCount(x.name)<x.q;});if(!needed.length)return false;
    if(!character.bank){S.status='Bank prüfen für Crafting-Material';S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},'Bank prüfen',{kind:'bank',forceAfter:7000});}
    for(var ni=0;ni<needed.length;ni++){var need=needed[ni];for(var pack in character.bank){if(!/^items\d+$/.test(pack)||!Array.isArray(character.bank[pack]))continue;for(var j=0;j<character.bank[pack].length;j++){var it=character.bank[pack][j];if(it&&it.name===need.name&&typeof bank_retrieve==='function'){S.status='Hole '+v273Name(need.name)+' aus der Bank';return action('Bank-Material holen '+need.name,function(){return bank_retrieve(pack,j);},'bank-retrieve:'+need.name,1800);}}}}
    return false;
  }
  function v273BankCapacity(){if(!character.bank)return null;var free=0,total=0;Object.keys(character.bank).forEach(function(k){if(!/^items\d+$/.test(k)||!Array.isArray(character.bank[k]))return;character.bank[k].forEach(function(i){total++;if(!i)free++;});});return {free:free,total:total};}
  function v273OpenBankPackTick(){
    if(character.ctype!=='merchant'||!C.merchantAutoUnlockBank||!character.bank||typeof open_bank_pack!=='function')return false;var cap=v273BankCapacity();if(!cap||cap.free>0)return false;var candidates=Object.keys(GD.npcs||{}).filter(function(k){return /^items\d+$/.test(k)&&!character.bank[k];}).sort(function(a,b){return Number(a.slice(5))-Number(b.slice(5));});if(!candidates.length){S.bankFull=true;return false;}var pack=candidates[0];S.status='Bankplatz freischalten: '+pack;S.mode='Merchant · Bank';if(S.bankUnlockReady!==pack){if(S.bankUnlockTarget===pack&&clock()-(S.bankUnlockTravelAt||0)<12000)return true;S.bankUnlockTarget=pack;S.bankUnlockTravelAt=clock();if(typeof smart_move==='function'){action('Zum Bank-Schalter '+pack,function(){return Promise.resolve(smart_move(pack)).then(function(v){S.bankUnlockReady=pack;return v;});},'bank-teller:'+pack,7000);return true;}return false;}var currency=(C.merchantAllowShellBankUnlock&&character.gold<=C.merchantBankGoldReserve)?'shells':'gold';return action('Bankpack öffnen '+pack+' ('+currency+')',function(){return Promise.resolve(open_bank_pack(pack,currency)).then(function(v){S.bankUnlockReady=null;S.bankUnlockTarget=null;return v;});},'bank-open:'+pack,15000);
  }
  function v273StoreTrashBankTick(){
    if(character.ctype!=='merchant'||!C.merchantManageBank||freeSlots()>C.merchantInventoryReserve)return false;if(!character.bank){S.status='Inventar organisieren · zur Bank';S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},'Bank organisieren',{kind:'bank',forceAfter:7000});}
    var cap=v273BankCapacity();if(cap&&cap.free<=0){S.bankFull=true;return v273OpenBankPackTick();}var idx=(character.items||[]).findIndex(function(it){if(!it||it.l||it.p||isElixir(it)||it.name===C.hpot||it.name===C.mpot||/^c?scroll[0-4]$/.test(String(it.name||'')))return false;var d=GD.items&&GD.items[it.name]||{};var required=S.merchantPlan&&S.merchantPlan.farmOrder&&S.merchantPlan.farmOrder.item===it.name;if(required)return false;return v273GroupUtility(it)<0||(!d.upgrade&&!d.compound&&!d.e&&!d.exchange&&!d.exchanges);});if(idx>=0&&typeof bank_store==='function')return action('Item in Bank lagern '+character.items[idx].name,function(){return bank_store(idx);},'bank-store',1300);return false;
  }
  function v273SellTrashTick(){
    if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc||!S.bankFull||typeof sell!=='function')return false;var idx=-1,best=Infinity;(character.items||[]).forEach(function(it,i){if(!it||it.l||it.p||protectedStandItem(it)||isElixir(it)||it.name===C.hpot||it.name===C.mpot)return;var id=GD.items&&GD.items[it.name]||{},surplusNonCompound=(Number(it.level)||0)>=4&&!id.compound&&v273OwnedCount(it.name)>v273DesiredGroupCopies(it.name);if(v273GroupUtility(it)>=0&&!surplusNonCompound)return;var v=itemValueSafe(it);if(v<best){best=v;idx=i;}});if(idx<0)return false;S.status='Bank voll · minderwertiges Item verkaufen';S.mode='Merchant · NPC';return action('Minderwertiges Item verkaufen '+character.items[idx].name,function(){return sell(idx,character.items[idx].q||1);},'merchant-trash-sell',1800);
  }
  function v273ExchangeTick(){
    if(character.ctype!=='merchant'||!C.merchantAutoExchange||typeof exchange!=='function')return false;var idx=(character.items||[]).findIndex(function(it){if(!it||it.l||it.p)return false;var d=GD.items&&GD.items[it.name]||{};return !!(d.e||d.exchange||d.exchanges);});if(idx<0)return false;var it=character.items[idx],d=GD.items[it.name]||{},need=Number(d.e)||Number(d.exchange)||1;if((Number(it.q)||1)<need)return false;S.status='Belohnungs-Item eintauschen: '+v273Name(it.name);S.mode='Merchant · Exchange';return action('Item eintauschen '+it.name,function(){return exchange(idx);},'merchant-exchange:'+it.name,3500);
  }
  function v273EquipSlotsForItem(name){var d=GD.items&&GD.items[name]||{},t=d.type;if(t==='weapon')return ['mainhand'];if(['offhand','shield','source','quiver'].indexOf(t)>=0)return ['offhand'];if(t==='ring')return ['ring1','ring2'];if(t==='earring')return ['earring1','earring2'];if(['helmet','chest','pants','gloves','shoes','cape','amulet','belt','orb'].indexOf(t)>=0)return [t];return [];}
  function v273BestGearRecipient(){
    if(character.ctype!=='merchant'||!C.merchantBalanceFarmers)return null;var fs=farmerReports().slice().sort(function(a,b){return v273FarmerStrength(a)-v273FarmerStrength(b)||a.name.localeCompare(b.name);});for(var fi=0;fi<fs.length;fi++){var r=fs[fi],lp=localPlayer(r.name);if(!lp||dist(character,lp)>260||r.free<1)continue;for(var i=0;i<(character.items||[]).length;i++){var it=character.items[i];if(!it||it.l||it.p||!v273ClassCanUse(it.name,r.ctype))continue;var d=GD.items[it.name]||{},slots=v273EquipSlotsForItem(it.name);if(!slots.length)continue;var candidate=v273ItemScoreForClass(it,r.ctype),scores=slots.map(function(k){var si=r.slots&&r.slots[k];return si?v273ItemScoreForClass(si,r.ctype):-1e12;}),current=Math.min.apply(Math,scores);if(current<-1e11||candidate>current+Math.max(20,Math.abs(current)*.04))return {farmer:r,index:i,item:it,candidate:candidate,current:current};}}return null;
  }
  function v273DistributeGearTick(){var x=v273BestGearRecipient();if(!x||typeof send_item!=='function')return false;S.status='Bessere Ausrüstung an '+x.farmer.name+': '+v273Name(x.item.name);S.mode='Merchant · Ausrüstung';return action('Ausrüstung verteilen '+x.item.name,function(){return send_item(x.farmer.name,x.index,x.item.q||1);},'gear-send:'+x.farmer.name,2200);}
  function merchantSupplyTick(){
    if(character.ctype!=='merchant'||!C.merchantSupply)return false;var fs=farmerReports().sort(function(a,b){return Math.min(a.hpot/Math.max(1,C.merchantRestockHPAt),a.mpot/Math.max(1,C.merchantRestockMPAt))-Math.min(b.hpot/Math.max(1,C.merchantRestockHPAt),b.mpot/Math.max(1,C.merchantRestockMPAt));});
    for(var i=0;i<fs.length;i++){var r=fs[i],lp=localPlayer(r.name);if(!lp||dist(character,lp)>260)continue;var needH=Math.max(0,C.merchantFarmerHPStock-(Number(r.hpot)||0)),needM=Math.max(0,C.merchantFarmerMPStock-(Number(r.mpot)||0));if((Number(r.hpot)||0)<=C.merchantRestockHPAt&&needH>0&&qty(C.hpot)>80&&r.free>0){var hi=slot(C.hpot),hq=Math.min(needH,qty(C.hpot)-80);if(hi>=0&&hq>0)return action('HP-Tränke liefern '+r.name,function(){return send_item(r.name,hi,hq);},'supply-hp:'+r.name,1400);}if((Number(r.mpot)||0)<=C.merchantRestockMPAt&&needM>0&&qty(C.mpot)>80&&r.free>0){var mi=slot(C.mpot),mq=Math.min(needM,qty(C.mpot)-80);if(mi>=0&&mq>0)return action('MP-Tränke liefern '+r.name,function(){return send_item(r.name,mi,mq);},'supply-mp:'+r.name,1400);}}
    return false;
  }
  function v273CraftTick(){
    if(character.ctype!=='merchant'||!C.merchantAutoCraft||!S.merchantPlan||!S.merchantPlan.job||!S.merchantPlan.job.recipe)return false;var recipe=S.merchantPlan.job.recipe,localMissing=(recipe.items||[]).filter(function(x){return qty(x.name)<x.q;});if(S.merchantPlan.collectOrder&&S.merchantPlan.collectOrder.length&&localMissing.length){S.status='Warte auf Materialübergabe: '+v273Name(localMissing[0].name);S.mode='Merchant · Sammeln';return false;}if(v273RetrieveMaterialFromBankTick(recipe))return true;localMissing=(recipe.items||[]).filter(function(x){return v278LocalMaterialCount(x.name,x.level)<x.q;});if(localMissing.length){S.status='Warte auf Crafting-Material: '+v273Name(localMissing[0].name);S.mode='Merchant · Material';return false;}if(character.gold<Number(recipe.cost||0))return false;if(typeof auto_craft==='function'){S.status='Crafte '+v273Name(recipe.output);S.mode='Merchant · Crafting';return action('Crafting '+recipe.output,function(){return auto_craft(recipe.output);},'merchant-craft:'+recipe.output,3500);}return false;
  }
  function merchantTick(){
    if(clock()>(S.times.knowledgeRefresh||0)){S.times.knowledgeRefresh=clock()+60000;v273BuildKnowledgeDB(false);}if(clock()>(S.times.merchantPlan||0)){S.times.merchantPlan=clock()+4000;v273MerchantPlannerTick();}
    if(v273CollectFromFarmersTick())return;if(v273CraftTick())return;if(v273UpgradeTick())return;if(v273CompoundTick())return;if(v273DistributeGearTick())return;if(v273ExchangeTick())return;if(merchantSupplyTick())return;if(v273StoreTrashBankTick())return;if(v273SellTrashTick())return;if(elixirCraftUpgradeTick())return;if(deliverElixirTick())return;if(merchantStandTick())return;
    S.status=S.merchantPlan&&S.merchantPlan.steps&&S.merchantPlan.steps[0]||'Logistik planen';S.mode='Merchant · Leiter';
  }
  function moveToGoal(g,why,opts){
    opts=opts||{};if(!g)return false;var now=clock(),kind=opts.kind||String(why||'move'),target={map:g.map||character.map,x:Math.round(Number(g.x)||0),y:Math.round(Number(g.y)||0)};var old=S.moveDestination,tol=Number(opts.tolerance)||(kind.indexOf('follow')>=0?150:70),same=old&&old.map===target.map&&Math.hypot(old.x-target.x,old.y-target.y)<=tol,forceAfter=Number(opts.forceAfter)||5000;
    if(S.moveInFlight&&same&&now-S.moveRequestedAt<forceAfter)return true;if(S.moveInFlight&&!same&&now-S.moveRequestedAt<1200)return true;
    if(target.map===character.map&&dist(character,target)<340&&typeof move==='function'){try{if(typeof can_move_to!=='function'||can_move_to(target.x,target.y)){S.moveDestination=target;S.moveRequestedAt=now;S.lastMoveAt=now;move(target.x,target.y);return true;}}catch(e){}
    }
    if(typeof smart_move!=='function')return false;S.moveInFlight=true;S.moveKind=kind;S.moveDestination=target;S.moveRequestedAt=now;S.moveStarted=now;S.lastMoveAt=now;var seq=++S.moveSeq;audit('move',why||'smart_move',target);
    try{Promise.resolve(smart_move(g)).then(function(){if(seq!==S.moveSeq)return;S.moveInFlight=false;S.moveGoal=null;audit('move_done','Ziel erreicht',target);},function(e){if(seq!==S.moveSeq)return;S.moveInFlight=false;S.moveGoal=null;var msg=reason(e);if(msg!=='interrupted')audit('move_error',msg,target,'warning');});return true;}catch(e){S.moveInFlight=false;return false;}
  }
  function farmerTick(){
    if(applyDeliveredElixirTick())return;var role=roleForName(me),order=v273FarmOrder(),groupGoal=v273GroupGoal();if(groupGoal)S.goal=groupGoal;
    if(ratio(character,'hp')<C.retreatHP/100){S.status='Erholung / Sicherheit';S.mode='Erholung';S.target=null;if(S.goal)moveToGoal(S.goal,'Sicherheitsrückzug',{kind:'retreat'});return;}
    if(clock()-(S.lastGoalCheck||0)>(S.goal?30000:8000)){S.lastGoalCheck=clock();if(!groupGoal)chooseGoal();}
    var goalDistance=S.goal&&character.map===S.goal.map?dist(character,S.goal):Infinity,traveling=!!(S.goal&&(character.map!==S.goal.map||goalDistance>Math.max(220,C.followDistance*1.6)));
    if(traveling){S.target=null;if(order){S.status='Zum Materialziel: '+v273Name(order.monster)+' für '+v273Name(order.item)+' ['+order.have+'/'+order.required+']';S.mode='Material-Anreise';}else{S.status='Zum gemeinsamen Farmgebiet: '+v273Name(S.goal.monster);S.mode='Farm-Anreise';}moveToGoal(S.goal,'Gemeinsames Farmziel',{kind:'farm',forceAfter:9000,tolerance:150});return;}
    var ar=v273CombatAnchorReport();if(ar&&ar.name!==me&&ar.map===character.map&&dist(character,ar)>C.followDistance*2.5){S.status='Zur Kampfgruppe aufschließen';S.mode='Folgen';moveToGoal(ar,'Kampfgruppe folgen',{kind:'follow',tolerance:170,forceAfter:5500});return;}
    if(role==='healer'&&!healerCanDamage()){S.target=null;S.status='Heilbereitschaft';S.mode='Heilen';var tr=activeTankReport()||ar;if(tr&&tr.map===character.map&&dist(character,tr)>C.followDistance*1.35)moveToGoal(tr,'Heiler folgt Kampfanker',{kind:'follow',tolerance:140});return;}
    if(role==='tank'&&tankAggroTick())return;var pullTank=activeTankReport();if((role==='dps'||role==='healer')&&pullTank&&pullTank.name!==me&&pullTank.map===character.map&&dist(character,pullTank)<=C.followDistance*2.2&&!pullTank.target&&!partyThreats().length){S.target=null;S.status='Warte auf Tank-Pull';S.mode=role==='healer'?'Heilen':'Damage';return;}
    var t=targetForCombat();if(!t){S.target=null;if(order){S.status='Bekämpfe '+v273Name(order.monster)+' für '+v273Name(order.item)+' ['+order.have+'/'+order.required+']';S.mode='Material-Farm';}else{if(S.goal&&!S.goalEmptySince)S.goalEmptySince=clock();if(S.goal&&S.goalEmptySince&&clock()-S.goalEmptySince>=C.goalEmptyReplanSeconds*1000){v275MarkGoalEmpty(S.goal);S.lastGoalCheck=0;}S.status=S.goal?'Zielgebiet erreicht · suche '+v273Name(S.goal.monster):'Warte auf Merchant-Farmziel';S.mode='Farmen';}return;}else S.goalEmptySince=0;
    S.target=targetID(t);var mobName=v273Name(t.mtype);S.status=order?'Bekämpfe '+mobName+' für '+v273Name(order.item)+' ['+order.have+'/'+order.required+']':(role==='tank'?'Tanken: ':role==='healer'?'Sicherer Schaden: ':'Schaden: ')+mobName;S.mode=order?'Material-Farm':role==='tank'?'Tanken':role==='healer'?'Heilen / Schaden':'Damage';
    var kiting=role==='dps'&&kiteThreatTick(),inRange=true;try{if(typeof is_in_range==='function')inRange=!!is_in_range(t);}catch(e){}if(!inRange){if(kiting)return;moveToGoal(t,role==='tank'?'Tank in Angriffsreichweite':'In Angriffsreichweite',{kind:'combat',forceAfter:2000,tolerance:50});return;}if(offensiveSkillTick(t))return;try{if(typeof can_attack==='function'&&can_attack(t)&&character.mp>=(character.mp_cost||0))action(role==='tank'?'Tank-Basisangriff':'Basisangriff',function(){return attack(t);},role==='tank'?'tank-basic':'attack',Math.max(80,420/Math.max(.2,character.frequency||1)));}catch(e){}
  }
  function v275DashboardAckUrl(endpoint,payload){try{var u=new URL(endpoint);u.searchParams.set('api','ackimg');u.searchParams.set('name',me);u.searchParams.set('after',String(Number(payload.updatedAt)||0));u.searchParams.set('_',String(clock())+Math.random().toString(36).slice(2));return u.toString();}catch(e){return '';} }
  function v275DashboardAckImage(endpoint,payload,timeout){return new Promise(function(resolve,reject){if(!D||!D.body)return reject(Error('DOM unavailable'));var url=v275DashboardAckUrl(endpoint,payload);if(!url)return reject(Error('Invalid dashboard acknowledgement URL'));var img=D.createElement('img'),done=false,timer=P.setTimeout(function(){finish(false,'dashboard acknowledgement timeout');},timeout||5000);function finish(ok,msg){if(done)return;done=true;try{P.clearTimeout(timer);}catch(e){}try{img.remove();}catch(e){}if(ok)resolve(true);else reject(Error(msg||'dashboard acknowledgement failed'));}img.style.display='none';img.width=1;img.height=1;img.onload=function(){finish(true);};img.onerror=function(){finish(false,'dashboard acknowledgement failed');};D.body.appendChild(img);img.src=url;});}
  function v275BeaconPush(endpoint,payload){try{var nav=P.navigator||navigator;if(!nav||typeof nav.sendBeacon!=='function')return false;var B=P.Blob||(typeof Blob!=='undefined'?Blob:null);if(!B)return false;var body=new B([JSON.stringify(payload)],{type:'text/plain;charset=UTF-8'});return !!nav.sendBeacon(endpoint,body);}catch(e){return false;}}
  function v275NoCorsPush(endpoint,payload){var f=typeof fetch==='function'?fetch:(P.fetch?P.fetch.bind(P):null);if(!f)return Promise.reject(Error('fetch unavailable'));return Promise.resolve(f(endpoint,{method:'POST',mode:'no-cors',credentials:'omit',cache:'no-store',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload)}));}
  function v275DashboardPost(endpoint,payload){var beacon=v275BeaconPush(endpoint,payload);if(beacon)return Promise.resolve('beacon');return v275NoCorsPush(endpoint,payload).then(function(){return 'no-cors/post';}).catch(function(e){if(dashboardFormFallback(endpoint,payload))return 'form/post';throw e;});}
  function v275DashboardFramePush(endpoint,payload){return new Promise(function(resolve,reject){if(!D||!D.body||!P.addEventListener)return reject(Error('Frame bridge unavailable'));var token='a'+clock().toString(36)+Math.random().toString(36).slice(2,12),frame=D.createElement('iframe'),form=D.createElement('form'),input=D.createElement('input'),done=false,timer=P.setTimeout(function(){finish(false,'frame acknowledgement timeout');},6500);function finish(ok,msg){if(done)return;done=true;try{P.clearTimeout(timer);}catch(e){}try{P.removeEventListener('message',onmsg,false);}catch(e){}try{form.remove();frame.remove();}catch(e){}if(ok)resolve('frame/post-message');else reject(Error(msg||'frame acknowledgement failed'));}function onmsg(ev){try{if(ev.source!==frame.contentWindow)return;var d=ev.data||{};if(d.type!=='aio-dashboard-ack'||d.token!==token)return;if(d.ok===true&&(!d.name||d.name===me))finish(true);else finish(false,d.error||'server rejected dashboard status');}catch(e){}}try{var u=new URL(endpoint);u.searchParams.set('api','pushframe');u.searchParams.set('ack',token);frame.name='aio275-dashboard-'+token;frame.style.display='none';form.method='POST';form.action=u.toString();form.target=frame.name;form.style.display='none';input.type='hidden';input.name='status';input.value=JSON.stringify(payload);form.appendChild(input);P.addEventListener('message',onmsg,false);D.body.appendChild(frame);D.body.appendChild(form);P.setTimeout(function(){try{form.submit();}catch(e){finish(false,reason(e));}},50);}catch(e){finish(false,reason(e));}});}
  function dashboardPublishTick(force){
    if((!C.webDashboardEnabled&&!force)||S.dashboardSending)return false;var original=String(C.webDashboardConnectionUrl||'').trim(),endpoint=normalizeDashboardEndpoint(original);if(!endpoint){S.dashboardLastError='Invalid dashboard URL';S.dashboardFailAt=clock();return false;}if(!force&&clock()-S.lastDashboardPublish<C.webDashboardIntervalSeconds*1000)return false;S.lastDashboardPublish=clock();var payload=dashboardPayload();S.dashboardSending=true;audit('dashboard_send','Dashboard status send',{endpointHost:endpoint.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'),payload:payload});
    v275DashboardPost(endpoint,payload).then(function(transport){S.dashboardTransport=transport+' + ack';return new Promise(function(r){P.setTimeout(r,450);}).then(function(){return v275DashboardAckImage(endpoint,payload,5000);});}).catch(function(first){audit('dashboard_retry','Short image ACK failed; trying POST message bridge',{error:reason(first)},'warning');return v275DashboardFramePush(endpoint,payload).then(function(transport){S.dashboardTransport=transport;return true;});}).then(function(){S.dashboardProbe={ok:true,at:clock(),error:'',host:'post-ack'};S.dashboardLastOK=clock();S.dashboardLastAck=clock();S.dashboardFailAt=0;S.dashboardLastError='';S.dashboardAckName=me;audit('dashboard_ack','Dashboard confirmed POST status',{name:me,transport:S.dashboardTransport});}).catch(function(e){S.dashboardProbe={ok:false,at:clock(),error:reason(e)};S.dashboardFailAt=clock();S.dashboardLastError=reason(e);audit('dashboard_error','Dashboard POST/ACK failed: '+reason(e),{transport:S.dashboardTransport},'error');if(S.dashboardTransport.indexOf('form')<0&&dashboardFormFallback(endpoint,payload))audit('dashboard_fallback','Fallback form POST submitted after ACK failure',{error:reason(e)},'warning');}).finally(function(){S.dashboardSending=false;renderAll(true);});return true;
  }
  function dashboardPayload(){var p=pos(character)||{},realm=currentRealm(),ps=partyState(),rs=roleSummary(),rate=v273RateStats(),xpNeed=Number((GD.levels||[])[character.level])||0,xpPct=xpNeed?Math.max(0,Math.min(100,100*Number(character.xp||0)/xpNeed)):0,eta=rate.xpPerHour>0&&xpNeed>character.xp?Math.round((xpNeed-character.xp)/rate.xpPerHour*3600):null;return {type:'aio-bot-status',version:4,botVersion:VERSION,language:C.language||'en',name:me,ctype:character.ctype,role:roleForName(me),roles:rs,level:character.level,hp:character.hp,maxHp:character.max_hp,hpPct:Math.round(ratio(character,'hp')*1000)/10,mp:character.mp,maxMp:character.max_mp,mpPct:Math.round(ratio(character,'mp')*1000)/10,xp:character.xp,xpPct:Math.round(xpPct*10)/10,xpPerHour:rate.xpPerHour,goldPerHour:rate.goldPerHour,levelEtaSeconds:eta,task:safeString(S.status,500),taskCode:safeString(S.mode,80),mode:safeString(S.mode,120),active:!!S.running,rip:!!character.rip,map:character.map,x:Number(p.x)||0,y:Number(p.y)||0,mapBounds:dashboardMapBounds(),server:realm,party:ps,merchantPlan:S.merchantPlan||null,alerts:dashboardAlerts(),lastXpAt:S.lastXPAt,lastKillAt:S.lastKillAt,lastMoveAt:S.lastMoveAt,lastActionAt:S.lastActionAt,lastAction:safeString(S.lastAction,150),updatedAt:clock()};}
  function characterHTML(){var ps=partyState(),rate=v273RateStats(),steps=v273CurrentPlanSteps(),order=v273FarmOrder(),xpNeed=Number((GD.levels||[])[character.level])||0,xpPct=xpNeed?Math.round(1000*Number(character.xp||0)/xpNeed)/10:0,eta=rate.xpPerHour>0&&xpNeed>character.xp?(xpNeed-character.xp)/rate.xpPerHour*3600:null;function fmtEta(v){if(!isFinite(v)||v==null)return '—';var h=Math.floor(v/3600),m=Math.floor((v%3600)/60);return (h?h+'h ':'')+m+'m';}return '<h2>'+esc(T('character'))+'</h2><div class="card"><div class="line"><strong>'+esc(me)+'</strong><span class="tag">'+esc(character.ctype)+' · Lv. '+character.level+'</span></div><div class="muted">'+esc(character.map)+' · X '+Math.round(character.x||0)+' · Y '+Math.round(character.y||0)+'</div><p>HP '+character.hp+' / '+character.max_hp+'</p><div class="bar hp"><i style="width:'+Math.round(ratio(character,'hp')*100)+'%"></i></div><p>MP '+character.mp+' / '+character.max_mp+'</p><div class="bar mp"><i style="width:'+Math.round(ratio(character,'mp')*100)+'%"></i></div><div class="dbstats"><div>XP<b>'+xpPct+'%</b></div><div>EXP/h<b>'+rate.xpPerHour.toLocaleString()+'</b></div><div>Gold/h<b>'+rate.goldPerHour.toLocaleString()+'</b></div></div><div class="line"><span>Zeit bis Level-up</span><strong>'+fmtEta(eta)+'</strong></div></div><div class="card"><div class="line"><span>Aufgabe</span><strong>'+esc(S.status)+'</strong></div><div class="line"><span>Modus</span><span>'+esc(S.mode)+'</span></div><div class="line"><span>Party</span><span class="'+(ps.complete?'good':'bad')+'">'+(ps.complete?'4/4':ps.members.length+'/'+Math.max(4,ps.expected.length))+'</span></div>'+(order?'<div class="material">'+esc('Materialauftrag: '+v273Name(order.item)+' '+order.have+'/'+order.required)+'</div>':'')+'</div><div class="card"><h3>Plan · aktuell + nächste 4</h3><div class="planlist">'+(steps.length?steps.map(function(x,i){return '<div class="planstep '+(i===0?'current':'')+'"><b>'+(i+1)+'</b><span>'+esc(x)+'</span></div>';}).join(''):'<div class="muted">Noch kein Merchant-Plan empfangen.</div>')+'</div></div>';}
  function merchantHTML(){var fs=farmerReports(),db=v273BuildKnowledgeDB(false),agg=v273AggregateInventory(),p=S.merchantPlan||{};return '<h2>Merchant Einstellungen</h2><div class="notice"><b>Merchant = Gruppenleiter und Logistikplaner.</b> Materialaufträge haben Vorrang vor normalem EXP-Farming. Rezepte/Spawns/Drops werden aus den aktuell geladenen G-Daten gespiegelt.</div>'+cfgField('merchantForceLeader','Merchant als Party-Leiter','check')+cfgField('merchantPlannerEnabled','Merchant-Planer aktiv','check')+cfgField('merchantAutoCraft','Automatisch craften','check')+cfgField('merchantCraftTargets','Bevorzugte Craft-Item-IDs','text','Leer = automatisch nützliche Rezepte auswählen; Komma-getrennt.')+cfgField('merchantAutoUpgrade','Nützliche Items automatisch verbessern','check')+cfgField('merchantUpgradeMax','Upgrade-Obergrenze +','number','Standard +4.')+cfgField('merchantAutoCompound','Nützliche Items automatisch kombinieren','check')+cfgField('merchantCompoundMax','Combine-Obergrenze','number','0 = live aus dem maximalen Spielpfad/Exalted-Grenzwert ableiten.')+cfgField('merchantManageBank','Bank automatisch verwalten','check')+cfgField('merchantAutoUnlockBank','Bei voller Bank neue Packs freischalten','check')+cfgField('merchantAllowShellBankUnlock','Shells für Bankplätze erlauben','check','Standard AUS; Gold wird bevorzugt.')+cfgField('merchantBankGoldReserve','Goldreserve des Merchant','number')+cfgField('merchantSellTrashToNpc','Bei voller Bank minderwertige Items an NPC verkaufen','check')+cfgField('merchantAutoExchange','Eintauschbare Belohnungsitems automatisch einlösen','check')+cfgField('merchantBalanceFarmers','Bessere Ausrüstung fair an schwächste geeignete Farmer geben','check')+cfgField('merchantCollectGoldOver','Farmer senden Gold oberhalb','number')+cfgField('merchantFarmerGoldReserve','Goldreserve je Farmer','number')+cfgField('merchantFarmerHPStock','HP-Tränke Zielbestand je Farmer','number')+cfgField('merchantFarmerMPStock','MP-Tränke Zielbestand je Farmer','number')+cfgField('merchantRestockHPAt','HP-Tränke nachfüllen ab','number')+cfgField('merchantRestockMPAt','MP-Tränke nachfüllen ab','number')+'<div class="card"><h3>Live-Datenbank</h3><div class="dbstats"><div>Rezepte<b>'+db.recipeCount+'</b></div><div>Drop-Items<b>'+db.dropItemCount+'</b></div><div>Spawns<b>'+db.spawnCount+'</b></div></div><div class="muted">G.version '+esc(db.gameVersion)+' · '+new Date(db.refreshedAt).toLocaleString()+'</div></div><div class="card"><h3>Aktueller Plan</h3>'+(p.steps||[]).map(function(x,i){return '<div class="line"><span>'+(i===0?'Jetzt':'+'+i)+'</span><strong>'+esc(x)+'</strong></div>';}).join('')+'</div><h3>Farmer · schwächster zuerst</h3><table><thead><tr><th>Name</th><th>Klasse</th><th>Stat</th><th>Stärke</th></tr></thead><tbody>'+fs.slice().sort(function(a,b){return v273FarmerStrength(a)-v273FarmerStrength(b);}).map(function(r){return '<tr><td>'+esc(r.name)+'</td><td>'+esc(r.ctype)+'</td><td>'+classStat(r.ctype).toUpperCase()+'</td><td>'+Math.round(v273FarmerStrength(r))+'</td></tr>';}).join('')+'</tbody></table><div class="muted">Geteilte Inventare: '+Object.keys(agg.items).length+' unterschiedliche Item-IDs.</div>';}
  function dashboardHTML(){var normalized=normalizeDashboardEndpoint(C.webDashboardConnectionUrl),de=C.language==='de',confirmed=!!S.dashboardLastAck,probe=S.dashboardProbe||{};return '<h2>'+esc(T('dashboard'))+' 2.7.6</h2><div class="notice">'+esc(de?'2.7.6 sendet den Status per CORS-freiem POST (Beacon/no-cors/Form) und bestätigt ihn anschließend über einen kurzen 1×1-ACK-Request. Dadurch bleibt der Payload aus der URL und Shared-Hosting-Limits werden umgangen.':'2.7.6 sends status through a CORS-free POST (Beacon/no-cors/form) and confirms it with a short 1×1 acknowledgement request, keeping the payload out of the URL.')+'</div>'+cfgField('webDashboardConnectionUrl',de?'Bot-Verbindungs-URL':'Bot connection URL','url',de?'Komplette URL inklusive ?api=push&key=…':'Complete URL including ?api=push&key=…')+cfgField('webDashboardEnabled',de?'Web-Dashboard aktivieren':'Enable web dashboard','check')+cfgField('webDashboardIntervalSeconds',de?'Status senden alle (Sek.)':'Send status every (sec)','number')+'<div class="buttons"><button class="btn primary" data-action="dashboard-test">'+esc(de?'Dashboard-Verbindung testen':'Test dashboard connection')+'</button><button class="btn" data-action="dashboard-tutorial">Tutorial</button></div>'+(!compat.ok?'<div class="notice bad"><b>Hosting/HTTPS: </b>'+esc(compat.reason||'Inkompatibler Dashboard-Endpunkt')+'</div>':'')+'<div class="card"><div class="line"><span>Endpoint</span><strong>'+esc(normalized?normalized.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'):'—')+'</strong></div><div class="line"><span>Transport-Test</span><strong class="'+(probe.ok?'good':'warn')+'">'+esc(probe.ok?'OK':(probe.error||'—'))+'</strong></div><div class="line"><span>Server-Bestätigung</span><strong class="'+(confirmed?'good':'warn')+'">'+(confirmed?Math.round((clock()-S.dashboardLastAck)/1000)+' s':'—')+'</strong></div><div class="line"><span>Transport</span><strong>'+esc(S.dashboardTransport||'—')+'</strong></div>'+(S.dashboardLastError?'<div class="notice bad"><b>Letzter Fehler: </b>'+esc(S.dashboardLastError)+'</div>':'')+'</div>';}
  function renderMain(){if(!S.mainBox)return;S.mainBox.classList.toggle('collapsed',!!S.mainCollapsed);var content=S.mainBox.querySelector('.maincontent'),ps=partyState(),defs=toolDefs();content.innerHTML=(S.update.available?'<div class="update">● UPDATE '+esc(S.update.latest)+'<button data-action="update-apply">'+esc(T('update'))+'</button></div>':'')+'<div class="launcher">'+defs.map(function(x){return '<button class="launch '+(S.toolWindows[x[0]]?'open':'')+'" data-open="'+x[0]+'">'+icon(x[1])+'<span><b>'+esc(x[2])+'</b><small>'+esc(x[3])+'</small></span><span class="arrow">›</span></button>';}).join('')+'</div>';var st=S.mainBox.querySelector('.mainstate'),pt=S.mainBox.querySelector('.partystate'),power=S.mainBox.querySelector('.power'),mini=S.mainBox.querySelector('[data-main-min]');if(st)st.innerHTML='<span class="'+(S.running?'good':'warn')+'">● '+esc(S.running?T('active'):T('paused'))+'</span> · '+esc(S.mode);if(pt)pt.innerHTML='<span class="'+(ps.complete?'good':'bad')+'">Party '+ps.members.length+'/4</span>';if(power){power.className='power '+(S.running?'running':'paused');power.textContent=S.running?T('pause'):T('start');}if(mini)mini.textContent=S.mainCollapsed?'+':'−';}
  function v273ToolFocused(w){try{var ae=uiRoot&&uiRoot.activeElement;return !!(w&&ae&&w.el.contains(ae));}catch(e){return false;}}
  function renderAll(force){if(HEADLESS||!S.mainBox)return;renderMain();var keys=force?Object.keys(S.toolWindows):['character','party','meters','logs'];keys.forEach(function(k){var w=S.toolWindows[k];if(w&&!v273ToolFocused(w))renderTool(k);});}
  var uiClick273=uiClick;uiClick=function(e){var t=e.target.closest('button');if(t&&t.hasAttribute('data-main-min')){S.mainCollapsed=!S.mainCollapsed;write('mainCollapsed:'+me,S.mainCollapsed);renderMain();return;}return uiClick273(e);};

  // ---------------------------------------------------------------------------
  // Runtime, event hooks and lifecycle
  // ---------------------------------------------------------------------------
  var charEventIds = [];
  function meterEvent(e) {
    if (!e) return;
    var dmg = Math.max(0, Number(e.damage) || 0), healv = Math.max(0, Number(e.heal) || 0);
    if (dmg) { S.meter.damage += dmg; var src=String(e.source||e.trigger||'attack');S.meter.sources[src]=S.meter.sources[src]||{damage:0,heal:0};S.meter.sources[src].damage+=dmg; }
    if (healv) { S.meter.heal += healv; var hs=String(e.source||e.trigger||'heal');S.meter.sources[hs]=S.meter.sources[hs]||{damage:0,heal:0};S.meter.sources[hs].heal+=healv; }
    if (e.kill) { S.lastKillAt=clock();audit('kill','Gegner getötet',{source:e.source,trigger:e.trigger,damage:dmg}); }
    audit('combat_event','Kampfereignis',{damage:dmg,heal:healv,source:e.source,trigger:e.trigger,kill:!!e.kill});
  }
  function lootEvent(e) { audit('loot','Loot erhalten',e); }
  try { if (character.on) { charEventIds.push(character.on('target_hit',meterEvent)); charEventIds.push(character.on('loot',lootEvent)); } } catch(e){}

  function connectionTick() {
    var disconnected=!!(P.socket&&P.socket.disconnected);if(!disconnected){if(S.disconnectedAt){audit('connection','Spielverbindung wiederhergestellt',{downMs:clock()-S.disconnectedAt});S.disconnectedAt=0;}return false;}
    if(!S.disconnectedAt){S.disconnectedAt=clock();audit('connection','Spielverbindung getrennt',null,'error');}S.status='Verbindung getrennt';S.mode='Warten';return true;
  }
  function deathTick() {
    if(!character.rip){if(S.deadAt){audit('revive','Charakter wieder lebendig',{deadMs:clock()-S.deadAt});S.deadAt=0;}return false;}
    if(!S.deadAt){S.deadAt=clock();audit('death','Charakter gestorben',{map:character.map,x:character.x,y:character.y},'critical');}
    S.status='Tot · Wiederbelebung';S.mode='Tot';S.target=null;
    if(clock()-S.deadAt>12000&&typeof respawn==='function')action('Wiederbeleben',function(){return respawn();},'respawn',15000);return true;
  }
  // ---------------------------------------------------------------------------
  // 2.7.6 combat recovery, wall-aware kiting, skill/mana and dashboard transport
  // ---------------------------------------------------------------------------
  function v276ExplicitSkillEnabled(id) {
    var map=C.skills&&C.skills[me];
    return !!(map&&Object.prototype.hasOwnProperty.call(map,id)&&map[id]&&map[id].enabled===true);
  }
  function v276EnabledSkillRows() {
    return classSkills().filter(function(id){
      var d=GD.skills&&GD.skills[id]||{},c=skillCfg(id);
      return !!(c.enabled&&(!d.class||[].concat(d.class).indexOf(character.ctype)>=0)&&character.level>=(Number(d.level)||0));
    });
  }
  function v276HighestEnabledSkillCost() {
    var costs=v276EnabledSkillRows().map(function(id){return Number((GD.skills[id]||{}).mp)||0;}).filter(function(n){return n>0&&n<=character.max_mp;});
    return costs.length?Math.max.apply(null,costs):0;
  }
  function v276PotionMpRestore() {
    var d=GD.items&&GD.items[C.mpot]||{},g=d.gives||[],best=0;
    if(Array.isArray(g)){
      if(g.length>=2&&typeof g[0]==='string'&&g[0]==='mp')best=Number(g[1])||0;
      g.forEach(function(row){if(Array.isArray(row)&&String(row[0])==='mp')best=Math.max(best,Number(row[1])||0);});
    } else if(g&&typeof g==='object') best=Number(g.mp)||0;
    return best||300;
  }
  function v276ManaPlan() {
    var maxMp=Math.max(1,Number(character.max_mp)||1),cost=v276HighestEnabledSkillCost(),restore=v276PotionMpRestore();
    var manual=Math.round(maxMp*clamp(C.mp,1,99)/100),buffer=Math.min(Math.max(35,restore*.42),maxMp*.18);
    var trigger=cost>0?Math.min(maxMp*.92,Math.max(cost+buffer,cost+20)):manual;
    trigger=Math.max(cost,Math.min(maxMp,Math.round(trigger)));
    return {highestCost:cost,restore:restore,trigger:trigger,pct:Math.round(trigger/maxMp*1000)/10,manualFallback:manual};
  }
  function manaReserve() {
    var pct=character.max_mp*C.manaReserve/100;
    return Math.max(pct,v276HighestEnabledSkillCost());
  }
  function useSkillSafe(id,target,extra,emergency) {
    if(!skillCanUse(id))return false;
    var d=GD.skills[id]||{},cost=Number(d.mp)||0,highest=v276HighestEnabledSkillCost(),pctFloor=character.max_mp*C.manaReserve/100;
    if(!emergency){
      var protectedReserve=Math.max(pctFloor,highest),isHighest=highest>0&&cost>=highest;
      if(isHighest){if(character.mp<cost)return false;}
      else if(character.mp-cost<Math.min(character.max_mp,protectedReserve))return false;
    }
    if(target&&typeof target!=='string'){try{if(typeof is_in_range==='function'&&!is_in_range(target,id))return false;}catch(e){}}
    return action('Skill '+id,function(){return use_skill(id,target&&targetID(target)||target,extra);},'skill:'+id,Math.max(180,Number(d.cooldown)||300));
  }
  function offensiveSkillTick(target) {
    if(!target)return false;
    var weak=target.hp<=Math.max(1,character.attack*C.weakMobSkillFactor);
    var rows=classSkills().filter(function(id){var d=GD.skills[id]||{},hostile=!!d.hostile||d.target==='monster'||d.target==='enemy';return hostile&&skillCfg(id).enabled;});
    rows.sort(function(a,b){
      var ae=v276ExplicitSkillEnabled(a)?1:0,be=v276ExplicitSkillEnabled(b)?1:0;if(ae!==be)return be-ae;
      var ac=Number((GD.skills[a]||{}).mp)||0,bc=Number((GD.skills[b]||{}).mp)||0;return bc-ac||a.localeCompare(b);
    });
    for(var i=0;i<rows.length;i++){
      var id=rows[i],d=GD.skills[id]||{};if(!skillCanUse(id))continue;
      if(id==='taunt'||id==='agitate')continue;
      // Explicit user selections always win over weak-mob saving.
      if(C.weakMobSkillSaving&&weak&&!v276ExplicitSkillEnabled(id)&&['mentalburst','piercingshot'].indexOf(id)<0)continue;
      if(d.list||['3shot','5shot'].indexOf(id)>=0){
        var limit=id==='3shot'?3:id==='5shot'?5:Math.max(2,C.maxTargets),all=mobs().filter(function(m){return safeEnemy(m)&&(!m.target||C.roster.indexOf(m.target)>=0)&&m.map===character.map;});
        all.sort(function(a,b){if(targetID(a)===targetID(target))return -1;if(targetID(b)===targetID(target))return 1;return dist(character,a)-dist(character,b);});
        var list=all.slice(0,Math.min(limit,C.maxTargets));
        if(list.length>=2&&useSkillSafe(id,list.map(targetID),null,false))return true;
        continue;
      }
      if(useSkillSafe(id,target,null,false))return true;
    }
    return false;
  }
  function sustainTick() {
    var hp=ratio(character,'hp'),plan=v276ManaPlan();
    if(hp<C.hp/100&&qty(C.hpot)>0&&(typeof is_on_cooldown!=='function'||!is_on_cooldown('use_hp'))){
      var hi=slot(C.hpot);if(hi>=0&&typeof consume==='function')return action('HP-Trank',function(){return consume(hi);},'potion',700);
    }
    if(character.mp<plan.trigger&&qty(C.mpot)>0&&(typeof is_on_cooldown!=='function'||!is_on_cooldown('use_mp'))){
      var mi=slot(C.mpot);if(mi>=0&&typeof consume==='function'){
        if(clock()>(S.times.manaPlanLog||0)){S.times.manaPlanLog=clock()+5000;audit('mana_plan','Dynamische MP-Trankschwelle',{mp:character.mp,maxMp:character.max_mp,trigger:plan.trigger,triggerPct:plan.pct,highestEnabledSkillMp:plan.highestCost,potionRestore:plan.restore});}
        return action('MP-Trank',function(){return consume(mi);},'potion',700);
      }
    }
    return false;
  }
  function v276CanMoveTo(x,y){try{return typeof can_move_to!=='function'||!!can_move_to(x,y);}catch(e){return true;}}
  function v276ThreatDistanceAt(x,y,threats){var m=Infinity;threats.forEach(function(t){m=Math.min(m,Math.hypot(x-(Number(t.x)||0),y-(Number(t.y)||0)));});return isFinite(m)?m:0;}
  function kiteThreatTick() {
    if(!C.kite||roleForName(me)!=='dps'||typeof move!=='function')return false;
    var threats=partyThreats().filter(function(m){return m.target===me&&m.map===character.map;});if(!threats.length){S.kiteNav=null;return false;}
    var nearest=threats.slice().sort(function(a,b){return dist(character,a)-dist(character,b);})[0],md=GD.monsters&&GD.monsters[nearest.mtype]||{};
    var enemyRange=Number(nearest.range||md.range)||20,ownRange=Math.max(20,Number(character.range)||20),desired=Math.max(enemyRange+C.kiteExtraDistance,ownRange*C.kiteSafetyPct/100),current=dist(character,nearest);
    if(current>=desired*1.05){if(S.kiteNav)S.kiteNav.stuck=0;return false;}
    var now=clock(),cx=Number(character.x)||0,cy=Number(character.y)||0,st=S.kiteNav||(S.kiteNav={side:1,stuck:0,lastX:cx,lastY:cy,commandAt:0,lastDest:null,lastGood:{x:cx,y:cy}});
    if(st.commandAt&&now-st.commandAt>650){var moved=Math.hypot(cx-st.lastX,cy-st.lastY);if(moved<7&&current<desired){st.stuck=Math.min(8,(st.stuck||0)+1);st.side=-(st.side||1);}else if(moved>12){st.stuck=Math.max(0,(st.stuck||0)-1);st.lastGood={x:cx,y:cy};}}
    var vx=0,vy=0;threats.forEach(function(m){var dx=cx-(Number(m.x)||0),dy=cy-(Number(m.y)||0),dd=Math.max(1,Math.hypot(dx,dy)),w=1/Math.max(20,dd);vx+=dx/dd*w;vy+=dy/dd*w;});
    var len=Math.hypot(vx,vy);if(len<.001){vx=cx-(Number(nearest.x)||0);vy=cy-(Number(nearest.y)||0);len=Math.max(1,Math.hypot(vx,vy));}vx/=len;vy/=len;
    var base=Math.atan2(vy,vx),side=st.side||1,wall=st.stuck>0;
    var angles=wall?[side*.95,-side*.95,side*1.35,-side*1.35,side*1.7,-side*1.7,Math.PI,-Math.PI]:[0,side*.32,-side*.32,side*.65,-side*.65,side*.95,-side*.95,side*1.3,-side*1.3,side*1.57,-side*1.57,side*1.9,-side*1.9,Math.PI];
    var first=clamp(desired-current+45,45,120),steps=[first,90,65,45,28],best=null;
    steps.forEach(function(step){angles.forEach(function(off){var a=base+off,x=cx+Math.cos(a)*step,y=cy+Math.sin(a)*step;if(!v276CanMoveTo(x,y))return;var sep=v276ThreatDistanceAt(x,y,threats),align=Math.cos(off),score=sep+align*14-(Math.abs(off)>.9?2:0);if(st.lastDest)score+=Math.min(12,Math.hypot(x-st.lastDest.x,y-st.lastDest.y)/20);if(!best||score>best.score)best={x:x,y:y,score:score,sep:sep,off:off,step:step};});});
    if(!best&&st.lastGood&&Math.hypot(cx-st.lastGood.x,cy-st.lastGood.y)>8&&v276CanMoveTo(st.lastGood.x,st.lastGood.y))best={x:st.lastGood.x,y:st.lastGood.y,score:0,sep:v276ThreatDistanceAt(st.lastGood.x,st.lastGood.y,threats),off:Math.PI,step:0,backtrack:true};
    if(!best){st.stuck=Math.min(8,(st.stuck||0)+1);st.side=-(st.side||1);S.status='Kiten · Hindernis umfahren';S.mode='Kampf / Kiten';if(clock()>(S.times.kiteBlockedLog||0)){S.times.kiteBlockedLog=clock()+1200;audit('kite_blocked','Kite-Richtung blockiert; Seite wird gewechselt',{threats:threats.map(targetID),distance:Math.round(current),desired:Math.round(desired),stuck:st.stuck},'warning');}return true;}
    try{S.moveGoal=null;S.lastMoveAt=now;st.lastX=cx;st.lastY=cy;st.commandAt=now;st.lastDest={x:best.x,y:best.y};if(Math.abs(best.off)>.55)st.side=best.off>=0?1:-1;move(best.x,best.y);if(now>(S.times.kiteLog||0)){S.times.kiteLog=now+900;audit('kite',wall?'Kiten entlang Hindernis':'Damage dealer hält Sicherheitsabstand',{threats:threats.map(targetID),distance:Math.round(current),desired:Math.round(desired),x:Math.round(best.x),y:Math.round(best.y),wallFollow:wall,stuck:st.stuck,separation:Math.round(best.sep)});}S.status=wall?'Kiten · Hindernis umfahren':'Kiten · '+threats.length+' Gegner';S.mode='Kampf / Kiten';return true;}catch(e){st.stuck++;st.side=-st.side;return true;}
  }
  function v276CombatGroupAnchorInfo(){
    var fs=farmerReports().filter(function(r){return r&&r.active!==false&&!r.rip;});if(!fs.length)return null;
    var groups={};fs.forEach(function(r){var k=String(r.map||'');if(!k)return;(groups[k]||(groups[k]={map:k,rows:[],strength:0})).rows.push(r);groups[k].strength+=v273FarmerStrength(r);});
    var tank=activeTankName(),tankR=tank&&(tank===me?report(false):peerReport(tank));
    var gs=Object.keys(groups).map(function(k){var g=groups[k];g.score=g.rows.length*100000+g.strength+(tankR&&tankR.map===g.map?50000:0);return g;}).sort(function(a,b){return b.score-a.score;});if(!gs.length)return null;var g=gs[0],cx=g.rows.reduce(function(n,r){return n+(Number(r.x)||0);},0)/g.rows.length,cy=g.rows.reduce(function(n,r){return n+(Number(r.y)||0);},0)/g.rows.length;
    var row=(tankR&&tankR.map===g.map)?tankR:g.rows.slice().sort(function(a,b){var da=Math.hypot((Number(a.x)||0)-cx,(Number(a.y)||0)-cy),db=Math.hypot((Number(b.x)||0)-cx,(Number(b.y)||0)-cy);return da-db||v273FarmerStrength(b)-v273FarmerStrength(a);})[0];
    return row?{report:row,map:g.map,count:g.rows.length,total:fs.length}:null;
  }
  function v276CombatAnchorReport(){var x=v276CombatGroupAnchorInfo();return x&&x.report||v273CombatAnchorReport();}
  function farmerTick(){
    if(applyDeliveredElixirTick())return;var role=roleForName(me),order=v273FarmOrder(),groupGoal=v273GroupGoal(),rejoin=v276CombatGroupAnchorInfo();if(groupGoal)S.goal=groupGoal;
    if(ratio(character,'hp')<C.retreatHP/100){S.status='Erholung / Sicherheit';S.mode='Erholung';S.target=null;if(S.goal)moveToGoal(S.goal,'Sicherheitsrückzug',{kind:'retreat'});return;}
    var needsRespawnRejoin=!!(S.rejoinUntil&&clock()<S.rejoinUntil),splitRejoin=!!(rejoin&&rejoin.count>=2&&rejoin.map!==character.map);
    if(rejoin&&(needsRespawnRejoin||splitRejoin)&&(character.map!==rejoin.report.map||dist(character,rejoin.report)>C.followDistance*2.2)){
      S.target=null;S.status=needsRespawnRejoin?'Nach Respawn zur Kampfgruppe':'Zur Kampfgruppe zurückkehren';S.mode='Gruppen-Rejoin';moveToGoal(rejoin.report,'Combat-Rejoin',{kind:'respawn-rejoin',forceAfter:12000,tolerance:130});return;
    }
    if(needsRespawnRejoin&&rejoin&&character.map===rejoin.report.map&&dist(character,rejoin.report)<=C.followDistance*2.2){audit('rejoin','Kampfgruppe nach Respawn wieder erreicht',{anchor:rejoin.report.name,map:rejoin.map,count:rejoin.count});S.rejoinUntil=0;S.rejoinReason='';}
    if(clock()-(S.lastGoalCheck||0)>(S.goal?30000:8000)){S.lastGoalCheck=clock();if(!groupGoal)chooseGoal();}
    var goalDistance=S.goal&&character.map===S.goal.map?dist(character,S.goal):Infinity,traveling=!!(S.goal&&(character.map!==S.goal.map||goalDistance>Math.max(220,C.followDistance*1.6)));
    if(traveling){S.target=null;if(order){S.status='Zum Materialziel: '+v273Name(order.monster)+' für '+v273Name(order.item)+' ['+order.have+'/'+order.required+']';S.mode='Material-Anreise';}else{S.status='Zum gemeinsamen Farmgebiet: '+v273Name(S.goal.monster);S.mode='Farm-Anreise';}moveToGoal(S.goal,'Gemeinsames Farmziel',{kind:'farm',forceAfter:9000,tolerance:150});return;}
    var ar=v276CombatAnchorReport();if(ar&&ar.name!==me&&ar.map===character.map&&dist(character,ar)>C.followDistance*2.5){S.status='Zur Kampfgruppe aufschließen';S.mode='Folgen';moveToGoal(ar,'Kampfgruppe folgen',{kind:'follow',tolerance:170,forceAfter:5500});return;}
    if(role==='healer'&&!healerCanDamage()){S.target=null;S.status='Heilbereitschaft';S.mode='Heilen';var tr=activeTankReport()||ar;if(tr&&tr.map===character.map&&dist(character,tr)>C.followDistance*1.35)moveToGoal(tr,'Heiler folgt Kampfanker',{kind:'follow',tolerance:140});return;}
    if(role==='tank'&&tankAggroTick())return;var pullTank=activeTankReport();if((role==='dps'||role==='healer')&&pullTank&&pullTank.name!==me&&pullTank.map===character.map&&dist(character,pullTank)<=C.followDistance*2.2&&!pullTank.target&&!partyThreats().length){S.target=null;S.status='Warte auf Tank-Pull';S.mode=role==='healer'?'Heilen':'Damage';return;}
    var t=targetForCombat();if(!t){S.target=null;if(order){S.status='Bekämpfe '+v273Name(order.monster)+' für '+v273Name(order.item)+' ['+order.have+'/'+order.required+']';S.mode='Material-Farm';}else{if(S.goal&&!S.goalEmptySince)S.goalEmptySince=clock();if(S.goal&&S.goalEmptySince&&clock()-S.goalEmptySince>=C.goalEmptyReplanSeconds*1000){v275MarkGoalEmpty(S.goal);S.lastGoalCheck=0;}S.status=S.goal?'Zielgebiet erreicht · suche '+v273Name(S.goal.monster):'Warte auf Merchant-Farmziel';S.mode='Farmen';}return;}else S.goalEmptySince=0;
    S.target=targetID(t);var mobName=v273Name(t.mtype);S.status=order?'Bekämpfe '+mobName+' für '+v273Name(order.item)+' ['+order.have+'/'+order.required+']':(role==='tank'?'Tanken: ':role==='healer'?'Sicherer Schaden: ':'Schaden: ')+mobName;S.mode=order?'Material-Farm':role==='tank'?'Tanken':role==='healer'?'Heilen / Schaden':'Damage';
    var kiting=role==='dps'&&kiteThreatTick(),inRange=true;try{if(typeof is_in_range==='function')inRange=!!is_in_range(t);}catch(e){}if(!inRange){if(kiting)return;moveToGoal(t,role==='tank'?'Tank in Angriffsreichweite':'In Angriffsreichweite',{kind:'combat',forceAfter:2000,tolerance:50});return;}if(offensiveSkillTick(t))return;try{if(typeof can_attack==='function'&&can_attack(t)&&character.mp>=(character.mp_cost||0))action(role==='tank'?'Tank-Basisangriff':'Basisangriff',function(){return attack(t);},role==='tank'?'tank-basic':'attack',Math.max(80,420/Math.max(.2,character.frequency||1)));}catch(e){}
  }
  function v276DashboardCompactPayload(p){
    var ps=p.party||{},mp=p.merchantPlan||null;
    return {type:p.type,version:p.version,botVersion:p.botVersion,language:p.language,name:p.name,ctype:p.ctype,role:p.role,level:p.level,hp:p.hp,maxHp:p.maxHp,hpPct:p.hpPct,mp:p.mp,maxMp:p.maxMp,mpPct:p.mpPct,xp:p.xp,xpPct:p.xpPct,xpPerHour:p.xpPerHour,goldPerHour:p.goldPerHour,levelEtaSeconds:p.levelEtaSeconds,task:p.task,taskCode:p.taskCode,mode:p.mode,active:p.active,rip:p.rip,map:p.map,x:p.x,y:p.y,server:p.server,party:{members:ps.members||[],missing:ps.missing||[],complete:!!ps.complete},merchantPlan:mp?{farmOrder:mp.farmOrder||null,steps:Array.isArray(mp.steps)?mp.steps.slice(0,5):[]}:null,alerts:p.alerts||[],lastXpAt:p.lastXpAt,lastKillAt:p.lastKillAt,lastMoveAt:p.lastMoveAt,lastActionAt:p.lastActionAt,lastAction:p.lastAction,updatedAt:p.updatedAt};
  }
  function v276DashboardScriptPush(endpoint,payload){return new Promise(function(resolve,reject){
    if(!D||!(D.head||D.body))return reject(Error('DOM unavailable for script transport'));var token='s'+clock().toString(36)+Math.random().toString(36).slice(2,10),cb='__AIO_DASH_'+token.replace(/[^A-Za-z0-9_]/g,''),script=D.createElement('script'),done=false;
    function finish(ok,msg){if(done)return;done=true;try{P.clearTimeout(timer);}catch(e){}try{script.remove();}catch(e){}try{delete P[cb];}catch(e){P[cb]=undefined;}if(ok)resolve('script/jsonp');else reject(Error(msg||'script dashboard failed'));}
    P[cb]=function(msg){try{if(msg&&msg.ok===true&&msg.token===token&&(!msg.name||msg.name===me))finish(true);else finish(false,msg&&msg.error||'dashboard script rejected');}catch(e){finish(false,reason(e));}};
    var timer=P.setTimeout(function(){finish(false,'dashboard script acknowledgement timeout');},6500);
    try{var u=new URL(endpoint),data=JSON.stringify(v276DashboardCompactPayload(payload));u.searchParams.set('api','pushjs');u.searchParams.set('token',token);u.searchParams.set('cb',cb);u.searchParams.set('data',data);u.searchParams.set('_',String(clock()));if(u.toString().length>7600)return finish(false,'dashboard script URL too large');script.async=true;script.referrerPolicy='no-referrer';script.onerror=function(){finish(false,'dashboard script request blocked/failed');};script.src=u.toString();(D.head||D.body).appendChild(script);}catch(e){finish(false,reason(e));}
  });}
  function dashboardPublishTick(force){
    if((!C.webDashboardEnabled&&!force)||S.dashboardSending)return false;var endpoint=normalizeDashboardEndpoint(String(C.webDashboardConnectionUrl||'').trim());if(!endpoint){S.dashboardLastError='Invalid dashboard URL';S.dashboardFailAt=clock();return false;}if(!force&&clock()-S.lastDashboardPublish<C.webDashboardIntervalSeconds*1000)return false;S.lastDashboardPublish=clock();var payload=dashboardPayload();S.dashboardSending=true;S.dashboardTransportErrors=[];audit('dashboard_send','Dashboard status send',{endpointHost:endpoint.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'),payload:payload});
    v276DashboardScriptPush(endpoint,payload).then(function(transport){S.dashboardTransport=transport;return transport;}).catch(function(e){S.dashboardTransportErrors.push('script: '+reason(e));audit('dashboard_retry','Script transport failed; trying POST transports',{error:reason(e)},'warning');return v275DashboardPost(endpoint,payload).then(function(transport){S.dashboardTransport=transport+' + ack';return new Promise(function(r){P.setTimeout(r,450);}).then(function(){return v275DashboardAckImage(endpoint,payload,4500);}).then(function(){return S.dashboardTransport;});}).catch(function(e2){S.dashboardTransportErrors.push('post: '+reason(e2));return v275DashboardFramePush(endpoint,payload).then(function(transport){S.dashboardTransport=transport;return transport;});});}).then(function(){S.dashboardProbe={ok:true,at:clock(),error:'',host:'2.7.6'};S.dashboardLastOK=clock();S.dashboardLastAck=clock();S.dashboardFailAt=0;S.dashboardLastError='';S.dashboardAckName=me;audit('dashboard_ack','Dashboard status serverseitig bestätigt',{name:me,transport:S.dashboardTransport});}).catch(function(e){S.dashboardProbe={ok:false,at:clock(),error:reason(e)};S.dashboardFailAt=clock();S.dashboardLastError=[].concat(S.dashboardTransportErrors||[],[reason(e)]).join(' | ');audit('dashboard_error','Dashboard vollständig fehlgeschlagen: '+S.dashboardLastError,{transport:S.dashboardTransport},'error');}).finally(function(){S.dashboardSending=false;renderAll(true);});return true;
  }
  function skillsHTML(){var rows=classSkills(),plan=v276ManaPlan(),de=C.language==='de';return '<h2>'+esc(T('skill_manager'))+'</h2><div class="notice">'+esc(de?'Aktivierte Kampf-Skills werden auf Cooldown benutzt. Explizit aktivierte Skills werden nicht mehr durch die Schwachgegner-Sparlogik unterdrückt.':'Enabled combat skills are used on cooldown. Explicit selections are no longer suppressed by weak-mob saving.')+'</div><div class="card"><div class="line"><span>'+esc(de?'Automatische MP-Trankschwelle':'Automatic MP potion threshold')+'</span><strong>'+plan.pct+'% · '+plan.trigger+' MP</strong></div><div class="line"><span>'+esc(de?'Teuerster aktivierter Skill':'Most expensive enabled skill')+'</span><strong>'+plan.highestCost+' MP</strong></div></div>'+cfgField('weakMobSkillSaving','Save offensive skills on weak monsters','check','Explicitly enabled skills override this saving rule.')+cfgField('weakMobSkillFactor','Weak threshold × basic attack','number')+cfgField('manaReserve','Additional mana reserve %','number')+'<h3>'+esc(T('skills'))+'</h3>'+rows.map(function(id){var d=GD.skills[id]||{},c=skillCfg(id),st=skillDamageStats(id,d);return '<div class="card skillcard">'+skillVisual(id,42)+'<div><div class="line"><label><input type="checkbox" data-skill="'+esc(id)+'"'+(c.enabled?' checked':'')+'> <b>'+esc(d.name||id)+'</b></label><span class="tag">'+esc(id)+'</span></div><div class="muted">'+esc(d.explanation||'—')+'</div><div class="skillstats"><div class="skillstat">Mana<b>'+esc(d.mp==null?'0':d.mp)+'</b></div><div class="skillstat">Cooldown<b>'+esc(cooldownText(d.cooldown))+'</b></div><div class="skillstat">Damage<b>'+esc(st.damage)+'</b></div><div class="skillstat">Dmg / MP<b>'+esc(st.perMp)+'</b></div><div class="skillstat">Range / Target<b>'+esc((d.range||'—')+' / '+(d.target||'—'))+'</b></div></div></div></div>';}).join('');}
  function dashboardHTML(){var normalized=normalizeDashboardEndpoint(C.webDashboardConnectionUrl),de=C.language==='de',confirmed=!!S.dashboardLastAck,probe=S.dashboardProbe||{},errs=(S.dashboardTransportErrors||[]).join(' | '),compat=v277DashboardCompatibility(String(C.webDashboardConnectionUrl||''));return '<h2>'+esc(T('dashboard'))+' 2.7.7</h2><div class="notice">'+esc(de?'2.7.7 diagnostiziert zuerst HTTPS/Mixed-Content und verwendet bei kompatiblen HTTPS-Hosts einen Script/JSONP-Transport mit echter Server-Bestätigung. POST/Beacon/Iframe bleiben als Fallback erhalten.':'2.7.7 first diagnoses HTTPS/mixed-content and uses a script/JSONP transport on compatible HTTPS hosts with real server acknowledgement; POST/beacon/frame remain fallbacks.')+'</div>'+cfgField('webDashboardConnectionUrl',de?'Bot-Verbindungs-URL':'Bot connection URL','url',de?'Komplette URL inklusive ?api=push&key=…':'Complete URL including ?api=push&key=…')+cfgField('webDashboardEnabled',de?'Web-Dashboard aktivieren':'Enable web dashboard','check')+cfgField('webDashboardIntervalSeconds',de?'Status senden alle (Sek.)':'Send status every (sec)','number')+'<div class="buttons"><button class="btn primary" data-action="dashboard-test">'+esc(de?'Dashboard-Verbindung testen':'Test dashboard connection')+'</button><button class="btn" data-action="dashboard-tutorial">Tutorial</button></div><div class="card"><div class="line"><span>Endpoint</span><strong>'+esc(normalized?normalized.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'):'—')+'</strong></div><div class="line"><span>Server-Bestätigung</span><strong class="'+(confirmed?'good':'warn')+'">'+(confirmed?Math.round((clock()-S.dashboardLastAck)/1000)+' s':'—')+'</strong></div><div class="line"><span>Transport</span><strong>'+esc(S.dashboardTransport||'—')+'</strong></div>'+(S.dashboardLastError?'<div class="notice bad"><b>Letzter Fehler: </b>'+esc(S.dashboardLastError)+'</div>':'')+(errs?'<div class="muted">'+esc(errs)+'</div>':'')+'</div>';}
  // ---------------------------------------------------------------------------
  // 2.7.7 autonomous updates, diagnostic mode and Merchant service loop
  // ---------------------------------------------------------------------------
  function v277TargetMtype(){try{var t=get_target&&get_target();return t&&t.mtype||null;}catch(e){return null;}}
  function v277UpdateLocalPotionTelemetry(){
    var now=clock(),h=qty(C.hpot),m=qty(C.mpot),x=S.localPotionTelemetry;
    if(!x){S.localPotionTelemetry={at:now,h:h,m:m,hRate:0,mRate:0};return S.localPotionTelemetry;}
    var dt=Math.max(1,now-x.at),hd=Math.max(0,x.h-h),md=Math.max(0,x.m-m),hr=hd*60000/dt,mr=md*60000/dt;
    if(dt>=1500){x.hRate=x.hRate*.72+hr*.28;x.mRate=x.mRate*.72+mr*.28;x.at=now;x.h=h;x.m=m;}return x;
  }
  function v277AutoRestockThreshold(kind,rate){
    var delivery=kind==='hp'?Number(C.merchantDeliveryHPQty)||0:Number(C.merchantDeliveryMPQty)||0;
    var manual=kind==='hp'?Number(C.merchantRestockHPAt)||0:Number(C.merchantRestockMPAt)||0;
    if(manual>0)return Math.round(manual);
    var base=Math.max(60,Math.ceil(delivery*.22)),travel=Math.ceil(Math.max(0,Number(rate)||0)*8);
    return Math.max(base,travel);
  }
  function v277OwnSupplyRequest(){var t=v277UpdateLocalPotionTelemetry(),h=qty(C.hpot),m=qty(C.mpot),ht=v277AutoRestockThreshold('hp',t.hRate),mt=v277AutoRestockThreshold('mp',t.mRate);return {hp:h<=ht,mp:m<=mt,hpot:h,mpot:m,hpAt:ht,mpAt:mt,hRate:Math.round(t.hRate*10)/10,mRate:Math.round(t.mRate*10)/10,at:clock()};}
  function v277FarmerSupplySignalTick(){
    if(character.ctype==='merchant')return false;var req=v277OwnSupplyRequest(),mn=merchantName();if(!(req.hp||req.mp)||!mn)return false;
    if(clock()<(S.times.supplySignal||0))return false;S.times.supplySignal=clock()+20000;
    audit('supply_request','Zulieferer angefordert',{merchant:mn,request:req},'warning');try{if(typeof send_cm==='function')send_cm(mn,{type:'aio27-supply-request',from:me,request:req,version:VERSION,at:clock()});}catch(e){}return false;
  }
  function v277ReportSupplyRequest(r){
    var st=S.supplyTelemetry[r.name]||{at:0,h:Number(r.hpot)||0,m:Number(r.mpot)||0,hRate:0,mRate:0},now=clock(),dt=Math.max(1,now-st.at);
    if(st.at&&dt>=1200){var hd=Math.max(0,st.h-(Number(r.hpot)||0)),md=Math.max(0,st.m-(Number(r.mpot)||0));st.hRate=st.hRate*.75+(hd*60000/dt)*.25;st.mRate=st.mRate*.75+(md*60000/dt)*.25;}
    st.at=now;st.h=Number(r.hpot)||0;st.m=Number(r.mpot)||0;S.supplyTelemetry[r.name]=st;
    var ht=v277AutoRestockThreshold('hp',st.hRate),mt=v277AutoRestockThreshold('mp',st.mRate);
    return {hp:st.h<=ht,mp:st.m<=mt,hpot:st.h,mpot:st.m,hpAt:ht,mpAt:mt,hRate:Math.round(st.hRate*10)/10,mRate:Math.round(st.mRate*10)/10};
  }
  function report(withRole){
    var p=pos(character)||{},rates=v273RateStats(),supply=character.ctype==='merchant'?null:v277OwnSupplyRequest();var r={type:'aio27-report',protocol:REPORT_PROTOCOL,version:VERSION,name:me,ctype:character.ctype,level:character.level,at:clock(),map:character.map,x:p.x||0,y:p.y||0,hp:character.hp,max_hp:character.max_hp,mp:character.mp,max_mp:character.max_mp,attack:character.attack,frequency:character.frequency,armor:character.armor,resistance:character.resistance,range:character.range,speed:character.speed,damage_type:character.damage_type,slots:v273CompactSlots(),inventory:v273InventoryReport(),active:!!S.running,rip:!!character.rip,status:S.status,mode:S.mode,target:S.target,targetMtype:v277TargetMtype(),goal:S.goal,free:freeSlots(),gold:character.gold,hpot:qty(C.hpot),mpot:qty(C.mpot),xp:character.xp,xpPerHour:rates.xpPerHour,goldPerHour:rates.goldPerHour,merchantPlan:character.ctype==='merchant'?S.merchantPlan:null,supplyRequest:supply};if(withRole!==false){r.role=roleForName(me);r.primaryTank=roleSummary().primaryTank;}return r;
  }
  function v277BroadcastUpdate(version){try{if(typeof send_cm!=='function')return;C.roster.filter(function(n){return n!==me;}).forEach(function(n){try{send_cm(n,{type:'aio27-update-now',version:version,from:me,at:clock()});}catch(e){}});}catch(e){}}
  function updateCheckTick(force){
    if(S.update.checking||S.update.applying)return false;if(!force&&clock()-S.update.checkedAt<60000)return false;S.update.checking=true;S.update.checkedAt=clock();S.update.error='';var repo=defaults.updateRepositoryUrl;
    checkRepo(repo).then(function(r){S.update.checking=false;S.update.latest=r.version;S.update.repo=r.repo;S.update.raw=r.raw;S.update.available=newer(r.version,VERSION);S.update.error='';audit('update_check',S.update.available?'Neue Bot-Version erkannt: '+r.version:'Bot is current',Object.assign({},r,{activeSlot:activeCodeSlot(),automatic:true}),S.update.available?'warning':'info');renderAll(true);if(S.update.available){v277BroadcastUpdate(r.version);P.setTimeout(function(){selfUpdate(true);},150+Math.floor(Math.random()*650));}}).catch(function(e){S.update.checking=false;S.update.error=reason(e);audit('update_error','Update check failed: '+S.update.error,{repo:repo,automatic:true},'warning');renderAll(true);});return true;
  }
  function v277HotReload(code,version){
    write('lastAppliedUpdate:'+me,{from:VERSION,to:version,at:clock(),automatic:true});audit('update_reload','Vollautomatischer Hot-Reload startet',{from:VERSION,to:version,bytes:code.length});
    P.setTimeout(function(){try{var old=P.__ALBOT2__;if(old&&typeof old.dispose==='function')old.dispose();}catch(e){}try{(0,eval)(code);}catch(e){try{audit('update_reload_error','Hot-Reload fehlgeschlagen: '+reason(e),null,'error');}catch(_){}}},220);
  }
  function selfUpdate(auto){
    if(S.update.applying)return Promise.resolve(false);if(!S.update.available&&!newer(S.update.latest||'',VERSION))return Promise.resolve(false);S.update.applying=true;var attempt=(S.update.applyAttempt||0)+1;S.update.applyAttempt=attempt;audit('update_apply','Vollautomatisches Self-Update gestartet',{latest:S.update.latest,repo:S.update.repo,attempt:attempt,activeSlot:activeCodeSlot()});
    return fetchLatestBotCode().then(function(code){var v=v275ValidateUpdateCode(code,S.update.latest),slotId=activeCodeSlot();if((slotId==null||String(slotId)==='')&&P.code_slot!=null)slotId=P.code_slot;if((slotId==null||String(slotId)==='')&&typeof get_edited_code_slot==='function')try{slotId=get_edited_code_slot();}catch(_e){}var slotNum=parseInt(String(slotId),10);if(typeof upload_code!=='function'||!isFinite(slotNum)||slotNum<1)throw Error('Aktiver CODE-Slot konnte nicht automatisch ermittelt werden');var slotName=String(P.code_name||P.code_slot_name||'AiO Bot');return Promise.resolve(upload_code(slotNum,slotName,code)).then(function(res){audit('update_saved','Neue Version dauerhaft in aktivem CODE-Slot gespeichert',{slot:slotNum,slotName:slotName,from:VERSION,to:v,result:res,automatic:true});S.update.applyAttempt=0;S.update.error='';v277HotReload(code,v);return true;});}).catch(function(e){S.update.applying=false;S.update.error=reason(e);audit('update_auto_error','Automatisches Update fehlgeschlagen; Retry folgt ohne Benutzereingriff: '+reason(e),{latest:S.update.latest,attempt:attempt,nextRetryMs:Math.min(45000,10000*Math.max(1,attempt))},'error');P.setTimeout(function(){S.update.checkedAt=0;if(S.update.available||newer(S.update.latest||'',VERSION))selfUpdate(true);else updateCheckTick(true);},Math.min(45000,10000*Math.max(1,attempt)));if(attempt>=6)S.update.applyAttempt=0;renderAll(true);return false;});
  }
  var v277CMBase=on_cm;
  on_cm=function(name,data){try{v277CMBase(name,data);}catch(e){}if(!accountCharacterName(name)||!data)return;if(data.type==='aio27-update-now'&&newer(String(data.version||''),VERSION)){audit('update_signal','Peer meldet neue Version',{from:name,version:data.version});S.update.checkedAt=0;P.setTimeout(function(){updateCheckTick(true);},100+Math.floor(Math.random()*500));}if(character.ctype==='merchant'&&data.type==='aio27-supply-request'&&data.from===name){S.merchantServiceUrgent[name]={at:clock(),request:data.request||{}};audit('merchant_supply_signal','Farmer fordert Zulieferung an',{farmer:name,request:data.request});}};
  function v277MerchantServiceCandidates(){
    var now=clock(),last=S.merchantLastService||{},urgent=S.merchantServiceUrgent||{},gap=Math.max(20000,Number(C.merchantServiceIntervalSeconds||90)*1000);return farmerReports().filter(function(r){return r&&r.active!==false&&!r.rip;}).map(function(r){var req=v277ReportSupplyRequest(r),inventory=(r.inventory||[]).filter(function(i){return i&&i.name!==C.hpot&&i.name!==C.mpot;}).length,age=now-Number(last[r.name]||0),recentlyServiced=age<gap,goldNeed=Number(r.gold||0)>=Math.max(Number(C.merchantCollectGoldOver)||0,Number(C.merchantFarmerGoldReserve)||0),freeNeed=Number(r.free||99)<=Number(C.merchantPickupFreeSlotsAt||12),routine=!recentlyServiced,lootNeed=!recentlyServiced&&(freeNeed||(inventory>0&&routine)),potNeed=req.hp||req.mp||!!urgent[r.name],freeUrgent=freeNeed&&!recentlyServiced,urgentNeed=potNeed||goldNeed||freeUrgent;var priority=(potNeed?1000000:0)+(goldNeed?400000:0)+(freeUrgent?250000:0)+(lootNeed?100000:0)+Math.min(age,120000);return {r:r,req:req,inventory:inventory,age:age,recentlyServiced:recentlyServiced,goldNeed:goldNeed,freeNeed:freeNeed,lootNeed:lootNeed,potNeed:potNeed,urgent:urgentNeed,routine:routine,priority:priority};}).filter(function(x){return x.urgent||x.lootNeed||x.routine;}).sort(function(a,b){return b.priority-a.priority||a.r.name.localeCompare(b.r.name);});
  }
  function v277MerchantRestockSelfTick(target){
    if(character.ctype!=='merchant'||!C.merchantSupply)return false;var needH=target&&target.req&&target.req.hp?Number(C.merchantDeliveryHPQty)||0:0,needM=target&&target.req&&target.req.mp?Number(C.merchantDeliveryMPQty)||0:0,haveH=qty(C.hpot),haveM=qty(C.mpot);if(haveH>=needH+80&&haveM>=needM+80)return false;
    if(character.map!=='main'||Math.hypot((Number(character.x)||0)+56,(Number(character.y)||0)-402)>500){S.status='Zulieferung vorbereiten · Tränke kaufen';S.mode='Merchant · Versorgung';return moveToGoal({map:'main',x:-56,y:402},'Zum Trankhändler',{kind:'supply-buy',tolerance:120,forceAfter:7000});}
    if(haveH<Math.max(needH+80,Number(C.merchantBuyHPTo)||0)&&typeof buy==='function')return action('HP-Tränke für Farmer kaufen',function(){return buy(C.hpot,Math.max(1,Math.max(needH+80,Number(C.merchantBuyHPTo)||0)-haveH));},'merchant-buy-hp',1800);
    if(haveM<Math.max(needM+80,Number(C.merchantBuyMPTo)||0)&&typeof buy==='function')return action('MP-Tränke für Farmer kaufen',function(){return buy(C.mpot,Math.max(1,Math.max(needM+80,Number(C.merchantBuyMPTo)||0)-haveM));},'merchant-buy-mp',1800);return false;
  }
  function merchantSupplyTick(){
    if(character.ctype!=='merchant'||!C.merchantSupply)return false;var target=S.merchantServiceTarget&&peerReport(S.merchantServiceTarget),fs=target?[target]:farmerReports();
    for(var i=0;i<fs.length;i++){var r=fs[i],lp=localPlayer(r.name);if(!lp||dist(character,lp)>260)continue;var tele=v277ReportSupplyRequest(r),needH=tele.hp?Number(C.merchantDeliveryHPQty)||0:0,needM=tele.mp?Number(C.merchantDeliveryMPQty)||0:0,hasH=(r.inventory||[]).some(function(x){return x&&x.name===C.hpot;}),hasM=(r.inventory||[]).some(function(x){return x&&x.name===C.mpot;}),del=S.merchantServiceDelivered||(S.merchantServiceDelivered={hp:false,mp:false});if(needH>0&&!del.hp&&qty(C.hpot)>80&&(hasH||r.free>0)){var hi=slot(C.hpot),hq=Math.min(needH,qty(C.hpot)-80);if(hi>=0&&hq>0){del.hp=true;audit('merchant_supply_delivery','HP-Tranklieferung',{farmer:r.name,quantity:hq,threshold:tele.hpAt,reportedStock:r.hpot});return action('HP-Tränke liefern '+r.name,function(){return send_item(r.name,hi,hq);},'supply-hp:'+r.name,1400);}}if(needM>0&&!del.mp&&qty(C.mpot)>80&&(hasM||r.free>0)){var mi=slot(C.mpot),mq=Math.min(needM,qty(C.mpot)-80);if(mi>=0&&mq>0){del.mp=true;audit('merchant_supply_delivery','MP-Tranklieferung',{farmer:r.name,quantity:mq,threshold:tele.mpAt,reportedStock:r.mpot});return action('MP-Tränke liefern '+r.name,function(){return send_item(r.name,mi,mq);},'supply-mp:'+r.name,1400);}}}
    return false;
  }
  function farmerLootTransferTick(){
    if(character.ctype==='merchant'||!C.merchantCollectLoot)return false;if(v273CollectRequestedMaterialsTick())return true;var mn=merchantName(),m=mn&&localPlayer(mn),mr=mn&&peerReport(mn);if(!m||!mr||dist(character,m)>260)return false;
    if(typeof send_gold==='function'){var keep=Math.max(0,Number(C.merchantFarmerGoldReserve)||0),gold=Math.max(0,Number(character.gold)||0),trigger=Math.max(keep,Number(C.merchantCollectGoldOver)||0);if(gold>=trigger){var amount=Math.max(0,gold-keep);if(amount>0)return action('Gold an Merchant',function(){audit('merchant_pickup_gold','Merchant ist in Reichweite · gebündelte Goldübergabe',{merchant:mn,amount:amount,keep:keep,serviceTrigger:trigger});return send_gold(mn,amount);},'loot-gold',5000);}}if(mr.free<2)return false;
    var idx=(character.items||[]).findIndex(function(i){if(!i||protectedStandItem(i)||isElixir(i)||i.name===C.hpot||i.name===C.mpot)return false;return true;});if(idx>=0&&typeof send_item==='function')return action('Loot/Ausrüstung an Merchant',function(){return send_item(mn,idx,character.items[idx].q||1);},'loot-item',1800);return false;
  }
  function v277MerchantServiceTick(){
    if(character.ctype!=='merchant')return false;var now=clock(),cands=v277MerchantServiceCandidates(),cur=S.merchantServiceTarget&&cands.find(function(x){return x.r.name===S.merchantServiceTarget;});if(!cur){S.merchantServiceTarget=cands[0]&&cands[0].r.name||null;S.merchantServiceArrivedAt=0;S.merchantServiceDelivered={hp:false,mp:false};cur=cands[0]||null;if(cur)audit('merchant_service_selected','Nächster Farmer-Service gewählt',{farmer:cur.r.name,priority:cur.priority,potionNeed:cur.potNeed,goldNeed:cur.goldNeed,lootNeed:cur.lootNeed,request:cur.req});}if(!cur)return false;
    var r=cur.r;if(v277MerchantRestockSelfTick(cur))return true;var lp=localPlayer(r.name);if(!lp||r.map!==character.map||dist(character,lp)>220){S.status='Zulieferfahrt zu '+r.name+(cur.potNeed?' · Tränke':'')+(cur.goldNeed?' · Gold':'')+(cur.lootNeed?' · Loot':'');S.mode='Merchant · Zulieferer';moveToGoal(r,'Farmer-Service '+r.name,{kind:'merchant-service',tolerance:100,forceAfter:7000});return true;}
    if(!S.merchantServiceArrivedAt){S.merchantServiceArrivedAt=now;audit('merchant_service_arrival','Farmer erreicht',{farmer:r.name,request:cur.req,gold:r.gold,free:r.free,inventoryItems:cur.inventory});}
    S.status='Versorge '+r.name+' · Loot/Gold/Tränke übernehmen';S.mode='Merchant · Zulieferer';if(merchantSupplyTick())return true;
    if(now-S.merchantServiceArrivedAt<7000)return true;S.merchantLastService[r.name]=now;write('merchantLastService',S.merchantLastService);delete S.merchantServiceUrgent[r.name];audit('merchant_service_done','Farmer-Service abgeschlossen',{farmer:r.name,durationMs:now-S.merchantServiceArrivedAt});S.merchantServiceTarget=null;S.merchantServiceArrivedAt=0;S.merchantServiceDelivered={hp:false,mp:false};return true;
  }
  function v277PlannerSteps(plan){
    var fs=farmerReports(),goal=plan&&plan.farmGoal,job=plan&&plan.job,svc=v277MerchantServiceCandidates()[0];var out=[];
    out.push(svc?'Zulieferung/Abholung bei '+svc.r.name:'Farmer-Service überwachen');
    if(job&&job.material)out.push('Materialauftrag: '+v273Name(job.material.name)+' ['+job.material.have+'/'+job.material.required+']');else if(goal)out.push('EXP-Farmziel: '+v273Name(goal.monster)+' · '+goal.map);else out.push('Stabiles EXP-Farmziel aus Live-Daten bestimmen');
    out.push('Upgrades, Combines und Crafting prüfen');out.push('Bank, Gold und Trankvorräte organisieren');out.push('Farmer-Stärke und Farmziel neu bewerten');return out.slice(0,5);
  }
  function v277FallbackFarmGoal(){var fs=farmerReports().filter(function(r){return r&&!r.rip&&r.active!==false;});if(!fs.length)return null;var by={};fs.forEach(function(r){var k=r.map||'';(by[k]||(by[k]={rows:[],score:0})).rows.push(r);by[k].score+=v273FarmerStrength(r);});var g=Object.keys(by).map(function(k){return {map:k,rows:by[k].rows,score:by[k].rows.length*100000+by[k].score};}).sort(function(a,b){return b.score-a.score;})[0];if(!g)return null;var rr=g.rows.slice().sort(function(a,b){return (b.targetMtype?1:0)-(a.targetMtype?1:0)||v273FarmerStrength(b)-v273FarmerStrength(a);})[0],mon=rr.targetMtype||C.monster;return {id:'live:'+g.map+':'+mon,map:g.map,monster:mon,x:Number(rr.x)||0,y:Number(rr.y)||0,count:Math.max(3,g.rows.length),live:true};}
  function v273MerchantPlannerTick(){
    if(character.ctype!=='merchant'||!C.merchantPlannerEnabled)return null;var db=v273BuildKnowledgeDB(false),job=v273ChooseCraftJob(),plan={job:null,farmOrder:null,farmGoal:null,knowledge:{gameVersion:db.gameVersion,recipes:db.recipeCount,drops:db.dropItemCount,spawns:db.spawnCount}};
    if(C.merchantAutoCraft&&job){var miss=job.missing&&job.missing[0];if(miss){var dr=v273DropMonsterFor(miss.name),goal=dr&&v273GoalForMonster(dr.monster);if(dr&&goal){var total=job.agg.items[miss.name]&&job.agg.items[miss.name].q||0;plan.job={recipe:job.recipe,material:{name:miss.name,required:miss.required,have:total},monster:dr.monster};plan.farmOrder={item:miss.name,required:miss.required,have:total,monster:dr.monster};plan.farmGoal=goal;plan.steps=v277PlannerSteps(plan);return v273SetMerchantPlan(plan);}}else{var collect=(job.recipe.items||[]).map(function(x){return {name:x.name,required:x.q,merchantHave:qty(x.name)};}).filter(function(x){return x.merchantHave<x.required;});plan.job={recipe:job.recipe};plan.collectOrder=collect;plan.steps=v277PlannerSteps(plan);return v273SetMerchantPlan(plan);}}
    plan.farmGoal=v273GroupAutoGoal()||v277FallbackFarmGoal();plan.steps=v277PlannerSteps(plan);return v273SetMerchantPlan(plan);
  }
  function merchantTick(){
    if(clock()>(S.times.knowledgeRefresh||0)){S.times.knowledgeRefresh=clock()+60000;v273BuildKnowledgeDB(false);}if(clock()>(S.times.merchantPlan||0)){S.times.merchantPlan=clock()+4000;v273MerchantPlannerTick();}
    var svc=v277MerchantServiceCandidates()[0];if(svc&&svc.urgent&&v277MerchantServiceTick())return;if(v273CollectFromFarmersTick())return;if(v273CraftTick())return;if(v273UpgradeTick())return;if(v273CompoundTick())return;if(v273DistributeGearTick())return;if(v273ExchangeTick())return;if(v273StoreTrashBankTick())return;if(v273SellTrashTick())return;if(elixirCraftUpgradeTick())return;if(deliverElixirTick())return;if(svc&&v277MerchantServiceTick())return;if(merchantStandTick())return;
    S.status='Logistik bereit · Farmer farmen weiter';S.mode='Merchant · Koordination';
  }
  function v277DashboardCompatibility(endpoint){try{var u=new URL(endpoint),page=String(P.location&&P.location.protocol||''),mixed=page==='https:'&&u.protocol==='http:',bplaced=/\.bplaced\.net$/i.test(u.hostname);return {ok:!mixed,endpointProtocol:u.protocol,pageProtocol:page,host:u.hostname,bplaced:bplaced,mixedContent:mixed,reason:mixed?(bplaced?'HTTP-bplaced-Endpunkt kann aus der HTTPS-Spielseite nicht angesprochen werden; bplaced HTTPS/SSL ist tarifabhängig.':'HTTP-Endpunkt wird von der HTTPS-Spielseite als Mixed Content blockiert.'):'',configured:String(endpoint||'').replace(/([?&](?:key|token)=)[^&]+/ig,'$1***')};}catch(e){return {ok:false,reason:'invalid dashboard URL: '+reason(e)};}}
  function v277DashboardEnvDiag(endpoint){var c=v277DashboardCompatibility(endpoint),nav=P.navigator||{};return Object.assign(c,{fetch:typeof fetch==='function'||typeof P.fetch==='function',sendBeacon:typeof nav.sendBeacon==='function',dom:!!(D&&D.body),origin:String(P.location&&P.location.origin||''),hrefProtocol:String(P.location&&P.location.protocol||''),userAgent:safeString(nav.userAgent||'',180)});}
  function dashboardPublishTick(force){
    if((!C.webDashboardEnabled&&!force)||S.dashboardSending)return false;var raw=String(C.webDashboardConnectionUrl||'').trim(),endpoint=normalizeDashboardEndpoint(raw);if(!endpoint){S.dashboardLastError='Invalid dashboard URL';S.dashboardFailAt=clock();return false;}var rawCompat=v277DashboardCompatibility(raw);S.dashboardCompatibility=rawCompat;if(rawCompat.mixedContent&&/\.bplaced\.net$/i.test(rawCompat.host||'')){S.dashboardFailAt=clock();S.dashboardLastError='Hosting/HTTPS inkompatibel: '+rawCompat.reason;if(clock()>(S.times.dashboardHostWarn||0)){S.times.dashboardHostWarn=clock()+60000;audit('dashboard_host_incompatible',S.dashboardLastError,v277DashboardEnvDiag(raw),'error');}return false;}if(!force&&clock()-S.lastDashboardPublish<C.webDashboardIntervalSeconds*1000)return false;S.lastDashboardPublish=clock();var payload=dashboardPayload();S.dashboardSending=true;S.dashboardTransportErrors=[];audit('dashboard_send','Dashboard status send',{endpointHost:endpoint.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'),environment:v277DashboardEnvDiag(endpoint),payload:v276DashboardCompactPayload(payload)});
    v276DashboardScriptPush(endpoint,payload).then(function(transport){S.dashboardTransport=transport;return transport;}).catch(function(e){S.dashboardTransportErrors.push('script: '+reason(e));return v275DashboardPost(endpoint,payload).then(function(transport){S.dashboardTransport=transport+'/unverified';audit('dashboard_write_unverified','Status-POST wurde ausgelöst; Antwort ist wegen Browsergrenzen nicht lesbar',{transport:transport},'warning');return transport;});}).then(function(){S.dashboardLastOK=clock();S.dashboardFailAt=0;S.dashboardLastError=S.dashboardTransport.indexOf('unverified')>=0?'Status gesendet, aber vom Browser nicht bestätigbar':'';if(S.dashboardTransport.indexOf('unverified')<0){S.dashboardLastAck=clock();S.dashboardAckName=me;audit('dashboard_ack','Dashboard status serverseitig bestätigt',{name:me,transport:S.dashboardTransport});}}).catch(function(e){S.dashboardFailAt=clock();S.dashboardLastError=[].concat(S.dashboardTransportErrors||[],[reason(e)]).join(' | ');audit('dashboard_error','Dashboard vollständig fehlgeschlagen: '+S.dashboardLastError,{environment:v277DashboardEnvDiag(endpoint)},'error');}).finally(function(){S.dashboardSending=false;renderAll(true);});return true;
  }
  function v277DiagnosticTick(){
    if(!C.diagnosticMode||clock()<(S.times.diag||0))return false;S.times.diag=clock()+C.diagnosticSeconds*1000;S.diagSeq=(S.diagSeq||0)+1;var base={seq:S.diagSeq,status:S.status,mode:S.mode,map:character.map,x:Math.round(Number(character.x)||0),y:Math.round(Number(character.y)||0),hp:character.hp,mp:character.mp,target:S.target,targetMtype:v277TargetMtype(),move:{inFlight:S.moveInFlight,kind:S.moveKind,destination:S.moveDestination,requestedAt:S.moveRequestedAt},party:partyState()};
    if(character.ctype==='merchant'){var c=v277MerchantServiceCandidates();audit('diag_merchant','Merchant-Diagnose',Object.assign(base,{plan:S.merchantPlan,serviceTarget:S.merchantServiceTarget,candidates:c.slice(0,4).map(function(x){return {name:x.r.name,map:x.r.map,free:x.r.free,gold:x.r.gold,hpot:x.r.hpot,mpot:x.r.mpot,request:x.req,lootNeed:x.lootNeed,freeNeed:x.freeNeed,goldNeed:x.goldNeed,potNeed:x.potNeed,urgent:x.urgent,routine:x.routine,priority:x.priority,reportAge:clock()-x.r.at};}),knowledge:S.knowledgeDB&&{gameVersion:S.knowledgeDB.gameVersion,recipes:S.knowledgeDB.recipeCount,drops:S.knowledgeDB.dropItemCount,spawns:S.knowledgeDB.spawnCount}}));}
    else {var mpPlan=v276ManaPlan(),ct=null;try{ct=get_target&&get_target();}catch(_e){}var skillDiag=v276EnabledSkillRows().map(function(id){var d=GD.skills[id]||{},cost=Number(d.mp)||0,usable=skillCanUse(id),inRange=true;try{if(ct&&typeof is_in_range==='function')inRange=!!is_in_range(ct,id);}catch(_x){}var reserveAfter=Math.max(character.max_mp*C.manaReserve/100,mpPlan.highestCost),isHighest=mpPlan.highestCost>0&&cost>=mpPlan.highestCost,manaOk=isHighest?character.mp>=cost:character.mp-cost>=Math.min(character.max_mp,reserveAfter);return {id:id,mp:cost,usable:usable,inRange:inRange,manaOk:manaOk,cooldown:typeof is_on_cooldown==='function'?!!is_on_cooldown(id):null,explicit:v276ExplicitSkillEnabled(id)};});audit('diag_combat','Kampf-/Versorgungsdiagnose',Object.assign(base,{role:roleForName(me),goal:S.goal,kite:S.kiteNav,manaPlan:mpPlan,enabledSkills:skillDiag,supply:v277OwnSupplyRequest(),combatAnchor:v276CombatGroupAnchorInfo(),visibleEnemies:mobs().filter(function(m){return safeEnemy(m)&&m.map===character.map;}).slice(0,12).map(function(m){return {id:targetID(m),mtype:m.mtype,hp:m.hp,target:m.target,distance:Math.round(dist(character,m))};})}));}
    audit('diag_update','Update-Diagnose',{version:VERSION,checkedAt:S.update.checkedAt,latest:S.update.latest,available:S.update.available,checking:S.update.checking,applying:S.update.applying,error:S.update.error,activeSlot:activeCodeSlot(),automatic:true});if(C.webDashboardEnabled)audit('diag_dashboard','Dashboard-Diagnose',v277DashboardEnvDiag(String(C.webDashboardConnectionUrl||'')));return false;
  }
  function merchantHTML(){var fs=farmerReports(),db=v273BuildKnowledgeDB(false),agg=v273AggregateInventory(),p=S.merchantPlan||{},cands=v277MerchantServiceCandidates();return '<h2>Merchant Einstellungen</h2><div class="notice"><b>Merchant = Logistikleiter und Zulieferer.</b> Er besucht Farmer selbstständig, übernimmt Loot/Gold und liefert Tränke. Grenzwerte 0 = automatisch aus Verbrauch + Liefermenge.</div>'+cfgField('merchantForceLeader','Merchant als Party-Leiter','check')+cfgField('merchantPlannerEnabled','Merchant-Planer aktiv','check')+cfgField('merchantSupply','Farmer automatisch versorgen','check')+cfgField('merchantCollectLoot','Loot und Gold abholen','check')+cfgField('merchantDeliveryHPQty','HP-Tränke pro Lieferung','number')+cfgField('merchantDeliveryMPQty','MP-Tränke pro Lieferung','number')+cfgField('merchantRestockHPAt','HP-Untergrenze (0 = automatisch)','number')+cfgField('merchantRestockMPAt','MP-Untergrenze (0 = automatisch)','number')+cfgField('merchantServiceIntervalSeconds','Spätestens Farmer besuchen nach (Sek.)','number')+cfgField('merchantPickupFreeSlotsAt','Loot-Abholung wenn freie Slots ≤','number')+cfgField('merchantCollectGoldOver','Gold-Abholung ab','number')+cfgField('merchantFarmerGoldReserve','Gold beim Farmer belassen','number')+cfgField('merchantAutoCraft','Automatisch craften','check')+cfgField('merchantCraftTargets','Bevorzugte Craft-Item-IDs','text','Leer = automatisch')+cfgField('merchantAutoUpgrade','Nützliche Items automatisch verbessern','check')+cfgField('merchantUpgradeMax','Upgrade-Obergrenze +','number')+cfgField('merchantAutoCompound','Nützliche Items automatisch kombinieren','check')+cfgField('merchantCompoundMax','Combine-Obergrenze','number','0 = Spielmaximum')+cfgField('merchantManageBank','Bank automatisch verwalten','check')+cfgField('merchantAutoUnlockBank','Neue Bankpacks freischalten','check')+'<div class="card"><h3>Zulieferstatus</h3>'+(cands.length?cands.slice(0,4).map(function(x){return '<div class="line"><span>'+esc(x.r.name)+'</span><strong>'+esc((x.potNeed?'Tränke ':'')+(x.goldNeed?'Gold ':'')+(x.lootNeed?'Loot ':'')||'Routine')+'</strong></div>';}).join(''):'<div class="muted">Aktuell kein dringender Service.</div>')+'</div><div class="card"><h3>Aktueller Plan</h3>'+(p.steps||[]).map(function(x,i){return '<div class="line"><span>'+(i===0?'Jetzt':'+'+i)+'</span><strong>'+esc(x)+'</strong></div>';}).join('')+'</div><div class="card"><h3>Live-Datenbank</h3><div class="dbstats"><div>Rezepte<b>'+db.recipeCount+'</b></div><div>Drop-Items<b>'+db.dropItemCount+'</b></div><div>Spawns<b>'+db.spawnCount+'</b></div></div></div><div class="muted">Geteilte Inventare: '+Object.keys(agg.items).length+' Item-IDs.</div>';}
  function settingsHTML(){var themeOptions=[['midnight','Midnight Glass'],['arctic','Arctic Light'],['solarized','Solarized'],['neon','Neon Cyber'],['forest','Forest'],['crimson','Crimson'],['royal','Royal Violet'],['sakura','Sakura'],['contrast','High Contrast'],['paper','Paper / Sepia']];return '<h2>'+esc(T('settings_updates'))+'</h2>'+cfgField('language',T('language'),'select','15 widely spoken languages; English is the default for new installs.',LANGS)+cfgField('theme',T('theme'),'select','10 visually distinct themes.',themeOptions)+'<div class="notice"><b>Vollautomatisches Update:</b> Prüfung jede Minute → Download → Syntax-/Versionsprüfung → aktiven CODE-Slot speichern → Hot-Reload. Kein Benutzereingriff nötig und nicht abschaltbar.</div>'+cfgField('updateRepositoryUrl','Bot repository','url','Single repository only; no fallback repository is used.')+cfgField('auditEnabled','Detailed audit log','check')+cfgField('diagnosticMode','Gezielter Diagnosemodus','check')+cfgField('diagnosticSeconds','Diagnose-Snapshot alle (Sek.)','number')+cfgField('logSegmentHours','Log segment hours','number')+cfgField('logRetentionDays','Log retention days','number')+'<div class="buttons"><button class="btn primary" data-action="update-check">Check for update</button></div><div class="card"><div class="line"><span>'+esc(T('current_version'))+'</span><strong>'+VERSION+'</strong></div><div class="line"><span>'+esc(T('found_version'))+'</span><strong class="'+(S.update.available?'good':'')+'">'+esc(S.update.latest||'—')+'</strong></div></div>';}

  // ---------------------------------------------------------------------------
  // 2.7.8 full recipe intelligence + HTTPS dashboard retry
  // ---------------------------------------------------------------------------
  function v273BuildKnowledgeDB(force){
    var now=clock(),gv=v273GameVersion(),cached=S.knowledgeDB||read('knowledgeDB',null),ttl=C.merchantRecipeRefreshHours*3600000;if(!force&&cached&&Number(cached.schema)>=2&&cached.gameVersion===gv&&now-Number(cached.refreshedAt||0)<ttl){S.knowledgeDB=cached;return cached;}
    var recipes={},recipesByOutput={};Object.keys(GD.craft||{}).forEach(function(id){var r=GD.craft[id]||{};if(!Array.isArray(r.items))return;var ro=r.output,out=id,outLevel=0,outQ=1;if(typeof ro==='string')out=ro;else if(ro&&typeof ro==='object'){out=ro.name||id;outLevel=Math.max(0,Number(ro.level)||0);outQ=Math.max(1,Number(ro.q||ro.quantity)||1);}var rec={id:id,output:out,outputLevel:outLevel,outputQ:outQ,quest:typeof r.quest==='string'?r.quest:'',cost:Number(r.cost)||0,items:r.items.map(function(x){return {q:Number(x&&x[0])||1,name:x&&x[1],level:Math.max(0,Number(x&&x[2])||0)};}).filter(function(x){return x.name;})};recipes[id]=rec;(recipesByOutput[out]||(recipesByOutput[out]=[])).push(id);});
    var drops={};var dm=GD.drops&&GD.drops.monsters||{};Object.keys(dm).forEach(function(mon){var rows=v273ExtractDropRows(dm[mon],[]);rows.forEach(function(row){if(!drops[row.name])drops[row.name]=[];drops[row.name].push({monster:mon,chance:row.chance,q:row.q});});});Object.keys(drops).forEach(function(k){drops[k].sort(function(a,b){return b.chance-a.chance;});});var spawns={};SPAWNS.forEach(function(sp){if(!spawns[sp.monster])spawns[sp.monster]=[];spawns[sp.monster].push(sp);});var db={schema:2,gameVersion:gv,refreshedAt:now,recipes:recipes,recipesByOutput:recipesByOutput,drops:drops,spawns:spawns,recipeCount:Object.keys(recipes).length,dropItemCount:Object.keys(drops).length,spawnCount:SPAWNS.length};S.knowledgeDB=db;write('knowledgeDB',db);audit('knowledge_refresh','Live knowledge database refreshed',{schema:2,gameVersion:gv,recipes:db.recipeCount,recipeOutputs:Object.keys(recipesByOutput).length,dropItems:db.dropItemCount,spawns:db.spawnCount});return db;
  }
  function v278MaterialKey(name,level){return String(name||'')+'|'+Math.max(0,Number(level)||0);}
  function v278AggregateMaterials(){
    var exact={},byName={},byChar={};peers(true).forEach(function(r){var inv=Array.isArray(r.inventory)?r.inventory:[];byChar[r.name]=inv;inv.forEach(function(i){if(!i||!i.name)return;var q=Number(i.q)||1,k=v278MaterialKey(i.name,i.level);exact[k]=(exact[k]||0)+q;byName[i.name]=(byName[i.name]||0)+q;});});return {exact:exact,byName:byName,byChar:byChar};
  }
  function v278RecipeMissing(recipe,agg){
    agg=agg||v278AggregateMaterials();return (recipe&&recipe.items||[]).map(function(x){var need=Number(x.q)||1,lv=Math.max(0,Number(x.level)||0),have=agg.exact[v278MaterialKey(x.name,lv)]||0;return {name:x.name,level:lv,required:need,have:have,missing:Math.max(0,need-have)};}).filter(function(x){return x.missing>0;});
  }
  function v278LocalMaterialCount(name,level){var lv=Math.max(0,Number(level)||0),n=0;(character.items||[]).forEach(function(it){if(it&&it.name===name&&(Number(it.level)||0)===lv)n+=Number(it.q)||1;});return n;}
  function v278FindRecipeForOutput(name,agg){var db=v273BuildKnowledgeDB(false),ids=(db.recipesByOutput&&db.recipesByOutput[name]||[]).slice();if(!ids.length&&db.recipes&&db.recipes[name])ids=[name];agg=agg||v278AggregateMaterials();var rows=ids.map(function(id){var r=db.recipes[id],miss=v278RecipeMissing(r,agg),unknown=0,amount=0;miss.forEach(function(m){amount+=m.missing;if(m.level===0&&!((db.recipesByOutput&&db.recipesByOutput[m.name]||[]).length)&&!((db.drops&&db.drops[m.name]||[]).length))unknown++;});return {r:r,score:unknown*100000+amount*100+Number(r.cost||0)/10000+(r.quest?5:0)};}).sort(function(a,b){return a.score-b.score||a.r.id.localeCompare(b.r.id);});return rows[0]&&rows[0].r||null;}
  function v273RetrieveMaterialFromBankTick(recipe){
    if(character.ctype!=='merchant'||!C.merchantManageBank||!recipe)return false;var needed=(recipe.items||[]).filter(function(x){return v278LocalMaterialCount(x.name,x.level)<x.q;});if(!needed.length)return false;if(!character.bank){S.status='Bank prüfen für Crafting-Material';S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},'Bank prüfen',{kind:'bank',forceAfter:7000});}
    for(var ni=0;ni<needed.length;ni++){var need=needed[ni],lv=Math.max(0,Number(need.level)||0);for(var pack in character.bank){if(!/^items\d+$/.test(pack)||!Array.isArray(character.bank[pack]))continue;for(var j=0;j<character.bank[pack].length;j++){var it=character.bank[pack][j];if(it&&it.name===need.name&&(Number(it.level)||0)===lv&&typeof bank_retrieve==='function'){S.status='Hole '+v273Name(need.name)+(lv?' +'+lv:'')+' aus der Bank';return action('Bank-Material holen '+need.name,function(){return bank_retrieve(pack,j);},'bank-retrieve:'+need.name+':'+lv,1800);}}}}return false;
  }
  function v278RecipientRows(){
    var fs=farmerReports().filter(function(r){return r&&r.active!==false&&!r.rip;}).slice().sort(function(a,b){return v273FarmerStrength(a)-v273FarmerStrength(b)||a.name.localeCompare(b.name);});
    var self=report(false);self.name=me;self.ctype=character.ctype;self.slots=v273CompactSlots();self.inventory=v273InventoryReport();self._merchantSelf=true;return fs.concat(character.ctype==='merchant'?[self]:[]);
  }
  function v278CurrentSlotScore(r,itemName){
    var slots=v273EquipSlotsForItem(itemName);if(!slots.length)return null;var best={slot:null,score:Infinity,item:null};slots.forEach(function(k){var cur=r&&r.slots&&r.slots[k],score=cur?v273ItemScoreForClass(cur,r.ctype):-1e12;if(score<best.score)best={slot:k,score:score,item:cur||null};});return best;
  }
  function v278ImprovementFor(r,output,outputLevel){
    if(!r||!r.ctype||!v273ClassCanUse(output,r.ctype))return null;var slots=v273EquipSlotsForItem(output);if(!slots.length)return null;var probe={name:output,level:Math.max(0,Number(outputLevel)||0)},candidate=v273ItemScoreForClass(probe,r.ctype);if(candidate<=-1e11)return null;var cur=v278CurrentSlotScore(r,output);if(!cur)return null;var delta=candidate-cur.score,threshold=cur.score<-1e11?0:Math.max(20,Math.abs(cur.score)*.04);if(delta<=threshold)return null;return {recipient:r.name,ctype:r.ctype,farmer:r.ctype!=='merchant',strength:v273FarmerStrength(r),slot:cur.slot,current:cur.item,currentScore:cur.score,candidateScore:candidate,delta:delta,ratio:cur.score<-1e11?99:delta/Math.max(1,Math.abs(cur.score))};
  }
  function v278InventoryCount(name,minLevel){var n=0,lv=Math.max(0,Number(minLevel)||0);peers(true).forEach(function(r){(r.inventory||[]).forEach(function(i){if(i&&i.name===name&&(Number(i.level)||0)>=lv)n+=Number(i.q)||1;});});return n;}
  function v278RecipeFeasibility(recipe,agg){var db=v273BuildKnowledgeDB(false),missing=v278RecipeMissing(recipe,agg),unknown=0,effort=0,blocked=0;missing.forEach(function(m){var d=GD.items&&GD.items[m.name]||{},craftable=!!v278FindRecipeForOutput(m.name,agg),droppable=!!((db.drops&&db.drops[m.name]||[]).length);if(m.level>0){if(d.upgrade&&m.level>Number(C.merchantUpgradeMax||0))blocked++;else if(d.compound&&m.level>v273EffectiveCompoundMax(m.name))blocked++;else if(!d.upgrade&&!d.compound&&!craftable)effort+=m.missing*80;}if(!craftable&&!droppable&&m.level===0)unknown++;var drop=(db.drops&&db.drops[m.name]||[])[0],chance=drop&&Number(drop.chance)||0;effort+=m.missing*(craftable?6:(chance>0?Math.min(80,1/Math.max(.002,chance)):35));});effort+=Number(recipe.cost||0)/100000;return {missing:missing,unknown:unknown,blocked:blocked,effort:effort,ready:missing.length===0};}
  function v278AnalyzeRecipes(force){
    var now=clock();if(!force&&S.recipeAnalysis&&now-Number(S.recipeAnalysis.at||0)<3500)return S.recipeAnalysis;var db=v273BuildKnowledgeDB(false),recipients=v278RecipientRows(),explicit=csv(C.merchantCraftTargets),agg=v278AggregateMaterials(),rows=[],stats={scanned:0,equipment:0,farmerImprovements:0,merchantImprovements:0,noItem:0,nonEquipment:0,noImprovement:0,spareAvailable:0,blockedByLimits:0};
    Object.keys(db.recipes||{}).forEach(function(id){stats.scanned++;var recipe=db.recipes[id],out=recipe.output||id,lv=Math.max(0,Number(recipe.outputLevel)||0),d=GD.items&&GD.items[out];if(!d){stats.noItem++;return;}if(!v273EquipSlotsForItem(out).length){stats.nonEquipment++;return;}stats.equipment++;var improvements=recipients.map(function(r){return v278ImprovementFor(r,out,lv);}).filter(Boolean),farmerRows=improvements.filter(function(x){return x.farmer;}),merchantRows=improvements.filter(function(x){return !x.farmer;});if(farmerRows.length)stats.farmerImprovements++;else if(merchantRows.length)stats.merchantImprovements++;else{stats.noImprovement++;return;}var feas=v278RecipeFeasibility(recipe,agg);if(feas.blocked){stats.blockedByLimits++;return;}var pool=farmerRows.length?farmerRows:merchantRows;pool.sort(function(a,b){return a.strength-b.strength||b.ratio-a.ratio||b.delta-a.delta||a.recipient.localeCompare(b.recipient);});var best=pool[0],needed=pool.length,spares=v278InventoryCount(out,lv);if(spares>=needed){stats.spareAvailable++;return;}var preferred=explicit.indexOf(id)>=0||explicit.indexOf(out)>=0,access=feas.ready?1e9:Math.max(0,5e8-feas.effort*2e6-feas.unknown*1e8);rows.push({recipe:recipe,recipeId:id,output:out,outputLevel:lv,recipient:best.recipient,recipientCtype:best.ctype,farmer:best.farmer,improvement:best,needed:needed,spares:spares,preferred:preferred,feasibility:feas,priority:(best.farmer?1e13:0)+(preferred?1e11:0)+access+best.ratio*1e8+best.delta*1e4-best.strength});
    });
    var dedup={};rows.forEach(function(x){var k=x.output+'|'+x.outputLevel+'|'+x.recipient,old=dedup[k];if(!old||x.priority>old.priority)dedup[k]=x;});rows=Object.keys(dedup).map(function(k){return dedup[k];}).sort(function(a,b){return b.priority-a.priority||a.output.localeCompare(b.output);});var result={at:now,stats:stats,rows:rows,top:rows.slice(0,10).map(function(x){return {recipeId:x.recipeId,output:x.output,level:x.outputLevel,recipient:x.recipient,farmer:x.farmer,slot:x.improvement.slot,delta:Math.round(x.improvement.delta),ratio:Math.round(x.improvement.ratio*1000)/10,needed:x.needed,spares:x.spares,missing:x.feasibility.missing.length,effort:Math.round(x.feasibility.effort*10)/10,preferred:x.preferred};})};S.recipeAnalysis=result;var sig=JSON.stringify(result.top.slice(0,3));if(sig!==S.recipeAnalysisSig||now>(S.times.recipeAnalysisLog||0)){S.recipeAnalysisSig=sig;S.times.recipeAnalysisLog=now+30000;audit('recipe_analysis','Alle Crafting-Rezepte gegen Gruppenausrüstung bewertet',{scanned:stats.scanned,equipment:stats.equipment,farmerImprovements:stats.farmerImprovements,merchantImprovements:stats.merchantImprovements,blockedByLimits:stats.blockedByLimits,spareAvailable:stats.spareAvailable,top:result.top});}return result;
  }
  function v278ResolveRequirement(req,candidate,depth,seen,agg){
    if(!req||req.missing<=0)return null;depth=depth||0;agg=agg||v278AggregateMaterials();if(depth>8)return {candidate:candidate,recipe:candidate.recipe,missing:[req],agg:agg,depth:depth,unresolved:true};var db=v273BuildKnowledgeDB(false),d=GD.items&&GD.items[req.name]||{};
    if(req.level<=0){var sub=v278FindRecipeForOutput(req.name,agg);if(sub&&!seen[sub.id]){var nested={recipe:sub,output:candidate.output,outputLevel:candidate.outputLevel,recipient:candidate.recipient,recipientCtype:candidate.recipientCtype,farmer:candidate.farmer,improvement:candidate.improvement,rootCandidate:candidate,intermediate:req.name};return v278ResolveRecipeCandidate(nested,depth+1,seen);}return {candidate:candidate,recipe:candidate.recipe,missing:[req],agg:agg,depth:depth,rootOutput:candidate.output,targetRecipient:candidate.recipient};}
    var kind=d.compound?'compound':d.upgrade?'upgrade':null;if(!kind)return {candidate:candidate,recipe:candidate.recipe,missing:[req],agg:agg,depth:depth,rootOutput:candidate.output,targetRecipient:candidate.recipient,unresolvedLevel:true};var mult=kind==='compound'?3:1,inputCount=req.missing*mult,fromLevel=req.level-1,have=agg.exact[v278MaterialKey(req.name,fromLevel)]||0;if(have<inputCount){return v278ResolveRequirement({name:req.name,level:fromLevel,required:inputCount,have:have,missing:inputCount-have},candidate,depth+1,seen,agg);}return {candidate:candidate,recipe:candidate.recipe,missing:[],agg:agg,depth:depth,rootOutput:candidate.output,targetRecipient:candidate.recipient,prep:{kind:kind,name:req.name,fromLevel:fromLevel,toLevel:req.level,operations:req.missing,inputCount:inputCount}};
  }
  function v278ResolveRecipeCandidate(candidate,depth,seen){
    if(!candidate||!candidate.recipe)return null;depth=depth||0;seen=seen||{};var rid=candidate.recipe.id||candidate.recipe.output;if(depth>8||seen[rid])return {candidate:candidate,recipe:candidate.recipe,missing:v278RecipeMissing(candidate.recipe),depth:depth,cycle:true};seen=Object.assign({},seen);seen[rid]=true;var agg=v278AggregateMaterials(),missing=v278RecipeMissing(candidate.recipe,agg);if(!missing.length)return {candidate:candidate,recipe:candidate.recipe,missing:[],agg:agg,depth:depth,rootOutput:candidate.output,targetRecipient:candidate.recipient};for(var i=0;i<missing.length;i++){var r=v278ResolveRequirement(missing[i],candidate,depth,seen,agg);if(r){r.rootOutput=candidate.output;r.targetRecipient=candidate.recipient;return r;}}return {candidate:candidate,recipe:candidate.recipe,missing:missing,agg:agg,depth:depth,rootOutput:candidate.output,targetRecipient:candidate.recipient};
  }
  function v278ChooseCraftJob(){var a=v278AnalyzeRecipes(false);if(!a.rows.length)return null;var root=a.rows[0],job=v278ResolveRecipeCandidate(root,0,{});if(!job)return null;job.root=root;job.rootOutput=root.output;job.rootOutputLevel=root.outputLevel||0;job.targetRecipient=root.recipient;job.targetCtype=root.recipientCtype;job.improvement=root.improvement;return job;}
  function v278PlannerSteps(plan){
    var out=[],job=plan&&plan.job,root=job&&job.rootOutput,rec=job&&job.targetRecipient;if(job&&job.material){out.push('Bekämpfe '+v273Name(job.monster)+' für '+v273Name(job.material.name)+' ['+job.material.have+'/'+job.material.required+']');out.push('Ziel: '+v273Name(root||job.recipe.output)+' für '+(rec||'Gruppe'));out.push('Materialien bei Farmern/Bank zusammenführen');out.push('Crafting-Kette fortsetzen: '+v273Name(job.recipe.output));out.push('Gefertigtes Upgrade an '+(rec||'besten Empfänger')+' liefern');}
    else if(job&&job.recipe){out.push((job.recipe.output!==root?'Zwischenrezept: ':'Crafte Upgrade: ')+v273Name(job.recipe.output));out.push('Endziel: '+v273Name(root||job.recipe.output)+' → '+(rec||'Gruppe'));out.push('Materialien aller 4 Charaktere + Bank prüfen');out.push('Nach Crafting Ausrüstungsgewinn erneut berechnen');out.push('Farmer zuerst, Merchant nur ohne Farmer-Upgrade');}
    else{out.push('Alle '+((S.knowledgeDB&&S.knowledgeDB.recipeCount)||0)+' Rezepte gegen Gruppenausrüstung prüfen');out.push('Farmer-Upgrades vor Merchant-Upgrades priorisieren');out.push('Upgrades / Combines / Crafting ausführen');out.push('Bank, Gold und Trankvorräte organisieren');out.push('Bestes EXP-Farmgebiet bestimmen');}return out.slice(0,5);
  }
  function v273MerchantPlannerTick(){
    if(character.ctype!=='merchant'||!C.merchantPlannerEnabled)return null;var db=v273BuildKnowledgeDB(false),job=C.merchantAutoCraft?v278ChooseCraftJob():null,plan={job:null,farmOrder:null,farmGoal:null,knowledge:{gameVersion:db.gameVersion,recipes:db.recipeCount,drops:db.dropItemCount,spawns:db.spawnCount},recipeAnalysis:S.recipeAnalysis&&S.recipeAnalysis.stats||null};
    if(job){var miss=job.missing&&job.missing[0],root=job.root||job.candidate||{};plan.job={recipe:job.recipe,rootOutput:job.rootOutput||root.output||job.recipe.output,rootOutputLevel:job.rootOutputLevel||root.outputLevel||0,targetRecipient:job.targetRecipient||root.recipient||null,targetCtype:job.targetCtype||root.recipientCtype||null,improvement:job.improvement||root.improvement||null,depth:job.depth||0,prep:job.prep||null};if(miss){var dr=miss.level===0?v273DropMonsterFor(miss.name):null,goal=dr&&v273GoalForMonster(dr.monster),total=(job.agg&&job.agg.exact&&job.agg.exact[v278MaterialKey(miss.name,miss.level)])||0;plan.job.material={name:miss.name,level:miss.level||0,required:miss.required,have:total};if(dr&&goal){plan.job.monster=dr.monster;plan.farmOrder={item:miss.name,itemLevel:miss.level||0,required:miss.required,have:total,monster:dr.monster};plan.farmGoal=goal;}}
      var collect=[];if(job.prep){var pr=job.prep,need=pr.inputCount,have=v278LocalMaterialCount(pr.name,pr.fromLevel);if(have<need)collect.push({name:pr.name,level:pr.fromLevel,required:need,merchantHave:have});}else if(miss){var mh=v278LocalMaterialCount(miss.name,miss.level);if(mh<miss.required)collect.push({name:miss.name,level:miss.level,required:miss.required,merchantHave:mh});}else{collect=(job.recipe.items||[]).map(function(x){return {name:x.name,level:x.level||0,required:x.q,merchantHave:v278LocalMaterialCount(x.name,x.level)};}).filter(function(x){return x.merchantHave<x.required;});}plan.collectOrder=collect;plan.steps=v278PlannerSteps(plan);return v273SetMerchantPlan(plan);}
    plan.farmGoal=v273GroupAutoGoal()||v277FallbackFarmGoal();plan.steps=v278PlannerSteps(plan);return v273SetMerchantPlan(plan);
  }
  function v273CollectRequestedMaterialsTick(){
    if(character.ctype==='merchant'||!C.merchantCollectLoot)return false;var mr=v273MerchantReport(),mn=merchantName(),lp=mn&&localPlayer(mn);if(!mr||!lp||dist(character,lp)>260)return false;var mp=mr.merchantPlan||{},wanted=[];(mp.collectOrder||[]).forEach(function(x){if(x&&x.name)wanted.push({name:x.name,level:Math.max(0,Number(x.level)||0),required:Number(x.required)||1,merchantHave:Number(x.merchantHave)||0});});if(mp.farmOrder&&mp.farmOrder.item&&!wanted.some(function(x){return x.name===mp.farmOrder.item&&x.level===(Number(mp.farmOrder.itemLevel)||0);}))wanted.push({name:mp.farmOrder.item,level:Number(mp.farmOrder.itemLevel)||0,required:Number(mp.farmOrder.required)||1,merchantHave:Number(mp.farmOrder.have)||0});for(var n=0;n<wanted.length;n++){var w=wanted[n],idx=(character.items||[]).findIndex(function(it){return it&&it.name===w.name&&(Number(it.level)||0)===w.level;});if(idx>=0&&typeof send_item==='function'){var q=character.items[idx].q||1;return action('Crafting-Material an Merchant: '+w.name+(w.level?' +'+w.level:''),function(){return send_item(mn,idx,q);},'material-to-merchant:'+w.name+':'+w.level,1500);}}return false;
  }
  function v273CollectFromFarmersTick(){
    if(character.ctype!=='merchant'||!S.merchantPlan||!Array.isArray(S.merchantPlan.collectOrder)||!S.merchantPlan.collectOrder.length)return false;var wanted={};S.merchantPlan.collectOrder.forEach(function(x){if(x&&x.name)wanted[v278MaterialKey(x.name,x.level)]=true;});var holders=farmerReports().filter(function(r){return (r.inventory||[]).some(function(i){return i&&wanted[v278MaterialKey(i.name,i.level)]&&(Number(i.q)||1)>0;});}).sort(function(a,b){return dist(character,a)-dist(character,b);});if(!holders.length)return false;var h=holders[0],lp=localPlayer(h.name);if(lp&&dist(character,lp)<=250){S.status='Material von '+h.name+' übernehmen';S.mode='Merchant · Sammeln';return false;}S.status='Material bei '+h.name+' abholen';S.mode='Merchant · Sammeln';return moveToGoal(h,'Material beim Farmer abholen',{kind:'collect',tolerance:90,forceAfter:6500});
  }
  function v278PlannedItemIndex(name,minLevel){var best=-1,lv=Math.max(0,Number(minLevel)||0);(character.items||[]).some(function(it,i){if(it&&it.name===name&&(Number(it.level)||0)>=lv&&!it.l&&!it.p){best=i;return true;}return false;});return best;}
  function v278PendingGearDeliveryTick(){
    var d=S.pendingCraftDelivery;if(character.ctype!=='merchant'||!d||!d.name||!d.recipient)return false;var idx=v278PlannedItemIndex(d.name,d.level);if(idx<0){if(clock()-Number(d.at||0)>20000)S.pendingCraftDelivery=null;return false;}if(d.recipient===me&&typeof equip==='function'){var slotName=d.slot||((v273EquipSlotsForItem(d.name)||[])[0]);if(slotName){S.status='Eigenes Craft-Upgrade anlegen: '+v273Name(d.name);S.mode='Merchant · Ausrüstung';return action('Craft-Upgrade anlegen '+d.name,function(){return Promise.resolve(equip(idx,slotName)).then(function(v){audit('recipe_equip','Merchant hat gefertigtes Upgrade angelegt',d);S.pendingCraftDelivery=null;return v;});},'craft-equip',1800);}}var r=peerReport(d.recipient),lp=localPlayer(d.recipient);if(!r||r.rip||r.active===false)return false;if(lp&&dist(character,lp)<=260&&typeof send_item==='function'){S.status='Craft-Upgrade an '+d.recipient+': '+v273Name(d.name);S.mode='Merchant · Ausrüstung';return action('Gefertigtes Upgrade liefern '+d.name,function(){return Promise.resolve(send_item(d.recipient,idx,character.items[idx].q||1)).then(function(v){audit('recipe_delivery','Gefertigtes Upgrade ausgeliefert',d);S.pendingCraftDelivery=null;return v;});},'craft-delivery:'+d.recipient,2200);}S.status='Craft-Upgrade zu '+d.recipient+' bringen';S.mode='Merchant · Ausrüstung';return moveToGoal(r,'Gefertigtes Upgrade liefern',{kind:'craft-delivery',tolerance:100,forceAfter:8000});
  }
  function v278PrepareLeveledMaterialTick(){
    if(character.ctype!=='merchant'||!S.merchantPlan||!S.merchantPlan.job||!S.merchantPlan.job.prep)return false;var pr=S.merchantPlan.job.prep,need={items:[{name:pr.name,level:pr.fromLevel,q:pr.inputCount}]};if(v278LocalMaterialCount(pr.name,pr.fromLevel)<pr.inputCount){if(v273CollectFromFarmersTick())return true;if(v273RetrieveMaterialFromBankTick(need))return true;S.status='Warte auf '+v273Name(pr.name)+' +'+pr.fromLevel+' für '+pr.kind;S.mode='Merchant · Material';return false;}
    if(pr.kind==='upgrade'&&typeof upgrade==='function'){var idx=(character.items||[]).findIndex(function(it){return it&&it.name===pr.name&&(Number(it.level)||0)===pr.fromLevel&&!it.l&&!it.p;});if(idx<0)return false;var sc=v273EnsureScroll('scroll',character.items[idx]);if(sc<0)return true;S.status='Rezeptmaterial verbessern: '+v273Name(pr.name)+' +'+pr.fromLevel+' → +'+pr.toLevel;S.mode='Merchant · Rezeptvorbereitung';return action('Rezeptmaterial upgraden '+pr.name,function(){return Promise.resolve(upgrade(idx,sc)).then(function(v){S.recipeAnalysis=null;S.times.merchantPlan=0;audit('recipe_material_upgrade','Rezeptmaterial vorbereitet',{name:pr.name,from:pr.fromLevel,to:pr.toLevel});return v;});},'recipe-prep-upgrade',2800);}
    if(pr.kind==='compound'&&typeof compound==='function'){var rows=[];(character.items||[]).forEach(function(it,i){if(it&&it.name===pr.name&&(Number(it.level)||0)===pr.fromLevel&&!it.l&&!it.p)rows.push({it:it,i:i});});if(rows.length<3)return false;var cs=v273EnsureScroll('cscroll',rows[0].it);if(cs<0)return true;S.status='Rezeptmaterial kombinieren: '+v273Name(pr.name)+' +'+pr.fromLevel+' → +'+pr.toLevel;S.mode='Merchant · Rezeptvorbereitung';return action('Rezeptmaterial kombinieren '+pr.name,function(){return Promise.resolve(compound(rows[0].i,rows[1].i,rows[2].i,cs)).then(function(v){S.recipeAnalysis=null;S.times.merchantPlan=0;audit('recipe_material_compound','Rezeptmaterial vorbereitet',{name:pr.name,from:pr.fromLevel,to:pr.toLevel});return v;});},'recipe-prep-compound',3400);}return false;
  }
  function v278RecipeNpc(recipe){return recipe&&recipe.quest?String(recipe.quest):'craftsman';}
  function v278RecipeNpcTick(recipe){
    if(!recipe)return false;var npc=v278RecipeNpc(recipe),p=null;try{if(typeof find_npc==='function')p=find_npc(npc);}catch(e){}if(p&&(!p.map||p.map===character.map)&&dist(character,p)<=360)return false;if(S.craftNpcTarget===npc&&clock()-Number(S.craftNpcAt||0)<7000)return true;S.craftNpcTarget=npc;S.craftNpcAt=clock();S.status='Zum Rezept-NPC: '+npc;S.mode='Merchant · Crafting-Anreise';if(p)return moveToGoal(p,'Zum Rezept-NPC '+npc,{kind:'craft-npc',tolerance:120,forceAfter:9000});if(typeof smart_move==='function')return action('Zum Rezept-NPC '+npc,function(){return smart_move(npc);},'craft-npc:'+npc,8000);return false;
  }
  function v273CraftTick(){
    if(character.ctype!=='merchant'||!C.merchantAutoCraft||!S.merchantPlan||!S.merchantPlan.job||!S.merchantPlan.job.recipe)return false;var job=S.merchantPlan.job,recipe=job.recipe;if(job.prep)return false;var localMissing=(recipe.items||[]).filter(function(x){return v278LocalMaterialCount(x.name,x.level)<x.q;});if(S.merchantPlan.collectOrder&&S.merchantPlan.collectOrder.length&&localMissing.length){if(v273CollectFromFarmersTick())return true;}if(v273RetrieveMaterialFromBankTick(recipe))return true;localMissing=(recipe.items||[]).filter(function(x){return v278LocalMaterialCount(x.name,x.level)<x.q;});if(localMissing.length){S.status='Warte auf Crafting-Material: '+v273Name(localMissing[0].name)+(localMissing[0].level?' +'+localMissing[0].level:'');S.mode='Merchant · Material';return false;}if(character.gold<Number(recipe.cost||0)){S.status='Zu wenig Gold für Rezept: '+v273Name(recipe.output);S.mode='Merchant · Crafting';return false;}if(v278RecipeNpcTick(recipe))return true;if(typeof auto_craft!=='function')return false;S.status=(recipe.quest?'Tausche/Crafte ':'Crafte ')+v273Name(recipe.output)+(job.targetRecipient?' für '+job.targetRecipient:'');S.mode='Merchant · Crafting';return action('Crafting '+(recipe.id||recipe.output),function(){return Promise.resolve(auto_craft(recipe.id||recipe.output)).then(function(v){audit('recipe_crafted','Rezept hergestellt',{recipeId:recipe.id||recipe.output,output:recipe.output,outputLevel:recipe.outputLevel||0,rootOutput:job.rootOutput,targetRecipient:job.targetRecipient,depth:job.depth,quest:recipe.quest||''});if(job.rootOutput===recipe.output&&job.targetRecipient)S.pendingCraftDelivery={name:recipe.output,level:job.rootOutputLevel||recipe.outputLevel||0,recipient:job.targetRecipient,slot:job.improvement&&job.improvement.slot||null,at:clock(),improvement:job.improvement||null};S.recipeAnalysis=null;S.times.merchantPlan=0;S.craftNpcTarget=null;return v;});},'merchant-craft:'+(recipe.id||recipe.output),3800);
  }
  function merchantTick(){
    if(clock()>(S.times.knowledgeRefresh||0)){S.times.knowledgeRefresh=clock()+60000;v273BuildKnowledgeDB(false);}if(clock()>(S.times.merchantPlan||0)){S.times.merchantPlan=clock()+4000;v273MerchantPlannerTick();}var svc=v277MerchantServiceCandidates()[0];if(svc&&svc.urgent&&v277MerchantServiceTick())return;if(v278PendingGearDeliveryTick())return;if(v273CollectFromFarmersTick())return;if(v278PrepareLeveledMaterialTick())return;if(v273CraftTick())return;if(v273UpgradeTick())return;if(v273CompoundTick())return;if(v273DistributeGearTick())return;if(v273ExchangeTick())return;if(v273StoreTrashBankTick())return;if(v273SellTrashTick())return;if(elixirCraftUpgradeTick())return;if(deliverElixirTick())return;if(svc&&v277MerchantServiceTick())return;if(merchantStandTick())return;S.status='Logistik bereit · Rezepte '+((S.recipeAnalysis&&S.recipeAnalysis.stats&&S.recipeAnalysis.stats.scanned)||0)+' geprüft';S.mode='Merchant · Koordination';
  }
  function v278DashboardCompatibility(raw){
    try{var configured=new URL(raw),effectiveText=normalizeDashboardEndpoint(raw),effective=new URL(effectiveText),page=String(P.location&&P.location.protocol||''),mixed=page==='https:'&&effective.protocol==='http:';return {ok:!mixed,configuredProtocol:configured.protocol,endpointProtocol:effective.protocol,pageProtocol:page,host:effective.hostname,bplaced:/\.bplaced\.net$/i.test(effective.hostname),mixedContent:mixed,autoUpgraded:configured.protocol!==effective.protocol,effective:effectiveText.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'),configured:String(raw||'').replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'),reason:mixed?'HTTP-Endpunkt wird von der HTTPS-Spielseite als Mixed Content blockiert.':''};}catch(e){return {ok:false,reason:'invalid dashboard URL: '+reason(e)};}
  }
  function v278DashboardEnvDiag(raw){var c=v278DashboardCompatibility(raw),nav=P.navigator||{};return Object.assign(c,{fetch:typeof fetch==='function'||typeof P.fetch==='function',sendBeacon:typeof nav.sendBeacon==='function',dom:!!(D&&D.body),origin:String(P.location&&P.location.origin||''),userAgent:safeString(nav.userAgent||'',180)});}
  function dashboardPublishTick(force){
    if((!C.webDashboardEnabled&&!force)||S.dashboardSending)return false;var raw=String(C.webDashboardConnectionUrl||'').trim(),endpoint=normalizeDashboardEndpoint(raw);if(!endpoint){S.dashboardLastError='Invalid dashboard URL';S.dashboardFailAt=clock();return false;}var compat=v278DashboardCompatibility(raw);S.dashboardCompatibility=compat;if(!compat.ok){S.dashboardFailAt=clock();S.dashboardLastError='Dashboard-Endpunkt inkompatibel: '+compat.reason;if(clock()>(S.times.dashboardHostWarn||0)){S.times.dashboardHostWarn=clock()+60000;audit('dashboard_host_incompatible',S.dashboardLastError,v278DashboardEnvDiag(raw),'error');}return false;}if(compat.autoUpgraded&&clock()>(S.times.dashboardUpgradeLog||0)){S.times.dashboardUpgradeLog=clock()+60000;audit('dashboard_url_upgrade','Dashboard-Konfiguration automatisch auf HTTPS hochgestuft',{configured:compat.configured,effective:compat.effective});}if(!force&&clock()-S.lastDashboardPublish<C.webDashboardIntervalSeconds*1000)return false;S.lastDashboardPublish=clock();var payload=dashboardPayload();S.dashboardSending=true;S.dashboardTransportErrors=[];audit('dashboard_send','Dashboard status send',{endpointHost:endpoint.replace(/([?&](?:key|token)=)[^&]+/ig,'$1***'),environment:v278DashboardEnvDiag(raw),payload:v276DashboardCompactPayload(payload)});
    v276DashboardScriptPush(endpoint,payload).then(function(transport){S.dashboardTransport=transport;return transport;}).catch(function(e){S.dashboardTransportErrors.push('script: '+reason(e));audit('dashboard_retry','Script/JSONP fehlgeschlagen; versuche POST + ACK',{error:reason(e)},'warning');return v275DashboardPost(endpoint,payload).then(function(transport){S.dashboardTransport=transport+' + ack';return new Promise(function(r){P.setTimeout(r,450);}).then(function(){return v275DashboardAckImage(endpoint,payload,5000);}).then(function(){return S.dashboardTransport;});}).catch(function(e2){S.dashboardTransportErrors.push('post/ack: '+reason(e2));audit('dashboard_retry','POST/ACK fehlgeschlagen; versuche Frame-ACK',{error:reason(e2)},'warning');return v275DashboardFramePush(endpoint,payload).then(function(transport){S.dashboardTransport=transport;return transport;});});}).then(function(){S.dashboardProbe={ok:true,at:clock(),error:'',host:compat.host};S.dashboardLastOK=clock();S.dashboardLastAck=clock();S.dashboardFailAt=0;S.dashboardLastError='';S.dashboardAckName=me;audit('dashboard_ack','Dashboard status serverseitig bestätigt',{name:me,transport:S.dashboardTransport,effective:compat.effective});}).catch(function(e){S.dashboardProbe={ok:false,at:clock(),error:reason(e),host:compat.host};S.dashboardFailAt=clock();S.dashboardLastError=[].concat(S.dashboardTransportErrors||[],[reason(e)]).join(' | ');audit('dashboard_error','Dashboard vollständig fehlgeschlagen: '+S.dashboardLastError,{environment:v278DashboardEnvDiag(raw),effective:compat.effective},'error');}).finally(function(){S.dashboardSending=false;renderAll(true);});return true;
  }
  function merchantHTML(){var fs=farmerReports(),db=v273BuildKnowledgeDB(false),agg=v273AggregateInventory(),p=S.merchantPlan||{},cands=v277MerchantServiceCandidates(),ra=v278AnalyzeRecipes(false),rs=ra.stats||{};return '<h2>Merchant Einstellungen</h2><div class="notice"><b>2.7.8 Rezept-Intelligenz:</b> Alle Live-Rezepte werden gegen die aktuell ausgerüsteten Slots geprüft. Farmer-Upgrades haben immer Vorrang; der Merchant wird nur verbessert, wenn kein Farmer-Rezept einen echten Ausrüstungsgewinn bringt.</div>'+cfgField('merchantForceLeader','Merchant als Party-Leiter','check')+cfgField('merchantPlannerEnabled','Merchant-Planer aktiv','check')+cfgField('merchantSupply','Farmer automatisch versorgen','check')+cfgField('merchantCollectLoot','Loot und Gold abholen','check')+cfgField('merchantDeliveryHPQty','HP-Tränke pro Lieferung','number')+cfgField('merchantDeliveryMPQty','MP-Tränke pro Lieferung','number')+cfgField('merchantRestockHPAt','HP-Untergrenze (0 = automatisch)','number')+cfgField('merchantRestockMPAt','MP-Untergrenze (0 = automatisch)','number')+cfgField('merchantAutoCraft','Alle sinnvollen Rezepte automatisch herstellen','check')+cfgField('merchantCraftTargets','Bevorzugte Craft-Item-IDs','text','Optionaler Bonus; leer = vollständig automatisch')+cfgField('merchantAutoUpgrade','Nützliche Items automatisch verbessern','check')+cfgField('merchantUpgradeMax','Upgrade-Obergrenze +','number')+cfgField('merchantAutoCompound','Nützliche Items automatisch kombinieren','check')+cfgField('merchantCompoundMax','Combine-Obergrenze','number','0 = Spielmaximum')+cfgField('merchantManageBank','Bank automatisch verwalten','check')+cfgField('merchantAutoUnlockBank','Neue Bankpacks freischalten','check')+'<div class="card"><h3>Rezeptanalyse</h3><div class="dbstats"><div>Geprüft<b>'+Number(rs.scanned||0)+'</b></div><div>Ausrüstung<b>'+Number(rs.equipment||0)+'</b></div><div>Farmer-Upgrades<b>'+Number(rs.farmerImprovements||0)+'</b></div><div>Merchant-Upgrades<b>'+Number(rs.merchantImprovements||0)+'</b></div></div>'+(ra.top&&ra.top.length?ra.top.slice(0,5).map(function(x){return '<div class="line"><span>'+esc(v273Name(x.output))+' → '+esc(x.recipient)+'</span><strong>+'+esc(String(x.ratio))+'%</strong></div>';}).join(''):'<div class="muted">Aktuell kein Craft-Rezept verbessert die ausgerüstete Gruppe ausreichend.</div>')+'</div><div class="card"><h3>Aktueller Plan</h3>'+(p.steps||[]).map(function(x,i){return '<div class="line"><span>'+(i===0?'Jetzt':'+'+i)+'</span><strong>'+esc(x)+'</strong></div>';}).join('')+'</div><div class="card"><h3>Zulieferstatus</h3>'+(cands.length?cands.slice(0,4).map(function(x){return '<div class="line"><span>'+esc(x.r.name)+'</span><strong>'+esc((x.potNeed?'Tränke ':'')+(x.goldNeed?'Gold ':'')+(x.lootNeed?'Loot ':'')||'Routine')+'</strong></div>';}).join(''):'<div class="muted">Aktuell kein dringender Service.</div>')+'</div><div class="muted">Live-Datenbank: '+db.recipeCount+' Rezepte · '+Object.keys(agg.items).length+' geteilte Item-IDs.</div>';}
  function dashboardHTML(){var raw=String(C.webDashboardConnectionUrl||''),normalized=normalizeDashboardEndpoint(raw),de=C.language==='de',confirmed=!!S.dashboardLastAck,errs=(S.dashboardTransportErrors||[]).join(' | '),compat=v278DashboardCompatibility(raw);return '<h2>'+esc(T('dashboard'))+' 2.7.8</h2><div class="notice">'+esc(de?'2.7.8 korrigiert den HTTP→HTTPS-Fehler: Eine gespeicherte HTTP-URL wird zuerst auf HTTPS hochgestuft und dann wirklich getestet. Erst wenn der effektive Endpunkt weiterhin HTTP ist, wird Mixed Content blockiert.':'2.7.8 fixes HTTP→HTTPS handling: stored HTTP URLs are upgraded to HTTPS before compatibility is evaluated.')+'</div>'+cfgField('webDashboardConnectionUrl',de?'Bot-Verbindungs-URL':'Bot connection URL','url',de?'HTTP wird automatisch als HTTPS getestet':'HTTP is automatically tested as HTTPS')+cfgField('webDashboardEnabled',de?'Web-Dashboard aktivieren':'Enable web dashboard','check')+cfgField('webDashboardIntervalSeconds',de?'Status senden alle (Sek.)':'Send status every (sec)','number')+'<div class="buttons"><button class="btn primary" data-action="dashboard-test">'+esc(de?'Dashboard-Verbindung testen':'Test dashboard connection')+'</button></div><div class="card"><div class="line"><span>Konfiguriert</span><strong>'+esc(compat.configured||'—')+'</strong></div><div class="line"><span>Effektiv</span><strong>'+esc(compat.effective||normalized||'—')+'</strong></div><div class="line"><span>HTTPS-Autoupgrade</span><strong class="'+(compat.autoUpgraded?'good':'')+'">'+esc(compat.autoUpgraded?'JA':'—')+'</strong></div><div class="line"><span>Server-Bestätigung</span><strong class="'+(confirmed?'good':'warn')+'">'+(confirmed?Math.round((clock()-S.dashboardLastAck)/1000)+' s':'—')+'</strong></div><div class="line"><span>Transport</span><strong>'+esc(S.dashboardTransport||'—')+'</strong></div>'+(S.dashboardLastError?'<div class="notice bad"><b>Letzter Fehler: </b>'+esc(S.dashboardLastError)+'</div>':'')+(errs?'<div class="muted">'+esc(errs)+'</div>':'')+'</div>';}
  function deathTick(){
    if(!character.rip){if(S.deadAt){var dms=clock()-S.deadAt;S.deadAt=0;S.rejoinUntil=clock()+90000;S.rejoinReason='respawn';S.lastGoalCheck=0;S.goalEmptySince=0;audit('revive','Charakter wieder lebendig · Combat-Rejoin aktiviert',{deadMs:dms,rejoinMs:90000,anchor:v276CombatGroupAnchorInfo()});}return false;}
    if(!S.deadAt){S.deadAt=clock();audit('death','Charakter gestorben',{map:character.map,x:character.x,y:character.y},'critical');}S.status='Tot · Wiederbelebung';S.mode='Tot';S.target=null;if(clock()-S.deadAt>12000&&typeof respawn==='function')action('Wiederbeleben',function(){return respawn();},'respawn',15000);return true;
  }
  function tick() {
    if(S.disposed)return;
    try {
      flushAuditQueue();rotateLogSegment();if(clock()>(S.times.pruneLogs||0)){S.times.pruneLogs=clock()+3600000;pruneOldLogs();}
      if(clock()>(S.times.stateAudit||0)){S.times.stateAudit=clock()+1000;v273UpdateSessionRates();stateAuditTick();}
      if(clock()>(S.times.report||0)){S.times.report=clock()+650;publishReport();}
      syncAutoRoster(false);partyReconcileTick();dashboardPublishTick(false);updateCheckTick(false);v277DiagnosticTick();
      if(!S.running){S.status='Pausiert';S.mode='Pause';return;}
      if(C.roster.indexOf(me)<0){S.status=C.language==='de'?'Warte auf automatische Gruppenauswahl':'Waiting for automatic roster selection';S.mode=C.language==='de'?'Gruppenerkennung':'Group detection';return;}
      if(connectionTick()||deathTick())return;
      if(character.s&&(character.s.stunned||character.s.frozen)){S.status='Handlungsunfähig';S.mode='Warten';return;}
      sustainTick();if(supportTick())return;
      if(typeof loot==='function'&&clock()>(S.times.loot||0)){S.times.loot=clock()+900;action('Loot einsammeln',function(){return loot();},'loot',850);}
      if(character.ctype==='merchant')merchantTick();else {v277FarmerSupplySignalTick();if(farmerElixirTransferTick())return;if(farmerLootTransferTick())return;farmerTick();}
      if(typeof set_message==='function'&&clock()>(S.times.message||0)){S.times.message=clock()+1800;try{set_message('AIO '+VERSION+' · '+S.mode);}catch(e){}}
    } catch(e){audit('tick_error','Steuerungsfehler: '+reason(e),null,'error');}
  }

  // ---------------------------------------------------------------------------
  // 2.8.0 adaptive farming, learned knowledge, resilient pathing and Worker dashboard
  // ---------------------------------------------------------------------------
  function performane_trick(){
    try{
      if(typeof performance_trick==='function'){performance_trick();S.performanceTrick=true;return true;}
      if(P&&typeof P.performance_trick==='function'){P.performance_trick();S.performanceTrick=true;return true;}
    }catch(e){audit('performance_trick_error','performance_trick() konnte nicht aktiviert werden',{error:reason(e)},'warning');}
    S.performanceTrick=false;return false;
  }
  function v280FmtCompact(n){n=Number(n)||0;var a=Math.abs(n),sign=n<0?'-':'';function f(v,s){var d=v>=100?0:v>=10?1:2,x=(Math.round(v*Math.pow(10,d))/Math.pow(10,d)).toFixed(d).replace(/0+$/,'').replace(/\.$/,'');return sign+x+s;}if(a>=1000000)return f(a/1000000,'kk');if(a>=1000)return f(a/1000,'k');return String(Math.round(n));}
  function v280FmtEta(sec){sec=Number(sec);if(!isFinite(sec)||sec<0)return '—';var h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);return (h?h+'h ':'')+m+'m';}
  function v280RoleIcon(role){return role==='tank'?'🛡':role==='healer'?'✚':role==='dps'?'⚔':role==='merchant'?'◆':'•';}
  function v280SafetyColor(pct){pct=clamp(pct,0,100);return 'hsl('+Math.round(pct*1.2)+' 82% 45%)';}
  function v280ServerKey(s){return String(s&&s.region||'')+'|'+String(s&&s.id||'');}
  function v280ServerList(){
    var out=[],seen={};function add(region,id,pvp,name){region=String(region||'').trim();id=String(id||'').trim();if(!region||!id)return;var key=region+'|'+id;if(seen[key])return;seen[key]=1;out.push({region:region,id:id,pvp:!!pvp,name:String(name||region+' '+id)});}
    function walk(x,regionHint){if(!x)return;if(Array.isArray(x)){x.forEach(function(v){walk(v,regionHint);});return;}if(typeof x!=='object')return;var region=x.region||x.server_region||regionHint,id=x.id||x.identifier||x.server_identifier||x.name;if(region&&id&&(x.region||x.server_region||x.id||x.identifier||x.server_identifier))add(region,id,x.pvp===true||x.is_pvp===true||/pvp/i.test(String(x.type||x.name||'')),x.name);else Object.keys(x).forEach(function(k){var v=x[k];if(v&&typeof v==='object')walk(v,regionHint||(/^(EU|US|ASIA)$/i.test(k)?k:''));});}
    try{if(typeof get_servers==='function')walk(get_servers(),'');}catch(e){}
    var cur=currentRealm();add(cur.region,cur.id,cur.pvp,cur.region+' '+cur.id);return out.sort(function(a,b){return a.region.localeCompare(b.region)||a.id.localeCompare(b.id);});
  }
  function v280GroupStrengthSnapshot(){
    var fs=[];if(character.ctype!=='merchant'&&!character.rip)fs.push({name:me,ctype:character.ctype,level:character.level,max_hp:character.max_hp,attack:character.attack,frequency:character.frequency,armor:character.armor,resistance:character.resistance,active:!!S.running,rip:!!character.rip});C.roster.forEach(function(n){if(n===me||characterTypeForConfig(n)==='merchant')return;var r=peerReport(n);if(r&&r.active!==false&&!r.rip)fs.push(r);});var totalDps=0,hp=0,armor=0,res=0,levels=0,healers=0,tanks=0;
    fs.forEach(function(r){totalDps+=(Number(r.attack)||0)*Math.max(.1,Number(r.frequency)||1);hp+=Number(r.max_hp)||0;armor+=Number(r.armor)||0;res+=Number(r.resistance)||0;levels+=Number(r.level)||0;var role=roleForName(r.name);if(role==='healer')healers++;if(role==='tank')tanks++;});
    var n=Math.max(1,fs.length);return {members:fs.length,totalDps:Math.round(totalDps),avgHp:Math.round(hp/n),totalHp:Math.round(hp),avgArmor:Math.round(armor/n),avgResistance:Math.round(res/n),avgLevel:Math.round(levels/n*10)/10,healers:healers,tanks:tanks,score:Math.round(fs.reduce(function(x,r){return x+v273FarmerStrength(r);},0)/n)};
  }
  function v280MonsterSafety(mtype){
    var m=GD.monsters&&GD.monsters[mtype]||{},g=v280GroupStrengthSnapshot();if(!mtype||!m.hp||!g.members)return 0;var ttk=Number(m.hp)/Math.max(1,g.totalDps),dtype=String(m.damage_type||m.damageType||'physical'),def=dtype==='magical'?g.avgResistance:g.avgArmor,mit=100/(100+Math.max(0,def)),incoming=(Number(m.attack)||0)*Math.max(.15,Number(m.frequency)||.5)*mit*Math.max(1,Math.min(C.maxTargets,2)),buffer=Math.max(1,g.totalHp)*(g.healers?1.3:1)*(g.tanks?1.12:1),exposure=incoming*Math.max(.25,ttk)/buffer,levelGap=Math.max(0,(Number(m.level)||0)-g.avgLevel),raw=100-(exposure*115+levelGap*3);if((Number(m.attack)||0)*mit>g.avgHp*.85)raw-=20;return Math.round(clamp(raw,0,100));
  }
  function v280ExpectedXpPerHour(goal){if(!goal)return 0;var m=GD.monsters&&GD.monsters[goal.monster]||{},g=v280GroupStrengthSnapshot();if(!m.hp||!m.xp||!g.totalDps)return 0;var ttk=Math.max(.2,Number(m.hp)/g.totalDps),count=Math.max(1,Number(goal.count)||1),respawn=Math.max(ttk,Number(m.respawn)||Number(m.respawn_ms)/1000||ttk),killsPerHour=Math.min(3600/ttk,3600*count/respawn);return Math.round(killsPerHour*(Number(m.xp)||0));}
  function v280NearbyCompetitors(goal){if(!goal)return 0;var center=goal.map===character.map?goal:character,r=Math.max(250,Number(goal.radius)||300);return entities().filter(function(e){return e&&e.type==='character'&&e.name!==me&&C.roster.indexOf(e.name)<0&&e.map===goal.map&&dist(e,center)<=r+300;}).length;}
  function v280FarmHealth(){if(character.ctype==='merchant')return null;var goal=S.goal||v273GroupGoal(),visible=goal?mobs().filter(function(m){return m&&m.mtype===goal.monster&&m.map===goal.map&&dist(character,m)<=C.searchRadius;}).length:0,rate=v273RateStats(),expected=v280ExpectedXpPerHour(goal),safety=goal?v280MonsterSafety(goal.monster):0;return {at:clock(),goal:goal?{id:goal.id,map:goal.map,monster:goal.monster,count:goal.count||1}:null,visible:visible,competitors:v280NearbyCompetitors(goal),xpPerHour:rate.xpPerHour,goldPerHour:rate.goldPerHour,expectedXpPerHour:expected,safetyPct:safety,sessionSeconds:Math.round((clock()-S.session.started)/1000)};}
  function v280LearningDB(){var d=read('learningDB',{schema:1,monsters:{},zones:{},updatedAt:0});if(!d||typeof d!=='object')d={schema:1,monsters:{},zones:{},updatedAt:0};d.schema=1;d.monsters=d.monsters||{};d.zones=d.zones||{};return d;}
  function v280LearningTick(){
    if(character.ctype==='merchant'||clock()<(S.times.learning||0))return;S.times.learning=clock()+10000;var h=v280FarmHealth();S.farmHealth=h;var target=v277TargetMtype();if(target){S.lastCombatMtype=target;S.lastCombatMtypeAt=clock();}if(!h||!h.goal)return;var db=v280LearningDB(),realm=currentRealm(),key=realm.region+'|'+realm.id+'|'+h.goal.id,z=db.zones[key]||{samples:0,visibleAvg:0,competitorsAvg:0,xpPerHourAvg:0,goldPerHourAvg:0,maxXpPerHour:0};z.samples++;var a=Math.min(.2,1/z.samples);z.visibleAvg+=a*(h.visible-z.visibleAvg);z.competitorsAvg+=a*(h.competitors-z.competitorsAvg);z.xpPerHourAvg+=a*(h.xpPerHour-z.xpPerHourAvg);z.goldPerHourAvg+=a*(h.goldPerHour-z.goldPerHourAvg);z.maxXpPerHour=Math.max(z.maxXpPerHour,h.xpPerHour);z.lastAt=clock();z.goal=h.goal;db.zones[key]=z;db.updatedAt=clock();write('learningDB',db);
  }
  function lootEvent(e){
    audit('loot','Loot erhalten',e);try{var mt=S.lastCombatMtype&&clock()-Number(S.lastCombatMtypeAt||0)<120000?S.lastCombatMtype:null;if(!mt)return;var db=v280LearningDB(),m=db.monsters[mt]||{kills:0,lootEvents:0,gold:0,items:{}};m.lootEvents++;if(!(e&&e.gone))m.kills++;m.gold+=Number(e&&e.gold)||0;(e&&Array.isArray(e.items)?e.items:[]).forEach(function(it){var name=typeof it==='string'?it:(it&&it.name);if(!name)return;m.items[name]=(m.items[name]||0)+(Number(it&&it.q)||1);});m.lastAt=clock();db.monsters[mt]=m;db.updatedAt=clock();write('learningDB',db);}catch(x){}
  }
  function v280FarmProblem(h){if(!h||!h.goal)return null;if(h.sessionSeconds<90)return null;if(h.visible<C.autoFarmMinVisibleMonsters)return 'zu wenig Monster ('+h.visible+')';if(h.competitors>=C.autoFarmCompetitionPlayers&&h.visible<=C.autoFarmMinVisibleMonsters+1)return 'zu hohe Konkurrenz ('+h.competitors+' Spieler)';if(C.autoFarmMinXpPerHour>0&&h.xpPerHour<C.autoFarmMinXpPerHour)return 'EXP/h '+v280FmtCompact(h.xpPerHour)+' < '+v280FmtCompact(C.autoFarmMinXpPerHour);if(h.expectedXpPerHour>0&&h.xpPerHour>0&&h.xpPerHour<h.expectedXpPerHour*C.autoFarmMinExpectedPct/100)return 'EXP/h unter '+C.autoFarmMinExpectedPct+'% der Erwartung';return null;}
  function v280Coordinator(){var mn=merchantName();return mn||canonicalLeader()||me;}
  function v280ChooseServer(){var cur=currentRealm(),all=v280ServerList(),selected=C.autoFarmServers||[],rows=all.filter(function(s){var key=v280ServerKey(s);return selected.indexOf(key)>=0&&!(s.region===cur.region&&s.id===cur.id)&&(!s.pvp||C.autoFarmPvPConfirmed.indexOf(key)>=0);});if(!rows.length)return null;var learned=v280LearningDB(),goal=(S.merchantPlan&&S.merchantPlan.farmGoal)||S.goal;rows.forEach(function(s){var prefix=s.region+'|'+s.id+'|',best=0;if(goal&&goal.id){var z=learned.zones[prefix+goal.id];best=z?Number(z.xpPerHourAvg)||0:0;}s._score=best;});rows.sort(function(a,b){return b._score-a._score||a.region.localeCompare(b.region)||a.id.localeCompare(b.id);});return rows[0]||null;}
  function v280SendServerSwitch(server,reasonText){if(!server||typeof change_server!=='function')return false;var data={type:'aio280-server-switch',version:VERSION,region:server.region,id:server.id,pvp:!!server.pvp,reason:safeString(reasonText,180),at:clock(),from:me};C.roster.filter(function(n){return n!==me;}).forEach(function(n){try{send_cm(n,data);}catch(e){}});S.serverSwitchPending=data;S.lastServerSwitch=clock();audit('adaptive_server_switch','Automatischer Serverwechsel vorbereitet',data,'warning');P.setTimeout(function(){try{change_server(server.region,server.id);}catch(e){audit('server_switch_error','Serverwechsel fehlgeschlagen',{error:reason(e),server:server},'error');}},1800);return true;}
  function v280FarmAdaptationTick(){
    if(!C.autoFarmSwitchEnabled||me!==v280Coordinator()||clock()<(S.times.farmAdapt||0))return;S.times.farmAdapt=clock()+5000;var hs=farmerReports().map(function(r){return r.farmHealth;}).filter(function(x){return x&&x.goal;});if(character.ctype!=='merchant'&&S.farmHealth)hs.push(S.farmHealth);if(!hs.length)return;var visible=hs.reduce(function(n,x){return n+Number(x.visible||0);},0)/hs.length,comp=hs.reduce(function(n,x){return n+Number(x.competitors||0);},0)/hs.length,xph=hs.reduce(function(n,x){return n+Number(x.xpPerHour||0);},0)/hs.length,exp=hs.reduce(function(n,x){return n+Number(x.expectedXpPerHour||0);},0)/hs.length,base=hs[0],h={goal:base.goal,visible:visible,competitors:comp,xpPerHour:xph,expectedXpPerHour:exp,sessionSeconds:Math.min.apply(Math,hs.map(function(x){return Number(x.sessionSeconds)||0;}))},problem=v280FarmProblem(h);
    if(!problem){S.farmBadSince=0;S.farmAreaSwitchedAt=0;return;}if(!S.farmBadSince){S.farmBadSince=clock();S.farmBadReason=problem;audit('farm_health_warning','Farmleistung verschlechtert: '+problem,h,'warning');return;}if(clock()-S.farmBadSince<C.autoFarmBadSeconds*1000)return;
    if(C.autoFarmAreaSwitchEnabled&&(!S.farmAreaSwitchedAt||clock()-S.farmAreaSwitchedAt>C.autoFarmSwitchCooldownSeconds*1000)){var goal=(S.merchantPlan&&S.merchantPlan.farmGoal)||S.goal;if(goal)v275MarkGoalEmpty(goal);S.goal=null;S.lastGoalCheck=0;if(character.ctype==='merchant'){S.times.merchantPlan=0;if(S.merchantPlan)S.merchantPlan.farmGoal=null;}S.farmAreaSwitchedAt=clock();S.farmBadSince=clock();audit('adaptive_area_switch','Automatischer Levelgebietswechsel: '+problem,{oldGoal:goal},'warning');return;}
    if(C.autoFarmServerSwitchEnabled&&clock()-Number(S.lastServerSwitch||0)>C.autoFarmSwitchCooldownSeconds*1000){var srv=v280ChooseServer();if(srv)v280SendServerSwitch(srv,problem);}
  }
  function v280SmartDestination(g,kind){if(!g)return null;var map=String(g.map||'');if(kind==='bank'||(map==='bank'&&Math.abs(Number(g.x)||0)<1&&Math.abs(Number(g.y)||0)<1))return 'bank';if(map!==character.map&&(!isFinite(Number(g.x))||!isFinite(Number(g.y))||(Number(g.x)===0&&Number(g.y)===0)))return map;return g;}
  function v280MoveKey(target,kind){return String(kind||'move')+'|'+(typeof target==='string'?target:[target&&target.map,Math.round(Number(target&&target.x)||0),Math.round(Number(target&&target.y)||0)].join('|'));}
  function moveToGoal(g,why,opts){
    opts=opts||{};if(!g)return false;var now=clock(),kind=opts.kind||String(why||'move'),smartTarget=v280SmartDestination(g,kind),target=typeof smartTarget==='string'?{map:smartTarget,x:0,y:0}:{map:g.map||character.map,x:Math.round(Number(g.x)||0),y:Math.round(Number(g.y)||0)},key=v280MoveKey(smartTarget,kind);S.moveFailures=S.moveFailures||{};var fail=S.moveFailures[key]||{count:0,nextAt:0};if(now<fail.nextAt)return true;var old=S.moveDestination,tol=Number(opts.tolerance)||(kind.indexOf('follow')>=0?150:70),same=old&&old.map===target.map&&Math.hypot((old.x||0)-target.x,(old.y||0)-target.y)<=tol,forceAfter=Number(opts.forceAfter)||7000;if(S.moveInFlight&&same&&now-S.moveRequestedAt<forceAfter)return true;if(S.moveInFlight&&!same&&now-S.moveRequestedAt<1200)return true;
    if(target.map===character.map&&dist(character,target)<340&&typeof move==='function'){try{if(typeof can_move_to!=='function'||can_move_to(target.x,target.y)){S.moveDestination=target;S.moveRequestedAt=now;S.lastMoveAt=now;move(target.x,target.y);delete S.moveFailures[key];return true;}}catch(e){}}
    if(typeof smart_move!=='function')return false;if(S.moveInFlight&&!same){try{if(typeof stop==='function')stop('smart');}catch(e){}}S.moveInFlight=true;S.moveKind=kind;S.moveDestination=target;S.moveRequestedAt=now;S.moveStarted=now;S.lastMoveAt=now;var seq=++S.moveSeq;audit('move',why||'smart_move',{requested:target,smartDestination:smartTarget});
    function failed(e){if(seq!==S.moveSeq)return;S.moveInFlight=false;S.moveGoal=null;var msg=reason(e);if(msg==='interrupted')return;fail.count=Math.min(8,(fail.count||0)+1);fail.nextAt=clock()+Math.min(30000,800*Math.pow(2,fail.count));S.moveFailures[key]=fail;audit('move_error',msg,{target:target,smartDestination:smartTarget,retryInMs:fail.nextAt-clock(),failures:fail.count},'warning');}
    try{Promise.resolve(smart_move(smartTarget)).then(function(){if(seq!==S.moveSeq)return;S.moveInFlight=false;S.moveGoal=null;delete S.moveFailures[key];audit('move_done','Ziel erreicht',target);},failed);return true;}catch(e){failed(e);return false;}
  }
  function report(withRole){
    var p=pos(character)||{},rates=v273RateStats();var r={type:'aio27-report',protocol:5,version:VERSION,name:me,ctype:character.ctype,level:character.level,at:clock(),map:character.map,x:p.x||0,y:p.y||0,hp:character.hp,max_hp:character.max_hp,mp:character.mp,max_mp:character.max_mp,attack:character.attack,frequency:character.frequency,armor:character.armor,resistance:character.resistance,range:character.range,speed:character.speed,damage_type:character.damage_type,slots:v273CompactSlots(),inventory:v273InventoryReport(),active:!!S.running,rip:!!character.rip,status:S.status,mode:S.mode,target:S.target,targetMtype:v277TargetMtype(),goal:S.goal,free:freeSlots(),gold:character.gold,hpot:qty(C.hpot),mpot:qty(C.mpot),xp:character.xp,xpPerHour:rates.xpPerHour,goldPerHour:rates.goldPerHour,farmHealth:S.farmHealth||v280FarmHealth(),groupStrength:v280GroupStrengthSnapshot(),merchantPlan:character.ctype==='merchant'?S.merchantPlan:null};if(withRole!==false){r.role=roleForName(me);r.primaryTank=roleSummary().primaryTank;}return r;
  }
  function v273BuildKnowledgeDB(force){
    var now=clock(),gv=v273GameVersion(),cached=S.knowledgeDB||read('knowledgeDB',null),ttl=C.merchantRecipeRefreshHours*3600000;if(!force&&cached&&Number(cached.schema)>=3&&cached.gameVersion===gv&&now-Number(cached.refreshedAt||0)<ttl){cached.learning=v280LearningDB();S.knowledgeDB=cached;return cached;}var recipes={},recipesByOutput={};Object.keys(GD.craft||{}).forEach(function(id){var r=GD.craft[id]||{};if(!Array.isArray(r.items))return;var ro=r.output,out=id,outLevel=0,outQ=1;if(typeof ro==='string')out=ro;else if(ro&&typeof ro==='object'){out=ro.name||id;outLevel=Math.max(0,Number(ro.level)||0);outQ=Math.max(1,Number(ro.q||ro.quantity)||1);}var rec={id:id,output:out,outputLevel:outLevel,outputQ:outQ,quest:typeof r.quest==='string'?r.quest:'',cost:Number(r.cost)||0,items:r.items.map(function(x){return {q:Number(x&&x[0])||1,name:x&&x[1],level:Math.max(0,Number(x&&x[2])||0)};}).filter(function(x){return x.name;})};recipes[id]=rec;(recipesByOutput[out]||(recipesByOutput[out]=[])).push(id);});var drops={};var dm=GD.drops&&GD.drops.monsters||{};Object.keys(dm).forEach(function(mon){v273ExtractDropRows(dm[mon],[]).forEach(function(row){if(!drops[row.name])drops[row.name]=[];drops[row.name].push({monster:mon,chance:row.chance,q:row.q});});});Object.keys(drops).forEach(function(k){drops[k].sort(function(a,b){return b.chance-a.chance;});});var spawns={},monsters={};SPAWNS.forEach(function(sp){if(!spawns[sp.monster])spawns[sp.monster]=[];spawns[sp.monster].push(sp);});Object.keys(GD.monsters||{}).forEach(function(id){var m=GD.monsters[id]||{};monsters[id]={name:m.name||id,hp:Number(m.hp)||0,xp:Number(m.xp)||0,attack:Number(m.attack)||0,frequency:Number(m.frequency)||0,level:Number(m.level)||0,damage_type:m.damage_type||'',respawn:Number(m.respawn)||0,spawns:spawns[id]||[]};});var learning=v280LearningDB(),empiricalDrops={};Object.keys(learning.monsters||{}).forEach(function(mon){var lm=learning.monsters[mon]||{},kills=Math.max(0,Number(lm.kills)||0),rows=[];Object.keys(lm.items||{}).forEach(function(item){rows.push({item:item,count:Number(lm.items[item])||0,kills:kills,rate:kills>0?(Number(lm.items[item])||0)/kills:null});});empiricalDrops[mon]=rows.sort(function(a,b){return (Number(b.rate)||0)-(Number(a.rate)||0);});});var db={schema:3,gameVersion:gv,refreshedAt:now,recipes:recipes,recipesByOutput:recipesByOutput,drops:drops,spawns:spawns,monsters:monsters,learning:learning,empiricalDrops:empiricalDrops,recipeCount:Object.keys(recipes).length,dropItemCount:Object.keys(drops).length,spawnCount:SPAWNS.length,monsterCount:Object.keys(monsters).length};S.knowledgeDB=db;write('knowledgeDB',db);audit('knowledge_refresh','Knowledge database refreshed',{schema:3,gameVersion:gv,recipes:db.recipeCount,dropItems:db.dropItemCount,spawns:db.spawnCount,monsters:db.monsterCount});return db;
  }
  function dashboardPayload(){var p=pos(character)||{},realm=currentRealm(),ps=partyState(),rate=v273RateStats(),xpNeed=Number((GD.levels||[])[character.level])||0,xpPct=xpNeed?Math.max(0,Math.min(100,100*Number(character.xp||0)/xpNeed)):0,eta=rate.xpPerHour>0&&xpNeed>character.xp?Math.round((xpNeed-character.xp)/rate.xpPerHour*3600):null;return {type:'aio-bot-status',version:5,botVersion:VERSION,language:C.language||'en',name:me,ctype:character.ctype,role:roleForName(me),roleIcon:v280RoleIcon(roleForName(me)),level:character.level,hp:character.hp,maxHp:character.max_hp,hpPct:Math.round(ratio(character,'hp')*1000)/10,mp:character.mp,maxMp:character.max_mp,mpPct:Math.round(ratio(character,'mp')*1000)/10,xp:character.xp,xpPct:Math.round(xpPct*10)/10,xpPerHour:rate.xpPerHour,goldPerHour:rate.goldPerHour,levelEtaSeconds:eta,task:safeString(S.status,500),taskCode:safeString(S.mode,80),mode:safeString(S.mode,120),active:!!S.running,rip:!!character.rip,map:character.map,x:Number(p.x)||0,y:Number(p.y)||0,server:realm,party:{members:ps.members||[],missing:ps.missing||[],complete:!!ps.complete},groupStrength:v280GroupStrengthSnapshot(),farmHealth:S.farmHealth||v280FarmHealth(),merchantPlan:S.merchantPlan||null,alerts:dashboardAlerts(),updatedAt:clock()};}
  function v280DashboardEndpoint(raw){try{var u=new URL(String(raw||'').trim());if(u.protocol!=='https:')return '';u.search='';u.hash='';u.pathname=u.pathname.replace(/\/$/,'')+'/api/push';return u.toString();}catch(e){return '';}}
  function dashboardPublishTick(force){
    if((!C.webDashboardEnabled&&!force)||S.dashboardSending)return false;var raw=String(C.webDashboardConnectionUrl||'').trim(),endpoint=v280DashboardEndpoint(raw),key=String(C.webDashboardWriteKey||'').trim();if(!endpoint||!key){if(C.webDashboardEnabled||force){S.dashboardLastError=!endpoint?'Cloudflare-Dashboard-URL fehlt/ist nicht HTTPS':'Dashboard-Schreibschlüssel fehlt';S.dashboardFailAt=clock();}return false;}if(!force&&clock()-S.lastDashboardPublish<C.webDashboardIntervalSeconds*1000)return false;S.lastDashboardPublish=clock();var payload=dashboardPayload();S.dashboardSending=true;S.dashboardTransportErrors=[];audit('dashboard_send','Cloudflare Worker dashboard status send',{endpoint:endpoint,payload:v276DashboardCompactPayload(payload)});var f=typeof P.fetch==='function'?P.fetch.bind(P):((typeof fetch==='function')?fetch:null);if(!f){S.dashboardSending=false;S.dashboardLastError='fetch unavailable';return false;}Promise.resolve(f(endpoint,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({writeKey:key,status:payload})})).then(function(r){if(!r||!r.ok)throw Error('HTTP '+(r&&r.status));return r.json();}).then(function(j){if(!j||j.ok!==true||j.name!==me)throw Error(j&&j.error||'invalid Worker acknowledgement');S.dashboardTransport='cloudflare-worker/cors';S.dashboardProbe={ok:true,at:clock(),error:'',host:(new URL(endpoint)).host};S.dashboardLastOK=clock();S.dashboardLastAck=clock();S.dashboardFailAt=0;S.dashboardLastError='';audit('dashboard_ack','Cloudflare Worker hat Status bestätigt',{name:me,receivedAt:j.receivedAt});}).catch(function(e){S.dashboardProbe={ok:false,at:clock(),error:reason(e)};S.dashboardFailAt=clock();S.dashboardLastError=reason(e);audit('dashboard_error','Cloudflare-Dashboard fehlgeschlagen: '+S.dashboardLastError,{endpoint:endpoint},'error');}).finally(function(){S.dashboardSending=false;renderAll(true);});return true;
  }
  function characterHTML(){var ps=partyState(),rate=v273RateStats(),xpNeed=Number((GD.levels||[])[character.level])||0,xpPct=xpNeed?Math.round(1000*Number(character.xp||0)/xpNeed)/10:0,eta=rate.xpPerHour>0&&xpNeed>character.xp?(xpNeed-character.xp)/rate.xpPerHour*3600:null;return '<h2>'+esc(T('character'))+'</h2><div class="card"><div class="line"><strong>'+esc(me)+'</strong><span class="tag">'+esc(character.ctype)+' · Lv. '+character.level+'</span></div><div class="muted">'+esc(character.map)+' · X '+Math.round(character.x||0)+' · Y '+Math.round(character.y||0)+'</div><p>HP '+character.hp+' / '+character.max_hp+'</p><div class="bar hp"><i style="width:'+Math.round(ratio(character,'hp')*100)+'%"></i></div><p>MP '+character.mp+' / '+character.max_mp+'</p><div class="bar mp"><i style="width:'+Math.round(ratio(character,'mp')*100)+'%"></i></div><div class="dbstats"><div>XP<b>'+xpPct+'%</b></div><div>EXP/h<b>'+v280FmtCompact(rate.xpPerHour)+'</b></div><div>Gold/h<b>'+v280FmtCompact(rate.goldPerHour)+'</b></div></div><div class="line"><span>Zeit bis Level-up</span><strong>'+v280FmtEta(eta)+'</strong></div></div><div class="card"><div class="line"><span>Aktueller Task</span><strong>'+esc(S.status)+'</strong></div><div class="line"><span>Modus</span><span>'+esc(S.mode)+'</span></div><div class="line"><span>Party</span><span class="'+(ps.complete?'good':'bad')+'">'+ps.members.length+'/'+Math.max(4,ps.expected.length)+'</span></div></div>';}
  function partyHTML(){var ps=partyState(),rows=peers(true),gs=v280GroupStrengthSnapshot();return '<h2>'+esc(T('party'))+'</h2><div class="card"><div class="line"><span>Gruppenstärke Ø</span><strong>'+v280FmtCompact(gs.score)+'</strong></div><div class="line"><span>Gruppen-DPS</span><strong>'+v280FmtCompact(gs.totalDps)+'</strong></div></div>'+C.roster.map(function(n){var r=rows.find(function(x){return x.name===n;}),role=roleForName(n),icon=v280RoleIcon(role);return '<div class="card"><div class="line"><strong><span title="'+esc(role)+'" style="display:inline-block;width:22px;text-align:center;font-size:17px">'+icon+'</span> '+esc(n)+'</strong><span class="tag">'+esc(role)+'</span></div><div class="muted">'+(r?'Lv. '+r.level+' · '+esc(r.map)+' · '+v280FmtCompact(r.xpPerHour||0)+' EXP/h':'offline / kein Report')+'</div></div>';}).join('')+'<div class="notice '+(ps.complete?'':'bad')+'">'+(ps.complete?'Gruppe vollständig':'Fehlend: '+esc((ps.missing||[]).join(', ')))+'</div>';}
  function v280MonsterOptions(){var ids=Object.keys(GD.monsters||{}).filter(function(id){var m=GD.monsters[id]||{};return m.hp&&m.xp&&!m.boss&&!m.cooperative&&!m.event&&!m.special&&SPAWNS.some(function(s){return s.monster===id;});});ids.sort(function(a,b){return v280MonsterSafety(b)-v280MonsterSafety(a)||(Number((GD.monsters[b]||{}).xp)||0)-(Number((GD.monsters[a]||{}).xp)||0);});return ids;}
  function farmHTML(){var ids=v280MonsterOptions(),safe=v280MonsterSafety(C.monster),col=v280SafetyColor(safe);return '<h2>'+esc(T('farm'))+'</h2>'+cfgField('farmMode','Farm mode','select','Auto evaluates live + learned monster data.',[['auto','Auto'],['manual','Manual']])+'<div class="setting"><label>Manuelles Monster<small>Sicherheitswert basiert auf durchschnittlicher Gruppenstärke; Schätzwert, keine Garantie.</small></label><select data-cfg="monster">'+ids.map(function(id){var p=v280MonsterSafety(id),m=GD.monsters[id]||{};return '<option value="'+esc(id)+'"'+(C.monster===id?' selected':'')+'>'+esc(m.name||id)+' · '+p+'% sicher</option>';}).join('')+'</select></div><div class="card"><div class="line"><span>Sicherheitswert</span><strong style="color:'+col+';font-size:20px">'+safe+'%</strong></div><div class="muted">0% = praktisch nicht besiegbar · 50% = gelb · 100% = sehr hohe Sicherheitsreserve.</div></div>'+cfgField('searchRadius','Search radius','number')+cfgField('risk','Maximum risk %','number')+cfgField('maxTargets','Maximum simultaneous targets','number')+cfgField('followDistance','Group distance','number')+cfgField('autoFarmMinSpawnCount','Minimum monsters per automatic farm spawn','number')+cfgField('goalEmptyReplanSeconds','Replan after empty spawn (sec)','number')+'<div class="card"><div class="line"><span>Current target area</span><strong>'+esc(S.goal?S.goal.monster+' · '+S.goal.map:'—')+'</strong></div><button class="btn primary" data-action="goal-now">Re-evaluate</button></div>';}
  function v280ServerSettingsHTML(){var all=v280ServerList(),sel=C.autoFarmServers||[];return '<div class="card"><h3>Automatischer Gebiets-/Serverwechsel</h3>'+cfgField('autoFarmSwitchEnabled','Automatisch reagieren','check','Wechselt Gebiet/Server bei zu wenigen Monstern, Konkurrenz oder schlechter EXP/h.')+cfgField('autoFarmAreaSwitchEnabled','Zuerst anderes Levelgebiet versuchen','check')+cfgField('autoFarmServerSwitchEnabled','Danach Serverwechsel erlauben','check')+cfgField('autoFarmMinVisibleMonsters','Mindestens sichtbare Monster','number')+cfgField('autoFarmCompetitionPlayers','Konkurrenz ab Spielern','number')+cfgField('autoFarmMinExpectedPct','Min. EXP/h vs. Erwartung (%)','number')+cfgField('autoFarmMinXpPerHour','Absolute Mindest-EXP/h (0 = aus)','number')+cfgField('autoFarmBadSeconds','Schlechte Lage bestätigen (Sek.)','number')+cfgField('autoFarmSwitchCooldownSeconds','Wechsel-Cooldown (Sek.)','number')+'<h3>Erlaubte Server (Mehrfachauswahl)</h3><div class="muted">PvP-Server verlangen nach dem Anklicken eine zweite Bestätigung.</div>'+(all.length?all.map(function(s){var k=v280ServerKey(s);return '<label class="setting"><span>'+esc(s.region+' '+s.id)+(s.pvp?' · <b style="color:var(--bad)">PvP</b>':'')+'</span><input type="checkbox" data-auto-server="'+esc(k)+'" data-pvp="'+(s.pvp?'1':'0')+'"'+(sel.indexOf(k)>=0?' checked':'')+'></label>';}).join(''):'<div class="muted">Serverliste ist in dieser Laufzeit nicht verfügbar.</div>')+'</div>';}
  function settingsHTML(){var themeOptions=[['midnight','Midnight Glass'],['arctic','Arctic Light'],['solarized','Solarized'],['neon','Neon Cyber'],['forest','Forest'],['crimson','Crimson'],['royal','Royal Violet'],['sakura','Sakura'],['contrast','High Contrast'],['paper','Paper / Sepia']];return '<h2>'+esc(T('settings_updates'))+'</h2>'+v280ServerSettingsHTML()+cfgField('language',T('language'),'select','15 languages.',LANGS)+cfgField('theme',T('theme'),'select','10 themes.',themeOptions)+'<div class="notice"><b>Vollautomatisches Update:</b> GitHub wird einmal pro Minute geprüft.</div>'+'<div class="card"><div class="line"><span>Bot repository</span><strong>'+esc(defaults.updateRepositoryUrl)+'</strong></div></div>'+cfgField('auditEnabled','Detailed audit log','check')+cfgField('diagnosticMode','Gezielter Diagnosemodus','check')+cfgField('diagnosticSeconds','Diagnose-Snapshot alle (Sek.)','number')+cfgField('logSegmentHours','Log segment hours','number')+cfgField('logRetentionDays','Log retention days','number')+'<div class="buttons"><button class="btn primary" data-action="update-check">Check for update</button></div><div class="card"><div class="line"><span>'+esc(T('current_version'))+'</span><strong>'+VERSION+'</strong></div><div class="line"><span>Performance-Trick</span><strong class="'+(S.performanceTrick?'good':'warn')+'">'+(S.performanceTrick?'aktiv':'nicht verfügbar')+'</strong></div></div>';}
  function dashboardHTML(){var endpoint=v280DashboardEndpoint(C.webDashboardConnectionUrl),confirmed=!!S.dashboardLastAck;return '<h2>'+esc(T('dashboard'))+' '+VERSION+'</h2><div class="notice"><b>Neuer Ansatz:</b> Cloudflare Worker + D1 über HTTPS. Kein bplaced, kein JSONP/iframe-Fallback und kein Schlüssel mehr in der URL.</div>'+cfgField('webDashboardConnectionUrl','Dashboard-Basis-URL','url','z. B. https://aio-dashboard.DEIN-NAME.workers.dev')+cfgField('webDashboardWriteKey','Schreibschlüssel','password','Separates Secret aus der Worker-Einrichtung; wird nur im POST-Body gesendet.')+cfgField('webDashboardEnabled','Web-Dashboard aktivieren','check')+cfgField('webDashboardIntervalSeconds','Status senden alle (Sek.)','number')+'<div class="buttons"><button class="btn primary" data-action="dashboard-test">Dashboard-Verbindung testen</button></div><div class="card"><div class="line"><span>Push-Endpunkt</span><strong>'+esc(endpoint||'—')+'</strong></div><div class="line"><span>Bestätigung</span><strong class="'+(confirmed?'good':'warn')+'">'+(confirmed?Math.round((clock()-S.dashboardLastAck)/1000)+' s':'—')+'</strong></div><div class="line"><span>Transport</span><strong>'+esc(S.dashboardTransport||'—')+'</strong></div>'+(S.dashboardLastError?'<div class="notice bad">'+esc(S.dashboardLastError)+'</div>':'')+'</div>';}
  function uiChange(e){var el=e.target;if(el.dataset&&el.dataset.autoServer){var key=el.dataset.autoServer,sel=(C.autoFarmServers||[]).slice(),confirmed=(C.autoFarmPvPConfirmed||[]).slice(),ix=sel.indexOf(key);if(el.checked&&ix<0){if(el.dataset.pvp==='1'&&confirmed.indexOf(key)<0){var ok=false;try{ok=!!P.confirm('PvP-Server '+key.replace('|',' ')+' wirklich für automatische Serverwechsel freigeben?\n\nDort können andere Spieler deine Charaktere angreifen.');}catch(x){}if(!ok){el.checked=false;return;}confirmed.push(key);}sel.push(key);}else if(!el.checked&&ix>=0){sel.splice(ix,1);var ci=confirmed.indexOf(key);if(ci>=0)confirmed.splice(ci,1);}C.autoFarmServers=sel;C.autoFarmPvPConfirmed=confirmed;saveConfig();return;}if(el.dataset&&el.dataset.cfg){applyCfgControl(el);if(el.dataset.cfg==='monster')renderTool('farm');return;}if(el.dataset&&el.dataset.skill){var id=el.dataset.skill;C.skills[me]=C.skills[me]||{};C.skills[me][id]=Object.assign({},C.skills[me][id]||{},{enabled:!!el.checked});write('config',C);audit('skill_config',id+' '+(el.checked?'enabled':'disabled'));return;}if(el.dataset&&el.dataset.bestMode!==undefined){S.bestiaryMode=el.value;renderTool('bestiary');}}
  var v280CMBase=on_cm;
  on_cm=function(name,data){try{v280CMBase(name,data);}catch(e){}if(!accountCharacterName(name)||!data||data.type!=='aio280-server-switch')return;var key=String(data.region||'')+'|'+String(data.id||'');if((C.autoFarmServers||[]).indexOf(key)<0)return;if(data.pvp&&(C.autoFarmPvPConfirmed||[]).indexOf(key)<0){audit('server_switch_blocked','PvP-Serverwechsel ohne lokale Bestätigung blockiert',{from:name,target:key},'warning');return;}var cur=currentRealm();if(cur.region===data.region&&cur.id===data.id)return;audit('server_switch_peer','Serverwechsel vom Gruppenkoordinator empfangen',{from:name,target:key,reason:data.reason},'warning');P.setTimeout(function(){try{if(typeof change_server==='function')change_server(data.region,data.id);}catch(e){audit('server_switch_error','Peer-Serverwechsel fehlgeschlagen',{error:reason(e),target:key},'error');}},1000+Math.floor(Math.random()*1200));};

  // ---------------------------------------------------------------------------
  // 2.8.1 UI consistency, intelligent upgrade cadence, stable logistics + meters
  // ---------------------------------------------------------------------------
  function v281L(key){
    var de={
      damage:'Schaden',healing:'Heilung',total:'Gesamt',session:'Sitzung',share:'Anteil',noData:'Noch keine Daten',
      groupStrength:'Gruppenstärke Ø',groupDps:'Gruppen-DPS',complete:'Gruppe vollständig',missing:'Fehlend',noReport:'offline / kein Report',
      farmMode:'Farmmodus',auto:'Automatisch',manual:'Manuell',manualMonster:'Manuelles Monster',safety:'Sicherheitswert',
      safetyHelp:'Sicherheitswert aus der aktuellen Gruppenstärke; Schätzwert, keine Garantie.',searchRadius:'Suchradius',risk:'Maximales Risiko %',
      maxTargets:'Maximal gleichzeitige Ziele',groupDistance:'Gruppenabstand',minSpawn:'Mindestmonster pro automatischem Spawn',replan:'Neu planen nach leerem Spawn (Sek.)',
      currentArea:'Aktuelles Zielgebiet',reevaluate:'Neu bewerten',skillInfo:'Es werden nur für diese Klasse und dieses Level relevante Kampf-/Support-Skills angezeigt.',
      potionThreshold:'Automatische MP-Trankschwelle',expensiveSkill:'Teuerster aktivierter Skill',saveWeak:'Offensive Skills bei schwachen Gegnern sparen',
      weakFactor:'Schwach-Schwelle × Basisangriff',manaReserve:'Zusätzliche Manareserve %',cooldown:'Abklingzeit',rangeTarget:'Reichweite / Ziel',
      damagePerMp:'Schaden / MP',merchantEfficiency:'Upgrade-Effizienz',eta:'Material-ETA',gainHour:'Stärkezuwachs/h',bankRecheck:'Bank erneut prüfen nach (Sek.)',
      cadence:'Zielintervall für Upgrades (Min.)',routine:'Routine',materials:'Material',potions:'Tränke',gold:'Gold',loot:'Loot',
      settings:'Einstellungen',updateCheck:'Nach Update suchen',repo:'Bot-Repository',audit:'Detailliertes Ereignisprotokoll',logHours:'Logsegment-Stunden',logDays:'Log-Aufbewahrungstage',
      dashboardUrl:'Dashboard-Basis-URL',writeKey:'Schreibschlüssel',dashboardEnable:'Web-Dashboard aktivieren',sendEvery:'Status senden alle (Sek.)',testConnection:'Dashboard-Verbindung testen',
      confirmed:'Bestätigung',transport:'Transport',pushEndpoint:'Push-Endpunkt',performance:'Performance-Trick',active:'aktiv',unavailable:'nicht verfügbar'
    };
    var en={
      damage:'Damage',healing:'Healing',total:'Total',session:'Session',share:'Share',noData:'No data yet',groupStrength:'Average group strength',groupDps:'Group DPS',complete:'Group complete',missing:'Missing',noReport:'offline / no report',farmMode:'Farm mode',auto:'Auto',manual:'Manual',manualMonster:'Manual monster',safety:'Safety value',safetyHelp:'Safety estimate from current group strength; estimate only, not a guarantee.',searchRadius:'Search radius',risk:'Maximum risk %',maxTargets:'Maximum simultaneous targets',groupDistance:'Group distance',minSpawn:'Minimum monsters per automatic spawn',replan:'Replan after empty spawn (sec)',currentArea:'Current target area',reevaluate:'Re-evaluate',skillInfo:'Only combat/support skills relevant to this class and level are shown.',potionThreshold:'Automatic MP potion threshold',expensiveSkill:'Most expensive enabled skill',saveWeak:'Save offensive skills on weak monsters',weakFactor:'Weak threshold × basic attack',manaReserve:'Additional mana reserve %',cooldown:'Cooldown',rangeTarget:'Range / target',damagePerMp:'Damage / MP',merchantEfficiency:'Upgrade efficiency',eta:'Material ETA',gainHour:'Strength gain/h',bankRecheck:'Recheck bank after (sec)',cadence:'Target upgrade cadence (min)',routine:'Routine',materials:'Material',potions:'Potions',gold:'Gold',loot:'Loot',settings:'Settings',updateCheck:'Check for update',repo:'Bot repository',audit:'Detailed audit log',logHours:'Log segment hours',logDays:'Log retention days',dashboardUrl:'Dashboard base URL',writeKey:'Write key',dashboardEnable:'Enable web dashboard',sendEvery:'Send status every (sec)',testConnection:'Test dashboard connection',confirmed:'Acknowledgement',transport:'Transport',pushEndpoint:'Push endpoint',performance:'Performance trick',active:'active',unavailable:'unavailable'};
    var lang=C.language==='de'?de:en;return lang[key]||en[key]||key;
  }
  function v281GermanizeHTML(html){
    if(C.language!=='de')return html;
    var pairs=[
      ['Farm mode','Farmmodus'],['Auto evaluates live + learned monster data.','Automatik bewertet Live- und Lerndaten.'],['Auto evaluates live monster data.','Automatik bewertet Live-Monsterdaten.'],['Manual monster ID','Manuelle Monster-ID'],['Search radius','Suchradius'],['Maximum risk %','Maximales Risiko %'],['Maximum simultaneous targets','Maximal gleichzeitige Ziele'],['Group distance','Gruppenabstand'],['Minimum monsters per automatic farm spawn','Mindestmonster pro automatischem Farm-Spawn'],['Replan after empty spawn (sec)','Neu planen nach leerem Spawn (Sek.)'],['Current target area','Aktuelles Zielgebiet'],['Re-evaluate','Neu bewerten'],
      ['Damage/MP is shown only when the live skill definition provides enough numeric information; dynamic skills are labelled instead of guessed.','Schaden/MP wird nur angezeigt, wenn die Live-Skilldaten genug Zahlen liefern; dynamische Skills werden nicht geraten.'],['Save offensive skills on weak monsters','Offensive Skills bei schwachen Gegnern sparen'],['Weak threshold × basic attack','Schwach-Schwelle × Basisangriff'],['Mana reserve %','Manareserve %'],['Additional mana reserve %','Zusätzliche Manareserve %'],['Explicitly enabled skills override this saving rule.','Explizit aktivierte Skills übersteuern diese Sparregel.'],['Most expensive enabled skill','Teuerster aktivierter Skill'],['Automatic MP potion threshold','Automatische MP-Trankschwelle'],['Cooldown','Abklingzeit'],['Damage','Schaden'],['Dmg / MP','Schaden / MP'],['Range / Target','Reichweite / Ziel'],
      ['Automatic elixir optimisation','Automatische Elixier-Optimierung'],['Craft higher elixir tiers when recipes/materials exist','Höhere Elixierstufen craften, wenn Rezepte/Materialien vorhanden sind'],['Maximum elixir tier','Maximale Elixierstufe'],['Distribute best class elixirs to farmers','Beste Klassen-Elixiere an Farmer verteilen'],['Deliver potions automatically','Tränke automatisch liefern'],['Collect loot/gold at merchant','Loot/Gold beim Merchant sammeln'],['Detected farmers','Erkannte Farmer'],['Class','Klasse'],['Preferred stat','Bevorzugter Wert'],
      ['OFF by default.','Standardmäßig AUS.'],['Automatic selling starts only after explicit opt-in.','Automatischer Verkauf startet erst nach ausdrücklicher Aktivierung.'],['Stand priority','Stand-Priorität'],['Max open time per session (min)','Max. Öffnungszeit pro Sitzung (Min.)'],['Cooldown after closing (min)','Pause nach Schließen (Min.)'],['Max stand runtime per day (min)','Max. Stand-Laufzeit pro Tag (Min.)'],['Max simultaneous listings','Max. gleichzeitige Angebote'],['Max units per listing','Max. Stück pro Angebot'],['Max sold units per window','Max. verkaufte Stück pro Zeitfenster'],['Sales limit window (min)','Verkaufs-Zeitfenster (Min.)'],['Refresh interval (sec)','Aktualisierungsintervall (Sek.)'],['Minimum margin %','Mindestmarge %'],['Undercut %','Unterbieten %'],['Item policy','Item-Regel'],['Allowed item IDs','Erlaubte Item-IDs'],['Blocked item IDs','Blockierte Item-IDs'],['Minimum inventory reserve','Mindest-Inventarreserve'],['Close stand if 4/4 party is incomplete','Stand schließen, wenn 4/4-Gruppe unvollständig ist'],['Active listings','Aktive Angebote'],['Sold in current window','Im aktuellen Zeitfenster verkauft'],
      ["All entries come from the game's live <code>G.monsters</code> and <code>G.items</code> data, including currently loaded event/special items.",'Alle Einträge stammen aus den Live-Daten <code>G.monsters</code> und <code>G.items</code>, inklusive aktuell geladener Event-/Spezialobjekte.'],['Combat','Kampf'],['Defense','Verteidigung'],['Maps / Notes','Maps / Hinweise'],['Type / Level','Typ / Level'],['Value / Class','Wert / Klasse'],['Description','Beschreibung'],['Event/Special','Event/Spezial'],['Value ','Wert '],['Class ','Klasse '],
      ['Detailed bot-observable decisions, actions, party state, inventory/equipment, HP/MP/XP/gold, positions, skills, errors, dashboard and updates. It is not raw packet capture.','Detaillierte vom Bot beobachtbare Entscheidungen, Aktionen, Gruppenstatus, Inventar/Ausrüstung, HP/MP/XP/Gold, Positionen, Skills, Fehler, Dashboard und Updates. Kein Rohdaten-Netzwerkmitschnitt.'],['Current segment','Aktuelles Segment'],['Completed 12-hour segments','Abgeschlossene 12-Stunden-Segmente'],['Live events','Live-Ereignisse'],['Download','Herunterladen'],['Copy','Kopieren'],['now','jetzt'],
      ['15 languages.','15 Sprachen.'],['10 themes.','10 Themes.'],['Bot repository','Bot-Repository'],['Detailed audit log','Detailliertes Ereignisprotokoll'],['Log segment hours','Logsegment-Stunden'],['Log retention days','Log-Aufbewahrungstage'],['Check for update','Nach Update suchen']
    ];
    pairs.forEach(function(p){html=html.split(p[0]).join(p[1]);});return html;
  }
  var v281ToolHTMLBase=toolHTML;
  toolHTML=function(key){return v281GermanizeHTML(v281ToolHTMLBase(key));};

  function v281XpPct(r){var need=Number((GD.levels||[])[Number(r&&r.level)||0])||0;return need?Math.round(clamp((Number(r&&r.xp)||0)/need*100,0,100)*10)/10:0;}
  function v281MeterSnapshot(){var sec=Math.max(1,(clock()-Number(S.meter.started||clock()))/1000);return {damage:Math.round(Number(S.meter.damage)||0),heal:Math.round(Number(S.meter.heal)||0),dps:Math.round((Number(S.meter.damage)||0)/sec),hps:Math.round((Number(S.meter.heal)||0)/sec),started:Number(S.meter.started)||clock()};}
  chooseGoal=function(){
    var g=null;if(C.farmMode==='manual'){var opts=SPAWNS.filter(function(sp){return sp.monster===C.monster;});g=opts.sort(function(a,b){return (a.map===character.map?0:1)-(b.map===character.map?0:1)||dist(character,a)-dist(character,b);})[0]||null;}else g=autoGoal();
    if(!g){var live=v275VisibleFallbackTarget(mobs().filter(safeEnemy));if(live){var count=mobs().filter(function(m){return m.mtype===live.mtype&&m.map===character.map&&dist(character,m)<=C.searchRadius;}).length;g={id:'live:'+character.map+':'+live.mtype,map:character.map,monster:live.mtype,x:Number(live.x)||Number(character.x)||0,y:Number(live.y)||Number(character.y)||0,radius:Math.max(180,Math.min(500,C.searchRadius/3)),count:Math.max(1,count),liveFallback:true};}}
    S.goal=g;audit('goal',g?'Farmziel: '+g.monster+' · '+g.map:'Kein Farmziel gefunden',g);return g;
  };
  function v281TranslateState(){if(C.language!=='de')return;var exact={'Damage':'Schaden','Group detection':'Gruppenerkennung','Group discovery':'Gruppenerkennung','Logistics':'Logistik'};if(exact[S.mode])S.mode=exact[S.mode];S.status=String(S.status||'').replace(/^Waiting for automatic roster selection$/,'Warte auf automatische Gruppenauswahl').replace(/^Detecting same-bot characters/,'Erkenne Bot-Charaktere').replace(/^Merchant ready$/,'Merchant bereit');}
  function v281TargetMtype(){
    try{var t=typeof get_target==='function'&&get_target();if(t&&t.mtype)return t.mtype;}catch(e){}
    try{var id=S.target,t2=id&&P.entities&&P.entities[id];if(t2&&t2.mtype)return t2.mtype;}catch(e){}
    try{var near=mobs().filter(function(m){return m&&m.target===me;}).sort(function(a,b){return dist(character,a)-dist(character,b);})[0];if(near&&near.mtype)return near.mtype;}catch(e){}
    return null;
  }
  v277TargetMtype=v281TargetMtype;

  report=function(withRole){
    var p=pos(character)||{},rates=v273RateStats(),r={type:'aio27-report',protocol:REPORT_PROTOCOL,version:VERSION,name:me,ctype:character.ctype,level:character.level,at:clock(),map:character.map,x:p.x||0,y:p.y||0,hp:character.hp,max_hp:character.max_hp,mp:character.mp,max_mp:character.max_mp,attack:character.attack,frequency:character.frequency,armor:character.armor,resistance:character.resistance,range:character.range,speed:character.speed,damage_type:character.damage_type,slots:v273CompactSlots(),inventory:v273InventoryReport(),active:!!S.running,rip:!!character.rip,status:S.status,mode:S.mode,target:S.target,targetMtype:v281TargetMtype(),goal:S.goal,free:freeSlots(),gold:character.gold,hpot:qty(C.hpot),mpot:qty(C.mpot),xp:character.xp,xpPerHour:rates.xpPerHour,goldPerHour:rates.goldPerHour,farmHealth:S.farmHealth||v280FarmHealth(),groupStrength:v280GroupStrengthSnapshot(),merchantPlan:character.ctype==='merchant'?S.merchantPlan:null,meter:v281MeterSnapshot()};if(withRole!==false){r.role=roleForName(me);r.primaryTank=roleSummary().primaryTank;}return r;
  };

  partyHTML=function(){
    var ps=partyState(),rows=peers(true),gs=v280GroupStrengthSnapshot();
    function rr(n){if(n===me)return report();return rows.find(function(x){return x.name===n;})||peerReport(n);}
    return '<h2>'+esc(T('party'))+'</h2><div class="card"><div class="line"><span>'+esc(v281L('groupStrength'))+'</span><strong>'+v280FmtCompact(gs.score)+'</strong></div><div class="line"><span>'+esc(v281L('groupDps'))+'</span><strong>'+v280FmtCompact(gs.totalDps)+'</strong></div></div>'+C.roster.map(function(n){var r=rr(n),role=roleForName(n),icon=v280RoleIcon(role);if(!r)return '<div class="card"><div class="line"><strong><span style="display:inline-block;width:22px;text-align:center;font-size:17px">'+icon+'</span> '+esc(n)+'</strong><span class="tag">'+esc(roleLabel(role))+'</span></div><div class="muted">'+esc(v281L('noReport'))+'</div></div>';var hp=Math.round(clamp(Number(r.hp||0)/Math.max(1,Number(r.max_hp||1))*100,0,100)),mp=Math.round(clamp(Number(r.mp||0)/Math.max(1,Number(r.max_mp||1))*100,0,100)),xp=v281XpPct(r);return '<div class="card"><div class="line"><strong><span title="'+esc(roleLabel(role))+'" style="display:inline-block;width:22px;text-align:center;font-size:17px">'+icon+'</span> '+esc(n)+'</strong><span class="tag">'+esc(roleLabel(role))+'</span></div><div class="muted">Lv. '+r.level+' · '+esc(r.map||'—')+' · '+v280FmtCompact(r.xpPerHour||0)+' EXP/h</div><div class="party-vitals"><span>HP <b>'+hp+'%</b></span><span>MP <b>'+mp+'%</b></span><span>EXP <b>'+xp+'%</b></span></div></div>';}).join('')+'<div class="notice '+(ps.complete?'':'bad')+'">'+(ps.complete?esc(v281L('complete')):esc(v281L('missing'))+': '+esc((ps.missing||[]).join(', ')))+'</div>';
  };

  function v281MonsterSymbol(id){var m=GD.monsters&&GD.monsters[id]||{};if(m.boss)return '☠';if(m.cooperative)return '★';if(m.event||m.special)return '✦';if(String(m.damage_type||'').toLowerCase()==='magical')return '✧';if(Number(m.range||0)>80)return '➶';return '⚔';}
  v280MonsterOptions=function(){var ids=Object.keys(GD.monsters||{}).filter(function(id){var m=GD.monsters[id]||{};return Number(m.hp)>0;});ids.sort(function(a,b){var sa=v280MonsterSafety(a),sb=v280MonsterSafety(b),la=Number((GD.monsters[a]||{}).level)||0,lb=Number((GD.monsters[b]||{}).level)||0;return sb-sa||la-lb||String((GD.monsters[a]||{}).name||a).localeCompare(String((GD.monsters[b]||{}).name||b));});return ids;};
  farmHTML=function(){var ids=v280MonsterOptions(),safe=v280MonsterSafety(C.monster),col=v280SafetyColor(safe);return '<h2>'+esc(T('farm'))+'</h2>'+cfgField('farmMode',v281L('farmMode'),'select','',[['auto',v281L('auto')],['manual',v281L('manual')]])+'<div class="setting"><label>'+esc(v281L('manualMonster'))+'<small>'+esc(v281L('safetyHelp'))+'</small></label><select data-cfg="monster">'+ids.map(function(id){var p=v280MonsterSafety(id),m=GD.monsters[id]||{},lv=Number(m.level)||0;return '<option value="'+esc(id)+'"'+(C.monster===id?' selected':'')+'>'+v281MonsterSymbol(id)+' '+esc(m.name||id)+' (Lv '+lv+') - '+p+'%</option>';}).join('')+'</select></div><div class="card"><div class="line"><span>'+esc(v281L('safety'))+'</span><strong style="color:'+col+';font-size:20px">'+safe+'%</strong></div><div class="muted">'+esc(v281L('safetyHelp'))+'</div></div>'+cfgField('searchRadius',v281L('searchRadius'),'number')+cfgField('risk',v281L('risk'),'number')+cfgField('maxTargets',v281L('maxTargets'),'number')+cfgField('followDistance',v281L('groupDistance'),'number')+cfgField('autoFarmMinSpawnCount',v281L('minSpawn'),'number')+cfgField('goalEmptyReplanSeconds',v281L('replan'),'number')+'<div class="card"><div class="line"><span>'+esc(v281L('currentArea'))+'</span><strong>'+esc(S.goal?v273Name(S.goal.monster)+' · '+S.goal.map:'—')+'</strong></div><button class="btn primary" data-action="goal-now">'+esc(v281L('reevaluate'))+'</button></div>';};

  function v281RelevantSkills(){
    var ct=String(character.ctype||''),generic={scare:1,use_hp:0,use_mp:0},byClass={ranger:{supershot:1,'3shot':1,'5shot':1,huntersmark:1,poisonarrow:1},priest:{heal:1,partyheal:1,darkblessing:1,curse:1,absorb:1},warrior:{charge:1,taunt:1,agitate:1,warcry:1,cleave:1,stomp:1,hardshell:1},paladin:{selfheal:1,mshield:1,purify:1,smash:1},mage:{burst:1,cburst:1,energize:1,reflection:1,light:1},rogue:{quickpunch:1,quickstab:1,invis:1,poisoncoat:1,rspeed:1},merchant:{mluck:1,massproduction:1,massproductionpp:1,mcourage:1}};
    return Object.keys(GD.skills||{}).filter(function(id){var d=GD.skills[id]||{},classes=d.class?[].concat(d.class):[],classSpecific=classes.indexOf(ct)>=0,curated=!!((byClass[ct]||{})[id]||generic[id]);if(!classSpecific&&!curated)return false;if(classes.length&&classes.indexOf(ct)<0)return false;if(Number(d.level||0)>Number(character.level||0))return false;if(d.passive||d.type==='passive')return false;if(['magiport','blink','dash','warp','pickpocket','fishing','mining','throw','alchemy','track','town','use_town','open_snippet'].indexOf(id)>=0)return false;return !!(d.hostile||d.target||d.mp||d.cooldown||classSpecific||curated);}).sort(function(a,b){return (Number((GD.skills[a]||{}).level)||0)-(Number((GD.skills[b]||{}).level)||0)||String((GD.skills[a]||{}).name||a).localeCompare(String((GD.skills[b]||{}).name||b));});
  }
  classSkills=v281RelevantSkills;
  skillsHTML=function(){var rows=classSkills(),plan=v276ManaPlan();return '<h2>'+esc(T('skill_manager'))+'</h2><div class="notice">'+esc(v281L('skillInfo'))+'</div><div class="card"><div class="line"><span>'+esc(v281L('potionThreshold'))+'</span><strong>'+plan.pct+'% · '+plan.trigger+' MP</strong></div><div class="line"><span>'+esc(v281L('expensiveSkill'))+'</span><strong>'+plan.highestCost+' MP</strong></div></div>'+cfgField('weakMobSkillSaving',v281L('saveWeak'),'check')+cfgField('weakMobSkillFactor',v281L('weakFactor'),'number')+cfgField('manaReserve',v281L('manaReserve'),'number')+'<h3>'+esc(T('skills'))+'</h3>'+rows.map(function(id){var d=GD.skills[id]||{},c=skillCfg(id),st=skillDamageStats(id,d),desc=C.language==='de'?'':(d.explanation||'');return '<div class="card skillcard">'+skillVisual(id,42)+'<div><div class="line"><label><input type="checkbox" data-skill="'+esc(id)+'"'+(c.enabled?' checked':'')+'> <b>'+esc(d.name||id)+'</b></label><span class="tag">Lv '+(Number(d.level)||0)+'</span></div>'+(desc?'<div class="muted">'+esc(desc)+'</div>':'')+'<div class="skillstats"><div class="skillstat">Mana<b>'+esc(d.mp==null?'0':d.mp)+'</b></div><div class="skillstat">'+esc(v281L('cooldown'))+'<b>'+esc(cooldownText(d.cooldown))+'</b></div><div class="skillstat">'+esc(v281L('damage'))+'<b>'+esc(st.damage)+'</b></div><div class="skillstat">'+esc(v281L('damagePerMp'))+'<b>'+esc(st.perMp)+'</b></div><div class="skillstat">'+esc(v281L('rangeTarget'))+'<b>'+esc((d.range||'—')+' / '+(d.target||'—'))+'</b></div></div></div></div>';}).join('')+(rows.length?'':'<div class="notice">'+esc(v281L('noData'))+'</div>');};

  function v281MeterRows(kind){
    var rows=C.roster.map(function(n){var r=n===me?report():peerReport(n),m=r&&r.meter||{};return r?{name:n,role:roleForName(n),value:Number(kind==='damage'?m.damage:m.heal)||0,rate:Number(kind==='damage'?m.dps:m.hps)||0}:null;}).filter(Boolean).sort(function(a,b){return b.value-a.value||a.name.localeCompare(b.name);});var total=rows.reduce(function(n,r){return n+r.value;},0),max=Math.max(1,rows.length?rows[0].value:0);return {rows:rows,total:total,max:max};
  }
  function v281MeterSection(kind){var m=v281MeterRows(kind),title=kind==='damage'?v281L('damage'):v281L('healing'),rateLabel=kind==='damage'?'DPS':'HPS';return '<section class="metersection"><div class="meterhead"><strong>'+esc(title)+'</strong><span>'+v280FmtCompact(m.total)+' '+esc(v281L('total'))+'</span></div>'+(m.rows.length?m.rows.map(function(r,i){var pctTotal=m.total?Math.round(r.value/m.total*1000)/10:0,w=r.value/m.max*100;return '<div class="meterrow"><div class="meterlabel"><span class="meterrank">'+(i+1)+'</span><span>'+v280RoleIcon(r.role)+' '+esc(r.name)+'</span><b>'+v280FmtCompact(r.value)+' · '+v280FmtCompact(r.rate)+' '+rateLabel+' · '+pctTotal+'%</b></div><div class="metertrack"><i style="width:'+w+'%"></i></div></div>';}).join(''):'<div class="empty">'+esc(v281L('noData'))+'</div>')+'</section>';}
  metersHTML=function(){return '<h2>'+esc(T('meters'))+'</h2><div class="notice">'+esc(C.language==='de'?'Live-Rangliste der aktuellen Bot-Sitzung. Schaden und Heilung werden getrennt ausgewertet.':'Live ranking for the current bot session. Damage and healing are tracked separately.')+'</div>'+v281MeterSection('damage')+v281MeterSection('heal');};

  function v281MaterialEta(candidate){
    var feas=candidate&&candidate.feasibility||{},missing=feas.missing||[];if(!missing.length)return {seconds:15,confidence:'high',details:[]};var db=v273BuildKnowledgeDB(false),g=v280GroupStrengthSnapshot(),details=[],seconds=0,unknown=0;
    missing.forEach(function(m){var sec=0,why='',rows=(db.drops&&db.drops[m.name]||[]).filter(function(d){return d&&Number(d.chance)>0&&(db.spawns[d.monster]||[]).length;});if(Number(m.level)>0){sec=Math.max(20,Number(m.missing||1)*45);why='upgrade/compound';}else if(rows.length){var d=rows[0],md=GD.monsters&&GD.monsters[d.monster]||{},chance=Math.max(.0001,Number(d.chance)||0),q=Math.max(1,Number(d.q)||1),kills=Math.max(1,Number(m.missing)||1)/(chance*q),theoryKph=Math.max(1,Math.min(3600,Math.max(1,Number(g.totalDps)||1)/Math.max(1,Number(md.hp)||1)*3600*.62));var learned=0,ObjectZones=(db.learning&&db.learning.zones)||{};Object.keys(ObjectZones).forEach(function(k){var z=ObjectZones[k]||{};if(z.goal&&z.goal.monster===d.monster&&Number(md.xp)>0)learned=Math.max(learned,(Number(z.xpPerHourAvg)||0)/Number(md.xp));});var kph=learned>0?Math.max(1,learned):theoryKph;sec=kills/kph*3600+35;why=v273Name(d.monster)+' · '+Math.round(chance*10000)/100+'%';}else{var craft=v278FindRecipeForOutput(m.name,v278AggregateMaterials());if(craft){sec=Math.max(60,Number(m.missing||1)*90);why='crafting';}else{sec=Math.max(600,Number(m.missing||1)*900);why='unknown';unknown++;}}seconds+=sec;details.push({name:m.name,level:m.level||0,missing:m.missing||0,seconds:Math.round(sec),source:why});});return {seconds:Math.max(15,Math.round(seconds)),confidence:unknown?'low':'medium',details:details};
  }
  var v281AnalyzeRecipesBase=v278AnalyzeRecipes;
  v278AnalyzeRecipes=function(force){var result=v281AnalyzeRecipesBase(force);if(!result||!Array.isArray(result.rows))return result;var now=clock(),cad=Math.max(120,Number(C.merchantUpgradeCadenceMinutes||20)*60);result.rows.forEach(function(row){var eta=v281MaterialEta(row),sec=Math.max(15,eta.seconds),gain=Math.max(0,Number(row.improvement&&row.improvement.delta)||0),gainHour=gain*3600/sec,balance=1/(1+Math.max(0,Number(row.improvement&&row.improvement.strength)||0)/10000),cadenceFit=1/(1+Math.abs(Math.log(sec/cad)));row.etaSeconds=sec;row.etaDetail=eta;row.gainPerHour=gainHour;row.priority=(row.farmer?1e13:0)+(row.preferred?1e12:0)+gainHour*1e7+cadenceFit*2e8+balance*1e8+(Number(row.improvement&&row.improvement.ratio)||0)*1e7;});result.rows.sort(function(a,b){return b.priority-a.priority||a.etaSeconds-b.etaSeconds||a.output.localeCompare(b.output);});result.top=result.rows.slice(0,10).map(function(x){return {recipeId:x.recipeId,output:x.output,level:x.outputLevel,recipient:x.recipient,farmer:x.farmer,slot:x.improvement.slot,delta:Math.round(x.improvement.delta),ratio:Math.round(x.improvement.ratio*1000)/10,missing:x.feasibility.missing.length,etaSeconds:x.etaSeconds,gainPerHour:Math.round(x.gainPerHour),preferred:x.preferred};});result.at=now;S.recipeAnalysis=result;return result;};
  function v281PlanEtaRow(plan){if(!plan||!plan.job)return null;var out=plan.job.rootOutput||plan.job.recipe&&plan.job.recipe.output,rec=plan.job.targetRecipient;var rows=S.recipeAnalysis&&S.recipeAnalysis.rows||[];return rows.find(function(r){return r.output===out&&(!rec||r.recipient===rec);})||null;}
  function v281PlannerSteps(plan){var out=[],job=plan&&plan.job,row=v281PlanEtaRow(plan);if(row){out.push((C.language==='de'?'Priorität: ':'Priority: ')+v273Name(row.output)+' → '+row.recipient+' · +'+Math.round(row.improvement.ratio*1000)/10+'%');out.push(v281L('eta')+': '+v280FmtEta(row.etaSeconds)+' · '+v281L('gainHour')+': '+v280FmtCompact(row.gainPerHour));}if(job&&job.material)out.push((C.language==='de'?'Material: ':'Material: ')+v273Name(job.material.name)+' ['+job.material.have+'/'+job.material.required+']');if(plan&&plan.farmGoal)out.push((C.language==='de'?'Farmziel: ':'Farm target: ')+v273Name(plan.farmGoal.monster)+' · '+plan.farmGoal.map);out.push(C.language==='de'?'Schwächsten Farmer + besten Stärkezuwachs pro Zeit bevorzugen':'Prefer weakest farmer + best strength gain per time');return out.slice(0,5);}
  var v281PlannerBase=v273MerchantPlannerTick;
  v273MerchantPlannerTick=function(){var plan=v281PlannerBase();if(plan&&plan.job){var row=v281PlanEtaRow(plan);if(row){plan.job.etaSeconds=row.etaSeconds;plan.job.gainPerHour=Math.round(row.gainPerHour);plan.job.upgradeRatio=Math.round(row.improvement.ratio*1000)/10;plan.job.etaDetail=row.etaDetail;}plan.steps=v281PlannerSteps(plan);v273SetMerchantPlan(plan);}return plan;};

  var v281BankMissUntil={};
  v273RetrieveMaterialFromBankTick=function(recipe){
    if(character.ctype!=='merchant'||!C.merchantManageBank||!recipe)return false;var now=clock(),needed=(recipe.items||[]).filter(function(x){return v273LocalMaterialCount(x.name,x.level)<x.q;});if(!needed.length)return false;var cool=Math.max(30000,Number(C.merchantBankRecheckSeconds||180)*1000),key=function(x){return v278MaterialKey(x.name,x.level);};
    if(character.bank){S.bankScanAt=now;for(var ni=0;ni<needed.length;ni++){var need=needed[ni],found=null;for(var pack in character.bank){if(!/^items\d+$/.test(pack)||!Array.isArray(character.bank[pack]))continue;for(var j=0;j<character.bank[pack].length;j++){var it=character.bank[pack][j];if(it&&it.name===need.name&&(Number(it.level)||0)===(Number(need.level)||0)){found={pack:pack,index:j,item:it};break;}}if(found)break;}if(found&&typeof bank_retrieve==='function'){delete v281BankMissUntil[key(need)];S.status=(C.language==='de'?'Hole ':'Retrieve ')+v273Name(need.name)+(need.level?' +'+need.level:'')+(C.language==='de'?' aus der Bank':' from bank');S.mode='Merchant · Bank';return action('Bank-Material holen '+need.name,function(){return bank_retrieve(found.pack,found.index);},'bank-retrieve:'+key(need),1800);}v281BankMissUntil[key(need)]=now+cool;}return false;}
    var unchecked=needed.filter(function(x){return now>=Number(v281BankMissUntil[key(x)]||0);});if(!unchecked.length)return false;if(S.bankScanAt&&now-S.bankScanAt<cool)return false;S.status=C.language==='de'?'Bank einmalig auf fehlende Crafting-Materialien prüfen':'Check bank once for missing crafting materials';S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},C.language==='de'?'Bank prüfen':'Check bank',{kind:'bank',forceAfter:9000});
  };

  v273ExchangeTick=function(){if(character.ctype!=='merchant'||!C.merchantAutoExchange||typeof exchange!=='function')return false;var idx=(character.items||[]).findIndex(function(it){if(!it||it.l||it.p)return false;var d=GD.items&&GD.items[it.name]||{};return !!(d.e||d.exchange||d.exchanges);});if(idx<0)return false;var it=character.items[idx],d=GD.items[it.name]||{},need=Number(d.e)||Number(d.exchange)||1;if((Number(it.q)||1)<need)return false;if(String(character.map||'').indexOf('bank')===0){S.status=C.language==='de'?'Bank verlassen, bevor Belohnungs-Item eingetauscht wird':'Leave bank before exchanging reward item';S.mode='Merchant · Exchange';return moveToGoal({map:'main',x:0,y:0},C.language==='de'?'Bank für Eintausch verlassen':'Leave bank for exchange',{kind:'exchange-exit',forceAfter:9000});}S.status=(C.language==='de'?'Belohnungs-Item eintauschen: ':'Exchange reward item: ')+v273Name(it.name);S.mode='Merchant · Exchange';return action('Item eintauschen '+it.name,function(){return exchange(idx);},'merchant-exchange:'+it.name,5000);};

  v277MerchantServiceCandidates=function(){var now=clock(),last=S.merchantLastService||{},urgent=S.merchantServiceUrgent||{},wanted={};if(S.merchantPlan){(S.merchantPlan.collectOrder||[]).forEach(function(x){if(x&&x.name)wanted[v278MaterialKey(x.name,x.level)]=true;});if(S.merchantPlan.farmOrder&&S.merchantPlan.farmOrder.item)wanted[v278MaterialKey(S.merchantPlan.farmOrder.item,S.merchantPlan.farmOrder.itemLevel)]=true;}return farmerReports().filter(function(r){return r&&r.active!==false&&!r.rip;}).map(function(r){var req=v277ReportSupplyRequest(r),age=now-Number(last[r.name]||0),goldNeed=Number(r.gold||0)>Number(C.merchantCollectGoldOver||0),freeNeed=Number(r.free||99)<=Number(C.merchantPickupFreeSlotsAt||12),materialNeed=(r.inventory||[]).some(function(i){return i&&wanted[v278MaterialKey(i.name,i.level)];}),potNeed=req.hp||req.mp||!!urgent[r.name],routineNearFull=age>=Math.max(180000,C.merchantServiceIntervalSeconds*3000)&&Number(r.free||99)<=Math.min(40,Number(C.merchantPickupFreeSlotsAt||12)*2),lootNeed=freeNeed||materialNeed||routineNearFull,urgentNeed=potNeed||goldNeed||freeNeed||materialNeed,priority=(potNeed?1000000:0)+(materialNeed?700000:0)+(goldNeed?400000:0)+(freeNeed?250000:0)+(routineNearFull?50000:0)+Math.min(age,120000);return {r:r,req:req,inventory:(r.inventory||[]).length,age:age,goldNeed:goldNeed,freeNeed:freeNeed,materialNeed:materialNeed,lootNeed:lootNeed,potNeed:potNeed,urgent:urgentNeed,routine:routineNearFull,priority:priority};}).filter(function(x){return x.urgent||x.routine;}).sort(function(a,b){return b.priority-a.priority||a.r.name.localeCompare(b.r.name);});};

  merchantHTML=function(){var p=S.merchantPlan||{},ra=v278AnalyzeRecipes(false),rs=ra.stats||{},cands=v277MerchantServiceCandidates(),db=v273BuildKnowledgeDB(false);return '<h2>'+esc(T('merchant'))+'</h2>'+cfgField('merchantBankRecheckSeconds',v281L('bankRecheck'),'number')+cfgField('merchantUpgradeCadenceMinutes',v281L('cadence'),'number')+'<div class="card"><h3>'+esc(v281L('merchantEfficiency'))+'</h3>'+(ra.top&&ra.top.length?ra.top.slice(0,6).map(function(x){return '<div class="line"><span>'+esc(v273Name(x.output))+' → '+esc(x.recipient)+'</span><strong>+'+esc(String(x.ratio))+'% · '+v280FmtEta(x.etaSeconds)+' · '+v280FmtCompact(x.gainPerHour)+'/h</strong></div>';}).join(''):'<div class="muted">'+esc(v281L('noData'))+'</div>')+'</div><div class="card"><h3>'+esc(C.language==='de'?'Aktueller Plan':'Current plan')+'</h3>'+(p.steps||[]).map(function(x,i){return '<div class="line"><span>'+(i===0?(C.language==='de'?'Jetzt':'Now'):'+'+i)+'</span><strong>'+esc(x)+'</strong></div>';}).join('')+'</div><div class="card"><h3>'+esc(C.language==='de'?'Zulieferstatus':'Service status')+'</h3>'+(cands.length?cands.slice(0,4).map(function(x){return '<div class="line"><span>'+esc(x.r.name)+'</span><strong>'+esc((x.potNeed?v281L('potions')+' ':'')+(x.goldNeed?v281L('gold')+' ':'')+(x.materialNeed?v281L('materials')+' ':'')+(x.lootNeed&&!x.materialNeed?v281L('loot')+' ':'')||v281L('routine'))+'</strong></div>';}).join(''):'<div class="muted">'+esc(C.language==='de'?'Aktuell kein Service nötig.':'No service needed now.')+'</div>')+'</div><div class="muted">'+esc(C.language==='de'?'Live-Datenbank':'Live database')+': '+db.recipeCount+' '+esc(C.language==='de'?'Rezepte':'recipes')+' · '+Number(rs.farmerImprovements||0)+' '+esc(C.language==='de'?'Farmer-Upgrades':'farmer upgrades')+'.</div>';};

  dashboardPayload=function(){var p=pos(character)||{},realm=currentRealm(),ps=partyState(),rate=v273RateStats(),xpNeed=Number((GD.levels||[])[character.level])||0,xpPct=xpNeed?Math.max(0,Math.min(100,100*Number(character.xp||0)/xpNeed)):0,eta=rate.xpPerHour>0&&xpNeed>character.xp?Math.round((xpNeed-character.xp)/rate.xpPerHour*3600):null;return {type:'aio-bot-status',version:6,botVersion:VERSION,language:C.language||'en',name:me,ctype:character.ctype,role:roleForName(me),roleIcon:v280RoleIcon(roleForName(me)),level:character.level,hp:character.hp,maxHp:character.max_hp,hpPct:Math.round(ratio(character,'hp')*1000)/10,mp:character.mp,maxMp:character.max_mp,mpPct:Math.round(ratio(character,'mp')*1000)/10,xp:character.xp,xpPct:Math.round(xpPct*10)/10,xpPerHour:rate.xpPerHour,goldPerHour:rate.goldPerHour,levelEtaSeconds:eta,task:safeString(S.status,500),taskCode:safeString(S.mode,80),mode:safeString(S.mode,120),active:!!S.running,rip:!!character.rip,map:character.map,x:Number(p.x)||0,y:Number(p.y)||0,mapBounds:dashboardMapBounds(),server:realm,party:{members:ps.members||[],missing:ps.missing||[],complete:!!ps.complete},groupStrength:v280GroupStrengthSnapshot(),merchantPlan:S.merchantPlan||null,meter:v281MeterSnapshot(),updatedAt:clock()};};
  dashboardHTML=function(){var endpoint=v280DashboardEndpoint(C.webDashboardConnectionUrl),confirmed=!!S.dashboardLastAck;return '<h2>'+esc(T('dashboard'))+' '+VERSION+'</h2><div class="notice">'+esc(C.language==='de'?'Cloudflare Worker + D1 über HTTPS. Das externe Dashboard enthält jetzt Online/Offline-Status und eine Live-Positionskarte.':'Cloudflare Worker + D1 over HTTPS. The external dashboard now includes online/offline state and a live position map.')+'</div>'+cfgField('webDashboardConnectionUrl',v281L('dashboardUrl'),'url','https://…workers.dev')+cfgField('webDashboardWriteKey',v281L('writeKey'),'password')+cfgField('webDashboardEnabled',v281L('dashboardEnable'),'check')+cfgField('webDashboardIntervalSeconds',v281L('sendEvery'),'number')+'<div class="buttons"><button class="btn primary" data-action="dashboard-test">'+esc(v281L('testConnection'))+'</button></div><div class="card"><div class="line"><span>'+esc(v281L('pushEndpoint'))+'</span><strong>'+esc(endpoint||'—')+'</strong></div><div class="line"><span>'+esc(v281L('confirmed'))+'</span><strong class="'+(confirmed?'good':'warn')+'">'+(confirmed?Math.round((clock()-S.dashboardLastAck)/1000)+' s':'—')+'</strong></div><div class="line"><span>'+esc(v281L('transport'))+'</span><strong>'+esc(S.dashboardTransport||'—')+'</strong></div>'+(S.dashboardLastError?'<div class="notice bad">'+esc(S.dashboardLastError)+'</div>':'')+'</div>';};


  // ---------------------------------------------------------------------------
  // 2.8.2 Merchant controls, inventory UX, explainability and regression safety
  // ---------------------------------------------------------------------------
  var FEATURE_CONTRACT = [
    'character-info','inventory-window','party-manager','farm-mode','bestiary-items','skill-manager',
    'merchant-director','merchant-stand','meters','web-dashboard','audit-logs','settings','headless',
    'auto-update','config-preservation','fast-travel','task-reason','aio-brain','cloud-state-sync',
    'farmer-auto-equip','merchant-explorer','inventory-pressure-guard','gui-window-toggle',
    'self-training-brain','teacher-student-learning','experience-replay','prioritized-replay','brain-dashboard',
    'champion-challenger','brain-auto-rollback','brain-life-visualization','brain-diary','brain-diary-cloud-sync','brain-diary-dashboard','brain-quality-monitor','brain-overconfidence-guard','brain-drift-quarantine','adaptive-learning-control','brain-research-bridge','research-prompt-profiles','research-secret-redaction','research-dashboard'
  ];
  S.skillFilter = read('skillFilter:' + me, 'usable') === 'all' ? 'all' : 'usable';
  S.inventoryContext = null;
  S.auditSeq = Number(read('auditSeq:' + me, 0)) || 0;

  function v282ActionLevel(err){
    var e=String(err||'').toLowerCase();
    return /^(not_there|too_far|distance|cooldown|no_mp|no_hp|interrupted)$/.test(e)?'warning':'error';
  }
  function v282ActionClass(err){
    var e=String(err||'unknown').toLowerCase();
    if(/not_there|too_far|distance/.test(e))return 'target_race_or_range';
    if(/bank/.test(e))return 'invalid_location_bank';
    if(/cooldown/.test(e))return 'cooldown';
    if(/mp|mana/.test(e))return 'resource_mana';
    return 'action_failure';
  }

  function v282Stable(value){
    if(Array.isArray(value))return value.map(v282Stable);
    if(value&&typeof value==='object'){var out={};Object.keys(value).sort().forEach(function(k){out[k]=v282Stable(value[k]);});return out;}
    return value;
  }
  function v282ConfigHash(cfg){
    var text='';try{text=JSON.stringify(v282Stable(cfg));}catch(e){text=String(cfg);}
    var h=2166136261;for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);
  }
  function v282RestoreConfigAfterUpdate(){
    try{
      var backup=read('updateConfigBackup',null),applied=read('lastAppliedUpdate:'+me,null),marker='restoredUpdate:'+VERSION;
      if(!backup||backup.version===VERSION||read(marker,false))return;
      if(applied&&applied.to&&String(applied.to)!==VERSION)return;
      var before=v282ConfigHash(C),merged=Object.assign({},C,backup.config||{});C=cleanConfig(merged);write('config',C);
      if(backup.ui)write('ui:'+me,backup.ui);if(typeof backup.mainCollapsed==='boolean')write('mainCollapsed:'+me,backup.mainCollapsed);write(marker,true);
      audit('config_restore','Einstellungen nach Update wiederhergestellt',{fromVersion:backup.version,toVersion:VERSION,beforeHash:before,afterHash:v282ConfigHash(C),keys:Object.keys(backup.config||{}).length});
    }catch(e){audit('config_restore_error','Konfiguration konnte nach Update nicht vollständig wiederhergestellt werden',{error:reason(e)},'error');}
  }
  v282RestoreConfigAfterUpdate();

  function v282ExtractContract(code){
    var m=String(code||'').match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);if(!m)return null;
    try{return JSON.parse(m[1].replace(/'/g,'\"'));}catch(e){return null;}
  }
  function v282ValidateContract(code){
    var next=v282ExtractContract(code);if(!Array.isArray(next))throw Error('Feature contract missing: update blocked to prevent silent feature loss');
    var missing=FEATURE_CONTRACT.filter(function(x){return next.indexOf(x)<0;});
    if(missing.length)throw Error('Update removes protected features: '+missing.join(', '));
    return true;
  }
  var v282ValidateBase=v275ValidateUpdateCode;
  v275ValidateUpdateCode=function(code,expected){var v=v282ValidateBase(code,expected);v282ValidateContract(code);return v;};
  var v282SelfUpdateBase=selfUpdate;
  selfUpdate=function(auto){
    try{write('updateConfigBackup',{version:VERSION,at:clock(),config:C,ui:S.ui||null,mainCollapsed:!!S.mainCollapsed,configHash:v282ConfigHash(C)});audit('update_config_backup','Konfiguration vor Update gesichert',{version:VERSION,configHash:v282ConfigHash(C),features:FEATURE_CONTRACT});}catch(e){}
    return v282SelfUpdateBase(auto);
  };

  function v282TaskReason(){
    var de=C.language==='de',plan=S.merchantPlan||{},fo=plan.farmOrder||{},job=plan.job||{},goal=S.goal||plan.farmGoal||null;
    if(character.ctype==='merchant'){
      if(S.mode&&String(S.mode).indexOf('Bank')>=0)return de?'Bankzugriff ist nötig, um Materialien oder Gold für den aktuellen Merchant-Plan zu holen bzw. abzulegen.':'Bank access is needed for materials or gold required by the current merchant plan.';
      if(S.mode&&String(S.mode).indexOf('Upgrade')>=0)return de?'Dieses Upgrade erhöht die Gruppenstärke; Farmer-Ausrüstung wird vor Merchant-Ausrüstung priorisiert.':'This upgrade increases group strength; farmer equipment is prioritized.';
      if(S.mode&&String(S.mode).indexOf('Craft')>=0)return de?'Der Merchant stellt ein Item her, das laut Rezeptanalyse einen sinnvollen Fortschritt für die Gruppe bringt.':'The merchant is crafting an item that improves the group according to recipe analysis.';
      if(S.merchantServiceTarget)return de?'Der Merchant fährt zu '+S.merchantServiceTarget+', weil dort Tränke, Goldabholung, Lootabholung oder Crafting-Material benötigt werden.':'The merchant is servicing '+S.merchantServiceTarget+' because supplies, gold, loot or crafting material are needed.';
      if(job.output)return de?'Ziel: '+v273Name(job.output)+' herstellen bzw. verbessern. Fehlende Materialien werden automatisch aus Bank, Inventaren oder Farmzielen beschafft.':'Goal: craft or improve '+v273Name(job.output)+'. Missing materials are sourced automatically.';
      return de?'Der Merchant hält Versorgung, Bank, Crafting, Upgrades, Compounds, Exchanges und Gruppenlogistik im gewünschten Zustand.':'The merchant keeps supply, bank, crafting, upgrades, compounds, exchanges and group logistics in the desired state.';
    }
    if(fo.item&&goal)return de?'Töte '+v273Name(goal.monster)+' für '+v273Name(fo.item)+', damit '+v273Name(fo.output||job.output||fo.item)+' hergestellt bzw. verbessert werden kann.':'Kill '+v273Name(goal.monster)+' for '+v273Name(fo.item)+' so '+v273Name(fo.output||job.output||fo.item)+' can be crafted or improved.';
    if(goal&&C.farmMode==='auto')return de?'Töte '+v273Name(goal.monster)+' für effiziente EXP/Gold unter Berücksichtigung von Sicherheit, Spawnmenge und Konkurrenz.':'Kill '+v273Name(goal.monster)+' for efficient XP/gold considering safety, spawn count and competition.';
    if(goal)return de?'Töte '+v273Name(goal.monster)+', weil dieses Ziel im Farmmodus ausgewählt wurde.':'Kill '+v273Name(goal.monster)+' because this target is selected in farm mode.';
    if(/wart|wait/i.test(String(S.status||'')))return de?'Der Bot wartet, weil eine Voraussetzung für den nächsten sicheren Schritt noch nicht erfüllt ist.':'The bot is waiting because a prerequisite for the next safe step is not yet met.';
    return de?'Der Bot führt die nächste priorisierte Aktion aus, die aus Farmmodus, Gruppenrolle, Sicherheit und Versorgung abgeleitet wurde.':'The bot is executing the next prioritized action derived from farm mode, group role, safety and supply.';
  }

  var V282_HELP_DE={
    autoRoster:'Erkennt automatisch bis zu vier Charaktere, auf denen derselbe AiO-Bot läuft.',rosterDiscoverySeconds:'Wie lange der Bot neue Gruppencharaktere aktiv sucht.',peerReportSeconds:'Wie lange ein Statusbericht eines anderen Bots als aktuell gilt.',leader:'Bestimmt den Gruppenleiter; „auto“ wählt ihn selbstständig.',autoParty:'Erstellt und repariert die Vierergruppe automatisch.',strictFourParty:'Behandelt eine unvollständige Vierergruppe als wichtigen Fehlerzustand.',partyRepairSeconds:'Abstand zwischen Versuchen, Einladungen und Gruppenfehler zu reparieren.',fallbackTank:'Ersatz-Tank, wenn keine natürliche Tank-Klasse vorhanden ist.',tankAggroRadius:'Umkreis, in dem ein Tank zusätzliche Gegner kontrolliert.',tankMaxAggroTargets:'Maximale Zahl gleichzeitig kontrollierter Gegner.',farmMode:'Automatisch wählt der Bot ein geeignetes Farmziel; manuell nutzt er das vorgegebene Monster.',monster:'Monster-ID, die im manuellen Farmmodus angegriffen wird.',searchRadius:'Maximale Entfernung, in der der Bot nach passenden Gegnern sucht.',followDistance:'Gewünschter Abstand der Farmer zur Gruppe bzw. zum Tank.',maxTargets:'Maximale Zahl von Gegnern, die gleichzeitig aktiv bekämpft werden sollen.',safety:'Aktiviert defensive Sicherheitsentscheidungen.',risk:'Wie viel Risiko der Bot beim automatischen Farmen akzeptiert.',kite:'Lässt Fernkämpfer gefährliche Gegner auf Abstand halten.',hp:'HP-Prozent, ab denen Heiltränke verwendet werden.',mp:'MP-Prozent, ab denen Manatränke verwendet werden.',retreatHP:'Unter diesem HP-Wert zieht sich der Charakter zurück.',resumeHP:'Ab diesem HP-Wert wird der Kampf nach einem Rückzug fortgesetzt.',healAt:'Schwelle, ab der Heiler Gruppenmitglieder heilen.',hpot:'Item-ID des verwendeten HP-Tranks.',mpot:'Item-ID des verwendeten MP-Tranks.',minHP:'Mindestbestand an HP-Tränken, bevor Nachschub wichtig wird.',minMP:'Mindestbestand an MP-Tränken, bevor Nachschub wichtig wird.',stockHP:'Zielbestand an HP-Tränken nach Versorgung.',stockMP:'Zielbestand an MP-Tränken nach Versorgung.',weakMobSkillSaving:'Spart teure Angriffsskills bei Gegnern, die Basisangriffe effizient erledigen.',weakMobSkillFactor:'Definiert, wann ein Gegner im Verhältnis zum Basisangriff als schwach gilt.',manaReserve:'MP-Anteil, der für Heilung, Flucht oder wichtige Skills reserviert bleibt.',webDashboardEnabled:'Sendet Live-Statusdaten an das konfigurierte Web-Dashboard.',webDashboardConnectionUrl:'Basisadresse deines Cloudflare-Dashboards.',webDashboardWriteKey:'Geheimer Schlüssel, mit dem der Bot Statusdaten an das Dashboard senden darf.',webDashboardIntervalSeconds:'Zeit zwischen zwei Dashboard-Aktualisierungen.',auditEnabled:'Speichert detaillierte Entscheidungen, Aktionen, Fehler und Zustandsänderungen im Ereignislog.',diagnosticMode:'Erzeugt zusätzliche Diagnose-Snapshots für spätere Fehleranalyse.',diagnosticSeconds:'Abstand zwischen Diagnose-Snapshots.',logSegmentHours:'Länge eines exportierbaren Logsegments.',logRetentionDays:'Wie lange alte Ereignisse lokal aufbewahrt werden.',updateRepositoryUrl:'GitHub-Repository, aus dem automatische Updates geladen werden.',autoElixirs:'Wählt für jede Klasse automatisch ein sinnvolles Elixier.',upgradeElixirs:'Stellt höhere Elixierstufen her, wenn Rezept und Material vorhanden sind.',elixirUpgradeTo:'Höchste Elixierstufe, die automatisch angestrebt wird.',distributeElixirs:'Verteilt passende Elixiere automatisch an die Farmer.',merchantSupply:'Versorgt Farmer automatisch mit Tränken.',merchantCollectLoot:'Holt Loot und überschüssiges Gold bei Farmern ab.',merchantForceLeader:'Bevorzugt den Merchant als Koordinator der Gruppenlogistik.',merchantPlannerEnabled:'Aktiviert die zentrale Planung für Crafting, Upgrades, Materialien und Farmaufträge.',merchantAutoCraft:'Erlaubt dem Merchant sinnvolle Rezepte automatisch herzustellen.',merchantAutoUpgrade:'Erlaubt automatische Item-Upgrades.',merchantUpgradeMax:'Höchste Upgrade-Stufe, die automatisch versucht wird.',merchantAutoCompound:'Erlaubt automatische Compounds kompatibler Items.',merchantCompoundMax:'Höchste Compound-Stufe; 0 nutzt das Spielmaximum.',merchantRecipeRefreshHours:'Wie oft die Live-Rezeptdatenbank neu aufgebaut wird.',merchantManageBank:'Erlaubt dem Merchant, Materialien und Gold in der Bank zu verwalten.',merchantAutoUnlockBank:'Darf zusätzliche Bank-Packs automatisch freischalten, wenn möglich.',merchantAllowShellBankUnlock:'Erlaubt ausdrücklich Bank-Freischaltungen, die Shells kosten können.',merchantBankGoldReserve:'Gold, das der Merchant immer außerhalb der Bank behalten soll.',merchantFarmerGoldReserve:'Gold, das auf jedem Farmer verbleiben soll.',merchantSellTrashToNpc:'Darf klar entbehrliche Items an NPCs verkaufen.',merchantAutoExchange:'Tauscht vollständige Exchange-Stapel automatisch ein.',merchantBalanceFarmers:'Gleicht Versorgung und Ressourcen zwischen Farmern aus.',merchantCraftTargets:'Optionale bevorzugte Item-IDs für Crafting; leer lässt den Planner vollständig automatisch wählen.',merchantDeliveryHPQty:'Maximale HP-Trankmenge pro Lieferung.',merchantDeliveryMPQty:'Maximale MP-Trankmenge pro Lieferung.',merchantRestockHPAt:'HP-Trank-Untergrenze eines Farmers; 0 berechnet sie automatisch.',merchantRestockMPAt:'MP-Trank-Untergrenze eines Farmers; 0 berechnet sie automatisch.',merchantServiceIntervalSeconds:'Wie häufig der Merchant Farmer routinemäßig prüft.',merchantPickupFreeSlotsAt:'Ab wie wenigen freien Slots Lootabholung dringend wird.',merchantBankRecheckSeconds:'Wartezeit bis fehlende Materialien erneut in der Bank gesucht werden.',merchantUpgradeCadenceMinutes:'Zielabstand zwischen sinnvollen Upgrade-Versuchen.',merchantBuyHPTo:'Zielbestand an HP-Tränken beim Einkauf.',merchantBuyMPTo:'Zielbestand an MP-Tränken beim Einkauf.',merchantCollectGoldOver:'Ab diesem Farmer-Goldbestand plant der Merchant eine Abholung.',merchantInventoryReserve:'So viele Inventarplätze hält der Merchant für Logistik frei.',merchantStandAutomation:'Schaltet den automatischen Verkaufsstand ausdrücklich ein.',standPriority:'Legt fest, wie leicht der Stand zugunsten wichtiger Gruppenaufgaben geschlossen wird.',standMaxOpenMinutes:'Maximale Öffnungsdauer pro Stand-Sitzung.',standCooldownMinutes:'Pause nach dem Schließen, bevor erneut geöffnet wird.',standDailyRuntimeMinutes:'Maximale Stand-Laufzeit pro Tag.',standMaxListings:'Maximale Anzahl gleichzeitig angebotener Items.',standMaxUnitsPerListing:'Maximale Stückzahl pro Angebot.',standMaxUnitsPerWindow:'Verkaufslimit innerhalb des definierten Zeitfensters.',standWindowMinutes:'Länge des Zeitfensters für das Verkaufslimit.',standRefreshSeconds:'Wie oft neue Standangebote geprüft werden.',standMinMarginPct:'Mindestaufschlag gegenüber dem geschätzten Itemwert.',standUndercutPct:'Prozent, um die vergleichbare Angebote unterboten werden dürfen.',standItemMode:'Bestimmt, welche Items grundsätzlich angeboten werden dürfen.',standAllowedItems:'Whitelist der Item-IDs, die im Stand angeboten werden dürfen.',standBlockedItems:'Blacklist der Item-IDs, die niemals im Stand angeboten werden dürfen.',standKeepQuantity:'Mindestmenge eines Items, die nicht verkauft wird.',standCloseWhenPartyIncomplete:'Schließt den Stand, wenn die Vierergruppe nicht vollständig ist.',showSettingHelp:'Blendet diese kurzen Erklärungen unter allen Einstellungen ein oder aus.',uiTransparencyPct:'Transparenz aller Bot-Fenster. 0 % ist vollständig sichtbar; maximal 85 % verhindert ein unsichtbares GUI.',fastTravelEnabled:'Nutzt sichere Schnellreise-Funktionen des Spiels wie town sowie die von smart_move bekannten Türen und Transporte, wenn sie den Weg sinnvoll verkürzen.',inventoryProtectedItems:'Item-IDs, die vor automatischem NPC-Verkauf und ähnlichen Entsorgungsaktionen geschützt werden.'
  };
  function v282SettingHelp(key){
    if(C.language==='de')return V282_HELP_DE[key]||('Steuert die Bot-Funktion „'+key+'“. Änderungen werden sofort gespeichert und bei Updates übernommen.');
    return 'Controls the bot setting "'+key+'". Changes are saved immediately and preserved across updates.';
  }
  cfgField=function(key,label,type,help,options){
    var v=C[key],control='',h=C.showSettingHelp?(help||v282SettingHelp(key)):'';
    if(type==='check')control='<input type="checkbox" data-cfg="'+esc(key)+'"'+(v?' checked':'')+'>';
    else if(type==='select')control='<select data-cfg="'+esc(key)+'">'+(options||[]).map(function(o){return '<option value="'+esc(o[0])+'"'+(String(v)===String(o[0])?' selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select>';
    else if(type==='range')control='<input data-cfg="'+esc(key)+'" type="range" min="0" max="85" step="5" value="'+esc(v)+'"><b class="rangevalue">'+esc(v)+'%</b>';
    else control='<input data-cfg="'+esc(key)+'" type="'+(type||'text')+'" value="'+esc(v)+'">';
    return '<div class="setting"><label>'+esc(label)+(h?'<small>'+esc(h)+'</small>':'')+'</label>'+control+'</div>';
  };
  var v282ApplyAppearanceBase=applyAppearance;
  applyAppearance=function(){v282ApplyAppearanceBase();if(uiHost)uiHost.style.setProperty('--ui-opacity',String(Math.max(.15,1-Number(C.uiTransparencyPct||0)/100)));};

  toolDefs=function(){return [
    ['character','user',T('character'),C.language==='de'?'HP, MP, Position und aktueller Grund':'HP, MP, position and current reason'],
    ['inventory','book',C.language==='de'?'Inventar':'Inventory',C.language==='de'?'Items und Merchant-Regeln · ohne preview_item':'Items and merchant rules · no preview_item'],
    ['party','users',T('party'),'4/4 detection and repair'],['farm','target',C.language==='de'?'Farmmodus':T('farm'),'Automatic or manual target selection'],
    ['bestiary','book',T('bestiary'),'All monsters, items and event items'],['skills','spark',T('skills'),'Mana, cooldown and damage efficiency'],
    ['brain','spark',(C.language==='de'?'Gehirn':'Brain'),'Lebendiges Lernsystem · Teacher, Champion & Challenger'],['merchant','flask',T('merchant'),C.language==='de'?'Merchant-Verhalten und Elixiere':'Merchant behavior and elixirs'],['stand','store',T('stand'),'Explicit opt-in and precise limits'],
    ['meters','chart',T('meters'),'Session combat meters'],['dashboard','globe',T('dashboard'),'Dashboard connection'],['logs','log',T('logs'),'Detailed audit and exports'],
    ['settings','settings',T('settings'),'Themes, help, transparency and updates'],['headless','terminal',T('headless'),'Guided Windows/Linux/macOS setup']
  ];};

  function v282ItemTooltip(item,slotNo){
    if(!item)return '';
    var d=GD.items&&GD.items[item.name]||{},p=itemProps(item)||{},lines=[];
    lines.push(d.name||item.name);if(Number(item.level))lines.push('+'+Number(item.level));if(item.q)lines.push('Menge: '+item.q);
    if(d.explanation)lines.push(d.explanation);
    ['attack','armor','resistance','hp','mp','str','dex','int','vit','crit','frequency','speed','range'].forEach(function(k){if(p[k]!=null&&Number(p[k])!==0)lines.push(k+': '+p[k]);});
    if(d.g)lines.push('Wert: '+Number(d.g).toLocaleString());lines.push('Inventar-Slot: '+slotNo);
    return lines.join('\n');
  }
  function v282CsvSet(key,name,on){
    var a=csv(C[key]);a=a.filter(function(x){return x!==name;});if(on)a.push(name);C[key]=a.filter(function(x,i,z){return z.indexOf(x)===i;}).join(', ');C=cleanConfig(C);write('config',C);S.cloudConfigDirty=true;audit('inventory_rule','Inventarregel geändert',{item:name,key:key,enabled:on});
  }
  function v282ItemRuleBadges(name){var out=[];if(csv(C.standAllowedItems).indexOf(name)>=0)out.push('<span class="badge good">Whitelist</span>');if(csv(C.standBlockedItems).indexOf(name)>=0)out.push('<span class="badge bad">Blacklist</span>');if(csv(C.inventoryProtectedItems).indexOf(name)>=0)out.push('<span class="badge warn">Geschützt</span>');return out.join('');}
  function inventoryHTML(){
    var rows=(character.items||[]).map(function(it,i){if(!it)return '';var d=GD.items&&GD.items[it.name]||{};return '<div class="invitem" data-inv-slot="'+i+'" data-inv-name="'+esc(it.name)+'" title="'+esc(v282ItemTooltip(it,i))+'">'+itemVisual(it.name,42)+'<div class="invtext"><div class="line"><b>'+esc(d.name||it.name)+(Number(it.level)?' +'+Number(it.level):'')+'</b><span class="tag">#'+i+(it.q?' · '+it.q+'×':'')+'</span></div><div class="muted">'+esc(it.name)+' · '+esc(d.type||'Item')+'</div><div class="badges">'+v282ItemRuleBadges(it.name)+'</div></div></div>';}).join('');
    return '<h2>'+(C.language==='de'?'Inventar':'Inventory')+'</h2><div class="notice">'+(C.language==='de'?'Inventarübersicht ohne Spiel-Preview-Aufruf. Rechtsklick öffnet Merchant-/Schutzregeln.':'Inventory overview without calling the game preview API. Right click opens merchant/protection rules.')+'</div><div class="invgrid">'+(rows||'<div class="muted">Inventar leer.</div>')+'</div><div id="inv-context"></div>';
  }
  function v282ShowInventoryContext(slotNo,x,y){
    var it=character.items&&character.items[slotNo];if(!it||!uiRoot)return;var old=uiRoot.querySelector('.invmenu');if(old)old.remove();var el=D.createElement('div');el.className='invmenu';el.style.left=Math.max(8,Math.min((P.innerWidth||1200)-250,x))+'px';el.style.top=Math.max(8,Math.min((P.innerHeight||900)-220,y))+'px';el.innerHTML='<b>'+esc((GD.items[it.name]||{}).name||it.name)+'</b><button data-inv-rule="allow" data-name="'+esc(it.name)+'">Auf Merchant-Whitelist</button><button data-inv-rule="block" data-name="'+esc(it.name)+'">Auf Merchant-Blacklist</button><button data-inv-rule="clear" data-name="'+esc(it.name)+'">Aus Standlisten entfernen</button><button data-inv-rule="protect" data-name="'+esc(it.name)+'">Item schützen</button><button data-inv-rule="unprotect" data-name="'+esc(it.name)+'">Schutz entfernen</button>';uiRoot.appendChild(el);S.inventoryContext=el;
  }

  function v282SkillClassAllowed(id,d,includeLocked){
    var ct=String(character.ctype||'').toLowerCase(),cls=d.class==null?null:[].concat(d.class).map(function(x){return String(x).toLowerCase();});
    if(cls&&cls.length&&cls.indexOf(ct)<0)return false;
    if(!includeLocked&&Number(d.level||0)>Number(character.level||0))return false;
    var unusable=['snippet','stop','use_hp','use_mp','use_hp_or_mp','attack','heal'];if(unusable.indexOf(id)>=0)return false;
    return true;
  }
  function v282AllClassSkills(){return Object.keys(GD.skills||{}).filter(function(id){return v282SkillClassAllowed(id,GD.skills[id]||{},true);}).sort(function(a,b){var A=GD.skills[a]||{},B=GD.skills[b]||{};return (Number(A.level)||0)-(Number(B.level)||0)||String(A.name||a).localeCompare(String(B.name||b));});}
  skillsHTML=function(){
    var rows=S.skillFilter==='all'?v282AllClassSkills():v281RelevantSkills(),plan=v276ManaPlan();
    return '<h2>'+esc(T('skill_manager'))+'</h2><div class="searchbar"><select data-skill-filter><option value="usable"'+(S.skillFilter==='usable'?' selected':'')+'>'+(C.language==='de'?'Zeige nutzbare':'Show usable')+'</option><option value="all"'+(S.skillFilter==='all'?' selected':'')+'>'+(C.language==='de'?'Zeige alle':'Show all')+'</option></select></div><div class="notice">'+esc(C.language==='de'?'„Zeige nutzbare“ entspricht der bisherigen 2.8.1-Auswahl. „Zeige alle“ zeigt alle zur Klasse gehörenden Skills und markiert Level-Sperren. Hover zeigt die originale Beschreibung aus G.skills.':'“Show usable” preserves the 2.8.1 list. “Show all” includes class skills with level locks. Hover shows the live G.skills description.')+'</div><div class="card"><div class="line"><span>'+esc(v281L('potionThreshold'))+'</span><strong>'+plan.pct+'% · '+plan.trigger+' MP</strong></div><div class="line"><span>'+esc(v281L('expensiveSkill'))+'</span><strong>'+plan.highestCost+' MP</strong></div></div>'+cfgField('weakMobSkillSaving',v281L('saveWeak'),'check')+cfgField('weakMobSkillFactor',v281L('weakFactor'),'number')+cfgField('manaReserve',v281L('manaReserve'),'number')+'<h3>'+esc(T('skills'))+'</h3>'+rows.map(function(id){var d=GD.skills[id]||{},c=skillCfg(id),st=skillDamageStats(id,d),locked=Number(d.level||0)>Number(character.level||0),tip=d.explanation||'—';return '<div class="card skillcard skillhover" title="'+esc(tip)+'">'+skillVisual(id,42)+'<div><div class="line"><label><input type="checkbox" data-skill="'+esc(id)+'"'+(c.enabled?' checked':'')+(locked?' disabled':'')+'> <b>'+esc(d.name||id)+'</b></label><span class="tag '+(locked?'bad':'')+'">Lv '+(Number(d.level)||0)+(locked?' · gesperrt':'')+'</span></div><div class="muted skilldesc">'+esc(tip)+'</div><div class="skillstats"><div class="skillstat">Mana<b>'+esc(d.mp==null?'0':d.mp)+'</b></div><div class="skillstat">'+esc(v281L('cooldown'))+'<b>'+esc(cooldownText(d.cooldown))+'</b></div><div class="skillstat">'+esc(v281L('damage'))+'<b>'+esc(st.damage)+'</b></div><div class="skillstat">'+esc(v281L('damagePerMp'))+'<b>'+esc(st.perMp)+'</b></div><div class="skillstat">'+esc(v281L('rangeTarget'))+'<b>'+esc((d.range||'—')+' / '+(d.target||'—'))+'</b></div></div></div></div>';}).join('');
  };

  characterHTML=function(){var ps=partyState(),rate=v273RateStats(),xpNeed=Number((GD.levels||[])[character.level])||0,xpPct=xpNeed?Math.round(1000*Number(character.xp||0)/xpNeed)/10:0,eta=rate.xpPerHour>0&&xpNeed>character.xp?(xpNeed-character.xp)/rate.xpPerHour*3600:null;return '<h2>'+esc(T('character'))+'</h2><div class="card"><div class="line"><strong>'+esc(me)+'</strong><span class="tag">'+esc(character.ctype)+' · Lv. '+character.level+'</span></div><div class="muted">'+esc(character.map)+' · X '+Math.round(character.x||0)+' · Y '+Math.round(character.y||0)+'</div><p>HP '+character.hp+' / '+character.max_hp+'</p><div class="bar hp"><i style="width:'+Math.round(ratio(character,'hp')*100)+'%"></i></div><p>MP '+character.mp+' / '+character.max_mp+'</p><div class="bar mp"><i style="width:'+Math.round(ratio(character,'mp')*100)+'%"></i></div><div class="dbstats"><div>XP<b>'+xpPct+'%</b></div><div>EXP/h<b>'+v280FmtCompact(rate.xpPerHour)+'</b></div><div>Gold/h<b>'+v280FmtCompact(rate.goldPerHour)+'</b></div></div><div class="line"><span>Zeit bis Level-up</span><strong>'+v280FmtEta(eta)+'</strong></div></div><div class="card"><div class="line"><span>Aktueller Task</span><strong>'+esc(S.status)+'</strong></div><div class="line"><span>Modus</span><span>'+esc(S.mode)+'</span></div><div class="line"><span>Party</span><span class="'+(ps.complete?'good':'bad')+'">'+ps.members.length+'/'+Math.max(4,ps.expected.length)+'</span></div><div class="notice"><b>'+(C.language==='de'?'Warum?':'Why?')+'</b><br>'+esc(v282TaskReason())+'</div></div>';};

  merchantHTML=function(){
    var p=S.merchantPlan||{},ra=v278AnalyzeRecipes(false),rs=ra.stats||{},cands=v277MerchantServiceCandidates(),db=v273BuildKnowledgeDB(false),de=C.language==='de';
    return '<h2>'+(de?'Merchant / Elixiere':'Merchant / Elixirs')+'</h2><div class="notice">'+(de?'Hier wird ausschließlich das Merchant-Verhalten gesteuert. Die Merchant-Stand-Mechanik bleibt vollständig im separaten Fenster „Merchant-Stand“.':'This window controls merchant behavior only. Stand mechanics remain in the separate Merchant Stand window.')+'</div>'+
      '<h3>'+(de?'Planung & Prioritäten':'Planning & priorities')+'</h3>'+cfgField('merchantForceLeader',de?'Merchant als Logistik-Koordinator':'Merchant as logistics coordinator','check')+cfgField('merchantPlannerEnabled',de?'Merchant-Planer aktiv':'Merchant planner enabled','check')+
      '<h3>'+(de?'Versorgung & Abholung':'Supply & collection')+'</h3>'+cfgField('merchantSupply',de?'Farmer automatisch versorgen':'Automatically supply farmers','check')+cfgField('merchantCollectLoot',de?'Loot und Gold abholen':'Collect loot and gold','check')+cfgField('merchantServiceIntervalSeconds',de?'Service-Intervall (Sek.)':'Service interval (sec)','number')+cfgField('merchantPickupFreeSlotsAt',de?'Lootabholung ab freien Slots ≤':'Collect loot when free slots ≤','number')+cfgField('merchantCollectGoldOver',de?'Gold abholen über':'Collect gold above','number')+cfgField('merchantFarmerGoldReserve',de?'Goldreserve pro Farmer':'Gold reserve per farmer','number')+cfgField('merchantDeliveryHPQty',de?'HP-Tränke pro Lieferung':'HP potions per delivery','number')+cfgField('merchantDeliveryMPQty',de?'MP-Tränke pro Lieferung':'MP potions per delivery','number')+cfgField('merchantRestockHPAt',de?'HP-Untergrenze (0 = automatisch)':'HP threshold (0 = automatic)','number')+cfgField('merchantRestockMPAt',de?'MP-Untergrenze (0 = automatisch)':'MP threshold (0 = automatic)','number')+cfgField('merchantBuyHPTo',de?'Merchant kauft HP-Tränke bis':'Merchant buys HP potions to','number')+cfgField('merchantBuyMPTo',de?'Merchant kauft MP-Tränke bis':'Merchant buys MP potions to','number')+cfgField('merchantInventoryReserve',de?'Freie Merchant-Slots reservieren':'Reserve merchant inventory slots','number')+
      '<h3>Crafting / Upgrade / Compound</h3>'+cfgField('merchantAutoCraft',de?'Sinnvolle Rezepte automatisch craften':'Auto craft useful recipes','check')+cfgField('merchantCraftTargets',de?'Bevorzugte Craft-Item-IDs':'Preferred craft item IDs','text')+cfgField('merchantAutoUpgrade',de?'Nützliche Items automatisch upgraden':'Auto-upgrade useful items','check')+cfgField('merchantUpgradeMax',de?'Upgrade-Obergrenze +':'Upgrade max +','number')+cfgField('merchantAutoCompound',de?'Nützliche Items automatisch kombinieren':'Auto-compound useful items','check')+cfgField('merchantCompoundMax',de?'Compound-Obergrenze':'Compound max','number')+cfgField('merchantUpgradeCadenceMinutes',de?'Zielintervall Upgrades (Min.)':'Upgrade target cadence (min)','number')+
      '<h3>'+(de?'Bank & Exchanges':'Bank & exchanges')+'</h3>'+cfgField('merchantManageBank',de?'Bank automatisch verwalten':'Manage bank automatically','check')+cfgField('merchantAutoUnlockBank',de?'Neue Bankpacks freischalten':'Unlock bank packs','check')+cfgField('merchantAllowShellBankUnlock',de?'Shell-Kosten für Bank erlauben':'Allow shell bank unlocks','check')+cfgField('merchantBankGoldReserve',de?'Merchant-Goldreserve':'Merchant gold reserve','number')+cfgField('merchantBankRecheckSeconds',de?'Bank erneut prüfen nach (Sek.)':'Bank recheck (sec)','number')+cfgField('merchantSellTrashToNpc',de?'Entbehrliche Items an NPC verkaufen':'Sell disposable items to NPC','check')+cfgField('merchantAutoExchange',de?'Exchange-Items automatisch eintauschen':'Auto exchange items','check')+cfgField('merchantBalanceFarmers',de?'Farmer-Ressourcen ausgleichen':'Balance farmer resources','check')+cfgField('merchantRecipeRefreshHours',de?'Live-Rezepte neu laden nach (Std.)':'Refresh live recipes (hours)','number')+
      '<h3>'+(de?'Elixiere':'Elixirs')+'</h3>'+cfgField('autoElixirs',de?'Elixiere automatisch optimieren':'Automatic elixir optimization','check')+cfgField('upgradeElixirs',de?'Höhere Elixierstufen herstellen':'Craft higher elixir tiers','check')+cfgField('elixirUpgradeTo',de?'Maximale Elixierstufe':'Maximum elixir tier','number')+cfgField('distributeElixirs',de?'Beste Elixiere an Farmer verteilen':'Distribute best elixirs to farmers','check')+
      '<div class="card"><h3>'+(de?'Upgrade-Effizienz':'Upgrade efficiency')+'</h3>'+(ra.top&&ra.top.length?ra.top.slice(0,6).map(function(x){return '<div class="line"><span>'+esc(v273Name(x.output))+' → '+esc(x.recipient)+'</span><strong>+'+esc(String(x.ratio))+'% · '+v280FmtEta(x.etaSeconds)+'</strong></div>';}).join(''):'<div class="muted">'+esc(v281L('noData'))+'</div>')+'</div><div class="card"><h3>'+(de?'Aktueller Plan':'Current plan')+'</h3>'+(p.steps||[]).map(function(x,i){return '<div class="line"><span>'+(i===0?(de?'Jetzt':'Now'):'+'+i)+'</span><strong>'+esc(x)+'</strong></div>';}).join('')+'</div><div class="card"><h3>'+(de?'Zulieferstatus':'Service status')+'</h3>'+(cands.length?cands.slice(0,4).map(function(x){return '<div class="line"><span>'+esc(x.r.name)+'</span><strong>'+esc((x.potNeed?'Tränke ':'')+(x.goldNeed?'Gold ':'')+(x.materialNeed?'Material ':'')+(x.lootNeed&&!x.materialNeed?'Loot ':'')||'Routine')+'</strong></div>';}).join(''):'<div class="muted">'+(de?'Aktuell kein Service nötig.':'No service needed now.')+'</div>')+'</div><div class="muted">Live-Datenbank: '+db.recipeCount+' Rezepte · '+Number(rs.farmerImprovements||0)+' Farmer-Upgrades.</div>';
  };

  standHTML=function(){var loc=C.standLocation,de=C.language==='de';return '<h2>'+esc(T('stand'))+'</h2><div class="notice warn"><b>'+(de?'Standardmäßig AUS.':'OFF by default.')+'</b> '+(de?'Der Stand öffnet nur am einmal festgelegten Standort. Für einen Verkaufsstand ist die Stadt sinnvoll; speichere dort deinen gewünschten Platz einmal manuell.':'The stand only opens at the one saved location. A city spot is appropriate; save the exact spot once manually.')+'</div><div class="card"><div class="line"><span>'+(de?'Gespeicherter Standplatz':'Saved stand location')+'</span><strong>'+esc(loc?(loc.map+' · '+loc.x+', '+loc.y):(de?'noch nicht gesetzt':'not set'))+'</strong></div><div class="buttons"><button class="btn primary" data-action="stand-set-location">'+(de?'Aktuelle Position als Standplatz setzen':'Save current position as stand location')+'</button><button class="btn" data-action="stand-clear-location">'+(de?'Standplatz löschen':'Clear location')+'</button></div></div>'+cfgField('merchantStandAutomation',de?'AUTOMATISCHEN VERKAUF AUSDRÜCKLICH AKTIVIEREN':'EXPLICITLY ENABLE AUTOMATIC SELLING','check')+cfgField('standPriority',de?'Stand-Priorität':'Stand priority','select','',[['idle','Low / idle only'],['normal','Normal'],['high','High']])+cfgField('standMaxOpenMinutes',de?'Max. Öffnungszeit pro Sitzung (Min.)':'Max open time per session (min)','number')+cfgField('standCooldownMinutes',de?'Pause nach Schließen (Min.)':'Cooldown after closing (min)','number')+cfgField('standDailyRuntimeMinutes',de?'Max. Stand-Laufzeit pro Tag (Min.)':'Max daily runtime (min)','number')+cfgField('standMaxListings',de?'Max. gleichzeitige Angebote':'Max listings','number')+cfgField('standMaxUnitsPerListing',de?'Max. Stück pro Angebot':'Max units per listing','number')+cfgField('standMaxUnitsPerWindow',de?'Max. verkaufte Stück pro Zeitfenster':'Max sold units per window','number')+cfgField('standWindowMinutes',de?'Verkaufs-Zeitfenster (Min.)':'Sales window (min)','number')+cfgField('standRefreshSeconds',de?'Aktualisierungsintervall (Sek.)':'Refresh interval (sec)','number')+cfgField('standMinMarginPct',de?'Mindestmarge %':'Minimum margin %','number')+cfgField('standUndercutPct',de?'Unterbieten %':'Undercut %','number')+cfgField('standItemMode',de?'Item-Regel':'Item policy','select','',[['allowlist','Allowlist only'],['safe_spares','Safe spares'],['all_unprotected','All unprotected']])+cfgField('standAllowedItems',de?'Whitelist Item-IDs':'Allowed item IDs','text')+cfgField('standBlockedItems',de?'Blacklist Item-IDs':'Blocked item IDs','text')+cfgField('standKeepQuantity',de?'Mindest-Inventarreserve':'Minimum inventory reserve','number')+cfgField('standCloseWhenPartyIncomplete',de?'Stand bei unvollständiger 4/4-Gruppe schließen':'Close if party incomplete','check')+'<div class="card"><div class="line"><span>'+(de?'Aktive Angebote':'Active listings')+'</span><strong>'+ownTradeListings().length+'</strong></div><div class="line"><span>'+(de?'Im aktuellen Zeitfenster verkauft':'Sold in current window')+'</span><strong>'+standWindowSales()+' / '+C.standMaxUnitsPerWindow+'</strong></div></div>';};

  function v282VendorForScroll(name){
    var out=null;
    try{Object.keys(GD.maps||{}).some(function(mapId){var map=GD.maps[mapId]||{},rows=map.npcs||map.NPCs||[];return (Array.isArray(rows)?rows:[]).some(function(r){var id=Array.isArray(r)?r[0]:(r&&r.id),x=Array.isArray(r)?r[1]:(r&&r.x),y=Array.isArray(r)?r[2]:(r&&r.y),nd=GD.npcs&&GD.npcs[id]||{},stock=[].concat(nd.items||nd.sells||[]);var has=stock.some(function(v){return (Array.isArray(v)?v[0]:v)===name;});if(has&&isFinite(Number(x))&&isFinite(Number(y))){out={map:mapId,x:Number(x),y:Number(y),npc:id,source:'G.maps/G.npcs'};return true;}return false;});});}catch(e){}
    if(!out&&/^c?scroll\d+$/.test(name))out={map:'main',x:-225,y:-125,npc:'scroll_vendor',source:'safe fallback'};
    return out;
  }
  v273EnsureScroll=function(prefix,item){
    var name=v273ScrollName(prefix,item),idx=slot(name);if(idx>=0)return idx;if(!(typeof buy==='function'&&GD.items&&GD.items[name]))return -1;
    var price=Number(GD.items[name].g||0);if(character.gold-price<=C.merchantBankGoldReserve)return -1;
    var dest=v282VendorForScroll(name);if(dest&&(character.map!==dest.map||dist(character,dest)>260)){
      S.status=(C.language==='de'?'Zum Scroll-Händler für ':'Go to scroll vendor for ')+name;S.mode='Merchant · Einkauf';audit('merchant_scroll_route','Scroll fehlt; zuerst zum Händler bewegen',{scroll:name,from:pos(character),vendor:dest});moveToGoal(dest,'Scroll-Händler '+name,{kind:'merchant-scroll-vendor',forceAfter:9000});return -1;
    }
    action('Scroll kaufen '+name,function(){return buy(name,1);},'buy-scroll:'+name,1800);return -1;
  };

  var v282StandBase=merchantStandTick;
  merchantStandTick=function(){
    if(character.ctype!=='merchant'||!C.merchantStandAutomation)return v282StandBase();
    var loc=C.standLocation;if(!loc){if(standIsOpen())closeStand('Kein fester Standplatz gesetzt');S.status=C.language==='de'?'Standplatz einmalig im Stand-Fenster setzen':'Set stand location once in Stand window';S.mode='Stand · Konfiguration';return false;}
    if(character.map!==loc.map||dist(character,loc)>65){if(standIsOpen())closeStand('Zum gespeicherten Standplatz zurückkehren');S.status=C.language==='de'?'Zum festen Merchant-Standplatz':'Move to fixed merchant stand location';S.mode='Stand · Anreise';return moveToGoal(loc,'Fester Merchant-Standplatz',{kind:'merchant-stand-location',forceAfter:9000});}
    return v282StandBase();
  };

  function v282TravelCapabilities(){
    var caps=[];if(typeof smart_move==='function')caps.push('smart_move');if(typeof town==='function')caps.push('town');if(typeof transport==='function')caps.push('transport');if(typeof use_nearest_door==='function')caps.push('use_nearest_door');
    Object.keys(GD.skills||{}).forEach(function(id){var d=GD.skills[id]||{},t=(id+' '+(d.name||'')+' '+(d.explanation||'')).toLowerCase();if(/teleport|magiport|blink|warp|town|transport/.test(t))caps.push('skill:'+id);});
    Object.keys(GD.items||{}).forEach(function(id){var d=GD.items[id]||{},t=(id+' '+(d.name||'')+' '+(d.explanation||'')).toLowerCase();if(/teleport|warp|town portal|travel/.test(t))caps.push('item:'+id);});
    return caps.filter(function(x,i,a){return a.indexOf(x)===i;});
  }
  var v282MoveBase=moveToGoal;
  moveToGoal=function(g,why,opts){
    opts=opts||{};if(C.fastTravelEnabled&&g&&String(g.map||'')==='main'&&String(character.map||'')!=='main'&&String(character.map||'').indexOf('bank')!==0&&typeof town==='function'&&!S.moveInFlight&&clock()>(S.times.fastTown||0)){
      S.times.fastTown=clock()+20000;audit('fast_travel','Schnellreise town() gewählt',{from:pos(character),to:g,reason:why,capabilities:v282TravelCapabilities()});return action('Schnellreise town()',function(){return town();},'fast-travel-town',18000);
    }
    return v282MoveBase(g,why,opts);
  };

  function v282MapVisual(){
    var map=GD.maps&&GD.maps[character.map]||{},out={npcs:[],doors:[],spawns:[]};
    try{(Array.isArray(map.npcs)?map.npcs:[]).slice(0,80).forEach(function(r){var id=Array.isArray(r)?r[0]:(r&&r.id),x=Array.isArray(r)?r[1]:(r&&r.x),y=Array.isArray(r)?r[2]:(r&&r.y);if(isFinite(Number(x))&&isFinite(Number(y)))out.npcs.push({id:safeString(id,40),x:Number(x),y:Number(y)});});}catch(e){}
    try{(Array.isArray(map.doors)?map.doors:[]).slice(0,80).forEach(function(r){var x=Array.isArray(r)?r[0]:(r&&r.x),y=Array.isArray(r)?r[1]:(r&&r.y),to=Array.isArray(r)?r[4]:(r&&(r.map||r.to));if(isFinite(Number(x))&&isFinite(Number(y)))out.doors.push({x:Number(x),y:Number(y),to:safeString(to,40)});});}catch(e){}
    try{(Array.isArray(map.monsters)?map.monsters:[]).slice(0,50).forEach(function(m){if(!m)return;var b=m.boundary||m.boundaries||null;if(Array.isArray(b)&&b.length>=4&&b.slice(0,4).every(function(n){return isFinite(Number(n));}))out.spawns.push({type:safeString(m.type,40),x1:Number(b[0]),y1:Number(b[1]),x2:Number(b[2]),y2:Number(b[3])});});}catch(e){}
    return out;
  }
  var v282DashboardBase=dashboardPayload;
  dashboardPayload=function(){var d=v282DashboardBase();d.version=7;d.taskReason=safeString(v282TaskReason(),700);d.mapBounds=dashboardMapBounds();d.mapVisual=v282MapVisual();d.travelCapabilities=v282TravelCapabilities().slice(0,24);return d;};

  settingsHTML=function(){var themeOptions=[['midnight','Midnight Glass'],['arctic','Arctic Light'],['solarized','Solarized'],['neon','Neon Cyber'],['forest','Forest'],['crimson','Crimson'],['royal','Royal Violet'],['sakura','Sakura'],['contrast','High Contrast'],['paper','Paper / Sepia']];return '<h2>'+esc(T('settings_updates'))+'</h2>'+v280ServerSettingsHTML()+cfgField('language',T('language'),'select','',LANGS)+cfgField('theme',T('theme'),'select','',themeOptions)+cfgField('showSettingHelp',C.language==='de'?'Hilfetexte unter Einstellungen anzeigen':'Show setting help text','check')+cfgField('uiTransparencyPct',C.language==='de'?'GUI-Transparenz':'GUI transparency','range')+cfgField('fastTravelEnabled',C.language==='de'?'Schnellreise automatisch nutzen':'Use fast travel automatically','check')+'<div class="notice"><b>'+(C.language==='de'?'Update-Schutz:':'Update protection:')+'</b> '+(C.language==='de'?'Vor jedem Update werden Konfiguration und Fensterzustand gesichert. Ein Feature-Contract blockiert zukünftige Updates, die bekannte Kernfunktionen stillschweigend entfernen.':'Configuration and window state are backed up before every update. A feature contract blocks future updates that silently remove known core features.')+'</div>'+'<div class="card"><div class="line"><span>Bot repository</span><strong>'+esc(defaults.updateRepositoryUrl)+'</strong></div></div>'+cfgField('auditEnabled','Detailed audit log','check')+cfgField('diagnosticMode','Gezielter Diagnosemodus','check')+cfgField('diagnosticSeconds','Diagnose-Snapshot alle (Sek.)','number')+cfgField('logSegmentHours','Log segment hours','number')+cfgField('logRetentionDays','Log retention days','number')+'<div class="buttons"><button class="btn primary" data-action="update-check">Check for update</button></div><div class="card"><div class="line"><span>'+esc(T('current_version'))+'</span><strong>'+VERSION+'</strong></div><div class="line"><span>Feature-Contract</span><strong class="good">'+FEATURE_CONTRACT.length+' geschützt</strong></div><div class="line"><span>Fast-Travel erkannt</span><strong>'+esc(v282TravelCapabilities().join(', ')||'—')+'</strong></div></div>';};

  toolHTML=function(key){return key==='character'?characterHTML():key==='inventory'?inventoryHTML():key==='party'?partyHTML():key==='farm'?farmHTML():key==='bestiary'?bestiaryHTML():key==='skills'?skillsHTML():key==='merchant'?merchantHTML():key==='stand'?standHTML():key==='meters'?metersHTML():key==='dashboard'?dashboardHTML():key==='logs'?logsHTML():settingsHTML();};

  var v282UiClickBase=uiClick;
  uiClick=function(e){
    var t=e.target.closest('button');
    if(t&&t.dataset.open){var tk=t.dataset.open;if(tk!=='headless'&&S.toolWindows[tk]){closeTool(tk);renderMain();return;}openTool(tk);renderMain();return;}
    if(t&&t.dataset.invRule){var name=t.dataset.name,rule=t.dataset.invRule;if(rule==='allow'){v282CsvSet('standAllowedItems',name,true);v282CsvSet('standBlockedItems',name,false);}else if(rule==='block'){v282CsvSet('standBlockedItems',name,true);v282CsvSet('standAllowedItems',name,false);}else if(rule==='clear'){v282CsvSet('standAllowedItems',name,false);v282CsvSet('standBlockedItems',name,false);}else if(rule==='protect')v282CsvSet('inventoryProtectedItems',name,true);else if(rule==='unprotect')v282CsvSet('inventoryProtectedItems',name,false);if(S.inventoryContext){S.inventoryContext.remove();S.inventoryContext=null;}renderTool('inventory');return;}
    if(t&&t.dataset.whatsOpen){var key=t.dataset.whatsOpen,ov=t.closest('.overlay');if(ov)ov.remove();write('whatsNewSeen:'+VERSION,true);openTool(key);return;}
    if(t&&t.dataset.action==='modal-close'&&t.closest('[data-whats-new]')){write('whatsNewSeen:'+VERSION,true);}
    if(t&&t.dataset.action==='stand-set-location'){C.standLocation={map:character.map,x:Math.round(character.x||0),y:Math.round(character.y||0)};saveConfig();audit('stand_location','Fester Merchant-Standplatz gesetzt',C.standLocation);renderTool('stand');return;}
    if(t&&t.dataset.action==='stand-clear-location'){C.standLocation=null;saveConfig();audit('stand_location','Fester Merchant-Standplatz gelöscht');renderTool('stand');return;}
    return v282UiClickBase(e);
  };
  var v282UiChangeBase=uiChange;
  uiChange=function(e){var el=e.target;if(el&&el.dataset&&el.dataset.skillFilter!==undefined){S.skillFilter=el.value==='all'?'all':'usable';write('skillFilter:'+me,S.skillFilter);audit('ui_filter','Skillfilter geändert',{value:S.skillFilter});renderTool('skills');return;}var cfg=el&&el.dataset&&el.dataset.cfg;var r=v282UiChangeBase(e);if(cfg==='showSettingHelp'||cfg==='fastTravelEnabled'){P.setTimeout(function(){renderTool('settings');},0);}return r;};
  var v282UiInputBase=uiInput;
  uiInput=function(e){
    var el=e.target;if(el&&el.dataset&&el.dataset.bestSearch!==undefined){var caret=el.selectionStart==null?String(el.value).length:el.selectionStart;S.bestiarySearch=el.value;clearTimeout(S.bestSearchTimer);S.bestSearchTimer=P.setTimeout(function(){renderTool('bestiary');var w=S.toolWindows.bestiary,inp=w&&w.el.querySelector('[data-best-search]');if(inp){inp.focus();try{inp.setSelectionRange(caret,caret);}catch(x){}}},120);return;}
    if(el&&el.dataset&&el.dataset.cfg&&el.type==='range'){C[el.dataset.cfg]=Number(el.value);C=cleanConfig(C);write('config',C);applyAppearance();var rv=el.parentNode&&el.parentNode.querySelector('.rangevalue');if(rv)rv.textContent=C[el.dataset.cfg]+'%';return;}
    return v282UiInputBase(e);
  };

  var v282InitUIBase=initUI;
  function v282ShowWhatsNew(){
    if(HEADLESS||!uiRoot||read('whatsNewSeen:'+VERSION,false))return;var el=D.createElement('div');el.className='overlay';el.dataset.whatsNew=VERSION;el.innerHTML='<div class="modal"><div class="modaltop"><h2>Was ist neu in Version '+VERSION+'?</h2><button class="close" data-action="modal-close">×</button></div><div class="card"><b>Brain v2 · sichtbar lebendig</b><p class="muted">Qwen lehrt ein lokales neuronales Netz. Ein neuronaler Puls zeigt sichtbar, ob das Brain beobachtet, denkt, lernt, bewertet oder einen Challenger prüft.</p><button class="btn primary" data-whats-open="brain">Gehirn öffnen</button></div><div class="card"><b>10.000-Neuron-Budget</b><p class="muted">Harte Obergrenze 10.000; der adaptive Pacer zielt standardmäßig auf 9.950 Neurons pro UTC-Tag und bevorzugt neue oder unsichere Situationen.</p><button class="btn primary" data-whats-open="brain">Budget ansehen</button></div><div class="card"><b>Champion ↔ Challenger + Auto-Rollback</b><p class="muted">Ein eingefrorener Champion steuert bekannte Situationen. Neue Challenger werden nur mit begrenztem Canary-Traffic getestet und bei schlechterem Reward oder Sicherheitsvorfällen automatisch verworfen bzw. zurückgerollt.</p><button class="btn primary" data-whats-open="brain">Brain League ansehen</button></div><div class="card"><b>Lernqualität & Selbstzweifel</b><p class="muted">Das Brain prüft jetzt, ob steigende Confidence wirklich zu besseren Rewards führt. Bei Overconfidence, Drift oder instabilen Lernphasen reduziert es die Lernrate, fragt den Teacher häufiger, stoppt Canary-Tests und kann Autonomie quarantänisieren.</p><button class="btn primary" data-whats-open="brain">Lernqualität ansehen</button></div><div class="card"><b>Web-Dashboard Gehirn</b><p class="muted">Teacher-Verbrauch, Confidence, Entropie, Novelty, Loss, Reward, Übereinstimmung und Outcomes werden über D1 sichtbar.</p><button class="btn primary" data-whats-open="dashboard">Dashboard öffnen</button></div><div class="card"><b>Gehirn-Tagebuch</b><p class="muted">Das Brain schreibt aus echten Teacher-Lektionen, Outcomes, Champion/Challenger-Ereignissen und Tageswechseln ein überprüfbares Lerntagebuch – ohne zusätzliche KI-Aufrufe.</p><button class="btn primary" data-whats-open="brain">Tagebuch ansehen</button></div><div class="card"><b>AiO Research Bridge</b><p class="muted">Verdichtet Lern-, Reward-, Fehler-, Farm- und Merchant-Erfahrung in sichere ChatGPT-Analysebriefe mit optional anonymisierten Namen und strukturiertem JSON – ohne zusätzliche Workers-AI-Neurons.</p><button class="btn primary" data-whats-open="brain">Research Bridge ansehen</button></div></div>';uiRoot.appendChild(el);
  }
  initUI=function(){v282InitUIBase();if(!uiRoot)return;uiRoot.addEventListener('contextmenu',function(e){var it=e.target.closest('[data-inv-slot]');if(!it)return;e.preventDefault();v282ShowInventoryContext(Number(it.dataset.invSlot),e.clientX,e.clientY);});applyAppearance();P.setTimeout(v282ShowWhatsNew,400);};

  CSS+=' .mainbox,.tool,.modal{opacity:var(--ui-opacity,1)}.invgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:7px}.invitem{display:grid;grid-template-columns:52px 1fr;gap:8px;align-items:center;border:1px solid var(--border);background:var(--card);border-radius:9px;padding:7px;cursor:context-menu}.invitem:hover,.skillhover:hover{border-color:var(--accent);box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 30%,transparent)}.invtext{min-width:0}.invmenu{position:fixed;z-index:100500;width:240px;background:var(--bg);border:1px solid var(--accent);border-radius:10px;box-shadow:0 16px 50px var(--shadow);padding:8px;color:var(--text);opacity:var(--ui-opacity,1)}.invmenu b{display:block;padding:5px 7px}.invmenu button{display:block;width:100%;text-align:left;border:0;border-top:1px solid var(--border);background:transparent;color:var(--text);padding:8px;cursor:pointer}.invmenu button:hover{background:var(--card);color:var(--accent)}.setting input[type=range]{width:190px;accent-color:var(--accent)}.rangevalue{min-width:36px;text-align:right;font-size:10px}.skillhover{position:relative}.skillhover[title]{cursor:help} ';

  // Protected item rule also applies to automatic trash/loot handling.
  var v282ProtectedStandBase=protectedStandItem;
  protectedStandItem=function(i){return !!(i&&(csv(C.inventoryProtectedItems).indexOf(i.name)>=0||v282ProtectedStandBase(i)));};

  // Richer, lower-noise audit metadata.
  var v282AuditBase=audit;
  audit=function(kind,message,data,level){
    var d=data&&typeof data==='object'&&!Array.isArray(data)?Object.assign({},data):(data==null?{}:{value:compactData(data)});
    d.taskReason=safeString(v282TaskReason(),400);d.seq=++S.auditSeq;d.status=safeString(S.status,220);d.mode=safeString(S.mode,120);
    if(kind==='action_error'&&d.error)d.errorClass=v282ActionClass(d.error);
    var ev=v282AuditBase(kind,message,d,level);if(S.auditSeq%100===0)write('auditSeq:'+me,S.auditSeq);return ev;
  };

  // Correct the legacy attack/action classification without hiding the event.
  var v282ActionBase=action;
  action=function(name,fn,cooldownKey,cooldownMs){
    var key=cooldownKey||name,now=clock();if(now<(S.times[key]||0))return false;S.times[key]=now+(cooldownMs||250);S.lastAction=name;S.lastActionAt=now;var started=now,actionId=me+'-'+now+'-'+Math.floor(Math.random()*100000);audit('action_start',name,{actionId:actionId,before:{map:character.map,x:Math.round(character.x||0),y:Math.round(character.y||0),hp:character.hp,mp:character.mp,target:S.target}});
    try{var result=fn();if(result&&typeof result.then==='function')result.then(function(v){audit('action_ok',name,{actionId:actionId,durationMs:clock()-started,result:compactData(v),after:{map:character.map,x:Math.round(character.x||0),y:Math.round(character.y||0),hp:character.hp,mp:character.mp}});},function(e){var er=reason(e);audit('action_error',name,{actionId:actionId,durationMs:clock()-started,error:er,errorClass:v282ActionClass(er),after:{map:character.map,x:Math.round(character.x||0),y:Math.round(character.y||0),target:S.target}},v282ActionLevel(er));});else audit('action_ok',name,{actionId:actionId,durationMs:clock()-started,sync:true});return true;}catch(e){var er2=reason(e);audit('action_error',name,{actionId:actionId,durationMs:clock()-started,error:er2,errorClass:v282ActionClass(er2)},v282ActionLevel(er2));return false;}
  };

  // ---------------------------------------------------------------------------
  // 2.9.x AiO Brain Alpha · cloud state · 24/7 safety · autonomous learning
  // ---------------------------------------------------------------------------
  S.brain=S.brain||{usedToday:0,limit:C.brainDailyNeuronLimit,lastAt:0,lastDecision:null,lastError:'',requests:0,blocked:0};
  S.cloudSync=S.cloudSync||{lastOK:0,lastError:'',pullAt:0,pushAt:0};
  S.actionFailures=S.actionFailures||{};
  S.explorer=S.explorer||{index:0,visited:{},lastSampleAt:0};

  function v290Endpoint(path){try{var u=new URL(String(C.webDashboardConnectionUrl||'').trim());if(u.protocol!=='https:')return '';u.search='';u.hash='';u.pathname=u.pathname.replace(/\/$/,'')+path;return u.toString();}catch(e){return '';}}
  function v290Fetch(path,body){var ep=v290Endpoint(path),f=typeof P.fetch==='function'?P.fetch.bind(P):((typeof fetch==='function')?fetch:null);if(!ep||!f||!C.webDashboardWriteKey)return Promise.reject(Error('Cloudflare-Verbindung/Schreibschlüssel fehlt'));body=Object.assign({writeKey:C.webDashboardWriteKey,account:ACCOUNT,character:me,botVersion:VERSION},body||{});return Promise.resolve(f(ep,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(body)})).then(function(r){if(!r||!r.ok)return Promise.resolve(r&&r.json?r.json():{}).then(function(j){throw Error(j&&j.error||('HTTP '+(r&&r.status)));});return r.json();});}
  function v290CompactLearning(){var d=v280LearningDB();return {schema:d.schema||1,monsters:d.monsters||{},zones:d.zones||{},updatedAt:d.updatedAt||0};}
  function v290CloudConfig(){var x=Object.assign({},C);delete x.webDashboardWriteKey;return x;}
  function v290CloudSyncTick(force){if(!C.cloudSyncEnabled||S.cloudSyncBusy)return false;var now=clock(),gap=C.cloudSyncSeconds*1000;if(!force&&now-Math.max(S.cloudSync.pullAt||0,S.cloudSync.pushAt||0)<gap)return false;S.cloudSyncBusy=true;var initialized=!!read('cloudSyncInitialized',false),pushConfig=initialized&&(character.ctype==='merchant'||!!S.cloudConfigDirty),payload={op:'sync',config:pushConfig?v290CloudConfig():null,learning:v290CompactLearning(),observations:{explorer:{index:S.explorer.index||0,visited:S.explorer.visited||{},recent:(S.explorer.recentSamples||[]).slice(-20)}},configHash:pushConfig?v282ConfigHash(v290CloudConfig()):'',clientAt:now};S.cloudSync.pushAt=now;v290Fetch('/api/state',payload).then(function(j){if(j&&j.config&&j.configHash&&j.configHash!==v282ConfigHash(v290CloudConfig())&&Number(j.updatedAt||0)>Number(read('cloudConfigAt',0)||0)){var keepKey=C.webDashboardWriteKey;C=cleanConfig(Object.assign({},C,j.config));C.webDashboardWriteKey=keepKey;write('config',C);write('cloudConfigAt',Number(j.updatedAt)||clock());applyAppearance();audit('cloud_config_pull','Cloud-Einstellungen übernommen',{updatedAt:j.updatedAt,hash:j.configHash});}if(j&&j.learning&&j.learning.updatedAt>Number((v280LearningDB()||{}).updatedAt||0)){write('learningDB',j.learning);S.knowledgeDB=null;audit('cloud_learning_pull','Lernstand aus Cloud übernommen',{updatedAt:j.learning.updatedAt});}if(j&&j.observations&&j.observations.explorer){var ex=j.observations.explorer;S.explorer.index=Math.max(Number(S.explorer.index)||0,Number(ex.index)||0);S.explorer.visited=Object.assign({},ex.visited||{},S.explorer.visited||{});}if(pushConfig)S.cloudConfigDirty=false;if(!initialized){write('cloudSyncInitialized',true);S.cloudSync.pushAt=0;}S.cloudSync.lastOK=clock();S.cloudSync.lastError='';S.cloudSync.pullAt=clock();}).catch(function(e){S.cloudSync.lastError=reason(e);audit('cloud_sync_error','Cloud-Sync fehlgeschlagen',{error:S.cloudSync.lastError},'warning');}).finally(function(){S.cloudSyncBusy=false;});return true;}

  function v290BrainInterval(){var w=clamp(C.brainWorkPct,0,100);if(w<=0)return Infinity;return Math.round(1200000-(w/100)*1110000);}
  function v290BrainState(trigger){var rate=v273RateStats(),ps=partyState(),errs=S.auditRecent.slice(-80).filter(function(e){return e&&e.kind==='action_error';}).slice(-8).map(function(e){return {message:e.message,error:e.data&&e.data.error,errorClass:e.data&&e.data.errorClass};});return {trigger:trigger||'periodic',character:{name:me,ctype:character.ctype,level:character.level,map:character.map,x:Math.round(character.x||0),y:Math.round(character.y||0),gold:character.gold,free:freeSlots()},party:{members:ps.members,missing:ps.missing,complete:ps.complete},rates:{xpPerHour:rate.xpPerHour,goldPerHour:rate.goldPerHour},farm:S.farmHealth||null,merchantPlan:S.merchantPlan||null,inventory:(character.items||[]).filter(Boolean).map(function(i){return {name:i.name,level:Number(i.level)||0,q:Number(i.q)||1};}).slice(0,42),recentErrors:errs,observations:(S.explorer.recentSamples||[]).slice(-6),learning:(function(){var ld=v290CompactLearning(),zs=Object.keys(ld.zones||{}).map(function(k){return {key:k,data:ld.zones[k]};}).sort(function(a,b){return Number(b.data.samples||0)-Number(a.data.samples||0);}).slice(0,12),ms=Object.keys(ld.monsters||{}).map(function(k){return {id:k,kills:Number(ld.monsters[k].kills)||0,lootEvents:Number(ld.monsters[k].lootEvents)||0};}).sort(function(a,b){return b.kills-a.kills;}).slice(0,12);return {zones:zs,monsters:ms,updatedAt:ld.updatedAt};})(),allowedActions:['continue','change_farm_target','replan_merchant','explore','wait']};}
  function v290ApplyBrainDecision(d){if(!d||typeof d!=='object')return false;var allowed=['continue','change_farm_target','replan_merchant','explore','wait'];if(allowed.indexOf(d.action)<0)return false;var conf=clamp(Number(d.confidence)*100,0,100),threshold=Math.max(Number(C.brainMinConfidencePct)||70,90-(Number(C.brainPriorityPct)||0)*.35);S.brain.lastDecision=d;if(conf<threshold||Number(C.brainPriorityPct)<=0){audit('brain_advice','Brain-Empfehlung nur protokolliert',{decision:d,threshold:threshold});return false;}if(d.action==='change_farm_target'&&d.target&&GD.monsters&&GD.monsters[d.target]){C.monster=d.target;C.farmMode='manual';saveConfig();S.goal=null;S.lastGoalCheck=0;audit('brain_apply','Brain setzt Farmziel',{target:d.target,confidence:conf,reason:d.reason});return true;}if(d.action==='replan_merchant'&&character.ctype==='merchant'){S.times.merchantPlan=0;audit('brain_apply','Brain fordert Merchant-Neuplanung',{confidence:conf,reason:d.reason});return true;}if(d.action==='explore'&&character.ctype==='merchant'){S.explorer.force=true;audit('brain_apply','Brain priorisiert Erkundung',{confidence:conf,reason:d.reason});return true;}if(d.action==='wait'){S.times.brainWait=clock()+Math.min(300000,Math.max(5000,Number(d.recheckSeconds||30)*1000));return true;}return false;}
  function v290BrainTick(trigger,force){if(character.ctype!=='merchant'||!C.brainEnabled||C.brainWorkPct<=0||S.brainBusy||clock()<(S.times.brainWait||0))return false;var now=clock(),interval=v290BrainInterval();if(!force&&now-(S.brain.lastAt||0)<interval)return false;S.brainBusy=true;S.brain.lastAt=now;var req={dailyLimit:Math.min(10000,Number(C.brainDailyNeuronLimit)||10000),workPct:Number(C.brainWorkPct)||0,priorityPct:Number(C.brainPriorityPct)||0,minConfidencePct:Number(C.brainMinConfidencePct)||70,model:C.brainModel,state:v290BrainState(trigger)};v290Fetch('/api/brain',req).then(function(j){S.brain.usedToday=Number(j.usedToday)||0;S.brain.limit=Number(j.limit)||req.dailyLimit;if(j.blocked){S.brain.blocked++;S.brain.lastError=j.error||'Budget erreicht';audit('brain_budget','Brain-Aufruf blockiert',{used:S.brain.usedToday,limit:S.brain.limit,reason:j.error},'warning');return;}S.brain.requests++;S.brain.lastError='';if(j.decision)v290ApplyBrainDecision(j.decision);audit('brain_decision','AiO Brain Entscheidung',{used:S.brain.usedToday,limit:S.brain.limit,neurons:j.neurons,decision:j.decision});}).catch(function(e){S.brain.lastError=reason(e);audit('brain_error','AiO Brain nicht verfügbar; lokale Logik läuft weiter',{error:S.brain.lastError},'warning');}).finally(function(){S.brainBusy=false;});return true;}
  function v290BrainHTML(){var b=S.brain||{},pct=b.limit?Math.min(100,100*(Number(b.usedToday)||0)/b.limit):0;return '<h2>🧠 '+(C.language==='de'?'Gehirn-Steuerung':'Brain Control')+'</h2><div class="notice"><b>Lokale Reflexe bleiben immer aktiv.</b> Das Brain übernimmt nur strategische Arbeit. Die harte Tagesgrenze verhindert weitere KI-Aufrufe vor Überschreitung.</div>'+cfgField('brainEnabled','AiO Brain aktiv','check')+cfgField('brainDailyNeuronLimit','Tageslimit Neurons','number','Maximal 10.000; Brain v2 plant standardmäßig bis 99,5 % davon als Sicherheitsziel.')+cfgField('brainWorkPct','Arbeit fürs Gehirn (%)','number','0 = nur lokale Logik; 100 = häufige strategische Prüfungen.')+cfgField('brainPriorityPct','Brain-Priorität (%)','number','0 = nur Beratung; 100 = Empfehlungen werden bei ausreichender Sicherheit stärker bevorzugt.')+cfgField('brainMinConfidencePct','Mindest-Vertrauen (%)','number')+cfgField('brainModel','Workers-AI-Modell','select','Brain v2 nutzt bewusst ein fest kalkuliertes Teacher-Modell, damit das Neuron-Budget zuverlässig bleibt.',[['@cf/qwen/qwen3-30b-a3b-fp8','Qwen3 30B A3B FP8 (budgetiert)']])+cfgField('cloudSyncEnabled','Settings & Lernstand extern synchronisieren','check')+cfgField('cloudSyncSeconds','Cloud-Sync alle (Sek.)','number')+'<div class="card"><div class="line"><span>Heute verbraucht</span><strong>'+Math.round(Number(b.usedToday)||0)+' / '+Math.round(Number(C.brainDailyNeuronLimit)||10000)+'</strong></div><div class="bar"><i style="width:'+pct+'%"></i></div><div class="line"><span>Anfragen</span><strong>'+Number(b.requests||0)+'</strong></div><div class="line"><span>Letzte Entscheidung</span><strong>'+esc(b.lastDecision?String(b.lastDecision.action||'—'):'—')+'</strong></div>'+(b.lastError?'<div class="notice warn">'+esc(b.lastError)+'</div>':'')+'</div><div class="card"><b>Steuerprinzip</b><div class="muted">Arbeit bestimmt die Aufruffrequenz. Priorität bestimmt, ob valide Brain-Empfehlungen die lokale Strategie beeinflussen. Kampf, Heilung, Kiten und Sicherheitsreflexe bleiben deterministisch.</div></div>';}

  function v290FarmerUpgradeTick(){if(character.ctype==='merchant'||typeof equip!=='function'||clock()<(S.times.farmerGearCheck||0))return false;S.times.farmerGearCheck=clock()+C.farmerUpgradeCheckSeconds*1000;var best=null;(character.items||[]).forEach(function(it,i){if(!it||it.l||it.p||!v273ClassCanUse(it.name,character.ctype))return;var slots=v273EquipSlotsForItem(it.name);if(!slots.length)return;var cand=v273ItemScoreForClass(it,character.ctype),chosen=null,cur=Infinity;slots.forEach(function(sl){var eq=character.slots&&character.slots[sl],score=eq?v273ItemScoreForClass(eq,character.ctype):-1e12;if(score<cur){cur=score;chosen=sl;}});if(chosen&&(cur<-1e11||cand>cur+Math.max(12,Math.abs(cur)*.025))){var x={index:i,item:it,slot:chosen,candidate:cand,current:cur};if(!best||x.candidate-x.current>best.candidate-best.current)best=x;}});if(!best)return false;S.status='Besseres Inventar-Item anlegen: '+v273Name(best.item.name);S.mode='Ausrüstung';return action('Farmer-Upgrade anlegen '+best.item.name,function(){return equip(best.index,best.slot);},'farmer-auto-equip',2200);}

  function v290InventoryPressureTick(){
    if(character.ctype!=='merchant'||freeSlots()>Math.max(1,C.merchantInventoryReserve))return false;
    if(S.inventoryPressureBusy){S.status='Inventarbereinigung läuft · Re-Entry blockiert';S.mode='Merchant · Inventar';return true;}
    S.inventoryPressureBusy=true;
    try{
      if(v273StoreTrashBankTick())return true;
      if(S.bankFull&&v273SellTrashTick())return true;
      var hasCombineScroll=['cscroll0','cscroll1','cscroll2','cscroll3','cscroll4'].some(function(n){return slot(n)>=0;});
      if((freeSlots()>0||hasCombineScroll)&&v273CompoundTick())return true;
      S.status='Inventar voll · sichere Bereinigung nötig';S.mode='Merchant · Inventar';
      if(clock()>(S.times.inventoryPressureWarn||0)){S.times.inventoryPressureWarn=clock()+15000;audit('inventory_pressure_blocked','Merchant-Inventar unter Reserve · rekursiver Scroll/Compound-Pfad blockiert',{free:freeSlots(),reserve:Number(C.merchantInventoryReserve)||0,hasCombineScroll:hasCombineScroll},'warning');}
      return true;
    }finally{S.inventoryPressureBusy=false;}
  }
  var v290EnsureScrollBase=v273EnsureScroll;
  v273EnsureScroll=function(prefix,item){var name=v273ScrollName(prefix,item),idx=slot(name);if(idx>=0)return idx;if(freeSlots()<1){S.times['buy-scroll:'+name]=clock()+15000;S.status='Kein Platz für Scroll · Inventar zuerst bereinigen';S.mode='Merchant · Inventar';return -1;}if(!(typeof buy==='function'&&GD.items&&GD.items[name]))return -1;var price=Number(GD.items[name].g||0);if(character.gold-price<=C.merchantBankGoldReserve)return -1;var dest=v282VendorForScroll(name);if(dest&&(character.map!==dest.map||dist(character,dest)>180)){S.status='Zum Scroll-Händler für '+name;S.mode='Merchant · Einkauf';moveToGoal(dest,'Scroll-Händler '+name,{kind:'merchant-scroll-vendor',forceAfter:9000});return -1;}action('Scroll kaufen '+name,function(){return buy(name,1);},'buy-scroll:'+name,1800);return -1;
  };

  function v290ExplorerPoints(){var out=[];try{Object.keys(GD.maps||{}).forEach(function(map){var m=GD.maps[map]||{};(m.monsters||[]).forEach(function(sp){var b=sp&&sp.boundary;if(Array.isArray(b)&&b.length>=4)out.push({map:map,x:(Number(b[0])+Number(b[2]))/2,y:(Number(b[1])+Number(b[3]))/2,kind:'spawn',id:sp.type||''});});});}catch(e){}SPAWNS.forEach(function(sp){out.push({map:sp.map,x:sp.x,y:sp.y,kind:'spawn',id:sp.monster});});var seen={};return out.filter(function(x){var k=x.map+'|'+Math.round(x.x/100)+'|'+Math.round(x.y/100);if(seen[k])return false;seen[k]=1;return isFinite(x.x)&&isFinite(x.y);}).slice(0,220);}
  function v290ExploreTick(){if(character.ctype!=='merchant'||!C.merchantExploreWhenIdle)return false;var points=v290ExplorerPoints();if(!points.length)return false;var now=clock(),cur=points[S.explorer.index%points.length];if(character.map===cur.map&&dist(character,cur)<180){var key=cur.map+'|'+Math.round(cur.x)+'|'+Math.round(cur.y);S.explorer.visited[key]=(S.explorer.visited[key]||0)+1;var sample={at:now,map:character.map,x:Math.round(character.x||0),y:Math.round(character.y||0),entities:entities().slice(0,80).map(function(e){return {type:e.type,mtype:e.mtype,name:e.name,x:Math.round(e.x||0),y:Math.round(e.y||0)};}),point:cur};write('exploreSample:'+key,sample);S.explorer.recentSamples=(S.explorer.recentSamples||[]).concat([sample]).slice(-20);S.explorer.index=(S.explorer.index+1)%points.length;S.explorer.lastSampleAt=now;v290CloudSyncTick(true);v290BrainTick('exploration_sample',false);cur=points[S.explorer.index%points.length];}S.status='Erkunde Spielwelt · sammle Lern-Daten';S.mode='Merchant · Explorer';return moveToGoal(cur,'Autonome Datenerkundung',{kind:'explore',tolerance:140,forceAfter:15000});}

  // wrap action errors with a circuit breaker for unattended 24/7 use
  var v290ActionBase=action;
  action=function(name,fn,cooldownKey,cooldownMs){var key=cooldownKey||name,fail=S.actionFailures[key],now=clock();if(fail&&now<Number(fail.until||0))return false;return v290ActionBase(name,function(){var r=fn();if(r&&typeof r.then==='function')return Promise.resolve(r).then(function(v){S.actionFailures[key]=null;return v;},function(e){var er=reason(e),x=S.actionFailures[key]||{count:0};x.count++;x.error=er;x.at=clock();x.until=clock()+Math.min(120000,Math.max(3000,Math.pow(2,Math.min(x.count,6))*1000));S.actionFailures[key]=x;if(/buy_cant_space|inventory_full/i.test(er)){x.until=clock()+30000;S.times.inventoryPressure=0;}throw e;});return r;},cooldownKey,cooldownMs);};

  var v290FarmerBase=farmerTick;
  farmerTick=function(){if(v290FarmerUpgradeTick())return;return v290FarmerBase();};
  var v290MerchantBase=merchantTick;
  merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;var before=S.lastActionAt||0,r=v290MerchantBase();if(r)return r;if((S.lastActionAt||0)!==before)return;v290BrainTick('merchant_idle',false);if(v290ExploreTick())return;};

  var v290SaveConfigBase=saveConfig;
  saveConfig=function(){var r=v290SaveConfigBase();write('cloudConfigAt',clock());write('cloudSyncInitialized',true);S.cloudConfigDirty=true;S.cloudSync.pushAt=0;v290CloudSyncTick(true);return r;};
  CSS+=' .launch.open{border-color:var(--accent)!important;background:color-mix(in srgb,var(--accent) 18%,var(--card))!important;box-shadow:inset 3px 0 0 var(--accent)} ';
  audit('feature_contract','2.13.0 Basisfunktionen geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C),travelCapabilities:v282TravelCapabilities()});


  // ---------------------------------------------------------------------------
  // 2.13.0 Brain v2 · self-training Teacher/Student neural network
  // ---------------------------------------------------------------------------
  var V210_ACTIONS=['continue','change_farm_target','replan_merchant','explore','wait'];
  var V210_INPUTS=32,V210_HIDDEN=24,V210_OUTPUTS=V210_ACTIONS.length;
  function v210Round(n,p){var m=Math.pow(10,p==null?5:p);return Math.round((Number(n)||0)*m)/m;}
  function v210Hash(text){var h=2166136261,s=String(text||'');for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function v210NormLog(n,max){n=Math.max(0,Number(n)||0);return clamp(Math.log1p(n)/Math.log1p(Math.max(1,max)),0,1);}
  function v210Softmax(logits){var mx=Math.max.apply(Math,logits),ex=logits.map(function(v){return Math.exp(clamp(v-mx,-40,40));}),sum=ex.reduce(function(a,b){return a+b;},0)||1;return ex.map(function(v){return v/sum;});}
  function v210NormalizeTarget(a){var x=(a||[]).slice(0,V210_OUTPUTS).map(function(v){return Math.max(0,Number(v)||0);});while(x.length<V210_OUTPUTS)x.push(0);var z=x.reduce(function(p,q){return p+q;},0);if(!z){x[0]=1;z=1;}return x.map(function(v){return v/z;});}
  function v210NewStudent(){
    function rnd(scale){return (Math.random()*2-1)*scale;}
    var m={schema:2,inputSize:V210_INPUTS,hiddenSize:V210_HIDDEN,outputSize:V210_OUTPUTS,w1:[],b1:[],w2:[],b2:[],samples:0,updates:0,lossEma:0,rewardEma:0,agreementEma:0,outcomes:0,lastTrainAt:0,lastTeacherAt:0,updatedAt:clock()};
    var a=Math.sqrt(6/(V210_INPUTS+V210_HIDDEN)),b=Math.sqrt(6/(V210_HIDDEN+V210_OUTPUTS));
    for(var i=0;i<V210_HIDDEN*V210_INPUTS;i++)m.w1.push(rnd(a));for(i=0;i<V210_HIDDEN;i++)m.b1.push(0);for(i=0;i<V210_OUTPUTS*V210_HIDDEN;i++)m.w2.push(rnd(b));for(i=0;i<V210_OUTPUTS;i++)m.b2.push(0);return m;
  }
  function v210StudentValid(m){return !!(m&&m.schema===2&&m.inputSize===V210_INPUTS&&m.hiddenSize===V210_HIDDEN&&m.outputSize===V210_OUTPUTS&&Array.isArray(m.w1)&&m.w1.length===V210_HIDDEN*V210_INPUTS&&Array.isArray(m.b1)&&m.b1.length===V210_HIDDEN&&Array.isArray(m.w2)&&m.w2.length===V210_OUTPUTS*V210_HIDDEN&&Array.isArray(m.b2)&&m.b2.length===V210_OUTPUTS&&m.w1.every(isFinite)&&m.b1.every(isFinite)&&m.w2.every(isFinite)&&m.b2.every(isFinite));}
  function v210StudentLoad(){var m=read('brainStudentV210',null);return v210StudentValid(m)?m:v210NewStudent();}
  S.brainStudent=v210StudentLoad();
  S.brainReplay=read('brainReplayV210',[]);if(!Array.isArray(S.brainReplay))S.brainReplay=[];S.brainReplay=S.brainReplay.slice(-C.brainReplaySize);
  S.brainPending=read('brainPendingV210',[]);if(!Array.isArray(S.brainPending))S.brainPending=[];S.brainPending=S.brainPending.filter(function(x){return x&&Number(x.dueAt)>clock()-3600000;}).slice(-8);
  S.brain.avgNeurons=Number(S.brain.avgNeurons)||16;S.brain.studentDecision=null;S.brain.studentConfidence=0;S.brain.studentEntropy=1;S.brain.novelty=1;S.brain.lastStudentAt=0;S.brain.lastTrainAt=0;S.brain.outcomes=Math.max(Number(S.brain.outcomes)||0,Number(S.brainStudent.outcomes)||0);S.brain.day=String(S.brain.day||new Date().toISOString().slice(0,10));

  function v210Features(){
    var rate=v273RateStats(),ps=partyState(),farm=S.farmHealth||v280FarmHealth&&v280FarmHealth()||{},gs=v280GroupStrengthSnapshot&&v280GroupStrengthSnapshot()||{},items=(character.items||[]).filter(Boolean),now=clock(),errs=S.auditRecent.slice(-250).filter(function(e){return e&&e.kind==='action_error'&&now-Number(e.at||0)<300000;}).length,activeFails=Object.keys(S.actionFailures||{}).filter(function(k){var x=S.actionFailures[k];return x&&Number(x.until||0)>now;}).length,ld=v290CompactLearning(),goal=S.goal||farm.goal||{},zk=String(character.map||'')+'|'+String(goal.monster||C.monster||''),zone=ld.zones&&ld.zones[zk]||{},mon=ld.monsters&&ld.monsters[goal.monster||C.monster]||{},mapH=(v210Hash(character.map)%100000)/100000,monH=(v210Hash(goal.monster||C.monster)%100000)/100000,utc=(new Date(now).getUTCHours()*3600+new Date(now).getUTCMinutes()*60+new Date(now).getUTCSeconds())/86400,upgraded=items.filter(function(i){return Number(i.level)>0;}).length,slots=Math.max(1,(character.items||[]).length||42),expected=Number(farm.expectedXpPerHour)||0,xp=Number(rate.xpPerHour)||0;
    return [ratio(character,'hp'),ratio(character,'mp'),freeSlots()/slots,v210NormLog(character.gold,100000000),ps.complete?1:0,clamp((ps.missing||[]).length/4,0,1),v210NormLog(xp,100000000),v210NormLog(rate.goldPerHour,10000000),clamp(Number(farm.visible||0)/20,0,1),clamp(Number(farm.competitors||0)/10,0,1),clamp(Number(farm.safetyPct==null?50:farm.safetyPct)/100,0,1),expected?clamp(xp/Math.max(1,expected),0,2)/2:.5,clamp(Number(gs.members||0)/4,0,1),v210NormLog(gs.totalDps,1000000),v210NormLog(gs.avgHp,100000),v210NormLog(gs.avgArmor,10000),v210NormLog(gs.avgResistance,10000),clamp(Number(gs.avgLevel||character.level||0)/100,0,1),v210NormLog(gs.score,10000000),clamp(items.length/slots,0,1),clamp(upgraded/20,0,1),clamp(errs/8,0,1),clamp(activeFails/8,0,1),S.explorer.lastSampleAt?clamp(Math.exp(-(now-S.explorer.lastSampleAt)/1800000),0,1):0,v210NormLog(zone.samples,10000),v210NormLog(mon.kills,100000),Math.sin(mapH*Math.PI*2),Math.cos(mapH*Math.PI*2),Math.sin(monH*Math.PI*2),Math.cos(monH*Math.PI*2),Math.sin(utc*Math.PI*2),Math.cos(utc*Math.PI*2)].map(function(v){return isFinite(v)?Number(v):0;});
  }
  function v210Forward(x){var m=S.brainStudent,h=new Array(V210_HIDDEN),logits=new Array(V210_OUTPUTS),i,j,sum;for(j=0;j<V210_HIDDEN;j++){sum=Number(m.b1[j])||0;for(i=0;i<V210_INPUTS;i++)sum+=(Number(m.w1[j*V210_INPUTS+i])||0)*(Number(x[i])||0);h[j]=Math.tanh(clamp(sum,-12,12));}for(j=0;j<V210_OUTPUTS;j++){sum=Number(m.b2[j])||0;for(i=0;i<V210_HIDDEN;i++)sum+=(Number(m.w2[j*V210_HIDDEN+i])||0)*h[i];logits[j]=sum;}return {h:h,p:v210Softmax(logits)};}
  function v210TrainOne(exp){if(!exp||!Array.isArray(exp.x)||exp.x.length!==V210_INPUTS)return 0;var m=S.brainStudent,fw=v210Forward(exp.x),target=v210NormalizeTarget(exp.target),lr=(Number(C.brainStudentLearningRate)||.012)*v213QualityLearningRateScale(),weight=clamp(Number(exp.weight)||1,.15,3),d=new Array(V210_OUTPUTS),dh=new Array(V210_HIDDEN).fill(0),i,j,idx,g,loss=0;for(j=0;j<V210_OUTPUTS;j++){loss-=target[j]*Math.log(Math.max(1e-8,fw.p[j]));d[j]=clamp((fw.p[j]-target[j])*weight,-1.5,1.5);}for(i=0;i<V210_HIDDEN;i++){for(j=0;j<V210_OUTPUTS;j++)dh[i]+=m.w2[j*V210_HIDDEN+i]*d[j];dh[i]*=(1-fw.h[i]*fw.h[i]);dh[i]=clamp(dh[i],-1.5,1.5);}for(j=0;j<V210_OUTPUTS;j++){for(i=0;i<V210_HIDDEN;i++){idx=j*V210_HIDDEN+i;g=d[j]*fw.h[i]+1e-6*m.w2[idx];m.w2[idx]-=lr*g;}m.b2[j]-=lr*d[j];}for(j=0;j<V210_HIDDEN;j++){for(i=0;i<V210_INPUTS;i++){idx=j*V210_INPUTS+i;g=dh[j]*(Number(exp.x[i])||0)+1e-6*m.w1[idx];m.w1[idx]-=lr*g;}m.b1[j]-=lr*dh[j];}m.updates=(Number(m.updates)||0)+1;m.lossEma=m.updates===1?loss:(.96*Number(m.lossEma||0)+.04*loss);m.lastTrainAt=clock();m.updatedAt=clock();return loss;}
  function v210ReplayAdd(exp){if(!exp||!exp.x)return;exp.x=exp.x.map(function(v){return v210Round(v,4);});exp.target=v210NormalizeTarget(exp.target).map(function(v){return v210Round(v,5);});exp.at=Number(exp.at)||clock();exp.priority=clamp(Number(exp.priority)||(.35+Math.abs(Number(exp.reward)||0)+.35*(Number(exp.weight)||1)),.1,5);S.brainReplay.push(exp);if(S.brainReplay.length>C.brainReplaySize)S.brainReplay.splice(0,S.brainReplay.length-C.brainReplaySize);S.brainStudent.samples=(Number(S.brainStudent.samples)||0)+1;if(S.brainStudent.samples%8===0)write('brainReplayV210',S.brainReplay);}
  function v210ReplaySample(){if(!S.brainReplay.length)return null;var total=0;S.brainReplay.forEach(function(e){total+=clamp(Number(e&&e.priority)||1,.1,5);});var pick=Math.random()*Math.max(.1,total),acc=0;for(var i=0;i<S.brainReplay.length;i++){acc+=clamp(Number(S.brainReplay[i]&&S.brainReplay[i].priority)||1,.1,5);if(pick<=acc)return S.brainReplay[i];}return S.brainReplay[S.brainReplay.length-1];}
  function v210ReplayTrain(rounds){if(!C.brainStudentEnabled||!S.brainReplay.length)return;rounds=Math.max(1,Math.min(12,Number(rounds)||1));for(var r=0;r<rounds;r++){var e=v210ReplaySample();if(!e)break;var loss=v210TrainOne(e);e.priority=clamp(.86*(Number(e.priority)||1)+.14*(.2+Math.min(4,Number(loss)||0)+Math.abs(Number(e.reward)||0)),.1,5);}if(clock()-(S.brain.lastPersistAt||0)>60000){v210StudentPersist();S.brain.lastPersistAt=clock();}}
  function v210StudentPersist(){var m=S.brainStudent;if(!v210StudentValid(m)){S.brainStudent=v210NewStudent();m=S.brainStudent;}m.updatedAt=clock();write('brainStudentV210',m);write('brainReplayV210',S.brainReplay.slice(-C.brainReplaySize));write('brainPendingV210',S.brainPending.slice(-8));}
  function v210StudentExport(){var m=S.brainStudent;return {schema:2,inputSize:m.inputSize,hiddenSize:m.hiddenSize,outputSize:m.outputSize,w1:m.w1.map(function(v){return v210Round(v,6);}),b1:m.b1.map(function(v){return v210Round(v,6);}),w2:m.w2.map(function(v){return v210Round(v,6);}),b2:m.b2.map(function(v){return v210Round(v,6);}),samples:Number(m.samples)||0,updates:Number(m.updates)||0,lossEma:v210Round(m.lossEma,6),rewardEma:v210Round(m.rewardEma,6),agreementEma:v210Round(m.agreementEma,6),outcomes:Number(m.outcomes)||Number(S.brain.outcomes)||0,lastTrainAt:Number(m.lastTrainAt)||0,lastTeacherAt:Number(m.lastTeacherAt)||0,updatedAt:Number(m.updatedAt)||clock(),telemetry:{action:String((S.brain.studentDecision&&S.brain.studentDecision.action)||''),confidence:v210Round(Number(S.brain.studentConfidence)||0,6),entropy:v210Round(Number(S.brain.studentEntropy)||1,6),novelty:v210Round(Number(S.brain.novelty)||0,6),replay:S.brainReplay.length,pendingOutcomes:S.brainPending.length,outcomes:Number(S.brain.outcomes)||0,promoted:v210StudentPromoted()}};}
  function v210StudentImport(remote){if(!v210StudentValid(remote))return false;var local=S.brainStudent;if(Number(remote.updatedAt||0)<=Number(local.updatedAt||0)&&Number(remote.updates||0)<=Number(local.updates||0))return false;S.brainStudent=remote;v210StudentPersist();audit('brain_student_pull','Student-Netz aus Cloud übernommen',{samples:remote.samples,updates:remote.updates,loss:remote.lossEma});return true;}
  function v210TargetFromDecision(d){var arr=V210_ACTIONS.map(function(a){return Math.max(0,Number(d&&d.scores&&d.scores[a])||0);}),sum=arr.reduce(function(a,b){return a+b;},0),ix=V210_ACTIONS.indexOf(String(d&&d.action||'')),conf=clamp(Number(d&&d.confidence)||0,0,1);if(sum<=0&&ix>=0){var rest=(1-Math.max(.55,conf))/Math.max(1,V210_OUTPUTS-1);arr=arr.map(function(_,i){return i===ix?Math.max(.55,conf):rest;});}return v210NormalizeTarget(arr);}
  function v210Novelty(x){if(!S.brainReplay.length)return 1;var rows=S.brainReplay.slice(-96),best=Infinity;rows.forEach(function(e){if(!e||!Array.isArray(e.x)||e.x.length!==x.length)return;var q=0;for(var i=0;i<x.length;i++){var d=x[i]-e.x[i];q+=d*d;}best=Math.min(best,Math.sqrt(q/x.length));});return clamp((isFinite(best)?best:1)*2.6,0,1);}
  function v210Predict(){var x=v210Features(),fw=v210Forward(x),ix=0;for(var i=1;i<fw.p.length;i++)if(fw.p[i]>fw.p[ix])ix=i;var entropy=0;fw.p.forEach(function(p){if(p>0)entropy-=p*Math.log(p);});entropy=clamp(entropy/Math.log(V210_OUTPUTS),0,1);var action=V210_ACTIONS[ix],target='';if(action==='change_farm_target'){try{var g=autoGoal();target=g&&g.monster||'';}catch(e){}}var out={source:'student',action:action,target:target,confidence:fw.p[ix],entropy:entropy,scores:{},reason:'Student NN · '+(Number(S.brainStudent.samples)||0)+' Lernbeispiele',recheckSeconds:120,features:x};V210_ACTIONS.forEach(function(a,j){out.scores[a]=v210Round(fw.p[j],5);});S.brain.studentDecision=out;S.brain.studentConfidence=out.confidence;S.brain.studentEntropy=entropy;S.brain.novelty=v210Novelty(x);return out;}
  function v210Metrics(){var rate=v273RateStats(),ps=partyState(),farm=S.farmHealth||{},errs=S.auditRecent.slice(-250).filter(function(e){return e&&e.kind==='action_error'&&clock()-Number(e.at||0)<300000;}).length,visits=Object.keys(S.explorer.visited||{}).reduce(function(n,k){return n+(Number(S.explorer.visited[k])||0);},0),learn=v290CompactLearning(),zoneSamples=Object.keys(learn.zones||{}).reduce(function(n,k){return n+(Number(learn.zones[k]&&learn.zones[k].samples)||0);},0);return {at:clock(),xp:Number(rate.xpPerHour)||0,gold:Number(rate.goldPerHour)||0,xpGain:Number(rate.xpGain)||0,goldGain:Number(rate.goldGain)||0,free:freeSlots(),safety:Number(farm.safetyPct==null?50:farm.safetyPct),errors:errs,rip:!!character.rip,partyComplete:!!ps.complete,exploreVisits:visits,zoneSamples:zoneSamples};}
  function v210StartOutcome(d,features,target){if(!d||['change_farm_target','replan_merchant','explore','wait'].indexOf(d.action)<0)return;var row={id:me+'-'+clock()+'-'+Math.floor(Math.random()*100000),decisionAt:clock(),dueAt:clock()+C.brainOutcomeSeconds*1000,action:d.action,target:d.target||'',source:d.source||'teacher',policyRole:d.policyRole||'',policyGeneration:Number(d.policyGeneration)||0,confidence:Number(d.confidence)||0,x:(features||v210Features()).slice(),teacherTarget:(target||v210TargetFromDecision(d)).slice(),before:v210Metrics()};S.brainPending.push(row);S.brainPending=S.brainPending.slice(-8);write('brainPendingV210',S.brainPending);}
  function v210Reward(before,after){var hours=Math.max(1/3600,(Number(after.at)-Number(before.at))/3600000),observedXp=Math.max(0,(Number(after.xpGain)-Number(before.xpGain))/hours),observedGold=Math.max(0,(Number(after.goldGain)-Number(before.goldGain))/hours),baseXp=Math.max(0,Number(before.xp)||0),baseGold=Math.max(0,Number(before.gold)||0),xpScale=Math.max(500,baseXp*.35),goldScale=Math.max(100,baseGold*.35),info=clamp((Number(after.exploreVisits)-Number(before.exploreVisits))/2,0,1),learning=clamp((Number(after.zoneSamples)-Number(before.zoneSamples))/8,0,1),r=.32*Math.tanh((observedXp-baseXp)/xpScale)+.16*Math.tanh((observedGold-baseGold)/goldScale)+.11*clamp((after.free-before.free)/5,-1,1)+.17*clamp((after.safety-before.safety)/30,-1,1)+.07*info+.05*learning-.12*clamp(after.errors-before.errors,0,5);if(!before.rip&&after.rip)r-=1;if(before.partyComplete&&!after.partyComplete)r-=.45;if(!before.partyComplete&&after.partyComplete)r+=.18;return clamp(r,-1,1);}
  function v210OutcomeTarget(row,reward){var t=v210NormalizeTarget(row.teacherTarget),ix=V210_ACTIONS.indexOf(row.action);if(ix<0)return t;if(reward>=0)t[ix]+=reward*.55;else{var cut=t[ix]*Math.min(.8,-reward*.75);t[ix]-=cut;for(var i=0;i<t.length;i++)if(i!==ix)t[i]+=cut/(t.length-1);}return v210NormalizeTarget(t);}
  function v210OutcomeTick(){if(character.ctype!=='merchant'||!S.brainPending.length)return;var now=clock(),keep=[];S.brainPending.forEach(function(row){if(Number(row.dueAt)>now){keep.push(row);return;}var after=v210Metrics(),reward=v210Reward(row.before,after),target=v210OutcomeTarget(row,reward),exp={x:row.x,target:target,reward:reward,weight:1+Math.abs(reward),source:'outcome',action:row.action};v210ReplayAdd(exp);v210ReplayTrain(6);var m=S.brainStudent;m.rewardEma=Number(m.samples)<=1?reward:.94*Number(m.rewardEma||0)+.06*reward;m.updatedAt=now;S.brain.outcomes=(Number(S.brain.outcomes)||0)+1;m.outcomes=S.brain.outcomes;v211RecordOutcome(row,reward,row.before,after);audit('brain_outcome','Brain-Entscheidung bewertet',{id:row.id,action:row.action,target:row.target,source:row.source,reward:v210Round(reward,4),before:row.before,after:after,student:{samples:m.samples,updates:m.updates,loss:m.lossEma}});v290Fetch('/api/brain-feedback',{feedback:{id:row.id,decisionAt:row.decisionAt,action:row.action,target:row.target,source:row.source,policyRole:row.policyRole||'',policyGeneration:Number(row.policyGeneration)||0,reward:v210Round(reward,6),confidence:row.confidence,before:row.before,after:after,student:{samples:m.samples,updates:m.updates,lossEma:m.lossEma,rewardEma:m.rewardEma,agreementEma:m.agreementEma}}}).catch(function(){});});S.brainPending=keep;write('brainPendingV210',keep);}
  function v210UtcDay(){return new Date().toISOString().slice(0,10);}
  function v210SyncUtcDay(){var day=v210UtcDay();if(S.brain.day===day)return false;S.brain.day=day;S.brain.usedToday=0;S.brain.requests=0;S.brain.blocked=0;S.brain.lastAt=0;S.brain.lastError='';audit('brain_day_reset','Neuer UTC-Tag · lokales Teacher-Budget zurückgesetzt',{day:day});return true;}
  function v210BudgetTarget(){return Math.floor((Number(C.brainDailyNeuronLimit)||10000)*(Number(C.brainBudgetTargetPct)||99.5)/100*(Number(C.brainWorkPct)||0)/100);}
  function v210ResetMs(){var n=new Date(),next=Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()+1,0,0,0);return Math.max(60000,next-clock());}
  function v210TeacherInterval(pred){var target=v210BudgetTarget(),used=Number(S.brain.usedToday)||0,remaining=Math.max(0,target-used);if(remaining<=0)return Infinity;var avg=clamp(Number(S.brain.avgNeurons)||16,4,80),calls=Math.max(1,remaining/avg),base=v210ResetMs()/calls,uncert=pred?Number(pred.entropy)||0:1,nov=Number(S.brain.novelty)||0,active=(.72+.48*uncert+.30*nov)*v213QualityTeacherBoost(),ms=base/active;return clamp(ms,C.brainTeacherMinIntervalSeconds*1000,C.brainTeacherMaxIntervalSeconds*1000);}
  function v210BrainTelemetry(){var m=S.brainStudent,p=S.brain.studentDecision||{},target=v210BudgetTarget(),limit=Number(C.brainDailyNeuronLimit)||10000;return {version:2,enabled:!!C.brainEnabled,usedToday:v210Round(S.brain.usedToday,2),limit:limit,target:target,budgetPct:limit?100*(Number(S.brain.usedToday)||0)/limit:0,teacherRequests:Number(S.brain.requests)||0,avgNeurons:v210Round(S.brain.avgNeurons,2),blocked:Number(S.brain.blocked)||0,lastTeacherAt:Number(S.brain.lastAt)||0,lastDecision:S.brain.lastDecision||null,student:{enabled:!!C.brainStudentEnabled,action:p.action||'',confidence:v210Round(Number(p.confidence)||0,5),entropy:v210Round(Number(p.entropy)||1,5),novelty:v210Round(Number(S.brain.novelty)||0,5),samples:Number(m.samples)||0,replay:S.brainReplay.length,updates:Number(m.updates)||0,lossEma:v210Round(m.lossEma,6),rewardEma:v210Round(m.rewardEma,6),agreementEma:v210Round(m.agreementEma,6),promoted:v210StudentPromoted(),lastTrainAt:Number(m.lastTrainAt)||0},pendingOutcomes:S.brainPending.length,outcomes:Math.max(Number(S.brain.outcomes)||0,Number(m.outcomes)||0)};}

  var v210ApplyBase=v290ApplyBrainDecision;
  v290ApplyBrainDecision=function(d){if(!d)return false;var features=d._features||v210Features(),target=d._target||v210TargetFromDecision(d);var applied=v210ApplyBase(d);if(applied)v210StartOutcome(d,features,target);return applied;};
  function v210StudentPromoted(){var m=S.brainStudent,samples=Number(m.samples)||0,outcomes=Math.max(Number(S.brain.outcomes)||0,Number(m.outcomes)||0),agree=Number(m.agreementEma)||0,loss=Number(m.lossEma)||0,reward=Number(m.rewardEma)||0;return samples>=80&&Number(m.updates)>=120&&agree>=.60&&(loss<=1.45||!loss)&&(outcomes<10||reward>=-.05);}
  function v210MaybeApplyStudent(pred){if(!C.brainStudentEnabled||!pred||!v210StudentPromoted()||Number(pred.confidence)*100<Number(C.brainStudentConfidencePct)||Number(pred.entropy)>.42)return false;if(clock()-(S.brain.lastStudentAt||0)<Math.max(90000,C.brainOutcomeSeconds*500))return false;if(pred.action==='continue'||(pred.action==='change_farm_target'&&!pred.target))return false;pred._features=pred.features;pred._target=V210_ACTIONS.map(function(a){return Number(pred.scores[a])||0;});var applied=v290ApplyBrainDecision(pred);if(applied){S.brain.lastStudentAt=clock();audit('brain_student_apply','Student-Netz setzt Strategie um',{action:pred.action,target:pred.target,confidence:pred.confidence,entropy:pred.entropy,novelty:S.brain.novelty});}return applied;}

  var v210CloudBase=v290CloudSyncTick;
  v290CloudSyncTick=function(force){if(!C.cloudSyncEnabled||S.cloudSyncBusy)return false;var now=clock(),gap=C.cloudSyncSeconds*1000;if(!force&&now-Math.max(S.cloudSync.pullAt||0,S.cloudSync.pushAt||0)<gap)return false;S.cloudSyncBusy=true;var initialized=!!read('cloudSyncInitialized',false),pushConfig=initialized&&(character.ctype==='merchant'||!!S.cloudConfigDirty),payload={op:'sync',config:pushConfig?v290CloudConfig():null,learning:v290CompactLearning(),observations:{explorer:{index:S.explorer.index||0,visited:S.explorer.visited||{},recent:(S.explorer.recentSamples||[]).slice(-20)}},student:character.ctype==='merchant'?v210StudentExport():null,configHash:pushConfig?v282ConfigHash(v290CloudConfig()):'',clientAt:now};S.cloudSync.pushAt=now;v290Fetch('/api/state',payload).then(function(j){if(j&&j.config&&j.configHash&&j.configHash!==v282ConfigHash(v290CloudConfig())&&Number(j.updatedAt||0)>Number(read('cloudConfigAt',0)||0)){var keepKey=C.webDashboardWriteKey;C=cleanConfig(Object.assign({},C,j.config));C.webDashboardWriteKey=keepKey;write('config',C);write('cloudConfigAt',Number(j.updatedAt)||clock());applyAppearance();audit('cloud_config_pull','Cloud-Einstellungen übernommen',{updatedAt:j.updatedAt,hash:j.configHash});}if(j&&j.learning&&j.learning.updatedAt>Number((v280LearningDB()||{}).updatedAt||0)){write('learningDB',j.learning);S.knowledgeDB=null;audit('cloud_learning_pull','Lernstand aus Cloud übernommen',{updatedAt:j.learning.updatedAt});}if(j&&j.observations&&j.observations.explorer){var ex=j.observations.explorer;S.explorer.index=Math.max(Number(S.explorer.index)||0,Number(ex.index)||0);S.explorer.visited=Object.assign({},ex.visited||{},S.explorer.visited||{});}if(character.ctype==='merchant'&&j&&j.student)v210StudentImport(j.student);if(pushConfig)S.cloudConfigDirty=false;if(!initialized){write('cloudSyncInitialized',true);S.cloudSync.pushAt=0;}S.cloudSync.lastOK=clock();S.cloudSync.lastError='';S.cloudSync.pullAt=clock();}).catch(function(e){S.cloudSync.lastError=reason(e);audit('cloud_sync_error','Cloud-Sync fehlgeschlagen',{error:S.cloudSync.lastError},'warning');}).finally(function(){S.cloudSyncBusy=false;});return true;};

  v290BrainTick=function(trigger,force){if(character.ctype!=='merchant'||!C.brainEnabled||C.brainWorkPct<=0||S.brainBusy)return false;v210SyncUtcDay();v210OutcomeTick();if(clock()-(S.brain.lastTrainAt||0)>30000){S.brain.lastTrainAt=clock();v210ReplayTrain(1);}var pred=v210Predict(),now=clock(),interval=v210TeacherInterval(pred),hardForce=!!force&&now-(S.brain.lastAt||0)>=Math.max(15000,C.brainTeacherMinIntervalSeconds*500);if(!hardForce&&now-(S.brain.lastAt||0)<interval){v211MaybeApplyPolicy(pred);return false;}if(Number(S.brain.usedToday)>=v210BudgetTarget())return false;S.brainBusy=true;S.brain.lastAt=now;var st=v290BrainState(trigger);st.student={action:pred.action,confidence:v210Round(pred.confidence,5),entropy:v210Round(pred.entropy,5),novelty:v210Round(S.brain.novelty,5),scores:pred.scores,samples:Number(S.brainStudent.samples)||0,updates:Number(S.brainStudent.updates)||0,lossEma:v210Round(S.brainStudent.lossEma,5),rewardEma:v210Round(S.brainStudent.rewardEma,5),agreementEma:v210Round(S.brainStudent.agreementEma,5)};st.budget={used:v210Round(S.brain.usedToday,2),hardLimit:Number(C.brainDailyNeuronLimit)||10000,target:v210BudgetTarget(),resetMs:v210ResetMs(),avgNeurons:v210Round(S.brain.avgNeurons,2)};st.quality=v213QualitySummary();var req={dailyLimit:Math.min(10000,Number(C.brainDailyNeuronLimit)||10000),targetPct:Number(C.brainBudgetTargetPct)||99.5,workPct:Number(C.brainWorkPct)||0,priorityPct:Number(C.brainPriorityPct)||0,minConfidencePct:Number(C.brainMinConfidencePct)||70,model:C.brainModel,state:st};v290Fetch('/api/brain',req).then(function(j){S.brain.usedToday=Number(j.usedToday)||0;S.brain.limit=Number(j.limit)||req.dailyLimit;if(j.blocked){S.brain.blocked++;S.brain.lastError=j.error||'Budget erreicht';audit('brain_budget','Brain-Aufruf blockiert',{used:S.brain.usedToday,limit:S.brain.limit,target:v210BudgetTarget(),reason:j.error},'warning');return;}S.brain.requests++;S.brain.lastError='';if(Number(j.neurons)>0)S.brain.avgNeurons=.88*Number(S.brain.avgNeurons||j.neurons)+.12*Number(j.neurons);if(j.decision){j.decision.source='teacher';j.decision._features=pred.features;j.decision._target=v210TargetFromDecision(j.decision);S.brain.lastDecision=j.decision;var teacherIx=V210_ACTIONS.indexOf(j.decision.action),studentIx=V210_ACTIONS.indexOf(pred.action),agree=teacherIx===studentIx?1:0,m=S.brainStudent;m.agreementEma=Number(m.samples)?(.94*Number(m.agreementEma||0)+.06*agree):agree;m.lastTeacherAt=clock();m.updatedAt=clock();v210ReplayAdd({x:pred.features,target:j.decision._target,reward:0,weight:1+Number(S.brain.novelty||0)*.4,source:'teacher',action:j.decision.action});v210ReplayTrain(6);v290ApplyBrainDecision(j.decision);}audit('brain_decision','AiO Brain Teacher-Entscheidung',{used:S.brain.usedToday,limit:S.brain.limit,target:v210BudgetTarget(),neurons:j.neurons,intervalMs:interval,student:{action:pred.action,confidence:pred.confidence,entropy:pred.entropy,novelty:S.brain.novelty},decision:j.decision});}).catch(function(e){S.brain.lastError=reason(e);audit('brain_error','AiO Brain Teacher nicht verfügbar; Student + lokale Logik laufen weiter',{error:S.brain.lastError},'warning');}).finally(function(){S.brainBusy=false;});return true;};

  v290BrainHTML=function(){var b=S.brain||{},m=S.brainStudent||{},t=v210BrainTelemetry(),pct=t.limit?Math.min(100,100*t.usedToday/t.limit):0,targetPct=t.limit?Math.min(100,100*t.target/t.limit):0,p=t.student||{};return '<h2>🧠 '+(C.language==='de'?'Gehirn · Teacher/Student':'Brain · Teacher/Student')+'</h2><div class="notice"><b>Selbstlernendes Brain v2.</b> Qwen ist der Lehrer; ein kleines lokales neuronales Netz lernt aus Lehrerentscheidungen und den später gemessenen Ergebnissen. Kampf/Heilung/Sicherheitsreflexe bleiben deterministisch.</div>'+cfgField('brainEnabled','AiO Brain aktiv','check')+cfgField('brainDailyNeuronLimit','Harte Tagesgrenze Neurons','number','Maximal 10.000. Der Budget-Pacer überschreitet diese Grenze nicht.')+cfgField('brainBudgetTargetPct','Kostenloses Budget nutzen (%)','number','Standard 99,5 % = Ziel 9.950 von 10.000 Neurons; kleiner Sicherheitsabstand für Mess-/Tokenabweichungen.')+cfgField('brainWorkPct','Teacher-Arbeit (%)','number','100 % nutzt das konfigurierte Tagesziel; kleinere Werte reduzieren den täglichen Teacher-Verbrauch proportional.')+cfgField('brainPriorityPct','Brain-Priorität (%)','number')+cfgField('brainMinConfidencePct','Teacher Mindest-Vertrauen (%)','number')+cfgField('brainStudentEnabled','Lernendes Student-Netz aktiv','check')+cfgField('brainStudentConfidencePct','Student Mindest-Vertrauen (%)','number','Erst oberhalb dieses Werts darf das Student-Netz eigenständig strategische Aktionen anwenden.')+cfgField('brainOutcomeSeconds','Ergebnis nach (Sek.) bewerten','number','Zeitfenster zwischen Strategie und Reward-Messung.')+cfgField('brainReplaySize','Experience-Replay Größe','number')+cfgField('brainStudentLearningRate','Student Lernrate','number')+cfgField('brainTeacherMinIntervalSeconds','Teacher Mindestabstand (Sek.)','number')+cfgField('brainTeacherMaxIntervalSeconds','Teacher Maximalabstand (Sek.)','number')+cfgField('brainModel','Workers-AI-Modell','select','Qwen bleibt als budgetierbarer Teacher fest vorgegeben.',[['@cf/qwen/qwen3-30b-a3b-fp8','Qwen3 30B A3B FP8 · Teacher']])+cfgField('cloudSyncEnabled','Settings & Lernstand extern synchronisieren','check')+cfgField('cloudSyncSeconds','Cloud-Sync alle (Sek.)','number')+'<div class="card"><h3>Cloudflare Teacher</h3><div class="line"><span>Heute</span><strong>'+Math.round(t.usedToday)+' / '+Math.round(t.limit)+' Neurons</strong></div><div class="bar"><i style="width:'+pct+'%"></i></div><div class="line"><span>Tagesziel</span><strong>'+Math.round(t.target)+' · '+targetPct.toFixed(1)+'%</strong></div><div class="line"><span>Teacher-Anfragen</span><strong>'+t.teacherRequests+'</strong></div><div class="line"><span>Ø Neurons / Anfrage</span><strong>'+t.avgNeurons+'</strong></div><div class="line"><span>Letzte Teacher-Entscheidung</span><strong>'+esc(t.lastDecision?String(t.lastDecision.action||'—'):'—')+'</strong></div>'+(b.lastError?'<div class="notice warn">'+esc(b.lastError)+'</div>':'')+'</div><div class="card"><h3>Lokales Student-Netz</h3><div class="line"><span>Aktuelle Entscheidung</span><strong>'+esc(p.action||'—')+'</strong></div><div class="line"><span>Confidence</span><strong>'+Math.round(Number(p.confidence||0)*1000)/10+'%</strong></div><div class="line"><span>Unsicherheit / Neuigkeit</span><strong>'+Math.round(Number(p.entropy||0)*100)+'% / '+Math.round(Number(p.novelty||0)*100)+'%</strong></div><div class="line"><span>Lernbeispiele / Replay</span><strong>'+Number(p.samples||0)+' / '+Number(p.replay||0)+'</strong></div><div class="line"><span>Trainingsschritte</span><strong>'+Number(p.updates||0)+'</strong></div><div class="line"><span>Loss EMA</span><strong>'+Number(p.lossEma||0).toFixed(4)+'</strong></div><div class="line"><span>Reward EMA</span><strong>'+Number(p.rewardEma||0).toFixed(3)+'</strong></div><div class="line"><span>Teacher-Übereinstimmung</span><strong>'+Math.round(Number(p.agreementEma||0)*1000)/10+'%</strong></div><div class="line"><span>Student-Freigabe</span><strong>'+(p.promoted?'Champion aktiv':'Shadow-Lernen')+'</strong></div><div class="line"><span>Offene Outcome-Messungen</span><strong>'+Number(t.pendingOutcomes||0)+'</strong></div></div>';};


  // ---------------------------------------------------------------------------
  // 2.13.0 Brain League · frozen Champion, canary Challenger, automatic rollback
  // ---------------------------------------------------------------------------
  function v211CloneModel(m){if(!v210StudentValid(m))return null;return {schema:2,inputSize:m.inputSize,hiddenSize:m.hiddenSize,outputSize:m.outputSize,w1:m.w1.slice(),b1:m.b1.slice(),w2:m.w2.slice(),b2:m.b2.slice(),samples:Number(m.samples)||0,updates:Number(m.updates)||0,lossEma:Number(m.lossEma)||0,rewardEma:Number(m.rewardEma)||0,agreementEma:Number(m.agreementEma)||0,outcomes:Number(m.outcomes)||0,lastTrainAt:Number(m.lastTrainAt)||0,lastTeacherAt:Number(m.lastTeacherAt)||0,updatedAt:Number(m.updatedAt)||clock()};}
  function v211NewLeague(){return {schema:1,status:'shadow',generation:0,champion:null,previousChampion:null,previousGeneration:0,candidate:null,candidateGeneration:0,lastCandidateUpdates:0,championRewardEma:0,previousRewardEma:0,promotions:0,rollbacks:0,rejections:0,lastEvent:'shadow',lastEventAt:clock(),lastReason:'Sammelt Lernbeispiele',challenge:{active:false,startedAt:0,championRewards:[],challengerRewards:[],safetyIncidents:0,championLoss:0,challengerLoss:0},probation:{active:false,startedAt:0,baselineReward:0,rewards:[],safetyIncidents:0},updatedAt:clock()};}
  function v211LeagueLoad(){var l=read('brainLeagueV211',null);if(!l||l.schema!==1)l=v211NewLeague();if(l.champion&&!v210StudentValid(l.champion))l.champion=null;if(l.previousChampion&&!v210StudentValid(l.previousChampion))l.previousChampion=null;if(l.candidate&&!v210StudentValid(l.candidate))l.candidate=null;l.challenge=l.challenge||v211NewLeague().challenge;l.probation=l.probation||v211NewLeague().probation;l.challenge.championRewards=Array.isArray(l.challenge.championRewards)?l.challenge.championRewards.slice(-32):[];l.challenge.challengerRewards=Array.isArray(l.challenge.challengerRewards)?l.challenge.challengerRewards.slice(-32):[];l.probation.rewards=Array.isArray(l.probation.rewards)?l.probation.rewards.slice(-32):[];if(!l.champion){l.status='shadow';l.challenge.active=false;l.probation.active=false;}return l;}
  S.brainLeague=v211LeagueLoad();
  function v211PersistLeague(){S.brainLeague.updatedAt=clock();write('brainLeagueV211',S.brainLeague);}
  function v211Avg(a){a=(a||[]).map(Number).filter(isFinite);return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:0;}
  function v211ForwardModel(m,x){if(!v210StudentValid(m))return null;var h=new Array(V210_HIDDEN),logits=new Array(V210_OUTPUTS),i,j,sum;for(j=0;j<V210_HIDDEN;j++){sum=Number(m.b1[j])||0;for(i=0;i<V210_INPUTS;i++)sum+=(Number(m.w1[j*V210_INPUTS+i])||0)*(Number(x[i])||0);h[j]=Math.tanh(clamp(sum,-12,12));}for(j=0;j<V210_OUTPUTS;j++){sum=Number(m.b2[j])||0;for(i=0;i<V210_HIDDEN;i++)sum+=(Number(m.w2[j*V210_HIDDEN+i])||0)*h[i];logits[j]=sum;}return {h:h,p:v210Softmax(logits)};}
  function v211ModelLoss(m){if(!v210StudentValid(m)||!S.brainReplay.length)return Infinity;var rows=S.brainReplay.slice(-96),sum=0,weights=0;rows.forEach(function(e){if(!e||!Array.isArray(e.x)||e.x.length!==V210_INPUTS)return;var fw=v211ForwardModel(m,e.x),target=v210NormalizeTarget(e.target),w=clamp(Number(e.weight)||1,.2,3),loss=0;for(var i=0;i<V210_OUTPUTS;i++)loss-=target[i]*Math.log(Math.max(1e-8,fw.p[i]));sum+=loss*w;weights+=w;});return weights?sum/weights:Infinity;}
  function v211PredictModel(m,role,generation,x){x=x||v210Features();var fw=v211ForwardModel(m,x);if(!fw)return null;var ix=0;for(var i=1;i<fw.p.length;i++)if(fw.p[i]>fw.p[ix])ix=i;var entropy=0;fw.p.forEach(function(q){if(q>0)entropy-=q*Math.log(q);});entropy=clamp(entropy/Math.log(V210_OUTPUTS),0,1);var action=V210_ACTIONS[ix],target='';if(action==='change_farm_target'){try{var g=autoGoal();target=g&&g.monster||'';}catch(e){}}var out={source:'student',policyRole:role||'champion',policyGeneration:Number(generation)||0,action:action,target:target,confidence:fw.p[ix],entropy:entropy,scores:{},reason:(role==='challenger'?'Challenger':role==='probation'?'Champion auf Bewährung':'Champion')+' #'+(Number(generation)||0),recheckSeconds:120,features:x};V210_ACTIONS.forEach(function(a,j){out.scores[a]=v210Round(fw.p[j],5);});return out;}
  function v211PostLeagueEvent(kind,reasonText,reward){v290Fetch('/api/brain-feedback',{feedback:{eventType:kind,action:'brain_league',target:'generation-'+Number(S.brainLeague.generation||0),source:'brain_league',reward:v210Round(Number(reward)||0,6),reason:safeString(reasonText,500),league:v211LeagueSummary()}}).catch(function(){});}
  function v211SetEvent(kind,reasonText){var l=S.brainLeague;l.lastEvent=kind;l.lastEventAt=clock();l.lastReason=safeString(reasonText,500);l.updatedAt=clock();v211PersistLeague();}
  function v211EstablishChampion(reasonText){var l=S.brainLeague,m=v211CloneModel(S.brainStudent);if(!m)return false;l.champion=m;l.generation=Math.max(1,Number(l.generation)||0);l.status='champion';l.championRewardEma=Number(m.rewardEma)||0;l.promotions=Math.max(1,Number(l.promotions)||0);l.lastCandidateUpdates=Number(S.brainStudent.updates)||0;v211SetEvent('first_champion',reasonText||'Erstes stabiles Student-Netz freigegeben');audit('brain_champion','Erster Brain-Champion aktiviert',{generation:l.generation,samples:m.samples,updates:m.updates,loss:v211ModelLoss(m)});v211PostLeagueEvent('promotion',l.lastReason,l.championRewardEma);return true;}
  function v211RejectCandidate(reasonText){var l=S.brainLeague;l.candidate=null;l.candidateGeneration=0;l.challenge={active:false,startedAt:0,championRewards:[],challengerRewards:[],safetyIncidents:0,championLoss:0,challengerLoss:0};l.status='champion';l.rejections=(Number(l.rejections)||0)+1;l.lastCandidateUpdates=Number(S.brainStudent.updates)||0;v211SetEvent('challenge_reject',reasonText);audit('brain_challenger_reject','Challenger verworfen',{reason:reasonText,rejections:l.rejections});v211PostLeagueEvent('challenge_reject',reasonText,0);}
  function v211PromoteCandidate(reasonText){var l=S.brainLeague;if(!l.candidate)return false;var baseline=l.challenge.championRewards.length?v211Avg(l.challenge.championRewards):Number(l.championRewardEma)||0;l.previousChampion=v211CloneModel(l.champion);l.previousGeneration=Number(l.generation)||0;l.previousRewardEma=Number(l.championRewardEma)||0;l.champion=v211CloneModel(l.candidate);l.generation=Number(l.candidateGeneration)||Math.max(1,l.generation+1);l.candidate=null;l.candidateGeneration=0;l.challenge={active:false,startedAt:0,championRewards:[],challengerRewards:[],safetyIncidents:0,championLoss:0,challengerLoss:0};l.probation={active:true,startedAt:clock(),baselineReward:baseline,rewards:[],safetyIncidents:0};l.status='probation';l.promotions=(Number(l.promotions)||0)+1;l.lastCandidateUpdates=Number(S.brainStudent.updates)||0;v211SetEvent('promotion',reasonText);audit('brain_champion_promote','Challenger wird neuer Champion auf Bewährung',{generation:l.generation,previousGeneration:l.previousGeneration,baselineReward:baseline,reason:reasonText});v211PostLeagueEvent('promotion',reasonText,baseline);return true;}
  function v211Rollback(reasonText){var l=S.brainLeague;if(!l.previousChampion)return false;var badGeneration=Number(l.generation)||0;l.champion=v211CloneModel(l.previousChampion);l.generation=Number(l.previousGeneration)||Math.max(1,badGeneration-1);l.championRewardEma=Number(l.previousRewardEma)||0;l.previousChampion=null;l.previousGeneration=0;l.previousRewardEma=0;l.probation={active:false,startedAt:0,baselineReward:0,rewards:[],safetyIncidents:0};l.status='champion';l.rollbacks=(Number(l.rollbacks)||0)+1;l.lastCandidateUpdates=Number(S.brainStudent.updates)||0;v211SetEvent('rollback',reasonText);audit('brain_champion_rollback','Brain-Champion automatisch zurückgerollt',{fromGeneration:badGeneration,toGeneration:l.generation,reason:reasonText,rollbacks:l.rollbacks},'warning');v211PostLeagueEvent('rollback',reasonText,-1);return true;}
  function v211ConfirmChampion(reasonText){var l=S.brainLeague;l.previousChampion=null;l.previousGeneration=0;l.previousRewardEma=0;l.probation={active:false,startedAt:0,baselineReward:0,rewards:[],safetyIncidents:0};l.status='champion';v211SetEvent('champion_confirmed',reasonText);audit('brain_champion_confirm','Neuer Brain-Champion bestätigt',{generation:l.generation,reason:reasonText,rewardEma:l.championRewardEma});v211PostLeagueEvent('champion_confirmed',reasonText,l.championRewardEma);}
  function v211MaybeStartChallenge(){var l=S.brainLeague;if(!C.brainLeagueEnabled||!C.brainStudentEnabled||!v213QualityCanChallenge())return false;var min=Math.max(4,Number(C.brainChallengeMinOutcomes)||8),outcomes=Math.max(Number(S.brain.outcomes)||0,Number(S.brainStudent.outcomes)||0);if(!l.champion){if(v210StudentPromoted()&&outcomes>=min)return v211EstablishChampion('Shadow-Netz erfüllt Qualitäts- und Outcome-Gate');return false;}if(l.challenge.active||l.probation.active)return false;var updates=Number(S.brainStudent.updates)||0;if(updates-Number(l.lastCandidateUpdates||0)<120||outcomes<min)return false;var challengerLoss=v211ModelLoss(S.brainStudent),championLoss=v211ModelLoss(l.champion),agreement=Number(S.brainStudent.agreementEma)||0,reward=Number(S.brainStudent.rewardEma)||0;if(!isFinite(challengerLoss)||!isFinite(championLoss)||challengerLoss>championLoss*.97||agreement<.60||reward<-.03){l.lastCandidateUpdates=updates;v211PersistLeague();return false;}l.candidate=v211CloneModel(S.brainStudent);l.candidateGeneration=(Number(l.generation)||0)+1;l.challenge={active:true,startedAt:clock(),championRewards:[],challengerRewards:[],safetyIncidents:0,championLoss:v210Round(championLoss,6),challengerLoss:v210Round(challengerLoss,6)};l.status='challenge';l.lastCandidateUpdates=updates;v211SetEvent('challenge_start','Challenger #'+l.candidateGeneration+' startet sicheren Canary-Test');audit('brain_challenger_start','Neuer Brain-Challenger startet Canary',{generation:l.candidateGeneration,championLoss:championLoss,challengerLoss:challengerLoss,trafficPct:C.brainChallengerTrafficPct});v211PostLeagueEvent('challenge_start',l.lastReason,0);return true;}
  function v211RecordOutcome(row,reward,before,after){var l=S.brainLeague;if(!C.brainLeagueEnabled||!row||!row.policyRole)return;var role=String(row.policyRole),fatal=!before.rip&&after.rip,unsafe=Number(after.safety)<Number(before.safety)-35||Number(reward)<=-.9,min=Math.max(4,Number(C.brainChallengeMinOutcomes)||8),drop=Math.max(.05,Number(C.brainRollbackRewardDropPct||12)/100);if(role==='champion'||role==='probation')l.championRewardEma=Number(l.championRewardEma)?(.92*Number(l.championRewardEma)+.08*Number(reward)):(Number(reward)||0);if(l.challenge.active){if(role==='challenger'){l.challenge.challengerRewards.push(Number(reward)||0);l.challenge.challengerRewards=l.challenge.challengerRewards.slice(-32);if(fatal||unsafe)l.challenge.safetyIncidents++;}else if(role==='champion'){l.challenge.championRewards.push(Number(reward)||0);l.challenge.championRewards=l.challenge.championRewards.slice(-32);}var ca=l.challenge.challengerRewards,ch=l.challenge.championRewards;if(l.challenge.safetyIncidents>0){v211RejectCandidate('Challenger verursachte einen Sicherheitsvorfall');return;}if(ca.length>=min&&ch.length>=Math.max(3,Math.floor(min/2))){var cav=v211Avg(ca),chv=v211Avg(ch);if(cav<chv-.08){v211RejectCandidate('Challenger-Reward '+v210Round(cav,3)+' liegt unter Champion '+v210Round(chv,3));return;}if(cav>=chv+.02&&Number(l.challenge.challengerLoss)<=Number(l.challenge.championLoss)*.995){v211PromoteCandidate('Canary besser: Reward '+v210Round(cav,3)+' vs '+v210Round(chv,3));return;}if(ca.length>=min*2){v211RejectCandidate('Challenger nach erweitertem Canary nicht messbar besser');return;}}}
    if(l.probation.active&&role==='probation'){l.probation.rewards.push(Number(reward)||0);l.probation.rewards=l.probation.rewards.slice(-32);if(fatal||unsafe)l.probation.safetyIncidents++;if(l.probation.safetyIncidents>0){v211Rollback('Neuer Champion verursachte auf Bewährung einen Sicherheitsvorfall');return;}if(l.probation.rewards.length>=min){var avg=v211Avg(l.probation.rewards),base=Number(l.probation.baselineReward)||0;if(avg<base-drop){v211Rollback('Reward fiel auf Bewährung von '+v210Round(base,3)+' auf '+v210Round(avg,3));return;}v211ConfirmChampion('Bewährung bestanden · Reward '+v210Round(avg,3)+' bei Basis '+v210Round(base,3));return;}}
    v211PersistLeague();
  }
  function v211MaybeApplyPolicy(trainingPred){if(!C.brainLeagueEnabled||!C.brainStudentEnabled||!v213QualityAutonomyAllowed())return false;v211MaybeStartChallenge();var l=S.brainLeague;if(!l.champion)return false;var role='champion',model=l.champion,generation=l.generation;if(l.probation.active){role='probation';}else if(l.challenge.active&&l.candidate&&v213QualityCanaryAllowed()&&Math.random()<Number(C.brainChallengerTrafficPct||20)/100){role='challenger';model=l.candidate;generation=l.candidateGeneration;}var pred=v211PredictModel(model,role,generation,trainingPred&&trainingPred.features);if(!pred)return false;var minConf=Math.min(99,(Number(C.brainStudentConfidencePct)||82)+v213QualityConfidenceBoostPct());if(role==='challenger')minConf=Math.min(99,minConf+3);if(Number(pred.confidence)*100<minConf||Number(pred.entropy)>(role==='challenger'?.38:.42))return false;if(clock()-(S.brain.lastStudentAt||0)<Math.max(90000,C.brainOutcomeSeconds*500))return false;if(pred.action==='continue'||(pred.action==='change_farm_target'&&!pred.target))return false;pred._features=pred.features;pred._target=V210_ACTIONS.map(function(a){return Number(pred.scores[a])||0;});var applied=v290ApplyBrainDecision(pred);if(applied){S.brain.lastStudentAt=clock();audit('brain_policy_apply',(role==='challenger'?'Challenger':role==='probation'?'Champion auf Bewährung':'Champion')+' setzt Strategie um',{role:role,generation:generation,action:pred.action,target:pred.target,confidence:pred.confidence,entropy:pred.entropy});}return applied;}
  function v211LeagueSummary(){var l=S.brainLeague||v211NewLeague(),c=l.challenge||{},p=l.probation||{};return {enabled:!!C.brainLeagueEnabled,status:String(l.status||'shadow'),generation:Number(l.generation)||0,hasChampion:!!l.champion,hasCandidate:!!l.candidate,candidateGeneration:Number(l.candidateGeneration)||0,canaryActive:!!c.active,probationActive:!!p.active,promotions:Number(l.promotions)||0,rollbacks:Number(l.rollbacks)||0,rejections:Number(l.rejections)||0,championRewardEma:v210Round(l.championRewardEma,5),championLoss:isFinite(Number(c.championLoss))?v210Round(c.championLoss,5):0,challengerLoss:isFinite(Number(c.challengerLoss))?v210Round(c.challengerLoss,5):0,championCanaryReward:v210Round(v211Avg(c.championRewards),5),challengerCanaryReward:v210Round(v211Avg(c.challengerRewards),5),championCanaryOutcomes:(c.championRewards||[]).length,challengerCanaryOutcomes:(c.challengerRewards||[]).length,probationReward:v210Round(v211Avg(p.rewards),5),probationOutcomes:(p.rewards||[]).length,probationBaseline:v210Round(Number(p.baselineReward)||0,5),lastEvent:String(l.lastEvent||''),lastEventAt:Number(l.lastEventAt)||0,lastReason:String(l.lastReason||'')};}
  function v211LifeState(){var now=clock(),l=v211LeagueSummary(),m=S.brainStudent||{},state='observing',label='beobachtet die Welt',detail='Sammelt Zustände und wartet auf ein nützliches Lernsignal',intensity=.42;if(!C.brainEnabled){state='sleeping';label='schläft';detail='Gehirn ist deaktiviert';intensity=.12;}else if(S.brainBusy){state='thinking';label='denkt mit dem Teacher';detail='Qwen bewertet gerade den aktuellen Spielzustand';intensity=1;}else if(l.probationActive){state='guarding';label='bewacht einen neuen Champion';detail='Rollback bleibt aktiv, bis die Bewährung bestanden ist';intensity=.86;}else if(l.canaryActive){state='challenging';label='prüft einen Challenger';detail='Champion und Challenger werden an realen Outcomes verglichen';intensity=.92;}else if(now-Number(m.lastTrainAt||0)<5000){state='learning';label='lernt';detail='Gewichte werden aus Experience Replay aktualisiert';intensity=.8;}else if(S.brainPending&&S.brainPending.length){state='evaluating';label='beobachtet die Folgen';detail=S.brainPending.length+' Entscheidung(en) warten auf Reward-Messung';intensity=.64;}else if(l.hasChampion){state='alive';label='ist wach';detail='Champion #'+l.generation+' beobachtet, lernt und entscheidet strategisch';intensity=.52;}var last=S.brain.lastDecision;if(last&&now-Number(S.brain.lastAt||0)<12000&&!S.brainBusy){state='reflecting';label='verarbeitet eine Entscheidung';detail=safeString(last.reason||last.action||detail,180);intensity=Math.max(intensity,.7);}return {state:state,label:label,detail:detail,intensity:v210Round(intensity,3),beatMs:Math.round(1900-1050*intensity),lastEvent:l.lastEvent,lastEventAt:l.lastEventAt};}
  function v211LifeMarkup(){var life=v211LifeState(),l=v211LeagueSummary(),dots='';for(var i=0;i<7;i++)dots+='<i class="synapse s'+i+'"></i>';return '<div class="brain-being '+esc(life.state)+'" style="--brain-beat:'+Number(life.beatMs)+'ms"><div class="brain-core"><span>🧠</span>'+dots+'</div><div class="brain-presence"><b>'+esc(life.label)+'</b><small>'+esc(life.detail)+'</small><div class="neural-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div class="brain-generation"><small>'+(l.hasChampion?'Champion':'Shadow')+'</small><b>'+(l.hasChampion?'#'+l.generation:'lernt')+'</b></div></div>';}

  var v211StudentExportBase=v210StudentExport;
  v210StudentExport=function(){var x=v211StudentExportBase();x.league={schema:1,state:v211LeagueSummary(),champion:S.brainLeague.champion?v211CloneModel(S.brainLeague.champion):null,previousChampion:S.brainLeague.previousChampion?v211CloneModel(S.brainLeague.previousChampion):null,previousGeneration:Number(S.brainLeague.previousGeneration)||0,candidate:S.brainLeague.candidate?v211CloneModel(S.brainLeague.candidate):null,candidateGeneration:Number(S.brainLeague.candidateGeneration)||0,lastCandidateUpdates:Number(S.brainLeague.lastCandidateUpdates)||0,championRewardEma:Number(S.brainLeague.championRewardEma)||0,previousRewardEma:Number(S.brainLeague.previousRewardEma)||0,promotions:Number(S.brainLeague.promotions)||0,rollbacks:Number(S.brainLeague.rollbacks)||0,rejections:Number(S.brainLeague.rejections)||0,status:S.brainLeague.status,challenge:S.brainLeague.challenge,probation:S.brainLeague.probation,lastEvent:S.brainLeague.lastEvent,lastEventAt:S.brainLeague.lastEventAt,lastReason:S.brainLeague.lastReason,updatedAt:S.brainLeague.updatedAt};x.telemetry=x.telemetry||{};x.telemetry.promoted=!!S.brainLeague.champion;x.telemetry.league=v211LeagueSummary();x.telemetry.life=v211LifeState();return x;};
  var v211StudentImportBase=v210StudentImport;
  function v211LeagueImport(remote){var x=remote&&remote.league;if(!x||x.schema!==1)return false;var local=S.brainLeague,remoteAt=Number(x.updatedAt)||0;if(remoteAt<=Number(local.updatedAt||0))return false;var l=v211NewLeague();l.status=String(x.status||'shadow');l.generation=Number(x.state&&x.state.generation||x.generation)||0;l.champion=v210StudentValid(x.champion)?x.champion:null;l.previousChampion=v210StudentValid(x.previousChampion)?x.previousChampion:null;l.previousGeneration=Number(x.previousGeneration)||0;l.candidate=v210StudentValid(x.candidate)?x.candidate:null;l.candidateGeneration=Number(x.candidateGeneration)||0;l.lastCandidateUpdates=Number(x.lastCandidateUpdates)||0;l.championRewardEma=Number(x.championRewardEma)||0;l.previousRewardEma=Number(x.previousRewardEma)||0;l.promotions=Number(x.promotions)||0;l.rollbacks=Number(x.rollbacks)||0;l.rejections=Number(x.rejections)||0;l.challenge=x.challenge||l.challenge;l.probation=x.probation||l.probation;l.lastEvent=String(x.lastEvent||'cloud_pull');l.lastEventAt=Number(x.lastEventAt)||clock();l.lastReason=String(x.lastReason||'');l.updatedAt=remoteAt;S.brainLeague=l;v211PersistLeague();audit('brain_league_pull','Champion/Challenger-Zustand aus Cloud übernommen',{generation:l.generation,status:l.status,promotions:l.promotions,rollbacks:l.rollbacks});return true;}
  v210StudentImport=function(remote){if(remote&&remote.league)v211LeagueImport(remote);return v211StudentImportBase(remote);};
  var v211TelemetryBase=v210BrainTelemetry;
  v210BrainTelemetry=function(){var x=v211TelemetryBase();x.league=v211LeagueSummary();x.life=v211LifeState();if(x.student)x.student.promoted=!!S.brainLeague.champion;return x;};
  var v211BrainHTMLBase=v290BrainHTML;
  v290BrainHTML=function(){var base=v211BrainHTMLBase(),l=v211LeagueSummary();var league='<div class="card brain-league-card"><h3>🏆 Champion / Challenger</h3><div class="line"><span>Status</span><strong>'+esc(l.status)+'</strong></div><div class="line"><span>Aktiver Champion</span><strong>'+(l.hasChampion?'Generation #'+l.generation:'noch keiner')+'</strong></div><div class="line"><span>Challenger</span><strong>'+(l.canaryActive?'#'+l.candidateGeneration+' · '+l.challengerCanaryOutcomes+' Outcomes':'—')+'</strong></div><div class="line"><span>Canary-Reward</span><strong>'+Number(l.championCanaryReward||0).toFixed(3)+' / '+Number(l.challengerCanaryReward||0).toFixed(3)+'</strong></div><div class="line"><span>Bewährung</span><strong>'+(l.probationActive?l.probationOutcomes+'/'+Math.max(4,Number(C.brainChallengeMinOutcomes)||8)+' Outcomes':'—')+'</strong></div><div class="line"><span>Promotions / Rollbacks / Verworfen</span><strong>'+l.promotions+' / '+l.rollbacks+' / '+l.rejections+'</strong></div><div class="muted">'+esc(l.lastReason||'Noch kein League-Ereignis')+'</div></div>';return v211LifeMarkup()+base+cfgField('brainLeagueEnabled','Champion/Challenger & Auto-Rollback aktiv','check','Der lernende Student bleibt Challenger. Nur eingefrorene Champions handeln regulär; neue Kandidaten bekommen begrenzten Canary-Traffic und werden bei Sicherheits- oder Reward-Rückschritten automatisch verworfen/zurückgerollt.')+cfgField('brainChallengerTrafficPct','Challenger Canary-Anteil (%)','number','Anteil autonomer Strategieentscheidungen, die während eines Vergleichs testweise vom Challenger kommen. 5–35 %.')+cfgField('brainChallengeMinOutcomes','Outcomes pro Vergleich','number','Mindestanzahl real gemessener Challenger-/Bewährungs-Outcomes.')+cfgField('brainRollbackRewardDropPct','Rollback bei Reward-Abfall (%)','number','Wie stark der Reward eines neuen Champions gegenüber seiner Basis fallen darf, bevor automatisch zurückgerollt wird.')+league;};
  var v211RenderMainBase=renderMain;
  renderMain=function(){v211RenderMainBase();if(!S.mainBox)return;var h=S.mainBox.querySelector('.head'),chip=h&&h.querySelector('.brainlife-mini'),life=v211LifeState(),l=v211LeagueSummary();if(h&&!chip){chip=D.createElement('span');chip.className='brainlife-mini';var power=h.querySelector('.power');h.insertBefore(chip,power||null);}if(chip){chip.className='brainlife-mini '+life.state;chip.style.setProperty('--brain-beat',life.beatMs+'ms');chip.title=life.label+' · '+life.detail;chip.innerHTML='<span class="brain-mini-core">🧠</span><span class="brain-mini-copy"><b>'+esc(life.label)+'</b><small>'+(l.hasChampion?'C#'+l.generation:'Shadow')+'</small></span>';}};
  CSS+=' .brainlife-mini{--brain-beat:1400ms;display:flex;align-items:center;gap:5px;margin-left:auto;margin-right:4px;padding:3px 6px;border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border));border-radius:999px;background:color-mix(in srgb,var(--panel) 80%,transparent);max-width:150px}.brain-mini-core{position:relative;display:grid;place-items:center;width:22px;height:22px;font-size:14px;filter:drop-shadow(0 0 5px color-mix(in srgb,var(--accent) 65%,transparent));animation:brainHeart var(--brain-beat) ease-in-out infinite}.brain-mini-core:after{content:"";position:absolute;inset:-3px;border:1px solid var(--accent);border-radius:50%;opacity:.55;animation:brainRing var(--brain-beat) ease-out infinite}.brain-mini-copy{min-width:0;display:flex;flex-direction:column;line-height:1.05}.brain-mini-copy b{font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:95px}.brain-mini-copy small{font-size:7px;color:var(--muted)}.brain-being{--brain-beat:1400ms;position:relative;display:grid;grid-template-columns:88px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px;margin-bottom:12px;border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border));border-radius:14px;background:radial-gradient(circle at 48px 50%,color-mix(in srgb,var(--accent) 15%,transparent),transparent 42%),color-mix(in srgb,var(--panel) 92%,transparent);overflow:hidden}.brain-being:after{content:"";position:absolute;left:-30%;right:-30%;bottom:-22px;height:40px;background:radial-gradient(ellipse,color-mix(in srgb,var(--accent) 24%,transparent),transparent 70%);animation:brainDrift 4s ease-in-out infinite}.brain-core{position:relative;display:grid;place-items:center;width:74px;height:74px}.brain-core>span{font-size:42px;z-index:2;animation:brainHeart var(--brain-beat) ease-in-out infinite;filter:drop-shadow(0 0 12px color-mix(in srgb,var(--accent) 75%,transparent))}.brain-core:before,.brain-core:after{content:"";position:absolute;border-radius:50%;border:1px solid var(--accent);animation:brainRing var(--brain-beat) ease-out infinite}.brain-core:before{inset:8px}.brain-core:after{inset:-2px;animation-delay:calc(var(--brain-beat) * -.45)}.synapse{position:absolute;width:5px;height:5px;border-radius:50%;background:var(--accent);box-shadow:0 0 9px var(--accent);animation:synapseBlink calc(var(--brain-beat) * 1.7) ease-in-out infinite}.s0{left:4px;top:19px}.s1{right:3px;top:25px;animation-delay:-.3s}.s2{left:9px;bottom:12px;animation-delay:-.7s}.s3{right:8px;bottom:8px;animation-delay:-1.1s}.s4{left:34px;top:0;animation-delay:-.5s}.s5{right:0;bottom:31px;animation-delay:-.9s}.s6{left:31px;bottom:0;animation-delay:-1.3s}.brain-presence{min-width:0;z-index:1}.brain-presence>b{display:block;font-size:15px}.brain-presence>small{display:block;color:var(--muted);font-size:10px;margin-top:4px;white-space:normal}.neural-wave{height:20px;display:flex;gap:3px;align-items:center;margin-top:7px}.neural-wave i{display:block;width:3px;height:5px;border-radius:3px;background:var(--accent);animation:brainWave 1.2s ease-in-out infinite}.neural-wave i:nth-child(2){animation-delay:-.15s}.neural-wave i:nth-child(3){animation-delay:-.3s}.neural-wave i:nth-child(4){animation-delay:-.45s}.neural-wave i:nth-child(5){animation-delay:-.6s}.neural-wave i:nth-child(6){animation-delay:-.75s}.neural-wave i:nth-child(7){animation-delay:-.9s}.brain-generation{text-align:right;z-index:1}.brain-generation small{display:block;color:var(--muted);font-size:9px}.brain-generation b{font-size:16px}.brain-being.thinking,.brain-being.challenging{box-shadow:inset 0 0 30px color-mix(in srgb,var(--accent) 10%,transparent),0 0 18px color-mix(in srgb,var(--accent) 12%,transparent)}.brain-being.sleeping{filter:saturate(.35);opacity:.72}.brain-league-card{border-color:color-mix(in srgb,var(--accent) 40%,var(--border))!important}@keyframes brainHeart{0%,100%{transform:scale(.96)}45%{transform:scale(1.08)}60%{transform:scale(1)}}@keyframes brainRing{0%{transform:scale(.55);opacity:.7}80%,100%{transform:scale(1.35);opacity:0}}@keyframes synapseBlink{0%,100%{opacity:.2;transform:scale(.7)}45%{opacity:1;transform:scale(1.35)}}@keyframes brainWave{0%,100%{height:4px;opacity:.35}50%{height:18px;opacity:1}}@keyframes brainDrift{0%,100%{transform:translateX(-8%);opacity:.45}50%{transform:translateX(8%);opacity:.8}}@media(max-width:620px){.brain-being{grid-template-columns:70px minmax(0,1fr)}.brain-generation{display:none}.brainlife-mini{max-width:42px}.brain-mini-copy{display:none}}@media(prefers-reduced-motion:reduce){.brain-mini-core,.brain-mini-core:after,.brain-core>span,.brain-core:before,.brain-core:after,.synapse,.neural-wave i,.brain-being:after{animation:none!important}} ';

  // ---------------------------------------------------------------------------
  // 2.13.0 Brain Diary · deterministic learning journal, zero extra AI cost
  // ---------------------------------------------------------------------------
  function v212DiarySanitize(e){
    if(!e||typeof e!=='object')return null;var tone=['good','bad','warn','learn','neutral'].indexOf(String(e.tone))>=0?String(e.tone):'neutral';
    return {id:safeString(e.id||('d-'+Number(e.at||clock())+'-'+Math.floor(Math.random()*100000)),96),at:Number(e.at)||clock(),kind:safeString(e.kind||'note',40),tone:tone,icon:safeString(e.icon||'🧠',8),title:safeString(e.title||'Brain-Eintrag',140),detail:safeString(e.detail||'',700),action:safeString(e.action||'',40),target:safeString(e.target||'',80),reward:isFinite(Number(e.reward))?v210Round(Number(e.reward),5):null,generation:Number(e.generation)||0,source:safeString(e.source||'',40)};
  }
  S.brainDiary=(read('brainDiaryV212',[])||[]).map(v212DiarySanitize).filter(Boolean).slice(-C.brainDiaryMaxEntries);
  S.brainDiaryMeta=read('brainDiaryMetaV212',{day:v210UtcDay(),dayStartSamples:Number(S.brainStudent.samples)||0,dayStartOutcomes:Number(S.brain.outcomes)||0,dayStartPromotions:Number(S.brainLeague.promotions)||0,dayStartRollbacks:Number(S.brainLeague.rollbacks)||0});
  if(!S.brainDiaryMeta||typeof S.brainDiaryMeta!=='object')S.brainDiaryMeta={day:v210UtcDay(),dayStartSamples:Number(S.brainStudent.samples)||0,dayStartOutcomes:Number(S.brain.outcomes)||0,dayStartPromotions:Number(S.brainLeague.promotions)||0,dayStartRollbacks:Number(S.brainLeague.rollbacks)||0};
  function v212DiaryPersist(){write('brainDiaryV212',S.brainDiary.slice(-C.brainDiaryMaxEntries));write('brainDiaryMetaV212',S.brainDiaryMeta);}
  function v212DiaryAdd(kind,title,detail,data){if(!C.brainDiaryEnabled)return null;data=data||{};var now=clock(),seed=String(kind)+'|'+String(data.sourceSeq||'')+'|'+String(data.id||'')+'|'+String(title||'')+'|'+Math.floor(now/1000),entry=v212DiarySanitize({id:'d-'+v210Hash(seed).toString(36)+'-'+now.toString(36),at:now,kind:kind,tone:data.tone||'neutral',icon:data.icon||'🧠',title:title,detail:detail,action:data.action||'',target:data.target||'',reward:data.reward,generation:data.generation||0,source:data.source||''});if(!entry)return null;if(S.brainDiary.some(function(x){return x&&x.id===entry.id;}))return null;S.brainDiary.push(entry);if(S.brainDiary.length>C.brainDiaryMaxEntries)S.brainDiary.splice(0,S.brainDiary.length-C.brainDiaryMaxEntries);v212DiaryPersist();return entry;}
  function v212FmtRate(n){n=Number(n)||0;return Math.round(n).toLocaleString?Math.round(n).toLocaleString('de-DE'):String(Math.round(n));}
  function v212DiaryFromAudit(kind,message,data,level,ev){if(!C.brainDiaryEnabled||!kind)return;data=data&&typeof data==='object'?data:{};var seq=ev&&ev.data&&ev.data.seq||data.seq||0,d=data.decision||{},lesson=safeString(d.lesson||'',500),reasonText=safeString(d.reason||data.reason||message||'',500),action=String(d.action||data.action||''),target=String(d.target||data.target||''),gen=Number(data.generation||data.toGeneration||data.fromGeneration)||0;
    if(kind==='brain_decision'&&d.action){v212DiaryAdd('teacher','Teacher-Lektion · '+d.action,lesson||reasonText,{tone:'learn',icon:'🎓',action:d.action,target:d.target,reward:null,source:'teacher',sourceSeq:seq});return;}
    if(kind==='brain_outcome'){var r=Number(data.reward)||0,b=data.before||{},a=data.after||{},delta='EXP/h '+v212FmtRate(b.xp)+' → '+v212FmtRate(a.xp)+' · Gold/h '+v212FmtRate(b.gold)+' → '+v212FmtRate(a.gold)+' · Sicherheit '+Math.round(Number(b.safety)||0)+' → '+Math.round(Number(a.safety)||0)+'% · freie Plätze '+Number(b.free||0)+' → '+Number(a.free||0);v212DiaryAdd('outcome',r>=.12?'Strategie bestätigt':r<=-.12?'Strategie war nachteilig':'Strategie ausgewertet',String(data.action||'Strategie')+(data.target?' · '+data.target:'')+' · Reward '+(r>=0?'+':'')+v210Round(r,3)+' · '+delta,{tone:r>=.12?'good':r<=-.12?'bad':'neutral',icon:r>=.12?'✓':r<=-.12?'⚠':'◌',action:data.action,target:data.target,reward:r,source:data.source||'outcome',sourceSeq:seq});return;}
    if(kind==='brain_student_apply'||kind==='brain_policy_apply'){var role=String(data.role||'student'),g=Number(data.generation)||0;v212DiaryAdd('autonomy',(role==='challenger'?'Challenger':role==='probation'?'Champion auf Bewährung':role==='champion'?'Champion':'Student')+' entschied selbst',String(data.action||'')+(data.target?' · '+data.target:'')+' · Confidence '+Math.round((Number(data.confidence)||0)*1000)/10+'%'+(g?' · Generation #'+g:''),{tone:'learn',icon:'⚡',action:data.action,target:data.target,generation:g,source:role,sourceSeq:seq});return;}
    if(kind==='brain_challenger_start'){v212DiaryAdd('challenge','Neuer Challenger #'+Number(data.generation||0),'Canary-Test gestartet · Validierungs-Loss Champion '+v210Round(data.championLoss,4)+' vs. Challenger '+v210Round(data.challengerLoss,4)+' · Traffic '+Number(data.trafficPct||0)+'%',{tone:'learn',icon:'🧪',generation:data.generation,source:'league',sourceSeq:seq});return;}
    if(kind==='brain_challenger_reject'){v212DiaryAdd('reject','Challenger verworfen',reasonText||'Der Kandidat war nicht stabil genug.',{tone:'warn',icon:'✕',source:'league',sourceSeq:seq});return;}
    if(kind==='brain_champion_promote'){v212DiaryAdd('promotion','Neuer Champion #'+Number(data.generation||0),'Generation #'+Number(data.previousGeneration||0)+' wurde abgelöst. '+reasonText,{tone:'good',icon:'🏆',generation:data.generation,source:'league',sourceSeq:seq});return;}
    if(kind==='brain_champion_rollback'){v212DiaryAdd('rollback','Automatischer Rollback auf Champion #'+Number(data.toGeneration||0),'Generation #'+Number(data.fromGeneration||0)+' wurde zurückgenommen. '+reasonText,{tone:'bad',icon:'↩',generation:data.toGeneration,source:'league',sourceSeq:seq});return;}
    if(kind==='brain_champion_confirm'){v212DiaryAdd('confirmed','Champion #'+Number(data.generation||0)+' bestätigt',reasonText||'Die Bewährungsphase wurde erfolgreich abgeschlossen.',{tone:'good',icon:'◆',generation:data.generation,source:'league',sourceSeq:seq});return;}
    if(kind==='brain_champion'){v212DiaryAdd('first_champion','Erster Champion #'+Number(data.generation||1),'Das Shadow-Netz hat das Qualitätsgate bestanden und wird als eingefrorene Policy genutzt.',{tone:'good',icon:'🏆',generation:data.generation||1,source:'league',sourceSeq:seq});return;}
    if(kind==='brain_error'){v212DiaryAdd('error','Teacher vorübergehend nicht erreichbar',safeString(data.error||message||'',500),{tone:'warn',icon:'!',source:'system',sourceSeq:seq});return;}
    if(kind==='brain_budget'&&Number(data.used)>=Number(data.target||data.limit||Infinity)*.98){v212DiaryAdd('budget','Teacher-Budget für heute nahezu ausgeschöpft',Math.round(Number(data.used)||0)+' / '+Math.round(Number(data.limit)||10000)+' Neurons · Student und lokale Sicherheitslogik lernen/arbeiten weiter.',{tone:'neutral',icon:'◷',source:'budget',sourceSeq:seq});}
  }
  var v212AuditBase=audit;
  audit=function(kind,message,data,level){var ev=v212AuditBase(kind,message,data,level);try{v212DiaryFromAudit(kind,message,data,level,ev);}catch(e){}return ev;};
  var v212UtcBase=v210SyncUtcDay;
  v210SyncUtcDay=function(){var oldDay=String(S.brain.day||v210UtcDay()),before={samples:Number(S.brainStudent.samples)||0,outcomes:Number(S.brain.outcomes)||0,promotions:Number(S.brainLeague.promotions)||0,rollbacks:Number(S.brainLeague.rollbacks)||0},changed=v212UtcBase();if(changed){var meta=S.brainDiaryMeta||{},sampleGain=Math.max(0,before.samples-Number(meta.dayStartSamples||0)),outcomeGain=Math.max(0,before.outcomes-Number(meta.dayStartOutcomes||0)),promoGain=Math.max(0,before.promotions-Number(meta.dayStartPromotions||0)),rollbackGain=Math.max(0,before.rollbacks-Number(meta.dayStartRollbacks||0));v212DiaryAdd('day_summary','Lerntag '+oldDay+' abgeschlossen',sampleGain+' neue Lernbeispiele · '+outcomeGain+' bewertete Entscheidungen · '+promoGain+' Promotion(s) · '+rollbackGain+' Rollback(s)',{tone:rollbackGain?'warn':'neutral',icon:'☀',source:'daily'});S.brainDiaryMeta={day:v210UtcDay(),dayStartSamples:before.samples,dayStartOutcomes:before.outcomes,dayStartPromotions:before.promotions,dayStartRollbacks:before.rollbacks};v212DiaryPersist();}return changed;};
  function v212DiaryStats(){var day=v210UtcDay(),today=S.brainDiary.filter(function(e){return new Date(Number(e.at)||0).toISOString().slice(0,10)===day;}),pos=today.filter(function(e){return e.tone==='good';}).length,neg=today.filter(function(e){return e.tone==='bad'||e.tone==='warn';}).length,lessons=today.filter(function(e){return e.kind==='teacher';}).length;return {today:today.length,positive:pos,negative:neg,teacherLessons:lessons,total:S.brainDiary.length,lastAt:S.brainDiary.length?Number(S.brainDiary[S.brainDiary.length-1].at)||0:0};}
  function v212DiaryHTML(){var rows=S.brainDiary.slice(-12).reverse(),st=v212DiaryStats();var html=rows.length?rows.map(function(e){return '<div class="brain-diary-entry '+esc(e.tone)+'"><span class="brain-diary-icon">'+esc(e.icon)+'</span><div><b>'+esc(e.title)+'</b><small>'+new Date(e.at).toLocaleString()+(e.reward!=null?' · Reward '+(e.reward>=0?'+':'')+Number(e.reward).toFixed(3):'')+'</small><p>'+esc(e.detail)+'</p></div></div>';}).join(''):'<div class="muted">Noch keine Tagebucheinträge. Das Brain schreibt erst nach realen Lern- und Entscheidungssignalen.</div>';return '<div class="card brain-diary-card"><h3>📖 Gehirn-Tagebuch</h3><div class="line"><span>Heute / Teacher-Lektionen</span><strong>'+st.today+' / '+st.teacherLessons+'</strong></div><div class="line"><span>Positive / Warnsignale</span><strong>'+st.positive+' / '+st.negative+'</strong></div><div class="brain-diary-list">'+html+'</div></div>';}
  function v212DiaryMerge(remote){var rows=remote&&Array.isArray(remote.entries)?remote.entries:[],all=S.brainDiary.concat(rows.map(v212DiarySanitize).filter(Boolean)),seen={},out=[];all.sort(function(a,b){return Number(a.at)-Number(b.at);});all.forEach(function(e){if(!e||seen[e.id])return;seen[e.id]=1;out.push(e);});S.brainDiary=out.slice(-C.brainDiaryMaxEntries);if(remote&&remote.meta&&typeof remote.meta==='object'&&String(remote.meta.day||'')>=String((S.brainDiaryMeta||{}).day||''))S.brainDiaryMeta=remote.meta;v212DiaryPersist();return true;}
  var v212StudentExportBase=v210StudentExport;
  v210StudentExport=function(){var x=v212StudentExportBase();x.diary={schema:1,entries:S.brainDiary.slice(-C.brainDiaryMaxEntries),meta:S.brainDiaryMeta,stats:v212DiaryStats(),updatedAt:v212DiaryStats().lastAt};x.telemetry=x.telemetry||{};x.telemetry.diary=S.brainDiary.slice(-6);x.telemetry.diaryStats=v212DiaryStats();return x;};
  var v212StudentImportBase=v210StudentImport;
  v210StudentImport=function(remote){if(remote&&remote.diary)v212DiaryMerge(remote.diary);return v212StudentImportBase(remote);};
  var v212TelemetryBase=v210BrainTelemetry;
  v210BrainTelemetry=function(){var x=v212TelemetryBase();x.diary=S.brainDiary.slice(-6);x.diaryStats=v212DiaryStats();return x;};
  var v212BrainHTMLBase=v290BrainHTML;
  v290BrainHTML=function(){return v212BrainHTMLBase()+cfgField('brainDiaryEnabled','Gehirn-Tagebuch aktiv','check','Erzeugt überprüfbare Einträge ausschließlich aus bereits vorhandenen Lernereignissen; verbraucht keine zusätzlichen Workers-AI-Neurons.')+cfgField('brainDiaryMaxEntries','Tagebuch-Einträge behalten','number','20–200 Einträge; die Cloud synchronisiert denselben Verlauf zwischen Geräten.')+v212DiaryHTML();};
  CSS+=' .brain-diary-card{border-color:color-mix(in srgb,var(--accent) 35%,var(--border))!important}.brain-diary-list{display:grid;gap:7px;max-height:430px;overflow:auto;margin-top:9px}.brain-diary-entry{display:grid;grid-template-columns:30px minmax(0,1fr);gap:8px;padding:8px;border:1px solid var(--line);border-radius:9px;background:color-mix(in srgb,var(--panel2) 76%,transparent)}.brain-diary-entry.good{border-color:color-mix(in srgb,#71e2b7 40%,var(--line))}.brain-diary-entry.bad{border-color:color-mix(in srgb,#ff6473 50%,var(--line))}.brain-diary-entry.warn{border-color:color-mix(in srgb,#ffc85a 45%,var(--line))}.brain-diary-entry.learn{border-color:color-mix(in srgb,var(--accent) 48%,var(--line))}.brain-diary-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:color-mix(in srgb,var(--accent) 12%,var(--panel));font-size:15px}.brain-diary-entry b{display:block;font-size:11px}.brain-diary-entry small{display:block;color:var(--muted);font-size:8px;margin-top:2px}.brain-diary-entry p{margin:4px 0 0;font-size:9px;line-height:1.4;color:color-mix(in srgb,var(--text) 86%,var(--muted))} ';


  // ---------------------------------------------------------------------------
  // 2.13.0 Learning Quality Monitor · calibration, drift, quarantine, recovery
  // ---------------------------------------------------------------------------
  function v213QualityNew(){return {schema:1,status:'warming',score:50,history:[],recentReward:0,baselineReward:0,rewardDrop:0,recentConfidence:0,baselineConfidence:0,confidenceGain:0,overconfidenceFailureRate:0,instability:0,lossDrift:0,safetyIncidents:0,teacherBoost:1,learningRateScale:1,autonomyBlocked:true,canaryBlocked:true,blockedUntil:0,lastReason:'Sammelt Qualitätsdaten',lastAt:0,lastStatusAt:clock(),lastHealthyAt:0,healthyGeneration:0,healthyChampion:null,interventions:0,recoveries:0,updatedAt:clock()};}
  function v213QualityLoad(){var q=read('brainQualityV213',null);if(!q||q.schema!==1)q=v213QualityNew();q.history=Array.isArray(q.history)?q.history.slice(-64):[];q.healthyChampion=v210StudentValid(q.healthyChampion)?q.healthyChampion:null;q.status=['warming','healthy','watch','degraded','quarantine'].indexOf(String(q.status))>=0?String(q.status):'warming';q.score=clamp(Number(q.score)||50,0,100);q.teacherBoost=clamp(Number(q.teacherBoost)||1,1,3);q.learningRateScale=clamp(Number(q.learningRateScale)||1,.1,1);return q;}
  S.brainQuality=v213QualityLoad();
  function v213QAvg(a,key){var rows=(a||[]).map(function(x){return key?Number(x&&x[key]):Number(x);}).filter(isFinite);return rows.length?rows.reduce(function(p,q){return p+q;},0)/rows.length:0;}
  function v213QStd(a,key){var rows=(a||[]).map(function(x){return key?Number(x&&x[key]):Number(x);}).filter(isFinite);if(rows.length<2)return 0;var avg=v213QAvg(rows),v=rows.reduce(function(n,x){var d=x-avg;return n+d*d;},0)/rows.length;return Math.sqrt(v);}
  function v213QualityPersist(){S.brainQuality.updatedAt=clock();S.brainQuality.history=S.brainQuality.history.slice(-Math.max(12,Number(C.brainQualityWindow)||24));write('brainQualityV213',S.brainQuality);}
  function v213QualityLearningRateScale(){if(!C.brainQualityMonitorEnabled||!S.brainQuality)return 1;return clamp(Number(S.brainQuality.learningRateScale)||1,.1,1);}
  function v213QualityTeacherBoost(){if(!C.brainQualityMonitorEnabled||!S.brainQuality)return 1;return clamp(Number(S.brainQuality.teacherBoost)||1,1,3);}
  function v213QualityConfidenceBoostPct(){if(!C.brainQualityMonitorEnabled||!S.brainQuality)return 0;return S.brainQuality.status==='watch'?4:0;}
  function v213QualityAutonomyAllowed(){if(!C.brainQualityMonitorEnabled||!S.brainQuality)return true;return !S.brainQuality.autonomyBlocked&&clock()>=Number(S.brainQuality.blockedUntil||0)&&['healthy','watch'].indexOf(S.brainQuality.status)>=0;}
  function v213QualityCanChallenge(){if(!C.brainQualityMonitorEnabled||!S.brainQuality)return true;return S.brainQuality.status==='healthy'&&clock()>=Number(S.brainQuality.blockedUntil||0);}
  function v213QualityCanaryAllowed(){return v213QualityCanChallenge();}
  function v213QualitySnapshotHealthy(){var q=S.brainQuality,l=S.brainLeague;if(!q||!l||!l.champion||l.status!=='champion'||!v210StudentValid(l.champion))return false;var gen=Number(l.generation)||0;if(q.healthyGeneration&&Number(q.healthyGeneration)!==gen){var need=Math.max(Number(C.brainQualityMinOutcomes)||12,(Number(C.brainChallengeMinOutcomes)||8)*2),rows=q.history.filter(function(x){return Number(x.generation)===gen&&(x.role==='champion'||x.role==='probation');}),avg=v213QAvg(rows,'reward'),floor=Number(q.baselineReward||0)-Math.max(.05,Number(C.brainQualityRewardDropPct||15)/200);if(rows.length<need||avg<floor)return false;}q.healthyChampion=v211CloneModel(l.champion);q.healthyGeneration=gen;q.lastHealthyAt=clock();return true;}
  function v213QualityRestoreHealthy(reasonText){var q=S.brainQuality,l=S.brainLeague;if(!q||!l||!v210StudentValid(q.healthyChampion)||!Number(q.healthyGeneration)||Number(q.healthyGeneration)===Number(l.generation))return false;var from=Number(l.generation)||0;l.champion=v211CloneModel(q.healthyChampion);l.generation=Number(q.healthyGeneration)||1;l.championRewardEma=Number(q.baselineReward)||Number(l.championRewardEma)||0;l.previousChampion=null;l.previousGeneration=0;l.previousRewardEma=0;l.candidate=null;l.candidateGeneration=0;l.challenge={active:false,startedAt:0,championRewards:[],challengerRewards:[],safetyIncidents:0,championLoss:0,challengerLoss:0};l.probation={active:false,startedAt:0,baselineReward:0,rewards:[],safetyIncidents:0};l.status='champion';l.rollbacks=(Number(l.rollbacks)||0)+1;v211SetEvent('quality_rollback',reasonText);audit('brain_quality_rollback','Lernqualitäts-Wächter stellt letzten gesunden Champion wieder her',{fromGeneration:from,toGeneration:l.generation,reason:reasonText,rollbacks:l.rollbacks},'warning');v211PostLeagueEvent('rollback',reasonText,-1);return true;}
  function v213QualityDiary(status,reasonText){
    if(status==='healthy')v212DiaryAdd('quality_recovery','Lernqualität wieder gesund',reasonText,{tone:'good',icon:'♥',source:'quality'});
    else if(status==='watch')v212DiaryAdd('quality_watch','Brain beobachtet sich selbst',reasonText,{tone:'warn',icon:'◉',source:'quality'});
    else if(status==='degraded')v212DiaryAdd('quality_degraded','Lernqualität verschlechtert',reasonText,{tone:'warn',icon:'⚠',source:'quality'});
    else if(status==='quarantine')v212DiaryAdd('quality_quarantine','Brain-Autonomie in Quarantäne',reasonText,{tone:'bad',icon:'⛨',source:'quality'});
  }
  function v213QualityControls(status){
    var q=S.brainQuality;
    if(status==='healthy'){q.teacherBoost=1;q.learningRateScale=1;q.autonomyBlocked=false;q.canaryBlocked=false;}
    else if(status==='watch'){q.teacherBoost=1.3;q.learningRateScale=.75;q.autonomyBlocked=false;q.canaryBlocked=true;}
    else if(status==='degraded'){q.teacherBoost=1.8;q.learningRateScale=.42;q.autonomyBlocked=true;q.canaryBlocked=true;q.blockedUntil=Math.max(Number(q.blockedUntil)||0,clock()+Number(C.brainQualityCooldownMinutes||20)*60000);}
    else if(status==='quarantine'){q.teacherBoost=2.4;q.learningRateScale=.18;q.autonomyBlocked=true;q.canaryBlocked=true;q.blockedUntil=Math.max(Number(q.blockedUntil)||0,clock()+Number(C.brainQualityCooldownMinutes||20)*60000);}
    else {q.teacherBoost=1.15;q.learningRateScale=.9;q.autonomyBlocked=true;q.canaryBlocked=true;}
  }
  function v213QualityEvaluate(){
    var q=S.brainQuality,window=Math.max(12,Number(C.brainQualityWindow)||24),min=Math.max(8,Math.min(window,Number(C.brainQualityMinOutcomes)||12)),rows=q.history.slice(-window),oldStatus=q.status,status='warming',reasonText='Sammelt '+rows.length+' / '+min+' Qualitäts-Outcomes',score=50;
    if(rows.length>=min){
      var half=Math.max(4,Math.floor(Math.min(rows.length,window)/2)),recent=rows.slice(-half),baseline=rows.slice(-Math.min(rows.length,half*2),-half);if(!baseline.length)baseline=rows.slice(0,Math.max(1,rows.length-half));
      var rr=v213QAvg(recent,'reward'),br=v213QAvg(baseline,'reward'),rc=v213QAvg(recent,'confidence'),bc=v213QAvg(baseline,'confidence'),drop=br-rr,overThr=Number(C.brainQualityOverconfidencePct||88)/100,hi=recent.filter(function(x){return Number(x.confidence)>=overThr;}),overFails=hi.length?hi.filter(function(x){return Number(x.reward)<-.10;}).length/hi.length:0,inst=v213QStd(recent,'reward'),rl=v213QAvg(recent,'loss'),bl=v213QAvg(baseline,'loss'),lossDrift=bl>0?Math.max(0,(rl-bl)/Math.max(.05,bl)):0,safety=recent.filter(function(x){return x.fatal||Number(x.safetyDelta)<-35||x.partyLost;}).length,confGain=rc-bc,limit=Math.max(.05,Number(C.brainQualityRewardDropPct||15)/100),reasons=[];
      q.recentReward=rr;q.baselineReward=br;q.rewardDrop=drop;q.recentConfidence=rc;q.baselineConfidence=bc;q.confidenceGain=confGain;q.overconfidenceFailureRate=overFails;q.instability=inst;q.lossDrift=lossDrift;q.safetyIncidents=safety;
      if(drop>limit*.5)reasons.push('Reward-Trend '+v210Round(br,3)+' → '+v210Round(rr,3));
      if(overFails>=.20)reasons.push(Math.round(overFails*100)+'% Fehlentscheidungen trotz hoher Confidence');
      if(confGain>.08&&rr<=br)reasons.push('Confidence steigt ohne Reward-Fortschritt');
      if(lossDrift>.15)reasons.push('Loss-Drift +'+Math.round(lossDrift*100)+'%');
      if(inst>.50)reasons.push('instabile Rewards σ '+v210Round(inst,3));
      if(safety)reasons.push(safety+' Sicherheitsvorfall/-verluste im Fenster');
      score=100-Math.min(45,Math.max(0,drop)*180)-overFails*35-Math.max(0,confGain-(rr>br?0:.04))*90-Math.min(20,lossDrift*25)-Math.max(0,inst-.35)*30-Math.min(50,safety*35);score=clamp(Math.round(score),0,100);
      if(safety>0||drop>=limit*1.6||(overFails>=.5&&rr<0))status='quarantine';
      else if(drop>=limit||overFails>=.35||lossDrift>=.35||inst>=.65)status='degraded';
      else if(drop>=limit*.5||overFails>=.20||lossDrift>=.15||(confGain>.08&&rr<=br)||inst>=.50)status='watch';
      else status='healthy';
      reasonText=reasons.length?reasons.join(' · '):'Reward, Confidence und Loss entwickeln sich konsistent.';
    }
    q.score=score;q.status=status;q.lastReason=safeString(reasonText,600);q.lastAt=clock();if(status!==oldStatus){q.lastStatusAt=clock();if(status==='healthy'&&oldStatus!=='healthy')q.recoveries=(Number(q.recoveries)||0)+1;if(status==='degraded'||status==='quarantine')q.interventions=(Number(q.interventions)||0)+1;v213QualityDiary(status,reasonText);}
    v213QualityControls(status);
    if(status==='healthy')v213QualitySnapshotHealthy();
    if((status==='degraded'||status==='quarantine')&&S.brainLeague){
      if(S.brainLeague.challenge&&S.brainLeague.challenge.active)v211RejectCandidate('Lernqualitäts-Wächter stoppte Canary: '+reasonText);
      if(S.brainLeague.probation&&S.brainLeague.probation.active)v211Rollback('Lernqualitäts-Wächter stoppte Bewährung: '+reasonText);
      if(status==='quarantine')v213QualityRestoreHealthy('Qualitäts-Quarantäne: '+reasonText);
    }
    v213QualityPersist();return q;
  }
  function v213QualityObserve(row,reward,before,after){
    if(!C.brainQualityMonitorEnabled)return;var q=S.brainQuality||v213QualityNew(),rec={at:clock(),reward:v210Round(Number(reward)||0,5),confidence:v210Round(Number(row&&row.confidence)||0,5),source:safeString(row&&row.source||'',24),role:safeString(row&&row.policyRole||'',24),generation:Number(row&&row.policyGeneration)||0,safetyDelta:v210Round((Number(after&&after.safety)||0)-(Number(before&&before.safety)||0),3),fatal:!!(before&&!before.rip&&after&&after.rip),partyLost:!!(before&&before.partyComplete&&after&&!after.partyComplete),loss:v210Round(Number(S.brainStudent&&S.brainStudent.lossEma)||0,6),agreement:v210Round(Number(S.brainStudent&&S.brainStudent.agreementEma)||0,5)};
    q.history.push(rec);q.history=q.history.slice(-Math.max(12,Number(C.brainQualityWindow)||24));S.brainQuality=q;v213QualityEvaluate();
  }
  function v213QualitySummary(){var q=S.brainQuality||v213QualityNew();return {enabled:!!C.brainQualityMonitorEnabled,status:q.status,score:Number(q.score)||0,outcomes:q.history.length,recentReward:v210Round(q.recentReward,5),baselineReward:v210Round(q.baselineReward,5),rewardDrop:v210Round(q.rewardDrop,5),recentConfidence:v210Round(q.recentConfidence,5),baselineConfidence:v210Round(q.baselineConfidence,5),confidenceGain:v210Round(q.confidenceGain,5),overconfidenceFailureRate:v210Round(q.overconfidenceFailureRate,5),instability:v210Round(q.instability,5),lossDrift:v210Round(q.lossDrift,5),safetyIncidents:Number(q.safetyIncidents)||0,teacherBoost:v210Round(q.teacherBoost,2),learningRateScale:v210Round(q.learningRateScale,2),autonomyAllowed:v213QualityAutonomyAllowed(),canaryAllowed:v213QualityCanaryAllowed(),blockedSeconds:Math.max(0,Math.ceil((Number(q.blockedUntil||0)-clock())/1000)),lastReason:safeString(q.lastReason,600),lastAt:Number(q.lastAt)||0,lastHealthyAt:Number(q.lastHealthyAt)||0,healthyGeneration:Number(q.healthyGeneration)||0,interventions:Number(q.interventions)||0,recoveries:Number(q.recoveries)||0};}
  function v213QualityExport(){var q=S.brainQuality||v213QualityNew();return {schema:1,status:q.status,score:q.score,history:q.history.slice(-Math.max(12,Number(C.brainQualityWindow)||24)),recentReward:q.recentReward,baselineReward:q.baselineReward,rewardDrop:q.rewardDrop,recentConfidence:q.recentConfidence,baselineConfidence:q.baselineConfidence,confidenceGain:q.confidenceGain,overconfidenceFailureRate:q.overconfidenceFailureRate,instability:q.instability,lossDrift:q.lossDrift,safetyIncidents:q.safetyIncidents,teacherBoost:q.teacherBoost,learningRateScale:q.learningRateScale,autonomyBlocked:q.autonomyBlocked,canaryBlocked:q.canaryBlocked,blockedUntil:q.blockedUntil,lastReason:q.lastReason,lastAt:q.lastAt,lastStatusAt:q.lastStatusAt,lastHealthyAt:q.lastHealthyAt,healthyGeneration:q.healthyGeneration,healthyChampion:v210StudentValid(q.healthyChampion)?v211CloneModel(q.healthyChampion):null,interventions:q.interventions,recoveries:q.recoveries,updatedAt:q.updatedAt};}
  function v213QualityImport(remote){var x=remote&&remote.quality;if(!x||x.schema!==1||Number(x.updatedAt||0)<=Number(S.brainQuality&&S.brainQuality.updatedAt||0))return false;var q=v213QualityNew();Object.keys(q).forEach(function(k){if(k in x)q[k]=x[k];});q.history=Array.isArray(x.history)?x.history.slice(-64):[];q.healthyChampion=v210StudentValid(x.healthyChampion)?x.healthyChampion:null;S.brainQuality=q;v213QualityPersist();audit('brain_quality_pull','Lernqualitäts-Zustand aus Cloud übernommen',{status:q.status,score:q.score,outcomes:q.history.length});return true;}
  var v213RecordOutcomeBase=v211RecordOutcome;
  v211RecordOutcome=function(row,reward,before,after){var r=v213RecordOutcomeBase(row,reward,before,after);try{v213QualityObserve(row,reward,before,after);}catch(e){audit('brain_quality_error','Lernqualitäts-Auswertung fehlgeschlagen',{error:reason(e)},'warning');}return r;};
  var v213StudentExportBase=v210StudentExport;
  v210StudentExport=function(){var x=v213StudentExportBase();x.quality=v213QualityExport();x.telemetry=x.telemetry||{};x.telemetry.quality=v213QualitySummary();return x;};
  var v213StudentImportBase=v210StudentImport;
  v210StudentImport=function(remote){if(remote&&remote.quality)v213QualityImport(remote);return v213StudentImportBase(remote);};
  var v213TelemetryBase=v210BrainTelemetry;
  v210BrainTelemetry=function(){var x=v213TelemetryBase();x.quality=v213QualitySummary();return x;};
  var v213LifeBase=v211LifeState;
  v211LifeState=function(){var x=v213LifeBase(),q=v213QualitySummary();if(!q.enabled)return x;if(q.status==='quarantine')return {state:'guarding',label:'schützt sich vor Falschlernen',detail:q.lastReason,intensity:.9,beatMs:760,lastEvent:'quality_quarantine',lastEventAt:q.lastAt};if(q.status==='degraded')return {state:'reflecting',label:'zweifelt an seiner Strategie',detail:q.lastReason,intensity:.8,beatMs:900,lastEvent:'quality_degraded',lastEventAt:q.lastAt};if(q.status==='watch')return {state:'reflecting',label:'prüft seine eigene Sicherheit',detail:q.lastReason,intensity:.65,beatMs:1080,lastEvent:'quality_watch',lastEventAt:q.lastAt};return x;};
  var v213BrainHTMLBase=v290BrainHTML;
  v290BrainHTML=function(){var base=v213BrainHTMLBase(),q=v213QualitySummary(),tone=q.status==='healthy'?'good':q.status==='watch'||q.status==='warming'?'warn':'danger';return base+cfgField('brainQualityMonitorEnabled','Lernqualität automatisch überwachen','check','Vergleicht Confidence, Reward, Loss und Sicherheitsfolgen. Bei Falschlernen werden Lernrate, Teacher-Häufigkeit, Canary und Autonomie automatisch angepasst.')+cfgField('brainQualityWindow','Qualitätsfenster Outcomes','number','12–64 letzte bewertete Entscheidungen.')+cfgField('brainQualityMinOutcomes','Mindest-Outcomes für Bewertung','number','8–32. Vorher befindet sich das Qualitätsmodul in der Aufwärmphase.')+cfgField('brainQualityOverconfidencePct','Overconfidence ab (%)','number','Hohe Confidence mit negativem realem Reward gilt als Kalibrierungsfehler.')+cfgField('brainQualityRewardDropPct','Warnung bei Reward-Abfall (%)','number','5–40 Prozentpunkte auf der Reward-Skala.')+cfgField('brainQualityCooldownMinutes','Quarantäne-Cooldown (Min.)','number','Autonomie bleibt nach einer deutlichen Verschlechterung mindestens so lange blockiert.')+'<div class="card brain-quality-card '+tone+'"><h3>🩺 Lernqualität · Selbstkontrolle</h3><div class="line"><span>Status / Score</span><strong>'+esc(q.status)+' · '+Math.round(q.score)+'/100</strong></div><div class="line"><span>Reward aktuell / Basis</span><strong>'+Number(q.recentReward).toFixed(3)+' / '+Number(q.baselineReward).toFixed(3)+'</strong></div><div class="line"><span>Confidence aktuell / Basis</span><strong>'+Math.round(Number(q.recentConfidence)*1000)/10+'% / '+Math.round(Number(q.baselineConfidence)*1000)/10+'%</strong></div><div class="line"><span>Overconfidence-Fehler</span><strong>'+Math.round(Number(q.overconfidenceFailureRate)*1000)/10+'%</strong></div><div class="line"><span>Reward-Instabilität</span><strong>σ '+Number(q.instability).toFixed(3)+'</strong></div><div class="line"><span>Loss-Drift</span><strong>'+Math.round(Number(q.lossDrift)*100)+'%</strong></div><div class="line"><span>Teacher-Verstärkung / Lernrate</span><strong>×'+Number(q.teacherBoost).toFixed(2)+' / ×'+Number(q.learningRateScale).toFixed(2)+'</strong></div><div class="line"><span>Autonomie / Canary</span><strong>'+(q.autonomyAllowed?'frei':'blockiert')+' / '+(q.canaryAllowed?'frei':'blockiert')+'</strong></div><div class="line"><span>Gesunder Snapshot</span><strong>'+(q.healthyGeneration?'Champion #'+q.healthyGeneration:'—')+'</strong></div><div class="line"><span>Eingriffe / Erholungen</span><strong>'+q.interventions+' / '+q.recoveries+'</strong></div>'+(q.blockedSeconds?'<div class="notice warn">Autonomie-Cooldown noch '+Math.ceil(q.blockedSeconds/60)+' Min.</div>':'')+'<div class="muted">'+esc(q.lastReason||'')+'</div></div>';};
  CSS+=' .brain-quality-card{border-color:color-mix(in srgb,var(--accent) 38%,var(--border))!important}.brain-quality-card.good{box-shadow:inset 3px 0 0 #71e2b7}.brain-quality-card.warn{box-shadow:inset 3px 0 0 #ffc85a}.brain-quality-card.danger{box-shadow:inset 3px 0 0 #ff6473}.brain-being.reflecting{box-shadow:inset 0 0 36px color-mix(in srgb,#ffc85a 12%,transparent),0 0 18px color-mix(in srgb,#ffc85a 10%,transparent)} ';
  v213QualityEvaluate();


  // ---------------------------------------------------------------------------
  // 2.14.0 AiO Research Bridge · compact, redacted prompts for higher-level review
  // ---------------------------------------------------------------------------
  var V214_RESEARCH_PROFILES={
    overall:{label:'Gesamtanalyse',task:'Bewerte den Gesamtzustand des AiO-Bots. Suche nach den wichtigsten Hebeln für 24/7-Stabilität, EXP/h, Gold/h, Lernqualität und Wartbarkeit.'},
    errors:{label:'Fehleranalyse',task:'Analysiere wiederkehrende Fehler, Loops, Blockaden und Sicherheitsprobleme. Priorisiere konkrete Root Causes und robuste Code-Fixes.'},
    learning:{label:'Lernanalyse',task:'Analysiere Student, Teacher, Champion/Challenger, Rewards, Kalibrierung und Lernqualität. Finde Falschlernen, Datenlücken und bessere Lernsignale.'},
    farm:{label:'Farmanalyse',task:'Analysiere Farmziele, Zonen, Monster, Konkurrenz, EXP/h, Gold/h und Sicherheit. Schlage datenbegründete Verbesserungen der Farmstrategie vor.'},
    merchant:{label:'Merchant-Analyse',task:'Analysiere Inventardruck, Versorgung, Bank, Upgrade/Compound, Verkauf, Wege und Merchant-Fehler. Suche nach 24/7-tauglichen Optimierungen.'},
    development:{label:'Entwicklungsbrief',task:'Leite konkrete Änderungen für die nächste AiO-Bot-Version ab. Trenne deterministische Codeänderungen von Änderungen am neuronalen Brain und priorisiere nach Nutzen, Risiko und Testbarkeit.'}
  };
  function v214ResearchProfile(id){id=String(id||C.brainResearchProfile||'development');return V214_RESEARCH_PROFILES[id]?id:'development';}
  function v214ResearchAliases(anonymize){var map={},farmer=0,merchant=0;ACCOUNT_CHARS.forEach(function(c){var n=String(c.name||'');if(!n)return;if(!anonymize){map[n]=n;return;}if(String(c.ctype||'')==='merchant'){merchant++;map[n]=merchant===1?'Merchant':'Merchant'+merchant;}else{farmer++;map[n]='Farmer'+farmer;}});if(!map[me])map[me]=anonymize?(character.ctype==='merchant'?'Merchant':'Farmer'+(farmer+1)):me;return map;}
  function v214ResearchSafeText(value,aliases){var x=safeString(value==null?'':value,1800),secrets=[C.webDashboardWriteKey].filter(Boolean);secrets.forEach(function(sec){sec=String(sec);if(sec.length>=4)x=x.split(sec).join('[REDACTED]');});x=x.replace(/\b(WRITE_KEY|READ_KEY|API[_-]?KEY|TOKEN|SECRET|AUTHORIZATION)\b\s*[:=]\s*[^\s,;]+/ig,'$1=[REDACTED]');Object.keys(aliases||{}).sort(function(a,b){return b.length-a.length;}).forEach(function(name){if(name&&aliases[name]!==name)x=x.split(name).join(aliases[name]);});return x;}
  function v214ResearchAuditErrors(cutoff,aliases,profile){var rows=(S.auditRecent||[]).filter(function(e){if(!e||Number(e.at||0)<cutoff)return false;var k=String(e.kind||''),lv=String(e.level||'');if(profile==='merchant'&&!/merchant|inventory|bank|upgrade|compound|scroll|sell|buy|action_error/i.test(k+' '+String(e.message||'')))return false;return lv==='error'||lv==='critical'||lv==='warning'||/error|fail|cant_space|inventory_full|rollback|quarantine/i.test(k+' '+String(e.message||''));}),groups={};rows.forEach(function(e){var msg=v214ResearchSafeText(e.message||e.kind,aliases),cls=v214ResearchSafeText(e.data&&(e.data.errorClass||e.data.error)||'',aliases),key=String(e.kind||'event')+'|'+msg+'|'+cls,g=groups[key]||(groups[key]={kind:String(e.kind||'event'),message:msg,errorClass:cls,count:0,lastAt:0,level:String(e.level||'warning')});g.count++;g.lastAt=Math.max(g.lastAt,Number(e.at)||0);});return Object.keys(groups).map(function(k){return groups[k];}).sort(function(a,b){return b.count-a.count||b.lastAt-a.lastAt;}).slice(0,12);}
  function v214ResearchLearning(aliases){var ld=v290CompactLearning(),mons=Object.keys(ld.monsters||{}).map(function(id){var m=ld.monsters[id]||{};return {monster:v214ResearchSafeText(id,aliases),kills:Number(m.kills)||0,lootEvents:Number(m.lootEvents)||0,gold:Number(m.gold)||0,lastAt:Number(m.lastAt)||0};}).sort(function(a,b){return b.kills-a.kills||b.lootEvents-a.lootEvents;}).slice(0,12),zones=Object.keys(ld.zones||{}).map(function(k){var z=ld.zones[k]||{};return {zone:v214ResearchSafeText(k,aliases),samples:Number(z.samples)||0,xpPerHour:Number(z.xpPerHour||z.avgXpPerHour||z.xp)||0,goldPerHour:Number(z.goldPerHour||z.avgGoldPerHour||z.gold)||0,safetyPct:Number(z.safetyPct||z.safety)||0,lastAt:Number(z.lastAt||z.updatedAt)||0};}).sort(function(a,b){return b.samples-a.samples;}).slice(0,12);return {updatedAt:Number(ld.updatedAt)||0,monsters:mons,zones:zones};}
  function v214ResearchHighlights(cutoff,aliases,profile){var weights={rollback:9,error:8,quality_quarantine:8,quality_degraded:7,reject:6,promotion:6,teacher:3,outcome:3,challenge:4,confirmed:4,quality_watch:4,day_summary:2},rows=(S.brainDiary||[]).filter(function(e){return e&&Number(e.at||0)>=cutoff;}).map(function(e){var reward=e.reward==null?0:Number(e.reward)||0,score=(weights[String(e.kind||'')]||1)+Math.abs(reward)*8;if(profile==='learning'&&/teacher|outcome|challenge|promotion|rollback|quality/.test(String(e.kind)))score+=4;if(profile==='errors'&&(e.tone==='bad'||e.tone==='warn'))score+=5;if(profile==='farm'&&/farm|xp|monster|zone/i.test(String(e.title||'')+' '+String(e.detail||'')))score+=5;if(profile==='merchant'&&/merchant|inventory|compound|upgrade|bank|sell|scroll/i.test(String(e.title||'')+' '+String(e.detail||'')))score+=5;return {at:Number(e.at)||0,kind:String(e.kind||''),title:v214ResearchSafeText(e.title,aliases),detail:v214ResearchSafeText(e.detail,aliases),action:String(e.action||''),target:v214ResearchSafeText(e.target,aliases),reward:e.reward==null?null:v210Round(reward,4),generation:Number(e.generation)||0,score:score};}).sort(function(a,b){return b.score-a.score||b.at-a.at;});return rows.slice(0,Number(C.brainResearchMaxHighlights)||20);}
  function v214ResearchRates(){var r=v273RateStats(),f=S.farmHealth||{},ps=partyState();return {xpPerHour:Number(r.xpPerHour)||0,goldPerHour:Number(r.goldPerHour)||0,xpGain:Number(r.xpGain)||0,goldGain:Number(r.goldGain)||0,freeSlots:freeSlots(),inventorySlots:(character.items||[]).length||0,farmSafetyPct:Number(f.safetyPct)||0,visibleMonsters:Number(f.visible)||0,competitors:Number(f.competitors)||0,partyComplete:!!ps.complete};}
  function v214ResearchData(profile,hours,anonymize){profile=v214ResearchProfile(profile);hours=clamp(Number(hours)||Number(C.brainResearchHours)||24,1,168);anonymize=anonymize!==false;var aliases=v214ResearchAliases(anonymize),cutoff=clock()-hours*3600000,t=v210BrainTelemetry(),q=v213QualitySummary(),l=v211LeagueSummary(),ps=partyState(),learning=v214ResearchLearning(aliases),errors=v214ResearchAuditErrors(cutoff,aliases,profile),highlights=v214ResearchHighlights(cutoff,aliases,profile),lessons=(S.brainDiary||[]).filter(function(e){return e&&e.kind==='teacher'&&Number(e.at||0)>=cutoff;}).slice(-12).reverse().map(function(e){return {at:Number(e.at)||0,title:v214ResearchSafeText(e.title,aliases),lesson:v214ResearchSafeText(e.detail,aliases),action:String(e.action||''),target:v214ResearchSafeText(e.target,aliases)};}),outcomes=(S.brainDiary||[]).filter(function(e){return e&&e.kind==='outcome'&&Number(e.at||0)>=cutoff&&e.reward!=null;}).sort(function(a,b){return Math.abs(Number(b.reward)||0)-Math.abs(Number(a.reward)||0);}).slice(0,12).map(function(e){return {at:Number(e.at)||0,title:v214ResearchSafeText(e.title,aliases),detail:v214ResearchSafeText(e.detail,aliases),reward:v210Round(Number(e.reward)||0,4),action:String(e.action||''),target:v214ResearchSafeText(e.target,aliases)};});return {schema:1,source:'local-bot',profile:profile,profileLabel:V214_RESEARCH_PROFILES[profile].label,generatedAt:clock(),windowHours:hours,anonymized:anonymize,bot:{version:VERSION,build:BUILD,character:aliases[me]||me,ctype:String(character.ctype||''),level:Number(character.level)||0,map:v214ResearchSafeText(character.map,aliases)},party:{members:(ps.members||[]).map(function(n){return aliases[n]||v214ResearchSafeText(n,aliases);}),missing:(ps.missing||[]).map(function(n){return aliases[n]||v214ResearchSafeText(n,aliases);}),complete:!!ps.complete},performance:v214ResearchRates(),brain:{usedToday:Number(t.usedToday)||0,limit:Number(t.limit)||10000,target:Number(t.target)||0,teacherRequests:Number(t.teacherRequests)||0,avgNeurons:Number(t.avgNeurons)||0,outcomes:Number(t.outcomes)||0,student:t.student||{},quality:q,league:l},current:{status:v214ResearchSafeText(S.status,aliases),mode:v214ResearchSafeText(S.mode,aliases),goal:S.goal?{map:v214ResearchSafeText(S.goal.map,aliases),monster:v214ResearchSafeText(S.goal.monster,aliases)}:null,merchantPlan:profile==='farm'?null:(S.merchantPlan?{steps:(S.merchantPlan.steps||[]).slice(0,6).map(function(x){return v214ResearchSafeText(x,aliases);}),farmOrder:S.merchantPlan.farmOrder||null}:null)},repeatedErrors:errors,highlights:highlights,teacherLessons:lessons,strongestOutcomes:outcomes,learning:(profile==='errors'?{updatedAt:learning.updatedAt,monsters:[],zones:[]}:learning),dataLimitations:['Lokale Audit-Historie ist auf die im laufenden Client gehaltenen Ereignisse begrenzt.','Keine vollständigen neuronalen Gewichtsmatrizen exportiert.','Keine Secrets, WRITE_KEY/READ_KEY oder Auth-Tokens exportiert.']};}
  function v214ResearchPrompt(profile,hours,anonymize){var data=v214ResearchData(profile,hours,anonymize),spec=V214_RESEARCH_PROFILES[data.profile],json='';try{json=JSON.stringify(data,null,2);}catch(e){json='{}';}return 'AiO Research Bridge · '+spec.label+'\n\n'+spec.task+'\n\nArbeitsregeln für die Analyse:\n- Nutze nur die gelieferten Daten als Tatsachengrundlage und markiere Unsicherheit/Datenlücken.\n- Priorisiere 24/7-Stabilität und Sicherheit vor EXP/h und Gold/h.\n- Trenne konkrete Änderungen am deterministischen Bot-Code von Änderungen am neuronalen Brain.\n- Nenne bei jeder Empfehlung erwarteten Nutzen, Risiko und einen prüfbaren Test.\n- Suche besonders nach wiederkehrenden Fehlern, Reward-Verschlechterung, Overconfidence, unnötigen Teacher-Aufrufen und Merchant-/Inventar-Loops.\n- Wenn bestehende Logik bereits korrekt reagiert, schlage keine Änderung nur um der Änderung willen vor.\n\nStrukturierte Bot-Daten:\n```json\n'+json+'\n```\n\nBitte liefere eine priorisierte technische Analyse und – wenn sinnvoll – einen konkreten Plan für die nächste Bot-Version.';}
  function v214ResearchSummary(){var d=v214ResearchData(C.brainResearchProfile,C.brainResearchHours,C.brainResearchAnonymize),q=d.brain.quality||{};return {schema:1,profile:d.profile,profileLabel:d.profileLabel,generatedAt:d.generatedAt,windowHours:d.windowHours,anonymized:d.anonymized,quality:{status:q.status,score:q.score,recentReward:q.recentReward,overconfidenceFailureRate:q.overconfidenceFailureRate},repeatedErrors:d.repeatedErrors.slice(0,8),highlights:d.highlights.slice(0,10),teacherLessons:d.teacherLessons.slice(0,8),strongestOutcomes:d.strongestOutcomes.slice(0,8),performance:d.performance,learning:{monsters:d.learning.monsters.slice(0,8),zones:d.learning.zones.slice(0,8)}};}
  function v214ResearchShow(profile){var text=v214ResearchPrompt(profile,C.brainResearchHours,C.brainResearchAnonymize);if(HEADLESS){gameMessage('Research Brief erzeugt · '+text.length+' Zeichen','#63e1bd');return text;}var el=D.createElement('div');el.className='overlay research-bridge-modal';el.innerHTML='<div class="modal"><div class="modaltop"><h2>🔬 AiO Research Bridge</h2><button class="close" data-action="modal-close">×</button></div><div class="notice">Der Prompt enthält nur ausgewählte Telemetrie. Secrets werden entfernt'+(C.brainResearchAnonymize?' und Charakternamen anonymisiert':'')+'.</div><textarea class="research-prompt" readonly>'+esc(text)+'</textarea><div class="buttons"><button class="btn primary" data-action="research-copy" data-profile="'+esc(v214ResearchProfile(profile))+'">Prompt kopieren</button></div></div>';uiRoot.appendChild(el);P.setTimeout(function(){var ta=el.querySelector('.research-prompt');if(ta){ta.focus();ta.select();}},30);return text;}
  function v214ResearchCopy(profile){var text=v214ResearchPrompt(profile,C.brainResearchHours,C.brainResearchAnonymize),nav=P.navigator||{},done=function(){audit('brain_research_copy','Research-Prompt erzeugt/kopiert',{profile:v214ResearchProfile(profile),hours:C.brainResearchHours,chars:text.length,anonymized:!!C.brainResearchAnonymize});gameMessage('AiO Research Prompt kopiert · '+V214_RESEARCH_PROFILES[v214ResearchProfile(profile)].label,'#63e1bd');};try{if(nav.clipboard&&typeof nav.clipboard.writeText==='function'){Promise.resolve(nav.clipboard.writeText(text)).then(done).catch(function(){v214ResearchShow(profile);});return text;}}catch(e){}v214ResearchShow(profile);return text;}
  var v214StudentExportBase=v210StudentExport;
  v210StudentExport=function(){var x=v214StudentExportBase();if(C.brainResearchBridgeEnabled){x.research={schema:1,summary:v214ResearchSummary(),updatedAt:clock()};x.telemetry=x.telemetry||{};x.telemetry.research={enabled:true,profile:C.brainResearchProfile,windowHours:C.brainResearchHours,anonymized:!!C.brainResearchAnonymize,updatedAt:clock()};}return x;};
  var v214TelemetryBase=v210BrainTelemetry;
  v210BrainTelemetry=function(){var x=v214TelemetryBase();x.research={enabled:!!C.brainResearchBridgeEnabled,profile:v214ResearchProfile(C.brainResearchProfile),profileLabel:V214_RESEARCH_PROFILES[v214ResearchProfile(C.brainResearchProfile)].label,windowHours:Number(C.brainResearchHours)||24,anonymized:!!C.brainResearchAnonymize,highlights:C.brainResearchBridgeEnabled?v214ResearchHighlights(clock()-(Number(C.brainResearchHours)||24)*3600000,v214ResearchAliases(C.brainResearchAnonymize),C.brainResearchProfile).slice(0,4):[]};return x;};
  var v214BrainHTMLBase=v290BrainHTML;
  v290BrainHTML=function(){var base=v214BrainHTMLBase(),p=v214ResearchProfile(C.brainResearchProfile),summary=C.brainResearchBridgeEnabled?v214ResearchSummary():null;return base+'<div class="card research-bridge-card"><h3>🔬 AiO Research Bridge</h3><div class="muted">Verdichtet echte Lernerfahrung zu einem Prompt für eine übergeordnete ChatGPT-Analyse. Kein zusätzlicher Teacher-Aufruf und keine zusätzlichen Workers-AI-Neurons.</div>'+cfgField('brainResearchBridgeEnabled','Research Bridge aktiv','check','Erzeugt Analysebriefe ausschließlich aus vorhandener Telemetrie, Tagebuch, Lern- und Fehlerdaten.')+cfgField('brainResearchProfile','Standard-Analyse','select','',Object.keys(V214_RESEARCH_PROFILES).map(function(k){return [k,V214_RESEARCH_PROFILES[k].label];}))+cfgField('brainResearchHours','Analysefenster (Stunden)','number','1–168 Stunden.')+cfgField('brainResearchMaxHighlights','Max. relevante Highlights','number','5–40. Auffällige Rewards, Rollbacks, Qualitätswarnungen und Fehler werden priorisiert.')+cfgField('brainResearchAnonymize','Charakternamen anonymisieren','check','Ersetzt Namen im Export durch Merchant/Farmer1…; Secrets werden unabhängig davon immer entfernt.')+(summary?'<div class="line"><span>Bereit</span><strong>'+summary.repeatedErrors.length+' Fehlergruppen · '+summary.highlights.length+' Highlights</strong></div>':'')+'<div class="buttons"><button class="btn primary" data-action="research-copy" data-profile="'+esc(p)+'">Standard-Prompt kopieren</button><button class="btn" data-action="research-copy" data-profile="development">Entwicklungsbrief</button><button class="btn" data-action="research-copy" data-profile="errors">Fehleranalyse</button><button class="btn" data-action="research-show" data-profile="overall">Gesamtanalyse anzeigen</button></div></div>';};
  var v214UiClickBase=uiClick;
  uiClick=function(e){var t=e.target&&e.target.closest?e.target.closest('button'):null;if(t&&t.dataset&&t.dataset.action==='research-copy'){v214ResearchCopy(t.dataset.profile||C.brainResearchProfile);return;}if(t&&t.dataset&&t.dataset.action==='research-show'){v214ResearchShow(t.dataset.profile||C.brainResearchProfile);return;}return v214UiClickBase(e);};
  CSS+=' .research-bridge-card{border-color:color-mix(in srgb,#8c7cff 45%,var(--border))!important;box-shadow:inset 3px 0 0 color-mix(in srgb,#8c7cff 70%,var(--accent))}.research-prompt{width:100%;min-height:420px;resize:vertical;background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:9px;padding:10px;font:10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace} ';

  var v210DashboardBase=dashboardPayload;
  dashboardPayload=function(){var d=v210DashboardBase();d.version=10;d.brain=v210BrainTelemetry();return d;};
  audit('feature_contract','2.14.4 Scroll-/Bank-Loop-Schutz + Brain-v2 + Research Bridge Kernfunktionen geprüft',{features:FEATURE_CONTRACT,student:{inputs:V210_INPUTS,hidden:V210_HIDDEN,outputs:V210_OUTPUTS},configHash:v282ConfigHash(C)});

  // ---------------------------------------------------------------------------
  // 2.14.4 deterministic Merchant economy + bank/realm/UI guards
  // ---------------------------------------------------------------------------
  function v2144InBank(){return /^bank(?:$|_)/.test(String(character.map||''));}
  function v2144PlanNeeds(item){
    if(!item||!item.name)return false;var p=S.merchantPlan||{},name=item.name,lv=Number(item.level)||0;
    if(p.farmOrder&&p.farmOrder.item===name&&(p.farmOrder.itemLevel==null||Number(p.farmOrder.itemLevel||0)===lv))return true;
    if((p.collectOrder||[]).some(function(x){return x&&x.name===name&&(x.level==null||Number(x.level||0)===lv);} ))return true;
    var recipe=p.job&&p.job.recipe;
    return !!(recipe&&Array.isArray(recipe.items)&&recipe.items.some(function(x){return x&&x.name===name&&(x.level==null||Number(x.level||0)===lv);}));
  }
  function v2144RecipeUseCount(name){
    var c=S.merchantEconomyRecipeCache||(S.merchantEconomyRecipeCache={at:0,rows:{}}),now=clock();
    if(now-Number(c.at||0)>30000){var rows={};try{var db=v273BuildKnowledgeDB(false);Object.keys(db.recipes||{}).forEach(function(id){((db.recipes[id]||{}).items||[]).forEach(function(x){if(x&&x.name)rows[x.name]=(rows[x.name]||0)+1;});});}catch(e){}c.at=now;c.rows=rows;}
    return Number(c.rows&&c.rows[name])||0;
  }
  function v2144DropEconomics(name){
    var db=v273BuildKnowledgeDB(false),rows=(db.drops&&db.drops[name])||[],chance=0,monster='',empirical=null,kills=0;
    rows.forEach(function(r){var c=Number(r&&r.chance)||0;if(c>chance){chance=c;monster=r.monster||'';}});
    Object.keys(db.empiricalDrops||{}).forEach(function(mon){((db.empiricalDrops||{})[mon]||[]).forEach(function(r){if(!r||r.item!==name||Number(r.kills||0)<20||r.rate==null)return;var rate=Number(r.rate)||0;if(empirical==null||rate>empirical){empirical=rate;kills=Number(r.kills)||0;}});});
    var effective=empirical!=null&&kills>=50?empirical:chance;
    return {known:chance>0||empirical!=null,chance:chance,monster:monster,empiricalRate:empirical,empiricalKills:kills,effective:effective,common:effective>=.03,rare:effective>0&&effective<.01};
  }
  function v2144ProjectedNpcValue(item,nextLevel){
    if(!item)return 0;try{if(typeof item_value==='function'){var clone=Object.assign({},item,{level:Math.max(0,Number(nextLevel)||0)});return Number(item_value(clone))||0;}}catch(e){}return 0;
  }
  function v2144ActionEconomics(prefix,item,copies){
    copies=Math.max(1,Number(copies)||1);var current=itemValueSafe(item)*copies,nextLevel=(Number(item&&item.level)||0)+1,projected=v2144ProjectedNpcValue(item,nextLevel),scrollName=v273ScrollName(prefix,item),scrollCost=Number(GD.items&&GD.items[scrollName]&&GD.items[scrollName].g)||0,drop=v2144DropEconomics(item&&item.name),delta=projected>0?projected-current-scrollCost:null;
    return {npcValueNow:Math.round(current),npcValueAfter:Math.round(projected),scroll:scrollName,scrollCost:Math.round(scrollCost),netNpcDelta:delta==null?null:Math.round(delta),dropChance:drop.chance,empiricalDropRate:drop.empiricalRate,dropMonster:drop.monster,dropKnown:drop.known,dropCommon:drop.common,dropRare:drop.rare};
  }
  function v2144SellDecision(item){
    if(!item||!item.name)return {sell:false,reason:'empty'};var d=GD.items&&GD.items[item.name]||{},name=item.name;
    if(item.l||item.p||item.gift||protectedStandItem(item)||/^c?scroll[0-4]$/.test(name)||isElixir(item)||name===C.hpot||name===C.mpot)return {sell:false,reason:'protected'};
    if(d.e||d.exchange||d.exchanges||d.quest||v2144PlanNeeds(item))return {sell:false,reason:'special-or-planned'};
    var utility=v273GroupUtility(item),useful=utility>=0,desired=useful?v273DesiredGroupCopies(name):0,owned=v273OwnedCount(name),recipeUses=v2144RecipeUseCount(name),drop=v2144DropEconomics(name),value=itemValueSafe(item),compoundReserve=d.compound?2:0,keep=desired+compoundReserve;
    if(recipeUses>0)keep=Math.max(keep,Math.min(12,Math.max(3,desired+6)));
    if(drop.rare)keep=Math.max(keep,desired+4);
    var surplus=owned-keep,pureTrash=!d.upgrade&&!d.compound&&recipeUses===0,abundant=owned>=Math.max(8,keep+5),bankEmergency=!!S.bankFull&&surplus>0;
    var sell=value>0&&surplus>0&&(
      (pureTrash&&(drop.common||abundant||bankEmergency))||
      (!useful&&drop.common&&recipeUses===0)||
      (bankEmergency&&!drop.rare&&recipeUses===0)
    );
    var reasonText=sell?(bankEmergency?'bank-full-safe-surplus':(pureTrash?'common-trash':'unusable-surplus')):(drop.rare?'rare-drop-reserve':(recipeUses?'recipe-reserve':(surplus<=0?'group-reserve':'strategic-item')));
    return {sell:sell,reason:reasonText,npcValue:Math.round(value),owned:owned,keep:keep,surplus:surplus,utility:Math.round(utility),recipeUses:recipeUses,dropChance:drop.chance,empiricalDropRate:drop.empiricalRate,dropKnown:drop.known,dropCommon:drop.common,dropRare:drop.rare,upgradeEconomics:d.upgrade?v2144ActionEconomics('scroll',item,1):null,compoundEconomics:d.compound?v2144ActionEconomics('cscroll',item,3):null};
  }
  function v2144FindSellCandidate(){
    var best=null;(character.items||[]).forEach(function(it,i){var d=v2144SellDecision(it);if(!d.sell)return;var q=Math.max(1,Number(it.q)||1),drop=Number(d.empiricalDropRate!=null?d.empiricalDropRate:d.dropChance)||0,score=d.npcValue*q*(1+Math.min(.5,drop*4))+Math.max(0,d.surplus)*25;if(!best||score>best.score)best={it:it,i:i,q:q,d:d,score:score};});return best;
  }
  function v2144SellVendor(){return v282VendorForScroll('scroll0')||{map:'main',x:-225,y:-125,npc:'scroll_vendor'};}

  v273SellTrashTick=function(){
    if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc||typeof sell!=='function')return false;var c=v2144FindSellCandidate();if(!c)return false;var dest=v2144SellVendor();
    if(v2144InBank()||character.map!==dest.map||dist(character,dest)>180){S.status=(C.language==='de'?'Zum NPC-Verkauf: ':'Move to NPC sale: ')+v273Name(c.it.name);S.mode='Merchant · NPC';return moveToGoal(dest,C.language==='de'?'Zum Händler für sicheren NPC-Verkauf':'Move to vendor for safe NPC sale',{kind:'merchant-npc-sell',forceAfter:9000});}
    S.status=(C.language==='de'?'Verkaufe wirtschaftlichen Überschuss: ':'Sell economic surplus: ')+v273Name(c.it.name);S.mode='Merchant · NPC';
    audit('merchant_economy_decision','NPC-Verkauf nach Wert/Drop/Reserve-Prüfung',{item:c.it.name,level:Number(c.it.level)||0,quantity:c.q,decision:c.d});
    return action('NPC-Verkauf '+c.it.name,function(){return sell(c.i,c.q);},'merchant-trash-sell:'+c.it.name,4000);
  };

  v273StoreTrashBankTick=function(){
    if(character.ctype!=='merchant'||!C.merchantManageBank||freeSlots()>C.merchantInventoryReserve)return false;
    if(v2144FindSellCandidate())return false;
    if(!character.bank){S.status='Inventar organisieren · zur Bank';S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},'Bank organisieren',{kind:'bank',forceAfter:7000});}
    var cap=v273BankCapacity();if(cap&&cap.free<=0){S.bankFull=true;return v273OpenBankPackTick();}
    var idx=(character.items||[]).findIndex(function(it){if(!it||it.l||it.p||isElixir(it)||it.name===C.hpot||it.name===C.mpot||/^c?scroll[0-4]$/.test(String(it.name||'')))return false;if(v2144SellDecision(it).sell)return false;var d=GD.items&&GD.items[it.name]||{};var required=S.merchantPlan&&S.merchantPlan.farmOrder&&S.merchantPlan.farmOrder.item===it.name;if(required||v2144PlanNeeds(it))return false;return v273GroupUtility(it)<0||(!d.upgrade&&!d.compound&&!d.e&&!d.exchange&&!d.exchanges);});
    if(idx>=0&&typeof bank_store==='function')return action('Item in Bank lagern '+character.items[idx].name,function(){return bank_store(idx);},'bank-store',1300);return false;
  };

  function v2144UpgradeCandidate(){
    var best=null;(character.items||[]).forEach(function(it,i){if(!it||it.l||it.p||!GD.items[it.name]||!GD.items[it.name].upgrade)return;var lv=Number(it.level)||0,utility=v273GroupUtility(it);if(lv>=C.merchantUpgradeMax||utility<0)return;var econ=v2144ActionEconomics('scroll',it,1),spendable=Math.max(0,Number(character.gold||0)-Number(C.merchantBankGoldReserve||0));if(econ.scrollCost>spendable)return;if(utility===0&&!(econ.netNpcDelta>0))return;var rarity=(econ.dropRare?250:0),costPenalty=econ.scrollCost/Math.max(1000,spendable||1000),score=utility+rarity-costPenalty*100;if(!best||score>best.score||score===best.score&&lv<best.lv)best={it:it,i:i,lv:lv,utility:utility,econ:econ,score:score};});return best;
  }
  v273UpgradeTick=function(){
    if(character.ctype!=='merchant'||!C.merchantAutoUpgrade||typeof upgrade!=='function')return false;var best=v2144UpgradeCandidate();if(!best)return false;
    if(v2144InBank()){S.status=(C.language==='de'?'Bank verlassen vor Upgrade: ':'Leave bank before upgrade: ')+v273Name(best.it.name);S.mode='Merchant · Upgrade';return moveToGoal({map:'main',x:0,y:0},C.language==='de'?'Bank vor Upgrade verlassen':'Leave bank before upgrade',{kind:'upgrade-bank-exit',forceAfter:9000});}
    var sc=v273EnsureScroll('scroll',best.it);if(sc<0)return true;S.status='Verbessere '+v273Name(best.it.name)+' auf +'+(best.lv+1);S.mode='Merchant · Upgrade';audit('merchant_economy_decision','Upgrade nach Nutzen/Kosten/Drop-Prüfung',{action:'upgrade',item:best.it.name,level:best.lv,utility:Math.round(best.utility),economics:best.econ});return action('Item verbessern '+best.it.name,function(){return upgrade(best.i,sc);},'merchant-upgrade',2600);
  };

  function v2144CompoundCandidate(){
    var groups={};(character.items||[]).forEach(function(it,i){if(!it||it.l||it.p||!GD.items[it.name]||!GD.items[it.name].compound)return;var utility=v273GroupUtility(it);if(utility<0)return;var desired=utility>=0?v273DesiredGroupCopies(it.name):0;if(v273OwnedCount(it.name)-desired<2)return;var lv=Number(it.level)||0;if(lv>=v273EffectiveCompoundMax(it.name))return;var key=it.name+'|'+lv;groups[key]=groups[key]||[];groups[key].push({it:it,i:i,utility:utility});});
    var best=null;Object.keys(groups).forEach(function(k){if(groups[k].length<3)return;var g=groups[k].slice(0,3),item=g[0].it,econ=v2144ActionEconomics('cscroll',item,3),utility=g[0].utility,spendable=Math.max(0,Number(character.gold||0)-Number(C.merchantBankGoldReserve||0));if(econ.scrollCost>spendable)return;if(utility===0&&!(econ.netNpcDelta>0))return;var lv=Number(item.level)||0,score=utility+(econ.dropRare?300:0)-econ.scrollCost/Math.max(1000,spendable||1000)*100;if(!best||score>best.score||score===best.score&&lv<best.lv)best={g:g,it:item,lv:lv,utility:utility,econ:econ,score:score};});return best;
  }
  v273CompoundTick=function(){
    if(character.ctype!=='merchant'||!C.merchantAutoCompound||typeof compound!=='function')return false;var best=v2144CompoundCandidate();if(!best)return false;
    if(v2144InBank()){S.status=(C.language==='de'?'Bank verlassen vor Combine: ':'Leave bank before combine: ')+v273Name(best.it.name);S.mode='Merchant · Combine';return moveToGoal({map:'main',x:0,y:0},C.language==='de'?'Bank vor Combine verlassen':'Leave bank before combine',{kind:'compound-bank-exit',forceAfter:9000});}
    var sc=v273EnsureScroll('cscroll',best.it);if(sc<0)return true;S.status='Kombiniere '+v273Name(best.it.name)+' +'+best.lv;S.mode='Merchant · Combine';audit('merchant_economy_decision','Combine nach Nutzen/Kosten/Drop-Prüfung',{action:'compound',item:best.it.name,level:best.lv,utility:Math.round(best.utility),economics:best.econ});return action('Items kombinieren '+best.it.name,function(){return compound(best.g[0].i,best.g[1].i,best.g[2].i,sc);},'merchant-compound',3200);
  };

  // Reports now carry the actual Adventure Land realm. Party repair uses a
  // majority/consensus realm so one stray character is moved instead of three.
  var v2144ReportBase=report;
  report=function(withRole){var r=v2144ReportBase(withRole),realm=currentRealm();r.realm={region:realm.region,id:realm.id,pvp:!!realm.pvp};return r;};
  function v2144RealmKey(r){return r&&r.region&&r.id?String(r.region)+'|'+String(r.id):'';}
  function v2144PartyRealmSnapshot(){
    var rows=[];C.roster.forEach(function(name){var rep=name===me?report(false):peerReport(name),realm=name===me?currentRealm():(rep&&rep.realm);if(realm&&v2144RealmKey(realm))rows.push({name:name,realm:{region:String(realm.region),id:String(realm.id),pvp:!!realm.pvp},key:v2144RealmKey(realm)});});
    if(rows.length<2)return null;var counts={};rows.forEach(function(x){counts[x.key]=(counts[x.key]||0)+1;});var leader=canonicalLeader(),leaderRow=rows.find(function(x){return x.name===leader;}),leaderKey=leaderRow&&leaderRow.key||'',keys=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]||(a===leaderKey?-1:b===leaderKey?1:a.localeCompare(b));}),targetKey=keys[0],targetRow=rows.find(function(x){return x.key===targetKey;}),mismatch=rows.filter(function(x){return x.key!==targetKey;});if(!targetRow||!mismatch.length)return null;return {known:rows.length,total:C.roster.length,target:targetRow.realm,targetKey:targetKey,mismatch:mismatch,rows:rows};
  }
  function v2144PartyRealmGuard(){
    if(!S.running||!C.autoParty)return false;var snap=v2144PartyRealmSnapshot();if(!snap){S.partyRealmMismatch=null;return false;}S.partyRealmMismatch=snap;var now=clock();
    if(now>Number(S.times.partyRealmAudit||0)){S.times.partyRealmAudit=now+15000;audit('party_realm_mismatch','Party-Charaktere laufen auf unterschiedlichen Servern',{target:snap.targetKey,known:snap.known,total:snap.total,mismatch:snap.mismatch.map(function(x){return {name:x.name,realm:x.key};})},'warning');}
    if(snap.known<Math.min(3,snap.total)){S.status=C.language==='de'?'Party wartet auf aktuelle Servermeldungen':'Party waits for current realm reports';S.mode='Party · Server';return true;}
    var current=currentRealm(),currentKey=v2144RealmKey(current);if(currentKey===snap.targetKey){S.status=(C.language==='de'?'Party-Server angleichen: ':'Align party realm: ')+snap.mismatch.map(function(x){return x.name+' '+x.key+' → '+snap.targetKey;}).join(', ');S.mode='Party · Server';return true;}
    var pvpKey=snap.targetKey;if(snap.target.pvp&&(C.autoFarmPvPConfirmed||[]).indexOf(pvpKey)<0){if(now>Number(S.times.partyRealmPvpWarn||0)){S.times.partyRealmPvpWarn=now+60000;audit('party_realm_switch_blocked','Automatische Party-Serverangleichung zu PvP ohne Bestätigung blockiert',{target:pvpKey},'warning');}S.status='Party-Serverwechsel zu PvP nicht bestätigt';S.mode='Party · Server';return true;}
    if(typeof change_server!=='function'){S.status='Party-Server unterschiedlich · change_server nicht verfügbar';S.mode='Party · Server';return true;}
    if(now<Number(S.partyRealmSwitchUntil||0))return true;S.partyRealmSwitchUntil=now+30000;S.status=(C.language==='de'?'Wechsle für Party auf ':'Switching for party to ')+snap.targetKey;S.mode='Party · Server';audit('party_realm_switch','Charakter auf Mehrheitsserver der Bot-Gruppe verschieben',{from:currentKey,to:snap.targetKey,mismatch:snap.mismatch.map(function(x){return x.name;})},'warning');try{change_server(snap.target.region,snap.target.id);}catch(e){audit('party_realm_switch_error','Party-Serverwechsel fehlgeschlagen',{error:reason(e),target:snap.targetKey},'error');}return true;
  }
  var v2144PartyReconcileBase=partyReconcileTick;
  partyReconcileTick=function(){if(v2144PartyRealmGuard())return true;return v2144PartyReconcileBase();};

  audit('feature_contract','2.14.4 Merchant-Ökonomie + Bank-Guard + Party-Realm-Repair + GUI-Collapse geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C)});

  var v2141MerchantTickBase=merchantTick;
  merchantTick=function(){var now=clock(),w=S.merchantWatchdog||(S.merchantWatchdog={windowAt:now,actions:0,suspendUntil:0,lastActionAt:Number(S.lastActionAt)||0});if(now-w.windowAt>=60000){w.windowAt=now;w.actions=0;}if(now<w.suspendUntil){S.status='Merchant-Schutzpause · Logistik kurz gedrosselt';S.mode='Merchant · Watchdog';return;}var before=Number(S.lastActionAt)||0,r=v2141MerchantTickBase();if((Number(S.lastActionAt)||0)!==before)w.actions++;if(w.actions>90){w.suspendUntil=now+10000;w.actions=0;audit('merchant_watchdog','Merchant-Logistik wegen ungewöhnlich hoher Aktionsrate kurz gedrosselt',{pauseMs:10000,thresholdPerMinute:90},'warning');}return r;};

  var v281PartyReconcileBase=partyReconcileTick;
  partyReconcileTick=function(){var r=v281PartyReconcileBase();if(C.language==='de'){S.status=String(S.status||'').replace(/^Detecting same-bot characters/,'Erkenne Bot-Charaktere');if(S.mode==='Group discovery')S.mode='Gruppenerkennung';}return r;};
  CSS+=' .party-vitals{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.party-vitals span{background:color-mix(in srgb,var(--panel) 75%,transparent);border:1px solid var(--line);border-radius:7px;padding:5px;text-align:center;font-size:11px}.metersection{margin:10px 0 16px;padding:10px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--panel) 88%,transparent)}.meterhead{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px}.meterhead strong{font-size:16px}.meterhead span{font-size:11px;color:var(--muted)}.meterrow{margin:7px 0}.meterlabel{display:grid;grid-template-columns:24px minmax(100px,1fr) auto;gap:6px;align-items:center;font-size:11px}.meterlabel b{text-align:right}.meterrank{color:var(--muted);text-align:center}.metertrack{height:12px;background:color-mix(in srgb,var(--panel2) 75%,#000);border-radius:4px;overflow:hidden;margin-top:3px}.metertrack i{height:100%;display:block;background:linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 55%,#fff));border-radius:4px;min-width:1px} ';
  function tick(){if(S.disposed)return;try{flushAuditQueue();rotateLogSegment();if(clock()>(S.times.pruneLogs||0)){S.times.pruneLogs=clock()+3600000;pruneOldLogs();}if(clock()>(S.times.stateAudit||0)){S.times.stateAudit=clock()+1000;v273UpdateSessionRates();stateAuditTick();}v280LearningTick();v290CloudSyncTick(false);v290BrainTick('periodic',false);if(clock()>(S.times.report||0)){S.times.report=clock()+650;publishReport();}syncAutoRoster(false);partyReconcileTick();v280FarmAdaptationTick();dashboardPublishTick(false);updateCheckTick(false);v277DiagnosticTick();if(!S.running){S.status='Pausiert';S.mode='Pause';return;}if(C.roster.indexOf(me)<0){S.status=C.language==='de'?'Warte auf automatische Gruppenauswahl':'Waiting for automatic roster selection';S.mode=C.language==='de'?'Gruppenerkennung':'Group detection';return;}if(connectionTick()||deathTick())return;if(character.s&&(character.s.stunned||character.s.frozen)){S.status='Handlungsunfähig';S.mode='Warten';return;}sustainTick();if(supportTick())return;if(typeof loot==='function'&&clock()>(S.times.loot||0)){S.times.loot=clock()+900;action('Loot einsammeln',function(){return loot();},'loot-action',800);}if(character.ctype==='merchant')merchantTick();else{v277FarmerSupplySignalTick();if(farmerElixirTransferTick())return;if(farmerLootTransferTick())return;farmerTick();}v281TranslateState();if(typeof set_message==='function'&&clock()>(S.times.message||0)){S.times.message=clock()+1800;try{set_message('AIO '+VERSION+' · '+S.mode);}catch(e){}}}catch(e){audit('tick_error','Steuerungsfehler: '+reason(e),null,'error');}}
  function pause(value){S.running=value==null?!S.running:!!value;write('run:'+me,S.running);audit('run_state',S.running?'Bot gestartet':'Bot pausiert');renderAll(true);}
  function dispose() {
    if(S.disposed)return;S.disposed=true;try{clearInterval(timer);}catch(e){}try{clearInterval(uiTimer);}catch(e){}flushAuditQueue();write('report:'+me,Object.assign(report(),{active:false}));
    try{if(character.remove)charEventIds.forEach(function(id){character.remove(id);});}catch(e){}
    try{if(on_cm===receive27)on_cm=oldCM;}catch(e){} // compatibility; receive27 may not exist in old runners
    try{on_party_invite=oldInvite;on_party_request=oldRequest;}catch(e){}
    try{if(S.globalTypingGuard&&P.removeEventListener)['keydown','keyup','keypress'].forEach(function(ev){P.removeEventListener(ev,S.globalTypingGuard,true);});}catch(e){}try{if(uiHost)uiHost.remove();}catch(e){}
    audit('shutdown','AiO Bot '+VERSION+' beendet');
  }


  // ---------------------------------------------------------------------------
  // 2.14.5 Merchant reliability: route arbitration, settled vendor actions,
  // fair economic selling and UI visibility/vitals.
  // ---------------------------------------------------------------------------
  function v2145MovePriority(kind){
    kind=String(kind||'').toLowerCase();
    if(/scroll|vendor|npc|sell|upgrade-bank-exit|compound-bank-exit/.test(kind))return 100;
    if(/bank/.test(kind))return 90;
    if(/merchant-service|service|collect|loot/.test(kind))return 80;
    if(/supply|deliver|distribution/.test(kind))return 70;
    if(/follow|farm/.test(kind))return 40;
    if(/explore/.test(kind))return 10;
    return 50;
  }
  function v2145MoveLockActive(lock){
    if(!lock)return false;
    var now=clock(),p=lock.target||{},sameMap=!p.map||p.map===character.map,near=sameMap&&isFinite(Number(p.x))&&isFinite(Number(p.y))&&dist(character,p)<=Number(lock.tolerance||85);
    if(near&&!character.moving&&!S.moveInFlight)return false;
    if(now-Number(lock.at||0)>45000&&!S.moveInFlight&&!character.moving)return false;
    return !!(S.moveInFlight||character.moving||now-Number(lock.at||0)<2500);
  }
  var v2145MoveBase=moveToGoal;
  moveToGoal=function(g,why,opts){
    opts=opts||{};if(!g)return false;
    var kind=opts.kind||String(why||'move'),priority=v2145MovePriority(kind),now=clock(),target={map:g.map||character.map,x:Math.round(Number(g.x)||0),y:Math.round(Number(g.y)||0)},lock=S.moveArbiter2145;
    if(lock&&!v2145MoveLockActive(lock)){S.moveArbiter2145=null;lock=null;}
    if(lock&&v2145MoveLockActive(lock)){
      var same=lock.target&&lock.target.map===target.map&&Math.hypot(Number(lock.target.x||0)-target.x,Number(lock.target.y||0)-target.y)<=Number(opts.tolerance||90);
      if(!same&&priority<Number(lock.priority||0)){
        if(clock()>Number(S.times.moveDeferred2145||0)){
          S.times.moveDeferred2145=clock()+5000;
          audit('move_deferred','Niedriger priorisierte Route wartet auf laufenden Merchant-Weg',{activeKind:lock.kind,activePriority:lock.priority,requestedKind:kind,requestedPriority:priority,target:target},'info');
        }
        return true;
      }
    }
    S.moveArbiter2145={kind:kind,priority:priority,target:target,tolerance:Number(opts.tolerance)||85,at:now};
    S.moveKind=kind;
    return v2145MoveBase(g,why,opts);
  };

  var v2145ExploreBase=v290ExploreTick;
  v290ExploreTick=function(){
    if(character.ctype!=='merchant'||!C.merchantExploreWhenIdle)return false;
    var lock=S.moveArbiter2145,mode=String(S.mode||'');
    if(S.merchantServiceTarget)return false;
    if(lock&&v2145MoveLockActive(lock)&&v2145MovePriority(lock.kind)>v2145MovePriority('explore'))return false;
    if(/Merchant · (Bank|Einkauf|NPC|Combine|Upgrade|Craft|Exchange|Versorgung|Service|Inventar)/.test(mode))return false;
    if(clock()-Math.max(Number(S.lastActionAt||0),Number(S.moveRequestedAt||0))<4500)return false;
    return v2145ExploreBase();
  };

  function v2145VendorReady(dest){
    return !!(dest&&dest.map===character.map&&!character.moving&&!S.moveInFlight&&dist(character,dest)<=75);
  }
  v273EnsureScroll=function(prefix,item){
    var name=v273ScrollName(prefix,item),idx=slot(name);if(idx>=0)return idx;
    if(freeSlots()<1){S.times['buy-scroll:'+name]=clock()+15000;S.status='Kein Platz für Scroll · Inventar zuerst bereinigen';S.mode='Merchant · Inventar';return -1;}
    if(!(typeof buy==='function'&&GD.items&&GD.items[name]))return -1;
    var price=Number(GD.items[name].g||0);if(character.gold-price<=C.merchantBankGoldReserve)return -1;
    var dest=v282VendorForScroll(name);
    if(dest&&!v2145VendorReady(dest)){
      S.status='Zum Scroll-Händler für '+name;S.mode='Merchant · Einkauf';
      moveToGoal(dest,'Scroll-Händler '+name,{kind:'merchant-scroll-vendor',tolerance:45,forceAfter:15000});
      return -1;
    }
    action('Scroll kaufen '+name,function(){return buy(name,1);},'buy-scroll:'+name,2200);
    return -1;
  };

  var v2145SellDecisionBase=v2144SellDecision;
  function v2145SellDecision(it){
    var base=v2145SellDecisionBase(it),d=it&&GD.items&&GD.items[it.name]||{};
    if(!it||!it.name||base.protected)return base;
    if(base.sell)return base;
    var level=Number(it.level)||0,owned=v273OwnedCount(it.name),keep=Number(base.keep||v273DesiredGroupCopies(it.name)||1),surplus=Math.max(0,owned-keep);
    var db=v273BuildKnowledgeDB(false),recipeUses=v2144RecipeUseCount(it.name,db),drop=v2144DropEconomics(it.name),value=itemValueSafe(it);
    var maxedUpgrade=!!d.upgrade&&!d.compound&&level>=Number(C.merchantUpgradeMax||4);
    var safeRarity=!drop.rare&&(drop.bestChance==null||drop.bestChance>=0.005||drop.learnedRate>=0.003||owned>=keep+3);
    if(maxedUpgrade&&surplus>0&&recipeUses===0&&value>0&&safeRarity){
      return Object.assign({},base,{sell:true,reason:'maxed-upgrade-surplus',owned:owned,keep:keep,surplus:surplus,npcValue:value,drop:drop,recipeUses:recipeUses,level:level});
    }
    var pureTrash=!d.upgrade&&!d.compound&&recipeUses===0&&Number(base.utility)<0&&surplus>0;
    if(pureTrash&&value>0&&(safeRarity||owned>=keep+2)){
      return Object.assign({},base,{sell:true,reason:'safe-trash-surplus',owned:owned,keep:keep,surplus:surplus,npcValue:value,drop:drop,recipeUses:recipeUses,level:level});
    }
    return base;
  }
  v2144SellDecision=v2145SellDecision;
  v2144FindSellCandidate=function(){
    var best=null;
    (character.items||[]).forEach(function(it,i){
      if(!it)return;
      var dec=v2145SellDecision(it);if(!dec.sell)return;
      var q=Number(it.q)||1,surplus=Math.max(1,Number(dec.surplus)||1),sellQty=Math.max(1,Math.min(q,surplus));
      var score=(dec.reason==='maxed-upgrade-surplus'?1000000:0)+(dec.reason==='safe-trash-surplus'?600000:0)+Number(dec.npcValue||0)+Math.min(100000,Number(dec.owned||0)*50);
      if(!best||score>best.score)best={index:i,item:it,decision:dec,qty:sellQty,score:score};
    });
    return best;
  };

  v273SellTrashTick=function(){
    if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc||typeof sell!=='function')return false;
    var cand=v2144FindSellCandidate();
    if(!cand){
      if(clock()>Number(S.times.sellNoCandidate2145||0)){
        S.times.sellNoCandidate2145=clock()+30000;
        audit('merchant_sell_scan','Kein sicherer NPC-Verkaufskandidat',{free:freeSlots(),reserve:C.merchantInventoryReserve,inventory:(character.items||[]).filter(Boolean).length},'info');
      }
      return false;
    }
    var dest=v2144SellVendor();
    v2144AuditEconomy('sell',cand.item,cand.decision,{quantity:cand.qty});
    if(dest&&!v2145VendorReady(dest)){
      S.status='Zum NPC für Verkauf: '+v273Name(cand.item.name);S.mode='Merchant · NPC-Verkauf';
      return moveToGoal(dest,'NPC-Verkauf '+cand.item.name,{kind:'merchant-npc-sell',tolerance:45,forceAfter:15000});
    }
    S.status='NPC-Verkauf: '+v273Name(cand.item.name)+' ×'+cand.qty;S.mode='Merchant · NPC-Verkauf';
    return action('NPC-Verkauf '+cand.item.name,function(){return sell(cand.index,cand.qty);},'merchant-trash-sell:'+cand.item.name,2200);
  };

  function v2145EconomyMaintenanceTick(){
    if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc)return false;
    var cand=v2144FindSellCandidate();if(!cand)return false;
    var pressured=freeSlots()<=Math.max(2,Number(C.merchantInventoryReserve||5)+1);
    var urgent=false;try{urgent=(v277MerchantServiceCandidates()||[]).some(function(x){return x&&x.urgent;});}catch(e){}
    if(!pressured&&urgent)return false;
    if(!pressured&&clock()<Number(S.times.economy2145||0))return false;
    S.times.economy2145=clock()+10000;
    return v273SellTrashTick();
  }
  var v2145MerchantTickBase=merchantTick;
  merchantTick=function(){
    if(character.ctype==='merchant'&&v2145EconomyMaintenanceTick())return true;
    return v2145MerchantTickBase();
  };

  var v2145LayoutMainBase=layoutMain;
  layoutMain=function(){
    v2145LayoutMainBase();
    if(!S.mainBox)return;
    var vh=P.innerHeight||900;
    S.mainBox.style.maxHeight=Math.max(260,vh-16)+'px';
  };

  partyHTML=function(){
    var ps=partyState(),rows=peers(true),gs=v280GroupStrengthSnapshot();
    function rr(n){if(n===me)return report();return rows.find(function(x){return x.name===n;})||peerReport(n);}
    function vital(label,cur,max,type){
      cur=Number(cur)||0;max=Math.max(1,Number(max)||1);var pc=Math.round(clamp(cur/max*100,0,100));
      return '<div class="party-vital"><div class="line"><span>'+label+'</span><strong>'+Math.round(cur)+' / '+Math.round(max)+' · '+pc+'%</strong></div><div class="partybar '+type+'"><i style="width:'+pc+'%"></i></div></div>';
    }
    return '<h2>'+esc(T('party'))+'</h2><div class="card"><div class="line"><span>'+esc(v281L('groupStrength'))+'</span><strong>'+v280FmtCompact(gs.score)+'</strong></div><div class="line"><span>'+esc(v281L('groupDps'))+'</span><strong>'+v280FmtCompact(gs.totalDps)+'</strong></div></div>'+
      C.roster.map(function(n){var r=rr(n),role=roleForName(n),ic=v280RoleIcon(role);if(!r)return '<div class="card"><div class="line"><strong>'+ic+' '+esc(n)+'</strong><span class="tag">'+esc(roleLabel(role))+'</span></div><div class="muted">'+esc(v281L('noReport'))+'</div></div>';return '<div class="card party-live-card"><div class="line"><strong>'+ic+' '+esc(n)+'</strong><span class="tag">'+esc(roleLabel(role))+'</span></div><div class="muted">Lv. '+r.level+' · '+esc(r.map||'—')+' · '+v280FmtCompact(r.xpPerHour||0)+' EXP/h</div>'+vital('HP',r.hp,r.max_hp,'hp')+vital('MP',r.mp,r.max_mp,'mp')+'</div>';}).join('')+
      '<div class="notice '+(ps.complete?'':'bad')+'">'+(ps.complete?esc(v281L('complete')):esc(v281L('missing'))+': '+esc((ps.missing||[]).join(', ')))+'</div>';
  };

  CSS+=' .mainbox .maincontent{overflow-y:auto;overflow-x:hidden;max-height:calc(100vh - 118px);overscroll-behavior:contain;padding-bottom:8px}.mainbox .launcher{padding-bottom:8px}.party-live-card{overflow:hidden}.party-vital{margin-top:8px}.party-vital .line{font-size:9px;margin-bottom:4px}.partybar{height:9px;border-radius:999px;background:var(--surface);overflow:hidden;position:relative}.partybar i{height:100%;display:block;position:relative;transition:width .45s ease;border-radius:inherit}.partybar.hp i{background:#e5484d}.partybar.mp i{background:#3b82f6}.partybar i:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.32),transparent);transform:translateX(-100%);animation:v2145VitalFlow 1.6s linear infinite}@keyframes v2145VitalFlow{to{transform:translateX(100%)}}@media(prefers-reduced-motion:reduce){.partybar i,.partybar i:after{animation:none!important;transition:none!important}} ';
  audit('feature_contract','2.14.5 Merchant-Routenpriorität + Vendor-Settling + Verkaufsfairness + Dashboard/GUI geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C)});

  // ---------------------------------------------------------------------------
  // 2.14.6 Merchant crash + manual update UX hotfix.
  // ---------------------------------------------------------------------------
  function v2146UpdateLabel(){
    if(S.update.applying)return C.language==='de'?'Update wird installiert …':'Installing update …';
    if(S.update.checking)return C.language==='de'?'Prüfe auf Updates …':'Checking for updates …';
    return C.language==='de'?'Auf Updates prüfen':'Check for update';
  }
  function v2146UpdateStatusHTML(){
    var checked=Number(S.update.checkedAt)||0,label=C.language==='de'?'Update-Status':'Update status';
    var value=S.update.applying?(C.language==='de'?'Update wird installiert …':'Installing update …'):
      S.update.checking?(C.language==='de'?'Prüfung läuft …':'Check in progress …'):
      S.update.error?(C.language==='de'?'Fehler: ':'Error: ')+esc(S.update.error):
      checked?(C.language==='de'?'Letzte Prüfung: ':'Last check: ')+new Date(checked).toLocaleTimeString():(C.language==='de'?'Noch nicht geprüft':'Not checked yet');
    var cls=S.update.error?'bad':(S.update.checking||S.update.applying?'warn':'good');
    return '<div class="card update-manual-status"><div class="line"><span>'+esc(label)+'</span><strong class="'+cls+'">'+value+'</strong></div></div>';
  }
  var v2146SettingsHTMLBase=settingsHTML;
  settingsHTML=function(){
    var html=v2146SettingsHTMLBase();
    var re=/(<button class="btn primary" data-action="update-check"[^>]*>)[\s\S]*?(<\/button>)/;
    html=html.replace(re,function(_m,a,b){return a+esc(v2146UpdateLabel())+b;});
    if(html.indexOf('update-manual-status')<0){
      var p=html.indexOf('<div class="card"><div class="line"><span>'+esc(T('current_version'))+'</span>');
      if(p>=0)html=html.slice(0,p)+v2146UpdateStatusHTML()+html.slice(p);
      else html+=v2146UpdateStatusHTML();
    }
    if(S.update.checking||S.update.applying)html=html.replace('data-action="update-check"','data-action="update-check" disabled');
    return html;
  };
  var v2146UiClickBase=uiClick;
  uiClick=function(e){
    var t=e&&e.target&&e.target.closest?e.target.closest('button'):null;
    if(t&&t.dataset&&t.dataset.action==='update-check'){
      if(S.update.checking||S.update.applying){if(S.toolWindows.settings)renderTool('settings');return;}
      S.update.checkedAt=0;S.update.error='';
      audit('update_manual_check',C.language==='de'?'Manuelle Update-Prüfung gestartet':'Manual update check started',{version:VERSION,repo:defaults.updateRepositoryUrl});
      var started=updateCheckTick(true);
      if(!started)audit('update_manual_check_blocked',C.language==='de'?'Manuelle Update-Prüfung konnte nicht gestartet werden':'Manual update check could not start',{checking:S.update.checking,applying:S.update.applying},'warning');
      if(S.toolWindows.settings)renderTool('settings');
      return;
    }
    return v2146UiClickBase(e);
  };

  // Preserve references so dispose can distinguish our CM handler on engines that support function identity.
  var receive27=on_cm;
  function apiSnapshot(){return {version:VERSION,build:BUILD,config:C,state:S,party:partyState(),dashboard:dashboardPayload(),update:S.update};}
  P.__ALBOT2__={version:VERSION,build:BUILD,state:S,get config(){return C;},pause:pause,dispose:dispose,snapshot:apiSnapshot,checkUpdate:function(){S.update.checkedAt=0;return updateCheckTick(true);},selfUpdate:function(){return selfUpdate(false);},exportCurrentLog:function(mode){return exportLog(S.segmentStart,clock(),mode||'download');},debug:{partyState:partyState,roleSummary:roleSummary,roleForName:roleForName,activeTankName:activeTankName,healerCanDamage:healerCanDamage,tankAggroTick:tankAggroTick,kiteThreatTick:kiteThreatTick,offensiveSkillTick:offensiveSkillTick,sustainTick:sustainTick,deathTick:deathTick,syncAutoRoster:syncAutoRoster,partyReconcileTick:partyReconcileTick,report:report,peers:peers,chooseGoal:chooseGoal,farmerTick:farmerTick,merchantTick:merchantTick,merchantStandTick:merchantStandTick,elixirCraftUpgradeTick:elixirCraftUpgradeTick,elixirDeliveryCandidate:elixirDeliveryCandidate,dashboardPayload:dashboardPayload,dashboardPublishTick:dashboardPublishTick,manaPlan:v276ManaPlan,combatGroupAnchor:v276CombatGroupAnchorInfo,merchantServiceCandidates:v277MerchantServiceCandidates,merchantServiceTick:v277MerchantServiceTick,merchantSupplyTick:merchantSupplyTick,farmerLootTransferTick:farmerLootTransferTick,supplyRequest:v277OwnSupplyRequest,autoRestockThreshold:v277AutoRestockThreshold,diagnosticTick:v277DiagnosticTick,dashboardCompatibility:v278DashboardCompatibility,recipeAnalysis:v278AnalyzeRecipes,chooseCraftJob:v278ChooseCraftJob,updateCheckTick:updateCheckTick,stateSnapshot:stateSnapshot,audit:audit,brainTick:v290BrainTick,cloudSyncTick:v290CloudSyncTick,farmerUpgradeTick:v290FarmerUpgradeTick,exploreTick:v290ExploreTick,brainStudentPredict:v210Predict,brainStudentFeatures:v210Features,brainOutcomeTick:v210OutcomeTick,brainTelemetry:v210BrainTelemetry,brainDiary:function(){return S.brainDiary.slice();},brainDiaryStats:v212DiaryStats,brainQuality:v213QualitySummary,brainQualityEvaluate:v213QualityEvaluate,brainResearchData:v214ResearchData,brainResearchPrompt:v214ResearchPrompt,brainResearchSummary:v214ResearchSummary}};

  initLogDB();
  performane_trick();
  audit('startup','AiO Bot '+VERSION+' gestartet',{build:BUILD,headless:HEADLESS,roster:C.roster,leader:canonicalLeader(),dashboard:C.webDashboardEnabled,standAutomation:C.merchantStandAutomation});
  if(HEADLESS){gameMessage('AiO Bot '+VERSION+' headless gestartet','#63e1bd');}
  else initUI();
  publishReport();syncAutoRoster(true);updateCheckTick(true);partyReconcileTick();dashboardPublishTick(true);stateAuditTick();
  var timer=P.setInterval(tick,350),uiTimer=P.setInterval(function(){renderAll(false);},1500);
  try { if (typeof on_destroy !== 'undefined') { var previousDestroy=on_destroy; on_destroy=function(){dispose();if(previousDestroy&&previousDestroy!==on_destroy)try{previousDestroy();}catch(e){}}; } } catch(e){}
})();
