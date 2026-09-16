export interface PositionObservation {
  readonly map: string | null;
  readonly x: number | null;
  readonly y: number | null;
}

export interface ResourceObservation {
  readonly current: number | null;
  readonly max: number | null;
}

export interface InventorySlotObservation {
  readonly index: number;
  readonly name: string;
  readonly level: number;
  readonly quantity: number;
  readonly locked: boolean;
  readonly special: boolean;
}

export interface CharacterObservation {
  readonly name: string;
  readonly className: string;
  readonly level: number;
  readonly position: PositionObservation;
  readonly health: ResourceObservation;
  readonly mana: ResourceObservation;
  readonly range: number | null;
  readonly speed: number | null;
  readonly frequency: number | null;
  readonly xp: number | null;
  readonly gold: number | null;
  readonly moving: boolean;
  readonly targetId: string | null;
  readonly dead: boolean;
  readonly inventorySize: number;
  readonly inventory: readonly (InventorySlotObservation | null)[];
}

export type EntityKind = 'monster' | 'player' | 'npc' | 'unknown';

export interface EntityObservation {
  readonly id: string;
  readonly kind: EntityKind;
  readonly name: string | null;
  readonly monsterType: string | null;
  readonly position: PositionObservation;
  readonly health: ResourceObservation;
  readonly targetId: string | null;
  readonly dead: boolean;
}

export interface WorldObjectObservation {
  readonly id: string;
  readonly name: string | null;
  readonly type: string;
  readonly position: PositionObservation;
}

export interface PartyMemberObservation {
  readonly name: string;
  readonly className: string | null;
  readonly level: number | null;
  readonly map: string | null;
}

export interface GameDataObservation {
  readonly monstersKnown: number;
  readonly mapsKnown: number;
}

export const WORLD_OBSERVATION_SCHEMA_VERSION = 1 as const;
export type WorldObservationSchemaVersion = typeof WORLD_OBSERVATION_SCHEMA_VERSION;

/**
 * A complete, point-in-time observation produced by a game adapter.
 *
 * `sequence` is monotonic inside one runtime session. The domain reducer uses
 * it for duplicate/out-of-order protection and replay determinism.
 */
export interface WorldObservation {
  readonly schemaVersion: WorldObservationSchemaVersion;
  readonly sequence: number;
  readonly observedAt: number;
  readonly self: CharacterObservation;
  readonly entities: readonly EntityObservation[];
  readonly objects: readonly WorldObjectObservation[];
  readonly party: readonly PartyMemberObservation[];
  readonly gameData: GameDataObservation;
}
