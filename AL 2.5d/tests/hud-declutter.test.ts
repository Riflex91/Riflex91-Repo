import { describe, expect, it } from "vitest";

import { resolveHudVisibility } from "../src/render/hudLayout";

describe("HUD decluttering", () => {
  it("keeps the higher-priority label when two labels overlap", () => {
    const visible = resolveHudVisibility([
      { id: "npc", x: 0, y: 0, width: 60, height: 14, priority: 50 },
      { id: "player", x: 10, y: 0, width: 60, height: 14, priority: 70 }
    ]);

    expect([...visible]).toEqual(["player"]);
  });

  it("keeps local/target labels even inside a dense overlap", () => {
    const visible = resolveHudVisibility([
      {
        id: "target",
        x: 0,
        y: 0,
        width: 60,
        height: 14,
        priority: 100,
        always: true
      },
      {
        id: "local",
        x: 2,
        y: 1,
        width: 60,
        height: 14,
        priority: 90,
        always: true
      },
      { id: "npc", x: 4, y: 2, width: 60, height: 14, priority: 50 }
    ]);

    expect(visible.has("target")).toBe(true);
    expect(visible.has("local")).toBe(true);
    expect(visible.has("npc")).toBe(false);
  });

  it("retains non-overlapping labels", () => {
    const visible = resolveHudVisibility([
      { id: "a", x: 0, y: 0, width: 40, height: 12, priority: 50 },
      { id: "b", x: 100, y: 100, width: 40, height: 12, priority: 50 }
    ]);

    expect([...visible].sort()).toEqual(["a", "b"]);
  });
});
