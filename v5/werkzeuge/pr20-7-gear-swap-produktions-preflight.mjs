import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  aktiviereUndVerifiziereBrowserPerformanceTrick,
  BANK_BROWSER_PERFORMANCE_TRICK_GAMEPLAY_WRITES,
} from "./r12-live/performance-trick.mjs";
import {
  PR20_7_GEAR_BROWSER_GAMEPLAY_WRITES,
  beobachtePr207GearRecipientReadOnly,
  findePr207GearRecipientKontext,
  pr207GearPrestateFingerprint,
  waehlePr207GearOccupiedCandidate,
} from "./pr20-7-gear-swap-produktions-browser.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function leseArgument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("PR20_7_GEAR_PREFLIGHT_ARGUMENT_FEHLT:" + name);
  }
  return value;
}

function parseIndex(value) {
  if (value === null) return null;
  if (!/^\d{1,3}$/.test(value)) {
    throw new Error("PR20_7_GEAR_PREFLIGHT_INDEX_UNGUELTIG");
  }
  const index = Number(value);
  if (!Number.isInteger(index) || index < 0 || index >= 128) {
    throw new Error("PR20_7_GEAR_PREFLIGHT_INDEX_UNGUELTIG");
  }
  return index;
}

function validiereSourceSha(sourceSha) {
  if (typeof sourceSha !== "string" || !/^[0-9a-f]{40}$/i.test(sourceSha)) {
    throw new Error("PR20_7_GEAR_PREFLIGHT_SOURCE_SHA_ERFORDERLICH");
  }
  const actual = execFileSync(
    "git",
    ["rev-parse", "HEAD"],
    { cwd: REPO_ROOT, encoding: "utf8", windowsHide: true },
  ).trim().toLowerCase();
  if (actual !== sourceSha.toLowerCase()) {
    throw new Error(
      "PR20_7_GEAR_PREFLIGHT_SOURCE_SHA_DRIFT:"
      + sourceSha.toLowerCase() + ":" + actual,
    );
  }
  return actual;
}

function gleicheBindung(a, b) {
  return a.accountId === b.accountId
    && a.charakterName === b.charakterName
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier;
}

function publicCandidate(candidate) {
  return Object.freeze({
    slot: candidate.slot,
    kandidatIndex: candidate.kandidatIndex,
    kandidat: Object.freeze({
      name: candidate.kandidat.name,
      level: candidate.kandidat.level,
      fingerprintSha256: candidate.kandidat.beobachtungsFingerprint,
      physisch: candidate.kandidat.physisch,
      gesperrt: candidate.kandidat.gesperrt,
      virtuellB: candidate.kandidat.virtuellB,
    }),
    vorherigesSlotItem: Object.freeze({
      name: candidate.vorherigesSlotItem.name,
      level: candidate.vorherigesSlotItem.level,
      fingerprintSha256:
        candidate.vorherigesSlotItem.beobachtungsFingerprint,
      physisch: candidate.vorherigesSlotItem.physisch,
      gesperrt: candidate.vorherigesSlotItem.gesperrt,
      virtuellB: candidate.vorherigesSlotItem.virtuellB,
    }),
    restInventarFingerprint: candidate.restInventarFingerprint,
    restEquipmentFingerprint: candidate.restEquipmentFingerprint,
    mechanischKompatibel: candidate.mechanischKompatibel,
    contentVerifiziert: candidate.contentVerifiziert,
    progressionsEntscheidung: false,
  });
}

