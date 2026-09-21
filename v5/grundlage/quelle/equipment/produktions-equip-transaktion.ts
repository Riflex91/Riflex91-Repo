import {
  ErteilteAusfuehrungsFreigabe,
} from "../ausfuehrung/admission.js";
import type {
  AusfuehrungsAdapter,
  LiveVoraussetzungsPrueferPort,
  OperatorRichtlinienPort,
  LaufzeitGatePort,
} from "../ausfuehrung/ports.js";
import { AusfuehrungsKernel } from "../ausfuehrung/ausfuehrungs-kernel.js";
import {
  PersistVorMutationTor,
} from "../persistenz/journal.js";
import type {
  TransaktionsJournalEintrag,
  TransaktionsJournalPort,
} from "../persistenz/ports.js";
import {
  RecoveryKernel,
} from "../recovery/recovery-kernel.js";
import type {
  AbgleichBeobachterPort,
  RecoveryAbschluss,
} from "../recovery/typen.js";
import {
  RessourcenVerwalter,
  type FencingToken,
} from "../scheduler/ressourcen-verwalter.js";
import {
  CharacterSocketBudget,
  MutationsKanalKoordination,
  erstelleMutationsKanalPlan,
  type MutationsKanalFreigabe,
} from "../scheduler/socket-budget.js";
import {
  EQUIPMENT_CORE_MODUL_ID,
  EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
} from "./modul-vertrag.js";
import {
  EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
  EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
  EQUIPMENT_EQUIP_VERIFIER_ID,
  type ProduktiveEquipEinmalAuthority,
} from "./produktions-einmal-authority.js";

export const PRODUKTIVE_EQUIP_INVARIANTEN = Object.freeze([
  "V5-ALT-002",
  "V5-ALT-003",
  "V5-INV-002",
  "V5-INV-004",
  "V5-INV-005",
  "V5-ALT-024",
] as const);

export const PRODUKTIVE_EQUIP_LIVE_VORAUSSETZUNGEN = Object.freeze([
  "inventory_item_identity",
  "equipment_slot_empty",
  "character_idle",
  "alternative_runtime_inactive",
] as const);

export interface ProduktiveEquipKandidat {
  readonly index: number;
  readonly itemName: string;
  readonly itemLevel: number;
  readonly slot: string;
  readonly vorherigesSlotItem: null;
}

export interface ProduktiveEquipAdapterAnfrage {
  readonly index: number;
  readonly slot: string;
  readonly itemName: string;
  readonly itemLevel: number;
}

export interface ProduktiveEquipTransaktionsAnforderung {
  readonly schemaVersion: 1;
  readonly freigabeId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly transaktionsId: string;
  readonly characterId: string;
  readonly kandidat: ProduktiveEquipKandidat;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly authority: ProduktiveEquipEinmalAuthority;
  readonly wissensSnapshot: Readonly<{
    gitCommit: string;
    quellenSha256: readonly string[];
  }>;
  readonly configFingerprint: string;
  readonly prestateFingerprint: string;
}

export interface ProduktiveEquipTransaktionsAbhaengigkeiten<Ergebnis> {
  readonly operatorRichtlinie: OperatorRichtlinienPort;
  readonly laufzeitGate: LaufzeitGatePort;
  readonly liveVoraussetzungen: LiveVoraussetzungsPrueferPort;
  readonly journal: TransaktionsJournalPort;
  readonly ressourcen: RessourcenVerwalter;
  readonly socketBudget: CharacterSocketBudget;
  readonly mutationsKanaele: MutationsKanalKoordination;
  readonly ausfuehrung: AusfuehrungsKernel;
  readonly adapter: AusfuehrungsAdapter<
    ProduktiveEquipAdapterAnfrage,
    Ergebnis,
    ErteilteAusfuehrungsFreigabe
  >;
  readonly recoveryBeobachter: AbgleichBeobachterPort;
  readonly jetztMs: () => number;
}

