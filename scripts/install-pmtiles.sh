#!/usr/bin/env bash
# Download the pinned go-pmtiles CLI into .tools/bin/ (git-ignored) and check
# it against the SHA-256 that GitHub publishes for the release asset.
set -euo pipefail

VERSION=1.31.2
cd "$(dirname "$0")/.."
BIN=.tools/bin/pmtiles

if [[ -x $BIN ]] && "$BIN" version | grep -q "pmtiles $VERSION,"; then
  exit 0
fi

case "$(uname -s)_$(uname -m)" in
  Darwin_arm64) ASSET="go-pmtiles-${VERSION}_Darwin_arm64.zip"
    SHA=40528f7f616fcbf91207cd48c8fc023d213f6d86c0cbf1f748732803d1880f3d ;;
  Darwin_x86_64) ASSET="go-pmtiles-${VERSION}_Darwin_x86_64.zip"
    SHA=1f0dc02eee6c58312dd6c509faee1b5c32f0596568af1bf51f1b034e7a88a65b ;;
  Linux_aarch64 | Linux_arm64) ASSET="go-pmtiles_${VERSION}_Linux_arm64.tar.gz"
    SHA=f8bd47e7ea866863489cad588fbaf2f31f42e5821f7a03f009b3769f05801cb1 ;;
  Linux_x86_64) ASSET="go-pmtiles_${VERSION}_Linux_x86_64.tar.gz"
    SHA=3ed7dbf4ec2e6dfe5e25b6f70d1ffc932729f93c86db353bf514dd71010a312f ;;
  *) echo "No pinned pmtiles build for $(uname -s) $(uname -m)" >&2; exit 1 ;;
esac

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
curl -fsSL -o "$TMP/$ASSET" \
  "https://github.com/protomaps/go-pmtiles/releases/download/v${VERSION}/${ASSET}"
echo "$SHA  $TMP/$ASSET" | shasum -a 256 -c - >/dev/null

mkdir -p .tools/bin
case $ASSET in
  *.zip) unzip -q -o "$TMP/$ASSET" pmtiles -d .tools/bin ;;
  *.tar.gz) tar -xzf "$TMP/$ASSET" -C .tools/bin pmtiles ;;
esac
chmod +x "$BIN"
"$BIN" version
