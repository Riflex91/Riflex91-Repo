import type {
  GameFrameSnapshot,
  RenderEntity
} from "../render/RenderBridge";

export type HudBarModel = Readonly<{
  current: number;
  max: number;
  ratio: number;
  text: string;
}>;

export type PlayerHudModel = Readonly<{
  id: string;
  name: string;
  role: string;
  level?: number;
  glyph: string;
  hp?: HudBarModel;
  mp?: HudBarModel;
  xp?: HudBarModel;
}>;

export type TargetHudModel = Readonly<{
  id: string;
  name: string;
  meta: string;
  hp?: HudBarModel;
}>;

export type HudModel = Readonly<{
  player: PlayerHudModel | null;
  target: TargetHudModel | null;
}>;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function makeBar(
  current: number | undefined,
  max: number | undefined
): HudBarModel | undefined {
  if (
    current === undefined ||
    max === undefined ||
    !Number.isFinite(current) ||
    !Number.isFinite(max) ||
    max <= 0
  ) {
    return undefined;
  }

  const safeCurrent = Math.max(0, current);
  return Object.freeze({
    current: safeCurrent,
    max,
    ratio: clamp01(safeCurrent / max),
    text: `${Math.floor(safeCurrent).toLocaleString()} / ${Math.floor(max).toLocaleString()}`
  });
}

function titleCase(value: string): string {
  return value
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roleFor(entity: RenderEntity): string {
  const prefix = `${entity.kind}:`;
  const appearance = entity.appearanceKey;

  if (appearance?.startsWith(prefix)) {
    return titleCase(appearance.slice(prefix.length));
  }

  return titleCase(entity.kind);
}

function glyphFor(role: string): string {
  const normalized = role.trim();
  if (!normalized) return "?";

  const words = normalized.split(/\s+/);
  return words.length > 1
    ? (words[0]![0] + words[1]![0]).toUpperCase()
    : normalized.slice(0, 2).toUpperCase();
}

export function buildHudModel(snapshot: GameFrameSnapshot): HudModel {
  const local = snapshot.entities.find((entity) => entity.local) ?? null;
  const target =
    snapshot.entities.find(
      (entity) => entity.targeted && !entity.local
    ) ?? null;

  const player = local
    ? (() => {
        const role = roleFor(local);
        return Object.freeze({
          id: local.id,
          name: local.name ?? local.id,
          role,
          level: local.level,
          glyph: glyphFor(role),
          hp: makeBar(local.hp, local.maxHp),
          mp: makeBar(local.mp, local.maxMp),
          xp: makeBar(local.xp, local.maxXp)
        });
      })()
    : null;

  const targetModel = target
    ? Object.freeze({
        id: target.id,
        name: target.name ?? target.id,
        meta: [
          roleFor(target),
          target.level !== undefined ? `Lv. ${target.level}` : null
        ]
          .filter(Boolean)
          .join(" · "),
        hp: makeBar(target.hp, target.maxHp)
      })
    : null;

  return Object.freeze({
    player,
    target: targetModel
  });
}
