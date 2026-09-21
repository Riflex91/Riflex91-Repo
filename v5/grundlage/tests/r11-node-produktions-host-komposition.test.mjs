import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  EQUIPMENT_CORE_MODUL_ID,
  EQUIPMENT_CORE_MODUL_VERSION,
  EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
  EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG,
  EQUIPMENT_EQUIP_EINMAL_POLICY_ID,
  EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
  EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
  EQUIPMENT_EQUIP_VERIFIER_ID,
  MERCHANT_CORE_A_MODUL_ID,
  MERCHANT_CORE_A_MODUL_VERSION,
} from "../../erzeugt/index.js";
import {
  erstelleNodeV5ProduktionsHost,
} from "../../werkzeuge/v5-produktions-host-komposition.mjs";

const BANK_PLANEN = "merchant.bank.planen";

function hostOptionen(root) {
  return {
    dateisystemOptionen: {
      wurzel: root,
      testmodus: true,
    },
    operationsOptionen: {
      minimaleFreieBytes: 1,
      maximaleIoLatenzMs: 60_000,
      gueltigkeitMs: 5_000,
    },
  };
}

function aktivierung(id = "HOST-CANARY-BANK-1") {
  return {
    schemaVersion: 1,
    aktivierungsId: id,
    faehigkeitId: BANK_PLANEN,
    anbieterModulId: MERCHANT_CORE_A_MODUL_ID,
    anbieterVersion: MERCHANT_CORE_A_MODUL_VERSION,
    policyId: "NODE-HOST-PLANEN-V1",
  };
}

function equipAuthority(id = "NODE-EQUIP-AUTH-1", jetztMs = 101) {
  return {
    schemaVersion: 1,
    aktivierungsId: id,
    transaktionsId: "NODE-EQUIP-TX-1",
    faehigkeitId: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
    anbieterModulId: EQUIPMENT_CORE_MODUL_ID,
    anbieterVersion: EQUIPMENT_CORE_MODUL_VERSION,
    actionContractId: EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
    recoveryContractId: EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
    verifierId: EQUIPMENT_EQUIP_VERIFIER_ID,
    policyId: EQUIPMENT_EQUIP_EINMAL_POLICY_ID,
    bestaetigungText: EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG,
    gueltigBisMs: jetztMs + 2_000,
  };
}

