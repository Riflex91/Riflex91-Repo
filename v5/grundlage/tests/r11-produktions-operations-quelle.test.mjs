import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  NodeProduktionsDateisystem,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodeProduktionsOperationsQuelle,
  V5_PRODUKTIONS_STORAGE_HEALTH_ID,
} from "../adapter/persistenz/node-produktions-operations-quelle.mjs";

test("Node-Operations-Quelle erzeugt reale Storage-Health und Metrik aus Testwurzel", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-host-ops-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const quelle = new NodeProduktionsOperationsQuelle(dateisystem, {
      minimaleFreieBytes: 1,
      maximaleIoLatenzMs: 60_000,
      gueltigkeitMs: 5_000,
    });

    const beobachtung = await quelle.beobachte(1_000);

    assert.equal(beobachtung.schemaVersion, 1);
    assert.equal(beobachtung.healthEvidence.length, 1);
    assert.equal(
      beobachtung.healthEvidence[0].healthId,
      V5_PRODUKTIONS_STORAGE_HEALTH_ID,
    );
    assert.equal(beobachtung.healthEvidence[0].zustand, "GESUND");
    assert.equal(beobachtung.healthEvidence[0].beobachtetAmMs, 1_000);
    assert.equal(beobachtung.healthEvidence[0].gueltigBisMs, 6_000);
    assert.equal(
      beobachtung.healthEvidence[0].evidenceId,
      "HOST-STORAGE:1000",
    );
    assert.equal(beobachtung.operationsMetrik.zeitMs, 1_000);
    assert.equal(
      typeof beobachtung.operationsMetrik.ssdIoLatenzMs,
      "number",
    );
    assert.equal(
      Number.isSafeInteger(beobachtung.operationsMetrik.freieBytes),
      true,
    );
    assert.equal(beobachtung.operationsMetrik.backpressureAktiv, false);

    const probe = JSON.parse(
      await dateisystem.liesText("runtime/health/storage-probe.json"),
    );
    assert.equal(probe.healthId, V5_PRODUKTIONS_STORAGE_HEALTH_ID);
    assert.equal(probe.beobachtetAmMs, 1_000);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Storage-Grenzverletzung degradiert Health und setzt Backpressure", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-host-ops-low-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const quelle = new NodeProduktionsOperationsQuelle(dateisystem, {
      minimaleFreieBytes: Number.MAX_SAFE_INTEGER,
      maximaleIoLatenzMs: 60_000,
    });

    const beobachtung = await quelle.beobachte(2_000);

    assert.equal(beobachtung.healthEvidence[0].zustand, "DEGRADIERT");
    assert.equal(beobachtung.operationsMetrik.backpressureAktiv, true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Dateisystemfehler wird als KRITISCH statt als gesunde Evidence gemeldet", async () => {
  const dateisystem = {
    wurzel: "/nicht/vorhanden",
    async schreibeAtomarDurable() {
      throw new Error("DATEISYSTEM_IO_FEHLER");
    },
  };
  const quelle = new NodeProduktionsOperationsQuelle(dateisystem, {
    minimaleFreieBytes: 1,
  });

  const beobachtung = await quelle.beobachte(3_000);

  assert.equal(beobachtung.healthEvidence[0].zustand, "KRITISCH");
  assert.equal(beobachtung.operationsMetrik.backpressureAktiv, true);
  assert.equal(beobachtung.operationsMetrik.freieBytes, null);
});

test("Operations-Quelle validiert Zeit und Health-Konfiguration fail-closed", async () => {
  const fake = {
    wurzel: "/tmp",
    async schreibeAtomarDurable() {},
  };

  assert.throws(
    () => new NodeProduktionsOperationsQuelle(fake, {
      gueltigkeitMs: 0,
    }),
    /PRODUKTIONS_OPERATIONS_GUELTIGKEIT_UNGUELTIG/,
  );
  assert.throws(
    () => new NodeProduktionsOperationsQuelle(fake, {
      maximaleIoLatenzMs: 0,
    }),
    /PRODUKTIONS_OPERATIONS_IO_LATENZ_GRENZE_UNGUELTIG/,
  );

  const quelle = new NodeProduktionsOperationsQuelle(fake, {
    minimaleFreieBytes: 1,
  });
  await assert.rejects(
    () => quelle.beobachte(-1),
    /PRODUKTIONS_OPERATIONS_ZEIT_UNGUELTIG/,
  );
});
