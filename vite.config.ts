import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: '**/*.{jsx,tsx,js,ts}',
      babel: {
        parserOpts: {
          plugins: ['jsx', 'typescript']
        }
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'PDF Contact Sheet',
        short_name: 'PDFSheet',
        description: 'PDF Contact Sheet and Store for Engineering Notes',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}) 