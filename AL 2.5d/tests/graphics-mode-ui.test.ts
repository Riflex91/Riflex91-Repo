import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("graphics mode UI integration", () => {
  it("docks the 2.5D/original toggle beside the legacy top-right X control", () => {
    const toggle = read("src/ui/GraphicsModeToggle.ts");
    const runtime = read("src/legacy/LegacyCompatibilityRuntime.ts");
    const main = read("src/main.ts");

    expect(toggle).toContain('querySelector("#toprightcorner")');
    expect(toggle).toContain('textContent?.trim().toUpperCase() === "X"');
    expect(toggle).toContain("rect.left - size - DOCK_GAP");
    expect(runtime).toContain("getLegacyDocument(): Document | null");
    expect(main).toContain(
      "graphicsToggle.dockToLegacyUi(runtime.getLegacyDocument())"
    );
  });

  it("keeps the toggle in the parent overlay so it remains usable in 2.5D mode", () => {
    const toggle = read("src/ui/GraphicsModeToggle.ts");

    expect(toggle).toContain("owner.appendChild(this.button)");
    expect(toggle).not.toContain("legacyDocument.body.appendChild(this.button)");
  });
});
