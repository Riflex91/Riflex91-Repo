import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  NodeProduktionsDateisystem,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodeBankDepositTransaktionsJournal,
} from "../adapter/persistenz/node-bank-deposit-transaktionsjournal.mjs";

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

test("Bank-Deposit-Journal fenced offene Transaktion bis Terminal", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-deposit-tx-"));
  try {
    const journal = new NodeBankDepositTransaktionsJournal(
      new NodeProduktionsDateisystem({ wurzel: root, testmodus: true }),
    );
    assert.equal((await journal.pruefeStartBereit()).bereit, true);
    await journal.haengeDurableAn(entry("TX-A", 1, "INTENT"));
    assert.deepEqual(await journal.pruefeStartBereit(), {
      bereit: false,
      offeneTransaktionsId: "TX-A",
    });
    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-B", 1, "INTENT")),
      /BANK_DEPOSIT_TX_OFFENE_TRANSAKTION_BLOCKIERT:TX-A/,
    );
    await journal.haengeDurableAn(entry("TX-A", 2, "UNBEKANNT"));
    await journal.haengeDurableAn(entry("TX-A", 3, "POSTCONDITION"));
    await journal.haengeDurableAn(entry("TX-A", 4, "COMMIT"));
    assert.equal((await journal.pruefeStartBereit()).bereit, true);
    assert.deepEqual(
      (await journal.liesTransaktion("TX-A")).map(x => x.art),
      ["INTENT", "UNBEKANNT", "POSTCONDITION", "COMMIT"],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Bank-Deposit-Journal blockiert Sequenzluecke und Nachterminal-Write", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-deposit-seq-"));
  try {
    const journal = new NodeBankDepositTransaktionsJournal(
      new NodeProduktionsDateisystem({ wurzel: root, testmodus: true }),
    );
    await journal.haengeDurableAn(entry("TX-A", 1, "INTENT"));
    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-A", 3, "POSTCONDITION")),
      /BANK_DEPOSIT_TX_SEQUENZ_LUECKE/,
    );
    await journal.haengeDurableAn(entry("TX-A", 2, "ABBRUCH"));
    await assert.rejects(
      () => journal.haengeDurableAn(entry("TX-A", 3, "POSTCONDITION")),
      /BANK_DEPOSIT_TX_CURRENT_BINDUNG_UNGUELTIG|BANK_DEPOSIT_TX_NACH_TERMINAL/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
