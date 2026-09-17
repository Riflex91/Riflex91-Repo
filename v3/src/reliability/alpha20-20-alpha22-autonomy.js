'use strict';

const { installIntegratedPartyControl } = require('./integrated-party-control');
const { installAlpha2015CombatLogisticsHotfix } = require('../party/alpha20-15-combat-logistics-hotfix');
const { patchAlpha2015LogisticsFairness } = require('../party/alpha20-15-logistics-fairness-hotfix');
const { sellMetadataConsensus, rawSellProtectionReasons } = require('../economy/sell-safety');

const ALPHA20_20_MODE = 'alpha20.20-continuous-combat-service-v1';
const ALPHA22_MODE = 'alpha22-closed-loop-economy-v1';
const BC_NAME = 'aio-v3-party-bus-v1';
const BC_TTL = 10000;

const num = (v, fallback = null) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const nameOf = (v) => { const s = String(v == null ? '' : v).trim(); return s || null; };
const clone = (v) => { try { return v == null ? v : JSON.parse(JSON.stringify(v)); } catch (_) { return null; } };
const levelOf = (item) => Math.max(0, Math.floor(num(item && item.level, 0) || 0));
const qtyOf = (item) => Math.max(1, Math.floor(num(item && item.q, 1) || 1));
const median = (values) => { const a = (values || []).map(Number).filter(Number.isFinite).sort((x, y) => x - y); if (!a.length) return null; const i = Math.floor(a.length / 2); return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2; };
const isQuotaError = (error) => { const s = String(error && error.message || error || '').toLowerCase(); return s.includes('quota') || (s.includes('storage') && s.includes('exceed')); };

function rows(character) {
  const items = character && (character.inventory || character.items);
  return Array.isArray(items) ? items.map((item, index) => item && item.index == null ? { ...item, index } : item) : [];
}
function count(character, itemName) { return rows(character).reduce((n, item) => item && item.name === itemName ? n + qtyOf(item) : n, 0); }
function metrics(character) {
  const items = rows(character); const capacity = Math.max(0, Math.floor(num(character && character.isize, items.length) || 0));
  const occupied = items.slice(0, capacity || items.length).filter(Boolean).length;
  return { capacity, occupied, freeSlots: Math.max(0, capacity - occupied) };
}
function dist(a, b) {
  const ax = num(a && (a.real_x != null ? a.real_x : a.x)), ay = num(a && (a.real_y != null ? a.real_y : a.y));
  const bx = num(b && (b.real_x != null ? b.real_x : b.x)), by = num(b && (b.real_y != null ? b.real_y : b.y));
  return [ax, ay, bx, by].some((v) => v == null) ? Infinity : Math.hypot(ax - bx, ay - by);
}
function fn(root, key) {
  if (root && typeof root[key] === 'function') return { owner: root, fn: root[key] };
  if (root && root.parent && typeof root.parent[key] === 'function') return { owner: root.parent, fn: root.parent[key] };
  return null;
}
function gd(root, runtime) { return root && root.G || root && root.parent && root.parent.G || runtime && runtime.adapter && runtime.adapter.getGameData && runtime.adapter.getGameData() || {}; }
function gradeForLevel(meta, level) {
  const grades = meta && Array.isArray(meta.grades) ? meta.grades : []; const l = levelOf({ level });
  if (grades.length > 1 && l >= Number(grades[1])) return 2;
  if (grades.length && l >= Number(grades[0])) return 1;
  return 0;
}

