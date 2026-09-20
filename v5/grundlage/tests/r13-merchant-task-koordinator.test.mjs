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

function demand(
  id,
  {
    art = "NPC_SELL",
    erstelltAmMs = 0,
    deadlineAmMs = 30_000,
    klasse = "NORMALE_ARBEIT",
    rang = 100,
  } = {},
) {
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
  const koordinator = new MerchantTaskKoordinator(
    inbox,
    provider,
    scheduler,
  );
  return { inbox, provider, scheduler, koordinator };
}

test("Merchant Task Coordinator plant offene Demands und verwirft abgelaufene fail-closed", () => {
  const { inbox, scheduler, koordinator } = baue();
  inbox.legeAn(demand("BANK", {
    art: "BANK_STORE",
    deadlineAmMs: 1_000,
  }));
  inbox.legeAn(demand("ALT", {
    deadlineAmMs: 50,
  }));

  const ergebnis = koordinator.planeOffene(100);

  assert.deepEqual(ergebnis.geplant, ["BANK"]);
  assert.deepEqual(ergebnis.abgelaufen, ["ALT"]);
  assert.equal(ergebnis.gameplayAutoritaet, false);
  assert.equal(ergebnis.rawWriteAutoritaet, false);

  const bank = scheduler.sicht().find(
    x => x.plan.ablaufId === "merchant:BANK",
  );
  assert.ok(bank);
  assert.equal(bank.status, "BEREIT");
  assert.ok(bank.plan.ressourcenIds.includes("account:account-1:bank"));

  const status = koordinator.status();
  assert.equal(status.geplanteDemands, 1);
  assert.equal(status.abgebrocheneDemands, 1);
  assert.equal(status.gameplayAutoritaet, false);
  assert.equal(status.rawWriteAutoritaet, false);
});

test("globaler Scheduler bestimmt Merchant-Reihenfolge inklusive Safety-Prioritaet", () => {
  const { inbox, koordinator } = baue();
  inbox.legeAn(demand("NORMAL", {
    klasse: "NORMALE_ARBEIT",
    rang: 0,
  }));
  inbox.legeAn(demand("SAFETY", {
    klasse: "SICHERHEIT",
    rang: 999_999,
  }));
  koordinator.planeOffene(10);

  const gestartet = koordinator.starteNaechsten(20);

  assert.equal(gestartet?.demand.demandId, "SAFETY");
  assert.equal(gestartet?.status, "LAUFEND");
  assert.equal(
    inbox.sicht().find(x => x.demand.demandId === "NORMAL")?.status,
    "GEPLANT",
  );
});

test("Merchant startet nichts wenn ein fremder global hoeher priorisierter Ablauf vorne liegt", () => {
  const { inbox, provider, scheduler, koordinator } = baue();
  inbox.legeAn(demand("MERCHANT", {
    klasse: "NORMALE_ARBEIT",
  }));
  koordinator.planeOffene(10);

  const basis = provider.plane(demand("FREMD-BASIS", {
    klasse: "SICHERHEIT",
  }));
  scheduler.registriere({
    ...basis,
    ablaufId: "combat:safety",
    ablaufArt: "COMBAT_SAFETY",
    eigentuemerModulId: "combat-core",
    idempotenzSchluessel: "combat:safety",
  });
  scheduler.setzeStatus("combat:safety", "BEREIT", 10);

  const gestartet = koordinator.starteNaechsten(20);

  assert.equal(gestartet, null);
  assert.equal(
    inbox.sicht().find(x => x.demand.demandId === "MERCHANT")?.status,
    "GEPLANT",
  );
  assert.equal(
    scheduler.sicht().find(x => x.plan.ablaufId === "combat:safety")?.status,
    "BEREIT",
  );
});

test("Merchant Lifecycle wartet auf Beobachtung und schliesst erst danach terminal ab", () => {
  const { inbox, scheduler, koordinator } = baue();
  inbox.legeAn(demand("D-1"));
  koordinator.planeOffene(10);

  assert.equal(
    koordinator.starteNaechsten(20)?.demand.demandId,
    "D-1",
  );

  koordinator.markiereWartetBeobachtung("D-1", 30);
  assert.equal(
    scheduler.sicht().find(x => x.plan.ablaufId === "merchant:D-1")?.status,
    "WARTET_BEOBACHTUNG",
  );
  assert.equal(
    inbox.sicht().find(x => x.demand.demandId === "D-1")?.status,
    "LAUFEND",
  );

  koordinator.markiereBereit("D-1", 40);
  assert.equal(
    koordinator.starteNaechsten(50)?.demand.demandId,
    "D-1",
  );
  koordinator.markiereErledigt("D-1", 60);

  assert.equal(
    scheduler.sicht().find(x => x.plan.ablaufId === "merchant:D-1")?.status,
    "ABGESCHLOSSEN",
  );
  assert.equal(
    inbox.sicht().find(x => x.demand.demandId === "D-1")?.status,
    "ERLEDIGT",
  );
});

test("Scheduler/Inbox-Drift wird nicht durch Doppelplanung kaschiert", () => {
  const { inbox, provider, scheduler, koordinator } = baue();
  const d = demand("DRIFT");
  inbox.legeAn(d);
  scheduler.registriere(provider.plane(d));
  scheduler.setzeStatus("merchant:DRIFT", "BEREIT", 10);

  assert.throws(
    () => koordinator.planeOffene(20),
    /MERCHANT_TASK_SCHEDULER_DRIFT:DRIFT/,
  );
  assert.equal(
    inbox.sicht().find(x => x.demand.demandId === "DRIFT")?.status,
    "OFFEN",
  );
});
