export type EntityKind = "player" | "monster" | "npc" | "prop" | "projectile";

export type RenderEntity = Readonly<{
  id: string;
  kind: EntityKind;
  x: number;
  y: number;
  z?: number;
  texture: string;
  facing?: number;
  scale?: number;
  alpha?: number;
}>;

export type CameraState = Readonly<{
  x: number;
  y: number;
  zoom: number;
}>;

export type GameFrameSnapshot = Readonly<{
  tick: number;
  map: string;
  entities: readonly RenderEntity[];
}>;

/**
 * Presentation boundary.
 *
 * Legacy Adventure Land logic may only push snapshots through this interface.
 * The renderer never mutates gameplay state.
 */
export interface RenderBridge {
  mount(host: HTMLElement): Promise<void>;
  renderFrame(snapshot: GameFrameSnapshot): void;
  setCamera(camera: CameraState): void;
  destroy(): void;
}
