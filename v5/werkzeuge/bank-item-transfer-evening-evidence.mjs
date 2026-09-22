export const BANK_ITEM_TRANSFER_ABEND_STUFEN = Object.freeze({
  PREFLIGHT: "01-preflight",
  STABILITAET: "02-kandidaten-stabilitaet",
  CODE_BRIDGE: "03-code-bridge",
  SHADOW: "04-admission-shadow",
  WRITE_PREFLIGHT: "05-write-preflight",
  LIVE_TEST_1: "06-live-test-1",
  LIVE_TEST_2: "07-live-test-2",
});

function modus(v) {
  const x = String(v || "").toUpperCase();
  if (!["RETRIEVE", "STORE"].includes(x)) {
    throw new Error("BANK_ITEM_TRANSFER_ABEND_MODUS_UNGUELTIG");
  }
  return x;
}
function sha(v) {
  if (typeof v !== "string" || !/^[a-f0-9]{40}$/i.test(v)) {
    throw new Error("BANK_ITEM_TRANSFER_ABEND_SOURCE_SHA_UNGUELTIG");
  }
  return v.toLowerCase();
}
function stufe(v) {
  if (!Object.values(BANK_ITEM_TRANSFER_ABEND_STUFEN).includes(v)) {
    throw new Error("BANK_ITEM_TRANSFER_ABEND_STUFE_UNGUELTIG");
  }
  return v;
}
function basis(m) {
  return "runtime/canary/bank-" + m.toLowerCase() + "-evening";
}
function erwartetStatus(s) {
  return s === BANK_ITEM_TRANSFER_ABEND_STUFEN.PREFLIGHT
    || s === BANK_ITEM_TRANSFER_ABEND_STUFEN.WRITE_PREFLIGHT
    ? "BEREIT"
    : "BESTANDEN";
}
export function validiereBankItemTransferAbendEvidence(
  bericht,
  modusWert,
  stufeWert,
  sourceSha,
  { noWrite = true } = {},
) {
  const m = modus(modusWert), s = stufe(stufeWert), h = sha(sourceSha);
  if (!bericht || typeof bericht !== "object"
      || bericht.schemaVersion !== 1
      || String(bericht.modus || "").toUpperCase() !== m
      || bericht.stufe !== s
      || String(bericht.sourceSha || "").toLowerCase() !== h
      || String(bericht.actualHeadSha || "").toLowerCase() !== h
      || bericht.status !== erwartetStatus(s)) {
    throw new Error("BANK_ITEM_TRANSFER_ABEND_EVIDENCE_UNGUELTIG:" + m + ":" + s);
  }
  if (bericht.sameIntentRetry !== false) {
    throw new Error("BANK_ITEM_TRANSFER_ABEND_SAME_INTENT_RETRY_VERBOTEN:" + m + ":" + s);
  }
  if (noWrite) {
    const x = bericht.safety ?? bericht;
    if (Number(x.gameplayWrites ?? bericht.gameplayWrites ?? 0) !== 0
        || Number(x.adapterAufrufe ?? bericht.adapterAufrufe ?? 0) !== 0
        || Number(x.publicFunctionAufrufe ?? bericht.publicFunctionAufrufe ?? 0) !== 0
        || Number(x.mutatingPublicFunctionCalls
          ?? bericht.mutatingPublicFunctionCalls ?? 0) !== 0) {
      throw new Error("BANK_ITEM_TRANSFER_ABEND_NO_WRITE_EVIDENCE_VERLETZT:" + m + ":" + s);
    }
  }
  return Object.freeze({ ...bericht });
}
export async function schreibeBankItemTransferAbendEvidence(
  dateisystem,
  modusWert,
  stufeWert,
  bericht,
) {
  if (!dateisystem || typeof dateisystem.schreibeAtomarDurable !== "function") {
    throw new Error("BANK_ITEM_TRANSFER_ABEND_DATEISYSTEM_UNGUELTIG");
  }
  const m = modus(modusWert), s = stufe(stufeWert);
  const payload = Object.freeze({ ...bericht, schemaVersion: 1, modus: m, stufe: s });
  await dateisystem.schreibeAtomarDurable(
    basis(m) + "/" + s + ".json",
    JSON.stringify(payload, null, 2) + "\n",
    "bank-" + m.toLowerCase() + "-abend-" + s + "-" + Date.now(),
  );
  return payload;
}
export async function liesBankItemTransferAbendEvidence(dateisystem, modusWert, stufeWert) {
  if (!dateisystem || typeof dateisystem.liesText !== "function") {
    throw new Error("BANK_ITEM_TRANSFER_ABEND_DATEISYSTEM_UNGUELTIG");
  }
  const m = modus(modusWert), s = stufe(stufeWert);
  const raw = await dateisystem.liesText(basis(m) + "/" + s + ".json");
  if (raw === undefined) throw new Error("BANK_ITEM_TRANSFER_ABEND_VORSTUFE_FEHLT:" + m + ":" + s);
  if (raw.length < 2 || raw.length > 2_000_000) {
    throw new Error("BANK_ITEM_TRANSFER_ABEND_EVIDENCE_GROESSE_UNGUELTIG:" + m + ":" + s);
  }
  try { return JSON.parse(raw); } catch {
    throw new Error("BANK_ITEM_TRANSFER_ABEND_EVIDENCE_JSON_UNGUELTIG:" + m + ":" + s);
  }
}
export async function verlangeBankItemTransferAbendVorstufe(
  dateisystem,
  modusWert,
  stufeWert,
  sourceSha,
  optionen = {},
) {
  return validiereBankItemTransferAbendEvidence(
    await liesBankItemTransferAbendEvidence(dateisystem, modusWert, stufeWert),
    modusWert,
    stufeWert,
    sourceSha,
    optionen,
  );
}
export function bankItemTransferAbendEvidenceBasis(modusWert) {
  return basis(modus(modusWert));
}
