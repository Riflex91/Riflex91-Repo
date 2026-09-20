export function pruefeSafetyQuelltexte(quellen) {
  const fehler = [];
  const admission = quellen.admission ?? "";
  const recovery = quellen.recovery ?? "";
  const restart = quellen.restart ?? "";
  const health = quellen.health ?? "";
  const alerts = quellen.alerts ?? "";

  if (!admission.includes('if (!runtime.freigegeben) throw new Error("LAUFZEIT_GATE_GESPERRT");')) {
    fehler.push("MUTATION_ADMISSION_RUNTIME_GATE");
  }
  if (!recovery.includes("sameIntentErneutSenden: false")) {
    fehler.push("MUTATION_RECOVERY_SAME_INTENT");
  }
  if (!restart.includes("executionAuthority: false")) {
    fehler.push("MUTATION_RESTART_AUTHORITY");
  }
  if (!health.includes('mutationErlaubt: zustand === "GESUND"')) {
    fehler.push("MUTATION_HEALTH_FAIL_CLOSED");
  }

  const persist = alerts.indexOf("const bestaetigung = await this.#spool.speichereDurable(alert);");
  const claim = alerts.indexOf("const claim = await this.#spool.claimDurable(alert.alertId);");
  if (persist < 0 || claim < 0 || persist >= claim) {
    fehler.push("MUTATION_ALERT_PERSIST_BEFORE_CLAIM");
  }
  return Object.freeze([...fehler]);
}
