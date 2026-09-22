const PERFORMANCE_TRICK_EXPR = [
  "(async () => {",
  "  const roots = [globalThis];",
  "  try { if (globalThis.parent && globalThis.parent !== globalThis) roots.push(globalThis.parent); } catch {}",
  "  let verfuegbar = false;",
  "  let aufgerufen = false;",
  "  let fehler = null;",
  "  for (const root of roots) {",
  "    try {",
  "      if (typeof root?.performance_trick !== 'function') continue;",
  "      verfuegbar = true;",
  "      root.performance_trick();",
  "      aufgerufen = true;",
  "      break;",
  "    } catch (error) {",
  "      fehler = String(error && error.message || error).slice(0, 240);",
  "    }",
  "  }",
  "  if (aufgerufen) await new Promise(resolve => setTimeout(resolve, 350));",
  "  let audioGefunden = false;",
  "  let cplaying = false;",
  "  let playing = false;",
  "  for (const root of roots) {",
  "    try {",
  "      const empty = root?.sounds?.empty;",
  "      if (!empty) continue;",
  "      audioGefunden = true;",
  "      if (empty.cplaying === true) cplaying = true;",
  "      if (typeof empty.playing === 'function' && empty.playing() === true) playing = true;",
  "    } catch {}",
  "  }",
  "  if (aufgerufen && !playing) {",
  "    for (const root of roots) {",
  "      try {",
  "        if (typeof root?.performance_trick === 'function') {",
  "          root.performance_trick();",
  "          break;",
  "        }",
  "      } catch {}",
  "    }",
  "    await new Promise(resolve => setTimeout(resolve, 150));",
  "    for (const root of roots) {",
  "      try {",
  "        const empty = root?.sounds?.empty;",
  "        if (empty && typeof empty.playing === 'function' && empty.playing() === true) playing = true;",
  "      } catch {}",
  "    }",
  "  }",
  "  return {",
  "    verfuegbar, aufgerufen, audioGefunden, cplaying, playing,",
  "    aktiv: verfuegbar && audioGefunden && playing,",
  "    fehler, verifikation: 'HOWLER_PLAYING_TRUE',",
  "  };",
  "})()",
].join("\n");

export async function aktiviereUndVerifiziereBrowserPerformanceTrick(
  session,
  contextId,
) {
  if (!session || typeof session.evaluate !== "function"
      || !Number.isInteger(contextId)) {
    throw new Error("BANK_PERFORMANCE_TRICK_CDP_KONTEXT_UNGUELTIG");
  }
  const value = await session.evaluate(
    PERFORMANCE_TRICK_EXPR,
    contextId,
    { userGesture: true },
  );
  if (!value || value.aktiv !== true || value.playing !== true) {
    throw new Error(
      "BANK_PERFORMANCE_TRICK_NICHT_AKTIV:" + JSON.stringify(value ?? null),
    );
  }
  return Object.freeze({
    verfuegbar: value.verfuegbar === true,
    aufgerufen: value.aufgerufen === true,
    audioGefunden: value.audioGefunden === true,
    cplaying: value.cplaying === true,
    playing: value.playing === true,
    aktiv: true,
    fehler: value.fehler ?? null,
    verifikation: "HOWLER_PLAYING_TRUE",
  });
}

export const BANK_BROWSER_PERFORMANCE_TRICK_GAMEPLAY_WRITES = 0;
