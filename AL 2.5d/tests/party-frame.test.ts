import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { snapshotLegacyParty } from "../src/legacy/LegacyMirrorBridge";

describe("read-only party frame snapshot", () => {
  it("copies party members and enriches visible members without mutating legacy state", () => {
    const globals = Object.freeze({
      current_map: "main",
      party_list: Object.freeze(["Hero", "Magey", "Far"]),
      party: Object.freeze({
        Hero: Object.freeze({
          type: "warrior",
          hp: 900,
          max_hp: 1000,
          mp: 220,
          max_mp: 300,
          map: "main",
          x: 0,
          y: 0
        }),
        Magey: Object.freeze({
          type: "mage",
          map: "main",
          x: 30,
          y: 40
        }),
        Far: Object.freeze({
          type: "priest",
          hp: 500,
          max_hp: 700,
          map: "cave",
          x: 999,
          y: 999
        })
      }),
      character: Object.freeze({
        id: "Hero",
        name: "Hero",
        ctype: "warrior",
        real_x: 0,
        real_y: 0,
        map: "main"
      }),
      entities: Object.freeze({
        mageEntity: Object.freeze({
          id: "mageEntity",
          name: "Magey",
          type: "character",
          ctype: "mage",
          hp: 350,
          max_hp: 400,
          mp: 700,
          max_mp: 800,
          level: 42,
          real_x: 30,
          real_y: 40,
          map: "main"
        })
      })
    });

    const before = JSON.stringify(globals);
    const party = snapshotLegacyParty(globals, globals.character, "main");

    expect(JSON.stringify(globals)).toBe(before);
    expect(party).toHaveLength(3);
    expect(party[0]).toMatchObject({
      name: "Hero",
      role: "warrior",
      local: true,
      sameMap: true
    });
    expect(party[1]).toMatchObject({
      name: "Magey",
      role: "mage",
      hp: 350,
      maxHp: 400,
      level: 42,
      sameMap: true,
      distance: 50
    });
    expect(party[2]).toMatchObject({
      name: "Far",
      role: "priest",
      map: "cave",
      sameMap: false
    });
    expect(Object.isFrozen(party)).toBe(true);
    expect(Object.isFrozen(party[1])).toBe(true);
  });

  it("ships a first-party party frame in the 2.5D HUD", () => {
    const hud = readFileSync(resolve(process.cwd(), "src/ui/HudOverlay.ts"), "utf8");
    const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(hud).toContain('id = "al25d-party-frame"');
    expect(hud).toContain("renderParty(snapshot.party ?? [])");
    expect(style).toContain("#al25d-party-frame");
    expect(style).toContain(".al25d-party-bars");
  });
});
