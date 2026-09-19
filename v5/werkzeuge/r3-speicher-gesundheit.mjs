export function bewerteSpeicherGesundheit(probe) {
  if (probe.vorhanden !== true) {
    return { gesund: false, grund: "SSD_VOLUME_FEHLT" };
  }

  if (String(probe.laufwerk ?? "").toUpperCase() !== "D:") {
    return { gesund: false, grund: "FALSCHES_VOLUME" };
  }

  if (probe.bereit !== true) {
    return { gesund: false, grund: "VOLUME_NICHT_BEREIT" };
  }

  if (probe.festplattenTyp !== "SSD") {
    return { gesund: false, grund: "MEDIENTYP_NICHT_SSD" };
  }

  if (!Number.isFinite(probe.gesamtBytes) || probe.gesamtBytes <= 0
      || !Number.isFinite(probe.freiBytes) || probe.freiBytes < 0
      || probe.freiBytes > probe.gesamtBytes) {
    return { gesund: false, grund: "SPEICHERWERTE_UNGUELTIG" };
  }

  const freiProzent = (probe.freiBytes / probe.gesamtBytes) * 100;
  if (freiProzent < 15) {
    return { gesund: false, grund: "KRITISCHE_SPEICHERRESERVE_UNTERSCHRITTEN", freiProzent };
  }

  return { gesund: true, grund: "GESUND", freiProzent };
}