class MarketValueOracle {
  constructor({ root = globalThis, runtime = null, now = () => Date.now(), maxAgeMs = 20 * 60 * 1000 } = {}) {
    this.root = root; this.runtime = runtime; this.now = now; this.maxAgeMs = Math.max(30000, num(maxAgeMs, 1200000));
    this.samples = new Map(); this.lastObservedAt = null; this.stats = { scans: 0, offers: 0, invalidOffers: 0 };
  }
  _key(name, level) { return `${String(name || '')}:${levelOf({ level })}`; }
  _add(name, level, side, price, quantity = 1, source = null) {
    const p = num(price); if (!name || p == null || p <= 0) { this.stats.invalidOffers += 1; return; }
    const key = this._key(name, level), row = this.samples.get(key) || { asks: [], bids: [] };
    row[side === 'bid' ? 'bids' : 'asks'].push({ price: p, quantity: qtyOf({ q: quantity }), at: this.now(), source });
    row.asks = row.asks.slice(-64); row.bids = row.bids.slice(-64); this.samples.set(key, row); this.stats.offers += 1;
  }
  _prune() { const cutoff = this.now() - this.maxAgeMs; for (const [k, r] of this.samples) { r.asks = r.asks.filter((x) => x.at >= cutoff); r.bids = r.bids.filter((x) => x.at >= cutoff); if (!r.asks.length && !r.bids.length) this.samples.delete(k); } }
  observe() {
    const parent = this.root && (this.root.parent || this.root) || {}, entities = parent.entities || {};
    for (const entity of Object.values(entities)) {
      if (!entity || entity.mtype || !entity.slots) continue;
      for (const offer of Array.isArray(entity.slots) ? entity.slots : Object.values(entity.slots)) {
        if (!offer || !offer.name) continue;
        const buying = offer.b === true || offer.buying === true || String(offer.side || '').toLowerCase() === 'buy';
        this._add(String(offer.name), levelOf(offer), buying ? 'bid' : 'ask', offer.price != null ? offer.price : offer.g, offer.q, entity.name || entity.id || 'merchant');
      }
    }
    this.lastObservedAt = this.now(); this.stats.scans += 1; this._prune(); return this.status();
  }
  addObservation(o = {}) { this._add(nameOf(o.name), o.level, o.side === 'bid' || o.buying ? 'bid' : 'ask', o.price, o.quantity, o.source || 'external'); this._prune(); return this.quote(o.name, o.level); }
  quote(itemName, level = 0) {
    this._prune(); const r = this.samples.get(this._key(itemName, level)) || { asks: [], bids: [] };
    const ask = median(r.asks.map((x) => x.price)), bid = r.bids.length ? Math.max(...r.bids.map((x) => x.price)) : null;
    const meta = gd(this.root, this.runtime).items && gd(this.root, this.runtime).items[itemName]; const fallback = num(meta && (meta.g != null ? meta.g : meta.gold));
    const fairValue = ask != null && bid != null ? (ask + bid) / 2 : ask != null ? ask : bid != null ? bid : fallback;
    const source = ask != null && bid != null ? 'market-spread' : ask != null ? 'market-ask' : bid != null ? 'market-bid' : fallback != null ? 'game-data-fallback' : 'unknown';
    const sampleCount = r.asks.length + r.bids.length;
    return { name: nameOf(itemName), level: levelOf({ level }), fairValue, medianAsk: ask, maxBid: bid, sampleCount, confidence: sampleCount >= 6 ? 1 : sampleCount >= 3 ? .75 : sampleCount ? .5 : fallback != null ? .2 : 0, source, observedAt: this.lastObservedAt };
  }
  status() { return { schemaVersion: 1, mode: 'alpha22-market-value-oracle-v1', trackedItems: this.samples.size, lastObservedAt: this.lastObservedAt, stats: { ...this.stats } }; }
}

function installQuotaSafeBroadcastFallback(runtime, stats) {
  const transport = runtime && runtime.partyAccountCommunication && runtime.partyAccountCommunication.transport;
  if (!transport || transport.__alpha2020QuotaBroadcastInstalled) return false;
  const root = runtime.root || globalThis, BC = root.BroadcastChannel || (typeof BroadcastChannel === 'function' ? BroadcastChannel : null);
  if (typeof BC !== 'function') return false;
  let channel; try { channel = new BC(BC_NAME); } catch (_) { return false; }
  const baseSend = transport.send.bind(transport), now = runtime.now || (() => Date.now()), pending = new Map(), seen = new Map(); let seq = 0;
  const post = (x) => channel.postMessage({ __aioV3: true, bus: BC_NAME, ...x });
  channel.onmessage = (event) => {
    const m = event && event.data || {}; if (!m.__aioV3 || m.bus !== BC_NAME || !m.id || Math.abs(now() - num(m.at, 0)) > BC_TTL || nameOf(m.target) !== transport.localName()) return;
    if (m.kind === 'ACK') { const p = pending.get(String(m.id)); if (!p || nameOf(m.sender) !== p.target) return; pending.delete(String(m.id)); clearTimeout(p.timer); stats.broadcastAcks += 1; p.resolve({ delivered: true, acknowledged: true, transport: 'broadcast_channel_quota_fallback', target: p.target, sender: transport.localName() }); return; }
    if (m.kind !== 'DATA') return; const sender = nameOf(m.sender), receiver = nameOf(m.receiver);
    if (!sender || !transport.isOwned(sender) || !receiver || !receiver.startsWith('__AIO_V3_') || typeof root[receiver] !== 'function') { stats.broadcastRejected += 1; return; }
    const cutoff = now() - BC_TTL * 2; for (const [id, at] of seen) if (at < cutoff) seen.delete(id); if (seen.has(String(m.id))) return; seen.set(String(m.id), now());
    try { root[receiver](sender, m.payload); stats.broadcastReceived += 1; post({ kind: 'ACK', id: String(m.id), at: now(), sender: transport.localName(), target: sender }); } catch (_) { stats.broadcastRejected += 1; }
  };
  transport.send = async (targetName, payload, options = {}) => {
    try { return await baseSend(targetName, payload, options); } catch (error) {
      if (!isQuotaError(error)) throw error; const target = nameOf(targetName), sender = nameOf(options.sender) || transport.localName(), receiver = nameOf(options.receiver);
      if (!target || !sender || !receiver || !receiver.startsWith('__AIO_V3_') || !transport.isOwned(target)) throw error;
      stats.broadcastFallbacks += 1; const id = `bc-${now()}-${++seq}`;
      return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(id); stats.broadcastTimeouts += 1; reject(error); }, 1400); pending.set(id, { target, resolve, timer }); try { post({ kind: 'DATA', id, at: now(), sender, target, receiver, payload }); } catch (e) { clearTimeout(timer); pending.delete(id); reject(e); } });
    }
  };
  transport.__alpha2020QuotaBroadcastInstalled = true; transport.__alpha2020QuotaBroadcastChannel = channel; return true;
}

