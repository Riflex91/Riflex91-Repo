import type {
  KritischeZustellung,
  KritischeZustellungsPort,
} from "./ports.js";

export class KritischeZustellungsKoordination {
  readonly #port: KritischeZustellungsPort;

  public constructor(port: KritischeZustellungsPort) {
    this.#port = port;
  }

  public async bereiteAusgehendVor(
    zustellung: KritischeZustellung,
  ): Promise<{ readonly zustellId: string; readonly durable: true }> {
    const bestaetigung = await this.#port.speichereOutboxDurable(zustellung);
    if (bestaetigung.durable !== true) throw new Error("OUTBOX_NICHT_DURABLE");
    return Object.freeze({ zustellId: zustellung.zustellId, durable: true });
  }

  public async verarbeiteEingehend(
    zustellung: KritischeZustellung,
  ): Promise<{ readonly verarbeiten: boolean }> {
    const claim = await this.#port.claimInboxDurable(zustellung);
    if (claim.bestaetigung.durable !== true) throw new Error("INBOX_CLAIM_NICHT_DURABLE");
    return Object.freeze({ verarbeiten: claim.neu });
  }
}
