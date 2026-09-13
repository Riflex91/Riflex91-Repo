export const SETTINGS_SCHEMA_VERSION = 1;

const n = (key, category, label, description, value, min, max, step, hot = true) => ({ key, category, label, description, type: 'number', default: value, min, max, step, hot });
const b = (key, category, label, description, value, locked = false, hot = true) => ({ key, category, label, description, type: 'boolean', default: value, locked, hot });
const s = (key, category, label, description, value, values, hot = true) => ({ key, category, label, description, type: 'select', default: value, values, hot });

export const SETTINGS_SCHEMA = Object.freeze([
  n('runtime.tickMs','Runtime','Runtime-Tick','Grundtakt der lokalen Bot-Runtime.',250,100,2000,50,false),
  b('runtime.visibleStatus','Runtime','Sichtbare Statusmeldungen','Wichtige Zustände zusätzlich im Adventure-Land-Log anzeigen.',true,false,true),
  n('runtime.brainAuditMs','Runtime','Brain-Auswertungsintervall','Wie oft die strategische Situation neu bewertet wird.',5000,1000,60000,500,true),
  n('runtime.logCapacity','Runtime','Event-Log Kapazität','Maximale lokale Event-Anzahl.',4000,500,20000,500,false),

  n('party.cohesionRadius','Party & Formation','Kohäsionsradius','Maximaler gewünschter Paarabstand der Kampfgruppe.',150,80,280,5,false),
  n('party.hardRegroupExtraRadius','Party & Formation','Hard-Regroup Zusatzradius','Puffer vor einem erzwungenen Regroup.',45,10,140,5,false),
  n('party.committedPullExtraRadius','Party & Formation','Committed-Pull Puffer','Tolerierte milde Kohäsionsdrift bei begonnenem Pull.',60,0,120,5,false),
  n('party.committedPullAbsoluteMaxRadius','Party & Formation','Committed-Pull Maximalradius','Absolute Obergrenze für Pull-Fortsetzung.',220,120,320,5,false),
  b('party.requireCompleteTeamForFreshPull','Party & Formation','Vollständige Gruppe für neue Pulls','Neue Pulls nur mit vollständiger, lebender und lokalisierter Gruppe.',true,true,true),
  b('party.commandCharacterActiveOnly','Party & Formation','Remote-Autorität nur für aktive Charaktere','Diagnose-Sichtbarkeit darf keine Befehlsautorität erzeugen.',true,true,true),

  n('combat.riskThreshold','Kampf & Risiko','Risikoschwelle','Grundschwelle des lokalen Combat-Risk-Gates.',0.65,0.2,0.95,0.01,true),
  n('combat.recoveryHpRatio','Kampf & Risiko','Recovery-HP','Unterhalb dieses HP-Anteils wird konservativer entschieden.',0.75,0.35,0.95,0.01,false),
  n('combat.emergencyCriticalHpRatio','Kampf & Risiko','Kritische HP','Harte Notfallgrenze für Emergency Retreat.',0.25,0.1,0.6,0.01,false),
  n('combat.multiAggroHpRatio','Kampf & Risiko','Multi-Aggro HP-Grenze','HP-Grenze für Multi-Aggro Emergency-Bewertung.',0.55,0.25,0.9,0.01,false),
  n('combat.multiAggroCount','Kampf & Risiko','Multi-Aggro Anzahl','Gegneranzahl für Multi-Aggro Emergency.',2,2,8,1,false),
  n('combat.softKillSeconds','Kampf & Risiko','TTK Soft-Limit','Ab hier wird ein Ziel wegen langer Kill-Time abgewertet.',30,10,75,1,false),
  n('combat.hardMaxKillSeconds','Kampf & Risiko','TTK Hard-Limit','Darüber kein normales Farmziel.',75,35,120,1,false),
  n('combat.maxKiteAdditionalAggro','Kampf & Risiko','Zusätzliche Kite-Aggro','Maximale zusätzliche Aggro für Kite-Risikominderung.',2,1,3,1,false),
  n('combat.kiteRiskMitigationScale','Kampf & Risiko','Kite-Risikominderung','Stärke der Risikoreduktion bei nachgewiesener Kite-Fähigkeit.',0.78,0.45,0.9,0.01,false),
  n('combat.maxKiteDeathsPerHour','Kampf & Risiko','Kite-Todesrate Maximum','Maximale historische Todesrate für aggressive Kite-Entscheidungen.',0.6,0.1,1,0.05,false),
  b('combat.dangerousContentFailClosed','Kampf & Risiko','Dangerous Content fail-closed','Quarantäne-/Dangerous-Content bleibt absolut gesperrt.',true,true,true),
  b('combat.emergencyRetreatPriority','Kampf & Risiko','Emergency Retreat hat Vorrang','Kein Brain/Formation/Economy-Modul darf Emergency Retreat überstimmen.',true,true,true),

  n('ranged.engagementFactor','Fernkampf & Kiting','Engagement-Range','Anteil der realen Range für Angriffsfreigabe.',0.94,0.82,0.98,0.01,false),
  n('ranged.desiredFactor','Fernkampf & Kiting','Bevorzugte Feuerdistanz','Zielabstand zum Gegner als Anteil der Range.',0.92,0.75,0.97,0.01,false),
  n('ranged.tooCloseFactor','Fernkampf & Kiting','Zu-nah Grenze','Darunter darf der Ranged-Charakter Abstand gewinnen.',0.84,0.6,0.92,0.01,false),
  n('ranged.firePositionTriggerFactor','Fernkampf & Kiting','Feuerpositions-Trigger','Nicht-Aggro-Ranged positionieren sich erst darunter neu.',0.8,0.6,0.9,0.01,false),
  n('ranged.moveCooldownMs','Fernkampf & Kiting','Range-Move Cooldown','Mindestabstand zwischen Range-Optimierungsbewegungen.',1200,500,5000,100,false),
  b('ranged.onlyAggroHolderKites','Fernkampf & Kiting','Nur Aggro-Holder kitet','Verhindert konkurrierende Kite-Controller.',true,true,true),

  b('skills.enabled','Skills & Ressourcen','Skills verwenden','Aktiviert die kontrollierte Skill-Rotation.',true,false,false),
  n('skills.mpReserveRatio','Skills & Ressourcen','MP-Reserve','MP-Anteil für wichtige Skills und Notfälle.',0.15,0,0.6,0.01,false),
  n('skills.minIntervalMs','Skills & Ressourcen','Skill-Minimumintervall','Mindestzeit zwischen Skill-Versuchen.',120,50,2000,10,false),
  n('skills.failureBackoffMs','Skills & Ressourcen','Skill-Fehler Backoff','Startwert für Backoff nach Fehlern.',750,100,10000,50,false),
  n('skills.failureBackoffMultiplier','Skills & Ressourcen','Backoff Multiplikator','Exponentieller Faktor bei wiederholten Skill-Fehlern.',1.8,1,4,0.1,false),

  s('farming.targetPolicy','Farming & Ziele','Zielrichtlinie','Grundpolicy der Farmer-Zielauswahl.','party-only',['party-only','safe-any'],true),
  b('farming.reassessmentEnabled','Farming & Ziele','Ziele neu bewerten','Periodische Neubewertung des aktiven Ziels.',true,false,false),
  n('farming.reassessmentMinIntervalMs','Farming & Ziele','Reassessment Intervall','Minimaler Abstand zwischen Neubewertungen.',1500,500,15000,100,false),
  n('farming.switchCooldownMs','Farming & Ziele','Target-Switch Cooldown','Verhindert hektisches Umschalten.',5000,1000,30000,500,false),
  n('farming.maxTravelSeconds','Farming & Ziele','Maximale Farm-Anreise','Normalisierungslimit für Reiseaufwand.',600,30,3600,30,false),

  b('recovery.safeRetreatEnabled','Travel & Recovery','Safe Retreat','Kontrolliertes lokales Ausweichen bei Notfällen.',true,false,false),
  n('recovery.retreatMinStep','Travel & Recovery','Retreat Min-Step','Kleinste Retreat-Bewegung.',25,5,100,5,false),
  n('recovery.retreatMaxStep','Travel & Recovery','Retreat Max-Step','Größte Retreat-Bewegung.',120,30,250,5,false),
  n('recovery.maxThreats','Travel & Recovery','Retreat Threat-Limit','Maximale Gegnerzahl für Retreat-Geometrie.',6,1,12,1,false),

  n('merchant.lowFreeSlots','Merchant & Service','Inventardruck ab','Unterhalb dieser freien Slots startet Home-/Bank-Service.',8,2,20,1,true),
  n('merchant.targetFreeSlots','Merchant & Service','Ziel freie Slots','Zielwert nach Bank-/Bereinigungsservice.',14,4,30,1,true),
  n('merchant.potionLow','Merchant & Service','Potion Low','Unterer Vorrat für Restock-Priorität.',1500,50,10000,50,true),
  n('merchant.potionTarget','Merchant & Service','Potion Ziel','Zielbestand beim Restock.',6000,100,20000,100,true),
  n('merchant.goldReserve','Merchant & Service','Goldreserve','Goldreserve für sichere Operationen.',1000000,0,100000000,100000,true),
  n('merchant.transferRange','Merchant & Service','Transferreichweite','Maximale Distanz kontrollierter Transfers.',400,100,600,10,true),
  b('merchant.economyOwnsMovement','Merchant & Service','Economy besitzt Movement-Autorität','Verhindert konkurrierende Merchant-Bewegungscontroller.',true,true,true),

  n('economy.keepValue','Economy, Gear & Markt','High-Value Keep/Bank','Wertgrenze für konservatives Keep/Bank.',1000000,1000,100000000,50000,true),
  n('economy.upgradeCap','Economy, Gear & Markt','Upgrade Kostenlimit','Budgetrahmen für autonome Upgrades.',2000000,0,100000000,100000,true),
  n('economy.compoundCap','Economy, Gear & Markt','Compound Kostenlimit','Budgetrahmen für autonome Compounds.',500000,0,100000000,50000,true),
  n('economy.maxUpgrade','Economy, Gear & Markt','Max Upgrade Level','Routine-Obergrenze autonomer Upgrades.',2,0,4,1,true),
  n('economy.maxCompound','Economy, Gear & Markt','Max Compound Level','Routine-Obergrenze autonomer Compounds.',1,0,3,1,true),
  n('economy.marketMaxTrackedItems','Economy, Gear & Markt','Markt-History Items','Maximal persistent beobachtete Item-Arten.',96,24,256,8,false),
  n('economy.marketMaxSamples','Economy, Gear & Markt','Markt-Samples/Item','Historische Beobachtungen je Item.',48,8,128,4,false),
  n('economy.gearGoalFreshMs','Economy, Gear & Markt','Gear-Goal Frische','Maximales Alter eines Ausrüstungsziels.',30000,5000,180000,5000,false),
  b('economy.journaledMutationsOnly','Economy, Gear & Markt','Nur journaled Mutations','Upgrade/Compound/Bank bleiben persist-before-action und verifiziert.',true,true,true),

  b('brain.enabled','Gehirn & Lernen','Strategisches Gehirn','Student, Replay, Outcome-Lernen und Teacher-Bridge.',true,false,true),
  s('brain.mode','Gehirn & Lernen','Brain-Modus','Shadow lernt ohne Strategie-Autorität; Canary ist vorbereitet, aber weiterhin Safety-gated.','shadow',['shadow','canary'],true),
  b('brain.teacherEnabled','Gehirn & Lernen','Cloudflare Teacher','Budgetierte Qwen-Teacher-Abfragen erlauben.',true,false,true),
  n('brain.dailyNeuronLimit','Gehirn & Lernen','Neurons pro UTC-Tag','Harte Workers-AI Tagesobergrenze.',10000,500,10000,100,true),
  n('brain.budgetTargetFraction','Gehirn & Lernen','Budget-Zielanteil','Geplanter Verbrauch; Rest bleibt Sicherheitsreserve.',0.995,0.5,0.995,0.005,true),
  n('brain.teacherMinIntervalMs','Gehirn & Lernen','Teacher Min-Intervall','Untergrenze zwischen Teacher-Aufrufen.',30000,5000,600000,5000,true),
  n('brain.teacherMaxIntervalMs','Gehirn & Lernen','Teacher Max-Intervall','Späteste Neubewertung bei verfügbarem Budget.',300000,30000,1800000,10000,true),
  n('brain.entropyTeacherThreshold','Gehirn & Lernen','Unsicherheits-Trigger','Hohe Student-Entropie priorisiert Teacher.',0.72,0.2,0.98,0.01,true),
  n('brain.noveltyTeacherThreshold','Gehirn & Lernen','Novelty-Trigger','Neue Situationen priorisieren Teacher.',0.45,0.05,0.95,0.01,true),
  n('brain.replayCapacity','Gehirn & Lernen','Experience Replay','Maximale lokale Lernbeispiele.',512,64,4096,64,false),
  n('brain.replayBatchSize','Gehirn & Lernen','Replay Batch','Lernbeispiele pro Replay-Schritt.',12,2,64,1,true),
  n('brain.learningRate','Gehirn & Lernen','Student Lernrate','SGD-Lernrate des 32→24→5 Netzes.',0.012,0.001,0.08,0.001,true),
  n('brain.outcomeWindowMs','Gehirn & Lernen','Outcome-Fenster','Zeit bis zur realen Strategiebewertung.',60000,15000,600000,5000,true),
  n('brain.championMinSamples','Gehirn & Lernen','Champion Mindest-Samples','Mindesttraining vor erstem Champion.',120,32,2000,8,true),
  n('brain.challengerLossImprovement','Gehirn & Lernen','Challenger Loss-Vorteil','Minimaler Validierungs-Loss-Vorteil für Promotion.',0.04,0.005,0.3,0.005,true),
  n('brain.diaryMaxEntries','Gehirn & Lernen','Gehirn-Tagebuch','Anzahl nachvollziehbarer Lern-/Teacher-/League-Einträge.',100,20,300,10,true),
  b('brain.directExecutorAccess','Gehirn & Lernen','Direkter Executor-Zugriff','Brain darf lokale Safety-/Executor-Schichten niemals umgehen.',false,true,true),
  b('brain.deterministicFallback','Gehirn & Lernen','Deterministischer Fallback','Bei Cloud-/Qualitätsfehler bleibt der lokale Planner maßgeblich.',true,true,true),

  b('cloud.enabled','Cloud & Telemetrie','Cloud Control Plane','D1-Sync, Dashboard-Telemetrie und Teacher-Bridge.',false,false,true),
  n('cloud.runtimePushMs','Cloud & Telemetrie','Runtime Push','Intervall kompakter Status-Snapshots.',5000,2000,60000,1000,true),
  n('cloud.configPullMs','Cloud & Telemetrie','Config Pull','Intervall für Settings-Sync.',15000,5000,300000,5000,true),
  n('cloud.eventBatchSize','Cloud & Telemetrie','Event Batch','Maximale Eventanzahl pro Upload.',80,10,250,10,true),
  n('cloud.dashboardRefreshMs','Cloud & Telemetrie','Dashboard Refresh','Empfohlenes Live-Refresh-Intervall.',3000,1000,30000,500,true),
  b('cloud.secretsNeverSync','Cloud & Telemetrie','Secrets nie synchronisieren','READ/WRITE/ADMIN-Key landen nie in D1 oder Status.',true,true,true),
  b('cloud.offlineSafeLocal','Cloud & Telemetrie','Cloud-Ausfall = lokal sicher weiter','Cloudfehler blockieren lokale Safety nie.',true,true,true)
]);

export const SETTINGS_BY_KEY = new Map(SETTINGS_SCHEMA.map((row) => [row.key, row]));
export const defaultSettings = () => Object.fromEntries(SETTINGS_SCHEMA.map((row) => [row.key, row.default]));

export function normalizeSetting(def, value) {
  if (!def) return undefined;
  if (def.locked) return def.default;
  if (def.type === 'boolean') return value === true || value === 'true' || value === 1;
  if (def.type === 'select') return def.values.includes(String(value)) ? String(value) : def.default;
  let x = Number(value); if (!Number.isFinite(x)) x = Number(def.default); if (def.min != null) x = Math.max(def.min, x); if (def.max != null) x = Math.min(def.max, x); return x;
}

export function sanitizeSettingsPatch(patch = {}) {
  const accepted = {}, rejected = [];
  for (const [key, value] of Object.entries(patch || {})) {
    const def = SETTINGS_BY_KEY.get(key);
    if (!def) { rejected.push({ key, reason: 'UNKNOWN_SETTING' }); continue; }
    if (def.locked && value !== def.default) { rejected.push({ key, reason: 'SAFETY_LOCKED' }); continue; }
    accepted[key] = normalizeSetting(def, value);
  }
  return { accepted, rejected };
}
