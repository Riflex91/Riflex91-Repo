import type { BotEreignis } from '../vertraege/bot-ereignis.js';
import type {
  GeladenesWiederholungsSegment,
  WiederholungsSegmentSammlung
} from '../vertraege/wiederholung.js';
import type { WiederholungsSegment } from '../vertraege/telemetrie.js';
import { berechneSha256 } from '../telemetrie/sha256.js';

function pruefeEreignis(wert: unknown, segmentKennung: string): BotEreignis {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) {
    throw new Error(`Segment ${segmentKennung} enthaelt eine ungueltige Ereigniszeile.`);
  }
  const objekt = wert as Record<string, unknown>;
  if (!Number.isSafeInteger(objekt.laufendeNummer) || (objekt.laufendeNummer as number) <= 0) {
    throw new Error(`Segment ${segmentKennung} enthaelt eine ungueltige Ereignissequenz.`);
  }
  if (typeof objekt.zeitpunkt !== 'number' || !Number.isFinite(objekt.zeitpunkt) || objekt.zeitpunkt < 0) {
    throw new Error(`Segment ${segmentKennung} enthaelt einen ungueltigen Ereigniszeitpunkt.`);
  }
  for (const feld of ['kennung', 'name', 'quelle', 'ablaufKennung'] as const) {
    if (typeof objekt[feld] !== 'string' || (objekt[feld] as string).trim().length === 0) {
      throw new Error(`Segment ${segmentKennung} enthaelt ein Ereignis ohne ${feld}.`);
    }
  }
  if (!Object.prototype.hasOwnProperty.call(objekt, 'details')) {
    throw new Error(`Segment ${segmentKennung} enthaelt ein Ereignis ohne details.`);
  }
  return objekt as unknown as BotEreignis;
}

export function ladeWiederholungsSegment(segment: WiederholungsSegment): GeladenesWiederholungsSegment {
  if (segment.schemaVersion !== 1) throw new Error(`Unbekannte Wiederholungssegment-Version: ${segment.schemaVersion}.`);
  if (!/^[a-f0-9]{64}$/.test(segment.sha256)) throw new Error(`Segment ${segment.segmentKennung} besitzt keinen gueltigen SHA-256-Wert.`);
  const bytes = new TextEncoder().encode(segment.inhalt).byteLength;
  if (bytes !== segment.groesseBytes) throw new Error(`Segment ${segment.segmentKennung} hat eine abweichende Bytelaenge.`);
  if (berechneSha256(segment.inhalt) !== segment.sha256) throw new Error(`Segment ${segment.segmentKennung} hat einen ungueltigen SHA-256-Nachweis.`);

  const zeilen = segment.inhalt.split('\n').filter((zeile) => zeile.length > 0);
  if (zeilen.length !== segment.ereignisAnzahl) throw new Error(`Segment ${segment.segmentKennung} hat eine abweichende Ereignisanzahl.`);
  const ereignisse = zeilen.map((zeile) => pruefeEreignis(JSON.parse(zeile) as unknown, segment.segmentKennung));
  const erstes = ereignisse[0];
  const letztes = ereignisse[ereignisse.length - 1];
  if (!erstes || !letztes) throw new Error(`Segment ${segment.segmentKennung} ist leer.`);
  if (erstes.laufendeNummer !== segment.sequenzStart || letztes.laufendeNummer !== segment.sequenzEnde) {
    throw new Error(`Segment ${segment.segmentKennung} besitzt einen falschen Sequenzbereich.`);
  }
  for (let index = 1; index < ereignisse.length; index += 1) {
    const vorher = ereignisse[index - 1];
    const aktuell = ereignisse[index];
    if (!vorher || !aktuell || aktuell.laufendeNummer !== vorher.laufendeNummer + 1) {
      throw new Error(`Segment ${segment.segmentKennung} enthaelt eine interne Sequenzluecke.`);
    }
  }
  if (erstes.zeitpunkt !== segment.zeitraumStart || letztes.zeitpunkt !== segment.zeitraumEnde) {
    throw new Error(`Segment ${segment.segmentKennung} besitzt einen falschen Zeitraum.`);
  }
  return Object.freeze({ segment, ereignisse: Object.freeze(ereignisse) });
}

export function ladeWiederholungsSegmente(segmente: readonly WiederholungsSegment[]): WiederholungsSegmentSammlung {
  if (segmente.length === 0) throw new Error('Mindestens ein abgeschlossenes Wiederholungssegment wird benoetigt.');
  const geladen = segmente.map(ladeWiederholungsSegment).sort((a, b) => a.segment.sequenzStart - b.segment.sequenzStart);
  const sitzungKennung = geladen[0]?.segment.sitzungKennung;
  if (!sitzungKennung) throw new Error('Die Wiederholung besitzt keine SitzungKennung.');
  const luecken: string[] = [];
  const ereignisse: BotEreignis[] = [];
  let vorherigesEnde: number | null = null;

  for (const eintrag of geladen) {
    if (eintrag.segment.sitzungKennung !== sitzungKennung) throw new Error('Wiederholungssegmente aus verschiedenen Sitzungen duerfen nicht vermischt werden.');
    if (vorherigesEnde !== null) {
      if (eintrag.segment.sequenzStart <= vorherigesEnde) throw new Error('Wiederholungssegmente duerfen sich nicht ueberlappen.');
      if (eintrag.segment.sequenzStart !== vorherigesEnde + 1) {
        luecken.push(`${vorherigesEnde + 1}-${eintrag.segment.sequenzStart - 1}`);
      }
    }
    vorherigesEnde = eintrag.segment.sequenzEnde;
    ereignisse.push(...eintrag.ereignisse);
  }

  return Object.freeze({
    sitzungKennung,
    segmente: Object.freeze(geladen),
    ereignisse: Object.freeze(ereignisse),
    vollstaendig: luecken.length === 0,
    luecken: Object.freeze(luecken)
  });
}
