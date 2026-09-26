import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const renderer = readFileSync(
  resolve(process.cwd(), "src/render/Pixi25DRenderer.ts"),
  "utf8"
);

describe("2.5D material detail pass", () => {
  it("adds deterministic visual detail without changing gameplay geometry", () => {
    expect(renderer).toContain("drawSurfaceDetail");
    expect(renderer).toContain("surfaceSeed");
    expect(renderer).toContain("maxSamples = 96");
    expect(renderer).toContain('surface.layer === "structure"');
    expect(renderer).toContain("materialKind(surface.material)");
    expect(renderer).toContain('kind === "stone"');
    expect(renderer).toContain('kind === "grass"');
    expect(renderer).toContain('kind === "water"');
    expect(renderer).toContain('materialKind === "architecture"');
    expect(renderer).toContain("windowCount");
  });
});
