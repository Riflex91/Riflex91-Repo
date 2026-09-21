import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG,
} from "../erzeugt/index.js";
import {
  NodeProduktionsDateisystem,
} from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  ProduktionsCdpEquipAdapter,
  beobachteProduktionsEquip,
  erstelleProduktiveEquipLiveVoraussetzungen,
  erstelleProduktivenEquipRecoveryBeobachter,
  produktionsEquipFingerprint,
  validiereProduktionsEquipRuhezustand,
  waehleProduktionsEquipKandidat,
} from "./equipment-equip-produktions-browser.mjs";
import {
  erstelleNodeV5ProduktionsHost,
} from "./v5-produktions-host-komposition.mjs";

const V5_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ACTION = "AL-ACTION-EQUIP";
const RECOVERY = "AL-RECOVERY-EQUIP";
const VERIFIER = "AL-VERIFIER-EQUIP";
const CAPABILITY = "equipment.equip";
const OWNER = "equipment-core";
const REPORT_PATH = "runtime/canary/equipment-equip-production/latest.json";

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
      throw new Error("EQUIP_PROD_CLI_ARGUMENT_UNBEKANNT:" + arg);
    }
  }
  return out;
}

async function sourceHashes() {
  const paths = [
    "grundlage/vertraege/runtime/equipment-equip-mutationsfaehigkeit.json",
    "grundlage/vertraege/runtime/equipment-equip-one-shot-authority.json",
    "grundlage/vertraege/r9/action-bindungen.json",
    "werkzeuge/equipment-equip-produktions-browser.mjs",
  ];
  const hashes = [];
  for (const rel of paths) {
    hashes.push(hash(await fs.readFile(path.join(V5_ROOT, rel), "utf8")));
  }
  return Object.freeze(hashes.sort());
}

function validateSourceSha(sourceSha) {
  if (typeof sourceSha !== "string" || !/^[0-9a-f]{40}$/i.test(sourceSha)) {
    throw new Error("EQUIP_PROD_SOURCE_SHA_ERFORDERLICH");
  }
}

function makeIds() {
  const suffix = Date.now() + "-" + crypto.randomBytes(4).toString("hex");
  return Object.freeze({
    tx: "EQUIP-PROD-TX-" + suffix,
    auth: "EQUIP-PROD-AUTH-" + suffix,
    free: "EQUIP-PROD-FREE-" + suffix,
    order: "EQUIP-PROD-ORDER-" + suffix,
    flow: "EQUIP-PROD-FLOW-" + suffix,
  });
}

async function writeReport(report) {
  const ds = new NodeProduktionsDateisystem();
  await ds.schreibeAtomarDurable(
    REPORT_PATH,
    JSON.stringify(report, null, 2) + "\n",
    "equip-production-report-" + Date.now(),
  );
}

