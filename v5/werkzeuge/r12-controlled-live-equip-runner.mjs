import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  AblaufScheduler,
  AusfuehrungsKernel,
  CharacterSocketBudget,
  EinmaligesR12ControlledLiveGate,
  ErteilteAusfuehrungsFreigabe,
  MutationsKanalKoordination,
  PersistVorMutationTor,
  RecoveryKernel,
  RessourcenVerwalter,
  bewerteKritischeHealth,
  erstelleMutationsKanalPlan,
  validiereControlledLiveRuhezustand,
  waehleControlledLiveEquipKandidat,
} from "../erzeugt/index.js";
import { findeAdventureLandKontext, validiereLoopbackCdp } from "./r12-live/cdp.mjs";
import { DurablesDateiJournal, pruefeDatenRoot, pruefeKeineOffeneV5Transaktion } from "./r12-live/datei-journal.mjs";
import { CdpEquipAdapter, beobachteControlledLive, beobachtungsFingerprint, itemAmIndex, slotGleich } from "./r12-live/browser-equip.mjs";

const DATEI = fileURLToPath(import.meta.url);
const V5_ROOT = path.resolve(path.dirname(DATEI), "..");
const REPO_ROOT = path.resolve(V5_ROOT, "..");
const ACTION = "AL-ACTION-EQUIP";
const RECOVERY = "AL-RECOVERY-EQUIP";
const VERIFIER = "AL-VERIFIER-EQUIP";
const CAPABILITY = "equipment.equip";
const OWNER = "vertical-slice-controlled-live";
const CONFIRM = "R12-EQUIP-ONCE";
const DEFAULT_CDP = "http://127.0.0.1:9222";
const DEFAULT_DATA_ROOT = "D:\\AdventureLand-V5";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function parseArgs(argv) {
  const args = { confirm: null, cdp: DEFAULT_CDP, dataRoot: DEFAULT_DATA_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--confirm") args.confirm = argv[++index] ?? null;
    else if (token === "--cdp") args.cdp = argv[++index] ?? "";
    else if (token === "--data-root") args.dataRoot = argv[++index] ?? "";
    else throw new Error("UNBEKANNTES_ARGUMENT:" + token);
  }
  return args;
}

function git(...args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", windowsHide: true }).trim();
}

function pruefeRepo() {
  if (git("status", "--porcelain") !== "") throw new Error("R12_REPO_NICHT_CLEAN");
  const sha = git("rev-parse", "HEAD");
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error("R12_GIT_SHA_UNGUELTIG");
  if (git("branch", "--show-current") !== "main") throw new Error("R12_NUR_AUF_MAIN_AUSFUEHREN");
  return { sha };
}

function liesJson(...teile) {
  return JSON.parse(fs.readFileSync(path.join(V5_ROOT, ...teile), "utf8"));
}

function pruefeShadow() {
  const readiness = liesJson("bereitschaft", "laufzeit-bereitschaft.json");
  if (readiness.r12ShadowStatus !== "BESTANDEN") throw new Error("R12_SHADOW_NICHT_BESTANDEN");
  return readiness;
}

function healthAusDirekterEvidence(beobachtung, jetztMs) {
  const evidence = [
    {
      healthId: "adventure-land-character",
      zustand: validiereControlledLiveRuhezustand(beobachtung).length === 0 ? "GESUND" : "KRITISCH",
      beobachtetAmMs: jetztMs,
      gueltigBisMs: jetztMs + 2000,
      evidenceId: "R12-CHARACTER-" + jetztMs,
    },
    {
      healthId: "v5-data-root",
      zustand: "GESUND",
      beobachtetAmMs: jetztMs,
      gueltigBisMs: jetztMs + 2000,
      evidenceId: "R12-STORAGE-" + jetztMs,
    },
    {
      healthId: "v5-r12-journal",
      zustand: "GESUND",
      beobachtetAmMs: jetztMs,
      gueltigBisMs: jetztMs + 2000,
      evidenceId: "R12-JOURNAL-" + jetztMs,
    },
  ];
  return bewerteKritischeHealth(
    [
      { healthId: "adventure-land-character", erforderlich: true },
      { healthId: "v5-data-root", erforderlich: true },
      { healthId: "v5-r12-journal", erforderlich: true },
    ],
    evidence,
    jetztMs,
  );
}

