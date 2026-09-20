import test from "node:test";
import assert from "node:assert/strict";

import {
  AblaufScheduler,
  MerchantDemandInbox,
  MerchantTaskKoordinator,
  MerchantWorkflowProvider,
  erzeugeMLuckDemand,
  planeMLuckService,
  verifiziereMLuckSettlement,
} from "../../erzeugt/index.js";

const wissensSnapshot = {
  gitCommit: "a".repeat(40),
  quellenSha256: ["b".repeat(64)],
};

function bindung(characterId, sessionId = "session-1") {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId,
    sessionId,
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 4,
    rosterFingerprint: "roster-fp",
  };
}

function skillDefinition() {
  return {
    skillId: "mluck",
    erlaubteKlassen: ["merchant"],
    mindestLevel: 1,
    mpKosten: 10,
    cooldownDomaene: "skill:mluck",
    range: 320,
    benoetigteEquipmentTags: [],
    hostile: false,
  };
}

function skillEvidence(overrides = {}) {
  const merchant = bindung("merchant", "merchant-session");
  return {
    schemaVersion: 1,
    character: merchant,
    beobachtetAmMs: 100,
    ctype: "merchant",
    level: 90,
    mp: 5000,
    rip: false,
    disabled: false,
    equipmentTags: [],
    equipmentFingerprint: "eq-fp",
    skillId: "mluck",
    cooldownDomaene: "skill:mluck",
    nextReadyAmMs: 0,
    evidenceFingerprint: "skill-fp",
    ...overrides,
  };
}

function ziel(characterId, overrides = {}) {
  return {
    schemaVersion: 1,
    ziel: bindung(characterId, characterId + "-session"),
    topologieRang: 1,
    beobachtetAmMs: 100,
    gueltigBisMs: 500,
    tot: false,
    erreichbar: true,
    inReichweite: true,
    wirkungAktiv: false,
    wirkungVerbleibendMs: null,
    wirkungFingerprint: "effect-" + characterId,
    naechsterVersuchAbMs: null,
    ...overrides,
  };
}

function anfrage(overrides = {}) {
  const merchant = bindung("merchant", "merchant-session");
  return {
    merchant,
    skillDefinition: skillDefinition(),
    skillEvidence: skillEvidence({ character: merchant }),
    ziele: [ziel("farmer")],
    aktiveDemandZiele: [],
    richtlinie: {
      richtlinienVersion: "mluck-v1",
      refreshVorlaufMs: 300_000,
      maximalesZielAlterMs: 1_000,
      maximalesSkillEvidenceAlterMs: 1_000,
      servicePrioritaetsRang: 250,
    },
    ...overrides,
  };
}

test("MLuck priorisiert fehlende Wirkung deterministisch vor auslaufender Wirkung", () => {
  const entscheidung = planeMLuckService(anfrage({
    ziele: [
      ziel("farmer-a", {
        topologieRang: 0,
        wirkungAktiv: true,
        wirkungVerbleibendMs: 10_000,
      }),
      ziel("farmer-b", {
        topologieRang: 4,
        wirkungAktiv: false,
      }),
    ],
  }), 200);

  assert.equal(entscheidung.art, "DEMAND_ERZEUGEN");
  assert.equal(entscheidung.ziel?.ziel.characterId, "farmer-b");
  assert.equal(entscheidung.grund, "MLUCK_FEHLT");
  assert.equal(entscheidung.prioritaetsKlasse, "OPTIMIERUNG");
  assert.equal(entscheidung.prioritaetsRang, 250);
  assert.equal(entscheidung.ausfuehrungsAutoritaet, false);
  assert.equal(entscheidung.gameplayAutoritaet, false);
  assert.equal(entscheidung.rawWriteAutoritaet, false);
});

test("MLuck-Demand bleibt Optimierung und verdrängt Safety-Arbeit nicht", () => {
  const entscheidung = planeMLuckService(anfrage(), 200);
  const mluck = erzeugeMLuckDemand(entscheidung, {
    demandId: "mluck-1",
    erstelltAmMs: 200,
    deadlineAmMs: 1_000,
    ressourcenIds: [],
    wissensSnapshot,
  });
  assert.ok(mluck);
  assert.equal(mluck.art, "MLUCK_SERVICE");
  assert.equal(mluck.prioritaetsKlasse, "OPTIMIERUNG");
  assert.equal(mluck.prioritaetsRang, 250);

  const inbox = new MerchantDemandInbox();
  const provider = new MerchantWorkflowProvider();
  const scheduler = new AblaufScheduler(32, 1_000);
  const koordinator = new MerchantTaskKoordinator(
    inbox,
    provider,
    scheduler,
  );

  inbox.legeAn(mluck);
  inbox.legeAn({
    schemaVersion: 1,
    demandId: "safety-1",
    art: "NPC_BUY",
    characterId: "merchant",
    accountId: null,
    erstelltAmMs: 200,
    deadlineAmMs: 1_000,
    prioritaetsKlasse: "SICHERHEIT",
    prioritaetsRang: 999_999,
    ressourcenIds: [],
    payloadFingerprint: "safety-fp",
    wissensSnapshot,
  });
  koordinator.planeOffene(200);

  const gestartet = koordinator.starteNaechsten(201);
  assert.equal(gestartet?.demand.demandId, "safety-1");
  assert.equal(
    inbox.sicht().find(x => x.demand.demandId === "mluck-1")?.status,
    "GEPLANT",
  );
});

