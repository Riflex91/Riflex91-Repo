import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("item detail surface", () => {
  it("renders immutable item definition details without calculating gameplay stats", () => {
    const mirror = readFileSync(
      resolve(process.cwd(), "src/legacy/LegacyMirrorBridge.ts"),
      "utf8"
    );
    const hud = readFileSync(
      resolve(process.cwd(), "src/ui/HudOverlay.ts"),
      "utf8"
    );
    const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(mirror).toContain("itemDetailsSnapshot");
    expect(mirror).toContain("ITEM_STAT_LABELS");
    expect(mirror).toContain('source: "definition" as const');
    expect(hud).toContain("appendItemDetails(copy, selected.details)");
    expect(hud).toContain('heading.textContent = "Definition stats"');
    expect(style).toContain(".al25d-item-stat-grid");
  });
});
