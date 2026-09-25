import { describe, expect, it } from "vitest";

import { LegacySnapshotAdapter } from "../src/legacy/LegacySnapshotAdapter";

describe("LegacySnapshotAdapter", () => {
  it("prefers real coordinates and never mutates legacy state", () => {
    const character = Object.freeze({
      id: "Hero",
      type: "warrior",
      ctype: "warrior",
      x: 100,
      y: 200,
      real_x: 101.5,
      real_y: 198.25,
      going_x: 50,
      skin: "mwarrior"
    });

    const before = JSON.stringify(character);
    const adapter = new LegacySnapshotAdapter({
      classTypes: new Set(["warrior"])
    });

    const snapshot = adapter.toSnapshot({
      tick: 7,
      map: "main",
      character
    });

    expect(JSON.stringify(character)).toBe(before);
    expect(snapshot.entities).toHaveLength(1);
    expect(snapshot.entities[0]).toMatchObject({
      id: "Hero",
      kind: "player",
      x: 101.5,
      y: 198.25,
      facing: -1,
      local: true
    });
  });

  it("classifies monsters and NPCs without changing gameplay objects", () => {
    const goo = Object.freeze({
      id: "goo-1",
      type: "goo",
      x: 10,
      y: 20
    });

    const merchant = Object.freeze({
      id: "npc-1",
      npc: "standmerchant",
      x: 30,
      y: 40
    });

    const adapter = new LegacySnapshotAdapter({
      monsterTypes: new Set(["goo"])
    });

    const snapshot = adapter.toSnapshot({
      tick: 8,
      map: "main",
      entities: {
        goo,
        merchant
      }
    });

    expect(snapshot.entities.find((entity) => entity.id === "goo-1")?.kind).toBe("monster");
    expect(snapshot.entities.find((entity) => entity.id === "npc-1")?.kind).toBe("npc");
    expect(goo).toEqual({ id: "goo-1", type: "goo", x: 10, y: 20 });
    expect(merchant).toEqual({ id: "npc-1", npc: "standmerchant", x: 30, y: 40 });
  });

  it("deduplicates the local character if it is also present in entities", () => {
    const adapter = new LegacySnapshotAdapter({
      classTypes: new Set(["mage"])
    });

    const hero = Object.freeze({
      id: "Mage",
      type: "mage",
      ctype: "mage",
      x: 1,
      y: 2
    });

    const snapshot = adapter.toSnapshot({
      tick: 9,
      map: "main",
      character: hero,
      entities: {
        Mage: hero
      }
    });

    expect(snapshot.entities).toHaveLength(1);
    expect(snapshot.entities[0].kind).toBe("player");
    expect(snapshot.entities[0].local).toBe(true);
  });
});
