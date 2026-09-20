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
if (bereitschaft.status === "FREIGEGEBEN") {
  if (!fs.existsSync("roadmap/gesamtfreigabe.json")) {
    fehler("R5 darf die Runtime nicht selbst freigeben; finale Betreiber-Gesamtfreigabe-Evidence fehlt.");
  }
  const gesamtfreigabe = lies("roadmap/gesamtfreigabe.json");
  if (gesamtfreigabe.kennung !== "V5_GESAMTFREIGABE"
      || gesamtfreigabe.status !== "ERTEILT"
      || gesamtfreigabe.bestaetigungQuelle !== "BETREIBER_INTERAKTIV"
      || gesamtfreigabe.bestaetigungText !== "V5 GESAMTFREIGABE ERTEILEN"
      || bereitschaft.gesamtfreigabe !== "ERTEILT"
      || bereitschaft.breiteRuntimeFreigabe !== true) {
    fehler("R5 darf die Runtime nicht selbst freigeben; nur die spaetere explizite Post-R19-Gesamtfreigabe ist zulaessig.");
  }
}

if (r5.status === "DONE") {
  const r6 = gates.phases?.find(x => x.id === "R6");
  const aktuelleNummer = Number(String(gates.currentPhase ?? "").replace(/^R/, ""));
  if (!Number.isInteger(aktuelleNummer)
      || aktuelleNummer < 6
      || !["IN_PROGRESS", "DONE"].includes(r6?.status)) {
    fehler("Nach R5 DONE muss die Roadmap mindestens R6 erreicht haben und R6 darf nicht mehr BLOCKED sein.");
  }

  if (!fs.existsSync("roadmap/r5-abschluss.json")) fehler("R5-Abschlussmanifest fehlt.");
  const abschluss = lies("roadmap/r5-abschluss.json");
  if (abschluss.status !== "DONE"
      || abschluss.phase !== "R5"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false
      || Object.values(abschluss.exitKriterien ?? {}).some(wert => wert !== true)
      || abschluss.faultMatrix?.status !== "GRUEN"
      || abschluss.readiness?.PERSISTENZMODELL_BEREIT !== true
      || abschluss.readiness?.gesamtstatus !== "GESPERRT"
      || abschluss.naechstePhase !== "R6") {
    fehler("R5-Abschlussmanifest ist unvollstaendig.");
  }

  const anforderungen = lies("anforderungen/anforderungen.json");
  const r5Anforderungen = anforderungen.anforderungen.filter(x => x.phase === "R5" && x.prioritaet === "MUSS");
  if (r5Anforderungen.length !== 8
      || r5Anforderungen.some(x => x.status !== "R5_NACHGEWIESEN")) {
    fehler("R5-Anforderungen sind nicht 8/8 technisch nachgewiesen.");
  }

  const trace = lies("anforderungen/nachverfolgbarkeit.json");
  const r5Ids = new Set(r5Anforderungen.map(x => x.kennung));
  const r5Trace = trace.eintraege.filter(x => r5Ids.has(x.anforderungKennung));
  if (r5Trace.length !== 8
      || r5Trace.some(x => x.vollstaendig !== true || x.r5NachweisStatus !== "R5_NACHGEWIESEN")) {
    fehler("R5-Traceability ist nicht 8/8 vollstaendig.");
  }

  const fitness = lies("fitness/fitness-regeln.json");
  const r5Fitness = fitness.regeln.filter(x => x.phase === "R5");
  if (r5Fitness.length !== 1
      || r5Fitness.some(x => x.r5NachweisStatus !== "ERFUELLT")) {
    fehler("R5-Fitnessregel ist nicht technisch erfuellt.");
  }

  const persistenzBereit = bereitschaft.bereiche.find(x => x.kennung === "PERSISTENZMODELL_BEREIT");
  if (!persistenzBereit || persistenzBereit.erfuellt !== true) {
    fehler("PERSISTENZMODELL_BEREIT muss nach R5 true sein.");
  }
}

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
if (!adapter.includes('fs.open(temp, "wx")')
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
