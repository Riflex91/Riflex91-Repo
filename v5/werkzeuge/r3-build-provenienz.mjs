import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const hashDatei = pfad => crypto.createHash("sha256").update(fs.readFileSync(pfad)).digest("hex");

const gitSha = (process.env.V5_BUILD_GIT_SHA
  ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" })).trim();

if (!/^[0-9a-f]{40}$/i.test(gitSha)) {
  throw new Error("[V5-R3-PROVENIENZ] GIT_SHA_UNGUELTIG");
}

const verfassung = JSON.parse(fs.readFileSync("architektur/verfassung.json", "utf8"));
const konfiguration = JSON.parse(fs.readFileSync("grundlage/konfiguration.json", "utf8"));

const provenienz = {
  schemaVersion: 1,
  gitSha,
  dependencyLockSha256: hashDatei("package-lock.json"),
  verfassungSchemaVersion: verfassung.schemaVersion,
  laufzeitKonfigurationSchemaVersion: konfiguration.schemaVersion,
  laufzeitKonfigurationSha256: hashDatei("grundlage/konfiguration.json"),
  gameplayAutoritaet: konfiguration.gameplayAutoritaet,
  rawWriteAutoritaet: konfiguration.rawWriteAutoritaet,
};

if (provenienz.gameplayAutoritaet !== false || provenienz.rawWriteAutoritaet !== false) {
  throw new Error("[V5-R3-PROVENIENZ] R3_DARF_KEINE_GAMEPLAY_AUTORITAET_TRAGEN");
}

process.stdout.write(JSON.stringify(provenienz, null, 2) + "\n");
