#!/usr/bin/env bash
# Cut the fixture tiles in tests/fixtures/<producer>/ from the producers' local
# data, read-only, with GDAL's PMTiles driver (as the producers do, ADR-0013 rule 5).
# One small area of central Bogotá, a few fields per layer, public data only.
# Run by hand when the fixture needs new data; the output is committed.
set -euo pipefail
cd "$(dirname "$0")/.."

POP=${BOGOTA_POP:-../bogota-pop}
SYNTAX=${BOGOTA_SYNTAX:-../bogota-syntax}
OUT=tests/fixtures
# Santa Fe, Los Mártires and Teusaquillo: most RENOBO pilot polygons are here.
BBOX=(-74.090 4.585 -74.065 4.625)

cut() { # producer id input minzoom maxzoom [ogr2ogr options...]
  local producer=$1 id=$2 input=$3 minzoom=$4 maxzoom=$5
  shift 5
  mkdir -p "$OUT/$producer"
  rm -f "$OUT/$producer/$id.pmtiles"
  # Internal layer named after the id, so MapLibre's source-layer is the id.
  ogr2ogr -f PMTiles "$OUT/$producer/$id.pmtiles" "$input" \
    -nln "$id" -t_srs EPSG:3857 -dim XY \
    -spat "${BBOX[@]}" -spat_srs EPSG:4326 -clipsrc spat_extent \
    -dsco MINZOOM="$minzoom" -dsco MAXZOOM="$maxzoom" "$@"
  echo "$producer/$id.pmtiles"
}

cut bogota-pop mgn_2018_manzanas \
  "$POP/data/interim/dane_mgn_cnpv2018_manzana/2018.parquet" 12 16 \
  -select COD_DANE_A,TP27_PERSO,TVIVIENDA

cut bogota-syntax centralidad_armonica_800 \
  "$SYNTAX/data/processed/centrality_city.parquet" 12 16 \
  -select segment_id,cc_harmonic_800_ang,boundary_dist_m

cut bogota-syntax centralidad_armonica_2000 \
  "$SYNTAX/data/processed/centrality_city.parquet" 12 16 \
  -select segment_id,cc_harmonic_2000_ang,boundary_dist_m

cut bogota-syntax tipo_via \
  "$SYNTAX/data/processed/centrality_city.parquet" 12 16 \
  -select segment_id,MVITIPO

cut bogota-syntax renobo_piloto \
  "$SYNTAX/data/renobo_selection.gpkg" 12 16 \
  -select GmlID,Nombre_de_Proyecto

ls -lh "$OUT"/*/*.pmtiles
