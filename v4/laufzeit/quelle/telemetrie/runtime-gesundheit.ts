import type {
  RecoveryStufe,
  RuntimeGesundheitsBeobachtung,
  RuntimeGesundheitsKonfiguration,
  RuntimeGesundheitsZustand
} from '../vertraege/runtime-gesundheit.js';

const STANDARD_BEOBACHTEN_NACH_MILLIS = 5_000;
const STANDARD_SICHER_PAUSIEREN_NACH_MILLIS = 15_000;
const STANDARD_NEUSTART_EMPFEHLEN_NACH_MILLIS = 60_000;

export function erstelleRuntimeGesundheitsKonfiguration(
  aenderungen: Partial<RuntimeGesundheitsKonfiguration> = {}
): RuntimeGesundheitsKonfiguration {
  const beobachtenNachMillisekunden =
    aenderungen.beobachtenNachMillisekunden ?? STANDARD_BEOBACHTEN_NACH_MILLIS;
  const sicherPausierenNachMillisekunden =
    aenderungen.sicherPausierenNachMillisekunden ?? STANDARD_SICHER_PAUSIEREN_NACH_MILLIS;
  const neustartEmpfehlenNachMillisekunden =
    aenderungen.neustartEmpfehlenNachMillisekunden ?? STANDARD_NEUSTART_EMPFEHLEN_NACH_MILLIS;

  for (const [name, wert] of [
    ['beobachtenNachMillisekunden', beobachtenNachMillisekunden],
    ['sicherPausierenNachMillisekunden', sicherPausierenNachMillisekunden],
    ['neustartEmpfehlenNachMillisekunden', neustartEmpfehlenNachMillisekunden]
  ] as const) {
    if (!Number.isFinite(wert) || wert <= 0) throw new Error(`${name} muss eine positive endliche Zahl sein.`);
  }
  if (sicherPausierenNachMillisekunden <= beobachtenNachMillisekunden) {
    throw new Error('sicherPausierenNachMillisekunden muss groesser als beobachtenNachMillisekunden sein.');
  }
  if (neustartEmpfehlenNachMillisekunden <= sicherPausierenNachMillisekunden) {
    throw new Error('neustartEmpfehlenNachMillisekunden muss groesser als sicherPausierenNachMillisekunden sein.');
  }

  return Object.freeze({
    beobachtenNachMillisekunden,
    sicherPausierenNachMillisekunden,
    neustartEmpfehlenNachMillisekunden
  });
}

function pruefeNichtnegativeGanzzahl(name: string, wert: number): void {
  if (!Number.isInteger(wert) || wert < 0) throw new Error(`${name} muss eine nichtnegative ganze Zahl sein.`);
}

function alter(
  jetzt: number,
  laufzeitGestartetAm: number,
  erwartet: boolean,
  letzterZeitpunkt: number | null,
  name: string
): number | null {
  if (!erwartet) return null;
  if (letzterZeitpunkt === null) return jetzt - laufzeitGestartetAm;
  if (!Number.isFinite(letzterZeitpunkt) || letzterZeitpunkt < laufzeitGestartetAm || letzterZeitpunkt > jetzt) {
    throw new Error(`${name} ist zeitlich unplausibel.`);
  }
  return jetzt - letzterZeitpunkt;
}

function maxAlter(werte: readonly (number | null)[]): number {
  return Math.max(0, ...werte.filter((wert): wert is number => wert !== null));
}

function ergebnis(
  beobachtung: RuntimeGesundheitsBeobachtung,
  recoveryStufe: RecoveryStufe,
  gruende: readonly string[],
  snapshotAlterMillisekunden: number | null,
  heartbeatAlterMillisekunden: number | null,
  fachlicherFortschrittAlterMillisekunden: number | null
): RuntimeGesundheitsZustand {
  const eingefroreneGruende = Object.freeze([...gruende]);
  const mussNutzerHandeln = recoveryStufe === 'neustart_empfohlen' || recoveryStufe === 'blockiert';
  return Object.freeze({
    schemaVersion: 1,
    ausgewertetAm: beobachtung.zeitpunkt,
    recoveryStufe,
    grund: eingefroreneGruende[0] ?? 'Runtime-Zustand ist gesund.',
    gruende: eingefroreneGruende,
    snapshotAlterMillisekunden,
    heartbeatAlterMillisekunden,
    fachlicherFortschrittAlterMillisekunden,
    gruppenLiveness: beobachtung.gruppenLiveness,
    sicherheitsStufe: beobachtung.sicherheitsStufe,
    offeneAktionsAnfragen: beobachtung.offeneAktionsAnfragen,
    abgebrocheneAktionsAnfragen: beobachtung.abgebrocheneAktionsAnfragen,
    mussNutzerHandeln,
    hostNeustartEmpfohlen: recoveryStufe === 'neustart_empfohlen',
    automatischerNeustart: false
  });
}

