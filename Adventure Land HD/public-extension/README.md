# Adventure Land HD browser extension source

This directory contains the browser-extension source used by the public distribution builder.

The source directory is intentionally not the final installable package. tools/build-public-extension.mjs creates Chromium and Firefox packages with a generated page-manifest.js whose image URLs point to a versioned HTTPS asset base.

No remote JavaScript is loaded. The only remote resources referenced by the generated extension are static HD images.

The content script executes in the page MAIN world at document_start so it can update the official client's presentation definitions before the Pixi loader consumes them. It only rewrites permitted .file fields in G.sprites, G.animations, G.tilesets, and G.imagesets.
