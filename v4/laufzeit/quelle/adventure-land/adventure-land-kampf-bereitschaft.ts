import type { KampfAktionsBereitschaft } from '../vertraege/kampf-aktionsbereitschaft.js';

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
    throw new Error('Der Bereitschaftszeitpunkt muss eine endliche, nichtnegative Zahl sein.');
  }
}

function unbekannt(aktionsName: string, aufgenommenAm: number, grund: string): Readonly<KampfAktionsBereitschaft> {
  return Object.freeze({
    schemaVersion: 1,
    aufgenommenAm,
    aktionsName,
    zustand: 'unbekannt',
    bereitAb: null,
    restMillisekunden: null,
    grund
  });
}

function bereit(aktionsName: string, aufgenommenAm: number, grund: string): Readonly<KampfAktionsBereitschaft> {
  return Object.freeze({
    schemaVersion: 1,
    aufgenommenAm,
    aktionsName,
    zustand: 'bereit',
    bereitAb: aufgenommenAm,
    restMillisekunden: 0,
    grund
  });
}

type FunktionsFund = Readonly<{ funktion: (...argumente: unknown[]) => unknown; kontext: object }>;

function objektOderNull(wert: unknown): object | null {
  return (typeof wert === 'object' && wert !== null) || typeof wert === 'function' ? wert as object : null;
}

function liesWert(kontext: object, name: string): unknown {
  try {
    return Reflect.get(kontext, name);
  } catch {
    return undefined;
  }
}

function kandidaten(spielFenster: object): readonly object[] {
  const werte: object[] = [spielFenster];
  const eltern = objektOderNull(liesWert(spielFenster, 'parent'));
  if (eltern && eltern !== spielFenster) werte.push(eltern);
  return Object.freeze(werte);
}

function findeFunktion(spielFenster: object, name: string): FunktionsFund | null {
  for (const kontext of kandidaten(spielFenster)) {
    const funktion = liesWert(kontext, name);
    if (typeof funktion === 'function') {
      return Object.freeze({ funktion: funktion as (...argumente: unknown[]) => unknown, kontext });
    }
  }
  return null;
}

function findeObjekt(spielFenster: object, name: string): Record<string, unknown> | null {
  for (const kontext of kandidaten(spielFenster)) {
    const wert = liesWert(kontext, name);
    if (typeof wert === 'object' && wert !== null && !Array.isArray(wert)) return wert as Record<string, unknown>;
  }
  return null;
}

function aufGeteiltenCooldownAufloesen(spielFenster: object, aktionsName: string): string {
  const g = findeObjekt(spielFenster, 'G');
  const skills = g && typeof g.skills === 'object' && g.skills !== null ? g.skills as Record<string, unknown> : null;
  if (!skills) return aktionsName;

  let aktuell = aktionsName;
  const besucht = new Set<string>();
  for (let schritt = 0; schritt < 16; schritt += 1) {
    if (besucht.has(aktuell)) return aktuell;
    besucht.add(aktuell);
    const skill = skills[aktuell];
    if (typeof skill !== 'object' || skill === null) return aktuell;
    const share = (skill as Record<string, unknown>).share;
    if (typeof share !== 'string' || share.length === 0) return aktuell;
    aktuell = share;
  }
  return aktuell;
}

