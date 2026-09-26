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

function cameraRotation(camera: CameraState): number {
  return camera.rotation ?? 0;
}

function rotatePoint(point: ScreenPoint, radians: number): ScreenPoint {
  if (radians === 0) return point;

  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  return {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine
  };
}

/**
 * Camera x/y are expressed in projected scene coordinates, not authoritative
 * gameplay coordinates. Rotation and zoom are presentation-only.
 */
export function projectedToViewport(
  point: ScreenPoint,
  camera: CameraState,
  viewport: ViewportSize
): ScreenPoint {
  const relative = rotatePoint(
    {
      x: point.x - camera.x,
      y: point.y - camera.y
    },
    cameraRotation(camera)
  );

  return {
    x: relative.x * camera.zoom + viewport.width / 2,
    y: relative.y * camera.zoom + viewport.height / 2
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

  const relative = rotatePoint(
    {
      x: (point.x - viewport.width / 2) / camera.zoom,
      y: (point.y - viewport.height / 2) / camera.zoom
    },
    -cameraRotation(camera)
  );

  return {
    x: relative.x + camera.x,
    y: relative.y + camera.y
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
