import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { snapshotLegacyChat } from "../src/legacy/LegacyMirrorBridge";

describe("read-only chat surface", () => {
  it("copies the original game_chats history without interpreting HTML", () => {
    const globals = Object.freeze({
      game_chats: Object.freeze([
        Object.freeze(["Alice", "hello", "#ffffff", "a", 1]),
        Object.freeze(["^", "<b>server</b>", "#44aa88", "b", 3]),
        Object.freeze(["Bob", "last message", null, 7, 1])
      ])
    });

    const before = JSON.stringify(globals);
    const chat = snapshotLegacyChat(globals, 2);

    expect(JSON.stringify(globals)).toBe(before);
    expect(chat).toEqual([
      {
        owner: "^",
        message: "<b>server</b>",
        color: "#44aa88",
        id: "b",
        repeat: 3
      },
      {
        owner: "Bob",
        message: "last message",
        id: 7
      }
    ]);
    expect(Object.isFrozen(chat)).toBe(true);
    expect(Object.isFrozen(chat[0])).toBe(true);
  });

  it("renders chat through textContent in the first-party HUD", () => {
    const hud = readFileSync(resolve(process.cwd(), "src/ui/HudOverlay.ts"), "utf8");
    const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(hud).toContain('"chat", "CHAT"');
    expect(hud).toContain("message.textContent = entry.message");
    expect(hud).toContain("renderChat(this.latestChatChannels)");
    expect(style).toContain(".al25d-chat-list");
    expect(style).toContain(".al25d-chat-entry");
  });
});
