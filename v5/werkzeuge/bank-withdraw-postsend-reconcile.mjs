import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  NodeProduktionsDateisystem,
} from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodeBankWithdrawTransaktionsJournal,
} from "../grundlage/adapter/persistenz/node-bank-withdraw-transaktionsjournal.mjs";
import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  warteAufStabilenStartAusserhalbBankReadOnly,
  warteAufManuellenBankMountReadOnly,
} from "./bank-withdraw-produktions-browser.mjs";

const V5_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_ROOT = path.resolve(V5_ROOT, "..");
const REPORT_PATH = "runtime/canary/bank-withdraw-production/latest.json";

function phase(text) {
  process.stdout.write("[V5-BANK-WITHDRAW-POSTSEND] " + text + "\n");
}

function parseArgs(argv) {
  const out = {
    cdp: "http://127.0.0.1:9222/",
    sourceSha: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cdp") out.cdp = argv[++i];
    else if (arg === "--source-sha") out.sourceSha = argv[++i];
    else throw new Error("BANK_WITHDRAW_POSTSEND_CLI_ARGUMENT_UNBEKANNT:" + arg);
  }
  return out;
}

function pruefeSha(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error("BANK_WITHDRAW_POSTSEND_SOURCE_SHA_ERFORDERLICH");
  }
  return value.toLowerCase();
}

function aktuellerGitHead() {
  return pruefeSha(execFileSync(
    "git",
    ["rev-parse", "HEAD"],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  ).trim());
}

function parseJson(text, code) {
  if (typeof text !== "string" || text.length < 2) throw new Error(code);
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(code);
    }
    return value;
  } catch {
    throw new Error(code);
  }
}

function safeInteger(value, code) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(code);
  return value;
}

