import type {
  GemeinsameStatusSicht,
  StatusAktionSicht,
  StatusCharakterSicht,
  StatusCheckpointSicht,
  StatusEntscheidungSicht,
  StatusGruppeSicht,
  StatusMeldungSicht,
  StatusRuntimeSicht,
  StatusSchnittstelle,
  StatusSchnittstellenEingabe,
  StatusWert
} from '../vertraege/status-schnittstelle.js';
import type {
  CharakterZustand,
  FehlenderWert,
  UnbekannterWert,
  WissensWert
} from '../vertraege/spielzustand.js';

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss endlich und nichtnegativ sein.`);
}

function kopiereStatusWert<TWert>(wert: WissensWert<TWert>): Readonly<StatusWert<TWert>> {
  if (wert.zustand === 'bekannt') {
    return Object.freeze({
      zustand: 'bekannt',
      quelle: wert.quelle,
      sicherheit: wert.sicherheit,
      wert: wert.wert,
      grund: null
    });
  }
  return Object.freeze({
    zustand: wert.zustand,
    quelle: wert.quelle,
    sicherheit: null,
    wert: null,
    grund: wert.grund
  });
}

function nichtVerfuegbarerStatusWert<TWert>(
  charakter: FehlenderWert | UnbekannterWert
): Readonly<StatusWert<TWert>> {
  return Object.freeze({
    zustand: charakter.zustand,
    quelle: charakter.quelle,
    sicherheit: null,
    wert: null,
    grund: charakter.grund
  });
}

function baueCharakterSicht(
  charakter: WissensWert<CharakterZustand>
): Readonly<StatusCharakterSicht> {
  if (charakter.zustand !== 'bekannt') {
    const feld = <TWert>(): Readonly<StatusWert<TWert>> =>
      nichtVerfuegbarerStatusWert<TWert>(charakter);
    return Object.freeze({
      verfuegbar: false,
      kennung: feld<string>(),
      name: feld<string>(),
      klasse: feld<string>(),
      stufe: feld<number>(),
      leben: feld<number>(),
      lebenMaximal: feld<number>(),
      mana: feld<number>(),
      manaMaximal: feld<number>(),
      karte: feld<string>(),
      instanz: feld<string>(),
      tot: feld<boolean | null>()
    });
  }

  const wert = charakter.wert;
  return Object.freeze({
    verfuegbar: true,
    kennung: kopiereStatusWert(wert.kennung),
    name: kopiereStatusWert(wert.name),
    klasse: kopiereStatusWert(wert.klasse),
    stufe: kopiereStatusWert(wert.stufe),
    leben: kopiereStatusWert(wert.leben),
    lebenMaximal: kopiereStatusWert(wert.lebenMaximal),
    mana: kopiereStatusWert(wert.mana),
    manaMaximal: kopiereStatusWert(wert.manaMaximal),
    karte: kopiereStatusWert(wert.karte),
    instanz: kopiereStatusWert(wert.instanz),
    tot: kopiereStatusWert(wert.tot)
  });
}

function baueRuntimeSicht(
  eingabe: StatusSchnittstellenEingabe['runtimeGesundheit']
): Readonly<StatusRuntimeSicht> {
  return Object.freeze({
    recoveryStufe: eingabe.recoveryStufe,
    grund: eingabe.grund,
    gruende: Object.freeze([...eingabe.gruende]),
    snapshotAlterMillisekunden: eingabe.snapshotAlterMillisekunden,
    heartbeatAlterMillisekunden: eingabe.heartbeatAlterMillisekunden,
    fachlicherFortschrittAlterMillisekunden: eingabe.fachlicherFortschrittAlterMillisekunden,
    gruppenLiveness: eingabe.gruppenLiveness,
    sicherheitsStufe: eingabe.sicherheitsStufe,
    offeneAktionsAnfragen: eingabe.offeneAktionsAnfragen,
    abgebrocheneAktionsAnfragen: eingabe.abgebrocheneAktionsAnfragen,
    mussNutzerHandeln: eingabe.mussNutzerHandeln,
    hostNeustartEmpfohlen: eingabe.hostNeustartEmpfohlen,
    automatischerNeustart: false
  });
}

function baueGruppenSicht(
  eingabe: StatusSchnittstellenEingabe['gruppenEntscheidung']
): Readonly<StatusGruppeSicht> {
  if (eingabe === null) {
    return Object.freeze({
      verfuegbar: false,
      eigenerTeilnehmerKennung: null,
      betriebsArt: null,
      grund: null,
      gemeinsameGefahrenStufe: null,
      gemeinsamesZielKennung: null,
      aktiveTeilnehmerKennungen: Object.freeze([]),
      teilnehmer: Object.freeze([]),
      aufgaben: null
    });
  }

  const teilnehmer = [...eingabe.teilnehmerBewertungen]
    .sort((links, rechts) => links.charakterKennung.localeCompare(rechts.charakterKennung))
    .map((bewertung) => Object.freeze({
      charakterKennung: bewertung.charakterKennung,
      status: bewertung.status,
      grund: bewertung.grund,
      alterMillisekunden: bewertung.alterMillisekunden
    }));

  return Object.freeze({
    verfuegbar: true,
    eigenerTeilnehmerKennung: eingabe.eigenerTeilnehmerKennung,
    betriebsArt: eingabe.betriebsArt,
    grund: eingabe.grund,
    gemeinsameGefahrenStufe: eingabe.gemeinsameGefahrenStufe,
    gemeinsamesZielKennung: eingabe.gemeinsamesZielKennung,
    aktiveTeilnehmerKennungen: Object.freeze([...eingabe.aktiveTeilnehmerKennungen].sort()),
    teilnehmer: Object.freeze(teilnehmer),
    aufgaben: Object.freeze({ ...eingabe.aufgaben })
  });
}

function baueEntscheidungsSicht(
  eingabe: StatusSchnittstellenEingabe['entscheidungsDatensatz']
): Readonly<StatusEntscheidungSicht> | null {
  if (eingabe === null) return null;
  return Object.freeze({
    entscheidungKennung: eingabe.entscheidungKennung,
    art: eingabe.art,
    quelle: eingabe.quelle,
    gewaehlteEntscheidung: eingabe.gewaehlteEntscheidung,
    grund: eingabe.grund,
    fachlicherFingerabdruck: eingabe.fachlicherFingerabdruck,
    aktionsAnfrageKennungen: Object.freeze([...eingabe.aktionsAnfrageKennungen].sort())
  });
}

function baueAktionsSichten(
  zustaende: StatusSchnittstellenEingabe['aktionsZustaende']
): readonly Readonly<StatusAktionSicht>[] {
  return Object.freeze(
    [...zustaende]
      .sort((links, rechts) => links.anfrage.kennung.localeCompare(rechts.anfrage.kennung))
      .map((zustand) => Object.freeze({
        kennung: zustand.anfrage.kennung,
        aktion: zustand.anfrage.aktion,
        phase: zustand.phase,
        wichtigkeit: zustand.anfrage.wichtigkeit,
        prioritaet: zustand.anfrage.prioritaet,
        grund: zustand.zustandsGrund,
        ressourcen: Object.freeze([...zustand.anfrage.benoetigteRessourcen].sort())
      }))
  );
}

function baueCheckpointSicht(
  eingabe: StatusSchnittstellenEingabe['recoveryCheckpoint']
): Readonly<StatusCheckpointSicht> {
  const checkpoint = eingabe.checkpoint;
  return Object.freeze({
    ladeStatus: eingabe.status,
    grund: eingabe.grund,
    slot: eingabe.slot,
    fallbackVerwendet: eingabe.fallbackVerwendet,
    sequenz: checkpoint?.sequenz ?? null,
    gespeichertAm: checkpoint?.gespeichertAm ?? null,
    wiederaufnahmeErlaubt: checkpoint?.wiederaufnahmeErlaubt ?? null,
    abgleichErforderlich: checkpoint?.abgleichErforderlich ?? null,
    aktionsAutoritaet: checkpoint?.aktionsAutoritaet ?? null,
    offeneAktionsAnfrageKennungen: Object.freeze(
      checkpoint === null
        ? []
        : [...checkpoint.inhalt.offeneAktionsAnfrageKennungen].sort()
    )
  });
}

function baueMeldungsSicht(
  eingabe: StatusSchnittstellenEingabe['letzteMeldung']
): Readonly<StatusMeldungSicht> | null {
  if (eingabe === null) return null;
  return Object.freeze({
    kennung: eingabe.kennung,
    zeitpunkt: eingabe.zeitpunkt,
    stufe: eingabe.stufe,
    meldungsCode: eingabe.meldungsCode,
    titel: eingabe.titel,
    wasIstPassiert: eingabe.wasIstPassiert,
    warumIstEsPassiert: eingabe.warumIstEsPassiert,
    wasHatDerBotGetan: eingabe.wasHatDerBotGetan,
    mussNutzerHandeln: eingabe.mussNutzerHandeln,
    wasSollDerNutzerTun: eingabe.wasSollDerNutzerTun
  });
}

export function erstelleGemeinsameStatusSicht(
  eingabe: StatusSchnittstellenEingabe
): Readonly<GemeinsameStatusSicht> {
  pruefeZeitpunkt('zeitpunkt', eingabe.zeitpunkt);
  pruefeZeitpunkt('spielzustand.aufgenommenAm', eingabe.spielzustand.aufgenommenAm);
  if (!Number.isSafeInteger(eingabe.spielzustand.laufendeNummer) || eingabe.spielzustand.laufendeNummer < 0) {
    throw new Error('spielzustand.laufendeNummer muss eine nichtnegative ganze Zahl sein.');
  }
  if (eingabe.spielzustand.ablaufKennung.trim().length === 0) {
    throw new Error('spielzustand.ablaufKennung darf nicht leer sein.');
  }

  return Object.freeze({
    schemaVersion: 1,
    erstelltAm: eingabe.zeitpunkt,
    spielzustandLaufendeNummer: eingabe.spielzustand.laufendeNummer,
    spielzustandAufgenommenAm: eingabe.spielzustand.aufgenommenAm,
    ablaufKennung: eingabe.spielzustand.ablaufKennung,
    nurLesen: true,
    spielAutoritaet: false,
    bedienAutoritaet: false,
    neustartAutoritaet: false,
    charakter: baueCharakterSicht(eingabe.spielzustand.beobachtet.charakter),
    runtime: baueRuntimeSicht(eingabe.runtimeGesundheit),
    gruppe: baueGruppenSicht(eingabe.gruppenEntscheidung),
    entscheidung: baueEntscheidungsSicht(eingabe.entscheidungsDatensatz),
    aktionen: baueAktionsSichten(eingabe.aktionsZustaende),
    checkpoint: baueCheckpointSicht(eingabe.recoveryCheckpoint),
    letzteMeldung: baueMeldungsSicht(eingabe.letzteMeldung)
  });
}

export class NurLeseStatusSchnittstelle implements StatusSchnittstelle {
  lese(eingabe: StatusSchnittstellenEingabe): GemeinsameStatusSicht {
    return erstelleGemeinsameStatusSicht(eingabe);
  }
}
