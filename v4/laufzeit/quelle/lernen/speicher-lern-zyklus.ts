import type {
  LernNachweis,
  SpeicherLernEingabe,
  SpeicherLernEntscheidung,
  SpeicherLernPhase,
  SpeicherLernSchwellen
} from '../vertraege/speicher-lern-zyklus.js';

export const STANDARD_SPEICHER_LERN_SCHWELLEN: SpeicherLernSchwellen = {
  zielNachBereinigung: 0.5,
  vorbereitenAb: 0.6,
  lernenAb: 0.75,
  bereinigenAb: 0.85,
  notfallAb: 0.95
};

export class SpeicherLernZyklus {
  private readonly schwellen: SpeicherLernSchwellen;

  constructor(schwellen: SpeicherLernSchwellen = STANDARD_SPEICHER_LERN_SCHWELLEN) {
    this.pruefeSchwellen(schwellen);
    this.schwellen = { ...schwellen };
  }

  entscheide(eingabe: SpeicherLernEingabe): SpeicherLernEntscheidung {
    this.pruefeEingabe(eingabe);

    const auslastung = eingabe.belegtBytes / eingabe.sicherNutzbarBytes;
    const zielBelegtBytes = Math.floor(eingabe.sicherNutzbarBytes * this.schwellen.zielNachBereinigung);
    const nachweisVollstaendig = this.istNachweisVollstaendig(eingabe.nachweis);
    const bereinigungErlaubt = nachweisVollstaendig && eingabe.verarbeiteteLoeschbareBytes > 0;
    const gewuenschteFreigabe = Math.max(0, eingabe.belegtBytes - zielBelegtBytes);
    const loeschbarBisBytes = bereinigungErlaubt
      ? Math.min(gewuenschteFreigabe, eingabe.verarbeiteteLoeschbareBytes)
      : 0;

    if (auslastung >= this.schwellen.notfallAb) {
      return this.ergebnis(
        'notfall',
        auslastung,
        true,
        !eingabe.nachweis.datensatzErstellt,
        eingabe.nachweis.datensatzErstellt && !eingabe.nachweis.lernenErfolgreich,
        eingabe.nachweis.lernenErfolgreich && (!eingabe.nachweis.pruefungBestanden || !eingabe.nachweis.wissenDauerhaftGespeichert),
        bereinigungErlaubt,
        loeschbarBisBytes,
        zielBelegtBytes,
        bereinigungErlaubt
          ? 'Der sichere Speicher ist fast ausgeschoepft. Nur bereits erfolgreich gelernte, gepruefte und dauerhaft gesicherte Rohdaten duerfen freigegeben werden.'
          : 'Der sichere Speicher ist fast ausgeschoepft. Die Datenerfassung wird reduziert; unverarbeitete Rohdaten werden nicht automatisch geloescht.'
      );
    }

    if (auslastung >= this.schwellen.bereinigenAb && bereinigungErlaubt) {
      return this.ergebnis(
        'bereinigen',
        auslastung,
        true,
        false,
        false,
        false,
        true,
        loeschbarBisBytes,
        zielBelegtBytes,
        'Der Lernzyklus ist vollstaendig bestaetigt. Verarbeitete Rohdaten duerfen bis zum sicheren Zielstand freigegeben werden.'
      );
    }

    if (auslastung >= this.schwellen.lernenAb) {
      return this.naechsterLernSchritt(eingabe.nachweis, auslastung, zielBelegtBytes, auslastung >= this.schwellen.bereinigenAb);
    }

    if (auslastung >= this.schwellen.vorbereitenAb) {
      if (!eingabe.nachweis.datensatzErstellt) {
        return this.ergebnis(
          'vorbereiten',
          auslastung,
          false,
          true,
          false,
          false,
          false,
          0,
          zielBelegtBytes,
          'Der Speicher erreicht die Vorbereitungsgrenze. Aus den Rohdaten soll ein versionierter Lerndatensatz erstellt werden.'
        );
      }

      return this.ergebnis(
        'sammeln',
        auslastung,
        false,
        false,
        false,
        false,
        false,
        0,
        zielBelegtBytes,
        'Der aktuelle Lerndatensatz ist vorbereitet; bis zur Lerngrenze werden weitere Erfahrungen gesammelt.'
      );
    }

    return this.ergebnis(
      'sammeln',
      auslastung,
      false,
      false,
      false,
      false,
      false,
      0,
      zielBelegtBytes,
      'Der Speicher liegt im normalen Sammelbereich.'
    );
  }

