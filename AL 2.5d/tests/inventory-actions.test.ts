import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  LegacyCompatibilityRuntime,
  type LegacyCompatibilitySource
} from "../src/legacy/LegacyCompatibilityRuntime";

function interactiveSource(calls: string[]): LegacyCompatibilitySource {
  const runner = {
    equip(index: number) {
      calls.push(`equip:${index}`);
      return "equip-ok";
    },
    unequip(slot: string) {
      calls.push(`unequip:${slot}`);
      return "unequip-ok";
    },
    swap(a: number, b: number) {
      calls.push(`swap:${a}:${b}`);
      return "swap-ok";
    }
  };

  return {
    current_map: "main",
    character: {
      id: "Hero",
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
      }
    } as unknown as Document
  };
}

describe("first-party inventory actions", () => {
  it("delegates equip, unequip and swap to the original CODE runner functions", () => {
    const calls: string[] = [];
    const runtime = new LegacyCompatibilityRuntime().attach(
      interactiveSource(calls)
    );

    expect(runtime.dispatchInventoryEquip(3)).toBe("equip-ok");
    expect(runtime.dispatchEquipmentUnequip("mainhand")).toBe("unequip-ok");
    expect(runtime.dispatchInventorySwap(2, 8)).toBe("swap-ok");
    expect(calls).toEqual([
      "equip:3",
      "unequip:mainhand",
      "swap:2:8"
    ]);
  });

  it("fails closed when the original CODE runner is inactive", () => {
    const source = interactiveSource([]);
    const runtime = new LegacyCompatibilityRuntime().attach({
      ...source,
      code_active: false
    });

    expect(() => runtime.dispatchInventoryEquip(0)).toThrow(/CODE runner/);
    expect(() => runtime.dispatchInventorySwap(0, 1)).toThrow(/CODE runner/);
    expect(() => runtime.dispatchEquipmentUnequip("helmet")).toThrow(/CODE runner/);
  });

  it("keeps the new UI wired to compatibility methods instead of raw sockets", () => {
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
    const hud = readFileSync(resolve(process.cwd(), "src/ui/HudOverlay.ts"), "utf8");

    expect(main).toContain("dispatchInventoryEquip");
    expect(main).toContain("dispatchInventorySwap");
    expect(main).toContain("dispatchEquipmentUnequip");
    expect(hud).toContain("application/x-al25d-inventory-index");
    expect(hud).toContain("al25d-item-inspector");
    expect(hud).not.toContain("socket.emit");
  });
});