test("gesunde Wirkung erzeugt keinen Demand und unbekannter Ablauf verlangt Beobachtung", () => {
  const gesund = planeMLuckService(anfrage({
    ziele: [ziel("farmer", {
      wirkungAktiv: true,
      wirkungVerbleibendMs: 600_000,
    })],
  }), 200);
  assert.equal(gesund.art, "KEINE_AKTION");
  assert.equal(gesund.grund, "MLUCK_ALLE_WIRKUNGEN_GESUND");
  assert.equal(erzeugeMLuckDemand(gesund, {
    demandId: "unused",
    erstelltAmMs: 200,
    deadlineAmMs: 500,
    ressourcenIds: [],
    wissensSnapshot,
  }), null);

  const unbekannt = planeMLuckService(anfrage({
    ziele: [ziel("farmer", {
      wirkungAktiv: true,
      wirkungVerbleibendMs: null,
    })],
  }), 200);
  assert.equal(unbekannt.art, "BEOBACHTUNG_ERFORDERLICH");
  assert.equal(unbekannt.grund, "MLUCK_ABLAUF_UNBEKANNT");
});

test("stale Ziel-Evidence oder Skill-Cooldown autorisieren keinen Service", () => {
  const stale = planeMLuckService(anfrage({
    ziele: [ziel("farmer", {
      beobachtetAmMs: 0,
      gueltigBisMs: 500,
    })],
    richtlinie: {
      ...anfrage().richtlinie,
      maximalesZielAlterMs: 100,
    },
  }), 200);
  assert.equal(stale.art, "BEOBACHTUNG_ERFORDERLICH");
  assert.equal(stale.grund, "MLUCK_ZIEL_EVIDENCE_STALE");

  const cooldown = planeMLuckService(anfrage({
    skillEvidence: skillEvidence({
      character: bindung("merchant", "merchant-session"),
      nextReadyAmMs: 500,
    }),
  }), 200);
  assert.equal(cooldown.art, "GESPERRT");
  assert.equal(cooldown.grund, "MLUCK_SKILL_COOLDOWN");
});

test("aktive Demand-, Anti-Spam- und Reichweiten-Grenzen blockieren Doppelarbeit", () => {
  const aktiv = planeMLuckService(anfrage({
    aktiveDemandZiele: ["farmer"],
  }), 200);
  assert.equal(aktiv.art, "KEINE_AKTION");
  assert.equal(aktiv.grund, "MLUCK_DEMAND_BEREITS_AKTIV");

  const antiSpam = planeMLuckService(anfrage({
    ziele: [ziel("farmer", {
      naechsterVersuchAbMs: 500,
    })],
  }), 200);
  assert.equal(antiSpam.art, "KEINE_AKTION");
  assert.equal(antiSpam.grund, "MLUCK_ANTISPAM_AKTIV");

  const range = planeMLuckService(anfrage({
    ziele: [ziel("farmer", {
      inReichweite: false,
    })],
  }), 200);
  assert.equal(range.art, "KEINE_AKTION");
  assert.equal(range.grund, "MLUCK_ZIEL_AUSSER_REICHWEITE");
});

test("MLuck-Settlement verlangt dieselbe frische Ziel-Session und beobachtete Wirkung", () => {
  const entscheidung = planeMLuckService(anfrage(), 200);
  const nachweis = verifiziereMLuckSettlement(
    entscheidung,
    {
      schemaVersion: 1,
      ziel: bindung("farmer", "farmer-session"),
      beobachtetAmMs: 210,
      gueltigBisMs: 500,
      wirkungAktiv: true,
      wirkungVerbleibendMs: 1_000_000,
      wirkungFingerprint: "effect-new",
    },
    220,
  );
  assert.equal(nachweis.bestaetigt, true);
  assert.equal(nachweis.zielCharacterId, "farmer");
  assert.equal(nachweis.ausfuehrungsAutoritaet, false);

  assert.throws(
    () => verifiziereMLuckSettlement(
      entscheidung,
      {
        schemaVersion: 1,
        ziel: bindung("farmer", "new-session"),
        beobachtetAmMs: 210,
        gueltigBisMs: 500,
        wirkungAktiv: true,
        wirkungVerbleibendMs: 1_000_000,
        wirkungFingerprint: "effect-new",
      },
      220,
    ),
    /MLUCK_SETTLEMENT_ZIEL_DRIFT/,
  );

  assert.throws(
    () => verifiziereMLuckSettlement(
      entscheidung,
      {
        schemaVersion: 1,
        ziel: bindung("farmer", "farmer-session"),
        beobachtetAmMs: 210,
        gueltigBisMs: 500,
        wirkungAktiv: false,
        wirkungVerbleibendMs: null,
        wirkungFingerprint: "effect-missing",
      },
      220,
    ),
    /MLUCK_SETTLEMENT_WIRKUNG_FEHLT/,
  );
});

test("Roster-Drift zwischen Merchant und Ziel wird fail-closed abgelehnt", () => {
  assert.throws(
    () => planeMLuckService(anfrage({
      ziele: [ziel("farmer", {
        ziel: {
          ...bindung("farmer", "farmer-session"),
          rosterEpoche: 5,
        },
      })],
    }), 200),
    /MLUCK_ZIEL_ROSTER_DRIFT/,
  );
});
