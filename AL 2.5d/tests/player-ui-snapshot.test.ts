import { describe, expect, it } from "vitest";

import { LegacyMirrorBridge } from "../src/legacy/LegacyMirrorBridge";
import type {
  CameraState,
  GameFrameSnapshot,
  RenderBridge
} from "../src/render/RenderBridge";

class FakeRenderer implements RenderBridge {
  frame: GameFrameSnapshot | null = null;
  async mount(_host: HTMLElement): Promise<void> {}
  renderFrame(snapshot: GameFrameSnapshot): void {
    this.frame = snapshot;
  }
  setCamera(_camera: CameraState): void {}
  destroy(): void {}
}

describe("player UI snapshot", () => {
  it("mirrors inventory, equipment and live skillbar/keymap without mutation", () => {
    const renderer = new FakeRenderer();
    const globals = {
      current_map: "main",
      character: {
        id: "Hero",
        ctype: "warrior",
        real_x: 0,
        real_y: 0,
        items: [
          { name: "hpot1", q: 12 },
          null,
          { name: "sword", level: 3 }
        ],
        slots: {
          mainhand: { name: "sword", level: 3 }
        }
      },
      entities: {},
      skillbar: ["1", "2", "3", "Q", "R"],
      keymap: {
        "1": "use_hp",
        "2": "use_mp",
        "3": "cleave",
        "Q": "taunt",
        "R": "charge"
      },
      G: {
        items: {
          hpot1: { name: "HP Potion" },
          sword: { name: "Sword" }
        },
        skills: {
          cleave: {
            name: "Cleave",
            class: ["warrior"],
            level: 1,
            mp: 200
          },
          taunt: {
            name: "Taunt",
            class: ["warrior"],
            level: 1,
            mp: 40
          },
          charge: {
            name: "Charge",
            class: ["warrior"],
            level: 1,
            mp: 20
          }
        }
      }
    } as const;

    const before = JSON.stringify(globals);
    const bridge = new LegacyMirrorBridge(renderer, () => globals);
    const snapshot = bridge.renderOnce();

    expect(JSON.stringify(globals)).toBe(before);
    expect(snapshot.playerUi?.inventory[0]).toMatchObject({
      index: 0,
      name: "hpot1",
      displayName: "HP Potion",
      quantity: 12
    });
    expect(snapshot.playerUi?.inventory[1]).toEqual({ index: 1 });
    expect(snapshot.playerUi?.equipment[0]).toMatchObject({
      slot: "mainhand",
      displayName: "Sword",
      level: 3
    });
    expect(snapshot.playerUi?.hotbar.map((entry) => entry.key)).toEqual([
      "1",
      "2",
      "3",
      "Q",
      "R"
    ]);
    expect(snapshot.playerUi?.skills.find((skill) => skill.name === "cleave"))
      .toMatchObject({ label: "Cleave", key: "3", mp: 200 });
  });
});
