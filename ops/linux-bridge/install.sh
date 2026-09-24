#!/usr/bin/env bash
set -euo pipefail

src="${1:-}"
if [[ -z "$src" || ! -f "$src" ]]; then
  echo "Usage: $0 /path/to/AioBotLinuxBridge" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install_dir="${HOME}/.local/lib/aio-bot-linux-bridge"
unit_dir="${HOME}/.config/systemd/user"

mkdir -p "$install_dir" "$unit_dir"
install -m 0755 "$src" "$install_dir/AioBotLinuxBridge"
install -m 0644 "$script_dir/aio-bot-linux-bridge.service" "$unit_dir/aio-bot-linux-bridge.service"

systemctl --user daemon-reload
systemctl --user enable aio-bot-linux-bridge.service

echo "Installed: $install_dir/AioBotLinuxBridge"
echo "Start: systemctl --user start aio-bot-linux-bridge"
echo "UI: http://127.0.0.1:8791"
