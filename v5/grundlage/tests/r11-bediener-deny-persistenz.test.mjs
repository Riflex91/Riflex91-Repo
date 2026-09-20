import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  NodeProduktionsDateisystem,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodeBedienerDenyProtokoll,
} from "../adapter/persistenz/node-bediener-deny-protokoll.mjs";

function eintrag(overrides = {}) {
  return {
    schemaVersion: 1,
    befehlId: "DENY-1",
    bedienerId: "operator",
    zeitMs: 100,
    art: "FAEHIGKEIT_SPERREN",
    faehigkeitId: "merchant.bank.planen",
    wirkung: "AUTORITAET_REDUZIERT",
    gameplayAutoritaetErhoeht: false,
    safetyUmgangen: false,
    ...overrides,
  };
}

test("deny-only Bedienerprotokoll bleibt ueber Restart rekonstruierbar", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-deny-log-"));
  try {
    const dsA = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const a = new NodeBedienerDenyProtokoll(dsA);
    await a.schreibeDurable(eintrag());
    await a.schreibeDurable({
      schemaVersion: 1,
      befehlId: "STOP-1",
      bedienerId: "operator",
      zeitMs: 101,
      art: "NOTHALT_AKTIVIEREN",
      wirkung: "AUTORITAET_REDUZIERT",
      gameplayAutoritaetErhoeht: false,
      safetyUmgangen: false,
    });

    const dsB = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const befehle = await new NodeBedienerDenyProtokoll(dsB)
      .ladeWirksameDenyBefehle();

    assert.deepEqual(befehle, [
      {
        schemaVersion: 1,
        befehlId: "DENY-1",
        bedienerId: "operator",
        zeitMs: 100,
        art: "FAEHIGKEIT_SPERREN",
        faehigkeitId: "merchant.bank.planen",
      },
      {
        schemaVersion: 1,
        befehlId: "STOP-1",
        bedienerId: "operator",
        zeitMs: 101,
        art: "NOTHALT_AKTIVIEREN",
      },
    ]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("gleicher Bedienerbefehl ist idempotent, abweichender Inhalt kollidiert", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-deny-idem-"));
  try {
    const ds = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const protokoll = new NodeBedienerDenyProtokoll(ds);

    await protokoll.schreibeDurable(eintrag());
    await protokoll.schreibeDurable(eintrag());

    const text = await ds.liesText("runtime/operator/deny.jsonl");
    assert.equal(text.trim().split("\n").length, 1);

    await assert.rejects(
      () => protokoll.schreibeDurable(eintrag({
        bedienerId: "anderer-operator",
      })),
      /BEDIENER_PROTOKOLL_BEFEHL_ID_KOLLISION/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Deny-Protokoll validiert die historische Wirkung deterministisch", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-deny-tamper-"));
  try {
    const ds = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    await ds.haengeTextDurable(
      "runtime/operator/deny.jsonl",
      JSON.stringify(eintrag({ wirkung: "UNVERAENDERT" })) + "\n",
    );

    await assert.rejects(
      () => new NodeBedienerDenyProtokoll(ds).ladeWirksameDenyBefehle(),
      /BEDIENER_PROTOKOLL_WIRKUNG_WIDERSPRUCH/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("wiederholte Sperren rekonstruieren AUTORITAET_REDUZIERT dann UNVERAENDERT", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-deny-repeat-"));
  try {
    const ds = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const protokoll = new NodeBedienerDenyProtokoll(ds);
    await protokoll.schreibeDurable(eintrag());
    await protokoll.schreibeDurable(eintrag({
      befehlId: "DENY-2",
      zeitMs: 101,
      wirkung: "UNVERAENDERT",
    }));

    const befehle = await protokoll.ladeWirksameDenyBefehle();
    assert.equal(befehle.length, 2);
    assert.equal(befehle[0].faehigkeitId, "merchant.bank.planen");
    assert.equal(befehle[1].faehigkeitId, "merchant.bank.planen");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
