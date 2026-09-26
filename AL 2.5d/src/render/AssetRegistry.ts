export type AssetEntry = Readonly<{
  id: string;
  src: string;
}>;

/**
 * Stable logical asset IDs decouple Adventure Land gameplay identifiers from
 * the new 2.5D artwork. Replacing art never requires changing game rules.
 */
export class AssetRegistry {
  private readonly entries = new Map<string, string>();

  constructor(entries: readonly AssetEntry[] = []) {
    this.registerMany(entries);
  }

  register(entry: AssetEntry): void {
    if (!entry.id.trim()) {
      throw new Error("Asset id must not be empty");
    }

    if (!entry.src.trim()) {
      throw new Error(`Asset source must not be empty: ${entry.id}`);
    }

    this.entries.set(entry.id, entry.src);
  }

  registerMany(entries: readonly AssetEntry[]): void {
    for (const entry of entries) {
      this.register(entry);
    }
  }

  resolve(id: string): string | null {
    const registered = this.entries.get(id);

    if (registered) {
      return registered;
    }

    // Explicit URLs are useful for development fixtures. Logical asset:// IDs
    // intentionally do not fall through to network loading.
    if (
      id.startsWith("/") ||
      id.startsWith("http://") ||
      id.startsWith("https://") ||
      id.startsWith("data:") ||
      id.startsWith("blob:")
    ) {
      return id;
    }

    return null;
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }
}
