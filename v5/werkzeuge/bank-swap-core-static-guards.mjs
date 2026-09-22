import fs from "node:fs";

const errors = [];
const read = p => fs.readFileSync(p, "utf8");
const json = p => JSON.parse(read(p));

const candidate = json("grundlage/vertraege/runtime/bank-swap-production-candidate.json");
const capability = json("grundlage/vertraege/runtime/bank-swap-mutationsfaehigkeit.json");
const authority = json("grundlage/vertraege/runtime/bank-swap-one-shot-authority.json");
const composition = read("grundlage/quelle/runtime/produktions-komposition.ts");

if (![
  "CORE_VORBEREITET_READ_ONLY_PREFLIGHT_AUSSTEHEND",
  "READ_ONLY_PREFLIGHT_IMPLEMENTIERT_EVIDENCE_AUSSTEHEND",
  "WRITE_ADAPTER_UND_ABEND_NO_WRITE_KETTE_IMPLEMENTIERT_LIVE_RUNNER_AUSSTEHEND",
].includes(candidate.status)
    || candidate.publicFunction !== "bank_swap"
    || candidate.officialSource?.serverOperation !== "move"
    || candidate.ersterKandidat?.slotMinimum !== 0
    || candidate.ersterKandidat?.slotMaximum !== 41
    || candidate.ersterKandidat?.unterschiedlicheItemNamenErforderlich !== true
    || candidate.safety?.serverClampingNeverReliedUpon !== true
    || candidate.settlement?.sameIntentRetry !== false
    || candidate.safety?.rawSocketEmitAllowed !== false
    || candidate.implementation?.readOnlyBrowserObserverImplemented !== true
    || candidate.implementation?.readOnlyPreflightImplemented !== true
    || candidate.implementation?.writeAdapterImplemented !== true
    || candidate.implementation?.liveRunnerImplemented !== false
    || candidate.implementation?.gameplayWritesInThisStep !== 0) {
  errors.push("BANK_SWAP_CANDIDATE_GRENZE_UNGUELTIG");
}

if (capability.faehigkeit?.faehigkeitId !== "merchant.bank.intern_tauschen"
    || capability.faehigkeit?.standardAktiv !== false
    || capability.aktivierung?.durchDiesenVertragErlaubt !== false
    || capability.authority?.gameplayAutoritaetDurchRegistrierung !== false) {
  errors.push("BANK_SWAP_CAPABILITY_DEFAULT_DENY_UNGUELTIG");
}

if (authority.capability?.maximaleVerwendungenProAuthority !== 1
    || authority.authority?.maximaleLebensdauerMs !== 2000
    || authority.durability?.vorAuthorityAusstellung !== true
    || authority.writeAdapterInDiesemSchritt !== false
    || authority.liveRunnerInDiesemSchritt !== false
    || authority.gameplayWritesInDiesemSchritt !== 0) {
  errors.push("BANK_SWAP_AUTHORITY_GRENZE_UNGUELTIG");
}

for (const p of [
  "grundlage/quelle/merchant/bank-swap-settlement.ts",
  "grundlage/quelle/merchant/bank-swap-einmal-authority.ts",
  "grundlage/quelle/merchant/bank-swap-current-fence.ts",
]) {
  const src = read(p);
  if (/\.emit\s*\(/.test(src) || /\bbank_swap\s*\(/.test(src)) {
    errors.push("BANK_SWAP_CORE_WRITE_VERBOTEN:" + p);
  }
}
if (!composition.includes("merchantBankSwapMutationsFaehigkeitDefinition")
    || composition.includes("bank_swap(")) {
  errors.push("BANK_SWAP_PRODUKTIONSKOMPOSITION_GRENZE_UNGUELTIG");
}
const writeAdapterPfad = "werkzeuge/bank-swap-produktions-write-browser.mjs";
if (!fs.existsSync(writeAdapterPfad)) {
  errors.push("BANK_SWAP_WRITE_ADAPTER_FEHLT");
} else {
  const write = read(writeAdapterPfad);
  const swapAufrufe = (write.match(/\.bank_swap\s*\(/g) ?? []).length;
  if (swapAufrufe !== 1
      || /\.emit\s*\(/.test(write)
      || !write.includes("call_code_function_f")
      || !write.includes("MEHR_ALS_EIN_ADAPTER_AUFRUF")
      || !write.includes("FINAL_PRESTATE_DRIFT")
      || !write.includes("DISCONNECT_NACH_MOEGLICHEM_SEND")) {
    errors.push("BANK_SWAP_WRITE_ADAPTER_SAFETY_UNGUELTIG");
  }
}

if (errors.length) {
  console.error("[V5-BANK-SWAP-CORE-GUARD] FEHLER\n" + errors.join("\n"));
  process.exit(1);
}
console.log("[V5-BANK-SWAP-CORE-GUARD] OK / Swap Safety Core + gebundener One-Shot-Adapter");
