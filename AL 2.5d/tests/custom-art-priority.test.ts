import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const renderer = readFileSync(
  resolve(process.cwd(), "src/render/Pixi25DRenderer.ts"),
  "utf8"
);

describe("custom art priority", () => {
  it("uses authored player art before the live legacy sprite fallback", () => {
    const customIndex = renderer.indexOf("if (customArt)");
    const legacyIndex = renderer.indexOf("else if (entity.legacySprite)");

    expect(customIndex).toBeGreaterThan(-1);
    expect(legacyIndex).toBeGreaterThan(customIndex);
    expect(renderer).toContain("entityVisualMetrics");
  });
});
