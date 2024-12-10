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
    outDir: '../../build/dist/client',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
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
