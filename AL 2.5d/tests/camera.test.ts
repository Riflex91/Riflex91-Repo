import { describe, expect, it } from "vitest";

import {
  viewportToWorld,
  worldToViewport
} from "../src/render/camera";

describe("2.5D camera mapping", () => {
  it("round-trips world coordinates through camera pan and zoom", () => {
    const camera = { x: 120, y: -45, zoom: 1.75 };
    const viewport = { width: 1920, height: 1080 };
    const world = { x: 345.25, y: -90.5, z: 12 };

    const pointer = worldToViewport(world, camera, viewport);
    const restored = viewportToWorld(
      pointer,
      camera,
      viewport,
      world.z
    );

    expect(restored.x).toBeCloseTo(world.x, 8);
    expect(restored.y).toBeCloseTo(world.y, 8);
    expect(restored.z).toBe(world.z);
  });

  it("rejects non-positive zoom", () => {
    expect(() =>
      viewportToWorld(
        { x: 10, y: 10 },
        { x: 0, y: 0, zoom: 0 },
        { width: 100, height: 100 }
      )
    ).toThrow(/zoom/i);
  });
});
