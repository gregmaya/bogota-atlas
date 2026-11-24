#!/usr/bin/env bash
# Build the basemap release files from atlas.config.json (ADR-0007):
#   build/basemap/basemap.pmtiles        Protomaps extract, bounds and maxzoom from the config
#   build/basemap/basemap-assets.tar.gz  Noto Sans glyphs, sprites and their licence
# Run by hand when a fresher basemap is wanted; then attach both files to the
# release named in the config (see docs/basemap.md). Never run in CI.
set -euo pipefail
cd "$(dirname "$0")/.."

cfg() { jq -r ".basemap.$1" atlas.config.json; }
SOURCE=$(cfg source)
BBOX=$(jq -r '.basemap.bounds | join(",")' atlas.config.json)
MAXZOOM=$(cfg maxzoom)
COMMIT=$(cfg assetsCommit)
OUT=build/basemap

scripts/install-pmtiles.sh >/dev/null
rm -rf "$OUT" && mkdir -p "$OUT"

echo "Extracting $BBOX to z$MAXZOOM from $SOURCE"
.tools/bin/pmtiles extract "$SOURCE" "$OUT/basemap.pmtiles" --bbox="$BBOX" --maxzoom="$MAXZOOM"

echo "Packing glyphs and sprites from protomaps/basemaps-assets@$COMMIT"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
curl -fsSL "https://github.com/protomaps/basemaps-assets/archive/$COMMIT.tar.gz" | tar -xz -C "$TMP"
SRC="$TMP/basemaps-assets-$COMMIT"
mkdir -p "$TMP/pack/fonts"
for face in "Noto Sans Regular" "Noto Sans Medium" "Noto Sans Italic"; do
  cp -R "$SRC/fonts/$face" "$TMP/pack/fonts/"
done
cp "$SRC/fonts/OFL.txt" "$TMP/pack/fonts/"
cp -R "$SRC/sprites" "$TMP/pack/"
tar -czf "$OUT/basemap-assets.tar.gz" -C "$TMP/pack" fonts sprites

.tools/bin/pmtiles show "$OUT/basemap.pmtiles" | head -12
ls -lh "$OUT"
