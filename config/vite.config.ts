import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import viteCompression from 'vite-plugin-compression'
import { resolve } from 'path'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

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
            name: 'copy-public-assets',
            closeBundle() {
                // Copy only necessary public files, excluding pdf-files
                const publicDir = resolve(__dirname, '../public');
                const outDir = resolve(__dirname, '../dist');

                const filesToCopy = [
                    'favicon.svg',
                    'manifest.webmanifest',
                    'pdf.worker.min.js',
                    'robots.txt',
                    'sitemap.xml',
                    'google0411e24d2561d35a.html',
                    'og-image.svg',
                    'community-bg.png',
                    'ee-bg.png',
                    'study-bg.png',
                    '5365-183788430.mp4'
                ];

                filesToCopy.forEach(file => {
                    const src = join(publicDir, file);
                    const dest = join(outDir, file);
                    if (existsSync(src)) {
                        copyFileSync(src, dest);
                    }
                });
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
    publicDir: resolve(__dirname, '../public'),
    build: {
        outDir: 'dist',
        sourcemap: false, // Disable sourcemaps in production for smaller bundles
        minify: 'esbuild',
        target: 'es2020',
        cssMinify: true,
        cssCodeSplit: true,
        copyPublicDir: false, // Don't copy public dir to avoid pdf-files being copied
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
        chunkSizeWarningLimit: 1000,
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