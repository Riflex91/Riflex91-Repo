'use strict';

const { finite, levelOf, itemKey, clone } = require('./economy-v2-market-history');
function qtyOf(item) { return Math.max(1, Math.floor(finite(item && item.q, 1) || 1)); }

class AccountItemPool {
  constructor(runtime) { this.runtime = runtime; this.lastSnapshot = null; }
  _characters() { try { const s = this.runtime.characterRegistry && this.runtime.characterRegistry.status(); return Array.isArray(s && s.characters) ? s.characters : []; } catch (_) { return []; } }
  snapshot() {
    const characters = this._characters(), items = [];
    for (const c of characters) {
      if (!c || !c.name) continue;
      for (const item of Array.isArray(c.inventory) ? c.inventory : []) if (item && item.name) items.push({ owner: c.name, ctype: c.ctype || null, location: 'inventory', index: item.index, name: item.name, level: levelOf(item), quantity: qtyOf(item), locked: !!(item.locked || item.l), special: !!(item.special || item.p) });
      for (const [slot, item] of Object.entries(c.gear && typeof c.gear === 'object' ? c.gear : {})) if (item && item.name) items.push({ owner: c.name, ctype: c.ctype || null, location: 'equipped', slot, name: item.name, level: levelOf(item), quantity: 1, locked: true, special: !!(item.special || item.p) });
    }
    const root = this.runtime.root || globalThis, local = root.character || root.parent && root.parent.character;
    if (local && local.bank && typeof local.bank === 'object') for (const [pack, entries] of Object.entries(local.bank)) if (Array.isArray(entries)) for (let i = 0; i < entries.length; i += 1) { const item = entries[i]; if (item && item.name) items.push({ owner: local.name, ctype: local.ctype || null, location: 'bank', pack, index: i, name: item.name, level: levelOf(item), quantity: qtyOf(item), locked: !!(item.locked || item.l), special: !!(item.special || item.p) }); }
    const grouped = new Map();
    for (const item of items) { const key = itemKey(item.name, item.level), row = grouped.get(key) || { key, name: item.name, level: item.level, quantity: 0, owners: {}, locations: {} }; row.quantity += item.quantity; row.owners[item.owner] = (row.owners[item.owner] || 0) + item.quantity; row.locations[item.location] = (row.locations[item.location] || 0) + item.quantity; grouped.set(key, row); }
    this.lastSnapshot = { at: this.runtime.now ? this.runtime.now() : Date.now(), characterCount: characters.length, itemCount: items.length, uniqueItems: grouped.size, characters: characters.map((c) => ({ name: c.name, ctype: c.ctype, level: c.level, map: c.map })), items, grouped: [...grouped.values()] };
    return this.lastSnapshot;
  }
  status() { const s = this.lastSnapshot || this.snapshot(); return { at: s.at, characterCount: s.characterCount, itemCount: s.itemCount, uniqueItems: s.uniqueItems, characters: clone(s.characters) }; }
}

