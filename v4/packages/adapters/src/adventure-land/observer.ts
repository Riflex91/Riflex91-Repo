import type { Clock } from '../../../core/src/time/clock.js';
import {
  WORLD_OBSERVATION_SCHEMA_VERSION,
  type CharacterObservation,
  type EntityKind,
  type EntityObservation,
  type InventorySlotObservation,
  type PartyMemberObservation,
  type PositionObservation,
  type WorldObjectObservation,
  type WorldObservation,
} from '../../../domain/src/world/index.js';

export interface AdventureLandObserverOptions {
  readonly clock: Clock;
  readonly root?: unknown;
}

/**
 * Read-only translation boundary from Adventure Land globals to the V4 domain.
 *
 * This class intentionally exposes no command methods. Game mutation belongs in
 * a separate control adapter so observation cannot accidentally execute actions.
 */
export class AdventureLandObserver {
  private readonly clock: Clock;
  private readonly root: unknown;
  private sequence = 0;

  constructor(options: AdventureLandObserverOptions) {
    this.clock = options.clock;
    this.root = options.root ?? globalThis;
  }

  observe(): WorldObservation | null {
    const root = asRecord(this.root);
    if (!root) return null;

    const parent = asRecord(root.parent) ?? root;
    const character = asRecord(root.character) ?? asRecord(parent.character);
    if (!character) return null;

    const self = readCharacter(character);
    const entities = readEntities(root, parent, self.position.map);
    const objects = readObjects(root, parent, self.position.map);
    const party = readParty(parent);
    const gameData = readGameData(root, parent);

    this.sequence += 1;
    return {
      schemaVersion: WORLD_OBSERVATION_SCHEMA_VERSION,
      sequence: this.sequence,
      observedAt: this.clock.now(),
      self,
      entities,
      objects,
      party,
      gameData,
    };
  }
}

function readCharacter(character: RawRecord): CharacterObservation {
  const rawItems = Array.isArray(character.items) ? character.items : [];
  const reportedSize = finiteNumber(character.isize);
  const inventorySize = reportedSize === null
    ? rawItems.length
    : Math.max(0, Math.floor(reportedSize));

  const inventory = rawItems
    .slice(0, inventorySize)
    .map((item, index): InventorySlotObservation | null => {
      const record = asRecord(item);
      if (!record) return null;
      const name = stringValue(record.name);
      if (!name) return null;
      return {
        index,
        name,
        level: nonNegativeInteger(record.level, 0),
        quantity: nonNegativeInteger(record.q, 1),
        locked: Boolean(record.l),
        special: Boolean(record.p),
      };
    });

  return {
    name: stringValue(character.name) ?? 'unknown',
    className: stringValue(character.ctype) ?? 'unknown',
    level: nonNegativeInteger(character.level, 0),
    position: readPosition(character, null),
    health: {
      current: finiteNumber(character.hp),
      max: finiteNumber(character.max_hp),
    },
    mana: {
      current: finiteNumber(character.mp),
      max: finiteNumber(character.max_mp),
    },
    range: finiteNumber(character.range),
    speed: finiteNumber(character.speed),
    frequency: finiteNumber(character.frequency),
    xp: finiteNumber(character.xp),
    gold: finiteNumber(character.gold),
    moving: Boolean(character.moving),
    targetId: idValue(character.target),
    dead: Boolean(character.rip),
    inventorySize,
    inventory,
  };
}

function readEntities(root: RawRecord, parent: RawRecord, fallbackMap: string | null): readonly EntityObservation[] {
  const rootParent = asRecord(root.parent);
  const collection = asRecord(rootParent?.entities) ?? asRecord(parent.entities) ?? asRecord(root.entities);
  if (!collection) return [];

  const rows: EntityObservation[] = [];
  for (const raw of Object.values(collection)) {
    const entity = asRecord(raw);
    if (!entity) continue;
    const id = idValue(entity.id);
    if (!id) continue;

    rows.push({
      id,
      kind: classifyEntity(entity),
      name: stringValue(entity.name),
      monsterType: stringValue(entity.mtype),
      position: readPosition(entity, stringValue(entity.map) ?? fallbackMap),
      health: {
        current: finiteNumber(entity.hp),
        max: finiteNumber(entity.max_hp),
      },
      targetId: idValue(entity.target),
      dead: Boolean(entity.dead),
    });
  }

  return rows.sort((left, right) => left.id.localeCompare(right.id));
}

function readObjects(root: RawRecord, parent: RawRecord, fallbackMap: string | null): readonly WorldObjectObservation[] {
  const sources = [root.chests, asRecord(root.parent)?.chests, parent.chests, root.map_objects, parent.map_objects];
  const byId = new Map<string, WorldObjectObservation>();

  for (const source of sources) {
    const collection = asRecord(source);
    if (!collection) continue;

    for (const [rawId, raw] of Object.entries(collection)) {
      const object = asRecord(raw);
      if (!object) continue;
      const id = idValue(object.id) ?? rawId;
      if (!id || byId.has(id)) continue;

      byId.set(id, {
        id,
        name: stringValue(object.name) ?? stringValue(object.type) ?? stringValue(object.skin),
        type: stringValue(object.type) ?? stringValue(object.skin) ?? 'object',
        position: readPosition(object, stringValue(object.map) ?? fallbackMap),
      });
    }
  }

  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function readParty(parent: RawRecord): readonly PartyMemberObservation[] {
  const party = asRecord(parent.party);
  if (!party) return [];

  const rows: PartyMemberObservation[] = [];
  for (const [name, raw] of Object.entries(party)) {
    const member = asRecord(raw);
    rows.push({
      name,
      className: member ? stringValue(member.type) ?? stringValue(member.ctype) : null,
      level: member ? nullableNonNegativeInteger(member.level) : null,
      map: member ? stringValue(member.map) : null,
    });
  }

  return rows.sort((left, right) => left.name.localeCompare(right.name));
}

function readGameData(root: RawRecord, parent: RawRecord): WorldObservation['gameData'] {
  const gameData = asRecord(root.G) ?? asRecord(parent.G);
  const monsters = asRecord(gameData?.monsters);
  const maps = asRecord(gameData?.maps);
  return {
    monstersKnown: monsters ? Object.keys(monsters).length : 0,
    mapsKnown: maps ? Object.keys(maps).length : 0,
  };
}

function classifyEntity(entity: RawRecord): EntityKind {
  const type = stringValue(entity.type)?.toLowerCase() ?? null;
  if (type === 'monster' || stringValue(entity.mtype)) return 'monster';
  if (type === 'npc' || Boolean(entity.npc)) return 'npc';
  if (type === 'player' || type === 'character' || Boolean(entity.player)) return 'player';
  return 'unknown';
}

function readPosition(record: RawRecord, fallbackMap: string | null): PositionObservation {
  return {
    map: stringValue(record.map) ?? fallbackMap,
    x: finiteNumber(record.real_x) ?? finiteNumber(record.x),
    y: finiteNumber(record.real_y) ?? finiteNumber(record.y),
  };
}

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as RawRecord;
}

function stringValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function idValue(value: unknown): string | null {
  if (typeof value === 'string') return stringValue(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = finiteNumber(value);
  return parsed === null ? fallback : Math.max(0, Math.floor(parsed));
}

function nullableNonNegativeInteger(value: unknown): number | null {
  const parsed = finiteNumber(value);
  return parsed === null ? null : Math.max(0, Math.floor(parsed));
}
