import type { CameraState } from "../render/RenderBridge";
import {
  viewportToWorld,
  type ViewportSize
} from "../render/camera";
import type { ScreenPoint, WorldPoint } from "../render/projection";

export type LegacyMapClickHandler<T = unknown> = (x: number, y: number) => T;

export type LegacyInputContext = Readonly<{
  camera: CameraState;
  viewport: ViewportSize;
  elevation?: number;
}>;

/**
 * Converts a click in the new 2.5D viewport back to the exact x/y coordinate
 * space expected by Adventure Land gameplay and CODE callbacks.
 *
 * It deliberately does not move the character or emit sockets itself. The
 * legacy map_click/on_map_click path remains authoritative.
 */
export function mapPointerToLegacyWorld(
  pointer: ScreenPoint,
  context: LegacyInputContext
): WorldPoint {
  return viewportToWorld(
    pointer,
    context.camera,
    context.viewport,
    context.elevation ?? 0
  );
}

/**
 * Preserves the return value of the existing on_map_click-style handler so the
 * original "return true to cancel default movement" behavior remains intact.
 */
export function dispatchLegacyMapClick<T>(
  pointer: ScreenPoint,
  context: LegacyInputContext,
  handler: LegacyMapClickHandler<T>
): T {
  const world = mapPointerToLegacyWorld(pointer, context);
  return handler(world.x, world.y);
}
