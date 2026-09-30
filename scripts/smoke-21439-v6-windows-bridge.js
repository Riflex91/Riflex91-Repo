#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const bot = fs.readFileSync("bot.js", "utf8");
const host = fs.readFileSync("ops/windows-bridge/CdpAlBotV6Client.cs", "utf8");
const version = JSON.parse(fs.readFileSync("version.json", "utf8"));

assert(bot.includes("var VERSION = '2.14.39';"), "bot must be 2.14.39");
assert.strictEqual(version.version, "2.14.39", "version.json must advertise 2.14.39");
assert(bot.includes('"v6-windows-bridge-transport"'), "V6 transport feature must be protected");

for (const marker of [
  "product:'AL Bot'",
  "generation:6",
  "bridgeProtocol:'albot-v6-bridge-v1'",
  "transportOnly:true",
  "gameplayActionAuthority:false",
  "acceptsLegacyGenerations:false",
  "type:'ALBOT_V6_DEBUG_SNAPSHOT'",
  "type:'ALBOT_V6_DEBUG_EVENTS'",
  "type:'ALBOT_V6_TELEMETRY_ACK'"
]) {
  assert(bot.includes(marker), "missing browser V6 contract marker: " + marker);
}

for (const marker of [
  'public const string Product = "AL Bot"',
  'public const int Generation = 6',
  'public const string Protocol = "albot-v6-bridge-v1"',
  'public const string SnapshotType = "ALBOT_V6_DEBUG_SNAPSHOT"',
  'public const string EventsType = "ALBOT_V6_DEBUG_EVENTS"',
  'public const string AckType = "ALBOT_V6_TELEMETRY_ACK"'
]) {
  assert(host.includes(marker), "host/browser contract drift: " + marker);
}

const startMarker = "/* v2.14.39 V6 Windows Bridge transport adapter START */";
const endMarker = "/* v2.14.39 V6 Windows Bridge transport adapter END */";
const start = bot.indexOf(startMarker);
const end = bot.indexOf(endMarker);
assert(start >= 0 && end > start, "adapter block not found");
const adapter = bot.slice(start, end + endMarker.length);

let now = 1790760000000;
const stored = new Map();
const S = {
  auditRecent: [{
    at: now,
    iso: new Date(now).toISOString(),
    char: "My_Merchant",
    kind: "startup",
    level: "info",
    message: "started",
    data: { ok: true }
  }],
  running: true,
  disposed: false,
  status: "Farm",
  mode: "Merchant · Farm",
  target: "goo",
  lastAction: "attack",
  lastActionAt: now - 100,
  lastXPAt: now - 200,
  lastKillAt: now - 300,
  lastMoveAt: now - 400,
  dashboardTransport: "host",
  update: { latest: "2.14.39", available: false, checking: false, applying: false, checkedAt: now, error: "" }
};
const P = {};
const character = {
  name: "My_Merchant",
  ctype: "merchant",
  level: 80,
  hp: 900,
  max_hp: 1000,
  mp: 450,
  max_mp: 500,
  xp: 123,
  gold: 456,
  map: "main",
  x: 12,
  y: -7,
  moving: false,
  rip: false
};

const context = vm.createContext({
  console,
  P,
  S,
  character,
  me: character.name,
  VERSION: "2.14.39",
  WeakSet,
  Object,
  Array,
  Math,
  Number,
  String,
  Boolean,
  JSON,
  Date,
  isFinite,
  clock: () => ++now,
  read: (key, fallback) => stored.has(key) ? stored.get(key) : fallback,
  write: (key, value) => { stored.set(key, value); return true; },
  pos: () => ({ map: character.map, x: character.x, y: character.y }),
  currentRealm: () => ({ region: "EU", id: "I" }),
  partyState: () => ({ members: ["My_Merchant"], complete: false }),
  roleForName: () => "merchant",
  stateSnapshot: () => ({ hp: character.hp, token: "must-not-leak" }),
  audit: (kind, message, data, level) => {
    const row = {
      at: ++now,
      iso: new Date(now).toISOString(),
      char: character.name,
      kind,
      level: level || "info",
      message,
      data
    };
    S.auditRecent.push(row);
    return row;
  }
});

new vm.Script(adapter, { filename: "v6-adapter.js" }).runInContext(context);

assert(P.ALBot && P.ALBot.bridge, "adapter must publish parent.ALBot.bridge");
const bridge = P.ALBot.bridge;
assert.deepStrictEqual(
  Object.keys(bridge).sort(),
  ["acknowledgeTelemetry", "events", "identity", "peekTelemetry", "snapshot"].sort(),
  "transport surface must stay read/ack only"
);

const identity = bridge.identity();
assert.strictEqual(identity.product, "AL Bot");
assert.strictEqual(identity.generation, 6);
assert.strictEqual(identity.bridgeProtocol, "albot-v6-bridge-v1");
assert.strictEqual(identity.transportOnly, true);
assert.strictEqual(identity.gameplayActionAuthority, false);
assert.strictEqual(identity.acceptsLegacyGenerations, false);

const snapshot = bridge.snapshot({ deep: true });
assert.strictEqual(snapshot.type, "ALBOT_V6_DEBUG_SNAPSHOT");
assert.strictEqual(snapshot.character.name, "My_Merchant");
assert(snapshot.heartbeat.at > 0, "heartbeat required");
assert.strictEqual(snapshot.diagnostics.state.token, "[REDACTED]", "deep diagnostics must redact secrets");

S.auditRecent.push({
  at: ++now,
  iso: new Date(now).toISOString(),
  char: "My_Merchant",
  kind: "combat_attack",
  level: "info",
  message: "attack",
  data: { target: "goo", token: "must-not-leak" }
});

const batch = bridge.events(0, 200);
assert.strictEqual(batch.type, "ALBOT_V6_DEBUG_EVENTS");
assert(batch.events.length >= 1, "events must be exported");
const combat = batch.events.find(row => row.event === "combat_attack");
assert(combat, "new audit event must be visible");
assert.strictEqual(combat.data.token, "[REDACTED]", "event secrets must be redacted");
assert(batch.lastCapturedSeq >= combat.seq, "event sequence must be monotonic");

const ack = bridge.acknowledgeTelemetry(batch.lastCapturedSeq);
assert.strictEqual(ack.type, "ALBOT_V6_TELEMETRY_ACK");
assert.strictEqual(ack.supported, true);
assert.strictEqual(ack.remaining, 0, "acked events must leave transport queue");

const reset = bridge.events(batch.lastCapturedSeq + 999999, 10);
assert.strictEqual(reset.effectiveAfterSeq, reset.lastCapturedSeq, "future host cursor must reset safely");

for (const forbidden of ["move", "attack", "skill", "buy", "sell", "bank", "command", "action"]) {
  assert(!Object.prototype.hasOwnProperty.call(bridge, forbidden), "gameplay authority leaked: " + forbidden);
}

console.log("V6 Windows Bridge browser contract smoke: PASS");
