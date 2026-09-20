import test from "node:test";
import assert from "node:assert/strict";

import {
  CharacterLifecycleLedger,
  berechneGruppenCapabilities,
  pinnePartyWahrheit,
  pruefeSkillCapability,
} from "../../erzeugt/index.js";

function bindung(characterId, sessionId = "s1") {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId,
    sessionId,
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 5,
    rosterFingerprint: "roster-fp",
  };
}

test("Party Truth ist zeitgebundene Beobachtung statt langlebiger Authority", () => {
  const party = pinnePartyWahrheit({
    schemaVersion: 1,
    partyId: "party-1",
    beobachtetAmMs: 100,
    fingerprint: "party-fp",
    mitglieder: [{
      characterId: "priest",
      ctype: "priest",
      level: 80,
      map: "main",
      instanz: "main",
      x: 0,
      y: 0,
      rip: false,
      zielBindung: bindung("priest"),
    }],
  }, 120, 200);
  assert.equal(party.partyObjektIstLanglebigeAuthority, false);
  assert.throws(
    () => pinnePartyWahrheit({ ...party, beobachtetAmMs: 100 }, 301, 200),
    /PARTY_FRESHNESS_UNGUELTIG/,
  );
});

test("Skill Capability bindet Shared-Cooldown Session MP und Disabled-State", () => {
  const definition = {
    skillId: "heal",
    erlaubteKlassen: ["priest"],
    mindestLevel: 1,
    mpKosten: 100,
    cooldownDomaene: "attack",
    range: null,
    benoetigteEquipmentTags: [],
    hostile: false,
  };
  const evidence = {
    schemaVersion: 1,
    character: bindung("priest"),
    beobachtetAmMs: 100,
    ctype: "priest",
    level: 80,
    mp: 1000,
    rip: false,
    disabled: false,
    equipmentTags: [],
    equipmentFingerprint: "eq-fp",
    skillId: "heal",
    cooldownDomaene: "attack",
    nextReadyAmMs: 150,
    evidenceFingerprint: "skill-fp",
  };
  assert.equal(pruefeSkillCapability(definition, evidence, bindung("priest"), 160, 200).nutzbar, true);
  assert.equal(pruefeSkillCapability(
    definition,
    { ...evidence, nextReadyAmMs: 170 },
    bindung("priest"),
    160,
    200,
  ).grund, "COOLDOWN");
  assert.equal(pruefeSkillCapability(
    definition,
    { ...evidence, cooldownDomaene: "heal" },
    bindung("priest"),
    160,
    200,
  ).grund, "COOLDOWN_DOMAENE");
});

test("Death Respawn Rejoin gibt Authority erst nach frischer Rejoin-Evidence zurueck", () => {
  const ledger = new CharacterLifecycleLedger();
  const dead = ledger.beobachte({
    schemaVersion: 1,
    character: bindung("warrior"),
    beobachtetAmMs: 100,
    rip: true,
    hp: 0,
    mp: 100,
    evidenceFingerprint: "dead-fp",
  });
  assert.equal(dead.status, "TOT");
  assert.equal(dead.normaleCombatMovementAuthority, false);
  ledger.beginneRespawn("warrior");
  const response = ledger.bestaetigeRespawnResponse("warrior", "respawn-response");
  assert.equal(response.status, "REJOIN_AUSSTEHEND");
  assert.equal(response.normaleCombatMovementAuthority, false);
  const active = ledger.bestaetigeRejoin("warrior", {
    schemaVersion: 1,
    character: bindung("warrior"),
    beobachtetAmMs: 200,
    rip: false,
    hp: 1000,
    mp: 500,
    evidenceFingerprint: "rejoin-fp",
  }, 210, 100);
  assert.equal(active.status, "AKTIV");
  assert.equal(active.normaleCombatMovementAuthority, true);
});

test("Group Capability entsteht nur aus frischer aktiver Skill-Evidence", () => {
  const party = pinnePartyWahrheit({
    schemaVersion: 1,
    partyId: "p1",
    beobachtetAmMs: 100,
    fingerprint: "party-fp",
    mitglieder: [{
      characterId: "priest",
      ctype: "priest",
      level: 80,
      map: "main",
      instanz: "main",
      x: 0,
      y: 0,
      rip: false,
      zielBindung: bindung("priest"),
    }],
  }, 100, 500);
  const skill = {
    skillId: "heal",
    nutzbar: true,
    grund: null,
    cooldownDomaene: "attack",
    evidenceFingerprint: "heal-fp",
  };
  const caps = berechneGruppenCapabilities(party, [{
    characterId: "priest",
    sessionId: "s1",
    lifecycleAktiv: true,
    beobachtetAmMs: 120,
    evidenceFingerprint: "member-fp",
    capabilities: [{ capability: "HEAL", skill }],
  }], 130, 100);
  assert.equal(caps.find(x => x.capability === "HEAL").verfuegbar, true);
  assert.equal(caps.find(x => x.capability === "AOE").verfuegbar, false);
});
