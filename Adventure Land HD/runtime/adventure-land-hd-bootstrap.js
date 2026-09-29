(function installAdventureLandHD(root) {
  "use strict";

  function normalize(value) {
    if (typeof value !== "string" || !value) return null;
    return value.split("?")[0].split("#")[0].replace(/^\/+/, "") || null;
  }

  function validScale(value) {
    return Number.isInteger(value) && value >= 2 && value <= 8;
  }

  function resolutionSuffix(url, scale) {
    if (typeof url !== "string" || !validScale(scale)) return false;
    var clean = url.split("?")[0].split("#")[0];
    return new RegExp("@" + scale + "x\\.[a-z0-9]+$", "i").test(clean);
  }

  function requestedMode() {
    var search = root && root.location && typeof root.location.search === "string" ? root.location.search : "";
    if (/(?:^|[?&])alhd=off(?:&|$)/i.test(search)) return "ORIGINAL";
    return "HD";
  }

  function validPixels(value) {
    return value && Number.isInteger(value.width) && value.width > 0 && Number.isInteger(value.height) && value.height > 0;
  }

  function detectMaxTextureSize() {
    try {
      var doc = root && root.document;
      if (!doc || typeof doc.createElement !== "function") return null;
      var canvas = doc.createElement("canvas");
      if (!canvas || typeof canvas.getContext !== "function") return null;
      var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl || typeof gl.getParameter !== "function" || typeof gl.MAX_TEXTURE_SIZE === "undefined") return null;
      var value = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE));
      try {
        var lose = typeof gl.getExtension === "function" && gl.getExtension("WEBGL_lose_context");
        if (lose && typeof lose.loseContext === "function") lose.loseContext();
      } catch (_ignore) {}
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch (_error) {
      return null;
    }
  }

  function makeLookup(manifest, maxTextureSize, diagnostics) {
    var lookup = Object.create(null);
    var replacements = manifest && Array.isArray(manifest.replacements) ? manifest.replacements : [];
    replacements.forEach(function (entry) {
      if (!entry || entry.state !== "active") return;
      var sourcePath = normalize(entry.sourcePath);
      if (!sourcePath || typeof entry.runtimeUrl !== "string") return;
      if (!entry.originalFallback || !entry.preserveLogicalSize) return;
      if (!resolutionSuffix(entry.runtimeUrl, entry.scale)) return;
      diagnostics.available.push(sourcePath);
      if (maxTextureSize && validPixels(entry.hdPixels) && (entry.hdPixels.width > maxTextureSize || entry.hdPixels.height > maxTextureSize)) {
        diagnostics.blocked.push(sourcePath);
        return;
      }
      lookup[sourcePath] = entry;
    });
    return lookup;
  }

  function applyFamily(family, lookup, stats) {
    if (!family || typeof family !== "object") return;
    Object.keys(family).forEach(function (key) {
      var def = family[key];
      if (!def || typeof def !== "object" || typeof def.file !== "string") return;
      var sourcePath = normalize(def.file);
      var entry = sourcePath && lookup[sourcePath];
      if (!entry) return;
      if (!Object.prototype.hasOwnProperty.call(def, "__alhdOriginalFile")) {
        Object.defineProperty(def, "__alhdOriginalFile", {
          value: def.file,
          writable: false,
          enumerable: false,
          configurable: false
        });
      }
      def.file = entry.runtimeUrl;
      stats.applied += 1;
      stats.paths.push(sourcePath);
    });
  }

  var mode = requestedMode();
  var stats = { applied: 0, available: 0, eligible: 0, paths: [], missing: [], blocked: [], maxTextureSize: null, reason: null };
  var manifest = root && root.__ALHD_MANIFEST__;
  var gameData = root && root.G;
  var maxTextureSize = detectMaxTextureSize();
  var lookupDiagnostics = { available: [], blocked: [] };
  var lookup = manifest && manifest.schemaVersion === 1 ? makeLookup(manifest, maxTextureSize, lookupDiagnostics) : Object.create(null);
  var availablePaths = Array.from(new Set(lookupDiagnostics.available)).sort();
  var eligiblePaths = Object.keys(lookup).sort();
  stats.available = availablePaths.length;
  stats.eligible = eligiblePaths.length;
  stats.blocked = Array.from(new Set(lookupDiagnostics.blocked)).sort();
  stats.maxTextureSize = maxTextureSize;

  if (mode === "ORIGINAL") {
    stats.reason = "ORIGINAL_MODE";
  } else if (!gameData || typeof gameData !== "object") {
    stats.reason = "G_UNAVAILABLE";
    stats.missing = eligiblePaths.slice();
  } else if (!manifest || manifest.schemaVersion !== 1) {
    stats.reason = "MANIFEST_UNAVAILABLE";
  } else {
    applyFamily(gameData.sprites, lookup, stats);
    applyFamily(gameData.animations, lookup, stats);
    applyFamily(gameData.tilesets, lookup, stats);
    applyFamily(gameData.imagesets, lookup, stats);
    stats.paths = Array.from(new Set(stats.paths)).sort();
    var appliedPaths = new Set(stats.paths);
    stats.missing = eligiblePaths.filter(function (sourcePath) { return !appliedPaths.has(sourcePath); });
    stats.reason = "READY";
  }

  root.ALHD = Object.freeze({
    version: "0.3.3",
    mode: mode,
    applied: stats.applied,
    available: stats.available,
    eligible: stats.eligible,
    paths: Object.freeze(stats.paths.slice()),
    missing: Object.freeze(stats.missing.slice()),
    blocked: Object.freeze(stats.blocked.slice()),
    maxTextureSize: stats.maxTextureSize,
    reason: stats.reason,
    status: function () {
      return {
        version: this.version,
        mode: this.mode,
        applied: this.applied,
        available: this.available,
        eligible: this.eligible,
        paths: this.paths.slice(),
        missing: this.missing.slice(),
        blocked: this.blocked.slice(),
        maxTextureSize: this.maxTextureSize,
        reason: this.reason
      };
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
