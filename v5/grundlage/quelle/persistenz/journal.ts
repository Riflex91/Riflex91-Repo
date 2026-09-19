import type {
  JournalBestaetigung,
  TransaktionsJournalEintrag,
  TransaktionsJournalPort,
} from "./ports.js";

export interface DurableIntentToken {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly journalId: string;
  readonly sequenz: number;
  readonly durable: true;
}

export class PersistVorMutationTor {
  readonly #journal: TransaktionsJournalPort;

  public constructor(journal: TransaktionsJournalPort) {
    this.#journal = journal;
  }

  public async persistiereIntent(
    intent: TransaktionsJournalEintrag,
  ): Promise<DurableIntentToken> {
    if (intent.art !== "INTENT") {
      throw new Error("PERSIST_VOR_MUTATION_BRAUCHT_INTENT");
    }

    const bestaetigung: JournalBestaetigung =
      await this.#journal.haengeDurableAn(intent);

    if (bestaetigung.durable !== true
        || bestaetigung.transaktionsId !== intent.transaktionsId
        || bestaetigung.journalId !== intent.journalId
        || bestaetigung.sequenz !== intent.sequenz) {
      throw new Error("JOURNAL_DURABILITY_NICHT_BESTAETIGT");
    }

    return Object.freeze({
      schemaVersion: 1,
      transaktionsId: intent.transaktionsId,
      journalId: intent.journalId,
      sequenz: intent.sequenz,
      durable: true,
    });
  }
}

export function validiereJournalFolge(
  eintraege: readonly TransaktionsJournalEintrag[],
): void {
  if (eintraege.length === 0) return;

  const transaktionsId = eintraege[0]?.transaktionsId;
  let erwarteteSequenz = 1;
  let intentGesehen = false;
  let terminalGesehen = false;

  for (const eintrag of eintraege) {
    if (eintrag.schemaVersion !== 1) throw new Error("JOURNAL_SCHEMA_UNGUELTIG");
    if (eintrag.transaktionsId !== transaktionsId) throw new Error("JOURNAL_TRANSAKTION_GEMISCHT");
    if (eintrag.sequenz !== erwarteteSequenz) throw new Error("JOURNAL_SEQUENZ_LUECKE");
    if (!Number.isFinite(eintrag.zeitMs)) throw new Error("JOURNAL_ZEIT_UNGUELTIG");
    if (terminalGesehen) throw new Error("JOURNAL_EINTRAG_NACH_TERMINAL");

    if (eintrag.art === "INTENT") {
      if (intentGesehen || eintrag.sequenz !== 1) throw new Error("JOURNAL_INTENT_POSITION_UNGUELTIG");
      intentGesehen = true;
    } else if (!intentGesehen) {
      throw new Error("JOURNAL_OHNE_INTENT");
    }

    if (["COMMIT","ABBRUCH","SICHER_FEHLGESCHLAGEN"].includes(eintrag.art)) {
      terminalGesehen = true;
    }

    erwarteteSequenz += 1;
  }
}