function zeitstempelMillisekunden(wert: unknown): number | null {
  if (typeof wert === 'number' && Number.isFinite(wert)) return wert;
  if (typeof wert === 'string') {
    const zeit = Date.parse(wert);
    return Number.isFinite(zeit) ? zeit : null;
  }
  if (typeof wert === 'object' && wert !== null) {
    const getTime = liesWert(wert, 'getTime');
    if (typeof getTime === 'function') {
      try {
        const zeit = Reflect.apply(getTime, wert, []);
        return typeof zeit === 'number' && Number.isFinite(zeit) ? zeit : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function liesBekannteRestzeit(
  spielFenster: object,
  aktionsName: string,
  aufgenommenAm: number
): Readonly<{ bereitAb: number; restMillisekunden: number }> | null {
  const nextSkill = findeObjekt(spielFenster, 'next_skill');
  if (!nextSkill) return null;
  const cooldownName = aufGeteiltenCooldownAufloesen(spielFenster, aktionsName);
  const bereitAb = zeitstempelMillisekunden(nextSkill[cooldownName]);
  if (bereitAb === null || bereitAb < 0) return null;
  return Object.freeze({
    bereitAb,
    restMillisekunden: Math.max(0, bereitAb - aufgenommenAm)
  });
}

export class AdventureLandKampfBereitschaftLesezugriff {
  public constructor(private readonly spielFenster: object) {}

  public liesNormalenAngriff(aufgenommenAm: number): Readonly<KampfAktionsBereitschaft> {
    return this.liesAktionsBereitschaft('attack', aufgenommenAm);
  }

  public liesSkillNutzbarkeit(aktionsName: string, aufgenommenAm: number): Readonly<KampfAktionsBereitschaft> {
    const basis = this.liesAktionsBereitschaft(aktionsName, aufgenommenAm);
    if (basis.zustand !== 'bereit') return basis;

    const canUse = findeFunktion(this.spielFenster, 'can_use');
    if (!canUse) return basis;

    try {
      const rohwert = Reflect.apply(canUse.funktion, canUse.kontext, [aktionsName]);
      if (rohwert === true) {
        return bereit(
          aktionsName,
          aufgenommenAm,
          'Adventure Land meldet keinen aktiven Cooldown und can_use bestaetigt die aktuelle Nutzbarkeit.'
        );
      }
      if (rohwert === false) {
        return unbekannt(
          aktionsName,
          aufgenommenAm,
          'Adventure Land meldet keinen aktiven Cooldown, can_use meldet den Skill aber als aktuell nicht nutzbar.'
        );
      }
      return unbekannt(aktionsName, aufgenommenAm, 'can_use lieferte fuer den Skill keinen booleschen Wert.');
    } catch (fehler) {
      const grund = fehler instanceof Error ? fehler.message : String(fehler);
      return unbekannt(aktionsName, aufgenommenAm, `can_use konnte fuer den Skill nicht gelesen werden: ${grund}`);
    }
  }

  public liesAktionsBereitschaft(aktionsName: string, aufgenommenAm: number): Readonly<KampfAktionsBereitschaft> {
    pruefeZeitpunkt(aufgenommenAm);
    if (aktionsName.trim().length === 0) throw new Error('Eine Aktionsbereitschaft benoetigt einen Aktionsnamen.');

    const cooldown = findeFunktion(this.spielFenster, 'is_on_cooldown');
    if (cooldown) {
      try {
        const rohwert = Reflect.apply(cooldown.funktion, cooldown.kontext, [aktionsName]);
        if (typeof rohwert !== 'boolean') {
          return unbekannt(aktionsName, aufgenommenAm, 'is_on_cooldown lieferte keinen booleschen Wert.');
        }
        if (!rohwert) {
          return bereit(aktionsName, aufgenommenAm, 'Adventure Land meldet fuer die Aktion keinen aktiven Cooldown.');
        }

        const zeiten = liesBekannteRestzeit(this.spielFenster, aktionsName, aufgenommenAm);
        return Object.freeze({
          schemaVersion: 1,
          aufgenommenAm,
          aktionsName,
          zustand: 'abklingzeit',
          bereitAb: zeiten?.bereitAb ?? null,
          restMillisekunden: zeiten?.restMillisekunden ?? null,
          grund: zeiten
            ? `Adventure Land meldet einen aktiven Cooldown mit noch ${zeiten.restMillisekunden} ms Restzeit.`
            : 'Adventure Land meldet einen aktiven Cooldown; die exakte Restzeit ist nicht beobachtbar.'
        });
      } catch (fehler) {
        const grund = fehler instanceof Error ? fehler.message : String(fehler);
        return unbekannt(aktionsName, aufgenommenAm, `is_on_cooldown konnte nicht gelesen werden: ${grund}`);
      }
    }

    const canUse = findeFunktion(this.spielFenster, 'can_use');
    if (canUse) {
      try {
        const rohwert = Reflect.apply(canUse.funktion, canUse.kontext, [aktionsName]);
        if (rohwert === true) {
          return bereit(aktionsName, aufgenommenAm, 'Adventure Land meldet die Aktion ueber can_use als nutzbar.');
        }
        if (rohwert === false) {
          return unbekannt(
            aktionsName,
            aufgenommenAm,
            'can_use meldet die Aktion als nicht nutzbar; ohne is_on_cooldown wird die Ursache nicht als Cooldown geraten.'
          );
        }
        return unbekannt(aktionsName, aufgenommenAm, 'can_use lieferte keinen booleschen Wert.');
      } catch (fehler) {
        const grund = fehler instanceof Error ? fehler.message : String(fehler);
        return unbekannt(aktionsName, aufgenommenAm, `can_use konnte nicht gelesen werden: ${grund}`);
      }
    }

    return unbekannt(
      aktionsName,
      aufgenommenAm,
      'Adventure Land stellt weder is_on_cooldown noch can_use fuer die Bereitschaftsbeobachtung bereit.'
    );
  }
}
