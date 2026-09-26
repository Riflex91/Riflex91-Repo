export type EntityKind = "player" | "monster" | "npc" | "prop" | "projectile";

export type RenderSpriteFrame = Readonly<{
  src: string;
  sourceX: number;
  sourceY: number;
  width: number;
  height: number;
}>;

export type RenderEntity = Readonly<{
  id: string;
  kind: EntityKind;
  x: number;
  y: number;
  z?: number;
  texture: string;
  appearanceKey?: string;
  legacySprite?: RenderSpriteFrame;
  facing?: number;
  scale?: number;
  alpha?: number;
  local?: boolean;
  targeted?: boolean;
  name?: string;
  hp?: number;
  maxHp?: number;
  mp?: number;
  maxMp?: number;
  level?: number;
  xp?: number;
  maxXp?: number;
}>;

export type CameraState = Readonly<{
  x: number;
  y: number;
  zoom: number;
  /** Visual clockwise rotation in radians. Gameplay coordinates stay unchanged. */
  rotation?: number;
}>;

export type RenderCollisionLine = readonly [number, number, number];

export type RenderMapBounds = Readonly<{
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}>;

export type RenderMapSurface = Readonly<{
  tile: number;
  material: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  layer: "ground" | "structure";
  group?: number;
  textureUrl?: string;
  sourceX?: number;
  sourceY?: number;
  tileWidth?: number;
  tileHeight?: number;
  elevation?: number;
}>;

export type RenderMapGeometrySummary = Readonly<{
  available: boolean;
  tiles: number;
  placements: number;
  groups: number;
  animations: number;
  xLines: number;
  yLines: number;
  bounds?: RenderMapBounds;
  collisionXLines: readonly RenderCollisionLine[];
  collisionYLines: readonly RenderCollisionLine[];
  surfaces: readonly RenderMapSurface[];
}>;

export type RenderMapState = Readonly<{
  id: string;
  metadata: Readonly<Record<string, string | number | boolean | null>>;
  geometry: RenderMapGeometrySummary;
}>;

export type RenderItemStat = Readonly<{
  key: string;
  label: string;
  value: number;
  source: "definition" | "instance";
}>;

export type RenderItemDetails = Readonly<{
  type?: string;
  tier?: number;
  damageType?: string;
  explanation?: string;
  classes?: readonly string[];
  stats: readonly RenderItemStat[];
}>;

export type RenderInventorySlot = Readonly<{
  index: number;
  name?: string;
  displayName?: string;
  level?: number;
  quantity?: number;
  details?: RenderItemDetails;
}>;

export type RenderEquipmentSlot = Readonly<{
  slot: string;
  name: string;
  displayName: string;
  level?: number;
  quantity?: number;
  details?: RenderItemDetails;
}>;

export type RenderSkillVisualKind =
  | "offense"
  | "support"
  | "defense"
  | "mobility"
  | "utility";

export type RenderHotbarEntry = Readonly<{
  key: string;
  action: string;
  label: string;
  visualKind: RenderSkillVisualKind;
}>;

export type RenderSkillEntry = Readonly<{
  name: string;
  label: string;
  visualKind: RenderSkillVisualKind;
  key?: string;
  requiredLevel?: number;
  mp?: number;
}>;

export type RenderPlayerUi = Readonly<{
  inventory: readonly RenderInventorySlot[];
  equipment: readonly RenderEquipmentSlot[];
  hotbar: readonly RenderHotbarEntry[];
  skills: readonly RenderSkillEntry[];
}>;

export type RenderChatMessage = Readonly<{
  owner?: string;
  message: string;
  color?: string;
  id?: string | number;
  repeat?: number;
}>;

export type RenderChatChannelKind = "main" | "party" | "pm";

export type RenderChatChannel = Readonly<{
  id: string;
  kind: RenderChatChannelKind;
  label: string;
  peer?: string;
  unread?: boolean;
  messages: readonly RenderChatMessage[];
}>;

export type RenderQuestEvent = Readonly<{
  id: string;
  kind: "quest" | "event";
  title: string;
  detail?: string;
  status?: string;
  remaining?: number;
  map?: string;
  expiresAt?: number;
}>;

export type RenderLootChest = Readonly<{
  id: string;
  x: number;
  y: number;
  map?: string;
  items?: number;
  opening?: boolean;
}>;

export type RenderPartyMember = Readonly<{
  name: string;
  role?: string;
  level?: number;
  hp?: number;
  maxHp?: number;
  mp?: number;
  maxMp?: number;
  map?: string;
  x?: number;
  y?: number;
  local?: boolean;
  sameMap?: boolean;
  distance?: number;
}>;

export type GameFrameSnapshot = Readonly<{
  tick: number;
  map: string;
  mapState?: RenderMapState;
  playerUi?: RenderPlayerUi;
  party?: readonly RenderPartyMember[];
  chat?: readonly RenderChatMessage[];
  chatChannels?: readonly RenderChatChannel[];
  questEvents?: readonly RenderQuestEvent[];
  lootChests?: readonly RenderLootChest[];
  entities: readonly RenderEntity[];
}>;

/**
 * Presentation boundary.
 *
 * Legacy Adventure Land logic may only push snapshots through this interface.
 * The renderer never mutates gameplay state.
 */
export interface RenderBridge {
  mount(host: HTMLElement): Promise<void>;
  renderFrame(snapshot: GameFrameSnapshot): void;
  setCamera(camera: CameraState): void;
  destroy(): void;
}
