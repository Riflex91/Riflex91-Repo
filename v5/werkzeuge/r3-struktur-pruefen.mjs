import fs from "node:fs";
import path from "node:path";

const fehler = text => { throw new Error("[V5-R3-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const mussExistieren = pfad => { if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad); };

const paket = lies("package.json");
const lock = lies("package-lock.json");
const ts = lies("tsconfig.json");
const konfiguration = lies("grundlage/konfiguration.json");
const host = lies("architektur/host-api-allowlist.json");
const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");

if (paket.devDependencies?.typescript !== "5.9.3") fehler("TypeScript muss exakt 5.9.3 gepinnt sein.");
if (lock.packages?.["node_modules/typescript"]?.version !== "5.9.3") fehler("Lockfile-TypeScript driftet.");
if (lock.packages?.["node_modules/typescript"]?.integrity
    !== "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==") {
  fehler("TypeScript-Integrity driftet.");
}
if (ts.compilerOptions?.strict !== true
    || ts.compilerOptions?.noUncheckedIndexedAccess !== true
    || ts.compilerOptions?.exactOptionalPropertyTypes !== true
    || ts.compilerOptions?.noEmitOnError !== true
    || ts.compilerOptions?.rootDir !== "grundlage/quelle") {
  fehler("TypeScript-Strictness/R3-Quellwurzel unvollstaendig.");
}

for (const script of ["bauen","typen:pruefen","lint","format:pruefen","guards:test","host:test","grundlage:test","r3:pruefen"]) {
  if (!paket.scripts?.[script]) fehler("Paket-Script fehlt: " + script);
}

for (const pfad of [
  "grundlage/konfiguration.json",
  "grundlage/quelle/kern/faehigkeits-schalter.ts",
  "grundlage/quelle/kern/ausfuehrungs-freigabe.ts",
  "grundlage/quelle/grundlage/leere-v5-grundlage.ts",
  "grundlage/quelle/host/host-grenze.ts",
  "grundlage/quelle/persistenz/speicher-port.ts",
  "grundlage/quelle/persistenz/begrenzter-asynchroner-schreiber.ts",
  "grundlage/quelle/nachrichten/nachrichten-umschlag.ts",
  "architektur/host-api-allowlist.json",
  "werkzeuge/r3-statische-guards.mjs",
  "werkzeuge/r3-build-provenienz.mjs",
]) mussExistieren(pfad);

if (konfiguration.phase !== "R3"
    || konfiguration.gameplayAutoritaet !== false
    || konfiguration.rawWriteAutoritaet !== false
    || konfiguration.headlessNoWrite !== true
    || konfiguration.mutierendeFaehigkeitenStandard !== "AUS"
    || konfiguration.freigegebeneMutierendeFaehigkeiten?.length !== 0
    || konfiguration.speicher?.mindestFreieReserveProzent !== 15
    || konfiguration.speicher?.erwarteterMedientyp !== "SSD") {
  fehler("R3-Konfiguration ist nicht Default-Deny/no-write.");
}

if (host.gameplayAutoritaet !== false || host.rawWriteAutoritaet !== false) {
  fehler("Host-Vertrag darf keine Gameplay-/Raw-Write-Autoritaet besitzen.");
}
const verbot = new Set(["eval","evaluate","invoke","call","execute","gameplayCommand"]);
for (const befehl of host.erlaubteBefehle ?? []) {
  if (verbot.has(String(befehl))) fehler("Generischer Host-Befehl in Allowlist: " + befehl);
}

const phase = gates.phases?.find(x => x.id === "R3");
if (gates.currentPhase !== "R3" || phase?.status !== "IN_PROGRESS") {
  fehler("Roadmap muss waehrend dieses Branchstands R3 IN_PROGRESS sein.");
}

if (bereitschaft.status !== "FREIGEGEBEN") {
  for (const ordner of ["laufzeit","ausfuehrung","persistenz","module","scheduler","lernen","host"]) {
    if (fs.existsSync(path.join(process.cwd(), ordner))) {
      fehler("Gameplay-Implementierung vor Laufzeitfreigabe gefunden: " + ordner + "/");
    }
  }
}

const gitQuelle = fs.readFileSync("../ops/windows-bridge/GitArbeitskopie.cs", "utf8");
if (!gitQuelle.includes('WissensBranch = "v5/wissenswaechter-automatisch"')
    || !gitQuelle.includes('PushZielRef => "HEAD:" + WissensBranch')
    || gitQuelle.includes('"HEAD:main"')) {
  fehler("Wissenswaechter ist nicht sicher auf Knowledge-Branch begrenzt.");
}
const knowledgeWorkflow = fs.readFileSync("../.github/workflows/v5-wissenswaechter-pr.yml", "utf8");
if (!knowledgeWorkflow.includes("v5/wissenswaechter-automatisch")
    || !knowledgeWorkflow.includes("v5/wissensbasis/")
    || !knowledgeWorkflow.includes("gh pr create")) {
  fehler("Knowledge-PR-Workflow fehlt oder ist unvollstaendig.");
}

console.log("[V5-R3-STRUKTUR] OK");
console.log("[V5-R3-STRUKTUR] Gameplay-Gate:", bereitschaft.status);
console.log("[V5-R3-STRUKTUR] Phase:", gates.currentPhase);
