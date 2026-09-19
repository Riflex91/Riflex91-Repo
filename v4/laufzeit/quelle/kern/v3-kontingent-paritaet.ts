import type { DienstGrenze, DienstProfil } from '../vertraege/dienst-kontingent.js';

export const V3_KONTINGENT_PARITAET_VERSION = '1.0.0';

export const V3_CLOUDFLARE_KONTINGENTE = Object.freeze({
  workers: Object.freeze({
    freiAnfragenProTag: 100_000,
    internesTagesziel: 95_000,
    infrastrukturReserveProTag: 5_000,
    botBudgetProTag: 90_000,
    maximaleGruppenGroesse: 4,
    proCharakterProTag: 22_500
  }),
  d1: Object.freeze({
    geleseneZeilenProTag: 5_000_000,
    geschriebeneZeilenProTag: 100_000
  }),
  r2: Object.freeze({
    klasseAProMonat: 1_000_000,
    klasseABudgetProMonat: 950_000,
    klasseBProMonat: 10_000_000,
    klasseBBudgetProMonat: 9_500_000,
    speicherBytes: 10_000_000_000,
    liveSpeicherBudgetBytes: 9_500_000_000,
    speicherFensterTage: 8,
    archivMindestSchreibabstandMs: 15_000,
    objektMaxBytes: 256 * 1024,
    lebenszyklusTage: 7
  })
});

export const V3_SUPABASE_KONTINGENTE = Object.freeze({
  edgeFunktionsaufrufeProMonat: 500_000
});

export const V4_STANDARD_SICHERHEITSANTEIL = 0.05;

export interface V3ParitaetsProfilOptionen {
  readonly geprueftAm: number;
  readonly gueltigBis: number;
  readonly quelle: string;
  readonly tarifName?: string;
}

function pruefeOptionen(optionen: V3ParitaetsProfilOptionen): void {
  if (!Number.isFinite(optionen.geprueftAm) || !Number.isFinite(optionen.gueltigBis)) {
    throw new Error('V3-Paritaetsprofil braucht endliche Pruef- und Gueltigkeitszeitpunkte.');
  }
  if (optionen.gueltigBis <= optionen.geprueftAm) {
    throw new Error('V3-Paritaetsprofil muss nach der Pruefung noch gueltig sein.');
  }
  if (optionen.quelle.trim().length === 0) {
    throw new Error('V3-Paritaetsprofil braucht eine nachvollziehbare Quelle.');
  }
}

function grenze(
  kennung: string,
  einheit: DienstGrenze['einheit'],
  zeitraum: DienstGrenze['zeitraum'],
  anbieterMaximum: number,
  sicherNutzbar: number
): DienstGrenze {
  if (sicherNutzbar <= 0 || sicherNutzbar > anbieterMaximum) {
    throw new Error('Sicher nutzbares Kontingent muss positiv und hoechstens das Anbietermaximum sein: ' + kennung);
  }
  return Object.freeze({
    kennung,
    einheit,
    zeitraum,
    anbieterMaximum,
    sicherheitsPuffer: anbieterMaximum - sicherNutzbar
  });
}

function fuenfProzentSicher(anbieterMaximum: number): number {
  return Math.floor(anbieterMaximum * (1 - V4_STANDARD_SICHERHEITSANTEIL));
}

export function erstelleCloudflareV3ParitaetsProfil(optionen: V3ParitaetsProfilOptionen): DienstProfil {
  pruefeOptionen(optionen);
  const c = V3_CLOUDFLARE_KONTINGENTE;
  const grenzen: readonly DienstGrenze[] = Object.freeze([
    grenze('workers_anfragen_pro_tag', 'anfragen', 'tag', c.workers.freiAnfragenProTag, c.workers.botBudgetProTag),
    grenze('d1_zeilen_gelesen_pro_tag', 'zeilen_gelesen', 'tag', c.d1.geleseneZeilenProTag, fuenfProzentSicher(c.d1.geleseneZeilenProTag)),
    grenze('d1_zeilen_geschrieben_pro_tag', 'zeilen_geschrieben', 'tag', c.d1.geschriebeneZeilenProTag, fuenfProzentSicher(c.d1.geschriebeneZeilenProTag)),
    grenze('r2_operationen_a_pro_monat', 'operationen_a', 'monat', c.r2.klasseAProMonat, c.r2.klasseABudgetProMonat),
    grenze('r2_operationen_b_pro_monat', 'operationen_b', 'monat', c.r2.klasseBProMonat, c.r2.klasseBBudgetProMonat),
    grenze('r2_speicher_bytes', 'speicher_bytes', 'dauerhaft', c.r2.speicherBytes, c.r2.liveSpeicherBudgetBytes)
  ]);
  return Object.freeze({
    dienstKennung: 'cloudflare',
    anzeigename: 'Cloudflare',
    tarifName: optionen.tarifName?.trim() || 'V3-Paritaet',
    quelle: optionen.quelle.trim(),
    geprueftAm: optionen.geprueftAm,
    gueltigBis: optionen.gueltigBis,
    grenzen
  });
}

export function erstelleSupabaseV3ParitaetsProfil(optionen: V3ParitaetsProfilOptionen): DienstProfil {
  pruefeOptionen(optionen);
  const maximum = V3_SUPABASE_KONTINGENTE.edgeFunktionsaufrufeProMonat;
  return Object.freeze({
    dienstKennung: 'supabase',
    anzeigename: 'Supabase',
    tarifName: optionen.tarifName?.trim() || 'V3-Paritaet',
    quelle: optionen.quelle.trim(),
    geprueftAm: optionen.geprueftAm,
    gueltigBis: optionen.gueltigBis,
    grenzen: Object.freeze([
      grenze(
        'edge_funktionsaufrufe_pro_monat',
        'funktionsaufrufe',
        'monat',
        maximum,
        fuenfProzentSicher(maximum)
      )
    ])
  });
}
