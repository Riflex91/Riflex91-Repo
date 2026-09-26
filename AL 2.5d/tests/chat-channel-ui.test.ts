import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("multi-channel first-party chat UI", () => {
  it("uses channel tabs and the compatibility runtime send dispatcher", () => {
    const hud = readFileSync(resolve(process.cwd(), "src/ui/HudOverlay.ts"), "utf8");
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
    const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(hud).toContain("al25d-chat-channels");
    expect(hud).toContain('newPm.textContent = "+ PM"');
    expect(hud).toContain("this.actions.onChatSend");
    expect(hud).toContain("message.textContent = entry.message");
    expect(hud).not.toContain("socket.emit");
    expect(main).toContain("legacyRuntime.dispatchChatMessage(request)");
    expect(style).toContain(".al25d-chat-composer");
  });
});