export function bewerteRuntimeGesundheit(
  beobachtung: RuntimeGesundheitsBeobachtung,
  konfiguration: RuntimeGesundheitsKonfiguration = erstelleRuntimeGesundheitsKonfiguration()
): RuntimeGesundheitsZustand {
  const cfg = erstelleRuntimeGesundheitsKonfiguration(konfiguration);
  if (!Number.isFinite(beobachtung.zeitpunkt) || beobachtung.zeitpunkt < 0) {
    throw new Error('zeitpunkt muss endlich und nichtnegativ sein.');
  }
  if (
    !Number.isFinite(beobachtung.laufzeitGestartetAm) ||
    beobachtung.laufzeitGestartetAm < 0 ||
    beobachtung.laufzeitGestartetAm > beobachtung.zeitpunkt
  ) {
    throw new Error('laufzeitGestartetAm ist zeitlich unplausibel.');
  }
  pruefeNichtnegativeGanzzahl('offeneAktionsAnfragen', beobachtung.offeneAktionsAnfragen);
  pruefeNichtnegativeGanzzahl('abgebrocheneAktionsAnfragen', beobachtung.abgebrocheneAktionsAnfragen);

  let snapshotAlterMillisekunden: number | null;
  let heartbeatAlterMillisekunden: number | null;
  let fachlicherFortschrittAlterMillisekunden: number | null;
  try {
    snapshotAlterMillisekunden = alter(
      beobachtung.zeitpunkt,
      beobachtung.laufzeitGestartetAm,
      beobachtung.snapshotErwartet,
      beobachtung.letzterSnapshotAm,
      'letzterSnapshotAm'
    );
    heartbeatAlterMillisekunden = alter(
      beobachtung.zeitpunkt,
      beobachtung.laufzeitGestartetAm,
      beobachtung.heartbeatErwartet,
      beobachtung.letzterHeartbeatAm,
      'letzterHeartbeatAm'
    );
    fachlicherFortschrittAlterMillisekunden = alter(
      beobachtung.zeitpunkt,
      beobachtung.laufzeitGestartetAm,
      beobachtung.fachlicherFortschrittErwartet,
      beobachtung.letzterFachlicherFortschrittAm,
      'letzterFachlicherFortschrittAm'
    );
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    return ergebnis(beobachtung, 'blockiert', [text], null, null, null);
  }

  const alterWerte = [
    snapshotAlterMillisekunden,
    heartbeatAlterMillisekunden,
    fachlicherFortschrittAlterMillisekunden
  ];
  const aeltesterWert = maxAlter(alterWerte);

  if (beobachtung.kritischerLaufzeitFehler) {
    return ergebnis(
      beobachtung,
      'blockiert',
      ['Ein kritischer Laufzeitfehler ist gemeldet; automatische Fortsetzung bleibt blockiert.'],
      snapshotAlterMillisekunden,
      heartbeatAlterMillisekunden,
      fachlicherFortschrittAlterMillisekunden
    );
  }
  if (beobachtung.sicherheitsStufe === 'unbekannt') {
    return ergebnis(
      beobachtung,
      'blockiert',
      ['Die Sicherheitslage ist unbekannt; normale Laufzeitarbeit bleibt fail-safe blockiert.'],
      snapshotAlterMillisekunden,
      heartbeatAlterMillisekunden,
      fachlicherFortschrittAlterMillisekunden
    );
  }

  if (aeltesterWert >= cfg.neustartEmpfehlenNachMillisekunden) {
    return ergebnis(
      beobachtung,
      'neustart_empfohlen',
      ['Runtime-Freshness oder fachlicher Fortschritt ist ueber die Neustart-Empfehlungsgrenze hinaus veraltet.'],
      snapshotAlterMillisekunden,
      heartbeatAlterMillisekunden,
      fachlicherFortschrittAlterMillisekunden
    );
  }

  if (
    aeltesterWert >= cfg.sicherPausierenNachMillisekunden ||
    beobachtung.gruppenLiveness === 'degradiert' ||
    beobachtung.gruppenLiveness === 'unbekannt' ||
    beobachtung.sicherheitsStufe === 'kritisch'
  ) {
    const gruende: string[] = [];
    if (aeltesterWert >= cfg.sicherPausierenNachMillisekunden) {
      gruende.push('Runtime-Freshness oder fachlicher Fortschritt ist zu alt; sichere Pause ist empfohlen.');
    }
    if (beobachtung.gruppenLiveness === 'degradiert') {
      gruende.push('Gruppen-Liveness ist degradiert.');
    }
    if (beobachtung.gruppenLiveness === 'unbekannt') {
      gruende.push('Gruppen-Liveness ist unbekannt.');
    }
    if (beobachtung.sicherheitsStufe === 'kritisch') {
      gruende.push('Die beobachtete Sicherheitslage ist kritisch.');
    }
    return ergebnis(
      beobachtung,
      'sicher_pausiert',
      gruende,
      snapshotAlterMillisekunden,
      heartbeatAlterMillisekunden,
      fachlicherFortschrittAlterMillisekunden
    );
  }

  if (
    aeltesterWert >= cfg.beobachtenNachMillisekunden ||
    beobachtung.gruppenLiveness === 'beobachten' ||
    beobachtung.sicherheitsStufe === 'angespannt' ||
    beobachtung.sicherheitsStufe === 'gefaehrlich'
  ) {
    const gruende: string[] = [];
    if (aeltesterWert >= cfg.beobachtenNachMillisekunden) {
      gruende.push('Runtime-Freshness oder fachlicher Fortschritt erreicht die Beobachtungsgrenze.');
    }
    if (beobachtung.gruppenLiveness === 'beobachten') {
      gruende.push('Gruppen-Liveness soll weiter beobachtet werden.');
    }
    if (beobachtung.sicherheitsStufe === 'angespannt' || beobachtung.sicherheitsStufe === 'gefaehrlich') {
      gruende.push(`Die beobachtete Sicherheitslage ist ${beobachtung.sicherheitsStufe}.`);
    }
    return ergebnis(
      beobachtung,
      'beobachten',
      gruende,
      snapshotAlterMillisekunden,
      heartbeatAlterMillisekunden,
      fachlicherFortschrittAlterMillisekunden
    );
  }

  return ergebnis(
    beobachtung,
    'normal',
    ['Runtime-Freshness, fachlicher Fortschritt, Gruppen-Liveness und Safety sind im beobachteten Bereich.'],
    snapshotAlterMillisekunden,
    heartbeatAlterMillisekunden,
    fachlicherFortschrittAlterMillisekunden
  );
}
