import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
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
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'Prajol\'s Web',
                short_name: 'Prajol\'s Web',
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
        jsxFragment: 'React.Fragment'
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    pdf: ['pdfjs-dist', 'react-pdf'],
                    vendors: ['jspdf', 'react-dropzone']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    },
    server: {
        port: 3000,
        open: true
    }
}) 