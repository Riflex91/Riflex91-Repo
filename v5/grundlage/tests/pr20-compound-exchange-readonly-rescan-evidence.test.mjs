import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-compound-exchange-readonly-rescan-evidence.json",
  "utf8",
));
const manifest = JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));

test("PR20.8 Compound/Exchange rescan is terminal BESTANDEN and zero-write", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_BROWSER_NO_CANDIDATES_ZERO_WRITE");
  assert.equal(evidence.ratified, true);
  assert.equal(evidence.manifestMainCommit, "eb85d5b2dcab153ef78bd7cbd8ba77fb58749776");
  assert.equal(evidence.testId, "pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(evidence.controllerVersion, "1.0.2");

  const live=evidence.liveObservation;
  assert.equal(live.status, "BESTANDEN");
  assert.equal(live.phase, "COMPLETE");
  assert.equal(live.terminal, true);
  assert.equal(live.bridgeState, "ALREADY_PRESENT");
  assert.equal(live.bridgeError, null);
  assert.equal(live.recipient.characterName, "My_Merchant");
  assert.equal(live.recipient.ctype, "merchant");
  assert.equal(live.recipient.serverRegion, "EU");
  assert.equal(live.recipient.serverIdentifier, "I");
  assert.equal(live.qFingerprintMaterial, "{}");
  assert.equal(live.performanceTrick.active, true);
});

test("PR20.8 rescan leaves Compound and Exchange without candidates or authority", () => {
  assert.equal(evidence.families.COMPOUND.status, "KEIN_KANDIDAT");
  assert.equal(evidence.families.COMPOUND.candidateCount, 0);
  assert.equal(evidence.families.COMPOUND.selected, null);
  assert.deepEqual(evidence.families.COMPOUND.observedRejected, []);

  assert.equal(evidence.families.EXCHANGE.status, "KEIN_KANDIDAT");
  assert.equal(evidence.families.EXCHANGE.candidateCount, 0);
  assert.equal(evidence.families.EXCHANGE.selected, null);
  assert.deepEqual(evidence.families.EXCHANGE.observedRejected, [{
    name:"anniversarygift",
    inventoryIndex:4,
    reason:"UNSAFE_PHYSICAL_ITEM",
  }]);

  const b=evidence.observedSafetyBoundary;
  assert.equal(b.authorityIssued, false);
  assert.equal(b.durableIntentCreated, false);
  assert.equal(b.compoundAuthority, false);
  assert.equal(b.exchangeAuthority, false);
  assert.equal(b.gameplayAuthority, false);
  assert.equal(b.rawWriteAuthority, false);
  assert.equal(b.gameplayWrites, 0);
  assert.equal(b.publicFunctionCalls, 0);
  assert.equal(b.rawWriteCalls, 0);
  assert.equal(b.sameIntentRetry, false);
  assert.equal(b.normalRuntimeAllowed, false);

  assert.equal(evidence.interpretation.noCandidateDoesNotAuthorizeAcquisitionOrMutation, true);
  assert.equal(evidence.interpretation.compoundRatified, false);
  assert.equal(evidence.interpretation.exchangeRatified, false);
});

test("PR20.8 Upgrade observation remains informational only after prior committed success", () => {
  const u=evidence.families.UPGRADE;
  assert.equal(u.informationalOnly, true);
  assert.equal(u.status, "KANDIDAT_GEFUNDEN");
  assert.equal(u.candidateCount, 3);
  assert.equal(u.selected.name, "gloves");
  assert.equal(u.selected.level, 0);
  assert.equal(u.selected.inventoryIndex, 13);
  assert.equal(u.selected.scrollName, "scroll0");
  assert.equal(u.selected.observedScrollQuantity, 35);
  assert.equal(u.selected.liveAuthority, false);
  assert.equal(u.selected.exactPhysicalIndexMustBeReresolvedBeforeSend, true);
});

test("PR20.8 rescan package is immutable, exact and no-write", () => {
  const bytes=execFileSync(
    "git",
    ["show", evidence.sourceCommit + ":" + evidence.packagePath],
    {encoding:null,maxBuffer:256*1024},
  );
  assert.equal(bytes.length,evidence.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    evidence.packageSha256,
  );
  const source=bytes.toString("utf8");
  assert.ok(source.includes("const VERSION = '1.0.2'"));
  for(const marker of [
    "upgrade(", "compound(", "exchange(", "buy(", "buy_with_gold(",
    "send_item(", "send_gold(", "start_character(", "command_character(",
    "use_skill(", "equip(", "unequip(", "api_call(", "socket.emit(", ".socket.emit("
  ]) assert.equal(source.includes(marker),false,marker);
});

test("active manifest remains pinned to the ratified read-only rescan package", () => {
  assert.equal(manifest.testId, evidence.testId);
  assert.equal(manifest.controllerVersion, evidence.controllerVersion);
  assert.equal(manifest.sourceCommit, evidence.sourceCommit);
  assert.equal(manifest.packagePath, evidence.packagePath);
  assert.equal(manifest.packageSha256, evidence.packageSha256);
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.equal(
    evidence.nextGate,
    "PR20_8_COMPOUND_EXCHANGE_SEPARATE_CANDIDATE_OR_ACQUISITION_PREPARATION",
  );
});
