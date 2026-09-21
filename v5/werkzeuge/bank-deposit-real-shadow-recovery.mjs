import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  beobachteBankDepositRohReadOnly,
  erstelleBankDepositShadowReleaseBeobachter,
  validiereBankDepositShadowAusgangsBeobachtung,
  warteAufManuellenBankMountReadOnly,
} from "./bank-deposit-produktions-browser.mjs";
import {
  erstelleNodeV5ProduktionsHost,
} from "./v5-produktions-host-komposition.mjs";

export const BANK_SHADOW_RECOVERY_BESTAETIGUNG =
  "V5 BANK SHADOW RECOVERY MANUELL ABGLEICHEN";
export const BANK_SHADOW_RECOVERY_EVIDENCE_ART =
  "V5_BANK_SHADOW_RECOVERY_MANUAL_RECONCILIATION_NO_WRITE";

const V5_WURZEL = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_WURZEL = path.resolve(V5_WURZEL, "..");

function hash(wert) {
  return crypto.createHash("sha256").update(String(wert)).digest("hex");
}

function leseArgument(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i < 0) return fallback;
  const wert = process.argv[i + 1];
  if (!wert || wert.startsWith("--")) {
    throw new Error("BANK_SHADOW_RECOVERY_ARGUMENT_FEHLT:" + name);
  }
  return wert;
}

function pruefeSha(wert) {
  if (typeof wert !== "string" || !/^[a-f0-9]{40}$/i.test(wert)) {
    throw new Error("BANK_SHADOW_RECOVERY_SOURCE_SHA_UNGUELTIG");
  }
  return wert.toLowerCase();
}

