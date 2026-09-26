import { describe, expect, it } from "vitest";

import {
  projectScreenToWorld,
  projectWorldToScreen
} from "../src/render/projection";

describe("2.5D projection", () => {
  it("round-trips authoritative Adventure Land world coordinates", () => {
    const source = { x: 431.25, y: -177.5, z: 18 };
    const screen = projectWorldToScreen(source);
    const restored = projectScreenToWorld(screen, source.z);

    expect(restored.x).toBeCloseTo(source.x, 8);
    expect(restored.y).toBeCloseTo(source.y, 8);
    expect(restored.z).toBe(source.z);
  });

  it("does not require elevation for ordinary gameplay entities", () => {
    const source = { x: -120, y: 80 };
    const screen = projectWorldToScreen(source);
    const restored = projectScreenToWorld(screen);

    expect(restored.x).toBeCloseTo(source.x, 8);
    expect(restored.y).toBeCloseTo(source.y, 8);
  });
});
