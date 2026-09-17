import type { AktionsAnfrage } from '../vertraege/aktions-anfrage.js';
import {
  GRUPPEN_AKTIONS_NAMEN,
  type GruppenAktionsAnfrageDetails,
  type GruppenAktionsAnfrageKonfiguration,
  type GruppenAktionsAnfrageUebersetzung,
  type GruppenAktionsName
} from '../vertraege/gruppen-aktionsanfrage.js';
import {
  GRUPPEN_PLAN_AKTIONS_ARTEN,
  type GruppenAktionsPlan,
  type GruppenPlanAktionsArt,
  type GruppenPlanSchritt
} from '../vertraege/gruppen-aktionsplanung.js';

const STANDARD_GUELTIGKEIT_MILLISEKUNDEN = 1_500;
const GRUPPEN_PLAN_AKTIONS_ARTEN_MENGE = new Set<string>(GRUPPEN_PLAN_AKTIONS_ARTEN);

const AKTIONS_NAME_NACH_ART: Readonly<Record<GruppenPlanAktionsArt, GruppenAktionsName>> = Object.freeze({
  mitglied_heilen: GRUPPEN_AKTIONS_NAMEN.mitgliedHeilen,
  ziel_aggro_binden: GRUPPEN_AKTIONS_NAMEN.zielAggroBinden,
  mitglied_schuetzen: GRUPPEN_AKTIONS_NAMEN.mitgliedSchuetzen,
  gruppe_unterstuetzen: GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen,
  gemeinsames_ziel_bearbeiten: GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten
});

function friereStrings(werte: readonly string[]): readonly string[] {
  return Object.freeze([...werte]);
}

export function erstelleGruppenAktionsAnfrageKonfiguration(
  aenderungen: Partial<GruppenAktionsAnfrageKonfiguration> = {}
): GruppenAktionsAnfrageKonfiguration {
  const aktiviert = aenderungen.aktiviert ?? false;
  if (typeof aktiviert !== 'boolean') throw new Error('aktiviert muss ein boolescher Wert sein.');

  const roheArten = aenderungen.freigegebeneArten ?? [];
  for (const art of roheArten) {
    if (!GRUPPEN_PLAN_AKTIONS_ARTEN_MENGE.has(art)) {
      throw new Error(`Unbekannte freigegebene GruppenPlanAktionsArt: ${String(art)}.`);
    }
  }
  const artMenge = new Set<GruppenPlanAktionsArt>(roheArten);
  const freigegebeneArten = Object.freeze(GRUPPEN_PLAN_AKTIONS_ARTEN.filter((art) => artMenge.has(art)));

  const gueltigkeitMillisekunden = aenderungen.gueltigkeitMillisekunden ?? STANDARD_GUELTIGKEIT_MILLISEKUNDEN;
  if (!Number.isFinite(gueltigkeitMillisekunden) || gueltigkeitMillisekunden <= 0) {
    throw new Error('gueltigkeitMillisekunden muss eine positive endliche Zahl sein.');
  }

  return Object.freeze({ aktiviert, freigegebeneArten, gueltigkeitMillisekunden });
}

function baueAktionsAnfrage(
  plan: GruppenAktionsPlan,
  schritt: GruppenPlanSchritt,
  gueltigkeitMillisekunden: number
): AktionsAnfrage<GruppenAktionsAnfrageDetails> {
  const details: GruppenAktionsAnfrageDetails = Object.freeze({
    planZeitpunkt: plan.zeitpunkt,
    planStatus: plan.status,
    planSchrittKennung: schritt.kennung,
    art: schritt.art,
    faehigkeit: schritt.faehigkeit,
    ausfuehrenderTeilnehmerKennung: schritt.ausfuehrenderTeilnehmerKennung,
    zielArt: schritt.zielArt,
    zielKennung: schritt.zielKennung
  });

  return Object.freeze({
    kennung: `${schritt.kennung}:aktionsanfrage`,
    angefordertVon: 'gruppen-aktionsplanung',
    aktion: AKTIONS_NAME_NACH_ART[schritt.art],
    wichtigkeit: schritt.wichtigkeit,
    prioritaet: schritt.prioritaet,
    angefordertAm: plan.zeitpunkt,
    gueltigBis: plan.zeitpunkt + gueltigkeitMillisekunden,
    benoetigteRessourcen: Object.freeze([...schritt.benoetigteRessourcen]),
    grund: schritt.grund,
    details
  });
}

