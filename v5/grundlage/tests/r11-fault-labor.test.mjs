import test from "node:test";
import assert from "node:assert/strict";

import {
  BegrenzterAsynchronerSchreiber,
  KritischerAlertKoordinator,
  ladeRecoveryWiederanlauf,
} from "../../erzeugt/index.js";

test("Fault: Crash-Restart nichtterminaler Arbeit erzeugt niemals ExecutionAuthority", () => {
  const result = ladeRecoveryWiederanlauf({
    schemaVersion: 1,
    workflowId: "WF-FAULT",
    checkpointId: "CP-FAULT",
    status: "NICHT_TERMINAL",
    sequenz: 7,
    zeitMs: 100,
    zustand: { phase: "GESENDET" },
  });
  assert.equal(result.art, "ABGLEICH_ERFORDERLICH");
  assert.equal(result.executionAuthority, false);
});

test("Fault: nichtkritischer asynchroner Writer ist bounded und macht Backpressure sichtbar", async () => {
  let resolve;
  const block = new Promise(r => { resolve = r; });
  const writer = new BegrenzterAsynchronerSchreiber(1, async () => block);
  assert.equal(writer.reiheEin({ id: 1 }), true);
  assert.equal(writer.reiheEin({ id: 2 }), false);
  resolve();
  await writer.warteBisLeer();
});

test("Fault: kritischer Alert-Persistenzfehler verhindert Claim", async () => {
  let claim = 0;
  const koordinator = new KritischerAlertKoordinator({
    async status() { return { offen: 0, maximum: 10 }; },
    async speichereDurable() { throw new Error("IO_FAULT"); },
    async claimDurable() { claim += 1; return { claimed: true }; },
  });
  await assert.rejects(() => koordinator.persistiereVorClaim({
    schemaVersion: 1,
    alertId: "FAULT-ALERT",
    dedupeSchluessel: "FAULT",
    schweregrad: "KRITISCH",
    erstelltAmMs: 1,
    art: "FAULT",
    inhalt: {},
  }), /IO_FAULT/);
  assert.equal(claim, 0);
});
