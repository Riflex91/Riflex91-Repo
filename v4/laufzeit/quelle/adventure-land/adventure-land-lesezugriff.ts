export const ADVENTURE_LAND_LESEFELDER = [
  'character',
  'entities',
  'party',
  'G',
  'server_region',
  'server_identifier'
] as const;

export type AdventureLandLesefeld = (typeof ADVENTURE_LAND_LESEFELDER)[number];

export interface GelesenerAdventureLandWert {
  readonly vorhanden: boolean;
  readonly wert: unknown;
  readonly lesefehler: string | null;
}

export interface AdventureLandRohdaten {
  readonly charakter: GelesenerAdventureLandWert;
  readonly entities: GelesenerAdventureLandWert;
  readonly gruppe: GelesenerAdventureLandWert;
  readonly spielDaten: GelesenerAdventureLandWert;
  readonly serverRegion: GelesenerAdventureLandWert;
  readonly serverKennung: GelesenerAdventureLandWert;
}

export interface AdventureLandDatenQuelle {
  liesRohdaten(): AdventureLandRohdaten;
}

function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler);
}

export class AdventureLandLesezugriff implements AdventureLandDatenQuelle {
  public constructor(private readonly spielFenster: object) {}

  public liesRohdaten(): AdventureLandRohdaten {
    return {
      charakter: this.liesFeld('character'),
      entities: this.liesFeld('entities'),
      gruppe: this.liesFeld('party'),
      spielDaten: this.liesFeld('G'),
      serverRegion: this.liesFeld('server_region'),
      serverKennung: this.liesFeld('server_identifier')
    };
  }

  private liesFeld(name: AdventureLandLesefeld): GelesenerAdventureLandWert {
    try {
      if (!(name in this.spielFenster)) {
        return { vorhanden: false, wert: undefined, lesefehler: null };
      }

      return {
        vorhanden: true,
        wert: Reflect.get(this.spielFenster, name),
        lesefehler: null
      };
    } catch (fehler) {
      return {
        vorhanden: false,
        wert: undefined,
        lesefehler: fehlerText(fehler)
      };
    }
  }
}
