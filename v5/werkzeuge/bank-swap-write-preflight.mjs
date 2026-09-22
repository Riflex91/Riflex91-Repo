import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NodeProduktionsDateisystem } from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import { findeAdventureLandKontext, validiereLoopbackCdp } from "./r12-live/cdp.mjs";
import { beobachteBankSwapPreflightReadOnly } from "./bank-swap-produktions-browser.mjs";
import { erstelleNodeV5ProduktionsHost } from "./v5-produktions-host-komposition.mjs";
import {
  BANK_SWAP_ABEND_STUFEN,
  schreibeBankSwapAbendEvidence,
  verlangeBankSwapAbendVorstufe,
} from "./bank-swap-evening-evidence.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function sha(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error("BANK_SWAP_WRITE_PREFLIGHT_SHA_UNGUELTIG");
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
    throw new Error("BANK_SWAP_WRITE_PREFLIGHT_ARGUMENT_FEHLT:" + name);
  }
  return value;
}
function sameCandidate(a, b) {
  return a && b
    && a.pack === b.pack && a.a === b.a && a.b === b.b
    && a.itemA.fingerprint === b.itemA.fingerprint
    && a.itemB.fingerprint === b.itemB.fingerprint;
}

export async function fuehreBankSwapWritePreflight({
  cdpText,
  sourceSha,
  hostOptionen = {},
} = {}) {
  const source = sha(sourceSha);
  const actual = head();
  if (source !== actual) {
    throw new Error("BANK_SWAP_WRITE_PREFLIGHT_SOURCE_SHA_DRIFT:" + source + ":" + actual);
  }

  const ds = new NodeProduktionsDateisystem(hostOptionen.dateisystemOptionen ?? {});
  const shadow = await verlangeBankSwapAbendVorstufe(
    ds,
    BANK_SWAP_ABEND_STUFEN.SHADOW,
    source,
  );

  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const live = await findeAdventureLandKontext(
    cdp,
    { requiredGlobalFunction: "call_code_function_f" },
  );

  let host = null;
  try {
    const first = await beobachteBankSwapPreflightReadOnly(live.session, live.contextId);
    await sleep(500);
    const second = await beobachteBankSwapPreflightReadOnly(live.session, live.contextId);

    if (first.fingerprint !== second.fingerprint
        || !sameCandidate(first.kandidat, second.kandidat)) {
      throw new Error("BANK_SWAP_WRITE_PREFLIGHT_KANDIDAT_NICHT_STABIL");
    }
    if (!sameCandidate(second.kandidat, shadow.candidate)) {
      throw new Error("BANK_SWAP_WRITE_PREFLIGHT_KANDIDAT_DRIFT_SEIT_SHADOW");
    }

    host = await erstelleNodeV5ProduktionsHost(hostOptionen);
    const start = await host.starte(Date.now());
    if (start.zustand !== "LAEUFT") {
      throw new Error("BANK_SWAP_WRITE_PREFLIGHT_HOST_BLOCKIERT:" + start.grund);
    }
    const current = await host.pruefeBankSwapStartBereit();
    const status = host.status();
    const bereit = current.bereit
      && status.zustand === "LAEUFT"
      && status.aktivePlanenFaehigkeiten.length === 0
      && status.equipEinmalAuthorityOffen === false
      && status.bankDepositEinmalAuthorityOffen === false
      && status.bankWithdrawEinmalAuthorityOffen === false
      && status.bankSwapEinmalAuthorityOffen === false
      && status.gameplayAutoritaet === false
      && status.rawWriteAutoritaet === false
      && status.actionAuthority === false;

    const runner = await live.session.evaluate(
      "(()=>{try{const r=globalThis;const f=r.document&&r.document.getElementById&&r.document.getElementById('maincode');return {codeActive:r.code_active===true,bankSwapType:f&&f.contentWindow?typeof f.contentWindow.bank_swap:'undefined'}}catch{return {codeActive:false,bankSwapType:'undefined'}}})()",
      live.contextId,
    );

    const bericht = Object.freeze({
      schemaVersion: 1,
      stufe: BANK_SWAP_ABEND_STUFEN.WRITE_PREFLIGHT,
      evidenceArt: "V5_BANK_SWAP_WRITE_PREFLIGHT_NO_WRITE",
      status: bereit ? "BEREIT" : "BLOCKIERT",
      sourceSha: source,
      actualHeadSha: actual,
      candidate: second.kandidat,
      baselineFingerprint: second.fingerprint,
      codeRunner: runner,
      current,
      sameIntentRetry: false,
      safety: Object.freeze({
        gameplayWrites: 0,
        adapterAufrufe: 0,
        bankSwapAufrufe: 0,
        mutatingPublicFunctionCalls: 0,
        authorityAusgestellt: false,
        leaseErworben: false,
        journalIntentGeschrieben: false,
        rawSocketEmit: false,
      }),
    });

    if (bereit) {
      await schreibeBankSwapAbendEvidence(
        ds,
        BANK_SWAP_ABEND_STUFEN.WRITE_PREFLIGHT,
        bericht,
      );
    }
    return bericht;
  } finally {
    if (host !== null) {
      await host.stoppe("BANK_SWAP_WRITE_PREFLIGHT_ENDE").catch(() => {});
    }
    live.session.close();
  }
}

const direct = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direct) {
  fuehreBankSwapWritePreflight({
    cdpText: arg("--cdp", "http://127.0.0.1:9222/"),
    sourceSha: arg("--source-sha"),
  }).then(bericht => {
    process.stdout.write(JSON.stringify(bericht, null, 2) + "\n");
    if (bericht.status !== "BEREIT") process.exitCode = 2;
  }).catch(error => {
    process.stderr.write(JSON.stringify({
      status: "BLOCKIERT",
      fehler: String(error?.message || error),
      gameplayWrites: 0,
      bankSwapAufrufe: 0,
      sameIntentRetry: false,
    }, null, 2) + "\n");
    process.exitCode = 2;
  });
}
