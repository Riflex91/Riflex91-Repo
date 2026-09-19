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
