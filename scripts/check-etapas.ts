// Check etapas.json files against schema/etapas.schema.json, plus the rules
// JSON Schema can't express. Used by the tests now and by the deploy in Phase 2.
//
//   node scripts/check-etapas.ts <etapas.json>... [--release]
//
// --release also rejects any layer with public: false (ADR-0006): release
// builds must never carry private layers, even though producers exclude them.
import { Ajv2020 } from 'ajv/dist/2020.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const schemaPath = new URL('../schema/etapas.schema.json', import.meta.url)
const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as object
// strictTypes and strictRequired off: both misfire on the schema's if/then rules.
const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictTypes: false,
  strictRequired: false,
})
const validate = ajv.compile(schema)

interface Layer {
  id: string
  public: boolean
  fields: string[]
  style: { field: string }
  sources: string[]
  minzoom: number
  maxzoom: number
  file: string
  field_types: Record<string, string>
  vigencia: Record<string, string | null>
  bounds: [number, number, number, number]
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join('\u0000') === [...b].sort().join('\u0000')

/** All problems found in one parsed etapas.json; empty when it's valid. */
export function checkEtapas(data: unknown, { release = false } = {}): string[] {
  if (!validate(data)) {
    return (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message ?? ''}`.trim())
  }
  const errors: string[] = []
  const layers = (data as { layers: Layer[] }).layers
  const seen = new Set<string>()
  layers.forEach((layer, i) => {
    const at = `/layers/${i} (${layer.id})`
    if (seen.has(layer.id)) errors.push(`${at} id is not unique in this file`)
    seen.add(layer.id)
    if (layer.file !== `${layer.id}.pmtiles`) errors.push(`${at} file must be ${layer.id}.pmtiles`)
    if (!layer.fields.includes(layer.style.field)) {
      errors.push(`${at} style.field ${layer.style.field} is not in fields`)
    }
    if (!sameSet(layer.fields, Object.keys(layer.field_types))) {
      errors.push(`${at} field_types must list exactly the fields`)
    }
    if (!sameSet(layer.sources, Object.keys(layer.vigencia))) {
      errors.push(`${at} vigencia must list exactly the sources`)
    }
    if (layer.minzoom > layer.maxzoom) errors.push(`${at} minzoom is above maxzoom`)
    const [west, south, east, north] = layer.bounds
    if (west >= east || south >= north)
      errors.push(`${at} bounds are not [west, south, east, north]`)
    if (release && !layer.public) errors.push(`${at} is private (public: false) in a release build`)
  })
  return errors
}

// Command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const release = process.argv.includes('--release')
  const files = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  let failed = false
  for (const file of files) {
    const errors = checkEtapas(JSON.parse(readFileSync(file, 'utf8')), { release })
    if (errors.length) {
      failed = true
      console.error(`${file}:\n  ${errors.join('\n  ')}`)
    } else console.log(`${file}: ok`)
  }
  if (failed) process.exit(1)
}
