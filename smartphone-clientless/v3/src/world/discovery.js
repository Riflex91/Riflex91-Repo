'use strict';

const { EvidenceKind } = require('./world-model');

function uniqueMaps(existing, map) {
  const out = Array.isArray(existing) ? existing.slice() : [];
  if (map && !out.includes(map)) out.push(map);
  return out.sort();
}

function extractName(value, fallback) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const candidate = value.find((item) => typeof item === 'string');
    return candidate || fallback;
  }
  if (value && typeof value === 'object') return value.mtype || value.type || value.id || value.name || value.npc || fallback;
  return fallback;
}

class DiscoveryService {
  constructor(options = {}) {
    this.world = options.world;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.totalNew = 0;
  }

  _record(type, id, attributes, meta) {
    if (!this.world || !type || !id) return null;
    const isNew = !this.world.hasEntity(type, id);
    const oldMaps = this.world.fact(type, id, 'maps').value;
    const map = attributes && attributes.map;
    const merged = { ...attributes, maps: uniqueMaps(oldMaps, map) };
    delete merged.map;
    const entity = this.world.observeEntity(type, String(id), merged, {
      evidence: meta.evidence,
      confidence: meta.confidence
    });
    if (isNew) {
      this.totalNew += 1;
      if (this.log) this.log.emit({
        component: 'discovery',
        event: 'DISCOVERY_ENTITY_NEW',
        data: { type, id: String(id), map: map || null, evidence: meta.evidence, confidence: meta.confidence, source: meta.source }
      });
    }
    return entity;
  }

  _scanLive(snapshot) {
    let created = 0;
    for (const entity of snapshot.entities || []) {
      if (entity.mtype) {
        const before = this.world.hasEntity('monster', entity.mtype);
        this._record('monster', entity.mtype, {
          map: entity.map || snapshot.character.map,
          lastX: entity.x,
          lastY: entity.y,
          lastHp: entity.hp,
          live: !entity.dead,
          lastSeenSource: 'live-entity'
        }, { evidence: EvidenceKind.OBSERVED, confidence: 1, source: 'live-entity' });
        if (!before) created += 1;
      } else if (entity.npc || entity.type === 'npc') {
        const id = entity.name || entity.id;
        const before = this.world.hasEntity('npc', id);
        this._record('npc', id, {
          map: entity.map || snapshot.character.map,
          lastX: entity.x,
          lastY: entity.y,
          lastSeenSource: 'live-entity'
        }, { evidence: EvidenceKind.OBSERVED, confidence: 1, source: 'live-entity' });
        if (!before) created += 1;
      }
    }
    for (const object of snapshot.objects || []) {
      const id = object.name || object.id;
      const before = this.world.hasEntity('object', id);
      this._record('object', id, {
        map: object.map || snapshot.character.map,
        objectType: object.type || 'object',
        lastX: object.x,
        lastY: object.y,
        lastSeenSource: 'live-object'
      }, { evidence: EvidenceKind.OBSERVED, confidence: 1, source: 'live-object' });
      if (!before) created += 1;
    }
    return created;
  }

  _scanCurrentMapMetadata(snapshot, gameData) {
    const mapName = snapshot.character.map;
    const mapData = gameData && gameData.maps && gameData.maps[mapName];
    if (!mapData || typeof mapData !== 'object') return 0;
    let created = 0;

    const scanCollection = (type, collection, source) => {
      if (!collection) return;
      const values = Array.isArray(collection) ? collection : Object.values(collection);
      values.forEach((value, index) => {
        const id = extractName(value, `${source}-${index}`);
        if (!id) return;
        const before = this.world.hasEntity(type, id);
        this._record(type, id, { map: mapName, lastSeenSource: source }, { evidence: EvidenceKind.INFERRED, confidence: 0.65, source });
        if (!before) created += 1;
      });
    };

    scanCollection('npc', mapData.npcs, 'map-metadata-npc');
    scanCollection('monster', mapData.monsters, 'map-metadata-monster');

    if (Array.isArray(mapData.doors)) {
      mapData.doors.forEach((door, index) => {
        const id = `door:${mapName}:${index}`;
        const before = this.world.hasEntity('object', id);
        const x = Array.isArray(door) ? door[0] : door && door.x;
        const y = Array.isArray(door) ? door[1] : door && door.y;
        this._record('object', id, { map: mapName, objectType: 'door', lastX: x, lastY: y, lastSeenSource: 'map-metadata-door' }, { evidence: EvidenceKind.INFERRED, confidence: 0.65, source: 'map-metadata-door' });
        if (!before) created += 1;
      });
    }
    return created;
  }

  scan(snapshot, gameData = {}) {
    if (!snapshot || !snapshot.character || !this.world) return { newEntities: 0, totalNew: this.totalNew };
    const newEntities = this._scanLive(snapshot) + this._scanCurrentMapMetadata(snapshot, gameData);
    if (newEntities && this.log) this.log.emit({
      component: 'discovery',
      event: 'DISCOVERY_SCAN_COMPLETED',
      character: snapshot.character.name,
      data: { map: snapshot.character.map, newEntities, worldEntities: this.world.entities.size }
    });
    return { newEntities, totalNew: this.totalNew };
  }

  status() {
    return { totalNew: this.totalNew };
  }
}

module.exports = { DiscoveryService };
