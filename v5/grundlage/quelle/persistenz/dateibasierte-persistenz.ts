import { kanonischSerialisieren } from "../kern/kanonische-serialisierung.js";
import { parseBegrenztesVersioniertesJson } from "./begrenztes-json.js";
import { validiereJournalFolge } from "./journal.js";
import type {
  CheckpointSpeicherPort,
  DurableBestaetigung,
  DeduplizierungsSpeicherPort,
  JournalBestaetigung,
  KritischeZustellung,
  KritischeZustellungsPort,
  TransaktionsJournalEintrag,
  TransaktionsJournalPort,
  WorkflowCheckpoint,
} from "./ports.js";

export interface PersistenzDateisystemPort {
  schreibeAtomarDurable(
    relativerPfad: string,
    inhalt: string,
    tempKennung: string,
  ): Promise<void>;
  haengeTextDurable(relativerPfad: string, inhalt: string): Promise<void>;
  erstelleExklusivDurable(relativerPfad: string, inhalt: string): Promise<boolean>;
  liesText(relativerPfad: string): Promise<string | undefined>;
}

function sichereKennung(wert: string, art: string): string {
  if (!/^[A-Za-z0-9._:-]{1,180}$/.test(wert)) {
    throw new Error(art + "_KENNUNG_UNGUELTIG");
  }
  return wert.replaceAll(":", "_");
}

function parseJournal(text: string | undefined): readonly TransaktionsJournalEintrag[] {
  if (text === undefined || text.length === 0) return Object.freeze([]);
  if (text.length > 10_000_000) throw new Error("JOURNAL_DATEI_ZU_GROSS");

  const zeilen = text.split("\n").filter(zeile => zeile.length > 0);
  let eintraege: readonly TransaktionsJournalEintrag[] = Object.freeze([]);

  for (const zeile of zeilen) {
    let wert: unknown;
    try {
      wert = JSON.parse(zeile);
    } catch {
      throw new Error("JOURNAL_KORRUPT");
    }
    if (wert === null || typeof wert !== "object" || Array.isArray(wert)) {
      throw new Error("JOURNAL_FORMAT_UNGUELTIG");
    }

    const e = wert as Record<string, unknown>;
    if (e.schemaVersion !== 1
        || typeof e.journalId !== "string"
        || typeof e.transaktionsId !== "string"
        || !Number.isSafeInteger(e.sequenz)
        || typeof e.art !== "string"
        || !Number.isFinite(e.zeitMs)
        || e.inhalt === null
        || typeof e.inhalt !== "object"
        || Array.isArray(e.inhalt)) {
      throw new Error("JOURNAL_EINTRAG_UNGUELTIG");
    }

    eintraege = Object.freeze([
      ...eintraege,
      Object.freeze({
        schemaVersion: 1 as const,
        journalId: e.journalId,
        transaktionsId: e.transaktionsId,
        sequenz: e.sequenz as number,
        art: e.art as TransaktionsJournalEintrag["art"],
        zeitMs: e.zeitMs as number,
        inhalt: Object.freeze({ ...(e.inhalt as Record<string, unknown>) }),
      }),
    ]);
  }

  validiereJournalFolge(eintraege);
  return eintraege;
}

export class DateibasiertesTransaktionsJournal implements TransaktionsJournalPort {
  readonly #dateisystem: PersistenzDateisystemPort;

  public constructor(dateisystem: PersistenzDateisystemPort) {
    this.#dateisystem = dateisystem;
  }

  public async haengeDurableAn(
    eintrag: TransaktionsJournalEintrag,
  ): Promise<JournalBestaetigung> {
    const pfad = this.#pfad(eintrag.transaktionsId);
    const vorhanden = parseJournal(await this.#dateisystem.liesText(pfad));
    const erwartet = vorhanden.length + 1;

    if (eintrag.sequenz !== erwartet) throw new Error("JOURNAL_SEQUENZ_NICHT_ERWARTET");
    validiereJournalFolge(Object.freeze([...vorhanden, eintrag]));

    const zeile = kanonischSerialisieren(eintrag) + "\n";
    await this.#dateisystem.haengeTextDurable(pfad, zeile);

    return Object.freeze({
      durable: true,
      bestaetigungsId: eintrag.journalId,
      journalId: eintrag.journalId,
      transaktionsId: eintrag.transaktionsId,
      sequenz: eintrag.sequenz,
    });
  }

  public async liesTransaktion(
    transaktionsId: string,
  ): Promise<readonly TransaktionsJournalEintrag[]> {
    return parseJournal(await this.#dateisystem.liesText(this.#pfad(transaktionsId)));
  }

  #pfad(transaktionsId: string): string {
    return "runtime/journal/" + sichereKennung(transaktionsId, "TRANSAKTION") + ".jsonl";
  }
}

export class DateibasierterCheckpointSpeicher implements CheckpointSpeicherPort {
  readonly #dateisystem: PersistenzDateisystemPort;

  public constructor(dateisystem: PersistenzDateisystemPort) {
    this.#dateisystem = dateisystem;
  }

