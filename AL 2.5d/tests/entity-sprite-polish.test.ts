import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("entity sprite presentation polish", () => {
  it("grounds legacy sprites with contact shadows and sprite-aware HUD offsets", () => {
    const renderer = read("src/render/Pixi25DRenderer.ts");

    expect(renderer).toContain("drawEntityShadow");
    expect(renderer).toContain("entity.legacySprite?.height");
    expect(renderer).toContain("hpBarY = -spriteHeight - 12");
    expect(renderer).toContain("visual.label.y = showHp");
    expect(renderer).toContain("container.addChild(shadow)");
  });

  it("uses the tighter local-play camera framing", () => {
    const main = read("src/main.ts");
    const renderer = read("src/render/Pixi25DRenderer.ts");

    expect(main).toContain(": 1.5");
    expect(renderer).toContain("zoom: 1.5");
  });
});
