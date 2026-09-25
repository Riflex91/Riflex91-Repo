import type { LegacySnapshotSource } from "../../src/legacy/LegacySnapshotAdapter";

export const mainLegacyFixture: LegacySnapshotSource = Object.freeze({
  tick: 100,
  map: "main",
  character: Object.freeze({
    id: "Hero",
    ctype: "warrior",
    type: "warrior",
    real_x: 12,
    real_y: 24,
    going_x: 64,
    skin: "mwarrior"
  }),
  entities: Object.freeze({
    goo_1: Object.freeze({
      id: "goo_1",
      type: "goo",
      mtype: "goo",
      real_x: 90,
      real_y: 120
    }),
    merchant_1: Object.freeze({
      id: "merchant_1",
      npc: "standmerchant",
      real_x: -40,
      real_y: 15
    })
  })
});
