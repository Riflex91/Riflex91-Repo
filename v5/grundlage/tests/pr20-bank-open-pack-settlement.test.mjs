import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  pruefeBankOpenPackBereitschaft,
  pruefeBankOpenPackSettlement,
  waehleBankOpenPackErstenKandidaten,
} from "../../erzeugt/index.js";

const fp = c => String(c).repeat(64).slice(0, 64);

function bindung(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "My_Merchant",
    sessionId: "My_Merchant",
    serverRegion: "EU",
    serverKennung: "I",
    leaseEpoche: 8,
    mountEpoche: 2000,
    beobachtetAmMs: 2000,
    map: "bank",
    bankPack: "items2",
    waehrung: "gold",
    goldKosten: 75000000,
    shellKosten: 600,
    characterGold: 15993820,
    characterShells: 0,
    packFreigeschaltet: false,
    bankRestFingerprint: fp("a"),
    fingerprint: fp("b"),
    transportStatus: "NONE",
    requestId: null,
    ...overrides,
  };
}

test("Open-Bank-Pack Kandidat entspricht dem real beobachteten ersten gesperrten Pack", () => {
  const k = waehleBankOpenPackErstenKandidaten([
    { pack: "items0", map: "bank", goldKosten: 0, shellKosten: 0, freigeschaltet: true },
    { pack: "items1", map: "bank", goldKosten: 0, shellKosten: 0, freigeschaltet: true },
    { pack: "items2", map: "bank", goldKosten: 75000000, shellKosten: 600, freigeschaltet: false },
    { pack: "items8", map: "bank_b", goldKosten: 0, shellKosten: 0, freigeschaltet: false },
  ], "bank");
  assert.deepEqual(k, {
    schemaVersion: 1,
    pack: "items2",
    map: "bank",
    goldKosten: 75000000,
    shellKosten: 600,
  });
});

test("Realer Shadow-Prestate blockiert Gold und Shells mangels Ressourcen", () => {
  const basis = {
    schemaVersion: 1,
    ctype: "merchant",
    lebt: true,
    idle: true,
    bankGemountet: true,
    alternativeRuntimeAktiv: false,
    offeneBankTransaktion: false,
    evidenceFrisch: true,
  };
  const gold = pruefeBankOpenPackBereitschaft({
    ...basis,
    bindung: bindung({ waehrung: "gold" }),
  });
  assert.equal(gold.status, "BLOCKIERT");
  assert.ok(gold.gruende.includes("BANK_OPEN_PACK_GOLD_ZU_NIEDRIG"));

  const shells = pruefeBankOpenPackBereitschaft({
    ...basis,
    bindung: bindung({ waehrung: "shells" }),
  });
  assert.equal(shells.status, "BLOCKIERT");
  assert.ok(shells.gruende.includes("BANK_OPEN_PACK_SHELLS_ZU_NIEDRIG"));
  assert.equal(shells.sameIntentErneutSenden, false);
});

test("Gold-Pfad bestaetigt nur Pack-Unlock plus exaktes Gold-Delta", () => {
  const vorher = bindung({
    characterGold: 80000000,
    fingerprint: fp("1"),
  });
  const nachher = bindung({
    beobachtetAmMs: 2001,
    characterGold: 5000000,
    packFreigeschaltet: true,
    fingerprint: fp("2"),
    transportStatus: "SUCCESS",
  });
  const r = pruefeBankOpenPackSettlement(vorher, nachher);
  assert.equal(r.status, "BESTAETIGT");
  assert.equal(r.grund, "BANK_OPEN_PACK_GOLD_EXAKT_BESTAETIGT");
  assert.equal(r.goldDelta, -75000000);
  assert.equal(r.shellDelta, 0);
});

test("Shell-Pfad behandelt IN_PROGRESS als AUSSTEHEND ohne Retry", () => {
  const vorher = bindung({
    waehrung: "shells",
    characterShells: 700,
    fingerprint: fp("3"),
    requestId: null,
  });
  const nachher = bindung({
    waehrung: "shells",
    characterShells: 700,
    beobachtetAmMs: 2001,
    fingerprint: fp("3"),
    transportStatus: "IN_PROGRESS",
    requestId: "request-123",
  });
  const r = pruefeBankOpenPackSettlement(vorher, nachher);
  assert.equal(r.status, "AUSSTEHEND");
  assert.equal(r.grund, "BANK_OPEN_PACK_SHELLS_BACKEND_IN_PROGRESS");
  assert.equal(r.sameIntentErneutSenden, false);
});

test("Shell-Pfad bestaetigt nur Pack-Unlock plus exaktes Shell-Delta", () => {
  const vorher = bindung({
    waehrung: "shells",
    characterShells: 700,
    fingerprint: fp("4"),
  });
  const nachher = bindung({
    waehrung: "shells",
    characterShells: 100,
    beobachtetAmMs: 2001,
    packFreigeschaltet: true,
    fingerprint: fp("5"),
    transportStatus: "SUCCESS",
    requestId: "request-456",
  });
  const r = pruefeBankOpenPackSettlement(vorher, nachher);
  assert.equal(r.status, "BESTAETIGT");
  assert.equal(r.grund, "BANK_OPEN_PACK_SHELLS_EXAKT_BESTAETIGT");
  assert.equal(r.goldDelta, 0);
  assert.equal(r.shellDelta, -600);
});

test("Teilwirkung oder Restbank-Drift bleibt fail-closed", () => {
  const vorher = bindung({ characterGold: 80000000, fingerprint: fp("6") });
  const teil = pruefeBankOpenPackSettlement(vorher, bindung({
    characterGold: 5000000,
    beobachtetAmMs: 2001,
    packFreigeschaltet: false,
    fingerprint: fp("7"),
  }));
  assert.equal(teil.status, "DRIFT");

  const rest = pruefeBankOpenPackSettlement(vorher, bindung({
    characterGold: 5000000,
    beobachtetAmMs: 2001,
    packFreigeschaltet: true,
    bankRestFingerprint: fp("8"),
    fingerprint: fp("9"),
  }));
  assert.equal(rest.status, "DRIFT");
});

test("Reale Open-Pack-Shadow-Evidence bleibt zero-write und Live gesperrt", () => {
  const evidence = JSON.parse(fs.readFileSync(
    "roadmap/pr20-2-bank-open-pack-shadow-evidence.json",
    "utf8",
  ));
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(evidence.kandidat.pack, "items2");
  assert.equal(evidence.kandidat.goldKosten, 75000000);
  assert.equal(evidence.kandidat.shellKosten, 600);
  assert.equal(evidence.zahlung.characterGold, 15993820);
  assert.equal(evidence.zahlung.characterShells, 0);
  assert.equal(evidence.zahlung.goldBezahlbar, false);
  assert.equal(evidence.zahlung.shellsBezahlbar, false);
  assert.equal(evidence.gameplayWrites, 0);
  assert.equal(evidence.mutatingPublicFunctionCalls, 0);
  assert.equal(evidence.liveMutationFreigegeben, false);
  assert.equal(evidence.liveStatus, "RESOURCE_BLOCKED_NO_LIVE_TEST");
});
