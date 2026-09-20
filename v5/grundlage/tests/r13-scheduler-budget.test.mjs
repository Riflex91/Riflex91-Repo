import test from "node:test";
import assert from "node:assert/strict";

import {
  AblaufScheduler,
  GoldBudgetLedger,
  MerchantDemandInbox,
  MerchantWorkflowProvider,
} from "../../erzeugt/index.js";

const wissensSnapshot = {
  gitCommit: "a".repeat(40),
  quellenSha256: ["b".repeat(64)],
};

function demand(id, erstelltAmMs, rang, klasse = "NORMALE_ARBEIT", art = "NPC_SELL") {
  return {
    schemaVersion: 1,
    demandId: id,
    art,
    characterId: "merchant",
    accountId: art.startsWith("BANK_") ? "account-1" : null,
    erstelltAmMs,
    deadlineAmMs: 30000,
    prioritaetsKlasse: klasse,
    prioritaetsRang: rang,
    ressourcenIds: ["character:merchant:inventory"],
    payloadFingerprint: "payload-" + id,
    wissensSnapshot,
  };
}

test("Merchant Demand Inbox dedupliziert und Provider traegt keine Gameplay-Autoritaet", () => {
  const inbox = new MerchantDemandInbox();
  const provider = new MerchantWorkflowProvider();
  const d = demand("D-1", 0, 10, "NORMALE_ARBEIT", "BANK_STORE");
  inbox.legeAn(d);
  assert.throws(() => inbox.legeAn(d), /MERCHANT_DEMAND_DOPPELT/);

  const plan = provider.plane(d);
  assert.equal(plan.gameplayAutoritaet, false);
  assert.equal(plan.rawWriteAutoritaet, false);
  assert.ok(plan.ressourcenIds.includes("account:account-1:bank"));
});

test("Merchant-Scheduler nutzt PriorityClass plus Aging gegen Starvation innerhalb der Klasse", () => {
  const provider = new MerchantWorkflowProvider();
  const scheduler = new AblaufScheduler(32, 1000);

  const alt = provider.plane(demand("ALT", 0, 10));
  const neu = provider.plane(demand("NEU", 19000, 0));
  scheduler.registriere(alt);
  scheduler.registriere(neu);
  scheduler.setzeStatus(alt.ablaufId, "BEREIT", 19000);
  scheduler.setzeStatus(neu.ablaufId, "BEREIT", 19000);

  assert.equal(scheduler.waehleNaechsten(20000)?.plan.ablaufId, alt.ablaufId);
});

test("PriorityClass bleibt dominanter Safety-Mechanismus vor numerischem Rang", () => {
  const provider = new MerchantWorkflowProvider();
  const scheduler = new AblaufScheduler(32, 1000);
  const normal = provider.plane(demand("NORMAL", 0, 0, "NORMALE_ARBEIT"));
  const sicher = provider.plane(demand("SICHER", 19900, 999999, "SICHERHEIT"));

  scheduler.registriere(normal);
  scheduler.registriere(sicher);
  scheduler.setzeStatus(normal.ablaufId, "BEREIT", 19900);
  scheduler.setzeStatus(sicher.ablaufId, "BEREIT", 19900);
  assert.equal(scheduler.waehleNaechsten(20000)?.plan.ablaufId, sicher.ablaufId);
});

test("Gold-Budget-Ledger verhindert parallele Ueberbuchung und erhaelt Safety-Reserve", () => {
  const ledger = new GoldBudgetLedger();
  ledger.aktualisiereBeobachtung(1000, 200);
  ledger.reserviere("G-1", "WF-1", 500, "NPC_BUY");
  assert.equal(ledger.verfuegbarNachReservierungen(), 300);
  assert.throws(
    () => ledger.reserviere("G-2", "WF-2", 400, "MARKT_BUY"),
    /GOLD_BUDGET_NICHT_VERFUEGBAR/,
  );
  ledger.gibFrei("G-1");
  assert.equal(ledger.verfuegbarNachReservierungen(), 800);
});
