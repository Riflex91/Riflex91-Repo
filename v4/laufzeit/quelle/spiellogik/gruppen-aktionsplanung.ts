import type { GruppenKoordinationsEntscheidung, GruppenTeilnehmerMeldung } from '../vertraege/gruppen-koordination.js';
import type {
  GruppenAktionsPlan,
  GruppenAktionsPlanKonfiguration,
  GruppenPlanSchritt
} from '../vertraege/gruppen-aktionsplanung.js';

const STANDARD_HEILEN_UNTER_LEBENS_ANTEIL = 0.7;
const STANDARD_SCHUETZEN_UNTER_LEBENS_ANTEIL = 0.5;

export function erstelleGruppenAktionsPlanKonfiguration(
  aenderungen: Partial<GruppenAktionsPlanKonfiguration> = {}
): GruppenAktionsPlanKonfiguration {
  const heilenUnterLebensAnteil = aenderungen.heilenUnterLebensAnteil ?? STANDARD_HEILEN_UNTER_LEBENS_ANTEIL;
  const schuetzenUnterLebensAnteil = aenderungen.schuetzenUnterLebensAnteil ?? STANDARD_SCHUETZEN_UNTER_LEBENS_ANTEIL;

  for (const [name, wert] of [
    ['heilenUnterLebensAnteil', heilenUnterLebensAnteil],
    ['schuetzenUnterLebensAnteil', schuetzenUnterLebensAnteil]
  ] as const) {
    if (!Number.isFinite(wert) || wert <= 0 || wert > 1) throw new Error(`${name} muss groesser als 0 und hoechstens 1 sein.`);
  }
  if (schuetzenUnterLebensAnteil > heilenUnterLebensAnteil) {
    throw new Error('schuetzenUnterLebensAnteil darf nicht groesser als heilenUnterLebensAnteil sein.');
  }

  return Object.freeze({ heilenUnterLebensAnteil, schuetzenUnterLebensAnteil });
}

function verdichteNeuesteMeldungen(meldungen: readonly GruppenTeilnehmerMeldung[]): ReadonlyMap<string, GruppenTeilnehmerMeldung> {
  const sortiert = [...meldungen].sort((links, rechts) => {
    const kennung = links.charakterKennung.localeCompare(rechts.charakterKennung);
    if (kennung !== 0) return kennung;
    if (links.gesendetAm !== rechts.gesendetAm) return rechts.gesendetAm - links.gesendetAm;
    return rechts.laufendeNummer - links.laufendeNummer;
  });
  const neueste = new Map<string, GruppenTeilnehmerMeldung>();
  for (const meldung of sortiert) {
    if (!neueste.has(meldung.charakterKennung)) neueste.set(meldung.charakterKennung, meldung);
  }
  return neueste;
}

function waehleNiedrigstenLebensAnteil(
  aktiveTeilnehmerKennungen: readonly string[],
  meldungNachKennung: ReadonlyMap<string, GruppenTeilnehmerMeldung>,
  grenze: number
): string | null {
  return aktiveTeilnehmerKennungen
    .map((kennung) => meldungNachKennung.get(kennung))
    .filter((meldung): meldung is GruppenTeilnehmerMeldung => meldung !== undefined)
    .filter((meldung) => Number.isFinite(meldung.lebensAnteil) && meldung.lebensAnteil !== null && meldung.lebensAnteil < grenze)
    .sort((links, rechts) => (links.lebensAnteil ?? 1) - (rechts.lebensAnteil ?? 1) || links.charakterKennung.localeCompare(rechts.charakterKennung))[0]
    ?.charakterKennung ?? null;
}

function schrittKennung(zeitpunkt: number, art: string, ausfuehrender: string, ziel: string | null): string {
  return `gruppenplan:${zeitpunkt}:${art}:${ausfuehrender}:${ziel ?? 'gruppe'}`;
}

