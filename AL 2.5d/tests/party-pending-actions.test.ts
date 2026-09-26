import { describe, expect, it } from "vitest";

import { pendingPartyActions } from "../src/ui/HudOverlay";

describe("pending party actions", () => {
  it("derives invite/request actions only from original chat ids", () => {
    expect(pendingPartyActions([
      { owner: "^", message: "invite", id: "pinAlice" },
      { owner: "^", message: "request", id: "rqBob" },
      { owner: "^", message: "duel", id: "chlCarol" },
      { owner: "^", message: "duplicate", id: "pinAlice" }
    ])).toEqual([
      { kind: "invite", name: "Alice" },
      { kind: "request", name: "Bob" }
    ]);
  });
});
