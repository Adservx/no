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
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'manikant.com.np',
                short_name: 'manikant.com.np',
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
            },
            workbox: {
                // Only precache small assets
                globPatterns: ['**/*.{js,css,html,ico,svg}'],
                // Exclude large files from pre-caching
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
                // Exclude specific file patterns that are too large
                globIgnores: [
                    '**/*semester/**/*.png',
                    '**/*semester/**/*.pdf',
                    '**/*semester/**/*.jpg',
                    '**/*semester/**/*.jpeg',
                    '**/pdfs/**/*.pdf'
                ],
                runtimeCaching: [
                    {
                        // Cache API responses from Supabase
                        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'supabase-api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 5 // 5 minutes
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            },
                            networkTimeoutSeconds: 10
                        }
                    },
                    {
                        // Cache R2/CDN files
                        urlPattern: /^https:\/\/.*\.(r2\.dev|cloudflare\.com|r2\.cloudflarestorage\.com)\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'r2-cdn-cache',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:pdf|jpg|jpeg|png)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'large-files-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        // Cache JS/CSS chunks
                        urlPattern: /\.(?:js|css)$/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'static-resources',
                            expiration: {
                                maxEntries: 60,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
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
                main: resolve(__dirname, 'index.html')
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