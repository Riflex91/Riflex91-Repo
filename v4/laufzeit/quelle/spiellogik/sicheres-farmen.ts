import { erstelleFarmAblaufZustand, erstelleFarmKonfiguration, planeGrundlegendenFarmSchritt } from './grundlegendes-farmen.js';
import { erstelleKampfSicherheitsAblaufZustand, erstelleKampfSicherheitsKonfiguration, planeKampfSicherheitsSchritt } from './kampfsicherheit.js';
import type { Spielzustand } from '../vertraege/spielzustand.js';
import type { KampfAktionsBereitschaft } from '../vertraege/kampf-aktionsbereitschaft.js';
import type {
  SichereFarmKonfiguration,
  SichererFarmAblaufZustand,
  SichererFarmSchritt,
  SichererFarmSchrittArt
} from '../vertraege/sicheres-farmen.js';
import type { FarmKonfiguration } from '../vertraege/farmen.js';
import type { KampfSicherheitsKonfiguration } from '../vertraege/kampfsicherheit.js';

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error('Der sichere Farm-Zeitpunkt muss eine endliche, nichtnegative Zahl sein.');
}

export function erstelleSichereFarmKonfiguration(
  farmen: FarmKonfiguration,
  kampfsicherheit: KampfSicherheitsKonfiguration,
  maxAktionsBereitschaftAlterMillisekunden = 500
): Readonly<SichereFarmKonfiguration> {
  if (!Number.isFinite(maxAktionsBereitschaftAlterMillisekunden) || maxAktionsBereitschaftAlterMillisekunden <= 0) {
    throw new Error('maxAktionsBereitschaftAlterMillisekunden muss eine positive endliche Zahl sein.');
  }

  return Object.freeze({
    farmen: erstelleFarmKonfiguration(farmen.monsterArten, farmen),
    kampfsicherheit: erstelleKampfSicherheitsKonfiguration(kampfsicherheit),
    maxAktionsBereitschaftAlterMillisekunden
  });
}

export function erstelleSicherenFarmAblaufZustand(
  spielzustand: Spielzustand,
  jetzt = spielzustand.aufgenommenAm
): Readonly<SichererFarmAblaufZustand> {
  pruefeZeitpunkt(jetzt);
  return Object.freeze({
    schemaVersion: 1,
    farmen: erstelleFarmAblaufZustand(spielzustand, jetzt),
    kampfsicherheit: erstelleKampfSicherheitsAblaufZustand(spielzustand, jetzt)
  });
}

type BereitschaftsPruefung = Readonly<{
  ergebnis: 'bereit' | 'abklingzeit' | 'blockiert';
  grund: string;
}>;

function pruefeAngriffsBereitschaft(
  bereitschaft: KampfAktionsBereitschaft,
  jetzt: number,
  maxAlterMillisekunden: number
): BereitschaftsPruefung {
  if (bereitschaft.aktionsName !== 'attack') {
    return Object.freeze({ ergebnis: 'blockiert', grund: `Erwartet wurde die Bereitschaft fuer attack, erhalten wurde ${bereitschaft.aktionsName}.` });
  }
  if (!Number.isFinite(bereitschaft.aufgenommenAm) || bereitschaft.aufgenommenAm < 0 || bereitschaft.aufgenommenAm > jetzt) {
    return Object.freeze({ ergebnis: 'blockiert', grund: 'Der Bereitschaftszeitpunkt ist ungueltig oder liegt in der Zukunft.' });
  }
  if (jetzt - bereitschaft.aufgenommenAm > maxAlterMillisekunden) {
    return Object.freeze({ ergebnis: 'blockiert', grund: 'Die Angriffsbereitschaft ist zu alt und wird nicht fuer eine neue Aktion verwendet.' });
  }
  if (bereitschaft.zustand === 'unbekannt') {
    return Object.freeze({ ergebnis: 'blockiert', grund: `Die Angriffsbereitschaft ist unbekannt: ${bereitschaft.grund}` });
  }
  if (bereitschaft.bereitAb === null || !Number.isFinite(bereitschaft.bereitAb) || bereitschaft.bereitAb < 0 ||
      bereitschaft.restMillisekunden === null || !Number.isFinite(bereitschaft.restMillisekunden) || bereitschaft.restMillisekunden < 0) {
    return Object.freeze({ ergebnis: 'blockiert', grund: 'Die bekannte Angriffsbereitschaft enthaelt ungueltige Zeitwerte.' });
  }
  if (bereitschaft.bereitAb > jetzt) {
    return Object.freeze({ ergebnis: 'abklingzeit', grund: `Normaler Angriff ist bis ${bereitschaft.bereitAb} in Abklingzeit.` });
  }
  return Object.freeze({ ergebnis: 'bereit', grund: 'Normaler Angriff ist freigegeben.' });
}

