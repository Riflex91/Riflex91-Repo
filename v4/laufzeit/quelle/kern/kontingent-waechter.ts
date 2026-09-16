import type {
  DienstAnfrage,
  DienstProfil,
  KontingentEntscheidung,
  KontingentSchutzstufe,
  VerbrauchsStand
} from '../vertraege/dienst-kontingent.js';

interface InternerVerbrauchsStand extends VerbrauchsStand {}

export class KontingentWaechter {
  private readonly profile = new Map<string, DienstProfil>();
  private readonly verbrauch = new Map<string, InternerVerbrauchsStand>();

  setzeDienstProfil(profil: DienstProfil): void {
    if (profil.dienstKennung.trim().length === 0) throw new Error('Eine Dienstkennung darf nicht leer sein.');
    if (profil.quelle.trim().length === 0) throw new Error('Ein Dienstprofil braucht eine nachvollziehbare Quelle.');
    if (profil.gueltigBis <= profil.geprueftAm) throw new Error('Ein Dienstprofil muss nach seiner Pruefung noch gueltig sein.');
    if (profil.grenzen.length === 0) throw new Error('Ein Dienstprofil braucht mindestens eine Nutzungsgrenze.');

    const kennungen = new Set<string>();
    for (const grenze of profil.grenzen) {
      if (grenze.kennung.trim().length === 0) throw new Error('Eine Nutzungsgrenze darf keine leere Kennung haben.');
      if (kennungen.has(grenze.kennung)) throw new Error(`Nutzungsgrenze doppelt vorhanden: ${grenze.kennung}`);
      kennungen.add(grenze.kennung);
      if (!Number.isFinite(grenze.anbieterMaximum) || grenze.anbieterMaximum <= 0) throw new Error(`Ungueltiges Anbietermaximum fuer ${grenze.kennung}.`);
      if (!Number.isFinite(grenze.sicherheitsPuffer) || grenze.sicherheitsPuffer < 0 || grenze.sicherheitsPuffer >= grenze.anbieterMaximum) {
        throw new Error(`Ungueltiger Sicherheitspuffer fuer ${grenze.kennung}.`);
      }
    }

    this.profile.set(profil.dienstKennung, profil);
  }

  aktualisiereVerbrauch(
    dienstKennung: string,
    grenzeKennung: string,
    fensterKennung: string,
    vomAnbieterGemeldet: number
  ): void {
    if (!Number.isFinite(vomAnbieterGemeldet) || vomAnbieterGemeldet < 0) throw new Error('Anbieter-Verbrauch darf nicht negativ sein.');
    const schluessel = this.verbrauchsSchluessel(dienstKennung, grenzeKennung);
    const bisher = this.verbrauch.get(schluessel);
    const lokalReserviert = bisher?.fensterKennung === fensterKennung ? bisher.lokalReserviert : 0;
    const vorherGemeldet = bisher?.fensterKennung === fensterKennung ? bisher.vomAnbieterGemeldet : 0;
    this.verbrauch.set(schluessel, {
      dienstKennung,
      grenzeKennung,
      fensterKennung,
      lokalReserviert,
      vomAnbieterGemeldet: Math.max(vorherGemeldet, vomAnbieterGemeldet)
    });
  }

