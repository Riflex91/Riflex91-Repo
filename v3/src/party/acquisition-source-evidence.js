'use strict';

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clean(value) {
  const text = String(value == null ? '' : value).trim();
  return text || null;
}

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function questDestination(gameData, quest) {
  const key = clean(quest);
  if (!key) return null;
  const direct = gameData && gameData.quests && gameData.quests[key];
  if (direct && typeof direct === 'object') {
    const map = clean(direct.map || direct.in);
    const x = finite(direct.x);
    const y = finite(direct.y);
    if (map && x != null && y != null) {
      return {
        quest: key,
        npc: clean(direct.id),
        map,
        x,
        y,
        evidence: 'G_QUESTS_COORDINATE'
      };
    }
  }

  const maps = gameData && gameData.maps || {};
  const npcs = gameData && gameData.npcs || {};
  for (const [mapName, map] of Object.entries(maps)) {
    for (const row of Array.isArray(map && map.npcs) ? map.npcs : []) {
      const npcId = Array.isArray(row) ? row[0] : row && (row.id || row.name);
      if (!npcId) continue;
      const def = npcs[npcId] || {};
      if (String(def.quest || '') !== key) continue;
      let x = null;
      let y = null;
      if (Array.isArray(row)) {
        x = finite(row[1]);
        y = finite(row[2]);
      } else if (row && typeof row === 'object') {
        const pos = Array.isArray(row.position) ? row.position : null;
        x = finite(row.x, pos ? finite(pos[0]) : null);
        y = finite(row.y, pos ? finite(pos[1]) : null);
      }
      if (x == null || y == null) continue;
      return {
        quest: key,
        npc: String(npcId),
        map: String(mapName),
        x,
        y,
        evidence: 'G_NPC_QUEST_MAPPING'
      };
    }
  }
  return null;
}

function serverEventState(runtime) {
  const root = runtime && runtime.root || {};
  return root.S || root.parent && root.parent.S || {};
}

function normalizeEventEnd(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    const date = Date.parse(value);
    if (Number.isFinite(date)) return date;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    value = numeric;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Adventure Land state commonly uses epoch seconds, while local state often
  // uses epoch milliseconds. Values below year-2001 milliseconds are treated as seconds.
  return n < 100000000000 ? n * 1000 : n;
}

function eventEntryActive(eventState, eventKey, now = Date.now()) {
  const key = clean(eventKey);
  if (!key || !eventState || typeof eventState !== 'object') return false;
  const row = eventState[key];
  if (!row) return false;
  if (row === true || row === 1) return true;
  if (typeof row !== 'object') return !!row;
  if (row.active === false || row.live === false) return false;
  if (row.active === true || row.live === true) return true;
  const endsAt = normalizeEventEnd(row.end != null ? row.end
    : row.endsAt != null ? row.endsAt
      : row.endAt != null ? row.endAt
        : row.end_time != null ? row.end_time
          : row.expiresAt);
  if (endsAt != null) return endsAt > now;
  // Presence of a structured S[event] object is itself live server evidence for
  // Adventure Land seasonal/daily events when no explicit inactive flag exists.
  return true;
}

function eventStatus(runtime, eventKey) {
  const key = clean(eventKey);
  if (!key) return null;
  let gameData = {};
  try {
    gameData = runtime && runtime.adapter && typeof runtime.adapter.getGameData === 'function'
      ? runtime.adapter.getGameData() || {}
      : {};
  } catch (_) {}
  const meta = gameData.events && gameData.events[key] || null;
  const state = serverEventState(runtime);
  const raw = state && state[key];
  const now = runtime && typeof runtime.now === 'function' ? runtime.now() : Date.now();
  let endsAt = null;
  if (raw && typeof raw === 'object') {
    endsAt = normalizeEventEnd(raw.end != null ? raw.end
      : raw.endsAt != null ? raw.endsAt
        : raw.endAt != null ? raw.endAt
          : raw.end_time != null ? raw.end_time
            : raw.expiresAt);
  }
  return {
    eventKey: key,
    known: !!meta || Object.prototype.hasOwnProperty.call(state || {}, key),
    active: eventEntryActive(state, key, now),
    endsAt,
    eventType: clean(meta && meta.type),
    eventDurationSeconds: finite(meta && meta.duration),
    evidence: Object.prototype.hasOwnProperty.call(state || {}, key)
      ? 'LIVE_SERVER_EVENT_STATE'
      : meta
        ? 'G_EVENTS_ONLY'
        : 'UNVERIFIED'
  };
}

