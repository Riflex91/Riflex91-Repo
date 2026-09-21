import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  CdpSession,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";

const ALLOWED_ORIGIN = "https://adventure.land";
const V5_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
    else throw new Error("V5_AL_CONTEXT_INVENTORY_CLI_UNBEKANNT:" + arg);
  }
  return out;
}

function pruefeSha(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error("V5_AL_CONTEXT_INVENTORY_SOURCE_SHA_ERFORDERLICH");
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

function flattenFrames(frameTree, out = []) {
  if (!frameTree || typeof frameTree !== "object") return out;
  const frame = frameTree.frame;
  if (frame && typeof frame === "object") {
    out.push({
      id: typeof frame.id === "string" ? frame.id : null,
      parentId: typeof frame.parentId === "string" ? frame.parentId : null,
      url: typeof frame.url === "string" ? frame.url : null,
      name: typeof frame.name === "string" ? frame.name : null,
      securityOrigin:
        typeof frame.securityOrigin === "string" ? frame.securityOrigin : null,
      mimeType: typeof frame.mimeType === "string" ? frame.mimeType : null,
    });
  }
  if (Array.isArray(frameTree.childFrames)) {
    for (const child of frameTree.childFrames) flattenFrames(child, out);
  }
  return out;
}

const CONTEXT_PROBE = [
  "(() => {",
  "  let href=null,title=null,bodyId=null;",
  "  try { href=String(globalThis.location&&globalThis.location.href||''); } catch {}",
  "  try { title=String(globalThis.document&&globalThis.document.title||''); } catch {}",
  "  try { bodyId=String(globalThis.document&&globalThis.document.body&&globalThis.document.body.id||''); } catch {}",
  "  let c=null;",
  "  try { c=globalThis.character||null; } catch {}",
  "  let g=null;",
  "  try { g=globalThis.G||null; } catch {}",
  "  let parentInfo={accessible:false};",
  "  try {",
  "    if (globalThis.parent) {",
  "      parentInfo={",
  "        accessible:true,",
  "        sameWindow:globalThis.parent===globalThis,",
  "        hasCharacter:!!globalThis.parent.character,",
  "        bankWithdrawType:typeof globalThis.parent.bank_withdraw,",
  "        codeActive:globalThis.parent.code_active===true,",
  "        codeRun:globalThis.parent.code_run===true",
  "      };",
  "    }",
  "  } catch(error) {",
  "    parentInfo={accessible:false,error:String(error&&error.message||error).slice(0,160)};",
  "  }",
  "  let maincode=null;",
  "  try {",
  "    const el=globalThis.document&&globalThis.document.getElementById&&globalThis.document.getElementById('maincode');",
  "    if (el) {",
  "      maincode={",
  "        tagName:String(el.tagName||''),",
  "        src:String(el.src||''),",
  "        contentWindowAccessible:!!el.contentWindow",
  "      };",
  "    }",
  "  } catch(error) { maincode={error:String(error&&error.message||error).slice(0,160)}; }",
  "  return {",
  "    href,",
  "    title,",
  "    bodyId,",
  "    hasCharacter:!!c,",
  "    characterName:c?String(c.name||''):null,",
  "    characterMap:c?String(c.map||''):null,",
  "    characterType:c?String(c.ctype||c.type||''):null,",
  "    hasG:!!g,",
  "    hasGItems:!!(g&&g.items),",
  "    bankWithdrawType:typeof globalThis.bank_withdraw,",
  "    bankDepositType:typeof globalThis.bank_deposit,",
  "    callCodeFunctionType:typeof globalThis.call_code_function,",
  "    codeEvalType:typeof globalThis.code_eval,",
  "    codeActive:globalThis.code_active===true,",
  "    codeRun:globalThis.code_run===true,",
  "    parentInfo,",
  "    maincode",
  "  };",
  "})()",
].join("\n");

async function inventarTarget(target) {
  const row = {
    target: {
      id: target.id ?? null,
      type: target.type ?? null,
      url: target.url ?? null,
      title: target.title ?? null,
    },
    frames: [],
    contexts: [],
    fehler: null,
  };

  if (typeof target.webSocketDebuggerUrl !== "string") {
    row.fehler = "WEBSOCKET_DEBUGGER_URL_FEHLT";
    return row;
  }

  const session = new CdpSession(target.webSocketDebuggerUrl);
  try {
    await session.open();
    await session.enableRuntime();

    try {
      await session.command("Page.enable");
      const frameTree = await session.command("Page.getFrameTree");
      row.frames = flattenFrames(frameTree?.frameTree);
    } catch (error) {
      row.frames = [{
        fehler: String(error?.message || error).slice(0, 240),
      }];
    }

    const contexts = [...session.contexts.values()]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .slice(0, 128);

    for (const context of contexts) {
      let probe = null;
      let probeFehler = null;
      try {
        probe = await session.evaluate(CONTEXT_PROBE, context.id);
      } catch (error) {
        probeFehler = String(error?.message || error).slice(0, 300);
      }
      row.contexts.push({
        id: context.id,
        origin: typeof context.origin === "string" ? context.origin : null,
        name: typeof context.name === "string" ? context.name : null,
        uniqueId:
          typeof context.uniqueId === "string" ? context.uniqueId : null,
        auxData: context.auxData ?? null,
        probe,
        probeFehler,
      });
    }
  } catch (error) {
    row.fehler = String(error?.message || error).slice(0, 300);
  } finally {
    session.close();
  }
  return row;
}

export async function fuehreAdventureLandContextInventarAus({
  cdpText,
  sourceSha,
} = {}) {
  const erwartetSha = pruefeSha(sourceSha);
  const actualHeadSha = aktuellerGitHead();
  if (actualHeadSha !== erwartetSha) {
    throw new Error(
      "V5_AL_CONTEXT_INVENTORY_SOURCE_SHA_MISMATCH:HEAD="
      + actualHeadSha + ":ERWARTET=" + erwartetSha,
    );
  }

  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const listUrl = new URL("json/list", cdp);
  const response = await fetch(listUrl, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    throw new Error("V5_AL_CONTEXT_INVENTORY_TARGET_LIST_HTTP_" + response.status);
  }
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length > 128) {
    throw new Error("V5_AL_CONTEXT_INVENTORY_TARGET_LIST_UNGUELTIG");
  }

  const targets = rows.filter(row => {
    if (typeof row?.webSocketDebuggerUrl !== "string") return false;
    if (row?.type !== "page" && row?.type !== "iframe") return false;
    try {
      const url = new URL(row.url);
      return url.origin === ALLOWED_ORIGIN;
    } catch {
      return false;
    }
  }).slice(0, 16);

  const inventar = [];
  for (const target of targets) {
    inventar.push(await inventarTarget(target));
  }

  const runnerTreffer = [];
  for (const target of inventar) {
    for (const context of target.contexts) {
      const p = context.probe;
      if (!p || typeof p !== "object") continue;
      if (p.bankWithdrawType === "function"
          || (typeof p.href === "string" && /\/runner(?:[?#]|$)/.test(p.href))
          || p.codeActive === true
          || p.codeRun === true) {
        runnerTreffer.push({
          targetType: target.target.type,
          targetUrl: target.target.url,
          contextId: context.id,
          origin: context.origin,
          name: context.name,
          auxData: context.auxData,
          href: p.href,
          hasCharacter: p.hasCharacter,
          characterName: p.characterName,
          bankWithdrawType: p.bankWithdrawType,
          bankDepositType: p.bankDepositType,
          codeActive: p.codeActive,
          codeRun: p.codeRun,
          callCodeFunctionType: p.callCodeFunctionType,
          codeEvalType: p.codeEvalType,
        });
      }
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    evidenceArt: "V5_ADVENTURE_LAND_CDP_CONTEXT_INVENTORY_READ_ONLY",
    status: "DIAGNOSE",
    sourceSha: erwartetSha,
    actualHeadSha,
    targetAnzahl: inventar.length,
    runnerTrefferAnzahl: runnerTreffer.length,
    runnerTreffer,
    inventar,
    gameplayWrites: 0,
    adapterAufrufe: 0,
    rawWriteAutoritaet: false,
    gameplayAutoritaet: false,
    sameIntentRetry: false,
    diagnoseZaehltAlsFunktionsTest: false,
  });
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (direkt) {
  const args = parseArgs(process.argv.slice(2));
  fuehreAdventureLandContextInventarAus({
    cdpText: args.cdp,
    sourceSha: args.sourceSha,
  }).then(report => {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  }).catch(fehler => {
    process.stderr.write(JSON.stringify({
      status: "BLOCKIERT",
      fehler: String(fehler?.message || fehler),
      gameplayWrites: 0,
      adapterAufrufe: 0,
      sameIntentRetry: false,
      diagnoseZaehltAlsFunktionsTest: false,
    }, null, 2) + "\n");
    process.exitCode = 1;
  });
}