function aktuellerGitHead() {
  return pruefeSha(execFileSync(
    "git",
    ["rev-parse", "HEAD"],
    {
      cwd: REPO_WURZEL,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  ).trim());
}

function phase(text) {
  process.stdout.write("[V5-BANK-RECOVERY] " + text + "\n");
}

async function schreibeBericht(wurzel, bericht) {
  const dir = path.join(
    wurzel,
    "runtime",
    "canary",
    "bank-deposit-real-shadow-recovery",
  );
  await fs.mkdir(dir, { recursive: true });
  const ziel = path.join(dir, "latest.json");
  const temp = ziel + ".tmp-" + process.pid + "-" + Date.now();
  await fs.writeFile(
    temp,
    JSON.stringify(bericht, null, 2) + "\n",
    "utf8",
  );
  await fs.rename(temp, ziel);
  return ziel;
}

export async function fuehreBankShadowRecoveryAus({
  cdpText,
  sourceSha,
  bestaetigungText,
  mountTimeoutMs = 90_000,
  exitTimeoutMs = 90_000,
  hostOptionen = {},
} = {}) {
  const erwartetSha = pruefeSha(sourceSha);
  const head = aktuellerGitHead();
  if (head !== erwartetSha) {
    throw new Error(
      "BANK_SHADOW_RECOVERY_SOURCE_SHA_MISMATCH:HEAD=" + head
      + ":ERWARTET=" + erwartetSha,
    );
  }
  if (bestaetigungText !== BANK_SHADOW_RECOVERY_BESTAETIGUNG) {
    throw new Error("BANK_SHADOW_RECOVERY_BESTAETIGUNG_FEHLT");
  }

  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const live = await findeAdventureLandKontext(cdp);
  let host = null;
  try {
    const ausgang = validiereBankDepositShadowAusgangsBeobachtung(
      await beobachteBankDepositRohReadOnly(
        live.session,
        live.contextId,
      ),
    );

    host = await erstelleNodeV5ProduktionsHost(hostOptionen);
    const start = await host.pruefeBankDepositStartBereit();
    if (start.offeneTransaktionsId !== null) {
      throw new Error(
        "BANK_SHADOW_RECOVERY_OFFENE_TRANSAKTION:"
        + start.offeneTransaktionsId,
      );
    }

    const leases = host.bankLeaseStatus().filter(
      x => x.zustand !== "RELEASED",
    );
    if (leases.length !== 1) {
      throw new Error(
        "BANK_SHADOW_RECOVERY_ERWARTET_EXAKT_EINE_OFFENE_LEASE:"
        + leases.length,
      );
    }
    const lease = leases[0];
    if (lease.zustand !== "RECOVERY_PENDING") {
      throw new Error(
        "BANK_SHADOW_RECOVERY_LEASE_NICHT_RECOVERY_PENDING:"
        + lease.zustand,
      );
    }
    if (lease.accountId !== ausgang.accountId
        || lease.ownerCharacterId !== ausgang.charakterName
        || lease.serverRegion !== ausgang.serverRegion
        || lease.serverIdentifier !== ausgang.serverKennung) {
      throw new Error("BANK_SHADOW_RECOVERY_BINDUNG_DRIFT");
    }

    phase("RECOVERY_PENDING_BESTAETIGT_BANK_MANUELL_BETRETEN");
    const mount = await warteAufManuellenBankMountReadOnly(
      live.session,
      live.contextId,
      ausgang,
      {
        timeoutMs: mountTimeoutMs,
        pollMs: 500,
        onPhase: text => {
          if (text === "BANK_MOUNT_STABIL_BEOBACHTET") {
            phase(text);
          }
        },
      },
    );

    const release = erstelleBankDepositShadowReleaseBeobachter(
      live.session,
      live.contextId,
      mount,
      {
        timeoutMs: exitTimeoutMs,
        pollMs: 500,
        onPhase: text => phase(text),
      },
    );
    const exitEvidence = await release.beobachte(
      Object.freeze({
        schemaVersion: 1,
        accountId: lease.accountId,
        ownerCharacterId: lease.ownerCharacterId,
        ablaufId: lease.ablaufId,
        epoche: lease.epoche,
      }),
      Date.now(),
    );
    if (exitEvidence.erwarteterExitBeobachtet !== true
        || exitEvidence.characterBankAktiv !== false
        || exitEvidence.offeneTransaktionen !== 0
        || exitEvidence.backendInProgress !== false
        || exitEvidence.bankActionInFlight !== false) {
      throw new Error("BANK_SHADOW_RECOVERY_EXIT_EVIDENCE_UNGUELTIG");
    }

    const released = await host.schliesseBankLeaseRestartAbgleichAb(
      lease.accountId,
      lease.epoche,
      true,
      Date.now(),
    );
    if (released.zustand !== "RELEASED") {
      throw new Error(
        "BANK_SHADOW_RECOVERY_RECONCILIATION_NICHT_RELEASED:"
        + released.zustand,
      );
    }

    const nachher = await host.pruefeBankDepositStartBereit();
    if (!nachher.bereit
        || nachher.offeneTransaktionsId !== null
        || nachher.offeneBankLease !== null) {
      throw new Error("BANK_SHADOW_RECOVERY_NACHHER_NICHT_BEREIT");
    }

    const bericht = Object.freeze({
      schemaVersion: 1,
      evidenceArt: BANK_SHADOW_RECOVERY_EVIDENCE_ART,
      stand: new Date().toISOString(),
      status: "BESTANDEN",
      sourceSha: erwartetSha,
      actualHeadSha: head,
      accountBindungSha256: hash(ausgang.accountId),
      charakterBindungSha256: hash(
        ausgang.charakterName + ":" + ausgang.sessionId,
      ),
      server: Object.freeze({
        region: ausgang.serverRegion,
        kennung: ausgang.serverKennung,
      }),
      lease: Object.freeze({
        epoche: lease.epoche,
        vorher: "RECOVERY_PENDING",
        nachher: "RELEASED",
      }),
      manualMountObserved: true,
      manualExitObserved: true,
      offeneTransaktionVorher: null,
      offeneTransaktionNachher: null,
      browserGameplayWrites: 0,
      gameplayWrites: 0,
      adapterAufrufe: 0,
      oneShotAuthorityAusgestellt: false,
      bankDepositAusgefuehrt: false,
      sameIntentRetry: false,
      breiteRuntimeFreigabeDurchDiesenTest: false,
      rawWriteBypass: false,
    });
    const reportPfad = await schreibeBericht(
      host.produktionsWurzel(),
      bericht,
    );
    return Object.freeze({
      ...bericht,
      reportPfad,
    });
  } finally {
    live.session.close();
  }
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direkt) {
  fuehreBankShadowRecoveryAus({
    cdpText: leseArgument(
      "--cdp",
      process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
    ),
    sourceSha: leseArgument("--source-sha"),
    bestaetigungText: leseArgument("--confirm"),
  }).then(bericht => {
    process.stdout.write(JSON.stringify(bericht, null, 2) + "\n");
  }).catch(fehler => {
    process.stderr.write(JSON.stringify({
      status: "BLOCKIERT",
      fehler: String(fehler?.message || fehler),
      sameIntentRetry: false,
      browserGameplayWrites: 0,
      gameplayWrites: 0,
      adapterAufrufe: 0,
      hinweis:
        "Nicht automatisch erneut ausfuehren. Lease-/Transaction-Evidence zuerst pruefen.",
    }, null, 2) + "\n");
    process.exitCode = 1;
  });
}
