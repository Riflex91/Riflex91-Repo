import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("group-aware structure depth", () => {
  it("derives renderer-only elevation from immutable structure-group footprints", () => {
    const mirror = read("src/legacy/LegacyMirrorBridge.ts");
    const renderer = read("src/render/Pixi25DRenderer.ts");

    expect(mirror).toContain("inferStructureElevation");
    expect(mirror).toContain("decorative && !architectural");
    expect(mirror).toContain("shortSide <= 28 && longSide >= 120");
    expect(mirror).toContain("elevation");
    expect(renderer).toContain("surface.elevation ?? 10");
  });
});
