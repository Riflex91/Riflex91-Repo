import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("accessibility presentation settings", () => {
  it("persists reduced motion and high contrast without changing gameplay state", () => {
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
    const hud = readFileSync(resolve(process.cwd(), "src/ui/HudOverlay.ts"), "utf8");
    const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(main).toContain('window.localStorage.getItem("al25d.reducedMotion")');
    expect(main).toContain('window.localStorage.getItem("al25d.highContrast")');
    expect(main).toContain('"al25d-reduced-motion"');
    expect(main).toContain('"al25d-high-contrast"');
    expect(hud).toContain('"Reduced Motion"');
    expect(hud).toContain('"High Contrast"');
    expect(style).toContain("html.al25d-reduced-motion");
    expect(style).toContain("html.al25d-high-contrast");
  });
});
