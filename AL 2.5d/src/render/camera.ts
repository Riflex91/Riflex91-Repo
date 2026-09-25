import type { CameraState } from "./RenderBridge";
import {
  projectScreenToWorld,
  projectWorldToScreen,
  type ScreenPoint,
  type WorldPoint
} from "./projection";

export type ViewportSize = Readonly<{
  width: number;
  height: number;
}>;

/**
 * Camera x/y are expressed in projected scene coordinates, not authoritative
 * gameplay coordinates. This keeps camera movement strictly visual.
 */
export function projectedToViewport(
  point: ScreenPoint,
  camera: CameraState,
  viewport: ViewportSize
): ScreenPoint {
  return {
    x: (point.x - camera.x) * camera.zoom + viewport.width / 2,
    y: (point.y - camera.y) * camera.zoom + viewport.height / 2
  };
}

export function viewportToProjected(
  point: ScreenPoint,
  camera: CameraState,
  viewport: ViewportSize
): ScreenPoint {
  if (camera.zoom <= 0) {
    throw new Error("Camera zoom must be greater than zero");
  }

  return {
    x: (point.x - viewport.width / 2) / camera.zoom + camera.x,
    y: (point.y - viewport.height / 2) / camera.zoom + camera.y
  };
}

export function worldToViewport(
  point: WorldPoint,
  camera: CameraState,
  viewport: ViewportSize
): ScreenPoint {
  return projectedToViewport(projectWorldToScreen(point), camera, viewport);
}

export function viewportToWorld(
  point: ScreenPoint,
  camera: CameraState,
  viewport: ViewportSize,
  z = 0
): WorldPoint {
  return projectScreenToWorld(
    viewportToProjected(point, camera, viewport),
    z
  );
}
