import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "..", "pr20-6-account-roster-x-recovery.js"), "utf8");

function sandboxWithCharacters(characters) {
  let controllerStarts = 0;
  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    character: { name: "My_Merchant", ctype: "merchant" },
    performance_trick() { return true; },
    X: { characters },
    V5PR206MluckTest: {
      version: "1.0.5",
      async start() { controllerStarts += 1; }
    }
  };
  sandbox.parent = sandbox;
  sandbox.controllerStarts = () => controllerStarts;
  return sandbox;
}

test("PR20.6 X.characters recovery exposes only My_Ranger1 among ranger rows", async () => {
  const sandbox = sandboxWithCharacters([
    { name: "My_Merchant", ctype: "merchant", online: true },
    { name: "Other_Ranger", ctype: "ranger", online: false },
    { name: "My_Ranger1", ctype: "ranger", online: false },
    { name: "My_Priest", ctype: "priest", online: true },
    { name: "My_Mage", ctype: "mage", online: true }
  ]);

  vm.runInNewContext(source, sandbox, { filename: "pr20-6-account-roster-x-recovery.js" });
  await Promise.resolve();
  await Promise.resolve();

  const status = sandbox.V5PR206AccountRosterXRecovery.status();
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.rangerName, "My_Ranger1");
  assert.equal(sandbox.controllerStarts(), 1);
  assert.equal(typeof sandbox.get_characters, "function");
  const fallback = sandbox.get_characters();
  const rangerNames = fallback
    .filter(row => String(row.ctype || row.type).toLowerCase() === "ranger")
    .map(row => row.name);
  assert.deepEqual(Array.from(rangerNames), ["My_Ranger1"]);
});

test("PR20.6 X.characters recovery fails closed when My_Ranger1 is absent", async () => {
  const sandbox = sandboxWithCharacters([
    { name: "My_Merchant", ctype: "merchant", online: true },
    { name: "Other_Ranger", ctype: "ranger", online: false },
    { name: "My_Priest", ctype: "priest", online: true },
    { name: "My_Mage", ctype: "mage", online: true }
  ]);

  vm.runInNewContext(source, sandbox, { filename: "pr20-6-account-roster-x-recovery.js" });
  await Promise.resolve();
  await Promise.resolve();

  const status = sandbox.V5PR206AccountRosterXRecovery.status();
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(Array.from(status.blocker), ["ACCOUNT_MY_RANGER1_FEHLT"]);
  assert.equal(sandbox.controllerStarts(), 0);
  assert.equal(typeof sandbox.get_characters, "undefined");
});
