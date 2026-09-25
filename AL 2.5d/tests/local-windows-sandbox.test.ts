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

  it("downloads and runs a loopback-only portable MongoDB when none is installed", () => {
    const setup = read("local-dev/windows/setup.ps1");
    const start = read("local-dev/windows/start.ps1");
    const stop = read("local-dev/windows/stop.ps1");

    expect(setup).toContain("mongodb-windows-x86_64-$MongoVersion.zip");
    expect(setup).toContain("fastdl.mongodb.org");
    expect(setup).toContain("--bind_ip 127.0.0.1");
    expect(setup).toContain("AL25D-TestServer\\MongoDB");
    expect(setup).toContain("System.Net.Sockets.TcpClient");
    expect(setup).not.toContain("Test-NetConnection");
    expect(setup).not.toContain("Docker Desktop");
    expect(start).toContain("mongod.exe");
    expect(start).toContain("--bind_ip 127.0.0.1");
    expect(start).toContain("AL25D-TestServer\\MongoDB");
    expect(start).toContain("System.Net.Sockets.TcpClient");
    expect(start).not.toContain("Test-NetConnection");
    expect(stop).toContain("mongodb.pid");
  });

  it("pins shared inter-process server keys and verifies the local eval bridge", () => {
    const setup = read("local-dev/windows/setup.ps1");
    const start = read("local-dev/windows/start.ps1");

    expect(setup).toContain("local-secrets.json");
    expect(setup).toContain("Write-SharedLocalKeys");
    expect(setup).toContain("ACCESS_MASTER");
    expect(setup).toContain("SERVER_MASTER");
    expect(start).toContain("Verify-GameServerApi");
    expect(start).toContain("http://127.0.0.1:7192/server.api/eval");
    expect(start).toContain('output={ok:true};');
  });

  it("adds the MessagePack socket path required by the pinned local game server", () => {
    const setup = read("local-dev/windows/setup.ps1");

    expect(setup).toContain('msgpack_path: "/socket.io-msgpack/"');
    expect(setup).toContain("Adding the local MessagePack Socket.IO path");
  });

  it("bootstraps the upstream pathfinding precompute globals and fails closed", () => {
    const setup = read("local-dev/windows/setup.ps1");

    expect(setup).toContain('global.Dev = options.Dev');
    expect(setup).toContain('global.Local = options.Local');
    expect(setup).toContain('global.Prod = options.Prod');
    expect(setup).toContain('global.Staging = options.Staging');
    expect(setup).toContain('Local pathfinding precompute failed with exit code');
    expect(setup).toContain('precomputed_map_data.js');
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

  it("aligns the Vite bind address with the IPv4 renderer health probe", () => {
    const vite = read("vite.config.ts");
    const start = read("local-dev/windows/start.ps1");

    expect(vite).toContain('host: "127.0.0.1"');
    expect(vite).toContain('"http://127.0.0.1:8090"');
    expect(start).toContain("--host 127.0.0.1 --port 5173");
    expect(start).toContain("http://127.0.0.1:5173/");
  });

  it("starts only localhost services and opts into the local admin browser mode", () => {
    const start = read("local-dev/windows/start.ps1");

    expect(start).toContain("127.0.0.1");
    expect(start).toContain("127.0.0.1:5173");
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
