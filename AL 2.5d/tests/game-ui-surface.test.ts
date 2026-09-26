import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const overlay = readFileSync(
  resolve(process.cwd(), "src/ui/HudOverlay.ts"),
  "utf8"
);
const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

describe("first-party gameplay UI", () => {
  it("ships unified character, inventory and skills surfaces plus a clickable hotbar", () => {
    expect(overlay).toContain('"character", "CHAR"');
    expect(overlay).toContain('"inventory", "BAG"');
    expect(overlay).toContain('"skills", "SKILLS"');
    expect(overlay).toContain("al25d-character-shell");
    expect(overlay).toContain("al25d-hotbar-slot");
    expect(overlay).toContain("this.actions.onHotbar");
    expect(style).toContain("#al25d-menu");
    expect(style).toContain("#al25d-panel");
    expect(style).toContain("#al25d-hotbar");
    expect(style).toContain(".al25d-character-shell");
  });
});
