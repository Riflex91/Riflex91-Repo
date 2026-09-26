import { describe, expect, it } from "vitest";

import {
  LegacyCompatibilityRuntime,
  snapshotLegacyLootReward,
  type LegacyCompatibilitySource
} from "../src/legacy/LegacyCompatibilityRuntime";

type SocketListener = (data: unknown) => void;

function baseSource(
  calls: string[],
  socket?: LegacyCompatibilitySource["socket"]
): LegacyCompatibilitySource {
  return {
    current_map: "main",
    character: {
      id: "Hero",
      name: "Hero",
      type: "character",
      map: "main",
      real_x: 0,
      real_y: 0
    },
    entities: {},
    G: {
      items: {
        sword: {
          name: "Bright Sword"
        }
      }
    },
    open_chest(id: string) {
      calls.push(id);
      return "opened";
    },
    ...(socket ? { socket } : {}),
    document: {
      querySelectorAll() {
        return [];
      }
    } as unknown as Document
  };
}

describe("original chest open path", () => {
  it("delegates chest clicks to original open_chest()", () => {
    const calls: string[] = [];
    const runtime = new LegacyCompatibilityRuntime().attach(baseSource(calls));

    expect(runtime.dispatchChestOpen(" chestA ")).toBe("opened");
    expect(calls).toEqual(["chestA"]);
  });

  it("fails closed when open_chest is unavailable", () => {
    const source = baseSource([]);
    const runtime = new LegacyCompatibilityRuntime().attach({
      ...source,
      open_chest: undefined
    });

    expect(() => runtime.dispatchChestOpen("chestA")).toThrow(/open_chest/);
  });

  it("snapshots only authoritative chest_opened reward fields", () => {
    const source = baseSource([]);
    const payload = Object.freeze({
      id: "chestA",
      opener: "Hero",
      gold: 1234,
      party: true,
      items: Object.freeze([
        Object.freeze({
          name: "sword",
          level: 2,
          q: 3,
          looter: "Hero"
        }),
        Object.freeze({
          name: "sword",
          looter: "Other",
          pvp_loot: true
        })
      ])
    });
    const before = JSON.stringify(payload);

    const reward = snapshotLegacyLootReward(payload, source);

    expect(JSON.stringify(payload)).toBe(before);
    expect(reward).toEqual({
      chestId: "chestA",
      opener: "Hero",
      gold: 1234,
      party: true,
      items: [
        {
          name: "sword",
          displayName: "Bright Sword",
          level: 2,
          quantity: 3,
          looter: "Hero"
        },
        {
          name: "sword",
          displayName: "Bright Sword",
          looter: "Other",
          pvpLoot: true
        }
      ]
    });
    expect(Object.isFrozen(reward)).toBe(true);
    expect(Object.isFrozen(reward?.items)).toBe(true);
    expect(Object.isFrozen(reward?.items[0])).toBe(true);
  });

  it("observes chest_opened read-only and detaches cleanly", () => {
    const listeners = new Map<string, SocketListener>();
    const socket = {
      connected: true,
      on(event: string, listener: SocketListener) {
        listeners.set(event, listener);
      },
      off(event: string, listener: SocketListener) {
        if (listeners.get(event) === listener) listeners.delete(event);
      }
    };
    const runtime = new LegacyCompatibilityRuntime().attach(
      baseSource([], socket)
    );
    const rewards: unknown[] = [];
    runtime.subscribeLootRewards((reward) => rewards.push(reward));

    const payload = Object.freeze({
      id: "chestA",
      opener: "Hero",
      gold: 500,
      items: Object.freeze([
        Object.freeze({ name: "sword", looter: "Hero" })
      ])
    });
    const before = JSON.stringify(payload);

    listeners.get("chest_opened")?.(payload);

    expect(JSON.stringify(payload)).toBe(before);
    expect(rewards).toEqual([
      {
        chestId: "chestA",
        opener: "Hero",
        gold: 500,
        items: [
          {
            name: "sword",
            displayName: "Bright Sword",
            looter: "Hero"
          }
        ]
      }
    ]);

    runtime.stop();
    expect(listeners.has("chest_opened")).toBe(false);
  });
});
