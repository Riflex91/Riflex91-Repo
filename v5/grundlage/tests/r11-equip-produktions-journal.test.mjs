import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  NodeProduktionsDateisystem,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodeEquipTransaktionsJournal,
} from "../adapter/persistenz/node-equip-transaktionsjournal.mjs";

function entry(tx, seq, art, overrides = {}) {
  return {
    schemaVersion: 1,
    journalId: tx + ":" + seq,
    transaktionsId: tx,
    sequenz: seq,
    art,
    zeitMs: 100 + seq,
    inhalt: { marker: art, ...overrides },
  };
}

test("Equip-Transaktionsjournal persistiert Intent bis Terminal und erlaubt danach neue Transaktion", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-equip-tx-journal-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const journal = new NodeEquipTransaktionsJournal(dateisystem);

    assert.deepEqual(await journal.pruefeStartBereit(), {
      bereit: true,
      offeneTransaktionsId: null,
    });

    await journal.haengeDurableAn(entry("TX-A", 1, "INTENT"));
    assert.deepEqual(await journal.pruefeStartBereit(), {
      bereit: false,
      offeneTransaktionsId: "TX-A",
    });
    await journal.haengeDurableAn(entry("TX-A", 2, "SERVER_ERGEBNIS"));
    await journal.haengeDurableAn(entry("TX-A", 3, "POSTCONDITION"));
    await journal.haengeDurableAn(entry("TX-A", 4, "COMMIT"));

    assert.deepEqual(await journal.pruefeStartBereit(), {
      bereit: true,
      offeneTransaktionsId: null,
    });
    assert.deepEqual(
      (await journal.liesTransaktion("TX-A")).map(x => x.art),
      ["INTENT", "SERVER_ERGEBNIS", "POSTCONDITION", "COMMIT"],
    );

    await journal.haengeDurableAn(entry("TX-B", 1, "INTENT"));
    await journal.haengeDurableAn(entry("TX-B", 2, "ABBRUCH"));
    assert.equal((await journal.liesTransaktion("TX-B")).length, 2);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("offene Equip-Transaktion blockiert konkurrierenden neuen Intent", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-equip-tx-open-"));
  try {
    const journal = new NodeEquipTransaktionsJournal(
      new NodeProduktionsDateisystem({ wurzel: root, testmodus: true }),
    );
    await journal.haengeDurableAn(entry("TX-A", 1, "INTENT"));

    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-B", 1, "INTENT")),
      /EQUIP_TX_OFFENE_TRANSAKTION_BLOCKIERT:TX-A/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Journal blockiert Sequenzluecke Kollision und Eintrag nach Terminal", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-equip-tx-seq-"));
  try {
    const journal = new NodeEquipTransaktionsJournal(
      new NodeProduktionsDateisystem({ wurzel: root, testmodus: true }),
    );
    await journal.haengeDurableAn(entry("TX-A", 1, "INTENT"));

    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-A", 3, "POSTCONDITION")),
      /EQUIP_TX_JOURNAL_SEQUENZ_LUECKE/,
    );

    await journal.haengeDurableAn(entry("TX-A", 2, "ABBRUCH"));
    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-A", 3, "POSTCONDITION")),
      /EQUIP_TX_CURRENT_BINDUNG_UNGUELTIG|EQUIP_TX_JOURNAL_NACH_TERMINAL/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("identischer Journal-Eintrag ist idempotent, abweichender Inhalt kollidiert", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-equip-tx-idem-"));
  try {
    const journal = new NodeEquipTransaktionsJournal(
      new NodeProduktionsDateisystem({ wurzel: root, testmodus: true }),
    );
    const e = entry("TX-A", 1, "INTENT");
    await journal.haengeDurableAn(e);
    await journal.haengeDurableAn(e);

    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-A", 1, "INTENT", {
        marker: "anders",
      })),
      /EQUIP_TX_JOURNAL_INHALT_KOLLISION/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
