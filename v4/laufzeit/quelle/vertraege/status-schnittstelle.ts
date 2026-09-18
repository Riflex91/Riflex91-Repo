import type { AktionsWichtigkeit } from './aktions-anfrage.js';
import type { AktionsLaufPhase, AktionsLaufZustand } from './aktions-steuerung.js';
import type { BotMeldung, MeldungsStufe } from './bot-meldung.js';
import type { EntscheidungsDatensatz } from './entscheidungs-datensatz.js';
import type {
  GruppenAufgabenZuordnung,
  GruppenBetriebsArt,
  GruppenKoordinationsEntscheidung,
  GruppenTeilnehmerStatus
} from './gruppen-koordination.js';
import type { KampfGefahrenStufe } from './kampfsicherheit.js';
import type {
  RecoveryCheckpointLadeErgebnis,
  RecoveryCheckpointLadeStatus,
  RecoveryCheckpointSlot
} from './recovery-checkpoint.js';
import type {
  GruppenLivenessStatus,
  RecoveryStufe,
  RuntimeGesundheitsZustand
} from './runtime-gesundheit.js';
import type {
  Spielzustand,
  WertZustand,
  WissensQuelle
} from './spielzustand.js';

export interface StatusWert<TWert> {
  readonly zustand: WertZustand;
  readonly quelle: WissensQuelle | null;
  readonly sicherheit: number | null;
  readonly wert: TWert | null;
  readonly grund: string | null;
}

export interface StatusCharakterSicht {
  readonly verfuegbar: boolean;
  readonly kennung: StatusWert<string>;
  readonly name: StatusWert<string>;
  readonly klasse: StatusWert<string>;
  readonly stufe: StatusWert<number>;
  readonly leben: StatusWert<number>;
  readonly lebenMaximal: StatusWert<number>;
  readonly mana: StatusWert<number>;
  readonly manaMaximal: StatusWert<number>;
  readonly karte: StatusWert<string>;
  readonly instanz: StatusWert<string>;
  readonly tot: StatusWert<boolean | null>;
}

export interface StatusRuntimeSicht {
  readonly recoveryStufe: RecoveryStufe;
  readonly grund: string;
  readonly gruende: readonly string[];
  readonly snapshotAlterMillisekunden: number | null;
  readonly heartbeatAlterMillisekunden: number | null;
  readonly fachlicherFortschrittAlterMillisekunden: number | null;
  readonly gruppenLiveness: GruppenLivenessStatus;
  readonly sicherheitsStufe: KampfGefahrenStufe;
  readonly offeneAktionsAnfragen: number;
  readonly abgebrocheneAktionsAnfragen: number;
  readonly mussNutzerHandeln: boolean;
  readonly hostNeustartEmpfohlen: boolean;
  readonly automatischerNeustart: false;
}

export interface StatusGruppenTeilnehmerSicht {
  readonly charakterKennung: string;
  readonly status: GruppenTeilnehmerStatus;
  readonly grund: string;
  readonly alterMillisekunden: number;
}

export interface StatusGruppeSicht {
  readonly verfuegbar: boolean;
  readonly eigenerTeilnehmerKennung: string | null;
  readonly betriebsArt: GruppenBetriebsArt | null;
  readonly grund: string | null;
  readonly gemeinsameGefahrenStufe: KampfGefahrenStufe | null;
  readonly gemeinsamesZielKennung: string | null;
  readonly aktiveTeilnehmerKennungen: readonly string[];
  readonly teilnehmer: readonly StatusGruppenTeilnehmerSicht[];
  readonly aufgaben: GruppenAufgabenZuordnung | null;
}

export interface StatusEntscheidungSicht {
  readonly entscheidungKennung: string;
  readonly art: string;
  readonly quelle: string;
  readonly gewaehlteEntscheidung: string;
  readonly grund: string;
  readonly fachlicherFingerabdruck: string;
  readonly aktionsAnfrageKennungen: readonly string[];
}

export interface StatusAktionSicht {
  readonly kennung: string;
  readonly aktion: string;
  readonly phase: AktionsLaufPhase;
  readonly wichtigkeit: AktionsWichtigkeit;
  readonly prioritaet: number;
  readonly grund: string;
  readonly ressourcen: readonly string[];
}

export interface StatusCheckpointSicht {
  readonly ladeStatus: RecoveryCheckpointLadeStatus;
  readonly grund: string;
  readonly slot: RecoveryCheckpointSlot | null;
  readonly fallbackVerwendet: boolean;
  readonly sequenz: number | null;
  readonly gespeichertAm: number | null;
  readonly wiederaufnahmeErlaubt: false | null;
  readonly abgleichErforderlich: true | null;
  readonly aktionsAutoritaet: false | null;
  readonly offeneAktionsAnfrageKennungen: readonly string[];
}

export interface StatusMeldungSicht {
  readonly kennung: string;
  readonly zeitpunkt: number;
  readonly stufe: MeldungsStufe;
  readonly meldungsCode: string;
  readonly titel: string;
  readonly wasIstPassiert: string;
  readonly warumIstEsPassiert: string;
  readonly wasHatDerBotGetan: string;
  readonly mussNutzerHandeln: boolean;
  readonly wasSollDerNutzerTun: string;
}

export interface GemeinsameStatusSicht {
  readonly schemaVersion: 1;
  readonly erstelltAm: number;
  readonly spielzustandLaufendeNummer: number;
  readonly spielzustandAufgenommenAm: number;
  readonly ablaufKennung: string;
  readonly nurLesen: true;
  readonly spielAutoritaet: false;
  readonly bedienAutoritaet: false;
  readonly neustartAutoritaet: false;
  readonly charakter: StatusCharakterSicht;
  readonly runtime: StatusRuntimeSicht;
  readonly gruppe: StatusGruppeSicht;
  readonly entscheidung: StatusEntscheidungSicht | null;
  readonly aktionen: readonly StatusAktionSicht[];
  readonly checkpoint: StatusCheckpointSicht;
  readonly letzteMeldung: StatusMeldungSicht | null;
}

export interface StatusSchnittstellenEingabe {
  readonly zeitpunkt: number;
  readonly spielzustand: Spielzustand;
  readonly runtimeGesundheit: RuntimeGesundheitsZustand;
  readonly gruppenEntscheidung: GruppenKoordinationsEntscheidung | null;
  readonly entscheidungsDatensatz: EntscheidungsDatensatz | null;
  readonly aktionsZustaende: readonly AktionsLaufZustand[];
  readonly recoveryCheckpoint: RecoveryCheckpointLadeErgebnis;
  readonly letzteMeldung: BotMeldung | null;
}

export interface StatusSchnittstelle {
  lese(eingabe: StatusSchnittstellenEingabe): GemeinsameStatusSicht;
}
