import { describe, expect, it } from "vitest";

import {
  createLegacyMapClickEvent,
  dispatchLegacyEntityClick,
  LegacyCompatibilityRuntime,
  PINNED_ADVENTURE_LAND_COMMIT,
  type LegacyCompatibilitySource,
  type LegacyMapClickEvent
} from "../src/legacy/LegacyCompatibilityRuntime";
import { LegacyMirrorBridge } from "../src/legacy/LegacyMirrorBridge";
import type {
  CameraState,
  GameFrameSnapshot,
  RenderBridge
} from "../src/render/RenderBridge";

class FakeRenderer implements RenderBridge {
  frames: GameFrameSnapshot[] = [];

  async mount(_host: HTMLElement): Promise<void> {}

  renderFrame(snapshot: GameFrameSnapshot): void {
    this.frames.push(snapshot);
  }

  setCamera(_camera: CameraState): void {}

  destroy(): void {}
}

describe("LegacyCompatibilityRuntime", () => {
  it("targets original world coordinates through the pinned map_click event shape", () => {
    let callbackCoordinates: [number, number] | null = null;
    let defaultMovementCalls = 0;

    const source: LegacyCompatibilitySource = {
      __AL25D_UPSTREAM_COMMIT__: PINNED_ADVENTURE_LAND_COMMIT,
      current_map: "main",
      width: 800,
      height: 600,
      scale: 2,
      manual_centering: false,
      character: {
        id: "Hero",
        ctype: "warrior",
        real_x: 100,
        real_y: 200,
        x: 400,
        y: 300,
        map: "main"
      },
      entities: {},
      G: {
        maps: {
          main: {
            name: "Main"
          }
        }
      },
      map_click(this: LegacyCompatibilitySource, event: LegacyMapClickEvent) {
        const character = this.character!;
        let dx = event.data.global.x - this.width! / 2;
        let dy = event.data.global.y - this.height! / 2;

        if (this.manual_centering) {
          dx = event.data.global.x - (character.x ?? 0);
          dy = event.data.global.y - (character.y ?? 0);
        }

        dx /= this.scale!;
        dy /= this.scale!;

        const worldX = (character.real_x ?? 0) + dx;
        const worldY = (character.real_y ?? 0) + dy;
        callbackCoordinates = [worldX, worldY];

        // Mirrors the pinned map_click behavior:
        // a truthy on_map_click result cancels default movement/socket emission.
        const onMapClickCancelled = true;
        if (onMapClickCancelled) return;

        defaultMovementCalls++;
      }
    };

    const before = JSON.stringify({
      character: source.character,
      entities: source.entities,
      G: source.G
    });
    const runtime = new LegacyCompatibilityRuntime().attach(source);

    runtime.dispatchWorldClick({ x: -321.5, y: 88.25 });

    expect(callbackCoordinates).not.toBeNull();
    expect(callbackCoordinates![0]).toBeCloseTo(-321.5, 8);
    expect(callbackCoordinates![1]).toBeCloseTo(88.25, 8);
    expect(defaultMovementCalls).toBe(0);
    expect(
      JSON.stringify({
        character: source.character,
        entities: source.entities,
        G: source.G
      })
    ).toBe(before);
  });

  it("routes entity clicks through the original monster/player/NPC handlers", () => {
    const calls: string[] = [];
    const source: LegacyCompatibilitySource = {
      current_map: "main",
      width: 800,
      height: 600,
      scale: 1,
      character: {
        id: "Hero",
        ctype: "warrior",
        real_x: 0,
        real_y: 0
      },
      entities: {
        goo: { id: "goo", type: "monster", mtype: "goo", real_x: 40, real_y: 50 },
        merchant: { id: "merchant", type: "character", npc: "basics", ctype: "merchant", real_x: 60, real_y: 70 },
        friend: { id: "friend", type: "character", ctype: "mage", real_x: 80, real_y: 90 }
      },
      G: {},
      map_click: () => undefined,
      monster_click() { calls.push("monster:" + (this as { id: string }).id); },
      npc_right_click() { calls.push("npc:" + (this as { id: string }).id); },
      player_click() { calls.push("player:" + (this as { id: string }).id); }
    };

    dispatchLegacyEntityClick("goo", source);
    dispatchLegacyEntityClick("merchant", source);
    dispatchLegacyEntityClick("friend", source);

    expect(calls).toEqual([
      "monster:goo",
      "npc:merchant",
      "player:friend"
    ]);
  });

  it("supports the original manual-centering pointer transform", () => {
    const source: LegacyCompatibilitySource = {
      current_map: "main",
      width: 1200,
      height: 800,
      scale: 1.5,
      manual_centering: true,
      character: {
        id: "Hero",
        real_x: 50,
        real_y: -20,
        x: 640,
        y: 420
      },
      entities: {},
      G: {}
    };

    const event = createLegacyMapClickEvent(
      { x: 80, y: 40 },
      source
    );

    expect(event.data.global.x).toBeCloseTo(685, 8);
    expect(event.data.global.y).toBeCloseTo(510, 8);
  });

  it("mirrors character, monster and authoritative map metadata without mutation", () => {
    const renderer = new FakeRenderer();
    const globals = {
      current_map: "main",
      character: {
        id: "Hero",
        ctype: "warrior",
        real_x: 101,
        real_y: 202,
        map: "main",
        skin: "mwarrior"
      },
      entities: {
        goo_1: {
          id: "goo_1",
          type: "monster",
          mtype: "goo",
          real_x: -45,
          real_y: 77
        }
      },
      G: {
        maps: {
          main: {
            name: "Main",
            safe: true,
            world: "new",
            spawns: [[0, 0]]
          }
        },
        geometry: {
          main: {
            tiles: [{ id: 1 }, { id: 2 }],
            placements: [{ id: "a" }],
            groups: [[1], [2], [3]],
            animations: [{ id: "water" }],
            x_lines: [1, 2, 3, 4],
            y_lines: [1, 2]
          }
        }
      }
    } as const;

    const before = JSON.stringify(globals);
    const bridge = new LegacyMirrorBridge(renderer, () => globals);
    const snapshot = bridge.renderOnce();

    expect(JSON.stringify(globals)).toBe(before);
    expect(snapshot.map).toBe("main");
    expect(snapshot.entities.map((entity) => entity.id)).toEqual([
      "Hero",
      "goo_1"
    ]);
    expect(snapshot.entities[0]).toMatchObject({ x: 101, y: 202 });
    expect(snapshot.entities[1]).toMatchObject({ x: -45, y: 77 });
    expect(snapshot.mapState).toEqual({
      id: "main",
      metadata: {
        name: "Main",
        safe: true,
        world: "new"
      },
      geometry: {
        available: true,
        tiles: 2,
        placements: 1,
        groups: 3,
        animations: 1,
        xLines: 4,
        yLines: 2,
        bounds: undefined,
        collisionXLines: [],
        collisionYLines: []
      }
    });
  });

  it("rejects an explicitly advertised runtime from a different upstream commit", () => {
    const source: LegacyCompatibilitySource = {
      __AL25D_UPSTREAM_COMMIT__: "different",
      G: {}
    };

    expect(() => new LegacyCompatibilityRuntime().attach(source)).toThrow(
      /commit mismatch/
    );
  });

  it("switches the visible renderer host without changing legacy gameplay state", () => {
    const host = {
      style: {
        visibility: "",
        pointerEvents: "auto"
      }
    } as unknown as HTMLElement;
    const source: LegacyCompatibilitySource = {
      current_map: "main",
      character: {
        id: "Hero",
        real_x: 10,
        real_y: 20,
        map: "main"
      },
      entities: {},
      G: {}
    };
    const before = JSON.stringify(source);
    const runtime = new LegacyCompatibilityRuntime(host).attach(source);

    runtime.setGraphicsMode("original");

    expect(runtime.getGraphicsMode()).toBe("original");
    expect(host.style.visibility).toBe("hidden");
    expect(host.style.pointerEvents).toBe("none");
    expect(JSON.stringify(source)).toBe(before);

    runtime.setGraphicsMode("2.5d");

    expect(runtime.getGraphicsMode()).toBe("2.5d");
    expect(host.style.visibility).toBe("");
    expect(host.style.pointerEvents).toBe("auto");
    expect(JSON.stringify(source)).toBe(before);
  });

});
