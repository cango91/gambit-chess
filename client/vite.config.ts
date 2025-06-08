import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  //@ts-ignore
  plugins: [react()],
  resolve: {
    alias: {
      '@gambit-chess/shared': path.resolve(__dirname, '../shared/src/index.ts')
    }
  },
  server: {
    port: 3000,
    host: true,
    
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    include: ['chess.js']
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
}) 