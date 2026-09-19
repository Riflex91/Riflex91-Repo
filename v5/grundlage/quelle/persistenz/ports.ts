export interface DurableBestaetigung {
  readonly durable: true;
  readonly bestaetigungsId: string;
}

export interface VersionierterPersistenzDatensatz<T> {
  readonly schemaVersion: number;
  readonly datensatzId: string;
  readonly art: string;
  readonly inhalt: T;
}

export interface PersistenzPort {
  speichereDurable<T>(
    datensatz: VersionierterPersistenzDatensatz<T>,
  ): Promise<DurableBestaetigung>;
  lade<T>(datensatzId: string): Promise<VersionierterPersistenzDatensatz<T> | undefined>;
}

export type JournalArt =
  | "INTENT"
  | "SERVER_ERGEBNIS"
  | "POSTCONDITION"
  | "COMMIT"
  | "UNBEKANNT"
  | "ABBRUCH"
  | "SICHER_FEHLGESCHLAGEN";

export interface TransaktionsJournalEintrag {
  readonly schemaVersion: 1;
  readonly journalId: string;
  readonly transaktionsId: string;
  readonly sequenz: number;
  readonly art: JournalArt;
  readonly zeitMs: number;
  readonly inhalt: Readonly<Record<string, unknown>>;
}

export interface JournalBestaetigung extends DurableBestaetigung {
  readonly journalId: string;
  readonly transaktionsId: string;
  readonly sequenz: number;
}

export interface TransaktionsJournalPort {
  haengeDurableAn(
    eintrag: TransaktionsJournalEintrag,
  ): Promise<JournalBestaetigung>;
  liesTransaktion(
    transaktionsId: string,
  ): Promise<readonly TransaktionsJournalEintrag[]>;
}

export type CheckpointStatus =
  | "NICHT_TERMINAL"
  | "ABGESCHLOSSEN"
  | "ABGEBROCHEN"
  | "SICHER_FEHLGESCHLAGEN"
  | "BEDIENER_ERFORDERLICH";

export interface WorkflowCheckpoint<T> {
  readonly schemaVersion: 1;
  readonly workflowId: string;
  readonly checkpointId: string;
  readonly status: CheckpointStatus;
  readonly sequenz: number;
  readonly zeitMs: number;
  readonly zustand: T;
}

export interface CheckpointSpeicherPort {
  speichereDurable<T>(
    checkpoint: WorkflowCheckpoint<T>,
  ): Promise<DurableBestaetigung>;
  ladeLetzten<T>(workflowId: string): Promise<WorkflowCheckpoint<T> | undefined>;
}

export interface LiveWissensFaktDatei {
  readonly relativerPfad: string;
  readonly json: string;
}

export interface LiveWissensGeneration {
  readonly schemaVersion: 1;
  readonly generation: number;
  readonly aktualisiertAm: string;
  readonly fakten: readonly LiveWissensFaktDatei[];
}

export interface LiveWissensSchreibErgebnis extends DurableBestaetigung {
  readonly generation: number;
  readonly zustand: "BEREIT";
  readonly dateien: number;
}

export interface LiveWissensSpeicherPort {
  schreibeGenerationDurable(
    generation: LiveWissensGeneration,
  ): Promise<LiveWissensSchreibErgebnis>;
}

export interface ReplaySpeicherPort {
  speichereReplayDurable(
    replayId: string,
    kanonischesJson: string,
  ): Promise<DurableBestaetigung>;
}

export interface TelemetrieSpeicherPort {
  reiheTelemetrieEin(
    datensatzId: string,
    kanonischesJson: string,
  ): boolean;
}

export interface ZertifizierungsEvidencePort {
  speichereEvidenceDurable(
    evidenceId: string,
    kanonischesJson: string,
  ): Promise<DurableBestaetigung>;
}

export interface SpeicherGesundheit {
  readonly vorhanden: boolean;
  readonly bereit: boolean;
  readonly beschreibbar: boolean;
  readonly laufwerk: string;
  readonly volumeId: string;
  readonly medientyp: "SSD" | "HDD" | "UNBEKANNT";
  readonly gesamtBytes: number;
  readonly freiBytes: number;
}

export interface SpeicherGesundheitsPort {
  liesGesundheit(): Promise<SpeicherGesundheit>;
}

export interface DeduplizierungsSpeicherPort {
  istVerarbeitet(evidenceId: string): Promise<boolean>;
  claimVerarbeitetDurable(
    evidenceId: string,
  ): Promise<{ readonly neu: boolean; readonly bestaetigung: DurableBestaetigung }>;
}

export interface KritischeZustellung {
  readonly schemaVersion: 1;
  readonly zustellId: string;
  readonly dedupeSchluessel: string;
  readonly ziel: string;
  readonly inhalt: Readonly<Record<string, unknown>>;
}

export interface KritischeZustellungsPort {
  speichereOutboxDurable(
    zustellung: KritischeZustellung,
  ): Promise<DurableBestaetigung>;
  markiereZugestelltDurable(
    zustellId: string,
  ): Promise<DurableBestaetigung>;
  claimInboxDurable(
    zustellung: KritischeZustellung,
  ): Promise<{ readonly neu: boolean; readonly bestaetigung: DurableBestaetigung }>;
}
