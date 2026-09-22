import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { NodeProduktionsDateisystem } from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import { NodeBankSwapEinmalAuthorityProtokoll } from "../adapter/persistenz/node-bank-swap-einmal-authority-protokoll.mjs";
import { NodeBankSwapTransaktionsJournal } from "../adapter/persistenz/node-bank-swap-transaktionsjournal.mjs";

test("Bank-Swap Authority-Audit und Current-Journal sind getrennt persistent", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-swap-persist-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({ wurzel: root, testmodus: true });
    const auth = new NodeBankSwapEinmalAuthorityProtokoll(dateisystem);
    const ack = await auth.schreibeDurable({
      schemaVersion: 1,
      aktivierungsId: "BANK-SWAP-AUTH-1",
      transaktionsId: "BANK-SWAP-TX-1",
      faehigkeitId: "merchant.bank.intern_tauschen",
      anbieterModulId: "merchant-bank-core",
      anbieterVersion: "1",
      actionContractId: "AL-ACTION-BANK-SWAP",
      recoveryContractId: "AL-RECOVERY-BANK-SWAP",
      verifierId: "AL-VERIFIER-BANK-SWAP",
      policyId: "BANK-SWAP-PRODUKTION-EINMAL-V1",
      evidenceIds: ["E-1"],
      zeitMs: 100,
      gueltigBisMs: 2100,
      art: "BANK_SWAP_EINMAL_AUTHORITY_VOR_WIRKUNG",
      maximaleVerwendungen: 1,
      breiteRuntimeFreigabe: false,
      rawWriteAutoritaet: false,
      gameplayWriteNochNichtAusgefuehrt: true,
    });
    assert.equal(ack.durable, true);

    const journal = new NodeBankSwapTransaktionsJournal(dateisystem);
    assert.equal((await journal.pruefeStartBereit()).bereit, true);
    await journal.haengeDurableAn({
      schemaVersion: 1,
      journalId: "BANK-SWAP-TX-1:1",
      transaktionsId: "BANK-SWAP-TX-1",
      sequenz: 1,
      art: "INTENT",
      zeitMs: 101,
      inhalt: { send_boundary_state: "NICHT_GESENDET", same_intent_retry: false },
    });
    assert.equal((await journal.pruefeStartBereit()).bereit, false);
    await journal.haengeDurableAn({
      schemaVersion: 1,
      journalId: "BANK-SWAP-TX-1:2",
      transaktionsId: "BANK-SWAP-TX-1",
      sequenz: 2,
      art: "ABBRUCH",
      zeitMs: 102,
      inhalt: { send_boundary_state: "NICHT_GESENDET", same_intent_retry: false },
    });
    assert.equal((await journal.pruefeStartBereit()).bereit, true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
