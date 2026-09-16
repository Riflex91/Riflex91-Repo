import type {
  AbgeleitetesWissen,
  BekannterWert,
  CharakterZustand,
  FehlenderWert,
  GegenstandZustand,
  GruppenMitgliedZustand,
  InventarPlatzZustand,
  KartenZustand,
  SichtbaresObjektZustand,
  Spielzustand,
  UnbekannterWert,
  WissensQuelle,
  WissensWert
} from '../vertraege/spielzustand.js';
import type {
  AdventureLandDatenQuelle,
  AdventureLandRohdaten,
  GelesenerAdventureLandWert
} from '../adventure-land/adventure-land-lesezugriff.js';

type Objekt = Readonly<Record<string, unknown>>;
type Umwandlung<TWert> = (wert: unknown) => { readonly gueltig: true; readonly wert: TWert } | { readonly gueltig: false };

export interface SpielzustandErstellungsDaten {
  readonly laufendeNummer: number;
  readonly aufgenommenAm: number;
  readonly ablaufKennung: string;
}

function istObjekt(wert: unknown): wert is Objekt {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function bekannt<TWert>(quelle: WissensQuelle, bekanntSeit: number, wert: TWert, sicherheit = 1): BekannterWert<TWert> {
  return { zustand: 'bekannt', quelle, sicherheit, bekanntSeit, wert };
}

function fehlend(grund: string): FehlenderWert {
  return { zustand: 'fehlend', quelle: 'beobachtet', grund };
}

function unbekannt(quelle: WissensQuelle, grund: string): UnbekannterWert {
  return { zustand: 'unbekannt', quelle, grund };
}

const alsText: Umwandlung<string> = (wert) =>
  typeof wert === 'string' ? { gueltig: true, wert } : { gueltig: false };

const alsKennung: Umwandlung<string> = (wert) =>
  typeof wert === 'string' || typeof wert === 'number'
    ? { gueltig: true, wert: String(wert) }
    : { gueltig: false };

const alsZahl: Umwandlung<number> = (wert) =>
  typeof wert === 'number' && Number.isFinite(wert)
    ? { gueltig: true, wert }
    : { gueltig: false };

const alsBoolean: Umwandlung<boolean> = (wert) =>
  typeof wert === 'boolean' ? { gueltig: true, wert } : { gueltig: false };

const alsTextOderNull: Umwandlung<string | null> = (wert) => {
  if (wert === null) return { gueltig: true, wert: null };
  return alsKennung(wert);
};

const alsBooleanOderNull: Umwandlung<boolean | null> = (wert) => {
  if (wert === null) return { gueltig: true, wert: null };
  return alsBoolean(wert);
};

const alsEigenschaft: Umwandlung<string | null> = (wert) => {
  if (wert === null) return { gueltig: true, wert: null };
  return alsText(wert);
};

const alsAblauf: Umwandlung<number | string | null> = (wert) => {
  if (wert === null) return { gueltig: true, wert: null };
  if (typeof wert === 'string') return { gueltig: true, wert };
  return alsZahl(wert);
};

function beobachteFeld<TWert>(objekt: Objekt, feld: string, umwandlung: Umwandlung<TWert>, aufgenommenAm: number): WissensWert<TWert> {
  if (!(feld in objekt)) return fehlend(`Adventure Land liefert Feld "${feld}" nicht.`);
  const ergebnis = umwandlung(objekt[feld]);
  if (!ergebnis.gueltig) return unbekannt('beobachtet', `Adventure-Land-Feld "${feld}" hat einen unerwarteten Typ.`);
  return bekannt('beobachtet', aufgenommenAm, ergebnis.wert);
}

function ausRohwert<TWert>(rohwert: GelesenerAdventureLandWert, aufgenommenAm: number, name: string, umwandlung: Umwandlung<TWert>): WissensWert<TWert> {
  if (rohwert.lesefehler !== null) return unbekannt('beobachtet', `${name} konnte nicht gelesen werden: ${rohwert.lesefehler}`);
  if (!rohwert.vorhanden) return fehlend(`${name} wurde von Adventure Land nicht geliefert.`);
  const ergebnis = umwandlung(rohwert.wert);
  if (!ergebnis.gueltig) return unbekannt('beobachtet', `${name} hat einen unerwarteten Typ.`);
  return bekannt('beobachtet', aufgenommenAm, ergebnis.wert);
}

function beobachteGegenstand(objekt: Objekt, aufgenommenAm: number): GegenstandZustand {
  return {
    name: beobachteFeld(objekt, 'name', alsText, aufgenommenAm),
    menge: beobachteFeld(objekt, 'q', alsZahl, aufgenommenAm),
    stufe: beobachteFeld(objekt, 'level', alsZahl, aufgenommenAm),
    eigenschaft: beobachteFeld(objekt, 'p', alsEigenschaft, aufgenommenAm),
    gesperrt: beobachteFeld(objekt, 'locked', alsBoolean, aufgenommenAm),
    ablauf: beobachteFeld(objekt, 'expires', alsAblauf, aufgenommenAm)
  };
}

function beobachteAusruestung(charakter: Objekt, aufgenommenAm: number): WissensWert<Readonly<Record<string, GegenstandZustand | null>>> {
  if (!('slots' in charakter)) return fehlend('Adventure Land liefert character.slots nicht.');
  if (!istObjekt(charakter.slots)) return unbekannt('beobachtet', 'character.slots hat einen unerwarteten Typ.');

  const eintraege = Object.entries(charakter.slots)
    .sort(([links], [rechts]) => links.localeCompare(rechts))
    .map(([platz, gegenstand]): readonly [string, GegenstandZustand | null] => {
      if (gegenstand === null || gegenstand === undefined) return [platz, null];
      if (!istObjekt(gegenstand)) return [platz, null];
      return [platz, beobachteGegenstand(gegenstand, aufgenommenAm)];
    });

  return bekannt('beobachtet', aufgenommenAm, Object.fromEntries(eintraege));
}

function beobachteCharakter(rohwert: GelesenerAdventureLandWert, aufgenommenAm: number): WissensWert<CharakterZustand> {
  if (rohwert.lesefehler !== null) return unbekannt('beobachtet', `character konnte nicht gelesen werden: ${rohwert.lesefehler}`);
  if (!rohwert.vorhanden) return fehlend('character wurde von Adventure Land nicht geliefert.');
  if (!istObjekt(rohwert.wert)) return unbekannt('beobachtet', 'character hat einen unerwarteten Typ.');

  const charakter = rohwert.wert;
  return bekannt('beobachtet', aufgenommenAm, {
    kennung: beobachteFeld(charakter, 'id', alsKennung, aufgenommenAm),
    name: beobachteFeld(charakter, 'name', alsText, aufgenommenAm),
    klasse: beobachteFeld(charakter, 'ctype', alsText, aufgenommenAm),
    stufe: beobachteFeld(charakter, 'level', alsZahl, aufgenommenAm),
    leben: beobachteFeld(charakter, 'hp', alsZahl, aufgenommenAm),
    lebenMaximal: beobachteFeld(charakter, 'max_hp', alsZahl, aufgenommenAm),
    mana: beobachteFeld(charakter, 'mp', alsZahl, aufgenommenAm),
    manaMaximal: beobachteFeld(charakter, 'max_mp', alsZahl, aufgenommenAm),
    erfahrung: beobachteFeld(charakter, 'xp', alsZahl, aufgenommenAm),
    erfahrungNaechsteStufe: beobachteFeld(charakter, 'max_xp', alsZahl, aufgenommenAm),
    gold: beobachteFeld(charakter, 'gold', alsZahl, aufgenommenAm),
    angriff: beobachteFeld(charakter, 'attack', alsZahl, aufgenommenAm),
    angriffsFrequenz: beobachteFeld(charakter, 'frequency', alsZahl, aufgenommenAm),
    geschwindigkeit: beobachteFeld(charakter, 'speed', alsZahl, aufgenommenAm),
    reichweite: beobachteFeld(charakter, 'range', alsZahl, aufgenommenAm),
    ruestung: beobachteFeld(charakter, 'armor', alsZahl, aufgenommenAm),
    resistenz: beobachteFeld(charakter, 'resistance', alsZahl, aufgenommenAm),
    karte: beobachteFeld(charakter, 'map', alsText, aufgenommenAm),
    instanz: beobachteFeld(charakter, 'in', alsText, aufgenommenAm),
    x: beobachteFeld(charakter, 'x', alsZahl, aufgenommenAm),
    y: beobachteFeld(charakter, 'y', alsZahl, aufgenommenAm),
    echtX: beobachteFeld(charakter, 'real_x', alsZahl, aufgenommenAm),
    echtY: beobachteFeld(charakter, 'real_y', alsZahl, aufgenommenAm),
    bewegtSich: beobachteFeld(charakter, 'moving', alsBoolean, aufgenommenAm),
    ziel: beobachteFeld(charakter, 'target', alsTextOderNull, aufgenommenAm),
    tot: beobachteFeld(charakter, 'rip', alsBooleanOderNull, aufgenommenAm),
    standAktiv: beobachteFeld(charakter, 'stand', alsBooleanOderNull, aufgenommenAm),
    ausruestung: beobachteAusruestung(charakter, aufgenommenAm)
  });
}

function beobachteInventar(rohwert: GelesenerAdventureLandWert, aufgenommenAm: number): WissensWert<readonly InventarPlatzZustand[]> {
  if (rohwert.lesefehler !== null) return unbekannt('beobachtet', `character konnte fuer das Inventar nicht gelesen werden: ${rohwert.lesefehler}`);
  if (!rohwert.vorhanden) return fehlend('character wurde fuer das Inventar nicht geliefert.');
  if (!istObjekt(rohwert.wert)) return unbekannt('beobachtet', 'character hat fuer das Inventar einen unerwarteten Typ.');
  if (!('items' in rohwert.wert)) return fehlend('Adventure Land liefert character.items nicht.');
  if (!Array.isArray(rohwert.wert.items)) return unbekannt('beobachtet', 'character.items hat einen unerwarteten Typ.');

  const plaetze = rohwert.wert.items.map((gegenstand, platz): InventarPlatzZustand => {
    if (gegenstand === null || gegenstand === undefined) {
      return { platz, gegenstand: bekannt('beobachtet', aufgenommenAm, null) };
    }
    if (!istObjekt(gegenstand)) {
      return { platz, gegenstand: unbekannt('beobachtet', `Inventarplatz ${platz} hat einen unerwarteten Typ.`) };
    }
    return { platz, gegenstand: bekannt('beobachtet', aufgenommenAm, beobachteGegenstand(gegenstand, aufgenommenAm)) };
  });

  return bekannt('beobachtet', aufgenommenAm, plaetze);
}

function beobachteSichtbaresObjekt(objekt: Objekt, idFallback: string, aufgenommenAm: number): SichtbaresObjektZustand {
  const kennung = 'id' in objekt
    ? beobachteFeld(objekt, 'id', alsKennung, aufgenommenAm)
    : bekannt('beobachtet', aufgenommenAm, idFallback);

  return {
    kennung,
    name: beobachteFeld(objekt, 'name', alsText, aufgenommenAm),
    art: beobachteFeld(objekt, 'type', alsText, aufgenommenAm),
    monsterArt: beobachteFeld(objekt, 'mtype', alsText, aufgenommenAm),
    klasse: beobachteFeld(objekt, 'ctype', alsText, aufgenommenAm),
    besitzer: beobachteFeld(objekt, 'owner', alsText, aufgenommenAm),
    stufe: beobachteFeld(objekt, 'level', alsZahl, aufgenommenAm),
    leben: beobachteFeld(objekt, 'hp', alsZahl, aufgenommenAm),
    lebenMaximal: beobachteFeld(objekt, 'max_hp', alsZahl, aufgenommenAm),
    mana: beobachteFeld(objekt, 'mp', alsZahl, aufgenommenAm),
    manaMaximal: beobachteFeld(objekt, 'max_mp', alsZahl, aufgenommenAm),
    angriff: beobachteFeld(objekt, 'attack', alsZahl, aufgenommenAm),
    angriffsFrequenz: beobachteFeld(objekt, 'frequency', alsZahl, aufgenommenAm),
    geschwindigkeit: beobachteFeld(objekt, 'speed', alsZahl, aufgenommenAm),
    reichweite: beobachteFeld(objekt, 'range', alsZahl, aufgenommenAm),
    ruestung: beobachteFeld(objekt, 'armor', alsZahl, aufgenommenAm),
    resistenz: beobachteFeld(objekt, 'resistance', alsZahl, aufgenommenAm),
    karte: beobachteFeld(objekt, 'map', alsText, aufgenommenAm),
    instanz: beobachteFeld(objekt, 'in', alsText, aufgenommenAm),
    x: beobachteFeld(objekt, 'x', alsZahl, aufgenommenAm),
    y: beobachteFeld(objekt, 'y', alsZahl, aufgenommenAm),
    echtX: beobachteFeld(objekt, 'real_x', alsZahl, aufgenommenAm),
    echtY: beobachteFeld(objekt, 'real_y', alsZahl, aufgenommenAm),
    bewegtSich: beobachteFeld(objekt, 'moving', alsBoolean, aufgenommenAm),
    ziel: beobachteFeld(objekt, 'target', alsTextOderNull, aufgenommenAm),
    tot: beobachteFeld(objekt, 'dead', alsBooleanOderNull, aufgenommenAm),
    gruppe: beobachteFeld(objekt, 'party', alsTextOderNull, aufgenommenAm)
  };
}

interface BeobachteteObjektListen {
  readonly monster: WissensWert<readonly SichtbaresObjektZustand[]>;
  readonly spieler: WissensWert<readonly SichtbaresObjektZustand[]>;
  readonly npcs: WissensWert<readonly SichtbaresObjektZustand[]>;
  readonly sonstigeObjekte: WissensWert<readonly SichtbaresObjektZustand[]>;
}

function beobachteObjektListen(rohwert: GelesenerAdventureLandWert, aufgenommenAm: number): BeobachteteObjektListen {
  const fehler = rohwert.lesefehler !== null
    ? unbekannt('beobachtet', `entities konnte nicht gelesen werden: ${rohwert.lesefehler}`)
    : !rohwert.vorhanden
      ? fehlend('entities wurde von Adventure Land nicht geliefert.')
      : !istObjekt(rohwert.wert)
        ? unbekannt('beobachtet', 'entities hat einen unerwarteten Typ.')
        : null;

  if (fehler !== null) {
    return { monster: fehler, spieler: fehler, npcs: fehler, sonstigeObjekte: fehler };
  }

  const monster: SichtbaresObjektZustand[] = [];
  const spieler: SichtbaresObjektZustand[] = [];
  const npcs: SichtbaresObjektZustand[] = [];
  const sonstigeObjekte: SichtbaresObjektZustand[] = [];

  for (const [id, wert] of Object.entries(rohwert.wert as Objekt).sort(([links], [rechts]) => links.localeCompare(rechts))) {
    if (!istObjekt(wert)) continue;
    const zustand = beobachteSichtbaresObjekt(wert, id, aufgenommenAm);
    const art = typeof wert.type === 'string' ? wert.type : null;
    if (art === 'monster') monster.push(zustand);
    else if (art === 'character') spieler.push(zustand);
    else if (art === 'npc') npcs.push(zustand);
    else sonstigeObjekte.push(zustand);
  }

  return {
    monster: bekannt('beobachtet', aufgenommenAm, monster),
    spieler: bekannt('beobachtet', aufgenommenAm, spieler),
    npcs: bekannt('beobachtet', aufgenommenAm, npcs),
    sonstigeObjekte: bekannt('beobachtet', aufgenommenAm, sonstigeObjekte)
  };
}

function beobachteGruppenMitglied(wert: unknown, nameFallback: string, aufgenommenAm: number): GruppenMitgliedZustand {
  const objekt = istObjekt(wert) ? wert : { name: typeof wert === 'string' ? wert : nameFallback };
  return {
    name: 'name' in objekt ? beobachteFeld(objekt, 'name', alsText, aufgenommenAm) : bekannt('beobachtet', aufgenommenAm, nameFallback),
    art: beobachteFeld(objekt, 'type', alsText, aufgenommenAm),
    haut: beobachteFeld(objekt, 'skin', alsText, aufgenommenAm),
    stufe: beobachteFeld(objekt, 'level', alsZahl, aufgenommenAm),
    leben: beobachteFeld(objekt, 'hp', alsZahl, aufgenommenAm),
    lebenMaximal: beobachteFeld(objekt, 'max_hp', alsZahl, aufgenommenAm),
    mana: beobachteFeld(objekt, 'mp', alsZahl, aufgenommenAm),
    manaMaximal: beobachteFeld(objekt, 'max_mp', alsZahl, aufgenommenAm),
    karte: beobachteFeld(objekt, 'map', alsText, aufgenommenAm),
    instanz: beobachteFeld(objekt, 'in', alsText, aufgenommenAm),
    x: beobachteFeld(objekt, 'x', alsZahl, aufgenommenAm),
    y: beobachteFeld(objekt, 'y', alsZahl, aufgenommenAm)
  };
}

function beobachteGruppe(rohwert: GelesenerAdventureLandWert, aufgenommenAm: number): WissensWert<readonly GruppenMitgliedZustand[]> {
  if (rohwert.lesefehler !== null) return unbekannt('beobachtet', `party konnte nicht gelesen werden: ${rohwert.lesefehler}`);
  if (!rohwert.vorhanden) return fehlend('party wurde von Adventure Land nicht geliefert.');

  let eintraege: readonly (readonly [string, unknown])[];
  if (Array.isArray(rohwert.wert)) {
    eintraege = rohwert.wert.map((wert, index) => [String(index), wert] as const);
  } else if (istObjekt(rohwert.wert)) {
    eintraege = Object.entries(rohwert.wert).sort(([links], [rechts]) => links.localeCompare(rechts));
  } else {
    return unbekannt('beobachtet', 'party hat einen unerwarteten Typ.');
  }

  const mitglieder = eintraege.map(([name, wert]) => beobachteGruppenMitglied(wert, name, aufgenommenAm));
  mitglieder.sort((links, rechts) => {
    const linksName = links.name.zustand === 'bekannt' ? links.name.wert : '';
    const rechtsName = rechts.name.zustand === 'bekannt' ? rechts.name.wert : '';
    return linksName.localeCompare(rechtsName);
  });
  return bekannt('beobachtet', aufgenommenAm, mitglieder);
}

function zaehleKartenFeld(kartenDaten: Objekt, feld: string, aufgenommenAm: number): WissensWert<number> {
  if (!(feld in kartenDaten)) return fehlend(`Kartendaten liefern Feld "${feld}" nicht.`);
  const wert = kartenDaten[feld];
  if (Array.isArray(wert)) return bekannt('beobachtet', aufgenommenAm, wert.length);
  if (istObjekt(wert)) return bekannt('beobachtet', aufgenommenAm, Object.keys(wert).length);
  return unbekannt('beobachtet', `Kartendatenfeld "${feld}" hat einen unerwarteten Typ.`);
}

function beobachteKarte(rohDaten: AdventureLandRohdaten, aufgenommenAm: number): WissensWert<KartenZustand> {
  if (rohDaten.charakter.lesefehler !== null) return unbekannt('beobachtet', `character konnte fuer die Karte nicht gelesen werden: ${rohDaten.charakter.lesefehler}`);
  if (!rohDaten.charakter.vorhanden) return fehlend('character wurde fuer die Karte nicht geliefert.');
  if (!istObjekt(rohDaten.charakter.wert)) return unbekannt('beobachtet', 'character hat fuer die Karte einen unerwarteten Typ.');

  const kennung = beobachteFeld(rohDaten.charakter.wert, 'map', alsText, aufgenommenAm);
  if (kennung.zustand !== 'bekannt') return kennung;

  let kartenDaten: Objekt | null = null;
  let statischerFehler: FehlenderWert | UnbekannterWert | null = null;

  if (rohDaten.spielDaten.lesefehler !== null) {
    statischerFehler = unbekannt('beobachtet', `G konnte nicht gelesen werden: ${rohDaten.spielDaten.lesefehler}`);
  } else if (!rohDaten.spielDaten.vorhanden) {
    statischerFehler = fehlend('G wurde von Adventure Land nicht geliefert.');
  } else if (!istObjekt(rohDaten.spielDaten.wert)) {
    statischerFehler = unbekannt('beobachtet', 'G hat einen unerwarteten Typ.');
  } else if (!('maps' in rohDaten.spielDaten.wert) || !istObjekt(rohDaten.spielDaten.wert.maps)) {
    statischerFehler = fehlend('G.maps wurde von Adventure Land nicht geliefert.');
  } else {
    const wert = rohDaten.spielDaten.wert.maps[kennung.wert];
    if (istObjekt(wert)) kartenDaten = wert;
    else statischerFehler = fehlend(`Kartendaten fuer "${kennung.wert}" wurden nicht geliefert.`);
  }

  const statischerWert = <TWert>(feld: string, umwandlung: Umwandlung<TWert>): WissensWert<TWert> => {
    if (kartenDaten !== null) return beobachteFeld(kartenDaten, feld, umwandlung, aufgenommenAm);
    return statischerFehler ?? fehlend('Statische Kartendaten fehlen.');
  };

  const zaehle = (feld: string): WissensWert<number> => {
    if (kartenDaten !== null) return zaehleKartenFeld(kartenDaten, feld, aufgenommenAm);
    return statischerFehler ?? fehlend('Statische Kartendaten fehlen.');
  };

  return bekannt('beobachtet', aufgenommenAm, {
    kennung,
    name: statischerWert('name', alsText),
    zone: statischerWert('zone', alsText),
    sicher: statischerWert('safe', alsBoolean),
    spielerGegenSpieler: statischerWert('pvp', alsBoolean),
    instanziert: statischerWert('instance', alsBoolean),
    ignorieren: statischerWert('ignore', alsBoolean),
    anzahlMonsterGebiete: zaehle('monsters'),
    anzahlSpawnPunkte: zaehle('spawns'),
    anzahlTueren: zaehle('doors'),
    anzahlNpcs: zaehle('npcs')
  });
}

function anteil(zaehler: WissensWert<number>, nenner: WissensWert<number>, aufgenommenAm: number, name: string): WissensWert<number> {
  if (zaehler.zustand !== 'bekannt' || nenner.zustand !== 'bekannt') {
    return unbekannt('abgeleitet', `${name} kann wegen fehlender Beobachtungswerte nicht berechnet werden.`);
  }
  if (nenner.wert <= 0) return unbekannt('abgeleitet', `${name} kann mit einem Maximalwert <= 0 nicht berechnet werden.`);
  return bekannt('abgeleitet', aufgenommenAm, zaehler.wert / nenner.wert);
}

function leiteWissenAb(
  charakter: WissensWert<CharakterZustand>,
  inventar: WissensWert<readonly InventarPlatzZustand[]>,
  monster: WissensWert<readonly SichtbaresObjektZustand[]>,
  aufgenommenAm: number
): AbgeleitetesWissen {
  const lebensAnteil = charakter.zustand === 'bekannt'
    ? anteil(charakter.wert.leben, charakter.wert.lebenMaximal, aufgenommenAm, 'Lebensanteil')
    : unbekannt('abgeleitet', 'Lebensanteil kann ohne bekannten Charakter nicht berechnet werden.');

  const manaAnteil = charakter.zustand === 'bekannt'
    ? anteil(charakter.wert.mana, charakter.wert.manaMaximal, aufgenommenAm, 'Manaanteil')
    : unbekannt('abgeleitet', 'Manaanteil kann ohne bekannten Charakter nicht berechnet werden.');

  let inventarBelegt: WissensWert<number>;
  if (inventar.zustand !== 'bekannt') {
    inventarBelegt = unbekannt('abgeleitet', 'Inventarbelegung kann ohne bekanntes Inventar nicht berechnet werden.');
  } else if (inventar.wert.some((platz) => platz.gegenstand.zustand !== 'bekannt')) {
    inventarBelegt = unbekannt('abgeleitet', 'Inventarbelegung ist wegen unbekannter Inventarplaetze nicht sicher bestimmbar.');
  } else {
    inventarBelegt = bekannt(
      'abgeleitet',
      aufgenommenAm,
      inventar.wert.reduce((summe, platz) => summe + (platz.gegenstand.zustand === 'bekannt' && platz.gegenstand.wert !== null ? 1 : 0), 0)
    );
  }

  const sichtbareMonster = monster.zustand === 'bekannt'
    ? bekannt('abgeleitet', aufgenommenAm, monster.wert.length)
    : unbekannt('abgeleitet', 'Monsteranzahl kann ohne bekannte Entities nicht berechnet werden.');

  return { lebensAnteil, manaAnteil, inventarBelegt, sichtbareMonster };
}

function pruefeErstellungsDaten(daten: SpielzustandErstellungsDaten): void {
  if (!Number.isSafeInteger(daten.laufendeNummer) || daten.laufendeNummer < 0) {
    throw new Error('laufendeNummer muss eine nichtnegative sichere Ganzzahl sein.');
  }
  if (!Number.isFinite(daten.aufgenommenAm) || daten.aufgenommenAm < 0) {
    throw new Error('aufgenommenAm muss eine nichtnegative endliche Zahl sein.');
  }
  if (daten.ablaufKennung.trim().length === 0) throw new Error('ablaufKennung darf nicht leer sein.');
}

export function friereTief<TWert>(wert: TWert): TWert {
  if (typeof wert !== 'object' || wert === null || Object.isFrozen(wert)) return wert;
  for (const unterWert of Object.values(wert as Record<string, unknown>)) friereTief(unterWert);
  return Object.freeze(wert);
}

export function erstelleSpielzustand(rohDaten: AdventureLandRohdaten, daten: SpielzustandErstellungsDaten): Spielzustand {
  pruefeErstellungsDaten(daten);

  const charakter = beobachteCharakter(rohDaten.charakter, daten.aufgenommenAm);
  const inventar = beobachteInventar(rohDaten.charakter, daten.aufgenommenAm);
  const gruppe = beobachteGruppe(rohDaten.gruppe, daten.aufgenommenAm);
  const objekte = beobachteObjektListen(rohDaten.entities, daten.aufgenommenAm);
  const karte = beobachteKarte(rohDaten, daten.aufgenommenAm);

  const zustand: Spielzustand = {
    schemaVersion: 2,
    laufendeNummer: daten.laufendeNummer,
    aufgenommenAm: daten.aufgenommenAm,
    ablaufKennung: daten.ablaufKennung,
    beobachtet: {
      server: {
        region: ausRohwert(rohDaten.serverRegion, daten.aufgenommenAm, 'server_region', alsText),
        kennung: ausRohwert(rohDaten.serverKennung, daten.aufgenommenAm, 'server_identifier', alsText)
      },
      charakter,
      inventar,
      gruppe,
      monster: objekte.monster,
      spieler: objekte.spieler,
      npcs: objekte.npcs,
      sonstigeObjekte: objekte.sonstigeObjekte,
      karte
    },
    abgeleitet: leiteWissenAb(charakter, inventar, objekte.monster, daten.aufgenommenAm),
    gelernt: []
  };

  return friereTief(zustand);
}

export function beobachteSpielzustand(quelle: AdventureLandDatenQuelle, daten: SpielzustandErstellungsDaten): Spielzustand {
  return erstelleSpielzustand(quelle.liesRohdaten(), daten);
}
