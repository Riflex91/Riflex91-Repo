import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  snapshotLegacyQuestEvents,
  type LegacyGlobalsLike
} from "../src/legacy/LegacyMirrorBridge";

describe("quest and event snapshot", () => {
  it("copies only explicit quest/event state without touching the legacy character", () => {
    const character = Object.freeze({
      id: "Hero",
      name: "Hero",
      s: Object.freeze({
        monsterhunt: Object.freeze({ id: "goo", c: 7 }),
        anniversary_visit: Object.freeze({
          expires: 1900000000000
        }),
        holidayspirit: Object.freeze({ ms: 1000 }),
        speed: Object.freeze({ ms: 5000 })
      })
    });
    const globals: LegacyGlobalsLike = Object.freeze({
      character,
      S: Object.freeze({
        abtesting: Object.freeze({
          A: 3,
          B: 2,
          end: 1900000100000
        }),
        unrelated_runtime_state: Object.freeze({ value: 1 })
      }),
      G: Object.freeze({
        monsters: Object.freeze({
          goo: Object.freeze({ name: "Green Goo" })
        }),
        events: Object.freeze({
          abtesting: Object.freeze({
            name: "A/B Testing",
            map: "winterland"
          })
        })
      })
    });

    const before = JSON.stringify(globals);
    const rows = snapshotLegacyQuestEvents(globals, character);

    expect(JSON.stringify(globals)).toBe(before);
    expect(rows).toEqual([
      {
        id: "monsterhunt",
        kind: "quest",
        title: "Monster Hunt",
        detail: "Defeat 7 × Green Goo",
        status: "Active",
        remaining: 7
      },
      {
        id: "anniversary_visit",
        kind: "event",
        title: "Anniversary Visit",
        detail: "Realm visit invitation",
        status: "Invitation",
        expiresAt: 1900000000000
      },
      {
        id: "holidayspirit",
        kind: "event",
        title: "Holiday Spirit",
        detail: "Seasonal event status",
        status: "Active"
      },
      {
        id: "event:abtesting",
        kind: "event",
        title: "A/B Testing",
        status: "Active",
        map: "winterland",
        expiresAt: 1900000100000
      }
    ]);
    expect(rows.some((row) => row.id.includes("speed"))).toBe(false);
    expect(rows.some((row) => row.id.includes("unrelated"))).toBe(false);
    expect(Object.isFrozen(rows)).toBe(true);
  });

  it("adds a dedicated QUEST surface to the first-party HUD", () => {
    const hud = readFileSync(resolve(process.cwd(), "src/ui/HudOverlay.ts"), "utf8");
    const style = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(hud).toContain('"quests", "QUEST"');
    expect(hud).toContain("renderQuestEvents(this.latestQuestEvents)");
    expect(hud).toContain("ROUTE TARGET");
    expect(hud).toContain("CURRENT AREA");
    expect(style).toContain(".al25d-quest-card");
    expect(style).toContain(".al25d-quest-nav-hint");
  });
});
