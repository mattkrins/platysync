import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  root: './src/client',
  build: {
    outDir: './build/dist/client',
  },
  server: {
    port: 7529,
    proxy: {
      '/api': {
        target: 'http://localhost:7528',
        secure: false,  
      },
      '/socket.io': {
        target: 'http://localhost:7528',
        secure: false,
        ws: true,
      },
    },
  },
})
