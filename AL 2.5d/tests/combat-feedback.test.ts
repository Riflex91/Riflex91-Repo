import { describe, expect, it } from "vitest";

import { diffEntityHitPoints } from "../src/ui/CombatFeedbackOverlay";
import type { GameFrameSnapshot } from "../src/render/RenderBridge";

function frame(hp: number): GameFrameSnapshot {
  return {
    tick: hp,
    map: "main",
    entities: [
      {
        id: "goo",
        kind: "monster",
        x: 10,
        y: 20,
        texture: "asset://monster/goo",
        hp,
        maxHp: 100
      }
    ]
  };
}

describe("combat feedback", () => {
  it("does not invent damage on the first mirrored frame", () => {
    const diff = diffEntityHitPoints(new Map(), frame(100));
    expect(diff.events).toEqual([]);
    expect(diff.nextHp.get("goo")).toBe(100);
  });

  it("derives damage and healing only from mirrored HP deltas", () => {
    const damaged = diffEntityHitPoints(new Map([["goo", 100]]), frame(73));
    expect(damaged.events).toEqual([
      { entityId: "goo", kind: "damage", amount: 27 }
    ]);

    const healed = diffEntityHitPoints(damaged.nextHp, frame(90));
    expect(healed.events).toEqual([
      { entityId: "goo", kind: "heal", amount: 17 }
    ]);
  });

  it("adds death feedback without replacing the authoritative HP value", () => {
    const diff = diffEntityHitPoints(new Map([["goo", 20]]), frame(0));
    expect(diff.events).toEqual([
      { entityId: "goo", kind: "damage", amount: 20 },
      { entityId: "goo", kind: "death" }
    ]);
    expect(diff.nextHp.get("goo")).toBe(0);
  });

  it("derives respawn feedback only from the authoritative HP transition", () => {
    const diff = diffEntityHitPoints(new Map([["goo", 0]]), frame(100));
    expect(diff.events).toEqual([
      { entityId: "goo", kind: "heal", amount: 100 },
      { entityId: "goo", kind: "respawn" }
    ]);
    expect(diff.nextHp.get("goo")).toBe(100);
  });
});
