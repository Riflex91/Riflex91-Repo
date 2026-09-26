import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  normalizeMinimapPoint,
  resolveMinimapBounds
} from "../src/ui/MinimapOverlay";
import type { GameFrameSnapshot, RenderMapBounds } from "../src/render/RenderBridge";

describe("first-party minimap", () => {
  it("normalizes authoritative world coordinates into the minimap viewport", () => {
    const bounds: RenderMapBounds = {
      minX: -100,
      minY: -50,
      maxX: 300,
      maxY: 150
    };

    expect(normalizeMinimapPoint(bounds, 100, 50)).toEqual({
      x: 0.5,
      y: 0.5
    });
    expect(normalizeMinimapPoint(bounds, 999, -999)).toEqual({
      x: 1,
      y: 0
    });
  });

  it("prefers copied map bounds and otherwise falls back around the local player", () => {
    const withBounds = {
      tick: 1,
      map: "main",
      mapState: {
        id: "main",
        metadata: {},
        geometry: {
          available: true,
          tiles: 0,
          placements: 0,
          groups: 0,
          animations: 0,
          xLines: 0,
          yLines: 0,
          bounds: { minX: 1, minY: 2, maxX: 101, maxY: 202 },
          collisionXLines: [],
          collisionYLines: [],
          surfaces: []
        }
      },
      entities: []
    } satisfies GameFrameSnapshot;

    expect(resolveMinimapBounds(withBounds)).toEqual({
      minX: 1,
      minY: 2,
      maxX: 101,
      maxY: 202
    });

    const fallback = resolveMinimapBounds({
      tick: 2,
      map: "main",
      entities: [
        {
          id: "hero",
          kind: "player",
          x: 20,
          y: 30,
          texture: "asset://player/warrior",
          local: true
        }
      ]
    });
    expect(fallback.minX).toBeLessThan(20);
    expect(fallback.maxX).toBeGreaterThan(20);
    expect(fallback.minY).toBeLessThan(30);
    expect(fallback.maxY).toBeGreaterThan(30);
  });

  it("is wired into the 2.5D presentation layer only", () => {
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
    const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(main).toContain('new MinimapOverlay(document.body)');
    expect(main).toContain("minimap.render(snapshot)");
    expect(main).toContain("minimap.setMode");
    expect(style).toContain("#al25d-minimap");
  });
});
