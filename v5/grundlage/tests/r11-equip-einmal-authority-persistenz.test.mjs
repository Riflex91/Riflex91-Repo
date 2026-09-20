import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  NodeProduktionsDateisystem,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodeEquipEinmalAuthorityProtokoll,
} from "../adapter/persistenz/node-equip-einmal-authority-protokoll.mjs";

function intent(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "EQUIP-AUTH-001",
    transaktionsId: "EQUIP-TX-001",
    faehigkeitId: "equipment.equip",
    anbieterModulId: "equipment-core",
    anbieterVersion: "1",
    actionContractId: "AL-ACTION-EQUIP",
    recoveryContractId: "AL-RECOVERY-EQUIP",
    verifierId: "AL-VERIFIER-EQUIP",
    policyId: "EQUIPMENT-EQUIP-PRODUKTION-EINMAL-V1",
    evidenceIds: ["HEALTH-B", "HEALTH-A"],
    zeitMs: 100,
    gueltigBisMs: 2_100,
    art: "EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG",
    maximaleVerwendungen: 1,
    breiteRuntimeFreigabe: false,
    rawWriteAutoritaet: false,
    gameplayWriteNochNichtAusgefuehrt: true,
    ...overrides,
  };
}

test("Equip-Einmal-Authority wird exklusiv durable vor Wirkung gespeichert", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-equip-auth-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const protokoll = new NodeEquipEinmalAuthorityProtokoll(dateisystem);

    const bestaetigung = await protokoll.schreibeDurable(intent());

    assert.deepEqual(bestaetigung, {
      durable: true,
      bestaetigungsId: "EQUIP-AUTH:EQUIP-AUTH-001",
      aktivierungsId: "EQUIP-AUTH-001",
      transaktionsId: "EQUIP-TX-001",
    });
    const text = await dateisystem.liesText(
      "runtime/authority/mutieren/equipment-equip/EQUIP-AUTH-001.json",
    );
    const gespeichert = JSON.parse(text);
    assert.equal(
      gespeichert.art,
      "EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG",
    );
    assert.deepEqual(gespeichert.evidenceIds, ["HEALTH-A", "HEALTH-B"]);
    assert.equal(gespeichert.maximaleVerwendungen, 1);
    assert.equal(gespeichert.breiteRuntimeFreigabe, false);
    assert.equal(gespeichert.rawWriteAutoritaet, false);
    assert.equal(gespeichert.gameplayWriteNochNichtAusgefuehrt, true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("identisches Equip-Authority-Audit ist nach Restart idempotent", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-equip-auth-restart-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    await new NodeEquipEinmalAuthorityProtokoll(dateisystem)
      .schreibeDurable(intent());

    const bestaetigung = await new NodeEquipEinmalAuthorityProtokoll(
      new NodeProduktionsDateisystem({ wurzel: root, testmodus: true }),
    ).schreibeDurable(intent());

    assert.equal(bestaetigung.durable, true);
    assert.equal(bestaetigung.transaktionsId, "EQUIP-TX-001");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Equip-Authority-ID-Kollision und falsche Bindung werden blockiert", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-equip-auth-collision-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const protokoll = new NodeEquipEinmalAuthorityProtokoll(dateisystem);
    await protokoll.schreibeDurable(intent());

    await assert.rejects(
      () => protokoll.schreibeDurable(intent({
        transaktionsId: "EQUIP-TX-ANDERS",
      })),
      /EQUIP_EINMAL_AUTHORITY_AUDIT_ID_KOLLISION/,
    );
    await assert.rejects(
      () => protokoll.schreibeDurable(intent({
        actionContractId: "AL-ACTION-UPGRADE",
        aktivierungsId: "EQUIP-AUTH-002",
      })),
      /EQUIP_EINMAL_AUTHORITY_AUDIT_FORMAT_UNGUELTIG/,
    );
    await assert.rejects(
      () => protokoll.schreibeDurable(intent({
        gueltigBisMs: 2_101,
        aktivierungsId: "EQUIP-AUTH-003",
      })),
      /EQUIP_EINMAL_AUTHORITY_AUDIT_FORMAT_UNGUELTIG/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