function installCombatContinuity(runtime, stats) {
  const farmer = runtime && runtime.farmer, team = runtime && runtime.teamCombatCohesionHotfix;
  if (!farmer || !team || farmer.__alpha2020CombatContinuityInstalled) return false;
  if (typeof team._combatGate === 'function') {
    const baseGate = team._combatGate.bind(team);
    team._combatGate = (context, target, phase) => {
      const r = baseGate(context, target, phase); if (!r || r.allowed || !target || target.dead) return r;
      const state = r.team || team._team(context && context.snapshot), supply = team._localSupply ? team._localSupply(context && context.snapshot) : { ready: true };
      if (!state || !state.complete || !state.alive || !state.sameMap || !state.positionsKnown || supply.ready === false) return r;
      const partyAggro = !!(target.target && state.names.includes(String(target.target))), damaged = num(target.max_hp) != null && num(target.hp) != null && target.hp < target.max_hp - .5, tracked = farmer.targetId != null && String(farmer.targetId) === String(target.id);
      if (!partyAggro && !(tracked && damaged)) return r; stats.combatGateContinuations += 1; return { allowed: true, team: state, reason: 'ACTIVE_ENCOUNTER_CONTINUATION', phase, previousReason: r.reason || null };
    };
  }
  if (typeof farmer._selectTarget === 'function') {
    const base = farmer._selectTarget.bind(farmer);
    farmer._selectTarget = (context) => {
      const s = base(context); if (s && s.target) return s; const snapshot = context && context.snapshot; if (!snapshot || typeof farmer._safeLiveMonsters !== 'function') return s;
      const state = team._team(snapshot); if (!state || !state.complete || !state.alive || !state.sameMap) return s; const safe = farmer._safeLiveMonsters(snapshot, context.party) || [];
      let target = safe.filter((x) => x && x.target && state.names.includes(String(x.target))).sort((a, b) => num(a.hp, Infinity) - num(b.hp, Infinity))[0] || null;
      if (!target && farmer.targetId != null) target = safe.find((x) => x && String(x.id) === String(farmer.targetId) && num(x.max_hp) != null && num(x.hp) != null && x.hp < x.max_hp - .5) || null;
      if (!target) return s; stats.combatFallbackSelections += 1; return { target, ranking: { monster: target.mtype || null, score: Number.MAX_SAFE_INTEGER - 2, travelSeconds: 0, xpPerHour: 0, goldPerHour: 0, deathsPerHour: 0, confidence: 1, source: 'alpha20.20-active-encounter-continuation' } };
    };
  }
  farmer.__alpha2020CombatContinuityInstalled = true; return true;
}

function installCombatLootHandoff(runtime, stats) {
  const logistics = runtime && runtime.controlledPartyLogistics; if (!logistics || logistics.__alpha2020CombatLootInstalled || typeof logistics._safeForOutbound !== 'function') return false;
  const base = logistics._safeForOutbound.bind(logistics);
  logistics._safeForOutbound = (snapshot) => {
    if (base(snapshot)) return true; const c = snapshot && snapshot.character, farmer = runtime.farmer; if (!c || !farmer || farmer.state !== 'ENGAGE' || c.rip || c.dead || runtime.pendingEmergencyRetreat) return false;
    if (num(c.hp) == null || num(c.max_hp) == null || c.max_hp <= 0 || c.hp / c.max_hp < .72) return false;
    const aggro = (snapshot.entities || []).filter((x) => x && x.mtype && !x.dead && String(x.target || '') === String(c.name || '')); if (aggro.length > 2) return false;
    const target = (snapshot.entities || []).find((x) => x && farmer.targetId != null && String(x.id) === String(farmer.targetId)); const active = aggro.length || target && num(target.max_hp) != null && num(target.hp) != null && target.hp < target.max_hp - .5;
    if (!active) return false; stats.combatLootWindows += 1; return true;
  };
  logistics.__alpha2020CombatLootInstalled = true; return true;
}

