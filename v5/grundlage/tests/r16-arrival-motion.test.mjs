import test from "node:test";
import assert from "node:assert/strict";

import {
  ReiseLedger,
  pinneBewegungsZiel,
  validiereBewegungsZielFrische,
} from "../../erzeugt/index.js";

function ziel() {
  return {
    schemaVersion: 1,
    reiseId: "reise-1",
    ablaufId: "wf-1",
    characterId: "warrior",
    serverRegion: "EU",
    serverIdentifier: "I",
    map: "main",
    instanz: "main",
    x: 100,
    y: 200,
    toleranz: 10,
    erstelltAmMs: 100,
    gueltigBisMs: 1000,
    zielFingerprint: "ziel-fp",
  };
}

test("Movement Return ist explizit kein Arrival-Beweis", () => {
  const ledger = new ReiseLedger();
  ledger.plane(ziel());
  ledger.beginneMovement("reise-1");
  const sicht = ledger.markiereMovementReturn("reise-1", true, 200, "move-return");
  assert.equal(sicht.zustand, "ARRIVAL_AUSSTEHEND");
  assert.equal(sicht.movementReturnIstArrivalBeweis, false);
});

test("Arrival braucht frische stabile beobachtete Postcondition", () => {
  const ledger = new ReiseLedger();
  ledger.plane(ziel());
  ledger.beginneMovement("reise-1");
  ledger.markiereMovementReturn("reise-1", true, 200, "move-return");
  assert.throws(() => ledger.verifiziereArrival("reise-1", {
    schemaVersion: 1,
    characterId: "warrior",
    serverRegion: "EU",
    serverIdentifier: "I",
    map: "main",
    instanz: "main",
    x: 100,
    y: 200,
    moving: true,
    rip: false,
    beobachtetAmMs: 210,
    positionsFingerprint: "pos-moving",
  }), /REISE_ARRIVAL_NOCH_NICHT_STABIL/);
  assert.equal(ledger.verifiziereArrival("reise-1", {
    schemaVersion: 1,
    characterId: "warrior",
    serverRegion: "EU",
    serverIdentifier: "I",
    map: "main",
    instanz: "main",
    x: 105,
    y: 203,
    moving: false,
    rip: false,
    beobachtetAmMs: 220,
    positionsFingerprint: "pos-arrived",
  }).zustand, "ANGEKOMMEN");
});

test("Travel Restart verlangt Reconciliation vor neuem Movement", () => {
  const alt = new ReiseLedger();
  alt.plane(ziel());
  alt.beginneMovement("reise-1");
  const neu = new ReiseLedger();
  neu.importiereNachRestart(alt.snapshot());
  assert.equal(neu.finde("reise-1").zustand, "RECOVERY_PENDING");
  assert.throws(() => neu.beginneMovement("reise-1"), /REISE_MOVEMENT_ZUSTAND_UNGUELTIG/);
  neu.schliesseRestartAbgleichAlsNeuZuPlanen("reise-1", "reconcile-fp");
  assert.equal(neu.beginneMovement("reise-1").zustand, "MOVEMENT_AUSSTEHEND");
});

function motion(overrides = {}) {
  return {
    schemaVersion: 1,
    entityId: "monster-1",
    entityFingerprint: "spawn-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    map: "main",
    instanz: "main",
    x: 0,
    y: 0,
    vx: 10,
    vy: 0,
    moving: true,
    visible: true,
    tot: false,
    beobachtetAmMs: 100,
    ...overrides,
  };
}

test("Moving Target Freshness ist motion-aware statt nur zeitbasiert", () => {
  const pin = pinneBewegungsZiel(motion(), 500, 5, 20);
  const ok = validiereBewegungsZielFrische(
    pin,
    motion({ x: 1, beobachtetAmMs: 200 }),
    250,
    "motion-ok",
  );
  assert.equal(ok.frisch, true);
  assert.ok(ok.vorhersageFehler <= 5);
  assert.throws(
    () => validiereBewegungsZielFrische(
      pin,
      motion({ x: 50, beobachtetAmMs: 200 }),
      250,
      "motion-drift",
    ),
    /MOTION_ZIEL_ZU_STARK_GEDRIFTET/,
  );
});

test("Moving Target stale oder neue Spawn-Identitaet wird verworfen", () => {
  const pin = pinneBewegungsZiel(motion(), 100, 5, 20);
  assert.throws(
    () => validiereBewegungsZielFrische(
      pin,
      motion({ beobachtetAmMs: 200 }),
      301,
      "stale",
    ),
    /MOTION_EVIDENCE_STALE/,
  );
  assert.throws(
    () => validiereBewegungsZielFrische(
      pin,
      motion({ entityFingerprint: "spawn-2", beobachtetAmMs: 200 }),
      200,
      "new-spawn",
    ),
    /MOTION_ZIEL_IDENTITAET_DRIFT/,
  );
});
