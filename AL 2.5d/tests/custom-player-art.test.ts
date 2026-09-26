import { describe, expect, it } from "vitest";

import { LegacySnapshotAdapter } from "../src/legacy/LegacySnapshotAdapter";
import {
  CUSTOM_ENTITY_ASSETS,
  resolveCustomEntityArt
} from "../src/render/CustomEntityArt";

describe("authored player art baseline", () => {
  it("preserves player class as a renderer-only appearance key", () => {
    const adapter = new LegacySnapshotAdapter();
    const snapshot = adapter.toSnapshot({
      tick: 1,
      map: "main",
      character: {
        id: "hero",
        x: 0,
        y: 0,
        ctype: "mage"
      }
    });

    expect(snapshot.entities[0]?.appearanceKey).toBe("player:mage");
    expect(resolveCustomEntityArt(snapshot.entities[0]!)).toEqual({
      assetId: "custom://player/mage",
      width: 36,
      height: 48
    });
  });

  it("ships one authored asset for every current player class plus fallback", () => {
    const ids = CUSTOM_ENTITY_ASSETS.map((entry) => entry.id);

    for (const role of [
      "warrior",
      "mage",
      "ranger",
      "rogue",
      "priest",
      "paladin",
      "merchant",
      "adventurer"
    ]) {
      expect(ids).toContain(`custom://player/${role}`);
    }
  });
});
