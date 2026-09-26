import { describe, expect, it } from "vitest";

import {
  projectedToViewport,
  viewportToProjected,
  viewportToWorld,
  worldToViewport
} from "../src/render/camera";
import {
  MAX_CAMERA_ZOOM,
  MIN_CAMERA_ZOOM,
  rotateCameraByDrag,
  zoomCameraByWheel
} from "../src/render/cameraControls";
import { projectWorldToScreen } from "../src/render/projection";

describe("rotatable camera", () => {
  it("round-trips projected coordinates under zoom and rotation", () => {
    const camera = {
      x: 125,
      y: -44,
      zoom: 1.8,
      rotation: Math.PI / 3
    };
    const viewport = { width: 1600, height: 900 };
    const projected = { x: 318.5, y: 222.25 };

    const view = projectedToViewport(projected, camera, viewport);
    const result = viewportToProjected(view, camera, viewport);

    expect(result.x).toBeCloseTo(projected.x, 8);
    expect(result.y).toBeCloseTo(projected.y, 8);
  });

  it("round-trips authoritative world coordinates after camera rotation", () => {
    const camera = {
      x: 70,
      y: 90,
      zoom: 1.42,
      rotation: -0.78
    };
    const viewport = { width: 1280, height: 720 };
    const world = { x: 321, y: -177, z: 0 };

    const screen = worldToViewport(world, camera, viewport);
    const result = viewportToWorld(screen, camera, viewport, 0);

    expect(result.x).toBeCloseTo(world.x, 8);
    expect(result.y).toBeCloseTo(world.y, 8);
    expect(projectWorldToScreen(result).x).toBeCloseTo(
      projectWorldToScreen(world).x,
      8
    );
  });

  it("clamps wheel zoom and preserves camera focus coordinates", () => {
    const camera = { x: 12, y: 34, zoom: 1.5, rotation: 0.4 };
    const near = zoomCameraByWheel(camera, -100000);
    const far = zoomCameraByWheel(camera, 100000);

    expect(near.zoom).toBe(MAX_CAMERA_ZOOM);
    expect(far.zoom).toBe(MIN_CAMERA_ZOOM);
    expect(near.x).toBe(camera.x);
    expect(near.y).toBe(camera.y);
    expect(near.rotation).toBe(camera.rotation);
  });

  it("rotates only presentation state", () => {
    const camera = { x: 12, y: 34, zoom: 1.5, rotation: 0 };
    const rotated = rotateCameraByDrag(camera, 100);

    expect(rotated.x).toBe(camera.x);
    expect(rotated.y).toBe(camera.y);
    expect(rotated.zoom).toBe(camera.zoom);
    expect(rotated.rotation).not.toBe(0);
  });
});
