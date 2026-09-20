export interface ControlledLiveInventarItem {
  readonly index: number;
  readonly name: string;
  readonly level: number;
  readonly gesperrt: boolean;
  readonly typ: string;
}

export interface ControlledLiveSlotItem {
  readonly name: string;
  readonly level: number;
}

export interface ControlledLiveEquipBeobachtung {
  readonly charakterName: string;
  readonly rip: boolean;
  readonly bewegtSich: boolean;
  readonly zielName: string | null;
  readonly feindeAufCharakter: number;
  readonly alternativeRuntimeAktiv: boolean;
  readonly inventar: readonly ControlledLiveInventarItem[];
  readonly slots: Readonly<Record<string, ControlledLiveSlotItem | null>>;
}

export interface ControlledLiveEquipKandidat {
  readonly index: number;
  readonly itemName: string;
  readonly itemLevel: number;
  readonly slot: string;
  readonly slotWarLeer: boolean;
  readonly vorherigesSlotItem: ControlledLiveSlotItem | null;
}

const SLOT_FUER_TYP: Readonly<Record<string, string>> = Object.freeze({
  helmet: "helmet",
  chest: "chest",
  pants: "pants",
  shoes: "shoes",
  gloves: "gloves",
  cape: "cape",
  amulet: "amulet",
  belt: "belt",
  orb: "orb",
});

const SLOT_PRIORITAET: readonly string[] = Object.freeze([
  "cape",
  "belt",
  "amulet",
  "orb",
  "helmet",
  "gloves",
  "shoes",
  "pants",
  "chest",
]);

export function validiereControlledLiveRuhezustand(
  beobachtung: ControlledLiveEquipBeobachtung,
): readonly string[] {
  let gruende: readonly string[] = Object.freeze([]);
  if (beobachtung.charakterName.trim().length === 0) {
    gruende = Object.freeze([...gruende, "CHARAKTER_FEHLT"]);
  }
  if (beobachtung.rip) gruende = Object.freeze([...gruende, "CHARAKTER_TOT"]);
  if (beobachtung.bewegtSich) gruende = Object.freeze([...gruende, "CHARAKTER_BEWEGT_SICH"]);
  if (beobachtung.zielName !== null) gruende = Object.freeze([...gruende, "CHARAKTER_HAT_ZIEL"]);
  if (beobachtung.feindeAufCharakter !== 0) {
    gruende = Object.freeze([...gruende, "CHARAKTER_UNTER_ANGRIFF"]);
  }
  if (beobachtung.alternativeRuntimeAktiv) {
    gruende = Object.freeze([...gruende, "ALTERNATIVE_RUNTIME_AKTIV"]);
  }
  return gruende;
}

export function waehleControlledLiveEquipKandidat(
  beobachtung: ControlledLiveEquipBeobachtung,
): ControlledLiveEquipKandidat | null {
  if (validiereControlledLiveRuhezustand(beobachtung).length > 0) return null;
  if (beobachtung.inventar.length > 128) return null;

  const kandidaten = beobachtung.inventar
    .filter(item =>
      Number.isInteger(item.index)
      && item.index >= 0
      && item.index < 128
      && item.name.trim().length > 0
      && !item.gesperrt
      && SLOT_FUER_TYP[item.typ] !== undefined)
    .map(item => {
      const slot = SLOT_FUER_TYP[item.typ];
      if (slot === undefined) return null;
      const vorherigesSlotItem = beobachtung.slots[slot] ?? null;
      return {
        index: item.index,
        itemName: item.name,
        itemLevel: item.level,
        slot,
        slotWarLeer: vorherigesSlotItem === null,
        vorherigesSlotItem,
      };
    })
    .filter((x): x is ControlledLiveEquipKandidat => x !== null)
    .sort((a, b) =>
      Number(b.slotWarLeer) - Number(a.slotWarLeer)
      || SLOT_PRIORITAET.indexOf(a.slot) - SLOT_PRIORITAET.indexOf(b.slot)
      || a.index - b.index);

  return kandidaten[0] ?? null;
}
