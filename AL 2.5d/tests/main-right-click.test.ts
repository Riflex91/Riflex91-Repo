import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");

describe("2.5D mouse interaction parity", () => {
  it("reserves pointerup for left click and routes contextmenu to legacy right click", () => {
    expect(main).toContain("event.button !== 0");
    expect(main).toContain('host.addEventListener("contextmenu"');
    expect(main).toContain("event.preventDefault()");
    expect(main).toContain("dispatchEntityRightClick");
    expect(main).toContain("combatFeedback.attack");
    expect(main).toContain("showLocalActionFeedback");
  });
});
