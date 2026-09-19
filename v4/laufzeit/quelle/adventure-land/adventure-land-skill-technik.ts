import { AdventureLandKampfBereitschaftLesezugriff } from './adventure-land-kampf-bereitschaft.js';
import type { SkillKatalogEintrag } from '../vertraege/skill-katalog.js';
import type { TechnischeSkillAuswertung, TechnischerSkillZustand } from '../vertraege/charakter-faehigkeiten.js';

type RohObjekt = Readonly<Record<string, unknown>>;

function istObjekt(wert: unknown): wert is RohObjekt {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
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
  const parent = liesWert(spielFenster, 'parent');
  if (istObjekt(parent) && parent !== spielFenster) werte.push(parent);
  return Object.freeze(werte);
}

function findeObjekt(spielFenster: object, name: string): RohObjekt | null {
  for (const kontext of kandidaten(spielFenster)) {
    const wert = liesWert(kontext, name);
    if (istObjekt(wert)) return wert;
  }
  return null;
}

function itemName(wert: unknown): string | null {
  if (!istObjekt(wert)) return null;
  const name = wert.name;
  return typeof name === 'string' && name.trim().length > 0 ? name.trim() : null;
}

function liesSlots(spielFenster: object): RohObjekt | null {
  const charakter = findeObjekt(spielFenster, 'character');
  return charakter && istObjekt(charakter.slots) ? charakter.slots : null;
}

function liesInventar(spielFenster: object): readonly unknown[] | null {
  const charakter = findeObjekt(spielFenster, 'character');
  return charakter && Array.isArray(charakter.items) ? charakter.items : null;
}

function liesGameItems(spielFenster: object): RohObjekt | null {
  const g = findeObjekt(spielFenster, 'G');
  return g && istObjekt(g.items) ? g.items : null;
}

function liesMana(spielFenster: object): number | null {
  const charakter = findeObjekt(spielFenster, 'character');
  if (!charakter) return null;
  return typeof charakter.mp === 'number' && Number.isFinite(charakter.mp) && charakter.mp >= 0
    ? charakter.mp
    : null;
}

function ausruestungBereit(
  spielFenster: object,
  skill: SkillKatalogEintrag,
  gruende: string[]
): boolean | null {
  const brauchtWaffe = skill.ausruestung.waffenTypen.length > 0;
  const brauchtNebenhand = skill.ausruestung.nebenhandTyp !== null;
  const brauchtSlot = skill.ausruestung.slots.length > 0;
  if (!brauchtWaffe && !brauchtNebenhand && !brauchtSlot) return true;

  const slots = liesSlots(spielFenster);
  if (!slots) {
    gruende.push('character.slots ist fuer die Ausruestungspruefung nicht sicher beobachtbar.');
    return null;
  }

  if (brauchtSlot) {
    const passt = skill.ausruestung.slots.some((voraussetzung) =>
      itemName(slots[voraussetzung.slot]) === voraussetzung.gegenstand
    );
    if (!passt) {
      gruende.push('Keine der katalogisierten Slot-/Gegenstands-Voraussetzungen ist aktuell erfuellt.');
      return false;
    }
  }

  if (brauchtWaffe || brauchtNebenhand) {
    const gameItems = liesGameItems(spielFenster);
    if (!gameItems) {
      gruende.push('G.items ist fuer die Waffentyppruefung nicht sicher beobachtbar.');
      return null;
    }

    const ausgeruesteteMetadaten: Array<Readonly<{ slot: string; name: string; wtype: string | null; type: string | null }>> = [];
    let unbekannteMetadaten = false;
    for (const [slot, rohItem] of Object.entries(slots)) {
      const name = itemName(rohItem);
      if (name === null) continue;
      const meta = gameItems[name];
      if (!istObjekt(meta)) {
        unbekannteMetadaten = true;
        continue;
      }
      ausgeruesteteMetadaten.push(Object.freeze({
        slot,
        name,
        wtype: typeof meta.wtype === 'string' ? meta.wtype : null,
        type: typeof meta.type === 'string' ? meta.type : null
      }));
    }

    if (brauchtWaffe) {
      const erlaubt = new Set(skill.ausruestung.waffenTypen);
      const passt = ausgeruesteteMetadaten.some((item) => item.wtype !== null && erlaubt.has(item.wtype));
      if (!passt) {
        if (unbekannteMetadaten) {
          gruende.push('Mindestens ein ausgeruesteter Gegenstand besitzt keine sicher lesbaren G.items-Metadaten.');
          return null;
        }
        gruende.push(`Erforderlicher Waffentyp fehlt: ${skill.ausruestung.waffenTypen.join(', ')}.`);
        return false;
      }
    }

    if (brauchtNebenhand) {
      const nebenhand = ausgeruesteteMetadaten.find((item) => item.slot === 'offhand');
      if (!nebenhand) {
        if (itemName(slots.offhand) !== null && unbekannteMetadaten) {
          gruende.push('Metadaten des ausgeruesteten Nebenhand-Gegenstands sind unbekannt.');
          return null;
        }
        gruende.push(`Erforderlicher Nebenhandtyp fehlt: ${skill.ausruestung.nebenhandTyp}.`);
        return false;
      }
      if (nebenhand.wtype !== skill.ausruestung.nebenhandTyp && nebenhand.type !== skill.ausruestung.nebenhandTyp) {
        gruende.push(`Ausgeruesteter Nebenhandtyp passt nicht zu ${skill.ausruestung.nebenhandTyp}.`);
        return false;
      }
    }
  }

  return true;
}

