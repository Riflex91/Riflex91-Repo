(() => {
  'use strict';

  const API_NAME = 'V4Block8GruppenKoordinationKern';
  const VERSION = '1.0.0';
  const QUELL_BLOB_SHA = 'ac894a3a20d0a6d54c1c9b402ce7eb9bc58e2bfe';
  const STANDARD_LEBENSNACHWEIS_ALTER_MILLIS = 5_000;
  const GRUPPEN_FAEHIGKEITEN = Object.freeze(['heilen', 'schaden', 'aggro', 'schutz', 'unterstuetzung']);
  const GEFAHREN_RANG = Object.freeze({ sicher: 0, angespannt: 1, gefaehrlich: 2, kritisch: 3, unbekannt: 4 });

  function erstelleGruppenKoordinationsKonfiguration(aenderungen = {}) {
    const lebensnachweisMaximalAlterMillisekunden =
      aenderungen.lebensnachweisMaximalAlterMillisekunden ?? STANDARD_LEBENSNACHWEIS_ALTER_MILLIS;
    if (!Number.isFinite(lebensnachweisMaximalAlterMillisekunden) || lebensnachweisMaximalAlterMillisekunden <= 0) {
      throw new Error('lebensnachweisMaximalAlterMillisekunden muss groesser als 0 sein.');
    }
    return Object.freeze({ lebensnachweisMaximalAlterMillisekunden });
  }

  function sortiereMeldungen(meldungen) {
    return [...meldungen].sort((links, rechts) => {
      const kennung = links.charakterKennung.localeCompare(rechts.charakterKennung);
      if (kennung !== 0) return kennung;
      if (links.gesendetAm !== rechts.gesendetAm) return rechts.gesendetAm - links.gesendetAm;
      return rechts.laufendeNummer - links.laufendeNummer;
    });
  }

  function verdichteNeuesteMeldungen(meldungen) {
    const neueste = new Map();
    for (const meldung of sortiereMeldungen(meldungen)) {
      if (!neueste.has(meldung.charakterKennung)) neueste.set(meldung.charakterKennung, meldung);
    }
    return [...neueste.values()].sort((links, rechts) => links.charakterKennung.localeCompare(rechts.charakterKennung));
  }

  function bewerteTeilnehmer(meldung, eigenerTeilnehmer, jetzt, konfiguration) {
    const alterMillisekunden = jetzt - meldung.gesendetAm;
    let status = 'aktiv';
    let grund = 'Lebensnachweis ist aktuell und der Teilnehmer befindet sich in derselben Welt und Instanz.';

    if (!Number.isFinite(alterMillisekunden) || alterMillisekunden < 0 || alterMillisekunden > konfiguration.lebensnachweisMaximalAlterMillisekunden) {
      status = 'veraltet';
      grund = 'Lebensnachweis ist veraltet oder zeitlich unplausibel.';
    } else if (meldung.lebendig !== true) {
      status = 'ausgefallen';
      grund = meldung.lebendig === false ? 'Teilnehmer ist als nicht lebendig gemeldet.' : 'Lebenszustand des Teilnehmers ist unbekannt.';
    } else if (meldung.serverRegion !== eigenerTeilnehmer.serverRegion || meldung.serverKennung !== eigenerTeilnehmer.serverKennung) {
      status = 'falsche_welt';
      grund = 'Teilnehmer befindet sich auf einem anderen Adventure-Land-Server.';
    } else if (meldung.karte !== eigenerTeilnehmer.karte || meldung.instanz !== eigenerTeilnehmer.instanz) {
      status = 'falsche_instanz';
      grund = 'Teilnehmer befindet sich nicht in derselben Karte und Instanz.';
    }

    return Object.freeze({ charakterKennung: meldung.charakterKennung, status, grund, alterMillisekunden });
  }

  function waehleFaehigkeitsTraeger(faehigkeit, aktiveTeilnehmer) {
    const kandidaten = aktiveTeilnehmer
      .map((meldung) => ({ kennung: meldung.charakterKennung, wert: meldung.faehigkeiten[faehigkeit] }))
      .filter((kandidat) => Number.isFinite(kandidat.wert) && kandidat.wert > 0)
      .sort((links, rechts) => rechts.wert - links.wert || links.kennung.localeCompare(rechts.kennung));
    return kandidaten[0]?.kennung ?? null;
  }

  function verteileAufgaben(aktiveTeilnehmer) {
    const eintraege = GRUPPEN_FAEHIGKEITEN.map((faehigkeit) => [faehigkeit, waehleFaehigkeitsTraeger(faehigkeit, aktiveTeilnehmer)]);
    return Object.freeze(Object.fromEntries(eintraege));
  }

  function gemeinsameGefahrenStufe(aktiveTeilnehmer) {
    if (aktiveTeilnehmer.length === 0) return 'unbekannt';
    return [...aktiveTeilnehmer]
      .sort((links, rechts) => {
        const rang = GEFAHREN_RANG[rechts.gefahrenStufe] - GEFAHREN_RANG[links.gefahrenStufe];
        return rang || links.charakterKennung.localeCompare(rechts.charakterKennung);
      })[0]?.gefahrenStufe ?? 'unbekannt';
  }

  function gemeinsamesZiel(aktiveTeilnehmer) {
    const zaehler = new Map();
    for (const teilnehmer of aktiveTeilnehmer) {
      if (teilnehmer.zielKennung === null) continue;
      zaehler.set(teilnehmer.zielKennung, (zaehler.get(teilnehmer.zielKennung) ?? 0) + 1);
    }
    const kandidaten = [...zaehler.entries()].sort((links, rechts) => rechts[1] - links[1] || links[0].localeCompare(rechts[0]));
    return kandidaten[0]?.[0] ?? null;
  }

  function koordiniereGruppe(meldungen, eigenerTeilnehmerKennung, jetzt, konfiguration = erstelleGruppenKoordinationsKonfiguration()) {
    if (!Number.isFinite(jetzt)) throw new Error('jetzt muss eine endliche Zahl sein.');
    if (eigenerTeilnehmerKennung.length === 0) throw new Error('eigenerTeilnehmerKennung darf nicht leer sein.');

    const verdichtet = verdichteNeuesteMeldungen(meldungen);
    const eigenerTeilnehmer = verdichtet.find((meldung) => meldung.charakterKennung === eigenerTeilnehmerKennung);

    if (eigenerTeilnehmer === undefined) {
      return Object.freeze({
        schemaVersion: 1,
        zeitpunkt: jetzt,
        eigenerTeilnehmerKennung,
        betriebsArt: 'blockiert',
        grund: 'Eigener Gruppen-Lebensnachweis fehlt; Gruppenkoordination bleibt fail-safe blockiert.',
        gemeinsameGefahrenStufe: 'unbekannt',
        gemeinsamesZielKennung: null,
        aktiveTeilnehmerKennungen: Object.freeze([]),
        teilnehmerBewertungen: Object.freeze([]),
        aufgaben: verteileAufgaben([])
      });
    }

    const bewertungen = verdichtet.map((meldung) => bewerteTeilnehmer(meldung, eigenerTeilnehmer, jetzt, konfiguration));
    const bewertungNachKennung = new Map(bewertungen.map((bewertung) => [bewertung.charakterKennung, bewertung]));
    const eigeneBewertung = bewertungNachKennung.get(eigenerTeilnehmerKennung);

    if (eigeneBewertung?.status !== 'aktiv') {
      return Object.freeze({
        schemaVersion: 1,
        zeitpunkt: jetzt,
        eigenerTeilnehmerKennung,
        betriebsArt: 'blockiert',
        grund: `Eigener Gruppen-Lebensnachweis ist nicht aktiv: ${eigeneBewertung?.grund ?? 'unbekannter Grund'}`,
        gemeinsameGefahrenStufe: 'unbekannt',
        gemeinsamesZielKennung: null,
        aktiveTeilnehmerKennungen: Object.freeze([]),
        teilnehmerBewertungen: Object.freeze(bewertungen),
        aufgaben: verteileAufgaben([])
      });
    }

    const aktiveTeilnehmer = verdichtet.filter((meldung) => bewertungNachKennung.get(meldung.charakterKennung)?.status === 'aktiv');
    const gefahr = gemeinsameGefahrenStufe(aktiveTeilnehmer);
    const unbekannteSicherheit = gefahr === 'unbekannt';
    const sicherheitsBetrieb = gefahr === 'gefaehrlich' || gefahr === 'kritisch';
    const betriebsArt = unbekannteSicherheit ? 'blockiert' : sicherheitsBetrieb ? 'sicherheit' : 'normal';
    const ziel = betriebsArt === 'normal' ? gemeinsamesZiel(aktiveTeilnehmer) : null;

    return Object.freeze({
      schemaVersion: 1,
      zeitpunkt: jetzt,
      eigenerTeilnehmerKennung,
      betriebsArt,
      grund:
        betriebsArt === 'blockiert'
          ? 'Mindestens ein aktiver Teilnehmer hat eine unbekannte Sicherheitslage; normale Gruppenarbeit bleibt blockiert.'
          : betriebsArt === 'sicherheit'
            ? 'Die gemeinsame Sicherheitslage hat Vorrang vor normaler Gruppenarbeit.'
            : 'Aktive Teilnehmer sind aktuell, kompatibel und fuer normale Gruppenarbeit freigegeben.',
      gemeinsameGefahrenStufe: gefahr,
      gemeinsamesZielKennung: ziel,
      aktiveTeilnehmerKennungen: Object.freeze(aktiveTeilnehmer.map((meldung) => meldung.charakterKennung)),
      teilnehmerBewertungen: Object.freeze(bewertungen),
      aufgaben: verteileAufgaben(aktiveTeilnehmer)
    });
  }

  globalThis[API_NAME] = Object.freeze({
    version: VERSION,
    quellDatei: 'v4/laufzeit/quelle/spiellogik/gruppen-koordination.ts',
    quellBlobSha: QUELL_BLOB_SHA,
    erstelleGruppenKoordinationsKonfiguration,
    koordiniereGruppe
  });
})();