  pruefeUndReserviere(anfrage: DienstAnfrage, fensterKennungen: Readonly<Record<string, string>>, jetzt: number): KontingentEntscheidung {
    const profil = this.profile.get(anfrage.dienstKennung);
    if (!profil) return this.blockiert(anfrage, 'Fuer diesen externen Dienst ist kein geprueftes Dienstprofil vorhanden.');
    if (jetzt > profil.gueltigBis) return this.blockiert(anfrage, 'Das Dienstprofil ist abgelaufen. Die aktuellen Anbietergrenzen muessen zuerst neu geprueft werden.');
    if (anfrage.reservierungen.length === 0) return this.blockiert(anfrage, 'Der maximale Verbrauch dieser Anfrage ist nicht angegeben.');

    const neueStaende = new Map<string, InternerVerbrauchsStand>();
    const verbleibendNachReservierung: Record<string, number> = {};
    let hoechsteSchutzstufe: KontingentSchutzstufe = 'normal';

    for (const reservierung of anfrage.reservierungen) {
      if (!Number.isFinite(reservierung.maximalerVerbrauch) || reservierung.maximalerVerbrauch <= 0) {
        return this.blockiert(anfrage, `Der maximale Verbrauch fuer ${reservierung.grenzeKennung} ist unbekannt oder ungueltig.`);
      }

      const grenze = profil.grenzen.find((eintrag) => eintrag.kennung === reservierung.grenzeKennung);
      if (!grenze) return this.blockiert(anfrage, `Die Nutzungsgrenze ${reservierung.grenzeKennung} ist im Dienstprofil nicht definiert.`);

      const fensterKennung = fensterKennungen[grenze.kennung];
      if (!fensterKennung) return this.blockiert(anfrage, `Das aktuelle Zeitfenster fuer ${grenze.kennung} ist unbekannt.`);

      const schluessel = this.verbrauchsSchluessel(anfrage.dienstKennung, grenze.kennung);
      const bisher = this.verbrauch.get(schluessel);
      const stand = bisher?.fensterKennung === fensterKennung
        ? bisher
        : {
            dienstKennung: anfrage.dienstKennung,
            grenzeKennung: grenze.kennung,
            fensterKennung,
            lokalReserviert: 0,
            vomAnbieterGemeldet: 0
          };

      const sicherNutzbar = grenze.anbieterMaximum - grenze.sicherheitsPuffer;
      const bisherVerbraucht = Math.max(stand.lokalReserviert, stand.vomAnbieterGemeldet);
      const danachVerbraucht = bisherVerbraucht + reservierung.maximalerVerbrauch;
      if (danachVerbraucht > sicherNutzbar) {
        return this.blockiert(anfrage, `Die Anfrage wuerde das sichere Kontingent fuer ${grenze.kennung} ueberschreiten.`);
      }

      const verbleibend = sicherNutzbar - danachVerbraucht;
      verbleibendNachReservierung[grenze.kennung] = verbleibend;
      const auslastung = danachVerbraucht / sicherNutzbar;
      hoechsteSchutzstufe = this.hoehereSchutzstufe(hoechsteSchutzstufe, this.bestimmeSchutzstufe(auslastung));
      neueStaende.set(schluessel, { ...stand, lokalReserviert: danachVerbraucht });
    }

    for (const [schluessel, stand] of neueStaende) this.verbrauch.set(schluessel, stand);

    return {
      erlaubt: true,
      schutzstufe: hoechsteSchutzstufe,
      grund: 'Alle benoetigten Kontingente wurden vor der Anfrage sicher reserviert.',
      dienstKennung: anfrage.dienstKennung,
      vorgangKennung: anfrage.vorgangKennung,
      verbleibendNachReservierung
    };
  }

  holeVerbrauch(dienstKennung: string, grenzeKennung: string): VerbrauchsStand | null {
    return this.verbrauch.get(this.verbrauchsSchluessel(dienstKennung, grenzeKennung)) ?? null;
  }

  private bestimmeSchutzstufe(auslastung: number): KontingentSchutzstufe {
    if (auslastung >= 0.85) return 'sparen';
    if (auslastung >= 0.7) return 'beobachten';
    return 'normal';
  }

  private hoehereSchutzstufe(a: KontingentSchutzstufe, b: KontingentSchutzstufe): KontingentSchutzstufe {
    const rang: Readonly<Record<KontingentSchutzstufe, number>> = { normal: 1, beobachten: 2, sparen: 3, blockiert: 4 };
    return rang[b] > rang[a] ? b : a;
  }

  private blockiert(anfrage: DienstAnfrage, grund: string): KontingentEntscheidung {
    return {
      erlaubt: false,
      schutzstufe: 'blockiert',
      grund,
      dienstKennung: anfrage.dienstKennung,
      vorgangKennung: anfrage.vorgangKennung,
      verbleibendNachReservierung: {}
    };
  }

  private verbrauchsSchluessel(dienstKennung: string, grenzeKennung: string): string {
    return `${dienstKennung}:${grenzeKennung}`;
  }
}
