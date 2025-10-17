import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load VITE_* from frontend/.env (if any) and from repo root .env
  const cwd = process.cwd()
  const localEnv = loadEnv(mode, cwd, 'VITE_')
  const rootEnv = loadEnv(mode, path.resolve(cwd, '..'), 'VITE_')
  const merged = { ...rootEnv, ...localEnv }

  // Prepare define mappings for each VITE_* so they are accessible via import.meta.env
  const defineEnv = Object.fromEntries(
    Object.entries(merged).map(([k, v]) => [
      `import.meta.env.${k}`,
      JSON.stringify(v),
    ])
  )

  return {
    plugins: [react()],
    define: {
      ...defineEnv,
    },
    server: {
      proxy: {
        '/oracle': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/oracle/, ''),
        },
      },
    },
  }
})
