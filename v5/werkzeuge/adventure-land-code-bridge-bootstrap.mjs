import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";

const V5_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_ROOT = path.resolve(V5_ROOT, "..");

function parseArgs(argv) {
  const out = {
    cdp: "http://127.0.0.1:9222/",
    sourceSha: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cdp") out.cdp = argv[++i];
    else if (arg === "--source-sha") out.sourceSha = argv[++i];
    else throw new Error("V5_CODE_BRIDGE_BOOTSTRAP_CLI_UNBEKANNT:" + arg);
  }
  return out;
}

function pruefeSha(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error("V5_CODE_BRIDGE_BOOTSTRAP_SOURCE_SHA_ERFORDERLICH");
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

const BRIDGE_PROBE_EXPR = [
  "(async () => {",
  "  const roots=[globalThis];",
  "  try { if(globalThis.parent&&globalThis.parent!==globalThis) roots.push(globalThis.parent); } catch {}",
  "  let root=null;",
  "  for(const r of roots) {",
  "    try { if(r&&r.character&&typeof r.call_code_function_f==='function') { root=r; break; } } catch {}",
  "  }",
  "  if(!root) return {status:'BLOCKIERT',grund:'CODE_BRIDGE_KONTEXT_FEHLT'};",
  "  const runnerWindow=()=>{",
  "    try { const el=root.document&&root.document.getElementById&&root.document.getElementById('maincode'); return el&&el.contentWindow?el.contentWindow:null; } catch { return null; }",
  "  };",
  "  let runner=runnerWindow();",
  "  const vorher={",
  "    codeActive:root.code_active===true,",
  "    codeRun:root.code_run===true,",
  "    maincodePresent:!!runner,",
  "    bankWithdrawType:typeof (runner&&runner.bank_withdraw),",
  "    bankDepositType:typeof (runner&&runner.bank_deposit)",
  "  };",
  "  let bootstrapAusgeloest=false;",
  "  if(!(root.code_active===true&&runner&&typeof runner.bank_withdraw==='function')) {",
  "    if(root.code_run!==true) {",
  "      try {",
  "        root.call_code_function_f('eval','void 0');",
  "        bootstrapAusgeloest=true;",
  "      } catch(error) {",
  "        return {status:'BLOCKIERT',grund:'CODE_RUNNER_BOOTSTRAP_FEHLER',detail:String(error&&error.message||error).slice(0,200),vorher};",
  "      }",
  "    }",
  "    const deadline=Date.now()+5000;",
  "    while(Date.now()<deadline) {",
  "      runner=runnerWindow();",
  "      if(root.code_active===true&&runner&&typeof runner.bank_withdraw==='function') break;",
  "      await new Promise(resolve=>setTimeout(resolve,50));",
  "    }",
  "  }",
  "  runner=runnerWindow();",
  "  const nachher={",
  "    codeActive:root.code_active===true,",
  "    codeRun:root.code_run===true,",
  "    maincodePresent:!!runner,",
  "    bankWithdrawType:typeof (runner&&runner.bank_withdraw),",
  "    bankDepositType:typeof (runner&&runner.bank_deposit)",
  "  };",
  "  const bereit=nachher.codeActive===true&&nachher.maincodePresent===true&&nachher.bankWithdrawType==='function';",
  "  return {",
  "    status:bereit?'BEREIT':'BLOCKIERT',",
  "    grund:bereit?null:'CODE_RUNNER_BANK_WITHDRAW_CAPABILITY_FEHLT',",
  "    bootstrapAusgeloest,",
  "    vorher,",
  "    nachher,",
  "    characterName:String(root.character&&root.character.name||''),",
  "    map:String(root.character&&root.character.map||'')",
  "  };",
  "})()",
].join("\n");

export async function fuehreCodeBridgeBootstrapProbeAus({
  cdpText,
  sourceSha,
} = {}) {
  const erwartetSha = pruefeSha(sourceSha);
  const actualHeadSha = aktuellerGitHead();
  if (actualHeadSha !== erwartetSha) {
    throw new Error(
      "V5_CODE_BRIDGE_BOOTSTRAP_SOURCE_SHA_MISMATCH:HEAD="
      + actualHeadSha + ":ERWARTET=" + erwartetSha,
    );
  }

  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const live = await findeAdventureLandKontext(
    cdp,
    { requiredGlobalFunction: "call_code_function_f" },
  );

  try {
    const result = await live.session.evaluate(
      BRIDGE_PROBE_EXPR,
      live.contextId,
      { userGesture: true },
    );

    return Object.freeze({
      schemaVersion: 1,
      evidenceArt:
        "V5_ADVENTURE_LAND_CODE_BRIDGE_BOOTSTRAP_NO_GAMEPLAY_WRITE",
      status: result?.status === "BEREIT" ? "BEREIT" : "BLOCKIERT",
      grund: result?.grund ?? null,
      sourceSha: erwartetSha,
      actualHeadSha,
      context: Object.freeze({
        requiredGlobalFunction: live.requiredGlobalFunction ?? null,
        contextName: live.contextName ?? "",
        contextType: live.contextType ?? null,
        contextIsDefault: live.contextIsDefault === true,
        frameId: live.frameId ?? null,
        targetUrl: live.targetUrl ?? null,
      }),
      bootstrapAusgeloest: result?.bootstrapAusgeloest === true,
      vorher: result?.vorher ?? null,
      nachher: result?.nachher ?? null,
      characterName: result?.characterName ?? null,
      map: result?.map ?? null,
      gameplayWrites: 0,
      adapterAufrufe: 0,
      rawWriteAutoritaet: false,
      gameplayAutoritaet: false,
      bankWithdrawAufrufe: 0,
      sameIntentRetry: false,
      diagnoseZaehltAlsFunktionsTest: false,
      hinweis:
        "Der Probe darf bei inaktivem CODE-Runner genau einen harmlosen "
        + "call_code_function_f('eval','void 0')-Bootstrap ausloesen. "
        + "Er ruft bank_withdraw niemals auf und erzeugt 0 Gameplay-Writes.",
    });
  } finally {
    live.session.close();
  }
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (direkt) {
  const args = parseArgs(process.argv.slice(2));
  fuehreCodeBridgeBootstrapProbeAus({
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
      bankWithdrawAufrufe: 0,
      sameIntentRetry: false,
      diagnoseZaehltAlsFunktionsTest: false,
    }, null, 2) + "\n");
    process.exitCode = 1;
  });
}
