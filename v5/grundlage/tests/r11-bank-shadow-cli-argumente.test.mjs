import test from "node:test";
import assert from "node:assert/strict";
import {
  leseBankItemTransferShadowArgument,
} from "../../werkzeuge/bank-item-transfer-real-browser-shadow.mjs";
import {
  leseBankSwapShadowArgument,
} from "../../werkzeuge/bank-swap-real-browser-shadow.mjs";

test("Shadow CLI liest durch npm/powershell gesplitteten Bestaetigungstext bis zum naechsten Flag", () => {
  const argv = ["node","script","--mode","RETRIEVE","--confirm","V5","BANK","RETRIEVE","SHADOW","OHNE","WRITE","AUSFUEHREN","--source-sha","a".repeat(40)];
  assert.equal(
    leseBankItemTransferShadowArgument("--confirm", null, argv),
    "V5 BANK RETRIEVE SHADOW OHNE WRITE AUSFUEHREN",
  );
  assert.equal(
    leseBankItemTransferShadowArgument("--mode", null, argv),
    "RETRIEVE",
  );
  assert.equal(
    leseBankItemTransferShadowArgument("--source-sha", null, argv),
    "a".repeat(40),
  );
});

test("Swap Shadow CLI behaelt denselben robusten Parser", () => {
  const argv = ["node","script","--confirm","V5","BANK","SWAP","SHADOW","OHNE","WRITE","AUSFUEHREN","--cdp","http://127.0.0.1:9222/"];
  assert.equal(
    leseBankSwapShadowArgument("--confirm", null, argv),
    "V5 BANK SWAP SHADOW OHNE WRITE AUSFUEHREN",
  );
  assert.equal(
    leseBankSwapShadowArgument("--cdp", null, argv),
    "http://127.0.0.1:9222/",
  );
});

test("Shadow CLI bleibt bei fehlendem Argument fail-closed", () => {
  assert.throws(
    () => leseBankItemTransferShadowArgument("--confirm", null, ["node","script","--confirm","--source-sha","x"]),
    /ARGUMENT_FEHLT/,
  );
  assert.throws(
    () => leseBankSwapShadowArgument("--confirm", null, ["node","script","--confirm","--cdp","x"]),
    /ARGUMENT_FEHLT/,
  );
});
