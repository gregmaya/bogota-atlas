import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const styleGuide = read('docs/style.md')
const tokens = read('src/styles/tokens.css')
const globalCss = read('src/styles/global.css')

// Rows like: | `--ink` | `#454647` | Body text ... |
const solidColours = [...styleGuide.matchAll(/^\| `(--[a-z-]+)` \| `(#[0-9A-Fa-f]{6})` \|/gm)].map(
  ([, name, hex]) => ({ name, hex: hex.toLowerCase() }),
)

describe('design tokens', () => {
  it('finds the solid colours in docs/style.md', () => {
    expect(solidColours.map((c) => c.name)).toEqual(['--ink', '--paper', '--line', '--accent'])
  })

  it.each(solidColours)('$name matches docs/style.md ($hex)', ({ name, hex }) => {
    expect(tokens.toLowerCase()).toContain(`${name}: ${hex};`)
  })

  it('never uses pure black', () => {
    expect(tokens.toLowerCase()).not.toMatch(/#000000|#000\b|:\s*black\b/)
  })

  it('loads no fonts from third parties', () => {
    expect(globalCss).not.toMatch(/https?:\/\//)
  })
})
