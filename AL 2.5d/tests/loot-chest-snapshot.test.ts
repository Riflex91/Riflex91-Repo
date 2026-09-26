import { describe, expect, it } from "vitest";

import {
  snapshotLegacyLootChests,
  type LegacyGlobalsLike
} from "../src/legacy/LegacyMirrorBridge";

describe("loot chest snapshot", () => {
  it("copies only current-map chest presentation fields without mutation", () => {
    const globals: LegacyGlobalsLike = Object.freeze({
      chests: Object.freeze({
        chestA: Object.freeze({
          id: "chestA",
          x: 120,
          y: 240,
          map: "main",
          items: 3,
          openning: Object.freeze({})
        }),
        chestB: Object.freeze({
          id: "chestB",
          x: 900,
          y: 910,
          map: "cave",
          items: 1
        })
      })
    });

    const before = JSON.stringify(globals);
    const chests = snapshotLegacyLootChests(globals, "main");

    expect(JSON.stringify(globals)).toBe(before);
    expect(chests).toEqual([
      {
        id: "chestA",
        x: 120,
        y: 240,
        map: "main",
        items: 3,
        opening: true
      }
    ]);
    expect(Object.isFrozen(chests)).toBe(true);
    expect(Object.isFrozen(chests[0])).toBe(true);
  });
});
