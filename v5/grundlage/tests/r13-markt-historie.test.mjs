import test from "node:test";
import assert from "node:assert/strict";

import {
  GegenstandsDispositionsLedger,
  MarktHistorie,
  MerchantWorkflowProvider,
  bewerteNpcVerkauf,
  erzeugeMarktBeobachtenDemand,
  erzeugeNpcWertEvidenceAusMarkt,
  pinneListingEvidence,
} from "../../erzeugt/index.js";

const wissensSnapshot = {
  gitCommit: "a".repeat(40),
  quellenSha256: ["b".repeat(64)],
};

function listing({
  target = "buyer-a",
  slot = "trade1",
  rid = "rid-1",
  seite = "BUY",
  preis = 120,
  menge = 10,
  beobachtet = 100,
  gueltigBis = 500,
  name = "iron",
  level = 0,
} = {}) {
  return pinneListingEvidence({
    schemaVersion: 1,
    targetCharacterId: target,
    tradeSlot: slot,
    rid,
    seite,
    itemName: name,
    level,
    unitPrice: preis,
    menge,
    beobachtetAmMs: beobachtet,
    gueltigBisMs: gueltigBis,
  }, beobachtet);
}

function richtlinie(overrides = {}) {
  return {
    richtlinienVersion: "market-v1",
    maximalesReferenzAlterMs: 400,
    minimaleKaufBeobachtungen: 2,
    minimaleGesamtBeobachtungen: 3,
    ...overrides,
  };
}

test("Markt-Historie bildet konservativen Sell-Referenzwert aus frischen Kauf-Listings", () => {
  const historie = new MarktHistorie();
  historie.erfasseListing(listing({
    target: "buyer-a",
    rid: "rid-a",
    preis: 120,
  }), 150);
  historie.erfasseListing(listing({
    target: "buyer-b",
    rid: "rid-b",
    preis: 100,
  }), 150);
  historie.erfasseListing(listing({
    target: "seller-a",
    rid: "rid-c",
    seite: "SELL",
    preis: 150,
  }), 150);

  const analyse = historie.analysiere(
    "iron",
    0,
    200,
    richtlinie(),
  );

  assert.equal(analyse.verwendbar, true);
  assert.equal(analyse.aktuelleBeobachtungen, 3);
  assert.equal(analyse.aktuelleKaufBeobachtungen, 2);
  assert.equal(analyse.aktuelleVerkaufBeobachtungen, 1);
  assert.equal(analyse.hoechsterKaufpreis, 120);
  assert.equal(analyse.niedrigsterVerkaufspreis, 150);
  assert.equal(analyse.spreadBp, 2000);
  assert.equal(analyse.konservativerReferenzwertProEinheit, 120);
  assert.equal(analyse.planungsNachweis, true);
  assert.equal(analyse.ausfuehrungsAutoritaet, false);
  assert.equal(analyse.gameplayAutoritaet, false);
  assert.equal(analyse.rawWriteAutoritaet, false);
});

test("mehrere Beobachtungen desselben Listings zaehlen aktuell nur einmal", () => {
  const historie = new MarktHistorie();
  historie.erfasseListing(listing({
    target: "buyer-a",
    rid: "rid-a",
    preis: 90,
    beobachtet: 100,
  }), 110);
  historie.erfasseListing(listing({
    target: "buyer-a",
    rid: "rid-a",
    preis: 110,
    beobachtet: 150,
    gueltigBis: 500,
  }), 160);
  historie.erfasseListing(listing({
    target: "buyer-b",
    rid: "rid-b",
    preis: 100,
    beobachtet: 150,
    gueltigBis: 500,
  }), 160);

  const analyse = historie.analysiere(
    "iron",
    0,
    200,
    richtlinie({
      minimaleGesamtBeobachtungen: 2,
    }),
  );

  assert.equal(analyse.aktuelleBeobachtungen, 2);
  assert.equal(analyse.aktuelleKaufBeobachtungen, 2);
  assert.equal(analyse.hoechsterKaufpreis, 110);
});

