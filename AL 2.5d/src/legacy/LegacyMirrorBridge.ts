import type {
  GameFrameSnapshot,
  RenderBridge,
  RenderCollisionLine,
  RenderMapBounds,
  RenderMapState,
  RenderMapSurface,
  RenderPlayerUi,
  RenderInventorySlot,
  RenderEquipmentSlot,
  RenderHotbarEntry,
  RenderSkillEntry,
  RenderPartyMember,
  RenderChatMessage,
  RenderChatChannel,
  RenderQuestEvent
} from "../render/RenderBridge";
import {
  LegacySnapshotAdapter,
  type LegacyEntityLike
} from "./LegacySnapshotAdapter";

export type LegacyGameDataLike = Readonly<{
  maps?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  geometry?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  tilesets?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  items?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  skills?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  monsters?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  events?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
}>;

export type LegacyGlobalsLike = Readonly<{
  current_map?: string;
  character?: LegacyEntityLike | null;
  entities?: Readonly<Record<string, LegacyEntityLike>>;
  ctarget?: LegacyEntityLike | null;
  xtarget?: LegacyEntityLike | null;
  skillbar?: readonly string[];
  keymap?: Readonly<Record<string, unknown>>;
  party_list?: readonly string[];
  party?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  game_chats?: readonly unknown[];
  cwindows?: readonly string[];
  document?: Document;
  S?: Readonly<Record<string, unknown>>;
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

  if (decorative && !architectural) return 0;
  if (shortSide <= 28 && longSide >= 120) return 0;
  if (surfaces.length <= 2 && longSide <= 112) return 2;
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

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value
    : undefined;
}

function displayNameFor(
  name: string,
  definitions: Readonly<Record<string, Readonly<Record<string, unknown>>>> | undefined
): string {
  const definition = definitions?.[name];
  return stringValue(definition?.name) ?? name;
}

function itemSnapshot(
  value: unknown,
  index: number,
  definitions: Readonly<Record<string, Readonly<Record<string, unknown>>>> | undefined
): RenderInventorySlot {
  const item = recordValue(value);
  const name = stringValue(item?.name);

  if (!name) {
    return Object.freeze({ index });
  }

  const level = finiteNumber(item?.level);
  const quantity = finiteNumber(item?.q);

  return Object.freeze({
    index,
    name,
    displayName: displayNameFor(name, definitions),
    ...(level === undefined ? {} : { level }),
    ...(quantity === undefined ? {} : { quantity })
  });
}

function actionName(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  const record = recordValue(value);
  return stringValue(record?.name);
}

function actionLabel(
  action: string,
  skills: Readonly<Record<string, Readonly<Record<string, unknown>>>> | undefined
): string {
  if (action === "use_hp") return "HP Potion";
  if (action === "use_mp") return "MP Potion";
  if (action === "attack") return "Attack";
  return displayNameFor(action, skills);
}

function snapshotLegacyPlayerUi(
  globals: LegacyGlobalsLike,
  character: LegacyEntityLike | null
): RenderPlayerUi | undefined {
  if (!character) return undefined;

  const itemDefinitions = globals.G?.items;
  const skillDefinitions = globals.G?.skills;
  const inventory: RenderInventorySlot[] = Array.isArray(character.items)
    ? character.items.map((item, index) =>
        itemSnapshot(item, index, itemDefinitions)
      )
    : [];

  const equipment: RenderEquipmentSlot[] = [];
  for (const [slot, raw] of Object.entries(character.slots ?? {})) {
    const item = recordValue(raw);
    const name = stringValue(item?.name);
    if (!name) continue;

    const level = finiteNumber(item?.level);
    const quantity = finiteNumber(item?.q);
    equipment.push(
      Object.freeze({
        slot,
        name,
        displayName: displayNameFor(name, itemDefinitions),
        ...(level === undefined ? {} : { level }),
        ...(quantity === undefined ? {} : { quantity })
      })
    );
  }

  const keymap = globals.keymap ?? {};
  const hotbar: RenderHotbarEntry[] = [];
  const boundKeys = new Map<string, string>();

  for (const key of globals.skillbar ?? []) {
    const action = actionName(keymap[key]);
    if (!action) continue;
    boundKeys.set(action, key);
    hotbar.push(
      Object.freeze({
        key,
        action,
        label: actionLabel(action, skillDefinitions)
      })
    );
  }

  for (const [key, rawAction] of Object.entries(keymap)) {
    const action = actionName(rawAction);
    if (action && !boundKeys.has(action)) {
      boundKeys.set(action, key);
    }
  }

  const skills: RenderSkillEntry[] = [];
  const ctype = character.ctype;

  for (const [name, definition] of Object.entries(skillDefinitions ?? {})) {
    const classes = Array.isArray(definition.class)
      ? definition.class.filter((entry): entry is string => typeof entry === "string")
      : [];

    if (!classes.length || !ctype || !classes.includes(ctype)) continue;

    const requiredLevel = finiteNumber(definition.level);
    const mp = finiteNumber(definition.mp);
    const key = boundKeys.get(name);

    skills.push(
      Object.freeze({
        name,
        label: stringValue(definition.name) ?? name,
        ...(key ? { key } : {}),
        ...(requiredLevel === undefined ? {} : { requiredLevel }),
        ...(mp === undefined ? {} : { mp })
      })
    );
  }

  skills.sort((a, b) =>
    (a.requiredLevel ?? 0) - (b.requiredLevel ?? 0) ||
    a.label.localeCompare(b.label)
  );

  return Object.freeze({
    inventory: Object.freeze(inventory),
    equipment: Object.freeze(equipment),
    hotbar: Object.freeze(hotbar),
    skills: Object.freeze(skills)
  });
}

