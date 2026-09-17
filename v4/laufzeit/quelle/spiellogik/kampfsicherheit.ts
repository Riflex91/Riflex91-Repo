import type { AktionsAnfrage } from '../vertraege/aktions-anfrage.js';
import { erstelleBotMeldung } from '../vertraege/bot-meldung.js';
import type {
  KampfGefahrenBewertung,
  KampfSicherheitsAblaufZustand,
  KampfSicherheitsAktionsArt,
  KampfSicherheitsAktionsDetails,
  KampfSicherheitsEntscheidung,
  KampfSicherheitsKonfiguration
} from '../vertraege/kampfsicherheit.js';
import { KAMPF_SICHERHEITS_AKTIONS_NAMEN } from '../vertraege/kampfsicherheit.js';
import type { CharakterZustand, SichtbaresObjektZustand, Spielzustand, WissensWert } from '../vertraege/spielzustand.js';

const AKTIONS_GUELTIGKEIT_MILLISEKUNDEN = 2_500;

function bekannterWert<T>(wert: WissensWert<T> | undefined): T | undefined {
  return wert?.zustand === 'bekannt' ? wert.wert : undefined;
}

function pruefeAnteil(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0 || wert > 1) throw new Error(`${name} muss zwischen 0 und 1 liegen.`);
}

function pruefePositiveZahl(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert <= 0) throw new Error(`${name} muss eine positive endliche Zahl sein.`);
}

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error('Der Kampf-Sicherheitszeitpunkt muss eine endliche, nichtnegative Zahl sein.');
}

export function erstelleKampfSicherheitsKonfiguration(
  aenderungen: Partial<KampfSicherheitsKonfiguration> = {}
): Readonly<KampfSicherheitsKonfiguration> {
  const konfiguration: KampfSicherheitsKonfiguration = {
    rueckzugUnterLebensAnteil: aenderungen.rueckzugUnterLebensAnteil ?? 0.45,
    kritischUnterLebensAnteil: aenderungen.kritischUnterLebensAnteil ?? 0.25,
    mindestensManaAnteilImKampf: aenderungen.mindestensManaAnteilImKampf ?? 0.12,
    maximalAngreifer: aenderungen.maximalAngreifer ?? 2,
    mindestAbstandFaktor: aenderungen.mindestAbstandFaktor ?? 0.55,
    rueckzugDistanz: aenderungen.rueckzugDistanz ?? 160,
    bewegungsStillstandNachMillisekunden: aenderungen.bewegungsStillstandNachMillisekunden ?? 3_000
  };

  pruefeAnteil('rueckzugUnterLebensAnteil', konfiguration.rueckzugUnterLebensAnteil);
  pruefeAnteil('kritischUnterLebensAnteil', konfiguration.kritischUnterLebensAnteil);
  pruefeAnteil('mindestensManaAnteilImKampf', konfiguration.mindestensManaAnteilImKampf);
  if (konfiguration.kritischUnterLebensAnteil > konfiguration.rueckzugUnterLebensAnteil) {
    throw new Error('kritischUnterLebensAnteil darf nicht groesser als rueckzugUnterLebensAnteil sein.');
  }
  if (!Number.isSafeInteger(konfiguration.maximalAngreifer) || konfiguration.maximalAngreifer < 1) {
    throw new Error('maximalAngreifer muss eine positive ganze Zahl sein.');
  }
  pruefePositiveZahl('mindestAbstandFaktor', konfiguration.mindestAbstandFaktor);
  pruefePositiveZahl('rueckzugDistanz', konfiguration.rueckzugDistanz);
  pruefePositiveZahl('bewegungsStillstandNachMillisekunden', konfiguration.bewegungsStillstandNachMillisekunden);
  return Object.freeze(konfiguration);
}

function charakterPosition(charakter: CharakterZustand): readonly [number, number] | null {
  const x = bekannterWert(charakter.echtX) ?? bekannterWert(charakter.x);
  const y = bekannterWert(charakter.echtY) ?? bekannterWert(charakter.y);
  return x === undefined || y === undefined ? null : [x, y];
}

