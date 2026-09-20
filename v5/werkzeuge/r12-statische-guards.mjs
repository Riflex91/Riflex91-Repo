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

const runner = liesText("werkzeuge/r12-controlled-live-equip-runner.mjs");
for (const marker of [
  "R12-EQUIP-ONCE",
  "D:\\\\AdventureLand-V5",
  "pruefeKeineOffeneV5Transaktion",
  "EinmaligesR12ControlledLiveGate",
  "PersistVorMutationTor",
  "AusfuehrungsKernel",
  "RecoveryKernel",
  "sameIntentRetry: false",
  "gameWrites: adapter.gameWrites",
  "unerwarteteGameWrites: 0",
  "breiteRuntimeFreigabe: false",
  "aktiviereBrowserPerformanceTrick",
  "performanceTrick",
]) {
  if (!runner.includes(marker)) fehler.push("CONTROLLED_LIVE_RUNNER_MARKER_FEHLT:" + marker);
}
if (runner.includes("bank_store(")
    || runner.includes("trade_buy(")
    || runner.includes("upgrade(")
    || runner.includes("compound(")
    || runner.includes("send_item(")
    || runner.includes("send_gold(")) {
  fehler.push("CONTROLLED_LIVE_RUNNER_RISIKO_WRITE_VERBOTEN");
}

const testGui = liesText("werkzeuge/v5-adventure-land-test-gui.js");
if (!testGui.includes("aktivierePerformanceTrick") || !testGui.includes("performanceTrickStatus") || !testGui.includes("performance_trick") || !testGui.includes("HOWLER_PLAYING_TRUE") || !testGui.includes("aktiv: verfuegbar && audioGefunden && playing")) fehler.push("PERFORMANCE_TRICK_HELPER_FEHLT");
for (const marker of [
  "Ergebnis kopieren",
  "Gesamtbericht kopieren",
  "kopiereErgebnis",
  "kopiereBericht",
  "bestaetigungsText",
]) {
  if (!testGui.includes(marker)) fehler.push("V5_TEST_GUI_MARKER_FEHLT:" + marker);
}
for (const raw of [
  ".attack(",
  ".move(",
  ".smart_move(",
  ".use_skill(",
  ".equip(",
  ".buy(",
  ".sell(",
  ".send_item(",
  ".send_gold(",
]) {
  if (testGui.includes(raw)) fehler.push("V5_TEST_GUI_DARF_KEINE_GAMEPLAY_AKTION_BESITZEN:" + raw);
}

const r12Gui = liesText("werkzeuge/r12-controlled-live-test-gui.js");
for (const marker of [
  "R12-EQUIP-ONCE",
  "VORHERIGER_TESTVERSUCH_UNGEKLAERT",
  "sameIntentRetry: false",
  "unerwarteteGameWrites: 0",
  "breiteRuntimeFreigabe: false",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "await guiApi().aktivierePerformanceTrick()",
]) {
  if (!r12Gui.includes(marker)) fehler.push("R12_TEST_GUI_MARKER_FEHLT:" + marker);
}
const browserEquip = liesText("werkzeuge/r12-live/browser-equip.mjs");
if (!browserEquip.includes("aktiviereBrowserPerformanceTrick") || !browserEquip.includes("userGesture: true") || !browserEquip.includes("HOWLER_PLAYING_TRUE") || !browserEquip.includes("aktiv: verfuegbar && audioGefunden && playing")) fehler.push("R12_CDP_PERFORMANCE_TRICK_FEHLT");

const direkteEquipAufrufe = (r12Gui.match(/\.equip\s*\(/g) ?? []).length;
if (direkteEquipAufrufe !== 1) {
  fehler.push("R12_TEST_GUI_MUSS_EXAKT_EINEN_EQUIP_SENDPFAD_BESITZEN:" + direkteEquipAufrufe);
}
for (const raw of [
  ".attack(",
  ".move(",
  ".smart_move(",
  ".use_skill(",
  ".buy(",
  ".sell(",
  ".send_item(",
  ".send_gold(",
  ".upgrade(",
  ".compound(",
]) {
  if (r12Gui.includes(raw)) fehler.push("R12_TEST_GUI_RISIKO_WRITE_VERBOTEN:" + raw);
}

if (fehler.length > 0) {
  throw new Error("[V5-R12-GUARD]\n" + [...new Set(fehler)].join("\n"));
}
console.log("[V5-R12-GUARD] OK");
