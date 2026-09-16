import type { AktionsAnfrage } from '../vertraege/aktions-anfrage.js';
import { erstelleBotMeldung } from '../vertraege/bot-meldung.js';
import type {
  FarmAblaufZustand,
  FarmAktionsArt,
  FarmAktionsDetails,
  FarmEntscheidung,
  FarmKonfiguration,
  FarmWiederholungsDetails
} from '../vertraege/farmen.js';
import { FARM_AKTIONS_NAMEN } from '../vertraege/farmen.js';
import type { CharakterZustand, SichtbaresObjektZustand, Spielzustand, WissensWert } from '../vertraege/spielzustand.js';
import type { WiederholungsEntscheider, WiederholungsEntscheidung } from '../vertraege/wiederholung.js';

const AKTIONS_GUELTIGKEIT_MILLISEKUNDEN = 2_500;

function bekannterWert<T>(wert: WissensWert<T>): T | undefined {
  return wert.zustand === 'bekannt' ? wert.wert : undefined;
}

function pruefeAnteil(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0 || wert > 1) throw new Error(`${name} muss zwischen 0 und 1 liegen.`);
}

function pruefeNichtnegativeZahl(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error('Der Farm-Zeitpunkt muss eine endliche, nichtnegative Zahl sein.');
}

export function erstelleFarmKonfiguration(
  monsterArten: readonly string[],
  aenderungen: Partial<Omit<FarmKonfiguration, 'monsterArten'>> = {}
): Readonly<FarmKonfiguration> {
  const bereinigteMonsterArten = [...new Set(monsterArten.map((wert) => wert.trim()).filter(Boolean))].sort();
  if (bereinigteMonsterArten.length === 0) throw new Error('Grundlegendes Farmen benoetigt mindestens eine ausdruecklich erlaubte MonsterArt.');

  const konfiguration: FarmKonfiguration = {
    monsterArten: Object.freeze(bereinigteMonsterArten),
    lebenWiederherstellenUnter: aenderungen.lebenWiederherstellenUnter ?? 0.5,
    manaWiederherstellenUnter: aenderungen.manaWiederherstellenUnter ?? 0.3,
    reichweitenPuffer: aenderungen.reichweitenPuffer ?? 5,
    mindestensFreieInventarPlaetze: aenderungen.mindestensFreieInventarPlaetze ?? 1,
    stillstandNachMillisekunden: aenderungen.stillstandNachMillisekunden ?? 15_000
  };

  pruefeAnteil('lebenWiederherstellenUnter', konfiguration.lebenWiederherstellenUnter);
  pruefeAnteil('manaWiederherstellenUnter', konfiguration.manaWiederherstellenUnter);
  pruefeNichtnegativeZahl('reichweitenPuffer', konfiguration.reichweitenPuffer);
  if (!Number.isSafeInteger(konfiguration.mindestensFreieInventarPlaetze) || konfiguration.mindestensFreieInventarPlaetze < 1) {
    throw new Error('mindestensFreieInventarPlaetze muss eine positive ganze Zahl sein.');
  }
  if (!Number.isFinite(konfiguration.stillstandNachMillisekunden) || konfiguration.stillstandNachMillisekunden <= 0) {
    throw new Error('stillstandNachMillisekunden muss eine positive endliche Zahl sein.');
  }
  return Object.freeze(konfiguration);
}

function wertKennung<T>(wert: WissensWert<T>): string {
  if (wert.zustand !== 'bekannt') return wert.zustand;
  if (wert.wert === null) return 'null';
  if (typeof wert.wert === 'object') return 'objekt';
  return String(wert.wert);
}

function fortschrittsKennung(spielzustand: Spielzustand): string {
  const charakter = bekannterWert(spielzustand.beobachtet.charakter);
  const inventar = bekannterWert(spielzustand.beobachtet.inventar);
  const monster = bekannterWert(spielzustand.beobachtet.monster) ?? [];
  if (!charakter) return 'charakter-unbekannt';

  const charakterTeil = [
    wertKennung(charakter.erfahrung), wertKennung(charakter.gold),
    wertKennung(charakter.leben), wertKennung(charakter.mana),
    wertKennung(charakter.echtX), wertKennung(charakter.echtY),
    inventar ? String(inventar.filter((platz) => platz.gegenstand.zustand === 'bekannt' && platz.gegenstand.wert !== null).length) : 'inventar-unbekannt'
  ].join(':');
  const monsterTeil = [...monster].map((eintrag) => [
    wertKennung(eintrag.kennung), wertKennung(eintrag.leben),
    wertKennung(eintrag.echtX), wertKennung(eintrag.echtY), wertKennung(eintrag.tot)
  ].join(':')).sort().join('|');
  return `${charakterTeil}#${monsterTeil}`;
}

