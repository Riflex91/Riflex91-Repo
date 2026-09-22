import test from "node:test";
import assert from "node:assert/strict";

import {
  AblaufScheduler,
  MerchantDemandInbox,
  MerchantTaskKoordinator,
  MerchantWorkflowProvider,
} from "../../erzeugt/index.js";

const wissensSnapshot = {
  gitCommit: "a".repeat(40),
  quellenSha256: ["b".repeat(64)],
};

function demand(id, {
  art,
  erstelltAmMs,
  deadlineAmMs = 300_000,
  klasse = "NORMALE_ARBEIT",
  rang = 100,
}) {
  return {
    schemaVersion: 1,
    demandId: id,
    art,
    characterId: "merchant",
    accountId: art.startsWith("BANK_") ? "account-1" : null,
    erstelltAmMs,
    deadlineAmMs,
    prioritaetsKlasse: klasse,
    prioritaetsRang: rang,
    ressourcenIds: ["character:merchant:inventory"],
    payloadFingerprint: "payload-" + id,
    wissensSnapshot,
  };
}

function baue() {
  const inbox = new MerchantDemandInbox();
  const provider = new MerchantWorkflowProvider();
  const scheduler = new AblaufScheduler(64, 1_000);
  const koordinator = new MerchantTaskKoordinator(inbox, provider, scheduler);
  return { inbox, scheduler, koordinator };
}

const sichererPunkt = {
  erlaubt: true,
  sichererPunktId: "merchant-safe-checkpoint",
  irreversibleMutationOffen: false,
  checkpointDurable: true,
};

test("PR20.5 Scheduler-Integration verhindert fruehes Bereichs-Pingpong und erlaubt spaeter stabilen Wechsel", () => {
  const { inbox, scheduler, koordinator } = baue();

  inbox.legeAn(demand("BANK", {
    art: "BANK_STORE",
    erstelltAmMs: 0,
  }));
  koordinator.planeOffene(0);
  assert.equal(koordinator.starteNaechsten(0)?.demand.demandId, "BANK");

  inbox.legeAn(demand("MARKT", {
    art: "MARKT_BUY",
    erstelltAmMs: 1_000,
    klasse: "ERFORDERLICHER_DIENST",
    rang: 0,
  }));
  koordinator.planeOffene(1_000);
  koordinator.markiereSicherUnterbrechbar("BANK", sichererPunkt, 5_000);

  assert.equal(koordinator.starteNaechsten(5_000), null);
  assert.equal(
    scheduler.sicht().find(x => x.plan.ablaufId === "merchant:BANK")?.status,
    "SICHER_UNTERBRECHBAR",
  );
  assert.equal(
    scheduler.sicht().find(x => x.plan.ablaufId === "merchant:MARKT")?.status,
    "BEREIT",
  );

  const gewechselt = koordinator.starteNaechsten(35_000);
  assert.equal(gewechselt?.demand.demandId, "MARKT");
  assert.equal(
    scheduler.sicht().find(x => x.plan.ablaufId === "merchant:BANK")?.status,
    "PAUSIERT",
  );
  assert.equal(
    scheduler.sicht().find(x => x.plan.ablaufId === "merchant:MARKT")?.status,
    "LAUFEND",
  );

  const status = koordinator.status();
  assert.equal(status.aktuellerDemandId, "MARKT");
  assert.equal(status.aktuellerBereich, "MARKT");
  assert.equal(status.letzterWechselAmMs, 35_000);
  assert.equal(status.wechselHistorie, 1);
  assert.equal(status.gameplayAutoritaet, false);
  assert.equal(status.rawWriteAutoritaet, false);
});

test("PR20.5 Scheduler-Integration preemptet niemals ohne sicheren durablen Checkpoint", () => {
  const { inbox, scheduler, koordinator } = baue();

  inbox.legeAn(demand("NPC", {
    art: "NPC_SELL",
    erstelltAmMs: 0,
  }));
  koordinator.planeOffene(0);
  assert.equal(koordinator.starteNaechsten(0)?.demand.demandId, "NPC");

  inbox.legeAn(demand("BANK-SAFETY", {
    art: "BANK_STORE",
    erstelltAmMs: 1_000,
    klasse: "SICHERHEIT",
    rang: 0,
  }));
  koordinator.planeOffene(1_000);

  assert.equal(koordinator.starteNaechsten(40_000), null);
  assert.equal(
    scheduler.sicht().find(x => x.plan.ablaufId === "merchant:NPC")?.status,
    "LAUFEND",
  );
  assert.equal(
    scheduler.sicht().find(x => x.plan.ablaufId === "merchant:BANK-SAFETY")?.status,
    "BEREIT",
  );
});

test("PR20.5 gleiche Merchant-Domaene zaehlt nicht als Bereichswechsel", () => {
  const { inbox, koordinator } = baue();

  inbox.legeAn(demand("BANK-A", {
    art: "BANK_STORE",
    erstelltAmMs: 0,
  }));
  koordinator.planeOffene(0);
  assert.equal(koordinator.starteNaechsten(0)?.demand.demandId, "BANK-A");
  koordinator.markiereSicherUnterbrechbar("BANK-A", sichererPunkt, 2_000);

  inbox.legeAn(demand("BANK-B", {
    art: "BANK_RETRIEVE",
    erstelltAmMs: 1_000,
    klasse: "ERFORDERLICHER_DIENST",
    rang: 0,
  }));
  koordinator.planeOffene(2_000);

  assert.equal(koordinator.starteNaechsten(2_001)?.demand.demandId, "BANK-B");
  assert.equal(koordinator.status().wechselHistorie, 0);
  assert.equal(koordinator.status().aktuellerBereich, "BANK");
});
