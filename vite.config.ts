import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: './build/dist/client',
  },
  server: {
    port: 7529,
    proxy: {
      '/api': {
        target: 'http://localhost:7528',
        changeOrigin: true,
        secure: false,  
      },
    },
  },
})
