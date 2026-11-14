import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./setupTests.ts'],
    globals: true,
    testTimeout: 15000,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'gstack', '.agents', '.next'],
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
