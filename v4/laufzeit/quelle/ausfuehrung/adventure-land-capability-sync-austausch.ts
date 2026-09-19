import {
  CAPABILITY_SYNC_PROTOKOLL,
  type CapabilitySyncEmpfang,
  type CapabilitySyncSendeErgebnis,
  type CapabilitySyncSnapshot,
  type CapabilitySyncUmschlag
} from '../vertraege/capability-sync.js';
import { liesCapabilitySyncSnapshot } from '../spiellogik/capability-sync.js';
import type { AdventureLandGruppenKommunikationsFenster } from './adventure-land-gruppen-lebensnachweis-austausch.js';

export interface AdventureLandCapabilitySyncOptionen {
  readonly aktivFreigegeben?: boolean;
  readonly vertrauensNamen: readonly string[];
  readonly jetzt: () => number;
}

type CapabilityEmpfaenger = (empfang: CapabilitySyncEmpfang) => void;
type CmEmpfaenger = (absender: unknown, daten: unknown) => unknown;

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function saubererName(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const name = wert.trim();
  return name.length > 0 ? name : null;
}

function bestaetigteCmEmpfaenger(wert: unknown): ReadonlySet<string> {
  if (!istObjekt(wert)) return new Set();
  const ergebnis = new Set<string>();
  for (const feld of ['receivers', 'locals'] as const) {
    const liste = wert[feld];
    if (!Array.isArray(liste)) continue;
    for (const eintrag of liste) {
      const name = saubererName(eintrag);
      if (name !== null) ergebnis.add(name);
    }
  }
  return ergebnis;
}

function liesCharakter(spielFenster: AdventureLandGruppenKommunikationsFenster): unknown {
  if (istObjekt(spielFenster.character)) return spielFenster.character;
  if (istObjekt(spielFenster.parent) && istObjekt(spielFenster.parent.character)) return spielFenster.parent.character;
  return null;
}

function lokalerName(spielFenster: AdventureLandGruppenKommunikationsFenster): string | null {
  const charakter = liesCharakter(spielFenster);
  if (!istObjekt(charakter)) return null;
  return saubererName(charakter.name);
}

function findeSendeFunktion(
  spielFenster: AdventureLandGruppenKommunikationsFenster
): Readonly<{ funktion: (...argumente: unknown[]) => unknown; kontext: object }> | null {
  if (typeof spielFenster.send_cm === 'function') {
    return Object.freeze({
      funktion: spielFenster.send_cm as (...argumente: unknown[]) => unknown,
      kontext: spielFenster
    });
  }
  if (istObjekt(spielFenster.parent) && typeof spielFenster.parent.send_cm === 'function') {
    return Object.freeze({
      funktion: spielFenster.parent.send_cm as (...argumente: unknown[]) => unknown,
      kontext: spielFenster.parent as object
    });
  }
  return null;
}

function liesUmschlag(wert: unknown): CapabilitySyncUmschlag | null {
  if (!istObjekt(wert) || wert.schemaVersion !== 1 || wert.protokoll !== CAPABILITY_SYNC_PROTOKOLL) return null;
  const absenderName = saubererName(wert.absenderName);
  const snapshot = liesCapabilitySyncSnapshot(wert.snapshot);
  if (absenderName === null || snapshot === null) return null;
  return Object.freeze({
    schemaVersion: 1,
    protokoll: CAPABILITY_SYNC_PROTOKOLL,
    absenderName,
    snapshot
  });
}

export class AdventureLandCapabilitySyncAustausch {
  private readonly vertrauensNamen: ReadonlySet<string>;
  private readonly aktivFreigegeben: boolean;
  private readonly jetzt: () => number;
  private vorherigerCmEmpfaenger: CmEmpfaenger | null = null;
  private eigenerCmEmpfaenger: CmEmpfaenger | null = null;

  public constructor(
    private readonly spielFenster: AdventureLandGruppenKommunikationsFenster,
    optionen: AdventureLandCapabilitySyncOptionen
  ) {
    this.vertrauensNamen = new Set(
      optionen.vertrauensNamen
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
    );
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
    this.jetzt = optionen.jetzt;
  }

  public holeStatus(): Readonly<Record<string, unknown>> {
    return Object.freeze({
      schemaVersion: 1,
      protokoll: CAPABILITY_SYNC_PROTOKOLL,
      lokalerName: lokalerName(this.spielFenster),
      aktivFreigegeben: this.aktivFreigegeben,
      empfangInstalliert: this.eigenerCmEmpfaenger !== null,
      sendeFunktionVerfuegbar: findeSendeFunktion(this.spielFenster) !== null,
      vertrauensNamen: Object.freeze([...this.vertrauensNamen].sort()),
      eigenerLivenessTimer: false,
      freshnessQuelle: 'block8-gruppen-lebensnachweis',
      aktionsAutoritaet: false
    });
  }

