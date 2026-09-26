import { describe, expect, it } from "vitest";

import { LegacySnapshotAdapter } from "../src/legacy/LegacySnapshotAdapter";
import {
  CUSTOM_ENTITY_ASSETS,
  resolveCustomEntityArt
} from "../src/render/CustomEntityArt";

describe("authored world entity art baseline", () => {
  it("routes main-world NPCs and monsters through first-party art", () => {
    const adapter = new LegacySnapshotAdapter();
    const snapshot = adapter.toSnapshot({
      tick: 1,
      map: "main",
      entities: {
        merchant: {
          id: "merchant",
          npc: "standmerchant",
          x: 10,
          y: 20
        },
        goo: {
          id: "goo",
          type: "monster",
          mtype: "goo",
          x: 30,
          y: 40
        },
        wolf: {
          id: "wolf",
          type: "monster",
          mtype: "wolf",
          x: 50,
          y: 60
        }
      }
    });

    const byId = new Map(snapshot.entities.map((entity) => [entity.id, entity]));
    expect(resolveCustomEntityArt(byId.get("merchant")!)).toMatchObject({
      assetId: "custom://npc/merchant"
    });
    expect(resolveCustomEntityArt(byId.get("goo")!)).toMatchObject({
      assetId: "custom://monster/slime"
    });
    expect(resolveCustomEntityArt(byId.get("wolf")!)).toMatchObject({
      assetId: "custom://monster/beast"
    });
  });

  it("routes loot props through first-party chest art", () => {
    expect(resolveCustomEntityArt({
      id: "chest:abc",
      kind: "prop",
      x: 10,
      y: 20,
      texture: "custom://prop/chest",
      appearanceKey: "prop:chest"
    })).toMatchObject({
      assetId: "custom://prop/chest"
    });
  });

  it("registers the first-party world sprite set", () => {
    const ids = CUSTOM_ENTITY_ASSETS.map((entry) => entry.id);
    expect(ids).toEqual(expect.arrayContaining([
      "custom://npc/citizen",
      "custom://npc/merchant",
      "custom://monster/slime",
      "custom://monster/beast",
      "custom://prop/chest"
    ]));
  });
});
