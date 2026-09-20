import type { DurableIntentToken } from "../persistenz/journal.js";
import type { TransaktionsJournalEintrag } from "../persistenz/ports.js";

export interface ErwarteteIntentBindung {
  readonly transaktionsId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly faehigkeitId: string;
  readonly eigentuemerModulId: string;
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly verifierId: string;
}

export interface DurablerIntentNachweis extends ErwarteteIntentBindung {
  readonly schemaVersion: 1;
  readonly journalId: string;
  readonly sequenz: number;
  readonly durable: true;
}

function liesText(
  inhalt: Readonly<Record<string, unknown>>,
  feld: string,
): string {
  const wert = inhalt[feld];
  if (typeof wert !== "string" || wert.trim().length === 0 || wert.length > 192) {
    throw new Error("INTENT_FELD_UNGUELTIG:" + feld);
  }
  return wert;
}

export function bindeDurablesIntent(
  token: DurableIntentToken,
  intent: TransaktionsJournalEintrag,
  erwartet: ErwarteteIntentBindung,
): DurablerIntentNachweis {
  if (token.schemaVersion !== 1 || token.durable !== true) {
    throw new Error("DURABLE_INTENT_TOKEN_UNGUELTIG");
  }
  if (intent.schemaVersion !== 1 || intent.art !== "INTENT") {
    throw new Error("DURABLE_INTENT_EINTRAG_UNGUELTIG");
  }
  if (token.transaktionsId !== intent.transaktionsId
      || token.journalId !== intent.journalId
      || token.sequenz !== intent.sequenz) {
    throw new Error("DURABLE_INTENT_TOKEN_STIMMT_NICHT");
  }
  if (intent.transaktionsId !== erwartet.transaktionsId) {
    throw new Error("DURABLE_INTENT_TRANSAKTION_STIMMT_NICHT");
  }

  const bindungen: ReadonlyArray<readonly [string, string]> = Object.freeze([
    ["auftrag_id", erwartet.auftragId],
    ["ablauf_id", erwartet.ablaufId],
    ["faehigkeit_id", erwartet.faehigkeitId],
    ["owner_id", erwartet.eigentuemerModulId],
    ["action_contract_id", erwartet.actionContractId],
    ["recovery_contract_id", erwartet.recoveryContractId],
    ["verifier_id", erwartet.verifierId],
  ]);

  for (const [feld, soll] of bindungen) {
    if (liesText(intent.inhalt, feld) !== soll) {
      throw new Error("DURABLE_INTENT_BINDUNG_STIMMT_NICHT:" + feld);
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    ...erwartet,
    journalId: token.journalId,
    sequenz: token.sequenz,
    durable: true,
  });
}
