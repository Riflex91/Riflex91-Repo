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
  on_cm?: unknown;
}

export interface AdventureLandGruppenLebensnachweisOptionen {
  readonly aktivFreigegeben?: boolean;
  readonly vertrauensNamen: readonly string[];
  readonly jetzt: () => number;
}

type EmpfangsHandler = (empfang: GruppenLebensnachweisEmpfang) => void;
type OnCmHandler = (absender: unknown, daten: unknown) => unknown;

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function saubererName(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const name = wert.trim();
  return name.length > 0 ? name : null;
}

function lokalerName(spielFenster: AdventureLandGruppenKommunikationsFenster): string | null {
  if (!istObjekt(spielFenster.character)) return null;
  return saubererName(spielFenster.character.name);
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
  private vorherigerOnCm: OnCmHandler | null = null;
  private eigenerOnCm: OnCmHandler | null = null;

  public constructor(
    private readonly spielFenster: AdventureLandGruppenKommunikationsFenster,
    optionen: AdventureLandGruppenLebensnachweisOptionen
  ) {
    this.vertrauensNamen = new Set(optionen.vertrauensNamen.map((name) => name.trim()).filter((name) => name.length > 0));
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
    this.jetzt = optionen.jetzt;
  }

  public holeStatus(): Readonly<Record<string, unknown>> {
    return Object.freeze({
      schemaVersion: 1,
      lokalerName: lokalerName(this.spielFenster),
      aktivFreigegeben: this.aktivFreigegeben,
      empfangInstalliert: this.eigenerOnCm !== null,
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

    const sendeFunktion = this.spielFenster.send_cm;
    if (typeof sendeFunktion !== 'function') {
      return Object.freeze({ schemaVersion: 1, zielName, gesendet: false, grund: 'Adventure Land stellt send_cm nicht bereit.' });
    }

    const umschlag: GruppenLebensnachweisUmschlag = Object.freeze({
      schemaVersion: 1,
      protokoll: GRUPPEN_LEBENSNACHWEIS_PROTOKOLL,
      absenderName,
      meldung
    });

    await Promise.resolve(Reflect.apply(sendeFunktion, this.spielFenster, [zielName, umschlag]));
    return Object.freeze({ schemaVersion: 1, zielName, gesendet: true, grund: 'Lebensnachweis wurde an einen vertrauten Charakter gesendet.' });
  }

  public installiereEmpfang(handler: EmpfangsHandler): boolean {
    if (this.eigenerOnCm !== null) return false;
    const vorher = typeof this.spielFenster.on_cm === 'function' ? this.spielFenster.on_cm as OnCmHandler : null;
    this.vorherigerOnCm = vorher;

    const eigenerOnCm: OnCmHandler = (absenderRoh, daten) => {
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

        handler(Object.freeze({
          schemaVersion: 1,
          absenderName: absender,
          empfangenAm,
          meldung: umschlag.meldung
        }));
        return true;
      }

      return vorher === null ? undefined : Reflect.apply(vorher, this.spielFenster, [absenderRoh, daten]);
    };

    this.eigenerOnCm = eigenerOnCm;
    this.spielFenster.on_cm = eigenerOnCm;
    return true;
  }

  public entferneEmpfang(): boolean {
    if (this.eigenerOnCm === null || this.spielFenster.on_cm !== this.eigenerOnCm) return false;
    this.spielFenster.on_cm = this.vorherigerOnCm ?? undefined;
    this.eigenerOnCm = null;
    this.vorherigerOnCm = null;
    return true;
  }
}
