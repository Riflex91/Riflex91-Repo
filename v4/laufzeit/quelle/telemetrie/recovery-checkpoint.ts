import type { SchluesselWertSpeicher } from '../vertraege/telemetrie.js';
import {
  RECOVERY_CHECKPOINT_SCHEMA_VERSION,
  RECOVERY_CHECKPOINT_SLOTS,
  type RecoveryCheckpointHuelle,
  type RecoveryCheckpointInhalt,
  type RecoveryCheckpointLadeErgebnis,
  type RecoveryCheckpointNutzlast,
  type RecoveryCheckpointSlot,
  type RecoveryCheckpointSpeicherErgebnis
} from '../vertraege/recovery-checkpoint.js';
import { RECOVERY_STUFEN } from '../vertraege/runtime-gesundheit.js';
import { berechneSha256 } from './sha256.js';
import { kanonisiereJson } from '../wiederholung/kanonisches-json.js';

const STANDARD_MAX_BYTES = 120_000;
const STANDARD_BASIS_SCHLUESSEL = 'aio-v4-recovery-checkpoint';

export interface RecoveryCheckpointSpeicherOptionen {
  readonly basisSchluessel?: string;
  readonly maxBytes?: number;
}

interface DekodiertesSlot {
  readonly slot: RecoveryCheckpointSlot;
  readonly rohVorhanden: boolean;
  readonly checkpoint: RecoveryCheckpointNutzlast | null;
}

