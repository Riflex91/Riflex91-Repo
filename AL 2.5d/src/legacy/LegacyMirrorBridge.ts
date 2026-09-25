import type {
  GameFrameSnapshot,
  RenderBridge,
  RenderCollisionLine,
  RenderMapBounds,
  RenderMapState,
  RenderMapSurface
} from "../render/RenderBridge";
import {
  LegacySnapshotAdapter,
  type LegacyEntityLike
} from "./LegacySnapshotAdapter";

export type LegacyGameDataLike = Readonly<{
  maps?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  geometry?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  tilesets?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
}>;

export type LegacyGlobalsLike = Readonly<{
  current_map?: string;
  character?: LegacyEntityLike | null;
  entities?: Readonly<Record<string, LegacyEntityLike>>;
  ctarget?: LegacyEntityLike | null;
  xtarget?: LegacyEntityLike | null;
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

function recordValue(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function countCollection(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function snapshotCollisionLines(value: unknown): readonly RenderCollisionLine[] {
  if (!Array.isArray(value)) return Object.freeze([]);

  const lines: RenderCollisionLine[] = [];

  for (const candidate of value) {
    if (!Array.isArray(candidate) || candidate.length < 3) continue;
    const a = finiteNumber(candidate[0]);
    const b = finiteNumber(candidate[1]);
    const c = finiteNumber(candidate[2]);
    if (a === undefined || b === undefined || c === undefined) continue;

    lines.push(Object.freeze([a, b, c]) as RenderCollisionLine);
  }

  return Object.freeze(lines);
}

function tileDefinition(
  value: unknown,
  tilesetsValue: unknown
):
  | Readonly<{
      material: string;
      width: number;
      height: number;
      sourceX: number;
      sourceY: number;
      textureUrl?: string;
    }>
  | undefined {
  if (!Array.isArray(value) || value.length < 5) return undefined;

  const width = finiteNumber(value[3]);
  const height = finiteNumber(value[4]) ?? width;
  if (width === undefined || height === undefined || width <= 0 || height <= 0) {
    return undefined;
  }

  const material =
    typeof value[0] === "string" && value[0]
      ? value[0]
      : "default";
  const sourceX = finiteNumber(value[1]) ?? 0;
  const sourceY = finiteNumber(value[2]) ?? 0;
  const tilesets = recordValue(tilesetsValue);
  const tileset = recordValue(tilesets?.[material]);
  const textureUrl =
    typeof tileset?.file === "string" && tileset.file
      ? tileset.file
      : undefined;

  return Object.freeze({
    material,
    width,
    height,
    sourceX,
    sourceY,
    ...(textureUrl ? { textureUrl } : {})
  });
}

function snapshotSurfacePlacements(
  tilesValue: unknown,
  placementsValue: unknown,
  tilesetsValue: unknown,
  layer: "ground" | "structure",
  group?: number
): readonly RenderMapSurface[] {
  if (!Array.isArray(tilesValue) || !Array.isArray(placementsValue)) {
    return Object.freeze([]);
  }

  const surfaces: RenderMapSurface[] = [];

  for (const candidate of placementsValue) {
    if (!Array.isArray(candidate) || candidate.length < 3) continue;

    const tile = finiteNumber(candidate[0]);
    const x = finiteNumber(candidate[1]);
    const y = finiteNumber(candidate[2]);
    if (tile === undefined || x === undefined || y === undefined) continue;

    const definition = tileDefinition(tilesValue[tile], tilesetsValue);
    if (!definition) continue;

    const repeatX = finiteNumber(candidate[3]) ?? x;
    const repeatY = finiteNumber(candidate[4]) ?? y;
    const minX = Math.min(x, repeatX);
    const minY = Math.min(y, repeatY);
    const maxX = Math.max(x, repeatX) + definition.width;
    const maxY = Math.max(y, repeatY) + definition.height;

    surfaces.push(
      Object.freeze({
        tile,
        material: definition.material,
        minX,
        minY,
        maxX,
        maxY,
        layer,
        ...(group === undefined ? {} : { group }),
        ...(definition.textureUrl
          ? {
              textureUrl: definition.textureUrl,
              sourceX: definition.sourceX,
              sourceY: definition.sourceY,
              tileWidth: definition.width,
              tileHeight: definition.height
            }
          : {})
      })
    );
  }

  return Object.freeze(surfaces);
}

function inferStructureElevation(
  surfaces: readonly RenderMapSurface[]
): number {
  if (!surfaces.length) return 0;

  const minX = Math.min(...surfaces.map((surface) => surface.minX));
  const minY = Math.min(...surfaces.map((surface) => surface.minY));
  const maxX = Math.max(...surfaces.map((surface) => surface.maxX));
  const maxY = Math.max(...surfaces.map((surface) => surface.maxY));
  const width = Math.max(1, maxX - minX);
  const depth = Math.max(1, maxY - minY);
  const longSide = Math.max(width, depth);
  const shortSide = Math.min(width, depth);
  const footprint = width * depth;
  const materials = surfaces
    .map((surface) => surface.material.toLowerCase())
    .join(" ");

  const decorative =
    /(tree|bush|grass|flower|plant|fence|rail|light|water|road|path|ground)/.test(
      materials
    );
  const architectural =
    /(house|roof|building|wall|castle|fort|interior|dungeon|tower|shop)/.test(
      materials
    );

  if (decorative && !architectural) return 2;
  if (shortSide <= 28 && longSide >= 120) return 3;
  if (surfaces.length <= 2 && longSide <= 112) return 4;
  if (architectural) {
    if (footprint >= 90000) return 22;
    if (footprint >= 40000) return 18;
    return 14;
  }
  if (footprint < 12000) return 4;
  if (footprint < 36000) return 8;
  if (footprint < 90000) return 12;
  return 16;
}

function snapshotMapSurfaces(
  visualGeometry: Readonly<Record<string, unknown>> | undefined,
  tilesetsValue: unknown
): readonly RenderMapSurface[] {
  if (!visualGeometry) return Object.freeze([]);

  const tiles = visualGeometry.tiles;
  const surfaces: RenderMapSurface[] = [
    ...snapshotSurfacePlacements(
      tiles,
      visualGeometry.placements,
      tilesetsValue,
      "ground"
    )
  ];

  if (Array.isArray(visualGeometry.groups)) {
    visualGeometry.groups.forEach((group, index) => {
      const groupSurfaces = snapshotSurfacePlacements(
        tiles,
        group,
        tilesetsValue,
        "structure",
        index
      );
      const elevation = inferStructureElevation(groupSurfaces);

      surfaces.push(
        ...groupSurfaces.map((surface) =>
          Object.freeze({
            ...surface,
            elevation
          })
        )
      );
    });
  }

  return Object.freeze(surfaces);
}

function inferBounds(
  geometry: Readonly<Record<string, unknown>> | undefined,
  xLines: readonly RenderCollisionLine[],
  yLines: readonly RenderCollisionLine[]
): RenderMapBounds | undefined {
  const minX = finiteNumber(geometry?.min_x);
  const minY = finiteNumber(geometry?.min_y);
  const maxX = finiteNumber(geometry?.max_x);
  const maxY = finiteNumber(geometry?.max_y);

  if (
    minX !== undefined &&
    minY !== undefined &&
    maxX !== undefined &&
    maxY !== undefined &&
    maxX > minX &&
    maxY > minY
  ) {
    return Object.freeze({ minX, minY, maxX, maxY });
  }

  const xs: number[] = [];
  const ys: number[] = [];

  for (const [x, y1, y2] of xLines) {
    xs.push(x);
    ys.push(y1, y2);
  }

  for (const [y, x1, x2] of yLines) {
    ys.push(y);
    xs.push(x1, x2);
  }

  if (!xs.length || !ys.length) return undefined;

  return Object.freeze({
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  });
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
 * Takes an immutable presentation snapshot of G.maps[current_map] and the
 * collision geometry from G.geometry[current_map]. Arrays are copied, so the
 * renderer can never mutate authoritative Adventure Land geometry.
 */
export function snapshotLegacyMapState(
  globals: LegacyGlobalsLike,
  mapId: string
): RenderMapState | undefined {
  const mapDefinition = globals.G?.maps?.[mapId];
  const rawGeometry = globals.G?.geometry?.[mapId];

  if (!mapDefinition && !rawGeometry) return undefined;

  const geometryRecord = recordValue(rawGeometry);
  const nestedData = recordValue(geometryRecord?.data);
  const visualGeometry = nestedData ?? geometryRecord;
  const rawXLines = geometryRecord?.x_lines ?? visualGeometry?.x_lines;
  const rawYLines = geometryRecord?.y_lines ?? visualGeometry?.y_lines;
  const xLines = snapshotCollisionLines(rawXLines);
  const yLines = snapshotCollisionLines(rawYLines);
  const surfaces = snapshotMapSurfaces(
    visualGeometry,
    globals.G?.tilesets
  );

  return Object.freeze({
    id: mapId,
    metadata: snapshotPrimitiveMetadata(mapDefinition),
    geometry: Object.freeze({
      available: Boolean(geometryRecord),
      tiles: countCollection(visualGeometry?.tiles),
      placements: countCollection(visualGeometry?.placements),
      groups: countCollection(visualGeometry?.groups),
      animations: countCollection(visualGeometry?.animations),
      xLines: countCollection(rawXLines),
      yLines: countCollection(rawYLines),
      bounds: inferBounds(geometryRecord ?? visualGeometry, xLines, yLines),
      collisionXLines: xLines,
      collisionYLines: yLines,
      surfaces
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
    private readonly scheduler: FrameScheduler = browserFrameScheduler,
    private readonly onSnapshot?: (snapshot: GameFrameSnapshot) => void
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
      entities: globals.entities ?? {},
      targetId: globals.xtarget?.id ?? globals.ctarget?.id ?? null
    });
    const mapState = snapshotLegacyMapState(globals, map);
    const snapshot: GameFrameSnapshot = mapState
      ? Object.freeze({ ...entitySnapshot, mapState })
      : entitySnapshot;

    this.onSnapshot?.(snapshot);
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
