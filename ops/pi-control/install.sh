#!/usr/bin/env bash
set -euo pipefail

REPO_PATH="${1:-/opt/aio-bot}"
ENV_DIR=/etc/aio-bot
ENV_FILE="$ENV_DIR/control.env"
UNIT_FILE=/etc/systemd/system/aio-bot-control.service

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo $0 [repo-path]" >&2
  exit 1
fi
if [[ ! -f "$REPO_PATH/ops/pi-control/pi-control-daemon.js" ]]; then
  echo "Pi control daemon not found under $REPO_PATH" >&2
  exit 1
fi
if ! command -v node >/dev/null || ! command -v git >/dev/null || ! command -v systemctl >/dev/null; then
  echo "node, git and systemctl are required" >&2
  exit 1
fi

install -d -m 700 "$ENV_DIR"
if [[ ! -f "$ENV_FILE" ]]; then
  TOKEN="$(openssl rand -hex 32)"
  cat > "$ENV_FILE" <<EOF
AIO_CONTROL_BIND=127.0.0.1
AIO_CONTROL_PORT=8790
AIO_CONTROL_TOKEN=$TOKEN
AIO_CONTROL_REPO_PATH=$REPO_PATH
AIO_CONTROL_BOT_SERVICE=aio-bot.service
EOF
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE with a new control token."
fi

sed "s#WorkingDirectory=/opt/aio-bot#WorkingDirectory=$REPO_PATH#; s#ExecStart=/usr/bin/node /opt/aio-bot/#ExecStart=/usr/bin/node $REPO_PATH/#; s#ReadWritePaths=/opt/aio-bot#ReadWritePaths=$REPO_PATH#" \
  "$REPO_PATH/ops/pi-control/aio-bot-control.service" > "$UNIT_FILE"
chmod 644 "$UNIT_FILE"
systemctl daemon-reload
systemctl enable --now aio-bot-control.service
systemctl --no-pager --full status aio-bot-control.service || true

echo "Installed. Default bind is loopback-only. For LAN access, configure TLS cert/key before changing AIO_CONTROL_BIND."
