import fs from "node:fs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const kernel = liesText("grundlage/quelle/recovery/recovery-kernel.ts");
for (const marker of [
  "sameIntentAfterPossibleSend",
  '"NEVER"',
  "sameIntentErneutSenden: false",
  "RECOVERY_INFLIGHT_SNAPSHOT_UMGEDEUTET",
  '"TEILWEISE"',
  "offeneDomaenen",
  "maximaleBeobachtungen",
  "FAILED_SAFE",
  "OPERATOR_REQUIRED",
]) {
  if (!kernel.includes(marker)) fehler.push("RECOVERY_KERNEL_MARKER_FEHLT:" + marker);
}
if (/\.sende\s*\(/.test(kernel) || /AusfuehrungsAdapter/.test(kernel)) {
  fehler.push("RECOVERY_KERNEL_DARF_KEINEN_SEND_PFAD_BESITZEN");
}

const laufsteuerung = liesText("grundlage/quelle/recovery/laufsteuerung.ts");
for (const marker of [
  "STOPP_ANGEFORDERT",
  "KEINE_NEUE_ARBEIT",
  "ABGLEICH_LAEUFT",
  "KRITISCH_GESPERRT",
  "LAUFSTEUERUNG_KEINE_NEUE_ARBEIT",
]) {
  if (!laufsteuerung.includes(marker)) fehler.push("STOPP_MARKER_FEHLT:" + marker);
}

const restart = liesText("grundlage/quelle/recovery/wiederanlauf.ts");
if (!restart.includes('"ABGLEICH_ERFORDERLICH"')
    || !restart.includes("executionAuthority: false")) {
  fehler.push("RESTART_FAIL_CLOSED_MARKER_FEHLT");
}

const fehlerdomaenen = liesText("grundlage/quelle/recovery/fehlerdomaenen.ts");
if (!fehlerdomaenen.includes("domaeneId")
    || !fehlerdomaenen.includes("istErlaubt")
    || !fehlerdomaenen.includes('"GESPERRT"')) {
  fehler.push("FEHLERDOMAENEN_ISOLATION_UNVOLLSTAENDIG");
}

const typen = liesText("grundlage/quelle/recovery/typen.ts");
for (const marker of [
  "TransaktionsSnapshotPin",
  "wissensSnapshot",
  "configFingerprint",
  "prestateFingerprint",
  "DifferenzNachweis",
]) {
  if (!typen.includes(marker)) fehler.push("RECOVERY_TYP_MARKER_FEHLT:" + marker);
}

if (fehler.length > 0) {
  throw new Error("[V5-R10-GUARD]\n" + [...new Set(fehler)].join("\n"));
}
console.log("[V5-R10-GUARD] OK");
