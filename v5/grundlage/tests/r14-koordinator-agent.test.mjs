import test from "node:test";
import assert from "node:assert/strict";

import {
  AccountKoordinator,
  CharacterAgent,
  CharacterLebendigkeitsRegister,
  RosterWahrheit,
} from "../../erzeugt/index.js";

function aufbau() {
  const roster = new RosterWahrheit();
  roster.aktualisiere({
    schemaVersion: 1,
    accountId: "account-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    beobachtetAmMs: 100,
    fingerprint: "fp-1",
    mitglieder: [{ characterId: "warrior", sessionId: "s1" }],
  });
  const liveness = new CharacterLebendigkeitsRegister(1000);
  const agent = new CharacterAgent({
    accountId: "account-1",
    characterId: "warrior",
    sessionId: "s1",
    serverRegion: "EU",
    serverIdentifier: "I",
  });
  liveness.heartbeat(agent.heartbeat(100));
  const koordinator = new AccountKoordinator("account-1", roster, liveness, 500);
  return { roster, liveness, agent, koordinator };
}

test("Account Coordinator erteilt nur frischem Character auf aktuellem Roster Koordinationsfreigabe", () => {
  const { agent, koordinator } = aufbau();
  const token = koordinator.erteileKoordinationsFreigabe("warrior", "wf-1", 110, 400);
  assert.equal(token.gameplayAutoritaet, false);
  assert.equal(token.rawWriteAutoritaet, false);
  assert.equal(agent.akzeptiereKoordinationsFreigabe(token, koordinator, 120), true);
});

test("Roster-Wechsel entzieht alte Koordinationsfreigabe sofort", () => {
  const { roster, agent, koordinator } = aufbau();
  const token = koordinator.erteileKoordinationsFreigabe("warrior", "wf-1", 110, 400);
  roster.aktualisiere({
    schemaVersion: 1,
    accountId: "account-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    beobachtetAmMs: 130,
    fingerprint: "fp-2",
    mitglieder: [{ characterId: "warrior", sessionId: "s2" }],
  });
  assert.equal(agent.akzeptiereKoordinationsFreigabe(token, koordinator, 140), false);
});

test("Staler Character erhaelt keine neue Authority", () => {
  const { koordinator } = aufbau();
  assert.throws(
    () => koordinator.erteileKoordinationsFreigabe("warrior", "wf-2", 1200, 100),
    /KOORDINATOR_CHARACTER_STALE/,
  );
});

test("Character Agent akzeptiert keine Freigabe fuer andere Session oder Server", () => {
  const { koordinator } = aufbau();
  const token = koordinator.erteileKoordinationsFreigabe("warrior", "wf-1", 110, 400);
  const fremd = new CharacterAgent({
    accountId: "account-1",
    characterId: "warrior",
    sessionId: "s2",
    serverRegion: "EU",
    serverIdentifier: "II",
  });
  assert.equal(fremd.akzeptiereKoordinationsFreigabe(token, koordinator, 120), false);
});
