# bogota-atlas

Mapa abierto y bilingüe de Bogotá D.C. Muestra la población residente de [gregmaya/bogota-pop](https://github.com/gregmaya/bogota-pop) y la centralidad de la red vial de [gregmaya/bogota-syntax](https://github.com/gregmaya/bogota-syntax), a partir de sus versiones publicadas.

[English](README.md)

> En construcción (Fase 0: arranque). El sitio estará en `gregmaya.github.io/bogota-atlas`.

- Plan: [docs/plan.md](docs/plan.md)
- Lenguaje visual: [docs/style.md](docs/style.md)
- Decisiones: [docs/decisions/](docs/decisions/)

El atlas no tiene pipeline de datos propio. Cada productor publica PMTiles y un `etapas.json` que describe sus capas (ADR-0013 de `bogota-pop`); el atlas dibuja lo que esos archivos listan.

## Licencia

Código: MIT ([LICENSE](LICENSE)). Los datos del mapa conservan la licencia de su productor: CC BY 4.0 para bogota-pop, ODbL 1.0 para bogota-syntax y para el mapa base de OpenStreetMap.
