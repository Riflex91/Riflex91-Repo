import test from "node:test";
import assert from "node:assert/strict";

import {
  BedienerRichtlinienDienst,
  FaehigkeitsRegister,
} from "../../erzeugt/index.js";

function mutierend(anbieterModulId, anbieterVersion = "1.0.0") {
  return {
    schemaVersion: 1,
    faehigkeitId: "merchant.transfer",
    anbieterModulId,
    anbieterVersion,
    modus: "MUTIEREN",
    status: "VERFUEGBAR",
    standardAktiv: false,
  };
}

test("mutierende Faehigkeiten sind default-off und Single-Owner", () => {
  const register = new FaehigkeitsRegister();
  const erster = register.registriere(mutierend("merchant-a"));

  assert.equal(erster.aktiv, false);
  assert.equal(register.mutierenderAnbieter("merchant.transfer").anbieterModulId, "merchant-a");
  assert.throws(
    () => register.registriere(mutierend("merchant-b")),
    /MUTIERENDER_OWNER_BEREITS_VERGEBEN/,
  );
  assert.throws(
    () => register.registriere({ ...mutierend("merchant-c"), standardAktiv: true }),
    /MUTIERENDE_FAEHIGKEIT_STANDARD_AKTIV_VERBOTEN/,
  );
  assert.throws(
    () => register.aktiviereNichtMutierend("merchant.transfer", "merchant-a"),
    /R7_MUTIERENDE_AKTIVIERUNG_GESPERRT/,
  );
});

test("mutierender Anbieter kann nur inaktiv und atomar ersetzt werden", () => {
  const register = new FaehigkeitsRegister();
  register.registriere(mutierend("merchant-alt", "1.0.0"));

  const neu = register.ersetzeMutierendenAnbieter(
    "merchant.transfer",
    "merchant-alt",
    mutierend("merchant-neu", "2.0.0"),
  );

  assert.equal(neu.anbieterModulId, "merchant-neu");
  assert.equal(neu.anbieterVersion, "2.0.0");
  assert.equal(neu.aktiv, false);
  assert.equal(neu.status, "DEAKTIVIERT");
  assert.equal(register.sicht().length, 1);
});

test("nichtmutierende Faehigkeiten besitzen expliziten Lifecycle und Quarantaene", () => {
  const register = new FaehigkeitsRegister();
  const lesend = register.registriere({
    schemaVersion: 1,
    faehigkeitId: "observation.character",
    anbieterModulId: "beobachtung-a",
    anbieterVersion: "1.0.0",
    modus: "LESEN",
    status: "VERFUEGBAR",
    standardAktiv: true,
  });

  assert.equal(lesend.aktiv, true);
  assert.equal(register.deaktiviere("observation.character", "beobachtung-a").aktiv, false);
  assert.equal(register.aktiviereNichtMutierend("observation.character", "beobachtung-a").aktiv, true);

  const quarantiniert = register.setzeStatus(
    "observation.character",
    "beobachtung-a",
    "QUARANTAENE",
  );
  assert.equal(quarantiniert.aktiv, false);
  assert.throws(
    () => register.aktiviereNichtMutierend("observation.character", "beobachtung-a"),
    /FAEHIGKEIT_NICHT_VERFUEGBAR/,
  );
});

test("Bediener-Deny und Nothalt reduzieren Autoritaet und werden vor Wirkung durable protokolliert", async () => {
  const protokoll = {
    eintraege: [],
    async schreibeDurable(eintrag) {
      this.eintraege = [...this.eintraege, eintrag];
    },
  };
  const dienst = new BedienerRichtlinienDienst(protokoll);

  assert.equal(dienst.istErlaubt("merchant.transfer"), true);
  await dienst.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "B-1",
    bedienerId: "OP-1",
    zeitMs: 100,
    art: "FAEHIGKEIT_SPERREN",
    faehigkeitId: "merchant.transfer",
  });
  assert.equal(dienst.istErlaubt("merchant.transfer"), false);
  assert.equal(protokoll.eintraege[0].wirkung, "AUTORITAET_REDUZIERT");
  assert.equal(protokoll.eintraege[0].gameplayAutoritaetErhoeht, false);
  assert.equal(protokoll.eintraege[0].safetyUmgangen, false);

  await dienst.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "B-2",
    bedienerId: "OP-1",
    zeitMs: 101,
    art: "NOTHALT_AKTIVIEREN",
  });
  assert.equal(dienst.istErlaubt("observation.character"), false);
  assert.equal(dienst.snapshot().nothaltAktiv, true);
});

test("fehlgeschlagene Bediener-Protokollierung veraendert keine Richtlinie", async () => {
  const dienst = new BedienerRichtlinienDienst({
    async schreibeDurable() {
      throw new Error("PROTOKOLL_NICHT_DURABLE");
    },
  });

  await assert.rejects(
    () => dienst.wendeDenyAn({
      schemaVersion: 1,
      befehlId: "B-3",
      bedienerId: "OP-2",
      zeitMs: 200,
      art: "FAEHIGKEIT_SPERREN",
      faehigkeitId: "merchant.transfer",
    }),
    /PROTOKOLL_NICHT_DURABLE/,
  );
  assert.equal(dienst.istErlaubt("merchant.transfer"), true);
  assert.equal(dienst.snapshot().nothaltAktiv, false);
});