export function snapshotLegacyChat(
  globals: LegacyGlobalsLike,
  limit = 50
): readonly RenderChatMessage[] {
  if (!Array.isArray(globals.game_chats) || limit <= 0) {
    return Object.freeze([]);
  }

  const messages: RenderChatMessage[] = [];
  const source = globals.game_chats.slice(-Math.max(1, Math.floor(limit)));

  for (const candidate of source) {
    if (!Array.isArray(candidate) || candidate.length < 2) continue;

    const owner =
      typeof candidate[0] === "string" && candidate[0]
        ? candidate[0]
        : undefined;
    const rawMessage = candidate[1];
    const message =
      typeof rawMessage === "string"
        ? rawMessage
        : typeof rawMessage === "number"
          ? String(rawMessage)
          : undefined;
    if (message === undefined) continue;

    const color =
      typeof candidate[2] === "string" && candidate[2]
        ? candidate[2]
        : undefined;
    const rawId = candidate[3];
    const id =
      typeof rawId === "string" || typeof rawId === "number"
        ? rawId
        : undefined;
    const repeat = finiteNumber(candidate[4]);

    messages.push(
      Object.freeze({
        ...(owner ? { owner } : {}),
        message,
        ...(color ? { color } : {}),
        ...(id === undefined ? {} : { id }),
        ...(repeat === undefined || repeat <= 1
          ? {}
          : { repeat: Math.floor(repeat) })
      })
    );
  }

  return Object.freeze(messages);
}

function chatMessageFromDomText(text: string): RenderChatMessage | null {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;

  const colon = clean.indexOf(":");
  if (colon > 0 && colon <= 32) {
    const owner = clean.slice(0, colon).trim();
    const message = clean.slice(colon + 1).trim();
    if (owner && message) {
      return Object.freeze({ owner, message });
    }
  }

  return Object.freeze({ message: clean });
}

function snapshotLegacyChatDom(
  documentValue: Document | undefined,
  contentId: string,
  limit: number
): readonly RenderChatMessage[] {
  if (!documentValue || limit <= 0) return Object.freeze([]);

  let element: HTMLElement | null = null;
  try {
    element = documentValue.getElementById(contentId);
  } catch {
    return Object.freeze([]);
  }
  if (!element) return Object.freeze([]);

  const children = Array.from(element.children ?? []);
  const messages: RenderChatMessage[] = [];

  for (const child of children.slice(-Math.max(1, Math.floor(limit)))) {
    const parsed = chatMessageFromDomText(child.textContent ?? "");
    if (parsed) messages.push(parsed);
  }

  return Object.freeze(messages);
}

function legacyChatUnread(
  documentValue: Document | undefined,
  tabId: string
): boolean {
  if (!documentValue) return false;

  try {
    return Boolean(
      documentValue.getElementById(tabId)?.classList?.contains("newmessage")
    );
  } catch {
    return false;
  }
}

