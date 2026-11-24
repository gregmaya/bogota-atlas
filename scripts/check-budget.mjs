// Size budget for the built site (ADR-0002): no file over 90 MB, site under 800 MB.
// Runs after `npm run build`; exits non-zero so the deploy stops before Pages refuses it.
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const MB = 1024 * 1024
const FILE_LIMIT = 90 * MB
const SITE_LIMIT = 800 * MB
const dist = new URL('../dist', import.meta.url).pathname

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else yield path
  }
}

let total = 0
const tooBig = []
for (const file of walk(dist)) {
  const size = statSync(file).size
  total += size
  if (size > FILE_LIMIT) tooBig.push(`${relative(dist, file)} (${(size / MB).toFixed(1)} MB)`)
}

console.log(`Site size: ${(total / MB).toFixed(1)} MB of ${SITE_LIMIT / MB} MB`)
if (tooBig.length) console.error(`Over ${FILE_LIMIT / MB} MB:\n  ${tooBig.join('\n  ')}`)
if (total > SITE_LIMIT) console.error('Site is over budget')
if (tooBig.length || total > SITE_LIMIT) process.exit(1)