class MerchantEconomyAutonomy {
  constructor(runtime, oracle, options = {}) {
    this.runtime = runtime; this.root = runtime.root || globalThis; this.now = runtime.now || (() => Date.now()); this.log = runtime.log || null; this.oracle = oracle;
    this.cfg = { interval: Math.max(600, num(options.intervalMs, 1200)), lowSlots: Math.max(4, num(options.economyFreeSlots, 8)), targetSlots: Math.max(8, num(options.targetFreeSlots, 14)), potionLow: Math.max(200, num(options.potionLow, 1500)), potionTarget: Math.max(1000, num(options.potionTarget, 6000)), goldReserve: Math.max(0, num(options.goldReserve, 1000000)), keepValue: Math.max(10000, num(options.keepValue, 1000000)), upgradeCap: Math.max(10000, num(options.upgradeValueCap, 2000000)), compoundCap: Math.max(10000, num(options.compoundValueCap, 500000)), maxUpgrade: Math.max(0, Math.min(4, num(options.maxUpgradeLevel, 2))), maxCompound: Math.max(0, Math.min(3, num(options.maxCompoundLevel, 1))), range: Math.max(150, Math.min(600, num(options.transferDistance, 400))) };
    this.lastTick = -Infinity; this.lastMarket = -Infinity; this.lastMove = -Infinity; this.busy = false; this.lastDecision = null; this.lastAction = null; this.journal = this._loadJournal();
    this.stats = { cycles: 0, partyPreemptions: 0, buys: 0, gearTransfers: 0, bankStores: 0, sells: 0, upgrades: 0, compounds: 0, failedSafe: 0, travelRequests: 0 };
  }
  _c() { return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null; }
  _merchant() { const c = this._c(); return !!(c && String(c.ctype || c.type || '').toLowerCase() === 'merchant'); }
  _active() { return this.runtime.adapter && String(this.runtime.adapter.mode) === 'active'; }
  _command(action, args = []) { const adapter=this.runtime&&this.runtime.adapter;if(!adapter||typeof adapter.command!=='function')return null;if(typeof adapter.canCommand==='function'&&!adapter.canCommand(action))return null;const command=adapter.command(action,args);return command&&command.executed?command:null; }
  _combat() { const c = this._c(); if (!c) return false; if (c.target) return true; const p = this.root.parent || this.root; return Object.values(p.entities || {}).some((x) => x && !x.dead && String(x.target || '') === String(c.name || '')); }
  _inv() { return rows(this._c()); }
  _g() { return gd(this.root, this.runtime); }
  _storage() { const x = this.root && this.root.localStorage; return x && typeof x.getItem === 'function' && typeof x.setItem === 'function' ? x : null; }
  _loadJournal() { const s = this._storage(); if (!s) return null; try { const r = JSON.parse(s.getItem('aio-v3:alpha22-economy-journal:v1') || 'null'); return r && !['COMMITTED','FAILED_SAFE','ABORTED'].includes(r.state) ? { ...r, state: 'FAILED_SAFE', reason: 'RESTART_UNCERTAIN_NO_RETRY', recoveredAt: this.now() } : r; } catch (_) { return null; } }
  _saveJournal(r) { this.journal = clone(r); const s = this._storage(); if (!s) return true; try { s.setItem('aio-v3:alpha22-economy-journal:v1', JSON.stringify(r)); return true; } catch (_) { return false; } }
  _begin(kind, data) { const r = { schemaVersion: 1, id: `eco-${this.now()}-${kind.toLowerCase()}`, kind, state: 'RESERVED', reason: 'PERSISTED_BEFORE_ACTION', createdAt: this.now(), updatedAt: this.now(), ...clone(data) }; return this._saveJournal(r) ? r : null; }
  _state(state, reason, extra = {}) { return this.journal ? this._saveJournal({ ...this.journal, ...clone(extra), state, reason, updatedAt: this.now() }) : false; }
  _sleep(ms) { const st = this.root && this.root.setTimeout || setTimeout; return new Promise((r) => st(r, ms)); }
  async _verify(pred, tries = 8) { for (let i = 0; i < tries; i += 1) { try { if (pred()) return true; } catch (_) {} if (i + 1 < tries) await this._sleep(80); } return false; }
  _reports() { const s = this.runtime.partyTelemetry && this.runtime.partyTelemetry.status && this.runtime.partyTelemetry.status(); return Array.isArray(s && s.reports) ? s.reports : []; }
  _trusted() { try { return this.runtime.partyBootstrap && this.runtime.partyBootstrap.trustedRosterNames ? this.runtime.partyBootstrap.trustedRosterNames() || [] : []; } catch (_) { return []; } }
  _goals() { const g = this.runtime.gearProgression && this.runtime.gearProgression.list ? this.runtime.gearProgression.list(256) : []; return { goals: g || [], keys: new Set((g || []).map((x) => `${x.item}:${Number(x.observedLevel) || 0}`)) }; }
  _need() {
    const now = this.now(), out = []; for (const r of this._reports()) { if (!r || !r.name || String(r.ctype || '').toLowerCase() === 'merchant' || num(r.at) == null || now - r.at > 30000 || r.rip || r.active === false) continue; const s = r.supplies || {}; const hp = num(s.hpPotions, 99999), mp = num(s.mpPotions, 99999), free = num(s.freeSlots, 99); const priority = hp <= 50 || mp <= 50 ? 100 : free <= 2 ? 95 : hp <= 120 || mp <= 120 ? 80 : free <= 6 ? 70 : 0; if (priority) out.push({ report: r, priority, reason: priority >= 100 ? 'POTIONS_CRITICAL' : priority >= 95 ? 'FARMER_INVENTORY_CRITICAL' : priority >= 80 ? 'POTIONS_LOW' : 'FARMER_INVENTORY_LOW' }); }
    const l = this.runtime.controlledPartyLogistics; if (l && l.rendezvousRequests) for (const r of l.rendezvousRequests.values()) out.push({ report: { name: r.name, map: r.map, x: r.x, y: r.y, at: r.at }, priority: 75, reason: 'LOGISTICS_RENDEZVOUS' });
    return out.sort((a,b) => b.priority - a.priority || num(a.report.at, now) - num(b.report.at, now))[0] || null;
  }
  _move(target, reason) {
    const c = this._c(); if (!c || !target || this.now() - this.lastMove < 2500) return false; const x = num(target.x), y = num(target.y), map = target.map || c.map;
    if (map === c.map && x != null && y != null && dist(c, target) > this.cfg.range * .7 && this.runtime.adapter && this.runtime.adapter.command) { const d = dist(c,target), cx = num(c.real_x != null ? c.real_x : c.x,0), cy = num(c.real_y != null ? c.real_y : c.y,0), step = Math.min(120, Math.max(20, d - this.cfg.range * .55)); this.runtime.adapter.command('move',[cx+(x-cx)/d*step,cy+(y-cy)/d*step]); this.lastMove=this.now();this.stats.travelRequests+=1;return true; }
    if(map!==c.map){try{const command=this._command('smart_move',[x!=null&&y!=null?{map,x,y}:map]);if(command){Promise.resolve(command.value).catch(()=>{});this.lastMove=this.now();this.stats.travelRequests+=1;return true;}}catch(_){}}
    return false;
  }
  _serviceMove(dest,reason){if(this.now()-this.lastMove<2500)return false;try{const command=this._command('smart_move',[dest]);if(!command)return false;Promise.resolve(command.value).catch(()=>{});this.lastMove=this.now();this.stats.travelRequests+=1;this.lastDecision={at:this.now(),action:'SERVICE_TRAVEL',reason,destination:dest};return true;}catch(_){return false;}}
  classifyItem(item,reservations=this._goals()){
    if(!item||!item.name)return{disposition:'KEEP',reason:'ITEM_UNKNOWN',quote:null};const itemName=item.name,level=levelOf(item),meta=this._g().items&&this._g().items[itemName],quote=this.oracle.quote(itemName,level);
    if(/^(hpot|mpot|scroll|cscroll)/i.test(itemName))return{disposition:'KEEP',reason:'SERVICE_RESOURCE',quote};
    if(item.locked||item.l||item.special||item.p)return{disposition:'KEEP',reason:'LOCKED_OR_SPECIAL',quote};
    if(reservations.keys.has(`${itemName}:${level}`))return{disposition:'KEEP',reason:'GEAR_PROGRESSION_RESERVED',quote};
    if(meta&&(meta.quest||meta.q||meta.event||meta.cash||meta.cash_item||meta.soulbound||meta.soul_bound||meta.exchange||meta.e))return{disposition:'KEEP',reason:'RARE_OR_PROTECTED_METADATA',quote};
    if(quote.fairValue!=null&&quote.fairValue>=this.cfg.keepValue)return{disposition:'BANK',reason:'MARKET_VALUE_KEEP',quote};
    const safe=sellMetadataConsensus(this.root,itemName),raw=rawSellProtectionReasons(item);if(safe.ok&&!raw.length&&level===0)return{disposition:'SELL',reason:'LOW_RISK_SURPLUS_MATERIAL',quote};
    return{disposition:'BANK',reason:meta&&(meta.upgrade||meta.compound)?'PROGRESSION_ITEM':'CONSERVATIVE_KEEP',quote};
  }
  async _buy(itemName,wanted){
    const c=this._c(),b=fn(this.root,'buy');if(!c||!b||wanted<=0)return false;const meta=this._g().items&&this._g().items[itemName],price=num(meta&&(meta.g!=null?meta.g:meta.gold),0)||0,affordable=price>0?Math.max(0,Math.floor((Math.max(0,num(c.gold,0)-this.cfg.goldReserve))/price)):wanted,q=Math.min(Math.floor(wanted),affordable);if(q<=0)return false;const before=count(c,itemName);
    try{const r=await Promise.resolve(b.fn.call(b.owner,itemName,q));if(await this._verify(()=>count(this._c(),itemName)>before)||r&&r.success===true){this.stats.buys+=1;this.lastAction={at:this.now(),kind:'BUY',name:itemName,quantity:q};return true;}}catch(_){}return false;
  }
  async _ensure(itemName,target){const have=count(this._c(),itemName);if(have>=target)return true;const cb=fn(this.root,'can_buy');let near=false;if(cb)try{near=!!cb.fn.call(cb.owner,itemName);}catch(_){}if(cb&&!near){this._serviceMove(itemName,`RESTOCK_${itemName}`);return false;}if(await this._buy(itemName,target-have))return true;this._serviceMove(itemName,`RESTOCK_${itemName}`);return false;}
  async _restockPotions(){for(const itemName of ['hpot0','mpot0'])if(count(this._c(),itemName)<this.cfg.potionLow){await this._ensure(itemName,this.cfg.potionTarget);return true;}return false;}
  _visible(characterName){const p=this.root.parent||this.root;return Object.values(p.entities||{}).find((x)=>x&&!x.mtype&&x.name===characterName)||null;}
  async _gearTransfer(res){
    const c=this._c(),goals=res.goals.filter((g)=>g&&g.sourceCharacter===c.name&&g.character!==c.name&&!g.projectedUpgradeRequired).sort((a,b)=>num(b.survivalImprovement,0)-num(a.survivalImprovement,0));
    for(const g of goals){if(!this._trusted().includes(g.character))continue;const item=this._inv().find((x)=>x&&x.name===g.item&&levelOf(x)===Number(g.observedLevel||0));if(!item)continue;const target=this._visible(g.character);if(!target||dist(c,target)>this.cfg.range){const r=this._reports().find((x)=>x&&x.name===g.character);if(r)this._move(r,'GEAR_DELIVERY');return true;}const before=count(c,g.item);try{const command=this.runtime.adapter&&typeof this.runtime.adapter.command==='function'?this.runtime.adapter.command('send_item',[g.character,item.index,1]):{executed:false,reason:'ADAPTER_UNAVAILABLE'};if(!command.executed)return false;const r=await Promise.resolve(command.value);if(await this._verify(()=>count(this._c(),g.item)<before)||r&&r.success===true){this.stats.gearTransfers+=1;this.lastAction={at:this.now(),kind:'GEAR_TRANSFER',target:g.character,item:g.item,level:g.observedLevel};return true;}}catch(_){return false;}}
    return false;
  }
  async _upgrade(res){
    const c=this._c(),goal=res.goals.filter((g)=>g&&g.sourceCharacter===c.name&&g.projectedUpgradeRequired&&Number(g.observedLevel)<Number(g.targetLevel)&&Number(g.observedLevel)<this.cfg.maxUpgrade).sort((a,b)=>num(b.survivalImprovement,0)-num(a.survivalImprovement,0))[0];if(!goal)return false;const item=this._inv().find((x)=>x&&x.name===goal.item&&levelOf(x)===Number(goal.observedLevel||0)),meta=this._g().items&&this._g().items[goal.item];if(!item||!meta||!meta.upgrade||item.locked||item.l||item.special||item.p)return false;const level=levelOf(item),quote=this.oracle.quote(goal.item,level);if(quote.fairValue!=null&&quote.fairValue>this.cfg.upgradeCap)return false;const scroll=`scroll${gradeForLevel(meta,level)}`;if(count(c,scroll)<1){await this._ensure(scroll,1);return true;}const s=this._inv().find((x)=>x&&x.name===scroll),up=fn(this.root,'upgrade');if(!s||!up)return false;if(!this._begin('UPGRADE',{item:goal.item,level,itemIndex:item.index,scroll,scrollIndex:s.index,target:goal.character}))return false;this._state('EXECUTING','RAW_ACTION_STARTING');try{const r=await Promise.resolve(up.fn.call(up.owner,item.index,s.index));this._state('VERIFYING','RAW_ACTION_RETURNED',{response:clone(r)});if(!await this._verify(()=>this._inv().some((x)=>x&&x.name===goal.item&&levelOf(x)>level))){this._state('FAILED_SAFE','UPGRADE_DELTA_NOT_OBSERVED_NO_RETRY');this.stats.failedSafe+=1;return true;}this._state('COMMITTED','UPGRADE_VERIFIED');this.stats.upgrades+=1;this.lastAction={at:this.now(),kind:'UPGRADE',item:goal.item,fromLevel:level,toLevel:level+1,target:goal.character};return true;}catch(e){this._state('FAILED_SAFE','UPGRADE_REJECTED_NO_RETRY',{error:String(e&&e.message||e).slice(0,180)});this.stats.failedSafe+=1;return true;}
  }
  async _compound(res){
    const groups=new Map();for(const item of this._inv()){if(!item||!item.name||item.locked||item.l||item.special||item.p)continue;const level=levelOf(item),meta=this._g().items&&this._g().items[item.name];if(!meta||!meta.compound||level>this.cfg.maxCompound||res.keys.has(`${item.name}:${level}`))continue;const q=this.oracle.quote(item.name,level);if(q.fairValue!=null&&q.fairValue>this.cfg.compoundCap)continue;const k=`${item.name}:${level}`,a=groups.get(k)||[];a.push(item);groups.set(k,a);}const items=[...groups.values()].find((a)=>a.length>=3);if(!items)return false;const trio=items.slice(0,3),meta=this._g().items[trio[0].name],level=levelOf(trio[0]),scroll=`cscroll${gradeForLevel(meta,level)}`;if(count(this._c(),scroll)<1){await this._ensure(scroll,1);return true;}const s=this._inv().find((x)=>x&&x.name===scroll),cp=fn(this.root,'compound');if(!s||!cp)return false;const before=this._inv().filter((x)=>x&&x.name===trio[0].name&&levelOf(x)===level).length;if(!this._begin('COMPOUND',{item:trio[0].name,level,indices:trio.map((x)=>x.index),scroll,scrollIndex:s.index}))return false;this._state('EXECUTING','RAW_ACTION_STARTING');try{const r=await Promise.resolve(cp.fn.call(cp.owner,trio[0].index,trio[1].index,trio[2].index,s.index));this._state('VERIFYING','RAW_ACTION_RETURNED',{response:clone(r)});const changed=await this._verify(()=>this._inv().some((x)=>x&&x.name===trio[0].name&&levelOf(x)>level)||this._inv().filter((x)=>x&&x.name===trio[0].name&&levelOf(x)===level).length<before);if(!changed){this._state('FAILED_SAFE','COMPOUND_DELTA_NOT_OBSERVED_NO_RETRY');this.stats.failedSafe+=1;return true;}this._state('COMMITTED','COMPOUND_VERIFIED');this.stats.compounds+=1;this.lastAction={at:this.now(),kind:'COMPOUND',item:trio[0].name,fromLevel:level,toLevel:level+1};return true;}catch(e){this._state('FAILED_SAFE','COMPOUND_REJECTED_NO_RETRY',{error:String(e&&e.message||e).slice(0,180)});this.stats.failedSafe+=1;return true;}
  }
  async _drain(res){
    if(metrics(this._c()).freeSlots>this.cfg.lowSlots)return false;const candidates=this._inv().filter(Boolean).map((item)=>({item,c:this.classifyItem(item,res)}));const sellable=candidates.find((x)=>x.c.disposition==='SELL');if(sellable){const cs=fn(this.root,'can_sell');let near=!cs;if(cs)try{near=!!cs.fn.call(cs.owner);}catch(_){}if(near){const before=count(this._c(),sellable.item.name);try{const sell=this._command('sell',[sellable.item.index,qtyOf(sellable.item)]);if(sell){const r=await Promise.resolve(sell.value);if(await this._verify(()=>count(this._c(),sellable.item.name)<before)||r&&r.success===true){this.stats.sells+=1;this.lastAction={at:this.now(),kind:'SELL',item:sellable.item.name,quote:sellable.c.quote};return true;}}}catch(_){}}}
    const bankable=candidates.find((x)=>x.c.disposition==='BANK'||x.c.disposition==='SELL');if(!bankable)return false;const c=this._c();if(!c.bank||typeof c.bank!=='object'){this._serviceMove('bank','INVENTORY_CAPACITY_PLAN');return true;}const before=count(c,bankable.item.name);try{const store=this._command('bank_store',[bankable.item.index]);if(!store)return false;const r=await Promise.resolve(store.value);if(await this._verify(()=>count(this._c(),bankable.item.name)<before)||r&&r.success===true){this.stats.bankStores+=1;this.lastAction={at:this.now(),kind:'BANK',item:bankable.item.name,quote:bankable.c.quote};return true;}}catch(_){}return false;
  }
  async cycle(){if(!this._active()||!this._merchant()||this._combat()||this.busy)return false;this.busy=true;this.stats.cycles+=1;try{if(this.now()-this.lastMarket>5000){this.lastMarket=this.now();this.oracle.observe();}const need=this._need();if(need){this.stats.partyPreemptions+=1;this._move(need.report,need.reason);this.lastDecision={at:this.now(),action:'PARTY_SERVICE',reason:need.reason,target:need.report.name,priority:need.priority};return true;}if(await this._restockPotions())return true;const res=this._goals();if(await this._gearTransfer(res))return true;if(await this._upgrade(res))return true;if(await this._compound(res))return true;if(await this._drain(res))return true;this.lastDecision={at:this.now(),action:'IDLE',reason:metrics(this._c()).freeSlots>=this.cfg.targetSlots?'CAPACITY_HEALTHY':'NO_SAFE_ECONOMY_ACTION',metrics:metrics(this._c())};return false;}finally{this.busy=false;}}
  tick(){if(this.now()-this.lastTick<this.cfg.interval)return false;this.lastTick=this.now();Promise.resolve(this.cycle()).catch((e)=>{this.busy=false;this.stats.failedSafe+=1;this.lastAction={at:this.now(),kind:'FAILED_SAFE',reason:'UNHANDLED_ECONOMY_ERROR',error:String(e&&e.message||e).slice(0,180)};});return true;}
  status(){return{schemaVersion:1,mode:ALPHA22_MODE,active:this._active()&&this._merchant(),busy:this.busy,config:{...this.cfg},inventory:this._merchant()?metrics(this._c()):null,lastDecision:clone(this.lastDecision),lastAction:clone(this.lastAction),journal:clone(this.journal),stats:{...this.stats},market:this.oracle.status(),policies:{partyServicePreemptsEconomy:true,activeInventoryCapacityPlanning:true,lowRiskMaterialAutoSellOnly:true,rareAndValuableItemsKept:true,gearComparedAcrossRegistry:true,betterGearReturnedToFarmer:true,upgradesBoundedAndJournaled:true,compoundsBoundedAndJournaled:true,scrollRestockEnabled:true,restartUncertainMutationNeverRetriedBlindly:true}};}
}

