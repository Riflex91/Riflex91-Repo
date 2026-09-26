import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  detectEntityMotion,
  hpAnimationTransition
} from "../src/render/Pixi25DRenderer";

describe("first-party entity animation states", () => {
  it("derives movement only from mirrored coordinate changes", () => {
    expect(detectEntityMotion({ x: 10, y: 20 }, { x: 10, y: 20 })).toBe(false);
    expect(detectEntityMotion({ x: 10, y: 20 }, { x: 10.1, y: 20.1 })).toBe(false);
    expect(detectEntityMotion({ x: 10, y: 20 }, { x: 12, y: 20 })).toBe(true);
  });

  it("derives hit/death/respawn only from authoritative HP transitions", () => {
    expect(hpAnimationTransition(100, 80)).toBe("hit");
    expect(hpAnimationTransition(10, 0)).toBe("death");
    expect(hpAnimationTransition(0, 100)).toBe("respawn");
    expect(hpAnimationTransition(80, 90)).toBeNull();
    expect(hpAnimationTransition(undefined, 90)).toBeNull();
  });

  it("wires attack/cast intent to renderer-only animation cues", () => {
    const renderer = readFileSync(
      resolve(process.cwd(), "src/render/Pixi25DRenderer.ts"),
      "utf8"
    );
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");

    expect(renderer).toContain("this.app.ticker.add(this.animateEntities)");
    expect(renderer).toContain('kind === "attack"');
    expect(renderer).toContain('kind === "cast"');
    expect(renderer).toContain('kind === "death"');
    expect(main).toContain('renderer.playEntityAction(local.id, "attack")');
    expect(main).toContain('renderer.playEntityAction(local.id, "cast")');
  });
});
