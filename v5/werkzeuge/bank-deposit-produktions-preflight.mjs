import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

import {
  BANK_DEPOSIT_ERSTER_BETRAG,
} from "../erzeugt/index.js";
import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  BANK_DEPOSIT_PREFLIGHT_GAMEPLAY_WRITES,
  beobachteBankDepositPreflightReadOnly,
} from "./bank-deposit-produktions-browser.mjs";
import {
  erstelleNodeV5ProduktionsHost,
} from "./v5-produktions-host-komposition.mjs";

function hash(wert) {
  return crypto.createHash("sha256").update(String(wert)).digest("hex");
}

function leseArgument(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i < 0) return fallback;
  const wert = process.argv[i + 1];
  if (!wert || wert.startsWith("--")) {
    throw new Error("BANK_DEPOSIT_PREFLIGHT_ARGUMENT_FEHLT:" + name);
  }
  return wert;
}

export async function fuehreBankDepositPreflight({
  cdpText,
  hostOptionen = {},
} = {}) {
  const cdp = validiereLoopbackCdp(
    cdpText || process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
  );
  const live = await findeAdventureLandKontext(cdp);
  let host = null;
  try {
    const beobachtung = await beobachteBankDepositPreflightReadOnly(
      live.session,
      live.contextId,
    );
    host = await erstelleNodeV5ProduktionsHost(hostOptionen);
    const start = await host.starte(Date.now());
    if (start.zustand !== "LAEUFT") {
      throw new Error("BANK_DEPOSIT_PREFLIGHT_HOST_BLOCKIERT:" + start.grund);
    }
    const journal = await host.pruefeBankDepositStartBereit();
    const status = host.status();
    const bereit = journal.bereit
      && status.zustand === "LAEUFT"
      && status.aktivePlanenFaehigkeiten.length === 0
      && status.equipEinmalAuthorityOffen === false
      && status.bankDepositEinmalAuthorityOffen === false;

    return Object.freeze({
      schemaVersion: 1,
      status: bereit ? "BEREIT_FUER_ADMISSION" : "BLOCKIERT",
      charakterBindungSha256: hash(
        beobachtung.charakterName + ":" + beobachtung.sessionId,
      ),
      accountBindungSha256: hash(beobachtung.accountId),
      ctype: beobachtung.ctype,
      server: Object.freeze({
        region: beobachtung.serverRegion,
        kennung: beobachtung.serverKennung,
      }),
      candidate: Object.freeze({
        publicFunction: "bank_deposit",
        betragGold: BANK_DEPOSIT_ERSTER_BETRAG,
        characterGoldVorher: beobachtung.characterGold,
        bankGoldVorher: beobachtung.bankGold,
      }),
      journal: Object.freeze({
        bereit: journal.bereit,
        offeneTransaktionsId: journal.offeneTransaktionsId,
      }),
      host: Object.freeze({
        zustand: status.zustand,
        grund: status.grund,
        aktivePlanenFaehigkeiten: status.aktivePlanenFaehigkeiten,
        equipEinmalAuthorityOffen: status.equipEinmalAuthorityOffen,
        bankDepositEinmalAuthorityOffen:
          status.bankDepositEinmalAuthorityOffen,
        gameplayAutoritaet: status.gameplayAutoritaet,
        rawWriteAutoritaet: status.rawWriteAutoritaet,
        actionAuthority: status.actionAuthority,
      }),
      admission: Object.freeze({
        accountweiteBankLeaseVorSendErforderlich: true,
        lokalerBankActionChannelVorSendErforderlich: true,
        leaseImPreflightErteilt: false,
        authorityImPreflightErteilt: false,
      }),
      browserReadOnly: true,
      browserGameplayWrites: BANK_DEPOSIT_PREFLIGHT_GAMEPLAY_WRITES,
      naechsterSchritt: bereit
        ? "FAULT_RESTART_SHADOW_VOR_LIVE_RUNNER"
        : "CURRENT_EVIDENCE_ODER_HOST_BLOCKER_ANALYSIEREN",
    });
  } finally {
    if (host !== null) {
      await host.stoppe("BANK_DEPOSIT_PREFLIGHT_ENDE").catch(() => {});
    }
    live.session.close();
  }
}

const direkt = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direkt) {
  fuehreBankDepositPreflight({
    cdpText: leseArgument(
      "--cdp",
      process.env.V5_CDP_URL || "http://127.0.0.1:9222/",
    ),
  }).then(bericht => {
    process.stdout.write(JSON.stringify(bericht, null, 2) + "\n");
    if (bericht.status !== "BEREIT_FUER_ADMISSION") process.exitCode = 2;
  }).catch(fehler => {
    process.stderr.write(JSON.stringify({
      status: "BLOCKIERT",
      fehler: String(fehler?.message || fehler),
      browserGameplayWrites: 0,
      authorityAusgestellt: false,
    }, null, 2) + "\n");
    process.exitCode = 1;
  });
}
