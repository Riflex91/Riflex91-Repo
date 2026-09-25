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
}>;

export type LegacySnapshotSource = Readonly<{
  tick: number;
  map: string;
  character?: LegacyEntityLike | null;
  entities?: Readonly<Record<string, LegacyEntityLike>>;
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
        this.convertEntity(source.character, "player", true)
      );
    }

    for (const entity of Object.values(source.entities ?? {})) {
      if (!entity || !entity.id || entities.has(entity.id)) continue;

      const kind = this.detectKind(entity);
      entities.set(entity.id, this.convertEntity(entity, kind, false));
    }

    return Object.freeze({
      tick: source.tick,
      map: source.map,
      entities: Object.freeze([...entities.values()])
    });
  }

  private detectKind(entity: LegacyEntityLike): EntityKind {
    if (
      entity.ctype ||
      (entity.type && this.classTypes.has(entity.type))
    ) {
      return "player";
    }

    if (entity.npc || entity.type === "npc") {
      return "npc";
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
    local: boolean
  ): RenderEntity {
    const x = entity.real_x ?? entity.x ?? 0;
    const y = entity.real_y ?? entity.y ?? 0;

    let facing: number | undefined;

    if (entity.going_x !== undefined && entity.going_x !== x) {
      facing = entity.going_x < x ? -1 : 1;
    }

    const base = {
      id: entity.id,
      kind,
      x,
      y,
      z: entity.z,
      texture: this.resolveAssetId(entity, kind),
      facing
    };

    return Object.freeze(local ? { ...base, local: true } : base);
  }
}
