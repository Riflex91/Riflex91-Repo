import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  snapshotLegacyProjectileEffects,
  type LegacyGlobalsLike
} from "../src/legacy/LegacyMirrorBridge";

describe("projectile effect mirror", () => {
  it("mirrors only map animations backed by original G.projectiles definitions", () => {
    const globals: LegacyGlobalsLike = Object.freeze({
      G: Object.freeze({
        projectiles: Object.freeze({
          arrow: Object.freeze({ animation: "arrow_anim" }),
          beam: Object.freeze({ ray: "beam_ray" })
        })
      }),
      map_animations: Object.freeze({
        pid1: Object.freeze({
          id: "pid1",
          skin: "arrow_anim",
          atype: "map",
          x: 12,
          y: 34,
          going_x: 80,
          going_y: 90
        }),
        pid2: Object.freeze({
          id: "pid2",
          skin: "beam_ray",
          atype: "cmap",
          x: 50,
          y: 60,
          origin: Object.freeze({ real_x: 10, real_y: 20 }),
          target: Object.freeze({ real_x: 90, real_y: 100 })
        }),
        generic: Object.freeze({
          id: "generic",
          skin: "gold",
          x: 1,
          y: 2
        })
      })
    });

    const effects = snapshotLegacyProjectileEffects(globals);

    expect(effects).toEqual([
      {
        id: "pid1",
        kind: "projectile",
        animation: "arrow_anim",
        x: 12,
        y: 34,
        targetX: 80,
        targetY: 90
      },
      {
        id: "pid2",
        kind: "ray",
        animation: "beam_ray",
        x: 50,
        y: 60,
        originX: 10,
        originY: 20,
        targetX: 90,
        targetY: 100
      }
    ]);
    expect(Object.isFrozen(effects)).toBe(true);
  });

  it("renders mirrored projectile effects separately from gameplay entities", () => {
    const renderer = readFileSync(
      resolve(process.cwd(), "src/render/Pixi25DRenderer.ts"),
      "utf8"
    );

    expect(renderer).toContain(
      "renderProjectileEffects(snapshot.projectileEffects ?? [])"
    );
    expect(renderer).toContain('effect.kind === "ray"');
    expect(renderer).toContain("projectileEffectColor");
  });
});
