import fs from "node:fs";
import { pruefeSafetyQuelltexte } from "./r11-safety-source-checks.mjs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const quellen = {
  admission: liesText("grundlage/quelle/ausfuehrung/admission.ts"),
  recovery: liesText("grundlage/quelle/recovery/recovery-kernel.ts"),
  restart: liesText("grundlage/quelle/recovery/wiederanlauf.ts"),
  health: liesText("grundlage/quelle/operations/health.ts"),
  alerts: liesText("grundlage/quelle/operations/alerts.ts"),
};
fehler.push(...pruefeSafetyQuelltexte(quellen));

const telemetrie = liesText("grundlage/quelle/operations/telemetrie.ts");
for (const marker of [
  "ssdIoLatenzMs",
  "ioQueueTiefe",
  "backpressureAktiv",
  "freieBytes",
  "recorderDrops",
  "dashboardFehler",
  "verworfeneMetriken",
  "actionAuthority: false",
  "publiziereBestEffort",
]) {
  if (!telemetrie.includes(marker)) fehler.push("TELEMETRIE_MARKER_FEHLT:" + marker);
}

const authority = liesText("grundlage/quelle/operations/authority-status.ts");
for (const marker of [
  "ownerModulId",
  "evidenceIds",
  "ressourcenIds",
  "policyId",
  "erwarteteWirkung",
]) {
  if (!authority.includes(marker)) fehler.push("AUTHORITY_STATUS_MARKER_FEHLT:" + marker);
}

const supervisor = liesText("grundlage/quelle/operations/headless-supervisor.ts");
if (!supervisor.includes("actionAuthority: false")
    || !supervisor.includes('health.zustand === "GESUND"')) {
  fehler.push("HEADLESS_SUPERVISOR_FAIL_CLOSED_UNVOLLSTAENDIG");
}

const segmente = liesText("grundlage/quelle/operations/segment-pflege.ts");
for (const marker of ["maximaleSegmente","maximaleBytes","maximalesAlterMs","komprimiereAbAlterMs"]) {
  if (!segmente.includes(marker)) fehler.push("SEGMENT_PFLEGE_MARKER_FEHLT:" + marker);
}

const golden = liesText("grundlage/quelle/testlabor/golden-replay.ts");
const evidenceReplay = liesText("grundlage/quelle/testlabor/evidence-replay.ts");
if (!golden.includes("serialisiereReplaySnapshot")
    || !golden.includes("stimmtUeberein")) {
  fehler.push("GOLDEN_REPLAY_UNVOLLSTAENDIG");
}
if (!evidenceReplay.includes("verworfenWegenGrenze")
    || !evidenceReplay.includes("EVIDENCE_REPLAY_UNBOUNDED")) {
  fehler.push("EVIDENCE_REPLAY_BOUNDED_UNVOLLSTAENDIG");
}

if (fehler.length > 0) {
  throw new Error("[V5-R11-GUARD]\n" + [...new Set(fehler)].join("\n"));
}
console.log("[V5-R11-GUARD] OK");
