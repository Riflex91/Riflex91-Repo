import crypto from "node:crypto";
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { BANK_SWAP_EINMAL_BESTAETIGUNG } from "../erzeugt/index.js";
import { NodeProduktionsDateisystem } from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import { findeAdventureLandKontext, validiereLoopbackCdp } from "./r12-live/cdp.mjs";
import {
  warteAufStabilenBankSwapStartAusserhalbBankReadOnly,
  warteAufManuellenBankSwapMountReadOnly,
  erstelleBankSwapReleaseBeobachter,
  erstelleProduktivenBankSwapBeobachter,
} from "./bank-swap-produktions-browser.mjs";
import { ProduktionsCdpBankSwapAdapter } from "./bank-swap-produktions-write-browser.mjs";
import { erstelleNodeV5ProduktionsHost } from "./v5-produktions-host-komposition.mjs";
import {
  BANK_SWAP_ABEND_STUFEN,
  liesBankSwapAbendEvidence,
  schreibeBankSwapAbendEvidence,
  verlangeBankSwapAbendVorstufe,
  validiereBankSwapAbendEvidence,
} from "./bank-swap-evening-evidence.mjs";

const V5 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(V5, "..");

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}
function sha(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error("BANK_SWAP_LIVE_SHA_UNGUELTIG");
  }
  return value.toLowerCase();
}
function head() {
  return sha(execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT, encoding: "utf8", windowsHide: true,
  }).trim());
}
function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i < 0) return fallback;
  const value = process.argv[i + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("BANK_SWAP_LIVE_ARGUMENT_FEHLT:" + name);
  }
  return value;
}
function id(prefix) {
  return prefix + "-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
}
function phase(value) {
  process.stdout.write("[V5-BANK-SWAP-LIVE] " + value + "\n");
}
function sameCandidate(actual, expected, reverse = false) {
  return actual && expected
    && actual.pack === expected.pack
    && actual.a === expected.a
    && actual.b === expected.b
    && actual.itemA.fingerprint === (
      reverse ? expected.itemB.fingerprint : expected.itemA.fingerprint
    )
    && actual.itemB.fingerprint === (
      reverse ? expected.itemA.fingerprint : expected.itemB.fingerprint
    );
}
async function sourceHashes() {
  const paths = [
    "grundlage/quelle/merchant/bank-swap-settlement.ts",
    "grundlage/quelle/merchant/bank-swap-produktions-transaktion.ts",
    "grundlage/quelle/merchant/bank-swap-einmal-authority.ts",
    "werkzeuge/bank-swap-produktions-write-browser.mjs",
    "werkzeuge/bank-swap-produktions-browser.mjs",
    "grundlage/vertraege/runtime/bank-swap-production-candidate.json",
  ];
  const out = [];
  for (const rel of paths) {
    out.push(hash(await fs.readFile(path.join(V5, rel), "utf8")));
  }
  return Object.freeze([...new Set(out)].sort());
}
function validiereTest1(report, source) {
  validiereBankSwapAbendEvidence(
    report,
    BANK_SWAP_ABEND_STUFEN.LIVE_TEST_1,
    source,
    { noWrite: false },
  );
  if (report.status !== "BESTANDEN"
      || report.resultStatus !== "COMMITTED"
      || report.recoveryArt !== "COMMITTED"
      || report.recoveryKlassifikation !== "BESTAETIGT"
      || report.journalTerminalArt !== "COMMIT"
      || report.adapterAufrufe !== 1
      || report.gameplayWrites !== 1
      || report.moeglicherSend !== true
      || report.bankStartNachherBereit !== true
      || !Array.isArray(report.leaseStatus)
      || !report.leaseStatus.every(x => x.zustand === "RELEASED")) {
    throw new Error("BANK_SWAP_TEST_1_NICHT_SAUBER_KEIN_TEST_2");
  }
  return report;
}

