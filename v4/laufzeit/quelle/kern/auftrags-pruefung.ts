import {
  AUFTRAGS_ARTEN,
  AUFTRAGS_ZUSTAENDE,
  MENGEN_ZIEL_ARTEN,
  type NutzerAuftrag,
  type AuftragsPruefErgebnis
} from '../vertraege/nutzer-auftrag.js';

export class AuftragsPruefung {
  pruefe(auftrag: NutzerAuftrag, bekannteGegenstaende: ReadonlySet<string>): AuftragsPruefErgebnis {
    const fehler: string[] = [];
    const warnungen: string[] = [];

    if (!auftrag.auftragKennung.trim()) fehler.push('Der Auftrag besitzt keine eindeutige Kennung.');
    if (!AUFTRAGS_ARTEN.includes(auftrag.art)) fehler.push('Die Auftragsart ist unbekannt.');
    if (!auftrag.gegenstandKennung.trim()) fehler.push('Es wurde kein eindeutiger Gegenstand ausgewaehlt.');
    if (!auftrag.gegenstandName.trim()) fehler.push('Der Gegenstandsname fehlt.');
    if (!bekannteGegenstaende.has(auftrag.gegenstandKennung)) fehler.push('Der ausgewaehlte Gegenstand ist V4 nicht eindeutig bekannt.');
    if (!Number.isSafeInteger(auftrag.zielMenge) || auftrag.zielMenge <= 0) fehler.push('Die Zielmenge muss eine positive ganze Zahl sein.');
    if (!MENGEN_ZIEL_ARTEN.includes(auftrag.mengenZielArt)) fehler.push('Es muss eindeutig festgelegt sein, ob die Menge zusaetzlich gesammelt oder als Gesamtbestand erreicht werden soll.');
    if (!AUFTRAGS_ZUSTAENDE.includes(auftrag.zustand)) fehler.push('Der Auftragszustand ist unbekannt.');

    if (auftrag.urspruenglicheEingabe !== undefined && !auftrag.urspruenglicheEingabe.trim()) {
      warnungen.push('Die urspruengliche Freitexteingabe ist leer und wird nicht zur Ausfuehrung verwendet.');
    }

    return {
      gueltig: fehler.length === 0,
      fehler,
      warnungen
    };
  }
}