export function snapshotLegacyChatChannels(
  globals: LegacyGlobalsLike,
  limit = 50
): readonly RenderChatChannel[] {
  const channels: RenderChatChannel[] = [];
  const mainMessages = snapshotLegacyChat(globals, limit);

  channels.push(
    Object.freeze({
      id: "main",
      kind: "main" as const,
      label: "MAIN",
      messages: mainMessages
    })
  );

  const windowIds = Array.isArray(globals.cwindows)
    ? globals.cwindows.filter(
        (id): id is string => typeof id === "string" && Boolean(id.trim())
      )
    : [];
  const partyOpen = windowIds.includes("party");
  const hasParty = (globals.party_list?.length ?? 0) > 0;
  const partyMessages = snapshotLegacyChatDom(
    globals.document,
    "chatdparty",
    limit
  );

  if (partyOpen || hasParty || partyMessages.length) {
    channels.push(
      Object.freeze({
        id: "party",
        kind: "party" as const,
        label: "PARTY",
        unread: legacyChatUnread(globals.document, "chattparty"),
        messages: partyMessages
      })
    );
  }

  const seenPeers = new Set<string>();
  for (const windowId of windowIds) {
    if (!windowId.startsWith("pm") || windowId.length <= 2) continue;

    const peer = windowId.slice(2).trim();
    if (!peer || seenPeers.has(peer)) continue;
    seenPeers.add(peer);

    channels.push(
      Object.freeze({
        id: `pm:${peer}`,
        kind: "pm" as const,
        label: peer,
        peer,
        unread: legacyChatUnread(globals.document, `chattpm${peer}`),
        messages: snapshotLegacyChatDom(
          globals.document,
          `chatdpm${peer}`,
          limit
        )
      })
    );
  }

  return Object.freeze(channels);
}

export function snapshotLegacyParty(
  globals: LegacyGlobalsLike,
  character: LegacyEntityLike | null,
  currentMap: string
): readonly RenderPartyMember[] {
  const rawParty = globals.party ?? {};
  const listedNames = Array.isArray(globals.party_list)
    ? globals.party_list.filter(
        (name): name is string => typeof name === "string" && Boolean(name.trim())
      )
    : [];
  const names = listedNames.length ? listedNames : Object.keys(rawParty);
  if (!names.length) return Object.freeze([]);

  const entities = Object.values(globals.entities ?? {});
  const localName = character?.name ?? character?.id;
  const localX =
    finiteNumber(character?.real_x) ??
    finiteNumber(character?.x);
  const localY =
    finiteNumber(character?.real_y) ??
    finiteNumber(character?.y);
  const localMap = character?.map ?? currentMap;
  const result: RenderPartyMember[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);

    const row = recordValue(rawParty[name]) ?? {};
    const visible =
      (character && (character.name === name || character.id === name)
        ? character
        : undefined) ??
      entities.find(
        (entity) => entity.name === name || entity.id === name
      );

    const role =
      stringValue(row.ctype) ??
      stringValue(row.type) ??
      visible?.ctype;
    const level =
      finiteNumber(row.level) ??
      finiteNumber(visible?.level);
    const hp =
      finiteNumber(row.hp) ??
      finiteNumber(visible?.hp);
    const maxHp =
      finiteNumber(row.max_hp) ??
      finiteNumber(visible?.max_hp);
    const mp =
      finiteNumber(row.mp) ??
      finiteNumber(visible?.mp);
    const maxMp =
      finiteNumber(row.max_mp) ??
      finiteNumber(visible?.max_mp);
    const map =
      stringValue(row.map) ??
      visible?.map;
    const x =
      finiteNumber(row.x) ??
      finiteNumber(row.real_x) ??
      finiteNumber(visible?.real_x) ??
      finiteNumber(visible?.x);
    const y =
      finiteNumber(row.y) ??
      finiteNumber(row.real_y) ??
      finiteNumber(visible?.real_y) ??
      finiteNumber(visible?.y);
    const local = name === localName;
    const sameMap = (map ?? localMap) === localMap;
    const distance =
      !local &&
      sameMap &&
      localX !== undefined &&
      localY !== undefined &&
      x !== undefined &&
      y !== undefined
        ? Math.hypot(x - localX, y - localY)
        : undefined;

    result.push(
      Object.freeze({
        name,
        ...(role ? { role } : {}),
        ...(level === undefined ? {} : { level }),
        ...(hp === undefined ? {} : { hp }),
        ...(maxHp === undefined ? {} : { maxHp }),
        ...(mp === undefined ? {} : { mp }),
        ...(maxMp === undefined ? {} : { maxMp }),
        ...(map ? { map } : {}),
        ...(x === undefined ? {} : { x }),
        ...(y === undefined ? {} : { y }),
        ...(local ? { local: true } : {}),
        sameMap,
        ...(distance === undefined ? {} : { distance })
      })
    );
  }

  return Object.freeze(result);
}