export async function fuehreBankWithdrawPostSendReconcileAus({
  cdpText,
  sourceSha,
} = {}) {
  const erwartetSha = pruefeSha(sourceSha);
  const actualHeadSha = aktuellerGitHead();
  if (actualHeadSha !== erwartetSha) {
    throw new Error(
      "BANK_WITHDRAW_POSTSEND_SOURCE_SHA_MISMATCH:HEAD="
      + actualHeadSha + ":ERWARTET=" + erwartetSha,
    );
  }

  const dateisystem = new NodeProduktionsDateisystem();
  const report = parseJson(
    await dateisystem.liesText(REPORT_PATH),
    "BANK_WITHDRAW_POSTSEND_REPORT_FEHLT_ODER_UNGUELTIG",
  );

  if (report.evidenceArt !== "V5_PRODUCTION_BANK_WITHDRAW_ONE_GOLD_ONE_SHOT_LIVE"
      || typeof report.transaktionsId !== "string"
      || report.transaktionsId.length === 0
      || report.adapterAufrufe !== 1
      || report.gameWrites !== 1
      || report.moeglicherSend !== true) {
    throw new Error("BANK_WITHDRAW_POSTSEND_REPORT_NICHT_SEND_VERDAECHTIG");
  }

  const journal = new NodeBankWithdrawTransaktionsJournal(dateisystem);
  const eintraege = await journal.liesTransaktion(report.transaktionsId);
  const intent = eintraege.find(x => x.art === "INTENT");
  const postcondition = eintraege.find(x => x.art === "POSTCONDITION");
  const terminal = eintraege.find(
    x => x.art === "COMMIT"
      || x.art === "ABBRUCH"
      || x.art === "SICHER_FEHLGESCHLAGEN",
  );

  if (!intent || !postcondition || !terminal) {
    throw new Error("BANK_WITHDRAW_POSTSEND_JOURNAL_UNVOLLSTAENDIG");
  }

  const characterGoldVorher = safeInteger(
    intent.inhalt?.character_gold_vorher,
    "BANK_WITHDRAW_POSTSEND_CHARACTER_GOLD_VORHER_UNGUELTIG",
  );
  const bankGoldVorher = safeInteger(
    intent.inhalt?.bank_gold_vorher,
    "BANK_WITHDRAW_POSTSEND_BANK_GOLD_VORHER_UNGUELTIG",
  );

  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const live = await findeAdventureLandKontext(cdp);

  try {
    const ausgang = await warteAufStabilenStartAusserhalbBankReadOnly(
      live.session,
      live.contextId,
      {
        timeoutMs: 90_000,
        pollMs: 500,
        onPhase: phase,
      },
    );

    phase("POSTSEND_RECONCILE_BANK_MANUELL_BETRETEN");

    const mount = await warteAufManuellenBankMountReadOnly(
      live.session,
      live.contextId,
      ausgang,
      {
        timeoutMs: 90_000,
        pollMs: 500,
        onPhase: text => {
          if (text === "LEASE_ERWORBEN_BANK_MANUELL_BETRETEN") return;
          phase(text);
        },
      },
    );

    const characterGoldDelta = mount.characterGold - characterGoldVorher;
    const bankGoldDelta = mount.bankGold - bankGoldVorher;

    let status;
    let klassifikation;
    let naechsterSchritt;

    if (characterGoldDelta === 1 && bankGoldDelta === -1) {
      status = "BESTAETIGT";
      klassifikation = "WRITE_NACHWIRKUNG_EXAKT_BESTAETIGT";
      naechsterSchritt =
        "RECOVERY_BEOBACHTUNG_REPARIEREN_DANACH_MAXIMAL_EIN_ZWEITER_FUNKTIONS_TEST";
    } else if (characterGoldDelta === 0 && bankGoldDelta === 0) {
      status = "UNGEKLAERT";
      klassifikation = "KEIN_GOLD_DELTA_BEOBACHTET";
      naechsterSchritt =
        "WRITE_SEMANTIK_ODER_SERVERERGEBNIS_ANALYSIEREN_KEIN_RETRY";
    } else {
      status = "UNGEKLAERT";
      klassifikation = "GOLD_DELTA_DRIFT";
      naechsterSchritt =
        "FREMDAENDERUNG_ODER_PARTIELLE_WIRKUNG_ANALYSIEREN_KEIN_RETRY";
    }

    return Object.freeze({
      schemaVersion: 1,
      evidenceArt: "V5_BANK_WITHDRAW_POSTSEND_RECONCILE_READ_ONLY",
      status,
      klassifikation,
      sourceSha: erwartetSha,
      actualHeadSha,
      transaktionsId: report.transaktionsId,
      report: Object.freeze({
        status: report.status ?? null,
        resultStatus: report.result?.status ?? null,
        recoveryArt: report.result?.recovery?.art ?? null,
        recoveryKlassifikation:
          report.result?.recovery?.klassifikation ?? null,
        recoveryBeobachtungen:
          report.result?.recovery?.beobachtungen ?? null,
        journalTerminalArt: report.result?.journalTerminalArt ?? null,
        adapterAufrufe: report.adapterAufrufe,
        gameWrites: report.gameWrites,
        moeglicherSend: report.moeglicherSend,
      }),
      journal: Object.freeze({
        arten: Object.freeze(eintraege.map(x => x.art)),
        postconditionRecoveryArt: postcondition.inhalt?.recovery_art ?? null,
        postconditionKlassifikation:
          postcondition.inhalt?.klassifikation ?? null,
        postconditionBeobachtungen:
          postcondition.inhalt?.beobachtungen ?? null,
        terminalArt: terminal.art,
      }),
      vorher: Object.freeze({
        characterGold: characterGoldVorher,
        bankGold: bankGoldVorher,
      }),
      jetzt: Object.freeze({
        characterGold: mount.characterGold,
        bankGold: mount.bankGold,
      }),
      delta: Object.freeze({
        characterGold: characterGoldDelta,
        bankGold: bankGoldDelta,
      }),
      gameplayWrites: 0,
      adapterAufrufe: 0,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      sameIntentRetry: false,
      diagnoseZaehltAlsFunktionsTest: false,
      naechsterSchritt,
    });
  } finally {
    live.session.close();
  }
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (direkt) {
  const args = parseArgs(process.argv.slice(2));
  fuehreBankWithdrawPostSendReconcileAus({
    cdpText: args.cdp,
    sourceSha: args.sourceSha,
  }).then(report => {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "BESTAETIGT") process.exitCode = 2;
  }).catch(fehler => {
    process.stderr.write(JSON.stringify({
      status: "BLOCKIERT",
      fehler: String(fehler?.message || fehler),
      gameplayWrites: 0,
      adapterAufrufe: 0,
      sameIntentRetry: false,
      diagnoseZaehltAlsFunktionsTest: false,
      hinweis:
        "Keinen weiteren Withdraw senden. Zuerst diese Post-Send-Evidence auswerten.",
    }, null, 2) + "\n");
    process.exitCode = 1;
  });
}