export interface ProduktiveEquipTransaktionsErgebnis {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly status:
    | "COMMITTED"
    | "ABORTED"
    | "REPLAN_REQUIRED"
    | "FAILED_SAFE"
    | "OPERATOR_REQUIRED";
  readonly transportArt: "SERVER_ERGEBNIS" | "UNBEKANNT" | "NICHT_GESENDET";
  readonly recovery: RecoveryAbschluss;
  readonly journalTerminalArt: "COMMIT" | "ABBRUCH" | "SICHER_FEHLGESCHLAGEN";
  readonly sameIntentErneutSenden: false;
  readonly adapterAufrufeErwartetMaximal: 1;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function zeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereAnforderung(a: ProduktiveEquipTransaktionsAnforderung): void {
  if (a.schemaVersion !== 1) throw new Error("EQUIP_PROD_TX_SCHEMA_UNGUELTIG");
  for (const [wert, fehler] of [
    [a.freigabeId, "EQUIP_PROD_TX_FREIGABE_ID_UNGUELTIG"],
    [a.auftragId, "EQUIP_PROD_TX_AUFTRAG_ID_UNGUELTIG"],
    [a.ablaufId, "EQUIP_PROD_TX_ABLAUF_ID_UNGUELTIG"],
    [a.transaktionsId, "EQUIP_PROD_TX_ID_UNGUELTIG"],
    [a.characterId, "EQUIP_PROD_TX_CHARACTER_ID_UNGUELTIG"],
    [a.configFingerprint, "EQUIP_PROD_TX_CONFIG_FINGERPRINT_UNGUELTIG"],
    [a.prestateFingerprint, "EQUIP_PROD_TX_PRESTATE_FINGERPRINT_UNGUELTIG"],
  ] as const) text(wert, fehler);
  zeit(a.ausgestelltAmMs, "EQUIP_PROD_TX_ZEIT_UNGUELTIG");
  zeit(a.gueltigBisMs, "EQUIP_PROD_TX_ABLAUFZEIT_UNGUELTIG");
  if (a.gueltigBisMs < a.ausgestelltAmMs
      || a.gueltigBisMs - a.ausgestelltAmMs > 1_500) {
    throw new Error("EQUIP_PROD_TX_GUELTIGKEIT_UNGUELTIG");
  }
  if (!Number.isInteger(a.kandidat.index)
      || a.kandidat.index < 0
      || a.kandidat.index >= 128
      || a.kandidat.itemName.trim().length === 0
      || a.kandidat.itemName.length > 128
      || !Number.isSafeInteger(a.kandidat.itemLevel)
      || a.kandidat.itemLevel < 0
      || a.kandidat.itemLevel > 1_000
      || a.kandidat.slot.trim().length === 0
      || a.kandidat.slot.length > 64
      || a.kandidat.vorherigesSlotItem !== null) {
    throw new Error("EQUIP_PROD_TX_KANDIDAT_UNGUELTIG");
  }
  if (!/^[0-9a-f]{40}$/i.test(a.wissensSnapshot.gitCommit)
      || a.wissensSnapshot.quellenSha256.length < 1
      || a.wissensSnapshot.quellenSha256.length > 64
      || a.wissensSnapshot.quellenSha256.some(
        x => !/^[0-9a-f]{64}$/i.test(x),
      )) {
    throw new Error("EQUIP_PROD_TX_WISSENSSNAPSHOT_UNGUELTIG");
  }

  const authority = a.authority.daten();
  if (authority.transaktionsId !== a.transaktionsId
      || authority.faehigkeitId !== EQUIPMENT_EQUIP_FAEHIGKEIT_ID
      || authority.anbieterModulId !== EQUIPMENT_CORE_MODUL_ID
      || authority.actionContractId !== EQUIPMENT_EQUIP_ACTION_CONTRACT_ID
      || authority.recoveryContractId !== EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID
      || authority.verifierId !== EQUIPMENT_EQUIP_VERIFIER_ID
      || a.gueltigBisMs > authority.gueltigBisMs
      || !a.authority.gueltigFuer(a.ausgestelltAmMs)) {
    throw new Error("EQUIP_PROD_TX_AUTHORITY_BINDUNG_UNGUELTIG");
  }
}

function actionVertrag() {
  return Object.freeze({
    pruefe(
      actionContractId: string,
      recoveryContractId: string,
      verifierId: string,
    ) {
      const exakt = actionContractId === EQUIPMENT_EQUIP_ACTION_CONTRACT_ID
        && recoveryContractId === EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID
        && verifierId === EQUIPMENT_EQUIP_VERIFIER_ID;
      return Object.freeze({
        actionContractId,
        recoveryContractId,
        verifierId,
        produktivErlaubt: exakt,
        invariantenKennungen: PRODUKTIVE_EQUIP_INVARIANTEN,
      });
    },
  });
}

function recoveryVertrag() {
  return Object.freeze({
    pruefe(actionContractId: string, recoveryContractId: string) {
      return Object.freeze({
        actionContractId,
        recoveryContractId,
        produktivErlaubt:
          actionContractId === EQUIPMENT_EQUIP_ACTION_CONTRACT_ID
          && recoveryContractId === EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
        sameIntentAfterPossibleSend: "NEVER" as const,
        maximaleBeobachtungen: 4,
        fehlerDomaeneId: "character:equipment",
      });
    },
  });
}

function terminalFuer(recovery: RecoveryAbschluss):
"COMMIT" | "ABBRUCH" | "SICHER_FEHLGESCHLAGEN" {
  if (recovery.art === "COMMITTED") return "COMMIT";
  if (recovery.art === "ABORTED") return "ABBRUCH";
  return "SICHER_FEHLGESCHLAGEN";
}

function statusFuer(recovery: RecoveryAbschluss):
ProduktiveEquipTransaktionsErgebnis["status"] {
  switch (recovery.art) {
    case "COMMITTED": return "COMMITTED";
    case "ABORTED": return "ABORTED";
    case "REPLAN_ALLOWED": return "REPLAN_REQUIRED";
    case "OPERATOR_REQUIRED": return "OPERATOR_REQUIRED";
    default: return "FAILED_SAFE";
  }
}

function journalEintrag(
  a: ProduktiveEquipTransaktionsAnforderung,
  sequenz: number,
  art: TransaktionsJournalEintrag["art"],
  jetztMs: number,
  inhalt: Readonly<Record<string, unknown>>,
): TransaktionsJournalEintrag {
  return Object.freeze({
    schemaVersion: 1,
    journalId: a.transaktionsId + ":" + sequenz,
    transaktionsId: a.transaktionsId,
    sequenz,
    art,
    zeitMs: jetztMs,
    inhalt: Object.freeze({ ...inhalt }),
  });
}

export class ProduktiveEquipTransaktionsOrchestrierung {
  public async fuehreEinmalAus<Ergebnis>(
    a: ProduktiveEquipTransaktionsAnforderung,
    d: ProduktiveEquipTransaktionsAbhaengigkeiten<Ergebnis>,
  ): Promise<ProduktiveEquipTransaktionsErgebnis> {
    validiereAnforderung(a);
    if (d.adapter.actionContractId !== EQUIPMENT_EQUIP_ACTION_CONTRACT_ID
        || d.adapter.recoveryContractId !== EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID
        || d.adapter.verifierId !== EQUIPMENT_EQUIP_VERIFIER_ID) {
      throw new Error("EQUIP_PROD_TX_ADAPTER_BINDUNG_UNGUELTIG");
    }

    let tokens: readonly FencingToken[] = Object.freeze([]);
    let kanal: MutationsKanalFreigabe | null = null;
    let sequenz = 1;

    try {
      tokens = d.ressourcen.beanspruche(a.ablaufId, [
        {
          ressourcenId: "character:" + a.characterId + ":equipment",
          art: "EXKLUSIV",
          leaseDauerMs: null,
        },
        {
          ressourcenId: "character:" + a.characterId + ":inventory",
          art: "EXKLUSIV",
          leaseDauerMs: null,
        },
      ], a.ausgestelltAmMs);

      kanal = d.mutationsKanaele.reserviere(
        a.transaktionsId + ":budget",
        a.ablaufId,
        erstelleMutationsKanalPlan(a.characterId, "equip", 3),
        a.ausgestelltAmMs,
      );

      const intentEintrag = journalEintrag(
        a,
        sequenz,
        "INTENT",
        a.ausgestelltAmMs,
        {
          auftrag_id: a.auftragId,
          ablauf_id: a.ablaufId,
          faehigkeit_id: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
          owner_id: EQUIPMENT_CORE_MODUL_ID,
          action_contract_id: EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
          recovery_contract_id: EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
          verifier_id: EQUIPMENT_EQUIP_VERIFIER_ID,
          attempt_id: a.transaktionsId + ":attempt:1",
          knowledge_snapshot_id:
            a.wissensSnapshot.gitCommit + ":" + a.wissensSnapshot.quellenSha256[0],
          pinned_prestate_fingerprint: a.prestateFingerprint,
          resource_claims_and_fencing: [
            ...tokens,
            kanal.kanalToken,
          ].map(x => ({
            ressourcenId: x.ressourcenId,
            epoche: x.epoche,
          })),
          send_boundary_state: "NICHT_GESENDET",
          same_intent_retry: false,
          kandidat: {
            index: a.kandidat.index,
            itemName: a.kandidat.itemName,
            itemLevel: a.kandidat.itemLevel,
            slot: a.kandidat.slot,
            vorherigesSlotItem: null,
          },
        },
      );
      const intentToken = await new PersistVorMutationTor(
        d.journal,
      ).persistiereIntent(intentEintrag);
      sequenz += 1;

      const freigabe = await ErteilteAusfuehrungsFreigabe.erteile({
        schemaVersion: 1,
        freigabeId: a.freigabeId,
        auftragId: a.auftragId,
        ablaufId: a.ablaufId,
        transaktionsId: a.transaktionsId,
        faehigkeitId: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
        eigentuemerModulId: EQUIPMENT_CORE_MODUL_ID,
        actionContractId: EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
        recoveryContractId: EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
        verifierId: EQUIPMENT_EQUIP_VERIFIER_ID,
        invariantenKennungen: PRODUKTIVE_EQUIP_INVARIANTEN,
        voraussetzungsIds: PRODUKTIVE_EQUIP_LIVE_VORAUSSETZUNGEN,
        ausgestelltAmMs: a.ausgestelltAmMs,
        gueltigBisMs: a.gueltigBisMs,
        fencingTokens: tokens,
        mutationsKanal: kanal,
        intentToken,
        intentEintrag,
      }, {
        faehigkeitsAutoritaet: a.authority,
        operatorRichtlinie: d.operatorRichtlinie,
        laufzeitGate: d.laufzeitGate,
        aktionsVertraege: actionVertrag(),
        liveVoraussetzungen: d.liveVoraussetzungen,
        ressourcen: d.ressourcen,
        socketBudget: d.socketBudget,
      });

      const transport = await d.ausfuehrung.fuehreAus(
        freigabe,
        Object.freeze({
          index: a.kandidat.index,
          slot: a.kandidat.slot,
          itemName: a.kandidat.itemName,
          itemLevel: a.kandidat.itemLevel,
        }),
        d.adapter,
        d.jetztMs(),
      );

      if (transport.art === "SERVER_ERGEBNIS") {
        await d.journal.haengeDurableAn(journalEintrag(
          a,
          sequenz++,
          "SERVER_ERGEBNIS",
          d.jetztMs(),
          {
            korrelation_id: transport.korrelationId,
            same_intent_retry: false,
          },
        ));
      } else if (transport.art === "UNBEKANNT") {
        await d.journal.haengeDurableAn(journalEintrag(
          a,
          sequenz++,
          "UNBEKANNT",
          d.jetztMs(),
          {
            grund: transport.grund,
            korrelation_id: transport.korrelationId,
            same_intent_retry: false,
          },
        ));
      }

      const snapshot = Object.freeze({
        schemaVersion: 1 as const,
        wissensSnapshot: Object.freeze({
          gitCommit: a.wissensSnapshot.gitCommit,
          quellenSha256: Object.freeze([...a.wissensSnapshot.quellenSha256]),
        }),
        configFingerprint: a.configFingerprint,
        prestateFingerprint: a.prestateFingerprint,
        actionContractId: EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
        recoveryContractId: EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
        verifierId: EQUIPMENT_EQUIP_VERIFIER_ID,
      });

      const recovery = await new RecoveryKernel(
        recoveryVertrag(),
        d.recoveryBeobachter,
      ).gleicheAb({
        schemaVersion: 1,
        transaktionsId: a.transaktionsId,
        actionContractId: EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
        recoveryContractId: EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
        transportErgebnis: transport,
        snapshot,
      });

      if (transport.art !== "NICHT_GESENDET") {
        await d.journal.haengeDurableAn(journalEintrag(
          a,
          sequenz++,
          "POSTCONDITION",
          d.jetztMs(),
          {
            recovery_art: recovery.art,
            klassifikation: recovery.klassifikation,
            beobachtungen: recovery.beobachtungen,
            rest_domaenen: recovery.restDomaenen,
            same_intent_retry: false,
          },
        ));
      }

      const terminal = terminalFuer(recovery);
      await d.journal.haengeDurableAn(journalEintrag(
        a,
        sequenz,
        terminal,
        d.jetztMs(),
        {
          recovery_art: recovery.art,
          klassifikation: recovery.klassifikation,
          neuer_intent_erforderlich: recovery.neuerIntentErforderlich,
          same_intent_retry: false,
        },
      ));

      return Object.freeze({
        schemaVersion: 1,
        transaktionsId: a.transaktionsId,
        status: statusFuer(recovery),
        transportArt: transport.art,
        recovery,
        journalTerminalArt: terminal,
        sameIntentErneutSenden: false,
        adapterAufrufeErwartetMaximal: 1,
      });
    } finally {
      if (kanal !== null) {
        try {
          d.socketBudget.storniere(kanal.budgetReservierung.reservierungId);
        } catch {
          // Journalzustand entscheidet ueber Wiederanlauf; Cleanup ist best effort.
        }
        try {
          d.ressourcen.gibFrei(kanal.kanalToken, d.jetztMs());
        } catch {
          // Fail-closed bei spaeterer Fencing-Pruefung.
        }
      }
      for (const token of tokens) {
        try {
          d.ressourcen.gibFrei(token, d.jetztMs());
        } catch {
          // Fail-closed bei spaeterer Fencing-Pruefung.
        }
      }
    }
  }
}
