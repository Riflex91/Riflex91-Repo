import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, webcrypto } from "node:crypto";
import { TextEncoder, TextDecoder } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "..", "v5-autonomous-test-ingame-updater.js"), "utf8");

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

async function runScenario({ current, packageBody = null }) {
  const calls = { fetch: [], upload: [], load: [] };
  const manifest = {
    schemaVersion: 1,
    enabled: true,
    repository: "Riflex91/Riflex91-Repo",
    branch: "main",
    gate: "PR20.6_MLUCK",
    testId: "pr20-6-mluck-autonomous-live-5m",
    controllerVersion: "1.0.0",
    coordinatorClass: "merchant",
    workerDistribution: "PACKAGE_OWNED_COMMAND_CHARACTER",
    sourceCommit: "d0823081da6f07a8a60002b1b809c24916555521",
    packagePath: "v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js",
    packageSha256: packageBody
      ? createHash("sha256").update(Buffer.from(packageBody)).digest("hex")
      : "26acb41bb17ff1da0719b0a4604621a5fa4bcd87f5e78b3cc647bf112a25753b",
    maxPackageBytes: 131072,
    expectedGlobal: "V5PR206MluckTest",
    normalRuntimeAllowed: false
  };

  const sandbox = {
    console,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    ArrayBuffer,
    Date,
    JSON,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    Error,
    setTimeout,
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    localStorage: storage(),
    character: {
      name: "Merchant",
      ctype: "merchant",
      hp: 1000,
      max_hp: 1000,
      rip: false,
      dead: false
    },
    get_entities() { return {}; },
    get_active_code_slot() { return { slot: 7, name: "AIO V5" }; },
    async upload_code(...args) { calls.upload.push(args); return { success: true }; },
    async load_code(slot) { calls.load.push(slot); return true; },
    AIO_V3: {
      operations: {
        status() { return { v5AutonomousTest: current }; }
      }
    },
    async fetch(url) {
      calls.fetch.push(url);
      if (url.endsWith("/v5/roadmap/v5-autonomous-test-manifest.json")) {
        return {
          ok: true,
          status: 200,
          headers: { get() { return null; } },
          async text() { return JSON.stringify(manifest); }
        };
      }
      if (url.endsWith("/" + manifest.packagePath) && packageBody != null) {
        return {
          ok: true,
          status: 200,
          headers: { get() { return null; } },
          async text() { return packageBody; }
        };
      }
      return { ok: false, status: 404, headers: { get() { return null; } }, async text() { return ""; } };
    }
  };

  vm.runInNewContext(source, sandbox, { filename: "v5-autonomous-test-ingame-updater.js" });
  await new Promise(resolve => setTimeout(resolve, 25));
  return { sandbox, calls, manifest };
}

test("native updater is Cloudflare-only, merchant-only and exposes no generic evaluator", () => {
  assert.ok(source.includes("https://aio-bot-dashboard.hansijuergenlul.workers.dev"));
  assert.ok(source.includes("coordinatorClass !== 'merchant'"));
  assert.ok(source.includes("upload_code"));
  assert.ok(source.includes("load_code"));
  assert.equal(source.includes("raw.githubusercontent.com"), false);
  assert.equal(/\beval\s*\(/.test(source), false);
  assert.equal(/new\s+Function\s*\(/.test(source), false);
  assert.equal(source.includes("socket.emit("), false);
  assert.equal(source.includes(".socket.emit("), false);
});

test("already-present desired test causes manifest check only and no reload", async () => {
  const { calls, sandbox } = await runScenario({
    current: {
      testId: "pr20-6-mluck-autonomous-live-5m",
      terminal: false
    }
  });
  assert.equal(calls.fetch.length, 1);
  assert.equal(calls.upload.length, 0);
  assert.equal(calls.load.length, 0);
  assert.equal(
    sandbox.V5AutonomousTestIngameUpdater.status().phase,
    "DESIRED_TEST_ALREADY_PRESENT"
  );
});

test("nonterminal different V5 test blocks replacement fail-closed", async () => {
  const { calls, sandbox } = await runScenario({
    current: { testId: "other-live-test", terminal: false }
  });
  assert.equal(calls.fetch.length, 1);
  assert.equal(calls.upload.length, 0);
  assert.equal(calls.load.length, 0);
  assert.equal(
    sandbox.V5AutonomousTestIngameUpdater.status().phase,
    "OTHER_V5_TEST_NONTERMINAL"
  );
});

test("terminal previous test is replaced by hash-verified persistent updater plus package", async () => {
  const packageBody = "(() => { globalThis.V5PR206MluckTest={version:'1.0.0',status:()=>({testId:'pr20-6-mluck-autonomous-live-5m'})}; })();\n// pr20-6-mluck-autonomous-live-5m";
  const { calls } = await runScenario({
    current: {
      testId: "pr20-5-merchant-stability-autonomous-4char",
      terminal: true
    },
    packageBody
  });

  assert.equal(calls.fetch.length, 2);
  assert.equal(calls.upload.length, 1);
  assert.equal(calls.load.length, 1);
  assert.equal(calls.load[0], 7);
  assert.equal(calls.upload[0][0], 7);
  assert.equal(calls.upload[0][1], "AIO V5");
  assert.ok(calls.upload[0][2].includes("installV5AutonomousTestIngameUpdater"));
  assert.ok(calls.upload[0][2].includes(packageBody));
});

test("wrong package hash blocks save and reload", async () => {
  const packageBody = "globalThis.V5PR206MluckTest={}; // pr20-6-mluck-autonomous-live-5m";
  const calls = { fetch: [], upload: [], load: [] };
  const badManifest = {
    schemaVersion: 1,
    enabled: true,
    repository: "Riflex91/Riflex91-Repo",
    branch: "main",
    gate: "PR20.6_MLUCK",
    testId: "pr20-6-mluck-autonomous-live-5m",
    controllerVersion: "1.0.0",
    coordinatorClass: "merchant",
    workerDistribution: "PACKAGE_OWNED_COMMAND_CHARACTER",
    sourceCommit: "d0823081da6f07a8a60002b1b809c24916555521",
    packagePath: "v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js",
    packageSha256: "0".repeat(64),
    maxPackageBytes: 131072,
    expectedGlobal: "V5PR206MluckTest",
    normalRuntimeAllowed: false
  };
  const sandbox = {
    console, crypto: webcrypto, TextEncoder, Uint8Array, ArrayBuffer, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    setTimeout, clearTimeout, setInterval(){return 1;}, clearInterval(){}, localStorage: storage(),
    character:{name:"Merchant",ctype:"merchant",hp:100,max_hp:100},
    get_entities(){return {};},
    get_active_code_slot(){return {slot:7,name:"AIO V5"};},
    async upload_code(...args){calls.upload.push(args);return true;},
    async load_code(slot){calls.load.push(slot);return true;},
    AIO_V3:{operations:{status(){return {v5AutonomousTest:{testId:"old",terminal:true}};}}},
    async fetch(url){
      calls.fetch.push(url);
      return {
        ok:true,status:200,headers:{get(){return null;}},
        async text(){return url.endsWith(".json")?JSON.stringify(badManifest):packageBody;}
      };
    }
  };
  vm.runInNewContext(source,sandbox);
  await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(calls.upload.length,0);
  assert.equal(calls.load.length,0);
  assert.equal(sandbox.V5AutonomousTestIngameUpdater.status().phase,"BLOCKED");
  assert.equal(sandbox.V5AutonomousTestIngameUpdater.status().error,"PACKAGE_SHA256_MISMATCH");
});
