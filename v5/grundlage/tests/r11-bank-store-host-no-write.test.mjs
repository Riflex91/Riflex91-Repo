import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  BANK_STORE_ACTION_CONTRACT_ID,
  BANK_STORE_EINMAL_BESTAETIGUNG,
  BANK_STORE_EINMAL_POLICY_ID,
  BANK_STORE_RECOVERY_CONTRACT_ID,
  BANK_STORE_VERIFIER_ID,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
} from "../../erzeugt/index.js";
import {
  erstelleNodeV5ProduktionsHost,
} from "../../werkzeuge/v5-produktions-host-komposition.mjs";

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
function storeAuthority(jetztMs = 101) {
  return {
    schemaVersion: 1,
    aktivierungsId: "NODE-BANK-STORE-AUTH-1",
    transaktionsId: "NODE-BANK-STORE-TX-1",
    faehigkeitId: MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    actionContractId: BANK_STORE_ACTION_CONTRACT_ID,
    recoveryContractId: BANK_STORE_RECOVERY_CONTRACT_ID,
    verifierId: BANK_STORE_VERIFIER_ID,
    policyId: BANK_STORE_EINMAL_POLICY_ID,
    bestaetigungText: BANK_STORE_EINMAL_BESTAETIGUNG,
    gueltigBisMs: jetztMs + 2_000,
  };
}

test("Node-Host stellt Store-One-Shot durable und ohne Gameplay-Write aus", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-node-bank-store-auth-"));
  try {
    const host = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    assert.equal((await host.starte(100)).zustand, "LAEUFT");
    const ergebnis = await host.erteileBankStoreEinmalAuthority(
      storeAuthority(),
      101,
    );
    assert.equal(ergebnis.erfolgreich, true);
    assert.ok(ergebnis.authority);
    assert.equal(host.status().bankStoreEinmalAuthorityOffen, true);
    assert.equal(host.status().gameplayAutoritaet, false);
    assert.equal(host.status().rawWriteAutoritaet, false);
    assert.equal(host.status().actionAuthority, false);

    const audit = JSON.parse(await fs.readFile(
      path.join(
        root,
        "runtime",
        "authority",
        "mutieren",
        "bank-store",
        "NODE-BANK-STORE-AUTH-1.json",
      ),
      "utf8",
    ));
    assert.equal(audit.transaktionsId, "NODE-BANK-STORE-TX-1");
    assert.equal(audit.maximaleVerwendungen, 1);
    assert.equal(audit.gameplayWriteNochNichtAusgefuehrt, true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Node-Host durchlaeuft Store-Real-Shadow ohne Send", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-node-bank-store-shadow-"));
  try {
    const host = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    const startMs = Date.now();
    assert.equal((await host.starte(startMs)).zustand, "LAEUFT");
    const ergebnis = await host.fuehreBankStoreRealShadow({
      aktivierungsId: "NODE-STORE-SHADOW-AUTH-1",
      transaktionsId: "NODE-STORE-SHADOW-TX-1",
      freigabeId: "NODE-STORE-SHADOW-FREE-1",
      auftragId: "NODE-STORE-SHADOW-ORDER-1",
      ablaufId: "NODE-STORE-SHADOW-WF-1",
      shadowBestaetigungText:
        "V5 BANK STORE SHADOW OHNE WRITE AUSFUEHREN",
      ausgang: {
        accountId: "account-1",
        charakterName: "Merchant",
        sessionId: "merchant-session",
        serverRegion: "EU",
        serverKennung: "I",
        bankGemountet: false,
      },
      mountBeobachter: {
        async warteAufMount() {
          return {
            accountId: "account-1",
            charakterName: "Merchant",
            sessionId: "merchant-session",
            serverRegion: "EU",
            serverKennung: "I",
            bankGemountet: true,
            beobachtetAmMs: Date.now(),
            fingerprint: "f".repeat(64),
            inventorySha256: "i".repeat(64),
            bankSha256: "b".repeat(64),
            sourceSlot: 7,
            targetPack: "items0",
            targetSlot: 11,
            sourceItemFingerprint: "a".repeat(64),
            targetItemFingerprint: null,
          };
        },
      },
      releaseBeobachter: {
        async beobachte() {
          return {
            offeneTransaktionen: 0,
            backendInProgress: false,
            bankActionInFlight: false,
            characterBankAktiv: false,
            erwarteterExitBeobachtet: true,
          };
        },
      },
    }, startMs);

    assert.equal(ergebnis.status, "ADMISSION_BESTANDEN_KEIN_SEND");
    assert.equal(ergebnis.sendBoundaryState, "NICHT_GESENDET");
    assert.equal(ergebnis.journalTerminalArt, "ABBRUCH");
    assert.equal(ergebnis.sameIntentErneutSenden, false);
    assert.equal(ergebnis.browserGameplayWrites, 0);
    assert.equal(ergebnis.hostGameplayWrites, 0);
    assert.equal(ergebnis.gameplayWrites, 0);
    assert.equal(ergebnis.adapterAufrufe, 0);
    assert.equal(host.status().bankStoreEinmalAuthorityOffen, false);
    assert.equal(
      host.bankLeaseStatus().every(x => x.zustand === "RELEASED"),
      true,
    );
    assert.equal((await host.pruefeBankStoreStartBereit()).bereit, true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
