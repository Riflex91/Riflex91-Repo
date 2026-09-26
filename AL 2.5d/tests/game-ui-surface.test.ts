import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const overlay = readFileSync(
  resolve(process.cwd(), "src/ui/HudOverlay.ts"),
  "utf8"
);
const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

describe("first-party gameplay UI", () => {
  it("ships menu panels and a clickable hotbar in the 2.5D layer", () => {
    expect(overlay).toContain('"character", "CHAR"');\n    expect(overlay).toContain('"inventory", "BAG"');
    expect(overlay).toContain('"equipment", "GEAR"');
    expect(overlay).toContain('"skills", "SKILLS"');
    expect(overlay).toContain("al25d-hotbar-slot");
    expect(overlay).toContain("this.actions.onHotbar");
    expect(style).toContain("#al25d-menu");
    expect(style).toContain("#al25d-panel");
    expect(style).toContain("#al25d-hotbar");\n    expect(style).toContain(".al25d-character-shell");
  });
});
