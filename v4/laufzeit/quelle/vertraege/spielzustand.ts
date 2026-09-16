export const WISSENS_QUELLEN = ['beobachtet', 'abgeleitet', 'gelernt'] as const;
export type WissensQuelle = (typeof WISSENS_QUELLEN)[number];

export const WERT_ZUSTAENDE = ['bekannt', 'fehlend', 'unbekannt'] as const;
export type WertZustand = (typeof WERT_ZUSTAENDE)[number];

export interface BekannterWert<TWert = unknown> {
  readonly zustand: 'bekannt';
  readonly quelle: WissensQuelle;
  readonly sicherheit: number;
  readonly bekanntSeit: number;
  readonly wert: TWert;
}

export interface FehlenderWert {
  readonly zustand: 'fehlend';
  readonly quelle: 'beobachtet';
  readonly grund: string;
}

export interface UnbekannterWert {
  readonly zustand: 'unbekannt';
  readonly quelle: WissensQuelle;
  readonly grund: string;
}

export type WissensWert<TWert = unknown> = BekannterWert<TWert> | FehlenderWert | UnbekannterWert;

export interface GegenstandZustand {
  readonly name: WissensWert<string>;
  readonly menge: WissensWert<number>;
  readonly stufe: WissensWert<number>;
  readonly eigenschaft: WissensWert<string | null>;
  readonly gesperrt: WissensWert<boolean>;
  readonly ablauf: WissensWert<number | string | null>;
}

export interface InventarPlatzZustand {
  readonly platz: number;
  readonly gegenstand: WissensWert<GegenstandZustand | null>;
}

export interface CharakterZustand {
  readonly kennung: WissensWert<string>;
  readonly name: WissensWert<string>;
  readonly klasse: WissensWert<string>;
  readonly stufe: WissensWert<number>;
  readonly leben: WissensWert<number>;
  readonly lebenMaximal: WissensWert<number>;
  readonly mana: WissensWert<number>;
  readonly manaMaximal: WissensWert<number>;
  readonly erfahrung: WissensWert<number>;
  readonly erfahrungNaechsteStufe: WissensWert<number>;
  readonly gold: WissensWert<number>;
  readonly angriff: WissensWert<number>;
  readonly angriffsFrequenz: WissensWert<number>;
  readonly geschwindigkeit: WissensWert<number>;
  readonly reichweite: WissensWert<number>;
  readonly ruestung: WissensWert<number>;
  readonly resistenz: WissensWert<number>;
  readonly karte: WissensWert<string>;
  readonly instanz: WissensWert<string>;
  readonly x: WissensWert<number>;
  readonly y: WissensWert<number>;
  readonly echtX: WissensWert<number>;
  readonly echtY: WissensWert<number>;
  readonly bewegtSich: WissensWert<boolean>;
  readonly ziel: WissensWert<string | null>;
  readonly tot: WissensWert<boolean | null>;
  readonly standAktiv: WissensWert<boolean | null>;
  readonly ausruestung: WissensWert<Readonly<Record<string, WissensWert<GegenstandZustand | null>>>>;
}

export interface SichtbaresObjektZustand {
  readonly kennung: WissensWert<string>;
  readonly name: WissensWert<string>;
  readonly art: WissensWert<string>;
  readonly monsterArt: WissensWert<string>;
  readonly klasse: WissensWert<string>;
  readonly besitzer: WissensWert<string>;
  readonly stufe: WissensWert<number>;
  readonly leben: WissensWert<number>;
  readonly lebenMaximal: WissensWert<number>;
  readonly mana: WissensWert<number>;
  readonly manaMaximal: WissensWert<number>;
  readonly angriff: WissensWert<number>;
  readonly angriffsFrequenz: WissensWert<number>;
  readonly geschwindigkeit: WissensWert<number>;
  readonly reichweite: WissensWert<number>;
  readonly ruestung: WissensWert<number>;
  readonly resistenz: WissensWert<number>;
  readonly karte: WissensWert<string>;
  readonly instanz: WissensWert<string>;
  readonly x: WissensWert<number>;
  readonly y: WissensWert<number>;
  readonly echtX: WissensWert<number>;
  readonly echtY: WissensWert<number>;
  readonly bewegtSich: WissensWert<boolean>;
  readonly ziel: WissensWert<string | null>;
  readonly tot: WissensWert<boolean | null>;
  readonly gruppe: WissensWert<string | null>;
}

export interface GruppenMitgliedZustand {
  readonly name: WissensWert<string>;
  readonly art: WissensWert<string>;
  readonly haut: WissensWert<string>;
  readonly stufe: WissensWert<number>;
  readonly leben: WissensWert<number>;
  readonly lebenMaximal: WissensWert<number>;
  readonly mana: WissensWert<number>;
  readonly manaMaximal: WissensWert<number>;
  readonly karte: WissensWert<string>;
  readonly instanz: WissensWert<string>;
  readonly x: WissensWert<number>;
  readonly y: WissensWert<number>;
}

export interface KartenZustand {
  readonly kennung: WissensWert<string>;
  readonly name: WissensWert<string>;
  readonly zone: WissensWert<string>;
  readonly sicher: WissensWert<boolean>;
  readonly spielerGegenSpieler: WissensWert<boolean>;
  readonly instanziert: WissensWert<boolean>;
  readonly ignorieren: WissensWert<boolean>;
  readonly anzahlMonsterGebiete: WissensWert<number>;
  readonly anzahlSpawnPunkte: WissensWert<number>;
  readonly anzahlTueren: WissensWert<number>;
  readonly anzahlNpcs: WissensWert<number>;
}

export interface ServerZustand {
  readonly region: WissensWert<string>;
  readonly kennung: WissensWert<string>;
}

export interface BeobachtetesWissen {
  readonly server: ServerZustand;
  readonly charakter: WissensWert<CharakterZustand>;
  readonly inventar: WissensWert<readonly InventarPlatzZustand[]>;
  readonly gruppe: WissensWert<readonly GruppenMitgliedZustand[]>;
  readonly monster: WissensWert<readonly SichtbaresObjektZustand[]>;
  readonly spieler: WissensWert<readonly SichtbaresObjektZustand[]>;
  readonly npcs: WissensWert<readonly SichtbaresObjektZustand[]>;
  readonly sonstigeObjekte: WissensWert<readonly SichtbaresObjektZustand[]>;
  readonly karte: WissensWert<KartenZustand>;
}

export interface AbgeleitetesWissen {
  readonly lebensAnteil: WissensWert<number>;
  readonly manaAnteil: WissensWert<number>;
  readonly inventarBelegt: WissensWert<number>;
  readonly sichtbareMonster: WissensWert<number>;
}

export interface GelernterWissensEintrag {
  readonly kennung: string;
  readonly wert: BekannterWert<unknown>;
}

export interface Spielzustand {
  readonly schemaVersion: 2;
  readonly laufendeNummer: number;
  readonly aufgenommenAm: number;
  readonly ablaufKennung: string;
  readonly beobachtet: BeobachtetesWissen;
  readonly abgeleitet: AbgeleitetesWissen;
  readonly gelernt: readonly GelernterWissensEintrag[];
}

export interface SpielzustandAufzeichnung {
  readonly schemaVersion: 1;
  readonly erstelltAm: number;
  readonly zustaende: readonly Spielzustand[];
}
