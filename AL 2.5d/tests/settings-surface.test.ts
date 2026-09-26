import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const hud = readFileSync(resolve(process.cwd(), "src/ui/HudOverlay.ts"), "utf8");
const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");
const combat = readFileSync(
  resolve(process.cwd(), "src/ui/CombatFeedbackOverlay.ts"),
  "utf8"
);
const minimap = readFileSync(
  resolve(process.cwd(), "src/ui/MinimapOverlay.ts"),
  "utf8"
);

describe("presentation settings surface", () => {
  it("keeps presentation controls inside the 2.5D layer", () => {
    expect(hud).toContain('"settings", "SET"');
    expect(hud).toContain("onToggleMinimap");
    expect(hud).toContain("onToggleCombatVfx");
    expect(hud).toContain("onCameraZoom");
    expect(hud).toContain("onResetView");
    expect(main).toContain('al25d.minimapVisible');
    expect(main).toContain('al25d.combatVfxVisible');
    expect(main).toContain("setPresentationSettings");
    expect(combat).toContain("setEnabled(enabled: boolean)");
    expect(minimap).toContain("setEnabled(enabled: boolean)");
    expect(style).toContain(".al25d-settings-row");
  });
});
