import { GoldBudgetLedger } from "../merchant/gold-budget.js";
import { PersistVorMutationTor } from "../persistenz/journal.js";
import type {
  TransaktionsJournalEintrag,
  TransaktionsJournalPort,
} from "../persistenz/ports.js";
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

export const PR20_7_ACQUISITION_SHADOW_POLICY_ID =
  "PR20-7-WEAPON-OFFHAND-ACQUISITION-SHADOW-V1";
export const PR20_7_ACQUISITION_SHADOW_ACTION_CONTRACT_ID =
  "AL-ACTION-BUY-WITH-GOLD";
export const PR20_7_ACQUISITION_SHADOW_RECOVERY_CONTRACT_ID =
  "AL-RECOVERY-BUY-WITH-GOLD";
export const PR20_7_ACQUISITION_SHADOW_VERIFIER_ID =
  "AL-VERIFIER-BUY-WITH-GOLD";
export const PR20_7_ACQUISITION_SHADOW_CHANNEL_ID = "buy";
export const PR20_7_ACQUISITION_SHADOW_SOCKET_BUDGET_GEWICHT = 100;
export const PR20_7_ACQUISITION_SHADOW_MIN_GOLD_RESERVE = 1_000;
export const PR20_7_ACQUISITION_SHADOW_EXACT_COST = 4_800;

export interface Pr207AcquisitionShadowAnforderung {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly characterId: "My_Merchant";
  readonly sessionId: "My_Merchant";
  readonly serverRegion: "EU";
  readonly serverIdentifier: "I";
  readonly itemName: "wshield";
  readonly quantity: 1;
  readonly unitPrice: 4_800;
  readonly observedGold: number;
  readonly safetyReserve: number;
  readonly inventoryFingerprint: string;
  readonly goldFingerprint: string;
  readonly vendorFingerprint: string;
  readonly itemDefinitionFingerprint: string;
  readonly observedAtMs: number;
}

export interface Pr207AcquisitionShadowAbhaengigkeiten {
  readonly goldBudget: GoldBudgetLedger;
  readonly ressourcen: RessourcenVerwalter;
  readonly socketBudget: CharacterSocketBudget;
  readonly mutationsKanaele: MutationsKanalKoordination;
  readonly journal: TransaktionsJournalPort;
}