  private naechsterLernSchritt(
    nachweis: LernNachweis,
    auslastung: number,
    zielBelegtBytes: number,
    datenerfassungReduzieren: boolean
  ): SpeicherLernEntscheidung {
    if (!nachweis.datensatzErstellt) {
      return this.ergebnis(
        'vorbereiten',
        auslastung,
        datenerfassungReduzieren,
        true,
        false,
        false,
        false,
        0,
        zielBelegtBytes,
        'Die Lerngrenze ist erreicht, aber es existiert noch kein bestaetigter Lerndatensatz.'
      );
    }

    if (!nachweis.lernenErfolgreich) {
      return this.ergebnis(
        'lernen',
        auslastung,
        datenerfassungReduzieren,
        false,
        true,
        false,
        false,
        0,
        zielBelegtBytes,
        'Der Lerndatensatz ist vorbereitet. Ein neuer Lernlauf darf gestartet werden.'
      );
    }

    if (!nachweis.pruefungBestanden || !nachweis.wissenDauerhaftGespeichert) {
      return this.ergebnis(
        'pruefen',
        auslastung,
        datenerfassungReduzieren,
        false,
        false,
        true,
        false,
        0,
        zielBelegtBytes,
        'Ein Lernergebnis liegt vor. Vor jeder Datenfreigabe muessen Evaluation und dauerhafte Wissensspeicherung bestaetigt werden.'
      );
    }

    return this.ergebnis(
      'sammeln',
      auslastung,
      datenerfassungReduzieren,
      false,
      false,
      false,
      false,
      0,
      zielBelegtBytes,
      'Der Lernzyklus ist bestaetigt; die Bereinigungsgrenze ist noch nicht erreicht.'
    );
  }

  private ergebnis(
    phase: SpeicherLernPhase,
    auslastung: number,
    datenerfassungReduzieren: boolean,
    datensatzErstellen: boolean,
    lernenStarten: boolean,
    pruefungStarten: boolean,
    bereinigungErlaubt: boolean,
    loeschbarBisBytes: number,
    zielBelegtBytes: number,
    grund: string
  ): SpeicherLernEntscheidung {
    return {
      phase,
      auslastung,
      datenerfassungReduzieren,
      datensatzErstellen,
      lernenStarten,
      pruefungStarten,
      bereinigungErlaubt,
      loeschbarBisBytes,
      zielBelegtBytes,
      grund
    };
  }

  private istNachweisVollstaendig(nachweis: LernNachweis): boolean {
    return nachweis.datensatzErstellt
      && nachweis.lernenErfolgreich
      && nachweis.pruefungBestanden
      && nachweis.wissenDauerhaftGespeichert;
  }

  private pruefeSchwellen(schwellen: SpeicherLernSchwellen): void {
    const werte = [
      schwellen.zielNachBereinigung,
      schwellen.vorbereitenAb,
      schwellen.lernenAb,
      schwellen.bereinigenAb,
      schwellen.notfallAb
    ];
    if (werte.some((wert) => !Number.isFinite(wert) || wert <= 0 || wert > 1)) {
      throw new Error('Alle Speicher-Lern-Schwellen muessen groesser als 0 und hoechstens 1 sein.');
    }
    if (!(
      schwellen.zielNachBereinigung < schwellen.vorbereitenAb
      && schwellen.vorbereitenAb < schwellen.lernenAb
      && schwellen.lernenAb < schwellen.bereinigenAb
      && schwellen.bereinigenAb < schwellen.notfallAb
    )) {
      throw new Error('Die Speicher-Lern-Schwellen muessen streng aufsteigend sein.');
    }
  }

  private pruefeEingabe(eingabe: SpeicherLernEingabe): void {
    for (const [name, wert] of [
      ['belegtBytes', eingabe.belegtBytes],
      ['sicherNutzbarBytes', eingabe.sicherNutzbarBytes],
      ['verarbeiteteLoeschbareBytes', eingabe.verarbeiteteLoeschbareBytes],
      ['geschuetzteBytes', eingabe.geschuetzteBytes]
    ] as const) {
      if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine nicht negative endliche Zahl sein.`);
    }
    if (eingabe.sicherNutzbarBytes <= 0) throw new Error('sicherNutzbarBytes muss groesser als 0 sein.');
    if (eingabe.geschuetzteBytes > eingabe.belegtBytes) throw new Error('Geschuetzte Daten koennen nicht groesser als die gesamte Belegung sein.');
    if (eingabe.verarbeiteteLoeschbareBytes + eingabe.geschuetzteBytes > eingabe.belegtBytes) {
      throw new Error('Loeschbare und geschuetzte Daten koennen zusammen nicht groesser als die gesamte Belegung sein.');
    }
  }
}
