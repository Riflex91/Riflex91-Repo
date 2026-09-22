import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Bank-Swap-Preflight bleibt source-locked und write-frei", () => {
  const source = fs.readFileSync(
    "werkzeuge/bank-swap-produktions-preflight.mjs",
    "utf8",
  );
  assert.match(source, /git/);
  assert.match(source, /rev-parse/);
  assert.match(source, /HEAD/);
  assert.match(source, /--source-sha/);
  assert.match(source, /requiredGlobalFunction:\s*"call_code_function_f"/);
  assert.match(source, /authorityAusgestellt:\s*false/);
  assert.match(source, /leaseErworben:\s*false/);
  assert.match(source, /journalIntentGeschrieben:\s*false/);
  assert.match(source, /bankSwapAufrufe:\s*0/);
  for (const muster of [
    /\bbank_swap\s*\(/,
    /maincode\.contentWindow\.bank_swap/,
    /call_code_function_f\s*\(/,
    /\.emit\s*\(/,
    /erteileProduktiveBankSwapEinmalAuthority\s*\(/,
  ]) assert.equal(muster.test(source), false);
});
