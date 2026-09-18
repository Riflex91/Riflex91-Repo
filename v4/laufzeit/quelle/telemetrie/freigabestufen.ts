import {
  FREIGABE_NACHWEIS_ERGEBNISSE,
  FREIGABE_STUFEN,
  type FreigabeAuswertung,
  type FreigabeAuswertungsEingabe,
  type FreigabeNachweis,
  type FreigabeStufe,
  type FreigabeStufenEintrag
} from '../vertraege/freigabestufen.js';

function pruefeNichtLeer(name: string, wert: string): void {
  if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) {
    throw new Error(`${name} muss endlich und nichtnegativ sein.`);
  }
}

function pruefeNachweis(
  nachweis: FreigabeNachweis,
  laufzeitPfadKennung: string,
  aenderungsKennung: string
): void {
  if (nachweis.schemaVersion !== 1) {
    throw new Error('FreigabeNachweis besitzt eine unbekannte schemaVersion.');
  }
  if (!FREIGABE_STUFEN.includes(nachweis.stufe)) {
    throw new Error('FreigabeNachweis besitzt eine unbekannte Stufe.');
  }
  if (!FREIGABE_NACHWEIS_ERGEBNISSE.includes(nachweis.ergebnis)) {
    throw new Error('FreigabeNachweis besitzt ein unbekanntes Ergebnis.');
  }
  pruefeNichtLeer('nachweis.laufzeitPfadKennung', nachweis.laufzeitPfadKennung);
  pruefeNichtLeer('nachweis.aenderungsKennung', nachweis.aenderungsKennung);
  pruefeNichtLeer('nachweis.nachweisKennung', nachweis.nachweisKennung);
  pruefeZeitpunkt('nachweis.durchgefuehrtAm', nachweis.durchgefuehrtAm);

  if (nachweis.laufzeitPfadKennung !== laufzeitPfadKennung) {
    throw new Error('FreigabeNachweis gehoert zu einem anderen Laufzeitpfad.');
  }
  if (nachweis.aenderungsKennung !== aenderungsKennung) {
    throw new Error('FreigabeNachweis gehoert zu einem anderen Aenderungsstand.');
  }
}

function stufenKriterium(nachweis: FreigabeNachweis): string | null {
  switch (nachweis.stufe) {
    case 'offline':
      if (nachweis.deterministisch !== true) {
        return 'Offline-Freigabe braucht einen deterministischen Test- oder Wiederholungsnachweis.';
      }
      if (nachweis.spielAktionAusgefuehrt !== false) {
        return 'Offline-Freigabe darf keine echte Spielaktion ausfuehren.';
      }
      return null;

    case 'schatten':
      if (nachweis.spielAktionAusgefuehrt !== false) {
        return 'Schattenbetrieb darf keine echte Spielaktion ausfuehren.';
      }
      return null;

    case 'kontrolliert_live':
      if (nachweis.begrenzt !== true) {
        return 'Kontrollierter Live-Test muss explizit begrenzt sein.';
      }
      return null;

    case 'soak':
      if (nachweis.telemetrieNachweis !== true) {
        return 'Soak-Test braucht einen Telemetrie-Nachweis.';
      }
      if (nachweis.recoveryNachweis !== true) {
        return 'Soak-Test braucht einen Recovery-Nachweis.';
      }
      if (nachweis.gesamtauswertungBestanden !== true) {
        return 'Soak-Test braucht eine bestandene Gesamtauswertung.';
      }
      return null;
  }
}

function stufenEintrag(
  stufe: FreigabeStufe,
  zustand: FreigabeStufenEintrag['zustand'],
  grund: string,
  nachweis: FreigabeNachweis | null
): FreigabeStufenEintrag {
  return Object.freeze({
    stufe,
    zustand,
    grund,
    nachweisKennung: nachweis?.nachweisKennung ?? null,
    durchgefuehrtAm: nachweis?.durchgefuehrtAm ?? null
  });
}

