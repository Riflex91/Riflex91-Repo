import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  LegacyCompatibilityRuntime,
  type LegacyCompatibilitySource
} from "../src/legacy/LegacyCompatibilityRuntime";

function source(calls: string[]): LegacyCompatibilitySource {
  const runner = {
    send_party_invite(name: string) {
      calls.push(`invite:${name}`);
      return "invite-ok";
    },
    send_party_request(name: string) {
      calls.push(`request:${name}`);
      return "request-ok";
    },
    leave_party() {
      calls.push("leave");
      return "leave-ok";
    }
  };

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
    code_active: true,
    document: {
      getElementById(id: string) {
        return id === "maincode"
          ? { contentWindow: runner }
          : null;
      },
      querySelectorAll() {
        return [];
      }
    } as unknown as Document
  };
}

describe("party actions", () => {
  it("delegates invite, request and leave to original CODE-runner functions", () => {
    const calls: string[] = [];
    const runtime = new LegacyCompatibilityRuntime().attach(source(calls));

    expect(runtime.dispatchPartyInvite(" Alice ")).toBe("invite-ok");
    expect(runtime.dispatchPartyRequest(" Bob ")).toBe("request-ok");
    expect(runtime.dispatchPartyLeave()).toBe("leave-ok");
    expect(calls).toEqual([
      "invite:Alice",
      "request:Bob",
      "leave"
    ]);
  });

  it("fails closed when the original CODE runner is inactive", () => {
    const runtime = new LegacyCompatibilityRuntime().attach({
      ...source([]),
      code_active: false
    });

    expect(() => runtime.dispatchPartyInvite("Alice")).toThrow(/CODE runner/);
    expect(() => runtime.dispatchPartyRequest("Alice")).toThrow(/CODE runner/);
    expect(() => runtime.dispatchPartyLeave()).toThrow(/CODE runner/);
  });

  it("wires party controls through compatibility actions without raw sockets", () => {
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
    const hud = readFileSync(resolve(process.cwd(), "src/ui/HudOverlay.ts"), "utf8");

    expect(main).toContain("dispatchPartyInvite");
    expect(main).toContain("dispatchPartyRequest");
    expect(main).toContain("dispatchPartyLeave");
    expect(hud).toContain('"party", "PARTY"');
    expect(hud).toContain("al25d-party-controls");
    expect(hud).not.toContain("socket.emit");
  });
});