export function erstelleFarmAblaufZustand(spielzustand: Spielzustand, jetzt = spielzustand.aufgenommenAm): Readonly<FarmAblaufZustand> {
  pruefeZeitpunkt(jetzt);
  return Object.freeze({
    schemaVersion: 1,
    gestartetAm: jetzt,
    letzterFortschrittAm: jetzt,
    letzteFortschrittsKennung: fortschrittsKennung(spielzustand),
    letzteZielKennung: null
  });
}

function aktualisiereFortschritt(spielzustand: Spielzustand, vorher: FarmAblaufZustand, jetzt: number): FarmAblaufZustand {
  const kennung = fortschrittsKennung(spielzustand);
  return Object.freeze({
    ...vorher,
    letzterFortschrittAm: kennung === vorher.letzteFortschrittsKennung ? vorher.letzterFortschrittAm : jetzt,
    letzteFortschrittsKennung: kennung
  });
}

function positionVonCharakter(charakter: CharakterZustand): readonly [number, number] | null {
  const x = bekannterWert(charakter.echtX) ?? bekannterWert(charakter.x);
  const y = bekannterWert(charakter.echtY) ?? bekannterWert(charakter.y);
  return x === undefined || y === undefined ? null : [x, y];
}

function positionVonMonster(monster: SichtbaresObjektZustand): readonly [number, number] | null {
  const x = bekannterWert(monster.echtX) ?? bekannterWert(monster.x);
  const y = bekannterWert(monster.echtY) ?? bekannterWert(monster.y);
  return x === undefined || y === undefined ? null : [x, y];
}

function istLebendesErlaubtesMonster(monster: SichtbaresObjektZustand, erlaubteArten: ReadonlySet<string>): boolean {
  const kennung = bekannterWert(monster.kennung);
  const art = bekannterWert(monster.monsterArt);
  const tot = bekannterWert(monster.tot);
  const leben = bekannterWert(monster.leben);
  if (!kennung || !art || !erlaubteArten.has(art)) return false;
  if (tot === true) return false;
  if (leben !== undefined && leben <= 0) return false;
  return tot === false || (leben !== undefined && leben > 0);
}

function waehleZiel(
  charakter: CharakterZustand,
  monster: readonly SichtbaresObjektZustand[],
  konfiguration: FarmKonfiguration
): SichtbaresObjektZustand | null {
  const charakterPosition = positionVonCharakter(charakter);
  const charakterKarte = bekannterWert(charakter.karte);
  if (!charakterPosition || !charakterKarte) return null;
  const erlaubteArten = new Set(konfiguration.monsterArten);
  const kandidaten = monster.filter((eintrag) => {
    if (!istLebendesErlaubtesMonster(eintrag, erlaubteArten)) return false;
    const monsterKarte = bekannterWert(eintrag.karte);
    return monsterKarte !== undefined && monsterKarte === charakterKarte && positionVonMonster(eintrag) !== null;
  });
  kandidaten.sort((a, b) => {
    const ap = positionVonMonster(a)!;
    const bp = positionVonMonster(b)!;
    const ad = (ap[0] - charakterPosition[0]) ** 2 + (ap[1] - charakterPosition[1]) ** 2;
    const bd = (bp[0] - charakterPosition[0]) ** 2 + (bp[1] - charakterPosition[1]) ** 2;
    if (ad !== bd) return ad - bd;
    return (bekannterWert(a.kennung) ?? '').localeCompare(bekannterWert(b.kennung) ?? '');
  });
  return kandidaten[0] ?? null;
}

function inventarFreiePlaetze(spielzustand: Spielzustand): number | null {
  const inventar = bekannterWert(spielzustand.beobachtet.inventar);
  if (!inventar) return null;
  let frei = 0;
  for (const platz of inventar) {
    if (platz.gegenstand.zustand !== 'bekannt') return null;
    if (platz.gegenstand.wert === null) frei += 1;
  }
  return frei;
}

