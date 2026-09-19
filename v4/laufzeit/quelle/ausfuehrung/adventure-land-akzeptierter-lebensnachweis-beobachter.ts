import {
  GRUPPEN_LEBENSNACHWEIS_PROTOKOLL,
  type GruppenLebensnachweisEmpfang
} from '../vertraege/gruppen-lebensnachweis.js';
import type { AdventureLandGruppenKommunikationsFenster } from './adventure-land-gruppen-lebensnachweis-austausch.js';

type CmEmpfaenger = (absender: unknown, daten: unknown) => unknown;
type Beobachter = (empfang: GruppenLebensnachweisEmpfang) => void;

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function saubererText(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const text = wert.trim();
  return text.length > 0 ? text : null;
}

export class AdventureLandAkzeptierterLebensnachweisBeobachter {
  private vorherigerCmEmpfaenger: CmEmpfaenger | null = null;
  private eigenerCmEmpfaenger: CmEmpfaenger | null = null;

  public constructor(
    private readonly spielFenster: AdventureLandGruppenKommunikationsFenster,
    private readonly jetzt: () => number
  ) {}

  public installiere(beobachter: Beobachter): boolean {
    if (this.eigenerCmEmpfaenger !== null) return false;

    const vorher = typeof this.spielFenster.on_cm === 'function'
      ? this.spielFenster.on_cm as CmEmpfaenger
      : null;
    if (vorher === null) {
      throw new Error(
        'Capability-Liveness-Beobachter darf erst installiert werden, nachdem der bestehende Block-8-CM-Empfang aktiv ist.'
      );
    }
    this.vorherigerCmEmpfaenger = vorher;

    const eigenerCmEmpfaenger: CmEmpfaenger = (absender, daten) => {
      const angenommen = Reflect.apply(vorher, this.spielFenster, [absender, daten]);

      if (
        angenommen === true &&
        istObjekt(daten) &&
        daten.schemaVersion === 1 &&
        daten.protokoll === GRUPPEN_LEBENSNACHWEIS_PROTOKOLL &&
        saubererText(absender) !== null &&
        saubererText(daten.absenderName) === saubererText(absender) &&
        istObjekt(daten.meldung)
      ) {
        const meldung = daten.meldung;
        const empfangenAm = this.jetzt();
        if (
          Number.isFinite(empfangenAm) &&
          typeof meldung.schemaVersion === 'number' &&
          meldung.schemaVersion === 1 &&
          saubererText(meldung.charakterKennung) !== null &&
          saubererText(meldung.charakterName) === saubererText(absender) &&
          typeof meldung.gesendetAm === 'number' &&
          Number.isFinite(meldung.gesendetAm) &&
          typeof meldung.laufendeNummer === 'number' &&
          Number.isInteger(meldung.laufendeNummer) &&
          meldung.laufendeNummer >= 0
        ) {
          beobachter(Object.freeze({
            schemaVersion: 1,
            absenderName: saubererText(absender)!,
            empfangenAm,
            meldung: meldung as unknown as GruppenLebensnachweisEmpfang['meldung']
          }));
        }
      }

      return angenommen;
    };

    this.eigenerCmEmpfaenger = eigenerCmEmpfaenger;
    this.spielFenster.on_cm = eigenerCmEmpfaenger;
    return true;
  }

  public entferne(): boolean {
    if (
      this.eigenerCmEmpfaenger === null ||
      this.spielFenster.on_cm !== this.eigenerCmEmpfaenger
    ) return false;

    this.spielFenster.on_cm = this.vorherigerCmEmpfaenger ?? undefined;
    this.eigenerCmEmpfaenger = null;
    this.vorherigerCmEmpfaenger = null;
    return true;
  }

  public status(): Readonly<Record<string, unknown>> {
    return Object.freeze({
      schemaVersion: 1,
      installiert: this.eigenerCmEmpfaenger !== null,
      sendetLebensnachweise: false,
      eigenerLivenessTimer: false,
      livenessAutoritaet: 'bestehender-block8-cm-handler',
      aktionsAutoritaet: false
    });
  }
}