function titleCaseKey(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function snapshotLegacyQuestEvents(
  globals: LegacyGlobalsLike,
  character: LegacyEntityLike | null
): readonly RenderQuestEvent[] {
  const rows: RenderQuestEvent[] = [];
  const statuses = character?.s ?? {};
  const hunt = recordValue(statuses.monsterhunt);

  if (hunt) {
    const monsterId = stringValue(hunt.id);
    const monsterDefinition = monsterId
      ? globals.G?.monsters?.[monsterId]
      : undefined;
    const monsterName =
      stringValue(monsterDefinition?.name) ??
      (monsterId ? titleCaseKey(monsterId) : "Monster");
    const remaining = finiteNumber(hunt.c);

    rows.push(
      Object.freeze({
        id: "monsterhunt",
        kind: "quest" as const,
        title: "Monster Hunt",
        detail:
          remaining === undefined
            ? `Defeat ${monsterName}`
            : `Defeat ${Math.max(0, Math.floor(remaining))} × ${monsterName}`,
        status: "Active",
        ...(remaining === undefined
          ? {}
          : { remaining: Math.max(0, Math.floor(remaining)) })
      })
    );
  }

  const anniversaryVisit = recordValue(statuses.anniversary_visit);
  if (anniversaryVisit) {
    const expiresAt = finiteNumber(anniversaryVisit.expires);
    rows.push(
      Object.freeze({
        id: "anniversary_visit",
        kind: "event" as const,
        title: "Anniversary Visit",
        detail: "Realm visit invitation",
        status: "Invitation",
        ...(expiresAt === undefined ? {} : { expiresAt })
      })
    );
  }

  if (statuses.holidayspirit) {
    rows.push(
      Object.freeze({
        id: "holidayspirit",
        kind: "event" as const,
        title: "Holiday Spirit",
        detail: "Seasonal event status",
        status: "Active"
      })
    );
  }

  for (const [eventId, rawState] of Object.entries(globals.S ?? {})) {
    const definition = globals.G?.events?.[eventId];
    const state = recordValue(rawState);
    const active =
      rawState === true ||
      state?.active === true ||
      state?.live === true ||
      Boolean(definition && rawState);

    if (!active) continue;

    const id = `event:${eventId}`;
    if (rows.some((row) => row.id === id)) continue;

    const title =
      stringValue(state?.name) ??
      stringValue(definition?.name) ??
      titleCaseKey(eventId);
    const detail =
      stringValue(state?.message) ??
      stringValue(definition?.description);
    const map = stringValue(state?.map);
    const expiresAt =
      finiteNumber(state?.end) ??
      finiteNumber(state?.expires);

    rows.push(
      Object.freeze({
        id,
        kind: "event" as const,
        title,
        ...(detail ? { detail } : {}),
        status: "Active",
        ...(map ? { map } : {}),
        ...(expiresAt === undefined ? {} : { expiresAt })
      })
    );
  }

  return Object.freeze(rows);
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
    const playerUi = snapshotLegacyPlayerUi(globals, character);
    const party = snapshotLegacyParty(globals, character, map);
    const chat = snapshotLegacyChat(globals);
    const chatChannels = snapshotLegacyChatChannels(globals);
    const questEvents = snapshotLegacyQuestEvents(globals, character);
    const hasExtendedChat =
      chatChannels.length > 1 ||
      chatChannels.some((channel) => channel.messages.length > 0);
    const snapshot: GameFrameSnapshot =
      mapState ||
      playerUi ||
      party.length ||
      chat.length ||
      hasExtendedChat ||
      questEvents.length
        ? Object.freeze({
            ...entitySnapshot,
            ...(mapState ? { mapState } : {}),
            ...(playerUi ? { playerUi } : {}),
            ...(party.length ? { party } : {}),
            ...(chat.length ? { chat } : {}),
            ...(hasExtendedChat ? { chatChannels } : {}),
            ...(questEvents.length ? { questEvents } : {})
          })
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