function materialBereit(
  spielFenster: object,
  skill: SkillKatalogEintrag,
  gruende: string[]
): boolean | null {
  const benoetigteNamen = [
    ...(skill.materialien.verbrauch === null ? [] : [skill.materialien.verbrauch]),
    ...skill.materialien.inventar
  ];
  const hatGenerischeAnforderungen = Object.keys(skill.materialien.anforderungen).length > 0;
  if (benoetigteNamen.length === 0 && !hatGenerischeAnforderungen) return true;

  if (hatGenerischeAnforderungen) {
    gruende.push('Generische Skill-requirements werden in 8.6.4 nicht geraten und bleiben technisch unbekannt.');
    return null;
  }

  const inventar = liesInventar(spielFenster);
  if (!inventar) {
    gruende.push('character.items ist fuer die Materialpruefung nicht sicher beobachtbar.');
    return null;
  }

  const vorhandeneNamen = new Set<string>();
  for (const rohItem of inventar) {
    const name = itemName(rohItem);
    if (name !== null) vorhandeneNamen.add(name);
  }

  const fehlend = [...new Set(benoetigteNamen)].filter((name) => !vorhandeneNamen.has(name));
  if (fehlend.length > 0) {
    gruende.push(`Erforderliche Skill-Materialien fehlen: ${fehlend.join(', ')}.`);
    return false;
  }
  return true;
}

function manaBereit(
  spielFenster: object,
  skill: SkillKatalogEintrag,
  gruende: string[]
): boolean | null {
  if (skill.manaKosten === null || skill.manaKosten <= 0) return true;
  const mana = liesMana(spielFenster);
  if (mana === null) {
    gruende.push('Aktuelles character.mp ist fuer die Mana-Pruefung nicht sicher beobachtbar.');
    return null;
  }
  if (mana < skill.manaKosten) {
    gruende.push(`Aktuelles Mana ${mana} liegt unter den Skill-Kosten ${skill.manaKosten}.`);
    return false;
  }
  return true;
}

function kombiniereZustand(
  ausruestung: boolean | null,
  material: boolean | null,
  mana: boolean | null,
  aktionsZustand: 'bereit' | 'abklingzeit' | 'unbekannt'
): TechnischerSkillZustand {
  if (ausruestung === false || material === false || mana === false) return 'blockiert';
  if (aktionsZustand === 'abklingzeit') return 'abklingzeit';
  if (ausruestung === null || material === null || mana === null || aktionsZustand === 'unbekannt') return 'unbekannt';
  return 'bereit';
}

export class AdventureLandSkillTechnikLesezugriff {
  private readonly bereitschaft: AdventureLandKampfBereitschaftLesezugriff;

  public constructor(private readonly spielFenster: object) {
    this.bereitschaft = new AdventureLandKampfBereitschaftLesezugriff(spielFenster);
  }

  public lies(skill: SkillKatalogEintrag, aufgenommenAm: number): Readonly<TechnischeSkillAuswertung> {
    if (!Number.isFinite(aufgenommenAm) || aufgenommenAm < 0) {
      throw new Error('aufgenommenAm muss eine endliche, nichtnegative Zahl sein.');
    }

    const gruende: string[] = [];
    const ausruestung = ausruestungBereit(this.spielFenster, skill, gruende);
    const material = materialBereit(this.spielFenster, skill, gruende);
    const mana = manaBereit(this.spielFenster, skill, gruende);
    const aktionsBereitschaft = this.bereitschaft.liesSkillNutzbarkeit(skill.skillId, aufgenommenAm);
    if (aktionsBereitschaft.zustand !== 'bereit') gruende.push(aktionsBereitschaft.grund);

    const zustand = kombiniereZustand(
      ausruestung,
      material,
      mana,
      aktionsBereitschaft.zustand
    );
    if (zustand === 'bereit') {
      gruende.push('Equipment, Material, Mana und Adventure-Land-Skill-Nutzbarkeit sind aktuell bestaetigt.');
    }

    return Object.freeze({
      schemaVersion: 1,
      skillId: skill.skillId,
      aufgenommenAm,
      zustand,
      ausruestungBereit: ausruestung,
      materialBereit: material,
      manaBereit: mana,
      aktionsBereitschaft,
      gruende: Object.freeze(gruende),
      aktionsFreigabe: false as const
    });
  }
}
