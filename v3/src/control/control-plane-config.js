'use strict';

const CONTROL_SCHEMA_VERSION = 1;
const STORAGE_KEY = 'aio-v3:control-plane-config:v1';

const DEFINITIONS = Object.freeze([
  // Runtime
  { key: 'runtime.tickMs', category: 'Runtime', label: 'Runtime-Tick', description: 'Grundtakt der lokalen Runtime in Millisekunden.', type: 'number', default: 250, min: 100, max: 2000, step: 50, hot: true, option: 'tickMs', runtimePath: 'tickMs' },
  { key: 'runtime.visibleStatus', category: 'Runtime', label: 'Sichtbare Statusmeldungen', description: 'Schreibt wichtige Zustände zusätzlich in den Adventure-Land-Game-Log.', type: 'boolean', default: true, hot: true, option: 'visibleStatus', runtimePath: 'visibleStatusEnabled' },
  { key: 'runtime.brainAuditMs', category: 'Runtime', label: 'Brain-Auswertungsintervall', description: 'Wie oft das strategische Gehirn eine neue Situation bewertet.', type: 'number', default: 5000, min: 1000, max: 60000, step: 500, hot: true, option: 'brainAuditMs', runtimePath: 'brainAuditMs' },
  { key: 'runtime.logCapacity', category: 'Runtime', label: 'Event-Log Kapazität', description: 'Maximale lokale Event-Anzahl. Wirkt nach Neustart.', type: 'number', default: 4000, min: 500, max: 20000, step: 500, hot: false, option: 'logCapacity' },

  // Party / formation
  { key: 'party.cohesionRadius', category: 'Party & Formation', label: 'Kohäsionsradius', description: 'Maximaler gewünschter Paarabstand der Kampfgruppe.', type: 'number', default: 150, min: 80, max: 280, step: 5, hot: false },
  { key: 'party.hardRegroupExtraRadius', category: 'Party & Formation', label: 'Hard-Regroup Zusatzradius', description: 'Zusätzlicher Puffer, bevor Formation einen harten Regroup erzwingt.', type: 'number', default: 45, min: 10, max: 140, step: 5, hot: false },
  { key: 'party.committedPullExtraRadius', category: 'Party & Formation', label: 'Committed-Pull Puffer', description: 'Milde Kohäsionsdrift, die bei bereits sicher begonnenem Pull toleriert wird.', type: 'number', default: 60, min: 0, max: 120, step: 5, hot: false },
  { key: 'party.committedPullAbsoluteMaxRadius', category: 'Party & Formation', label: 'Committed-Pull Maximalradius', description: 'Absolute Obergrenze für die Pull-Fortsetzung.', type: 'number', default: 220, min: 120, max: 320, step: 5, hot: false },
  { key: 'party.requireCompleteTeamForFreshPull', category: 'Party & Formation', label: 'Vollständige Gruppe für neue Pulls', description: 'Neue Pulls nur bei vollständiger, lebender und lokalisierter Kampfgruppe.', type: 'boolean', default: true, locked: true, hot: true },
  { key: 'party.commandCharacterActiveOnly', category: 'Party & Formation', label: 'Remote-Autorität nur für aktive Charaktere', description: 'PR-97 Sicherheitsinvariante: Diagnose-Sichtbarkeit erweitert keine Befehlsautorität.', type: 'boolean', default: true, locked: true, hot: true },

  // Combat / risk
  { key: 'combat.riskThreshold', category: 'Kampf & Risiko', label: 'Risikoschwelle', description: 'Grundschwelle des lokalen Combat-Risk-Gates.', type: 'number', default: 0.65, min: 0.2, max: 0.95, step: 0.01, hot: true, runtimePath: 'combatRisk.threshold', option: 'combatRiskThreshold' },
  { key: 'combat.recoveryHpRatio', category: 'Kampf & Risiko', label: 'Recovery-HP', description: 'Unterhalb dieses HP-Anteils wird die Auswahl konservativer.', type: 'number', default: 0.75, min: 0.35, max: 0.95, step: 0.01, hot: false, option: 'farmerRecoverHpRatio' },
  { key: 'combat.emergencyCriticalHpRatio', category: 'Kampf & Risiko', label: 'Kritische HP', description: 'Harte Notfallgrenze für Retreat-/Emergency-Logik.', type: 'number', default: 0.25, min: 0.1, max: 0.6, step: 0.01, hot: false, option: 'combatEmergencyCriticalHpRatio' },
  { key: 'combat.multiAggroHpRatio', category: 'Kampf & Risiko', label: 'Multi-Aggro HP-Grenze', description: 'HP-Grenze für aggressivere Emergency-Bewertung bei mehreren Gegnern.', type: 'number', default: 0.55, min: 0.25, max: 0.9, step: 0.01, hot: false, option: 'combatEmergencyMultiAggroHpRatio' },
  { key: 'combat.multiAggroCount', category: 'Kampf & Risiko', label: 'Multi-Aggro Anzahl', description: 'Ab wie vielen Gegnern die Multi-Aggro-Notfalllogik greift.', type: 'number', default: 2, min: 2, max: 8, step: 1, hot: false, option: 'combatEmergencyMultiAggroCount' },
  { key: 'combat.softKillSeconds', category: 'Kampf & Risiko', label: 'TTK Soft-Limit', description: 'Ab dieser erwarteten Kill-Time wird ein Ziel zunehmend abgewertet.', type: 'number', default: 30, min: 10, max: 75, step: 1, hot: true },
  { key: 'combat.hardMaxKillSeconds', category: 'Kampf & Risiko', label: 'TTK Hard-Limit', description: 'Ziele oberhalb dieser erwarteten Kill-Time werden für Routine-Farming verworfen.', type: 'number', default: 75, min: 35, max: 120, step: 1, hot: true },
  { key: 'combat.maxKiteAdditionalAggro', category: 'Kampf & Risiko', label: 'Zusätzliche Kite-Aggro', description: 'Maximale Zusatzgegner, deren Risiko bei starkem Ranged-Kiter reduziert werden darf.', type: 'number', default: 2, min: 1, max: 3, step: 1, hot: true },
  { key: 'combat.kiteRiskMitigationScale', category: 'Kampf & Risiko', label: 'Kite-Risikominderung', description: 'Wie stark nachgewiesene Kite-Fähigkeit den zusätzlichen Aggro-Anteil reduziert.', type: 'number', default: 0.78, min: 0.45, max: 0.9, step: 0.01, hot: true },
  { key: 'combat.maxKiteDeathsPerHour', category: 'Kampf & Risiko', label: 'Kite-Todesrate Maximum', description: 'Obergrenze historischer Todesrate für risikofreudige Kite-Entscheidungen.', type: 'number', default: 0.6, min: 0.1, max: 1, step: 0.05, hot: true },
  { key: 'combat.dangerousContentFailClosed', category: 'Kampf & Risiko', label: 'Gefährlicher Content fail-closed', description: 'Dangerous-/Quarantine-Content kann durch Brain oder Risikominderung niemals freigegeben werden.', type: 'boolean', default: true, locked: true, hot: true },
  { key: 'combat.emergencyRetreatPriority', category: 'Kampf & Risiko', label: 'Emergency Retreat hat Vorrang', description: 'Notfall-Retreat darf niemals von Brain/Formation/Economy überstimmt werden.', type: 'boolean', default: true, locked: true, hot: true },

  // Ranged & kiting
  { key: 'ranged.engagementFactor', category: 'Fernkampf & Kiting', label: 'Engagement-Range', description: 'Anteil der realen Klassenreichweite, ab dem ein Fernkämpfer feuern darf.', type: 'number', default: 0.94, min: 0.82, max: 0.98, step: 0.01, hot: true },
  { key: 'ranged.desiredFactor', category: 'Fernkampf & Kiting', label: 'Bevorzugte Feuerdistanz', description: 'Zielabstand zur Nutzung nahezu maximaler Reichweite.', type: 'number', default: 0.92, min: 0.75, max: 0.97, step: 0.01, hot: true },
  { key: 'ranged.tooCloseFactor', category: 'Fernkampf & Kiting', label: 'Zu-nah Grenze', description: 'Unterhalb dieses Range-Anteils darf der Ranged-Charakter Abstand gewinnen.', type: 'number', default: 0.84, min: 0.6, max: 0.92, step: 0.01, hot: true },
  { key: 'ranged.firePositionTriggerFactor', category: 'Fernkampf & Kiting', label: 'Feuerpositions-Trigger', description: 'Nicht-Aggro-Ranged repositionieren erst unterhalb dieses Range-Anteils.', type: 'number', default: 0.8, min: 0.6, max: 0.9, step: 0.01, hot: true },
  { key: 'ranged.moveCooldownMs', category: 'Fernkampf & Kiting', label: 'Range-Move Cooldown', description: 'Mindestabstand zwischen Range-Optimierungsbewegungen.', type: 'number', default: 1200, min: 500, max: 5000, step: 100, hot: true },
  { key: 'ranged.onlyAggroHolderKites', category: 'Fernkampf & Kiting', label: 'Nur Aggro-Holder kitet', description: 'Verhindert konkurrierende Kite-Controller und Formation-Pingpong.', type: 'boolean', default: true, locked: true, hot: true },

  // Skills/resources
  { key: 'skills.enabled', category: 'Skills & Ressourcen', label: 'Skills verwenden', description: 'Aktiviert die kontrollierte Skill-Rotation.', type: 'boolean', default: true, hot: false, option: 'farmerSkillUsageEnabled' },
  { key: 'skills.mpReserveRatio', category: 'Skills & Ressourcen', label: 'MP-Reserve', description: 'MP-Anteil, der für wichtige Skills/Notfälle zurückgehalten wird.', type: 'number', default: 0.15, min: 0, max: 0.6, step: 0.01, hot: false, option: 'farmerSkillUsageMpReserveRatio' },
  { key: 'skills.minIntervalMs', category: 'Skills & Ressourcen', label: 'Skill-Minimumintervall', description: 'Mindestzeit zwischen Skill-Ausführungsversuchen.', type: 'number', default: 120, min: 50, max: 2000, step: 10, hot: false, option: 'farmerSkillUsageMinIntervalMs' },
  { key: 'skills.failureBackoffMs', category: 'Skills & Ressourcen', label: 'Skill-Fehler Backoff', description: 'Startwert für Backoff nach fehlgeschlagenem Skill.', type: 'number', default: 750, min: 100, max: 10000, step: 50, hot: false, option: 'farmerSkillUsageFailureBackoffMs' },
  { key: 'skills.failureBackoffMultiplier', category: 'Skills & Ressourcen', label: 'Backoff Multiplikator', description: 'Exponentieller Faktor bei wiederholten Skill-Fehlern.', type: 'number', default: 1.8, min: 1, max: 4, step: 0.1, hot: false, option: 'farmerSkillUsageFailureBackoffMultiplier' },

  // Farming
  { key: 'farming.targetPolicy', category: 'Farming & Ziele', label: 'Zielrichtlinie', description: 'Grundpolicy für Farmer-Zielauswahl.', type: 'select', values: ['party-only','safe-any'], default: 'party-only', hot: true, runtimeMethod: 'setFarmerTargetPolicy', option: 'farmerTargetPolicy' },
  { key: 'farming.reassessmentEnabled', category: 'Farming & Ziele', label: 'Ziele neu bewerten', description: 'Erlaubt periodische Neubewertung des aktiven Ziels.', type: 'boolean', default: true, hot: false, option: 'farmerTargetReassessmentEnabled' },
  { key: 'farming.reassessmentMinIntervalMs', category: 'Farming & Ziele', label: 'Reassessment Intervall', description: 'Minimaler Abstand zwischen Neubewertungen.', type: 'number', default: 1500, min: 500, max: 15000, step: 100, hot: false, option: 'farmerTargetReassessmentMinIntervalMs' },
  { key: 'farming.switchCooldownMs', category: 'Farming & Ziele', label: 'Target-Switch Cooldown', description: 'Verhindert hektisches Umschalten zwischen ähnlich guten Zielen.', type: 'number', default: 5000, min: 1000, max: 30000, step: 500, hot: false, option: 'farmerTargetReassessmentSwitchCooldownMs' },
  { key: 'farming.maxTravelSeconds', category: 'Farming & Ziele', label: 'Maximale Farm-Anreise', description: 'Normalisierungslimit für Reiseaufwand in Brain/Planner.', type: 'number', default: 600, min: 30, max: 3600, step: 30, hot: false, option: 'brainMaxTravelSeconds' },

  // Travel/recovery
  { key: 'recovery.safeRetreatEnabled', category: 'Travel & Recovery', label: 'Safe Retreat', description: 'Aktiviert kontrolliertes lokales Ausweichen bei Notfällen.', type: 'boolean', default: true, hot: false, option: 'farmerSafeRetreatEnabled' },
  { key: 'recovery.retreatMinStep', category: 'Travel & Recovery', label: 'Retreat Min-Step', description: 'Kleinste Retreat-Bewegung.', type: 'number', default: 25, min: 5, max: 100, step: 5, hot: false, option: 'farmerSafeRetreatMinStep' },
  { key: 'recovery.retreatMaxStep', category: 'Travel & Recovery', label: 'Retreat Max-Step', description: 'Größte Retreat-Bewegung.', type: 'number', default: 120, min: 30, max: 250, step: 5, hot: false, option: 'farmerSafeRetreatMaxStep' },
  { key: 'recovery.maxThreats', category: 'Travel & Recovery', label: 'Retreat Threat-Limit', description: 'Maximale Gegnerzahl für die lokale Retreat-Geometrie.', type: 'number', default: 6, min: 1, max: 12, step: 1, hot: false, option: 'farmerSafeRetreatMaxThreats' },

  // Merchant
  { key: 'merchant.lowFreeSlots', category: 'Merchant & Service', label: 'Inventardruck ab', description: 'Unterhalb dieser freien Slots beginnt Home-/Bank-Service.', type: 'number', default: 8, min: 2, max: 20, step: 1, hot: true },
  { key: 'merchant.targetFreeSlots', category: 'Merchant & Service', label: 'Ziel freie Slots', description: 'Zielwert nach Bank-/Bereinigungsservice.', type: 'number', default: 14, min: 4, max: 30, step: 1, hot: true },
  { key: 'merchant.potionLow', category: 'Merchant & Service', label: 'Potion Low', description: 'Unterer Vorrat, ab dem Restock priorisiert wird.', type: 'number', default: 1500, min: 50, max: 10000, step: 50, hot: true },
  { key: 'merchant.potionTarget', category: 'Merchant & Service', label: 'Potion Ziel', description: 'Zielbestand beim Restock.', type: 'number', default: 6000, min: 100, max: 20000, step: 100, hot: true },
  { key: 'merchant.goldReserve', category: 'Merchant & Service', label: 'Goldreserve', description: 'Gold, das der Merchant für sichere Operationen zurückhält.', type: 'number', default: 1000000, min: 0, max: 100000000, step: 100000, hot: true },
  { key: 'merchant.transferRange', category: 'Merchant & Service', label: 'Transferreichweite', description: 'Maximale Distanz für kontrollierte direkte Transfers.', type: 'number', default: 400, min: 100, max: 600, step: 10, hot: true },
  { key: 'merchant.economyOwnsMovement', category: 'Merchant & Service', label: 'Economy besitzt Movement-Autorität', description: 'Verhindert konkurrierende Logistics-/Home-Service-Bewegung.', type: 'boolean', default: true, locked: true, hot: true },

  // Economy
  { key: 'economy.keepValue', category: 'Economy, Gear & Markt', label: 'High-Value Keep/Bank', description: 'Wertgrenze, oberhalb der Items nicht leichtfertig verkauft werden.', type: 'number', default: 1000000, min: 1000, max: 100000000, step: 50000, hot: true },
  { key: 'economy.upgradeCap', category: 'Economy, Gear & Markt', label: 'Upgrade Kostenlimit', description: 'Maximaler konservativer Budgetrahmen für Upgrade-Kandidaten.', type: 'number', default: 2000000, min: 0, max: 100000000, step: 100000, hot: true },
  { key: 'economy.compoundCap', category: 'Economy, Gear & Markt', label: 'Compound Kostenlimit', description: 'Maximaler konservativer Budgetrahmen für Compound-Kandidaten.', type: 'number', default: 500000, min: 0, max: 100000000, step: 50000, hot: true },
  { key: 'economy.maxUpgrade', category: 'Economy, Gear & Markt', label: 'Max Upgrade Level', description: 'Maximales Ergebnislevel autonomer Upgrades. Aktuelle v3-Progressionsgrenze: +7.', type: 'number', default: 2, min: 0, max: 7, step: 1, hot: true },
  { key: 'economy.maxCompound', category: 'Economy, Gear & Markt', label: 'Max Compound Level', description: 'Maximales Ergebnislevel autonomer Compounds. Aktuelle v3-Progressionsgrenze: +10.', type: 'number', default: 1, min: 0, max: 10, step: 1, hot: true },
  { key: 'economy.marketMaxTrackedItems', category: 'Economy, Gear & Markt', label: 'Markt-History Items', description: 'Maximal persistent beobachtete Item-Arten.', type: 'number', default: 96, min: 24, max: 256, step: 8, hot: false },
  { key: 'economy.marketMaxSamples', category: 'Economy, Gear & Markt', label: 'Markt-Samples/Item', description: 'Maximale historische Beobachtungen je Item.', type: 'number', default: 48, min: 8, max: 128, step: 4, hot: false },
  { key: 'economy.gearGoalFreshMs', category: 'Economy, Gear & Markt', label: 'Gear-Goal Frische', description: 'Maximales Alter eines Ausrüstungsziels für Transfers.', type: 'number', default: 30000, min: 5000, max: 180000, step: 5000, hot: false },
  { key: 'economy.journaledMutationsOnly', category: 'Economy, Gear & Markt', label: 'Nur journaled Mutations', description: 'Upgrade/Compound/Bank-Aktionen bleiben persist-before-action und verifiziert.', type: 'boolean', default: true, locked: true, hot: true },

  // Brain
  { key: 'brain.enabled', category: 'Gehirn & Lernen', label: 'Strategisches Gehirn', description: 'Aktiviert Beobachtung, Student-Lernen und Teacher-Sync.', type: 'boolean', default: true, hot: true },
  { key: 'brain.mode', category: 'Gehirn & Lernen', label: 'Brain-Modus', description: 'Shadow lernt ohne Strategie-Autorität. Canary ist für spätere kontrollierte Freigabe reserviert.', type: 'select', values: ['shadow','canary'], default: 'shadow', hot: true },
  { key: 'brain.teacherEnabled', category: 'Gehirn & Lernen', label: 'Cloudflare Teacher', description: 'Erlaubt budgetierte strategische Qwen-Teacher-Abfragen.', type: 'boolean', default: true, hot: true },
  { key: 'brain.dailyNeuronLimit', category: 'Gehirn & Lernen', label: 'Neurons pro UTC-Tag', description: 'Harte Workers-AI Tagesobergrenze.', type: 'number', default: 10000, min: 500, max: 10000, step: 100, hot: true },
  { key: 'brain.budgetTargetFraction', category: 'Gehirn & Lernen', label: 'Budget-Zielanteil', description: 'Geplanter Tagesverbrauch; Rest bleibt als Sicherheitsreserve.', type: 'number', default: 0.995, min: 0.5, max: 0.995, step: 0.005, hot: true },
  { key: 'brain.teacherMinIntervalMs', category: 'Gehirn & Lernen', label: 'Teacher Min-Intervall', description: 'Untergrenze zwischen Cloud-Teacher-Aufrufen.', type: 'number', default: 30000, min: 5000, max: 600000, step: 5000, hot: true },
  { key: 'brain.teacherMaxIntervalMs', category: 'Gehirn & Lernen', label: 'Teacher Max-Intervall', description: 'Spätestens nach diesem Zeitraum wird bei Budgetverfügbarkeit neu gelehrt.', type: 'number', default: 300000, min: 30000, max: 1800000, step: 10000, hot: true },
  { key: 'brain.entropyTeacherThreshold', category: 'Gehirn & Lernen', label: 'Unsicherheits-Trigger', description: 'Hohe Student-Entropie priorisiert einen Teacher-Aufruf.', type: 'number', default: 0.72, min: 0.2, max: 0.98, step: 0.01, hot: true },
  { key: 'brain.noveltyTeacherThreshold', category: 'Gehirn & Lernen', label: 'Novelty-Trigger', description: 'Neue Situationen werden bevorzugt vom Teacher bewertet.', type: 'number', default: 0.45, min: 0.05, max: 0.95, step: 0.01, hot: true },
  { key: 'brain.replayCapacity', category: 'Gehirn & Lernen', label: 'Experience Replay', description: 'Maximale lokale Lernbeispiele.', type: 'number', default: 512, min: 64, max: 4096, step: 64, hot: false },
  { key: 'brain.replayBatchSize', category: 'Gehirn & Lernen', label: 'Replay Batch', description: 'Lernbeispiele pro Replay-Trainingsschritt.', type: 'number', default: 12, min: 2, max: 64, step: 1, hot: true },
  { key: 'brain.learningRate', category: 'Gehirn & Lernen', label: 'Student Lernrate', description: 'SGD-Lernrate des lokalen 32→24→5 Student-Netzes.', type: 'number', default: 0.012, min: 0.001, max: 0.08, step: 0.001, hot: true },
  { key: 'brain.outcomeWindowMs', category: 'Gehirn & Lernen', label: 'Outcome-Fenster', description: 'Zeitfenster bis eine Strategie anhand realer Wirkung bewertet wird.', type: 'number', default: 60000, min: 15000, max: 600000, step: 5000, hot: true },
  { key: 'brain.championMinSamples', category: 'Gehirn & Lernen', label: 'Champion Mindest-Samples', description: 'Mindestmenge Training vor erstem eingefrorenen Champion.', type: 'number', default: 120, min: 32, max: 2000, step: 8, hot: true },
  { key: 'brain.challengerLossImprovement', category: 'Gehirn & Lernen', label: 'Challenger Loss-Vorteil', description: 'Minimaler relativer Validierungs-Loss-Vorteil für Promotion.', type: 'number', default: 0.04, min: 0.005, max: 0.3, step: 0.005, hot: true },
  { key: 'brain.diaryMaxEntries', category: 'Gehirn & Lernen', label: 'Gehirn-Tagebuch', description: 'Anzahl nachvollziehbarer Lern-/Teacher-/League-Einträge.', type: 'number', default: 100, min: 20, max: 300, step: 10, hot: true },
  { key: 'brain.directExecutorAccess', category: 'Gehirn & Lernen', label: 'Direkter Executor-Zugriff', description: 'Brain darf niemals lokale Safety-/Executor-Schichten umgehen.', type: 'boolean', default: false, locked: true, hot: true },
  { key: 'brain.deterministicFallback', category: 'Gehirn & Lernen', label: 'Deterministischer Fallback', description: 'Bei Cloud-/Qualitäts-/Modellfehlern bleibt der bestehende Planner maßgeblich.', type: 'boolean', default: true, locked: true, hot: true },

  // Cloud/telemetry
  { key: 'cloud.enabled', category: 'Cloud & Telemetrie', label: 'Cloud Control Plane', description: 'Aktiviert D1-Sync, Dashboard-Telemetrie und Teacher-Bridge.', type: 'boolean', default: false, hot: true },
  { key: 'cloud.runtimePushMs', category: 'Cloud & Telemetrie', label: 'Runtime Push', description: 'Intervall für kompakte Status-Snapshots an D1.', type: 'number', default: 5000, min: 2000, max: 60000, step: 1000, hot: true },
  { key: 'cloud.configPullMs', category: 'Cloud & Telemetrie', label: 'Config Pull', description: 'Intervall für Dashboard-Konfigurationsabgleich.', type: 'number', default: 15000, min: 5000, max: 300000, step: 5000, hot: true },
  { key: 'cloud.eventBatchSize', category: 'Cloud & Telemetrie', label: 'Event Batch', description: 'Maximale Eventanzahl pro Cloud-Upload.', type: 'number', default: 80, min: 10, max: 250, step: 10, hot: true },
  { key: 'cloud.dashboardRefreshMs', category: 'Cloud & Telemetrie', label: 'Dashboard Refresh', description: 'Empfohlenes UI-Live-Refresh-Intervall.', type: 'number', default: 3000, min: 1000, max: 30000, step: 500, hot: true },
  { key: 'cloud.secretsNeverSync', category: 'Cloud & Telemetrie', label: 'Secrets nie synchronisieren', description: 'READ/WRITE/ADMIN-Key werden weder in D1 noch in Runtime-Status gespeichert.', type: 'boolean', default: true, locked: true, hot: true },
  { key: 'cloud.offlineSafeLocal', category: 'Cloud & Telemetrie', label: 'Cloud-Ausfall = lokal sicher weiter', description: 'Cloudfehler dürfen lokale Kampf-/Safety-Funktionen nicht blockieren.', type: 'boolean', default: true, locked: true, hot: true }
]);

