import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  BANK_WITHDRAW_EINMAL_BESTAETIGUNG,
} from "../erzeugt/index.js";
import {
  NodeProduktionsDateisystem,
} from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  erstelleBankWithdrawShadowReleaseBeobachter,
  warteAufManuellenBankMountReadOnly,
  warteAufStabilenStartAusserhalbBankReadOnly,
} from "./bank-withdraw-produktions-browser.mjs";
import {
  ProduktionsCdpBankWithdrawEinGoldAdapter,
  erstelleProduktivenBankWithdrawBeobachter,
} from "./bank-withdraw-produktions-write-browser.mjs";
import {
  erstelleNodeV5ProduktionsHost,
} from "./v5-produktions-host-komposition.mjs";

export const BANK_WITHDRAW_PRODUCTION_EVIDENCE_ART =
  "V5_PRODUCTION_BANK_WITHDRAW_ONE_GOLD_ONE_SHOT_LIVE";

const V5_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_ROOT = path.resolve(V5_ROOT, "..");
const REPORT_PATH =
  "runtime/canary/bank-withdraw-production/latest.json";
const ACTION = "AL-ACTION-BANK-WITHDRAW";
const RECOVERY = "AL-RECOVERY-BANK-WITHDRAW";
const VERIFIER = "AL-VERIFIER-BANK-WITHDRAW";
const CAPABILITY = "merchant.bank.gold_auslagern";
const OWNER = "merchant-bank-core";
let letzterAdapter = null;

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function parseArgs(argv) {
  const out = {
    cdp: "http://127.0.0.1:9222/",
    preflight: false,
    confirm: null,
    sourceSha: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--preflight") {
      out.preflight = true;
    } else if (arg === "--cdp") {
      out.cdp = argv[++i];
    } else if (arg === "--confirm") {
      out.confirm = argv[++i];
    } else if (arg === "--source-sha") {
      out.sourceSha = argv[++i];
    } else {
      throw new Error("BANK_WITHDRAW_PROD_CLI_ARGUMENT_UNBEKANNT:" + arg);
    }
  }
  return out;
}

