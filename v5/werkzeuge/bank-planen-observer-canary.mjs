import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

import {
  MERCHANT_CORE_A_MODUL_ID,
  MERCHANT_CORE_A_MODUL_VERSION,
  planeBankAutonomie,
} from "../erzeugt/index.js";
import {
  NodeProduktionsDateisystem,
} from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  erstelleNodeV5ProduktionsHost,
} from "./v5-produktions-host-komposition.mjs";
import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  beobachteBankCanaryReadOnly,
  validiereBankCanaryBeobachtung,
} from "./bank-planen-canary-browser.mjs";

export const BANK_PLANEN_CANARY_CAPABILITY = "merchant.bank.planen";
export const BANK_PLANEN_CANARY_POLICY = "BANK-PLANEN-OBSERVER-CANARY-V1";

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function fingerprintJson(value) {
  return hash(JSON.stringify(value));
}

function variantenFingerprint(item) {
  return "VAR:" + fingerprintJson({
    gesperrt: item.gesperrt === true,
    spezial: String(item.spezial || ""),
  });
}

function bauePlanungsAnfrage(beobachtung, jetztMs) {
  const accountId = "ACCOUNT:" + hash(beobachtung.accountId);
  let eintraege = Object.freeze([]);
  let packs = Object.freeze([]);
  let stapellimits = Object.freeze([]);

  for (const pack of [...beobachtung.packs].sort((a, b) =>
    a.pack.localeCompare(b.pack))) {
    const sortierteEintraege = [...pack.eintraege].sort(
      (a, b) => a.slot - b.slot,
    );
    packs = Object.freeze([
      ...packs,
      Object.freeze({
        pack: pack.pack,
        gesamtSlots: pack.gesamtSlots,
        belegteSlots: sortierteEintraege.length,
      }),
    ]);

    for (const item of sortierteEintraege) {
      const variante = variantenFingerprint(item);
      eintraege = Object.freeze([
        ...eintraege,
        Object.freeze({
          pack: pack.pack,
          slot: item.slot,
          name: item.name,
          level: item.level,
          menge: item.menge,
          variantenFingerprint: variante,
        }),
      ]);
      if (!stapellimits.some(x =>
        x.name === item.name
        && x.level === item.level
        && x.variantenFingerprint === variante)) {
        stapellimits = Object.freeze([
          ...stapellimits,
          Object.freeze({
            name: item.name,
            level: item.level,
            variantenFingerprint: variante,
            maximaleMenge: item.stackMax,
          }),
        ]);
      }
    }
  }

  const snapshotBasis = Object.freeze({
    accountId,
    packs,
    eintraege,
    freieInventarSlots: beobachtung.freieInventarSlots,
  });
  const snapshotFingerprint = "BANK:" + fingerprintJson(snapshotBasis);

  return Object.freeze({
    snapshot: Object.freeze({
      schemaVersion: 1,
      accountId,
      beobachtetAmMs: jetztMs,
      gueltigBisMs: jetztMs + 5_000,
      mountEpoche: 1,
      leaseEpoche: 1,
      fingerprint: snapshotFingerprint,
      eintraege,
    }),
    packs,
    stapellimits,
    erweiterungsOptionen: Object.freeze([]),
    budgets: Object.freeze([]),
    freieInventarSlots: beobachtung.freieInventarSlots,
    richtlinie: Object.freeze({
      richtlinienVersion: BANK_PLANEN_CANARY_POLICY,
      minimaleFreieSlots: 10,
      zielFreieSlots: 20,
      konsolidierungsWorkspaceSlots: 2,
      maximaleKonsolidierungsGruppen: 16,
      erweiterungErlaubt: false,
    }),
  });
}

function baueBericht(beobachtung, entscheidung, jetztMs) {
  return Object.freeze({
    schemaVersion: 1,
    canaryId: "BANK-PLANEN-OBSERVER-" + jetztMs,
    capabilityId: BANK_PLANEN_CANARY_CAPABILITY,
    policyId: BANK_PLANEN_CANARY_POLICY,
    zeitMs: jetztMs,
    charakterBindungSha256: hash(
      String(beobachtung.charakterName || "")
        + ":"
        + String(beobachtung.charakterSessionId || ""),
    ),
    accountBindung: entscheidung.accountId,
    map: beobachtung.map,
    packAnzahl: beobachtung.packs.length,
    bankEintraege: beobachtung.packs.reduce(
      (summe, pack) => summe + pack.eintraege.length,
      0,
    ),
    freieInventarSlots: beobachtung.freieInventarSlots,
    entscheidung,
    browserReadOnly: true,
    browserGameplayWrites: 0,
    hostGameplayAutoritaet: false,
    hostRawWriteAutoritaet: false,
    hostActionAuthority: false,
    ausfuehrungsAutoritaet: false,
    breiteRuntimeFreigabe: false,
  });
}

