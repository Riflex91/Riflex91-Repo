import {
  ErteilteAusfuehrungsFreigabe,
} from "../ausfuehrung/admission.js";
import type {
  AusfuehrungsAdapter,
  LaufzeitGatePort,
  OperatorRichtlinienPort,
} from "../ausfuehrung/ports.js";
import {
  AusfuehrungsKernel,
} from "../ausfuehrung/ausfuehrungs-kernel.js";
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
import type {
  BankExternalFence,
  BankFreigabeNachweis,
  BankLeaseToken,
} from "../koordination/account-bank-lease.js";
import {
  PersistenterBankLeaseController,
} from "../koordination/persistenter-bank-lease-controller.js";
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
  BANK_DEPOSIT_ERSTER_BETRAG,
  pruefeBankDepositEinGoldSettlement,
  type BankDepositBindung,
} from "./bank-deposit-settlement.js";
import {
  BANK_DEPOSIT_ACTION_CONTRACT_ID,
  BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
  BANK_DEPOSIT_VERIFIER_ID,
  type ProduktiveBankDepositEinmalAuthority,
} from "./bank-deposit-einmal-authority.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
} from "./bank-produktions-modul-vertrag.js";
import {
  BANK_DEPOSIT_SHADOW_INVARIANTEN,
  BANK_DEPOSIT_SOCKET_BUDGET_GEWICHT,
} from "./bank-deposit-shadow-admission.js";

export const BANK_DEPOSIT_PRODUKTIV_LIVE_VORAUSSETZUNGEN = Object.freeze([
  "character",
  "bank",
  "inventory",
] as const);

export interface BankDepositEinGoldAdapterAnfrage {
  readonly betrag: 1;
  readonly accountId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly erwartetesCharacterGold: number;
  readonly erwartetesBankGold: number;
  readonly erwarteterFingerprint: string;
}

export interface ProduktiverBankDepositBeobachterPort {
  beobachte(
    leaseEpoche: number,
    mountEpoche: number,
  ): Promise<BankDepositBindung>;
}

export interface ProduktiveBankDepositTransaktionsAnforderung {
  readonly schemaVersion: 1;
  readonly freigabeId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly transaktionsId: string;
  readonly accountId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly betrag: 1;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly leaseDauerMs: number;
  readonly maximaleSnapshotAlterMs: number;
  readonly externalFence: BankExternalFence;
  readonly externalFenceBeobachtetAmMs: number;
  readonly vorher: BankDepositBindung;
  readonly authority: ProduktiveBankDepositEinmalAuthority;
  readonly wissensSnapshot: Readonly<{
    gitCommit: string;
    quellenSha256: readonly string[];
  }>;
  readonly configFingerprint: string;
  readonly prestateFingerprint: string;
}

export interface ProduktiveBankDepositTransaktionsAbhaengigkeiten<Ergebnis> {
  readonly leaseController: PersistenterBankLeaseController;
  readonly operatorRichtlinie: OperatorRichtlinienPort;
  readonly laufzeitGate: LaufzeitGatePort;
  readonly journal: TransaktionsJournalPort;
  readonly ressourcen: RessourcenVerwalter;
  readonly socketBudget: CharacterSocketBudget;
  readonly mutationsKanaele: MutationsKanalKoordination;
  readonly ausfuehrung: AusfuehrungsKernel;
  readonly adapter: AusfuehrungsAdapter<
    BankDepositEinGoldAdapterAnfrage,
    Ergebnis,
    ErteilteAusfuehrungsFreigabe
  >;
  readonly bankBeobachter: ProduktiverBankDepositBeobachterPort;
  readonly releaseBeobachter: Readonly<{
    beobachte(
      token: BankLeaseToken,
      jetztMs: number,
    ): Promise<BankFreigabeNachweis>;
  }>;
  readonly vorabLeaseToken?: BankLeaseToken;
  readonly jetztMs: () => number;
}

