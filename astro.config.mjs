import { defineConfig } from 'astro/config'
import clerk from '@clerk/astro'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { esES } from '@clerk/localizations'
import dotenv from 'dotenv'
import AstroPWA from '@vite-pwa/astro'

dotenv.config()

export default defineConfig({
  output: 'server',

  adapter: vercel({
    edgeMiddleware: false
  }),

  integrations: [
    clerk({
      localization: esES,
      publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    }),

    react({
      experimentalReactChildren: true,
      fastRefresh: true
    }),

    // PWA — app instalable + service worker.
    // Spec: docs/superpowers/specs/2026-10-19-pwa-phase1-design.md
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: null, // registro manual en los 5 layouts (script inline)
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Psicologic — Gestión para psicólogos',
        short_name: 'Psicologic',
        description: 'Agenda de citas, videollamadas, pacientes y pagos para tu consulta.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/client',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#007BFF',
        icons: [
          { src: '/img/pwa/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/img/pwa/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // SSR: precache del build del cliente (bundles _astro/*, css, favicon).
        // /api/* JAMAS entra al cache (NetworkOnly) — datos de sesión y pacientes.
        globDirectory: 'dist/client',
        globPatterns: ['**/*.{js,css,svg,ico,woff2,txt,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: null, // SSR: las páginas van a la red (offline NO es parte de la fase 1)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\.(png|jpg|jpeg|webp|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-images',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    })
  ],

  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false
      }
    }
  },

  vite: {
    plugins: [tailwindcss()],

    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssCodeSplit: true
    },

    ssr: {
      external: [
        'pdfjs-dist',
        'canvas'
      ]
    }
  },

  prefetch: {
    defaultStrategy: 'viewport'
  }
})
