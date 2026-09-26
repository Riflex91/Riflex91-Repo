import { describe, expect, it, vi } from "vitest";

import {
  LegacyMirrorBridge,
  type FrameScheduler
} from "../src/legacy/LegacyMirrorBridge";
import type {
  CameraState,
  GameFrameSnapshot,
  RenderBridge
} from "../src/render/RenderBridge";

class FakeRenderer implements RenderBridge {
  frames: GameFrameSnapshot[] = [];

  async mount(): Promise<void> {}

  renderFrame(snapshot: GameFrameSnapshot): void {
    this.frames.push(snapshot);
  }

  setCamera(_camera: CameraState): void {}

  destroy(): void {}
}

class ManualScheduler implements FrameScheduler {
  private nextId = 1;
  private callbacks = new Map<number, FrameRequestCallback>();

  request = (callback: FrameRequestCallback): number => {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  };

  cancel = (handle: number): void => {
    this.callbacks.delete(handle);
  };

  flushOne(time = 0): void {
    const entry = this.callbacks.entries().next().value as
      | [number, FrameRequestCallback]
      | undefined;

    if (!entry) return;

    const [id, callback] = entry;
    this.callbacks.delete(id);
    callback(time);
  }

  get pending(): number {
    return this.callbacks.size;
  }
}

describe("LegacyMirrorBridge", () => {
  it("mirrors legacy globals without mutating them", () => {
    const renderer = new FakeRenderer();
    const character = Object.freeze({
      id: "Hero",
      ctype: "warrior",
      real_x: 101,
      real_y: 202,
      map: "main",
      skin: "mwarrior"
    });
    const globals = Object.freeze({
      current_map: "main",
      character,
      entities: Object.freeze({
        goo: Object.freeze({
          id: "goo",
          type: "monster",
          real_x: 120,
          real_y: 210
        })
      }),
      ctarget: Object.freeze({
        id: "goo",
        type: "monster",
        real_x: 120,
        real_y: 210
      }),
      G: Object.freeze({
        maps: Object.freeze({
          main: Object.freeze({ name: "Main" })
        }),
        tilesets: Object.freeze({
          town_floor: Object.freeze({ file: "/images/tiles/town-floor.png" }),
          town_wall: Object.freeze({ file: "/images/tiles/town-wall.png" })
        }),
        geometry: Object.freeze({
          main: Object.freeze({
            min_x: -100,
            min_y: -50,
            max_x: 300,
            max_y: 250,
            tiles: Object.freeze([
              Object.freeze(["town_floor", 0, 0, 32, 32]),
              Object.freeze(["town_wall", 32, 0, 16, 16])
            ]),
            placements: Object.freeze([
              Object.freeze([0, 0, 0, 64, 32])
            ]),
            groups: Object.freeze([
              Object.freeze([
                Object.freeze([1, 100, 100])
              ])
            ]),
            x_lines: Object.freeze([
              Object.freeze([10, 20, 40])
            ]),
            y_lines: Object.freeze([
              Object.freeze([50, 60, 90])
            ])
          })
        })
      })
    });

    const before = JSON.stringify(globals);
    const bridge = new LegacyMirrorBridge(renderer, () => globals);
    const snapshot = bridge.renderOnce();

    expect(JSON.stringify(globals)).toBe(before);
    expect(snapshot.tick).toBe(0);
    expect(snapshot.map).toBe("main");
    expect(snapshot.entities[0]).toMatchObject({
      id: "Hero",
      x: 101,
      y: 202,
      kind: "player"
    });
    expect(snapshot.entities.find((entity) => entity.id === "goo")?.targeted).toBe(true);
    expect(snapshot.mapState?.geometry.bounds).toEqual({
      minX: -100,
      minY: -50,
      maxX: 300,
      maxY: 250
    });
    expect(snapshot.mapState?.geometry.collisionXLines).toEqual([[10, 20, 40]]);
    expect(snapshot.mapState?.geometry.collisionYLines).toEqual([[50, 60, 90]]);
    expect(snapshot.mapState?.geometry.surfaces).toEqual([
      {
        tile: 0,
        material: "town_floor",
        minX: 0,
        minY: 0,
        maxX: 96,
        maxY: 64,
        layer: "ground",
        textureUrl: "/images/tiles/town-floor.png",
        sourceX: 0,
        sourceY: 0,
        tileWidth: 32,
        tileHeight: 32
      },
      {
        tile: 1,
        material: "town_wall",
        minX: 100,
        minY: 100,
        maxX: 116,
        maxY: 116,
        layer: "structure",
        group: 0,
        textureUrl: "/images/tiles/town-wall.png",
        sourceX: 32,
        sourceY: 0,
        tileWidth: 16,
        tileHeight: 16,
        elevation: 2
      }
    ]);
    expect(renderer.frames).toHaveLength(1);
  });

  it("reports snapshots to a renderer-side camera follower without touching gameplay", () => {
    const renderer = new FakeRenderer();
    const snapshots: GameFrameSnapshot[] = [];
    const globals = {
      current_map: "main",
      character: {
        id: "Hero",
        ctype: "warrior",
        real_x: 10,
        real_y: 20
      },
      entities: {}
    };

    const bridge = new LegacyMirrorBridge(
      renderer,
      () => globals,
      undefined,
      undefined,
      (snapshot) => snapshots.push(snapshot)
    );

    bridge.renderOnce();

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].entities[0].local).toBe(true);
  });

  it("preserves map transitions in renderer snapshots", () => {
    const renderer = new FakeRenderer();
    const globals: {
      current_map: string;
      character: {
        id: string;
        ctype: string;
        real_x: number;
        real_y: number;
        map: string;
      };
      entities: Record<string, never>;
      G: {
        maps: Record<string, Readonly<Record<string, unknown>>>;
        geometry: Record<string, Readonly<Record<string, unknown>>>;
      };
    } = {
      current_map: "main",
      character: {
        id: "Hero",
        ctype: "warrior",
        real_x: 10,
        real_y: 20,
        map: "main"
      },
      entities: {},
      G: {
        maps: {
          main: { name: "Main" },
          cave: { name: "Cave" }
        },
        geometry: {
          main: { x_lines: [[0, 0, 10]], y_lines: [] },
          cave: { x_lines: [[50, 0, 10]], y_lines: [] }
        }
      }
    };

    const bridge = new LegacyMirrorBridge(renderer, () => globals);
    expect(bridge.renderOnce().map).toBe("main");

    globals.current_map = "cave";
    globals.character.map = "cave";

    const cave = bridge.renderOnce();
    expect(cave.map).toBe("cave");
    expect(cave.mapState?.id).toBe("cave");
    expect(cave.mapState?.geometry.collisionXLines).toEqual([[50, 0, 10]]);
  });

  it("starts and stops a renderer-only animation loop", () => {
    const renderer = new FakeRenderer();
    const scheduler = new ManualScheduler();
    const globals = {
      current_map: "main",
      entities: {}
    };

    const bridge = new LegacyMirrorBridge(
      renderer,
      () => globals,
      undefined,
      scheduler
    );

    bridge.start();
    bridge.start();

    expect(bridge.running).toBe(true);
    expect(scheduler.pending).toBe(1);

    scheduler.flushOne();

    expect(renderer.frames).toHaveLength(1);
    expect(scheduler.pending).toBe(1);

    bridge.stop();

    expect(bridge.running).toBe(false);
    expect(scheduler.pending).toBe(0);
  });
});