function meldung(
  jetzt: number,
  code: string,
  titel: string,
  was: string,
  warum: string,
  bot: string,
  handeln: boolean,
  nutzer: string,
  details: Readonly<Record<string, unknown>> = {}
) {
  return erstelleBotMeldung({
    kennung: `farm-meldung-${code.toLowerCase()}-${jetzt}`,
    zeitpunkt: jetzt,
    stufe: handeln ? 'warnung' : 'hinweis',
    meldungsCode: code,
    titel,
    wasIstPassiert: was,
    warumIstEsPassiert: warum,
    wasHatDerBotGetan: bot,
    mussNutzerHandeln: handeln,
    wasSollDerNutzerTun: nutzer,
    technischeDetails: details
  });
}

function anfrage(
  spielzustand: Spielzustand,
  jetzt: number,
  art: Exclude<FarmAktionsArt, 'warten' | 'blockiert'>,
  aktion: string,
  ressourcen: AktionsAnfrage['benoetigteRessourcen'],
  grund: string,
  details: FarmAktionsDetails
): AktionsAnfrage<FarmAktionsDetails> {
  return Object.freeze({
    kennung: `${spielzustand.ablaufKennung}:farm:${spielzustand.laufendeNummer}:${art}`,
    angefordertVon: 'grundlegendes-farmen',
    aktion,
    wichtigkeit: 'normal',
    prioritaet: 100,
    angefordertAm: jetzt,
    gueltigBis: jetzt + AKTIONS_GUELTIGKEIT_MILLISEKUNDEN,
    benoetigteRessourcen: Object.freeze([...ressourcen]),
    grund,
    details: Object.freeze({ ...details })
  });
}

function baueEntscheidung(
  spielzustand: Spielzustand,
  jetzt: number,
  art: FarmAktionsArt,
  grund: string,
  zielKennung: string | null,
  aktionsAnfrage: AktionsAnfrage<FarmAktionsDetails> | null,
  farmMeldung: ReturnType<typeof meldung> | null,
  zustand: FarmAblaufZustand
): Readonly<FarmEntscheidung> {
  const entscheidungsKennung = `${spielzustand.ablaufKennung}:farm-entscheidung:${spielzustand.laufendeNummer}`;
  return Object.freeze({
    schemaVersion: 1,
    entscheidungsKennung,
    zeitpunkt: jetzt,
    art,
    grund,
    zielKennung,
    aktionsAnfrage,
    meldung: farmMeldung,
    ablaufBeobachtung: Object.freeze({
      kennung: `${entscheidungsKennung}:beobachtung`,
      ablaufKennung: spielzustand.ablaufKennung,
      zeitpunkt: jetzt,
      zustand: art,
      fortschrittKennung: zustand.letzteFortschrittsKennung,
      entscheidungKennung: entscheidungsKennung,
      gestartetAm: zustand.gestartetAm,
      letzterFortschrittAm: zustand.letzterFortschrittAm
    }),
    naechsterAblaufZustand: zustand
  });
}

