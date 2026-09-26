import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { classifySkillVisual } from "../src/legacy/LegacyMirrorBridge";

describe("skill visual categories", () => {
  it("classifies only from original action/skill metadata", () => {
    expect(classifySkillVisual("attack", undefined)).toBe("offense");
    expect(classifySkillVisual("use_hp", undefined)).toBe("support");
    expect(classifySkillVisual("zap", {
      hostile: true,
      damage_type: "magical",
      damage: 200
    })).toBe("offense");
    expect(classifySkillVisual("selfheal", {
      explanation: "Heal yourself."
    })).toBe("support");
    expect(classifySkillVisual("mshield", {
      condition: "mshield"
    })).toBe("defense");
    expect(classifySkillVisual("blink", {
      explanation: "Teleport to a nearby location."
    })).toBe("mobility");
    expect(classifySkillVisual("merchant_task", {
      explanation: "Perform a utility action."
    })).toBe("utility");
  });

  it("wires the visual kind through hotbar, HUD and action flare only", () => {
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
    const hud = readFileSync(resolve(process.cwd(), "src/ui/HudOverlay.ts"), "utf8");
    const combat = readFileSync(
      resolve(process.cwd(), "src/ui/CombatFeedbackOverlay.ts"),
      "utf8"
    );
    const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(main).toContain("hotbarEntry?.visualKind");
    expect(hud).toContain("button.dataset.visualKind = entry.visualKind");
    expect(hud).toContain("row.dataset.visualKind = skill.visualKind");
    expect(combat).toContain("flare.dataset.kind = visualKind");
    expect(style).toContain('.al25d-action-flare[data-kind="offense"]');
    expect(style).toContain('.al25d-action-flare[data-kind="support"]');
  });
});
