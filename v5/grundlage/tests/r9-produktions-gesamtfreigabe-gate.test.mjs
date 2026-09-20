import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ProduktivesV5GesamtfreigabeGate,
  V5_GESAMTFREIGABE_BESTAETIGUNG,
  bewerteProduktionsGesamtfreigabe,
} from "../../erzeugt/index.js";

function liesJson(relativ) {
  return JSON.parse(
    fs.readFileSync(new URL(relativ, import.meta.url), "utf8"),
  );
}

function kopie(wert) {
  return JSON.parse(JSON.stringify(wert));
}

const bereitschaft = liesJson("../../bereitschaft/laufzeit-bereitschaft.json");
const gesamtfreigabe = liesJson("../../roadmap/gesamtfreigabe.json");

const kontext = Object.freeze({
  transaktionsId: "T-PROD-1",
  faehigkeitId: "bank.deposit",
  eigentuemerModulId: "merchant-core",
  actionContractId: "AL-ACTION-BANK-DEPOSIT",
  recoveryContractId: "AL-RECOVERY-BANK-DEPOSIT",
  verifierId: "AL-VERIFIER-BANK-DEPOSIT",
});

test("aktuelle gemergte Gesamtfreigabe oeffnet das Produktions-Laufzeitgate", () => {
  const bewertung = bewerteProduktionsGesamtfreigabe(
    bereitschaft,
    gesamtfreigabe,
  );
  assert.equal(bewertung.erlaubt, true);
  assert.deepEqual(bewertung.gruende, []);
  assert.equal(
    bewertung.releaseCandidateSha,
    gesamtfreigabe.releaseCandidateSha,
  );

  const gate = new ProduktivesV5GesamtfreigabeGate(
    bereitschaft,
    gesamtfreigabe,
    1,
  );
  assert.deepEqual(gate.pruefe(kontext), {
    freigegeben: true,
    generation: 1,
    nachweisId: "V5_GESAMTFREIGABE:" + gesamtfreigabe.releaseCandidateSha,
  });
});

test("Produktions-Gate verlangt bei jeder Admission einen vollstaendigen Kontext", () => {
  const gate = new ProduktivesV5GesamtfreigabeGate(
    bereitschaft,
    gesamtfreigabe,
    7,
  );

  assert.equal(gate.pruefe().freigegeben, false);
  assert.equal(
    gate.pruefe({ ...kontext, eigentuemerModulId: "" }).freigegeben,
    false,
  );
  assert.equal(gate.pruefe(kontext).freigegeben, true);
});

test("einfache Fortsetzungsworte koennen die Betreiberfreigabe nicht ersetzen", () => {
  const manipuliert = kopie(gesamtfreigabe);
  manipuliert.bestaetigungText = "ok";

  const bewertung = bewerteProduktionsGesamtfreigabe(
    bereitschaft,
    manipuliert,
  );
  assert.equal(bewertung.erlaubt, false);
  assert.ok(
    bewertung.gruende.includes("GESAMTFREIGABE_BESTAETIGUNG_UNGUELTIG"),
  );
  assert.equal(V5_GESAMTFREIGABE_BESTAETIGUNG, "V5 GESAMTFREIGABE ERTEILEN");
});

test("Safety-Flag offene Blocker oder Evidence-Pfadabweichung sperren fail-closed", () => {
  const faelle = [
    {
      bereit: kopie(bereitschaft),
      frei: (() => {
        const wert = kopie(gesamtfreigabe);
        wert.sicherheit.killSwitchBleibtWirksam = false;
        return wert;
      })(),
      grund: "GESAMTFREIGABE_SICHERHEIT_FEHLT:killSwitchBleibtWirksam",
    },
    {
      bereit: (() => {
        const wert = kopie(bereitschaft);
        wert.offeneBlocker = ["TEST_BLOCKER"];
        return wert;
      })(),
      frei: kopie(gesamtfreigabe),
      grund: "LAUFZEIT_BEREITSCHAFT_BLOCKER_OFFEN",
    },
    {
      bereit: (() => {
        const wert = kopie(bereitschaft);
        wert.gesamtfreigabeNachweis = "v5/roadmap/falsch.json";
        return wert;
      })(),
      frei: kopie(gesamtfreigabe),
      grund: "LAUFZEIT_BEREITSCHAFT_NACHWEISPFAD_UNGUELTIG",
    },
  ];

  for (const fall of faelle) {
    const bewertung = bewerteProduktionsGesamtfreigabe(
      fall.bereit,
      fall.frei,
    );
    assert.equal(bewertung.erlaubt, false);
    assert.ok(bewertung.gruende.includes(fall.grund));
    const gate = new ProduktivesV5GesamtfreigabeGate(
      fall.bereit,
      fall.frei,
      2,
    );
    assert.equal(gate.pruefe(kontext).freigegeben, false);
  }
});

test("Release-Candidate-Bindung muss zwischen beiden Evidence-Artefakten exakt passen", () => {
  const manipuliert = kopie(bereitschaft);
  manipuliert.gesamtfreigabeReleaseCandidateSha =
    "1111111111111111111111111111111111111111";

  const bewertung = bewerteProduktionsGesamtfreigabe(
    manipuliert,
    gesamtfreigabe,
  );
  assert.equal(bewertung.erlaubt, false);
  assert.ok(
    bewertung.gruende.includes(
      "LAUFZEIT_BEREITSCHAFT_RELEASE_SHA_STIMMT_NICHT",
    ),
  );
});
