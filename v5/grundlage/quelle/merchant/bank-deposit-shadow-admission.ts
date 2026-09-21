import {
  ErteilteAusfuehrungsFreigabe,
} from "../ausfuehrung/admission.js";
import type {
  LiveVoraussetzungsPrueferPort,
  LaufzeitGatePort,
  OperatorRichtlinienPort,
} from "../ausfuehrung/ports.js";
import {
  PersistVorMutationTor,
} from "../persistenz/journal.js";
import type {
  TransaktionsJournalEintrag,
  TransaktionsJournalPort,
} from "../persistenz/ports.js";
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
} from "../scheduler/ressourcen-verwalter.js";
import {
  CharacterSocketBudget,
  MutationsKanalKoordination,
  erstelleMutationsKanalPlan,
  type MutationsKanalFreigabe,
} from "../scheduler/socket-budget.js";
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

export const BANK_DEPOSIT_SOCKET_BUDGET_GEWICHT = 20;
export const BANK_DEPOSIT_SHADOW_INVARIANTEN = Object.freeze([
  "V5-ALT-002",
  "V5-ALT-003",
  "V5-INV-002",
  "V5-INV-004",
  "V5-INV-005",
  "V5-ALT-024",
] as const);
export const BANK_DEPOSIT_SHADOW_LIVE_VORAUSSETZUNGEN = Object.freeze([
  "character",
  "bank",
  "inventory",
] as const);

export interface BankDepositShadowSnapshot {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly ownerCharacterId: string;
  readonly beobachtetAmMs: number;
  readonly fingerprint: string;
}

export interface BankDepositShadowAnforderung {
  readonly schemaVersion: 1;
  readonly freigabeId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly transaktionsId: string;
  readonly accountId: string;
  readonly characterId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly leaseDauerMs: number;
  readonly maximaleSnapshotAlterMs: number;
  readonly externalFence: BankExternalFence;
  readonly externalFenceBeobachtetAmMs: number;
  readonly snapshot: BankDepositShadowSnapshot;
  readonly authority: ProduktiveBankDepositEinmalAuthority;
}

export interface BankDepositShadowReleaseBeobachterPort {
  beobachte(
    token: BankLeaseToken,
    jetztMs: number,
  ): Promise<BankFreigabeNachweis>;
}

export interface BankDepositShadowAbhaengigkeiten {
  readonly leaseController: PersistenterBankLeaseController;
  readonly ressourcen: RessourcenVerwalter;
  readonly socketBudget: CharacterSocketBudget;
  readonly mutationsKanaele: MutationsKanalKoordination;
  readonly operatorRichtlinie: OperatorRichtlinienPort;
  readonly laufzeitGate: LaufzeitGatePort;
  readonly liveVoraussetzungen: LiveVoraussetzungsPrueferPort;
  readonly journal: TransaktionsJournalPort;
  readonly releaseBeobachter: BankDepositShadowReleaseBeobachterPort;
  readonly jetztMs: () => number;
}

