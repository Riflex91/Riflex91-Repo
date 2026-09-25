import type {
  GameFrameSnapshot,
  RenderBridge,
  RenderMapState
} from "../render/RenderBridge";
import {
  LegacySnapshotAdapter,
  type LegacyEntityLike
} from "./LegacySnapshotAdapter";

export type LegacyGameDataLike = Readonly<{
  maps?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  geometry?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
}>;

export type LegacyGlobalsLike = Readonly<{
  current_map?: string;
  character?: LegacyEntityLike | null;
  entities?: Readonly<Record<string, LegacyEntityLike>>;
  G?: LegacyGameDataLike;
}>;

export type FrameScheduler = Readonly<{
  request: (callback: FrameRequestCallback) => number;
  cancel: (handle: number) => void;
}>;

const browserFrameScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle)
};

function countCollection(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function snapshotPrimitiveMetadata(
  source: Readonly<Record<string, unknown>> | undefined
): Readonly<Record<string, string | number | boolean | null>> {
  const metadata: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(source ?? {})) {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      metadata[key] = value;
    }
  }

  return Object.freeze(metadata);
}

/**
 * Takes a small immutable summary of G.maps[current_map] and
 * G.geometry[current_map]. No legacy arrays/objects are handed to the renderer,
 * so the rendering side cannot mutate authoritative topology/game data.
 */
export function snapshotLegacyMapState(
  globals: LegacyGlobalsLike,
  mapId: string
): RenderMapState | undefined {
  const mapDefinition = globals.G?.maps?.[mapId];
  const geometry = globals.G?.geometry?.[mapId];

  if (!mapDefinition && !geometry) return undefined;

  return Object.freeze({
    id: mapId,
    metadata: snapshotPrimitiveMetadata(mapDefinition),
    geometry: Object.freeze({
      available: Boolean(geometry),
      tiles: countCollection(geometry?.tiles),
      placements: countCollection(geometry?.placements),
      groups: countCollection(geometry?.groups),
      animations: countCollection(geometry?.animations),
      xLines: countCollection(geometry?.x_lines),
      yLines: countCollection(geometry?.y_lines)
    })
  });
}

/**
 * Mirrors the original Adventure Land client state into the new renderer.
 *
 * During the compatibility phase the legacy PIXI entity objects are allowed to
 * continue existing because gameplay logic stores state directly on them. This
 * bridge only reads those objects and never mutates them.
 */
export class LegacyMirrorBridge {
  private frameHandle: number | null = null;
  private tick = 0;

  constructor(
    private readonly renderer: RenderBridge,
    private readonly readGlobals: () => LegacyGlobalsLike,
    private readonly adapter = new LegacySnapshotAdapter(),
    private readonly scheduler: FrameScheduler = browserFrameScheduler
  ) {}

  renderOnce(): GameFrameSnapshot {
    const globals = this.readGlobals();
    const character = globals.character ?? null;
    const map =
      globals.current_map ??
      character?.map ??
      "main";

    const entitySnapshot = this.adapter.toSnapshot({
      tick: this.tick++,
      map,
      character,
      entities: globals.entities ?? {}
    });
    const mapState = snapshotLegacyMapState(globals, map);
    const snapshot: GameFrameSnapshot = mapState
      ? Object.freeze({ ...entitySnapshot, mapState })
      : entitySnapshot;

    this.renderer.renderFrame(snapshot);
    return snapshot;
  }

  start(): void {
    if (this.frameHandle !== null) return;

    const frame = () => {
      this.renderOnce();
      this.frameHandle = this.scheduler.request(frame);
    };

    this.frameHandle = this.scheduler.request(frame);
  }

  stop(): void {
    if (this.frameHandle === null) return;

    this.scheduler.cancel(this.frameHandle);
    this.frameHandle = null;
  }

  get running(): boolean {
    return this.frameHandle !== null;
  }
}
