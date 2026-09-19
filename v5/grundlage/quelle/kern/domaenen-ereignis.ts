import type {
  KennungsPort,
  SequenzPort,
  UhrPort,
} from "../determinismus/ports.js";

export interface DomaenenEreignis<T extends Readonly<Record<string, unknown>>> {
  readonly schemaVersion: 1;
  readonly ereignisId: string;
  readonly korrelationsId: string;
  readonly kausalitaetsId?: string;
  readonly sequenz: number;
  readonly zeitMs: number;
  readonly art: string;
  readonly inhalt: T;
}

function gefriereRekursiv<T>(wert: T, tiefe = 0): T {
  if (tiefe > 64) throw new Error("EREIGNIS_INHALT_ZU_TIEF");
  if (wert === null || typeof wert !== "object") return wert;

  if (Array.isArray(wert)) {
    for (const eintrag of wert) gefriereRekursiv(eintrag, tiefe + 1);
    return Object.freeze(wert) as T;
  }

  const prototype = Object.getPrototypeOf(wert);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("EREIGNIS_INHALT_NUR_REINE_OBJEKTE");
  }

  for (const schluessel of Object.keys(wert)) {
    gefriereRekursiv(
      (wert as Record<string, unknown>)[schluessel],
      tiefe + 1,
    );
  }
  return Object.freeze(wert);
}

export class DomaenenEreignisErzeuger {
  readonly #uhr: UhrPort;
  readonly #kennungen: KennungsPort;
  readonly #sequenz: SequenzPort;

  public constructor(
    uhr: UhrPort,
    kennungen: KennungsPort,
    sequenz: SequenzPort,
  ) {
    this.#uhr = uhr;
    this.#kennungen = kennungen;
    this.#sequenz = sequenz;
  }

  public erzeuge<T extends Readonly<Record<string, unknown>>>(
    art: string,
    korrelationsId: string,
    inhalt: T,
    kausalitaetsId?: string,
  ): DomaenenEreignis<T> {
    if (!/^[A-Z0-9_:-]{1,120}$/.test(art)) throw new Error("EREIGNIS_ART_UNGUELTIG");
    if (korrelationsId.trim().length === 0) throw new Error("KORRELATIONS_ID_FEHLT");
    if (kausalitaetsId !== undefined && kausalitaetsId.trim().length === 0) {
      throw new Error("KAUSALITAETS_ID_UNGUELTIG");
    }

    const basis = {
      schemaVersion: 1 as const,
      ereignisId: this.#kennungen.naechsteId("EREIGNIS"),
      korrelationsId,
      sequenz: this.#sequenz.naechsteSequenz(),
      zeitMs: this.#uhr.jetztMs(),
      art,
      inhalt: gefriereRekursiv({ ...inhalt }),
    };

    return kausalitaetsId === undefined
      ? Object.freeze(basis)
      : Object.freeze({ ...basis, kausalitaetsId });
  }
}
