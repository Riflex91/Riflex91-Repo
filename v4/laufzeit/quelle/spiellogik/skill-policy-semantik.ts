import type {
  SkillPolicyControlDefinition,
  SkillPolicySemantik
} from '../vertraege/skill-policy.js';
import type { SkillKatalogEintrag } from '../vertraege/skill-katalog.js';

function prozent(
  kennung: SkillPolicyControlDefinition['kennung'],
  bezeichnung: string,
  standardWert: number,
  minimum = 0,
  maximum = 100
): SkillPolicyControlDefinition {
  return Object.freeze({
    kennung,
    art: 'prozent' as const,
    bezeichnung,
    minimum,
    maximum,
    schritt: 1,
    standardWert,
    maximumQuelle: null
  });
}

function ganzzahl(
  kennung: SkillPolicyControlDefinition['kennung'],
  bezeichnung: string,
  standardWert: number,
  minimum: number,
  maximum: number,
  maximumQuelle: SkillPolicyControlDefinition['maximumQuelle'] = null
): SkillPolicyControlDefinition {
  return Object.freeze({
    kennung,
    art: 'ganzzahl' as const,
    bezeichnung,
    minimum,
    maximum,
    schritt: 1,
    standardWert,
    maximumQuelle
  });
}

const SEMANTIK: Readonly<Record<string, SkillPolicySemantik>> = Object.freeze({
  heal: Object.freeze({
    skillId: 'heal',
    controls: Object.freeze([
      prozent('lebensSchwelleProzent', 'Heilen unter Lebenspunkten', 65)
    ])
  }),
  partyheal: Object.freeze({
    skillId: 'partyheal',
    controls: Object.freeze([
      prozent('lebensSchwelleProzent', 'Gruppenheilung unter Lebenspunkten', 72),
      ganzzahl('mindestensVerletzteMitglieder', 'Mindestens verletzte Gruppenmitglieder', 2, 1, 4)
    ])
  }),
  hardshell: Object.freeze({
    skillId: 'hardshell',
    controls: Object.freeze([
      prozent('lebensSchwelleProzent', 'Hard Shell unter Lebenspunkten', 45)
    ])
  }),
  cleave: Object.freeze({
    skillId: 'cleave',
    controls: Object.freeze([
      ganzzahl('mindestensZiele', 'Mindestens Ziele', 3, 1, 8)
    ])
  }),
  stomp: Object.freeze({
    skillId: 'stomp',
    controls: Object.freeze([
      ganzzahl('mindestensZiele', 'Mindestens Ziele', 3, 1, 8)
    ])
  }),
  agitate: Object.freeze({
    skillId: 'agitate',
    controls: Object.freeze([
      ganzzahl('maximalGewuenschteZiele', 'Maximal gewuenschte Ziele', 4, 1, 8)
    ])
  }),
  '3shot': Object.freeze({
    skillId: '3shot',
    controls: Object.freeze([
      ganzzahl('mindestensZiele', 'Mindestens Ziele', 2, 1, 8, 'zielKapazitaet')
    ])
  }),
  '5shot': Object.freeze({
    skillId: '5shot',
    controls: Object.freeze([
      ganzzahl('mindestensZiele', 'Mindestens Ziele', 4, 1, 8, 'zielKapazitaet')
    ])
  }),
  fanofknives: Object.freeze({
    skillId: 'fanofknives',
    controls: Object.freeze([
      ganzzahl('mindestensZiele', 'Mindestens Ziele', 3, 1, 8, 'zielKapazitaet')
    ])
  }),
  cburst: Object.freeze({
    skillId: 'cburst',
    controls: Object.freeze([
      ganzzahl('mindestensZiele', 'Mindestens Ziele', 2, 1, 8),
      prozent('manaBudgetProzent', 'Maximales Mana-Budget pro Einsatz', 20, 5, 50)
    ])
  }),
  energize: Object.freeze({
    skillId: 'energize',
    controls: Object.freeze([
      prozent('empfaengerManaSchwelleProzent', 'Empfaenger unter Mana', 50)
    ])
  })
});

export function holeSkillPolicySemantik(skillId: string): SkillPolicySemantik {
  return SEMANTIK[skillId] ?? Object.freeze({ skillId, controls: Object.freeze([]) });
}

export function holeWirksameSkillPolicyControls(
  eintrag: SkillKatalogEintrag
): readonly SkillPolicyControlDefinition[] {
  const controls = holeSkillPolicySemantik(eintrag.skillId).controls.map((control) => {
    if (control.maximumQuelle !== 'zielKapazitaet' || eintrag.zielKapazitaet === null) return control;
    const maximum = Math.max(control.minimum, Math.min(control.maximum, eintrag.zielKapazitaet));
    return Object.freeze({
      ...control,
      maximum,
      standardWert: Math.max(control.minimum, Math.min(maximum, control.standardWert))
    });
  });
  return Object.freeze(controls);
}

export const SKILL_POLICY_SEMANTIK_IDS = Object.freeze(Object.keys(SEMANTIK).sort((a, b) => a.localeCompare(b)));
