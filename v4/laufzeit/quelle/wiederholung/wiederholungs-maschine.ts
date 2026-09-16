import type { BotEreignis } from '../vertraege/bot-ereignis.js';
import type {
  KontingentWiederholungsErgebnis,
  LeistungsWiederholungsErgebnis,
  WiederholungsDatensatz,
  WiederholungsEntscheider,
  WiederholungsEntscheidung,
  WiederholungsKontext,
  WiederholungsLauf
} from '../vertraege/wiederholung.js';
import { KontingentWaechter } from '../kern/kontingent-waechter.js';
import { TelemetrieSpeicher } from '../telemetrie/telemetrie-speicher.js';
import { VorfallErkennung } from '../telemetrie/vorfall-erkennung.js';
import { berechneSha256 } from '../telemetrie/sha256.js';
import { kanonisiereJson } from './kanonisches-json.js';

function vergleicheText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function pruefeText(name: string, wert: string): void {
  if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function sortiereEreignisse(eingabe: WiederholungsDatensatz): readonly BotEreignis[] {
  return Object.freeze(eingabe.ereignisse.map((eintrag) => eintrag.ereignis).sort((a, b) =>
    a.zeitpunkt - b.zeitpunkt || a.laufendeNummer - b.laufendeNummer || vergleicheText(a.kennung, b.kennung)
  ));
}

class NurLeseTelemetrieAblage {
  constructor(private readonly inhalt: string) {}
  lese(): string | null { return this.inhalt; }
  schreibe(_inhalt: string): void {}
}

export class WiederholungsMaschine {
  fuehreAus(
    datensatz: WiederholungsDatensatz,
    varianteKennung: string,
    entscheider: WiederholungsEntscheider
  ): WiederholungsLauf {
    this.pruefeDatensatz(datensatz);
    pruefeText('varianteKennung', varianteKennung);
    const eingabeFingerabdruck = berechneSha256(kanonisiereJson(datensatz));
    const entscheidungen = this.wiederholeEntscheidungen(datensatz, entscheider);
    const vorfaelle = this.wiederholeVorfaelle(datensatz);
    const kontingentEntscheidungen = this.wiederholeKontingente(datensatz);
    const leistungsAuswertungen = this.wiederholeLeistung(datensatz);
    const verhaltensAusgabe = {
      datensatzKennung: datensatz.kennung,
      eingabeFingerabdruck,
      entscheidungen,
      vorfaelle,
      kontingentEntscheidungen,
      leistungsAuswertungen
    };
    const ausgabeFingerabdruck = berechneSha256(kanonisiereJson(verhaltensAusgabe));
    return Object.freeze({
      schemaVersion: 1,
      datensatzKennung: datensatz.kennung,
      varianteKennung,
      eingabeFingerabdruck,
      ausgabeFingerabdruck,
      entscheidungen,
      vorfaelle,
      kontingentEntscheidungen,
      leistungsAuswertungen
    });
  }

  private wiederholeEntscheidungen(
    datensatz: WiederholungsDatensatz,
    entscheider: WiederholungsEntscheider
  ): readonly WiederholungsEntscheidung[] {
    const zustaende = [...datensatz.zustaende].sort((a, b) =>
      a.zustand.aufgenommenAm - b.zustand.aufgenommenAm ||
      vergleicheText(a.charakterKennung, b.charakterKennung) ||
      a.zustand.laufendeNummer - b.zustand.laufendeNummer
    );
    const ereignisse = [...datensatz.ereignisse].sort((a, b) =>
      a.ereignis.zeitpunkt - b.ereignis.zeitpunkt ||
      a.ereignis.laufendeNummer - b.ereignis.laufendeNummer ||
      vergleicheText(a.charakterKennung ?? '', b.charakterKennung ?? '')
    );
    const entscheidungen: WiederholungsEntscheidung[] = [];
    const kennungen = new Set<string>();

    for (const eintrag of zustaende) {
      pruefeText('charakterKennung', eintrag.charakterKennung);
      const jetzt = eintrag.zustand.aufgenommenAm;
      const relevanteEreignisse = ereignisse
        .filter((ereignisEintrag) => ereignisEintrag.ereignis.zeitpunkt <= jetzt &&
          (ereignisEintrag.charakterKennung === null || ereignisEintrag.charakterKennung === eintrag.charakterKennung))
        .map((ereignisEintrag) => ereignisEintrag.ereignis);
      const kontext: WiederholungsKontext = Object.freeze({
        jetzt,
        charakterKennung: eintrag.charakterKennung,
        spielzustand: eintrag.zustand,
        ereignisseBisJetzt: Object.freeze(relevanteEreignisse),
        vorherigeEntscheidungen: Object.freeze([...entscheidungen])
      });
      const ergebnis = entscheider(kontext);
      const neueEntscheidungen = ergebnis === null ? [] : Array.isArray(ergebnis) ? ergebnis : [ergebnis];
      for (const entscheidung of neueEntscheidungen) {
        this.pruefeEntscheidung(entscheidung, kontext);
        const schluessel = `${entscheidung.charakterKennung}:${entscheidung.kennung}`;
        if (kennungen.has(schluessel)) throw new Error(`Wiederholungsentscheidung doppelt vorhanden: ${schluessel}.`);
        kennungen.add(schluessel);
        entscheidungen.push(Object.freeze({ ...entscheidung }));
      }
    }
    return Object.freeze(entscheidungen);
  }

  private wiederholeVorfaelle(datensatz: WiederholungsDatensatz): readonly ReturnType<VorfallErkennung['pruefe']>[number][] {
    const erkennung = new VorfallErkennung(datensatz.vorfallRegeln);
    const proben = [...datensatz.ablaufBeobachtungen].sort((a, b) =>
      a.zeitpunkt - b.zeitpunkt || vergleicheText(a.ablaufKennung, b.ablaufKennung) || vergleicheText(a.kennung, b.kennung)
    );
    const ergebnis: ReturnType<VorfallErkennung['pruefe']>[number][] = [];
    for (const probe of proben) ergebnis.push(...erkennung.pruefe(probe));
    return Object.freeze(ergebnis);
  }

  private wiederholeKontingente(datensatz: WiederholungsDatensatz): readonly KontingentWiederholungsErgebnis[] {
    const waechter = new KontingentWaechter();
    const schritte = [...datensatz.kontingentSchritte].sort((a, b) => a.laufendeNummer - b.laufendeNummer);
    const ergebnis: KontingentWiederholungsErgebnis[] = [];
    let vorherigeNummer = 0;
    for (const schritt of schritte) {
      if (!Number.isSafeInteger(schritt.laufendeNummer) || schritt.laufendeNummer <= vorherigeNummer) {
        throw new Error('Kontingent-Wiederholungsschritte muessen streng steigende laufendeNummern besitzen.');
      }
      vorherigeNummer = schritt.laufendeNummer;
      pruefeZeitpunkt('Kontingent-Schrittzeitpunkt', schritt.zeitpunkt);
      if (schritt.art === 'profil_setzen') {
        waechter.setzeDienstProfil(schritt.profil);
      } else if (schritt.art === 'anbieter_verbrauch') {
        waechter.aktualisiereVerbrauch(
          schritt.dienstKennung,
          schritt.grenzeKennung,
          schritt.fensterKennung,
          schritt.vomAnbieterGemeldet
        );
      } else {
        const entscheidung = waechter.pruefeUndReserviere(schritt.anfrage, schritt.fensterKennungen, schritt.zeitpunkt);
        ergebnis.push(Object.freeze({ laufendeNummer: schritt.laufendeNummer, zeitpunkt: schritt.zeitpunkt, entscheidung: Object.freeze({ ...entscheidung, verbleibendNachReservierung: Object.freeze({ ...entscheidung.verbleibendNachReservierung }) }) }));
      }
    }
    return Object.freeze(ergebnis);
  }

  private wiederholeLeistung(datensatz: WiederholungsDatensatz): readonly LeistungsWiederholungsErgebnis[] {
    if (datensatz.telemetrieDauerzustand === null) {
      if (datensatz.leistungsZeitraeume.length > 0) throw new Error('Leistungszeitraeume benoetigen einen TelemetrieDauerzustand.');
      return Object.freeze([]);
    }
    const speicher = new TelemetrieSpeicher(new NurLeseTelemetrieAblage(JSON.stringify(datensatz.telemetrieDauerzustand)));
    const kennungen = new Set<string>();
    const ergebnis = datensatz.leistungsZeitraeume.map((zeitraum) => {
      pruefeText('Leistungszeitraum-Kennung', zeitraum.kennung);
      if (kennungen.has(zeitraum.kennung)) throw new Error(`Leistungszeitraum doppelt vorhanden: ${zeitraum.kennung}.`);
      kennungen.add(zeitraum.kennung);
      return Object.freeze({
        kennung: zeitraum.kennung,
        zusammenfassung: speicher.fasseLeistungZusammen(zeitraum.zeitraumStart, zeitraum.zeitraumEnde)
      });
    });
    return Object.freeze(ergebnis);
  }

  private pruefeDatensatz(datensatz: WiederholungsDatensatz): void {
    if (datensatz.schemaVersion !== 1) throw new Error(`Unbekannte Wiederholungsdatensatz-Version: ${datensatz.schemaVersion}.`);
    pruefeText('Datensatz-Kennung', datensatz.kennung);
    pruefeZeitpunkt('erstelltAm', datensatz.erstelltAm);
    const zustandsSchluessel = new Set<string>();
    for (const eintrag of datensatz.zustaende) {
      pruefeText('charakterKennung', eintrag.charakterKennung);
      if (eintrag.zustand.schemaVersion !== 2) throw new Error('Wiederholung enthaelt eine unbekannte Spielzustand-Version.');
      pruefeZeitpunkt('Spielzustand-Zeitpunkt', eintrag.zustand.aufgenommenAm);
      const schluessel = `${eintrag.charakterKennung}:${eintrag.zustand.laufendeNummer}`;
      if (zustandsSchluessel.has(schluessel)) throw new Error(`Spielzustand doppelt vorhanden: ${schluessel}.`);
      zustandsSchluessel.add(schluessel);
    }
    sortiereEreignisse(datensatz);
  }

  private pruefeEntscheidung(entscheidung: WiederholungsEntscheidung, kontext: WiederholungsKontext): void {
    for (const [name, wert] of [
      ['kennung', entscheidung.kennung],
      ['charakterKennung', entscheidung.charakterKennung],
      ['entscheidung', entscheidung.entscheidung],
      ['grund', entscheidung.grund]
    ] as const) pruefeText(name, wert);
    if (entscheidung.charakterKennung !== kontext.charakterKennung) throw new Error('Eine Wiederholungsentscheidung darf nicht einem anderen Charakter zugeordnet werden.');
    if (entscheidung.zeitpunkt !== kontext.jetzt) throw new Error('Eine Wiederholungsentscheidung muss den injizierten Replay-Zeitpunkt verwenden.');
    if (!Number.isFinite(entscheidung.bewertungsWert)) throw new Error('bewertungsWert muss eine endliche Zahl sein.');
    if (!['sicher', 'warnung', 'verletzung'].includes(entscheidung.sicherheitszustand)) throw new Error('Unbekannter Wiederholungs-Sicherheitszustand.');
    kanonisiereJson(entscheidung.details);
  }
}
