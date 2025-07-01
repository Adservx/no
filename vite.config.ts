import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  optimizeDeps: {
    include: ['react-pdf', 'pdfjs-dist']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pdf-libs': ['react-pdf', 'pdfjs-dist', 'jspdf'],
          'ui-utils': ['react-dropzone']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2015',
    cssMinify: true,
  },
  server: {
    host: true,
    port: 3000
  }
})