  public async speichereDurable<T>(
    checkpoint: WorkflowCheckpoint<T>,
  ): Promise<DurableBestaetigung> {
    const pfad = this.#pfad(checkpoint.workflowId);
    const json = kanonischSerialisieren(checkpoint) + "\n";
    await this.#dateisystem.schreibeAtomarDurable(
      pfad,
      json,
      "checkpoint-" + sichereKennung(checkpoint.checkpointId, "CHECKPOINT"),
    );
    return Object.freeze({
      durable: true,
      bestaetigungsId: checkpoint.checkpointId,
    });
  }

  public async ladeLetzten<T>(
    workflowId: string,
  ): Promise<WorkflowCheckpoint<T> | undefined> {
    const text = await this.#dateisystem.liesText(this.#pfad(workflowId));
    if (text === undefined) return undefined;

    const wert = parseBegrenztesVersioniertesJson(text, {
      maximaleBytes: 2_000_000,
      erlaubteSchemaVersionen: [1],
    });

    if (typeof wert.workflowId !== "string"
        || typeof wert.checkpointId !== "string"
        || typeof wert.status !== "string"
        || !Number.isSafeInteger(wert.sequenz)
        || !Number.isFinite(wert.zeitMs)
        || !("zustand" in wert)) {
      throw new Error("CHECKPOINT_FORMAT_UNGUELTIG");
    }

    return Object.freeze({
      schemaVersion: 1,
      workflowId: wert.workflowId,
      checkpointId: wert.checkpointId,
      status: wert.status as WorkflowCheckpoint<T>["status"],
      sequenz: wert.sequenz as number,
      zeitMs: wert.zeitMs as number,
      zustand: wert.zustand as T,
    });
  }

  #pfad(workflowId: string): string {
    return "runtime/checkpoints/" + sichereKennung(workflowId, "WORKFLOW") + ".json";
  }
}

export class DateibasierterDeduplizierungsSpeicher implements DeduplizierungsSpeicherPort {
  readonly #dateisystem: PersistenzDateisystemPort;

  public constructor(dateisystem: PersistenzDateisystemPort) {
    this.#dateisystem = dateisystem;
  }

  public async istVerarbeitet(evidenceId: string): Promise<boolean> {
    return (await this.#dateisystem.liesText(this.#pfad(evidenceId))) !== undefined;
  }

  public async claimVerarbeitetDurable(
    evidenceId: string,
  ): Promise<{ readonly neu: boolean; readonly bestaetigung: DurableBestaetigung }> {
    const inhalt = kanonischSerialisieren({
      schemaVersion: 1,
      evidenceId,
    }) + "\n";
    const neu = await this.#dateisystem.erstelleExklusivDurable(
      this.#pfad(evidenceId),
      inhalt,
    );
    return Object.freeze({
      neu,
      bestaetigung: Object.freeze({
        durable: true,
        bestaetigungsId: "DEDUPE:" + evidenceId,
      }),
    });
  }

  #pfad(evidenceId: string): string {
    return "runtime/dedupe/" + sichereKennung(evidenceId, "EVIDENCE") + ".claim";
  }
}

export class DateibasierterKritischerZustellungsSpeicher implements KritischeZustellungsPort {
  readonly #dateisystem: PersistenzDateisystemPort;

  public constructor(dateisystem: PersistenzDateisystemPort) {
    this.#dateisystem = dateisystem;
  }

  public async speichereOutboxDurable(
    zustellung: KritischeZustellung,
  ): Promise<DurableBestaetigung> {
    const pfad = this.#outboxPfad(zustellung.zustellId);
    const json = kanonischSerialisieren(zustellung) + "\n";
    const alt = await this.#dateisystem.liesText(pfad);

    if (alt !== undefined && alt !== json) {
      throw new Error("OUTBOX_ID_KOLLISION");
    }
    if (alt === undefined) {
      await this.#dateisystem.schreibeAtomarDurable(
        pfad,
        json,
        "outbox-" + sichereKennung(zustellung.zustellId, "ZUSTELLUNG"),
      );
    }
    return Object.freeze({
      durable: true,
      bestaetigungsId: "OUTBOX:" + zustellung.zustellId,
    });
  }

  public async markiereZugestelltDurable(
    zustellId: string,
  ): Promise<DurableBestaetigung> {
    await this.#dateisystem.erstelleExklusivDurable(
      this.#outboxPfad(zustellId) + ".zugestellt",
      kanonischSerialisieren({ schemaVersion: 1, zustellId, zugestellt: true }) + "\n",
    );
    return Object.freeze({
      durable: true,
      bestaetigungsId: "OUTBOX_ZUGESTELLT:" + zustellId,
    });
  }

  public async claimInboxDurable(
    zustellung: KritischeZustellung,
  ): Promise<{ readonly neu: boolean; readonly bestaetigung: DurableBestaetigung }> {
    const neu = await this.#dateisystem.erstelleExklusivDurable(
      "runtime/inbox/" + sichereKennung(zustellung.dedupeSchluessel, "DEDUPE") + ".claim",
      kanonischSerialisieren(zustellung) + "\n",
    );
    return Object.freeze({
      neu,
      bestaetigung: Object.freeze({
        durable: true,
        bestaetigungsId: "INBOX:" + zustellung.dedupeSchluessel,
      }),
    });
  }

  #outboxPfad(zustellId: string): string {
    return "runtime/outbox/" + sichereKennung(zustellId, "ZUSTELLUNG") + ".json";
  }
}
