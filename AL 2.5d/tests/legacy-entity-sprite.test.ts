import { describe, expect, it } from "vitest";

import { LegacySnapshotAdapter } from "../src/legacy/LegacySnapshotAdapter";

describe("legacy entity sprite snapshot", () => {
  it("copies the current legacy PIXI texture frame without retaining PIXI objects", () => {
    const adapter = new LegacySnapshotAdapter();
    const texture = {
      frame: { x: 32, y: 48, width: 24, height: 36 },
      baseTexture: {
        resource: {
          url: "/images/tiles/characters/npc1.png"
        }
      }
    };

    const snapshot = adapter.toSnapshot({
      tick: 1,
      map: "main",
      entities: {
        npc: {
          id: "npc",
          type: "npc",
          npc: "test",
          x: 10,
          y: 20,
          texture
        }
      }
    });

    expect(snapshot.entities[0]?.legacySprite).toEqual({
      src: "/images/tiles/characters/npc1.png",
      sourceX: 32,
      sourceY: 48,
      width: 24,
      height: 36
    });
    expect(snapshot.entities[0]?.legacySprite).not.toBe(texture);
  });

  it("falls back cleanly when the legacy texture has no readable image source", () => {
    const adapter = new LegacySnapshotAdapter();
    const snapshot = adapter.toSnapshot({
      tick: 1,
      map: "main",
      entities: {
        monster: {
          id: "monster",
          type: "monster",
          mtype: "goo",
          x: 0,
          y: 0,
          texture: { frame: { x: 0, y: 0, width: 24, height: 24 } }
        }
      }
    });

    expect(snapshot.entities[0]?.legacySprite).toBeUndefined();
  });
});
