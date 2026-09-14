# Raspberry Pi control daemon

This is a separate operations control plane for the Raspberry Pi host. It does not expose Adventure Land gameplay actions and it does not provide a generic shell endpoint.

## API

Authenticated endpoints:

- `GET /v1/status`
- `POST /v1/bot/start`
- `POST /v1/bot/stop`
- `POST /v1/bot/restart`
- `POST /v1/deploy/main`
- `POST /v1/rollback`

Every POST requires `Authorization: Bearer <token>` and an `Idempotency-Key` header. Duplicate keys return the cached successful response for ten minutes.

`deploy/main` requires a clean repository. It fetches `origin/main`, records the current SHA, checks out the new SHA detached, restarts the configured bot systemd unit and verifies that the unit is active. If any deploy step fails after the original SHA is known, it attempts to restore that SHA and restart the service. `rollback` switches to the previously recorded SHA and performs the same service health check.

## Network safety

The default bind is `127.0.0.1`. This is the recommended mode together with an SSH tunnel from Windows.

A non-loopback bind is refused unless `AIO_CONTROL_TLS_CERT` and `AIO_CONTROL_TLS_KEY` are both configured. The control token must be at least 32 characters.

## Install

From an existing checkout on the Raspberry Pi:

```bash
sudo ./ops/pi-control/install.sh /opt/aio-bot
```

The installer creates `/etc/aio-bot/control.env` with a random token when that file does not already exist, installs `aio-bot-control.service`, enables it and starts it. Keep `control.env` root-readable only and never commit its token.

The daemon expects the actual bot process to be managed by `aio-bot.service` by default. Override `AIO_CONTROL_BOT_SERVICE` if your unit has another fixed name.
