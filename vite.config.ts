/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { devApi } from './server/dev-api.js'
import { SECURITY_HEADERS } from './server/security-headers.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Ambiente de desenvolvimento: só a faixa 7050–7059, em 0.0.0.0, acessado por
  // https://<porta>.development.ngtools.com.br (7050–7053 são do App Field).
  server: {
    host: '0.0.0.0',
    port: 7054,
    strictPort: true,
    allowedHosts: ['.development.ngtools.com.br'],
  },
  preview: {
    headers: SECURITY_HEADERS,
    host: '0.0.0.0',
    port: 7055,
    strictPort: true,
    allowedHosts: ['.development.ngtools.com.br'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    css: false,
  },
})
