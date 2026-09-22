import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  aktiviereUndVerifiziereBrowserPerformanceTrick,
} from "../../werkzeuge/r12-live/performance-trick.mjs";
import {
  loeseBankItemTransferShadowBestaetigung,
} from "../../werkzeuge/bank-item-transfer-real-browser-shadow.mjs";
import {
  loeseBankSwapShadowBestaetigung,
  BANK_SWAP_REAL_SHADOW_BESTAETIGUNG,
} from "../../werkzeuge/bank-swap-real-browser-shadow.mjs";

test("Bank performance_trick wird mit CDP userGesture verifiziert", async () => {
  let gesehen = null;
  const session = {
    async evaluate(expr, contextId, optionen) {
      gesehen = { expr, contextId, optionen };
      return {
        verfuegbar: true, aufgerufen: true, audioGefunden: true,
        cplaying: true, playing: true, aktiv: true, fehler: null,
      };
    },
  };
  const result = await aktiviereUndVerifiziereBrowserPerformanceTrick(session, 7);
  assert.equal(result.aktiv, true);
  assert.equal(result.verifikation, "HOWLER_PLAYING_TRUE");
  assert.deepEqual(gesehen.optionen, { userGesture: true });
  assert.match(gesehen.expr, /performance_trick/);
  assert.match(gesehen.expr, /playing/);
});

test("Bank performance_trick bleibt fail-closed wenn Howler nicht spielt", async () => {
  const session = {
    async evaluate() {
      return {
        verfuegbar: true, aufgerufen: true, audioGefunden: true,
        cplaying: true, playing: false, aktiv: false,
      };
    },
  };
  await assert.rejects(
    () => aktiviereUndVerifiziereBrowserPerformanceTrick(session, 1),
    /BANK_PERFORMANCE_TRICK_NICHT_AKTIV/,
  );
});

test("Shadow confirmation token ist Windows/npm-sicher", () => {
  assert.equal(
    loeseBankItemTransferShadowBestaetigung(
      "RETRIEVE", null, "V5_BANK_RETRIEVE_SHADOW_OHNE_WRITE_AUSFUEHREN",
    ),
    "V5 BANK RETRIEVE SHADOW OHNE WRITE AUSFUEHREN",
  );
  assert.equal(
    loeseBankItemTransferShadowBestaetigung(
      "STORE", null, "V5_BANK_STORE_SHADOW_OHNE_WRITE_AUSFUEHREN",
    ),
    "V5 BANK STORE SHADOW OHNE WRITE AUSFUEHREN",
  );
  assert.equal(
    loeseBankSwapShadowBestaetigung(
      null, "V5_BANK_SWAP_SHADOW_OHNE_WRITE_AUSFUEHREN",
    ),
    BANK_SWAP_REAL_SHADOW_BESTAETIGUNG,
  );
});

test("alle aktiven Bank-Abendrunner erzwingen performance_trick", () => {
  const dateien = [
    "werkzeuge/bank-item-transfer-produktions-preflight.mjs",
    "werkzeuge/bank-item-transfer-candidate-stability.mjs",
    "werkzeuge/bank-item-transfer-code-bridge-probe.mjs",
    "werkzeuge/bank-item-transfer-real-browser-shadow.mjs",
    "werkzeuge/bank-swap-produktions-preflight.mjs",
    "werkzeuge/bank-swap-candidate-stability.mjs",
    "werkzeuge/bank-swap-code-bridge-probe.mjs",
    "werkzeuge/bank-swap-real-browser-shadow.mjs",
    "werkzeuge/bank-swap-write-preflight.mjs",
    "werkzeuge/bank-swap-produktions-live.mjs",
  ];
  for (const datei of dateien) {
    const source = fs.readFileSync(datei, "utf8");
    assert.match(
      source,
      /aktiviereUndVerifiziereBrowserPerformanceTrick\(/,
      datei,
    );
  }
});
