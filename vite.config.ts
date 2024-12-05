import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({filename:"./build/build-visualizer.html"}),
  ],
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
