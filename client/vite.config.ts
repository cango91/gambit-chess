import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    include: ['@gambit-chess/shared']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/@gambit-chess\/shared/, /node_modules/]
    }
  }
}) 