  public async sendeSnapshot(
    zielNameRoh: string,
    snapshot: CapabilitySyncSnapshot
  ): Promise<CapabilitySyncSendeErgebnis> {
    const zielName = saubererName(zielNameRoh);
    const absenderName = lokalerName(this.spielFenster);

    if (!this.aktivFreigegeben) {
      return Object.freeze({
        schemaVersion: 1,
        zielName: zielName ?? '',
        gesendet: false,
        grund: 'Capability-Sync ist nicht ausdruecklich freigegeben.'
      });
    }
    if (zielName === null || !this.vertrauensNamen.has(zielName)) {
      return Object.freeze({
        schemaVersion: 1,
        zielName: zielName ?? '',
        gesendet: false,
        grund: 'Zielname ist nicht in der bestehenden Vertrauensliste.'
      });
    }
    if (absenderName === null || snapshot.charakterName !== absenderName) {
      return Object.freeze({
        schemaVersion: 1,
        zielName,
        gesendet: false,
        grund: 'Lokaler Charaktername und Capability-Snapshot stimmen nicht ueberein.'
      });
    }

    const sendePfad = findeSendeFunktion(this.spielFenster);
    if (sendePfad === null) {
      return Object.freeze({
        schemaVersion: 1,
        zielName,
        gesendet: false,
        grund: 'Adventure Land stellt send_cm weder lokal noch im Parent-Kontext bereit.'
      });
    }

    const umschlag: CapabilitySyncUmschlag = Object.freeze({
      schemaVersion: 1,
      protokoll: CAPABILITY_SYNC_PROTOKOLL,
      absenderName,
      snapshot
    });
    const bestaetigung = await Promise.resolve(
      Reflect.apply(sendePfad.funktion, sendePfad.kontext, [zielName, umschlag])
    );
    const empfaenger = bestaetigteCmEmpfaenger(bestaetigung);
    if (!empfaenger.has(zielName)) {
      return Object.freeze({
        schemaVersion: 1,
        zielName,
        gesendet: false,
        grund: 'send_cm hat den vertrauten Zielcharakter nicht als Empfaenger bestaetigt.'
      });
    }

    return Object.freeze({
      schemaVersion: 1,
      zielName,
      gesendet: true,
      grund: 'Capability-Snapshot wurde ueber den bestehenden Adventure-Land-CM-Pfad an den vertrauten Zielcharakter bestaetigt.'
    });
  }

  public installiereEmpfang(empfaenger: CapabilityEmpfaenger): boolean {
    if (this.eigenerCmEmpfaenger !== null) return false;
    const vorher = typeof this.spielFenster.on_cm === 'function'
      ? this.spielFenster.on_cm as CmEmpfaenger
      : null;
    this.vorherigerCmEmpfaenger = vorher;

    const eigenerCmEmpfaenger: CmEmpfaenger = (absenderRoh, daten) => {
      const umschlag = liesUmschlag(daten);
      if (umschlag !== null) {
        const absender = saubererName(absenderRoh);
        const empfangenAm = this.jetzt();
        const vertrauenswuerdig =
          absender !== null &&
          this.vertrauensNamen.has(absender) &&
          absender === umschlag.absenderName &&
          umschlag.snapshot.charakterName === absender &&
          Number.isFinite(empfangenAm) &&
          empfangenAm >= 0;

        if (!vertrauenswuerdig) return false;

        empfaenger(Object.freeze({
          schemaVersion: 1,
          absenderName: absender,
          empfangenAm,
          snapshot: umschlag.snapshot
        }));
        return true;
      }

      return vorher === null
        ? undefined
        : Reflect.apply(vorher, this.spielFenster, [absenderRoh, daten]);
    };

    this.eigenerCmEmpfaenger = eigenerCmEmpfaenger;
    this.spielFenster.on_cm = eigenerCmEmpfaenger;
    return true;
  }

  public entferneEmpfang(): boolean {
    if (this.eigenerCmEmpfaenger === null || this.spielFenster.on_cm !== this.eigenerCmEmpfaenger) return false;
    this.spielFenster.on_cm = this.vorherigerCmEmpfaenger ?? undefined;
    this.eigenerCmEmpfaenger = null;
    this.vorherigerCmEmpfaenger = null;
    return true;
  }
}
