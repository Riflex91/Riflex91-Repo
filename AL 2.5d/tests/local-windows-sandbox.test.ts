import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Windows local sandbox scripts", () => {
  it("pins the authoritative Adventure Land runtime and requires local admin config", () => {
    const setup = read("local-dev/windows/setup.ps1");

    expect(setup).toContain(
      'ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4'
    );
    expect(setup).toContain('"Dev: true"');
    expect(setup).toContain('"Local: true"');
    expect(setup).toContain('"unsecure_admin: true"');
    expect(setup).toContain('"ip_limit: 3"');
    expect(setup).toContain('"character_limit: 3"');
  });

  it("avoids NTFS junctions so the sandbox also works on ownership-less Windows volumes", () => {
    const setup = read("local-dev/windows/setup.ps1");

    expect(setup).toContain("Sync-DirectoryCopy");
    expect(setup).toContain("Copy-Item");
    expect(setup).not.toContain("New-Item -ItemType Junction");
  });

  it("scrubs imported player/account collections after seeding map data", () => {
    const setup = read("local-dev/windows/setup.ps1");

    for (const collection of [
      '"user"',
      '"character"',
      '"guild"',
      '"message"',
      '"mail"',
      '"ip"',
      '"mark"',
      '"server"'
    ]) {
      expect(setup).toContain(collection);
    }
  });

  it("starts only localhost services and opts into the local admin browser mode", () => {
    const start = read("local-dev/windows/start.ps1");

    expect(start).toContain("127.0.0.1");
    expect(start).toContain("localhost:5173");
    expect(start).toContain("localAdmin=1");
    expect(start).toContain("legacy=/legacy/");
    expect(start).not.toContain("https://adventure.land");
  });

  it("proxies the original routes needed by start_character child clients", () => {
    const vite = read("vite.config.ts");

    expect(vite).toContain('"/character": backendProxy');
    expect(vite).toContain('"/server": backendProxy');
    expect(vite).toContain('"/runner": backendProxy');
  });
});