function pruefeSha(wert) {
  if (typeof wert !== "string" || !/^[a-f0-9]{40}$/i.test(wert)) {
    throw new Error("BANK_WITHDRAW_PROD_SOURCE_SHA_ERFORDERLICH");
  }
  return wert.toLowerCase();
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

async function sourceHashes() {
  const paths = [
    "grundlage/vertraege/runtime/bank-withdraw-production-candidate.json",
    "grundlage/vertraege/runtime/bank-withdraw-one-shot-authority.json",
    "grundlage/vertraege/r9/action-bindungen.json",
    "grundlage/quelle/merchant/bank-withdraw-settlement.ts",
    "grundlage/quelle/merchant/bank-withdraw-produktions-transaktion.ts",
    "werkzeuge/bank-withdraw-produktions-browser.mjs",
    "werkzeuge/bank-withdraw-produktions-write-browser.mjs",
    "roadmap/pr20-2-bank-withdraw-real-browser-shadow-evidence.json",
  ];
  const hashes = [];
  for (const rel of paths) {
    hashes.push(hash(await fs.readFile(path.join(V5_ROOT, rel), "utf8")));
  }
  return Object.freeze([...new Set(hashes)].sort());
}

function id(prefix) {
  return prefix + "-" + Date.now() + "-"
    + crypto.randomBytes(4).toString("hex");
}

function phase(text) {
  process.stdout.write("[V5-BANK-WITHDRAW-LIVE] " + text + "\n");
}

async function writeReport(report) {
  const ds = new NodeProduktionsDateisystem();
  await ds.schreibeAtomarDurable(
    REPORT_PATH,
    JSON.stringify(report, null, 2) + "\n",
    "bank-withdraw-production-report-" + Date.now(),
  );
}

function publicPreflight(
  observation,
  hostStatus,
  startEvidence,
  actualHeadSha,
) {
  return Object.freeze({
    schemaVersion: 1,
    status: startEvidence.bereit ? "BEREIT" : "BLOCKIERT",
    actualHeadSha,
    charakterBindungSha256: hash(
      observation.charakterName + ":" + observation.sessionId,
    ),
    accountBindungSha256: hash(observation.accountId),
    ctype: observation.ctype,
    server: Object.freeze({
      region: observation.serverRegion,
      kennung: observation.serverKennung,
    }),
    startAusserhalbBank: observation.bankGemountet === false,
    characterGoldLesbar: observation.characterGold >= 0,
    bankGoldWirdBeimManuellenMountGeprueft: true,
    betragGold: 1,
    current: Object.freeze({
      bereit: startEvidence.bereit,
      offeneTransaktionsId: startEvidence.offeneTransaktionsId,
      offeneBankLease: startEvidence.offeneBankLease,
    }),
    host: Object.freeze({
      zustand: hostStatus.zustand,
      grund: hostStatus.grund,
      aktivePlanenFaehigkeiten: hostStatus.aktivePlanenFaehigkeiten,
      bankWithdrawEinmalAuthorityOffen:
        hostStatus.bankWithdrawEinmalAuthorityOffen,
      equipEinmalAuthorityOffen: hostStatus.equipEinmalAuthorityOffen,
      gameplayAutoritaet: hostStatus.gameplayAutoritaet,
      rawWriteAutoritaet: hostStatus.rawWriteAutoritaet,
      actionAuthority: hostStatus.actionAuthority,
    }),
    browserGameplayWrites: 0,
    naechsterSchritt: startEvidence.bereit
      ? "SOURCE_LOCKED_READ_ONLY_WRITE_PREFLIGHT_BEREIT_DANACH_EXPLIZITER_LIVE_ONE_SHOT"
      : "CURRENT_ODER_BANK_LEASE_RECOVERY_EVIDENCE_ANALYSIEREN",
  });
}

export async function fuehreBankWithdrawEinGoldLiveAus({
  cdpText,
  sourceSha,
  bestaetigungText,
  preflight = false,
  mountTimeoutMs = 90_000,
  exitTimeoutMs = 90_000,
  hostOptionen = {},
} = {}) {
  letzterAdapter = null;
  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const live = await findeAdventureLandKontext(cdp);
  let host = null;
  let adapter = null;

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

    host = await erstelleNodeV5ProduktionsHost(hostOptionen);
    const startMs = Date.now();
    const start = await host.starte(startMs);
    if (start.zustand !== "LAEUFT") {
      throw new Error("BANK_WITHDRAW_PROD_HOST_BLOCKIERT:" + start.grund);
    }
    const startEvidence = await host.pruefeBankWithdrawStartBereit();
    const actualHeadSha = aktuellerGitHead();
    const erwartetSha = pruefeSha(sourceSha);
    if (actualHeadSha !== erwartetSha) {
      throw new Error(
        "BANK_WITHDRAW_PROD_SOURCE_SHA_MISMATCH:HEAD=" + actualHeadSha
        + ":ERWARTET=" + erwartetSha,
      );
    }

    if (preflight) {
      const report = publicPreflight(
        ausgang,
        host.status(),
        startEvidence,
        actualHeadSha,
      );
      process.stdout.write(JSON.stringify(report, null, 2) + "\n");
      if (report.status !== "BEREIT") process.exitCode = 2;
      return report;
    }

    if (!startEvidence.bereit) {
      throw new Error("BANK_WITHDRAW_PROD_START_EVIDENCE_BLOCKIERT");
    }
    if (bestaetigungText !== BANK_WITHDRAW_EINMAL_BESTAETIGUNG) {
      throw new Error(
        "BANK_WITHDRAW_PROD_OPERATOR_BESTAETIGUNG_FEHLT:"
        + BANK_WITHDRAW_EINMAL_BESTAETIGUNG,
      );
    }
    const quellenSha256 = await sourceHashes();
    const ids = Object.freeze({
      tx: id("BANK-WITHDRAW-PROD-TX"),
      auth: id("BANK-WITHDRAW-PROD-AUTH"),
      free: id("BANK-WITHDRAW-PROD-FREE"),
      order: id("BANK-WITHDRAW-PROD-ORDER"),
      flow: id("BANK-WITHDRAW-PROD-FLOW"),
    });
    const configFingerprint = hash(JSON.stringify({
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      verifierId: VERIFIER,
      capabilityId: CAPABILITY,
      owner: OWNER,
      betragGold: 1,
      accountBinding: hash(ausgang.accountId),
      characterBinding: hash(
        ausgang.charakterName + ":" + ausgang.sessionId,
      ),
      serverRegion: ausgang.serverRegion,
      serverKennung: ausgang.serverKennung,
      sourceSha: erwartetSha,
      quellenSha256,
      maxAdapterCalls: 1,
      maxGameplayWrites: 1,
      targetOrigin: new URL(live.targetUrl).origin,
    }));

    adapter = new ProduktionsCdpBankWithdrawEinGoldAdapter(
      live.session,
      live.contextId,
    );
    letzterAdapter = adapter;
    const bankBeobachter = erstelleProduktivenBankWithdrawBeobachter(
      live.session,
      live.contextId,
      ausgang,
    );

    let mountBeobachtung = null;
    const mountBeobachter = Object.freeze({
      async warteAufMount() {
        const mount = await warteAufManuellenBankMountReadOnly(
          live.session,
          live.contextId,
          ausgang,
          {
            timeoutMs: mountTimeoutMs,
            pollMs: 500,
            onPhase: phase,
          },
        );
        mountBeobachtung = mount;
        return mount;
      },
    });
    const releaseBeobachter = Object.freeze({
      async beobachte(token, jetztMs) {
        if (mountBeobachtung === null) {
          throw new Error("BANK_WITHDRAW_PROD_RELEASE_OHNE_MOUNT_EVIDENCE");
        }
        return erstelleBankWithdrawShadowReleaseBeobachter(
          live.session,
          live.contextId,
          mountBeobachtung,
          {
            timeoutMs: exitTimeoutMs,
            pollMs: 500,
            onPhase: phase,
            exitPhaseText:
              "BANK_WITHDRAW_ABGEGLICHEN_BANK_MANUELL_VERLASSEN",
          },
        ).beobachte(token, jetztMs);
      },
    });

    const result = await host.fuehreBankWithdrawEinGoldTransaktion({
      aktivierungsId: ids.auth,
      transaktionsId: ids.tx,
      freigabeId: ids.free,
      auftragId: ids.order,
      ablaufId: ids.flow,
      bestaetigungText,
      ausgang,
      mountBeobachter,
      releaseBeobachter,
      adapter,
      bankBeobachter,
      wissensSnapshot: Object.freeze({
        gitCommit: erwartetSha,
        quellenSha256,
      }),
      configFingerprint,
    }, startMs);

    const nachher = await host.pruefeBankWithdrawStartBereit();
    const leaseStatus = host.bankLeaseStatus();
    const hostNachher = host.status();
    const bestanden = result.status === "COMMITTED"
      && result.recovery.art === "COMMITTED"
      && result.recovery.klassifikation === "BESTAETIGT"
      && result.journalTerminalArt === "COMMIT"
      && result.betrag === 1
      && adapter.adapterAufrufe === 1
      && adapter.gameWrites === 1
      && nachher.bereit
      && leaseStatus.every(x => x.zustand === "RELEASED")
      && hostNachher.bankWithdrawEinmalAuthorityOffen === false
      && hostNachher.gameplayAutoritaet === false
      && hostNachher.rawWriteAutoritaet === false
      && hostNachher.actionAuthority === false;

    const report = Object.freeze({
      schemaVersion: 1,
      evidenceArt: BANK_WITHDRAW_PRODUCTION_EVIDENCE_ART,
      stand: new Date().toISOString(),
      status: bestanden ? "BESTANDEN" : "NICHT_BESTANDEN",
      transaktionsId: ids.tx,
      sourceSha: erwartetSha,
      actualHeadSha,
      accountBindungSha256: hash(ausgang.accountId),
      charakterBindungSha256: hash(
        ausgang.charakterName + ":" + ausgang.sessionId,
      ),
      server: Object.freeze({
        region: ausgang.serverRegion,
        kennung: ausgang.serverKennung,
      }),
      capabilityId: CAPABILITY,
      provider: OWNER + "@1",
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      verifierId: VERIFIER,
      betragGold: 1,
      startAusserhalbBank: true,
      manualMountTransition: result.manualMountTransition === true,
      manualExitRequired: result.manualExitRequired === true,
      result,
      adapterAufrufe: adapter.adapterAufrufe,
      gameWrites: adapter.gameWrites,
      moeglicherSend: adapter.moeglicherSend,
      sameIntentRetry: false,
      bankStartNachherBereit: nachher.bereit,
      leaseStatus: leaseStatus.map(x => Object.freeze({
        epoche: x.epoche,
        zustand: x.zustand,
      })),
      hostNachher: Object.freeze({
        zustand: hostNachher.zustand,
        bankWithdrawEinmalAuthorityOffen:
          hostNachher.bankWithdrawEinmalAuthorityOffen,
        gameplayAutoritaet: hostNachher.gameplayAutoritaet,
        rawWriteAutoritaet: hostNachher.rawWriteAutoritaet,
        actionAuthority: hostNachher.actionAuthority,
      }),
      breiteRuntimeFreigabeDurchDiesenTest: false,
      rawWriteBypass: false,
      reportPfad:
        "D:\\AdventureLand-V5\\runtime\\canary"
        + "\\bank-withdraw-production\\latest.json",
    });
    await writeReport(report);
    return report;
  } finally {
    if (host !== null) {
      await host.stoppe("BANK_WITHDRAW_PRODUCTION_LIVE_ENDE").catch(() => {});
    }
    live.session.close();
  }
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direkt) {
  const args = parseArgs(process.argv.slice(2));
  fuehreBankWithdrawEinGoldLiveAus({
    cdpText: args.cdp,
    sourceSha: args.sourceSha,
    bestaetigungText: args.confirm,
    preflight: args.preflight,
  }).then(report => {
    if (!args.preflight) {
      process.stdout.write(JSON.stringify(report, null, 2) + "\n");
      if (report.status !== "BESTANDEN") process.exitCode = 2;
    }
  }).catch(fehler => {
    process.stderr.write(JSON.stringify({
      status: "BLOCKIERT",
      fehler: String(fehler?.message || fehler),
      sameIntentRetry: false,
      adapterAufrufe: letzterAdapter?.adapterAufrufe ?? 0,
      gameWrites: letzterAdapter?.gameWrites ?? 0,
      moeglicherSend: letzterAdapter?.moeglicherSend ?? false,
      hinweis:
        "Nicht automatisch erneut ausfuehren. Bei moeglichem Send, offener Transaktion oder Bank-Lease zuerst Evidence/Reconciliation pruefen.",
    }, null, 2) + "\n");
    process.exitCode = 1;
  });
}
