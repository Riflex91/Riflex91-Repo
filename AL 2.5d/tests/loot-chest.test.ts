import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { snapshotLegacyChests } from "../src/legacy/LegacyMirrorBridge";
import {
  LegacyCompatibilityRuntime,
  type LegacyCompatibilitySource
} from "../src/legacy/LegacyCompatibilityRuntime";

describe("loot chest bridge", () => {
  it("mirrors current-map chests as immutable first-party props", () => {
    const globals = Object.freeze({
      chests: Object.freeze({
        a: Object.freeze({
          id: "a",
          x: 15,
          y: 22,
          items: 2,
          map: "main",
          alpha: 0.8
        }),
        b: Object.freeze({
          id: "b",
          x: 90,
          y: 91,
          items: 1,
          map: "cave"
        })
      })
    });

    const before = JSON.stringify(globals);
    const chests = snapshotLegacyChests(globals, "main");

    expect(JSON.stringify(globals)).toBe(before);
    expect(chests).toEqual([
      {
        id: "chest:a",
        kind: "prop",
        x: 15,
        y: 22,
        texture: "custom://prop/chest",
        appearanceKey: "prop:chest",
        interaction: {
          kind: "loot-chest",
          id: "a"
        },
        name: "Loot Chest · 2 items",
        alpha: 0.8
      }
    ]);
    expect(Object.isFrozen(chests)).toBe(true);
    expect(Object.isFrozen(chests[0])).toBe(true);
  });

  it("routes chest interaction through the original open_chest function", () => {
    const calls: string[] = [];
    const source: LegacyCompatibilitySource = {
      current_map: "main",
      character: {
        id: "Hero",
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
      open_chest(id: string) {
        calls.push(id);
        return "open-ok";
      }
    };

    const runtime = new LegacyCompatibilityRuntime().attach(source);
    expect(runtime.dispatchChestLoot("abc")).toBe("open-ok");
    expect(calls).toEqual(["abc"]);
  });

  it("keeps chest input distinct from legacy entity clicks", () => {
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");

    expect(main).toContain('entity.interaction?.kind === "loot-chest"');
    expect(main).toContain("legacyRuntime.dispatchChestLoot");
    expect(main).not.toContain('socket.emit("open_chest"');
  });
});
