(() => {
  'use strict';

  const API_NAME = 'V4AktionsSteuerungSchattenKern';
  const VERSION = '1.0.0';
  const QUELL_BLOB_SHAS = Object.freeze({
    aktionsSteuerung: '4f43b996a474a561d623f85261d5aca264167bbb',
    laufzeitSteuerung: '22751accce38c92205c811d1be36c3f4dd0e7f30',
    laufzeitVertrag: '452ecdfcba63092fe1a68b1312511c456fd2ef08',
    aktionsAuswahl: '8bd3c08a7bfe37139fc9052bfc3e9dbfbfb79afa',
    ressourcenVergabe: '209f94c5db0dd52c6b9182f0e4ef52cdfac13120',
    schattenAusfuehrung: 'f991c1082e87ae74f21f5c0912a79f8f78484429',
    ressourcenVertrag: '3b8396d48fc08190a20bab7d46928cda3693bf5e'
  });
  const RESSOURCEN_NAMEN = Object.freeze(['bewegung', 'inventar', 'bank', 'handel', 'kampfziel', 'gruppe', 'ausruestung']);
  const GUELTIGE_RESSOURCEN = new Set(RESSOURCEN_NAMEN);
  const AKTIONS_WICHTIGKEITS_RANG = Object.freeze({ notfall: 4, sicherheit: 3, normal: 2, hintergrund: 1 });

  function istPauseGeschuetzteWichtigkeit(wichtigkeit) {
    return wichtigkeit === 'notfall' || wichtigkeit === 'sicherheit';
  }

  function pruefeLaufzeitZeitpunkt(zeitpunkt) {
    if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
      throw new Error('Der Laufzeitsteuerungs-Zeitpunkt muss endlich und nichtnegativ sein.');
    }
  }

  function pruefeLaufzeitGrund(grund) {
    if (String(grund).trim().length === 0) throw new Error('Die Laufzeitsteuerung benoetigt einen Grund.');
  }

  class LaufzeitSteuerung {
    constructor() {
      this.zustand = 'laeuft';
      this.generation = 0;
      this.letzteAenderungAm = null;
      this.grund = 'Laufzeit ist fuer normale Arbeit freigegeben.';
    }

    status() {
      return Object.freeze({
        schemaVersion: 1,
        zustand: this.zustand,
        generation: this.generation,
        letzteAenderungAm: this.letzteAenderungAm,
        grund: this.grund,
        automatischeFortsetzung: false
      });
    }

    pausiere(zeitpunkt, grund) {
      pruefeLaufzeitZeitpunkt(zeitpunkt);
      pruefeLaufzeitGrund(grund);
      if (this.letzteAenderungAm !== null && zeitpunkt < this.letzteAenderungAm) {
        throw new Error('Der Laufzeitsteuerungs-Zeitpunkt liegt vor der letzten Zustandsaenderung.');
      }
      if (this.zustand === 'pausiert') return this.status();
      this.zustand = 'pausiert';
      this.generation += 1;
      this.letzteAenderungAm = zeitpunkt;
      this.grund = grund;
      return this.status();
    }

    setzeFort(zeitpunkt, grund) {
      pruefeLaufzeitZeitpunkt(zeitpunkt);
      pruefeLaufzeitGrund(grund);
      if (this.letzteAenderungAm !== null && zeitpunkt < this.letzteAenderungAm) {
        throw new Error('Der Laufzeitsteuerungs-Zeitpunkt liegt vor der letzten Zustandsaenderung.');
      }
      if (this.zustand === 'laeuft') return this.status();
      this.zustand = 'laeuft';
      this.generation += 1;
      this.letzteAenderungAm = zeitpunkt;
      this.grund = grund;
      return this.status();
    }

    pruefeAktionsAnfrage(anfrage) {
      if (this.zustand === 'laeuft') {
        return Object.freeze({ erlaubt: true, grund: 'Laufzeit ist fuer normale Arbeit freigegeben.' });
      }
      if (istPauseGeschuetzteWichtigkeit(anfrage.wichtigkeit)) {
        return Object.freeze({
          erlaubt: true,
          grund: 'Laufzeit ist pausiert; Notfall- und Sicherheitsarbeit bleibt ausdruecklich zugelassen.'
        });
      }
      return Object.freeze({
        erlaubt: false,
        grund: 'Laufzeit ist pausiert; normale und Hintergrundarbeit darf nicht gestartet oder fortgesetzt werden.'
      });
    }
  }

  function friereListe(werte) { return Object.freeze([...werte]); }
  function kopiereAnfrage(anfrage) {
    return Object.freeze({ ...anfrage, benoetigteRessourcen: Object.freeze([...new Set(anfrage.benoetigteRessourcen)].sort()) });
  }

  class AktionsSteuerung {
    constructor(optionen = {}) {
      this.laufzeitSteuerung = optionen.laufzeitSteuerung ?? new LaufzeitSteuerung();
      this.zustaende = new Map();
      this.ressourcenSperren = new Map();
      this.schattenEintraege = [];
      this.aktiveSchattenEintraege = new Map();
      this.naechsteLaufendeNummer = 1;
    }

    reicheAnfrageEin(anfrage) {
      this.pruefeAnfrage(anfrage);
      if (this.zustaende.has(anfrage.kennung)) throw new Error(`Die AktionsAnfrage-Kennung ${anfrage.kennung} wurde bereits verwendet.`);
      const gespeicherteAnfrage = kopiereAnfrage(anfrage);
      const laufzeitFreigabe = this.laufzeitSteuerung.pruefeAktionsAnfrage(gespeicherteAnfrage);
      const zustand = Object.freeze({
        anfrage: gespeicherteAnfrage,
        phase: laufzeitFreigabe.erlaubt ? 'wartend' : 'abgebrochen',
        eingereihtAm: gespeicherteAnfrage.angefordertAm,
        gestartetAm: null,
        beendetAm: laufzeitFreigabe.erlaubt ? null : gespeicherteAnfrage.angefordertAm,
        zustandsGrund: laufzeitFreigabe.erlaubt
          ? 'Anfrage wartet auf die zentrale AktionsSteuerung.'
          : laufzeitFreigabe.grund,
        blockiertDurch: Object.freeze([])
      });
      this.zustaende.set(gespeicherteAnfrage.kennung, zustand);
      return zustand;
    }

    verarbeiteNaechsteAktion(jetzt) {
      this.pruefeZeitpunkt(jetzt);
      this.markiereAbgelaufeneAnfragen(jetzt);
      const kandidaten = [...this.zustaende.values()]
        .filter((zustand) => zustand.phase === 'wartend' || zustand.phase === 'blockiert')
        .map((zustand) => zustand.anfrage)
        .filter((anfrage) => anfrage.gueltigBis === undefined || anfrage.gueltigBis > jetzt)
        .sort((a, b) => {
          const wichtigkeitsUnterschied = AKTIONS_WICHTIGKEITS_RANG[b.wichtigkeit] - AKTIONS_WICHTIGKEITS_RANG[a.wichtigkeit];
          if (wichtigkeitsUnterschied !== 0) return wichtigkeitsUnterschied;
          if (a.prioritaet !== b.prioritaet) return b.prioritaet - a.prioritaet;
          if (a.angefordertAm !== b.angefordertAm) return a.angefordertAm - b.angefordertAm;
          return a.kennung.localeCompare(b.kennung);
        });
      const blockierteAnfragen = [];

      for (const anfrage of kandidaten) {
        const laufzeitFreigabe = this.laufzeitSteuerung.pruefeAktionsAnfrage(anfrage);
        if (!laufzeitFreigabe.erlaubt) {
          this.brecheAktionAb(anfrage.kennung, jetzt, laufzeitFreigabe.grund);
          blockierteAnfragen.push(anfrage.kennung);
          continue;
        }

        const sperrErgebnis = this.versucheRessourcenFuerAnfrageZuSperren(anfrage);
        if (!sperrErgebnis.gesperrt) {
          const bisher = this.mussZustandHolen(anfrage.kennung);
          const blockierer = sperrErgebnis.blockiertDurch.map((sperre) => `${sperre.ressource}:${sperre.besitzer}`).join(', ');
          this.zustaende.set(anfrage.kennung, Object.freeze({
            ...bisher,
            phase: 'blockiert',
            zustandsGrund: `Ressourcen sind belegt: ${blockierer}.`,
            blockiertDurch: friereListe(sperrErgebnis.blockiertDurch)
          }));
          blockierteAnfragen.push(anfrage.kennung);
          continue;
        }

        const unterbrocheneAnfragen = [];
        for (const unterbrocheneKennung of sperrErgebnis.unterbrocheneBesitzer) {
          const unterbrochenerZustand = this.zustaende.get(unterbrocheneKennung);
          if (!unterbrochenerZustand || unterbrochenerZustand.phase !== 'laeuft') continue;
          const grund = `Unterbrochen durch die wichtigere AktionsAnfrage ${anfrage.kennung}.`;
          this.beendeSchatten(unterbrocheneKennung, 'unterbrochen', jetzt, grund);
          this.zustaende.set(unterbrocheneKennung, Object.freeze({
            ...unterbrochenerZustand,
            phase: 'abgebrochen',
            beendetAm: jetzt,
            zustandsGrund: grund,
            blockiertDurch: Object.freeze([])
          }));
          unterbrocheneAnfragen.push(unterbrocheneKennung);
        }

        const bisher = this.mussZustandHolen(anfrage.kennung);
        this.zustaende.set(anfrage.kennung, Object.freeze({
          ...bisher,
          phase: 'laeuft',
          gestartetAm: jetzt,
          beendetAm: null,
          zustandsGrund: 'Im Schattenbetrieb gestartet; es wurde keine Spielaktion ausgefuehrt.',
          blockiertDurch: Object.freeze([])
        }));
        this.starteSchatten(anfrage, jetzt);
        return Object.freeze({
          art: 'gestartet',
          zeitpunkt: jetzt,
          gestarteteAnfrage: anfrage,
          unterbrocheneAnfragen: friereListe(unterbrocheneAnfragen),
          blockierteAnfragen: friereListe(blockierteAnfragen)
        });
      }

      return Object.freeze({
        art: 'keine-ausfuehrbare-aktion',
        zeitpunkt: jetzt,
        gestarteteAnfrage: null,
        unterbrocheneAnfragen: Object.freeze([]),
        blockierteAnfragen: friereListe(blockierteAnfragen)
      });
    }

    brecheAktionAb(kennung, jetzt, grund) {
      this.pruefeZeitpunkt(jetzt);
      if (grund.trim().length === 0) throw new Error('Ein Abbruch benoetigt einen Grund.');
      const zustand = this.mussZustandHolen(kennung);
      if (zustand.phase === 'abgebrochen' || zustand.phase === 'abgeschlossen' || zustand.phase === 'abgelaufen') return false;
      if (zustand.phase === 'laeuft') {
        this.gibRessourcenFuerBesitzerFrei(kennung);
        this.beendeSchatten(kennung, 'abgebrochen', jetzt, grund);
      }
      this.zustaende.set(kennung, Object.freeze({ ...zustand, phase: 'abgebrochen', beendetAm: jetzt, zustandsGrund: grund, blockiertDurch: Object.freeze([]) }));
      return true;
    }

    schliesseAktionAb(kennung, jetzt, grund = 'Schattenaktion abgeschlossen.') {
      this.pruefeZeitpunkt(jetzt);
      if (grund.trim().length === 0) throw new Error('Ein Abschluss benoetigt einen Grund.');
      const zustand = this.mussZustandHolen(kennung);
      if (zustand.phase !== 'laeuft') throw new Error(`Die AktionsAnfrage ${kennung} laeuft nicht und kann nicht abgeschlossen werden.`);
      this.gibRessourcenFuerBesitzerFrei(kennung);
      this.beendeSchatten(kennung, 'abgeschlossen', jetzt, grund);
      const abgeschlossen = Object.freeze({ ...zustand, phase: 'abgeschlossen', beendetAm: jetzt, zustandsGrund: grund, blockiertDurch: Object.freeze([]) });
      this.zustaende.set(kennung, abgeschlossen);
      return abgeschlossen;
    }

    brecheNormaleArbeitFuerPauseAb(
      jetzt,
      grund = 'Laufzeit wurde pausiert; normale und Hintergrundarbeit wird fail-safe abgebrochen.'
    ) {
      this.pruefeZeitpunkt(jetzt);
      if (String(grund).trim().length === 0) throw new Error('Ein Pause-Abbruch benoetigt einen Grund.');
      const abgebrochen = [];
      for (const zustand of this.listeAktionsZustaende()) {
        if (!['wartend', 'blockiert', 'laeuft'].includes(zustand.phase)) continue;
        if (zustand.anfrage.wichtigkeit === 'notfall' || zustand.anfrage.wichtigkeit === 'sicherheit') continue;
        if (this.brecheAktionAb(zustand.anfrage.kennung, jetzt, grund)) abgebrochen.push(zustand.anfrage.kennung);
      }
      return Object.freeze(abgebrochen.sort());
    }

    laufzeitStatus() { return this.laufzeitSteuerung.status(); }
    istMitLaufzeitSteuerungVerbunden(laufzeitSteuerung) { return this.laufzeitSteuerung === laufzeitSteuerung; }

    holeAktionsZustand(kennung) { return this.zustaende.get(kennung) ?? null; }
    listeAktionsZustaende() {
      return [...this.zustaende.values()].sort((a, b) =>
        a.anfrage.angefordertAm !== b.anfrage.angefordertAm
          ? a.anfrage.angefordertAm - b.anfrage.angefordertAm
          : a.anfrage.kennung.localeCompare(b.anfrage.kennung));
    }
    listeRessourcenSperren() { return [...this.ressourcenSperren.values()].sort((a, b) => a.ressource.localeCompare(b.ressource)); }
    listeSchattenProtokoll() { return [...this.schattenEintraege]; }

    versucheRessourcenFuerAnfrageZuSperren(anfrage) {
      if (anfrage.benoetigteRessourcen.length === 0) return { gesperrt: true, blockiertDurch: [], unterbrocheneBesitzer: [], sperren: [] };
      const ressourcen = [...new Set(anfrage.benoetigteRessourcen)].sort();
      const blockiertDurch = [];
      const unterbrocheneBesitzer = new Set();
      const rang = AKTIONS_WICHTIGKEITS_RANG[anfrage.wichtigkeit];
      for (const ressource of ressourcen) {
        const aktuelleSperre = this.ressourcenSperren.get(ressource);
        if (!aktuelleSperre || aktuelleSperre.besitzer === anfrage.kennung) continue;
        const hoeher = rang !== aktuelleSperre.wichtigkeitsRang ? rang > aktuelleSperre.wichtigkeitsRang : anfrage.prioritaet > aktuelleSperre.prioritaet;
        if (!aktuelleSperre.darfUnterbrochenWerden || !hoeher) blockiertDurch.push(aktuelleSperre);
        else unterbrocheneBesitzer.add(aktuelleSperre.besitzer);
      }
      if (blockiertDurch.length > 0) {
        return { gesperrt: false, blockiertDurch: blockiertDurch.sort((a, b) => a.ressource.localeCompare(b.ressource)), unterbrocheneBesitzer: [], sperren: [] };
      }
      for (const besitzer of [...unterbrocheneBesitzer].sort()) this.gibRessourcenFuerBesitzerFrei(besitzer);
      const neueSperren = ressourcen.map((ressource) => ({
        ressource,
        besitzer: anfrage.kennung,
        wichtigkeitsRang: rang,
        prioritaet: anfrage.prioritaet,
        darfUnterbrochenWerden: anfrage.wichtigkeit !== 'notfall',
        gesperrtSeit: anfrage.angefordertAm
      }));
      for (const sperre of neueSperren) this.ressourcenSperren.set(sperre.ressource, sperre);
      return { gesperrt: true, blockiertDurch: [], unterbrocheneBesitzer: [...unterbrocheneBesitzer].sort(), sperren: neueSperren };
    }

    gibRessourcenFuerBesitzerFrei(besitzer) {
      let anzahl = 0;
      for (const [ressource, sperre] of this.ressourcenSperren.entries()) {
        if (sperre.besitzer === besitzer) { this.ressourcenSperren.delete(ressource); anzahl += 1; }
      }
      return anzahl;
    }

    starteSchatten(anfrage, geplantAm) {
      if (this.aktiveSchattenEintraege.has(anfrage.kennung)) throw new Error(`Fuer die AktionsAnfrage ${anfrage.kennung} laeuft bereits ein Schatteneintrag.`);
      const eintrag = Object.freeze({
        laufendeNummer: this.naechsteLaufendeNummer,
        aktionsAnfrageKennung: anfrage.kennung,
        angefordertVon: anfrage.angefordertVon,
        aktion: anfrage.aktion,
        wichtigkeit: anfrage.wichtigkeit,
        prioritaet: anfrage.prioritaet,
        grund: anfrage.grund,
        ressourcen: Object.freeze([...anfrage.benoetigteRessourcen]),
        geplantAm,
        phase: 'laeuft',
        beendetAm: null,
        abschlussGrund: null,
        details: anfrage.details
      });
      this.naechsteLaufendeNummer += 1;
      const index = this.schattenEintraege.length;
      this.schattenEintraege.push(eintrag);
      this.aktiveSchattenEintraege.set(anfrage.kennung, index);
      return eintrag;
    }

    beendeSchatten(kennung, phase, beendetAm, grund) {
      const index = this.aktiveSchattenEintraege.get(kennung);
      if (index === undefined) throw new Error(`Keine laufende Schattenaktion fuer ${kennung} gefunden.`);
      const vorher = this.schattenEintraege[index];
      const aktualisiert = Object.freeze({ ...vorher, phase, beendetAm, abschlussGrund: grund });
      this.schattenEintraege[index] = aktualisiert;
      this.aktiveSchattenEintraege.delete(kennung);
      return aktualisiert;
    }

    markiereAbgelaufeneAnfragen(jetzt) {
      for (const [kennung, zustand] of this.zustaende.entries()) {
        if ((zustand.phase !== 'wartend' && zustand.phase !== 'blockiert') || zustand.anfrage.gueltigBis === undefined || zustand.anfrage.gueltigBis > jetzt) continue;
        this.zustaende.set(kennung, Object.freeze({ ...zustand, phase: 'abgelaufen', beendetAm: jetzt,
          zustandsGrund: 'Die AktionsAnfrage ist vor der Ausfuehrung abgelaufen.', blockiertDurch: Object.freeze([]) }));
      }
    }

    pruefeAnfrage(anfrage) {
      for (const [feld, wert] of [['kennung', anfrage.kennung], ['angefordertVon', anfrage.angefordertVon], ['aktion', anfrage.aktion], ['grund', anfrage.grund]]) {
        if (wert.trim().length === 0) throw new Error(`${feld} darf nicht leer sein.`);
      }
      if (!Object.prototype.hasOwnProperty.call(AKTIONS_WICHTIGKEITS_RANG, anfrage.wichtigkeit)) throw new Error(`Unbekannte AktionsWichtigkeit: ${String(anfrage.wichtigkeit)}.`);
      if (!Number.isFinite(anfrage.prioritaet)) throw new Error('Die Aktionsprioritaet muss eine endliche Zahl sein.');
      this.pruefeZeitpunkt(anfrage.angefordertAm);
      if (anfrage.gueltigBis !== undefined) {
        this.pruefeZeitpunkt(anfrage.gueltigBis);
        if (anfrage.gueltigBis <= anfrage.angefordertAm) throw new Error('gueltigBis muss nach angefordertAm liegen.');
      }
      for (const ressource of anfrage.benoetigteRessourcen) {
        if (!GUELTIGE_RESSOURCEN.has(ressource)) throw new Error(`Unbekannte Ressource: ${String(ressource)}.`);
      }
    }
    pruefeZeitpunkt(zeitpunkt) {
      if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error('Zeitpunkte muessen endliche, nichtnegative Zahlen sein.');
    }
    mussZustandHolen(kennung) {
      const zustand = this.zustaende.get(kennung);
      if (!zustand) throw new Error(`Unbekannte AktionsAnfrage: ${kennung}.`);
      return zustand;
    }
  }

  globalThis[API_NAME] = Object.freeze({
    version: VERSION,
    quellBlobShas: QUELL_BLOB_SHAS,
    LaufzeitSteuerung,
    AktionsSteuerung
  });
})();