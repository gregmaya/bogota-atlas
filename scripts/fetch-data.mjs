// Download the pinned files named in atlas.config.json into public/data/
// (ADR-0002, ADR-0007). Run by the deploy workflow and by hand before `npm run dev`.
//
//   node scripts/fetch-data.mjs           download from GitHub Releases
//   node scripts/fetch-data.mjs --local   copy from build/basemap/ (after scripts/build-basemap.sh)
//
// Phase 0 handles the basemap only; producers are added in Phase 2.
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO = 'gregmaya/bogota-atlas'
const root = new URL('..', import.meta.url).pathname
const config = JSON.parse(readFileSync(join(root, 'atlas.config.json'), 'utf8'))
const local = process.argv.includes('--local')

const { release, files } = config.basemap
const dest = join(root, 'public/data/basemap', release)
rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })

for (const name of files) {
  const target = join(dest, name)
  if (local) {
    const source = join(root, 'build/basemap', name)
    if (!existsSync(source)) throw new Error(`${source} is missing; run scripts/build-basemap.sh`)
    copyFileSync(source, target)
  } else {
    const url = `https://github.com/${REPO}/releases/download/${release}/${name}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
    writeFileSync(target, Buffer.from(await response.arrayBuffer()))
  }
  console.log(`basemap/${release}/${name}`)
}

// Glyphs and sprites are packed in one archive; unpack it next to the tiles.
const archive = join(dest, 'basemap-assets.tar.gz')
execFileSync('tar', ['-xzf', archive, '-C', dest])
rmSync(archive)