class GlobalGearOptimizer {
  constructor(runtime, pool) { this.runtime = runtime; this.pool = pool; this.lastPlan = null; }
  goals() { try { return this.runtime.gearProgression && typeof this.runtime.gearProgression.list === 'function' ? this.runtime.gearProgression.list(256) || [] : []; } catch (_) { return []; } }
  _freshGoals() { const now = this.runtime.now ? this.runtime.now() : Date.now(); return this.goals().filter((g) => g && g.character && g.slot && g.item && finite(g.lastSeenAt) != null && g.lastSeenAt <= now + 5000 && now - g.lastSeenAt <= 30000); }
  _select(goals, stock) {
    const capacity = new Map(); for (const item of stock) capacity.set(itemKey(item.name, item.level), (capacity.get(itemKey(item.name, item.level)) || 0) + item.remaining);
    const best = new Map();
    for (const goal of goals) { const ikey = itemKey(goal.item, Number(goal.observedLevel) || 0); if (!capacity.has(ikey)) continue; const skey = `${goal.character}:${goal.slot}`, ckey = `${ikey}|${skey}`, weight = Math.max(0, finite(goal.improvement, 0)) + Math.max(0, finite(goal.survivalImprovement, 0)) * 0.25; const row = { goal, ikey, skey, weight }; if (!best.has(ckey) || weight > best.get(ckey).weight) best.set(ckey, row); }
    const candidates = [...best.values()]; if (!candidates.length) return [];
    const itemKeys = [...new Set(candidates.map((x) => x.ikey))], slotKeys = [...new Set(candidates.map((x) => x.skey))], source = 0, itemOffset = 1, slotOffset = 1 + itemKeys.length, sink = slotOffset + slotKeys.length;
    const graph = Array.from({ length: sink + 1 }, () => []), add = (u, v, cap, cost, meta = null) => { const a = { to: v, rev: graph[v].length, cap, initialCap: cap, cost, meta }, b = { to: u, rev: graph[u].length, cap: 0, initialCap: 0, cost: -cost, meta: null }; graph[u].push(a); graph[v].push(b); };
    const iNode = new Map(itemKeys.map((k, i) => [k, itemOffset + i])), sNode = new Map(slotKeys.map((k, i) => [k, slotOffset + i]));
    for (const key of itemKeys) add(source, iNode.get(key), capacity.get(key), 0); for (const row of candidates) add(iNode.get(row.ikey), sNode.get(row.skey), 1, -row.weight, row); for (const key of slotKeys) add(sNode.get(key), sink, 1, 0);
    while (true) {
      const d = Array(graph.length).fill(Infinity), pn = Array(graph.length).fill(-1), pe = Array(graph.length).fill(-1); d[source] = 0;
      for (let pass = 0; pass < graph.length - 1; pass += 1) { let changed = false; for (let u = 0; u < graph.length; u += 1) if (Number.isFinite(d[u])) for (let ei = 0; ei < graph[u].length; ei += 1) { const e = graph[u][ei]; if (e.cap > 0 && d[u] + e.cost < d[e.to] - 1e-9) { d[e.to] = d[u] + e.cost; pn[e.to] = u; pe[e.to] = ei; changed = true; } } if (!changed) break; }
      if (!Number.isFinite(d[sink]) || d[sink] >= -1e-9) break; let v = sink; while (v !== source) { const u = pn[v], ei = pe[v]; if (u < 0) break; const e = graph[u][ei]; e.cap -= 1; graph[v][e.rev].cap += 1; v = u; }
    }
    const selected = []; for (const node of iNode.values()) for (const e of graph[node]) if (e.meta && e.initialCap === 1 && e.cap === 0) selected.push(e.meta.goal); return selected;
  }
  plan() {
    const pool = this.pool.snapshot(), merchant = (pool.characters.find((c) => String(c.ctype || '').toLowerCase() === 'merchant') || {}).name || null;
    const stock = pool.items.filter((x) => x.location === 'inventory' && !x.locked && !x.special).map((x) => ({ ...x, remaining: x.quantity })), goals = this._freshGoals(), selected = this._select(goals, stock), assignments = [];
    for (const goal of selected) { const level = Math.max(0, Number(goal.observedLevel) || 0), candidates = stock.filter((x) => x.remaining > 0 && x.name === goal.item && x.level === level).sort((a, b) => { const rank = (x) => x.owner === merchant ? 0 : x.owner === goal.sourceCharacter ? 1 : x.owner === goal.character ? 3 : 2; return rank(a) - rank(b) || String(a.owner).localeCompare(String(b.owner)); }), source = candidates[0]; if (!source) continue; source.remaining -= 1;
      const route = source.owner === goal.character ? 'LOCAL_EQUIP' : source.owner === merchant ? 'MERCHANT_TO_TARGET' : 'SOURCE_TO_MERCHANT_TO_TARGET';
      assignments.push({ id: goal.id || `${goal.character}:${goal.slot}:${goal.item}:${goal.targetLevel || level}`, character: goal.character, ctype: goal.ctype || null, slot: goal.slot, item: goal.item, level, targetLevel: Math.max(level, Number(goal.targetLevel) || level), sourceCharacter: source.owner, sourceIndex: source.index, merchant, route, improvement: finite(goal.improvement, 0), survivalImprovement: finite(goal.survivalImprovement, 0), projectedUpgradeRequired: !!goal.projectedUpgradeRequired, lastSeenAt: finite(goal.lastSeenAt), currentItem: goal.currentItem || null, currentLevel: finite(goal.currentLevel, 0) });
    }
    this.lastPlan = { at: this.runtime.now ? this.runtime.now() : Date.now(), merchant, assignments, consideredGoals: goals.length, unassignedGoals: Math.max(0, goals.length - assignments.length) }; return this.lastPlan;
  }
  status() { const p = this.lastPlan || this.plan(); return { at: p.at, merchant: p.merchant, assignments: p.assignments.length, consideredGoals: p.consideredGoals, multiHop: p.assignments.filter((x) => x.route === 'SOURCE_TO_MERCHANT_TO_TARGET').length, direct: p.assignments.filter((x) => x.route === 'MERCHANT_TO_TARGET').length, localEquip: p.assignments.filter((x) => x.route === 'LOCAL_EQUIP').length, unassignedGoals: p.unassignedGoals }; }
}

module.exports = { AccountItemPool, GlobalGearOptimizer, qtyOf };