export async function fuehreBankSwapLiveTest({
  cdpText,
  sourceSha,
  testNum,
  bestaetigungText,
  hostOptionen = {},
} = {}) {
  const n = Number(testNum);
  if (n !== 1 && n !== 2) throw new Error("BANK_SWAP_LIVE_TEST_NUMMER_UNGUELTIG");
  if (bestaetigungText !== BANK_SWAP_EINMAL_BESTAETIGUNG) {
    throw new Error("BANK_SWAP_LIVE_OPERATOR_BESTAETIGUNG_FEHLT");
  }

  const source = sha(sourceSha);
  const actual = head();
  if (source !== actual) {
    throw new Error("BANK_SWAP_LIVE_SOURCE_SHA_DRIFT:" + source + ":" + actual);
  }

  const ds = new NodeProduktionsDateisystem(hostOptionen.dateisystemOptionen ?? {});
  const stage = n === 1
    ? BANK_SWAP_ABEND_STUFEN.LIVE_TEST_1
    : BANK_SWAP_ABEND_STUFEN.LIVE_TEST_2;
  const stagePath = "runtime/canary/bank-swap-evening/" + stage + ".json";
  if (await ds.liesText(stagePath) !== undefined) {
    throw new Error("BANK_SWAP_LIVE_TEST_BEREITS_DOKUMENTIERT:" + n);
  }

  const writePreflight = await verlangeBankSwapAbendVorstufe(
    ds,
    BANK_SWAP_ABEND_STUFEN.WRITE_PREFLIGHT,
    source,
  );
  let expected = writePreflight.candidate;
  let reverse = false;

  if (n === 2) {
    const test1 = validiereTest1(
      await liesBankSwapAbendEvidence(ds, BANK_SWAP_ABEND_STUFEN.LIVE_TEST_1),
      source,
    );
    expected = test1.candidateBefore;
    reverse = true;
  }

  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const context = await findeAdventureLandKontext(
    cdp,
    { requiredGlobalFunction: "call_code_function_f" },
  );

  let host = null;
  let mount = null;
  let result = null;
  let adapter = null;
  const transaktionsId = id("BANK-SWAP-PROD-TX-T" + n);

  try {
    const ausgang = await warteAufStabilenBankSwapStartAusserhalbBankReadOnly(
      context.session,
      context.contextId,
      { timeoutMs: 90_000, pollMs: 500, onPhase: phase },
    );

    host = await erstelleNodeV5ProduktionsHost(hostOptionen);
    const startMs = Date.now();
    const start = await host.starte(startMs);
    if (start.zustand !== "LAEUFT") {
      throw new Error("BANK_SWAP_LIVE_HOST_BLOCKIERT:" + start.grund);
    }
    if (!(await host.pruefeBankSwapStartBereit()).bereit) {
      throw new Error("BANK_SWAP_LIVE_CURRENT_BLOCKIERT");
    }

    adapter = new ProduktionsCdpBankSwapAdapter(
      context.session,
      context.contextId,
    );

    const mountBeobachter = Object.freeze({
      async warteAufMount() {
        const beobachtung = await warteAufManuellenBankSwapMountReadOnly(
          context.session,
          context.contextId,
          ausgang,
          { timeoutMs: 90_000, pollMs: 500, onPhase: phase },
        );
        if (!sameCandidate(beobachtung.kandidat, expected, reverse)) {
          throw new Error("BANK_SWAP_LIVE_KANDIDAT_DRIFT_T" + n);
        }
        mount = beobachtung;
        return beobachtung;
      },
    });

    const bankBeobachter = Object.freeze({
      async beobachte(leaseEpoche, mountEpoche) {
        if (mount === null) throw new Error("BANK_SWAP_LIVE_BEOBACHTER_OHNE_MOUNT");
        return erstelleProduktivenBankSwapBeobachter(
          context.session,
          context.contextId,
          mount,
          mount.kandidat,
        ).beobachte(leaseEpoche, mountEpoche);
      },
    });

    const releaseBeobachter = Object.freeze({
      async beobachte(token, now) {
        if (mount === null) throw new Error("BANK_SWAP_LIVE_RELEASE_OHNE_MOUNT");
        return erstelleBankSwapReleaseBeobachter(
          context.session,
          context.contextId,
          mount,
          {
            timeoutMs: 90_000,
            pollMs: 500,
            onPhase: phase,
            exitPhaseText: "SETTLEMENT_ABGESCHLOSSEN_BANK_MANUELL_VERLASSEN",
          },
        ).beobachte(token, now);
      },
    });

    result = await host.fuehreBankSwapZweiSlotTransaktion({
      aktivierungsId: id("BANK-SWAP-PROD-AUTH-T" + n),
      transaktionsId,
      freigabeId: id("BANK-SWAP-PROD-FREE-T" + n),
      auftragId: id("BANK-SWAP-PROD-ORDER-T" + n),
      ablaufId: id("BANK-SWAP-PROD-WF-T" + n),
      bestaetigungText: BANK_SWAP_EINMAL_BESTAETIGUNG,
      configFingerprint: hash(
        source + ":" + expected.pack + ":" + expected.a + ":" + expected.b,
      ),
      wissensSnapshot: Object.freeze({
        gitCommit: source,
        quellenSha256: await sourceHashes(),
      }),
      ausgang,
      mountBeobachter,
      adapter,
      bankBeobachter,
      releaseBeobachter,
    }, startMs);

    const after = await host.pruefeBankSwapStartBereit();
    const leases = host.bankLeaseStatus();
    const status = host.status();
    const bestanden = result.status === "COMMITTED"
      && result.recovery?.art === "COMMITTED"
      && result.recovery?.klassifikation === "BESTAETIGT"
      && result.journalTerminalArt === "COMMIT"
      && adapter.adapterAufrufe === 1
      && adapter.gameWrites === 1
      && adapter.moeglicherSend === true
      && after.bereit
      && leases.every(x => x.zustand === "RELEASED")
      && status.bankSwapEinmalAuthorityOffen === false;

    const report = Object.freeze({
      schemaVersion: 1,
      stufe: stage,
      evidenceArt: "V5_BANK_SWAP_FUNCTION_TEST_" + n,
      status: bestanden ? "BESTANDEN" : "NICHT_BESTANDEN",
      sourceSha: source,
      actualHeadSha: actual,
      testNum: n,
      transaktionsId,
      candidateBefore: mount?.kandidat ?? null,
      resultStatus: result.status,
      transportArt: result.transportArt,
      recoveryArt: result.recovery?.art ?? null,
      recoveryKlassifikation: result.recovery?.klassifikation ?? null,
      journalTerminalArt: result.journalTerminalArt,
      adapterAufrufe: adapter.adapterAufrufe,
      gameplayWrites: adapter.gameWrites,
      moeglicherSend: adapter.moeglicherSend,
      sameIntentRetry: false,
      bankStartNachherBereit: after.bereit,
      leaseStatus: leases.map(x => Object.freeze({
        epoche: x.epoche,
        zustand: x.zustand,
      })),
      safety: Object.freeze({
        rawSocketEmit: false,
        maxAdapterCalls: 1,
        maxGameplayWrites: 1,
        sameIntentRetry: false,
      }),
    });
    await schreibeBankSwapAbendEvidence(ds, stage, report);
    return report;
  } catch (error) {
    const report = Object.freeze({
      schemaVersion: 1,
      stufe: stage,
      evidenceArt: "V5_BANK_SWAP_FUNCTION_TEST_" + n,
      status: "NICHT_BESTANDEN",
      sourceSha: source,
      actualHeadSha: actual,
      testNum: n,
      transaktionsId,
      candidateBefore: mount?.kandidat ?? null,
      resultStatus: result?.status ?? "FEHLER",
      transportArt: result?.transportArt ?? null,
      recoveryArt: result?.recovery?.art ?? null,
      recoveryKlassifikation: result?.recovery?.klassifikation ?? null,
      journalTerminalArt: result?.journalTerminalArt ?? null,
      adapterAufrufe: adapter?.adapterAufrufe ?? 0,
      gameplayWrites: adapter?.gameWrites ?? 0,
      moeglicherSend: adapter?.moeglicherSend ?? false,
      sameIntentRetry: false,
      fehler: String(error?.message || error).slice(0, 500),
      bankStartNachherBereit: false,
      leaseStatus: host
        ? host.bankLeaseStatus().map(x => Object.freeze({
          epoche: x.epoche,
          zustand: x.zustand,
        }))
        : [],
    });
    await schreibeBankSwapAbendEvidence(ds, stage, report).catch(() => {});
    return report;
  } finally {
    if (host !== null) {
      await host.stoppe("BANK_SWAP_LIVE_TEST_ENDE").catch(() => {});
    }
    context.session.close();
  }
}

const direct = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direct) {
  fuehreBankSwapLiveTest({
    cdpText: arg("--cdp", "http://127.0.0.1:9222/"),
    sourceSha: arg("--source-sha"),
    testNum: arg("--test"),
    bestaetigungText: arg("--confirm"),
  }).then(report => {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "BESTANDEN") process.exitCode = 2;
  }).catch(error => {
    process.stderr.write(JSON.stringify({
      status: "BLOCKIERT",
      fehler: String(error?.message || error),
      hinweis:
        "Nicht erneut ausfuehren. Erst Blocker/Evidence analysieren.",
      sameIntentRetry: false,
    }, null, 2) + "\n");
    process.exitCode = 2;
  });
}
