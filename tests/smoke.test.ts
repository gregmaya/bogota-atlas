import { describe, expect, it } from 'vitest'
import { App } from '../src/App.tsx'

// Proves the test runner, TypeScript and the source tree are wired up.
describe('scaffold', () => {
  it('exports the App component', () => {
    expect(typeof App).toBe('function')
  })
})
