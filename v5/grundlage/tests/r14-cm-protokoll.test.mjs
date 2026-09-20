import test from "node:test";
import assert from "node:assert/strict";

import { CmInbox, planeCmWiederholung } from "../../erzeugt/index.js";

function umschlag(overrides = {}) {
  return {
    schemaVersion: 1,
    protokollVersion: 1,
    nachrichtenId: "msg-1",
    dedupeSchluessel: "dedupe-1",
    senderCharacterId: "merchant",
    empfaengerCharacterId: "warrior",
    serverRegion: "EU",
    serverIdentifier: "I",
    erzeugtAmMs: 100,
    gueltigBisMs: 200,
    workflowId: "wf-1",
    workflowRevision: 1,
    rosterEpoche: 7,
    typ: "AUFTRAG",
    antwortAuf: null,
    inhalt: { ziel: "goo" },
    ...overrides,
  };
}

const kontext = {
  empfaengerCharacterId: "warrior",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  vertrauenswuerdigeSender: ["merchant"],
  maximaleTtlMs: 1_000,
  maximalePayloadZeichen: 1_000,
};

test("CM Inbox akzeptiert nur vertrauenswuerdige aktuelle realm-lokale Umschlaege", () => {
  const inbox = new CmInbox();
  assert.equal(inbox.empfange(umschlag(), kontext, 120).status, "ANGENOMMEN");
  assert.equal(inbox.empfange(
    umschlag({ nachrichtenId: "x", dedupeSchluessel: "x", serverIdentifier: "II" }),
    kontext,
    120,
  ).status, "FALSCHER_SERVER");
  assert.equal(inbox.empfange(
    umschlag({ nachrichtenId: "y", dedupeSchluessel: "y", senderCharacterId: "fremd" }),
    kontext,
    120,
  ).status, "UNVERTRAUENSWUERDIGER_SENDER");
  assert.equal(inbox.empfange(
    umschlag({ nachrichtenId: "z", dedupeSchluessel: "z", rosterEpoche: 6 }),
    kontext,
    120,
  ).status, "FALSCHE_ROSTER_EPOCHE");
});

test("CM Inbox dedupliziert und verwirft veraltete Revision nach Umsortierung", () => {
  const inbox = new CmInbox();
  assert.equal(inbox.empfange(
    umschlag({ nachrichtenId: "m2", dedupeSchluessel: "d2", workflowRevision: 2 }),
    kontext,
    120,
  ).status, "ANGENOMMEN");
  assert.equal(inbox.empfange(
    umschlag({ nachrichtenId: "m2", dedupeSchluessel: "d2", workflowRevision: 2 }),
    kontext,
    121,
  ).status, "DUPLIKAT");
  assert.equal(inbox.empfange(
    umschlag({ nachrichtenId: "m1", dedupeSchluessel: "d1", workflowRevision: 1 }),
    kontext,
    122,
  ).status, "VERALTETE_REVISION");
});

test("Verlorene fruehe Revision blockiert spaetere selbstenthaltene Revision nicht", () => {
  const inbox = new CmInbox();
  assert.equal(inbox.empfange(
    umschlag({ nachrichtenId: "m3", dedupeSchluessel: "d3", workflowRevision: 3 }),
    kontext,
    120,
  ).status, "ANGENOMMEN");
});

test("Verspaetete Nachrichten und zu grosse Payloads werden fail-closed abgelehnt", () => {
  const inbox = new CmInbox();
  assert.equal(inbox.empfange(umschlag(), kontext, 201).status, "ABGELAUFEN");
  assert.equal(inbox.empfange(
    umschlag({
      nachrichtenId: "big",
      dedupeSchluessel: "big",
      inhalt: { wert: "x".repeat(2000) },
    }),
    kontext,
    120,
  ).status, "PAYLOAD_ZU_GROSS");
});

test("Restart behaelt Dedupe-Evidence bis TTL", () => {
  const alt = new CmInbox();
  alt.empfange(umschlag(), kontext, 120);
  const snapshot = alt.snapshot(130);
  const neu = new CmInbox();
  neu.importiereNachRestart(snapshot, 140);
  assert.equal(neu.empfange(umschlag(), kontext, 150).status, "DUPLIKAT");
});

test("Transport-Retry verwendet dieselbe Nachrichten-ID und stoppt nach lokaler Zustellung", () => {
  const msg = umschlag();
  assert.deepEqual(
    planeCmWiederholung(
      msg,
      { receivers: [], locals: [], transportFehler: true },
      1,
      3,
      120,
    ),
    {
      entscheidung: "GLEICHE_NACHRICHTEN_ID_WIEDERHOLEN",
      nachrichtenId: "msg-1",
    },
  );
  assert.deepEqual(
    planeCmWiederholung(
      msg,
      { receivers: [], locals: ["warrior"], transportFehler: true },
      1,
      3,
      120,
    ),
    {
      entscheidung: "KEINE_WIEDERHOLUNG_ZUGESTELLT",
      nachrichtenId: "msg-1",
    },
  );
});
