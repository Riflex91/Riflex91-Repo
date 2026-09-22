import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import { aktiviereUndVerifiziereBrowserPerformanceTrick } from "./r12-live/performance-trick.mjs";
import {
  BANK_SWAP_REAL_SHADOW_GAMEPLAY_WRITES,
  beobachteBankSwapRohReadOnly,
  erstelleBankSwapReleaseBeobachter,
  validiereBankSwapAusgangsBeobachtung,
  warteAufManuellenBankSwapMountReadOnly,
} from "./bank-swap-produktions-browser.mjs";
import {
  erstelleNodeV5ProduktionsHost,
} from "./v5-produktions-host-komposition.mjs";
import { NodeProduktionsDateisystem } from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  BANK_SWAP_ABEND_STUFEN,
  schreibeBankSwapAbendEvidence,
  verlangeBankSwapAbendVorstufe,
} from "./bank-swap-evening-evidence.mjs";

export const BANK_SWAP_REAL_SHADOW_BESTAETIGUNG =
  "V5 BANK SWAP SHADOW OHNE WRITE AUSFUEHREN";
export const BANK_SWAP_REAL_SHADOW_EVIDENCE_ART =
  "V5_BANK_SWAP_REAL_BROWSER_SHADOW_NO_WRITE";
export const BANK_SWAP_REAL_SHADOW_BESTAETIGUNG_TOKEN =
  "V5_BANK_SWAP_SHADOW_OHNE_WRITE_AUSFUEHREN";

const V5_WURZEL = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_WURZEL = path.resolve(V5_WURZEL, "..");

function hash(wert) {
  return crypto.createHash("sha256").update(String(wert)).digest("hex");
}

export function leseBankSwapShadowArgument(
  name,
  fallback = null,
  argv = process.argv,
) {
  const i = argv.indexOf(name);
  if (i < 0) return fallback;
  const teile = [];
  for (let j = i + 1; j < argv.length && !String(argv[j]).startsWith("--"); j += 1) {
    teile.push(String(argv[j]));
  }
  if (teile.length === 0) {
    throw new Error("BANK_SHADOW_ARGUMENT_FEHLT:" + name);
  }
  return teile.join(" ");
}

export function loeseBankSwapShadowBestaetigung(text, token) {
  if (token !== null && token !== undefined) {
    if (String(token) !== BANK_SWAP_REAL_SHADOW_BESTAETIGUNG_TOKEN) {
      throw new Error("BANK_SHADOW_OPERATOR_BESTAETIGUNG_FEHLT");
    }
    return BANK_SWAP_REAL_SHADOW_BESTAETIGUNG;
  }
  return text;
}

function pruefeSha(wert) {
  if (typeof wert !== "string" || !/^[a-f0-9]{40}$/i.test(wert)) {
    throw new Error("BANK_SHADOW_SOURCE_SHA_UNGUELTIG");
  }
  return wert.toLowerCase();
}

