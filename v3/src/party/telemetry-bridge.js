'use strict';

const { GameAdapter } = require('../game/adapter');
const { buildCapabilitySnapshot, sanitizeCapabilitySnapshot } = require('../autonomy/capability-sync');
const { deriveMotion, cleanMotion } = require('./moving-target-freshness');

const TELEMETRY_PROTOCOL = 1;
function finite(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function clamp(value, min, max) { const n = finite(value); return n == null ? min : Math.max(min, Math.min(max, n)); }
const ENCOUNTER_OUTCOMES = new Set(['SUCCESS', 'SAFE_ABORT', 'DEATH', 'INTERRUPTED', 'CONTENT_DRIFT', 'PARTY_FAILURE']);
function cleanText(value, max = 128) { const text = String(value == null ? '' : value).trim(); return text ? text.slice(0, max) : null; }
function cleanEncounterOutcome(raw, expectedLeader = null, now = Date.now(), maxAgeMs = 120000) {
  if (!raw || typeof raw !== 'object' || Number(raw.schemaVersion) !== 1) return null;
  const encounterId = cleanText(raw.encounterId, 96); const leaderName = cleanText(raw.leaderName, 64);
  const outcome = cleanText(raw.outcome, 32); const endedAt = finite(raw.endedAt);
  if (!encounterId || !leaderName || !ENCOUNTER_OUTCOMES.has(outcome) || endedAt == null) return null;
  if (expectedLeader && String(expectedLeader) !== leaderName) return null;
  if (Math.abs(finite(now, Date.now()) - endedAt) > Math.max(20000, finite(maxAgeMs) || 120000)) return null;
  const hardCapacity = Math.max(1, Math.min(12, Math.floor(finite(raw.hardCapacity) || 1)));
  return {
    schemaVersion: 1, encounterId, leaderName, outcome,
    lifecycleState: raw.lifecycleState === 'RESOLVED' ? 'RESOLVED' : 'ABORTED',
    monster: cleanText(raw.monster, 64), map: cleanText(raw.map, 64), combatMode: cleanText(raw.combatMode, 32),
    partyFingerprint: cleanText(raw.partyFingerprint, 160), pullContextFingerprint: cleanText(raw.pullContextFingerprint, 160),
    contentDisposition: cleanText(raw.contentDisposition, 32),
    hardCapacity, desiredPullSize: Math.max(1, Math.min(hardCapacity, Math.floor(finite(raw.desiredPullSize) || 1))),
    maxEngaged: Math.max(1, Math.min(12, Math.floor(finite(raw.maxEngaged) || 1))),
    durationSeconds: Math.max(0, finite(raw.durationSeconds) || 0), xp: Math.max(0, finite(raw.xp) || 0), gold: finite(raw.gold) || 0,
    kills: Math.max(0, finite(raw.kills) || 0), deaths: Math.max(0, finite(raw.deaths) || 0),
    retreats: Math.max(0, Math.floor(finite(raw.retreats) || 0)), nearDeaths: Math.max(0, Math.floor(finite(raw.nearDeaths) || 0)),
    potions: Math.max(0, finite(raw.potions) || 0), skillExecutions: Math.max(0, Math.floor(finite(raw.skillExecutions) || 0)),
    aoeSkillExecutions: Math.max(0, Math.floor(finite(raw.aoeSkillExecutions) || 0)),
    movementFailures: Math.max(0, Math.floor(finite(raw.movementFailures) || 0)), skillFailures: Math.max(0, Math.floor(finite(raw.skillFailures) || 0)),
    safetyMargin: clamp(raw.safetyMargin, 0, 1), adaptiveRecommendation: cleanText(raw.adaptiveRecommendation, 64),
    adaptiveConfidence: clamp(raw.adaptiveConfidence, 0, 1), score: clamp(raw.score, 0, 1), learningEligible: raw.learningEligible === true,
    startedAt: finite(raw.startedAt), endedAt
  };
}
function potionSummary(inventory = []) {
  const totals = { hpPotions: 0, mpPotions: 0, preferredHpPotion: null, preferredMpPotion: null };
  const hp = new Map(); const mp = new Map();
  for (const item of Array.isArray(inventory) ? inventory : []) {
    if (!item || !item.name) continue;
    const name = String(item.name); const quantity = Math.max(1, finite(item.q) || 1);
    if (/^hpot/i.test(name)) hp.set(name, (hp.get(name) || 0) + quantity);
    else if (/^mpot/i.test(name)) mp.set(name, (mp.get(name) || 0) + quantity);
  }
  const rank = (map) => [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const h = rank(hp); const m = rank(mp);
  totals.hpPotions = h.reduce((sum, row) => sum + row[1], 0); totals.mpPotions = m.reduce((sum, row) => sum + row[1], 0);
  totals.preferredHpPotion = h.length ? h[0][0] : null; totals.preferredMpPotion = m.length ? m[0][0] : null;
  return totals;
}
class PartyTelemetryBridge {
  constructor(options = {}) {
    this.root = options.root || globalThis; this.now = options.now || (() => Date.now()); this.log = options.log || null; this.adapter = options.adapter || new GameAdapter({ root: this.root, parent: this.root && this.root.parent, log: this.log, now: this.now, mode: options.mode === 'shadow' ? 'shadow' : 'active' }); this.merchantName = options.merchantName || null; this.trustedNames = new Set((options.trustedNames || []).map(String)); this.sendIntervalMs = Math.max(2000, Math.min(60000, Number(options.sendIntervalMs) || 5000)); this.movingSendIntervalMs = Math.max(750, Math.min(this.sendIntervalMs, Number(options.movingSendIntervalMs) || 1200)); this.reportTtlMs = Math.max(this.sendIntervalMs * 2, Math.min(5 * 60 * 1000, Number(options.reportTtlMs) || 20000)); this.capacity = Math.max(4, Math.min(64, Number(options.capacity) || 16)); this.lastSentAt = 0; this.reports = new Map(); this.stats = { sent: 0, peerSent: 0, merchantSent: 0, received: 0, rejected: 0, sendFailures: 0, expired: 0, capabilityReports: 0, encounterOutcomeReports: 0 }; this.installed = false; this.previousOnCm = null;
  }
  _event(event, data = {}, severity = 'info', reason = null) { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'party-telemetry', event, severity, reason, data }); }
  setTrustedNames(names) { this.trustedNames = new Set((names || []).filter(Boolean).map(String)); return [...this.trustedNames].sort(); }
  setMerchantName(name) { this.merchantName = name ? String(name) : null; return this.merchantName; }
  _character() { return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null; }
  installReceiver() { if (this.installed) return false; const root = this.root; if (!root) return false; this.previousOnCm = typeof root.on_cm === 'function' ? root.on_cm : null; const self = this; root.on_cm = function onPartyTelemetry(name, data) { try { self.receive(name, data); } catch (_) {} if (self.previousOnCm) return self.previousOnCm.apply(this, arguments); return undefined; }; this.installed = true; return true; }
  uninstallReceiver() { if (!this.installed || !this.root) return false; if (this.root.on_cm && this.root.on_cm.name === 'onPartyTelemetry') this.root.on_cm = this.previousOnCm || undefined; this.installed = false; return true; }
  _cleanReport(report, sender) {
    if (!report || report.type !== 'aio-v3-party-report' || Number(report.protocol) !== TELEMETRY_PROTOCOL) return null; const name = String(sender || report.name || ''); if (!name || (this.trustedNames.size && !this.trustedNames.has(name))) return null; const at = finite(report.at); if (at == null || Math.abs(this.now() - at) > this.reportTtlMs * 2) return null; const rates = report.rates && typeof report.rates === 'object' ? report.rates : {}; const safety = report.safety && typeof report.safety === 'object' ? report.safety : {}; const supplies = report.supplies && typeof report.supplies === 'object' ? report.supplies : {};
    const cleanPotionName = (value, prefix) => { const name = value == null ? null : String(value).slice(0, 64); return name && name.toLowerCase().startsWith(prefix) ? name : null; };
    const ctype = String(report.ctype || 'unknown').toLowerCase();
    const level = Math.max(0, finite(report.level) || 0);
    const capabilities = sanitizeCapabilitySnapshot(report.capabilities, { name, ctype, level });
    const encounterOutcome = cleanEncounterOutcome(report.encounterOutcome, name, this.now(), Math.max(60000, this.reportTtlMs * 6));
    const motion = cleanMotion(report.motion || {});
    return { protocol: TELEMETRY_PROTOCOL, name, ctype, level, map: report.map == null ? null : String(report.map), x: finite(report.x), y: finite(report.y), targetMonster: report.targetMonster == null ? null : String(report.targetMonster), hpRatio: clamp(report.hpRatio, 0, 1), mpRatio: clamp(report.mpRatio, 0, 1), rip: report.rip === true, active: report.active !== false, rates: { xpPerHour: Math.max(0, finite(rates.xpPerHour) || 0), goldPerHour: finite(rates.goldPerHour) || 0, killsPerHour: Math.max(0, finite(rates.killsPerHour) || 0), deathsPerHour: Math.max(0, finite(rates.deathsPerHour) || 0), potionsPerHour: Math.max(0, finite(rates.potionsPerHour) || 0), damageTakenPerHour: Math.max(0, finite(rates.damageTakenPerHour) || 0) }, supplies: { inventorySize: Math.max(0, finite(supplies.inventorySize) || 0), inventoryUsed: Math.max(0, finite(supplies.inventoryUsed) || 0), freeSlots: Math.max(0, finite(supplies.freeSlots) || 0), hpPotions: Math.max(0, finite(supplies.hpPotions) || 0), mpPotions: Math.max(0, finite(supplies.mpPotions) || 0), preferredHpPotion: cleanPotionName(supplies.preferredHpPotion, 'hpot'), preferredMpPotion: cleanPotionName(supplies.preferredMpPotion, 'mpot') }, safety: { retreat: safety.retreat === true, emergency: safety.emergency === true, movementCircuitOpen: safety.movementCircuitOpen === true, skillFailureBackoffs: Math.max(0, finite(safety.skillFailureBackoffs) || 0) }, motion, capabilities, encounterOutcome, at };
  }
  receive(sender, data) { const clean = this._cleanReport(data, sender); if (!clean) { this.stats.rejected += 1; return false; } const previous = this.reports.get(clean.name) || null; clean.motion = deriveMotion(previous, { ...clean, speed: clean.motion && clean.motion.declaredSpeed, moving: clean.motion && clean.motion.moving, kiteActive: clean.motion && clean.motion.kiteActive }); if (!this.reports.has(clean.name) && this.reports.size >= this.capacity) { const oldest = [...this.reports.entries()].sort((a, b) => a[1].at - b[1].at)[0]; if (oldest) this.reports.delete(oldest[0]); } this.reports.set(clean.name, clean); this.stats.received += 1; if (clean.capabilities) this.stats.capabilityReports += 1; if (clean.encounterOutcome) this.stats.encounterOutcomeReports += 1; return true; }
  buildLocalReport(runtime) {
    const c = runtime && runtime.lastSnapshot && runtime.lastSnapshot.character || this._character(); if (!c) return null; const perf = runtime && runtime.performance && runtime.performance.status().current; const rates = perf && perf.rates || {}; const farmer = runtime && typeof runtime.farmerStatus === 'function' ? runtime.farmerStatus() : {}; const movement = runtime && runtime.adapter && typeof runtime.adapter.stabilityStatus === 'function' ? runtime.adapter.stabilityStatus().movement : null; const local = runtime && runtime.localFarming && typeof runtime.localFarming.status === 'function' ? runtime.localFarming.status() : null; const inventory = Array.isArray(c.inventory) ? c.inventory : []; const rawSize = finite(c.isize); const size = Math.max(0, Math.floor(rawSize == null ? inventory.length : rawSize)); const boundedInventory = inventory.slice(0, size); const used = boundedInventory.filter(Boolean).length; const potions = potionSummary(boundedInventory);
    const encounterOutcome = cleanEncounterOutcome(runtime && (runtime.lastEncounterOutcome || runtime.encounterLifecycle && runtime.encounterLifecycle.lastOutcome), c.name, this.now(), Math.max(60000, this.reportTtlMs * 6));
    const lastKite = runtime && runtime.farmer && runtime.farmer.lastKiteMove || farmer && farmer.kiting && farmer.kiting.lastMove || null;
    const kiteActive = !!(lastKite && this.now() - (finite(lastKite.at) || 0) <= Math.max(1500, this.movingSendIntervalMs * 2));
    const motion = { mode: kiteActive ? 'KITE' : c.moving ? 'MOVING' : 'STABLE', moving: c.moving === true || kiteActive, kiteActive, declaredSpeed: Math.max(0, finite(c.speed) || 0) };
    return { type: 'aio-v3-party-report', protocol: TELEMETRY_PROTOCOL, name: c.name, ctype: c.ctype, level: c.level, map: c.map, x: finite(c.x != null ? c.x : c.real_x), y: finite(c.y != null ? c.y : c.real_y), targetMonster: farmer && farmer.targetType || local && local.currentPlan && local.currentPlan.monster || null, hpRatio: c.max_hp > 0 ? c.hp / c.max_hp : 0, mpRatio: c.max_mp > 0 ? c.mp / c.max_mp : 0, rip: !!c.rip, active: true, rates: { xpPerHour: Math.max(0, finite(rates.xpPerHour) || 0), goldPerHour: finite(rates.goldPerHour) || 0, killsPerHour: Math.max(0, finite(rates.killsPerHour) || 0), deathsPerHour: Math.max(0, finite(rates.deathsPerHour) || 0), potionsPerHour: Math.max(0, finite(rates.potionsPerHour) || 0), damageTakenPerHour: Math.max(0, finite(rates.damageTakenPerHour) || 0) }, supplies: { inventorySize: size, inventoryUsed: used, freeSlots: Math.max(0, size - used), ...potions }, safety: { retreat: !!(runtime && runtime.pendingEmergencyRetreat), emergency: !!(runtime && runtime.lastEmergencyDisengage && this.now() - runtime.lastEmergencyDisengage.at < 10000), movementCircuitOpen: !!(movement && movement.circuitOpen), skillFailureBackoffs: Array.isArray(farmer && farmer.skillUsage && farmer.skillUsage.activeFailureBackoffs) ? farmer.skillUsage.activeFailureBackoffs.length : 0 }, motion, capabilities: buildCapabilitySnapshot(runtime, c), encounterOutcome, at: this.now() };
  }
  tick(runtime) {
    this.prune();
    const c = this._character();
    const farmer = runtime && runtime.farmer; const lastKite = farmer && farmer.lastKiteMove || null; const motionActive = !!(c && (c.moving === true || lastKite && this.now() - (finite(lastKite.at) || 0) <= Math.max(1500, this.movingSendIntervalMs * 2))); const intervalMs = motionActive ? this.movingSendIntervalMs : this.sendIntervalMs;
    if (!c || (this.merchantName && String(c.name) === String(this.merchantName)) || this.now() - this.lastSentAt < intervalMs) return false;
    const runtimeAdapter = runtime && runtime.adapter;
    const adapter = runtimeAdapter && typeof runtimeAdapter.command === 'function' ? runtimeAdapter : this.adapter;
    if (!adapter || typeof adapter.command !== 'function') return false;
    if (typeof adapter.canCommand === 'function' && !adapter.canCommand('send_cm')) return false;
    const report = this.buildLocalReport(runtime);
    if (!report) return false;
    const recipients = new Set();
    if (this.merchantName && String(this.merchantName) !== String(c.name)) recipients.add(String(this.merchantName));
    for (const member of runtime && runtime.lastSnapshot && runtime.lastSnapshot.party || []) {
      const name = member && member.name ? String(member.name) : null;
      if (name && name !== String(c.name) && (!this.trustedNames.size || this.trustedNames.has(name))) recipients.add(name);
    }
    if (!recipients.size) return false;
    this.lastSentAt = this.now();
    let sent = 0;
    for (const recipient of recipients) {
      try {
        const command = adapter.command('send_cm', [recipient, report]);
        if (!command.executed) {
          if (command.shadow) continue;
          throw new Error(command.reason || 'SEND_CM_REJECTED');
        }
        const pending = command.value;
        Promise.resolve(pending).catch((error) => {
          this.stats.sendFailures += 1;
          this._event('PARTY_TELEMETRY_SEND_FAILED', { recipient, message: String(error && error.message || error) }, 'warn', 'SEND_CM_FAILED');
        });
        this.stats.sent += 1;
        if (recipient === this.merchantName) this.stats.merchantSent += 1;
        else this.stats.peerSent += 1;
        sent += 1;
      } catch (error) {
        this.stats.sendFailures += 1;
        this._event('PARTY_TELEMETRY_SEND_FAILED', { recipient, message: String(error && error.message || error) }, 'warn', 'SEND_CM_FAILED');
      }
    }
    return sent > 0;
  }
  prune() { const now = this.now(); for (const [name, report] of this.reports) if (now - report.at > this.reportTtlMs) { this.reports.delete(name); this.stats.expired += 1; } }
  capabilityReports(names = []) {
    this.prune();
    const wanted = names.length ? new Set(names.map(String)) : null;
    return Object.fromEntries([...this.reports.values()]
      .filter((report) => report && report.capabilities && (!wanted || wanted.has(report.name)))
      .map((report) => [report.name, { ...report.capabilities, reportAt: report.at }]));
  }


  encounterOutcomes(names = []) {
    this.prune();
    const wanted = names.length ? new Set(names.map(String)) : null;
    return Object.fromEntries([...this.reports.values()]
      .filter((report) => report && report.encounterOutcome && (!wanted || wanted.has(report.name)))
      .map((report) => [report.name, { ...report.encounterOutcome, reportAt: report.at }]));
  }

  aggregate(names = []) {
    this.prune(); const wanted = names.length ? new Set(names.map(String)) : null; const reports = [...this.reports.values()].filter((report) => !wanted || wanted.has(report.name)); const out = { freshReports: reports.length, xpPerHour: 0, goldPerHour: 0, killsPerHour: 0, deathsPerHour: 0, potionsPerHour: 0, damageTakenPerHour: 0, minHpRatio: reports.length ? 1 : null, minMpRatio: reports.length ? 1 : null, retreats: 0, emergencies: 0, movementCircuits: 0, skillFailureBackoffs: 0, reports: reports.map((report) => ({ ...report })) };
    for (const report of reports) { for (const key of ['xpPerHour', 'goldPerHour', 'killsPerHour', 'deathsPerHour', 'potionsPerHour', 'damageTakenPerHour']) out[key] += report.rates[key]; out.minHpRatio = Math.min(out.minHpRatio, report.hpRatio); out.minMpRatio = Math.min(out.minMpRatio, report.mpRatio); if (report.safety.retreat) out.retreats += 1; if (report.safety.emergency) out.emergencies += 1; if (report.safety.movementCircuitOpen) out.movementCircuits += 1; out.skillFailureBackoffs += report.safety.skillFailureBackoffs; } return out;
  }
  status() { this.prune(); const reports = [...this.reports.values()].sort((a, b) => b.at - a.at); return { protocol: TELEMETRY_PROTOCOL, merchantName: this.merchantName, sendIntervalMs: this.sendIntervalMs, movingSendIntervalMs: this.movingSendIntervalMs, reportTtlMs: this.reportTtlMs, trustedNames: [...this.trustedNames].sort(), reports, capabilityReports: reports.filter((row) => !!row.capabilities).map((row) => ({ name: row.name, ctype: row.ctype, at: row.at, catalog: row.capabilities.catalog, combatMode: row.capabilities.combatMode, skills: row.capabilities.skills.length })), encounterOutcomes: reports.filter((row) => !!row.encounterOutcome).map((row) => ({ name: row.name, encounterId: row.encounterOutcome.encounterId, outcome: row.encounterOutcome.outcome, endedAt: row.encounterOutcome.endedAt })), stats: { ...this.stats } }; }
}
module.exports = { PartyTelemetryBridge, TELEMETRY_PROTOCOL, potionSummary, cleanEncounterOutcome };
