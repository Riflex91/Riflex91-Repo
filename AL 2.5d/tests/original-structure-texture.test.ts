import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const renderer = readFileSync(
  resolve(process.cwd(), "src/render/Pixi25DRenderer.ts"),
  "utf8"
);

describe("textured structure projection", () => {
  it("projects original structure tiles at the renderer-only extrusion height", () => {
    expect(renderer).toContain("addTexturedMapSurface");
    expect(renderer).toContain("surfaceHeight(surface)");
    expect(renderer).toContain("origin.y - elevation");
    expect(renderer).toContain('surface.layer === "structure" ? 0.98 : 0.9');
    expect(renderer).toContain("this.world.addChild(structureVisual)");
  });
});
