import fs from "node:fs";

const evidence = JSON.parse(fs.readFileSync(new URL("../roadmap/pr20-6-mluck-evidence.json", import.meta.url), "utf8"));
const gate = JSON.parse(fs.readFileSync(new URL("../roadmap/pr20-6-mluck-exit-gate-status.json", import.meta.url), "utf8"));
const roadmap = JSON.parse(fs.readFileSync(new URL("../roadmap/post-r19-roadmap.json", import.meta.url), "utf8"));

function must(condition, code) {
  if (!condition) throw new Error(code);
}

must(evidence.status === "BESTANDEN_REAL_INGAME_4CHAR_5M", "PR20_6_EVIDENCE_STATUS");
must(evidence.run?.terminalStatus === "BESTANDEN", "PR20_6_TERMINAL");
must(evidence.run?.phase === "COMPLETE", "PR20_6_PHASE");
must(evidence.roster?.ready === true, "PR20_6_ROSTER");
must(JSON.stringify(evidence.roster?.requiredClasses) === JSON.stringify(["merchant","ranger","priest","mage"]), "PR20_6_CLASSES");
must(evidence.roster?.sameAccount === true, "PR20_6_SAME_ACCOUNT");
must(evidence.roster?.sameServer === true, "PR20_6_SAME_SERVER");
must(evidence.deterministic?.status === "BESTANDEN", "PR20_6_DETERMINISTIC");
must(evidence.deterministic?.scenariosPassed === evidence.deterministic?.scenariosTotal, "PR20_6_SCENARIOS");
must(evidence.preflight?.status === "BESTANDEN", "PR20_6_PREFLIGHT");
must(evidence.liveWrite?.status === "COMMITTED", "PR20_6_COMMITTED");
must(evidence.liveWrite?.settlement === "BESTAETIGT", "PR20_6_SETTLEMENT");
must(evidence.liveWrite?.publicFunction === "use_skill", "PR20_6_PUBLIC_FUNCTION");
must(evidence.liveWrite?.skill === "mluck", "PR20_6_SKILL");
must(evidence.liveWrite?.publicFunctionCalls === 1, "PR20_6_PUBLIC_CALLS");
must(evidence.safety?.gameplayWrites === 1, "PR20_6_GAMEPLAY_WRITES");
must(evidence.safety?.expectedGameplayWrites === 1, "PR20_6_EXPECTED_GAMEPLAY_WRITES");
must(evidence.safety?.rawWriteCalls === 0, "PR20_6_RAW_WRITES");
must(evidence.safety?.sameIntentRetry === false, "PR20_6_RETRY");
must(evidence.safety?.secondIntentCreated === false, "PR20_6_SECOND_INTENT");
must(evidence.soak?.status === "BESTANDEN", "PR20_6_SOAK");
must(evidence.soak?.durationMs >= 5 * 60 * 1000, "PR20_6_SOAK_DURATION");
must(evidence.soak?.samples >= evidence.soak?.minimumSamples, "PR20_6_SOAK_SAMPLES");
must(evidence.lifecycle?.startCallsDuringAcceptedRun === 0, "PR20_6_LIFECYCLE_START_REPEAT");
must(evidence.lifecycle?.disconnectCallsDuringAcceptedRun === 0, "PR20_6_LIFECYCLE_DISCONNECT_REPEAT");
must(evidence.lifecycle?.persistedRangerUncertainBoundaryRetried === false, "PR20_6_RANGER_RETRY");
must(gate.status === "ROADMAP_ABGESCHLOSSEN_REAL_INGAME", "PR20_6_GATE_STATUS");
must(gate.nextGate === "PR20.7_GEAR", "PR20_6_NEXT_GATE");
must(gate.transitionPolicy?.newGearMutationAuthorityAutomaticallyAllowed === false, "PR20_6_NO_AUTO_GEAR_AUTHORITY");
must(gate.transitionPolicy?.normalRuntimeAutomaticallyAllowed === false, "PR20_6_NORMAL_RUNTIME_BLOCK");
must(roadmap.currentGate === "PR20.7_GEAR", "PR20_6_ROADMAP_CURRENT_GATE");
must(roadmap.pr20_6?.status === "ROADMAP_ABGESCHLOSSEN_REAL_INGAME", "PR20_6_ROADMAP_STATUS");
must(roadmap.pr20_6?.normalRuntimeAfterAllTestsOnly === true, "PR20_6_ROADMAP_RUNTIME_GATE");

console.log("PR20.6 MLuck exit gate passed.");
