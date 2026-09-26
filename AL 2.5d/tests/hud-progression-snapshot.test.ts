import { describe, expect, it } from "vitest";

import { LegacySnapshotAdapter } from "../src/legacy/LegacySnapshotAdapter";

describe("HUD progression snapshot fields", () => {
  it("copies level/xp/max_xp into immutable renderer fields", () => {
    const adapter = new LegacySnapshotAdapter();
    const source = {
      tick: 1,
      map: "main",
      character: {
        id: "hero",
        x: 0,
        y: 0,
        ctype: "warrior",
        level: 12,
        xp: 1250,
        max_xp: 5000
      }
    };

    const snapshot = adapter.toSnapshot(source);

    expect(snapshot.entities[0]?.level).toBe(12);
    expect(snapshot.entities[0]?.xp).toBe(1250);
    expect(snapshot.entities[0]?.maxXp).toBe(5000);
    expect(source.character.xp).toBe(1250);
  });
});
