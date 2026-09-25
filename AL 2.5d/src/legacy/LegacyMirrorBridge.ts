import type { GameFrameSnapshot, RenderBridge } from "../render/RenderBridge";
import {
  LegacySnapshotAdapter,
  type LegacyEntityLike
} from "./LegacySnapshotAdapter";

export type LegacyGlobalsLike = Readonly<{
  current_map?: string;
  character?: LegacyEntityLike | null;
  entities?: Readonly<Record<string, LegacyEntityLike>>;
}>;

export type FrameScheduler = Readonly<{
  request: (callback: FrameRequestCallback) => number;
  cancel: (handle: number) => void;
}>;

const browserFrameScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle)
};

/**
 * Mirrors the original Adventure Land client state into the new renderer.
 *
 * During the compatibility phase the legacy PIXI entity objects are allowed to
 * continue existing because gameplay logic stores state directly on them. This
 * bridge only reads those objects and never mutates them.
 */
export class LegacyMirrorBridge {
  private frameHandle: number | null = null;
  private tick = 0;

  constructor(
    private readonly renderer: RenderBridge,
    private readonly readGlobals: () => LegacyGlobalsLike,
    private readonly adapter = new LegacySnapshotAdapter(),
    private readonly scheduler: FrameScheduler = browserFrameScheduler
  ) {}

  renderOnce(): GameFrameSnapshot {
    const globals = this.readGlobals();
    const character = globals.character ?? null;
    const map =
      globals.current_map ??
      character?.map ??
      "main";

    const snapshot = this.adapter.toSnapshot({
      tick: this.tick++,
      map,
      character,
      entities: globals.entities ?? {}
    });

    this.renderer.renderFrame(snapshot);
    return snapshot;
  }

  start(): void {
    if (this.frameHandle !== null) return;

    const frame = () => {
      this.renderOnce();
      this.frameHandle = this.scheduler.request(frame);
    };

    this.frameHandle = this.scheduler.request(frame);
  }

  stop(): void {
    if (this.frameHandle === null) return;

    this.scheduler.cancel(this.frameHandle);
    this.frameHandle = null;
  }

  get running(): boolean {
    return this.frameHandle !== null;
  }
}
