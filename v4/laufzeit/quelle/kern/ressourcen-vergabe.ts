import type { RessourcenName, RessourcenSperre, RessourcenSperrAnfrage } from '../vertraege/ressourcen-sperre.js';

export interface RessourcenSperrErgebnis {
  readonly gesperrt: boolean;
  readonly blockiertDurch: readonly RessourcenSperre[];
  readonly unterbrocheneBesitzer: readonly string[];
  readonly sperren: readonly RessourcenSperre[];
}

function holeWichtigkeitsRang(anfrage: RessourcenSperrAnfrage): number {
  return anfrage.wichtigkeitsRang ?? 0;
}

function istAnfrageHoeherPriorisiert(anfrage: RessourcenSperrAnfrage, sperre: RessourcenSperre): boolean {
  const wichtigkeitsRang = holeWichtigkeitsRang(anfrage);
  if (wichtigkeitsRang !== sperre.wichtigkeitsRang) return wichtigkeitsRang > sperre.wichtigkeitsRang;
  return anfrage.prioritaet > sperre.prioritaet;
}

export class RessourcenVergabe {
  private readonly sperren = new Map<RessourcenName, RessourcenSperre>();

  versucheRessourcenZuSperren(anfrage: RessourcenSperrAnfrage): RessourcenSperrErgebnis {
    const ressourcen = [...new Set(anfrage.ressourcen)].sort() as RessourcenName[];
    if (ressourcen.length === 0) throw new Error('Mindestens eine Ressource muss angefordert werden.');
    if (!Number.isFinite(anfrage.prioritaet)) throw new Error('Die Ressourcenprioritaet muss eine endliche Zahl sein.');
    if (!Number.isFinite(anfrage.angefordertAm)) throw new Error('Der Anforderungszeitpunkt muss eine endliche Zahl sein.');
    if (anfrage.wichtigkeitsRang !== undefined && !Number.isFinite(anfrage.wichtigkeitsRang)) {
      throw new Error('Der Wichtigkeitsrang muss eine endliche Zahl sein.');
    }

    const blockiertDurch: RessourcenSperre[] = [];
    const unterbrocheneBesitzer = new Set<string>();

    for (const ressource of ressourcen) {
      const aktuelleSperre = this.sperren.get(ressource);
      if (!aktuelleSperre || aktuelleSperre.besitzer === anfrage.besitzer) continue;

      if (!aktuelleSperre.darfUnterbrochenWerden || !istAnfrageHoeherPriorisiert(anfrage, aktuelleSperre)) {
        blockiertDurch.push(aktuelleSperre);
      } else {
        unterbrocheneBesitzer.add(aktuelleSperre.besitzer);
      }
    }

    if (blockiertDurch.length > 0) {
      return {
        gesperrt: false,
        blockiertDurch: [...blockiertDurch].sort((a, b) => a.ressource.localeCompare(b.ressource)),
        unterbrocheneBesitzer: [],
        sperren: []
      };
    }

    for (const besitzer of [...unterbrocheneBesitzer].sort()) this.gibRessourcenFuerBesitzerFrei(besitzer);

    const wichtigkeitsRang = holeWichtigkeitsRang(anfrage);
    const neueSperren = ressourcen.map((ressource): RessourcenSperre => ({
      ressource,
      besitzer: anfrage.besitzer,
      wichtigkeitsRang,
      prioritaet: anfrage.prioritaet,
      darfUnterbrochenWerden: anfrage.darfUnterbrochenWerden,
      gesperrtSeit: anfrage.angefordertAm
    }));

    for (const sperre of neueSperren) this.sperren.set(sperre.ressource, sperre);

    return {
      gesperrt: true,
      blockiertDurch: [],
      unterbrocheneBesitzer: [...unterbrocheneBesitzer].sort(),
      sperren: neueSperren
    };
  }

  gibRessourcenFuerBesitzerFrei(besitzer: string): number {
    let anzahlFreigegeben = 0;
    for (const [ressource, sperre] of this.sperren.entries()) {
      if (sperre.besitzer === besitzer) {
        this.sperren.delete(ressource);
        anzahlFreigegeben += 1;
      }
    }
    return anzahlFreigegeben;
  }

  holeRessourcenSperre(ressource: RessourcenName): RessourcenSperre | null {
    return this.sperren.get(ressource) ?? null;
  }

  listeRessourcenSperren(): readonly RessourcenSperre[] {
    return [...this.sperren.values()].sort((a, b) => a.ressource.localeCompare(b.ressource));
  }
}
