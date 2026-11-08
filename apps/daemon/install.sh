#!/bin/sh
# Install or update the Framik daemon from a GitHub release.
# Usage: curl -fsSL https://github.com/Aubind97/framik/releases/download/daemon-latest/install.sh | sudo sh
# Pin a release: ... | sudo FRAMIK_RELEASE=v1.2.3 sh
set -eu

release="${FRAMIK_RELEASE:-daemon-latest}"
base="https://github.com/Aubind97/framik/releases/download/$release"

if [ "$(id -u)" -ne 0 ]; then
	echo "Run as root (pipe into 'sudo sh')." >&2
	exit 1
fi

if [ "$(uname -m)" != "aarch64" ]; then
	echo "The daemon needs a 64-bit (aarch64) OS, found $(uname -m)." >&2
	exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

for asset in framik-daemon-linux-arm64 framik-daemon.service framik-captive.conf; do
	echo "Downloading $asset ($release)"
	curl -fsSL -o "$tmp/$asset" "$base/$asset"
done

install -m755 "$tmp/framik-daemon-linux-arm64" /usr/local/bin/framik-daemon
install -m644 "$tmp/framik-daemon.service" /etc/systemd/system/framik-daemon.service
install -Dm644 "$tmp/framik-captive.conf" /etc/NetworkManager/dnsmasq-shared.d/framik-captive.conf

systemctl daemon-reload
systemctl enable framik-daemon >/dev/null 2>&1
systemctl restart framik-daemon

sleep 2
if systemctl is-active --quiet framik-daemon; then
	echo "framik-daemon is running: $(curl -fsS http://localhost:3000/status 2>/dev/null || echo 'starting up')"
else
	echo "framik-daemon failed to start, see: journalctl -u framik-daemon -n 50" >&2
	exit 1
fi
