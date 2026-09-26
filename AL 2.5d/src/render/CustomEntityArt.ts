import type { AssetEntry } from "./AssetRegistry";
import type { RenderEntity } from "./RenderBridge";

export type CustomEntityArt = Readonly<{
  assetId: string;
  width: number;
  height: number;
}>;

const PLAYER_ART: Readonly<Record<string, CustomEntityArt>> = Object.freeze({
  warrior: Object.freeze({
    assetId: "custom://player/warrior",
    width: 36,
    height: 48
  }),
  mage: Object.freeze({
    assetId: "custom://player/mage",
    width: 36,
    height: 48
  }),
  ranger: Object.freeze({
    assetId: "custom://player/ranger",
    width: 36,
    height: 48
  }),
  rogue: Object.freeze({
    assetId: "custom://player/rogue",
    width: 36,
    height: 48
  }),
  priest: Object.freeze({
    assetId: "custom://player/priest",
    width: 36,
    height: 48
  }),
  paladin: Object.freeze({
    assetId: "custom://player/paladin",
    width: 36,
    height: 48
  }),
  merchant: Object.freeze({
    assetId: "custom://player/merchant",
    width: 36,
    height: 48
  }),
  adventurer: Object.freeze({
    assetId: "custom://player/adventurer",
    width: 36,
    height: 48
  })
});

const PLAYER_ASSET_PATHS: Readonly<Record<string, string>> = Object.freeze({
  "custom://player/warrior": "/assets/entities/v1/player-warrior.svg",
  "custom://player/mage": "/assets/entities/v1/player-mage.svg",
  "custom://player/ranger": "/assets/entities/v1/player-ranger.svg",
  "custom://player/rogue": "/assets/entities/v1/player-rogue.svg",
  "custom://player/priest": "/assets/entities/v1/player-priest.svg",
  "custom://player/paladin": "/assets/entities/v1/player-paladin.svg",
  "custom://player/merchant": "/assets/entities/v1/player-merchant.svg",
  "custom://player/adventurer": "/assets/entities/v1/player-adventurer.svg"
});

export const CUSTOM_ENTITY_ASSETS: readonly AssetEntry[] = Object.freeze(
  Object.entries(PLAYER_ASSET_PATHS).map(([id, src]) =>
    Object.freeze({ id, src })
  )
);

export function resolveCustomEntityArt(
  entity: RenderEntity
): CustomEntityArt | null {
  if (entity.kind !== "player") return null;

  const rawRole = entity.appearanceKey?.startsWith("player:")
    ? entity.appearanceKey.slice("player:".length).toLowerCase()
    : "adventurer";

  return PLAYER_ART[rawRole] ?? PLAYER_ART.adventurer;
}
