import fs from "node:fs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const shadow = liesText("grundlage/quelle/vertical-slice/shadow-adapter.ts");
if (!shadow.includes("rohSchreibAufrufe(): number")
    || !shadow.includes("return 0;")
    || !shadow.includes('"SHADOW"')) {
  fehler.push("SHADOW_ZERO_WRITE_VERTRAG_FEHLT");
}
const rawWriteNamen = [
  "attack",
  "smart_move",
  "move",
  "use_skill",
  "equip",
  "unequip",
  "buy",
  "sell",
  "send_item",
  "send_gold",
];
if (rawWriteNamen.some(name => shadow.includes(name + "("))) {
  fehler.push("SHADOW_RAW_GAME_WRITE_VERBOTEN");
}

const policy = liesText("grundlage/quelle/vertical-slice/controlled-live-policy.ts");
for (const marker of [
  '"AL-ACTION-EQUIP"',
  '"equip"',
  '"HEALTH_NICHT_GESUND"',
  '"PERSISTENZ_NICHT_GESUND"',
  '"RECONCILIATION_NICHT_CLEAN"',
  '"ALTERNATIVE_RUNTIME_AKTIV"',
  '"SHADOW_NACHWEIS_FEHLT"',
  '"OPERATOR_FREIGABE_FEHLT"',
  '"CONTROLLED_LIVE_NUR_EINE_ACTION"',
]) {
  if (!policy.includes(marker)) fehler.push("CONTROLLED_LIVE_MARKER_FEHLT:" + marker);
}
for (const riskant of [
  "bank_store",
  "bank_retrieve",
  "trade_buy",
  "trade_sell",
  "send_item",
  "send_gold",
  "upgrade",
  "compound",
  "exchange",
  "craft",
]) {
  if (!policy.includes('"' + riskant + '"')) fehler.push("RISIKO_ACTION_AUSSCHLUSS_FEHLT:" + riskant);
}

const test = liesText("grundlage/tests/r12-vertical-slice-shadow.test.mjs");
if (!test.includes('assert.equal(adapter.rohSchreibAufrufe(), 0)')
    || !test.includes('gesamtRuntimeStatus: "GESPERRT"')
    || !test.includes('protokoll.vollstaendig()')) {
  fehler.push("R12_SHADOW_NACHWEIS_UNVOLLSTAENDIG");
}

const oneShotGate = liesText("grundlage/quelle/vertical-slice/controlled-live-gate.ts");
for (const marker of [
  "EinmaligesR12ControlledLiveGate",
  "R12_CONTROLLED_LIVE_ACTION_CONTRACT",
  "vertical-slice-controlled-live",
  "VERBRAUCHT",
]) {
  if (!oneShotGate.includes(marker)) fehler.push("CONTROLLED_LIVE_GATE_MARKER_FEHLT:" + marker);
}

const auswahl = liesText("grundlage/quelle/vertical-slice/controlled-live-auswahl.ts");
for (const marker of [
  "validiereControlledLiveRuhezustand",
  "waehleControlledLiveEquipKandidat",
  "ALTERNATIVE_RUNTIME_AKTIV",
]) {
  if (!auswahl.includes(marker)) fehler.push("CONTROLLED_LIVE_AUSWAHL_MARKER_FEHLT:" + marker);
}

if (fehler.length > 0) {
  throw new Error("[V5-R12-GUARD]\n" + [...new Set(fehler)].join("\n"));
}
console.log("[V5-R12-GUARD] OK");
