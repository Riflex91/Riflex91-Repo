import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  pruefeBankSwapVorAuthorityCurrentFence,
} from "../erzeugt/index.js";
import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  BANK_SWAP_PREFLIGHT_GAMEPLAY_WRITES,
  BANK_SWAP_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS,
  beobachteBankSwapPreflightReadOnly,
} from "./bank-swap-produktions-browser.mjs";
import {
  erstelleNodeV5ProduktionsHost,
} from "./v5-produktions-host-komposition.mjs";
import {
  NodeProduktionsDateisystem,
} from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  BANK_SWAP_ABEND_STUFEN,
  schreibeBankSwapAbendEvidence,
} from "./bank-swap-evening-evidence.mjs";

const V5_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(V5_ROOT, "..");

function hash(wert) {
  return crypto.createHash("sha256").update(String(wert)).digest("hex");
}

function pruefeSha(wert) {
  if (typeof wert !== "string" || !/^[a-f0-9]{40}$/i.test(wert)) {
    throw new Error("BANK_SWAP_PREFLIGHT_SOURCE_SHA_ERFORDERLICH");
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

function leseArgument(name, fallback = undefined) {
  const i = process.argv.indexOf(name);
  if (i < 0) return fallback;
  const wert = process.argv[i + 1];
  if (!wert || wert.startsWith("--")) {
    throw new Error("BANK_SWAP_PREFLIGHT_ARGUMENT_FEHLT:" + name);
  }
  return wert;
}

export async function fuehreBankSwapPreflight({
  cdpText,
  sourceSha,
  hostOptionen = {},
} = {}) {
  const erwartet = pruefeSha(sourceSha);
  const actualHeadSha = aktuellerGitHead();
  if (actualHeadSha !== erwartet) {
    throw new Error(
      "BANK_SWAP_PREFLIGHT_SOURCE_SHA_DRIFT:"
      + erwartet + ":" + actualHeadSha,
    );
  }
  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const live = await findeAdventureLandKontext(
    cdp,
    { requiredGlobalFunction: "call_code_function_f" },
  );
  let host = null;
  try {
    const beobachtung = await beobachteBankSwapPreflightReadOnly(
      live.session,
      live.contextId,
    );
    host = await erstelleNodeV5ProduktionsHost(hostOptionen);
    const start = await host.starte(Date.now());
    if (start.zustand !== "LAEUFT") {
      throw new Error("BANK_SWAP_PREFLIGHT_HOST_BLOCKIERT:" + start.grund);
    }
    const current = await host.pruefeBankSwapStartBereit();
    const status = host.status();
    const fence = pruefeBankSwapVorAuthorityCurrentFence({
      schemaVersion: 1,
      equipEinmalAuthorityOffen: status.equipEinmalAuthorityOffen,
      bankDepositEinmalAuthorityOffen: status.bankDepositEinmalAuthorityOffen,
      bankWithdrawEinmalAuthorityOffen: status.bankWithdrawEinmalAuthorityOffen,
      bankSwapEinmalAuthorityOffen:
        status.bankSwapEinmalAuthorityOffen,
      offeneBankDepositTransaktionId:
        current.offeneBankDepositTransaktionId,
      offeneBankWithdrawTransaktionId:
        current.offeneBankWithdrawTransaktionId,
      offeneBankSwapTransaktionId:
        current.offeneBankSwapTransaktionId,
      aktiveBankLease: current.offeneBankLease !== null,
    });
    const bereit = current.bereit
      && fence.status === "BEREIT"
      && status.zustand === "LAEUFT"
      && status.aktivePlanenFaehigkeiten.length === 0
      && status.gameplayAutoritaet === false
      && status.rawWriteAutoritaet === false
      && status.actionAuthority === false;

    const bericht = Object.freeze({
      schemaVersion: 1,
      stufe: BANK_SWAP_ABEND_STUFEN.PREFLIGHT,
      evidenceArt: "V5_BANK_SWAP_READ_ONLY_PREFLIGHT",
      status: bereit ? "BEREIT" : "BLOCKIERT",
      sourceSha: erwartet,
      actualHeadSha,
      context: Object.freeze({
        targetUrl: live.targetUrl,
        contextId: live.contextId,
        requiredGlobalFunction: "call_code_function_f",
      }),
      charakterBindungSha256: hash(
        beobachtung.charakterName + ":" + beobachtung.sessionId,
      ),
      accountBindungSha256: hash(beobachtung.accountId),
      ctype: beobachtung.ctype,
      server: Object.freeze({
        region: beobachtung.serverRegion,
        kennung: beobachtung.serverKennung,
      }),
      mount: Object.freeze({
        map: beobachtung.map,
        bankGemountet: beobachtung.bankGemountet,
        beobachtetePacks: beobachtung.beobachtetePacks,
      }),
      bridge: Object.freeze({
        callCodeFunctionFAvailable: beobachtung.bridgeFunctionAvailable,
        codeActiveObserved: beobachtung.codeActive,
        bootstrapAusgeloest: false,
        bankSwapAufrufe: 0,
      }),
      candidate: beobachtung.kandidat,
      baseline: Object.freeze({
        characterGold: beobachtung.characterGold,
        bankGold: beobachtung.bankGold,
        inventorySha256: beobachtung.inventorySha256,
        fingerprint: beobachtung.fingerprint,
        beobachtetAmMs: beobachtung.beobachtetAmMs,
      }),
      current: Object.freeze({
        bereit: current.bereit,
        offeneBankDepositTransaktionId:
          current.offeneBankDepositTransaktionId,
        offeneBankWithdrawTransaktionId:
          current.offeneBankWithdrawTransaktionId,
        offeneBankSwapTransaktionId:
          current.offeneBankSwapTransaktionId,
        offeneBankLease: current.offeneBankLease,
      }),
      fence,
      host: Object.freeze({
        zustand: status.zustand,
        aktivePlanenFaehigkeiten: status.aktivePlanenFaehigkeiten,
        equipEinmalAuthorityOffen: status.equipEinmalAuthorityOffen,
        bankDepositEinmalAuthorityOffen:
          status.bankDepositEinmalAuthorityOffen,
        bankWithdrawEinmalAuthorityOffen:
          status.bankWithdrawEinmalAuthorityOffen,
        bankSwapEinmalAuthorityOffen:
          status.bankSwapEinmalAuthorityOffen,
        gameplayAutoritaet: status.gameplayAutoritaet,
        rawWriteAutoritaet: status.rawWriteAutoritaet,
        actionAuthority: status.actionAuthority,
      }),
      safety: Object.freeze({
        browserReadOnly: true,
        gameplayWrites: BANK_SWAP_PREFLIGHT_GAMEPLAY_WRITES,
        mutatingPublicFunctionCalls:
          BANK_SWAP_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS,
        authorityAusgestellt: false,
        leaseErworben: false,
        journalIntentGeschrieben: false,
        adapterAufrufe: 0,
        bankSwapAufrufe: 0,
        rawSocketEmit: false,
        sameIntentRetry: false,
      }),
      sameIntentRetry: false,
      naechsterSchritt: bereit
        ? "BANK_SWAP_KANDIDATEN_STABILITAET_READ_ONLY"
        : "BLOCKER_LOKALISIEREN_KEIN_RETRY",
    });
    if (bereit) {
      const ds = new NodeProduktionsDateisystem(
        hostOptionen.dateisystemOptionen ?? {},
      );
      await schreibeBankSwapAbendEvidence(
        ds,
        BANK_SWAP_ABEND_STUFEN.PREFLIGHT,
        bericht,
      );
    }
    return bericht;
  } finally {
    if (host !== null) {
      await host.stoppe("BANK_SWAP_PREFLIGHT_ENDE").catch(() => {});
    }
    live.session.close();
  }
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direkt) {
  fuehreBankSwapPreflight({
    cdpText: leseArgument(
      "--cdp",
      process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
    ),
    sourceSha: leseArgument("--source-sha"),
  }).then(bericht => {
    process.stdout.write(JSON.stringify(bericht, null, 2) + "\n");
    if (bericht.status !== "BEREIT") process.exitCode = 2;
  }).catch(fehler => {
    process.stderr.write(JSON.stringify({
      schemaVersion: 1,
      evidenceArt: "V5_BANK_SWAP_READ_ONLY_PREFLIGHT",
      status: "BLOCKIERT",
      fehler: String(fehler?.message || fehler),
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      authorityAusgestellt: false,
      leaseErworben: false,
      journalIntentGeschrieben: false,
      adapterAufrufe: 0,
      bankSwapAufrufe: 0,
      sameIntentRetry: false,
    }, null, 2) + "\n");
    process.exitCode = 2;
  });
}
