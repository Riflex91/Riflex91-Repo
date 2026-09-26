import { describe, expect, it } from "vitest";

import {
  dispatchLegacyMapClick,
  mapPointerToLegacyWorld
} from "../src/legacy/LegacyInputBridge";
import { worldToViewport } from "../src/render/camera";

describe("LegacyInputBridge", () => {
  it("feeds original Adventure Land world coordinates back to map click logic", () => {
    const camera = { x: 25, y: 10, zoom: 1.4 };
    const viewport = { width: 1440, height: 900 };
    const target = { x: -321.5, y: 88.25, z: 0 };
    const pointer = worldToViewport(target, camera, viewport);

    const world = mapPointerToLegacyWorld(pointer, {
      camera,
      viewport
    });

    expect(world.x).toBeCloseTo(target.x, 8);
    expect(world.y).toBeCloseTo(target.y, 8);
  });

  it("preserves the legacy callback return value", () => {
    let calledWith: [number, number] | null = null;
    const handler = (x: number, y: number): boolean => {
      calledWith = [x, y];
      return true;
    };

    const camera = { x: 0, y: 0, zoom: 1 };
    const viewport = { width: 800, height: 600 };
    const target = { x: 40, y: 70 };
    const pointer = worldToViewport(target, camera, viewport);

    const cancelled = dispatchLegacyMapClick(
      pointer,
      { camera, viewport },
      handler
    );

    expect(cancelled).toBe(true);
    expect(calledWith).not.toBeNull();
    expect(calledWith![0]).toBeCloseTo(target.x, 8);
    expect(calledWith![1]).toBeCloseTo(target.y, 8);
  });
});