class Alpha2020Alpha22Autonomy {
  constructor(runtime,options={}){
    if(!runtime)throw new Error('runtime required');this.runtime=runtime;this.now=runtime.now||(()=>Date.now());this.log=runtime.log||null;this.installedAt=this.now();this.stats={combatGateContinuations:0,combatFallbackSelections:0,combatLootWindows:0,broadcastFallbacks:0,broadcastAcks:0,broadcastReceived:0,broadcastRejected:0,broadcastTimeouts:0};
    this.alpha2015=installAlpha2015CombatLogisticsHotfix(runtime);patchAlpha2015LogisticsFairness();if(!runtime.integratedPartyControl)installIntegratedPartyControl(runtime,options.integratedPartyControl||{});
    const l=runtime.controlledPartyLogistics;if(l&&l.config){l.config.farmerPotionLow=50;l.config.farmerPotionTarget=5000;l.config.maxSupplyBatch=Math.max(5000,Number(l.config.maxSupplyBatch)||0);l.config.farmerGoldReserve=0;l.config.maxGoldBatch=Number.MAX_SAFE_INTEGER;l.config.maxLootStackTransfer=Math.max(9999,Number(l.config.maxLootStackTransfer)||0);l.config.merchantReserveSlots=Math.max(4,Number(l.config.merchantReserveSlots)||0);l.__alpha2019OfferTtlMs=Math.max(15000,Number(l.__alpha2019OfferTtlMs)||0);}
    this.combatInstalled=installCombatContinuity(runtime,this.stats);this.logisticsInstalled=installCombatLootHandoff(runtime,this.stats);this.broadcastInstalled=installQuotaSafeBroadcastFallback(runtime,this.stats);this.marketValueOracle=new MarketValueOracle({root:runtime.root,runtime,now:this.now,maxAgeMs:options.marketValueMaxAgeMs});this.economy=new MerchantEconomyAutonomy(runtime,this.marketValueOracle,options.economy||{});runtime.marketValueOracle=this.marketValueOracle;runtime.merchantEconomyAutonomy=this.economy;this._hook();
    if(this.log&&this.log.emit)try{this.log.emit({component:'alpha20.20-alpha22-autonomy',event:'ALPHA20_20_ALPHA22_AUTONOMY_INSTALLED',severity:'warn',reason:'CLOSED_LOOP_AUTONOMY_ACTIVE',data:this.status()});}catch(_){}
  }
  _hook(){if(this.runtime.__alpha22EconomyTickInstalled)return;this.runtime.__alpha22EconomyTickInstalled=true;const original=this.runtime.tick.bind(this.runtime);this.runtime.tick=(...args)=>{const r=original(...args);this.economy.tick();return r;};}
  status(){return{schemaVersion:1,alpha20_20:{mode:ALPHA20_20_MODE,combatContinuityInstalled:this.combatInstalled,combatLootHandoffInstalled:this.logisticsInstalled,quotaBroadcastFallbackInstalled:this.broadcastInstalled,commandCharacterAuthorityWidened:false,activeEncounterMayFinishOutsidePerfectFormation:true,newPullSafetyStillRequired:true,stats:{...this.stats}},alpha22:this.economy.status(),installedAt:this.installedAt};}
}

function installAlpha2020Alpha22Autonomy(runtime,options={}){if(!runtime)throw new Error('runtime required');if(runtime.alpha2020Alpha22Autonomy)return runtime.alpha2020Alpha22Autonomy;return runtime.alpha2020Alpha22Autonomy=new Alpha2020Alpha22Autonomy(runtime,options);}

module.exports={Alpha2020Alpha22Autonomy,MerchantEconomyAutonomy,MarketValueOracle,installAlpha2020Alpha22Autonomy,installCombatContinuity,installCombatLootHandoff,installQuotaSafeBroadcastFallback,median,gradeForLevel,isQuotaError,ALPHA20_20_MODE,ALPHA22_MODE};
