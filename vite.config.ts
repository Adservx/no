import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
    chunkSizeWarningLimit: 1000
  }
})
