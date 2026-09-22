import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { erstelleNodeV5ProduktionsHost } from "../../werkzeuge/v5-produktions-host-komposition.mjs";
import { NodeProduktionsDateisystem } from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import { NodeBankSwapTransaktionsJournal } from "../adapter/persistenz/node-bank-swap-transaktionsjournal.mjs";

function hostOptionen(root) {
  return {
    dateisystemOptionen: { wurzel: root, testmodus: true },
    operationsOptionen: {
      minimaleFreieBytes: 1,
      maximaleIoLatenzMs: 60_000,
      gueltigkeitMs: 5_000,
    },
  };
}

test("Swap-Startbereitschaft prueft Deposit, Withdraw, Swap und persistente Bank-Lease gemeinsam", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-swap-ready-"));
  try {
    const host = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    const ready = await host.pruefeBankSwapStartBereit();
    assert.equal(ready.bereit, true);
    assert.equal(ready.offeneBankDepositTransaktionId, null);
    assert.equal(ready.offeneBankWithdrawTransaktionId, null);
    assert.equal(ready.offeneBankSwapTransaktionId, null);
    assert.equal(ready.offeneBankLease, null);

    const journal = new NodeBankSwapTransaktionsJournal(
      new NodeProduktionsDateisystem({ wurzel: root, testmodus: true }),
    );
    await journal.haengeDurableAn({
      schemaVersion: 1,
      journalId: "SWAP-OPEN-TX:1",
      transaktionsId: "SWAP-OPEN-TX",
      sequenz: 1,
      art: "INTENT",
      zeitMs: 100,
      inhalt: { send_boundary_state: "NICHT_GESENDET", same_intent_retry: false },
    });

    const blocked = await host.pruefeBankSwapStartBereit();
    assert.equal(blocked.bereit, false);
    assert.equal(blocked.offeneBankSwapTransaktionId, "SWAP-OPEN-TX");
    assert.equal((await host.pruefeBankDepositStartBereit()).bereit, false);
    assert.equal((await host.pruefeBankWithdrawStartBereit()).bereit, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
