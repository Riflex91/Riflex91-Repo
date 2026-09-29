#!/usr/bin/env bash
set -euo pipefail
ROOT="\${HOME}/.local/lib/aio-bot-linux-bridge"
UNIT_DIR="\${HOME}/.config/systemd/user"
BIN_SOURCE="\${1:-./AioBotLinuxBridge}"

if [[ ! -f "$BIN_SOURCE" ]]; then
  echo "AioBotLinuxBridge binary not found: $BIN_SOURCE" >&2
  exit 2
fi
command -v systemctl >/dev/null || { echo "systemd/systemctl is required" >&2; exit 3; }
command -v secret-tool >/dev/null || echo "warning: install libsecret-tools before storing credentials" >&2

mkdir -p "$ROOT" "$UNIT_DIR" \
  "\${HOME}/.config/aio-bot-linux-bridge" \
  "\${HOME}/.local/share/aio-bot-linux-bridge" \
  "\${HOME}/.local/state/aio-bot-linux-bridge"

install -m 0755 "$BIN_SOURCE" "$ROOT/AioBotLinuxBridge"
install -m 0644 "$(dirname "$0")/systemd/aio-bot-linux-bridge.service" "$UNIT_DIR/aio-bot-linux-bridge.service"
systemctl --user daemon-reload
systemctl --user enable --now aio-bot-linux-bridge.service

echo "Installed. Local UI: http://127.0.0.1:18741"
echo "Status: systemctl --user status aio-bot-linux-bridge.service"
echo "Logs: journalctl --user -u aio-bot-linux-bridge.service -f"