export async function fuehreBankPlanenCanaryMitBeobachtung({
  beobachtung,
  jetztMs,
  hostOptionen = {},
}) {
  if (!Number.isSafeInteger(jetztMs)
      || jetztMs < 0
      || jetztMs > Number.MAX_SAFE_INTEGER - 10) {
    throw new Error("BANK_CANARY_ZEIT_UNGUELTIG");
  }
  validiereBankCanaryBeobachtung(beobachtung);

  const host = await erstelleNodeV5ProduktionsHost(hostOptionen);
  let gestartet = false;
  try {
    const start = await host.starte(jetztMs);
    if (start.zustand !== "LAEUFT") {
      throw new Error("BANK_CANARY_HOST_NICHT_BEREIT:" + start.grund);
    }
    gestartet = true;

    const aktivierung = await host.aktivierePlanen({
      schemaVersion: 1,
      aktivierungsId: "BANK-CANARY-ACT-" + jetztMs,
      faehigkeitId: BANK_PLANEN_CANARY_CAPABILITY,
      anbieterModulId: MERCHANT_CORE_A_MODUL_ID,
      anbieterVersion: MERCHANT_CORE_A_MODUL_VERSION,
      policyId: BANK_PLANEN_CANARY_POLICY,
    }, jetztMs + 1);

    if (!aktivierung.erfolgreich) {
      throw new Error("BANK_CANARY_PLANEN_NICHT_AKTIV:" + aktivierung.grund);
    }

    const anfrage = bauePlanungsAnfrage(beobachtung, jetztMs + 2);
    const entscheidung = planeBankAutonomie(anfrage, jetztMs + 2);
    if (entscheidung.planungsNachweis !== true
        || entscheidung.ausfuehrungsAutoritaet !== false
        || entscheidung.gameplayAutoritaet !== false
        || entscheidung.rawWriteAutoritaet !== false) {
      throw new Error("BANK_CANARY_AUTHORITY_INVARIANTE_VERLETZT");
    }

    const bericht = baueBericht(beobachtung, entscheidung, jetztMs + 2);
    const dateisystem = new NodeProduktionsDateisystem(
      hostOptionen.dateisystemOptionen ?? {},
    );
    await dateisystem.schreibeAtomarDurable(
      "runtime/canary/bank-planen/latest.json",
      JSON.stringify(bericht, null, 2) + "\n",
      "bank-planen-canary-" + jetztMs,
    );
    return bericht;
  } finally {
    if (gestartet) {
      await host.stoppe("BANK_PLANEN_CANARY_ENDE").catch(() => {});
    }
  }
}

function leseArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const wert = process.argv[index + 1];
  if (!wert || wert.startsWith("--")) {
    throw new Error("BANK_CANARY_ARGUMENT_FEHLT:" + name);
  }
  return wert;
}

export async function fuehreBankPlanenCanaryLive() {
  const cdpText = leseArgument(
    "--cdp",
    process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const cdp = validiereLoopbackCdp(cdpText);
  const context = await findeAdventureLandKontext(cdp);
  try {
    const beobachtung = await beobachteBankCanaryReadOnly(
      context.session,
      context.contextId,
    );
    const bericht = await fuehreBankPlanenCanaryMitBeobachtung({
      beobachtung,
      jetztMs: Date.now(),
    });
    process.stdout.write(JSON.stringify(bericht, null, 2) + "\n");
    return bericht;
  } finally {
    context.session.close();
  }
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direkt) {
  fuehreBankPlanenCanaryLive().catch(fehler => {
    process.stderr.write(
      "[V5-BANK-PLANEN-CANARY] "
        + String(fehler?.message || fehler)
        + "\n",
    );
    process.exitCode = 1;
  });
}
