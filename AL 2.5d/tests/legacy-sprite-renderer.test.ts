import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const renderer = readFileSync(
  resolve(process.cwd(), "src/render/Pixi25DRenderer.ts"),
  "utf8"
);

describe("legacy sprite rendering", () => {
  it("uses live legacy sprite crops before procedural fallbacks", () => {
    expect(renderer).toContain("legacySpriteTextureCache");
    expect(renderer).toContain("loadLegacySprite");
    expect(renderer).toContain("frame.sourceX");
    expect(renderer).toContain("context.imageSmoothingEnabled = false");
    expect(renderer).toContain("visual.fallback.visible = false");
  });
});
