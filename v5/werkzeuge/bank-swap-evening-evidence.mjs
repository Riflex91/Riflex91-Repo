export const BANK_SWAP_ABEND_STUFEN = Object.freeze({
  PREFLIGHT: "01-preflight",
  STABILITAET: "02-kandidaten-stabilitaet",
  CODE_BRIDGE: "03-code-bridge",
  SHADOW: "04-admission-shadow",
  WRITE_PREFLIGHT: "05-write-preflight",
  LIVE_TEST_1: "06-live-test-1",
  LIVE_TEST_2: "07-live-test-2",
});

const BASIS = "runtime/canary/bank-swap-evening";

function pruefeSha(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error("BANK_SWAP_ABEND_SOURCE_SHA_UNGUELTIG");
  }
  return value.toLowerCase();
}

function pruefeStufe(stufe) {
  if (!Object.values(BANK_SWAP_ABEND_STUFEN).includes(stufe)) {
    throw new Error("BANK_SWAP_ABEND_STUFE_UNGUELTIG");
  }
  return stufe;
}

function erwartetStatus(stufe) {
  if (stufe === BANK_SWAP_ABEND_STUFEN.PREFLIGHT
      || stufe === BANK_SWAP_ABEND_STUFEN.WRITE_PREFLIGHT) return "BEREIT";
  return "BESTANDEN";
}

export function validiereBankSwapAbendEvidence(
  bericht,
  stufe,
  sourceSha,
  { noWrite = true } = {},
) {
  pruefeStufe(stufe);
  const sha = pruefeSha(sourceSha);
  if (!bericht || typeof bericht !== "object"
      || bericht.schemaVersion !== 1
      || bericht.stufe !== stufe
      || String(bericht.sourceSha || "").toLowerCase() !== sha
      || String(bericht.actualHeadSha || "").toLowerCase() !== sha
      || bericht.status !== erwartetStatus(stufe)) {
    throw new Error("BANK_SWAP_ABEND_EVIDENCE_UNGUELTIG:" + stufe);
  }
  if (bericht.sameIntentRetry !== false) {
    throw new Error("BANK_SWAP_ABEND_SAME_INTENT_RETRY_VERBOTEN:" + stufe);
  }
  if (noWrite) {
    const safety = bericht.safety ?? bericht;
    if (Number(safety.gameplayWrites ?? bericht.gameplayWrites ?? 0) !== 0
        || Number(safety.adapterAufrufe ?? bericht.adapterAufrufe ?? 0) !== 0
        || Number(safety.bankSwapAufrufe ?? bericht.bankSwapAufrufe ?? 0) !== 0
        || Number(safety.mutatingPublicFunctionCalls
          ?? bericht.mutatingPublicFunctionCalls ?? 0) !== 0) {
      throw new Error("BANK_SWAP_ABEND_NO_WRITE_EVIDENCE_VERLETZT:" + stufe);
    }
  }
  return Object.freeze({ ...bericht });
}

export async function schreibeBankSwapAbendEvidence(
  dateisystem,
  stufe,
  bericht,
) {
  if (!dateisystem || typeof dateisystem.schreibeAtomarDurable !== "function") {
    throw new Error("BANK_SWAP_ABEND_DATEISYSTEM_UNGUELTIG");
  }
  pruefeStufe(stufe);
  const payload = Object.freeze({
    ...bericht,
    schemaVersion: 1,
    stufe,
  });
  await dateisystem.schreibeAtomarDurable(
    BASIS + "/" + stufe + ".json",
    JSON.stringify(payload, null, 2) + "\n",
    "bank-swap-abend-" + stufe + "-" + Date.now(),
  );
  return payload;
}

export async function liesBankSwapAbendEvidence(dateisystem, stufe) {
  if (!dateisystem || typeof dateisystem.liesText !== "function") {
    throw new Error("BANK_SWAP_ABEND_DATEISYSTEM_UNGUELTIG");
  }
  pruefeStufe(stufe);
  const raw = await dateisystem.liesText(BASIS + "/" + stufe + ".json");
  if (raw === undefined) {
    throw new Error("BANK_SWAP_ABEND_VORSTUFE_FEHLT:" + stufe);
  }
  if (raw.length < 2 || raw.length > 2_000_000) {
    throw new Error("BANK_SWAP_ABEND_EVIDENCE_GROESSE_UNGUELTIG:" + stufe);
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("BANK_SWAP_ABEND_EVIDENCE_JSON_UNGUELTIG:" + stufe);
  }
}

export async function verlangeBankSwapAbendVorstufe(
  dateisystem,
  stufe,
  sourceSha,
  optionen = {},
) {
  return validiereBankSwapAbendEvidence(
    await liesBankSwapAbendEvidence(dateisystem, stufe),
    stufe,
    sourceSha,
    optionen,
  );
}

export const BANK_SWAP_ABEND_EVIDENCE_BASIS = BASIS;
