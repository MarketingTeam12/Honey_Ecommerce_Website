import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    {
      name: 'figma-asset-resolver',
      resolveId(id) {
        if (!id.startsWith('figma:asset/')) return null
        const assetName = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src', 'assets', assetName)
      },
    },
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ADD THIS
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/make-server-a67f0635': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/create-order': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/test-resend': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})