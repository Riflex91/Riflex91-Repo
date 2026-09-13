# v3 Release Guardian

`v3/version.json` is the authoritative source for the current v3 release version.

## Fast preflight

Run:

```bash
npm run preflight
```

The guardian fails before the full suite when:

- `package.json` does not match `version.json`;
- `src/release-version.js` is not generated from the authoritative version;
- the committed browser bundle advertises a different version;
- Release Guardian scripts have syntax errors;
- critical release-safety regressions fail.

The fast safety suite permanently protects the Target Automatron attack exclusion and the Alpha20.23 navigation-deadlock recovery, including fail-closed behavior for dangerous/unknown content.

## Patch release

Use:

```bash
npm run release:patch
```

This command increments only the final alpha patch component (for example `3.0.0-alpha.20.23` -> `3.0.0-alpha.20.24`), updates the build date, synchronizes the package/runtime mirrors, updates only test literals that exactly matched the previous current release, rebuilds the browser bundle, runs the fast guardian and then runs the complete v3 check suite.

Historical/frozen runtime versions such as Alpha19 remain untouched.

The release preparation is transactional: if build, guardian, or full checks fail, files modified by the release command are restored to their pre-release contents.

## CI order

The v3 workflow runs the Release Guardian before the full build/test job. Pull requests still rebuild the browser bundle and require the committed bundle to match the generated result.
