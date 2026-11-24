# Basemap: how to rebuild it

The basemap is a Protomaps extract of Bogotá's urban area plus 10 km, with the label fonts and icons it needs (ADR-0007, ADR-0010). The site never builds it. It downloads two files from a release of this repo:

- `basemap.pmtiles`: the map tiles, about 23 MB.
- `basemap-assets.tar.gz`: Noto Sans glyphs, sprites and the font licence, about 6 MB.

## When

Only when a fresher OpenStreetMap build is worth having, or the bounds change.

## Steps

1. Pick a Protomaps daily build from <https://maps.protomaps.com/builds/> and put its URL and date in `atlas.config.json` under `basemap.source` and `basemap.buildDate`. Set `basemap.release` to `basemap-<that date>`.
2. Build the files. This downloads the pinned `pmtiles` tool into `.tools/bin/` the first time:

   ```bash
   scripts/build-basemap.sh
   ```

   The files land in `build/basemap/` (git-ignored).
3. Check them locally:

   ```bash
   npm run fetch-data:local
   npm run dev
   ```

4. Publish the release. It is public, so check before running:

   ```bash
   gh release create basemap-YYYY-MM-DD build/basemap/basemap.pmtiles build/basemap/basemap-assets.tar.gz \
     --title "Basemap YYYY-MM-DD · Mapa base YYYY-MM-DD" \
     --notes "Protomaps build YYYY-MM-DD, bounds and max zoom as in atlas.config.json. © OpenStreetMap contributors (ODbL)."
   ```

5. Commit the `atlas.config.json` change. The next deploy picks up the new release.

Old basemap releases can stay; nothing reads them once the config moves on.
