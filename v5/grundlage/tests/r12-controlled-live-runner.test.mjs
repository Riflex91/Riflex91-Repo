import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { CdpEquipAdapter } from "../werkzeuge/r12-live/browser-equip.mjs";
import { validiereLoopbackCdp } from "../werkzeuge/r12-live/cdp.mjs";
import { DurablesDateiJournal, pruefeKeineOffeneV5Transaktion } from "../werkzeuge/r12-live/datei-journal.mjs";

const kandidat = {
  index: 3,
  itemName: "helmet1",
  itemLevel: 1,
  slot: "helmet",
  slotWarLeer: true,
  vorherigesSlotItem: null,
};

test("Controlled-Live CDP erlaubt nur loopback HTTP", () => {
  assert.equal(validiereLoopbackCdp("http://127.0.0.1:9222").hostname, "127.0.0.1");
  assert.equal(validiereLoopbackCdp("http://localhost:9222").hostname, "localhost");
  assert.throws(() => validiereLoopbackCdp("https://127.0.0.1:9222"), /R12_CDP_NUR_LOOPBACK_HTTP/);
  assert.throws(() => validiereLoopbackCdp("http://192.168.1.4:9222"), /R12_CDP_NUR_LOOPBACK_HTTP/);
});

test("Precondition-Abbruch zaehlt keinen Game-Write und Adapter ist trotzdem one-shot", async () => {
  const adapter = new CdpEquipAdapter({
    async evaluate() { return { sent: false, reason: "INVENTORY_ITEM_DRIFT" }; },
  }, 1, kandidat);
  const result = await adapter.sende();
  assert.equal(result.art, "NICHT_GESENDET");
  assert.equal(adapter.adapterAufrufe, 1);
  assert.equal(adapter.gameWrites, 0);
  assert.equal(adapter.moeglicherSend, false);
  await assert.rejects(() => adapter.sende(), /R12_MEHR_ALS_EIN_WRITE_VERBOTEN/);
});

test("Bestaetigter Send zaehlt exakt einen Game-Write", async () => {
  const adapter = new CdpEquipAdapter({
    async evaluate() { return { sent: true, ergebnis: { ok: true } }; },
  }, 1, kandidat);
  const result = await adapter.sende();
  assert.equal(result.art, "SERVER_ERGEBNIS");
  assert.equal(adapter.adapterAufrufe, 1);
  assert.equal(adapter.gameWrites, 1);
  assert.equal(adapter.moeglicherSend, true);
});

test("CDP-Ausfall nach moeglichem Send bleibt UNKNOWN und wird nie wiederholt", async () => {
  const adapter = new CdpEquipAdapter({
    async evaluate() { throw new Error("DISCONNECT"); },
  }, 1, kandidat);
  const result = await adapter.sende();
  assert.equal(result.art, "UNBEKANNT");
  assert.equal(result.grund, "DISCONNECT_NACH_MOEGLICHEM_SEND");
  assert.equal(adapter.gameWrites, 0);
  assert.equal(adapter.moeglicherSend, true);
  await assert.rejects(() => adapter.sende(), /R12_MEHR_ALS_EIN_WRITE_VERBOTEN/);
});

test("Durables R12-Dateijournal erkennt offene Transaktionen", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "r12-journal-"));
  try {
    const journal = new DurablesDateiJournal(root);
    await journal.haengeDurableAn({
      schemaVersion: 1,
      journalId: "J-1",
      transaktionsId: "T-1",
      sequenz: 1,
      art: "INTENT",
      zeitMs: 1,
      inhalt: {},
    });
    assert.throws(() => pruefeKeineOffeneV5Transaktion(root), /R12_OFFENE_V5_TRANSAKTION:T-1/);
    await journal.haengeDurableAn({
      schemaVersion: 1,
      journalId: "J-2",
      transaktionsId: "T-1",
      sequenz: 2,
      art: "ABBRUCH",
      zeitMs: 2,
      inhalt: {},
    });
    assert.doesNotThrow(() => pruefeKeineOffeneV5Transaktion(root));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
