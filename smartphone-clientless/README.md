# Smartphone Clientless

Browser-free Adventure Land AiO v3 runtime intended for Android. It runs the copied v3 bot logic against real clientless game sessions instead of a WebView.

## What is implemented

- Complete v3 behavior baseline mirrored under `v3/`.
- `ALClientTransport`: Adventure Land login/auth, game-data loading, character connection and live state through the clientless ALClient protocol implementation.
- `ClientlessGameAdapter`: translates the v3 adapter contract to native clientless commands.
- `V3ClientlessRuntime`: injects the clientless adapter into the copied Alpha20.5 v3 runtime.
- `ClientlessSession`: one logical runtime per selected character.
- `CharacterRuntimeManager`: supervises multiple selected characters with Farmer/Merchant role assignment.
- Browser/WebView is not used by this runtime.

ALClient 0.25.3 is pinned because it already implements Adventure Land's HTTP authentication, server/character discovery and Socket.IO game protocol. Credentials remain external to the repository.

## Android / Termux

Install a current Termux build, then install Node.js and Git. Clone this repository, enter `smartphone-clientless`, run `npm install`, copy `clientless.config.example.json` to `clientless.config.json`, fill in your account and selected characters, then run `npm start`.

`clientless.config.json`, `.env`, logs and `node_modules` are gitignored. Never commit real credentials.

The process keeps all selected characters alive concurrently as logical clientless sessions. Each Farmer session runs v3 with Farmer enabled. Merchant sessions run the same v3 foundation with Farmer disabled and retain the Merchant-oriented v3 services.

## Configuration

`region` and `identifier` choose the Adventure Land server. `characters` is the authoritative selected-character list. Each row has `characterName` and role `farmer` or `merchant`.

Authentication accepts either `email` + `password` or `userID` + `userAuth`. The latter avoids retaining the account password in the runtime config when an existing Adventure Land auth token is available.

## Architecture rule

Clientless means one host process with multiple logical game sessions. Do not add hidden WebViews or one browser runtime per character. Android UI code should remain a command/configuration surface; gameplay belongs to this runtime.

## Verification

Run `npm run check`. PRs changing this directory are also validated by `.github/workflows/smartphone-clientless.yml` on Node 22.

A separate in-APK embedding layer is deliberately not faked here: Android does not provide Node.js itself, while the copied v3 and ALClient runtime are Node-based. The standalone Android/Termux path is the supported clientless execution target until the APK embeds a maintained Node-compatible engine.
