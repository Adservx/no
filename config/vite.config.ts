import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import viteCompression from 'vite-plugin-compression'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            include: '**/*.{jsx,tsx}',
            babel: {
                parserOpts: {
                    plugins: ['jsx', 'typescript']
                }
            }
        }),
        {
            name: 'html-transform',
            transformIndexHtml(html) {
                return html;
            }
        },
        // Gzip compression for production
        viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
            threshold: 1024, // Only compress files > 1KB
            deleteOriginFile: false
        }),
        // Brotli compression (better compression ratio)
        viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
            threshold: 1024,
            deleteOriginFile: false
        }),
        // Temporarily disable PWA due to path issues on Windows
        // VitePWA can be re-enabled after fixing path handling
        // VitePWA({
        //     registerType: 'autoUpdate',
        //     ...
        // })
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, '../src')
        },
        extensions: ['.tsx', '.ts', '.jsx', '.js']
    },
    esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment',
        drop: ['console', 'debugger'] // Remove console.log in production
    },
    build: {
        outDir: 'dist',
        sourcemap: false, // Disable sourcemaps in production for smaller bundles
        minify: 'esbuild',
        target: 'es2020',
        cssMinify: true,
        cssCodeSplit: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, '../index.html')
            },
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'router': ['react-router-dom'],
                    'pdf-core': ['pdfjs-dist'],
                    'pdf-react': ['react-pdf'],
                    'pdf-utils': ['jspdf'],
                    'ui-utils': ['react-dropzone'],
                    'supabase': ['@supabase/supabase-js'],
                    'aws': ['@aws-sdk/client-s3']
                },
                // Optimize chunk file names for better caching
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            },
            treeshake: {
                moduleSideEffects: false,
                propertyReadSideEffects: false
            }
        },
        chunkSizeWarningLimit: 500,
        // Enable compression hints
        reportCompressedSize: true
    },
    server: {
        port: 3000,
        open: true
    },
    // Optimize dependencies
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
        exclude: ['pdfjs-dist'] // Let pdfjs-dist be bundled separately
    }
}) 