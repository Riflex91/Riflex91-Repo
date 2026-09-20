import {
  ErteilteAusfuehrungsFreigabe,
} from "./admission.js";
import type {
  AusfuehrungsAdapter,
  AusfuehrungsTransportErgebnis,
} from "./ports.js";

export class AusfuehrungsKernel {
  public async fuehreAus<Anfrage, Ergebnis>(
    freigabe: ErteilteAusfuehrungsFreigabe,
    anfrage: Anfrage,
    adapter: AusfuehrungsAdapter<Anfrage, Ergebnis, ErteilteAusfuehrungsFreigabe>,
    jetztMs: number,
  ): Promise<AusfuehrungsTransportErgebnis<Ergebnis>> {
    if (!(freigabe instanceof ErteilteAusfuehrungsFreigabe)) {
      throw new Error("TYPISIERTE_AUSFUEHRUNGSFREIGABE_FEHLT");
    }
    freigabe.pruefeFuerAusfuehrung(
      jetztMs,
      adapter.actionContractId,
      adapter.recoveryContractId,
      adapter.verifierId,
    );
    if (adapter.adapterId.trim().length === 0 || adapter.adapterId.length > 192) {
      throw new Error("AUSFUEHRUNGS_ADAPTER_ID_UNGUELTIG");
    }
    return adapter.sende(freigabe, anfrage);
  }
}
