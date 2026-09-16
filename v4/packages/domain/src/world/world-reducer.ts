import { InvalidWorldObservationError } from './invalid-observation-error.js';
import type {
  CharacterObservation,
  EntityObservation,
  InventorySlotObservation,
  PartyMemberObservation,
  PositionObservation,
  ResourceObservation,
  WorldObjectObservation,
  WorldObservation,
} from './observation.js';
import type { WorldState, WorldStateUpdate } from './world-state.js';

export function reduceWorldObservation(
  previous: WorldState | null,
  observation: WorldObservation,
): WorldStateUpdate {
  validateWorldObservation(observation);

  if (previous && observation.sequence <= previous.lastObservationSequence) {
    return {
      accepted: false,
      reason: 'duplicate-or-out-of-order',
      state: previous,
    };
  }

  return {
    accepted: true,
    state: buildWorldState(previous, observation),
  };
}

export function validateWorldObservation(observation: WorldObservation): void {
  if (!Number.isSafeInteger(observation.sequence) || observation.sequence < 1) {
    throw new InvalidWorldObservationError('observation sequence must be a positive safe integer');
  }
  assertFiniteNonNegative(observation.observedAt, 'observedAt');
  validateCharacter(observation.self);
  uniqueBy(observation.entities, (entity) => entity.id, 'entity');
  uniqueBy(observation.objects, (object) => object.id, 'object');
  uniqueBy(observation.party, (member) => member.name, 'party member');

  for (const entity of observation.entities) validateEntity(entity);
  for (const object of observation.objects) validateObject(object);
  for (const member of observation.party) validatePartyMember(member);

  assertCount(observation.gameData.monstersKnown, 'gameData.monstersKnown');
  assertCount(observation.gameData.mapsKnown, 'gameData.mapsKnown');
}

function buildWorldState(previous: WorldState | null, observation: WorldObservation): WorldState {
  return {
    revision: (previous?.revision ?? 0) + 1,
    lastObservationSequence: observation.sequence,
    observedAt: observation.observedAt,
    self: cloneCharacter(observation.self),
    entities: toSortedRecord(observation.entities, (entity) => entity.id, cloneEntity),
    objects: toSortedRecord(observation.objects, (object) => object.id, cloneObject),
    party: toSortedRecord(observation.party, (member) => member.name, clonePartyMember),
    gameData: {
      monstersKnown: observation.gameData.monstersKnown,
      mapsKnown: observation.gameData.mapsKnown,
    },
  };
}

function cloneCharacter(value: CharacterObservation): CharacterObservation {
  return {
    name: value.name,
    className: value.className,
    level: value.level,
    position: clonePosition(value.position),
    health: cloneResource(value.health),
    mana: cloneResource(value.mana),
    range: value.range,
    speed: value.speed,
    frequency: value.frequency,
    xp: value.xp,
    gold: value.gold,
    moving: value.moving,
    targetId: value.targetId,
    dead: value.dead,
    inventorySize: value.inventorySize,
    inventory: value.inventory.map((slot) => slot === null ? null : cloneInventorySlot(slot)),
  };
}

function cloneEntity(value: EntityObservation): EntityObservation {
  return {
    id: value.id,
    kind: value.kind,
    name: value.name,
    monsterType: value.monsterType,
    position: clonePosition(value.position),
    health: cloneResource(value.health),
    targetId: value.targetId,
    dead: value.dead,
  };
}

function cloneObject(value: WorldObjectObservation): WorldObjectObservation {
  return {
    id: value.id,
    name: value.name,
    type: value.type,
    position: clonePosition(value.position),
  };
}

function clonePartyMember(value: PartyMemberObservation): PartyMemberObservation {
  return {
    name: value.name,
    className: value.className,
    level: value.level,
    map: value.map,
  };
}

function cloneInventorySlot(value: InventorySlotObservation): InventorySlotObservation {
  return {
    index: value.index,
    name: value.name,
    level: value.level,
    quantity: value.quantity,
    locked: value.locked,
    special: value.special,
  };
}

