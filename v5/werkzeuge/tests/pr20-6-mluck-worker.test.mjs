import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("werkzeuge/pr20-6-mluck-worker.js", "utf8");

function storage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test("PR20.6 bridge worker is exact-target, performance-trick gated and no-write", async () => {
  const shared = storage();
  for (const [name, ctype] of [["My_Ranger1","ranger"],["My_Priest","priest"],["My_Mage","mage"]]) {
    let performanceCalls = 0;
    const sandbox = {
      console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
      localStorage: shared,
      setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
      clearTimeout,
      setInterval() { return 1; },
      clearInterval() {},
      performance_trick() { performanceCalls += 1; },
      sounds: { empty: { playing() { return true; } } },
      character: {
        name, ctype, id: name+"-session", map:"main",
        x:5,y:5,real_x:5,real_y:5,hp:1000,mp:1000,level:80,rip:false,s:{}
      },
      user_id:"same-account",
      server_region:"EU",
      server_identifier:"I"
    };
    sandbox.parent = sandbox;
    vm.runInNewContext(source, sandbox, { filename:"pr20-6-mluck-worker.js" });
    await new Promise(resolve => setTimeout(resolve, 15));
    const status = sandbox.V5PR206MluckWorker.status();
    assert.equal(status.testId, "pr20-6-mluck-autonomous-live-5m");
    assert.equal(status.active, true);
    assert.equal(status.name, name);
    assert.equal(status.ctype, ctype);
    assert.equal(status.performanceTrick, true);
    assert.ok(performanceCalls >= 1);
  }
  const registry = JSON.parse(shared.getItem("AIO_V5_PR20_6_MLUCK_ACTORS_V1"));
  assert.deepEqual(Object.keys(registry.actors).sort(), ["My_Mage","My_Priest","My_Ranger1"]);
  assert.equal(source.includes("use_skill("), false);
  assert.equal(source.includes("api_call("), false);
  assert.equal(source.includes("socket.emit("), false);
  assert.equal(source.includes("start_character("), false);
  assert.equal(source.includes("/disconnect "), false);
});

test("PR20.6 bridge worker blocks unknown farmer identity", async () => {
  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    localStorage: storage(),
    setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
    clearTimeout, setInterval() { throw new Error("timer must not start"); }, clearInterval() {},
    performance_trick() { throw new Error("performance_trick must not run for unknown target"); },
    sounds: { empty: { playing() { return true; } } },
    character: { name:"Other_Ranger", ctype:"ranger" }
  };
  sandbox.parent=sandbox;
  vm.runInNewContext(source,sandbox);
  await new Promise(resolve=>setTimeout(resolve,10));
  const status=sandbox.V5PR206MluckWorker.status();
  assert.equal(status.active,false);
  assert.equal(status.blocker,"PR20_6_BRIDGE_WORKER_TARGET_NOT_ALLOWED");
});