export function planeGrundlegendenFarmSchritt(
  spielzustand: Spielzustand,
  konfiguration: FarmKonfiguration,
  vorherigerZustand: FarmAblaufZustand,
  jetzt = spielzustand.aufgenommenAm
): Readonly<FarmEntscheidung> {
  pruefeZeitpunkt(jetzt);
  const normalisiert = erstelleFarmKonfiguration(konfiguration.monsterArten, konfiguration);
  let zustand = aktualisiereFortschritt(spielzustand, vorherigerZustand, jetzt);
  const charakter = bekannterWert(spielzustand.beobachtet.charakter);
  if (!charakter) {
    return baueEntscheidung(spielzustand, jetzt, 'blockiert', 'Der Charakterzustand ist nicht bekannt.', null, null,
      meldung(jetzt, 'FARM_VORAUSSETZUNG_FEHLT', 'Farmen wartet auf Charakterdaten', 'Der Farmablauf kann den Charakter nicht sicher beurteilen.', 'Der zentrale Spielzustand enthaelt keinen bekannten Charakter.', 'Es wird keine Spielaktion angefordert.', false, 'Keine Aktion erforderlich; Datenquelle und naechsten Zustand abwarten.'), zustand);
  }

  const tot = bekannterWert(charakter.tot);
  if (tot !== false) {
    return baueEntscheidung(spielzustand, jetzt, 'blockiert', 'Der lebende Charakterzustand ist nicht sicher bestaetigt.', null, null,
      meldung(jetzt, 'FARM_CHARAKTER_NICHT_BEREIT', 'Farmen ist blockiert', 'Der Charakter ist tot oder sein Lebenszustand ist unbekannt.', 'Block 6 fuehrt ohne bestaetigt lebenden Charakter keine Farmaktion aus.', 'Es wird keine Spielaktion angefordert.', tot === true, tot === true ? 'Charakter wiederbeleben und den Farmablauf danach neu pruefen.' : 'Spielzustandsdaten pruefen.'), zustand);
  }

  const lebensAnteil = bekannterWert(spielzustand.abgeleitet.lebensAnteil);
  const manaAnteil = bekannterWert(spielzustand.abgeleitet.manaAnteil);
  if (lebensAnteil === undefined || manaAnteil === undefined) {
    return baueEntscheidung(spielzustand, jetzt, 'blockiert', 'Lebens- oder Manaanteil ist unbekannt.', null, null,
      meldung(jetzt, 'FARM_RESSOURCENDATEN_FEHLEN', 'Lebens- oder Manadaten fehlen', 'Die Wiederherstellung kann nicht sicher geplant werden.', 'Mindestens ein benoetigter Anteil ist im Spielzustand unbekannt.', 'Der Bot fordert keine Kampfaktion an.', false, 'Datenquelle pruefen oder den naechsten vollstaendigen Spielzustand abwarten.'), zustand);
  }

  if (lebensAnteil < normalisiert.lebenWiederherstellenUnter) {
    const grund = `Lebensanteil ${lebensAnteil.toFixed(3)} liegt unter der Schwelle ${normalisiert.lebenWiederherstellenUnter.toFixed(3)}.`;
    return baueEntscheidung(spielzustand, jetzt, 'leben_wiederherstellen', grund, null,
      anfrage(spielzustand, jetzt, 'leben_wiederherstellen', FARM_AKTIONS_NAMEN.lebenWiederherstellen, ['inventar'], grund,
        { anteil: lebensAnteil, schwelle: normalisiert.lebenWiederherstellenUnter }), null, zustand);
  }

  if (manaAnteil < normalisiert.manaWiederherstellenUnter) {
    const grund = `Manaanteil ${manaAnteil.toFixed(3)} liegt unter der Schwelle ${normalisiert.manaWiederherstellenUnter.toFixed(3)}.`;
    return baueEntscheidung(spielzustand, jetzt, 'mana_wiederherstellen', grund, null,
      anfrage(spielzustand, jetzt, 'mana_wiederherstellen', FARM_AKTIONS_NAMEN.manaWiederherstellen, ['inventar'], grund,
        { anteil: manaAnteil, schwelle: normalisiert.manaWiederherstellenUnter }), null, zustand);
  }

  const freiePlaetze = inventarFreiePlaetze(spielzustand);
  if (freiePlaetze === null) {
    return baueEntscheidung(spielzustand, jetzt, 'blockiert', 'Der freie Inventarplatz ist nicht sicher bestimmbar.', null, null,
      meldung(jetzt, 'FARM_INVENTAR_UNBEKANNT', 'Inventardaten fehlen', 'Der Bot kann nicht sicher feststellen, ob Beute aufgenommen werden kann.', 'Mindestens ein Inventarplatz ist unbekannt.', 'Farmen wird konservativ angehalten.', false, 'Inventardaten pruefen oder den naechsten vollstaendigen Spielzustand abwarten.'), zustand);
  }
  if (freiePlaetze < normalisiert.mindestensFreieInventarPlaetze) {
    return baueEntscheidung(spielzustand, jetzt, 'blockiert', `Nur ${freiePlaetze} freie Inventarplaetze verfuegbar.`, null, null,
      meldung(jetzt, 'FARM_INVENTAR_VOLL', 'Inventargrenze erreicht', 'Der einfache Farmablauf hat nicht genug freien Inventarplatz.', 'Block 6 verkauft, zerstoert oder verschiebt Gegenstaende absichtlich noch nicht.', 'Neue Kampf- und Beuteaktionen werden angehalten.', true, 'Inventar manuell freimachen; Bank- und Handelsautomatik folgen erst in spaeteren Bloecken.', { freiePlaetze }), zustand);
  }

  const monster = bekannterWert(spielzustand.beobachtet.monster);
  if (!monster) {
    return baueEntscheidung(spielzustand, jetzt, 'blockiert', 'Die sichtbaren Monster sind unbekannt.', null, null,
      meldung(jetzt, 'FARM_MONSTERDATEN_FEHLEN', 'Monsterdaten fehlen', 'Es kann kein sicheres Farmziel gewaehlt werden.', 'Der zentrale Spielzustand enthaelt keine bekannte Monsterliste.', 'Es wird keine Spielaktion angefordert.', false, 'Datenquelle pruefen oder den naechsten vollstaendigen Spielzustand abwarten.'), zustand);
  }

  if (zustand.letzteZielKennung !== null) {
    const vorherigesZielNochLebend = monster.some((eintrag) => bekannterWert(eintrag.kennung) === zustand.letzteZielKennung &&
      istLebendesErlaubtesMonster(eintrag, new Set(normalisiert.monsterArten)));
    if (!vorherigesZielNochLebend) {
      const vorherigeZielKennung = zustand.letzteZielKennung;
      zustand = Object.freeze({ ...zustand, letzteZielKennung: null });
      const grund = `Das vorherige Farmziel ${vorherigeZielKennung} ist nicht mehr als lebendes Ziel sichtbar; vorhandene Beute wird aufgenommen.`;
      return baueEntscheidung(spielzustand, jetzt, 'beute_aufnehmen', grund, null,
        anfrage(spielzustand, jetzt, 'beute_aufnehmen', FARM_AKTIONS_NAMEN.beuteAufnehmen, ['inventar'], grund,
          { vorherigeZielKennung }), null, zustand);
    }
  }

  const ziel = waehleZiel(charakter, monster, normalisiert);
  if (!ziel) {
    const warnung = jetzt - zustand.letzterFortschrittAm >= normalisiert.stillstandNachMillisekunden
      ? meldung(jetzt, 'FARM_STILLSTAND', 'Farmablauf macht keinen Fortschritt', 'Seit der Stillstandsgrenze wurde keine relevante Zustandsaenderung beobachtet.', 'Es ist kein vollstaendig bekanntes erlaubtes Ziel erreichbar beziehungsweise sichtbar.', 'Es wird keine unsichere Ersatzaktion erfunden.', true, 'MonsterArt, Position, Karte und Sichtbarkeit pruefen.', { letzterFortschrittAm: zustand.letzterFortschrittAm })
      : meldung(jetzt, 'FARM_KEIN_ZIEL', 'Kein passendes Farmziel sichtbar', 'Aktuell ist kein vollstaendig bekanntes erlaubtes Monster sichtbar.', 'Block 6 waehlt nur ausdruecklich erlaubte, lebende und positionierbare Ziele auf derselben Karte.', 'Der Bot wartet ohne Spielaktion.', false, 'Keine Aktion erforderlich; Farmgebiet oder erlaubte MonsterArten pruefen, falls dies laenger anhaelt.');
    return baueEntscheidung(spielzustand, jetzt, 'warten', 'Kein passendes sichtbares Farmziel.', null, null, warnung, zustand);
  }

  const zielKennung = bekannterWert(ziel.kennung)!;
  const charakterPosition = positionVonCharakter(charakter);
  const zielPosition = positionVonMonster(ziel);
  const reichweite = bekannterWert(charakter.reichweite);
  if (!charakterPosition || !zielPosition || reichweite === undefined || reichweite < 0) {
    return baueEntscheidung(spielzustand, jetzt, 'blockiert', 'Position oder Angriffsreichweite ist unbekannt.', zielKennung, null,
      meldung(jetzt, 'FARM_POSITIONS_DATEN_FEHLEN', 'Bewegungs- oder Reichweitendaten fehlen', 'Das ausgewaehlte Ziel kann nicht sicher erreicht oder angegriffen werden.', 'Position oder Reichweite ist im Spielzustand unbekannt.', 'Es wird keine Bewegung und kein Angriff angefordert.', false, 'Spielzustandsdaten pruefen.'), zustand);
  }

  zustand = Object.freeze({ ...zustand, letzteZielKennung: zielKennung });
  const abstand = Math.hypot(zielPosition[0] - charakterPosition[0], zielPosition[1] - charakterPosition[1]);
  const sichereReichweite = Math.max(0, reichweite - normalisiert.reichweitenPuffer);
  if (abstand > sichereReichweite) {
    const grund = `Ziel ${zielKennung} ist ${abstand.toFixed(2)} entfernt und liegt ausserhalb der Farm-Angriffsreichweite ${sichereReichweite.toFixed(2)}.`;
    const stallMeldung = jetzt - zustand.letzterFortschrittAm >= normalisiert.stillstandNachMillisekunden
      ? meldung(jetzt, 'FARM_STILLSTAND', 'Bewegung ohne Fortschritt', 'Der Farmablauf versucht weiter ein Ziel zu erreichen, aber der beobachtete Zustand aendert sich nicht.', 'Die Stillstandsgrenze wurde ueberschritten.', 'Die Bewegung bleibt zentral ressourcengesteuert; es werden keine zusaetzlichen Umgehungsaktionen gestartet.', true, 'Bewegungsweg und Karte pruefen.', { zielKennung, abstand })
      : null;
    return baueEntscheidung(spielzustand, jetzt, 'bewegen', grund, zielKennung,
      anfrage(spielzustand, jetzt, 'bewegen', FARM_AKTIONS_NAMEN.bewegen, ['bewegung', 'kampfziel'], grund,
        { zielKennung, x: zielPosition[0], y: zielPosition[1] }), stallMeldung, zustand);
  }

  const grund = `Ziel ${zielKennung} liegt mit Abstand ${abstand.toFixed(2)} innerhalb der Farm-Angriffsreichweite ${sichereReichweite.toFixed(2)}.`;
  const stallMeldung = jetzt - zustand.letzterFortschrittAm >= normalisiert.stillstandNachMillisekunden
    ? meldung(jetzt, 'FARM_STILLSTAND', 'Angriff ohne erkennbaren Fortschritt', 'Der Farmablauf fordert Angriffe an, aber der beobachtete Zustand aendert sich nicht.', 'Die Stillstandsgrenze wurde ueberschritten.', 'Weitere Aktionen laufen weiterhin nur ueber die zentrale AktionsSteuerung.', true, 'Ziel, Angriffsfunktion und Spielverbindung pruefen.', { zielKennung })
    : null;
  return baueEntscheidung(spielzustand, jetzt, 'angreifen', grund, zielKennung,
    anfrage(spielzustand, jetzt, 'angreifen', FARM_AKTIONS_NAMEN.angreifen, ['kampfziel'], grund,
      { zielKennung }), stallMeldung, zustand);
}

