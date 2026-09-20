import test from "node:test";
import assert from "node:assert/strict";

import {
  EinmaligesR12ControlledLiveGate,
  bewerteControlledLive,
} from "../../erzeugt/index.js";

const basis = {
  roadmapPhase: "R12",
  gesamtRuntimeStatus: "GESPERRT",
  actionContractId: "AL-ACTION-EQUIP",
  publicFunction: "equip",
  shadowVollstaendig: true,
  shadowUnerwarteteWrites: 0,
  operatorFreigabe: true,
  maximaleAktionen: 1,
  healthStatus: "GESUND",
  persistenzGesund: true,
  reconciliationClean: true,
  alternativeRuntimeAktiv: false,
};

const kontext = {
  transaktionsId: "R12-LIVE-T-1",
  faehigkeitId: "equipment.equip",
  eigentuemerModulId: "vertical-slice-controlled-live",
  actionContractId: "AL-ACTION-EQUIP",
  recoveryContractId: "AL-RECOVERY-EQUIP",
  verifierId: "AL-VERIFIER-EQUIP",
};

test("R12 Controlled Live darf eng begrenzt laufen obwohl breite Runtime GESPERRT bleibt", () => {
  const entscheidung = bewerteControlledLive(basis);
  assert.equal(entscheidung.erlaubt, true);
  assert.equal(entscheidung.breiteRuntimeFreigabe, false);
});

test("R12 Controlled Live fail-closed bei Health Storage Reconcile oder Alt-Runtime", () => {
  for (const delta of [
    { healthStatus: "DEGRADIERT" },
    { persistenzGesund: false },
    { reconciliationClean: false },
    { alternativeRuntimeAktiv: true },
    { operatorFreigabe: false },
    { shadowUnerwarteteWrites: 1 },
    { maximaleAktionen: 2 },
  ]) {
    assert.equal(bewerteControlledLive({ ...basis, ...delta }).erlaubt, false);
  }
});

test("Einmaliges Controlled-Live-Gate akzeptiert nur exakten Equip-Kontext und verbraucht sich", () => {
  const gate = new EinmaligesR12ControlledLiveGate(
    basis,
    1,
    "R12-CONTROLLED-LIVE-EQUIP",
  );

  const falsch = gate.pruefe({ ...kontext, actionContractId: "AL-ACTION-UPGRADE" });
  assert.equal(falsch.freigegeben, false);
  assert.equal(gate.verbraucht(), false);

  const erlaubt = gate.pruefe(kontext);
  assert.equal(erlaubt.freigegeben, true);
  assert.equal(gate.verbraucht(), true);

  const nochmal = gate.pruefe(kontext);
  assert.equal(nochmal.freigegeben, false);
  assert.match(nochmal.nachweisId, /VERBRAUCHT$/);
});

test("Controlled Live bleibt strikt auf equip beschraenkt", () => {
  const riskant = bewerteControlledLive({
    ...basis,
    actionContractId: "AL-ACTION-UPGRADE",
    publicFunction: "upgrade",
  });
  assert.equal(riskant.erlaubt, false);
  assert.ok(riskant.gruende.includes("ACTION_NICHT_LOW_RISK_SLICE"));
  assert.ok(riskant.gruende.includes("RISIKO_ACTION_VERBOTEN"));
});