function publicPreflight(observation, candidate, hostStatus) {
  return Object.freeze({
    schemaVersion: 1,
    status: candidate ? "BEREIT" : "BLOCKIERT",
    charakterBindungSha256: hash(observation.charakterName),
    ctype: observation.ctype,
    candidate: candidate
      ? {
          inventoryIndex: candidate.index,
          itemName: candidate.itemName,
          itemLevel: candidate.itemLevel,
          slot: candidate.slot,
          zielslotWarLeer: true,
        }
      : null,
    host: {
      zustand: hostStatus.zustand,
      grund: hostStatus.grund,
      aktivePlanenFaehigkeiten: hostStatus.aktivePlanenFaehigkeiten,
      equipEinmalAuthorityOffen: hostStatus.equipEinmalAuthorityOffen,
      gameplayAutoritaet: hostStatus.gameplayAutoritaet,
      rawWriteAutoritaet: hostStatus.rawWriteAutoritaet,
      actionAuthority: hostStatus.actionAuthority,
    },
    browserGameplayWrites: 0,
    naechsterSchritt: candidate
      ? "LIVE_EINMAL_TEST_MIT_EXAKTER_BESTAETIGUNG"
      : "LEEREN_SICHEREN_SLOT_UND_PASSENDES_UNLOCKED_ITEM_BEREITSTELLEN",
  });
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const cdp = validiereLoopbackCdp(args.cdp);
  const live = await findeAdventureLandKontext(cdp);
  let host = null;

  try {
    const observation = await beobachteProduktionsEquip(
      live.session,
      live.contextId,
    );
    const blockers = validiereProduktionsEquipRuhezustand(observation);
    if (blockers.length > 0) {
      throw new Error("EQUIP_PROD_LIVE_BLOCKIERT:" + blockers.join(","));
    }
    const candidate = waehleProduktionsEquipKandidat(observation);

    host = await erstelleNodeV5ProduktionsHost();
    const hostStart = await host.starte(Date.now());
    if (hostStart.zustand !== "LAEUFT") {
      throw new Error(
        "EQUIP_PROD_HOST_START_BLOCKIERT:" + hostStart.grund,
      );
    }

    if (args.preflight) {
      const report = publicPreflight(observation, candidate, host.status());
      console.log(JSON.stringify(report, null, 2));
      if (!candidate) process.exitCode = 2;
      return;
    }

    if (!candidate) {
      throw new Error("EQUIP_PROD_KEIN_LEERER_SAFE_SLOT_KANDIDAT");
    }
    if (args.confirm !== EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG) {
      throw new Error(
        "EQUIP_PROD_OPERATOR_BESTAETIGUNG_FEHLT:"
        + EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG,
      );
    }
    validateSourceSha(args.sourceSha);

    const ids = makeIds();
    const prestateFingerprint = produktionsEquipFingerprint(
      observation,
      candidate,
    );
    const quellenSha256 = await sourceHashes();
    const configFingerprint = hash(JSON.stringify({
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      verifierId: VERIFIER,
      capabilityId: CAPABILITY,
      owner: OWNER,
      characterBinding: hash(observation.charakterName),
      candidate,
      sourceSha: args.sourceSha.toLowerCase(),
      quellenSha256,
      maxWrites: 1,
      targetOrigin: new URL(live.targetUrl).origin,
    }));

    const adapter = new ProduktionsCdpEquipAdapter(
      live.session,
      live.contextId,
      candidate,
    );
    const result = await host.fuehreEquipEinmalTransaktion({
      aktivierungsId: ids.auth,
      transaktionsId: ids.tx,
      freigabeId: ids.free,
      auftragId: ids.order,
      ablaufId: ids.flow,
      characterId: observation.charakterName,
      bestaetigungText: EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG,
      kandidat: candidate,
      wissensSnapshot: {
        gitCommit: args.sourceSha.toLowerCase(),
        quellenSha256,
      },
      configFingerprint,
      prestateFingerprint,
      liveVoraussetzungen: erstelleProduktiveEquipLiveVoraussetzungen(
        live.session,
        live.contextId,
        candidate,
      ),
      adapter,
      recoveryBeobachter: erstelleProduktivenEquipRecoveryBeobachter(
        live.session,
        live.contextId,
        candidate,
      ),
    }, Date.now());

    const report = Object.freeze({
      schemaVersion: 1,
      evidenceArt: "V5_PRODUCTION_EQUIP_ONE_SHOT_LIVE",
      stand: new Date().toISOString(),
      status: result.status === "COMMITTED" && adapter.gameWrites === 1
        ? "BESTANDEN"
        : "NICHT_BESTANDEN",
      transaktionsId: ids.tx,
      sourceSha: args.sourceSha.toLowerCase(),
      charakterBindungSha256: hash(observation.charakterName),
      capabilityId: CAPABILITY,
      provider: OWNER + "@1",
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      verifierId: VERIFIER,
      candidate: {
        inventoryIndexVorher: candidate.index,
        itemName: candidate.itemName,
        itemLevel: candidate.itemLevel,
        slot: candidate.slot,
        zielslotWarLeer: true,
      },
      prestateFingerprint,
      configFingerprint,
      result,
      adapterAufrufe: adapter.adapterAufrufe,
      gameWrites: adapter.gameWrites,
      moeglicherSend: adapter.moeglicherSend,
      sameIntentRetry: false,
      hostNachher: host.status(),
      breiteRuntimeFreigabeDurchDiesenTest: false,
      rawWriteBypass: false,
      reportPfad: "D:\\AdventureLand-V5\\" + REPORT_PATH.replaceAll("/", "\\"),
    });

    await writeReport(report);
    console.log(JSON.stringify(report, null, 2));

    if (report.status !== "BESTANDEN") {
      process.exitCode = 2;
    }
  } finally {
    if (host !== null) {
      try {
        await host.stoppe("EQUIP_PROD_LIVE_ENDE");
      } catch {
        // Bestehende durable Transaction-Evidence bleibt massgeblich.
      }
    }
    live.session.close();
  }
}

run().catch(error => {
  console.error(JSON.stringify({
    status: "BLOCKIERT",
    fehler: String(error?.message || error),
    sameIntentRetry: false,
    hinweis: "Nicht automatisch erneut ausfuehren. Bei offener Transaktion zuerst Evidence pruefen.",
  }, null, 2));
  process.exitCode = 1;
});
