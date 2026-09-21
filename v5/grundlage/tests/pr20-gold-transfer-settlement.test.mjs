import test from "node:test";
import assert from "node:assert/strict";

import { validiereGoldTransferSettlement } from "../../erzeugt/index.js";

function bindung(characterId, sessionId) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId,
    sessionId,
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    rosterFingerprint: "roster-fp",
  };
}

function plan() {
  return {
    schemaVersion: 1,
    settlementId: "settle-gold-1",
    transaktionsId: "tx-gold-1",
    sender: bindung("merchant", "merchant-session"),
    empfaenger: bindung("farmer", "farmer-session"),
    betrag: 500,
    senderGoldBaseline: 10_000,
    empfaengerGoldBaseline: 2_000,
    senderBaselineFingerprint: "sender-before",
    empfaengerBaselineFingerprint: "recipient-before",
    transferBegonnenAmMs: 100,
  };
}

function evidence(overrides = {}) {
  return {
    schemaVersion: 1,
    settlementId: "settle-gold-1",
    transaktionsId: "tx-gold-1",
    senderCharacterId: "merchant",
    senderSessionId: "merchant-session",
    empfaengerCharacterId: "farmer",
    empfaengerSessionId: "farmer-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    senderGold: 9_500,
    empfaengerGold: 2_500,
    beobachtetAmMs: 120,
    senderFingerprint: "sender-after",
    empfaengerFingerprint: "recipient-after",
    korrelationsFingerprint: "gold-settlement-fp",
    ...overrides,
  };
}

test("Goldtransfer ist erst bei Sender- UND Empfaenger-Delta derselben Session settled", () => {
  const nachweis = validiereGoldTransferSettlement(plan(), evidence());
  assert.equal(nachweis.status, "BESTAETIGT");
  assert.equal(nachweis.senderAbnahme, 500);
  assert.equal(nachweis.empfaengerZunahme, 500);
  assert.equal(nachweis.ausfuehrungsAutoritaet, false);
  assert.equal(nachweis.gameplayAutoritaet, false);
  assert.equal(nachweis.rawWriteAutoritaet, false);
});

test("nur Sender-Delta ist kein Gold-Recipient-Settlement", () => {
  assert.throws(
    () => validiereGoldTransferSettlement(plan(), evidence({ empfaengerGold: 2_000 })),
    /GOLD_SETTLEMENT_EMPFAENGER_DELTA_NICHT_BESTAETIGT/,
  );
});

test("stale Evidence und unveraenderte Fingerprints werden blockiert", () => {
  assert.throws(
    () => validiereGoldTransferSettlement(plan(), evidence({ beobachtetAmMs: 99 })),
    /GOLD_SETTLEMENT_EVIDENCE_ZU_ALT/,
  );
  assert.throws(
    () => validiereGoldTransferSettlement(
      plan(),
      evidence({ empfaengerFingerprint: "recipient-before" }),
    ),
    /GOLD_SETTLEMENT_EMPFAENGER_KEIN_NEUER_ZUSTAND/,
  );
});

test("Session-, Server- oder Roster-Drift bestaetigt keinen Goldtransfer", () => {
  assert.throws(
    () => validiereGoldTransferSettlement(
      plan(),
      evidence({ empfaengerSessionId: "new-session" }),
    ),
    /GOLD_SETTLEMENT_ZIEL_ODER_SESSION_DRIFT/,
  );
  assert.throws(
    () => validiereGoldTransferSettlement(
      plan(),
      evidence({ serverIdentifier: "II" }),
    ),
    /GOLD_SETTLEMENT_ZIEL_ODER_SESSION_DRIFT/,
  );
  assert.throws(
    () => validiereGoldTransferSettlement(
      plan(),
      evidence({ rosterEpoche: 8 }),
    ),
    /GOLD_SETTLEMENT_ZIEL_ODER_SESSION_DRIFT/,
  );
});

test("abweichendes Sender- oder Empfaenger-Delta bleibt fail-closed", () => {
  assert.throws(
    () => validiereGoldTransferSettlement(plan(), evidence({ senderGold: 9_400 })),
    /GOLD_SETTLEMENT_SENDER_DELTA_NICHT_BESTAETIGT/,
  );
  assert.throws(
    () => validiereGoldTransferSettlement(plan(), evidence({ empfaengerGold: 2_600 })),
    /GOLD_SETTLEMENT_EMPFAENGER_DELTA_NICHT_BESTAETIGT/,
  );
});
