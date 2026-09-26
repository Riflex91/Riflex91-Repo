import { describe, expect, it } from "vitest";

import {
  dispatchLegacyEntityRightClick,
  type LegacyCompatibilitySource
} from "../src/legacy/LegacyCompatibilityRuntime";

describe("legacy right-click parity", () => {
  it("routes monster/player/NPC right clicks through the original handlers", () => {
    const calls: string[] = [];
    const source: LegacyCompatibilitySource = {
      width: 800,
      height: 600,
      scale: 1,
      character: {
        id: "Hero",
        real_x: 0,
        real_y: 0
      },
      entities: {
        goo: {
          id: "goo",
          type: "monster",
          mtype: "goo",
          real_x: 10,
          real_y: 20
        },
        friend: {
          id: "friend",
          type: "character",
          ctype: "mage",
          real_x: 20,
          real_y: 30
        },
        npc: {
          id: "npc",
          type: "character",
          npc: "basics",
          real_x: 30,
          real_y: 40
        }
      },
      G: {},
      monster_attack() {
        calls.push("attack:" + (this as { id: string }).id);
      },
      player_right_click() {
        calls.push("player:" + (this as { id: string }).id);
      },
      npc_right_click() {
        calls.push("npc:" + (this as { id: string }).id);
      }
    };

    dispatchLegacyEntityRightClick("goo", source);
    dispatchLegacyEntityRightClick("friend", source);
    dispatchLegacyEntityRightClick("npc", source);

    expect(calls).toEqual([
      "attack:goo",
      "player:friend",
      "npc:npc"
    ]);
  });
});