export function werteFreigabestufenAus(
  eingabe: FreigabeAuswertungsEingabe
): FreigabeAuswertung {
  if (eingabe.schemaVersion !== 1) {
    throw new Error('FreigabeAuswertungsEingabe besitzt eine unbekannte schemaVersion.');
  }
  pruefeNichtLeer('laufzeitPfadKennung', eingabe.laufzeitPfadKennung);
  pruefeNichtLeer('aenderungsKennung', eingabe.aenderungsKennung);

  const nachweise = new Map<FreigabeStufe, FreigabeNachweis>();
  for (const nachweis of eingabe.nachweise) {
    pruefeNachweis(nachweis, eingabe.laufzeitPfadKennung, eingabe.aenderungsKennung);
    if (nachweise.has(nachweis.stufe)) {
      throw new Error(`Freigabestufe ${nachweis.stufe} besitzt mehr als einen Nachweis.`);
    }
    nachweise.set(nachweis.stufe, nachweis);
  }

  const stufen: FreigabeStufenEintrag[] = [];
  let vorherigeStufeBestanden = true;
  let letzterBestandenerZeitpunkt: number | null = null;
  let naechsteStufe: FreigabeStufe | null = null;

  for (const stufe of FREIGABE_STUFEN) {
    const nachweis = nachweise.get(stufe) ?? null;

    if (!vorherigeStufeBestanden) {
      stufen.push(stufenEintrag(
        stufe,
        'blockiert',
        nachweis
          ? 'Nachweis ist vorhanden, wird aber nicht anerkannt, weil eine vorherige Freigabestufe nicht bestanden ist.'
          : 'Freigabestufe ist blockiert, bis alle vorherigen Stufen bestanden sind.',
        nachweis
      ));
      continue;
    }

    if (nachweis === null) {
      stufen.push(stufenEintrag(
        stufe,
        'offen',
        'Fuer diese Freigabestufe liegt noch kein Nachweis vor.',
        null
      ));
      vorherigeStufeBestanden = false;
      naechsteStufe ??= stufe;
      continue;
    }

    if (
      letzterBestandenerZeitpunkt !== null &&
      nachweis.durchgefuehrtAm < letzterBestandenerZeitpunkt
    ) {
      stufen.push(stufenEintrag(
        stufe,
        'fehlgeschlagen',
        'Der Nachweis liegt zeitlich vor der zuvor bestandenen Freigabestufe.',
        nachweis
      ));
      vorherigeStufeBestanden = false;
      naechsteStufe ??= stufe;
      continue;
    }

    if (nachweis.ergebnis === 'fehlgeschlagen') {
      stufen.push(stufenEintrag(
        stufe,
        'fehlgeschlagen',
        'Der Freigabenachweis ist fehlgeschlagen.',
        nachweis
      ));
      vorherigeStufeBestanden = false;
      naechsteStufe ??= stufe;
      continue;
    }

    const kriteriumsFehler = stufenKriterium(nachweis);
    if (kriteriumsFehler !== null) {
      stufen.push(stufenEintrag(
        stufe,
        'fehlgeschlagen',
        kriteriumsFehler,
        nachweis
      ));
      vorherigeStufeBestanden = false;
      naechsteStufe ??= stufe;
      continue;
    }

    stufen.push(stufenEintrag(
      stufe,
      'bestanden',
      'Freigabestufe ist fuer genau diesen Laufzeitpfad und Aenderungsstand bestanden.',
      nachweis
    ));
    letzterBestandenerZeitpunkt = nachweis.durchgefuehrtAm;
  }

  const freigabeVollstaendig =
    stufen.length === FREIGABE_STUFEN.length &&
    stufen.every((eintrag) => eintrag.zustand === 'bestanden');

  return Object.freeze({
    schemaVersion: 1,
    laufzeitPfadKennung: eingabe.laufzeitPfadKennung,
    aenderungsKennung: eingabe.aenderungsKennung,
    stufen: Object.freeze(stufen),
    naechsteStufe: freigabeVollstaendig ? null : naechsteStufe,
    freigabeVollstaendig,
    block9Freigegeben: freigabeVollstaendig,
    spielAutoritaet: false,
    neustartAutoritaet: false,
    grund: freigabeVollstaendig
      ? 'Alle vier Freigabestufen sind fuer denselben Aenderungsstand bestanden; Block 9 darf beginnen.'
      : 'Block 9 bleibt gesperrt, bis Offline-Test, Schattenbetrieb, kontrollierter Live-Test und Soak-Test fuer denselben Aenderungsstand bestanden sind.'
  });
}