function pruefeText(name: string, wert: string): void {
  if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss endlich und nichtnegativ sein.`);
}

function pruefeCheckpointInhalt(inhalt: RecoveryCheckpointInhalt): void {
  if (inhalt.schemaVersion !== RECOVERY_CHECKPOINT_SCHEMA_VERSION) {
    throw new Error('RecoveryCheckpointInhalt besitzt eine unbekannte schemaVersion.');
  }
  pruefeText('charakterKennung', inhalt.charakterKennung);
  pruefeText('ablaufKennung', inhalt.ablaufKennung);
  if (inhalt.entscheidungKennung !== null) pruefeText('entscheidungKennung', inhalt.entscheidungKennung);
  if (
    inhalt.fachlicherFingerabdruck !== null &&
    !/^[a-f0-9]{64}$/.test(inhalt.fachlicherFingerabdruck)
  ) {
    throw new Error('fachlicherFingerabdruck muss null oder ein gueltiger SHA-256-Wert sein.');
  }
  if (!RECOVERY_STUFEN.includes(inhalt.recoveryStufe)) {
    throw new Error('RecoveryCheckpointInhalt besitzt eine unbekannte recoveryStufe.');
  }
  for (const kennung of inhalt.offeneAktionsAnfrageKennungen) pruefeText('offeneAktionsAnfrageKennung', kennung);
  if (
    inhalt.letzteEreignisNummer !== null &&
    (!Number.isSafeInteger(inhalt.letzteEreignisNummer) || inhalt.letzteEreignisNummer < 0)
  ) {
    throw new Error('letzteEreignisNummer muss null oder eine nichtnegative ganze Zahl sein.');
  }
}

function normalisiereInhalt(inhalt: RecoveryCheckpointInhalt): RecoveryCheckpointInhalt {
  pruefeCheckpointInhalt(inhalt);
  return Object.freeze({
    schemaVersion: RECOVERY_CHECKPOINT_SCHEMA_VERSION,
    charakterKennung: inhalt.charakterKennung,
    ablaufKennung: inhalt.ablaufKennung,
    entscheidungKennung: inhalt.entscheidungKennung,
    fachlicherFingerabdruck: inhalt.fachlicherFingerabdruck,
    recoveryStufe: inhalt.recoveryStufe,
    offeneAktionsAnfrageKennungen: Object.freeze(
      [...new Set(inhalt.offeneAktionsAnfrageKennungen)].sort()
    ),
    letzteEreignisNummer: inhalt.letzteEreignisNummer
  });
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function parseCheckpointNutzlast(serialisiert: string): RecoveryCheckpointNutzlast | null {
  let roh: unknown;
  try {
    roh = JSON.parse(serialisiert);
  } catch {
    return null;
  }
  if (!istObjekt(roh)) return null;
  if (roh.schemaVersion !== RECOVERY_CHECKPOINT_SCHEMA_VERSION) return null;
  if (!Number.isSafeInteger(roh.sequenz) || Number(roh.sequenz) <= 0) return null;
  if (typeof roh.gespeichertAm !== 'number' || !Number.isFinite(roh.gespeichertAm) || roh.gespeichertAm < 0) return null;
  if (typeof roh.grund !== 'string' || roh.grund.trim().length === 0) return null;
  if (roh.wiederaufnahmeErlaubt !== false) return null;
  if (roh.abgleichErforderlich !== true) return null;
  if (roh.aktionsAutoritaet !== false) return null;
  if (!istObjekt(roh.inhalt)) return null;

  const roheInhalt = roh.inhalt;
  if (roheInhalt.schemaVersion !== RECOVERY_CHECKPOINT_SCHEMA_VERSION) return null;
  if (typeof roheInhalt.charakterKennung !== 'string' || roheInhalt.charakterKennung.trim().length === 0) return null;
  if (typeof roheInhalt.ablaufKennung !== 'string' || roheInhalt.ablaufKennung.trim().length === 0) return null;
  if (
    roheInhalt.entscheidungKennung !== null &&
    (typeof roheInhalt.entscheidungKennung !== 'string' || roheInhalt.entscheidungKennung.trim().length === 0)
  ) return null;
  if (
    roheInhalt.fachlicherFingerabdruck !== null &&
    (typeof roheInhalt.fachlicherFingerabdruck !== 'string' || !/^[a-f0-9]{64}$/.test(roheInhalt.fachlicherFingerabdruck))
  ) return null;
  if (typeof roheInhalt.recoveryStufe !== 'string' || !RECOVERY_STUFEN.includes(roheInhalt.recoveryStufe as never)) return null;
  if (!Array.isArray(roheInhalt.offeneAktionsAnfrageKennungen)) return null;
  if (
    roheInhalt.offeneAktionsAnfrageKennungen.some(
      (kennung) => typeof kennung !== 'string' || kennung.trim().length === 0
    )
  ) return null;
  if (
    roheInhalt.letzteEreignisNummer !== null &&
    (!Number.isSafeInteger(roheInhalt.letzteEreignisNummer) || Number(roheInhalt.letzteEreignisNummer) < 0)
  ) return null;

  return Object.freeze({
    schemaVersion: RECOVERY_CHECKPOINT_SCHEMA_VERSION,
    sequenz: Number(roh.sequenz),
    gespeichertAm: Number(roh.gespeichertAm),
    grund: roh.grund,
    wiederaufnahmeErlaubt: false,
    abgleichErforderlich: true,
    aktionsAutoritaet: false,
    inhalt: normalisiereInhalt({
      schemaVersion: RECOVERY_CHECKPOINT_SCHEMA_VERSION,
      charakterKennung: roheInhalt.charakterKennung,
      ablaufKennung: roheInhalt.ablaufKennung,
      entscheidungKennung: roheInhalt.entscheidungKennung as string | null,
      fachlicherFingerabdruck: roheInhalt.fachlicherFingerabdruck as string | null,
      recoveryStufe: roheInhalt.recoveryStufe as RecoveryCheckpointInhalt['recoveryStufe'],
      offeneAktionsAnfrageKennungen: roheInhalt.offeneAktionsAnfrageKennungen as string[],
      letzteEreignisNummer: roheInhalt.letzteEreignisNummer as number | null
    })
  });
}

export class RecoveryCheckpointSpeicher {
  private readonly basisSchluessel: string;
  private readonly maxBytes: number;

  constructor(
    private readonly speicher: SchluesselWertSpeicher,
    optionen: RecoveryCheckpointSpeicherOptionen = {}
  ) {
    this.basisSchluessel = optionen.basisSchluessel ?? STANDARD_BASIS_SCHLUESSEL;
    pruefeText('basisSchluessel', this.basisSchluessel);
    this.maxBytes = optionen.maxBytes ?? STANDARD_MAX_BYTES;
    if (!Number.isSafeInteger(this.maxBytes) || this.maxBytes <= 0) {
      throw new Error('maxBytes muss eine positive ganze Zahl sein.');
    }
  }

  speichere(
    inhalt: RecoveryCheckpointInhalt,
    gespeichertAm: number,
    grund: string
  ): RecoveryCheckpointSpeicherErgebnis {
    pruefeZeitpunkt('gespeichertAm', gespeichertAm);
    pruefeText('grund', grund);
    const normalisiert = normalisiereInhalt(inhalt);

    const vorhandene = RECOVERY_CHECKPOINT_SLOTS
      .map((slot) => this.dekodiereSlot(slot))
      .map((eintrag) => eintrag.checkpoint)
      .filter((checkpoint): checkpoint is RecoveryCheckpointNutzlast => checkpoint !== null);
    const sequenz = (vorhandene.length > 0
      ? Math.max(...vorhandene.map((checkpoint) => checkpoint.sequenz))
      : 0) + 1;

    const zeiger = this.leseZeiger();
    const slot: RecoveryCheckpointSlot = zeiger === 'A' ? 'B' : 'A';
    const nutzlast: RecoveryCheckpointNutzlast = Object.freeze({
      schemaVersion: RECOVERY_CHECKPOINT_SCHEMA_VERSION,
      sequenz,
      gespeichertAm,
      grund,
      wiederaufnahmeErlaubt: false,
      abgleichErforderlich: true,
      aktionsAutoritaet: false,
      inhalt: normalisiert
    });
    const serialisiert = kanonisiereJson(nutzlast);
    const huelle: RecoveryCheckpointHuelle = Object.freeze({
      schemaVersion: RECOVERY_CHECKPOINT_SCHEMA_VERSION,
      sha256: berechneSha256(serialisiert),
      serialisiert
    });
    const huelleText = JSON.stringify(huelle);
    const bytes = new TextEncoder().encode(huelleText).byteLength;

    if (bytes > this.maxBytes) {
      return Object.freeze({
        status: 'zu_gross',
        grund: `Recovery-Checkpoint benoetigt ${bytes} Bytes und ueberschreitet maxBytes=${this.maxBytes}.`,
        slot: null,
        sequenz: null,
        bytes
      });
    }

    try {
      this.speicher.setItem(this.slotSchluessel(slot), huelleText);
      this.speicher.setItem(this.zeigerSchluessel(), slot);
      return Object.freeze({
        status: 'gespeichert',
        grund: 'Recovery-Checkpoint wurde integritaetsgesichert gespeichert; Wiederaufnahme bleibt gesperrt bis zum Abgleich.',
        slot,
        sequenz,
        bytes
      });
    } catch (fehler) {
      return Object.freeze({
        status: 'speicher_fehler',
        grund: `Recovery-Checkpoint konnte nicht dauerhaft gespeichert werden: ${fehler instanceof Error ? fehler.message : String(fehler)}`,
        slot: null,
        sequenz: null,
        bytes
      });
    }
  }

  lade(): RecoveryCheckpointLadeErgebnis {
    const zeiger = this.leseZeiger();
    const slots = RECOVERY_CHECKPOINT_SLOTS.map((slot) => this.dekodiereSlot(slot));
    const rohVorhanden = slots.some((eintrag) => eintrag.rohVorhanden);

    if (!rohVorhanden) {
      return Object.freeze({
        status: 'nicht_vorhanden',
        grund: 'Kein Recovery-Checkpoint ist gespeichert.',
        slot: null,
        fallbackVerwendet: false,
        checkpoint: null
      });
    }

    const gueltige = slots.filter(
      (eintrag): eintrag is DekodiertesSlot & { readonly checkpoint: RecoveryCheckpointNutzlast } =>
        eintrag.checkpoint !== null
    );
    if (gueltige.length === 0) {
      return Object.freeze({
        status: 'beschaedigt',
        grund: 'Gespeicherte Recovery-Checkpoint-Daten sind unvollstaendig, ungueltig oder ihre Integritaetspruefung ist fehlgeschlagen.',
        slot: null,
        fallbackVerwendet: false,
        checkpoint: null
      });
    }

    let ausgewaehlt: DekodiertesSlot & { readonly checkpoint: RecoveryCheckpointNutzlast };
    let fallbackVerwendet = false;
    const zeigerTreffer = gueltige.find((eintrag) => eintrag.slot === zeiger);
    if (zeigerTreffer !== undefined) {
      ausgewaehlt = zeigerTreffer;
    } else {
      ausgewaehlt = [...gueltige].sort(
        (links, rechts) => rechts.checkpoint.sequenz - links.checkpoint.sequenz
      )[0]!;
      fallbackVerwendet = zeiger !== null;
    }

    return Object.freeze({
      status: 'geladen',
      grund: fallbackVerwendet
        ? 'Der aktuelle Checkpoint-Slot war nicht gueltig; ein integritaetsgepruefter Fallback wurde geladen. Wiederaufnahme bleibt gesperrt bis zum Abgleich.'
        : 'Integritaetsgepruefter Recovery-Checkpoint wurde geladen. Wiederaufnahme bleibt gesperrt bis zum Abgleich.',
      slot: ausgewaehlt.slot,
      fallbackVerwendet,
      checkpoint: ausgewaehlt.checkpoint
    });
  }

  private leseZeiger(): RecoveryCheckpointSlot | null {
    try {
      const wert = this.speicher.getItem(this.zeigerSchluessel());
      return wert === 'A' || wert === 'B' ? wert : null;
    } catch {
      return null;
    }
  }

  private dekodiereSlot(slot: RecoveryCheckpointSlot): DekodiertesSlot {
    let roh: string | null;
    try {
      roh = this.speicher.getItem(this.slotSchluessel(slot));
    } catch {
      return Object.freeze({ slot, rohVorhanden: false, checkpoint: null });
    }
    if (roh === null || roh.length === 0) {
      return Object.freeze({ slot, rohVorhanden: false, checkpoint: null });
    }

    let huelle: unknown;
    try {
      huelle = JSON.parse(roh);
    } catch {
      return Object.freeze({ slot, rohVorhanden: true, checkpoint: null });
    }
    if (!istObjekt(huelle)) return Object.freeze({ slot, rohVorhanden: true, checkpoint: null });
    if (huelle.schemaVersion !== RECOVERY_CHECKPOINT_SCHEMA_VERSION) {
      return Object.freeze({ slot, rohVorhanden: true, checkpoint: null });
    }
    if (typeof huelle.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(huelle.sha256)) {
      return Object.freeze({ slot, rohVorhanden: true, checkpoint: null });
    }
    if (typeof huelle.serialisiert !== 'string') {
      return Object.freeze({ slot, rohVorhanden: true, checkpoint: null });
    }
    if (berechneSha256(huelle.serialisiert) !== huelle.sha256) {
      return Object.freeze({ slot, rohVorhanden: true, checkpoint: null });
    }

    return Object.freeze({
      slot,
      rohVorhanden: true,
      checkpoint: parseCheckpointNutzlast(huelle.serialisiert)
    });
  }

  private slotSchluessel(slot: RecoveryCheckpointSlot): string {
    return `${this.basisSchluessel}:${slot}`;
  }

  private zeigerSchluessel(): string {
    return `${this.basisSchluessel}:zeiger`;
  }
}
