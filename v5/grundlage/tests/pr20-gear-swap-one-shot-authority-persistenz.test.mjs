import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  NodeProduktionsDateisystem,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodePr207GearSwapEinmalAuthorityProtokoll,
} from "../adapter/persistenz/node-pr20-7-gear-swap-einmal-authority-protokoll.mjs";

const A = "a".repeat(64);
const B = "b".repeat(64);
const C = "c".repeat(64);
const D = "d".repeat(64);
const E = "e".repeat(64);
const F = "f".repeat(64);

function intent(overrides = {}) {
  const scope = {
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "My_Merchant",
    sessionId: "merchant-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    slot: "helmet",
    kandidatIndex: 7,
    kandidatFingerprint: A,
    vorherigesSlotItemFingerprint: B,
    restInventarFingerprint: C,
    restEquipmentFingerprint: D,
    prestateFingerprint: E,
    evidenceFingerprint: F,
    ...(overrides.scope || {}),
  };
  return {
    schemaVersion: 1,
    art: "PR20_7_GEAR_SWAP_AUTHORITY_VOR_WIRKUNG",
    aktivierungsId: "PR20-7-GEAR-AUTH-1",
    transaktionsId: "PR20-7-GEAR-TX-1",
    ablaufId: "PR20-7-GEAR-FLOW-1",
    evidenceId: "PR20-7-REAL-PREFLIGHT-1",
    realEvidenceStatus: "BESTANDEN_REAL_BROWSER_NO_WRITE",
    policyId: "PR20-7-GEAR-SWAP-OCCUPIED-ONE-SHOT-V1",
    scope,
    fences: [
      {
        ressourcenId: "character:My_Merchant:equipment",
        epoche: 1,
        art: "LANGLEBIG",
        leaseBisMs: 1_600,
      },
      {
        ressourcenId: "character:My_Merchant:inventory",
        epoche: 1,
        art: "LANGLEBIG",
        leaseBisMs: 1_600,
      },
    ],
    zeitMs: 100,
    gueltigBisMs: 1_600,
    maximaleVerwendungen: 1,
    produktiveRegistrierungErlaubt: false,
    breiteRuntimeFreigabe: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    swapWriteRatification: false,
    gameplayWriteNochNichtAusgefuehrt: true,
    ...overrides,
    scope,
  };
}

async function env(prefix) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const fileSystem = new NodeProduktionsDateisystem({
    wurzel: root,
    testmodus: true,
  });
  return {
    root,
    fileSystem,
    protocol: new NodePr207GearSwapEinmalAuthorityProtokoll(fileSystem),
  };
}

test("PR20.7 Swap-Authority-Audit persistiert Scope und Fence-Epochen exklusiv durable", async () => {
  const e = await env("v5-pr207-gear-auth-");
  try {
    const ack = await e.protocol.schreibeDurable(intent());
    assert.deepEqual(ack, {
      durable: true,
      bestaetigungsId: "PR20-7-GEAR-SWAP-AUTH:PR20-7-GEAR-AUTH-1",
      aktivierungsId: "PR20-7-GEAR-AUTH-1",
      transaktionsId: "PR20-7-GEAR-TX-1",
      ablaufId: "PR20-7-GEAR-FLOW-1",
    });

    const raw = await e.fileSystem.liesText(
      "runtime/authority/mutieren/pr20-7-gear-swap/"
      + "PR20-7-GEAR-AUTH-1.json",
    );
    const stored = JSON.parse(raw);
    assert.equal(
      stored.art,
      "PR20_7_GEAR_SWAP_AUTHORITY_VOR_WIRKUNG",
    );
    assert.equal(stored.scope.characterId, "My_Merchant");
    assert.equal(stored.scope.sessionId, "merchant-session-1");
    assert.equal(stored.scope.slot, "helmet");
    assert.equal(stored.scope.kandidatIndex, 7);
    assert.deepEqual(
      stored.fences.map(x => [x.ressourcenId, x.epoche]),
      [
        ["character:My_Merchant:equipment", 1],
        ["character:My_Merchant:inventory", 1],
      ],
    );
    assert.equal(stored.produktiveRegistrierungErlaubt, false);
    assert.equal(stored.gameplayAutoritaet, false);
    assert.equal(stored.rawWriteAutoritaet, false);
    assert.equal(stored.swapWriteRatification, false);
    assert.equal(stored.gameplayWriteNochNichtAusgefuehrt, true);
  } finally {
    await fs.rm(e.root, { recursive: true, force: true });
  }
});

test("PR20.7 identischer Authority-Audit ist nach Restart idempotent, erteilt aber keine RAM-Authority", async () => {
  const e = await env("v5-pr207-gear-auth-restart-");
  try {
    await e.protocol.schreibeDurable(intent());
    const restarted = new NodePr207GearSwapEinmalAuthorityProtokoll(
      new NodeProduktionsDateisystem({
        wurzel: e.root,
        testmodus: true,
      }),
    );
    const ack = await restarted.schreibeDurable(intent());
    assert.equal(ack.durable, true);
    assert.equal(ack.transaktionsId, "PR20-7-GEAR-TX-1");
    assert.equal(typeof restarted.pruefeUndVerbrauche, "undefined");
  } finally {
    await fs.rm(e.root, { recursive: true, force: true });
  }
});

test("PR20.7 Audit-ID-Kollision, falsche Fences und Waffen-Scope werden blockiert", async () => {
  const e = await env("v5-pr207-gear-auth-invalid-");
  try {
    await e.protocol.schreibeDurable(intent());

    await assert.rejects(
      () => e.protocol.schreibeDurable(intent({
        transaktionsId: "PR20-7-GEAR-TX-OTHER",
      })),
      /AUDIT_ID_KOLLISION/,
    );

    await assert.rejects(
      () => e.protocol.schreibeDurable(intent({
        aktivierungsId: "PR20-7-GEAR-AUTH-2",
        fences: [{
          ressourcenId: "character:My_Merchant:equipment",
          epoche: 1,
          art: "LANGLEBIG",
          leaseBisMs: 1_600,
        }],
      })),
      /AUDIT_FENCES_UNGUELTIG/,
    );

    await assert.rejects(
      () => e.protocol.schreibeDurable(intent({
        aktivierungsId: "PR20-7-GEAR-AUTH-3",
        scope: { slot: "mainhand" },
      })),
      /AUDIT_SCOPE_UNGUELTIG/,
    );
  } finally {
    await fs.rm(e.root, { recursive: true, force: true });
  }
});
