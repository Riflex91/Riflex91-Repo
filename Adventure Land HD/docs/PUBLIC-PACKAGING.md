# Public packaging and hosting

The public distribution builder requires a verified staged manifest, the corresponding HD asset root, an HTTPS asset base, an output directory, and a browser-extension version.

Example:

node tools/build-public-extension.mjs \
  --manifest "/path/to/hd-assets-mainland-staged.json" \
  --hd-root "/path/to/hd-assets" \
  --asset-base-url "https://assets.example.com/adventure-land-hd/v0.1.0" \
  --output "/path/to/public-dist" \
  --version "0.1.0" \
  --build-label "v0.1.0"

The output contains:

- cdn/ — static image tree to upload under the exact asset base URL;
- cdn-manifest.json — SHA-256 and byte inventory;
- chromium/ — unpacked Chromium MV3 package;
- firefox/ — unpacked Firefox MV3 package;
- build-info.json — immutable build identity and distribution contract.

Run:

node tools/verify-public-extension.mjs --dist "/path/to/public-dist"

before publishing.

The browser packages and the CDN image tree must come from the same build. Mixing versions is unsupported because page-manifest.js contains SHA-versioned image URLs tied to the generated CDN inventory.
