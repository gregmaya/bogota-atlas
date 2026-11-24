import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Served from https://gregmaya.github.io/bogota-atlas/ (ADR-0005).
export default defineConfig({
  base: '/bogota-atlas/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
