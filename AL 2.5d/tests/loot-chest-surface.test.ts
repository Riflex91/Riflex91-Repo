import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("first-party loot chest surface", () => {
  it("renders chests separately and routes clicks through compatibility runtime", () => {
    const renderer = readFileSync(
      resolve(process.cwd(), "src/render/Pixi25DRenderer.ts"),
      "utf8"
    );
    const minimap = readFileSync(
      resolve(process.cwd(), "src/ui/MinimapOverlay.ts"),
      "utf8"
    );
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");

    expect(renderer).toContain("renderLootChests(snapshot.lootChests ?? [])");
    expect(renderer).toContain("private drawLootChest(");
    expect(minimap).toContain("snapshot.lootChests ?? []");
    expect(main).toContain("legacyRuntime.dispatchChestOpen(chestHit.chest.id)");
    expect(main).not.toContain('socket.emit("open_chest"');
  });
});
