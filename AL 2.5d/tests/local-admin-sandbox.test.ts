import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  isLoopbackHostname,
  LOCAL_ADMIN_EMAIL
} from "../src/local/LocalAdminSandbox";

describe("LocalAdminSandbox", () => {
  it("only permits loopback hostnames", () => {
    expect(isLoopbackHostname("localhost")).toBe(true);
    expect(isLoopbackHostname("127.0.0.1")).toBe(true);
    expect(isLoopbackHostname("::1")).toBe(true);
    expect(isLoopbackHostname("[::1]")).toBe(true);

    expect(isLoopbackHostname("adventure.land")).toBe(false);
    expect(isLoopbackHostname("example.com")).toBe(false);
    expect(isLoopbackHostname("192.168.1.20")).toBe(false);
  });

  it("uses an obviously non-production local identity", () => {
    expect(LOCAL_ADMIN_EMAIL.endsWith(".invalid")).toBe(true);
  });

  it("does not auto-create characters so the original creation UI stays testable", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/local/LocalAdminSandbox.ts"),
      "utf8"
    );

    expect(source).not.toContain('postApi("create_character"');
    expect(source).not.toContain("LOCAL_TEST_CHARACTERS");
  });
});
