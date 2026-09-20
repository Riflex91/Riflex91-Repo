import test from "node:test";
import assert from "node:assert/strict";

import {
  ModulRegister,
  gleicherPortVertrag,
} from "../../erzeugt/index.js";

function modul(modulId, modulVersion, optionen = {}) {
  return {
    schemaVersion: 1,
    modulId,
    modulVersion,
    bereitgestellteFaehigkeiten: optionen.bereitgestellteFaehigkeiten ?? [],
    benoetigteFaehigkeiten: optionen.benoetigteFaehigkeiten ?? [],
    bereitgestelltePorts: optionen.bereitgestelltePorts ?? [],
    benoetigtePorts: optionen.benoetigtePorts ?? [],
    standardAktiv: false,
  };
}

test("Port-Vertraege sind versionsgebunden und typisiert referenzierbar", () => {
  assert.equal(
    gleicherPortVertrag(
      { portId: "beobachtung.charakter", vertragsVersion: "1" },
      { portId: "beobachtung.charakter", vertragsVersion: "1" },
    ),
    true,
  );
  assert.equal(
    gleicherPortVertrag(
      { portId: "beobachtung.charakter", vertragsVersion: "1" },
      { portId: "beobachtung.charakter", vertragsVersion: "2" },
    ),
    false,
  );
});

test("Module starten default-off und benoetigen aktive Port-Anbieter", () => {
  const register = new ModulRegister();
  register.registriere(modul("beobachtung", "1", {
    bereitgestelltePorts: [{ portId: "beobachtung.charakter", vertragsVersion: "1" }],
  }));
  register.registriere(modul("planung", "1", {
    benoetigtePorts: [{ portId: "beobachtung.charakter", vertragsVersion: "1" }],
  }));

  assert.throws(
    () => register.aktiviere("planung", "1"),
    /MODUL_PORT_VORAUSSETZUNG_FEHLT/,
  );
  assert.equal(register.aktiviere("beobachtung", "1").aktiv, true);
  assert.equal(register.aktiviere("planung", "1").aktiv, true);
});

test("pro Modulkennung ist hoechstens eine Version aktiv", () => {
  const register = new ModulRegister();
  register.registriere(modul("beobachtung", "1"));
  register.registriere(modul("beobachtung", "2"));

  register.aktiviere("beobachtung", "1");
  assert.throws(
    () => register.aktiviere("beobachtung", "2"),
    /MODUL_ID_BEREITS_AKTIV/,
  );
});

test("aktive Modulversion wird ohne parallele Aktivitaet ersetzt", () => {
  const register = new ModulRegister();
  register.registriere(modul("beobachtung", "1", {
    bereitgestelltePorts: [{ portId: "beobachtung.charakter", vertragsVersion: "1" }],
  }));
  register.registriere(modul("beobachtung", "2", {
    bereitgestelltePorts: [{ portId: "beobachtung.charakter", vertragsVersion: "1" }],
  }));
  register.registriere(modul("planung", "1", {
    benoetigtePorts: [{ portId: "beobachtung.charakter", vertragsVersion: "1" }],
  }));

  register.aktiviere("beobachtung", "1");
  register.aktiviere("planung", "1");
  const neu = register.ersetzeAktiveVersion("beobachtung", "1", "2");

  assert.equal(neu.aktiv, true);
  assert.equal(register.aktiveVersion("beobachtung").modulVersion, "2");
  assert.equal(
    register.sicht().filter(eintrag => eintrag.modulId === "beobachtung" && eintrag.aktiv).length,
    1,
  );
});

test("Quarantaene deaktiviert ein Modul und standardAktiv ist in R7 verboten", () => {
  const register = new ModulRegister();
  register.registriere(modul("beobachtung", "1"));
  register.aktiviere("beobachtung", "1");

  assert.equal(register.setzeGesundheit("beobachtung", "1", "QUARANTAENE").aktiv, false);
  assert.throws(
    () => register.registriere({
      ...modul("planung", "1"),
      standardAktiv: true,
    }),
    /R7_MODUL_STANDARD_AKTIV_VERBOTEN/,
  );
});

test("Modul darf eigene Port-Voraussetzung nicht selbst erfuellen", () => {
  const register = new ModulRegister();
  register.registriere(modul("selbstbezug", "1", {
    bereitgestelltePorts: [{ portId: "port.selbst", vertragsVersion: "1" }],
    benoetigtePorts: [{ portId: "port.selbst", vertragsVersion: "1" }],
  }));

  assert.throws(
    () => register.aktiviere("selbstbezug", "1"),
    /MODUL_PORT_VORAUSSETZUNG_FEHLT/,
  );
});

test("Versionswechsel aktualisiert beide beteiligten Generationen atomar", () => {
  const register = new ModulRegister();
  const alt = register.registriere(modul("beobachtung", "1"));
  const neu = register.registriere(modul("beobachtung", "2"));
  register.aktiviere("beobachtung", "1");

  const aktiviert = register.ersetzeAktiveVersion("beobachtung", "1", "2");
  const sicht = register.sicht().filter(eintrag => eintrag.modulId === "beobachtung");
  const altNachher = sicht.find(eintrag => eintrag.modulVersion === "1");
  const neuNachher = sicht.find(eintrag => eintrag.modulVersion === "2");

  assert.ok(altNachher.generation > alt.generation);
  assert.ok(neuNachher.generation > neu.generation);
  assert.equal(altNachher.generation, neuNachher.generation);
  assert.equal(aktiviert.generation, neuNachher.generation);
});
