import test from "node:test";
import assert from "node:assert/strict";
import { bewerteSpeicherGesundheit } from "../r3-speicher-gesundheit.mjs";

const basis = {
  vorhanden: true,
  laufwerk: "D:",
  bereit: true,
  festplattenTyp: "SSD",
  gesamtBytes: 1_000,
  freiBytes: 200,
};

test("gesunde D-SSD mit Reserve wird akzeptiert", () => {
  assert.equal(bewerteSpeicherGesundheit(basis).gesund, true);
});

test("fehlendes Volume wird erkannt", () => {
  assert.equal(bewerteSpeicherGesundheit({ ...basis, vorhanden: false }).grund, "SSD_VOLUME_FEHLT");
});

test("falsches Volume wird erkannt", () => {
  assert.equal(bewerteSpeicherGesundheit({ ...basis, laufwerk: "C:" }).grund, "FALSCHES_VOLUME");
});

test("Nicht-SSD wird erkannt", () => {
  assert.equal(bewerteSpeicherGesundheit({ ...basis, festplattenTyp: "HDD" }).grund, "MEDIENTYP_NICHT_SSD");
});

test("Reserve unter 15 Prozent wird blockiert", () => {
  assert.equal(
    bewerteSpeicherGesundheit({ ...basis, freiBytes: 149 }).grund,
    "KRITISCHE_SPEICHERRESERVE_UNTERSCHRITTEN",
  );
});
