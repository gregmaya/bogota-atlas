// Put the files the site reads into public/data/ (ADR-0002, ADR-0006, ADR-0007):
//   public/data/basemap/<release>/   basemap tiles, glyphs and sprites
//   public/data/<producer>/<tag>/    etapas.json and its PMTiles files
//   public/data/etapas-index.json    which etapas.json files the app loads, and from which channel
//
//   node scripts/fetch-data.mjs                  release mode: pinned tags from atlas.config.json
//   node scripts/fetch-data.mjs --fixture        tests/fixtures/ (npm run dev)
//   node scripts/fetch-data.mjs --local          producers' folders from .env.local (npm run dev:local)
//   node scripts/fetch-data.mjs --local-basemap  basemap from build/basemap/ (after build-basemap.sh)
//
// Channels: "release" layers show on the public map; "dev", "local" and
// "fixture" layers show only in Etapas (?etapas=1, ADR-0008).
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { checkEtapas } from './check-etapas.ts'

const root = new URL('..', import.meta.url).pathname
const data = join(root, 'public/data')
const config = JSON.parse(readFileSync(join(root, 'atlas.config.json'), 'utf8'))
const args = new Set(process.argv.slice(2))
const mode = args.has('--fixture') ? 'fixture' : args.has('--local') ? 'local' : 'release'

async function download(url, target) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  writeFileSync(target, Buffer.from(await response.arrayBuffer()))
}

function check(file, release) {
  const errors = checkEtapas(JSON.parse(readFileSync(file, 'utf8')), { release })
  if (errors.length) throw new Error(`${file}:\n  ${errors.join('\n  ')}`)
}

// Basemap (ADR-0007): skipped when its release is already in place.
const basemap = config.basemap
const basemapDir = join(data, 'basemap', basemap.release)
const localBasemap = args.has('--local-basemap')
if (
  !localBasemap &&
  existsSync(join(basemapDir, 'basemap.pmtiles')) &&
  existsSync(join(basemapDir, 'fonts'))
) {
  console.log(`basemap/${basemap.release} already in place`)
} else {
  rmSync(basemapDir, { recursive: true, force: true })
  mkdirSync(basemapDir, { recursive: true })
  for (const name of basemap.files) {
    const target = join(basemapDir, name)
    if (localBasemap) {
      const source = join(root, 'build/basemap', name)
      if (!existsSync(source)) throw new Error(`${source} is missing; run scripts/build-basemap.sh`)
      copyFileSync(source, target)
    } else {
      await download(
        `https://github.com/gregmaya/bogota-atlas/releases/download/${basemap.release}/${name}`,
        target,
      )
    }
    console.log(`basemap/${basemap.release}/${name}`)
  }
  execFileSync('tar', ['-xzf', join(basemapDir, 'basemap-assets.tar.gz'), '-C', basemapDir])
  rmSync(join(basemapDir, 'basemap-assets.tar.gz'))
}

// Etapas layers. Clear what other modes left behind, so a release build never
// carries fixture or local files (and the build guard stays quiet).
for (const producer of existsSync(data) ? readdirSync(data) : []) {
  if (producer === 'basemap' || !lstatSync(join(data, producer)).isDirectory()) continue
  for (const leftover of ['fixture', 'local']) {
    if (leftover !== mode) rmSync(join(data, producer, leftover), { recursive: true, force: true })
  }
  // Tags no longer pinned (e.g. an older dev-*) would otherwise ship with the next build.
  if (mode === 'release') {
    const pinned = Object.values(config.producers?.[producer] ?? {}).filter(Boolean)
    for (const tag of readdirSync(join(data, producer))) {
      if (!pinned.includes(tag)) rmSync(join(data, producer, tag), { recursive: true, force: true })
    }
  }
}
const index = []

if (mode === 'release') {
  for (const [producer, { release, dev }] of Object.entries(config.producers ?? {})) {
    for (const [channel, tag] of [
      ['release', release],
      ['dev', dev],
    ]) {
      if (!tag) continue
      const dir = join(data, producer, tag)
      mkdirSync(dir, { recursive: true })
      const base = `https://github.com/gregmaya/${producer}/releases/download/${tag}`
      await download(`${base}/etapas.json`, join(dir, 'etapas.json'))
      check(join(dir, 'etapas.json'), true)
      const etapas = JSON.parse(readFileSync(join(dir, 'etapas.json'), 'utf8'))
      for (const { file } of etapas.layers) {
        const target = join(dir, file)
        if (existsSync(target)) {
          console.log(`${producer}/${tag}/${file} already in place`)
          continue
        }
        await download(`${base}/${file}`, target)
        console.log(
          `${producer}/${tag}/${file} (${(statSync(target).size / 2 ** 20).toFixed(1)} MB)`,
        )
      }
      index.push({ producer, path: `${producer}/${tag}/etapas.json`, channel })
    }
  }
}

if (mode === 'local') {
  // Links, not copies: the producers' files stay where they are, read-only.
  const folders = {
    'bogota-pop': process.env.BOGOTA_POP_ETAPAS,
    'bogota-syntax': process.env.BOGOTA_SYNTAX_ETAPAS,
  }
  for (const [producer, folder] of Object.entries(folders)) {
    if (!folder) continue
    const source = resolve(root, folder)
    if (!existsSync(join(source, 'etapas.json'))) {
      console.log(`${producer}: no etapas.json in ${folder}, skipped`)
      continue
    }
    check(join(source, 'etapas.json'), false)
    const link = join(data, producer, 'local')
    mkdirSync(join(data, producer), { recursive: true })
    rmSync(link, { recursive: true, force: true })
    symlinkSync(source, link, 'dir')
    index.push({ producer, path: `${producer}/local/etapas.json`, channel: 'local' })
    console.log(`${producer}/local -> ${folder}`)
  }
}

if (mode === 'fixture') {
  const fixtures = join(root, 'tests/fixtures')
  for (const producer of readdirSync(fixtures)) {
    if (!existsSync(join(fixtures, producer, 'etapas.json'))) continue
    const target = join(data, producer, 'fixture')
    rmSync(target, { recursive: true, force: true })
    cpSync(join(fixtures, producer), target, { recursive: true })
    index.push({ producer, path: `${producer}/fixture/etapas.json`, channel: 'fixture' })
    console.log(`${producer}/fixture`)
  }
}

writeFileSync(join(data, 'etapas-index.json'), JSON.stringify(index, null, 2) + '\n')
console.log(`etapas-index.json: ${mode} mode, ${index.length} file(s)`)
