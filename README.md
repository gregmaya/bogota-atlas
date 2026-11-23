# bogota-atlas

Open, bilingual map of Bogotá D.C. It shows resident population from [gregmaya/bogota-pop](https://github.com/gregmaya/bogota-pop) and street-network centrality from [gregmaya/bogota-syntax](https://github.com/gregmaya/bogota-syntax), drawn from their published releases.

[Español](README.es.md)

> Work in progress (Phase 0: bootstrap). The site will live at `gregmaya.github.io/bogota-atlas`.

- Plan: [docs/plan.md](docs/plan.md)
- Visual language: [docs/style.md](docs/style.md)
- Decisions: [docs/decisions/](docs/decisions/)

The atlas has no data pipeline. Each producer publishes PMTiles and an `etapas.json` that describes its layers (`bogota-pop` ADR-0013); the atlas draws whatever those files list.

## Licence

Code: MIT ([LICENSE](LICENSE)). Data shown on the map keeps its producer's licence: CC BY 4.0 for bogota-pop, ODbL 1.0 for bogota-syntax and for the OpenStreetMap basemap.
