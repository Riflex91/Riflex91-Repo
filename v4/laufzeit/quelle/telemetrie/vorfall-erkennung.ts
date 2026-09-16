import { erstelleBotMeldung } from '../vertraege/bot-meldung.js';
import type {
  AblaufBeobachtung,
  Vorfall,
  VorfallArt,
  VorfallErkennungsRegeln
} from '../vertraege/telemetrie.js';

const STANDARD_REGELN: VorfallErkennungsRegeln = Object.freeze({
  stillstandNachMillisekunden: 30_000,
  schleifenFensterMillisekunden: 60_000,
  schleifenWiederholungen: 3,
  schleifenMusterLaengeMax: 3
});

interface AblaufHistorie {
  letzteProbe: AblaufBeobachtung | null;
  readonly proben: AblaufBeobachtung[];
  readonly aktiveVorfaelle: Set<VorfallArt>;
}

function pruefePositiveGanzzahl(name: string, wert: number): void {
  if (!Number.isSafeInteger(wert) || wert <= 0) throw new Error(`${name} muss eine positive ganze Zahl sein.`);
}

function pruefeProbe(probe: AblaufBeobachtung): void {
  for (const [name, wert] of [
    ['kennung', probe.kennung],
    ['ablaufKennung', probe.ablaufKennung],
    ['zustand', probe.zustand],
    ['fortschrittKennung', probe.fortschrittKennung],
    ['entscheidungKennung', probe.entscheidungKennung]
  ] as const) {
    if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
  }
  for (const [name, wert] of [
    ['zeitpunkt', probe.zeitpunkt],
    ['gestartetAm', probe.gestartetAm],
    ['letzterFortschrittAm', probe.letzterFortschrittAm]
  ] as const) {
    if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
  }
  if (probe.gestartetAm > probe.zeitpunkt) throw new Error('gestartetAm darf nicht nach zeitpunkt liegen.');
  if (probe.letzterFortschrittAm > probe.zeitpunkt) throw new Error('letzterFortschrittAm darf nicht nach zeitpunkt liegen.');
  if (probe.zeitlimitMillisekunden !== undefined && (!Number.isFinite(probe.zeitlimitMillisekunden) || probe.zeitlimitMillisekunden <= 0)) {
    throw new Error('zeitlimitMillisekunden muss positiv sein.');
  }
}

export class VorfallErkennung {
  private readonly regeln: VorfallErkennungsRegeln;
  private readonly historien = new Map<string, AblaufHistorie>();

  constructor(regeln: Partial<VorfallErkennungsRegeln> = {}) {
    this.regeln = { ...STANDARD_REGELN, ...regeln };
    pruefePositiveGanzzahl('stillstandNachMillisekunden', this.regeln.stillstandNachMillisekunden);
    pruefePositiveGanzzahl('schleifenFensterMillisekunden', this.regeln.schleifenFensterMillisekunden);
    pruefePositiveGanzzahl('schleifenWiederholungen', this.regeln.schleifenWiederholungen);
    pruefePositiveGanzzahl('schleifenMusterLaengeMax', this.regeln.schleifenMusterLaengeMax);
  }

  pruefe(probe: AblaufBeobachtung): readonly Vorfall[] {
    pruefeProbe(probe);
    const historie = this.historien.get(probe.ablaufKennung) ?? {
      letzteProbe: null,
      proben: [],
      aktiveVorfaelle: new Set<VorfallArt>()
    };
    const vorfaelle: Vorfall[] = [];

    this.aktualisiereAktiveVorfaelle(historie, probe);

    if (this.istUnerwarteterZustandswechsel(historie.letzteProbe, probe)) {
      this.fuegeVorfallHinzu(vorfaelle, historie, 'unerwarteter_zustandswechsel', probe,
        `Der Zustand wechselte von ${historie.letzteProbe?.zustand ?? 'unbekannt'} nach ${probe.zustand}, obwohl dieser Uebergang nicht freigegeben war.`);
    }

    if (probe.zeitlimitMillisekunden !== undefined && probe.zeitpunkt - probe.gestartetAm >= probe.zeitlimitMillisekunden) {
      this.fuegeVorfallHinzu(vorfaelle, historie, 'zeitueberschreitung', probe,
        `Der Ablauf laeuft seit ${probe.zeitpunkt - probe.gestartetAm} ms und hat sein Zeitlimit von ${probe.zeitlimitMillisekunden} ms erreicht.`);
    }

    if (probe.zeitpunkt - probe.letzterFortschrittAm >= this.regeln.stillstandNachMillisekunden) {
      this.fuegeVorfallHinzu(vorfaelle, historie, 'stillstand', probe,
        `Seit ${probe.zeitpunkt - probe.letzterFortschrittAm} ms wurde kein neuer Fortschritt gemeldet.`);
    }

    historie.proben.push(Object.freeze({ ...probe }));
    const fensterStart = probe.zeitpunkt - this.regeln.schleifenFensterMillisekunden;
    while ((historie.proben[0]?.zeitpunkt ?? probe.zeitpunkt) < fensterStart) historie.proben.shift();

    if (this.enthaeltSchleife(historie.proben)) {
      this.fuegeVorfallHinzu(vorfaelle, historie, 'schleife', probe,
        `Entscheidungs- und Zustandsmuster wiederholen sich mindestens ${this.regeln.schleifenWiederholungen}-mal ohne neuen Fortschritt.`);
    }

    historie.letzteProbe = Object.freeze({ ...probe });
    this.historien.set(probe.ablaufKennung, historie);
    return Object.freeze(vorfaelle);
  }