const BY_KEY = new Map(DEFINITIONS.map((x) => [x.key, x]));

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function finite(value, fallback) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function getPath(root, path) { let cur = root; for (const p of String(path || '').split('.').filter(Boolean)) { if (cur == null) return undefined; cur = cur[p]; } return cur; }
function setPath(root, path, value) {
  const parts = String(path || '').split('.').filter(Boolean); if (!parts.length) return false;
  let cur = root; for (let i = 0; i < parts.length - 1; i += 1) { if (!cur || !(parts[i] in cur)) return false; cur = cur[parts[i]]; }
  if (!cur || !(parts[parts.length - 1] in cur)) return false; cur[parts[parts.length - 1]] = value; return true;
}
function normalize(def, value) {
  if (def.locked) return def.default;
  if (def.type === 'boolean') return value === true || value === 'true' || value === 1;
  if (def.type === 'number') { let n = finite(value, def.default); if (def.min != null) n = Math.max(def.min, n); if (def.max != null) n = Math.min(def.max, n); return n; }
  if (def.type === 'select') return Array.isArray(def.values) && def.values.includes(String(value)) ? String(value) : def.default;
  return value == null ? def.default : String(value);
}
function defaults() { const out = {}; for (const def of DEFINITIONS) out[def.key] = def.default; return out; }
function sanitize(values = {}) { const out = defaults(); for (const [key, value] of Object.entries(values || {})) { const def = BY_KEY.get(key); if (def) out[key] = normalize(def, value); } return out; }
function storage(root = globalThis) { try { return root && (root.localStorage || root.parent && root.parent.localStorage) || null; } catch (_) { return null; } }
function loadStored(root = globalThis) {
  const s = storage(root); if (!s) return { values: defaults(), revision: 0, updatedAt: 0 };
  try { const parsed = JSON.parse(s.getItem(STORAGE_KEY) || '{}'); return { values: sanitize(parsed.values || parsed.config || {}), revision: Math.max(0, finite(parsed.revision, 0)), updatedAt: Math.max(0, finite(parsed.updatedAt, 0)) }; } catch (_) { return { values: defaults(), revision: 0, updatedAt: 0 }; }
}
function saveStored(root, state) { const s = storage(root); if (!s) return false; try { s.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch (_) { return false; } }
function bootOptions(root = globalThis, base = {}) {
  const stored = loadStored(root).values; const next = { ...base };
  for (const def of DEFINITIONS) if (def.option && stored[def.key] != null) next[def.option] = stored[def.key];
  return next;
}

class ControlPlaneConfig {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    const stored = loadStored(this.root);
    this.values = sanitize({ ...stored.values, ...(options.initial || {}) });
    this.revision = stored.revision || 0;
    this.updatedAt = stored.updatedAt || 0;
    this.lastSource = stored.updatedAt ? 'local-storage' : 'defaults';
    this.stats = { patches: 0, rejected: 0, hotApplied: 0, restartRequired: 0, saves: 0, saveErrors: 0 };
  }
  get(key, fallback) { return this.values[key] == null ? fallback : this.values[key]; }
  schema() { return DEFINITIONS.map((def) => ({ ...def, current: this.get(def.key, def.default) })); }
  patch(input = {}, meta = {}) {
    const next = { ...this.values }; const changed = []; const rejected = [];
    for (const [key, raw] of Object.entries(input || {})) {
      const def = BY_KEY.get(key);
      if (!def) { rejected.push({ key, reason: 'UNKNOWN_SETTING' }); continue; }
      if (def.locked && raw !== def.default) { rejected.push({ key, reason: 'SAFETY_LOCKED' }); continue; }
      const value = normalize(def, raw); if (JSON.stringify(next[key]) !== JSON.stringify(value)) { next[key] = value; changed.push({ key, value, hot: def.hot !== false }); }
    }
    this.values = next;
    if (meta.revision != null) this.revision = Math.max(this.revision, finite(meta.revision, this.revision)); else if (changed.length) this.revision += 1;
    if (changed.length) { this.updatedAt = Math.max(finite(meta.updatedAt, 0), this.now()); this.lastSource = String(meta.source || 'local'); this.stats.patches += 1; }
    this.stats.rejected += rejected.length;
    const state = { schemaVersion: CONTROL_SCHEMA_VERSION, revision: this.revision, updatedAt: this.updatedAt, values: this.values };
    if (saveStored(this.root, state)) this.stats.saves += 1; else this.stats.saveErrors += 1;
    if (this.log && changed.length) this.log.emit({ component: 'control-plane', event: 'CONTROL_SETTINGS_PATCHED', data: { revision: this.revision, source: this.lastSource, changed: changed.map((x) => x.key), rejected } });
    return { changed, rejected, revision: this.revision, updatedAt: this.updatedAt };
  }
  applyHot(runtime, changes = null) {
    const rows = Array.isArray(changes) ? changes : DEFINITIONS.filter((x) => x.hot !== false).map((def) => ({ key: def.key, value: this.get(def.key), hot: true }));
    const applied = [], restartRequired = [];
    for (const row of rows) {
      const def = BY_KEY.get(row.key); if (!def || def.locked) continue;
      if (def.hot === false) { restartRequired.push(row.key); continue; }
      let ok = false;
      if (def.runtimeMethod && runtime && typeof runtime[def.runtimeMethod] === 'function') { try { runtime[def.runtimeMethod](row.value); ok = true; } catch (_) {} }
      if (!ok && def.runtimePath) { try { ok = setPath(runtime, def.runtimePath, row.value); } catch (_) { ok = false; } }
      if (ok) applied.push(row.key);
    }
    this.stats.hotApplied += applied.length; this.stats.restartRequired += restartRequired.length;
    return { applied, restartRequired };
  }
  status() {
    return { schemaVersion: CONTROL_SCHEMA_VERSION, revision: this.revision, updatedAt: this.updatedAt, lastSource: this.lastSource, values: clone(this.values), stats: { ...this.stats }, policies: { lockedSafetySettingsCannotBeChanged: true, secretsExcluded: true, cloudFailureDoesNotDisableLocalSafety: true } };
  }
}

module.exports = { CONTROL_SCHEMA_VERSION, CONTROL_STORAGE_KEY: STORAGE_KEY, CONTROL_DEFINITIONS: DEFINITIONS, ControlPlaneConfig, controlDefaults: defaults, sanitizeControlValues: sanitize, loadStoredControlConfig: loadStored, buildBootOptionsFromControlPlane: bootOptions };