export async function fuehrePr207GearOccupiedSlotPreflight({
  cdpText = process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  characterName,
  inventoryIndex = null,
  slot = null,
  sourceSha,
} = {}) {
  if (typeof characterName !== "string"
      || characterName.trim().length === 0
      || characterName.length > 192) {
    throw new Error("PR20_7_GEAR_PREFLIGHT_CHARACTER_ERFORDERLICH");
  }
  const testedSourceSha = validiereSourceSha(sourceSha);
  const live = await findePr207GearRecipientKontext(cdpText, characterName);
  try {
    const performanceTrick = await aktiviereUndVerifiziereBrowserPerformanceTrick(
      live.session,
      live.contextId,
    );
    if (BANK_BROWSER_PERFORMANCE_TRICK_GAMEPLAY_WRITES !== 0) {
      throw new Error("PR20_7_GEAR_PERFORMANCE_TRICK_WRITE_DRIFT");
    }

    const first = await beobachtePr207GearRecipientReadOnly(
      live.session,
      live.contextId,
    );
    const firstCandidate = waehlePr207GearOccupiedCandidate(first, {
      inventoryIndex,
      slot,
    });
    if (firstCandidate === null) {
      throw new Error("PR20_7_GEAR_KEIN_SICHERER_BELEGTER_SLOT_KANDIDAT");
    }

    await new Promise(resolve => setTimeout(resolve, 250));

    const second = await beobachtePr207GearRecipientReadOnly(
      live.session,
      live.contextId,
    );
    const secondCandidate = waehlePr207GearOccupiedCandidate(second, {
      inventoryIndex,
      slot,
    });
    if (secondCandidate === null
        || !gleicheBindung(first, second)
        || secondCandidate.evidenceFingerprint
          !== firstCandidate.evidenceFingerprint) {
      throw new Error("PR20_7_GEAR_PREFLIGHT_SNAPSHOT_DRIFT");
    }

    const prestateFingerprint = pr207GearPrestateFingerprint(
      second,
      secondCandidate,
    );
    return Object.freeze({
      schemaVersion: 1,
      evidenceArt: "V5_PR20_7_OCCUPIED_SLOT_READ_ONLY_BROWSER_PREFLIGHT",
      status: "BEREIT_NO_WRITE",
      testedSourceSha,
      beobachtetAmMs: Date.now(),
      recipient: Object.freeze({
        characterName: second.charakterName,
        ctype: second.ctype,
        characterLevel: second.characterLevel,
        accountBindungSha256: hash(second.accountId),
        sessionBindungSha256: hash(second.sessionId),
        server: Object.freeze({
          region: second.serverRegion,
          identifier: second.serverIdentifier,
        }),
        bindingFingerprintSha256: second.bindingFingerprint,
      }),
      performanceTrick,
      candidate: publicCandidate(secondCandidate),
      prestateFingerprint,
      stability: Object.freeze({
        doppelteReadOnlyBeobachtung: true,
        bindingUnveraendert: true,
        candidateEvidenceUnveraendert: true,
      }),
      authority: Object.freeze({
        produktiveRegistrierungErlaubt: false,
        authorityAusgestellt: false,
        durableIntentErzeugt: false,
        gameplayAutoritaet: false,
        rawWriteAutoritaet: false,
        swapWriteRatification: false,
        farmerMerchantCoordinatorAutoritaet: false,
      }),
      browserReadOnly: true,
      browserGameplayWrites: PR20_7_GEAR_BROWSER_GAMEPLAY_WRITES,
      publicFunctionAufrufe: 0,
      sameIntentRetry: false,
      normalRuntimeAllowed: false,
      naechsterSchritt:
        "PR20_7_OCCUPIED_SLOT_ONE_SHOT_AUTHORITY_UND_FENCING_VORBEREITEN",
    });
  } finally {
    live.session.close();
  }
}

const direct = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (direct) {
  fuehrePr207GearOccupiedSlotPreflight({
    cdpText: leseArgument(
      "--cdp",
      process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
    ),
    characterName: leseArgument("--character"),
    inventoryIndex: parseIndex(leseArgument("--inventory-index")),
    slot: leseArgument("--slot"),
    sourceSha: leseArgument("--source-sha"),
  }).then(report => {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  }).catch(error => {
    process.stderr.write(JSON.stringify({
      schemaVersion: 1,
      evidenceArt: "V5_PR20_7_OCCUPIED_SLOT_READ_ONLY_BROWSER_PREFLIGHT",
      status: "BLOCKIERT",
      fehler: String(error?.message || error),
      browserReadOnly: true,
      browserGameplayWrites: 0,
      publicFunctionAufrufe: 0,
      authorityAusgestellt: false,
      durableIntentErzeugt: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      swapWriteRatification: false,
      sameIntentRetry: false,
      normalRuntimeAllowed: false,
    }, null, 2) + "\n");
    process.exitCode = 2;
  });
}
