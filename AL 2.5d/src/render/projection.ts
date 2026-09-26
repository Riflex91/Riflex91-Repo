export type WorldPoint = {
  x: number;
  y: number;
  z?: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
};

export type ProjectionConfig = {
  xScale: number;
  yScale: number;
  elevationScale: number;
};

export const DEFAULT_PROJECTION: ProjectionConfig = {
  xScale: 0.5,
  yScale: 0.25,
  elevationScale: 1
};

/**
 * Pure visual transform. Gameplay coordinates remain untouched.
 *
 * World x/y are authoritative Adventure Land coordinates.
 * z is presentation-only elevation and defaults to zero.
 */
export function projectWorldToScreen(
  point: WorldPoint,
  config: ProjectionConfig = DEFAULT_PROJECTION
): ScreenPoint {
  const z = point.z ?? 0;

  return {
    x: (point.x - point.y) * config.xScale,
    y: (point.x + point.y) * config.yScale - z * config.elevationScale
  };
}

/**
 * Inverse projection on a known visual elevation plane.
 * This lets pointer input map back to the original world coordinate system.
 */
export function projectScreenToWorld(
  point: ScreenPoint,
  z = 0,
  config: ProjectionConfig = DEFAULT_PROJECTION
): WorldPoint {
  const elevatedY = point.y + z * config.elevationScale;
  const a = point.x / config.xScale;
  const b = elevatedY / config.yScale;

  return {
    x: (a + b) / 2,
    y: (b - a) / 2,
    z
  };
}