test("gekreuzte oder unzureichende Markt-Evidence wird nicht als Referenzwert verwendet", () => {
  const historie = new MarktHistorie();
  historie.erfasseListing(listing({
    target: "buyer-a",
    rid: "rid-a",
    preis: 160,
  }), 150);
  historie.erfasseListing(listing({
    target: "buyer-b",
    rid: "rid-b",
    preis: 155,
  }), 150);
  historie.erfasseListing(listing({
    target: "seller-a",
    rid: "rid-c",
    seite: "SELL",
    preis: 150,
  }), 150);

  const gekreuzt = historie.analysiere(
    "iron",
    0,
    200,
    richtlinie(),
  );
  assert.equal(gekreuzt.verwendbar, false);
  assert.ok(
    gekreuzt.gruende.includes("MARKT_PREIS_EVIDENCE_WIDERSPRUCH"),
  );
  assert.equal(gekreuzt.konservativerReferenzwertProEinheit, null);

  const leer = new MarktHistorie().analysiere(
    "iron",
    0,
    200,
    richtlinie(),
  );
  assert.equal(leer.verwendbar, false);
  assert.deepEqual(leer.gruende, ["MARKT_HISTORIE_FEHLT"]);
});

test("stale Listing-Evidence erzeugt Beobachtungsbedarf statt Preisautoritaet", () => {
  const historie = new MarktHistorie();
  historie.erfasseListing(listing({
    target: "buyer-a",
    rid: "rid-a",
    preis: 120,
    beobachtet: 100,
    gueltigBis: 150,
  }), 120);

  const analyse = historie.analysiere(
    "iron",
    0,
    200,
    richtlinie({
      minimaleKaufBeobachtungen: 1,
      minimaleGesamtBeobachtungen: 1,
    }),
  );
  assert.equal(analyse.verwendbar, false);

  const demand = erzeugeMarktBeobachtenDemand(analyse, {
    demandId: "market-observe-1",
    characterId: "merchant",
    erstelltAmMs: 200,
    deadlineAmMs: 500,
    prioritaetsKlasse: "OPTIMIERUNG",
    prioritaetsRang: 100,
    ressourcenIds: ["character:merchant:inventory"],
    wissensSnapshot,
  });
  assert.ok(demand);
  assert.equal(demand.art, "MARKT_BEOBACHTEN");

  const plan = new MerchantWorkflowProvider().plane(demand);
  assert.equal(plan.gameplayAutoritaet, false);
  assert.equal(plan.rawWriteAutoritaet, false);
});

test("verwendbare Markt-Evidence erzeugt keinen unnoetigen Beobachtungs-Demand", () => {
  const historie = new MarktHistorie();
  historie.erfasseListing(listing({
    target: "buyer-a",
    rid: "rid-a",
    preis: 120,
  }), 150);
  historie.erfasseListing(listing({
    target: "seller-a",
    rid: "rid-b",
    seite: "SELL",
    preis: 150,
  }), 150);

  const analyse = historie.analysiere(
    "iron",
    0,
    200,
    richtlinie({
      minimaleKaufBeobachtungen: 1,
      minimaleGesamtBeobachtungen: 2,
    }),
  );
  assert.equal(analyse.verwendbar, true);
  assert.equal(
    erzeugeMarktBeobachtenDemand(analyse, {
      demandId: "market-observe-unused",
      characterId: "merchant",
      erstelltAmMs: 200,
      deadlineAmMs: 500,
      prioritaetsKlasse: "OPTIMIERUNG",
      prioritaetsRang: 100,
      ressourcenIds: [],
      wissensSnapshot,
    }),
    null,
  );
});

