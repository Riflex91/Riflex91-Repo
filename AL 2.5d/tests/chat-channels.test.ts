import { describe, expect, it } from "vitest";

import {
  snapshotLegacyChatChannels,
  type LegacyGlobalsLike
} from "../src/legacy/LegacyMirrorBridge";

function node(text: string) {
  return { textContent: text };
}

function fakeDocument(): Document {
  const elements: Record<string, unknown> = {
    chatdparty: {
      children: [node("Alice: party hello"), node("Bob: ready")]
    },
    chattparty: {
      classList: { contains: (name: string) => name === "newmessage" }
    },
    chatdpmMagey: {
      children: [node("Magey: private hello")]
    },
    chattpmMagey: {
      classList: { contains: () => false }
    }
  };

  return {
    getElementById(id: string) {
      return (elements[id] as HTMLElement | undefined) ?? null;
    }
  } as unknown as Document;
}

describe("chat channels mirror", () => {
  it("mirrors main, party and PM channels without mutating original state", () => {
    const globals: LegacyGlobalsLike = Object.freeze({
      game_chats: Object.freeze([
        Object.freeze(["Server", "welcome", "#fff", "m1", 1])
      ]),
      party_list: Object.freeze(["Hero", "Alice"]),
      cwindows: Object.freeze(["party", "pmMagey"]),
      document: fakeDocument()
    });

    const channels = snapshotLegacyChatChannels(globals);

    expect(channels.map((channel) => channel.id)).toEqual([
      "main",
      "party",
      "pm:Magey"
    ]);
    expect(channels[0]?.messages[0]).toMatchObject({
      owner: "Server",
      message: "welcome"
    });
    expect(channels[1]).toMatchObject({
      kind: "party",
      unread: true
    });
    expect(channels[1]?.messages[0]).toEqual({
      owner: "Alice",
      message: "party hello"
    });
    expect(channels[2]).toMatchObject({
      kind: "pm",
      peer: "Magey",
      unread: false
    });
    expect(channels[2]?.messages[0]).toEqual({
      owner: "Magey",
      message: "private hello"
    });
    expect(Object.isFrozen(channels)).toBe(true);
  });
});
