// Runs before `npm run build` (CLAUDE.md hard rule 2). The build copies
// public/ into dist/, so anything read in local or fixture mode must not be there.
// Fails when:
//   - .env.local sets a producer folder (BOGOTA_*_ETAPAS)
//   - public/data/etapas-index.json lists a local or fixture file
//   - public/data holds a symbolic link (local mode links producer folders)
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const data = join(root, 'public/data')
const problems = []

for (const key of Object.keys(process.env)) {
  if (/^BOGOTA_[A-Z_]+_ETAPAS$/.test(key) && process.env[key]) {
    problems.push(
      `${key} is set (from .env.local). Remove it, or rename .env.local, before building.`,
    )
  }
}

const indexFile = join(data, 'etapas-index.json')
if (existsSync(indexFile)) {
  for (const entry of JSON.parse(readFileSync(indexFile, 'utf8'))) {
    if (entry.channel === 'local' || entry.channel === 'fixture') {
      problems.push(
        `etapas-index.json lists ${entry.path} (${entry.channel}). Run npm run fetch-data first.`,
      )
    }
  }
}

function findLinks(dir) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = lstatSync(path)
    if (stat.isSymbolicLink())
      problems.push(`${path} is a link (local mode). Run npm run fetch-data first.`)
    else if (stat.isDirectory()) findLinks(path)
  }
}
findLinks(data)

if (problems.length) {
  console.error(`Build stopped:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
