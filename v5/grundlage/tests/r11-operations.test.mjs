import test from "node:test";
import assert from "node:assert/strict";

import {
  AutoritaetsStatusRegister,
  BegrenzteOperationsTelemetrie,
  HeadlessOperationsSupervisor,
  KritischerAlertKoordinator,
  bewerteKritischeHealth,
  planeSegmentPflege,
} from "../../erzeugt/index.js";

test("fehlende oder stale kritische Health-Evidence ist niemals gesund", () => {
  const anforderungen = [
    { healthId: "journal", erforderlich: true },
    { healthId: "storage", erforderlich: true },
  ];
  const fehlend = bewerteKritischeHealth(anforderungen, [{
    healthId: "journal",
    zustand: "GESUND",
    beobachtetAmMs: 100,
    gueltigBisMs: 200,
    evidenceId: "E-1",
  }], 150);
  assert.equal(fehlend.zustand, "UNBEKANNT");
  assert.equal(fehlend.mutationErlaubt, false);
  assert.deepEqual(fehlend.fehlendeHealthIds, ["storage"]);

  const stale = bewerteKritischeHealth(anforderungen, [
    {
      healthId: "journal",
      zustand: "GESUND",
      beobachtetAmMs: 100,
      gueltigBisMs: 149,
      evidenceId: "E-1",
    },
    {
      healthId: "storage",
      zustand: "GESUND",
      beobachtetAmMs: 100,
      gueltigBisMs: 200,
      evidenceId: "E-2",
    },
  ], 150);
  assert.equal(stale.zustand, "UNBEKANNT");
  assert.equal(stale.mutationErlaubt, false);
});

test("kritischer Alert wird durable persistiert bevor Claim erfolgt", async () => {
  const reihenfolge = [];
  const spool = {
    async status() {
      return { offen: 0, maximum: 4 };
    },
    async speichereDurable(alert) {
      reihenfolge.push("persist:" + alert.alertId);
      return {
        durable: true,
        alertId: alert.alertId,
        bestaetigungsId: "ACK-" + alert.alertId,
      };
    },
    async claimDurable(alertId) {
      reihenfolge.push("claim:" + alertId);
      return { claimed: true };
    },
  };
  const result = await new KritischerAlertKoordinator(spool).persistiereVorClaim({
    schemaVersion: 1,
    alertId: "A-1",
    dedupeSchluessel: "D-1",
    schweregrad: "KRITISCH",
    erstelltAmMs: 100,
    art: "JOURNAL_FEHLER",
    inhalt: { grund: "TEST" },
  });
  assert.deepEqual(reihenfolge, ["persist:A-1", "claim:A-1"]);
  assert.equal(result.persistedBeforeClaim, true);
  assert.equal(result.claimed, true);
});

test("Persistenzfehler oder voller Alert-Spool verhindert Claim fail-closed", async () => {
  let claims = 0;
  const persistFehler = new KritischerAlertKoordinator({
    async status() { return { offen: 0, maximum: 2 }; },
    async speichereDurable() { throw new Error("DISK_FULL"); },
    async claimDurable() { claims += 1; return { claimed: true }; },
  });
  await assert.rejects(
    () => persistFehler.persistiereVorClaim({
      schemaVersion: 1,
      alertId: "A-2",
      dedupeSchluessel: "D-2",
      schweregrad: "KRITISCH",
      erstelltAmMs: 100,
      art: "TEST",
      inhalt: {},
    }),
    /DISK_FULL/,
  );
  assert.equal(claims, 0);

  const voll = new KritischerAlertKoordinator({
    async status() { return { offen: 2, maximum: 2 }; },
    async speichereDurable() { throw new Error("DARF_NICHT"); },
    async claimDurable() { claims += 1; return { claimed: true }; },
  });
  await assert.rejects(
    () => voll.persistiereVorClaim({
      schemaVersion: 1,
      alertId: "A-3",
      dedupeSchluessel: "D-3",
      schweregrad: "KRITISCH",
      erstelltAmMs: 100,
      art: "TEST",
      inhalt: {},
    }),
    /ALERT_SPOOL_VOLL/,
  );
  assert.equal(claims, 0);
});