test("Markt-Referenzwert integriert fail-closed mit CAP-032 Sell-Safety", () => {
  const historie = new MarktHistorie();
  historie.erfasseListing(listing({
    target: "buyer-a",
    rid: "rid-a",
    preis: 120,
  }), 150);
  historie.erfasseListing(listing({
    target: "buyer-b",
    rid: "rid-b",
    preis: 100,
  }), 150);

  const analyse = historie.analysiere(
    "iron",
    0,
    200,
    richtlinie({
      minimaleGesamtBeobachtungen: 2,
    }),
  );
  const wertEvidence = erzeugeNpcWertEvidenceAusMarkt(
    analyse,
    {
      name: "iron",
      level: 0,
      npcVerkaufProEinheit: 60,
      beobachtetAmMs: 190,
      gueltigBisMs: 400,
      fingerprint: "npc-value-fp",
    },
    200,
  );

  assert.equal(wertEvidence.konservativerReferenzwertProEinheit, 120);

  const item = {
    schemaVersion: 1,
    characterId: "merchant",
    inventarIndex: 5,
    name: "iron",
    level: 0,
    menge: 10,
    beobachtungsFingerprint: "item-fp",
    beobachtetAmMs: 190,
  };
  const ledger = new GegenstandsDispositionsLedger();
  ledger.setze({
    identitaet: item,
    disposition: "NPC_VERKAUF",
    begruendung: "nur bei sauberer Value-Evidence",
    policyVersion: "merchant-policy-1",
  });

  const bewertung = bewerteNpcVerkauf({
    identitaet: item,
    metadaten: {
      schemaVersion: 1,
      name: "iron",
      typ: "material",
      maximaleStackMenge: 9999,
      quest: false,
      exchange: false,
      event: false,
      cash: false,
      soulbound: false,
      upgrade: false,
      compound: false,
      strukturelleSignale: [],
      spezialSignale: [],
      konflikt: false,
      beobachtetAmMs: 190,
      gueltigBisMs: 400,
      fingerprint: "meta-fp",
    },
    wert: wertEvidence,
    physik: {
      gesperrt: false,
      blockiert: false,
      spezialKennung: null,
    },
    dispositionen: ledger,
    richtlinie: {
      richtlinienVersion: "sell-v1",
      erlaubteMetadatenTypen: ["material"],
      referenzwertErforderlich: true,
      minimalerNpcAnteilAmReferenzwertBp: 6000,
      maximalerAutomatischerGesamtwert: 10_000,
      maximalesIdentitaetsAlterMs: 100,
    },
  }, 200);

  assert.equal(bewertung.art, "GESPERRT");
  assert.deepEqual(
    bewertung.gruende,
    ["VERKAUF_NPC_WERT_ZU_WEIT_UNTER_REFERENZ"],
  );
});

test("Markt-Historie bleibt bounded und entfernt deterministisch den aeltesten Item-Key", () => {
  const historie = new MarktHistorie(2, 2);
  historie.erfasseListing(listing({
    name: "iron",
    target: "buyer-a",
    rid: "iron-1",
    beobachtet: 100,
  }), 100);
  historie.erfasseListing(listing({
    name: "copper",
    target: "buyer-b",
    rid: "copper-1",
    beobachtet: 110,
  }), 110);
  historie.erfasseListing(listing({
    name: "goldore",
    target: "buyer-c",
    rid: "gold-1",
    beobachtet: 120,
  }), 120);

  assert.deepEqual(
    historie.sicht().map(x => x.name),
    ["copper", "goldore"],
  );

  historie.erfasseListing(listing({
    name: "copper",
    target: "buyer-b",
    rid: "copper-2",
    beobachtet: 130,
  }), 130);
  historie.erfasseListing(listing({
    name: "copper",
    target: "buyer-c",
    rid: "copper-3",
    beobachtet: 140,
  }), 140);

  const copper = historie.sicht().find(x => x.name === "copper");
  assert.ok(copper);
  assert.equal(copper.beobachtungen.length, 2);
});
