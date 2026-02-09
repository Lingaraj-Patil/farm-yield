import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Optimize bundle size
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          'solana': ['@solana/web3.js', '@solana/wallet-adapter-react', '@solana/wallet-adapter-wallets'],
          'react-vendor': ['react', 'react-dom'],
          'map': ['react-leaflet']
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 5173,
    open: true
  }
})
