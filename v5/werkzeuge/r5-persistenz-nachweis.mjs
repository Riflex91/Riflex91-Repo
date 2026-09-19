import crypto from "node:crypto";
import fs from "node:fs";

const hash = pfad => crypto.createHash("sha256").update(fs.readFileSync(pfad)).digest("hex");

const nachweis = {
  schemaVersion: 1,
  phase: "R5",
  status: "PERSISTENZ_FAULT_MATRIX_GRUEN",
  gameplayAutoritaet: false,
  standardLiveWissensWurzel: "D:\\AdventureLand-V5\\wissensdatenbank",
  ports: [
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
  ],
  failClosedKlassen: [
    "KORRUPT",
    "OVERSIZED",
    "UNSUPPORTED_SCHEMA",
    "DISK_FULL",
    "ACCESS_DENIED",
    "WRONG_VOLUME",
    "VOLUME_ID_MISMATCH",
    "LOW_FREE_SPACE",
    "TORN_GENERATION",
  ],
  sha256: {
    ports: hash("grundlage/quelle/persistenz/ports.ts"),
    journal: hash("grundlage/quelle/persistenz/journal.ts"),
    liveWissen: hash("grundlage/quelle/persistenz/live-wissens-speicher.ts"),
    nodeAdapter: hash("grundlage/adapter/persistenz/node-live-wissens-dateisystem.mjs"),
    tests: hash("grundlage/tests/r5-persistenz.test.mjs"),
  },
};

fs.writeFileSync("r5-persistenz-nachweis.json", JSON.stringify(nachweis, null, 2) + "\n");
console.log("[V5-R5-NACHWEIS]", nachweis.sha256.tests);
