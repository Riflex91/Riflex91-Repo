import test from "node:test";
import assert from "node:assert/strict";

import {
  BewegungsOwnerLedger,
  TargetOwnershipLedger,
} from "../../erzeugt/index.js";

function target(overrides = {}) {
  return {
    schemaVersion: 1,
    entityId: "m-1",
    entityFingerprint: "spawn-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    map: "main",
    instanz: "main",
    x: 10,
    y: 20,
    vx: 0,
    vy: 0,
    moving: false,
    visible: true,
    tot: false,
    beobachtetAmMs: 100,
    ...overrides,
  };
}

test("Raw Target ist keine fachliche Target-Ownership", () => {
  const ledger = new TargetOwnershipLedger();
  const token = ledger.beanspruche("wf-a", "warrior", target(), 120, 500, 100);
  assert.equal(token.rawTargetIstAuthority, false);
  assert.equal(ledger.validiere(token, target({ beobachtetAmMs: 150 }), 160), true);
  assert.throws(
    () => ledger.beanspruche("wf-b", "warrior", target({ beobachtetAmMs: 160 }), 160, 500, 100),
    /TARGET_BEREITS_FACHLICH_BELEGT/,
  );
});

test("Target-Ownership verlangt frische aktuelle Entity-Evidence", () => {
  const ledger = new TargetOwnershipLedger();
  const token = ledger.beanspruche("wf-a", "warrior", target(), 120, 500, 100);
  assert.equal(ledger.validiere(token, target({ beobachtetAmMs: 130 }), 240), false);
  assert.equal(
    ledger.validiere(token, target({ entityFingerprint: "spawn-2", beobachtetAmMs: 200 }), 200),
    false,
  );
});

test("Target-Ownership Restart fenced alte Tokens bis Abgleich", () => {
  const alt = new TargetOwnershipLedger();
  const token = alt.beanspruche("wf-a", "warrior", target(), 120, 500, 100);
  const neu = new TargetOwnershipLedger();
  neu.importiereNachRestart(alt.snapshot());
  assert.equal(neu.validiere(token, target({ beobachtetAmMs: 130 }), 130), false);
  assert.throws(
    () => neu.beanspruche("wf-b", "warrior", target({ beobachtetAmMs: 140 }), 140, 500, 100),
    /TARGET_OWNERSHIP_ABGLEICH_ERFORDERLICH/,
  );
  neu.schliesseAbgleichAb(token.ressourcenId, token.epoche);
  const fresh = neu.beanspruche("wf-b", "warrior", target({ beobachtetAmMs: 150 }), 150, 500, 100);
  assert.ok(fresh.epoche > token.epoche);
});

test("Movement Owner verhindert Travel/Kite Pingpong", () => {
  const ledger = new BewegungsOwnerLedger(8, 250);
  const travel = ledger.beanspruche("warrior", "wf-travel", "TRAVEL", "travel-fp", 100, 1000);
  assert.equal(ledger.validiere(travel, 200), true);
  assert.throws(
    () => ledger.beanspruche("warrior", "wf-kite", "KITE", "kite-fp", 200, 1000),
    /BEWEGUNG_BEREITS_BELEGT/,
  );
  ledger.gibFrei(travel, 300);
  assert.throws(
    () => ledger.beanspruche("warrior", "wf-kite", "KITE", "kite-fp", 400, 1000),
    /BEWEGUNGS_HANDOFF_SPERRFRIST/,
  );
  assert.equal(
    ledger.beanspruche("warrior", "wf-kite", "KITE", "kite-fp", 551, 1000).zweck,
    "KITE",
  );
});

test("Safety darf normalen Movement Owner preempten aber nicht Safety pingpongen", () => {
  const ledger = new BewegungsOwnerLedger();
  const normal = ledger.beanspruche("warrior", "wf-kite", "KITE", "kite-fp", 100, 1000);
  const safety = ledger.beanspruche("warrior", "wf-safe", "SAFETY", "safe-fp", 200, 500);
  assert.ok(safety.epoche > normal.epoche);
  assert.equal(ledger.validiere(normal, 200), false);
  assert.throws(
    () => ledger.beanspruche("warrior", "wf-safe-2", "SAFETY", "safe2-fp", 210, 500),
    /BEWEGUNG_BEREITS_BELEGT/,
  );
});