export interface BankDepositShadowErgebnis {
  readonly schemaVersion: 1;
  readonly status: "ADMISSION_BESTANDEN_KEIN_SEND";
  readonly transaktionsId: string;
  readonly leaseEpoche: number;
  readonly actionKanalRessourcenId: string;
  readonly budgetReservierungId: string;
  readonly admissionNachweisId: string;
  readonly journalTerminalArt: "ABBRUCH";
  readonly sendBoundaryState: "NICHT_GESENDET";
  readonly sameIntentErneutSenden: false;
  readonly gameplayWrites: 0;
  readonly adapterAufrufe: 0;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeZeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereAnforderung(a: BankDepositShadowAnforderung): void {
  if (a.schemaVersion !== 1) {
    throw new Error("BANK_DEPOSIT_SHADOW_SCHEMA_UNGUELTIG");
  }
  for (const [wert, fehler] of [
    [a.freigabeId, "BANK_DEPOSIT_SHADOW_FREIGABE_ID_UNGUELTIG"],
    [a.auftragId, "BANK_DEPOSIT_SHADOW_AUFTRAG_ID_UNGUELTIG"],
    [a.ablaufId, "BANK_DEPOSIT_SHADOW_ABLAUF_ID_UNGUELTIG"],
    [a.transaktionsId, "BANK_DEPOSIT_SHADOW_TX_ID_UNGUELTIG"],
    [a.accountId, "BANK_DEPOSIT_SHADOW_ACCOUNT_ID_UNGUELTIG"],
    [a.characterId, "BANK_DEPOSIT_SHADOW_CHARACTER_ID_UNGUELTIG"],
    [a.serverRegion, "BANK_DEPOSIT_SHADOW_SERVER_REGION_UNGUELTIG"],
    [a.serverIdentifier, "BANK_DEPOSIT_SHADOW_SERVER_ID_UNGUELTIG"],
    [a.snapshot.fingerprint, "BANK_DEPOSIT_SHADOW_SNAPSHOT_FP_UNGUELTIG"],
  ] as const) {
    pruefeText(wert, fehler);
  }
  pruefeZeit(
    a.ausgestelltAmMs,
    "BANK_DEPOSIT_SHADOW_AUSSTELLZEIT_UNGUELTIG",
  );
  pruefeZeit(
    a.gueltigBisMs,
    "BANK_DEPOSIT_SHADOW_GUELTIGKEIT_UNGUELTIG",
  );
  pruefeZeit(
    a.externalFenceBeobachtetAmMs,
    "BANK_DEPOSIT_SHADOW_FENCE_ZEIT_UNGUELTIG",
  );
  pruefeZeit(
    a.snapshot.beobachtetAmMs,
    "BANK_DEPOSIT_SHADOW_SNAPSHOT_ZEIT_UNGUELTIG",
  );
  if (a.gueltigBisMs < a.ausgestelltAmMs
      || a.gueltigBisMs - a.ausgestelltAmMs > 2_000
      || !Number.isSafeInteger(a.leaseDauerMs)
      || a.leaseDauerMs < 1
      || a.leaseDauerMs > 60_000
      || !Number.isSafeInteger(a.maximaleSnapshotAlterMs)
      || a.maximaleSnapshotAlterMs < 1
      || a.maximaleSnapshotAlterMs > 10_000) {
    throw new Error("BANK_DEPOSIT_SHADOW_ZEITFENSTER_UNGUELTIG");
  }
  if (a.externalFenceBeobachtetAmMs > a.ausgestelltAmMs
      || a.ausgestelltAmMs - a.externalFenceBeobachtetAmMs > 1_000) {
    throw new Error("BANK_DEPOSIT_SHADOW_EXTERNAL_FENCE_STALE");
  }
  if (a.snapshot.schemaVersion !== 1
      || a.snapshot.accountId !== a.accountId
      || a.snapshot.ownerCharacterId !== a.characterId
      || a.snapshot.beobachtetAmMs > a.ausgestelltAmMs
      || a.ausgestelltAmMs - a.snapshot.beobachtetAmMs
        > a.maximaleSnapshotAlterMs) {
    throw new Error("BANK_DEPOSIT_SHADOW_SNAPSHOT_BINDUNG_UNGUELTIG");
  }
  if (a.externalFence.konflikt
      || a.externalFence.mountedCharacterId !== a.characterId
      || a.externalFence.serverRegion !== a.serverRegion
      || a.externalFence.serverIdentifier !== a.serverIdentifier) {
    throw new Error("BANK_DEPOSIT_SHADOW_EXTERNAL_FENCE_UNGUELTIG");
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

function journalEintrag(
  a: BankDepositShadowAnforderung,
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

export class ProduktiveBankDepositShadowAdmission {
  public async pruefe(
    a: BankDepositShadowAnforderung,
    d: BankDepositShadowAbhaengigkeiten,
  ): Promise<BankDepositShadowErgebnis> {
    validiereAnforderung(a);

    let leaseToken: BankLeaseToken | null = null;
    let kanal: MutationsKanalFreigabe | null = null;
    let sequenz = 1;
    let terminalGeschrieben = false;

    try {
      leaseToken = await d.leaseController.beanspruche(
        a.accountId,
        a.characterId,
        a.ablaufId,
        "bank_deposit_shadow",
        a.serverRegion,
        a.serverIdentifier,
        a.ausgestelltAmMs,
        a.leaseDauerMs,
      );
      const lease = await d.leaseController.aktiviere(
        leaseToken,
        a.externalFence,
        a.ausgestelltAmMs,
      );
      if (lease.zustand !== "ACTIVE") {
        throw new Error("BANK_DEPOSIT_SHADOW_LEASE_NICHT_ACTIVE");
      }

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
        throw new Error("BANK_DEPOSIT_SHADOW_MUTATIONS_FENCE_UNGUELTIG");
      }
      if (!d.leaseController.validiereSnapshot(
        leaseToken,
        {
          schemaVersion: 1,
          accountId: a.accountId,
          ownerCharacterId: a.characterId,
          leaseEpoche: leaseToken.epoche,
          beobachtetAmMs: a.snapshot.beobachtetAmMs,
          fingerprint: a.snapshot.fingerprint,
        },
        a.ausgestelltAmMs,
        a.maximaleSnapshotAlterMs,
      )) {
        throw new Error("BANK_DEPOSIT_SHADOW_SNAPSHOT_NICHT_FREIGEGEBEN");
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
          attempt_id: a.transaktionsId + ":shadow:1",
          bank_lease_epoche: leaseToken.epoche,
          bank_snapshot_fingerprint: a.snapshot.fingerprint,
          resource_claims_and_fencing: Object.freeze([
            Object.freeze({
              ressourcenId: leaseToken.ressourcenToken.ressourcenId,
              epoche: leaseToken.ressourcenToken.epoche,
            }),
            Object.freeze({
              ressourcenId: kanal.kanalToken.ressourcenId,
              epoche: kanal.kanalToken.epoche,
            }),
          ]),
          send_boundary_state: "NICHT_GESENDET",
          same_intent_retry: false,
          shadow_only: true,
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
        faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
        eigentuemerModulId: MERCHANT_BANK_CORE_MODUL_ID,
        actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
        recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
        verifierId: BANK_DEPOSIT_VERIFIER_ID,
        invariantenKennungen: BANK_DEPOSIT_SHADOW_INVARIANTEN,
        voraussetzungsIds: BANK_DEPOSIT_SHADOW_LIVE_VORAUSSETZUNGEN,
        ausgestelltAmMs: a.ausgestelltAmMs,
        gueltigBisMs: a.gueltigBisMs,
        fencingTokens: Object.freeze([leaseToken.ressourcenToken]),
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

      const daten = freigabe.daten();
      await d.journal.haengeDurableAn(journalEintrag(
        a,
        sequenz,
        "ABBRUCH",
        d.jetztMs(),
        {
          grund: "SHADOW_ADMISSION_NACHGEWIESEN_KEIN_SEND",
          admission_nachweis_id: daten.laufzeitGateNachweisId,
          bank_lease_epoche: leaseToken.epoche,
          action_kanal_ressourcen_id: daten.actionKanalRessourcenId,
          budget_reservierung_id: daten.budgetReservierungId,
          send_boundary_state: "NICHT_GESENDET",
          same_intent_retry: false,
          gameplay_writes: 0,
          adapter_aufrufe: 0,
        },
      ));
      terminalGeschrieben = true;

      return Object.freeze({
        schemaVersion: 1,
        status: "ADMISSION_BESTANDEN_KEIN_SEND",
        transaktionsId: a.transaktionsId,
        leaseEpoche: leaseToken.epoche,
        actionKanalRessourcenId: daten.actionKanalRessourcenId,
        budgetReservierungId: daten.budgetReservierungId,
        admissionNachweisId: daten.laufzeitGateNachweisId,
        journalTerminalArt: "ABBRUCH",
        sendBoundaryState: "NICHT_GESENDET",
        sameIntentErneutSenden: false,
        gameplayWrites: 0,
        adapterAufrufe: 0,
        gameplayAutoritaet: false,
        rawWriteAutoritaet: false,
      });
    } catch (fehler) {
      if (!terminalGeschrieben) {
        try {
          const bisher = await d.journal.liesTransaktion(a.transaktionsId);
          if (bisher.some(x => x.art === "INTENT")
              && !bisher.some(x =>
                x.art === "ABBRUCH"
                || x.art === "COMMIT"
                || x.art === "SICHER_FEHLGESCHLAGEN")) {
            await d.journal.haengeDurableAn(journalEintrag(
              a,
              bisher.length + 1,
              "ABBRUCH",
              d.jetztMs(),
              {
                grund: "SHADOW_ADMISSION_BLOCKIERT_KEIN_SEND",
                fehler: String(
                  fehler instanceof Error ? fehler.message : fehler,
                ).slice(0, 240),
                send_boundary_state: "NICHT_GESENDET",
                same_intent_retry: false,
                gameplay_writes: 0,
                adapter_aufrufe: 0,
              },
            ));
            terminalGeschrieben = true;
          }
        } catch {
          // Ein Journalfehler bleibt fail-closed; kein Adapter existiert hier.
        }
      }
      throw fehler;
    } finally {
      if (kanal !== null) {
        try {
          d.socketBudget.storniere(
            kanal.budgetReservierung.reservierungId,
          );
        } catch {
          // Best effort; Fencing bleibt bei Fehler fail-closed.
        }
        try {
          d.ressourcen.gibFrei(kanal.kanalToken, d.jetztMs());
        } catch {
          // Best effort; alte Token werden durch Fencing ungueltig.
        }
      }

      if (leaseToken !== null) {
        try {
          const sicht = d.leaseController.sicht().find(
            x => x.accountId === leaseToken?.accountId
              && x.epoche === leaseToken?.epoche,
          );
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
          }
        } catch {
          try {
            await d.leaseController.markiereRecovery(
              leaseToken,
              d.jetztMs(),
            );
          } catch {
            // Persistenz-/Recoveryfehler blockiert spaetere Neuvergabe.
          }
        }
      }
    }
  }
}
