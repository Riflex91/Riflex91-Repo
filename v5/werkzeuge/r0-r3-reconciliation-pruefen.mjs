import fs from "node:fs";
import path from "node:path";

const fehler = text => { throw new Error("[V5-R0-R3-RECONCILIATION] " + text); };

function repoWurzel() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "v5", "anforderungen", "anforderungen.json"))) return cwd;
  const parent = path.resolve(cwd, "..");
  if (fs.existsSync(path.join(parent, "v5", "anforderungen", "anforderungen.json"))) return parent;
  fehler("Repository-Wurzel konnte nicht bestimmt werden.");
}

export function pruefeR0R3Reconciliation() {
  const root = repoWurzel();
  const lies = rel => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  const manifest = lies("v5/roadmap/r0-r3-reconciliation.json");
  const anforderungen = lies("v5/anforderungen/anforderungen.json").anforderungen;
  const trace = lies("v5/anforderungen/nachverfolgbarkeit.json").eintraege;

  if (manifest.schemaVersion !== 1
      || manifest.status !== "VOLLSTAENDIG_NACHGEWIESEN"
      || manifest.anzahl !== 34
      || manifest.nachgewiesen !== 34
      || manifest.externOffen !== 0
      || manifest.externerBlocker !== null
      || manifest.eintraege?.length !== 34) {
    fehler("Reconciliation-Kopf ungueltig.");
  }

  const kennungen = new Set();
  for (const eintrag of manifest.eintraege) {
    if (kennungen.has(eintrag.kennung)) fehler("Doppelte Kennung: " + eintrag.kennung);
    kennungen.add(eintrag.kennung);
    if (!["R0", "R2", "R3"].includes(eintrag.phase)) fehler("Unerwartete Phase: " + eintrag.kennung);
    if (eintrag.status !== "NACHGEWIESEN") fehler("Ungueltiger Status: " + eintrag.kennung);

    for (const rel of [...(eintrag.implementierung ?? []), ...(eintrag.tests ?? []), ...(eintrag.nachweise ?? [])]) {
      if (!fs.existsSync(path.join(root, rel))) fehler(eintrag.kennung + ": Nachweispfad fehlt: " + rel);
    }

    const req = anforderungen.find(x => x.kennung === eintrag.kennung);
    const tr = trace.find(x => x.anforderungKennung === eintrag.kennung);
    if (!req || !tr) fehler(eintrag.kennung + ": Anforderung oder Trace fehlt.");

    const erwartet = eintrag.phase + "_NACHGEWIESEN";
    if (req.status !== erwartet || req.reconciliationStatus !== erwartet) {
      fehler(eintrag.kennung + ": Requirement-Status passt nicht.");
    }
    if (tr.vollstaendig !== true || tr.reconciliationStatus !== erwartet) {
      fehler(eintrag.kennung + ": Trace ist nicht vollstaendig.");
    }
    for (const rel of eintrag.implementierung ?? []) {
      if (!tr.implementierung?.includes(rel)) fehler(eintrag.kennung + ": Implementierungsnachweis fehlt im Trace: " + rel);
    }
    for (const rel of eintrag.tests ?? []) {
      if (!tr.tests?.includes(rel)) fehler(eintrag.kennung + ": Testnachweis fehlt im Trace: " + rel);
    }
    for (const rel of eintrag.nachweise ?? []) {
      if (!tr.liveNachweise?.includes(rel)) fehler(eintrag.kennung + ": Live-/Betriebsnachweis fehlt im Trace: " + rel);
    }
  }

  const historisch = anforderungen.filter(x => ["R0", "R2", "R3"].includes(x.phase));
  if (historisch.length !== 34) fehler("Historische R0/R2/R3-Anforderungsmenge driftet von 34.");
  const offen = historisch.filter(x => x.status === "OFFEN");
  if (offen.length !== 0) {
    fehler("Nach geschlossenem Autorisierungsnachweis duerfen keine historischen R0/R2/R3-Anforderungen offen sein.");
  }

  const entdecker = fs.readFileSync(path.join(root, "ops/windows-bridge/WebQuellenEntdecker.cs"), "utf8");
  const waechter = fs.readFileSync(path.join(root, "ops/windows-bridge/WissenswaechterDienst.cs"), "utf8");
  const bridgeTests = fs.readFileSync(path.join(root, "ops/windows-bridge-tests/Program.cs"), "utf8");
  for (const marker of [
    "WaehleRotierendeSuchanfragen",
    "stundenIndex",
  ]) if (!entdecker.includes(marker)) fehler("Rotierende Quellenentdeckung fehlt: " + marker);
  if (!waechter.includes("SucheAsync(gestartetAm, cancellationToken)")) {
    fehler("Wissenswaechter bindet Quellenrotation nicht an den Laufzeitpunkt.");
  }
  for (const marker of [
    "KNOWLEDGE_DISCOVERY_ROTATES_HOURLY",
    "KNOWLEDGE_DISCOVERY_ROTATION_WRAP",
  ]) if (!bridgeTests.includes(marker)) fehler("Rotations-Regressionsnachweis fehlt: " + marker);

  const uebersetzung = fs.readFileSync(
    path.join(root, "v5/grundlage/quelle/anzeige/uebersetzungsaufgaben.ts"), "utf8");
  for (const marker of [
    "planeOffeneUebersetzungsAufgaben",
    "status: \"OFFEN\"",
    "SICHERER_DEUTSCHER_PLATZHALTER",
    "gameplayAutoritaet: false",
    "automatischeFreigabe: false",
  ]) if (!uebersetzung.includes(marker)) fehler("Uebersetzungsaufgaben-Nachweis fehlt: " + marker);

  console.log("[V5-R0-R3-RECONCILIATION] OK / 34 von 34 nachgewiesen / kein externer Blocker");
}

if (process.argv[1]?.endsWith("r0-r3-reconciliation-pruefen.mjs")) {
  pruefeR0R3Reconciliation();
}
