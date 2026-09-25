import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("2.5D structure occlusion", () => {
  it("interleaves structures with entities in projected world depth", () => {
    const renderer = read("src/render/Pixi25DRenderer.ts");

    expect(renderer).toContain("private readonly structureVisuals");
    expect(renderer).toContain("structureVisual.zIndex = this.structureDepth(surface)");
    expect(renderer).toContain("this.world.addChild(structureVisual)");
    expect(renderer).toContain("visual.container.zIndex = projected.y");
    expect(renderer).toContain("!layer.parent");
  });

  it("keeps vegetation and narrow decoration groups flat", () => {
    const mirror = read("src/legacy/LegacyMirrorBridge.ts");

    expect(mirror).toContain("if (decorative && !architectural) return 0");
    expect(mirror).toContain("if (shortSide <= 28 && longSide >= 120) return 0");
  });
});
