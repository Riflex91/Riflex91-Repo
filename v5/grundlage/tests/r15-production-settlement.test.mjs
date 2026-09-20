import test from "node:test";
import assert from "node:assert/strict";

import { ProduktionsLedger } from "../../erzeugt/index.js";

const ziel = {
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "warrior",
  sessionId: "session-1",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 9,
  rosterFingerprint: "roster-fp",
};

function intent() {
  return {
    schemaVersion: 1,
    produktionsId: "prod-1",
    ablaufId: "wf-prod-1",
    ownerCharacterId: "merchant",
    recipientCharacterId: "warrior",
    outputName: "hpot1",
    outputLevel: 0,
    outputMenge: 100,
    planFingerprint: "plan-fp",
  };
}

function evidence(overrides = {}) {
  return {
    schemaVersion: 1,
    settlementId: "settlement-1",
    produktionsId: "prod-1",
    recipientCharacterId: "warrior",
    recipientSessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 9,
    outputName: "hpot1",
    outputLevel: 0,
    beobachteteMenge: 150,
    beobachtetAmMs: 300,
    inventoryFingerprint: "inventory-after",
    korrelationsFingerprint: "settlement-evidence-fp",
    ...overrides,
  };
}

test("Craft Output allein beendet Production nicht", () => {
  const ledger = new ProduktionsLedger();
  ledger.plane(intent());
  ledger.beginneHerstellung("prod-1");
  const output = ledger.markiereOutputBereit("prod-1", "output-fp");
  assert.equal(output.zustand, "OUTPUT_BEREIT");
  assert.throws(() => ledger.committe("prod-1"), /PRODUKTION_COMMIT_OHNE_RECIPIENT_SETTLEMENT/);
});

test("Production committed erst nach final verifiziertem Recipient Settlement", () => {
  const ledger = new ProduktionsLedger();
  ledger.plane(intent());
  ledger.beginneHerstellung("prod-1");
  ledger.markiereOutputBereit("prod-1", "output-fp");
  ledger.beginneLieferung("prod-1", "settlement-1", ziel, 50, "inventory-before", 200);

  assert.throws(() => ledger.committe("prod-1"), /PRODUKTION_COMMIT_OHNE_RECIPIENT_SETTLEMENT/);
  assert.equal(
    ledger.verifiziereRecipientSettlement("prod-1", evidence()).zustand,
    "RECIPIENT_SETTLED",
  );
  assert.equal(ledger.committe("prod-1").zustand, "COMMITTED");
});

test("Recipient Settlement braucht echte positive Mengen-Differenz nach Delivery-Beginn", () => {
  const ledger = new ProduktionsLedger();
  ledger.plane(intent());
  ledger.beginneHerstellung("prod-1");
  ledger.markiereOutputBereit("prod-1", "output-fp");
  ledger.beginneLieferung("prod-1", "settlement-1", ziel, 50, "inventory-before", 200);

  assert.throws(
    () => ledger.verifiziereRecipientSettlement("prod-1", evidence({ beobachteteMenge: 149 })),
    /RECIPIENT_SETTLEMENT_MENGE_NICHT_BESTAETIGT/,
  );
  assert.throws(
    () => ledger.verifiziereRecipientSettlement("prod-1", evidence({ beobachtetAmMs: 199 })),
    /RECIPIENT_SETTLEMENT_EVIDENCE_ZU_ALT/,
  );
  assert.throws(
    () => ledger.verifiziereRecipientSettlement("prod-1", evidence({ inventoryFingerprint: "inventory-before" })),
    /RECIPIENT_SETTLEMENT_KEIN_NEUER_INVENTARSTAND/,
  );
});

test("Roster Session oder Server Drift blockiert Empfaenger Settlement", () => {
  const ledger = new ProduktionsLedger();
  ledger.plane(intent());
  ledger.beginneHerstellung("prod-1");
  ledger.markiereOutputBereit("prod-1", "output-fp");
  ledger.beginneLieferung("prod-1", "settlement-1", ziel, 50, "inventory-before", 200);

  assert.throws(
    () => ledger.verifiziereRecipientSettlement("prod-1", evidence({ recipientSessionId: "session-2" })),
    /RECIPIENT_SETTLEMENT_ZIEL_DRIFT/,
  );
  assert.throws(
    () => ledger.verifiziereRecipientSettlement("prod-1", evidence({ serverIdentifier: "II" })),
    /RECIPIENT_SETTLEMENT_ZIEL_DRIFT/,
  );
});

test("Restart macht nichtterminale Production RECOVERY_PENDING statt blindem Resume", () => {
  const alt = new ProduktionsLedger();
  alt.plane(intent());
  alt.beginneHerstellung("prod-1");
  alt.markiereOutputBereit("prod-1", "output-fp");
  alt.beginneLieferung("prod-1", "settlement-1", ziel, 50, "inventory-before", 200);

  const neu = new ProduktionsLedger();
  neu.importiereNachRestart(alt.snapshot());
  const sicht = neu.finde("prod-1");
  assert.equal(sicht.zustand, "RECOVERY_PENDING");
  assert.equal(sicht.sameIntentErneutSenden, false);
  assert.throws(() => neu.committe("prod-1"), /PRODUKTION_COMMIT_OHNE_RECIPIENT_SETTLEMENT/);

  assert.equal(
    neu.verifiziereRecipientSettlement("prod-1", evidence()).zustand,
    "RECIPIENT_SETTLED",
  );
  assert.equal(neu.committe("prod-1").zustand, "COMMITTED");
});