function registeredEventSource(runtime, material, monster, map) {
  const registry = runtime && runtime.productionAcquisitionEventSources;
  const rows = Array.isArray(registry)
    ? registry
    : registry && typeof registry === 'object'
      ? Object.entries(registry).map(([eventKey, row]) => ({ eventKey, ...(row || {}) }))
      : [];
  return rows.find((row) => row
    && (!row.material || String(row.material) === String(material || ''))
    && (!row.monster || String(row.monster) === String(monster || ''))
    && (!row.map || String(row.map) === String(map || ''))
    && clean(row.eventKey || row.event)) || null;
}

function sourceEventDescriptor(runtime, gameData, {
  material = null,
  targetMaterial = null,
  monster = null,
  map = null
} = {}) {
  const itemMeta = gameData && gameData.items && gameData.items[material] || {};
  const targetMeta = gameData && gameData.items && gameData.items[targetMaterial] || {};
  const monsterMeta = gameData && gameData.monsters && gameData.monsters[monster] || {};
  const mapMeta = gameData && gameData.maps && gameData.maps[map] || {};
  const registered = registeredEventSource(runtime, material, monster, map);

  const candidates = [
    registered && (registered.eventKey || registered.event),
    typeof itemMeta.event === 'string' ? itemMeta.event : null,
    typeof targetMeta.event === 'string' ? targetMeta.event : null,
    typeof monsterMeta.event === 'string' ? monsterMeta.event : null,
    typeof mapMeta.event === 'string' ? mapMeta.event : null
  ].map(clean).filter(Boolean);
  const eventKey = candidates[0] || null;
  const eventMarked = !!registered
    || itemMeta.event === true
    || targetMeta.event === true
    || monsterMeta.event === true
    || mapMeta.event === true
    || !!eventKey;

  if (!eventMarked) {
    return {
      required: false,
      verified: true,
      active: true,
      eventKey: null,
      eventType: null,
      endsAt: null,
      evidence: 'NOT_EVENT_GATED'
    };
  }
  if (!eventKey) {
    return {
      required: true,
      verified: false,
      active: false,
      eventKey: null,
      eventType: null,
      endsAt: null,
      evidence: 'EVENT_FLAG_WITHOUT_DETERMINISTIC_EVENT_KEY',
      reason: 'EVENT_SOURCE_UNVERIFIED'
    };
  }

  const status = eventStatus(runtime, eventKey);
  return {
    required: true,
    verified: !!(status && status.known),
    active: !!(status && status.active),
    eventKey,
    eventType: status && status.eventType || null,
    endsAt: status && status.endsAt || null,
    evidence: status && status.evidence || 'UNVERIFIED',
    reason: status && status.known
      ? status.active ? 'EVENT_SOURCE_ACTIVE' : 'EVENT_SOURCE_INACTIVE'
      : 'EVENT_SOURCE_UNVERIFIED',
    registration: clone(registered)
  };
}

function isExchangeBackedSource(source) {
  return !!(source && String(source.kind || '').includes('EXCHANGE'));
}

function isQuestBackedSource(source) {
  return !!(source && String(source.kind || '').includes('QUEST'));
}

function isEventBackedSource(source) {
  return !!(source && String(source.kind || '').includes('EVENT'));
}

function sourceKind({ quest = false, event = false, direct = false } = {}) {
  if (direct) return event ? 'EVENT_DIRECT_MATERIAL_DROP' : 'DIRECT_MATERIAL_DROP';
  if (quest && event) return 'EVENT_QUEST_EXCHANGE_MATERIAL_DROP';
  if (quest) return 'QUEST_EXCHANGE_MATERIAL_DROP';
  if (event) return 'EVENT_EXCHANGE_MATERIAL_DROP';
  return 'EXCHANGE_MATERIAL_DROP';
}

module.exports = {
  questDestination,
  serverEventState,
  eventEntryActive,
  eventStatus,
  sourceEventDescriptor,
  isExchangeBackedSource,
  isQuestBackedSource,
  isEventBackedSource,
  sourceKind,
  normalizeEventEnd
};
