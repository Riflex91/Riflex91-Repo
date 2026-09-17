import {
  erstelleKampfSicherheitsAblaufZustand,
  erstelleKampfSicherheitsKonfiguration,
  planeKampfSicherheitsSchritt
} from '../spiellogik/kampfsicherheit.js';
import type { KampfSicherheitsAblaufZustand, KampfSicherheitsKonfiguration } from '../vertraege/kampfsicherheit.js';
import type { WiederholungsEntscheider, WiederholungsEntscheidung } from '../vertraege/wiederholung.js';

function bewertungsWert(stufe: string): number {
  switch (stufe) {
    case 'kritisch': return -100;
    case 'gefaehrlich': return -60;
    case 'angespannt': return -20;
    case 'unbekannt': return -40;
    default: return 0;
  }
}

export function erstelleKampfSicherheitsWiederholungsEntscheider(
  konfiguration: KampfSicherheitsKonfiguration
): WiederholungsEntscheider {
  const normalisiert = erstelleKampfSicherheitsKonfiguration(konfiguration);
  const zustaende = new Map<string, KampfSicherheitsAblaufZustand>();

  return (kontext): WiederholungsEntscheidung => {
    const vorher = zustaende.get(kontext.charakterKennung)
      ?? erstelleKampfSicherheitsAblaufZustand(kontext.spielzustand, kontext.jetzt);
    const entscheidung = planeKampfSicherheitsSchritt(kontext.spielzustand, normalisiert, vorher, kontext.jetzt);
    zustaende.set(kontext.charakterKennung, entscheidung.naechsterAblaufZustand);

    return Object.freeze({
      kennung: entscheidung.entscheidungsKennung,
      zeitpunkt: kontext.jetzt,
      charakterKennung: kontext.charakterKennung,
      entscheidung: entscheidung.art,
      grund: entscheidung.grund,
      sicherheitszustand: entscheidung.normalAktionenErlaubt ? 'sicher' : 'warnung',
      bewertungsWert: bewertungsWert(entscheidung.gefahrenBewertung.stufe),
      details: Object.freeze({
        gefahrenStufe: entscheidung.gefahrenBewertung.stufe,
        gruende: Object.freeze([...entscheidung.gefahrenBewertung.gruende]),
        angreiferKennungen: Object.freeze([...entscheidung.gefahrenBewertung.angreiferKennungen]),
        aktionsWichtigkeit: entscheidung.aktionsAnfrage?.wichtigkeit ?? null,
        aktionsName: entscheidung.aktionsAnfrage?.aktion ?? null
      })
    });
  };
}
