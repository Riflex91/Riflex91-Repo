import type { AssetEntry } from "./AssetRegistry";
import type { RenderEntity } from "./RenderBridge";

export type CustomEntityArt = Readonly<{
  assetId: string;
  width: number;
  height: number;
}>;

const PLAYER_ART: Readonly<Record<string, CustomEntityArt>> = Object.freeze({
  warrior: Object.freeze({ assetId: "custom://player/warrior", width: 36, height: 48 }),
  mage: Object.freeze({ assetId: "custom://player/mage", width: 36, height: 48 }),
  ranger: Object.freeze({ assetId: "custom://player/ranger", width: 36, height: 48 }),
  rogue: Object.freeze({ assetId: "custom://player/rogue", width: 36, height: 48 }),
  priest: Object.freeze({ assetId: "custom://player/priest", width: 36, height: 48 }),
  paladin: Object.freeze({ assetId: "custom://player/paladin", width: 36, height: 48 }),
  merchant: Object.freeze({ assetId: "custom://player/merchant", width: 36, height: 48 }),
  adventurer: Object.freeze({ assetId: "custom://player/adventurer", width: 36, height: 48 })
});

const NPC_CITIZEN: CustomEntityArt = Object.freeze({
  assetId: "custom://npc/citizen",
  width: 38,
  height: 52
});
const NPC_MERCHANT: CustomEntityArt = Object.freeze({
  assetId: "custom://npc/merchant",
  width: 40,
  height: 54
});
const MONSTER_SLIME: CustomEntityArt = Object.freeze({
  assetId: "custom://monster/slime",
  width: 44,
  height: 34
});
const MONSTER_BEAST: CustomEntityArt = Object.freeze({
  assetId: "custom://monster/beast",
  width: 50,
  height: 40
});
const PROP_CHEST: CustomEntityArt = Object.freeze({
  assetId: "custom://prop/chest",
  width: 44,
  height: 38
});

const ASSET_PATHS: Readonly<Record<string, string>> = Object.freeze({
  "custom://player/warrior": "/assets/entities/v1/player-warrior.svg",
  "custom://player/mage": "/assets/entities/v1/player-mage.svg",
  "custom://player/ranger": "/assets/entities/v1/player-ranger.svg",
  "custom://player/rogue": "/assets/entities/v1/player-rogue.svg",
  "custom://player/priest": "/assets/entities/v1/player-priest.svg",
  "custom://player/paladin": "/assets/entities/v1/player-paladin.svg",
  "custom://player/merchant": "/assets/entities/v1/player-merchant.svg",
  "custom://player/adventurer": "/assets/entities/v1/player-adventurer.svg",
  "custom://npc/citizen": "/assets/entities/v1/npc-citizen.svg",
  "custom://npc/merchant": "/assets/entities/v1/npc-merchant.svg",
  "custom://monster/slime": "/assets/entities/v1/monster-slime.svg",
  "custom://monster/beast": "/assets/entities/v1/monster-beast.svg",
  "custom://prop/chest": "/assets/entities/v1/prop-chest.svg"
});

export const CUSTOM_ENTITY_ASSETS: readonly AssetEntry[] = Object.freeze(
  Object.entries(ASSET_PATHS).map(([id, src]) => Object.freeze({ id, src }))
);

function appearanceRole(entity: RenderEntity, prefix: string): string {
  return entity.appearanceKey?.startsWith(prefix)
    ? entity.appearanceKey.slice(prefix.length).toLowerCase()
    : "";
}

export function resolveCustomEntityArt(
  entity: RenderEntity
): CustomEntityArt | null {
  if (entity.kind === "player") {
    const role = appearanceRole(entity, "player:") || "adventurer";
    return PLAYER_ART[role] ?? PLAYER_ART.adventurer;
  }

  if (entity.kind === "npc") {
    const role = appearanceRole(entity, "npc:");
    return /(merchant|shop|stand|scroll|pot|weapon|armor|premium|exchange)/.test(role)
      ? NPC_MERCHANT
      : NPC_CITIZEN;
  }

  if (entity.kind === "monster") {
    const role = appearanceRole(entity, "monster:");
    return /(goo|slime|gel|blob)/.test(role)
      ? MONSTER_SLIME
      : MONSTER_BEAST;
  }

  if (entity.kind === "prop") {
    const role = appearanceRole(entity, "prop:");
    if (/chest|loot|treasure/.test(role)) return PROP_CHEST;
  }

  return null;
}