function aktuellerGitHead() {
  const out = execFileSync(
    "git",
    ["rev-parse", "HEAD"],
    {
      cwd: REPO_WURZEL,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  ).trim().toLowerCase();
  return pruefeSha(out);
}

function id(prefix) {
  return prefix + "-" + Date.now() + "-"
    + crypto.randomBytes(4).toString("hex");
}

function phase(text) {
  process.stdout.write("[V5-BANK-SWAP-SHADOW] " + text + "\n");
}

async function schreibeBericht(wurzel, bericht) {
  const dir = path.join(
    wurzel,
    "runtime",
    "canary",
    "bank-swap-real-shadow",
  );
  await fs.mkdir(dir, { recursive: true });
  const ziel = path.join(dir, "latest.json");
  const temp = ziel + ".tmp-" + process.pid + "-" + Date.now();
  const text = JSON.stringify(bericht, null, 2) + "\n";
  await fs.writeFile(temp, text, "utf8");
  await fs.rename(temp, ziel);
  return ziel;
}

export async function fuehreBankSwapRealBrowserShadow({
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
      "BANK_SHADOW_SOURCE_SHA_MISMATCH:HEAD=" + head
      + ":ERWARTET=" + erwartetSha,
    );
  }
  if (bestaetigungText !== BANK_SWAP_REAL_SHADOW_BESTAETIGUNG) {
    throw new Error("BANK_SHADOW_OPERATOR_BESTAETIGUNG_FEHLT");
  }

  const evidenceDs = new NodeProduktionsDateisystem(
    hostOptionen.dateisystemOptionen ?? {},
  );
  const bridgeEvidence = await verlangeBankSwapAbendVorstufe(
    evidenceDs,
    BANK_SWAP_ABEND_STUFEN.CODE_BRIDGE,
    erwartetSha,
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
    const performanceTrick=await aktiviereUndVerifiziereBrowserPerformanceTrick(live.session,live.contextId);
    const ausgang = validiereBankSwapAusgangsBeobachtung(
      await beobachteBankSwapRohReadOnly(
        live.session,
        live.contextId,
      ),
    );

    host = await erstelleNodeV5ProduktionsHost(hostOptionen);
    const startMs = Date.now();
    const start = await host.starte(startMs);
    if (start.zustand !== "LAEUFT") {
      throw new Error("BANK_SHADOW_HOST_BLOCKIERT:" + start.grund);
    }
    const bereit = await host.pruefeBankSwapStartBereit();
    if (!bereit.bereit) {
      throw new Error("BANK_SHADOW_START_EVIDENCE_BLOCKIERT");
    }

    const transaktionsId = id("BANK-SHADOW-TX");
    const ablaufId = id("BANK-SHADOW-WF");
    const mountBeobachter = Object.freeze({
      async warteAufMount() {
        return warteAufManuellenBankSwapMountReadOnly(
          live.session,
          live.contextId,
          ausgang,
          {
            timeoutMs: mountTimeoutMs,
            pollMs: 500,
            onPhase: phase,
          },
        );
      },
    });

    let mountBeobachtung = null;
    const releaseBeobachter = Object.freeze({
      async beobachte(token, jetztMs) {
        if (mountBeobachtung === null) {
          throw new Error("BANK_SHADOW_RELEASE_OHNE_MOUNT_EVIDENCE");
        }
        return erstelleBankSwapReleaseBeobachter(
          live.session,
          live.contextId,
          mountBeobachtung,
          {
            timeoutMs: exitTimeoutMs,
            pollMs: 500,
            onPhase: phase,
          },
        ).beobachte(token, jetztMs);
      },
    });

    const instrumentierterMountBeobachter = Object.freeze({
      async warteAufMount(kontext) {
        const beobachtung = await mountBeobachter.warteAufMount(kontext);
        mountBeobachtung = beobachtung;
        return beobachtung;
      },
    });

    const ergebnis = await host.fuehreBankSwapRealShadow({
      aktivierungsId: id("BANK-SHADOW-AUTH"),
      transaktionsId,
      freigabeId: id("BANK-SHADOW-FREE"),
      auftragId: id("BANK-SHADOW-ORDER"),
      ablaufId,
      shadowBestaetigungText: bestaetigungText,
      ausgang,
      mountBeobachter: instrumentierterMountBeobachter,
      releaseBeobachter,
    }, startMs);

    const nachher = await host.pruefeBankSwapStartBereit();
    const leaseStatus = host.bankLeaseStatus();
    const status = host.status();
    if (mountBeobachtung === null
        || mountBeobachtung.kandidat.pack !== bridgeEvidence.candidate.pack
        || mountBeobachtung.kandidat.a !== bridgeEvidence.candidate.a
        || mountBeobachtung.kandidat.b !== bridgeEvidence.candidate.b) {
      throw new Error("BANK_SWAP_SHADOW_KANDIDAT_DRIFT");
    }
    const bestanden = ergebnis.status === "ADMISSION_BESTANDEN_KEIN_SEND"
      && ergebnis.gameplayWrites === 0
      && ergebnis.adapterAufrufe === 0
      && ergebnis.browserGameplayWrites === 0
      && nachher.bereit
      && leaseStatus.every(x => x.zustand === "RELEASED");

    const bericht = Object.freeze({
      schemaVersion: 1,
      stufe: BANK_SWAP_ABEND_STUFEN.SHADOW,
      evidenceArt: BANK_SWAP_REAL_SHADOW_EVIDENCE_ART,
      stand: new Date().toISOString(),
      status: bestanden ? "BESTANDEN" : "NICHT_BESTANDEN",
      sourceSha: erwartetSha,
      actualHeadSha: head,performanceTrick,
      transaktionsId,
      accountBindungSha256: hash(ausgang.accountId),
      charakterBindungSha256: hash(
        ausgang.charakterName + ":" + ausgang.sessionId,
      ),
      server: Object.freeze({
        region: ausgang.serverRegion,
        kennung: ausgang.serverKennung,
      }),
      startAusserhalbBank: true,
      manualMountTransition: ergebnis.manualMountTransition === true,
      manualExitRequired: ergebnis.manualExitRequired === true,
      admissionStatus: ergebnis.status,
      journalTerminalArt: ergebnis.journalTerminalArt,
      sendBoundaryState: ergebnis.sendBoundaryState,
      sameIntentRetry: ergebnis.sameIntentErneutSenden,
      browserGameplayWrites: BANK_SWAP_REAL_SHADOW_GAMEPLAY_WRITES,
      hostGameplayWrites: ergebnis.hostGameplayWrites,
      gameplayWrites: ergebnis.gameplayWrites,
      adapterAufrufe: ergebnis.adapterAufrufe,
      bankStartNachherBereit: nachher.bereit,
      leaseStatus: leaseStatus.map(x => Object.freeze({
        epoche: x.epoche,
        zustand: x.zustand,
      })),
      hostNachher: Object.freeze({
        zustand: status.zustand,
        gameplayAutoritaet: status.gameplayAutoritaet,
        rawWriteAutoritaet: status.rawWriteAutoritaet,
        actionAuthority: status.actionAuthority,
        bankSwapEinmalAuthorityOffen:
          status.bankSwapEinmalAuthorityOffen,
      }),
      candidate: mountBeobachtung.kandidat,
      sameIntentRetry: false,
      safety: Object.freeze({
        gameplayWrites: 0,
        adapterAufrufe: 0,
        bankSwapAufrufe: 0,
        mutatingPublicFunctionCalls: 0,
        rawSocketEmit: false,
      }),
      breiteRuntimeFreigabeDurchDiesenTest: false,
      rawWriteBypass: false,
    });
    const reportPfad = await schreibeBericht(
      host.produktionsWurzel(),
      bericht,
    );
    if (bestanden) {
      await schreibeBankSwapAbendEvidence(
        evidenceDs,
        BANK_SWAP_ABEND_STUFEN.SHADOW,
        bericht,
      );
    }
    return Object.freeze({
      ...bericht,
      reportPfad,
    });
  } finally {
    if (host !== null) {
      await host.stoppe("BANK_SWAP_REAL_SHADOW_ENDE").catch(() => {});
    }
    live.session.close();
  }
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direkt) {
  fuehreBankSwapRealBrowserShadow({
    cdpText: leseBankSwapShadowArgument(
      "--cdp",
      process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
    ),
    sourceSha: leseBankSwapShadowArgument("--source-sha"),
    bestaetigungText: loeseBankSwapShadowBestaetigung(
      leseBankSwapShadowArgument("--confirm", null),
      leseBankSwapShadowArgument("--confirm-token", null),
    ),
  }).then(bericht => {
    process.stdout.write(JSON.stringify(bericht, null, 2) + "\n");
    if (bericht.status !== "BESTANDEN") process.exitCode = 2;
  }).catch(async fehler => {
    process.stderr.write(JSON.stringify({
      status: "BLOCKIERT",
      fehler: String(fehler?.message || fehler),
      sameIntentRetry: false,
      browserGameplayWrites: 0,
      gameplayWrites: 0,
      adapterAufrufe: 0,
      hinweis:
        "Nicht automatisch erneut ausfuehren. Bei offener Bank-Lease zuerst Evidence/Reconciliation pruefen.",
    }, null, 2) + "\n");
    process.exitCode = 1;
  });
}
