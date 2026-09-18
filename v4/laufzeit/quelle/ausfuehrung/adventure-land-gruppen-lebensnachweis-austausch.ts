import {
  GRUPPEN_LEBENSNACHWEIS_PROTOKOLL,
  type GruppenLebensnachweisEmpfang,
  type GruppenLebensnachweisSendeErgebnis,
  type GruppenLebensnachweisUmschlag
} from '../vertraege/gruppen-lebensnachweis.js';
import type { GruppenTeilnehmerMeldung } from '../vertraege/gruppen-koordination.js';

export interface AdventureLandGruppenKommunikationsFenster {
  readonly character?: unknown;
  readonly send_cm?: unknown;
  readonly parent?: unknown;
  on_cm?: unknown;
}

export interface AdventureLandGruppenLebensnachweisOptionen {
  readonly aktivFreigegeben?: boolean;
  readonly vertrauensNamen: readonly string[];
  readonly jetzt: () => number;
}

type LebensnachweisEmpfaenger = (empfang: GruppenLebensnachweisEmpfang) => void;
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
    return Object.freeze({ funktion: spielFenster.send_cm as (...argumente: unknown[]) => unknown, kontext: spielFenster });
  }
  if (istObjekt(spielFenster.parent) && typeof spielFenster.parent.send_cm === 'function') {
    return Object.freeze({
      funktion: spielFenster.parent.send_cm as (...argumente: unknown[]) => unknown,
      kontext: spielFenster.parent as object
    });
  }
  return null;
}

function istTeilnehmerMeldung(wert: unknown): wert is GruppenTeilnehmerMeldung {
  if (!istObjekt(wert)) return false;
  return wert.schemaVersion === 1 &&
    saubererName(wert.charakterKennung) !== null &&
    saubererName(wert.charakterName) !== null &&
    saubererName(wert.serverRegion) !== null &&
    saubererName(wert.serverKennung) !== null &&
    saubererName(wert.karte) !== null &&
    saubererName(wert.instanz) !== null &&
    typeof wert.gesendetAm === 'number' && Number.isFinite(wert.gesendetAm) &&
    typeof wert.laufendeNummer === 'number' && Number.isInteger(wert.laufendeNummer) && wert.laufendeNummer >= 0;
}

function liesUmschlag(wert: unknown): GruppenLebensnachweisUmschlag | null {
  if (!istObjekt(wert)) return null;
  if (wert.schemaVersion !== 1 || wert.protokoll !== GRUPPEN_LEBENSNACHWEIS_PROTOKOLL) return null;
  const absenderName = saubererName(wert.absenderName);
  if (absenderName === null || !istTeilnehmerMeldung(wert.meldung)) return null;
  return Object.freeze({
    schemaVersion: 1,
    protokoll: GRUPPEN_LEBENSNACHWEIS_PROTOKOLL,
    absenderName,
    meldung: wert.meldung
  });
}

export class AdventureLandGruppenLebensnachweisAustausch {
  private readonly vertrauensNamen: ReadonlySet<string>;
  private readonly aktivFreigegeben: boolean;
  private readonly jetzt: () => number;
  private vorherigerCmEmpfaenger: CmEmpfaenger | null = null;
  private eigenerCmEmpfaenger: CmEmpfaenger | null = null;

  public constructor(
    private readonly spielFenster: AdventureLandGruppenKommunikationsFenster,
    optionen: AdventureLandGruppenLebensnachweisOptionen
  ) {
    this.vertrauensNamen = new Set(optionen.vertrauensNamen.map((name) => name.trim()).filter((name) => name.length > 0));
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
    this.jetzt = optionen.jetzt;
  }

  public holeStatus(): Readonly<Record<string, unknown>> {
    const sendePfad = findeSendeFunktion(this.spielFenster);
    return Object.freeze({
      schemaVersion: 1,
      lokalerName: lokalerName(this.spielFenster),
      aktivFreigegeben: this.aktivFreigegeben,
      empfangInstalliert: this.eigenerCmEmpfaenger !== null,
      empfangsKontext: 'lokaler_codekontext',
      sendeFunktionVerfuegbar: sendePfad !== null,
      vertrauensNamen: Object.freeze([...this.vertrauensNamen].sort())
    });
  }

  public async sendeLebensnachweis(
    zielNameRoh: string,
    meldung: GruppenTeilnehmerMeldung
  ): Promise<GruppenLebensnachweisSendeErgebnis> {
    const zielName = saubererName(zielNameRoh);
    const absenderName = lokalerName(this.spielFenster);

    if (!this.aktivFreigegeben) {
      return Object.freeze({ schemaVersion: 1, zielName: zielName ?? '', gesendet: false, grund: 'Gruppenkommunikation ist nicht ausdruecklich freigegeben.' });
    }
    if (zielName === null || !this.vertrauensNamen.has(zielName)) {
      return Object.freeze({ schemaVersion: 1, zielName: zielName ?? '', gesendet: false, grund: 'Zielname ist nicht in der Vertrauensliste.' });
    }
    if (absenderName === null || meldung.charakterName !== absenderName) {
      return Object.freeze({ schemaVersion: 1, zielName, gesendet: false, grund: 'Lokaler Charaktername und Lebensnachweis stimmen nicht ueberein.' });
    }

    const sendePfad = findeSendeFunktion(this.spielFenster);
    if (sendePfad === null) {
      return Object.freeze({ schemaVersion: 1, zielName, gesendet: false, grund: 'Adventure Land stellt send_cm weder lokal noch im Parent-Kontext bereit.' });
    }

    const umschlag: GruppenLebensnachweisUmschlag = Object.freeze({
      schemaVersion: 1,
      protokoll: GRUPPEN_LEBENSNACHWEIS_PROTOKOLL,
      absenderName,
      meldung
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
        grund: 'send_cm hat den Zielcharakter nicht als Empfaenger bestaetigt.'
      });
    }
    return Object.freeze({
      schemaVersion: 1,
      zielName,
      gesendet: true,
      grund: 'send_cm hat den vertrauten Zielcharakter als Empfaenger bestaetigt.'
    });
  }

  public installiereEmpfang(empfaenger: LebensnachweisEmpfaenger): boolean {
    if (this.eigenerCmEmpfaenger !== null) return false;
    const vorher = typeof this.spielFenster.on_cm === 'function' ? this.spielFenster.on_cm as CmEmpfaenger : null;
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
          umschlag.meldung.charakterName === absender &&
          Number.isFinite(empfangenAm);

        if (!vertrauenswuerdig) return false;

        empfaenger(Object.freeze({
          schemaVersion: 1,
          absenderName: absender,
          empfangenAm,
          meldung: umschlag.meldung
        }));
        return true;
      }

      return vorher === null ? undefined : Reflect.apply(vorher, this.spielFenster, [absenderRoh, daten]);
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
