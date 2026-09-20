import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BedienerRichtlinienDienst,
  ProduktivesV5GesamtfreigabeGate,
  V5ProduktionsBootstrap,
  V5ProduktionsHostController,
  V5ProduktionsRuntime,
  erstelleKanonischeProduktionsKomposition,
} from "../erzeugt/index.js";
import {
  NodeProduktionsDateisystem,
} from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodePlanenAktivierungsProtokoll,
} from "../grundlage/adapter/persistenz/node-planen-aktivierungs-protokoll.mjs";
import {
  NodeBedienerDenyProtokoll,
} from "../grundlage/adapter/persistenz/node-bediener-deny-protokoll.mjs";
import {
  NodeProduktionsOperationsQuelle,
} from "../grundlage/adapter/persistenz/node-produktions-operations-quelle.mjs";

const V5_WURZEL = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function ladeJson(relativerPfad, maximaleBytes = 2_000_000) {
  const absolut = path.join(V5_WURZEL, relativerPfad);
  const text = await fs.readFile(absolut, "utf8");
  if (text.length < 2 || text.length > maximaleBytes) {
    throw new Error("PRODUKTIONS_HOST_KONFIG_DATEI_UNGUELTIG:" + relativerPfad);
  }
  let wert;
  try {
    wert = JSON.parse(text);
  } catch {
    throw new Error("PRODUKTIONS_HOST_KONFIG_JSON_UNGUELTIG:" + relativerPfad);
  }
  if (wert === null || typeof wert !== "object" || Array.isArray(wert)) {
    throw new Error("PRODUKTIONS_HOST_KONFIG_FORMAT_UNGUELTIG:" + relativerPfad);
  }
  return wert;
}

function pruefeZeit(jetztMs) {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("NODE_PRODUKTIONS_HOST_ZEIT_UNGUELTIG");
  }
}

class NodeV5ProduktionsHost {
  #host;
  #bedienerRichtlinie;
  #dateisystem;

  constructor(host, bedienerRichtlinie, dateisystem) {
    this.#host = host;
    this.#bedienerRichtlinie = bedienerRichtlinie;
    this.#dateisystem = dateisystem;
  }

  async starte(jetztMs) {
    pruefeZeit(jetztMs);
    return this.#host.starte(jetztMs);
  }

  async tick(jetztMs) {
    pruefeZeit(jetztMs);
    return this.#host.tick(jetztMs);
  }

  async aktivierePlanen(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    return this.#host.aktivierePlanen(anfrage, jetztMs);
  }

  async wendeDenyAn(befehl, jetztMs) {
    pruefeZeit(jetztMs);
    const snapshot = await this.#bedienerRichtlinie.wendeDenyAn(befehl);
    let hostStatus = this.#host.status();
    if (hostStatus.zustand === "LAEUFT") {
      hostStatus = await this.#host.tick(jetztMs);
    }
    return Object.freeze({
      schemaVersion: 1,
      bediener: snapshot,
      host: hostStatus,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
    });
  }

  async stoppe(grund) {
    return this.#host.stoppe(grund);
  }

  status() {
    return this.#host.status();
  }

  bedienerStatus() {
    return this.#bedienerRichtlinie.snapshot();
  }

  produktionsWurzel() {
    return this.#dateisystem.wurzel;
  }
}

export async function erstelleNodeV5ProduktionsHost({
  dateisystemOptionen = {},
  operationsOptionen = {},
  bereitschaft = null,
  gesamtfreigabe = null,
} = {}) {
  const effektiveBereitschaft = bereitschaft
    ?? await ladeJson("bereitschaft/laufzeit-bereitschaft.json");
  const effektiveGesamtfreigabe = gesamtfreigabe
    ?? await ladeJson("roadmap/gesamtfreigabe.json");

  const dateisystem = new NodeProduktionsDateisystem(dateisystemOptionen);
  const bedienerProtokoll = new NodeBedienerDenyProtokoll(dateisystem);
  const bedienerRichtlinie = new BedienerRichtlinienDienst(
    bedienerProtokoll,
  );

  const historischeDenyBefehle =
    await bedienerProtokoll.ladeWirksameDenyBefehle();
  for (const befehl of historischeDenyBefehle) {
    await bedienerRichtlinie.wendeDenyAn(befehl);
  }

  const planenProtokoll = new NodePlanenAktivierungsProtokoll(
    dateisystem,
  );
  const runtime = new V5ProduktionsRuntime(
    erstelleKanonischeProduktionsKomposition(),
    bedienerRichtlinie,
    planenProtokoll,
  );
  const gesamtfreigabeGate = new ProduktivesV5GesamtfreigabeGate(
    effektiveBereitschaft,
    effektiveGesamtfreigabe,
    1,
  );
  const bootstrap = new V5ProduktionsBootstrap(
    gesamtfreigabeGate,
    runtime.operationsSupervisor(),
    runtime,
  );
  const operationsQuelle = new NodeProduktionsOperationsQuelle(
    dateisystem,
    operationsOptionen,
  );
  const host = new V5ProduktionsHostController(
    bootstrap,
    runtime,
    operationsQuelle,
  );

  return new NodeV5ProduktionsHost(
    host,
    bedienerRichtlinie,
    dateisystem,
  );
}
