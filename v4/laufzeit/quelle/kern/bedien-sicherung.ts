import type { BedienAnfrage, BedienEntscheidung } from '../vertraege/bedien-anfrage.js';

export class BedienSicherung {
  pruefe(anfrage: BedienAnfrage): BedienEntscheidung {
    const fehlendeVoraussetzungen = anfrage.voraussetzungen.filter((voraussetzung) => !voraussetzung.erfuellt);
    if (fehlendeVoraussetzungen.length > 0) {
      return {
        erlaubt: false,
        brauchtBestaetigung: false,
        grund: 'Mindestens eine notwendige Voraussetzung ist nicht erfuellt. Die Aktion wird nicht ausgefuehrt.',
        fehlendeVoraussetzungen
      };
    }

    if (anfrage.titel.trim().length === 0 || anfrage.erklaerung.trim().length === 0 || anfrage.auswirkung.trim().length === 0) {
      return {
        erlaubt: false,
        brauchtBestaetigung: false,
        grund: 'Die Aktion ist fuer den Nutzer nicht ausreichend erklaert und wird deshalb blockiert.',
        fehlendeVoraussetzungen: []
      };
    }

    if (anfrage.risiko === 'unkritisch') {
      return {
        erlaubt: true,
        brauchtBestaetigung: false,
        grund: 'Die Aktion ist unkritisch und alle Voraussetzungen sind erfuellt.',
        fehlendeVoraussetzungen: []
      };
    }

    if (anfrage.risiko === 'vorsicht') {
      if (anfrage.ausdruecklichBestaetigt !== true) {
        return {
          erlaubt: false,
          brauchtBestaetigung: true,
          grund: 'Diese Aktion braucht eine ausdrueckliche Bestaetigung, bevor sie ausgefuehrt werden darf.',
          fehlendeVoraussetzungen: []
        };
      }
      return {
        erlaubt: true,
        brauchtBestaetigung: false,
        grund: 'Die vorsichtige Aktion wurde ausdruecklich bestaetigt und darf ausgefuehrt werden.',
        fehlendeVoraussetzungen: []
      };
    }

    const erforderlich = anfrage.erforderlicherBestaetigungsText?.trim() ?? '';
    const eingegeben = anfrage.eingegebenerBestaetigungsText?.trim() ?? '';
    if (erforderlich.length === 0) {
      return {
        erlaubt: false,
        brauchtBestaetigung: true,
        grund: 'Eine kritische Aktion braucht einen eindeutigen Bestaetigungstext. Dieser fehlt in der Definition.',
        fehlendeVoraussetzungen: []
      };
    }
    if (eingegeben !== erforderlich) {
      return {
        erlaubt: false,
        brauchtBestaetigung: true,
        grund: 'Der Bestaetigungstext stimmt nicht exakt. Die kritische Aktion wird nicht ausgefuehrt.',
        fehlendeVoraussetzungen: []
      };
    }

    return {
      erlaubt: true,
      brauchtBestaetigung: false,
      grund: 'Die kritische Aktion wurde mit dem vorgesehenen Bestaetigungstext freigegeben.',
      fehlendeVoraussetzungen: []
    };
  }
}