  beendeAblauf(ablaufKennung: string): void {
    this.historien.delete(ablaufKennung);
  }

  private aktualisiereAktiveVorfaelle(historie: AblaufHistorie, probe: AblaufBeobachtung): void {
    const vorher = historie.letzteProbe;
    if (!vorher) return;
    if (probe.fortschrittKennung !== vorher.fortschrittKennung || probe.letzterFortschrittAm > vorher.letzterFortschrittAm) {
      historie.aktiveVorfaelle.delete('stillstand');
      historie.aktiveVorfaelle.delete('schleife');
    }
    if (probe.gestartetAm !== vorher.gestartetAm) historie.aktiveVorfaelle.delete('zeitueberschreitung');
    if (probe.zustand !== vorher.zustand) historie.aktiveVorfaelle.delete('unerwarteter_zustandswechsel');
  }

  private istUnerwarteterZustandswechsel(vorher: AblaufBeobachtung | null, aktuell: AblaufBeobachtung): boolean {
    if (!vorher || vorher.zustand === aktuell.zustand || vorher.erlaubteNaechsteZustaende === undefined) return false;
    return !vorher.erlaubteNaechsteZustaende.includes(aktuell.zustand);
  }

  private enthaeltSchleife(proben: readonly AblaufBeobachtung[]): boolean {
    if (proben.length < this.regeln.schleifenWiederholungen) return false;
    const letzterFortschritt = proben[proben.length - 1]?.fortschrittKennung;
    if (letzterFortschritt === undefined) return false;
    const ohneFortschritt = proben.filter((probe) => probe.fortschrittKennung === letzterFortschritt);

    for (let musterLaenge = 1; musterLaenge <= this.regeln.schleifenMusterLaengeMax; musterLaenge += 1) {
      const benoetigt = musterLaenge * this.regeln.schleifenWiederholungen;
      if (ohneFortschritt.length < benoetigt) continue;
      const ende = ohneFortschritt.slice(-benoetigt);
      const muster = ende.slice(0, musterLaenge).map((probe) => `${probe.zustand}|${probe.entscheidungKennung}`);
      let identisch = true;
      for (let index = 0; index < ende.length; index += 1) {
        const probe = ende[index];
        const erwartet = muster[index % musterLaenge];
        if (!probe || `${probe.zustand}|${probe.entscheidungKennung}` !== erwartet) {
          identisch = false;
          break;
        }
      }
      if (identisch) return true;
    }
    return false;
  }

  private fuegeVorfallHinzu(
    ziel: Vorfall[],
    historie: AblaufHistorie,
    art: VorfallArt,
    probe: AblaufBeobachtung,
    ursache: string
  ): void {
    if (historie.aktiveVorfaelle.has(art)) return;
    historie.aktiveVorfaelle.add(art);
    ziel.push(this.erstelleVorfall(art, probe, ursache));
  }

  private erstelleVorfall(art: VorfallArt, probe: AblaufBeobachtung, ursache: string): Vorfall {
    const schwere = art === 'unerwarteter_zustandswechsel' ? 'warnung' : 'fehler';
    const titel = this.titelFuerArt(art);
    const botReaktion = 'Der Bot markiert den Ablauf als Vorfall und sichert die verfuegbaren Diagnose- und Flugschreiberdaten.';
    const nutzerAktion = 'Wenn der Vorfall wiederholt auftritt, das Vorfallpaket pruefen und die betroffene Spielfunktion bis zur Korrektur beobachten.';
    const vorfallKennung = `${probe.ablaufKennung}:${art}:${probe.zeitpunkt}`;
    const meldung = erstelleBotMeldung({
      kennung: `meldung:${vorfallKennung}`,
      zeitpunkt: probe.zeitpunkt,
      stufe: schwere,
      meldungsCode: `V4_${art.toUpperCase()}`,
      titel,
      wasIstPassiert: `Im Ablauf ${probe.ablaufKennung} wurde ${titel.toLowerCase()} erkannt.`,
      warumIstEsPassiert: ursache,
      wasHatDerBotGetan: botReaktion,
      mussNutzerHandeln: false,
      wasSollDerNutzerTun: nutzerAktion,
      technischeDetails: Object.freeze({
        ablaufKennung: probe.ablaufKennung,
        zustand: probe.zustand,
        fortschrittKennung: probe.fortschrittKennung,
        entscheidungKennung: probe.entscheidungKennung
      })
    });
    return Object.freeze({
      schemaVersion: 1,
      vorfallKennung,
      art,
      schwere,
      entdecktAm: probe.zeitpunkt,
      ablaufKennung: probe.ablaufKennung,
      zustand: probe.zustand,
      ursache,
      botReaktion,
      nutzerAktion,
      mussNutzerHandeln: false,
      meldung
    });
  }

  private titelFuerArt(art: VorfallArt): string {
    if (art === 'stillstand') return 'Stillstand';
    if (art === 'schleife') return 'Wiederholungsschleife';
    if (art === 'zeitueberschreitung') return 'Zeitueberschreitung';
    return 'Unerwarteter Zustandswechsel';
  }
}
