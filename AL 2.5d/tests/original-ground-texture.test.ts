import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const renderer = readFileSync(
  resolve(process.cwd(), "src/render/Pixi25DRenderer.ts"),
  "utf8"
);

describe("original ground texture projection", () => {
  it("projects immutable tileset crops through an offscreen isometric raster", () => {
    expect(renderer).toContain("addTexturedMapSurface");
    expect(renderer).toContain("createGroundTexture");
    expect(renderer).toContain("flatContext.drawImage");
    expect(renderer).toContain("isoContext.setTransform");
    expect(renderer).toContain("Texture.from(iso)");
  });
});