function baueSchritt(
  jetzt: number,
  art: SichererFarmSchrittArt,
  grund: string,
  aktionsAnfrage: SichererFarmSchritt['aktionsAnfrage'],
  farmEntscheidung: SichererFarmSchritt['farmEntscheidung'],
  sicherheitsEntscheidung: SichererFarmSchritt['sicherheitsEntscheidung'],
  angriffsBereitschaft: KampfAktionsBereitschaft,
  naechsterAblaufZustand: SichererFarmAblaufZustand
): Readonly<SichererFarmSchritt> {
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: jetzt,
    art,
    grund,
    aktionsAnfrage,
    farmEntscheidung,
    sicherheitsEntscheidung,
    angriffsBereitschaft,
    naechsterAblaufZustand
  });
}

export function planeSicherenFarmSchritt(
  spielzustand: Spielzustand,
  konfiguration: SichereFarmKonfiguration,
  vorherigerZustand: SichererFarmAblaufZustand,
  angriffsBereitschaft: KampfAktionsBereitschaft,
  jetzt = spielzustand.aufgenommenAm
): Readonly<SichererFarmSchritt> {
  pruefeZeitpunkt(jetzt);
  const normalisiert = erstelleSichereFarmKonfiguration(
    konfiguration.farmen,
    konfiguration.kampfsicherheit,
    konfiguration.maxAktionsBereitschaftAlterMillisekunden
  );

  const sicherheit = planeKampfSicherheitsSchritt(
    spielzustand,
    normalisiert.kampfsicherheit,
    vorherigerZustand.kampfsicherheit,
    jetzt
  );

  if (!sicherheit.normalAktionenErlaubt) {
    return baueSchritt(
      jetzt,
      sicherheit.aktionsAnfrage ? 'kampfsicherheit' : 'blockiert',
      sicherheit.grund,
      sicherheit.aktionsAnfrage,
      null,
      sicherheit,
      angriffsBereitschaft,
      Object.freeze({
        schemaVersion: 1,
        farmen: vorherigerZustand.farmen,
        kampfsicherheit: sicherheit.naechsterAblaufZustand
      })
    );
  }

  const farm = planeGrundlegendenFarmSchritt(
    spielzustand,
    normalisiert.farmen,
    vorherigerZustand.farmen,
    jetzt
  );

  if (farm.art !== 'angreifen') {
    return baueSchritt(
      jetzt,
      'farmen',
      'Kampfsicherheit gibt normale Aktionen frei; die Farmentscheidung wird unveraendert verwendet.',
      farm.aktionsAnfrage,
      farm,
      sicherheit,
      angriffsBereitschaft,
      Object.freeze({
        schemaVersion: 1,
        farmen: farm.naechsterAblaufZustand,
        kampfsicherheit: sicherheit.naechsterAblaufZustand
      })
    );
  }

  const bereitschaft = pruefeAngriffsBereitschaft(
    angriffsBereitschaft,
    jetzt,
    normalisiert.maxAktionsBereitschaftAlterMillisekunden
  );

  if (bereitschaft.ergebnis !== 'bereit') {
    return baueSchritt(
      jetzt,
      bereitschaft.ergebnis === 'abklingzeit' ? 'abklingzeit' : 'blockiert',
      bereitschaft.grund,
      null,
      farm,
      sicherheit,
      angriffsBereitschaft,
      Object.freeze({
        schemaVersion: 1,
        farmen: vorherigerZustand.farmen,
        kampfsicherheit: sicherheit.naechsterAblaufZustand
      })
    );
  }

  return baueSchritt(
    jetzt,
    'farmen',
    'Kampfsicherheit und aktuelle Angriffsbereitschaft geben den normalen Angriff frei.',
    farm.aktionsAnfrage,
    farm,
    sicherheit,
    angriffsBereitschaft,
    Object.freeze({
      schemaVersion: 1,
      farmen: farm.naechsterAblaufZustand,
      kampfsicherheit: sicherheit.naechsterAblaufZustand
    })
  );
}
