import fs from "node:fs";
import path from "node:path";

const wurzel = process.cwd();
const fehler = [];
const liesText = pfad => fs.readFileSync(path.join(wurzel, pfad), "utf8");

const admission = liesText("grundlage/quelle/ausfuehrung/admission.ts");
for (const marker of [
  "ErteilteAusfuehrungsFreigabe",
  "private constructor",
  "LAUFZEIT_GATE_GESPERRT",
  "FAEHIGKEITS_AUTORITAET_FEHLT",
  "OPERATOR_DENY",
  "AKTIONS_VERTRAG_NICHT_FREIGEGEBEN",
  "RESSOURCEN_FENCING_UNGUELTIG",
  "ACTION_KANAL_FENCING_UNGUELTIG",
  "SOCKET_BUDGET_RESERVIERUNG_UNGUELTIG",
  "LIVE_VORAUSSETZUNG_STALE_ODER_UNGUELTIG",
  "bindeDurablesIntent",
]) {
  if (!admission.includes(marker)) fehler.push("ADMISSION_MARKER_FEHLT:" + marker);
}

const intent = liesText("grundlage/quelle/ausfuehrung/intent-bindung.ts");
for (const marker of [
  "DURABLE_INTENT_TOKEN_UNGUELTIG",
  "DURABLE_INTENT_BINDUNG_STIMMT_NICHT",
  "action_contract_id",
  "recovery_contract_id",
  "verifier_id",
]) {
  if (!intent.includes(marker)) fehler.push("INTENT_BINDUNG_MARKER_FEHLT:" + marker);
}

const kernel = liesText("grundlage/quelle/ausfuehrung/ausfuehrungs-kernel.ts");
for (const marker of [
  "instanceof ErteilteAusfuehrungsFreigabe",
  "TYPISIERTE_AUSFUEHRUNGSFREIGABE_FEHLT",
  "pruefeFuerAusfuehrung",
]) {
  if (!kernel.includes(marker)) fehler.push("AUSFUEHRUNGS_KERNEL_MARKER_FEHLT:" + marker);
}

const r3Regeln = liesText("werkzeuge/r3-guard-regeln.mjs");
if (!r3Regeln.includes('!pfad.startsWith("ausfuehrung/quelle/adapter/")')) {
  fehler.push("RAW_WRITE_AUSNAHME_NICHT_AUF_EXECUTION_ADAPTER_BE GRENZT".replace(" ", ""));
}

const quellWurzeln = [
  "grundlage/quelle",
  "laufzeit/quelle",
  "module/quelle",
  "scheduler/quelle",
  "lernen/quelle",
  "beobachtung/quelle",
  "merchant/quelle",
  "gruppe/quelle",
  "kampf/quelle",
  "bewegung/quelle",
  "navigation/quelle",
  "welt/quelle",
  "oberflaeche/quelle",
  "host/quelle",
];

function sammle(verzeichnis) {
  if (!fs.existsSync(verzeichnis)) return [];
  const ergebnis = [];
  for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
    const voll = path.join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) ergebnis.push(...sammle(voll));
    else if (eintrag.isFile() && /\.(?:ts|mts|cts|mjs)$/.test(eintrag.name)) ergebnis.push(voll);
  }
  return ergebnis;
}

for (const basisRelativ of quellWurzeln) {
  const basis = path.join(wurzel, basisRelativ);
  for (const datei of sammle(basis)) {
    const relativ = path.relative(wurzel, datei).replaceAll("\\", "/");
    const text = fs.readFileSync(datei, "utf8");
    if (/ausfuehrung\/quelle\/adapter\//.test(text)) {
      fehler.push("EXECUTION_ADAPTER_BYPASS:" + relativ);
    }
  }
}

if (fehler.length > 0) {
  throw new Error("[V5-R9-GUARD]\n" + [...new Set(fehler)].join("\n"));
}
console.log("[V5-R9-GUARD] OK");
