import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // PGlite ships its own WASM + data files; pre-bundling breaks their URLs.
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  // The SQL worker imports PGlite, which code-splits — needs ES module workers.
  worker: { format: 'es' },
})
