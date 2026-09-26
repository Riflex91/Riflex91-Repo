import { describe, expect, it } from "vitest";

import {
  LegacyCompatibilityRuntime,
  type LegacyCompatibilitySource
} from "../src/legacy/LegacyCompatibilityRuntime";

function source(calls: string[]): LegacyCompatibilitySource {
  return {
    current_map: "main",
    character: {
      id: "Hero",
      name: "Hero",
      real_x: 0,
      real_y: 0
    },
    entities: {},
    G: {},
    document: {
      querySelectorAll() {
        return [];
      }
    } as unknown as Document,
    say(message: string) {
      calls.push(`main:${message}`);
      return "main-ok";
    },
    party_say(message: string) {
      calls.push(`party:${message}`);
      return "party-ok";
    },
    private_say(name: string, message: string) {
      calls.push(`pm:${name}:${message}`);
      return "pm-ok";
    }
  };
}

describe("original chat send paths", () => {
  it("delegates all send modes to original Adventure Land functions", () => {
    const calls: string[] = [];
    const runtime = new LegacyCompatibilityRuntime().attach(source(calls));

    expect(runtime.dispatchChatMessage({
      kind: "main",
      message: " hello "
    })).toBe("main-ok");
    expect(runtime.dispatchChatMessage({
      kind: "party",
      message: " group "
    })).toBe("party-ok");
    expect(runtime.dispatchChatMessage({
      kind: "pm",
      peer: "Magey",
      message: " private "
    })).toBe("pm-ok");

    expect(calls).toEqual([
      "main:hello",
      "party:group",
      "pm:Magey:private"
    ]);
  });

  it("fails closed instead of inventing a socket fallback", () => {
    const runtime = new LegacyCompatibilityRuntime().attach({
      ...source([]),
      say: undefined,
      party_say: undefined,
      private_say: undefined
    });

    expect(() => runtime.dispatchChatMessage({
      kind: "main",
      message: "hello"
    })).toThrow(/say\(\)/);
    expect(() => runtime.dispatchChatMessage({
      kind: "party",
      message: "hello"
    })).toThrow(/party_say/);
    expect(() => runtime.dispatchChatMessage({
      kind: "pm",
      message: "hello",
      peer: "Magey"
    })).toThrow(/private_say/);
  });
});
