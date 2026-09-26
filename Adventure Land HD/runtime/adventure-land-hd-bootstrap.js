(function installAdventureLandHD(root) {
  "use strict";

  function normalize(value) {
    if (typeof value !== "string" || !value) return null;
    return value.split("?")[0].split("#")[0].replace(/^\\/+/, "") || null;
  }

  function validScale(value) {
    return Number.isInteger(value) && value >= 2 && value <= 8;
  }

  function resolutionSuffix(url, scale) {
    if (typeof url !== "string" || !validScale(scale)) return false;
    var clean = url.split("?")[0].split("#")[0];
    return new RegExp("@" + scale + "x\\\\.[a-z0-9]+$", "i").test(clean);
  }

  function makeLookup(manifest) {
    var lookup = Object.create(null);
    var replacements = manifest && Array.isArray(manifest.replacements) ? manifest.replacements : [];
    replacements.forEach(function (entry) {
      if (!entry || entry.state !== "active") return;
      var sourcePath = normalize(entry.sourcePath);
      if (!sourcePath || typeof entry.runtimeUrl !== "string") return;
      if (!entry.originalFallback || !entry.preserveLogicalSize) return;
      if (!resolutionSuffix(entry.runtimeUrl, entry.scale)) return;
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

  var stats = { applied: 0, paths: [], reason: null };
  var manifest = root && root.__ALHD_MANIFEST__;
  var gameData = root && root.G;

  if (!gameData || typeof gameData !== "object") {
    stats.reason = "G_UNAVAILABLE";
  } else if (!manifest || manifest.schemaVersion !== 1) {
    stats.reason = "MANIFEST_UNAVAILABLE";
  } else {
    var lookup = makeLookup(manifest);
    applyFamily(gameData.sprites, lookup, stats);
    applyFamily(gameData.animations, lookup, stats);
    applyFamily(gameData.tilesets, lookup, stats);
    applyFamily(gameData.imagesets, lookup, stats);
    stats.paths = Array.from(new Set(stats.paths)).sort();
    stats.reason = "READY";
  }

  root.ALHD = Object.freeze({
    version: "0.3.0",
    mode: "ASSET_ONLY",
    applied: stats.applied,
    paths: Object.freeze(stats.paths.slice()),
    reason: stats.reason,
    status: function () {
      return { version: this.version, mode: this.mode, applied: this.applied, paths: this.paths.slice(), reason: this.reason };
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
