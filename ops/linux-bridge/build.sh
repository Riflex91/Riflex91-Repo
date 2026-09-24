#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
rid="${1:-auto}"

if [[ "$rid" == "auto" ]]; then
  case "$(uname -m)" in
    x86_64|amd64) rid="linux-x64" ;;
    aarch64|arm64) rid="linux-arm64" ;;
    *) echo "Unsupported architecture: $(uname -m)" >&2; exit 2 ;;
  esac
fi

case "$rid" in
  linux-x64|linux-arm64) ;;
  *) echo "RID must be linux-x64 or linux-arm64" >&2; exit 2 ;;
esac

project="$root/ops/linux-bridge/AioBotLinuxBridge.csproj"
out="$root/artifacts/linux-bridge/$rid"

dotnet restore "$project"
dotnet publish "$project"   -c Release   -r "$rid"   --self-contained true   -p:PublishSingleFile=true   -p:BridgeBuildNumber=0   -p:IncludeSourceRevisionInInformationalVersion=false   -o "$out"

chmod 0755 "$out/AioBotLinuxBridge"
echo "Published: $out/AioBotLinuxBridge"