export interface Pr207AcquisitionShadowErgebnis {
  readonly schemaVersion: 1;
  readonly status: "SHADOW_BESTANDEN_KEIN_SEND";
  readonly policyId: typeof PR20_7_ACQUISITION_SHADOW_POLICY_ID;
  readonly transaktionsId: string;
  readonly exactCost: 4_800;
  readonly safetyReserve: number;
  readonly goldReservationId: string;
  readonly resourceClaims: readonly Readonly<{
    ressourcenId: string;
    epoche: number;
  }>[];
  readonly actionChannelResourceId: string;
  readonly socketBudgetReservationId: string;
  readonly durableIntent: true;
  readonly journalTerminalArt: "ABBRUCH";
  readonly sendBoundaryState: "NICHT_GESENDET";
  readonly oneShotBindingPrepared: true;
  readonly oneShotMaximumUses: 1;
  readonly oneShotPurchaseAuthorityIssued: false;
  readonly goldBudgetLedgerReservationSatisfied: true;
  readonly inventoryFenceSatisfied: true;
  readonly goldFenceSatisfied: true;
  readonly buyChannelFenceSatisfied: true;
  readonly socketBudgetFenceSatisfied: true;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly purchaseAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly sameIntentRetry: false;
  readonly normalRuntimeAllowed: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeZeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereAnforderung(a: Pr207AcquisitionShadowAnforderung): void {
  if (a.schemaVersion !== 1) {
    throw new Error("PR20_7_ACQUISITION_SHADOW_SCHEMA_UNGUELTIG");
  }
  for (const wert of [
    a.transaktionsId,
    a.auftragId,
    a.ablaufId,
    a.inventoryFingerprint,
    a.goldFingerprint,
    a.vendorFingerprint,
    a.itemDefinitionFingerprint,
  ]) pruefeText(wert, "PR20_7_ACQUISITION_SHADOW_TEXT_UNGUELTIG");
  if (a.characterId !== "My_Merchant"
      || a.sessionId !== "My_Merchant"
      || a.serverRegion !== "EU"
      || a.serverIdentifier !== "I"
      || a.itemName !== "wshield"
      || a.quantity !== 1
      || a.unitPrice !== PR20_7_ACQUISITION_SHADOW_EXACT_COST) {
    throw new Error("PR20_7_ACQUISITION_SHADOW_BINDUNG_DRIFT");
  }
  if (!Number.isSafeInteger(a.observedGold) || a.observedGold < 0) {
    throw new Error("PR20_7_ACQUISITION_SHADOW_GOLD_UNGUELTIG");
  }
  if (!Number.isSafeInteger(a.safetyReserve)
      || a.safetyReserve < PR20_7_ACQUISITION_SHADOW_MIN_GOLD_RESERVE) {
    throw new Error("PR20_7_ACQUISITION_SHADOW_GOLD_RESERVE_ZU_KLEIN");
  }
  pruefeZeit(a.observedAtMs, "PR20_7_ACQUISITION_SHADOW_ZEIT_UNGUELTIG");
}

function journalEintrag(
  a: Pr207AcquisitionShadowAnforderung,
  sequenz: number,
  art: TransaktionsJournalEintrag["art"],
  zeitMs: number,
  inhalt: Readonly<Record<string, unknown>>,
): TransaktionsJournalEintrag {
  return Object.freeze({
    schemaVersion: 1,
    journalId: a.transaktionsId + ":" + sequenz,
    transaktionsId: a.transaktionsId,
    sequenz,
    art,
    zeitMs,
    inhalt: Object.freeze({ ...inhalt }),
  });
}

function claim(
  token: FencingToken,
): Readonly<{ ressourcenId: string; epoche: number }> {
  return Object.freeze({
    ressourcenId: token.ressourcenId,
    epoche: token.epoche,
  });
}

export class Pr207WeaponOffhandAcquisitionShadow {
  public async pruefe(
    a: Pr207AcquisitionShadowAnforderung,
    d: Pr207AcquisitionShadowAbhaengigkeiten,
  ): Promise<Pr207AcquisitionShadowErgebnis> {
    validiereAnforderung(a);

    const goldReservationId = a.transaktionsId + ":gold";
    let resourceTokens: readonly FencingToken[] = Object.freeze([]);
    let channel: MutationsKanalFreigabe | null = null;
    let goldReserved = false;
    let terminalGeschrieben = false;

    d.goldBudget.aktualisiereBeobachtung(a.observedGold, a.safetyReserve);
    const goldReservation = d.goldBudget.reserviere(
      goldReservationId,
      a.ablaufId,
      PR20_7_ACQUISITION_SHADOW_EXACT_COST,
      "PR20_7_WSHIELD_ACQUISITION_SHADOW",
    );
    goldReserved = true;
    if (goldReservation.betrag !== PR20_7_ACQUISITION_SHADOW_EXACT_COST) {
      throw new Error("PR20_7_ACQUISITION_SHADOW_GOLD_RESERVIERUNG_DRIFT");
    }

    try {
      resourceTokens = d.ressourcen.beanspruche(
        a.ablaufId,
        Object.freeze([
          Object.freeze({
            ressourcenId: "character:" + a.characterId + ":gold",
            art: "EXKLUSIV" as const,
            leaseDauerMs: null,
          }),
          Object.freeze({
            ressourcenId: "character:" + a.characterId + ":inventory",
            art: "EXKLUSIV" as const,
            leaseDauerMs: null,
          }),
        ]),
        a.observedAtMs,
      );
      if (resourceTokens.length !== 2) {
        throw new Error("PR20_7_ACQUISITION_SHADOW_RESOURCE_CLAIMS_UNVOLLSTAENDIG");
      }

      channel = d.mutationsKanaele.reserviere(
        a.transaktionsId + ":socket-budget",
        a.ablaufId,
        erstelleMutationsKanalPlan(
          a.characterId,
          PR20_7_ACQUISITION_SHADOW_CHANNEL_ID,
          PR20_7_ACQUISITION_SHADOW_SOCKET_BUDGET_GEWICHT,
        ),
        a.observedAtMs,
      );

      for (const token of resourceTokens) {
        if (!d.ressourcen.validiereFencing(token, a.observedAtMs)) {
          throw new Error("PR20_7_ACQUISITION_SHADOW_RESOURCE_FENCE_UNGUELTIG");
        }
      }
      if (!d.ressourcen.validiereFencing(
        channel.kanalToken,
        a.observedAtMs,
      )) {
        throw new Error("PR20_7_ACQUISITION_SHADOW_BUY_CHANNEL_FENCE_UNGUELTIG");
      }
      if (!d.socketBudget.validiereReservierung(
        channel.budgetReservierung,
        a.observedAtMs,
      )) {
        throw new Error("PR20_7_ACQUISITION_SHADOW_SOCKET_BUDGET_UNGUELTIG");
      }

      const claims = Object.freeze([
        ...resourceTokens.map(claim),
        claim(channel.kanalToken),
      ]);

      const intent = journalEintrag(
        a,
        1,
        "INTENT",
        a.observedAtMs,
        {
          auftrag_id: a.auftragId,
          ablauf_id: a.ablaufId,
          action_contract_id: PR20_7_ACQUISITION_SHADOW_ACTION_CONTRACT_ID,
          recovery_contract_id: PR20_7_ACQUISITION_SHADOW_RECOVERY_CONTRACT_ID,
          verifier_id: PR20_7_ACQUISITION_SHADOW_VERIFIER_ID,
          attempt_id: a.transaktionsId + ":shadow:1",
          recipient_character_id: a.characterId,
          recipient_session_id: a.sessionId,
          server_region: a.serverRegion,
          server_identifier: a.serverIdentifier,
          item_name: a.itemName,
          quantity: a.quantity,
          unit_price: a.unitPrice,
          exact_cost: PR20_7_ACQUISITION_SHADOW_EXACT_COST,
          observed_gold: a.observedGold,
          safety_reserve: a.safetyReserve,
          gold_reservation_id: goldReservation.reservierungsId,
          inventory_fingerprint: a.inventoryFingerprint,
          gold_fingerprint: a.goldFingerprint,
          vendor_fingerprint: a.vendorFingerprint,
          item_definition_fingerprint: a.itemDefinitionFingerprint,
          resource_claims_and_fencing: claims,
          buy_action_channel_resource_id: channel.kanalToken.ressourcenId,
          socket_budget_reservation_id:
            channel.budgetReservierung.reservierungId,
          one_shot_maximum_uses: 1,
          one_shot_purchase_authority_issued: false,
          send_boundary_state: "NICHT_GESENDET",
          same_intent_retry: false,
          shadow_only: true,
          gameplay_authority: false,
          raw_write_authority: false,
          purchase_authority: false,
        },
      );
      await new PersistVorMutationTor(d.journal).persistiereIntent(intent);

      await d.journal.haengeDurableAn(journalEintrag(
        a,
        2,
        "ABBRUCH",
        a.observedAtMs,
        {
          grund: "PR20_7_ACQUISITION_SHADOW_NACHGEWIESEN_KEIN_SEND",
          gold_reservation_id: goldReservation.reservierungsId,
          buy_action_channel_resource_id: channel.kanalToken.ressourcenId,
          socket_budget_reservation_id:
            channel.budgetReservierung.reservierungId,
          send_boundary_state: "NICHT_GESENDET",
          same_intent_retry: false,
          gameplay_writes: 0,
          public_function_calls: 0,
          raw_write_calls: 0,
          purchase_authority: false,
        },
      ));
      terminalGeschrieben = true;

      return Object.freeze({
        schemaVersion: 1,
        status: "SHADOW_BESTANDEN_KEIN_SEND",
        policyId: PR20_7_ACQUISITION_SHADOW_POLICY_ID,
        transaktionsId: a.transaktionsId,
        exactCost: PR20_7_ACQUISITION_SHADOW_EXACT_COST,
        safetyReserve: a.safetyReserve,
        goldReservationId: goldReservation.reservierungsId,
        resourceClaims: Object.freeze(resourceTokens.map(claim)),
        actionChannelResourceId: channel.kanalToken.ressourcenId,
        socketBudgetReservationId:
          channel.budgetReservierung.reservierungId,
        durableIntent: true,
        journalTerminalArt: "ABBRUCH",
        sendBoundaryState: "NICHT_GESENDET",
        oneShotBindingPrepared: true,
        oneShotMaximumUses: 1,
        oneShotPurchaseAuthorityIssued: false,
        goldBudgetLedgerReservationSatisfied: true,
        inventoryFenceSatisfied: true,
        goldFenceSatisfied: true,
        buyChannelFenceSatisfied: true,
        socketBudgetFenceSatisfied: true,
        gameplayWrites: 0,
        publicFunctionCalls: 0,
        rawWriteCalls: 0,
        purchaseAuthority: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        sameIntentRetry: false,
        normalRuntimeAllowed: false,
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
              a.observedAtMs,
              {
                grund: "PR20_7_ACQUISITION_SHADOW_BLOCKIERT_KEIN_SEND",
                fehler: String(
                  fehler instanceof Error ? fehler.message : fehler,
                ).slice(0, 240),
                send_boundary_state: "NICHT_GESENDET",
                same_intent_retry: false,
                gameplay_writes: 0,
                public_function_calls: 0,
                raw_write_calls: 0,
                purchase_authority: false,
              },
            ));
          }
        } catch {
          // Journalfehler bleibt fail-closed; es existiert kein Send-Adapter.
        }
      }
      throw fehler;
    } finally {
      if (channel !== null) {
        try {
          d.socketBudget.storniere(
            channel.budgetReservierung.reservierungId,
          );
        } catch {
          // Fail-closed: stale Budgetreservierungen erteilen keine Authority.
        }
        try {
          d.ressourcen.gibFrei(channel.kanalToken, a.observedAtMs);
        } catch {
          // Stale Token bleiben durch Fencing wirkungslos.
        }
      }
      for (const token of resourceTokens) {
        try {
          d.ressourcen.gibFrei(token, a.observedAtMs);
        } catch {
          // Stale Token bleiben durch Fencing wirkungslos.
        }
      }
      if (goldReserved) {
        try {
          d.goldBudget.gibFrei(goldReservationId);
        } catch {
          // Fail-closed: eine nicht geloeschte Reservierung erweitert nie Authority.
        }
      }
    }
  }
}
