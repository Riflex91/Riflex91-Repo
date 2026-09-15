'use strict';

const ACTIVE_CLOUDFLARE_BASE_URL = 'https://aio-bot-dashboard.hansijuergenlul.workers.dev';
const WORKERS_FREE_DAILY_REQUEST_LIMIT = 100000;
const SYSTEM_DAILY_REQUEST_TARGET = 95000;
const INFRASTRUCTURE_DAILY_REQUEST_RESERVE = 5000;
const BOT_DAILY_REQUEST_BUDGET = SYSTEM_DAILY_REQUEST_TARGET - INFRASTRUCTURE_DAILY_REQUEST_RESERVE;
const MAX_SUPPORTED_PARTY_SIZE = 4;
const PER_CHARACTER_DAILY_REQUEST_BUDGET = Math.floor(BOT_DAILY_REQUEST_BUDGET / MAX_SUPPORTED_PARTY_SIZE);
const STORAGE_KEY = 'aio-v3:cloud-free-tier-budget:v1';

function text(value, max = 120) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function utcDay(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function storage(root) {
  try { return root && (root.localStorage || root.parent && root.parent.localStorage) || null; }
  catch (_) { return null; }
}

function load(store, now) {
  if (!store) return null;
  const day = utcDay(now);
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw == null || raw === '') return { day, counts: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(parsed.day || ''))) return null;
    if (!parsed.counts || typeof parsed.counts !== 'object' || Array.isArray(parsed.counts)) return null;
    if (parsed.day > day) return null;
    if (parsed.day < day) return { day, counts: {} };
    for (const value of Object.values(parsed.counts)) {
      if (!Number.isSafeInteger(value) || value < 0) return null;
    }
    return { day, counts: { ...parsed.counts } };
  } catch (_) {
    return null;
  }
}

function readCloudRequestBudget({ root, character, now = Date.now(), limit = PER_CHARACTER_DAILY_REQUEST_BUDGET } = {}) {
  const store = storage(root);
  const name = text(character || 'unknown', 80) || 'unknown';
  const state = load(store, now);
  if (!state) {
    return { ok: false, reason: 'PERSISTENT_STORAGE_UNAVAILABLE', day: utcDay(now), character: name, used: 0, limit, remaining: 0 };
  }
  const used = Math.max(0, Number(state.counts[name]) || 0);
  return { ok: used < limit, reason: used < limit ? null : 'DAILY_CHARACTER_BUDGET_EXHAUSTED', day: state.day, character: name, used, limit, remaining: Math.max(0, limit - used) };
}

function reserveCloudRequest({ root, character, now = Date.now(), limit = PER_CHARACTER_DAILY_REQUEST_BUDGET } = {}) {
  const store = storage(root);
  const name = text(character || 'unknown', 80) || 'unknown';
  const state = load(store, now);
  if (!state) {
    return { ok: false, reason: 'PERSISTENT_STORAGE_UNAVAILABLE', day: utcDay(now), character: name, used: 0, limit, remaining: 0 };
  }
  const used = Math.max(0, Number(state.counts[name]) || 0);
  if (used >= limit) {
    return { ok: false, reason: 'DAILY_CHARACTER_BUDGET_EXHAUSTED', day: state.day, character: name, used, limit, remaining: 0 };
  }
  const next = used + 1;
  state.counts[name] = next;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    return { ok: false, reason: 'PERSISTENT_STORAGE_WRITE_FAILED', day: state.day, character: name, used, limit, remaining: Math.max(0, limit - used) };
  }
  return { ok: true, reason: null, day: state.day, character: name, used: next, limit, remaining: Math.max(0, limit - next) };
}

module.exports = {
  ACTIVE_CLOUDFLARE_BASE_URL,
  WORKERS_FREE_DAILY_REQUEST_LIMIT,
  SYSTEM_DAILY_REQUEST_TARGET,
  INFRASTRUCTURE_DAILY_REQUEST_RESERVE,
  BOT_DAILY_REQUEST_BUDGET,
  MAX_SUPPORTED_PARTY_SIZE,
  PER_CHARACTER_DAILY_REQUEST_BUDGET,
  STORAGE_KEY,
  utcDay,
  readCloudRequestBudget,
  reserveCloudRequest
};
