import test from "node:test";
import assert from "node:assert/strict";

import { CmAntwortLedger } from "../../erzeugt/index.js";

function auftrag() {
  return {
    schemaVersion: 1,
    protokollVersion: 1,
    nachrichtenId: "auftrag-1",
    dedupeSchluessel: "d-auftrag-1",
    senderCharacterId: "merchant",
    empfaengerCharacterId: "warrior",
    serverRegion: "EU",
    serverIdentifier: "I",
    erzeugtAmMs: 100,
    gueltigBisMs: 1000,
    workflowId: "wf-1",
    workflowRevision: 7,
    rosterEpoche: 4,
    typ: "AUFTRAG",
    antwortAuf: null,
    inhalt: { ziel: "goo" },
  };
}

function antwort(typ) {
  return {
    ...auftrag(),
    nachrichtenId: typ.toLowerCase() + "-1",
    dedupeSchluessel: "d-" + typ.toLowerCase(),
    senderCharacterId: "warrior",
    empfaengerCharacterId: "merchant",
    typ,
    antwortAuf: "auftrag-1",
    inhalt: { ok: true },
  };
}

test("ACK bestaetigt korrelierten Auftrag", () => {
  const ledger = new CmAntwortLedger();
  ledger.registriereAuftrag(auftrag());
  assert.equal(ledger.verarbeiteAntwort(antwort("ACK"), 200), "ACK_BESTAETIGT");
  assert.equal(ledger.sicht()[0].status, "BESTAETIGT");
});

test("Settlement darf vor ACK eintreffen und spaeteres ACK stuft nicht zurueck", () => {
  const ledger = new CmAntwortLedger();
  ledger.registriereAuftrag(auftrag());
  assert.equal(
    ledger.verarbeiteAntwort(antwort("SETTLEMENT"), 200),
    "SETTLEMENT_ABGESCHLOSSEN",
  );
  assert.equal(ledger.verarbeiteAntwort(antwort("ACK"), 201), "BEREITS_ABGESCHLOSSEN");
  assert.equal(ledger.sicht()[0].status, "ABGESCHLOSSEN");
});

test("Falsche Workflow- oder Senderkorrelation wird abgelehnt", () => {
  const ledger = new CmAntwortLedger();
  ledger.registriereAuftrag(auftrag());
  assert.equal(
    ledger.verarbeiteAntwort({ ...antwort("ACK"), workflowRevision: 8 }, 200),
    "ANTWORT_KORRELATION_UNGUELTIG",
  );
  assert.equal(
    ledger.verarbeiteAntwort({ ...antwort("ACK"), senderCharacterId: "rogue" }, 200),
    "ANTWORT_KORRELATION_UNGUELTIG",
  );
});

test("Restart behaelt ACK/Settlement-Korrelation bis TTL", () => {
  const alt = new CmAntwortLedger();
  alt.registriereAuftrag(auftrag());
  alt.verarbeiteAntwort(antwort("ACK"), 200);
  const neu = new CmAntwortLedger();
  neu.importiereNachRestart(alt.snapshot(300), 400);
  assert.equal(
    neu.verarbeiteAntwort(antwort("SETTLEMENT"), 500),
    "SETTLEMENT_ABGESCHLOSSEN",
  );
});
