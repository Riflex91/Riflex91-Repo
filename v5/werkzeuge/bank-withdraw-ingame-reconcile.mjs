import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import {
  NodeProduktionsDateisystem,
} from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodeBankDepositTransaktionsJournal,
} from "../grundlage/adapter/persistenz/node-bank-deposit-transaktionsjournal.mjs";
import {
  NodeBankWithdrawTransaktionsJournal,
} from "../grundlage/adapter/persistenz/node-bank-withdraw-transaktionsjournal.mjs";
import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  beobachteBankWithdrawRohReadOnly,
} from "./bank-withdraw-produktions-browser.mjs";

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
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
    else throw new Error("BANK_WITHDRAW_RECONCILE_CLI_ARGUMENT_UNBEKANNT:" + arg);
  }
  return out;
}

function pruefeSha(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error("BANK_WITHDRAW_RECONCILE_SOURCE_SHA_ERFORDERLICH");
  }
  return value.toLowerCase();
}

function aktuellerGitHead() {
  return pruefeSha(execFileSync(
    "git",
    ["rev-parse", "HEAD"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  ).trim());
}

function parseOptionalJson(text, code) {
  if (text === undefined) return null;
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

function currentKurz(value) {
  if (value === null) return Object.freeze({
    vorhanden: false,
    status: "NICHT_VORHANDEN",
    transaktionsId: null,
    letzteSequenz: null,
  });
  return Object.freeze({
    vorhanden: true,
    status: String(value.status || "UNBEKANNT"),
    transaktionsId:
      typeof value.transaktionsId === "string" ? value.transaktionsId : null,
    letzteSequenz:
      Number.isSafeInteger(value.letzteSequenz) ? value.letzteSequenz : null,
  });
}

function reportKurz(value) {
  if (value === null) return null;
  const result = value.result && typeof value.result === "object"
    ? value.result
    : null;
  const recovery = result?.recovery && typeof result.recovery === "object"
    ? result.recovery
    : null;
  return Object.freeze({
    status: value.status ?? null,
    transaktionsId: value.transaktionsId ?? null,
    sourceSha: value.sourceSha ?? null,
    actualHeadSha: value.actualHeadSha ?? null,
    adapterAufrufe:
      Number.isSafeInteger(value.adapterAufrufe) ? value.adapterAufrufe : null,
    gameWrites:
      Number.isSafeInteger(value.gameWrites) ? value.gameWrites : null,
    moeglicherSend: value.moeglicherSend === true,
    resultStatus: result?.status ?? null,
    recoveryArt: recovery?.art ?? null,
    recoveryKlassifikation: recovery?.klassifikation ?? null,
    journalTerminalArt: result?.journalTerminalArt ?? null,
  });
}

export async function fuehreBankWithdrawIngameReconcileAus({
  cdpText,
  sourceSha,
} = {}) {
  const erwartetSha = pruefeSha(sourceSha);
  const actualHeadSha = aktuellerGitHead();
  if (actualHeadSha !== erwartetSha) {
    throw new Error(
      "BANK_WITHDRAW_RECONCILE_SOURCE_SHA_MISMATCH:HEAD="
      + actualHeadSha + ":ERWARTET=" + erwartetSha,
    );
  }

  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const live = await findeAdventureLandKontext(cdp);

  try {
    const browser = await beobachteBankWithdrawRohReadOnly(
      live.session,
      live.contextId,
    );

    const dateisystem = new NodeProduktionsDateisystem();
    const withdrawJournal = new NodeBankWithdrawTransaktionsJournal(dateisystem);
    const depositJournal = new NodeBankDepositTransaktionsJournal(dateisystem);

    const [
      withdrawStart,
      depositStart,
      withdrawCurrentRaw,
      depositCurrentRaw,
      leaseRaw,
      reportRaw,
    ] = await Promise.all([
      withdrawJournal.pruefeStartBereit(),
      depositJournal.pruefeStartBereit(),
      dateisystem.liesText("runtime/transactions/bank-withdraw/current.json"),
      dateisystem.liesText("runtime/transactions/bank-deposit/current.json"),
      dateisystem.liesText("runtime/bank/lease-state-v1.json"),
      dateisystem.liesText("runtime/canary/bank-withdraw-production/latest.json"),
    ]);

    const withdrawCurrent = parseOptionalJson(
      withdrawCurrentRaw,
      "BANK_WITHDRAW_RECONCILE_WITHDRAW_CURRENT_UNGUELTIG",
    );
    const depositCurrent = parseOptionalJson(
      depositCurrentRaw,
      "BANK_WITHDRAW_RECONCILE_DEPOSIT_CURRENT_UNGUELTIG",
    );
    const leaseSnapshot = parseOptionalJson(
      leaseRaw,
      "BANK_WITHDRAW_RECONCILE_LEASE_SNAPSHOT_UNGUELTIG",
    );
    const letzterReport = parseOptionalJson(
      reportRaw,
      "BANK_WITHDRAW_RECONCILE_REPORT_UNGUELTIG",
    );

    const leaseRows = Array.isArray(leaseSnapshot?.eintraege)
      ? leaseSnapshot.eintraege
      : [];
    const offeneLeases = leaseRows.filter(
      x => x && typeof x === "object" && x.zustand !== "RELEASED",
    );

    let withdrawEintraege = Object.freeze([]);
    if (!withdrawStart.bereit
        && typeof withdrawStart.offeneTransaktionsId === "string") {
      withdrawEintraege = await withdrawJournal.liesTransaktion(
        withdrawStart.offeneTransaktionsId,
      );
    }

    let depositEintraege = Object.freeze([]);
    if (!depositStart.bereit
        && typeof depositStart.offeneTransaktionsId === "string") {
      depositEintraege = await depositJournal.liesTransaktion(
        depositStart.offeneTransaktionsId,
      );
    }

    const browserStabil = browser.bewegtSich !== true
      && browser.queueAktiv !== true
      && browser.alternativeRuntimeAktiv !== true;

    const offeneTransaktion = !withdrawStart.bereit || !depositStart.bereit;
    const offeneLease = offeneLeases.length > 0;
    const sendNichtAusgeschlossen =
      withdrawEintraege.length > 0
      || letzterReport?.moeglicherSend === true;

    let klassifikation = "BEREIT_FUER_MAXIMAL_ZWEITEN_FUNKTIONS_TEST";
    let naechsterSchritt =
      "NEUE_EXPLIZITE_ONE_SHOT_BESTAETIGUNG_DANN_MAXIMAL_EIN_ZWEITER_LIVE_TEST";

    if (!browserStabil) {
      klassifikation = "BLOCKIERT_BROWSER_ZUSTAND";
      naechsterSchritt = "BROWSER_ZUSTAND_STABILISIEREN_UND_RECONCILE_ERNEUT_LESEN";
    } else if (offeneTransaktion) {
      klassifikation = sendNichtAusgeschlossen
        ? "BLOCKIERT_OFFENE_TRANSAKTION_SEND_NICHT_AUSGESCHLOSSEN"
        : "BLOCKIERT_OFFENE_TRANSAKTION";
      naechsterSchritt = "OFFENE_TRANSAKTION_LOKALISIEREN_UND_RECONCILEN_KEIN_RETRY";
    } else if (offeneLease) {
      klassifikation = "BLOCKIERT_OFFENE_BANK_LEASE";
      naechsterSchritt = "BANK_LEASE_RECONCILE_ERFORDERLICH_KEIN_RETRY";
    }

    return Object.freeze({
      schemaVersion: 1,
      evidenceArt: "V5_BANK_WITHDRAW_INGAME_RECONCILE_READ_ONLY",
      status: klassifikation.startsWith("BEREIT_") ? "BEREIT" : "BLOCKIERT",
      klassifikation,
      actualHeadSha,
      sourceSha: erwartetSha,
      browser: Object.freeze({
        accountBindungSha256: hash(browser.accountId),
        charakterBindungSha256: hash(
          browser.charakterName + ":" + browser.sessionId,
        ),
        ctype: browser.ctype,
        map: browser.map,
        serverRegion: browser.serverRegion,
        serverKennung: browser.serverKennung,
        bankGemountet: browser.bankGemountet,
        bewegtSich: browser.bewegtSich,
        queueAktiv: browser.queueAktiv,
        alternativeRuntimeAktiv: browser.alternativeRuntimeAktiv,
        characterGoldLesbar: Number.isSafeInteger(browser.characterGold),
        bankGoldLesbar: Number.isSafeInteger(browser.bankGold),
      }),
      persistenz: Object.freeze({
        withdrawCurrent: currentKurz(withdrawCurrent),
        depositCurrent: currentKurz(depositCurrent),
        offeneLeases: Object.freeze(offeneLeases.map(x => Object.freeze({
          epoche: x.epoche ?? null,
          zustand: x.zustand ?? null,
          purpose: x.purpose ?? null,
          serverRegion: x.serverRegion ?? null,
          serverIdentifier: x.serverIdentifier ?? null,
        }))),
        withdrawJournal: Object.freeze(withdrawEintraege.map(x => Object.freeze({
          sequenz: x.sequenz,
          art: x.art,
          zeitMs: x.zeitMs,
        }))),
        depositJournal: Object.freeze(depositEintraege.map(x => Object.freeze({
          sequenz: x.sequenz,
          art: x.art,
          zeitMs: x.zeitMs,
        }))),
        letzterLiveReport: reportKurz(letzterReport),
      }),
      gameplayWrites: 0,
      adapterAufrufe: 0,
      rawWriteAutoritaet: false,
      gameplayAutoritaet: false,
      diagnoseZaehltAlsFunktionsTest: false,
      funktionsTestLimitProFunktion: 2,
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
  fuehreBankWithdrawIngameReconcileAus({
    cdpText: args.cdp,
    sourceSha: args.sourceSha,
  }).then(report => {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "BEREIT") process.exitCode = 2;
  }).catch(fehler => {
    process.stderr.write(JSON.stringify({
      status: "BLOCKIERT",
      fehler: String(fehler?.message || fehler),
      gameplayWrites: 0,
      adapterAufrufe: 0,
      diagnoseZaehltAlsFunktionsTest: false,
      hinweis: "Keinen Withdraw erneut senden. Zuerst den gemeldeten Zustand lokalisieren und beheben.",
    }, null, 2) + "\n");
    process.exitCode = 1;
  });
}
