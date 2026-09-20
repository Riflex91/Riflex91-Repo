import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  beobachteBankCanaryReadOnly,
  validiereBankCanaryBeobachtung,
} from "../../werkzeuge/bank-planen-canary-browser.mjs";
import {
  fuehreBankPlanenCanaryMitBeobachtung,
} from "../../werkzeuge/bank-planen-observer-canary.mjs";

function item(slot, name = "hpot0") {
  return {
    slot,
    name,
    level: 0,
    menge: 1,
    stackMax: 9999,
    gesperrt: false,
    spezial: "",
  };
}

function beobachtung({
  gesamtSlots = 12,
  belegteSlots = 11,
  freieInventarSlots = 20,
  alternativeRuntimeAktiv = false,
} = {}) {
  return {
    status: "OK",
    accountId: "ACCOUNT-RAW-NUR-IM-ARBEITSSPEICHER",
    charakterName: "MerchantCanary",
    charakterSessionId: "SESSION-1",
    ctype: "merchant",
    map: "bank",
    rip: false,
    bewegtSich: false,
    alternativeRuntimeAktiv,
    bankVerfuegbar: true,
    packs: [{
      pack: "items0",
      gesamtSlots,
      eintraege: Array.from(
        { length: belegteSlots },
        (_, index) => item(index),
      ),
    }],
    freieInventarSlots,
  };
}

function hostOptionen(root) {
  return {
    dateisystemOptionen: {
      wurzel: root,
      testmodus: true,
    },
    operationsOptionen: {
      minimaleFreieBytes: 1,
      maximaleIoLatenzMs: 60_000,
      gueltigkeitMs: 5_000,
    },
  };
}

test("fixed browser observer liefert nur validierte read-only Bankbeobachtung", async () => {
  const erwartet = beobachtung();
  const session = {
    aufrufe: 0,
    async evaluate(expression, contextId) {
      this.aufrufe += 1;
      assert.equal(contextId, 7);
      assert.match(expression, /character/);
      assert.match(expression, /G\.items/);
      return erwartet;
    },
  };

  const result = await beobachteBankCanaryReadOnly(session, 7);

  assert.equal(session.aufrufe, 1);
  assert.deepEqual(result, erwartet);
});

test("Bank-Canary aktiviert PLANEN und erzeugt nur eine Konsolidierungsplanung", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-canary-"));
  try {
    const bericht = await fuehreBankPlanenCanaryMitBeobachtung({
      beobachtung: beobachtung(),
      jetztMs: 1_000,
      hostOptionen: hostOptionen(root),
    });

    assert.equal(bericht.capabilityId, "merchant.bank.planen");
    assert.equal(bericht.entscheidung.art, "KONSOLIDIEREN");
    assert.equal(bericht.entscheidung.planungsNachweis, true);
    assert.equal(bericht.entscheidung.ausfuehrungsAutoritaet, false);
    assert.equal(bericht.entscheidung.gameplayAutoritaet, false);
    assert.equal(bericht.entscheidung.rawWriteAutoritaet, false);
    assert.equal(bericht.browserReadOnly, true);
    assert.equal(bericht.browserGameplayWrites, 0);
    assert.equal(bericht.hostGameplayAutoritaet, false);
    assert.equal(bericht.hostRawWriteAutoritaet, false);
    assert.equal(bericht.hostActionAuthority, false);
    assert.equal(bericht.breiteRuntimeFreigabe, false);
    assert.match(bericht.accountBindung, /^ACCOUNT:[a-f0-9]{64}$/);

    const text = await fs.readFile(
      path.join(root, "runtime", "canary", "bank-planen", "latest.json"),
      "utf8",
    );
    assert.equal(
      text.includes("ACCOUNT-RAW-NUR-IM-ARBEITSSPEICHER"),
      false,
    );
    const durable = JSON.parse(text);
    assert.equal(durable.canaryId, bericht.canaryId);
    assert.equal(durable.entscheidung.art, "KONSOLIDIEREN");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("ausreichende reale Bankkapazitaet bleibt reine KEINE_AKTION-Planung", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-canary-free-"));
  try {
    const bericht = await fuehreBankPlanenCanaryMitBeobachtung({
      beobachtung: beobachtung({
        gesamtSlots: 42,
        belegteSlots: 1,
      }),
      jetztMs: 2_000,
      hostOptionen: hostOptionen(root),
    });

    assert.equal(bericht.entscheidung.art, "KEINE_AKTION");
    assert.deepEqual(
      bericht.entscheidung.gruende,
      ["BANK_KAPAZITAET_AUSREICHEND"],
    );
    assert.equal(bericht.browserGameplayWrites, 0);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Bank-Canary blockiert alternative Runtime und fehlenden Bankkontext", () => {
  assert.throws(
    () => validiereBankCanaryBeobachtung(beobachtung({
      alternativeRuntimeAktiv: true,
    })),
    /BANK_CANARY_ALTERNATIVE_RUNTIME_AKTIV/,
  );

  assert.throws(
    () => validiereBankCanaryBeobachtung({
      ...beobachtung(),
      bankVerfuegbar: false,
      packs: [],
    }),
    /BANK_CANARY_BANK_KONTEXT_FEHLT/,
  );
});

test("Bank-Canary-Browserquelle enthaelt keine Adventure-Land-Write-API", async () => {
  const source = await fs.readFile(
    new URL("../../werkzeuge/bank-planen-canary-browser.mjs", import.meta.url),
    "utf8",
  );
  for (const muster of [
    /\bbank_store\s*\(/,
    /\bbank_retrieve\s*\(/,
    /\bopen_bank_pack\s*\(/,
    /\bbuy\s*\(/,
    /\bsell\s*\(/,
    /\bexchange\s*\(/,
    /\bcraft\s*\(/,
    /\bupgrade\s*\(/,
    /\bcompound\s*\(/,
    /\battack\s*\(/,
    /\bmove\s*\(/,
    /\bsmart_move\s*\(/,
    /\buse_skill\s*\(/,
    /\bequip\s*\(/,
    /\bsend_item\s*\(/,
    /\bsend_gold\s*\(/,
    /\.emit\s*\(/,
  ]) {
    assert.equal(muster.test(source), false, String(muster));
  }
});