function clonePosition(value: PositionObservation): PositionObservation {
  return { map: value.map, x: value.x, y: value.y };
}

function cloneResource(value: ResourceObservation): ResourceObservation {
  return { current: value.current, max: value.max };
}

function validateCharacter(value: CharacterObservation): void {
  assertNonEmpty(value.name, 'self.name');
  assertNonEmpty(value.className, 'self.className');
  assertCount(value.level, 'self.level');
  validatePosition(value.position, 'self.position');
  validateResource(value.health, 'self.health');
  validateResource(value.mana, 'self.mana');
  assertOptionalFinite(value.range, 'self.range');
  assertOptionalFinite(value.speed, 'self.speed');
  assertOptionalFinite(value.frequency, 'self.frequency');
  assertOptionalFinite(value.xp, 'self.xp');
  assertOptionalFinite(value.gold, 'self.gold');
  assertCount(value.inventorySize, 'self.inventorySize');

  const occupied = value.inventory.filter((slot): slot is InventorySlotObservation => slot !== null);
  uniqueBy(occupied, (slot) => String(slot.index), 'inventory index');
  for (const slot of occupied) {
    if (!Number.isSafeInteger(slot.index) || slot.index < 0 || slot.index >= value.inventorySize) {
      throw new InvalidWorldObservationError(`inventory index ${slot.index} is outside inventory size ${value.inventorySize}`);
    }
    assertNonEmpty(slot.name, `inventory[${slot.index}].name`);
    assertCount(slot.level, `inventory[${slot.index}].level`);
    assertCount(slot.quantity, `inventory[${slot.index}].quantity`);
  }
}

function validateEntity(value: EntityObservation): void {
  assertNonEmpty(value.id, 'entity.id');
  validatePosition(value.position, `entity ${value.id}.position`);
  validateResource(value.health, `entity ${value.id}.health`);
}

function validateObject(value: WorldObjectObservation): void {
  assertNonEmpty(value.id, 'object.id');
  assertNonEmpty(value.type, `object ${value.id}.type`);
  validatePosition(value.position, `object ${value.id}.position`);
}

function validatePartyMember(value: PartyMemberObservation): void {
  assertNonEmpty(value.name, 'party member name');
  if (value.level !== null) assertCount(value.level, `party member ${value.name}.level`);
}

function validatePosition(value: PositionObservation, path: string): void {
  assertOptionalFinite(value.x, `${path}.x`);
  assertOptionalFinite(value.y, `${path}.y`);
}

function validateResource(value: ResourceObservation, path: string): void {
  assertOptionalFinite(value.current, `${path}.current`);
  assertOptionalFinite(value.max, `${path}.max`);
}

function uniqueBy<T>(rows: readonly T[], keyOf: (row: T) => string, label: string): void {
  const seen = new Set<string>();
  for (const row of rows) {
    const key = keyOf(row);
    if (seen.has(key)) {
      throw new InvalidWorldObservationError(`duplicate ${label} key: ${key}`);
    }
    seen.add(key);
  }
}

function toSortedRecord<T, U>(
  rows: readonly T[],
  keyOf: (row: T) => string,
  clone: (row: T) => U,
): Readonly<Record<string, U>> {
  const entries = rows
    .map((row) => [keyOf(row), clone(row)] as const)
    .sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries) as Readonly<Record<string, U>>;
}

function assertNonEmpty(value: string, path: string): void {
  if (!value.trim()) throw new InvalidWorldObservationError(`${path} must not be empty`);
}

function assertCount(value: number, path: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new InvalidWorldObservationError(`${path} must be a non-negative safe integer`);
  }
}

function assertFiniteNonNegative(value: number, path: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new InvalidWorldObservationError(`${path} must be a non-negative finite number`);
  }
}

function assertOptionalFinite(value: number | null, path: string): void {
  if (value !== null && !Number.isFinite(value)) {
    throw new InvalidWorldObservationError(`${path} must be null or a finite number`);
  }
}
