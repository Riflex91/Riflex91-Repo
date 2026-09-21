import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  NodeProduktionsDateisystem,
  STANDARD_PRODUKTIONS_WURZEL,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodePlanenAktivierungsProtokoll,
} from "../adapter/persistenz/node-planen-aktivierungs-protokoll.mjs";

function intent(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "PLAN-AKT-001",
    faehigkeitId: "merchant.bank.planen",
    anbieterModulId: "merchant-core-a",
    anbieterVersion: "1",
    policyId: "PLANEN-AKTIVIERUNG-V1",
    evidenceIds: ["HEALTH-B", "HEALTH-A"],
    zeitMs: 100,
    art: "PLANEN_AKTIVIERUNG_VOR_WIRKUNG",
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    actionAuthority: false,
    ...overrides,
  };
}

test("PLANEN-Aktivierungs-Audit wird exklusiv durable vor Wirkung gespeichert", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-plan-audit-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const protokoll = new NodePlanenAktivierungsProtokoll(dateisystem);

    const bestaetigung = await protokoll.schreibeDurable(intent());

    assert.deepEqual(bestaetigung, {
      durable: true,
      bestaetigungsId: "PLAN-AUDIT:PLAN-AKT-001",
      aktivierungsId: "PLAN-AKT-001",
    });
    const text = await dateisystem.liesText(
      "runtime/authority/planen/PLAN-AKT-001.json",
    );
    const gespeichert = JSON.parse(text);
    assert.equal(gespeichert.art, "PLANEN_AKTIVIERUNG_VOR_WIRKUNG");
    assert.deepEqual(gespeichert.evidenceIds, ["HEALTH-A", "HEALTH-B"]);
    assert.equal(gespeichert.gameplayAutoritaet, false);
    assert.equal(gespeichert.rawWriteAutoritaet, false);
    assert.equal(gespeichert.actionAuthority, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("identisches PLANEN-Audit ist nach Restart idempotent", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-plan-audit-restart-"));
  try {
    const dateisystemA = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    await new NodePlanenAktivierungsProtokoll(dateisystemA)
      .schreibeDurable(intent());

    const dateisystemB = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const bestaetigung = await new NodePlanenAktivierungsProtokoll(
      dateisystemB,
    ).schreibeDurable(intent());

    assert.equal(bestaetigung.durable, true);
    assert.equal(bestaetigung.aktivierungsId, "PLAN-AKT-001");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("gleiche Aktivierungs-ID mit abweichendem Inhalt wird blockiert", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-plan-audit-race-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const protokoll = new NodePlanenAktivierungsProtokoll(dateisystem);
    await protokoll.schreibeDurable(intent());

    await assert.rejects(
      () => protokoll.schreibeDurable(intent({
        policyId: "ANDERE-POLICY",
      })),
      /PLANEN_AKTIVIERUNGS_AUDIT_ID_KOLLISION/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Produktions-Dateisystem bleibt auf D-Wurzel gebunden und blockiert Traversal", async () => {
  assert.equal(
    STANDARD_PRODUKTIONS_WURZEL,
    "D:\\AdventureLand-V5",
  );
  assert.throws(
    () => new NodeProduktionsDateisystem({
      wurzel: "C:\\AdventureLand-V5",
      testmodus: false,
    }),
    /PRODUKTIONS_DATEISYSTEM_WURZEL_UNGUELTIG/,
  );

  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-prod-fs-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    await assert.rejects(
      () => dateisystem.erstelleExklusivDurable("../ausbruch.json", "{}"),
      /DATEISYSTEM_RELATIVER_PFAD_UNGUELTIG/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Audit-Adapter akzeptiert nur nicht-mutierende typisierte Vor-Wirkung-Evidence", async () => {
  const fake = {
    async liesText() {
      return undefined;
    },
    async erstelleExklusivDurable() {
      return true;
    },
  };
  const protokoll = new NodePlanenAktivierungsProtokoll(fake);

  await assert.rejects(
    () => protokoll.schreibeDurable(intent({ actionAuthority: true })),
    /PLANEN_AKTIVIERUNGS_AUDIT_FORMAT_UNGUELTIG/,
  );
  await assert.rejects(
    () => protokoll.schreibeDurable(intent({ evidenceIds: [] })),
    /PLANEN_AKTIVIERUNGS_AUDIT_FORMAT_UNGUELTIG/,
  );
  await assert.rejects(
    () => protokoll.schreibeDurable(intent({
      evidenceIds: ["HEALTH-A", "HEALTH-A"],
    })),
    /PLANEN_AKTIVIERUNGS_AUDIT_EVIDENCE_DOPPELT/,
  );
});
