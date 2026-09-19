import test from "node:test";
import assert from "node:assert/strict";
import { VersionierterAnzeigekatalog } from "../../erzeugt/index.js";

const basis = {
  schemaVersion: 1,
  katalogVersion: 1,
  revalidiertAm: "2026-09-20",
  quellenNachweis: "TEST_EVIDENCE",
};

test("Skill-Anzeige verlangt deutschen Namen und deutsche Beschreibung", () => {
  const katalog = new VersionierterAnzeigekatalog(1, [{
    ...basis,
    externeKennung: "quickpunch",
    kategorie: "FAEHIGKEIT",
    deutscherAnzeigename: "Schneller Schlag",
    deutscheBeschreibung: "Führt einen schnellen Schlag gegen das Ziel aus.",
    quellenStatus: "DEUTSCH_GEPRUEFT",
  }]);
  assert.deepEqual(katalog.loeseAuf("FAEHIGKEIT", "quickpunch"), {
    text: "Schneller Schlag",
    beschreibung: "Führt einen schnellen Schlag gegen das Ziel aus.",
    vollstaendig: true,
    fallbackArt: "KEINER",
  });

  assert.throws(() => new VersionierterAnzeigekatalog(1, [{
    ...basis,
    externeKennung: "quickpunch",
    kategorie: "FAEHIGKEIT",
    deutscherAnzeigename: "Schneller Schlag",
    quellenStatus: "DEUTSCH_GEPRUEFT",
  }]), /SKILL_BESCHREIBUNG_FEHLT/);
});

test("fehlende normale Uebersetzung leakt niemals englische Rohkennung", () => {
  const katalog = new VersionierterAnzeigekatalog(1, []);
  assert.deepEqual(katalog.loeseAuf("FAEHIGKEIT", "quickpunch"), {
    text: "Unbekannte Fähigkeit",
    beschreibung: "Keine deutsche Beschreibung verfügbar.",
    vollstaendig: false,
    fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
  });
  assert.deepEqual(katalog.loeseAuf("KLASSE", "ranger"), {
    text: "Unbekannte Klasse",
    vollstaendig: false,
    fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
  });
});

test("Monster-Originalname braucht expliziten revalidierten ORIGINALNAME_ERLAUBT-Status", () => {
  const katalog = new VersionierterAnzeigekatalog(1, [{
    ...basis,
    externeKennung: "phoenix",
    kategorie: "MONSTER",
    originalName: "Phoenix",
    quellenStatus: "ORIGINALNAME_ERLAUBT",
  }]);
  assert.deepEqual(katalog.loeseAuf("MONSTER", "phoenix"), {
    text: "Phoenix",
    vollstaendig: true,
    fallbackArt: "MONSTER_ORIGINALNAME",
  });

  const leer = new VersionierterAnzeigekatalog(1, []);
  assert.deepEqual(leer.loeseAuf("MONSTER", "phoenix"), {
    text: "Unbekanntes Monster",
    vollstaendig: false,
    fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
  });
});

test("offizielle deutsche Monsterbezeichnung gewinnt nach Revalidierung", () => {
  const original = new VersionierterAnzeigekatalog(1, [{
    ...basis,
    externeKennung: "testmonster",
    kategorie: "MONSTER",
    originalName: "Test Monster",
    quellenStatus: "ORIGINALNAME_ERLAUBT",
  }]);
  assert.equal(original.loeseAuf("MONSTER", "testmonster").text, "Test Monster");

  const offiziell = new VersionierterAnzeigekatalog(2, [{
    ...basis,
    katalogVersion: 2,
    externeKennung: "testmonster",
    kategorie: "MONSTER",
    originalName: "Test Monster",
    deutscherAnzeigename: "Testmonster",
    quellenStatus: "DEUTSCH_OFFIZIELL",
    revalidiertAm: "2026-09-21",
  }]);
  assert.equal(offiziell.loeseAuf("MONSTER", "testmonster").text, "Testmonster");
});

test("eigene Monster-Uebersetzung darf nicht als Originalname-Ausnahme eingeschleust werden", () => {
  assert.throws(() => new VersionierterAnzeigekatalog(1, [{
    ...basis,
    externeKennung: "testmonster",
    kategorie: "MONSTER",
    originalName: "Test Monster",
    deutscherAnzeigename: "Erfundener Name",
    quellenStatus: "ORIGINALNAME_ERLAUBT",
  }]), /MONSTER_EIGENE_UEBERSETZUNG_NICHT_ERLAUBT/);
});

test("Katalog-Abdeckung ist maschinenlesbar und 100 Prozent nur ohne Luecke", () => {
  const katalog = new VersionierterAnzeigekatalog(1, [
    {
      ...basis,
      externeKennung: "merchant",
      kategorie: "KLASSE",
      deutscherAnzeigename: "Händler",
      quellenStatus: "DEUTSCH_GEPRUEFT",
    },
    {
      ...basis,
      externeKennung: "ready",
      kategorie: "STATUS",
      deutscherAnzeigename: "Bereit",
      quellenStatus: "DEUTSCH_GEPRUEFT",
    },
  ]);
  assert.deepEqual(katalog.pruefeAbdeckung([
    { kategorie: "KLASSE", externeKennung: "merchant" },
    { kategorie: "STATUS", externeKennung: "ready" },
  ]), {
    erwartet: 2,
    abgedeckt: 2,
    abdeckungProzent: 100,
    fehlend: [],
    vollstaendig: true,
  });
  assert.equal(katalog.pruefeAbdeckung([
    { kategorie: "KLASSE", externeKennung: "ranger" },
  ]).vollstaendig, false);
});