function objektPosition(objekt: SichtbaresObjektZustand): readonly [number, number] | null {
  const x = bekannterWert(objekt.echtX) ?? bekannterWert(objekt.x);
  const y = bekannterWert(objekt.echtY) ?? bekannterWert(objekt.y);
  return x === undefined || y === undefined ? null : [x, y];
}

function positionKennung(charakter: CharakterZustand): string | null {
  const position = charakterPosition(charakter);
  return position ? `${position[0]}:${position[1]}` : null;
}

function entfernung(a: readonly [number, number], b: readonly [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function istLebend(objekt: SichtbaresObjektZustand): boolean {
  const tot = bekannterWert(objekt.tot);
  const leben = bekannterWert(objekt.leben);
  if (tot === true) return false;
  if (leben !== undefined && leben <= 0) return false;
  return tot === false || (leben !== undefined && leben > 0);
}

function angreiferFuerCharakter(spielzustand: Spielzustand, charakter: CharakterZustand): readonly SichtbaresObjektZustand[] {
  const monster = bekannterWert(spielzustand.beobachtet.monster) ?? [];
  const charakterKennung = bekannterWert(charakter.kennung);
  const charakterName = bekannterWert(charakter.name);
  const charakterKarte = bekannterWert(charakter.karte);
  if (!charakterKennung && !charakterName) return Object.freeze([]);

  const ergebnis = monster.filter((eintrag) => {
    if (!istLebend(eintrag)) return false;
    const ziel = bekannterWert(eintrag.ziel);
    if (ziel === undefined || (ziel !== charakterKennung && ziel !== charakterName)) return false;
    const karte = bekannterWert(eintrag.karte);
    if (charakterKarte !== undefined && karte !== undefined && karte !== charakterKarte) return false;
    return true;
  });

  ergebnis.sort((a, b) => (bekannterWert(a.kennung) ?? '').localeCompare(bekannterWert(b.kennung) ?? ''));
  return Object.freeze(ergebnis);
}

export function erstelleKampfSicherheitsAblaufZustand(
  spielzustand: Spielzustand,
  jetzt = spielzustand.aufgenommenAm
): Readonly<KampfSicherheitsAblaufZustand> {
  pruefeZeitpunkt(jetzt);
  const charakter = bekannterWert(spielzustand.beobachtet.charakter);
  return Object.freeze({
    schemaVersion: 1,
    gestartetAm: jetzt,
    letztePositionKennung: charakter ? positionKennung(charakter) : null,
    letzterPositionsFortschrittAm: jetzt,
    sicherheitsBewegungAktivSeit: null
  });
}

export function markiereSicherheitsBewegungGestartet(
  spielzustand: Spielzustand,
  vorherigerZustand: KampfSicherheitsAblaufZustand,
  jetzt = spielzustand.aufgenommenAm
): Readonly<KampfSicherheitsAblaufZustand> {
  pruefeZeitpunkt(jetzt);
  const charakter = bekannterWert(spielzustand.beobachtet.charakter);
  return Object.freeze({
    ...vorherigerZustand,
    letztePositionKennung: charakter ? positionKennung(charakter) : vorherigerZustand.letztePositionKennung,
    letzterPositionsFortschrittAm: jetzt,
    sicherheitsBewegungAktivSeit: jetzt
  });
}

function aktualisiereBewegungsFortschritt(
  charakter: CharakterZustand,
  vorherigerZustand: KampfSicherheitsAblaufZustand,
  jetzt: number
): Readonly<KampfSicherheitsAblaufZustand> {
  const kennung = positionKennung(charakter);
  if (kennung !== null && kennung !== vorherigerZustand.letztePositionKennung) {
    return Object.freeze({
      ...vorherigerZustand,
      letztePositionKennung: kennung,
      letzterPositionsFortschrittAm: jetzt
    });
  }
  return vorherigerZustand;
}

function bewerteGefahr(
  spielzustand: Spielzustand,
  charakter: CharakterZustand,
  konfiguration: KampfSicherheitsKonfiguration
): KampfGefahrenBewertung {
  const lebensAnteil = bekannterWert(spielzustand.abgeleitet.lebensAnteil);
  const manaAnteil = bekannterWert(spielzustand.abgeleitet.manaAnteil);
  const position = charakterPosition(charakter);
  const reichweite = bekannterWert(charakter.reichweite);
  const angreifer = angreiferFuerCharakter(spielzustand, charakter);
  const angreiferKennungen = angreifer.map((eintrag) => bekannterWert(eintrag.kennung)).filter((wert): wert is string => Boolean(wert));
  const abstaende = position
    ? angreifer.map(objektPosition).filter((wert): wert is readonly [number, number] => wert !== null).map((wert) => entfernung(position, wert))
    : [];
  const naechsterAngreiferAbstand = abstaende.length > 0 ? Math.min(...abstaende) : null;
  const mindestAbstand = reichweite !== undefined ? reichweite * konfiguration.mindestAbstandFaktor : null;
  const gruende: string[] = [];

  if (angreifer.length > 0 && lebensAnteil !== undefined && lebensAnteil <= konfiguration.kritischUnterLebensAnteil) {
    gruende.push('LEBEN_KRITISCH');
  } else if (angreifer.length > 0 && lebensAnteil !== undefined && lebensAnteil <= konfiguration.rueckzugUnterLebensAnteil) {
    gruende.push('LEBEN_NIEDRIG_IM_KAMPF');
  }
  if (angreifer.length > 0 && manaAnteil !== undefined && manaAnteil <= konfiguration.mindestensManaAnteilImKampf) {
    gruende.push('MANA_NIEDRIG_IM_KAMPF');
  }
  if (angreifer.length > konfiguration.maximalAngreifer) gruende.push('ZU_VIELE_ANGREIFER');
  if (angreifer.length > 0 && naechsterAngreiferAbstand !== null && mindestAbstand !== null && naechsterAngreiferAbstand < mindestAbstand) {
    gruende.push('ABSTAND_ZU_KLEIN');
  }

  let stufe: KampfGefahrenBewertung['stufe'] = 'sicher';
  if (lebensAnteil === undefined || manaAnteil === undefined) stufe = 'unbekannt';
  if (gruende.includes('ABSTAND_ZU_KLEIN')) stufe = 'angespannt';
  if (gruende.some((grund) => grund === 'LEBEN_NIEDRIG_IM_KAMPF' || grund === 'MANA_NIEDRIG_IM_KAMPF' || grund === 'ZU_VIELE_ANGREIFER')) stufe = 'gefaehrlich';
  if (gruende.includes('LEBEN_KRITISCH')) stufe = 'kritisch';

  return Object.freeze({
    stufe,
    gruende: Object.freeze(gruende),
    angreiferKennungen: Object.freeze(angreiferKennungen),
    lebensAnteil: lebensAnteil ?? null,
    manaAnteil: manaAnteil ?? null,
    naechsterAngreiferAbstand,
    mindestAbstand
  });
}

function rueckzugsZiel(
  charakter: CharakterZustand,
  angreifer: readonly SichtbaresObjektZustand[],
  distanz: number
): readonly [number, number] | null {
  const position = charakterPosition(charakter);
  if (!position) return null;
  const positionen = angreifer.map(objektPosition).filter((wert): wert is readonly [number, number] => wert !== null);
  if (positionen.length === 0) return null;
  const mittelX = positionen.reduce((summe, wert) => summe + wert[0], 0) / positionen.length;
  const mittelY = positionen.reduce((summe, wert) => summe + wert[1], 0) / positionen.length;
  const dx = position[0] - mittelX;
  const dy = position[1] - mittelY;
  const laenge = Math.hypot(dx, dy);
  if (laenge === 0) return null;
  return Object.freeze([position[0] + (dx / laenge) * distanz, position[1] + (dy / laenge) * distanz]);
}

function sicherheitsAnfrage(
  spielzustand: Spielzustand,
  jetzt: number,
  art: 'abstand_herstellen' | 'rueckzug',
  ziel: readonly [number, number],
  bewertung: KampfGefahrenBewertung
): AktionsAnfrage<KampfSicherheitsAktionsDetails> {
  const notfall = art === 'rueckzug';
  return Object.freeze({
    kennung: `${spielzustand.ablaufKennung}:kampfsicherheit:${spielzustand.laufendeNummer}:${art}`,
    angefordertVon: 'kampfsicherheit',
    aktion: notfall ? KAMPF_SICHERHEITS_AKTIONS_NAMEN.rueckzug : KAMPF_SICHERHEITS_AKTIONS_NAMEN.abstandHerstellen,
    wichtigkeit: notfall ? 'notfall' : 'sicherheit',
    prioritaet: notfall ? 1000 : 700,
    angefordertAm: jetzt,
    gueltigBis: jetzt + AKTIONS_GUELTIGKEIT_MILLISEKUNDEN,
    benoetigteRessourcen: Object.freeze(['bewegung', 'kampfziel'] as const),
    grund: notfall ? 'Kampfsicherheit fordert sofortigen Rueckzug an.' : 'Kampfsicherheit stellt sicheren Abstand her.',
    details: Object.freeze({
      x: ziel[0],
      y: ziel[1],
      grundCode: bewertung.gruende[0] ?? 'ABSTAND_ZU_KLEIN',
      angreiferKennungen: Object.freeze([...bewertung.angreiferKennungen])
    })
  });
}

function meldung(
  jetzt: number,
  code: string,
  titel: string,
  was: string,
  warum: string,
  bot: string,
  stufe: 'warnung' | 'fehler' | 'kritisch',
  handeln: boolean,
  nutzer: string,
  details: Readonly<Record<string, unknown>> = {}
) {
  return erstelleBotMeldung({
    kennung: `kampfsicherheit-meldung-${code.toLowerCase()}-${jetzt}`,
    zeitpunkt: jetzt,
    stufe,
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

function entscheidung(
  spielzustand: Spielzustand,
  jetzt: number,
  art: KampfSicherheitsAktionsArt,
  grund: string,
  normalAktionenErlaubt: boolean,
  bewertung: KampfGefahrenBewertung,
  anfrage: AktionsAnfrage<KampfSicherheitsAktionsDetails> | null,
  botMeldung: ReturnType<typeof meldung> | null,
  naechsterZustand: KampfSicherheitsAblaufZustand
): Readonly<KampfSicherheitsEntscheidung> {
  return Object.freeze({
    schemaVersion: 1,
    entscheidungsKennung: `${spielzustand.ablaufKennung}:kampfsicherheit-entscheidung:${spielzustand.laufendeNummer}`,
    zeitpunkt: jetzt,
    art,
    grund,
    normalAktionenErlaubt,
    gefahrenBewertung: bewertung,
    aktionsAnfrage: anfrage,
    meldung: botMeldung,
    naechsterAblaufZustand: naechsterZustand
  });
}

export function planeKampfSicherheitsSchritt(
  spielzustand: Spielzustand,
  konfiguration: KampfSicherheitsKonfiguration,
  vorherigerZustand: KampfSicherheitsAblaufZustand,
  jetzt = spielzustand.aufgenommenAm
): Readonly<KampfSicherheitsEntscheidung> {
  pruefeZeitpunkt(jetzt);
  const normalisiert = erstelleKampfSicherheitsKonfiguration(konfiguration);
  const charakter = bekannterWert(spielzustand.beobachtet.charakter);
  if (!charakter) {
    const bewertung = Object.freeze({ stufe: 'unbekannt', gruende: Object.freeze(['CHARAKTER_UNBEKANNT']), angreiferKennungen: Object.freeze([]), lebensAnteil: null, manaAnteil: null, naechsterAngreiferAbstand: null, mindestAbstand: null } as const);
    return entscheidung(spielzustand, jetzt, 'blockiert', 'Charakterdaten fehlen; Kampfsicherheit kann keine normale Aktion freigeben.', false, bewertung, null,
      meldung(jetzt, 'KAMPF_SICHERHEIT_DATEN_FEHLEN', 'Kampfsicherheit blockiert', 'Der Charakterzustand ist nicht bekannt.', 'Ohne Charakterdaten kann keine Gefahrenlage sicher bewertet werden.', 'Normale Aktionen werden nicht freigegeben.', 'warnung', false, 'Datenquelle abwarten oder pruefen.'), vorherigerZustand);
  }

  const tot = bekannterWert(charakter.tot);
  if (tot !== false) {
    const bewertung = Object.freeze({ stufe: 'kritisch', gruende: Object.freeze(['CHARAKTER_NICHT_LEBEND_BESTAETIGT']), angreiferKennungen: Object.freeze([]), lebensAnteil: bekannterWert(spielzustand.abgeleitet.lebensAnteil) ?? null, manaAnteil: bekannterWert(spielzustand.abgeleitet.manaAnteil) ?? null, naechsterAngreiferAbstand: null, mindestAbstand: null } as const);
    return entscheidung(spielzustand, jetzt, 'blockiert', 'Der lebende Charakterzustand ist nicht bestaetigt.', false, bewertung, null,
      meldung(jetzt, 'KAMPF_CHARAKTER_NICHT_BEREIT', 'Kampfsicherheit blockiert', 'Der Charakter ist tot oder sein Lebenszustand ist unbekannt.', 'Sicherheitsaktionen setzen einen bestaetigt lebenden Charakter voraus.', 'Normale Aktionen bleiben blockiert.', 'kritisch', tot === true, tot === true ? 'Charakter wiederbeleben und danach neu pruefen.' : 'Spielzustandsdaten pruefen.'), vorherigerZustand);
  }

  let zustand = aktualisiereBewegungsFortschritt(charakter, vorherigerZustand, jetzt);
  if (zustand.sicherheitsBewegungAktivSeit !== null && jetzt - zustand.letzterPositionsFortschrittAm >= normalisiert.bewegungsStillstandNachMillisekunden) {
    const bewertung = bewerteGefahr(spielzustand, charakter, normalisiert);
    return entscheidung(spielzustand, jetzt, 'blockiert', 'Eine gestartete Sicherheitsbewegung macht keinen Positionsfortschritt.', false, bewertung, null,
      meldung(jetzt, 'KAMPF_RUECKZUG_BLOCKIERT', 'Rueckzug macht keinen Fortschritt', 'Die Sicherheitsbewegung hat innerhalb der erlaubten Zeit keine Positionsaenderung erreicht.', 'Bewegung kann blockiert, festgefahren oder durch die Spielwelt verhindert sein.', 'Der Bot fordert keine normale Farmaktion mehr an.', 'kritisch', true, 'Position, Karte und Bewegungsweg pruefen.', { sicherheitsBewegungAktivSeit: zustand.sicherheitsBewegungAktivSeit, letzterPositionsFortschrittAm: zustand.letzterPositionsFortschrittAm }), zustand);
  }

  const bewertung = bewerteGefahr(spielzustand, charakter, normalisiert);
  if (bewertung.stufe === 'unbekannt') {
    return entscheidung(spielzustand, jetzt, 'blockiert', 'Lebens- oder Manadaten fehlen.', false, bewertung, null,
      meldung(jetzt, 'KAMPF_SICHERHEIT_DATEN_FEHLEN', 'Kampfsicherheit wartet auf Pflichtdaten', 'Lebens- oder Manaanteil ist unbekannt.', 'Die Gefahrenlage darf nicht aus fehlenden Daten geraten werden.', 'Normale Aktionen werden nicht freigegeben.', 'warnung', false, 'Spielzustandsdaten abwarten oder pruefen.'), zustand);
  }

  const angreifer = angreiferFuerCharakter(spielzustand, charakter);
  const gefahrErfordertRueckzug = bewertung.stufe === 'gefaehrlich' || bewertung.stufe === 'kritisch';
  const gefahrErfordertAbstand = bewertung.stufe === 'angespannt';

  if (!gefahrErfordertRueckzug && !gefahrErfordertAbstand) {
    if (zustand.sicherheitsBewegungAktivSeit !== null) {
      zustand = Object.freeze({ ...zustand, sicherheitsBewegungAktivSeit: null });
    }
    return entscheidung(spielzustand, jetzt, 'keine', 'Keine aktive Kampfgefahr erfordert eine Sicherheitsaktion.', true, bewertung, null, null, zustand);
  }

  const ziel = rueckzugsZiel(charakter, angreifer, normalisiert.rueckzugDistanz);
  if (!ziel) {
    return entscheidung(spielzustand, jetzt, 'blockiert', 'Die Gefahr ist erkannt, aber ein sicherer Rueckzugsvektor kann nicht bestimmt werden.', false, bewertung, null,
      meldung(jetzt, 'KAMPF_RUECKZUG_ZIEL_UNBEKANNT', 'Rueckzug blockiert', 'Eine Kampfgefahr erfordert Bewegung, aber die Positionen der Angreifer reichen nicht fuer einen sicheren Rueckzugsvektor.', 'Die benoetigten Angreiferpositionen sind nicht sicher bekannt oder ergeben keinen eindeutigen Vektor.', 'Es wird keine erfundene Bewegungsrichtung angefordert und normales Farmen bleibt blockiert.', 'kritisch', true, 'Positionsdaten und aktuelle Spielsituation pruefen.', { angreiferKennungen: bewertung.angreiferKennungen }), zustand);
  }

  const art = gefahrErfordertRueckzug ? 'rueckzug' : 'abstand_herstellen';
  const anfrage = sicherheitsAnfrage(spielzustand, jetzt, art, ziel, bewertung);
  const botMeldung = gefahrErfordertRueckzug
    ? meldung(jetzt, 'KAMPF_RUECKZUG', 'Kampfsicherheit fordert Rueckzug an', 'Die aktuelle Kampfsituation hat die Rueckzugsschwelle erreicht.', `Gruende: ${bewertung.gruende.join(', ')}.`, 'Eine Notfall-AktionsAnfrage fuer Bewegung und Kampfziel wurde erzeugt.', bewertung.stufe === 'kritisch' ? 'kritisch' : 'warnung', false, 'Keine Aktion erforderlich; Rueckzug beobachten.', { ziel, angreiferKennungen: bewertung.angreiferKennungen })
    : null;

  return entscheidung(spielzustand, jetzt, art, gefahrErfordertRueckzug ? 'Gefahr erfordert sofortigen Rueckzug.' : 'Ein Angreifer ist zu nah; Sicherheitsabstand wird hergestellt.', false, bewertung, anfrage, botMeldung, zustand);
}

export type AngriffsReichweitenErgebnis = 'in_reichweite' | 'zu_weit' | 'unbekannt';

export function pruefeAngriffsReichweite(charakter: CharakterZustand, ziel: SichtbaresObjektZustand, puffer = 0): AngriffsReichweitenErgebnis {
  if (!Number.isFinite(puffer) || puffer < 0) throw new Error('Der Reichweitenpuffer muss eine endliche, nichtnegative Zahl sein.');
  const von = charakterPosition(charakter);
  const nach = objektPosition(ziel);
  const reichweite = bekannterWert(charakter.reichweite);
  if (!von || !nach || reichweite === undefined) return 'unbekannt';
  return entfernung(von, nach) <= Math.max(0, reichweite - puffer) ? 'in_reichweite' : 'zu_weit';
}