function holeVorherigenFarmZustand(
  vorherigeEntscheidungen: readonly WiederholungsEntscheidung[],
  charakterKennung: string,
  spielzustand: Spielzustand
): FarmAblaufZustand {
  for (let index = vorherigeEntscheidungen.length - 1; index >= 0; index -= 1) {
    const eintrag = vorherigeEntscheidungen[index];
    if (!eintrag || eintrag.charakterKennung !== charakterKennung) continue;
    const details = eintrag.details as Partial<FarmWiederholungsDetails> | null;
    const zustand = details?.naechsterAblaufZustand;
    if (zustand?.schemaVersion === 1) return zustand;
  }
  return erstelleFarmAblaufZustand(spielzustand);
}

export function erstelleFarmWiederholungsEntscheider(konfiguration: FarmKonfiguration): WiederholungsEntscheider {
  const normalisiert = erstelleFarmKonfiguration(konfiguration.monsterArten, konfiguration);
  return (kontext) => {
    const vorher = holeVorherigenFarmZustand(kontext.vorherigeEntscheidungen, kontext.charakterKennung, kontext.spielzustand);
    const farm = planeGrundlegendenFarmSchritt(kontext.spielzustand, normalisiert, vorher, kontext.jetzt);
    const details: FarmWiederholungsDetails = Object.freeze({
      art: farm.art,
      zielKennung: farm.zielKennung,
      aktionsName: farm.aktionsAnfrage?.aktion ?? null,
      naechsterAblaufZustand: farm.naechsterAblaufZustand,
      meldungsCode: farm.meldung?.meldungsCode ?? null
    });
    return Object.freeze({
      kennung: `farm:${kontext.spielzustand.laufendeNummer}`,
      zeitpunkt: kontext.jetzt,
      charakterKennung: kontext.charakterKennung,
      entscheidung: farm.art,
      grund: farm.grund,
      sicherheitszustand: farm.art === 'blockiert' ? 'warnung' : 'sicher',
      bewertungsWert: farm.aktionsAnfrage === null ? 0 : 1,
      details
    });
  };
}
