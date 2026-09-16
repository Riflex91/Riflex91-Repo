import type { AuftragsVorschlag } from '../vertraege/nutzer-auftrag.js';

function normalisiere(text: string): string {
  return text.trim().toLocaleLowerCase('de-DE');
}

export class AuftragsVorschlaege {
  suche(eingabe: string, verfuegbareVorschlaege: readonly AuftragsVorschlag[], maximaleAnzahl = 8): AuftragsVorschlag[] {
    const suchText = normalisiere(eingabe);
    const begrenzt = Math.max(1, Math.min(20, Math.trunc(maximaleAnzahl)));

    if (!suchText) return verfuegbareVorschlaege.slice(0, begrenzt);

    return verfuegbareVorschlaege
      .map((vorschlag) => {
        const anzeigeText = normalisiere(vorschlag.anzeigeText);
        const einfuegeText = normalisiere(vorschlag.einfuegeText);
        const schluesselWoerter = vorschlag.schluesselWoerter.map(normalisiere);
        let treffWert = 0;

        if (anzeigeText.startsWith(suchText) || einfuegeText.startsWith(suchText)) treffWert += 100;
        if (anzeigeText.includes(suchText) || einfuegeText.includes(suchText)) treffWert += 50;
        if (schluesselWoerter.some((wort) => wort.startsWith(suchText))) treffWert += 30;
        if (schluesselWoerter.some((wort) => wort.includes(suchText))) treffWert += 10;

        return { vorschlag, treffWert };
      })
      .filter((eintrag) => eintrag.treffWert > 0)
      .sort((a, b) => b.treffWert - a.treffWert || a.vorschlag.anzeigeText.localeCompare(b.vorschlag.anzeigeText, 'de-DE'))
      .slice(0, begrenzt)
      .map((eintrag) => eintrag.vorschlag);
  }
}
