# AiO Bot Control – Android

Native Android control and monitoring client for AiO Bot v3.

## Resource policy

The app is deliberately free-tier friendly:

- no background service;
- no automatic polling by default;
- dashboard data is loaded only when the user opens/refreshed the app;
- events are fetched only when the Events screen is opened/refreshed;
- settings are fetched only when the Control screen is opened;
- no R2 endpoint is used by the app;
- remote control reuses the existing `/api/v3/settings` revisioned settings path instead of introducing a second command queue.

## Connection

The first launch asks for:

- Cloudflare Worker base URL (HTTPS)
- account (usually `default`)
- `READ_KEY`
- optional `ADMIN_KEY` for remote settings changes

Keys are encrypted locally using an AES/GCM key generated in Android Keystore. They are never compiled into the APK.

## API usage

- `GET /api/v3/overview?account=...`
- `GET /api/v3/events?account=...&limit=...`
- `GET /api/v3/settings?account=...`
- `PATCH /api/v3/settings`

The Brain endpoint is intentionally not used.

## Build

CI builds the debug APK with the repository workflow `android-app.yml`.
Locally, use Gradle 8.10.2 and JDK 17:

```bash
gradle :app:assembleDebug
```