export interface ProduktiveBankDepositTransaktionsErgebnis {
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
  readonly journalTerminalArt:
    | "COMMIT"
    | "ABBRUCH"
    | "SICHER_FEHLGESCHLAGEN";
  readonly leaseEpoche: number;
  readonly mountEpoche: number;
  readonly sameIntentErneutSenden: false;
  readonly adapterAufrufeErwartetMaximal: 1;
  readonly betrag: 1;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeZeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereAnforderung(
  a: ProduktiveBankDepositTransaktionsAnforderung,
): void {
  if (a.schemaVersion !== 1) {
    throw new Error("BANK_DEPOSIT_PROD_TX_SCHEMA_UNGUELTIG");
  }
  for (const [wert, fehler] of [
    [a.freigabeId, "BANK_DEPOSIT_PROD_TX_FREIGABE_ID_UNGUELTIG"],
    [a.auftragId, "BANK_DEPOSIT_PROD_TX_AUFTRAG_ID_UNGUELTIG"],
    [a.ablaufId, "BANK_DEPOSIT_PROD_TX_ABLAUF_ID_UNGUELTIG"],
    [a.transaktionsId, "BANK_DEPOSIT_PROD_TX_ID_UNGUELTIG"],
    [a.accountId, "BANK_DEPOSIT_PROD_TX_ACCOUNT_ID_UNGUELTIG"],
    [a.characterId, "BANK_DEPOSIT_PROD_TX_CHARACTER_ID_UNGUELTIG"],
    [a.sessionId, "BANK_DEPOSIT_PROD_TX_SESSION_ID_UNGUELTIG"],
    [a.serverRegion, "BANK_DEPOSIT_PROD_TX_SERVER_REGION_UNGUELTIG"],
    [a.serverIdentifier, "BANK_DEPOSIT_PROD_TX_SERVER_ID_UNGUELTIG"],
    [a.configFingerprint, "BANK_DEPOSIT_PROD_TX_CONFIG_FP_UNGUELTIG"],
    [a.prestateFingerprint, "BANK_DEPOSIT_PROD_TX_PRESTATE_FP_UNGUELTIG"],
  ] as const) {
    pruefeText(wert, fehler);
  }
  if (a.betrag !== BANK_DEPOSIT_ERSTER_BETRAG) {
    throw new Error("BANK_DEPOSIT_PROD_TX_BETRAG_NICHT_EXAKT_EINS");
  }
  pruefeZeit(a.ausgestelltAmMs, "BANK_DEPOSIT_PROD_TX_ZEIT_UNGUELTIG");
  pruefeZeit(
    a.gueltigBisMs,
    "BANK_DEPOSIT_PROD_TX_ABLAUFZEIT_UNGUELTIG",
  );
  pruefeZeit(
    a.externalFenceBeobachtetAmMs,
    "BANK_DEPOSIT_PROD_TX_FENCE_ZEIT_UNGUELTIG",
  );
  if (a.gueltigBisMs < a.ausgestelltAmMs
      || a.gueltigBisMs - a.ausgestelltAmMs > 2_000
      || !Number.isSafeInteger(a.leaseDauerMs)
      || a.leaseDauerMs < 1
      || a.leaseDauerMs > 300_000
      || !Number.isSafeInteger(a.maximaleSnapshotAlterMs)
      || a.maximaleSnapshotAlterMs < 1
      || a.maximaleSnapshotAlterMs > 10_000) {
    throw new Error("BANK_DEPOSIT_PROD_TX_ZEITFENSTER_UNGUELTIG");
  }
  if (a.externalFenceBeobachtetAmMs > a.ausgestelltAmMs
      || a.ausgestelltAmMs - a.externalFenceBeobachtetAmMs > 1_000) {
    throw new Error("BANK_DEPOSIT_PROD_TX_FENCE_STALE");
  }
  const v = a.vorher;
  if (v.characterId !== a.characterId
      || v.sessionId !== a.sessionId
      || v.serverRegion !== a.serverRegion
      || v.serverKennung !== a.serverIdentifier
      || v.beobachtetAmMs > a.ausgestelltAmMs
      || a.ausgestelltAmMs - v.beobachtetAmMs > a.maximaleSnapshotAlterMs
      || v.fingerprint !== a.prestateFingerprint
      || v.characterGold < 1) {
    throw new Error("BANK_DEPOSIT_PROD_TX_PRESTATE_BINDUNG_UNGUELTIG");
  }
  if (a.externalFence.konflikt
      || a.externalFence.mountedCharacterId !== a.characterId
      || a.externalFence.serverRegion !== a.serverRegion
      || a.externalFence.serverIdentifier !== a.serverIdentifier) {
    throw new Error("BANK_DEPOSIT_PROD_TX_EXTERNAL_FENCE_UNGUELTIG");
  }
  if (!/^[0-9a-f]{40}$/i.test(a.wissensSnapshot.gitCommit)
      || a.wissensSnapshot.quellenSha256.length < 1
      || a.wissensSnapshot.quellenSha256.length > 64
      || a.wissensSnapshot.quellenSha256.some(
        x => !/^[0-9a-f]{64}$/i.test(x),
      )) {
    throw new Error("BANK_DEPOSIT_PROD_TX_WISSENSSNAPSHOT_UNGUELTIG");
  }
  const authority = a.authority.daten();
  if (authority.transaktionsId !== a.transaktionsId
      || authority.faehigkeitId !== MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID
      || authority.anbieterModulId !== MERCHANT_BANK_CORE_MODUL_ID
      || authority.actionContractId !== BANK_DEPOSIT_ACTION_CONTRACT_ID
      || authority.recoveryContractId !== BANK_DEPOSIT_RECOVERY_CONTRACT_ID
      || authority.verifierId !== BANK_DEPOSIT_VERIFIER_ID
      || a.gueltigBisMs > authority.gueltigBisMs
      || !a.authority.gueltigFuer(a.ausgestelltAmMs)) {
    throw new Error("BANK_DEPOSIT_PROD_TX_AUTHORITY_BINDUNG_UNGUELTIG");
  }
}

function actionVertrag() {
  return Object.freeze({
    pruefe(
      actionContractId: string,
      recoveryContractId: string,
      verifierId: string,
    ) {
      const exakt = actionContractId === BANK_DEPOSIT_ACTION_CONTRACT_ID
        && recoveryContractId === BANK_DEPOSIT_RECOVERY_CONTRACT_ID
        && verifierId === BANK_DEPOSIT_VERIFIER_ID;
      return Object.freeze({
        actionContractId,
        recoveryContractId,
        verifierId,
        produktivErlaubt: exakt,
        invariantenKennungen: BANK_DEPOSIT_SHADOW_INVARIANTEN,
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
          actionContractId === BANK_DEPOSIT_ACTION_CONTRACT_ID
          && recoveryContractId === BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
        sameIntentAfterPossibleSend: "NEVER" as const,
        maximaleBeobachtungen: 4,
        fehlerDomaeneId: "account:bank",
      });
    },
  });
}

function terminalFuer(
  recovery: RecoveryAbschluss,
): "COMMIT" | "ABBRUCH" | "SICHER_FEHLGESCHLAGEN" {
  if (recovery.art === "COMMITTED") return "COMMIT";
  if (recovery.art === "ABORTED") return "ABBRUCH";
  return "SICHER_FEHLGESCHLAGEN";
}

function statusFuer(
  recovery: RecoveryAbschluss,
): ProduktiveBankDepositTransaktionsErgebnis["status"] {
  switch (recovery.art) {
    case "COMMITTED": return "COMMITTED";
    case "ABORTED": return "ABORTED";
    case "REPLAN_ALLOWED": return "REPLAN_REQUIRED";
    case "OPERATOR_REQUIRED": return "OPERATOR_REQUIRED";
    default: return "FAILED_SAFE";
  }
}

function journalEintrag(
  a: ProduktiveBankDepositTransaktionsAnforderung,
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

function liveVoraussetzungen(
  a: ProduktiveBankDepositTransaktionsAnforderung,
  beobachter: ProduktiverBankDepositBeobachterPort,
) {
  return Object.freeze({
    async pruefe(ids: readonly string[], jetztMs: number) {
      if (ids.length !== BANK_DEPOSIT_PRODUKTIV_LIVE_VORAUSSETZUNGEN.length
          || ids.some(id =>
            !BANK_DEPOSIT_PRODUKTIV_LIVE_VORAUSSETZUNGEN.includes(
              id as typeof BANK_DEPOSIT_PRODUKTIV_LIVE_VORAUSSETZUNGEN[number],
            ))) {
        throw new Error("BANK_DEPOSIT_PROD_TX_LIVE_IDS_UNGUELTIG");
      }
      const b = await beobachter.beobachte(
        a.vorher.leaseEpoche,
        a.vorher.mountEpoche,
      );
      if (b.characterId !== a.vorher.characterId
          || b.sessionId !== a.vorher.sessionId
          || b.serverRegion !== a.vorher.serverRegion
          || b.serverKennung !== a.vorher.serverKennung
          || b.leaseEpoche !== a.vorher.leaseEpoche
          || b.mountEpoche !== a.vorher.mountEpoche
          || b.characterGold !== a.vorher.characterGold
          || b.bankGold !== a.vorher.bankGold
          || b.fingerprint !== a.vorher.fingerprint) {
        throw new Error("BANK_DEPOSIT_PROD_TX_LIVE_PRESTATE_DRIFT");
      }
      return Object.freeze(ids.map(id => Object.freeze({
        voraussetzungId: id,
        fingerprint: b.fingerprint + ":" + id,
        beobachtetAmMs: jetztMs,
        gueltigBisMs: Math.min(jetztMs + 1_500, a.gueltigBisMs),
      })));
    },
  });
}

function recoveryBeobachter(
  a: ProduktiveBankDepositTransaktionsAnforderung,
  beobachter: ProduktiverBankDepositBeobachterPort,
): AbgleichBeobachterPort {
  return Object.freeze({
    async beobachte(_txId, snapshot, versuch) {
      try {
        const nachher = await beobachter.beobachte(
          a.vorher.leaseEpoche,
          a.vorher.mountEpoche,
        );
        const settlement = pruefeBankDepositEinGoldSettlement(
          a.vorher,
          nachher,
        );
        let klassifikation:
          | "BESTAETIGT"
          | "NOCH_AUSSTEHEND"
          | "UNGEKLAERT";
        if (settlement.status === "BESTAETIGT") {
          klassifikation = "BESTAETIGT";
        } else if (settlement.status === "OFFEN" && versuch < 4) {
          klassifikation = "NOCH_AUSSTEHEND";
        } else {
          klassifikation = "UNGEKLAERT";
        }
        return Object.freeze({
          schemaVersion: 1,
          klassifikation,
          beobachtetAmMs: nachher.beobachtetAmMs,
          snapshot,
          differenz: Object.freeze({
            schemaVersion: 1,
            erwarteteDomaenen: Object.freeze(["bank", "gold"]),
            angewendeteDomaenen: Object.freeze(
              klassifikation === "BESTAETIGT"
                ? ["bank", "gold"]
                : [],
            ),
            offeneDomaenen: Object.freeze(
              klassifikation === "BESTAETIGT"
                ? []
                : ["bank", "gold"],
            ),
            widerspruechlicheDomaenen: Object.freeze(
              settlement.status === "DRIFT"
                || (settlement.status === "OFFEN" && versuch >= 4)
                ? ["bank", "gold"]
                : [],
            ),
          }),
          evidenceFingerprints: Object.freeze([
            nachher.fingerprint,
          ]),
        });
      } catch (fehler) {
        return Object.freeze({
          schemaVersion: 1,
          klassifikation: "UNGEKLAERT" as const,
          beobachtetAmMs: a.ausgestelltAmMs,
          snapshot,
          differenz: Object.freeze({
            schemaVersion: 1,
            erwarteteDomaenen: Object.freeze(["bank", "gold"]),
            angewendeteDomaenen: Object.freeze([]),
            offeneDomaenen: Object.freeze(["bank", "gold"]),
            widerspruechlicheDomaenen: Object.freeze(["bank", "gold"]),
          }),
          evidenceFingerprints: Object.freeze([
            "BANK_DEPOSIT_BEOBACHTUNG_FEHLER:"
            + String(fehler instanceof Error ? fehler.message : fehler)
              .slice(0, 160),
          ]),
        });
      }
    },
  });
}

export class ProduktiveBankDepositTransaktionsOrchestrierung {
  public async fuehreEinmalAus<Ergebnis>(
    a: ProduktiveBankDepositTransaktionsAnforderung,
    d: ProduktiveBankDepositTransaktionsAbhaengigkeiten<Ergebnis>,
  ): Promise<ProduktiveBankDepositTransaktionsErgebnis> {
    validiereAnforderung(a);
    if (d.adapter.actionContractId !== BANK_DEPOSIT_ACTION_CONTRACT_ID
        || d.adapter.recoveryContractId !== BANK_DEPOSIT_RECOVERY_CONTRACT_ID
        || d.adapter.verifierId !== BANK_DEPOSIT_VERIFIER_ID) {
      throw new Error("BANK_DEPOSIT_PROD_TX_ADAPTER_BINDUNG_UNGUELTIG");
    }

    let leaseToken: BankLeaseToken | null = null;
    let kanal: MutationsKanalFreigabe | null = null;
    let goldToken: FencingToken | null = null;
    let sequenz = 1;

    try {
      if (d.vorabLeaseToken !== undefined) {
        leaseToken = d.vorabLeaseToken;
        if (leaseToken.accountId !== a.accountId
            || leaseToken.ownerCharacterId !== a.characterId
            || leaseToken.ablaufId !== a.ablaufId
            || leaseToken.epoche !== a.vorher.leaseEpoche) {
          throw new Error("BANK_DEPOSIT_PROD_TX_VORAB_LEASE_DRIFT");
        }
        const sichtbar = d.leaseController.sicht().find(x =>
          x.accountId === leaseToken?.accountId
          && x.epoche === leaseToken?.epoche);
        if (sichtbar?.zustand !== "ACQUIRING") {
          throw new Error("BANK_DEPOSIT_PROD_TX_VORAB_LEASE_NICHT_ACQUIRING");
        }
      } else {
        leaseToken = await d.leaseController.beanspruche(
          a.accountId,
          a.characterId,
          a.ablaufId,
          "bank_deposit_one_shot_live",
          a.serverRegion,
          a.serverIdentifier,
          a.ausgestelltAmMs,
          a.leaseDauerMs,
        );
      }

      const lease = await d.leaseController.aktiviere(
        leaseToken,
        a.externalFence,
        a.ausgestelltAmMs,
      );
      if (lease.zustand !== "ACTIVE") {
        throw new Error("BANK_DEPOSIT_PROD_TX_LEASE_NICHT_ACTIVE");
      }

      const goldTokens = d.ressourcen.beanspruche(
        a.ablaufId,
        [{
          ressourcenId: "character:" + a.characterId + ":gold",
          art: "EXKLUSIV",
          leaseDauerMs: null,
        }],
        a.ausgestelltAmMs,
      );
      const ersterGoldToken = goldTokens[0];
      if (ersterGoldToken === undefined) {
        throw new Error("BANK_DEPOSIT_PROD_TX_GOLD_TOKEN_FEHLT");
      }
      goldToken = ersterGoldToken;

      kanal = d.mutationsKanaele.reserviere(
        a.transaktionsId + ":budget",
        a.ablaufId,
        erstelleMutationsKanalPlan(
          a.characterId,
          "bank",
          BANK_DEPOSIT_SOCKET_BUDGET_GEWICHT,
        ),
        a.ausgestelltAmMs,
      );

      if (!d.leaseController.validiereMutation(
        leaseToken,
        kanal.kanalToken,
        a.externalFence,
        a.ausgestelltAmMs,
      )) {
        throw new Error("BANK_DEPOSIT_PROD_TX_MUTATIONS_FENCE_UNGUELTIG");
      }
      if (!d.leaseController.validiereSnapshot(
        leaseToken,
        {
          schemaVersion: 1,
          accountId: a.accountId,
          ownerCharacterId: a.characterId,
          leaseEpoche: leaseToken.epoche,
          beobachtetAmMs: a.vorher.beobachtetAmMs,
          fingerprint: a.vorher.fingerprint,
        },
        a.ausgestelltAmMs,
        a.maximaleSnapshotAlterMs,
      )) {
        throw new Error("BANK_DEPOSIT_PROD_TX_SNAPSHOT_NICHT_FREIGEGEBEN");
      }

      const intentEintrag = journalEintrag(
        a,
        sequenz,
        "INTENT",
        a.ausgestelltAmMs,
        {
          auftrag_id: a.auftragId,
          ablauf_id: a.ablaufId,
          faehigkeit_id: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
          owner_id: MERCHANT_BANK_CORE_MODUL_ID,
          action_contract_id: BANK_DEPOSIT_ACTION_CONTRACT_ID,
          recovery_contract_id: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
          verifier_id: BANK_DEPOSIT_VERIFIER_ID,
          attempt_id: a.transaktionsId + ":attempt:1",
          knowledge_snapshot_id:
            a.wissensSnapshot.gitCommit + ":" + a.wissensSnapshot.quellenSha256[0],
          pinned_prestate_fingerprint: a.prestateFingerprint,
          bank_lease_epoche: leaseToken.epoche,
          bank_mount_epoche: a.vorher.mountEpoche,
          betrag_gold: 1,
          character_gold_vorher: a.vorher.characterGold,
          bank_gold_vorher: a.vorher.bankGold,
          resource_claims_and_fencing: Object.freeze([
            Object.freeze({
              ressourcenId: leaseToken.ressourcenToken.ressourcenId,
              epoche: leaseToken.ressourcenToken.epoche,
            }),
            Object.freeze({
              ressourcenId: goldToken.ressourcenId,
              epoche: goldToken.epoche,
            }),
            Object.freeze({
              ressourcenId: kanal.kanalToken.ressourcenId,
              epoche: kanal.kanalToken.epoche,
            }),
          ]),
          send_boundary_state: "NICHT_GESENDET",
          same_intent_retry: false,
        },
      );
      const intentToken = await new PersistVorMutationTor(
        d.journal,
      ).persistiereIntent(intentEintrag);
      sequenz += 1;

      let freigabe: ErteilteAusfuehrungsFreigabe;
      try {
        freigabe = await ErteilteAusfuehrungsFreigabe.erteile({
          schemaVersion: 1,
          freigabeId: a.freigabeId,
          auftragId: a.auftragId,
          ablaufId: a.ablaufId,
          transaktionsId: a.transaktionsId,
          faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
          eigentuemerModulId: MERCHANT_BANK_CORE_MODUL_ID,
          actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
          recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
          verifierId: BANK_DEPOSIT_VERIFIER_ID,
          invariantenKennungen: BANK_DEPOSIT_SHADOW_INVARIANTEN,
          voraussetzungsIds: BANK_DEPOSIT_PRODUKTIV_LIVE_VORAUSSETZUNGEN,
          ausgestelltAmMs: a.ausgestelltAmMs,
          gueltigBisMs: a.gueltigBisMs,
          fencingTokens: Object.freeze([
            leaseToken.ressourcenToken,
            goldToken,
          ]),
          mutationsKanal: kanal,
          intentToken,
          intentEintrag,
        }, {
          faehigkeitsAutoritaet: a.authority,
          operatorRichtlinie: d.operatorRichtlinie,
          laufzeitGate: d.laufzeitGate,
          aktionsVertraege: actionVertrag(),
          liveVoraussetzungen: liveVoraussetzungen(a, d.bankBeobachter),
          ressourcen: d.ressourcen,
          socketBudget: d.socketBudget,
        });
      } catch (fehler) {
        await d.journal.haengeDurableAn(journalEintrag(
          a,
          sequenz,
          "ABBRUCH",
          d.jetztMs(),
          {
            grund: "ADMISSION_BLOCKIERT",
            fehler: String(
              fehler instanceof Error ? fehler.message : fehler,
            ).slice(0, 240),
            send_boundary_state: "NICHT_GESENDET",
            same_intent_retry: false,
          },
        ));
        throw fehler;
      }

      let transport;
      try {
        transport = await d.ausfuehrung.fuehreAus(
          freigabe,
          Object.freeze({
            betrag: 1 as const,
            accountId: a.accountId,
            characterId: a.characterId,
            sessionId: a.sessionId,
            serverRegion: a.serverRegion,
            serverIdentifier: a.serverIdentifier,
            erwartetesCharacterGold: a.vorher.characterGold,
            erwartetesBankGold: a.vorher.bankGold,
            erwarteterFingerprint: a.vorher.fingerprint,
          }),
          d.adapter,
          d.jetztMs(),
        );
      } catch {
        transport = Object.freeze({
          art: "UNBEKANNT" as const,
          grund: "TRANSPORT_UNKLAR" as const,
          korrelationId: null,
        });
      }

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
        actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
        recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
        verifierId: BANK_DEPOSIT_VERIFIER_ID,
      });

      const recovery = await new RecoveryKernel(
        recoveryVertrag(),
        recoveryBeobachter(a, d.bankBeobachter),
      ).gleicheAb({
        schemaVersion: 1,
        transaktionsId: a.transaktionsId,
        actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
        recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
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
        leaseEpoche: leaseToken.epoche,
        mountEpoche: a.vorher.mountEpoche,
        sameIntentErneutSenden: false,
        adapterAufrufeErwartetMaximal: 1,
        betrag: 1,
      });
    } finally {
      if (kanal !== null) {
        try {
          d.socketBudget.storniere(
            kanal.budgetReservierung.reservierungId,
          );
        } catch {
          // Journal und Fencing bleiben die Wiederanlauf-Wahrheit.
        }
        try {
          d.ressourcen.gibFrei(kanal.kanalToken, d.jetztMs());
        } catch {
          // Fail-closed bei spaeterer Fencing-Pruefung.
        }
      }
      if (goldToken !== null) {
        try {
          d.ressourcen.gibFrei(goldToken, d.jetztMs());
        } catch {
          // Fail-closed bei spaeterer Fencing-Pruefung.
        }
      }
      if (leaseToken !== null) {
        try {
          const sicht = d.leaseController.sicht().find(x =>
            x.accountId === leaseToken?.accountId
              && x.epoche === leaseToken?.epoche);
          if (sicht?.zustand === "ACTIVE") {
            await d.leaseController.beginneFreigabe(
              leaseToken,
              d.jetztMs(),
            );
            const nachweis = await d.releaseBeobachter.beobachte(
              leaseToken,
              d.jetztMs(),
            );
            await d.leaseController.gibFrei(
              leaseToken,
              nachweis,
              d.jetztMs(),
            );
          } else if (sicht?.zustand === "ACQUIRING"
              || sicht?.zustand === "RELEASING") {
            await d.leaseController.markiereRecovery(
              leaseToken,
              d.jetztMs(),
            );
          }
        } catch {
          try {
            const sichtbar = d.leaseController.sicht().find(
              x => x.accountId === leaseToken?.accountId
                && x.epoche === leaseToken?.epoche);
            if (sichtbar?.zustand === "ACTIVE"
                || sichtbar?.zustand === "ACQUIRING"
                || sichtbar?.zustand === "RELEASING") {
              await d.leaseController.markiereRecovery(
                leaseToken,
                d.jetztMs(),
              );
            }
          } catch {
            // Ungeklaerte Lease bleibt persistent fail-closed.
          }
        }
      }
    }
  }
}
