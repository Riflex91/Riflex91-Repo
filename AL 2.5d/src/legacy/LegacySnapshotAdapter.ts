import type {
  EntityKind,
  GameFrameSnapshot,
  RenderEntity
} from "../render/RenderBridge";

export type LegacyEntityLike = Readonly<{
  id: string;
  x?: number;
  y?: number;
  real_x?: number;
  real_y?: number;
  z?: number;
  map?: string;
  type?: string;
  ctype?: string;
  mtype?: string;
  npc?: string | boolean;
  skin?: string;
  going_x?: number;
  name?: string;
  hp?: number;
  max_hp?: number;
  mp?: number;
  max_mp?: number;
}>;

export type LegacySnapshotSource = Readonly<{
  tick: number;
  map: string;
  character?: LegacyEntityLike | null;
  entities?: Readonly<Record<string, LegacyEntityLike>>;
  targetId?: string | null;
}>;

export type LegacySnapshotAdapterOptions = Readonly<{
  classTypes?: ReadonlySet<string>;
  monsterTypes?: ReadonlySet<string>;
  resolveAssetId?: (entity: LegacyEntityLike, kind: EntityKind) => string;
}>;

/**
 * Converts the live legacy client state into a read-only renderer snapshot.
 *
 * Important: this adapter reads legacy state only. It never writes into the
 * character/entity objects and therefore cannot alter gameplay behavior.
 */
export class LegacySnapshotAdapter {
  private readonly classTypes: ReadonlySet<string>;
  private readonly monsterTypes: ReadonlySet<string>;
  private readonly resolveAssetId: (
    entity: LegacyEntityLike,
    kind: EntityKind
  ) => string;

  constructor(options: LegacySnapshotAdapterOptions = {}) {
    this.classTypes = options.classTypes ?? new Set<string>();
    this.monsterTypes = options.monsterTypes ?? new Set<string>();
    this.resolveAssetId =
      options.resolveAssetId ??
      ((entity, kind) => {
        const visualKey =
          entity.skin ??
          entity.mtype ??
          entity.type ??
          (typeof entity.npc === "string" ? entity.npc : undefined) ??
          entity.id;

        return "asset://" + kind + "/" + visualKey;
      });
  }

  toSnapshot(source: LegacySnapshotSource): GameFrameSnapshot {
    const entities = new Map<string, RenderEntity>();

    if (source.character) {
      entities.set(
        source.character.id,
        this.convertEntity(
          source.character,
          "player",
          true,
          source.targetId === source.character.id
        )
      );
    }

    for (const entity of Object.values(source.entities ?? {})) {
      if (!entity || !entity.id || entities.has(entity.id)) continue;

      const kind = this.detectKind(entity);
      entities.set(
        entity.id,
        this.convertEntity(
          entity,
          kind,
          false,
          source.targetId === entity.id
        )
      );
    }

    return Object.freeze({
      tick: source.tick,
      map: source.map,
      entities: Object.freeze([...entities.values()])
    });
  }

  private detectKind(entity: LegacyEntityLike): EntityKind {
    // Dynamic NPCs are created through add_character upstream and may carry
    // character-like fields. NPC identity must therefore win over ctype.
    if (entity.npc || entity.type === "npc") {
      return "npc";
    }

    if (
      entity.ctype ||
      entity.type === "character" ||
      (entity.type && this.classTypes.has(entity.type))
    ) {
      return "player";
    }

    if (
      entity.mtype ||
      entity.type === "monster" ||
      (entity.type && this.monsterTypes.has(entity.type))
    ) {
      return "monster";
    }

    return "prop";
  }

  private convertEntity(
    entity: LegacyEntityLike,
    kind: EntityKind,
    local: boolean,
    targeted: boolean
  ): RenderEntity {
    const x = entity.real_x ?? entity.x ?? 0;
    const y = entity.real_y ?? entity.y ?? 0;

    let facing: number | undefined;

    if (entity.going_x !== undefined && entity.going_x !== x) {
      facing = entity.going_x < x ? -1 : 1;
    }

    const name =
      entity.name ??
      (typeof entity.npc === "string" ? entity.npc : undefined) ??
      entity.mtype ??
      entity.id;
    const base = {
      id: entity.id,
      kind,
      x,
      y,
      z: entity.z,
      texture: this.resolveAssetId(entity, kind),
      facing,
      name,
      ...(targeted ? { targeted: true } : {}),
      ...(typeof entity.hp === "number" ? { hp: entity.hp } : {}),
      ...(typeof entity.max_hp === "number" ? { maxHp: entity.max_hp } : {}),
      ...(typeof entity.mp === "number" ? { mp: entity.mp } : {}),
      ...(typeof entity.max_mp === "number" ? { maxMp: entity.max_mp } : {})
    };

    return Object.freeze(local ? { ...base, local: true } : base);
  }
}
