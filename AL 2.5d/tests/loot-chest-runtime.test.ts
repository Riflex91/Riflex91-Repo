import { describe, expect, it } from "vitest";

import {
  LegacyCompatibilityRuntime,
  type LegacyCompatibilitySource
} from "../src/legacy/LegacyCompatibilityRuntime";

function baseSource(calls: string[]): LegacyCompatibilitySource {
  return {
    current_map: "main",
    character: {
      id: "Hero",
      real_x: 0,
      real_y: 0
    },
    entities: {},
    G: {},
    open_chest(id: string) {
      calls.push(id);
      return "opened";
    },
    document: {
      querySelectorAll() {
        return [];
      }
    } as unknown as Document
  };
}

describe("original chest open path", () => {
  it("delegates chest clicks to original open_chest()", () => {
    const calls: string[] = [];
    const runtime = new LegacyCompatibilityRuntime().attach(baseSource(calls));

    expect(runtime.dispatchChestOpen(" chestA ")).toBe("opened");
    expect(calls).toEqual(["chestA"]);
  });

  it("fails closed when open_chest is unavailable", () => {
    const source = baseSource([]);
    const runtime = new LegacyCompatibilityRuntime().attach({
      ...source,
      open_chest: undefined
    });

    expect(() => runtime.dispatchChestOpen("chestA")).toThrow(/open_chest/);
  });
});