function workflowPlan(jetztMs, gitSha, manifestHash) {
  return {
    schemaVersion: 1,
    ablaufId: "R12-CONTROLLED-LIVE-WF",
    ablaufArt: "R12_CONTROLLED_LIVE_EQUIP",
    eigentuemerModulId: OWNER,
    prioritaetsKlasse: "NORMALE_ARBEIT",
    prioritaetsRang: 1,
    erstelltAmMs: jetztMs,
    deadlineAmMs: jetztMs + 30000,
    ressourcenIds: ["character:equipment", "character:inventory"],
    wissensSnapshot: { gitCommit: gitSha, quellenSha256: [manifestHash] },
    wiederholung: {
      maximaleVersuche: 1,
      maximaleDauerMs: 5000,
      anfangsBackoffMs: 1,
      maximalerBackoffMs: 1,
      backoffFaktor: 1,
      circuitSchluessel: "r12:controlled-live:equip",
    },
    idempotenzSchluessel: "r12:controlled-live:equip:" + jetztMs,
    abgleichStrategie: "LIVE_NEU_BEOBACHTEN",
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.confirm !== CONFIRM) throw new Error("R12_OPERATOR_BESTAETIGUNG_FEHLT:" + CONFIRM);

  const cdp = validiereLoopbackCdp(args.cdp);
  const repo = pruefeRepo();
  const readiness = pruefeShadow();
  const storage = pruefeDatenRoot(args.dataRoot);
  pruefeKeineOffeneV5Transaktion(storage.journalRoot);

  const manifestText = fs.readFileSync(path.join(V5_ROOT, "wissensbasis", "manifest.json"), "utf8");
  const manifestHash = hash(manifestText);
  const configFingerprint = hash(JSON.stringify({
    actionContractId: ACTION,
    publicFunction: "equip",
    maximaleAktionen: 1,
    cdpOrigin: cdp.origin,
    dataRoot: storage.dataRoot,
  }));

  const live = await findeAdventureLandKontext(cdp);
  const session = live.session;
  try {
    const pre = await beobachteControlledLive(session, live.contextId);
    const ruheGruende = validiereControlledLiveRuhezustand(pre);
    if (ruheGruende.length > 0) throw new Error("R12_LIVE_RUHEBEDINGUNGEN:" + ruheGruende.join(","));

    const kandidat = waehleControlledLiveEquipKandidat(pre);
    if (!kandidat) throw new Error("R12_KEIN_SICHERER_EQUIP_KANDIDAT");

    const txId = "R12-EQUIP-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    const workflowId = "R12-CONTROLLED-LIVE-WF";
    const auftragId = "R12-CONTROLLED-LIVE-AUFTRAG";
    const startMs = Date.now();
    const preFingerprint = beobachtungsFingerprint(pre, kandidat);
    const health = healthAusDirekterEvidence(pre, startMs);
    if (!health.mutationErlaubt) throw new Error("R12_HEALTH_NICHT_GESUND");

    const scheduler = new AblaufScheduler();
    scheduler.registriere(workflowPlan(startMs, repo.sha, manifestHash));
    scheduler.setzeStatus(workflowId, "BEREIT", startMs);
    if (scheduler.waehleNaechsten(startMs)?.plan.ablaufId !== workflowId) {
      throw new Error("R12_WORKFLOW_NICHT_AUSGEWAEHLT");
    }

    const ressourcen = new RessourcenVerwalter();
    const socketBudget = new CharacterSocketBudget();
    const tokens = ressourcen.beanspruche(workflowId, [
      { ressourcenId: "character:equipment", art: "EXKLUSIV", leaseDauerMs: null },
      { ressourcenId: "character:inventory", art: "EXKLUSIV", leaseDauerMs: null },
    ], startMs);
    const kanal = new MutationsKanalKoordination(ressourcen, socketBudget).reserviere(
      txId + ":budget",
      workflowId,
      erstelleMutationsKanalPlan(pre.charakterName, "equip", 3),
      startMs,
    );

    const journal = new DurablesDateiJournal(storage.journalRoot);
    const intentEintrag = {
      schemaVersion: 1,
      journalId: txId + ":1",
      transaktionsId: txId,
      sequenz: 1,
      art: "INTENT",
      zeitMs: startMs,
      inhalt: {
        auftrag_id: auftragId,
        ablauf_id: workflowId,
        faehigkeit_id: CAPABILITY,
        owner_id: OWNER,
        action_contract_id: ACTION,
        recovery_contract_id: RECOVERY,
        verifier_id: VERIFIER,
        attempt_id: txId + ":attempt:1",
        knowledge_snapshot_id: repo.sha + ":" + manifestHash,
        pinned_prestate_fingerprint: preFingerprint,
        resource_claims_and_fencing: tokens.map(x => ({ ressourcenId: x.ressourcenId, epoche: x.epoche })),
        send_boundary_state: "NICHT_GESENDET",
      },
    };
    const intentToken = await new PersistVorMutationTor(journal).persistiereIntent(intentEintrag);

    const gate = new EinmaligesR12ControlledLiveGate({
      roadmapPhase: "R12",
      gesamtRuntimeStatus: readiness.status,
      actionContractId: ACTION,
      publicFunction: "equip",
      shadowVollstaendig: readiness.r12ShadowStatus === "BESTANDEN",
      shadowUnerwarteteWrites: 0,
      operatorFreigabe: true,
      maximaleAktionen: 1,
      healthStatus: health.zustand,
      persistenzGesund: true,
      reconciliationClean: true,
      alternativeRuntimeAktiv: pre.alternativeRuntimeAktiv,
    }, 1, "R12-CONTROLLED-LIVE:" + txId);

    const binding = liesJson("grundlage", "vertraege", "r9", "action-bindungen.json")
      .bindungen.find(x => x.actionContractId === ACTION);
    if (!binding || binding.status !== "R9_ADMISSION_GEBUNDEN") throw new Error("R12_ACTION_BINDUNG_FEHLT");

    const reobserveForAdmission = async (ids, ausgestelltAmMs) => {
      const current = await beobachteControlledLive(session, live.contextId);
      const gruende = validiereControlledLiveRuhezustand(current);
      if (gruende.length > 0) throw new Error("R12_LIVE_PRECONDITION:" + gruende.join(","));
      const item = itemAmIndex(current, kandidat.index);
      const slot = current.slots[kandidat.slot] ?? null;
      if (!item
          || item.name !== kandidat.itemName
          || item.level !== kandidat.itemLevel
          || !slotGleich(slot, kandidat.vorherigesSlotItem)) {
        throw new Error("R12_LIVE_PRECONDITION_DRIFT");
      }
      const fp = beobachtungsFingerprint(current, kandidat);
      return ids.map(id => ({
        voraussetzungId: id,
        fingerprint: fp + ":" + id,
        beobachtetAmMs: ausgestelltAmMs,
        gueltigBisMs: ausgestelltAmMs + 1500,
      }));
    };

    const admissionAt = Date.now();
    const freigabe = await ErteilteAusfuehrungsFreigabe.erteile({
      schemaVersion: 1,
      freigabeId: txId + ":freigabe",
      auftragId,
      ablaufId: workflowId,
      transaktionsId: txId,
      faehigkeitId: CAPABILITY,
      eigentuemerModulId: OWNER,
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      verifierId: VERIFIER,
      invariantenKennungen: binding.invariantenKennungen,
      voraussetzungsIds: ["inventory_item_identity", "equipment_slots"],
      ausgestelltAmMs: admissionAt,
      gueltigBisMs: admissionAt + 1500,
      fencingTokens: tokens,
      mutationsKanal: kanal,
      intentToken,
      intentEintrag,
    }, {
      faehigkeitsAutoritaet: {
        pruefe(faehigkeitId, owner) {
          return { erlaubt: faehigkeitId === CAPABILITY && owner === OWNER, mutierend: true, generation: 1 };
        },
      },
      operatorRichtlinie: {
        pruefe(faehigkeitId) {
          return { erlaubt: faehigkeitId === CAPABILITY, generation: 1 };
        },
      },
      laufzeitGate: gate,
      aktionsVertraege: {
        pruefe(actionContractId, recoveryContractId, verifierId) {
          return {
            actionContractId,
            recoveryContractId,
            verifierId,
            produktivErlaubt: actionContractId === ACTION && recoveryContractId === RECOVERY && verifierId === VERIFIER,
            invariantenKennungen: binding.invariantenKennungen,
          };
        },
      },
      liveVoraussetzungen: { pruefe: reobserveForAdmission },
      ressourcen,
      socketBudget,
    });

    const adapter = new CdpEquipAdapter(session, live.contextId, kandidat);
    const transport = await new AusfuehrungsKernel().fuehreAus(
      freigabe,
      { index: kandidat.index, slot: kandidat.slot, itemName: kandidat.itemName },
      adapter,
      Date.now(),
    );

    const snapshot = {
      schemaVersion: 1,
      wissensSnapshot: { gitCommit: repo.sha, quellenSha256: [manifestHash] },
      configFingerprint,
      prestateFingerprint: preFingerprint,
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      verifierId: VERIFIER,
    };

    const recovery = new RecoveryKernel({
      pruefe(actionContractId, recoveryContractId) {
        return {
          actionContractId,
          recoveryContractId,
          produktivErlaubt: true,
          sameIntentAfterPossibleSend: "NEVER",
          maximaleBeobachtungen: 4,
          fehlerDomaeneId: "character:equipment",
        };
      },
    }, {
      async beobachte() {
        await sleep(300);
        const current = await beobachteControlledLive(session, live.contextId);
        const slot = current.slots[kandidat.slot] ?? null;
        const item = itemAmIndex(current, kandidat.index);
        const slotCommitted = slot?.name === kandidat.itemName && slot?.level === kandidat.itemLevel;
        const inventoryCommitted = kandidat.vorherigesSlotItem === null
          ? item === null
          : item?.name === kandidat.vorherigesSlotItem.name && item?.level === kandidat.vorherigesSlotItem.level;
        const slotPre = slotGleich(slot, kandidat.vorherigesSlotItem);
        const itemPre = item?.name === kandidat.itemName && item?.level === kandidat.itemLevel;
        const klassifikation = slotCommitted && inventoryCommitted
          ? "BESTAETIGT"
          : slotPre && itemPre
            ? "NICHT_AUSGEFUEHRT"
            : slotCommitted || !slotPre || !itemPre
              ? "TEILWEISE"
              : "UNGEKLAERT";
        return {
          schemaVersion: 1,
          klassifikation,
          beobachtetAmMs: Date.now(),
          snapshot,
          differenz: {
            schemaVersion: 1,
            erwarteteDomaenen: ["inventory", "equipment"],
            angewendeteDomaenen: slotCommitted && inventoryCommitted ? ["inventory", "equipment"] : slotCommitted ? ["equipment"] : [],
            offeneDomaenen: slotCommitted && inventoryCommitted ? [] : slotCommitted ? ["inventory"] : ["inventory", "equipment"],
            widerspruechlicheDomaenen: klassifikation === "UNGEKLAERT" ? ["equipment"] : [],
          },
          evidenceFingerprints: [hash(JSON.stringify({ slot, item, kandidat }))],
        };
      },
    });

    const abschluss = await recovery.gleicheAb({
      schemaVersion: 1,
      transaktionsId: txId,
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      transportErgebnis: transport,
      snapshot,
    });

    if (abschluss.art !== "COMMITTED") {
      if (abschluss.art === "ABORTED" && adapter.gameWrites === 0 && adapter.moeglicherSend === false) {
        await journal.haengeDurableAn({
          schemaVersion: 1,
          journalId: txId + ":2",
          transaktionsId: txId,
          sequenz: 2,
          art: "ABBRUCH",
          zeitMs: Date.now(),
          inhalt: { grund: "NICHT_GESENDET", same_intent_retry: false },
        });
      }
      console.error(JSON.stringify({
        status: "NICHT_BESTANDEN",
        transaktionsId: txId,
        transport,
        recovery: abschluss,
        adapterAufrufe: adapter.adapterAufrufe,
        gameWrites: adapter.gameWrites,
        moeglicherSend: adapter.moeglicherSend,
        sameIntentRetry: false,
      }, null, 2));
      process.exitCode = 2;
      return;
    }

    if (adapter.gameWrites !== 1) throw new Error("R12_COMMIT_OHNE_EXAKT_EINEN_GAME_WRITE");
    const post = await beobachteControlledLive(session, live.contextId);
    const postFingerprint = beobachtungsFingerprint(post, kandidat);
    await journal.haengeDurableAn({
      schemaVersion: 1,
      journalId: txId + ":2",
      transaktionsId: txId,
      sequenz: 2,
      art: "COMMIT",
      zeitMs: Date.now(),
      inhalt: {
        action_contract_id: ACTION,
        recovery_contract_id: RECOVERY,
        verifier_id: VERIFIER,
        postcondition_evidence: postFingerprint,
      },
    });

    const evidence = {
      schemaVersion: 1,
      stand: new Date().toISOString(),
      phase: "R12",
      status: "BESTANDEN",
      controlledLiveTestGate: "BESTANDEN",
      gesamtRuntimeGate: readiness.status,
      breiteRuntimeFreigabe: false,
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      verifierId: VERIFIER,
      publicFunction: "equip",
      gameWrites: adapter.gameWrites,
      unerwarteteGameWrites: 0,
      maximaleAktionen: 1,
      character: pre.charakterName,
      item: {
        name: kandidat.itemName,
        level: kandidat.itemLevel,
        inventoryIndexVorher: kandidat.index,
        slot: kandidat.slot,
        slotWarLeer: kandidat.slotWarLeer,
      },
      transaktionsId: txId,
      gitSha: repo.sha,
      knowledgeManifestSha256: manifestHash,
      configFingerprint,
      prestateFingerprint: preFingerprint,
      poststateFingerprint: postFingerprint,
      targetUrlOrigin: new URL(live.targetUrl).origin,
      dataRootVolume: path.parse(storage.dataRoot).root,
      dataRootFreieReserveProzent: Number(storage.freiProzent.toFixed(2)),
      sameIntentRetry: false,
      operatorBestaetigung: CONFIRM,
    };

    const localEvidence = path.join(storage.dataRoot, "r12", "controlled-live-evidence.json");
    fs.mkdirSync(path.dirname(localEvidence), { recursive: true });
    fs.writeFileSync(localEvidence, JSON.stringify(evidence, null, 2) + "\n", "utf8");
    const repoEvidence = path.join(V5_ROOT, "roadmap", "r12-controlled-live-evidence.json");
    fs.writeFileSync(repoEvidence, JSON.stringify(evidence, null, 2) + "\n", "utf8");

    console.log(JSON.stringify({
      status: "BESTANDEN",
      evidence,
      repoEvidence,
      localEvidence,
      naechsterSchritt: "Keine weitere Gameplay-Action ausfuehren. Evidence-Datei fuer Abschluss pruefen.",
    }, null, 2));
  } finally {
    session.close();
  }
}

run().catch(error => {
  console.error(JSON.stringify({
    status: "BLOCKIERT",
    fehler: String(error?.message || error),
    sameIntentRetry: false,
  }, null, 2));
  process.exitCode = 1;
});
