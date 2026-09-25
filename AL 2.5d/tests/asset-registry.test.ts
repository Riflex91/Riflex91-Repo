import { describe, expect, it } from "vitest";

import { AssetRegistry } from "../src/render/AssetRegistry";

describe("AssetRegistry", () => {
  it("maps stable logical ids to replaceable 2.5D files", () => {
    const registry = new AssetRegistry([
      {
        id: "asset://monster/goo",
        src: "/assets/monsters/goo/idle.webp"
      }
    ]);

    expect(registry.resolve("asset://monster/goo")).toBe(
      "/assets/monsters/goo/idle.webp"
    );
  });

  it("does not accidentally load unresolved logical ids as URLs", () => {
    const registry = new AssetRegistry();

    expect(registry.resolve("asset://monster/unknown")).toBeNull();
    expect(registry.resolve("/assets/dev-placeholder.webp")).toBe(
      "/assets/dev-placeholder.webp"
    );
  });
});
