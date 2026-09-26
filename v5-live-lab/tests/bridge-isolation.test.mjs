import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("browser/v5-live-lab-bot-v2.js", "utf8");

test("Live Lab v2 has no Windows Bridge or external host transport", () => {
  const forbidden = [
    { name: "fetch", pattern: /\bfetch\s*\(/ },
    { name: "WebSocket", pattern: /\bnew\s+WebSocket\s*\(|\bWebSocket\s*\(/ },
    { name: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
    { name: "EventSource", pattern: /\bEventSource\b/ },
    { name: "BroadcastChannel", pattern: /\bBroadcastChannel\b/ },
    { name: "postMessage", pattern: /\.postMessage\s*\(/ },
    { name: "Supabase", pattern: /\bsupabase\b/i },
    { name: "Windows Bridge app", pattern: /AioBotWindowsBridge|windows-bridge/i },
    { name: "CDP control", pattern: /call_code_function_f|webSocketDebuggerUrl|127\.0\.0\.1:9222|localhost:9222/i },
    { name: "debug ingest", pattern: /bot-debug-ingest|bot-chatgpt-signal-control/i },
    { name: "remote push API", pattern: /\/api\/push(?:frame)?\b/i },
  ];

  for (const row of forbidden) {
    assert.equal(
      row.pattern.test(source),
      false,
      "forbidden external/bridge transport found: " + row.name,
    );
  }

  assert.match(source, /const VERIFICATION_ONLY = true;/);
  assert.match(source, /const WINDOWS_BRIDGE_COMMUNICATION = false;/);
  assert.match(source, /const EXTERNAL_HOST_TRANSPORT = false;/);
  assert.match(source, /ADVENTURE_LAND_PUBLIC_FUNCTIONS_ONLY/);
});

test("runtime reports verification-only bridge isolation while retaining direct local evidence I/O", () => {
  let nowMs = 1_000_000;
  const root = {
    character: {
      name: "Verifier",
      ctype: "ranger",
      map: "main",
      x: 0,
      y: 0,
      hp: 1000,
      max_hp: 1000,
      mp: 500,
      max_mp: 500,
      level: 1,
      items: [],
      slots: {},
      isize: 42,
      q: {},
      s: {},
    },
    entities: {},
    G: { monsters: {}, maps: {} },
    S: {},
    server_region: "EU",
    server_identifier: "I",
    current_map: "main",
    get_party: () => ({ Verifier: { name: "Verifier" } }),
    get_player: () => null,
    attack: async () => true,
    use_skill: async () => true,
    smart_move: async () => true,
    loot: async () => true,
    respawn: async () => true,
    send_cm: async () => true,
    change_server: async () => true,
    buy: async () => true,
    sell: async () => true,
    exchange: async () => true,
    upgrade: async () => true,
    compound: async () => true,
    craft: async () => true,
    send_item: async () => true,
    send_gold: async () => true,
    bank_store: async () => true,
    bank_retrieve: async () => true,
    bank_swap: async () => true,
    join: async () => true,
    localStorage: { getItem: () => null, setItem() {} },
    document: {
      body: null,
      head: null,
      documentElement: null,
      getElementById: () => null,
      querySelector: () => null,
    },
    navigator: {},
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: () => 1,
    clearTimeout() {},
    Date: { now: () => nowMs },
  };
  root.globalThis = root;
  root.window = root;
  root.parent = root;

  vm.createContext(root);
  vm.runInContext(source, root, { filename: "v5-live-lab-bot-v2.js" });

  const isolation = root.V5LiveLab.bridgeIsolation();
  const status = root.V5LiveLab.status();

  assert.equal(root.V5LiveLab.version, "0.6.1");
  assert.equal(root.V5LiveLab.buildId, "V5_LIVE_LAB_FULL_AUTONOMY_R9_2");
  assert.equal(isolation.verificationOnly, true);
  assert.equal(isolation.windowsBridgeCommunication, false);
  assert.equal(isolation.externalHostTransport, false);
  assert.equal(isolation.cdpTransport, false);
  assert.equal(isolation.httpTransport, false);
  assert.equal(isolation.webSocketTransport, false);
  assert.equal(isolation.supabaseTransport, false);
  assert.equal(isolation.localSituationFileDirectBrowserIo, true);
  assert.equal(isolation.transportPolicy, "ADVENTURE_LAND_PUBLIC_FUNCTIONS_ONLY");
  assert.equal(status.verificationOnly, true);
  assert.equal(status.windowsBridgeCommunication, false);
  assert.equal(status.externalHostTransport, false);
});
