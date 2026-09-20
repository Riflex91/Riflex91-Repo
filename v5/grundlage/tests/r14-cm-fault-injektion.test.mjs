import test from "node:test";
import assert from "node:assert/strict";

import { CmInbox } from "../../erzeugt/index.js";

const kontext = {
  empfaengerCharacterId: "warrior",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 3,
  vertrauenswuerdigeSender: ["merchant"],
  maximaleTtlMs: 5_000,
  maximalePayloadZeichen: 2_048,
};

function nachricht(revision, id, erzeugtAmMs = 100, gueltigBisMs = 1_000) {
  return {
    schemaVersion: 1,
    protokollVersion: 1,
    nachrichtenId: id,
    dedupeSchluessel: "dedupe-" + id,
    senderCharacterId: "merchant",
    empfaengerCharacterId: "warrior",
    serverRegion: "EU",
    serverIdentifier: "I",
    erzeugtAmMs,
    gueltigBisMs,
    workflowId: "wf-fault",
    workflowRevision: revision,
    rosterEpoche: 3,
    typ: "AUFTRAG",
    antwortAuf: null,
    inhalt: { revision },
  };
}

test("Fault Injection: duplicate wird genau einmal verarbeitet", () => {
  const inbox = new CmInbox();
  const msg = nachricht(1, "m1");
  assert.equal(inbox.empfange(msg, kontext, 200).status, "ANGENOMMEN");
  assert.equal(inbox.empfange(msg, kontext, 201).status, "DUPLIKAT");
});

test("Fault Injection: out-of-order verwirft spaetere Ankunft einer alten Revision", () => {
  const inbox = new CmInbox();
  assert.equal(inbox.empfange(nachricht(2, "m2"), kontext, 200).status, "ANGENOMMEN");
  assert.equal(inbox.empfange(nachricht(1, "m1"), kontext, 201).status, "VERALTETE_REVISION");
});

test("Fault Injection: loss einer Revision verhindert neuere Revision nicht", () => {
  const inbox = new CmInbox();
  assert.equal(inbox.empfange(nachricht(3, "m3"), kontext, 200).status, "ANGENOMMEN");
  assert.equal(inbox.sicht().length, 1);
});

test("Fault Injection: delayed Nachricht wird nach TTL verworfen", () => {
  const inbox = new CmInbox();
  assert.equal(
    inbox.empfange(nachricht(1, "m1", 100, 150), kontext, 200).status,
    "ABGELAUFEN",
  );
});
