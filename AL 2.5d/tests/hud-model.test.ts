import { describe, expect, it } from "vitest";

import { buildHudModel } from "../src/ui/HudModel";

describe("custom HUD model", () => {
  it("maps local HP/MP/XP and level without mutating gameplay state", () => {
    const snapshot = {
      tick: 1,
      map: "main",
      entities: [
        {
          id: "hero",
          kind: "player" as const,
          x: 0,
          y: 0,
          texture: "asset://player/hero",
          appearanceKey: "player:mage",
          local: true,
          name: "Hero",
          level: 42,
          hp: 750,
          maxHp: 1000,
          mp: 300,
          maxMp: 600,
          xp: 2500,
          maxXp: 10000
        }
      ]
    };

    const model = buildHudModel(snapshot);

    expect(model.player?.role).toBe("Mage");
    expect(model.player?.level).toBe(42);
    expect(model.player?.hp?.ratio).toBe(0.75);
    expect(model.player?.mp?.ratio).toBe(0.5);
    expect(model.player?.xp?.ratio).toBe(0.25);
    expect(model.target).toBeNull();
  });

  it("builds a target frame only from the mirrored targeted entity", () => {
    const model = buildHudModel({
      tick: 1,
      map: "main",
      entities: [
        {
          id: "hero",
          kind: "player",
          x: 0,
          y: 0,
          texture: "hero",
          local: true
        },
        {
          id: "goo",
          kind: "monster",
          x: 10,
          y: 10,
          texture: "goo",
          appearanceKey: "monster:goo",
          targeted: true,
          name: "Goo",
          hp: 80,
          maxHp: 100
        }
      ]
    });

    expect(model.target?.name).toBe("Goo");
    expect(model.target?.meta).toBe("Goo");
    expect(model.target?.hp?.ratio).toBe(0.8);
  });
});
