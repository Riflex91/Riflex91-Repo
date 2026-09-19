export interface SchemaMigration {
  readonly vonVersion: number;
  readonly nachVersion: number;
  migriereVorwaerts(wert: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>>;
  migriereRueckwaerts?(wert: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>>;
}

function sortiereMigrationen(
  migrationen: readonly SchemaMigration[],
): readonly SchemaMigration[] {
  const sortiert = [...migrationen].sort((a, b) => a.vonVersion - b.vonVersion);
  for (let index = 0; index < sortiert.length; index += 1) {
    const migration = sortiert[index];
    if (migration === undefined) throw new Error("MIGRATION_FEHLT");
    if (!Number.isInteger(migration.vonVersion)
        || !Number.isInteger(migration.nachVersion)
        || migration.vonVersion < 1
        || migration.nachVersion !== migration.vonVersion + 1) {
      throw new Error("MIGRATION_VERSION_UNGUELTIG");
    }
    if (index > 0) {
      const vorher = sortiert[index - 1];
      if (vorher === undefined || vorher.nachVersion !== migration.vonVersion) {
        throw new Error("MIGRATION_KETTE_LUECKENHAFT");
      }
    }
  }
  return Object.freeze(sortiert);
}

export class SchemaMigrationsKatalog {
  readonly #migrationen: readonly SchemaMigration[];

  public constructor(migrationen: readonly SchemaMigration[]) {
    this.#migrationen = sortiereMigrationen(migrationen);
  }

  public migriere(
    wert: Readonly<Record<string, unknown>>,
    vonVersion: number,
    nachVersion: number,
  ): Readonly<Record<string, unknown>> {
    if (!Number.isInteger(vonVersion) || !Number.isInteger(nachVersion)
        || vonVersion < 1 || nachVersion < 1) {
      throw new Error("MIGRATION_ZIEL_VERSION_UNGUELTIG");
    }

    let aktuell = Object.freeze({ ...wert });
    let version = vonVersion;

    while (version < nachVersion) {
      const migration = this.#migrationen.find(m => m.vonVersion === version);
      if (migration === undefined) throw new Error("MIGRATION_UNTERSTUETZTE_VERSION_FEHLT");
      aktuell = Object.freeze({ ...migration.migriereVorwaerts(aktuell) });
      version = migration.nachVersion;
    }

    while (version > nachVersion) {
      const migration = this.#migrationen.find(m => m.nachVersion === version);
      if (migration === undefined || migration.migriereRueckwaerts === undefined) {
        throw new Error("MIGRATION_RUECKWAERTS_NICHT_UNTERSTUETZT");
      }
      aktuell = Object.freeze({ ...migration.migriereRueckwaerts(aktuell) });
      version = migration.vonVersion;
    }

    return aktuell;
  }
}
