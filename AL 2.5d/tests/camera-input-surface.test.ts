import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
const renderer = readFileSync(
  resolve(process.cwd(), "src/render/Pixi25DRenderer.ts"),
  "utf8"
);

describe("camera mouse controls", () => {
  it("uses middle-button drag for visual rotation and wheel for zoom", () => {
    expect(main).toContain('event.button !== 1');
    expect(main).toContain("rotateCameraByDrag");
    expect(main).toContain('host.addEventListener(\n    "wheel"');
    expect(main).toContain("zoomCameraByWheel");
    expect(main).toContain("event.preventDefault()");
  });

  it("keeps entity sprites upright while the projected scene rotates", () => {
    expect(renderer).toContain("this.world.rotation = this.camera.rotation ?? 0");
    expect(renderer).toContain(
      "visual.container.rotation = -(this.camera.rotation ?? 0)"
    );
    expect(renderer).toContain("refreshDepthOrder");
  });
});
