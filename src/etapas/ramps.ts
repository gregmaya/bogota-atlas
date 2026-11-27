// Data colours by group (docs/style.md). Interface colours never appear here.
// Checked with the dataviz validator on the white basemap (2026-11-24):
// every class clears 2:1 contrast on white.

/** Population: one hue, light to dark. Light end raised from #FDE5D2 to clear 2:1 on white. */
export const POBLACION: [string, string] = ['#DBAD9D', '#7A1F1F']

/**
 * Street network: Spectral, cold (low) to warm (high), 12 classes. ColorBrewer
 * Spectral with lightness capped so the pale middle stays visible on white,
 * resampled to even perceptual steps. PROPOSAL, under review (see plan, Phase 1).
 */
export const RED_VIAL_SPECTRAL = [
  '#5e4fa2',
  '#4d71b2',
  '#3b93ba',
  '#58b4ad',
  '#71c07d',
  '#99bb18',
  '#bcad2f',
  '#e79900',
  '#f7814c',
  '#e4564b',
  '#c5304b',
  '#9e0142',
]

/**
 * Categorical: dataviz reference hues without yellow (reserved for selection).
 * PROPOSAL: on a map only about 3 hues stay distinct from all others, so the
 * categorical rule is still open (see plan, Phase 1).
 */
export const CATEGORICAL = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#e87ba4',
  '#008300',
  '#6250d6',
  '#e34948',
]

export const INK = '#454647'
export const INK_MUTED = 'rgba(69, 70, 71, 0.7)'

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function hexToOklab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToHex([L, a, b]: [number, number, number]): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return (
    '#' +
    rgb
      .map((c) =>
        Math.round(Math.min(1, Math.max(0, toSrgb(c))) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

/** n colours evenly spaced in OKLab between two ends. */
export function interpolate([from, to]: [string, string], n: number): string[] {
  if (n === 1) return [to]
  const [a, b] = [hexToOklab(from), hexToOklab(to)]
  return Array.from({ length: n }, (_, i) =>
    oklabToHex(a.map((v, k) => v + ((b[k] - v) * i) / (n - 1)) as [number, number, number]),
  )
}

/** n colours picked evenly from a fixed list (keeps both ends). */
export function sample(colours: string[], n: number): string[] {
  if (n >= colours.length) return colours.slice(0, n)
  if (n === 1) return [colours.at(-1)!]
  return Array.from(
    { length: n },
    (_, i) => colours[Math.round((i * (colours.length - 1)) / (n - 1))],
  )
}

/** Sequential classes for a group. */
export function sequentialRamp(group: string, n: number): string[] {
  return group === 'red_vial' ? sample(RED_VIAL_SPECTRAL, n) : interpolate(POBLACION, n)
}
