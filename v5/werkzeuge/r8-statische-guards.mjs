import fs from "node:fs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const workflow = liesText("grundlage/quelle/scheduler/workflow-vertrag.ts");
for (const marker of [
  "WissensSnapshotPin",
  "gitCommit",
  "quellenSha256",
  "maximaleVersuche",
  "maximaleDauerMs",
  "anfangsBackoffMs",
  "maximalerBackoffMs",
  "circuitSchluessel",
  "gameplayAutoritaet: false",
  "rawWriteAutoritaet: false",
]) {
  if (!workflow.includes(marker)) fehler.push("ABLAUF_VERTRAG_MARKER_FEHLT:" + marker);
}

const ressourcen = liesText("grundlage/quelle/scheduler/ressourcen-verwalter.ts");
for (const marker of [
  '"ACTION_KANAL"',
  '"LANGLEBIG"',
  "epoche",
  "FencingToken",
  "ABGELAUFEN_ABGLEICH",
  "RESSOURCE_BELEGT",
  "schliesseAbgleichAb",
]) {
  if (!ressourcen.includes(marker)) fehler.push("RESSOURCEN_GUARD_MARKER_FEHLT:" + marker);
}
if (!ressourcen.includes(".sort((a, b) => a.ressourcenId.localeCompare(b.ressourcenId))")) {
  fehler.push("DETERMINISTISCHE_LOCK_REIHENFOLGE_FEHLT");
}

const budget = liesText("grundlage/quelle/scheduler/socket-budget.ts");
for (const marker of [
  "actionKanalRessourcenId",
  "socketBudgetRessourcenId",
  "planBudget = 100",
  "serverGrenze = 200",
  "fensterMs = 4_000",
  "SOCKET_BUDGET_PLANLIMIT_UEBERSCHRITTEN",
]) {
  if (!budget.includes(marker)) fehler.push("SOCKET_BUDGET_MARKER_FEHLT:" + marker);
}

const retry = liesText("grundlage/quelle/scheduler/retry-circuit.ts");
for (const marker of [
  "VERSUCHE_AUSGESCHOEPFT",
  "ZEITBUDGET_AUSGESCHOEPFT",
  "CIRCUIT_OFFEN",
  "MOEGLICHER_SEND_ABGLEICH_ERFORDERLICH",
  "BegrenztesCircuitRegister",
]) {
  if (!retry.includes(marker)) fehler.push("RETRY_CIRCUIT_MARKER_FEHLT:" + marker);
}

const scheduler = liesText("grundlage/quelle/scheduler/ablauf-scheduler.ts");
for (const marker of [
  "agingIntervallMs",
  "WARTEN_BIS_SICHERER_PUNKT",
  "UNTERBRECHUNG_BEI_IRREVERSIBLER_MUTATION_VERBOTEN",
  "UNTERBRECHUNG_OHNE_DURABLEN_CHECKPOINT_VERBOTEN",
  "istSafetyOderNotfall",
]) {
  if (!scheduler.includes(marker)) fehler.push("SCHEDULER_MARKER_FEHLT:" + marker);
}

if (fehler.length > 0) {
  throw new Error("[V5-R8-GUARD]\n" + [...new Set(fehler)].join("\n"));
}
console.log("[V5-R8-GUARD] OK");