export function uebersetzeEigeneGruppenPlanSchritte(
  plan: GruppenAktionsPlan,
  eigenerTeilnehmerKennung: string,
  konfiguration: GruppenAktionsAnfrageKonfiguration = erstelleGruppenAktionsAnfrageKonfiguration()
): GruppenAktionsAnfrageUebersetzung {
  if (eigenerTeilnehmerKennung.trim().length === 0) throw new Error('eigenerTeilnehmerKennung darf nicht leer sein.');
  if (!Number.isFinite(plan.zeitpunkt) || plan.zeitpunkt < 0) {
    throw new Error('Der Gruppenplan-Zeitpunkt muss eine endliche, nichtnegative Zahl sein.');
  }

  const normalisierteKonfiguration = erstelleGruppenAktionsAnfrageKonfiguration(konfiguration);
  const eigeneSchritte = plan.schritte.filter(
    (schritt) => schritt.ausfuehrenderTeilnehmerKennung === eigenerTeilnehmerKennung
  );
  const eigeneSchrittKennungen = friereStrings(eigeneSchritte.map((schritt) => schritt.kennung));

  if (plan.status === 'blockiert') {
    return Object.freeze({
      schemaVersion: 1,
      zeitpunkt: plan.zeitpunkt,
      status: 'blockiert',
      grund: `Der Gruppenaktionsplan ist blockiert: ${plan.grund}`,
      eigenerTeilnehmerKennung,
      planStatus: plan.status,
      eigeneSchrittKennungen,
      nichtFreigegebeneSchrittKennungen: Object.freeze([]),
      aktionsAnfragen: Object.freeze([])
    });
  }

  if (plan.status === 'leer' || eigeneSchritte.length === 0) {
    return Object.freeze({
      schemaVersion: 1,
      zeitpunkt: plan.zeitpunkt,
      status: 'leer',
      grund: plan.status === 'leer'
        ? 'Der Gruppenaktionsplan enthaelt keine planbare Gruppenaktion.'
        : 'Der lokale Teilnehmer hat im aktuellen Gruppenaktionsplan keinen eigenen Schritt.',
      eigenerTeilnehmerKennung,
      planStatus: plan.status,
      eigeneSchrittKennungen,
      nichtFreigegebeneSchrittKennungen: Object.freeze([]),
      aktionsAnfragen: Object.freeze([])
    });
  }

  if (!normalisierteKonfiguration.aktiviert) {
    return Object.freeze({
      schemaVersion: 1,
      zeitpunkt: plan.zeitpunkt,
      status: 'gesperrt',
      grund: 'Die Uebersetzung von Gruppenplan-Schritten in AktionsAnfragen ist standardmaessig gesperrt.',
      eigenerTeilnehmerKennung,
      planStatus: plan.status,
      eigeneSchrittKennungen,
      nichtFreigegebeneSchrittKennungen: eigeneSchrittKennungen,
      aktionsAnfragen: Object.freeze([])
    });
  }

  const freigegeben = new Set(normalisierteKonfiguration.freigegebeneArten);
  const freigegebeneSchritte = eigeneSchritte.filter((schritt) => freigegeben.has(schritt.art));
  const nichtFreigegebeneSchrittKennungen = friereStrings(
    eigeneSchritte.filter((schritt) => !freigegeben.has(schritt.art)).map((schritt) => schritt.kennung)
  );

  if (freigegebeneSchritte.length === 0) {
    return Object.freeze({
      schemaVersion: 1,
      zeitpunkt: plan.zeitpunkt,
      status: 'gesperrt',
      grund: 'Kein eigener Gruppenplan-Schritt ist durch die explizite Arten-Whitelist freigegeben.',
      eigenerTeilnehmerKennung,
      planStatus: plan.status,
      eigeneSchrittKennungen,
      nichtFreigegebeneSchrittKennungen,
      aktionsAnfragen: Object.freeze([])
    });
  }

  const aktionsAnfragen = Object.freeze(
    freigegebeneSchritte.map((schritt) =>
      baueAktionsAnfrage(plan, schritt, normalisierteKonfiguration.gueltigkeitMillisekunden)
    )
  );

  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: plan.zeitpunkt,
    status: 'erzeugt',
    grund: `${aktionsAnfragen.length} explizit freigegebene Gruppenplan-Schritt(e) wurden in AktionsAnfragen uebersetzt.`,
    eigenerTeilnehmerKennung,
    planStatus: plan.status,
    eigeneSchrittKennungen,
    nichtFreigegebeneSchrittKennungen,
    aktionsAnfragen
  });
}