test("kanonische Node-Komposition startet observer-only und aktiviert PLANEN ohne Runtime-Bypass", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-node-host-"));
  try {
    const host = await erstelleNodeV5ProduktionsHost(hostOptionen(root));

    const start = await host.starte(100);
    assert.equal(start.zustand, "LAEUFT");
    assert.equal(start.gameplayAutoritaet, false);
    assert.equal(start.rawWriteAutoritaet, false);
    assert.equal(start.actionAuthority, false);

    const ergebnis = await host.aktivierePlanen(aktivierung(), 101);
    assert.equal(ergebnis.erfolgreich, true);
    assert.equal(ergebnis.wirkung, "AKTIVIERT");
    assert.equal(ergebnis.gameplayAutoritaet, false);
    assert.equal(ergebnis.rawWriteAutoritaet, false);
    assert.equal(ergebnis.actionAuthority, false);

    const status = host.status();
    assert.deepEqual(
      status.aktivePlanenFaehigkeiten,
      [BANK_PLANEN + "@1"],
    );
    assert.equal(
      typeof host.produktionsWurzel(),
      "string",
    );

    const stopp = await host.stoppe("TEST_ENDE");
    assert.equal(stopp.zustand, "GESTOPPT");
    assert.deepEqual(stopp.aktivePlanenFaehigkeiten, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Node-Host stellt exakt eine durable Equip-Authority aus ohne Registry-Aktivierung", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-node-equip-auth-"));
  try {
    const host = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    assert.equal((await host.starte(100)).zustand, "LAEUFT");

    const ergebnis = await host.erteileEquipEinmalAuthority(
      equipAuthority(),
      101,
    );

    assert.equal(ergebnis.erfolgreich, true);
    assert.ok(ergebnis.authority);
    assert.equal(ergebnis.authority.gueltigFuer(101), true);
    assert.equal(host.status().equipEinmalAuthorityOffen, true);
    assert.equal(host.status().gameplayAutoritaet, false);
    assert.equal(host.status().rawWriteAutoritaet, false);
    assert.equal(host.status().actionAuthority, false);

    const auditText = await fs.readFile(
      path.join(
        root,
        "runtime",
        "authority",
        "mutieren",
        "equipment-equip",
        "NODE-EQUIP-AUTH-1.json",
      ),
      "utf8",
    );
    const audit = JSON.parse(auditText);
    assert.equal(audit.transaktionsId, "NODE-EQUIP-TX-1");
    assert.equal(audit.maximaleVerwendungen, 1);
    assert.equal(audit.gameplayWriteNochNichtAusgefuehrt, true);

    await host.stoppe("TEST_ENDE");
    assert.equal(ergebnis.authority.gueltigFuer(102), false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("persistierter Capability-Deny ueberlebt Node-Host-Neustart", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-node-deny-"));
  try {
    const hostA = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    await hostA.starte(100);
    assert.equal(
      (await hostA.aktivierePlanen(aktivierung(), 101)).erfolgreich,
      true,
    );

    const deny = await hostA.wendeDenyAn({
      schemaVersion: 1,
      befehlId: "DENY-BANK-1",
      bedienerId: "operator",
      zeitMs: 102,
      art: "FAEHIGKEIT_SPERREN",
      faehigkeitId: BANK_PLANEN,
    }, 102);

    assert.deepEqual(
      deny.host.aktivePlanenFaehigkeiten,
      [],
    );
    assert.deepEqual(
      deny.bediener.gesperrteFaehigkeiten,
      [BANK_PLANEN],
    );
    await hostA.stoppe("NEUSTART_TEST");

    const hostB = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    assert.deepEqual(
      hostB.bedienerStatus().gesperrteFaehigkeiten,
      [BANK_PLANEN],
    );
    assert.equal((await hostB.starte(200)).zustand, "LAEUFT");

    const blockiert = await hostB.aktivierePlanen(
      aktivierung("HOST-CANARY-BANK-2"),
      201,
    );
    assert.equal(blockiert.erfolgreich, false);
    assert.equal(
      blockiert.grund,
      "V5_PLANEN_AKTIVIERUNG_DURCH_POLICY_GESPERRT",
    );
    assert.deepEqual(
      hostB.status().aktivePlanenFaehigkeiten,
      [],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("persistierter NOTHALT ueberlebt Node-Host-Neustart und blockiert PLANEN", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-node-stop-"));
  try {
    const hostA = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    await hostA.wendeDenyAn({
      schemaVersion: 1,
      befehlId: "NOTHALT-1",
      bedienerId: "operator",
      zeitMs: 100,
      art: "NOTHALT_AKTIVIEREN",
    }, 100);

    const hostB = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    assert.equal(hostB.bedienerStatus().nothaltAktiv, true);

    const start = await hostB.starte(200);
    assert.equal(start.zustand, "GESPERRT");
    assert.match(
      start.grund,
      /PRODUKTIONS_HOST_REVALIDIERUNG_NICHT_BEREIT/,
    );
    assert.equal(start.prozess?.prozessLaeuft, false);
    assert.deepEqual(start.aktivePlanenFaehigkeiten, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Node-Host exponiert keine Runtime- oder Register-Aktivierungs-Bypaesse", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-node-surface-"));
  try {
    const host = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    for (const verboten of [
      "runtime",
      "kernKomponenten",
      "operationsSupervisor",
      "aktiviereNichtMutierend",
      "aktiviereMutierend",
      "erteileMutierenAuthority",
      "erfasseOperationsMetrik",
    ]) {
      assert.equal(verboten in host, false);
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
