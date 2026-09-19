import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R5-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");

for (const pfad of [
  "grundlage/quelle/persistenz/ports.ts",
  "grundlage/quelle/persistenz/journal.ts",
  "grundlage/quelle/persistenz/restart.ts",
  "grundlage/quelle/persistenz/schema-migration.ts",
  "grundlage/quelle/persistenz/begrenztes-json.ts",
  "grundlage/quelle/persistenz/speicherdruck.ts",
  "grundlage/quelle/persistenz/speicherziel.ts",
  "grundlage/quelle/persistenz/postfach.ts",
  "grundlage/quelle/persistenz/retention.ts",
  "grundlage/quelle/persistenz/live-wissens-speicher.ts",
  "grundlage/quelle/persistenz/dateibasierte-persistenz.ts",
  "grundlage/adapter/persistenz/node-live-wissens-dateisystem.mjs",
  "grundlage/tests/r5-persistenz.test.mjs",
  "architektur/adr/ADR-003-PERSISTENZ-JOURNAL.md",
]) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const r5 = gates.phases?.find(x => x.id === "R5");
if (!r5 || !["IN_PROGRESS", "DONE"].includes(r5.status)) fehler("R5 muss IN_PROGRESS oder DONE sein.");
if (r5.status === "IN_PROGRESS" && gates.currentPhase !== "R5") fehler("R5 IN_PROGRESS verlangt currentPhase=R5.");
if (bereitschaft.status === "FREIGEGEBEN") fehler("R5 darf Gameplay-Runtime nicht freigeben.");

const ports = fs.readFileSync("grundlage/quelle/persistenz/ports.ts", "utf8");
for (const name of [
  "PersistenzPort",
  "TransaktionsJournalPort",
  "CheckpointSpeicherPort",
  "LiveWissensSpeicherPort",
  "ReplaySpeicherPort",
  "TelemetrieSpeicherPort",
  "ZertifizierungsEvidencePort",
  "SpeicherGesundheitsPort",
  "DeduplizierungsSpeicherPort",
  "KritischeZustellungsPort",
]) {
  if (!ports.includes("interface " + name)) fehler("Typisierter Port fehlt: " + name);
}

const live = fs.readFileSync("grundlage/quelle/persistenz/live-wissens-speicher.ts", "utf8");
if (!live.includes('"D:\\\\AdventureLand-V5\\\\wissensdatenbank"')
    || !live.includes('"SCHREIBT"')
    || !live.includes('"BEREIT"')
    || !live.includes("schreibeAtomarDurable")) {
  fehler("Live-Wissenswriter verletzt D:- oder Generationsvertrag.");
}

const journal = fs.readFileSync("grundlage/quelle/persistenz/journal.ts", "utf8");
if (!journal.includes("PersistVorMutationTor")
    || !journal.includes("PERSIST_VOR_MUTATION_BRAUCHT_INTENT")
    || !journal.includes("JOURNAL_DURABILITY_NICHT_BESTAETIGT")) {
  fehler("Durable-Intent-Gate fehlt.");
}

const restart = fs.readFileSync("grundlage/quelle/persistenz/restart.ts", "utf8");
if (!restart.includes('"ABGLEICH_ERFORDERLICH"')) fehler("No-Blind-Resume-Regel fehlt.");

const adapter = fs.readFileSync("grundlage/adapter/persistenz/node-live-wissens-dateisystem.mjs", "utf8");
if (!adapter.includes("fs.open(temp, \"wx\")")
    || !adapter.includes("await handle.sync()")
    || !adapter.includes("await fs.rename(temp, ziel)")
    || !adapter.includes("LIVE_WISSEN_PRODUKTIONSWURZEL_UNGUELTIG")
    || !adapter.includes("SPEICHER_VOLL")
    || !adapter.includes("ZUGRIFF_VERWEIGERT")) {
  fehler("Atomarer Dateiadapter oder Fehlerklassifikation unvollstaendig.");
}

const windowsProbe = fs.readFileSync("../ops/windows-bridge/SsdVolumeGesundheitsPruefer.cs", "utf8");
if (!windowsProbe.includes("VolumeId")
    || !windowsProbe.includes("VOLUME_IDENTITAET_FEHLT")
    || !windowsProbe.includes("MindestFreieReserveProzent = 15")) {
  fehler("Windows Volume-Identitaets-/Reserveprobe unvollstaendig.");
}

console.log("[V5-R5-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status);
