import { describe, expect, it } from "vitest";

import {
  isLoopbackHostname,
  LOCAL_ADMIN_CHARACTER,
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
    expect(LOCAL_ADMIN_CHARACTER).toBe("LocalAdmin");
  });
});
