import test from "node:test";
import assert from "node:assert/strict";

import {
  CharacterLebendigkeitsRegister,
  RosterWahrheit,
} from "../../erzeugt/index.js";

function roster(sessionId = "s1", fingerprint = "fp1", zeit = 100) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    beobachtetAmMs: zeit,
    fingerprint,
    mitglieder: [
      { characterId: "merchant", sessionId: "m1" },
      { characterId: "warrior", sessionId },
    ],
  };
}

test("Roster-Ziel ist an aktuelle Epoche und Session gebunden", () => {
  const wahrheit = new RosterWahrheit();
  const erste = wahrheit.aktualisiere(roster());
  const ziel = wahrheit.bindeZiel("warrior");
  assert.equal(wahrheit.validiereZiel(ziel), true);

  const zweite = wahrheit.aktualisiere(roster("s2", "fp2", 110));
  assert.ok(zweite.rosterEpoche > erste.rosterEpoche);
  assert.equal(wahrheit.validiereZiel(ziel), false);
});

test("Restart verwirft persistierte Roster-Authority bis frische Beobachtung vorliegt", () => {
  const alt = new RosterWahrheit();
  const persistiert = alt.aktualisiere(roster());
  const ziel = alt.bindeZiel("warrior");

  const neu = new RosterWahrheit();
  neu.importiereNachRestart(persistiert);
  assert.equal(neu.sicht(), null);
  assert.equal(neu.validiereZiel(ziel), false);
  const frisch = neu.aktualisiere(roster("s1", "fp1", 200));
  assert.ok(frisch.rosterEpoche > persistiert.rosterEpoche);
});

test("Liveness wird stale und neue Session fenced alte Sitzungs-Epoche", () => {
  const register = new CharacterLebendigkeitsRegister(1000);
  const erste = register.heartbeat({
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "warrior",
    sessionId: "s1",
    serverRegion: "EU",
    serverIdentifier: "I",
    beobachtetAmMs: 100,
  });
  assert.equal(
    register.istFrisch("warrior", "s1", erste.sitzungsEpoche, "EU", "I", 1000),
    true,
  );
  assert.equal(
    register.istFrisch("warrior", "s1", erste.sitzungsEpoche, "EU", "I", 1101),
    false,
  );
  const zweite = register.heartbeat({
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "warrior",
    sessionId: "s2",
    serverRegion: "EU",
    serverIdentifier: "I",
    beobachtetAmMs: 1200,
  });
  assert.ok(zweite.sitzungsEpoche > erste.sitzungsEpoche);
  assert.equal(
    register.istFrisch("warrior", "s1", erste.sitzungsEpoche, "EU", "I", 1200),
    false,
  );
});

test("Restart markiert Liveness RECOVERY_PENDING und verlangt frischen Heartbeat", () => {
  const alt = new CharacterLebendigkeitsRegister(1000);
  const erste = alt.heartbeat({
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "warrior",
    sessionId: "s1",
    serverRegion: "EU",
    serverIdentifier: "I",
    beobachtetAmMs: 100,
  });
  const neu = new CharacterLebendigkeitsRegister(1000);
  neu.importiereNachRestart(alt.snapshot());
  assert.equal(neu.finde("warrior").status, "RECOVERY_PENDING");
  assert.equal(
    neu.istFrisch("warrior", "s1", erste.sitzungsEpoche, "EU", "I", 200),
    false,
  );
  const frisch = neu.heartbeat({
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "warrior",
    sessionId: "s1",
    serverRegion: "EU",
    serverIdentifier: "I",
    beobachtetAmMs: 200,
  });
  assert.ok(frisch.sitzungsEpoche > erste.sitzungsEpoche);
});
