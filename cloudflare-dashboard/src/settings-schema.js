export const SETTINGS_SCHEMA_VERSION = 2;

const n = (key, category, label, description, value, min, max, step, hot = true) => ({ key, category, label, description, type: 'number', default: value, min, max, step, hot });
const b = (key, category, label, description, value, locked = false, hot = true) => ({ key, category, label, description, type: 'boolean', default: value, locked, hot });
const s = (key, category, label, description, value, values, hot = true) => ({ key, category, label, description, type: 'select', default: value, values, hot });

export const SETTINGS_SCHEMA = Object.freeze([
  n('runtime.tickMs','Runtime','Runtime-Tick','Wie oft der Bot seine Umgebung prüft und neue Entscheidungen trifft. Ein kleinerer Wert reagiert schneller, belastet das Spiel aber stärker.',250,100,2000,50,false),
  b('runtime.visibleStatus','Runtime','Sichtbare Statusmeldungen','Zeigt wichtige Bot-Meldungen zusätzlich direkt im Adventure-Land-Log an.',true,false,true),
  n('runtime.brainAuditMs','Runtime','Brain-Auswertungsintervall','Wie oft der Bot die allgemeine Situation neu bewertet und seine Strategie überprüfen darf.',5000,1000,60000,500,true),
  n('runtime.logCapacity','Runtime','Event-Log Kapazität','Wie viele der neuesten Bot-Ereignisse für Diagnose und Fehlersuche gespeichert werden.',4000,500,20000,500,false),

  n('party.cohesionRadius','Party & Formation','Kohäsionsradius','Wie weit sich die Kämpfer voneinander entfernen dürfen, bevor die Gruppe wieder zusammenrückt.',150,80,280,5,false),
  n('party.hardRegroupExtraRadius','Party & Formation','Hard-Regroup Zusatzradius','Zusätzlicher Abstand, der noch erlaubt ist, bevor ein deutliches Zusammenrücken erzwungen wird.',45,10,140,5,false),
  n('party.committedPullExtraRadius','Party & Formation','Committed-Pull Puffer','Erlaubt der Gruppe bei einem bereits begonnenen Kampf etwas mehr Abstand, damit sie den Kampf nicht unnötig abbricht.',60,0,120,5,false),
  n('party.committedPullAbsoluteMaxRadius','Party & Formation','Committed-Pull Maximalradius','Größter Abstand, den die Gruppe selbst in einem bereits begonnenen Kampf niemals überschreiten soll.',220,120,320,5,false),
  b('party.requireCompleteTeamForFreshPull','Party & Formation','Vollständige Gruppe für neue Pulls','Startet neue Kämpfe nur, wenn die komplette Kampfgruppe lebt, erreichbar ist und ihre Position bekannt ist.',true,true,true),
  b('party.commandCharacterActiveOnly','Party & Formation','Remote-Autorität nur für aktive Charaktere','Verhindert, dass nur beobachtete oder inaktive Charaktere versehentlich Befehle erhalten.',true,true,true),

  n('combat.riskThreshold','Kampf & Risiko','Risikoschwelle','Bestimmt, wie vorsichtig der Bot neue Kämpfe auswählt. Höher bedeutet mutiger, niedriger bedeutet vorsichtiger.',0.65,0.2,0.95,0.01,true),
  n('combat.recoveryHpRatio','Kampf & Risiko','Recovery-HP','Unter diesem Lebenspunkte-Anteil wartet der Bot eher auf Heilung, statt einen neuen riskanten Kampf zu beginnen.',0.75,0.35,0.95,0.01,false),
  n('combat.emergencyCriticalHpRatio','Kampf & Risiko','Kritische HP','Unter diesem Lebenspunkte-Anteil behandelt der Bot die Situation als Notfall und versucht sich in Sicherheit zu bringen.',0.25,0.1,0.6,0.01,false),
  n('combat.multiAggroHpRatio','Kampf & Risiko','Multi-Aggro HP-Grenze','Unter diesem Lebenspunkte-Anteil wird es als Notfall gewertet, wenn gleichzeitig mehrere Gegner angreifen.',0.55,0.25,0.9,0.01,false),
  n('combat.multiAggroCount','Kampf & Risiko','Multi-Aggro Anzahl','Ab wie vielen gleichzeitig angreifenden Gegnern die Multi-Aggro-Notfallregel greift.',2,2,8,1,false),
  n('combat.softKillSeconds','Kampf & Risiko','TTK Soft-Limit','Zeit zum Besiegen eines Gegners: Ab dieser Dauer wird das Ziel als weniger effizient bewertet.',30,10,75,1,false),
  n('combat.hardMaxKillSeconds','Kampf & Risiko','TTK Hard-Limit','Zeit zum Besiegen eines Gegners: Dauert es voraussichtlich länger, wird er nicht als normales Farmziel gewählt.',75,35,120,1,false),
  n('combat.maxKiteAdditionalAggro','Kampf & Risiko','Zusätzliche Kite-Aggro','Wie viele zusätzliche Gegner beim Kiten höchstens akzeptiert werden dürfen.',2,1,3,1,false),
  n('combat.kiteRiskMitigationScale','Kampf & Risiko','Kite-Risikominderung','Wie stark erfolgreiches Kiten das berechnete Kampfrisiko senken darf.',0.78,0.45,0.9,0.01,false),
  n('combat.maxKiteDeathsPerHour','Kampf & Risiko','Kite-Todesrate Maximum','Wie viele Todesfälle pro Stunde historisch höchstens erlaubt sind, bevor aggressiveres Kiten vermieden wird.',0.6,0.1,1,0.05,false),
  b('combat.dangerousContentFailClosed','Kampf & Risiko','Gefährliche Inhalte sperren','Unbekannte, unter Quarantäne stehende oder ausdrücklich gefährliche Gegner bleiben gesperrt, bis sie sicher freigegeben wurden.',true,true,true),
  b('combat.emergencyRetreatPriority','Kampf & Risiko','Notfall-Rückzug hat Vorrang','Sorgt dafür, dass ein notwendiger Notfall-Rückzug immer wichtiger bleibt als Farming, Formation, Lernen oder Handel.',true,true,true),

  n('ranged.engagementFactor','Fernkampf & Kiting','Engagement-Range','Wie viel der tatsächlichen Angriffsreichweite genutzt werden soll, bevor ein Fernkämpfer angreift.',0.94,0.82,0.98,0.01,false),
  n('ranged.desiredFactor','Fernkampf & Kiting','Bevorzugte Feuerdistanz','Gewünschter Abstand zum Gegner im Verhältnis zur eigenen Angriffsreichweite.',0.92,0.75,0.97,0.01,false),
  n('ranged.tooCloseFactor','Fernkampf & Kiting','Zu-nah Grenze','Wenn ein Gegner näher kommt als dieser Anteil der Reichweite, darf der Fernkämpfer Abstand gewinnen.',0.84,0.6,0.92,0.01,false),
  n('ranged.firePositionTriggerFactor','Fernkampf & Kiting','Feuerpositions-Trigger','Ab welchem Abstand ein Fernkämpfer ohne Aggro seine Position verbessern darf, um besser schießen zu können.',0.8,0.6,0.9,0.01,false),
  n('ranged.moveCooldownMs','Fernkampf & Kiting','Range-Move Cooldown','Mindestzeit zwischen zwei Bewegungen, die nur zur Verbesserung der Fernkampfposition dienen.',1200,500,5000,100,false),
  b('ranged.onlyAggroHolderKites','Fernkampf & Kiting','Nur Aggro-Holder kitet','Nur der Charakter, den der Gegner gerade verfolgt, darf aktiv kiten. So arbeiten die Bewegungsregeln nicht gegeneinander.',true,true,true),

  b('skills.enabled','Skills & Ressourcen','Skills verwenden','Erlaubt dem Bot, Klassen-Skills automatisch und kontrolliert im Kampf einzusetzen.',true,false,false),
  n('skills.mpReserveRatio','Skills & Ressourcen','MP-Reserve','Dieser Anteil der Manapunkte wird als Reserve für wichtige Skills und Notfälle zurückgehalten.',0.15,0,0.6,0.01,false),
  n('skills.minIntervalMs','Skills & Ressourcen','Skill-Minimumintervall','Kürzeste erlaubte Zeit zwischen zwei Skill-Versuchen.',120,50,2000,10,false),
  n('skills.failureBackoffMs','Skills & Ressourcen','Skill-Fehler Wartezeit','Wie lange nach dem ersten Skill-Fehler gewartet wird, bevor der Bot es erneut versucht.',750,100,10000,50,false),
  n('skills.failureBackoffMultiplier','Skills & Ressourcen','Fehler-Wartezeit Multiplikator','Verlängert die Wartezeit nach mehreren aufeinanderfolgenden Skill-Fehlern.',1.8,1,4,0.1,false),

  s('farming.targetPolicy','Farming & Ziele','Zielrichtlinie','Legt fest, welche sicheren Gegner grundsätzlich gewählt werden dürfen. „party-only“ hält sich an gemeinsame Party-Ziele, „safe-any“ erlaubt zusätzlich andere als sicher bekannte Ziele.','party-only',['party-only','safe-any'],true),
  b('farming.reassessmentEnabled','Farming & Ziele','Ziele neu bewerten','Prüft regelmäßig, ob das aktuelle Ziel noch sinnvoll ist oder ein besseres sicheres Ziel vorhanden ist.',true,false,false),
  n('farming.reassessmentMinIntervalMs','Farming & Ziele','Neubewertungs-Intervall','Mindestzeit zwischen zwei Prüfungen, ob das aktuelle Ziel gewechselt werden sollte.',1500,500,15000,100,false),
  n('farming.switchCooldownMs','Farming & Ziele','Zielwechsel-Wartezeit','Mindestzeit nach einem Zielwechsel, bevor erneut gewechselt werden darf. Verhindert hektisches Hin- und Herschalten.',5000,1000,30000,500,false),
  n('farming.maxTravelSeconds','Farming & Ziele','Maximale Farm-Anreise','Reisezeit, ab der ein weiter entferntes Farmgebiet bei der Bewertung deutlich unattraktiver wird.',600,30,3600,30,false),

  b('recovery.safeRetreatEnabled','Travel & Recovery','Sicherer Rückzug','Erlaubt dem Bot bei gefährlichen Situationen kontrolliert auszuweichen, statt einfach stehen zu bleiben.',true,false,false),
  n('recovery.retreatMinStep','Travel & Recovery','Rückzug Mindestschritt','Kleinste Bewegung, die der Bot bei einem Notfall-Rückzug versucht.',25,5,100,5,false),
  n('recovery.retreatMaxStep','Travel & Recovery','Rückzug Maximalschritt','Größte einzelne Bewegung, die der Bot bei einem Notfall-Rückzug versucht.',120,30,250,5,false),
  n('recovery.maxThreats','Travel & Recovery','Rückzug Gegnerlimit','Wie viele angreifenden Gegner bei der Berechnung eines sicheren Rückzugs höchstens berücksichtigt werden.',6,1,12,1,false),

  n('merchant.lowFreeSlots','Merchant & Service','Inventardruck ab','Wenn der Merchant weniger freie Inventarplätze hat, beginnt er mit Aufräumen, Bank- oder Servicearbeit.',8,2,20,1,true),
  n('merchant.targetFreeSlots','Merchant & Service','Ziel freie Slots','So viele freie Inventarplätze versucht der Merchant nach dem Aufräumen wiederherzustellen.',14,4,30,1,true),
  n('merchant.potionLow','Merchant & Service','Potion Low','Unter diesem Vorrat plant der Merchant das Nachfüllen von HP- oder MP-Tränken.',1500,50,10000,50,true),
  n('merchant.potionTarget','Merchant & Service','Potion Ziel','Auf diesen Vorrat versucht der Merchant seine Tränke beim Nachfüllen zu bringen.',6000,100,20000,100,true),
  n('merchant.goldReserve','Merchant & Service','Goldreserve','Diesen Goldbetrag behält der Merchant als Reserve und gibt ihn nicht für normale automatische Aktionen aus.',1000000,0,100000000,100000,true),
  n('merchant.transferRange','Merchant & Service','Transferreichweite','Größter Abstand, bei dem der Merchant Items oder Gold direkt mit einem Party-Mitglied austauschen darf.',400,100,600,10,true),
  b('merchant.economyOwnsMovement','Merchant & Service','Merchant-Bewegung zentral steuern','Verhindert, dass mehrere Merchant-Systeme gleichzeitig unterschiedliche Bewegungen anfordern.',true,true,true),

  n('economy.keepValue','Economy, Gear & Markt','Wertvolle Items behalten','Items oberhalb dieses geschätzten Wertes werden vorsichtig behandelt und eher behalten oder eingelagert statt verkauft.',1000000,1000,100000000,50000,true),
  n('economy.upgradeCap','Economy, Gear & Markt','Upgrade Kostenlimit','So viel Gold darf ein automatisches Ausrüstungs-Upgrade höchstens innerhalb des vorgesehenen Budgets kosten.',2000000,0,100000000,100000,true),
  n('economy.compoundCap','Economy, Gear & Markt','Compound Kostenlimit','So viel Gold darf ein automatisches Zusammenfügen von Items höchstens innerhalb des vorgesehenen Budgets kosten.',500000,0,100000000,50000,true),
  n('economy.maxUpgrade','Economy, Gear & Markt','Max Upgrade Level','Bis zu diesem Ergebnis-Level darf der Bot normale, freigegebene Upgrades automatisch durchführen. Die aktuelle v3-Progressionspolicy erlaubt höchstens +7.',2,0,7,1,true),
  n('economy.maxCompound','Economy, Gear & Markt','Max Compound Level','Bis zu diesem Ergebnis-Level darf der Bot normale, freigegebene Compounds automatisch durchführen. Die aktuelle v3-Progressionspolicy erlaubt höchstens +10.',1,0,10,1,true),
  n('economy.marketMaxTrackedItems','Economy, Gear & Markt','Beobachtete Markt-Items','Wie viele verschiedene Item-Arten der Bot gleichzeitig mit Preisverlauf speichern darf.',96,24,256,8,false),
  n('economy.marketMaxSamples','Economy, Gear & Markt','Preisbeobachtungen pro Item','Wie viele ältere Preisbeobachtungen pro Item für Marktwert und Preisentwicklung gespeichert werden.',48,8,128,4,false),
  n('economy.gearGoalFreshMs','Economy, Gear & Markt','Alter von Ausrüstungszielen','Wie lange ein berechnetes Ausrüstungsziel ohne neue Bestätigung als aktuell gilt.',30000,5000,180000,5000,false),
  b('economy.journaledMutationsOnly','Economy, Gear & Markt','Wichtige Änderungen absichern','Sorgt dafür, dass Upgrades, Compounds und Bankaktionen zuerst gespeichert und anschließend überprüft werden, damit Fehler nicht unbemerkt bleiben.',true,true,true),

  b('brain.enabled','Gehirn & Lernen','Strategisches Gehirn','Aktiviert das lernende Strategiesystem. Es beobachtet Ergebnisse und lernt daraus, darf aber die festen Sicherheitsregeln nicht umgehen.',true,false,true),
  s('brain.mode','Gehirn & Lernen','Brain-Modus','„shadow“ beobachtet und lernt nur. „canary“ darf vorbereitete Strategie-Vorschläge nutzen, bleibt aber weiterhin an alle Sicherheitsprüfungen gebunden.','shadow',['shadow','canary'],true),
  b('brain.teacherEnabled','Gehirn & Lernen','KI-Lehrer verwenden','Erlaubt dem Lernsystem gelegentlich den Cloud-KI-Lehrer zu fragen, wenn das Tagesbudget und alle Schutzregeln es erlauben.',true,false,true),
  n('brain.dailyNeuronLimit','Gehirn & Lernen','Tägliches KI-Limit','Maximales tägliches Nutzungsbudget für den Cloud-KI-Lehrer. Ist es aufgebraucht, lernt der Bot lokal weiter.',10000,500,10000,100,true),
  n('brain.budgetTargetFraction','Gehirn & Lernen','Geplanter Budgetverbrauch','Welcher Anteil des täglichen KI-Budgets höchstens geplant verbraucht werden soll. Ein kleiner Rest bleibt als Reserve.',0.995,0.5,0.995,0.005,true),
  n('brain.teacherMinIntervalMs','Gehirn & Lernen','Mindestabstand zwischen KI-Anfragen','Kürzeste Zeit zwischen zwei Anfragen an den Cloud-KI-Lehrer.',30000,5000,600000,5000,true),
  n('brain.teacherMaxIntervalMs','Gehirn & Lernen','Späteste KI-Neubewertung','Spätestens nach dieser Zeit darf bei vorhandenem Budget erneut geprüft werden, ob eine KI-Anfrage sinnvoll ist.',300000,30000,1800000,10000,true),
  n('brain.entropyTeacherThreshold','Gehirn & Lernen','Unsicherheitsgrenze','Ab welcher Unsicherheit des lokalen Lernsystems eine Anfrage an den KI-Lehrer wichtiger wird.',0.72,0.2,0.98,0.01,true),
  n('brain.noveltyTeacherThreshold','Gehirn & Lernen','Grenze für neue Situationen','Ab wann eine ungewöhnliche oder neue Situation eher dem KI-Lehrer gezeigt werden soll.',0.45,0.05,0.95,0.01,true),
  n('brain.replayCapacity','Gehirn & Lernen','Gespeicherte Lernerfahrungen','Wie viele frühere Situationen und Ergebnisse der Bot lokal zum Lernen aufbewahrt.',512,64,4096,64,false),
  n('brain.replayBatchSize','Gehirn & Lernen','Erfahrungen pro Lernschritt','Wie viele gespeicherte Erfahrungen der Bot bei einem einzelnen Lernschritt gleichzeitig verwendet.',12,2,64,1,true),
  n('brain.learningRate','Gehirn & Lernen','Lernstärke','Wie stark neue Erfahrungen das bereits Gelernte verändern. Größere Werte lernen schneller, können aber unruhiger werden.',0.012,0.001,0.08,0.001,true),
  n('brain.outcomeWindowMs','Gehirn & Lernen','Zeit bis zur Ergebnisbewertung','Wie lange der Bot nach einer Strategieentscheidung wartet, bevor er bewertet, ob sie tatsächlich gut funktioniert hat.',60000,15000,600000,5000,true),
  n('brain.championMinSamples','Gehirn & Lernen','Erfahrungen vor erstem Champion','Wie viele Lernerfahrungen mindestens vorhanden sein müssen, bevor ein gelerntes Modell als bisher beste Version übernommen werden kann.',120,32,2000,8,true),
  n('brain.challengerLossImprovement','Gehirn & Lernen','Mindestverbesserung für neues Modell','Wie deutlich ein neues Lernmodell besser sein muss, bevor es das bisherige beste Modell ersetzen darf.',0.04,0.005,0.3,0.005,true),
  n('brain.diaryMaxEntries','Gehirn & Lernen','Gehirn-Tagebuch','Wie viele der neuesten Lern-, KI- und Modellentscheidungen für Nachvollziehbarkeit gespeichert werden.',100,20,300,10,true),
  b('brain.directExecutorAccess','Gehirn & Lernen','Direkte Befehle durch das Gehirn verbieten','Das lernende System darf niemals direkt Sicherheitsprüfungen oder kontrollierte Ausführungswege umgehen.',false,true,true),
  b('brain.deterministicFallback','Gehirn & Lernen','Sichere lokale Ersatzentscheidung','Wenn Cloud oder Lernsystem ausfallen, entscheidet weiterhin der normale lokale Bot nach festen Regeln.',true,true,true),

  b('cloud.enabled','Cloud & Telemetrie','Web-Dashboard verbinden','Aktiviert die Verbindung zum Web-Dashboard für Statusdaten, Einstellungen und – falls eingeschaltet – den KI-Lehrer.',false,false,true),
  n('cloud.runtimePushMs','Cloud & Telemetrie','Status senden','Wie oft der Bot seinen aktuellen kompakten Status an das Web-Dashboard sendet.',5000,2000,60000,1000,true),
  n('cloud.configPullMs','Cloud & Telemetrie','Einstellungen abrufen','Wie oft der Bot prüft, ob im Web-Dashboard Einstellungen geändert wurden.',15000,5000,300000,5000,true),
  n('cloud.eventBatchSize','Cloud & Telemetrie','Ereignisse pro Upload','Wie viele Bot-Ereignisse höchstens zusammen in einem Upload an das Dashboard übertragen werden.',80,10,250,10,true),
  n('cloud.dashboardRefreshMs','Cloud & Telemetrie','Dashboard Aktualisierung','Empfohlener Abstand, in dem das Web-Dashboard neue Live-Daten anzeigen soll.',3000,1000,30000,500,true),
  b('cloud.secretsNeverSync','Cloud & Telemetrie','Zugangsdaten niemals übertragen','Passwörter und READ/WRITE/ADMIN-Schlüssel werden weder im Dashboard-Status noch in der Cloud-Datenbank gespeichert.',true,true,true),
  b('cloud.offlineSafeLocal','Cloud & Telemetrie','Bei Cloud-Ausfall lokal weiterlaufen','Wenn Dashboard oder Cloud nicht erreichbar sind, arbeitet der Bot lokal weiter und behält alle Sicherheitsregeln bei.',true,true,true)
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
