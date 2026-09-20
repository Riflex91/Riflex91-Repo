import test from "node:test";
import assert from "node:assert/strict";

import {
  CharacterSocketBudget,
  MutationsKanalKoordination,
  RessourcenVerwalter,
  actionKanalRessourcenId,
  erstelleMutationsKanalPlan,
} from "../../erzeugt/index.js";

test("Action-Channel ist eine exklusive Scheduler-Ressource ohne Lock-Stealing", () => {
  const verwalter = new RessourcenVerwalter();
  const id = actionKanalRessourcenId("merchant", "trade");
  const [tokenA] = verwalter.beanspruche("A", [{
    ressourcenId: id,
    art: "ACTION_KANAL",
    leaseDauerMs: null,
  }], 0);

  assert.throws(
    () => verwalter.beanspruche("B", [{
      ressourcenId: id,
      art: "ACTION_KANAL",
      leaseDauerMs: null,
    }], 0),
    /RESSOURCE_BELEGT/,
  );
  assert.equal(verwalter.validiereFencing(tokenA, 0), true);

  verwalter.gibFrei(tokenA, 1);
  const [tokenB] = verwalter.beanspruche("B", [{
    ressourcenId: id,
    art: "ACTION_KANAL",
    leaseDauerMs: null,
  }], 1);
  assert.ok(tokenB.epoche > tokenA.epoche);
  assert.equal(verwalter.validiereFencing(tokenA, 1), false);
  assert.equal(verwalter.validiereFencing(tokenB, 1), true);
});

test("abgelaufene langlebige Lease verlangt Abgleich vor Neuvergabe", () => {
  const verwalter = new RessourcenVerwalter();
  const [alt] = verwalter.beanspruche("A", [{
    ressourcenId: "merchant:bank",
    art: "LANGLEBIG",
    leaseDauerMs: 100,
  }], 0);

  assert.equal(verwalter.validiereFencing(alt, 100), true);
  assert.equal(verwalter.validiereFencing(alt, 101), false);
  assert.throws(
    () => verwalter.beanspruche("B", [{
      ressourcenId: "merchant:bank",
      art: "LANGLEBIG",
      leaseDauerMs: 100,
    }], 101),
    /RESSOURCE_ABGLEICH_ERFORDERLICH/,
  );

  verwalter.schliesseAbgleichAb("merchant:bank", "A", alt.epoche);
  const [neu] = verwalter.beanspruche("B", [{
    ressourcenId: "merchant:bank",
    art: "LANGLEBIG",
    leaseDauerMs: 100,
  }], 102);
  assert.ok(neu.epoche > alt.epoche);
  assert.equal(verwalter.validiereFencing(alt, 102), false);
  assert.equal(verwalter.validiereFencing(neu, 102), true);
});

test("mehrere Ressourcen werden all-or-nothing in deterministischer Reihenfolge geclaimt", () => {
  const verwalter = new RessourcenVerwalter();
  verwalter.beanspruche("A", [{
    ressourcenId: "resource:a",
    art: "EXKLUSIV",
    leaseDauerMs: null,
  }], 0);

  assert.throws(
    () => verwalter.beanspruche("B", [
      { ressourcenId: "resource:b", art: "EXKLUSIV", leaseDauerMs: null },
      { ressourcenId: "resource:a", art: "EXKLUSIV", leaseDauerMs: null },
    ], 0),
    /RESSOURCE_BELEGT:resource:a/,
  );
  assert.equal(verwalter.sicht().some(x => x.ressourcenId === "resource:b"), false);

  const frei = new RessourcenVerwalter();
  const tokens = frei.beanspruche("C", [
    { ressourcenId: "resource:z", art: "EXKLUSIV", leaseDauerMs: null },
    { ressourcenId: "resource:a", art: "EXKLUSIV", leaseDauerMs: null },
    { ressourcenId: "resource:m", art: "EXKLUSIV", leaseDauerMs: null },
  ], 0);
  assert.deepEqual(tokens.map(x => x.ressourcenId), [
    "resource:a",
    "resource:m",
    "resource:z",
  ]);
});

test("alle Action-Channels eines Characters teilen dasselbe globale Socket-Planbudget", () => {
  const budget = new CharacterSocketBudget();
  const trade = erstelleMutationsKanalPlan("merchant", "trade", 60);
  const bank = erstelleMutationsKanalPlan("merchant", "bank", 50);
  const anderer = erstelleMutationsKanalPlan("farmer", "combat", 50);

  assert.notEqual(trade.actionKanalRessourcenId, bank.actionKanalRessourcenId);
  assert.equal(trade.socketBudgetRessourcenId, bank.socketBudgetRessourcenId);

  budget.reserviere("R-1", "A", trade, 0);
  assert.throws(
    () => budget.reserviere("R-2", "B", bank, 0),
    /SOCKET_BUDGET_PLANLIMIT_UEBERSCHRITTEN/,
  );
  assert.doesNotThrow(() => budget.reserviere("R-3", "C", anderer, 0));
  assert.deepEqual(budget.sicht("merchant", 0), {
    fensterMs: 4000,
    planBudget: 100,
    serverGrenze: 200,
    reserve: 100,
    belegt: 60,
    verfuegbar: 40,
  });
});

test("MutationsKanalKoordination liefert nur Channel-Claim plus Budget gemeinsam aus", () => {
  const ressourcen = new RessourcenVerwalter();
  const budget = new CharacterSocketBudget();
  const koordination = new MutationsKanalKoordination(ressourcen, budget);
  const plan = erstelleMutationsKanalPlan("merchant", "trade", 20);

  const a = koordination.reserviere("RES-A", "A", plan, 0);
  assert.equal(a.kanalToken.ressourcenId, plan.actionKanalRessourcenId);
  assert.equal(a.budgetReservierung.gewichteteKosten, 20);

  assert.throws(
    () => koordination.reserviere("RES-B", "B", plan, 0),
    /RESSOURCE_BELEGT/,
  );
  assert.equal(budget.sicht("merchant", 0).belegt, 20);

  ressourcen.gibFrei(a.kanalToken, 1);
  assert.doesNotThrow(() => koordination.reserviere("RES-C", "B", plan, 1));
});
