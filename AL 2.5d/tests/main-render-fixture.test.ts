import { describe, expect, it } from "vitest";

import { LegacySnapshotAdapter } from "../src/legacy/LegacySnapshotAdapter";
import { mainLegacyFixture } from "./fixtures/mainLegacyState";

describe("main render fixture", () => {
  it("produces a deterministic immutable frame for renderer parity tests", () => {
    const adapter = new LegacySnapshotAdapter({
      classTypes: new Set(["warrior"]),
      monsterTypes: new Set(["goo"])
    });

    const frame = adapter.toSnapshot(mainLegacyFixture);

    expect(frame).toEqual({
      tick: 100,
      map: "main",
      entities: [
        {
          id: "Hero",
          kind: "player",
          x: 12,
          y: 24,
          z: undefined,
          texture: "asset://player/mwarrior",
          facing: 1
        },
        {
          id: "goo_1",
          kind: "monster",
          x: 90,
          y: 120,
          z: undefined,
          texture: "asset://monster/goo",
          facing: undefined
        },
        {
          id: "merchant_1",
          kind: "npc",
          x: -40,
          y: 15,
          z: undefined,
          texture: "asset://npc/standmerchant",
          facing: undefined
        }
      ]
    });
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.entities)).toBe(true);
  });
});
