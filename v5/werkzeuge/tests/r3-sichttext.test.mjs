import test from "node:test";
import assert from "node:assert/strict";
import { pruefeSichttext } from "../r3-sichttext-regeln.mjs";

test("normale UI ohne deutsche Uebersetzung wird blockiert", () => {
  assert.deepEqual(
    pruefeSichttext({ kategorie: "status", deutscherText: "", rohwert: "cooldown_ready" }),
    { erlaubt: false, grund: "DEUTSCHE_UEBERSETZUNG_FEHLT" },
  );
});

test("technische Rohkennung darf nicht als angeblich deutscher UI-Text leaken", () => {
  assert.deepEqual(
    pruefeSichttext({ kategorie: "aktion", deutscherText: "trade_buy", rohwert: "trade_buy" }),
    { erlaubt: false, grund: "TECHNISCHE_ROHKENNUNG_IN_UI" },
  );
});

test("Monster-Originalname ist nur ohne offizielle deutsche Bezeichnung erlaubt", () => {
  assert.deepEqual(
    pruefeSichttext({
      kategorie: "monster",
      deutscherText: "",
      rohwert: "Phoenix",
      offizielleDeutscheMonsterbezeichnungVorhanden: false,
      monsterQuellenStatus: "ORIGINALNAME_ERLAUBT",
    }),
    { erlaubt: true, text: "Phoenix", ausnahme: "MONSTER_ORIGINALNAME" },
  );
});

test("existiert eine offizielle deutsche Monsterbezeichnung, ist Rohfallback gesperrt", () => {
  assert.deepEqual(
    pruefeSichttext({
      kategorie: "monster",
      deutscherText: "",
      rohwert: "Phoenix",
      offizielleDeutscheMonsterbezeichnungVorhanden: true,
      monsterQuellenStatus: "ORIGINALNAME_ERLAUBT",
    }),
    { erlaubt: false, grund: "DEUTSCHE_MONSTERBEZEICHNUNG_FEHLT" },
  );
});

test("deutscher Text wird akzeptiert", () => {
  assert.deepEqual(
    pruefeSichttext({ kategorie: "status", deutscherText: "Bereit", rohwert: "ready" }),
    { erlaubt: true, text: "Bereit" },
  );
});

test("erfundene Monster-Uebersetzung ohne offiziellen Nachweis wird blockiert", () => {
  assert.deepEqual(
    pruefeSichttext({
      kategorie: "monster",
      deutscherText: "Feuervogel",
      rohwert: "Phoenix",
      offizielleDeutscheMonsterbezeichnungVorhanden: false,
      monsterQuellenStatus: "ORIGINALNAME_ERLAUBT",
    }),
    { erlaubt: false, grund: "MONSTER_UEBERSETZUNG_OHNE_OFFIZIELLEN_NACHWEIS" },
  );
});

test("offizielle deutsche Monsterbezeichnung braucht DEUTSCH_OFFIZIELL", () => {
  assert.deepEqual(
    pruefeSichttext({
      kategorie: "monster",
      deutscherText: "Testmonster",
      rohwert: "Test Monster",
      offizielleDeutscheMonsterbezeichnungVorhanden: true,
      monsterQuellenStatus: "DEUTSCH_OFFIZIELL",
    }),
    { erlaubt: true, text: "Testmonster" },
  );
});
