import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  NodeProduktionsDateisystem,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodeBankStoreTransaktionsJournal,
} from "../adapter/persistenz/node-bank-store-transaktionsjournal.mjs";

function entry(tx, seq, art) {
  return {
    schemaVersion: 1,
    journalId: tx + ":" + seq,
    transaktionsId: tx,
    sequenz: seq,
    art,
    zeitMs: 100 + seq,
    inhalt: { marker: art },
  };
}

test("Bank-Store-Journal fenced offene Transaktion bis Terminal", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-store-tx-"));
  try {
    const journal = new NodeBankStoreTransaktionsJournal(
      new NodeProduktionsDateisystem({ wurzel: root, testmodus: true }),
    );
    assert.equal((await journal.pruefeStartBereit()).bereit, true);
    await journal.haengeDurableAn(entry("TX-A", 1, "INTENT"));
    assert.equal((await journal.pruefeStartBereit()).bereit, false);
    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-B", 1, "INTENT")),
      /BANK_STORE_TX_OFFENE_TRANSAKTION_BLOCKIERT:TX-A/,
    );
    await journal.haengeDurableAn(entry("TX-A", 2, "ABBRUCH"));
    assert.equal((await journal.pruefeStartBereit()).bereit, true);
    assert.deepEqual(
      (await journal.liesTransaktion("TX-A")).map(x => x.art),
      ["INTENT", "ABBRUCH"],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Bank-Store-Journal blockiert Sequenzluecke und Nachterminal-Write", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-store-seq-"));
  try {
    const journal = new NodeBankStoreTransaktionsJournal(
      new NodeProduktionsDateisystem({ wurzel: root, testmodus: true }),
    );
    await journal.haengeDurableAn(entry("TX-A", 1, "INTENT"));
    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-A", 3, "POSTCONDITION")),
      /BANK_STORE_TX_SEQUENZ_LUECKE/,
    );
    await journal.haengeDurableAn(entry("TX-A", 2, "ABBRUCH"));
    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-A", 3, "POSTCONDITION")),
      /BANK_STORE_TX_CURRENT_BINDUNG_UNGUELTIG|BANK_STORE_TX_NACH_TERMINAL/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