function blockierterPlan(entscheidung: GruppenKoordinationsEntscheidung, grund: string): GruppenAktionsPlan {
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: entscheidung.zeitpunkt,
    status: 'blockiert',
    grund,
    betriebsArt: entscheidung.betriebsArt,
    gemeinsameGefahrenStufe: entscheidung.gemeinsameGefahrenStufe,
    gemeinsamesZielKennung: null,
    schritte: Object.freeze([])
  });
}

export function planeGruppenAktionen(
  meldungen: readonly GruppenTeilnehmerMeldung[],
  entscheidung: GruppenKoordinationsEntscheidung,
  konfiguration: GruppenAktionsPlanKonfiguration = erstelleGruppenAktionsPlanKonfiguration()
): GruppenAktionsPlan {
  if (!Number.isFinite(entscheidung.zeitpunkt)) throw new Error('Entscheidungszeitpunkt muss endlich sein.');

  if (entscheidung.betriebsArt === 'blockiert') {
    return blockierterPlan(entscheidung, `Gruppenkoordination ist blockiert: ${entscheidung.grund}`);
  }

  const aktive = new Set(entscheidung.aktiveTeilnehmerKennungen);
  const meldungNachKennung = verdichteNeuesteMeldungen(meldungen);
  for (const kennung of entscheidung.aktiveTeilnehmerKennungen) {
    if (!meldungNachKennung.has(kennung)) {
      return blockierterPlan(entscheidung, `Aktiver Teilnehmer ${kennung} fehlt in den Planungsdaten.`);
    }
  }
  for (const [faehigkeit, traeger] of Object.entries(entscheidung.aufgaben)) {
    if (traeger !== null && !aktive.has(traeger)) {
      return blockierterPlan(entscheidung, `Aufgabe ${faehigkeit} verweist auf einen nicht aktiven Teilnehmer.`);
    }
  }

  const schritte: GruppenPlanSchritt[] = [];
  const heilZiel = waehleNiedrigstenLebensAnteil(
    entscheidung.aktiveTeilnehmerKennungen,
    meldungNachKennung,
    konfiguration.heilenUnterLebensAnteil
  );
  const schutzZiel = waehleNiedrigstenLebensAnteil(
    entscheidung.aktiveTeilnehmerKennungen,
    meldungNachKennung,
    konfiguration.schuetzenUnterLebensAnteil
  );

  const heiler = entscheidung.aufgaben.heilen;
  if (heiler !== null && heilZiel !== null) {
    schritte.push(Object.freeze({
      kennung: schrittKennung(entscheidung.zeitpunkt, 'mitglied_heilen', heiler, heilZiel),
      art: 'mitglied_heilen',
      faehigkeit: 'heilen',
      ausfuehrenderTeilnehmerKennung: heiler,
      zielArt: 'charakter',
      zielKennung: heilZiel,
      wichtigkeit: 'sicherheit',
      prioritaet: 900,
      benoetigteRessourcen: Object.freeze(['gruppe']),
      grund: `Aktiver Teilnehmer ${heilZiel} liegt unter der Heilungsschwelle.`
    }));
  }

  const schuetzender = entscheidung.aufgaben.schutz;
  if (schuetzender !== null && schutzZiel !== null) {
    schritte.push(Object.freeze({
      kennung: schrittKennung(entscheidung.zeitpunkt, 'mitglied_schuetzen', schuetzender, schutzZiel),
      art: 'mitglied_schuetzen',
      faehigkeit: 'schutz',
      ausfuehrenderTeilnehmerKennung: schuetzender,
      zielArt: 'charakter',
      zielKennung: schutzZiel,
      wichtigkeit: 'sicherheit',
      prioritaet: 850,
      benoetigteRessourcen: Object.freeze(['gruppe']),
      grund: `Aktiver Teilnehmer ${schutzZiel} liegt unter der Schutzschwelle.`
    }));
  }

  if (entscheidung.betriebsArt === 'normal') {
    const gemeinsamesZiel = entscheidung.gemeinsamesZielKennung;
    const aggroTraeger = entscheidung.aufgaben.aggro;
    if (aggroTraeger !== null && gemeinsamesZiel !== null) {
      schritte.push(Object.freeze({
        kennung: schrittKennung(entscheidung.zeitpunkt, 'ziel_aggro_binden', aggroTraeger, gemeinsamesZiel),
        art: 'ziel_aggro_binden',
        faehigkeit: 'aggro',
        ausfuehrenderTeilnehmerKennung: aggroTraeger,
        zielArt: 'gegner',
        zielKennung: gemeinsamesZiel,
        wichtigkeit: 'normal',
        prioritaet: 600,
        benoetigteRessourcen: Object.freeze(['gruppe', 'kampfziel']),
        grund: `Aggro-Aufgabe ist dem gemeinsamen Ziel ${gemeinsamesZiel} zugeordnet.`
      }));
    }

    const unterstuetzer = entscheidung.aufgaben.unterstuetzung;
    if (unterstuetzer !== null) {
      schritte.push(Object.freeze({
        kennung: schrittKennung(entscheidung.zeitpunkt, 'gruppe_unterstuetzen', unterstuetzer, null),
        art: 'gruppe_unterstuetzen',
        faehigkeit: 'unterstuetzung',
        ausfuehrenderTeilnehmerKennung: unterstuetzer,
        zielArt: 'gruppe',
        zielKennung: null,
        wichtigkeit: 'normal',
        prioritaet: 500,
        benoetigteRessourcen: Object.freeze(['gruppe']),
        grund: 'Unterstuetzungsaufgabe ist fuer den normalen Gruppenbetrieb zugeordnet.'
      }));
    }

    const schadensTraeger = entscheidung.aufgaben.schaden;
    if (schadensTraeger !== null && gemeinsamesZiel !== null) {
      schritte.push(Object.freeze({
        kennung: schrittKennung(entscheidung.zeitpunkt, 'gemeinsames_ziel_bearbeiten', schadensTraeger, gemeinsamesZiel),
        art: 'gemeinsames_ziel_bearbeiten',
        faehigkeit: 'schaden',
        ausfuehrenderTeilnehmerKennung: schadensTraeger,
        zielArt: 'gegner',
        zielKennung: gemeinsamesZiel,
        wichtigkeit: 'normal',
        prioritaet: 400,
        benoetigteRessourcen: Object.freeze(['gruppe', 'kampfziel']),
        grund: `Schadensaufgabe folgt dem gemeinsamen Ziel ${gemeinsamesZiel}.`
      }));
    }
  }

  const eingefroreneSchritte = Object.freeze([...schritte]);
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: entscheidung.zeitpunkt,
    status: eingefroreneSchritte.length > 0 ? 'geplant' : 'leer',
    grund:
      eingefroreneSchritte.length > 0
        ? entscheidung.betriebsArt === 'sicherheit'
          ? 'Nur Schutz- und Heilungsplanung ist in der Sicherheitsbetriebsart freigegeben.'
          : 'Deterministische Gruppenaktionsschritte wurden aus der Koordinationsentscheidung abgeleitet.'
        : 'Keine aktuell begruendete Gruppenaktion ist planbar.',
    betriebsArt: entscheidung.betriebsArt,
    gemeinsameGefahrenStufe: entscheidung.gemeinsameGefahrenStufe,
    gemeinsamesZielKennung: entscheidung.betriebsArt === 'normal' ? entscheidung.gemeinsamesZielKennung : null,
    schritte: eingefroreneSchritte
  });
}

export function eigeneGruppenPlanSchritte(
  plan: GruppenAktionsPlan,
  eigenerTeilnehmerKennung: string
): readonly GruppenPlanSchritt[] {
  if (eigenerTeilnehmerKennung.length === 0) throw new Error('eigenerTeilnehmerKennung darf nicht leer sein.');
  return Object.freeze(plan.schritte.filter((schritt) => schritt.ausfuehrenderTeilnehmerKennung === eigenerTeilnehmerKennung));
}
