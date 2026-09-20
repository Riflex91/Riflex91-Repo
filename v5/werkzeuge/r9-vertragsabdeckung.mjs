import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const fehler = text => { throw new Error("[V5-R9-VERTRAGSABDECKUNG] " + text); };

const actions = lies("wissensbasis/vertraege/action-contracts.json").contracts;
const recoveries = lies("wissensbasis/vertraege/recovery-contracts.json").actions;
const verifiers = lies("grundlage/vertraege/r9/verifier-katalog.json").verifiers;
const bindungen = lies("grundlage/vertraege/r9/action-bindungen.json").bindungen;

if (actions.length !== 60) fehler("Action-Contract-Anzahl muss 60 sein.");
if (recoveries.length !== 60) fehler("Recovery-Contract-Anzahl muss 60 sein.");
if (verifiers.length !== 60) fehler("Verifier-Anzahl muss 60 sein.");
if (bindungen.length !== 60) fehler("R9-Bindungsanzahl muss 60 sein.");

const recoveryNachAction = new Map(recoveries.map(x => [x.actionContractId, x]));
const verifierNachAction = new Map(verifiers.map(x => [x.actionContractId, x]));
const bindungNachAction = new Map(bindungen.map(x => [x.actionContractId, x]));

let produktiv = 0;
let deaktiviert = 0;

for (const action of actions) {
  const recovery = recoveryNachAction.get(action.id);
  const verifier = verifierNachAction.get(action.id);
  const bindung = bindungNachAction.get(action.id);
  if (!recovery) fehler("Recovery fehlt fuer " + action.id);
  if (!verifier) fehler("Verifier fehlt fuer " + action.id);
  if (!bindung) fehler("R9-Bindung fehlt fuer " + action.id);

  if (recovery.publicFunction !== action.publicFunction) {
    fehler("Recovery-PublicFunction stimmt nicht: " + action.id);
  }
  if (verifier.publicFunction !== action.publicFunction) {
    fehler("Verifier-PublicFunction stimmt nicht: " + action.id);
  }
  if (bindung.publicFunction !== action.publicFunction
      || bindung.recoveryContractId !== recovery.id
      || bindung.verifierId !== verifier.id) {
    fehler("R9-Bindung inkonsistent: " + action.id);
  }
  if (!Array.isArray(action.postconditions) || action.postconditions.length < 1) {
    fehler("Postconditions fehlen: " + action.id);
  }
  if (!Array.isArray(action.liveRevalidation) || action.liveRevalidation.length < 1) {
    fehler("Live-Revalidation fehlt: " + action.id);
  }
  if (!Array.isArray(action.resourceDomains) || action.resourceDomains.length < 1) {
    fehler("Ressourcendomaene fehlt: " + action.id);
  }

  const istDeaktiviert = action.status === "EXPLICITLY_DISABLED_PENDING_EXACT_CONTRACT";
  if (istDeaktiviert) {
    deaktiviert += 1;
    if (action.publicFunction !== "cave_buy"
        || recovery.status !== "DISABLED_WITH_ACTION_CONTRACT"
        || verifier.status !== "DISABLED_WITH_ACTION_CONTRACT"
        || bindung.status !== "DEAKTIVIERT") {
      fehler("Deaktivierter Vertrag inkonsistent: " + action.id);
    }
    continue;
  }

  produktiv += 1;
  if (!["VERIFIED_SOURCE_SNAPSHOT", "VERIFIED_LIVE_DEPLOYED_CONTRACT"].includes(action.status)) {
    fehler("Produktiver Action-Status ungueltig: " + action.id);
  }
  if (recovery.status !== "VERIFIED_RECOVERY_POLICY") {
    fehler("Recovery nicht verifiziert: " + action.id);
  }
  if (verifier.status !== "VERIFIED_POSTCONDITION_MODEL") {
    fehler("Verifier nicht verifiziert: " + action.id);
  }
  if (bindung.status !== "R9_ADMISSION_GEBUNDEN") {
    fehler("R9-Bindung nicht aktiv: " + action.id);
  }
  for (const pflicht of [
    "V5-ALT-002",
    "V5-ALT-003",
    "V5-INV-002",
    "V5-INV-004",
    "V5-INV-005",
    "V5-ALT-024",
  ]) {
    if (!bindung.invariantenKennungen.includes(pflicht)) {
      fehler("R9-Invariante fehlt " + pflicht + " bei " + action.id);
    }
  }
  if (bindung.testNachweis !== "v5/grundlage/tests/r9-admission-execution.test.mjs") {
    fehler("R9-Testnachweis fehlt: " + action.id);
  }
  for (const journalPflicht of [
    "intent_id",
    "action_contract_id",
    "recovery_contract_id",
    "resource_claims_and_fencing",
    "postcondition_evidence",
  ]) {
    if (!recovery.journalRequirements.includes(journalPflicht)) {
      fehler("Recovery-Journalpflicht fehlt " + journalPflicht + " bei " + action.id);
    }
  }
}

if (produktiv !== 59 || deaktiviert !== 1) {
  fehler("Erwartet 59 produktive und 1 deaktivierten Action Contract.");
}
console.log("[V5-R9-VERTRAGSABDECKUNG] OK / produktiv:", produktiv, "/ deaktiviert:", deaktiviert);
