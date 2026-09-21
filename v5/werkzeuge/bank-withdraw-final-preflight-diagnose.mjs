import crypto from "node:crypto";
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
  beobachteBankWithdrawRohReadOnly,
} from "./bank-withdraw-produktions-browser.mjs";

const V5_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_ROOT = path.resolve(V5_ROOT, "..");
const REPORT_PATH = "runtime/canary/bank-withdraw-production/latest.json";

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function phase(text) {
  process.stdout.write("[V5-BANK-WITHDRAW-FINAL-PREFLIGHT] " + text + "\n");
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
    else throw new Error(
      "BANK_WITHDRAW_FINAL_PREFLIGHT_CLI_ARGUMENT_UNBEKANNT:" + arg,
    );
  }
  return out;
}

function pruefeSha(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error("BANK_WITHDRAW_FINAL_PREFLIGHT_SOURCE_SHA_ERFORDERLICH");
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

function text(value, code) {
  if (typeof value !== "string" || value.length === 0) throw new Error(code);
  return value;
}

async function warteAufStabilenBankSnapshotReadOnly(
  session,
  contextId,
  {
    timeoutMs = 90_000,
    pollMs = 500,
  } = {},
) {
  const start = Date.now();
  let vorher = null;

  phase("BANK_MANUELL_BETRETEN_ODER_IN_BANK_BLEIBEN");

  while (Date.now() - start <= timeoutMs) {
    const roh = await beobachteBankWithdrawRohReadOnly(session, contextId);
    if (roh.bankGemountet === true
        && roh.bewegtSich !== true
        && roh.queueAktiv !== true
        && Number.isSafeInteger(roh.bankGold)
        && roh.bankGold >= 0) {
      const fingerprint = hash(JSON.stringify({
        accountId: roh.accountId,
        charakterName: roh.charakterName,
        sessionId: roh.sessionId,
        serverRegion: roh.serverRegion,
        serverKennung: roh.serverKennung,
        map: roh.map,
        bankGemountet: roh.bankGemountet,
        characterGold: roh.characterGold,
        bankGold: roh.bankGold,
        inventorySha256: hash(roh.inventoryMaterial),
      }));
      const snapshot = Object.freeze({
        ...roh,
        fingerprint,
        inventorySha256: hash(roh.inventoryMaterial),
      });
      if (vorher !== null && vorher.fingerprint === snapshot.fingerprint) {
        phase("BANK_SNAPSHOT_STABIL_BEOBACHTET");
        return snapshot;
      }
      vorher = snapshot;
    } else {
      vorher = null;
    }
    await sleep(pollMs);
  }
  throw new Error("BANK_WITHDRAW_FINAL_PREFLIGHT_BANK_SNAPSHOT_TIMEOUT");
}

async function dynamischeFinalChecksReadOnly(session, contextId) {
  const expr = [
    "(() => {",
    "  const kandidaten=[{label:'globalThis',root:globalThis}];",
    "  try { if (globalThis.parent && globalThis.parent!==globalThis) kandidaten.push({label:'parent',root:globalThis.parent}); } catch {}",
    "  const rootCapabilities=kandidaten.map((x,index)=>{",
    "    try {",
    "      const r=x.root;",
    "      const c=r&&r.character;",
    "      const bank=c&&c.bank&&typeof c.bank==='object'&&!Array.isArray(c.bank)?c.bank:null;",
    "      return {",
    "        index,",
    "        label:x.label,",
    "        hasCharacter:!!c,",
    "        characterName:c?String(c.name||''):null,",
    "        map:c?String(c.map||''):null,",
    "        bankMounted:!!bank,",
    "        bankWithdrawType:typeof (r&&r.bank_withdraw),",
    "        hasBankWithdraw:typeof (r&&r.bank_withdraw)==='function'",
    "      };",
    "    } catch(error) {",
    "      return {index,label:x.label,probeError:String(error&&error.message||error).slice(0,160)};",
    "    }",
    "  });",
    "  let root=null;",
    "  let rootLabel=null;",
    "  for (const x of kandidaten) {",
    "    try {",
    "      if (x.root&&x.root.character&&typeof x.root.bank_withdraw==='function') {",
    "        root=x.root;",
    "        rootLabel=x.label;",
    "        break;",
    "      }",
    "    } catch {}",
    "  }",
    "  if (!root) return {ok:false,reason:'CONTEXT_FEHLT',rootCapabilities};",
    "  const c=root.character;",
    "  let accountId='';",
    "  for (const x of kandidaten) { try { const r=x.root; accountId=String(r?.user_id||r?.character?.owner||''); if(accountId) break; } catch {} }",
    "  const regionKandidaten=[root?.server_region,root?.server?.region];",
    "  const idKandidaten=[root?.server_identifier,root?.server?.id];",
    "  try { regionKandidaten.push(root?.parent?.server_region,root?.parent?.server?.region); } catch {}",
    "  try { idKandidaten.push(root?.parent?.server_identifier,root?.parent?.server?.id); } catch {}",
    "  const region=regionKandidaten.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
    "  const sid=idKandidaten.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
    "  let alt=false;",
    "  for (const x of kandidaten) {",
    "    const r=x.root;",
    "    try { const v3=r&&r.AIO_V3&&r.AIO_V3.__runtime; const s3=v3&&typeof v3.status==='function'?v3.status():null; if(v3&&(v3.timer||(s3&&s3.running===true))) alt=true; } catch { alt=true; }",
    "    try { const v4=r&&(r.AIO_V4||r.V4Runtime); const s4=v4&&typeof v4.status==='function'?v4.status():null; if(s4&&(s4.running===true||s4.aktivFreigegeben===true)) alt=true; } catch { alt=true; }",
    "  }",
    "  const bank=c.bank&&typeof c.bank==='object'&&!Array.isArray(c.bank)?c.bank:null;",
    "  return {",
    "    ok:true,",
    "    rootLabel,",
    "    rootCapabilities,",
    "    accountId,",
    "    characterName:String(c.name||''),",
    "    sessionId:String(c.id||''),",
    "    region,",
    "    sid,",
    "    merchant:String(c.ctype||c.type||'').toLowerCase()==='merchant',",
    "    rip:c.rip===true,",
    "    moving:c.moving===true,",
    "    targetPresent:c.target!=null,",
    "    targetValue:c.target==null?null:String(c.target).slice(0,120),",
    "    queueActive:!!(c.q&&typeof c.q==='object'&&Object.keys(c.q).length),",
    "    alternativeRuntimeActive:alt,",
    "    bankMounted:!!bank,",
    "    characterGold:Number.isSafeInteger(Number(c.gold))?Number(c.gold):null,",
    "    bankGold:bank&&Number.isSafeInteger(Number(bank.gold))?Number(bank.gold):null,",
    "    bankWithdrawAvailable:true",
    "  };",
    "})()",
  ].join("\n");
  return session.evaluate(expr, contextId);
}

function leiteGruendeAb(snapshot, dyn, intent) {
  const gruende = [];
  if (!dyn?.ok) gruende.push(String(dyn?.reason || "CONTEXT_FEHLT"));
  else {
    if (!dyn.bankWithdrawAvailable) gruende.push("CONTEXT_FEHLT");
    if (!dyn.merchant) gruende.push("MERCHANT_ERFORDERLICH");
    if (dyn.rip || dyn.moving || dyn.targetPresent) {
      gruende.push("CHARAKTER_NICHT_IDLE");
    }
    if (dyn.queueActive) gruende.push("QUEUE_AKTIV");
    if (dyn.alternativeRuntimeActive) gruende.push("ALTERNATIVE_RUNTIME_AKTIV");
    if (!dyn.bankMounted) gruende.push("BANK_NICHT_GEMOUNTET");
  }

  const vorherCharacterGold = safeInteger(
    intent.inhalt?.character_gold_vorher,
    "BANK_WITHDRAW_FINAL_PREFLIGHT_CHARACTER_GOLD_VORHER_UNGUELTIG",
  );
  const vorherBankGold = safeInteger(
    intent.inhalt?.bank_gold_vorher,
    "BANK_WITHDRAW_FINAL_PREFLIGHT_BANK_GOLD_VORHER_UNGUELTIG",
  );
  const vorherFingerprint = text(
    intent.inhalt?.pinned_prestate_fingerprint,
    "BANK_WITHDRAW_FINAL_PREFLIGHT_FINGERPRINT_VORHER_UNGUELTIG",
  );

  if (snapshot.characterGold !== vorherCharacterGold
      || snapshot.bankGold !== vorherBankGold) {
    gruende.push("FINAL_GOLD_DRIFT_JETZT");
  }
  if (snapshot.fingerprint !== vorherFingerprint) {
    gruende.push("FINAL_FINGERPRINT_DRIFT_JETZT");
  }

  return Object.freeze({
    gruende: Object.freeze([...new Set(gruende)]),
    vorherCharacterGold,
    vorherBankGold,
    vorherFingerprint,
  });
}

export async function fuehreBankWithdrawFinalPreflightDiagnoseAus({
  cdpText,
  sourceSha,
} = {}) {
  const erwartetSha = pruefeSha(sourceSha);
  const actualHeadSha = aktuellerGitHead();
  if (actualHeadSha !== erwartetSha) {
    throw new Error(
      "BANK_WITHDRAW_FINAL_PREFLIGHT_SOURCE_SHA_MISMATCH:HEAD="
      + actualHeadSha + ":ERWARTET=" + erwartetSha,
    );
  }

  const dateisystem = new NodeProduktionsDateisystem();
  const report = parseJson(
    await dateisystem.liesText(REPORT_PATH),
    "BANK_WITHDRAW_FINAL_PREFLIGHT_REPORT_FEHLT_ODER_UNGUELTIG",
  );

  if (report.evidenceArt !== "V5_PRODUCTION_BANK_WITHDRAW_ONE_GOLD_ONE_SHOT_LIVE"
      || report.result?.transportArt !== "NICHT_GESENDET"
      || report.adapterAufrufe !== 1
      || report.gameWrites !== 0
      || report.moeglicherSend !== false
      || typeof report.transaktionsId !== "string") {
    throw new Error(
      "BANK_WITHDRAW_FINAL_PREFLIGHT_REPORT_NICHT_DIAGNOSEFAEHIG",
    );
  }

  const journal = new NodeBankWithdrawTransaktionsJournal(dateisystem);
  const eintraege = await journal.liesTransaktion(report.transaktionsId);
  const intent = eintraege.find(x => x.art === "INTENT");
  if (!intent) {
    throw new Error("BANK_WITHDRAW_FINAL_PREFLIGHT_INTENT_FEHLT");
  }

  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const live = await findeAdventureLandKontext(
    cdp,
    { requiredGlobalFunction: "bank_withdraw" },
  );

  try {
    const snapshot = await warteAufStabilenBankSnapshotReadOnly(
      live.session,
      live.contextId,
    );
    const dyn = await dynamischeFinalChecksReadOnly(
      live.session,
      live.contextId,
    );
    const abgleich = leiteGruendeAb(snapshot, dyn, intent);

    const zielGateAktiv = dyn?.targetPresent === true;
    let klassifikation = "KEIN_AKTUELLER_BLOCKER_REPRODUZIERT";
    if (dyn?.ok !== true && dyn?.reason === "CONTEXT_FEHLT") {
      klassifikation = "CONTEXT_GATE_EXAKT_REPRODUZIERT";
    } else if (zielGateAktiv) {
      klassifikation = "TARGET_GATE_REPRODUZIERT";
    } else if (abgleich.gruende.includes("FINAL_GOLD_DRIFT_JETZT")) {
      klassifikation = "PRESTATE_GOLD_DRIFT_JETZT";
    } else if (abgleich.gruende.includes("FINAL_FINGERPRINT_DRIFT_JETZT")) {
      klassifikation = "PRESTATE_FINGERPRINT_DRIFT_JETZT";
    } else if (abgleich.gruende.length > 0) {
      klassifikation = "ANDERER_FINAL_PREFLIGHT_BLOCKER_REPRODUZIERT";
    }

    return Object.freeze({
      schemaVersion: 1,
      evidenceArt: "V5_BANK_WITHDRAW_FINAL_PREFLIGHT_DIAGNOSE_READ_ONLY",
      status: "DIAGNOSE",
      klassifikation,
      sourceSha: erwartetSha,
      actualHeadSha,
      transaktionsId: report.transaktionsId,
      letzterLiveLauf: Object.freeze({
        status: report.status ?? null,
        transportArt: report.result?.transportArt ?? null,
        journalTerminalArt: report.result?.journalTerminalArt ?? null,
        adapterAufrufe: report.adapterAufrufe,
        gameWrites: report.gameWrites,
        moeglicherSend: report.moeglicherSend,
      }),
      persistenterPrestate: Object.freeze({
        characterGold: abgleich.vorherCharacterGold,
        bankGold: abgleich.vorherBankGold,
        fingerprintSha256: hash(abgleich.vorherFingerprint),
      }),
      aktuellerBankSnapshot: Object.freeze({
        characterGold: snapshot.characterGold,
        bankGold: snapshot.bankGold,
        fingerprintGleichPrestate:
          snapshot.fingerprint === abgleich.vorherFingerprint,
      }),
      ausgewaehlterCdpKontext: Object.freeze({
        requiredGlobalFunction: live.requiredGlobalFunction ?? null,
        contextName: live.contextName ?? "",
        contextType: live.contextType ?? null,
        contextIsDefault: live.contextIsDefault === true,
        frameId: live.frameId ?? null,
        targetUrl: live.targetUrl ?? null,
      }),
      dynamischeFinalChecks: Object.freeze({
        merchant: dyn?.merchant === true,
        rip: dyn?.rip === true,
        moving: dyn?.moving === true,
        targetPresent: dyn?.targetPresent === true,
        targetValue: dyn?.targetValue ?? null,
        queueActive: dyn?.queueActive === true,
        alternativeRuntimeActive: dyn?.alternativeRuntimeActive === true,
        bankMounted: dyn?.bankMounted === true,
        bankWithdrawAvailable: dyn?.bankWithdrawAvailable === true,
        ausgewaehlterRoot: dyn?.rootLabel ?? null,
        rootCapabilities: Array.isArray(dyn?.rootCapabilities)
          ? Object.freeze(dyn.rootCapabilities.map(x => Object.freeze({ ...x })))
          : Object.freeze([]),
      }),
      aktuelleBlocker: abgleich.gruende,
      hinweis:
        "Read-only Reproduktion des Final-Preflight. Kein bank_withdraw-Aufruf. "
        + "Aktuelle Gold/Fingerprint-Drift kann nach dem Test entstanden sein; "
        + "dynamische Gates wie target/queue/runtime sind direkt beobachtet.",
      gameplayWrites: 0,
      adapterAufrufe: 0,
      rawWriteAutoritaet: false,
      gameplayAutoritaet: false,
      sameIntentRetry: false,
      diagnoseZaehltAlsFunktionsTest: false,
    });
  } finally {
    live.session.close();
  }
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (direkt) {
  const args = parseArgs(process.argv.slice(2));
  fuehreBankWithdrawFinalPreflightDiagnoseAus({
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
