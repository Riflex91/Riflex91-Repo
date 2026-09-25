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
      entities: Object.freeze({})
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
    expect(renderer.frames).toHaveLength(1);
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