test("Dashboard-Ausfall bleibt observer-only und blockiert keine Core-Entscheidung", async () => {
  const telemetrie = new BegrenzteOperationsTelemetrie(2);
  telemetrie.erfasse({
    schemaVersion: 1,
    zeitMs: 100,
    ssdIoLatenzMs: 4.5,
    ioQueueTiefe: 2,
    backpressureAktiv: false,
    freieBytes: 10_000,
    recorderDrops: 0,
  });
  await assert.doesNotReject(() => telemetrie.publiziereBestEffort({
    async veroeffentliche() {
      throw new Error("DASHBOARD_DOWN");
    },
  }));
  const snap = telemetrie.snapshot();
  assert.equal(snap.dashboardFehler, 1);
  assert.equal(snap.actionAuthority, false);
  assert.equal(snap.metrik.ssdIoLatenzMs, 4.5);
  assert.equal(snap.metrik.ioQueueTiefe, 2);
  assert.equal(snap.metrik.freieBytes, 10_000);
});

test("Operations-Telemetrie ist bounded und weist Recorder-Drops/Backpressure aus", () => {
  const telemetrie = new BegrenzteOperationsTelemetrie(2);
  for (let i = 0; i < 3; i += 1) {
    telemetrie.erfasse({
      schemaVersion: 1,
      zeitMs: i,
      ssdIoLatenzMs: i + 1,
      ioQueueTiefe: i,
      backpressureAktiv: i === 2,
      freieBytes: 1000 - i,
      recorderDrops: i,
    });
  }
  const snap = telemetrie.snapshot();
  assert.equal(snap.verworfeneMetriken, 1);
  assert.equal(snap.metrik.backpressureAktiv, true);
  assert.equal(snap.metrik.recorderDrops, 2);
});

test("jede automatische Autoritaet ist mit Owner Evidence Ressourcen Policy und Wirkung sichtbar", () => {
  const register = new AutoritaetsStatusRegister(2);
  register.setze({
    schemaVersion: 1,
    authorityId: "AUTH-1",
    capabilityId: "bank.deposit",
    ownerModulId: "merchant-core",
    aktiv: true,
    grund: "Auftrag freigegeben",
    policyId: "POLICY-BANK",
    evidenceIds: ["E-2", "E-1"],
    ressourcenIds: ["bank", "action:merchant:bank"],
    erwarteteWirkung: "Gold in Bank verschieben",
    ausgestelltAmMs: 100,
    gueltigBisMs: 200,
  });
  const [status] = register.sicht(150);
  assert.equal(status.aktiv, true);
  assert.equal(status.ownerModulId, "merchant-core");
  assert.deepEqual(status.evidenceIds, ["E-1", "E-2"]);
  assert.ok(status.ressourcenIds.length > 0);
  assert.ok(status.policyId.length > 0);
  assert.ok(status.erwarteteWirkung.length > 0);
  assert.equal(register.sicht(201)[0].aktiv, false);
});

test("Headless Supervisor bleibt ohne Gameplay-Autoritaet und fail-closed ohne Health/Telemetrie", () => {
  const authority = new AutoritaetsStatusRegister();
  const telemetrie = new BegrenzteOperationsTelemetrie();
  const supervisor = new HeadlessOperationsSupervisor(
    [{ healthId: "journal", erforderlich: true }],
    authority,
    telemetrie,
  );
  const status = supervisor.status([], 100);
  assert.equal(status.bereit, false);
  assert.equal(status.health.zustand, "UNBEKANNT");
  assert.equal(status.operations, null);
  assert.equal(status.actionAuthority, false);
});

test("Retention Rotation und Kompression sind deterministisch gebunden", () => {
  const plan = planeSegmentPflege([
    { segmentId: "A", erstelltAmMs: 0, bytes: 50, komprimiert: false },
    { segmentId: "B", erstelltAmMs: 50, bytes: 50, komprimiert: false },
    { segmentId: "C", erstelltAmMs: 90, bytes: 50, komprimiert: false },
  ], {
    maximaleSegmente: 2,
    maximaleBytes: 100,
    maximalesAlterMs: 200,
    komprimiereAbAlterMs: 20,
  }, 100);
  assert.deepEqual(plan.loeschenIds, ["A"]);
  assert.deepEqual(plan.behaltenIds, ["B", "C"]);
  assert.deepEqual(plan.komprimierenIds, ["B"]);
});
