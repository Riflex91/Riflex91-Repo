import type { CameraState } from "./RenderBridge";

export const MIN_CAMERA_ZOOM = 0.72;
export const MAX_CAMERA_ZOOM = 2.6;
export const CAMERA_ROTATION_RADIANS_PER_PIXEL = 0.0075;
export const CAMERA_WHEEL_ZOOM_RATE = 0.00115;

export function clampCameraZoom(value: number): number {
  return Math.max(MIN_CAMERA_ZOOM, Math.min(MAX_CAMERA_ZOOM, value));
}

export function normalizeCameraRotation(radians: number): number {
  const circle = Math.PI * 2;
  let normalized = radians % circle;

  if (normalized > Math.PI) normalized -= circle;
  if (normalized < -Math.PI) normalized += circle;

  return normalized;
}

export function rotateCameraByDrag(
  camera: CameraState,
  deltaX: number
): CameraState {
  return Object.freeze({
    ...camera,
    rotation: normalizeCameraRotation(
      (camera.rotation ?? 0) +
        deltaX * CAMERA_ROTATION_RADIANS_PER_PIXEL
    )
  });
}

export function zoomCameraByWheel(
  camera: CameraState,
  deltaY: number
): CameraState {
  const factor = Math.exp(-deltaY * CAMERA_WHEEL_ZOOM_RATE);

  return Object.freeze({
    ...camera,
    zoom: clampCameraZoom(camera.zoom * factor)
  });
}
